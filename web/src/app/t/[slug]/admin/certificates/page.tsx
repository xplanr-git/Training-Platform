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
import { EmptyRow } from '@/components/empty-state';
import { requireAdminForSlug } from '@/lib/tenant';
import { parsePage, pageMeta, PAGE_SIZE } from '@/lib/pagination';
import { formatDateShort } from '@/lib/format-date';
import { Pagination } from '@/components/pagination';
import { setCertificateRevoked } from './actions';
import { Button } from '@/components/ui/button';
import { StatusBadge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { NavForm } from '@/components/nav-form';

export const metadata = { title: 'Certificates' };

export default async function Certificates({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ page?: string }>;
}) {
  const { slug } = await params;
  const { page: pageParam } = await searchParams;
  const ctx = await requireAdminForSlug(slug);

  /*
    Count and rows are independent, so they run together rather than as two
    sequential round trips. The offset comes DIRECTLY from ?page= — pageMeta clamps
    against a pageCount derived from the total, so a provisional total of 0 would
    pin every request to page 1. Same shape as t/[slug]/page.tsx.
  */
  const requestedPage = parsePage(pageParam);
  const requestedOffset = (requestedPage - 1) * PAGE_SIZE;
  const rowsAt = (offset: number) =>
    db
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
      .where(eq(certificates.tenantId, ctx.tenantId!))
      .orderBy(desc(certificates.issuedAt))
      .limit(PAGE_SIZE)
      .offset(offset);

  const [countRows, requestedRows] = await Promise.all([
    ctx.tenantId
      ? db
          .select({ total: count() })
          .from(certificates)
          .where(eq(certificates.tenantId, ctx.tenantId))
      : Promise.resolve([] as Array<{ total: number }>),
    ctx.tenantId
      ? rowsAt(requestedOffset)
      : Promise.resolve([] as Awaited<ReturnType<typeof rowsAt>>),
  ]);
  const total = countRows[0]?.total ?? 0;
  const meta = pageMeta(requestedPage, total);

  const rows =
    !ctx.tenantId || meta.offset === requestedOffset ? requestedRows : await rowsAt(meta.offset);

  return (
    <div>
      <div className="flex items-center justify-between gap-4">
        <h1 className="text-2xl">Certificates</h1>
        <Button asChild variant="outline">
          <Link href="/admin/certificates/template">Edit template</Link>
        </Button>
      </div>
      <p className="mt-1 text-muted">Issued completion certificates for your academy.</p>

      <div className="mt-6 overflow-x-auto rounded-(--radius-card) bg-surface">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Learner</TableHead>
              <TableHead>Course</TableHead>
              <TableHead>Issued</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((c) => (
              <TableRow key={c.id}>
                <TableCell>
                  <span className="font-medium">{c.learnerName || '—'}</span>
                  <span className="ml-2 text-meta text-muted">{c.learnerEmail}</span>
                </TableCell>
                <TableCell>{c.courseTitle}</TableCell>
                <TableCell className="tabular-nums text-muted">
                  {formatDateShort(c.issuedAt)}
                </TableCell>
                <TableCell>
                  <StatusBadge tone={c.revokedAt ? 'red' : 'green'}>
                    {c.revokedAt ? 'Revoked' : 'Valid'}
                  </StatusBadge>
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex items-center justify-end gap-1">
                    <Button asChild variant="ghost" size="sm">
                      <a href={`/verify/${c.code}`} target="_blank" rel="noreferrer">
                        Verify
                      </a>
                    </Button>
                    {c.revokedAt ? (
                      <NavForm
                        action={setCertificateRevoked.bind(null, slug, c.id, false)}
                        className="inline"
                        quiet
                      >
                        <Button type="submit" variant="ghost" size="sm">
                          Reinstate
                        </Button>
                      </NavForm>
                    ) : (
                      <NavForm
                        action={setCertificateRevoked.bind(null, slug, c.id, true)}
                        className="inline"
                        quiet
                        confirm="Revoke this certificate? Its public verification page will show it as revoked. You can reinstate it from this page."
                      >
                        <Button
                          type="submit"
                          variant="ghost"
                          size="sm"
                          className="text-destructive"
                        >
                          Revoke
                        </Button>
                      </NavForm>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            ))}
            {rows.length === 0 && (
              <TableRow>
                <TableCell colSpan={5} className="p-0">
                  <EmptyRow title="No certificates issued yet">
                    Certificates are issued automatically the moment a learner finishes every lesson
                    in a course. Each one gets a verification code that anyone can check without
                    signing in.
                  </EmptyRow>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <Pagination meta={meta} basePath="/admin/certificates" />
    </div>
  );
}
