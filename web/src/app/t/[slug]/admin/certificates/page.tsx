import {
  db,
  eq,
  desc,
  count,
  certificates,
  enrollments,
  courses,
  users,
} from '@training-platform/db';
import Link from 'next/link';
import { withTenant } from '@/lib/tenant';
import { parsePage, pageMeta } from '@/lib/pagination';
import { Pagination } from '@/components/pagination';
import { setCertificateRevoked } from './actions';

export default async function Certificates({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ page?: string }>;
}) {
  const { slug } = await params;
  const { page: pageParam } = await searchParams;
  const ctx = await withTenant();

  const [{ total } = { total: 0 }] = ctx.tenantId
    ? await db
        .select({ total: count() })
        .from(certificates)
        .where(eq(certificates.tenantId, ctx.tenantId))
    : [];
  const meta = pageMeta(parsePage(pageParam), total);

  const rows = ctx.tenantId
    ? await db
        .select({
          id: certificates.id,
          code: certificates.verificationCode,
          issuedAt: certificates.issuedAt,
          revokedAt: certificates.revokedAt,
          courseTitle: courses.title,
          learnerName: users.name,
          learnerEmail: users.email,
        })
        .from(certificates)
        .innerJoin(enrollments, eq(enrollments.id, certificates.enrollmentId))
        .innerJoin(courses, eq(courses.id, enrollments.courseId))
        .innerJoin(users, eq(users.id, enrollments.userId))
        .where(eq(certificates.tenantId, ctx.tenantId))
        .orderBy(desc(certificates.issuedAt))
        .limit(meta.limit)
        .offset(meta.offset)
    : [];

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Certificates</h1>
        <Link
          href="/admin/certificates/template"
          className="rounded-md border border-border px-3 py-1.5 text-sm hover:bg-surface-muted"
        >
          Edit template
        </Link>
      </div>
      <p className="mt-1 text-muted">Issued completion certificates for your academy.</p>

      <div className="mt-6 overflow-x-auto rounded-[--radius-card] border border-border">
        <table className="w-full text-sm">
          <thead className="bg-surface-muted text-left text-muted">
            <tr>
              <th className="px-4 py-2 font-medium">Learner</th>
              <th className="px-4 py-2 font-medium">Course</th>
              <th className="px-4 py-2 font-medium">Issued</th>
              <th className="px-4 py-2 font-medium">Status</th>
              <th className="px-4 py-2 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((c) => (
              <tr key={c.id} className="border-t border-border">
                <td className="px-4 py-3">
                  {c.learnerName || '—'}
                  <span className="ml-2 text-xs text-muted">{c.learnerEmail}</span>
                </td>
                <td className="px-4 py-3">{c.courseTitle}</td>
                <td className="px-4 py-3">{new Date(c.issuedAt).toLocaleDateString()}</td>
                <td className="px-4 py-3">
                  <span
                    className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                      c.revokedAt ? 'bg-red-50 text-red-700' : 'bg-green-50 text-green-700'
                    }`}
                  >
                    {c.revokedAt ? 'Revoked' : 'Valid'}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    <a
                      href={`/verify/${c.code}`}
                      target="_blank"
                      rel="noreferrer"
                      className="text-brand-700 hover:underline"
                    >
                      Verify
                    </a>
                    {c.revokedAt ? (
                      <form action={setCertificateRevoked.bind(null, slug, c.id, false)}>
                        <button className="text-brand-600 hover:underline">Reinstate</button>
                      </form>
                    ) : (
                      <form action={setCertificateRevoked.bind(null, slug, c.id, true)}>
                        <button className="text-red-600 hover:underline">Revoke</button>
                      </form>
                    )}
                  </div>
                </td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-6 text-center text-muted">
                  No certificates issued yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <Pagination meta={meta} basePath="/admin/certificates" />
    </div>
  );
}
