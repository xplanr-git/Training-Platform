'use server';

import {
  db,
  audited,
  eq,
  tenants,
  users,
  memberships,
  certificateTemplates,
} from '@training-platform/db';
import { createAdminClient } from '@/lib/supabase/admin';
import { normalizeSlug, validateSlug } from '@/lib/slug';
import { sendWelcomeEmail } from '@/lib/email';
import { tenantOrigin } from '@/lib/host';
import { rateLimitExceeded } from '@/lib/rate-limit-guard';
import { RULES } from '@/lib/rate-limit';

export interface ProvisionResult {
  ok: boolean;
  error?: string;
  slug?: string;
}

/**
 * Provisions a new tenant and its owner in one transaction:
 *  1. Validate inputs + slug availability.
 *  2. Create the Supabase auth user (service role).
 *  3. Insert the user mirror, tenant, owner membership (company_admin), and a
 *     default certificate template — all audited.
 *
 * Runs with the service-role Drizzle connection (RLS bypassed), so every write
 * is explicitly tenant-scoped. The caller signs in afterwards to receive a JWT
 * carrying the new membership's tenant_id + role (via the access-token hook).
 */
export async function provisionTenant(formData: FormData): Promise<ProvisionResult> {
  // Before any validation or write: this mints a tenant, a user and a membership,
  // so it is the most expensive thing an unauthenticated caller can trigger.
  const limited = await rateLimitExceeded('provisionTenant', RULES.provisionTenant);
  if (limited) return { ok: false, error: limited };

  const name = String(formData.get('name') ?? '').trim();
  const email = String(formData.get('email') ?? '')
    .trim()
    .toLowerCase();
  const password = String(formData.get('password') ?? '');
  const companyName = String(formData.get('companyName') ?? '').trim();
  const slug = normalizeSlug(String(formData.get('slug') ?? companyName));

  if (!name || !email || !password || !companyName) {
    return { ok: false, error: 'All fields are required.' };
  }
  if (password.length < 8) {
    return { ok: false, error: 'Password must be at least 8 characters.' };
  }
  const slugError = validateSlug(slug);
  if (slugError) return { ok: false, error: slugError };

  const existing = await db
    .select({ id: tenants.id })
    .from(tenants)
    .where(eq(tenants.slug, slug))
    .limit(1);
  if (existing.length > 0) {
    return {
      ok: false,
      error: `The web address “${slug}” is already taken. Edit it and try again.`,
    };
  }

  const admin = createAdminClient();
  const { data: created, error: authError } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { name },
  });
  if (authError || !created.user) {
    return {
      ok: false,
      error:
        authError?.message ??
        'Could not create your account. That email may already have one — try signing in instead.',
    };
  }
  const userId = created.user.id;

  try {
    await db.transaction(async (tx) => {
      await tx.insert(users).values({ id: userId, email, name }).onConflictDoNothing();

      const [tenant] = await tx
        .insert(tenants)
        .values({ slug, name: companyName, status: 'trial' })
        .returning();

      await tx.insert(memberships).values({
        tenantId: tenant.id,
        userId,
        role: 'company_admin',
        status: 'active',
        invitedBy: userId,
      });

      await tx.insert(certificateTemplates).values({
        tenantId: tenant.id,
        name: 'Default',
        design: {},
      });

      await audited(tx, {
        tenantId: tenant.id,
        actorUserId: userId,
        action: 'tenant.provision',
        resourceType: 'tenant',
        resourceId: tenant.id,
        after: { slug, name: companyName, owner: email },
      });
      await audited(tx, {
        tenantId: tenant.id,
        actorUserId: userId,
        action: 'membership.create',
        resourceType: 'membership',
        resourceId: userId,
        after: { role: 'company_admin', status: 'active' },
      });
    });
  } catch (e) {
    // Roll back the orphaned auth user so the email can be retried.
    await admin.auth.admin.deleteUser(userId).catch(() => {});
    const message =
      e instanceof Error
        ? e.message
        : 'Your academy could not be set up. Nothing was saved, so it is safe to try again.';
    return { ok: false, error: message };
  }

  // tenantOrigin resolves single-tenant mode correctly; an inline
  // `${slug}.${root}` names a host that doesn't exist there, breaking the link.
  const origin = tenantOrigin(slug);
  try {
    await sendWelcomeEmail(email, name, companyName, `${origin}/admin`);
  } catch (e) {
    console.error('welcome email failed:', e);
  }

  return { ok: true, slug };
}
