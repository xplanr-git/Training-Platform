import Link from 'next/link';
import { notFound } from 'next/navigation';
import {
  ArrowLeft,
  ChevronUp,
  ChevronDown,
  Trash2,
  Video,
  FileText,
  HelpCircle,
  BookOpen,
} from 'lucide-react';
import { db, eq, and, asc, courses, sections, lessons } from '@training-platform/db';
import { withTenant } from '@/lib/tenant';
import {
  addSection,
  deleteSection,
  moveSection,
  addLesson,
  deleteLesson,
  moveLesson,
  updateLesson,
  attachVideo,
  attachBunnyFromUrl,
} from './actions';
import { VideoUpload } from '@/components/video-upload';
import { hostedVideoFromContent, availableProviders } from '@/lib/video';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';

const LESSON_ICON: Record<string, typeof Video> = {
  text: BookOpen,
  video: Video,
  pdf: FileText,
  quiz: HelpCircle,
};

const SELECT_CLS =
  'h-9 rounded-md border border-input bg-transparent px-3 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring';

export default async function CourseBuilder({
  params,
}: {
  params: Promise<{ slug: string; courseId: string }>;
}) {
  const { slug, courseId } = await params;
  const ctx = await withTenant();
  if (!ctx.tenantId) notFound();

  const [course] = await db
    .select({ id: courses.id, title: courses.title })
    .from(courses)
    .where(and(eq(courses.id, courseId), eq(courses.tenantId, ctx.tenantId)))
    .limit(1);
  if (!course) notFound();

  const sectionRows = await db
    .select()
    .from(sections)
    .where(eq(sections.courseId, courseId))
    .orderBy(asc(sections.position));

  const lessonRows = await db
    .select()
    .from(lessons)
    .where(eq(lessons.courseId, courseId))
    .orderBy(asc(lessons.position));

  const providers = availableProviders();
  const videoHostingOn = providers.length > 0;
  const lessonsBySection = new Map<string, typeof lessonRows>();
  for (const l of lessonRows) {
    const arr = lessonsBySection.get(l.sectionId) ?? [];
    arr.push(l);
    lessonsBySection.set(l.sectionId, arr);
  }

  return (
    <div className="max-w-3xl">
      <Link
        href={`/admin/courses/${courseId}`}
        className="inline-flex items-center gap-1.5 text-sm text-muted hover:underline"
      >
        <ArrowLeft className="h-4 w-4" /> Course
      </Link>
      <h1 className="mt-3 text-2xl font-semibold tracking-tight">{course.title}</h1>
      <p className="text-muted">Course content</p>

      <div className="mt-6 space-y-5">
        {sectionRows.map((s, i) => (
          <Card key={s.id} className="overflow-hidden p-0">
            <header className="flex items-center justify-between border-b border-border bg-surface-muted px-4 py-2.5">
              <h2 className="font-medium">{s.title}</h2>
              <div className="flex items-center gap-0.5">
                <form action={moveSection.bind(null, slug, courseId, s.id, 'up')}>
                  <Button
                    type="submit"
                    variant="ghost"
                    size="icon"
                    aria-label="Move section up"
                    disabled={i === 0}
                  >
                    <ChevronUp className="h-4 w-4" />
                  </Button>
                </form>
                <form action={moveSection.bind(null, slug, courseId, s.id, 'down')}>
                  <Button
                    type="submit"
                    variant="ghost"
                    size="icon"
                    aria-label="Move section down"
                    disabled={i === sectionRows.length - 1}
                  >
                    <ChevronDown className="h-4 w-4" />
                  </Button>
                </form>
                <form action={deleteSection.bind(null, slug, courseId, s.id)}>
                  <Button
                    type="submit"
                    variant="ghost"
                    size="icon"
                    aria-label="Delete section"
                    className="text-destructive"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </form>
              </div>
            </header>

            <ul className="divide-y divide-border">
              {(lessonsBySection.get(s.id) ?? []).map((l, li, arr) => {
                const c = (l.content ?? {}) as Record<string, string>;
                const Icon = LESSON_ICON[l.type] ?? BookOpen;
                return (
                  <li key={l.id} className="px-4 py-2.5 text-sm">
                    <div className="flex items-center justify-between gap-2">
                      <span className="flex min-w-0 items-center gap-2">
                        <Icon className="h-4 w-4 shrink-0 text-muted" />
                        <span className="truncate">{l.title}</span>
                        {l.estimatedMinutes != null && (
                          <span className="shrink-0 text-xs text-muted tabular-nums">
                            {l.estimatedMinutes} min
                          </span>
                        )}
                      </span>
                      <span className="flex shrink-0 items-center gap-0.5">
                        <form action={moveLesson.bind(null, slug, courseId, s.id, l.id, 'up')}>
                          <Button
                            type="submit"
                            variant="ghost"
                            size="icon"
                            aria-label="Move lesson up"
                            disabled={li === 0}
                          >
                            <ChevronUp className="h-4 w-4" />
                          </Button>
                        </form>
                        <form action={moveLesson.bind(null, slug, courseId, s.id, l.id, 'down')}>
                          <Button
                            type="submit"
                            variant="ghost"
                            size="icon"
                            aria-label="Move lesson down"
                            disabled={li === arr.length - 1}
                          >
                            <ChevronDown className="h-4 w-4" />
                          </Button>
                        </form>
                        {l.type === 'quiz' && (
                          <Button asChild variant="ghost" size="sm">
                            <Link href={`/admin/courses/${courseId}/builder/quiz/${l.id}`}>
                              Edit quiz
                            </Link>
                          </Button>
                        )}
                        <form action={deleteLesson.bind(null, slug, courseId, l.id)}>
                          <Button
                            type="submit"
                            variant="ghost"
                            size="icon"
                            aria-label="Remove lesson"
                            className="text-destructive"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </form>
                      </span>
                    </div>

                    {/* Quiz lessons keep a reduced form (title + estimate) — their
                        questions live in the quiz editor, but they still need a
                        time estimate so "about N min left" includes them. */}
                    <details className="mt-2">
                      <summary className="cursor-pointer text-xs text-brand-700">
                        Edit lesson
                      </summary>
                      <form
                        action={updateLesson.bind(null, slug, courseId, l.id)}
                        className="mt-2 flex flex-wrap items-center gap-2"
                      >
                        <Input name="title" defaultValue={l.title} className="h-8 w-40" />
                        {l.type === 'quiz' ? (
                          <input type="hidden" name="type" value="quiz" />
                        ) : (
                          <>
                            <select
                              name="type"
                              defaultValue={l.type}
                              className={`${SELECT_CLS} h-8`}
                            >
                              <option value="text">Text</option>
                              <option value="video">Video</option>
                              <option value="pdf">PDF</option>
                            </select>
                            <Input
                              name="body"
                              defaultValue={c.body ?? ''}
                              placeholder="Text body"
                              className="h-8 w-40"
                            />
                            <Input
                              name="youtubeUrl"
                              defaultValue={c.youtubeUrl ?? ''}
                              placeholder="YouTube URL"
                              className="h-8 w-40"
                            />
                            <Input
                              name="url"
                              defaultValue={c.url ?? ''}
                              placeholder="PDF URL"
                              className="h-8 w-40"
                            />
                          </>
                        )}
                        <Input
                          name="estimatedMinutes"
                          type="number"
                          min="1"
                          defaultValue={l.estimatedMinutes ?? ''}
                          placeholder="Mins"
                          title="Estimated minutes (optional)"
                          className="h-8 w-20"
                        />
                        <Button type="submit" size="sm">
                          Save
                        </Button>
                      </form>

                      {l.type === 'video' && videoHostingOn && (
                        <div className="mt-3 border-t border-border pt-3">
                          <VideoUpload
                            lessonTitle={l.title}
                            currentVideoId={hostedVideoFromContent(l.content as Record<string, unknown>)?.videoId ?? null}
                            attach={attachVideo.bind(null, slug, courseId, l.id)}
                            attachFromUrl={attachBunnyFromUrl.bind(null, slug, courseId, l.id)}
                          />
                          <p className="mt-1.5 text-xs text-muted">
                            Attaching a Bunny video replaces the YouTube link for this lesson and
                            enables watch-time tracking.
                          </p>
                        </div>
                      )}
                    </details>
                  </li>
                );
              })}
              {(lessonsBySection.get(s.id) ?? []).length === 0 && (
                <li className="px-4 py-2.5 text-sm text-muted">No lessons yet.</li>
              )}
            </ul>

            <form
              action={addLesson.bind(null, slug, courseId, s.id)}
              className="flex flex-wrap items-center gap-2 border-t border-border bg-surface-muted px-4 py-3"
            >
              <Input name="title" required placeholder="Lesson title" className="w-44" />
              <select name="type" className={SELECT_CLS}>
                <option value="text">Text</option>
                <option value="video">Video (YouTube)</option>
                <option value="pdf">PDF</option>
                <option value="quiz">Quiz</option>
              </select>
              <Input name="youtubeUrl" placeholder="YouTube URL (video)" className="w-44" />
              <Input name="url" placeholder="PDF URL (pdf)" className="w-40" />
              <Input
                name="estimatedMinutes"
                type="number"
                min="1"
                placeholder="Mins"
                title="Estimated minutes (optional) — powers “about N min left” for learners"
                className="w-20"
              />
              <Button type="submit" variant="secondary">
                Add lesson
              </Button>
            </form>
          </Card>
        ))}
      </div>

      <form
        action={addSection.bind(null, slug, courseId)}
        className="mt-6 flex items-center gap-2"
      >
        <Input name="title" required placeholder="New section title" className="max-w-xs" />
        <Button type="submit" variant="outline">
          Add section
        </Button>
      </form>
    </div>
  );
}
