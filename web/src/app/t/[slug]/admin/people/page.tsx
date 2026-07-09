import { db, and, or, eq, ilike, desc, count, memberships, users } from '@training-platform/db';
import { withTenant } from '@/lib/tenant';
import { parsePage, pageMeta } from '@/lib/pagination';
import { Pagination } from '@/components/pagination';
import { InviteForm } from './invite-form';
import { setMemberRole, setMemberStatus } from './actions';

const ROLE_LABELS: Record<string, string> = {
  company_admin: 'Admin',
  instructor: 'Instructor',
  learner: 'Learner',
  platform_admin: 'Platform',
};

export default async function People({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ q?: string; page?: string }>;
}) {
  const { slug } = await params;
  const { q, page: pageParam } = await searchParams;
  const query = (q ?? '').trim();
  const ctx = await withTenant();

  const filters = ctx.tenantId ? [eq(memberships.tenantId, ctx.tenantId)] : [];
  if (ctx.tenantId && query) {
    filters.push(
      or(ilike(users.name, `%${query}%`), ilike(users.email, `%${query}%`))!,
    );
  }

  const [{ total } = { total: 0 }] = ctx.tenantId
    ? await db
        .select({ total: count() })
        .from(memberships)
        .innerJoin(users, eq(users.id, memberships.userId))
        .where(and(...filters))
    : [];
  const meta = pageMeta(parsePage(pageParam), total);

  const rows = ctx.tenantId
    ? await db
        .select({
          id: memberships.id,
          userId: memberships.userId,
          role: memberships.role,
          status: memberships.status,
          name: users.name,
          email: users.email,
        })
        .from(memberships)
        .innerJoin(users, eq(users.id, memberships.userId))
        .where(and(...filters))
        .orderBy(desc(memberships.createdAt))
        .limit(meta.limit)
        .offset(meta.offset)
    : [];

  return (
    <div>
      <h1 className="text-2xl font-semibold">People</h1>
      <p className="mt-1 text-muted">Invite and manage members of your academy.</p>

      <div className="mt-6">
        <InviteForm tenantSlug={slug} />
      </div>

      <form method="get" className="mt-4 flex max-w-sm gap-2">
        <input
          type="search"
          name="q"
          aria-label="Search people"
          defaultValue={query}
          placeholder="Search people…"
          className="flex-1 rounded-md border border-border px-3 py-1.5 text-sm"
        />
        <button className="rounded-md border border-border px-3 py-1.5 text-sm hover:bg-surface-muted">
          Search
        </button>
      </form>

      <div className="mt-6 overflow-x-auto rounded-[--radius-card] border border-border">
        <table className="w-full text-sm">
          <thead className="bg-surface-muted text-left text-muted">
            <tr>
              <th className="px-4 py-2 font-medium">Name</th>
              <th className="px-4 py-2 font-medium">Email</th>
              <th className="px-4 py-2 font-medium">Role</th>
              <th className="px-4 py-2 font-medium">Status</th>
              <th className="px-4 py-2 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((m) => (
              <tr key={m.id} className="border-t border-border">
                <td className="px-4 py-3">{m.name || '—'}</td>
                <td className="px-4 py-3">{m.email}</td>
                <td className="px-4 py-3">
                  <form action={setMemberRole.bind(null, slug, m.id, nextRole(m.role))}>
                    <button className="hover:underline" title="Cycle role">
                      {ROLE_LABELS[m.role] ?? m.role}
                    </button>
                  </form>
                </td>
                <td className="px-4 py-3 capitalize">{m.status}</td>
                <td className="px-4 py-3">
                  {m.status === 'deactivated' ? (
                    <form action={setMemberStatus.bind(null, slug, m.id, 'active')}>
                      <button className="text-brand-600 hover:underline">Reactivate</button>
                    </form>
                  ) : (
                    <form action={setMemberStatus.bind(null, slug, m.id, 'deactivated')}>
                      <button className="text-muted hover:underline">Deactivate</button>
                    </form>
                  )}
                </td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-6 text-center text-muted">
                  No members yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <Pagination
        meta={meta}
        basePath="/admin/people"
        params={{ q: query || undefined }}
      />
    </div>
  );
}

/** Cycles learner → instructor → company_admin → learner for quick role edits. */
function nextRole(role: string): 'company_admin' | 'instructor' | 'learner' {
  if (role === 'learner') return 'instructor';
  if (role === 'instructor') return 'company_admin';
  return 'learner';
}
