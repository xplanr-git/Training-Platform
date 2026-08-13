import Link from 'next/link';
import { BookOpen } from 'lucide-react';
import { EmptyState, NoMatches } from '@/components/empty-state';
import { db, and, eq, ilike, desc, count, courses } from '@training-platform/db';
import { requireAdminForSlug } from '@/lib/tenant';
import { parsePage, pageMeta, PAGE_SIZE } from '@/lib/pagination';
import { Pagination } from '@/components/pagination';
import { setCourseStatus } from './actions';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { StatusBadge } from '@/components/ui/badge';
import { SegmentedNav } from '@/components/ui/segmented';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { NavForm } from '@/components/nav-form';

export const metadata = { title: 'Courses' };

/** The course statuses a ?status= filter may name. Anything else means "all". */
const COURSE_STATUSES = ['published', 'draft', 'archived'] as const;
type CourseStatusFilter = (typeof COURSE_STATUSES)[number];

export default async function CoursesList({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ q?: string; page?: string; status?: string }>;
}) {
  const { slug } = await params;
  const { q, page: pageParam, status: statusParam } = await searchParams;
  const query = (q ?? '').trim();
  // Validated against the closed set, not passed through: ?status= is
  // user-controlled input on its way into a WHERE clause.
  const statusFilter = COURSE_STATUSES.includes(statusParam as CourseStatusFilter)
    ? (statusParam as CourseStatusFilter)
    : undefined;
  const ctx = await requireAdminForSlug(slug);

  const filters = ctx.tenantId ? [eq(courses.tenantId, ctx.tenantId)] : [];
  if (ctx.tenantId && query) filters.push(ilike(courses.title, `%${query}%`));
  if (ctx.tenantId && statusFilter) filters.push(eq(courses.status, statusFilter));

  // Segment hrefs keep the search query and drop ?page= — a changed filter
  // starts at page 1 of the new result set.
  const filterHref = (status?: CourseStatusFilter) => {
    const p = new URLSearchParams();
    if (query) p.set('q', query);
    if (status) p.set('status', status);
    const qs = p.toString();
    return `/admin/courses${qs ? `?${qs}` : ''}`;
  };

  /*
    The count and the page of rows are independent, so they run together — this
    used to be two sequential round trips on every visit.

    The offset is derived DIRECTLY from ?page= rather than from pageMeta, because
    pageMeta clamps the page against pageCount, which it computes from the total.
    Passing a provisional total of 0 would clamp every request to page 1 and
    silently return the first page's rows for every page.

    Same shape as the storefront in t/[slug]/page.tsx, which solved this first.
  */
  const requestedPage = parsePage(pageParam);
  const requestedOffset = (requestedPage - 1) * PAGE_SIZE;
  const rowsAt = (offset: number) =>
    db
      .select()
      .from(courses)
      .where(and(...filters))
      .orderBy(desc(courses.createdAt))
      .limit(PAGE_SIZE)
      .offset(offset);

  const [countRows, requestedRows] = await Promise.all([
    ctx.tenantId
      ? db
          .select({ total: count() })
          .from(courses)
          .where(and(...filters))
      : Promise.resolve([] as Array<{ total: number }>),
    ctx.tenantId
      ? rowsAt(requestedOffset)
      : Promise.resolve([] as Awaited<ReturnType<typeof rowsAt>>),
  ]);
  const total = countRows[0]?.total ?? 0;
  const meta = pageMeta(requestedPage, total);

  // Only a ?page= past the end makes the clamped offset differ, and only then is a
  // second query needed — so the common path stays at one round trip.
  const rows =
    !ctx.tenantId || meta.offset === requestedOffset ? requestedRows : await rowsAt(meta.offset);

  return (
    <div>
      <div className="flex items-center justify-between gap-4">
        <h1 className="text-2xl">Courses</h1>
        <Button asChild>
          <Link href="/admin/courses/new">New course</Link>
        </Button>
      </div>

      <div className="mt-5 flex flex-wrap items-center gap-3">
        <SegmentedNav
          label="Filter courses by status"
          items={[
            { label: 'All', href: filterHref(), active: !statusFilter },
            ...COURSE_STATUSES.map((s) => ({
              // Sentence case; the row's StatusBadge capitalises the same word.
              label: s[0].toUpperCase() + s.slice(1),
              href: filterHref(s),
              active: statusFilter === s,
            })),
          ]}
        />
        <form method="get" className="flex max-w-sm flex-1 gap-2">
          {/* The form submits ?q= and would drop ?status= — carry it. */}
          {statusFilter && <input type="hidden" name="status" value={statusFilter} />}
          <Input
            type="search"
            name="q"
            aria-label="Search courses"
            defaultValue={query}
            placeholder="Search courses…"
            className="flex-1"
          />
          <Button type="submit" variant="outline">
            Search
          </Button>
        </form>
      </div>

      {rows.length === 0 ? (
        query ? (
          <NoMatches className="mt-8" query={query} basePath={filterHref(statusFilter)} />
        ) : statusFilter ? (
          // A filter with no rows is not "no courses yet" — the academy may be
          // full of courses in other states, and first-run copy here would tell
          // an admin with 40 published courses to create their first one.
          <EmptyState
            className="mt-8"
            icon={<BookOpen />}
            title={`No ${statusFilter} courses`}
            action={{ href: filterHref(), label: 'Show all courses' }}
          >
            Nothing is in this state right now.
          </EmptyState>
        ) : (
          <EmptyState
            className="mt-8"
            icon={<BookOpen />}
            title="No courses yet"
            action={{ href: '/admin/courses/new', label: 'Create a course' }}
          >
            A course is a set of lessons — videos, PDFs and quizzes — grouped into sections. Create
            one, add lessons in the builder, then publish it when you are ready for learners to see
            it.
          </EmptyState>
        )
      ) : (
        <div className="mt-6 overflow-x-auto rounded-(--radius-card) bg-surface">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Title</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((c) => (
                <TableRow key={c.id}>
                  <TableCell>
                    <Link href={`/admin/courses/${c.id}`} className="font-medium hover:underline">
                      {c.title}
                    </Link>
                    <span className="ml-2 text-meta text-muted">/{c.slug}</span>
                  </TableCell>
                  <TableCell>
                    <StatusBadge
                      tone={
                        c.status === 'published' ? 'green' : c.status === 'draft' ? 'amber' : 'grey'
                      }
                      className="capitalize"
                    >
                      {c.status}
                    </StatusBadge>
                  </TableCell>
                  <TableCell className="text-right">
                    {c.status !== 'published' ? (
                      <NavForm
                        action={setCourseStatus.bind(null, slug, c.id, 'published')}
                        className="inline"
                        quiet
                      >
                        <Button type="submit" variant="ghost" size="sm">
                          Publish
                        </Button>
                      </NavForm>
                    ) : (
                      <NavForm
                        action={setCourseStatus.bind(null, slug, c.id, 'archived')}
                        className="inline"
                        quiet
                        confirm="Archive this course? Learners will no longer see it in the catalogue. Nothing is deleted, and you can publish it again from here."
                      >
                        <Button type="submit" variant="ghost" size="sm">
                          Archive
                        </Button>
                      </NavForm>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      <Pagination
        meta={meta}
        basePath="/admin/courses"
        params={{ q: query || undefined, status: statusFilter }}
      />
    </div>
  );
}
