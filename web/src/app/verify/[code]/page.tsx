import {
  db,
  eq,
  certificates,
  certificateTemplates,
  enrollments,
  courses,
  tenants,
  users,
} from '@training-platform/db';
import { PrintButton } from '@/components/print-button';

/**
 * Public certificate verification. Shared route (not rewritten per host).
 * Renders a branded, printable certificate using the tenant's template design
 * and confirms authenticity, issue date, and revocation.
 */
export default async function VerifyCertificate({
  params,
}: {
  params: Promise<{ code: string }>;
}) {
  const { code } = await params;

  const [cert] = await db
    .select({
      tenantId: certificates.tenantId,
      issuedAt: certificates.issuedAt,
      revokedAt: certificates.revokedAt,
      courseTitle: courses.title,
      tenantName: tenants.name,
      learnerName: users.name,
    })
    .from(certificates)
    .innerJoin(enrollments, eq(enrollments.id, certificates.enrollmentId))
    .innerJoin(courses, eq(courses.id, enrollments.courseId))
    .innerJoin(tenants, eq(tenants.id, enrollments.tenantId))
    .innerJoin(users, eq(users.id, enrollments.userId))
    .where(eq(certificates.verificationCode, code))
    .limit(1);

  if (!cert) {
    return (
      <main className="mx-auto flex min-h-screen max-w-lg flex-col justify-center px-6 py-14">
        <div className="rounded-[--radius-card] border border-border bg-surface p-8 text-center">
          <h1 className="text-xl font-semibold">Certificate not found</h1>
          <p className="mt-2 text-muted">
            No certificate matches this code. It may be mistyped or revoked.
          </p>
        </div>
      </main>
    );
  }

  const [tpl] = await db
    .select({ design: certificateTemplates.design })
    .from(certificateTemplates)
    .where(eq(certificateTemplates.tenantId, cert.tenantId))
    .limit(1);
  const design = (tpl?.design ?? {}) as {
    title?: string;
    signatory?: string;
    accentColor?: string;
  };
  const accent = design.accentColor || '#2563eb';
  const heading = design.title || 'Certificate of Completion';

  return (
    <main className="mx-auto flex min-h-screen max-w-2xl flex-col justify-center gap-4 px-6 py-14">
      <div className="flex items-center justify-between print:hidden">
        <span
          className={`rounded-full px-3 py-1 text-xs font-medium ${
            cert.revokedAt ? 'bg-red-50 text-red-700' : 'bg-green-50 text-green-700'
          }`}
        >
          {cert.revokedAt ? 'Revoked' : 'Valid certificate'}
        </span>
        {!cert.revokedAt && <PrintButton />}
      </div>

      <article
        className="rounded-[--radius-card] bg-surface p-10 text-center shadow-sm"
        style={{ border: `3px solid ${accent}` }}
      >
        <p className="text-sm uppercase tracking-widest text-muted">{cert.tenantName}</p>
        <h1 className="mt-3 text-3xl font-semibold" style={{ color: accent }}>
          {heading}
        </h1>
        <p className="mt-8 text-sm text-muted">This certifies that</p>
        <p className="mt-1 text-2xl font-medium">{cert.learnerName || '—'}</p>
        <p className="mt-6 text-sm text-muted">has successfully completed</p>
        <p className="mt-1 text-xl font-medium">{cert.courseTitle}</p>

        <div className="mt-10 flex items-end justify-between text-sm">
          <div className="text-left">
            <p className="border-t border-border pt-1 text-muted">
              {new Date(cert.issuedAt).toLocaleDateString()}
            </p>
            <p className="text-xs text-muted">Date issued</p>
          </div>
          {design.signatory && (
            <div className="text-right">
              <p className="border-t border-border pt-1">{design.signatory}</p>
              <p className="text-xs text-muted">Signatory</p>
            </div>
          )}
        </div>

        {cert.revokedAt && (
          <p className="mt-6 text-sm font-medium text-red-600">
            This certificate was revoked on{' '}
            {new Date(cert.revokedAt).toLocaleDateString()}.
          </p>
        )}
      </article>

      <p className="text-center text-xs text-muted print:hidden">
        Verification code: {code}
      </p>
    </main>
  );
}
