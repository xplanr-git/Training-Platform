import { db, eq, tenants } from '@training-platform/db';
import { requireAdminForSlug } from '@/lib/tenant';
import { updateSchoolSettings } from './actions';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { NavForm } from '@/components/nav-form';

export default async function Settings({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const ctx = await requireAdminForSlug(slug);

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
      <h1 className="text-2xl font-semibold tracking-tight">School Settings</h1>
      <p className="mt-1 text-muted">Your academy&apos;s name and storefront branding.</p>

      <Card className="mt-6">
        <CardContent className="py-6">
          <NavForm action={updateSchoolSettings.bind(null, slug)} className="flex flex-col gap-5">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="name">Academy name</Label>
              <Input id="name" name="name" required defaultValue={tenant?.name ?? ''} />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="tagline">Tagline</Label>
              <Input
                id="tagline"
                name="tagline"
                defaultValue={branding.tagline ?? ''}
                placeholder="Browse our courses and start learning."
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="logoUrl">Logo URL</Label>
              <Input
                id="logoUrl"
                name="logoUrl"
                defaultValue={branding.logoUrl ?? ''}
                placeholder="https://…/logo.png"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="primaryColor">Primary colour</Label>
              <div className="flex items-center gap-2">
                <Input
                  id="primaryColor"
                  name="primaryColor"
                  defaultValue={branding.primaryColor ?? ''}
                  placeholder="#2563eb"
                  className="w-40"
                />
                {branding.primaryColor && (
                  <span
                    className="h-9 w-9 shrink-0 rounded-md border border-border"
                    style={{ background: branding.primaryColor }}
                    aria-hidden
                  />
                )}
              </div>
            </div>
            <Button type="submit" className="self-start">
              Save settings
            </Button>
          </NavForm>
        </CardContent>
      </Card>
    </div>
  );
}
