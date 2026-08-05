import Link from 'next/link';
import { BackLink } from '@/components/back-link';
import { cn } from '@/components/ui/utils';
import { ReorderControls } from '@/components/reorder-controls';
import { EmptyState, EmptyRow } from '@/components/empty-state';
import { notFound } from 'next/navigation';
import { Trash2, Video, FileText, HelpCircle, BookOpen } from 'lucide-react';
import { db, eq, and, asc, courses, sections, lessons } from '@training-platform/db';
import { requireAdminForSlug } from '@/lib/tenant';
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
  startVideoUpload,
} from './actions';
import { VideoUpload } from '@/components/video-upload';
import { AttachedVideo } from '@/components/attached-video';
import { hostedVideoFromContent, availableProviders, getBunnyVideoCached } from '@/lib/video';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { NavForm } from '@/components/nav-form';

const LESSON_ICON: Record<string, typeof Video> = {
  text: BookOpen,
  video: Video,
  pdf: FileText,
  quiz: HelpCircle,
};

const SELECT_CLS = 'h-9 rounded-md border border-input bg-transparent px-3 text-sm shadow-sm';

export default async function CourseBuilder({
  params,
}: {
  params: Promise<{ slug: string; courseId: string }>;
}) {
  const { slug, courseId } = await params;
  const ctx = await requireAdminForSlug(slug);
  if (!ctx.tenantId) notFound();

  const [course] = await db
    .select({ id: courses.id, title: courses.title, slug: courses.slug })
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

  // Look up what is attached to each video lesson, so the builder shows a poster,
  // title, length and encoding state rather than a bare uuid. Fetched in parallel
  // and cached briefly (see getBunnyVideoCached), so revisiting the builder does
  // not re-hit Bunny once per video every time. A Bunny outage degrades to "no
  // details" rather than failing the page — the rest of the builder still works.
  const attachedVideos = new Map<string, Awaited<ReturnType<typeof getBunnyVideoCached>>>();
  if (videoHostingOn) {
    const videoLessons: Array<{ lessonId: string; videoId: string }> = [];
    for (const l of lessonRows) {
      const hosted = hostedVideoFromContent(l.content as Record<string, unknown>);
      if (hosted) videoLessons.push({ lessonId: l.id, videoId: hosted.videoId });
    }

    const results = await Promise.all(
      videoLessons.map(async (v) => {
        try {
          return [v.lessonId, await getBunnyVideoCached(v.videoId)] as const;
        } catch {
          return [v.lessonId, null] as const;
        }
      }),
    );
    for (const [lessonId, details] of results) attachedVideos.set(lessonId, details);
  }

  return (
    <div className="max-w-3xl">
      <BackLink href={`/admin/courses/${courseId}`}>Course</BackLink>
      <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold tracking-tight">{course.title}</h1>
        <Button asChild variant="outline" size="sm">
          <Link href={`/courses/${course.slug}`}>Preview as a learner</Link>
        </Button>
      </div>
      <p className="text-muted">Course content</p>

      <div className="mt-6 space-y-5">
        {sectionRows.length === 0 && (
          <EmptyState title="Start with a section">
            Sections group your lessons — for example “Before you begin” or “Installing the
            pedestals”. Add one using the form below, then add lessons inside it.
          </EmptyState>
        )}
        {sectionRows.map((s, i) => (
          <Card key={s.id} className="overflow-hidden p-0">
            <header className="flex items-center justify-between border-b border-border bg-surface-muted px-4 py-2.5">
              <h2 className="font-medium">{s.title}</h2>
              <div className="flex items-center gap-0.5">
                <ReorderControls
                  label="section"
                  up={moveSection.bind(null, slug, courseId, s.id, 'up')}
                  down={moveSection.bind(null, slug, courseId, s.id, 'down')}
                  canMoveUp={i > 0}
                  canMoveDown={i < sectionRows.length - 1}
                />
                <NavForm
                  action={deleteSection.bind(null, slug, courseId, s.id)}
                  quiet
                  confirm="Delete this section and every lesson in it? This cannot be undone."
                >
                  <Button
                    type="submit"
                    variant="ghost"
                    size="icon"
                    aria-label="Delete section"
                    className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </NavForm>
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
                        <ReorderControls
                          label="lesson"
                          up={moveLesson.bind(null, slug, courseId, s.id, l.id, 'up')}
                          down={moveLesson.bind(null, slug, courseId, s.id, l.id, 'down')}
                          canMoveUp={li > 0}
                          canMoveDown={li < arr.length - 1}
                        />
                        {l.type === 'quiz' && (
                          <Button asChild variant="ghost" size="sm">
                            <Link href={`/admin/courses/${courseId}/builder/quiz/${l.id}`}>
                              Edit quiz
                            </Link>
                          </Button>
                        )}
                        <NavForm
                          action={deleteLesson.bind(null, slug, courseId, l.id)}
                          quiet
                          confirm="Delete this lesson? This cannot be undone."
                        >
                          <Button
                            type="submit"
                            variant="ghost"
                            size="icon"
                            aria-label="Delete lesson"
                            className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </NavForm>
                      </span>
                    </div>

                    {/* Quiz lessons keep a reduced form (title + estimate) — their
                        questions live in the quiz editor, but they still need a
                        time estimate so "about N min left" includes them. */}
                    <details className="mt-2">
                      {/*
                        This <summary> is the ONLY way into a lesson's editing
                        controls, and it was 12px text with no padding — a hairline
                        target on a touch screen. Padding gives it a real hit area
                        without changing the visual language.
                      */}
                      <summary className="inline-flex cursor-pointer items-center rounded-md py-1.5 pr-2 text-sm text-brand-700 hover:underline">
                        Edit lesson
                      </summary>
                      <NavForm
                        action={updateLesson.bind(null, slug, courseId, l.id)}
                        className="mt-2 flex flex-wrap items-center gap-2"
                      >
                        {/*
                          Every control in this row carries an aria-label. They are
                          placeholder-only or nameless otherwise, and a placeholder
                          disappears the moment there is a value — which on an EDIT
                          form is always. So the row had no accessible names at all
                          for exactly the lessons an author is most likely editing.
                        */}
                        <Input
                          name="title"
                          aria-label="Lesson title"
                          defaultValue={l.title}
                          className="h-8 w-40"
                        />
                        {l.type === 'quiz' ? (
                          <input type="hidden" name="type" value="quiz" />
                        ) : (
                          <>
                            <select
                              name="type"
                              aria-label="Lesson type"
                              defaultValue={l.type}
                              className={cn(SELECT_CLS, 'h-8')}
                            >
                              <option value="text">Text</option>
                              <option value="video">Video</option>
                              <option value="pdf">PDF</option>
                            </select>
                            <Input
                              name="body"
                              aria-label="Text body"
                              defaultValue={c.body ?? ''}
                              placeholder="Text body"
                              className="h-8 w-40"
                            />
                            <Input
                              name="url"
                              aria-label="PDF URL"
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
                          aria-label="Estimated minutes (optional)"
                          defaultValue={l.estimatedMinutes ?? ''}
                          placeholder="Mins"
                          className="h-8 w-20"
                        />
                        <Button type="submit" size="sm">
                          Save
                        </Button>
                      </NavForm>

                      {l.type === 'video' && videoHostingOn && (
                        <div className="mt-3 border-t border-border pt-3">
                          {(() => {
                            const attachedId =
                              hostedVideoFromContent(l.content as Record<string, unknown>)
                                ?.videoId ?? null;
                            const details = attachedVideos.get(l.id) ?? null;
                            return (
                              <>
                                {attachedId && details && (
                                  <AttachedVideo
                                    videoId={details.videoId}
                                    title={details.title}
                                    durationSec={details.durationSec}
                                    playable={details.playable}
                                    thumbnailUrl={details.thumbnailUrl}
                                    statusLabel={details.statusLabel}
                                    encodeProgress={details.encodeProgress}
                                  />
                                )}
                                {attachedId && !details && (
                                  <p className="mb-3 text-xs text-amber-700">
                                    A video is attached ({attachedId}) but its details could not be
                                    read from Bunny just now. Reload the page to try again — the
                                    lesson itself is fine.
                                  </p>
                                )}
                                <VideoUpload
                                  lessonTitle={l.title}
                                  currentVideoId={attachedId}
                                  attach={attachVideo.bind(null, slug, courseId, l.id)}
                                  attachFromUrl={attachBunnyFromUrl.bind(
                                    null,
                                    slug,
                                    courseId,
                                    l.id,
                                  )}
                                  startUpload={startVideoUpload.bind(null, slug, courseId, l.id)}
                                />
                              </>
                            );
                          })()}
                          <p className="mt-1.5 text-xs text-muted">
                            Attach a Bunny video to enable watch-time tracking and cross-device
                            resume. Video lessons are Bunny-only.
                          </p>
                        </div>
                      )}
                    </details>
                  </li>
                );
              })}
              {(lessonsBySection.get(s.id) ?? []).length === 0 && (
                <li>
                  <EmptyRow className="py-6" title="No lessons in this section">
                    Add one below — a video, a PDF, a text page or a quiz.
                  </EmptyRow>
                </li>
              )}
            </ul>

            <NavForm
              action={addLesson.bind(null, slug, courseId, s.id)}
              className="flex flex-wrap items-center gap-2 border-t border-border bg-surface-muted px-4 py-3"
              quiet
            >
              <Input
                name="title"
                required
                aria-label="Lesson title"
                placeholder="Lesson title"
                className="w-44"
              />
              <select name="type" aria-label="Lesson type" className={SELECT_CLS}>
                <option value="text">Text</option>
                <option value="video">Video</option>
                <option value="pdf">PDF</option>
                <option value="quiz">Quiz</option>
              </select>
              <Input
                name="url"
                aria-label="PDF URL (used only by PDF lessons)"
                placeholder="PDF URL"
                className="w-40"
              />
              <Input
                name="estimatedMinutes"
                type="number"
                min="1"
                placeholder="Mins"
                aria-label="Estimated minutes (optional) — powers “about N min left” for learners"
                className="w-20"
              />
              <Button type="submit" variant="secondary">
                Add lesson
              </Button>
            </NavForm>
          </Card>
        ))}
      </div>

      <NavForm
        action={addSection.bind(null, slug, courseId)}
        className="mt-6 flex items-center gap-2"
        quiet
      >
        <Input
          name="title"
          required
          aria-label="New section title"
          placeholder="New section title"
          className="max-w-xs"
        />
        <Button type="submit" variant="outline">
          Add section
        </Button>
      </NavForm>
    </div>
  );
}
