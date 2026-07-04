import { db, eq, tenants } from '@training-platform/db';
import { withTenant } from '@/lib/tenant';
import { updateSchoolSettings } from './actions';

export default async function Settings({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const ctx = await withTenant();

  const [tenant] = ctx.tenantId
    ? await db
        .select({ name: tenants.name, branding: tenants.branding })
        .from(tenants)
        .where(eq(tenants.id, ctx.tenantId))
        .limit(1)
    : [];

  const branding = (tenant?.branding ?? {}) as {
    tagline?: string;
    logoUrl?: string;
    primaryColor?: string;
  };

  return (
    <div className="max-w-2xl">
      <h1 className="text-2xl font-semibold">School Settings</h1>
      <p className="mt-1 text-muted">Your academy&apos;s name and storefront branding.</p>

      <form action={updateSchoolSettings.bind(null, slug)} className="mt-6 flex flex-col gap-4">
        <label className="flex flex-col gap-1">
          <span className="text-sm font-medium">Academy name</span>
          <input
            name="name"
            required
            defaultValue={tenant?.name ?? ''}
            className="rounded-md border border-border px-3 py-2"
          />
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-sm font-medium">Tagline</span>
          <input
            name="tagline"
            defaultValue={branding.tagline ?? ''}
            placeholder="Browse our courses and start learning."
            className="rounded-md border border-border px-3 py-2"
          />
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-sm font-medium">Logo URL</span>
          <input
            name="logoUrl"
            defaultValue={branding.logoUrl ?? ''}
            placeholder="https://…/logo.png"
            className="rounded-md border border-border px-3 py-2"
          />
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-sm font-medium">Primary color</span>
          <input
            name="primaryColor"
            type="text"
            defaultValue={branding.primaryColor ?? ''}
            placeholder="#2563eb"
            className="w-40 rounded-md border border-border px-3 py-2"
          />
        </label>
        <button
          type="submit"
          className="self-start rounded-md bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700"
        >
          Save settings
        </button>
      </form>
    </div>
  );
}
