import Link from 'next/link';
import { db, and, eq, ilike, desc, count, courses } from '@training-platform/db';
import { requireAdminForSlug } from '@/lib/tenant';
import { parsePage, pageMeta } from '@/lib/pagination';
import { Pagination } from '@/components/pagination';
import { setCourseStatus } from './actions';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

export default async function CoursesList({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ q?: string; page?: string }>;
}) {
  const { slug } = await params;
  const { q, page: pageParam } = await searchParams;
  const query = (q ?? '').trim();
  const ctx = await requireAdminForSlug(slug);

  const filters = ctx.tenantId ? [eq(courses.tenantId, ctx.tenantId)] : [];
  if (ctx.tenantId && query) filters.push(ilike(courses.title, `%${query}%`));

  const [{ total } = { total: 0 }] = ctx.tenantId
    ? await db.select({ total: count() }).from(courses).where(and(...filters))
    : [];
  const meta = pageMeta(parsePage(pageParam), total);

  const rows = ctx.tenantId
    ? await db
        .select()
        .from(courses)
        .where(and(...filters))
        .orderBy(desc(courses.createdAt))
        .limit(meta.limit)
        .offset(meta.offset)
    : [];

  return (
    <div>
      <div className="flex items-center justify-between gap-4">
        <h1 className="text-2xl font-semibold tracking-tight">Courses</h1>
        <Button asChild>
          <Link href="/admin/courses/new">New course</Link>
        </Button>
      </div>

      <form method="get" className="mt-5 flex max-w-sm gap-2">
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

      {rows.length === 0 ? (
        <div className="mt-8 rounded-[--radius-card] border border-dashed border-border p-10 text-center text-muted">
          {query
            ? `No courses match “${query}”.`
            : 'No courses yet. Create your first course to get started.'}
        </div>
      ) : (
        <div className="mt-6 overflow-x-auto rounded-[--radius-card] border border-border">
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
                    <Link
                      href={`/admin/courses/${c.id}`}
                      className="font-medium hover:underline"
                    >
                      {c.title}
                    </Link>
                    <span className="ml-2 text-xs text-muted">/{c.slug}</span>
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={
                        c.status === 'published'
                          ? 'default'
                          : c.status === 'archived'
                            ? 'outline'
                            : 'secondary'
                      }
                      className="capitalize"
                    >
                      {c.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    {c.status !== 'published' ? (
                      <form
                        action={setCourseStatus.bind(null, slug, c.id, 'published')}
                        className="inline"
                      >
                        <Button type="submit" variant="ghost" size="sm">
                          Publish
                        </Button>
                      </form>
                    ) : (
                      <form
                        action={setCourseStatus.bind(null, slug, c.id, 'archived')}
                        className="inline"
                      >
                        <Button type="submit" variant="ghost" size="sm">
                          Archive
                        </Button>
                      </form>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      <Pagination meta={meta} basePath="/admin/courses" params={{ q: query || undefined }} />
    </div>
  );
}
