import Link from 'next/link';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { db, eq, certificateTemplates } from '@training-platform/db';
import { requireAdminForSlug } from '@/lib/tenant';
import { saveCertificateTemplate } from './actions';
import { NavForm } from '@/components/nav-form';

export const metadata = { title: 'Certificate template' };

export default async function CertificateTemplate({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const ctx = await requireAdminForSlug(slug);

  const [tpl] = ctx.tenantId
    ? await db
        .select({ design: certificateTemplates.design })
        .from(certificateTemplates)
        .where(eq(certificateTemplates.tenantId, ctx.tenantId))
        .limit(1)
    : [];

  const design = (tpl?.design ?? {}) as {
    title?: string;
    signatory?: string;
    accentColor?: string;
  };

  return (
    <div className="max-w-2xl">
      <Link href="/admin/certificates" className="text-sm text-muted hover:underline">
        ← Certificates
      </Link>
      <h1 className="mt-2 text-2xl">Certificate template</h1>
      <p className="mt-1 text-muted">
        Applied to the public verification page for every certificate you issue.
      </p>

      <NavForm
        action={saveCertificateTemplate.bind(null, slug)}
        className="mt-6 flex flex-col gap-4"
      >
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="tpl-title">Heading</Label>
          <Input
            id="tpl-title"
            name="title"
            defaultValue={design.title ?? ''}
            placeholder="Certificate of Completion"
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="tpl-signatory">Signatory</Label>
          <Input
            id="tpl-signatory"
            name="signatory"
            defaultValue={design.signatory ?? ''}
            placeholder="Jane Doe, Director of Training"
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="tpl-accentcolor">Accent colour</Label>
          <Input
            id="tpl-accentcolor"
            name="accentColor"
            defaultValue={design.accentColor ?? ''}
            placeholder="#1b1b1e"
            className="w-40"
          />
        </div>
        <Button type="submit" className="self-start">
          Save template
        </Button>
      </NavForm>
    </div>
  );
}
