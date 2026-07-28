import Link from 'next/link';
import { db, eq, certificateTemplates } from '@training-platform/db';
import { requireAdminForSlug } from '@/lib/tenant';
import { saveCertificateTemplate } from './actions';

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
      <h1 className="mt-2 text-2xl font-semibold">Certificate template</h1>
      <p className="mt-1 text-muted">
        Applied to the public verification page for every certificate you issue.
      </p>

      <form
        action={saveCertificateTemplate.bind(null, slug)}
        className="mt-6 flex flex-col gap-4"
      >
        <label className="flex flex-col gap-1">
          <span className="text-sm font-medium">Heading</span>
          <input
            name="title"
            defaultValue={design.title ?? ''}
            placeholder="Certificate of Completion"
            className="rounded-md border border-border px-3 py-2"
          />
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-sm font-medium">Signatory</span>
          <input
            name="signatory"
            defaultValue={design.signatory ?? ''}
            placeholder="Jane Doe, Director of Training"
            className="rounded-md border border-border px-3 py-2"
          />
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-sm font-medium">Accent color</span>
          <input
            name="accentColor"
            defaultValue={design.accentColor ?? ''}
            placeholder="#2563eb"
            className="w-40 rounded-md border border-border px-3 py-2"
          />
        </label>
        <button
          type="submit"
          className="self-start rounded-md bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700"
        >
          Save template
        </button>
      </form>
    </div>
  );
}
