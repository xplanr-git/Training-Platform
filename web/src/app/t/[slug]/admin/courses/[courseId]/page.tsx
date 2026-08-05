import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { db, eq, and, courses } from '@training-platform/db';
import { requireAdminForSlug } from '@/lib/tenant';
import { updateCourse, deleteCourse } from '../actions';
import { NavForm } from '@/components/nav-form';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { CONFERRABLE_TIERS } from '@/lib/connect-roles';

const SELECT_CLS =
  'h-9 rounded-md border border-input bg-transparent px-3 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring';

export default async function EditCourse({
  params,
}: {
  params: Promise<{ slug: string; courseId: string }>;
}) {
  const { slug, courseId } = await params;
  const ctx = await requireAdminForSlug(slug);
  if (!ctx.tenantId) notFound();

  const [course] = await db
    .select()
    .from(courses)
    .where(and(eq(courses.id, courseId), eq(courses.tenantId, ctx.tenantId)))
    .limit(1);
  if (!course) notFound();

  const action = updateCourse.bind(null, slug, courseId);

  return (
    <div className="max-w-2xl">
      <Link
        href="/admin/courses"
        className="inline-flex items-center gap-1.5 text-sm text-muted hover:underline"
      >
        <ArrowLeft className="h-4 w-4" /> Courses
      </Link>
      <div className="mt-3 flex items-center justify-between gap-4">
        <h1 className="text-2xl font-semibold tracking-tight">{course.title}</h1>
        <div className="flex items-center gap-2">
          {/* Opens the learner view. Works for a draft too — admins of this
              academy may preview unpublished courses; learners get a 404. */}
          <Button asChild variant="outline">
            <Link href={`/courses/${course.slug}`}>Preview</Link>
          </Button>
          <Button asChild variant="outline">
            <Link href={`/admin/courses/${courseId}/builder`}>Manage content</Link>
          </Button>
        </div>
      </div>

      <Card className="mt-6">
        <CardContent className="py-6">
          <NavForm action={action} className="flex flex-col gap-5">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="title">Title</Label>
              <Input id="title" name="title" required defaultValue={course.title} />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                name="description"
                rows={4}
                defaultValue={course.description ?? ''}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="level">Level</Label>
                <select id="level" name="level" defaultValue={course.level} className={SELECT_CLS}>
                  <option>Beginner</option>
                  <option>Intermediate</option>
                  <option>Advanced</option>
                </select>
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="status">Status</Label>
                <select
                  id="status"
                  name="status"
                  defaultValue={course.status}
                  className={SELECT_CLS}
                >
                  <option value="draft">Draft</option>
                  <option value="published">Published</option>
                  <option value="archived">Archived</option>
                </select>
              </div>
            </div>
            <div className="flex max-w-sm flex-col gap-1.5">
              <Label htmlFor="confersRoleCode">Confers tier on completion</Label>
              <select
                id="confersRoleCode"
                name="confersRoleCode"
                aria-describedby="confersRoleCode-help"
                defaultValue={course.confersRoleCode ?? ''}
                className={SELECT_CLS}
              >
                <option value="">— None —</option>
                {CONFERRABLE_TIERS.map((t) => (
                  <option key={t.code} value={t.code}>
                    {t.group}: {t.label}
                  </option>
                ))}
              </select>
              <p id="confersRoleCode-help" className="text-xs text-muted">
                Completing this course advances the learner to this Connect tier.
              </p>
            </div>
            <Button type="submit" className="self-start">
              Save changes
            </Button>
          </NavForm>
        </CardContent>
      </Card>

      <div className="mt-10 border-t border-border pt-6">
        <h2 className="text-sm font-medium text-destructive">Danger zone</h2>
        <p className="mt-1 text-sm text-muted">
          Permanently delete this course and all its sections, lessons, quizzes, and
          enrollments. This cannot be undone.
        </p>
        <NavForm
          action={deleteCourse.bind(null, slug, courseId)}
          className="mt-3"
          confirm="Delete this course and all its content? This cannot be undone."
        >
          <Button
            type="submit"
            variant="outline"
            className="border-destructive text-destructive hover:bg-destructive/10"
          >
            Delete course
          </Button>
        </NavForm>
      </div>
    </div>
  );
}
