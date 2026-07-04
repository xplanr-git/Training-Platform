import {
  db,
  eq,
  certificates,
  enrollments,
  courses,
  tenants,
  users,
} from '@training-platform/db';

/**
 * Public certificate verification. Shared route (not rewritten per host).
 * Anyone with the code can confirm authenticity, issue date, and revocation.
 */
export default async function VerifyCertificate({
  params,
}: {
  params: Promise<{ code: string }>;
}) {
  const { code } = await params;

  const [cert] = await db
    .select({
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

  return (
    <main className="mx-auto flex min-h-screen max-w-lg flex-col justify-center px-6 py-14">
      {!cert ? (
        <div className="rounded-[--radius-card] border border-border bg-surface p-8 text-center">
          <h1 className="text-xl font-semibold">Certificate not found</h1>
          <p className="mt-2 text-muted">
            No certificate matches this code. It may be mistyped or revoked.
          </p>
        </div>
      ) : (
        <div className="rounded-[--radius-card] border border-border bg-surface p-8">
          <span
            className={`inline-block rounded-full px-3 py-1 text-xs font-medium ${
              cert.revokedAt
                ? 'bg-red-50 text-red-700'
                : 'bg-green-50 text-green-700'
            }`}
          >
            {cert.revokedAt ? 'Revoked' : 'Valid certificate'}
          </span>
          <h1 className="mt-4 text-2xl font-semibold">{cert.courseTitle}</h1>
          <dl className="mt-6 space-y-2 text-sm">
            <div className="flex justify-between">
              <dt className="text-muted">Awarded to</dt>
              <dd className="font-medium">{cert.learnerName || '—'}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-muted">Issued by</dt>
              <dd className="font-medium">{cert.tenantName}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-muted">Issued on</dt>
              <dd className="font-medium">
                {new Date(cert.issuedAt).toLocaleDateString()}
              </dd>
            </div>
            {cert.revokedAt && (
              <div className="flex justify-between">
                <dt className="text-muted">Revoked on</dt>
                <dd className="font-medium">
                  {new Date(cert.revokedAt).toLocaleDateString()}
                </dd>
              </div>
            )}
          </dl>
        </div>
      )}
    </main>
  );
}
