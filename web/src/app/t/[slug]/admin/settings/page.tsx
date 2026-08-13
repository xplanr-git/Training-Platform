import { requireAdminForSlug, tenantBySlug } from '@/lib/tenant';
import type { Branding } from '@/lib/content-types';
import { updateSchoolSettings } from './actions';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { NavForm } from '@/components/nav-form';

export const metadata = { title: 'Academy settings' };

export default async function Settings({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const ctx = await requireAdminForSlug(slug);

  // requireAdminForSlug above already resolved this exact row through
  // tenantBySlug, which is request-cached — so this reads it rather than
  // re-querying by id.
  const tenant = ctx.tenantId ? await tenantBySlug(slug) : null;

  const branding = (tenant?.branding ?? {}) as Branding;

  return (
    <div className="max-w-2xl">
      <h1 className="text-2xl">Academy settings</h1>
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
            {/* No "Primary colour" field: the storefront is monochrome by
                design (blue = link, ink = everything else), so a colour saved
                here painted nothing — a setting that does nothing is a trap.
                Tenant colour lives on the certificate template (owner decision
                2026-08-13); stored primaryColor values are preserved untouched
                in case the policy widens again. */}
            <Button type="submit" className="self-start">
              Save settings
            </Button>
          </NavForm>
        </CardContent>
      </Card>
    </div>
  );
}
