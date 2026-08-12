'use server';

import { revalidatePath } from 'next/cache';
import {
  db,
  audited,
  eq,
  and,
  asc,
  courses,
  sections,
  lessons,
  quizzes,
} from '@training-platform/db';
import { requireAdmin } from '@/lib/tenant';
import { ActionError } from '@/lib/action-errors';
import { reconcileCourseCompletions } from '@/lib/completion';
import { parseOptionalMinutes } from '@/lib/validation';
import {
  getBunnyVideo,
  bunnyConfigured,
  createBunnyVideo,
  fetchBunnyFromUrl,
  createBunnyTusTicket,
  type BunnyTusTicket,
  type HostedProvider,
} from '@/lib/video';

/**
 * Issues a signed ticket so the browser can upload a video file straight to
 * Bunny, then attach it to this lesson.
 *
 * Only the ticket crosses to the client — never the library key. The signature
 * authorises exactly one video id for a limited window, so a leaked ticket buys
 * an attacker one upload into a video object we created and nothing else.
 *
 * The lesson is NOT modified here. The client calls attachVideo once the upload
 * finishes, so an abandoned upload leaves the lesson untouched (it only leaves an
 * empty video object in the Bunny library).
 */
export async function startVideoUpload(
  slug: string,
  courseId: string,
  lessonId: string,
  title: string,
): Promise<{ error?: string; ticket?: BunnyTusTicket }> {
  const ctx = await requireAdmin();
  await assertCourse(ctx.tenantId, courseId);
  if (!bunnyConfigured()) return { error: 'Bunny Stream is not configured.' };

  // Confirm the lesson is in this tenant before minting anything.
  const [lesson] = await db
    .select({ id: lessons.id })
    .from(lessons)
    .where(and(eq(lessons.id, lessonId), eq(lessons.tenantId, ctx.tenantId)))
    .limit(1);
  if (!lesson) return { error: 'That lesson no longer exists. Reload the builder.' };

  try {
    const ticket = await createBunnyTusTicket(title);
    return { ticket };
  } catch (e) {
    console.error('startVideoUpload failed:', e);
    return {
      error:
        'Bunny would not accept a new upload. Try again in a minute; if it persists, check the Bunny keys.',
    };
  }
}

/**
 * Ingests a video into Bunny from a public URL — an alternative to uploading a
 * file, useful when the media is already hosted somewhere reachable.
 */
export async function attachBunnyFromUrl(
  slug: string,
  courseId: string,
  lessonId: string,
  title: string,
  url: string,
): Promise<{ error?: string; videoId?: string }> {
  const ctx = await requireAdmin();
  await assertCourse(ctx.tenantId, courseId);
  if (!bunnyConfigured()) return { error: 'Bunny Stream is not configured.' };
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    return { error: 'Enter a valid http(s) URL.' };
  }
  if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
    return { error: 'The link must start with http:// or https://.' };
  }
  try {
    const { videoId } = await createBunnyVideo(title);
    await fetchBunnyFromUrl(videoId, parsed.toString());
    const res = await attachVideo(slug, courseId, lessonId, videoId, 'bunny');
    if (res.error) return res;
    return { videoId };
  } catch (e) {
    console.error('attachBunnyFromUrl failed:', e);
    return {
      error:
        'Bunny could not fetch that video. Check the link opens in a browser and points at a video file.',
    };
  }
}

/**
 * Attaches a provider video id to a lesson after upload (or when pasting the id
 * of something already uploaded). The id is confirmed to exist first so a typo
 * can't leave a lesson pointing at nothing.
 */
export async function attachVideo(
  slug: string,
  courseId: string,
  lessonId: string,
  videoId: string,
  provider: HostedProvider = 'bunny',
): Promise<{ error?: string }> {
  const ctx = await requireAdmin();
  await assertCourse(ctx.tenantId, courseId);
  const id = videoId.trim();
  if (!id) return { error: 'No video id supplied.' };
  if (!bunnyConfigured()) return { error: 'Video hosting is not configured yet.' };

  let details: { durationSec: number | null } | null = null;
  try {
    details = await getBunnyVideo(id);
  } catch (e) {
    console.error('attachVideo lookup failed:', e);
    return { error: 'Could not reach Bunny to check that video. Try again in a minute.' };
  }
  if (!details) return { error: `No video found with id “${id}”.` };

  const [before] = await db
    .select()
    .from(lessons)
    .where(and(eq(lessons.id, lessonId), eq(lessons.tenantId, ctx.tenantId)))
    .limit(1);
  if (!before) return { error: 'Lesson not found.' };

  await db.transaction(async (tx) => {
    const [after] = await tx
      .update(lessons)
      .set({
        type: 'video',
        content: { provider, videoId: id },
        // Seed the time estimate from the video's real length if unset.
        estimatedMinutes:
          before.estimatedMinutes ??
          (details!.durationSec ? Math.max(1, Math.round(details!.durationSec / 60)) : null),
        updatedAt: new Date(),
      })
      .where(and(eq(lessons.id, lessonId), eq(lessons.tenantId, ctx.tenantId!)))
      .returning();
    await audited(tx, {
      tenantId: ctx.tenantId,
      actorUserId: ctx.userId,
      action: 'lesson.video_attached',
      resourceType: 'lesson',
      resourceId: lessonId,
      before,
      after,
    });
  });

  revalidatePath(`/t/${slug}/admin/courses/${courseId}/builder`);
  return {};
}

async function assertCourse(tenantId: string, courseId: string) {
  const [course] = await db
    .select({ id: courses.id })
    .from(courses)
    .where(and(eq(courses.id, courseId), eq(courses.tenantId, tenantId)))
    .limit(1);
  if (!course) throw new Error('Course not found');
}

function revalidateBuilder(slug: string, courseId: string) {
  revalidatePath(`/t/${slug}/admin/courses/${courseId}/builder`);
}

/**
 * Builds a lesson's content_jsonb from the submitted type-specific fields.
 *
 * `previous` is the existing blob on an edit. It matters for video: a hosted
 * (Bunny) video is stored as `{ provider, videoId }` and has NO youtubeUrl input
 * in the edit form, so replacing the blob wholesale meant that editing a video
 * lesson's title or its minutes estimate silently detached the video — the
 * learner saw "Video unavailable", watch tracking and resume stopped, and the
 * lesson vanished from Insights. Nothing warned the admin.
 */
function contentFor(type: string, formData: FormData, previous?: unknown): Record<string, unknown> {
  const prev = (previous ?? {}) as Record<string, unknown>;
  switch (type) {
    case 'text':
      return { body: String(formData.get('body') ?? '') };
    case 'video': {
      // Video is Bunny-only now: the builder has no URL field, and a video is
      // attached through attachVideo / attachBunnyFromUrl rather than this form.
      // So this only ever PRESERVES what is already there.
      if (typeof prev.videoId === 'string' && prev.videoId) {
        return { provider: prev.provider ?? 'bunny', videoId: prev.videoId };
      }
      // Legacy YouTube lessons keep playing until they are migrated to Bunny —
      // editing a title must not silently blank one.
      if (typeof prev.youtubeUrl === 'string' && prev.youtubeUrl) {
        return { youtubeUrl: prev.youtubeUrl };
      }
      return {};
    }
    case 'pdf':
      return { url: String(formData.get('url') ?? '') };
    default:
      return {};
  }
}

export async function addSection(slug: string, courseId: string, formData: FormData) {
  const ctx = await requireAdmin();
  await assertCourse(ctx.tenantId, courseId);

  const title = String(formData.get('title') ?? '').trim() || 'Untitled section';
  const existing = await db
    .select({ position: sections.position })
    .from(sections)
    .where(and(eq(sections.courseId, courseId), eq(sections.tenantId, ctx.tenantId)));
  const nextPos = existing.reduce((m, s) => Math.max(m, s.position), -1) + 1;

  await db.transaction(async (tx) => {
    const [section] = await tx
      .insert(sections)
      .values({ tenantId: ctx.tenantId, courseId, title, position: nextPos })
      .returning();
    await audited(tx, {
      tenantId: ctx.tenantId,
      actorUserId: ctx.userId,
      action: 'section.create',
      resourceType: 'section',
      resourceId: section.id,
      after: { courseId, title, position: nextPos },
    });
  });
  revalidateBuilder(slug, courseId);
}

export async function deleteSection(slug: string, courseId: string, sectionId: string) {
  const ctx = await requireAdmin();
  const deleted = await db.transaction(async (tx) => {
    // returning() so the audit records WHAT was removed. A delete audited with
    // only an id says nothing once the row is gone, which is the moment the log
    // is for.
    const [before] = await tx
      .delete(sections)
      .where(and(eq(sections.id, sectionId), eq(sections.tenantId, ctx.tenantId!)))
      .returning();
    if (!before) return null;
    await audited(tx, {
      tenantId: ctx.tenantId,
      actorUserId: ctx.userId,
      action: 'section.delete',
      resourceType: 'section',
      resourceId: sectionId,
      before,
    });
    return before;
  });

  // Deleting a section cascades to every lesson in it (lessons.section_id ->
  // sections.id ON DELETE CASCADE), so this lowers the course total exactly as
  // deleteLesson does — only by more at once. Without this pass, removing a whole
  // section left every affected learner reading "100% complete" with the enrollment
  // still active and no certificate ever issued.
  if (deleted) {
    await reconcileCourseCompletions({ tenantId: ctx.tenantId!, courseId });
  }

  revalidateBuilder(slug, courseId);
}

export async function addLesson(
  slug: string,
  courseId: string,
  sectionId: string,
  formData: FormData,
) {
  const ctx = await requireAdmin();
  await assertCourse(ctx.tenantId, courseId);

  const title = String(formData.get('title') ?? '').trim() || 'Untitled lesson';
  const type = String(formData.get('type') ?? 'text') as 'text' | 'video' | 'pdf' | 'quiz';

  // The section must be in THIS course, not merely in this tenant. Without it a
  // crafted post could file a lesson into another course of the caller's own
  // academy: courseId and sectionId arrive separately and were each checked
  // against the tenant but never against each other, so the lesson's course_id
  // and its section's course_id could disagree — which the builder renders as a
  // lesson that has vanished.
  const [section] = await db
    .select({ id: sections.id })
    .from(sections)
    .where(
      and(
        eq(sections.id, sectionId),
        eq(sections.courseId, courseId),
        eq(sections.tenantId, ctx.tenantId),
      ),
    )
    .limit(1);
  if (!section) throw new Error('That section is no longer part of this course. Reload the page.');

  const existing = await db
    .select({ position: lessons.position })
    .from(lessons)
    .where(and(eq(lessons.sectionId, sectionId), eq(lessons.tenantId, ctx.tenantId)));
  const nextPos = existing.reduce((m, l) => Math.max(m, l.position), -1) + 1;

  await db.transaction(async (tx) => {
    const [lesson] = await tx
      .insert(lessons)
      .values({
        tenantId: ctx.tenantId!,
        courseId,
        sectionId,
        title,
        type,
        position: nextPos,
        estimatedMinutes: parseOptionalMinutes(formData.get('estimatedMinutes')),
        content: contentFor(type, formData),
      })
      .returning();
    // A quiz lesson gets a backing quiz row (default 70% pass threshold).
    if (type === 'quiz') {
      await tx.insert(quizzes).values({
        tenantId: ctx.tenantId!,
        lessonId: lesson.id,
        settings: { passThreshold: 70 },
      });
    }
    await audited(tx, {
      tenantId: ctx.tenantId,
      actorUserId: ctx.userId,
      action: 'lesson.create',
      resourceType: 'lesson',
      resourceId: lesson.id,
      after: { title, type },
    });
  });
  revalidateBuilder(slug, courseId);
}

export async function updateLesson(
  slug: string,
  courseId: string,
  lessonId: string,
  formData: FormData,
) {
  const ctx = await requireAdmin();

  const title = String(formData.get('title') ?? '').trim() || 'Untitled lesson';
  const type = String(formData.get('type') ?? 'text');

  // Read the current blob so an edit merges into it instead of overwriting it —
  // see contentFor. Also gives a real error instead of a silent no-op when the
  // lesson isn't in this tenant.
  const [existing] = await db
    .select()
    .from(lessons)
    .where(and(eq(lessons.id, lessonId), eq(lessons.tenantId, ctx.tenantId)))
    .limit(1);
  if (!existing) throw new Error(ActionError.LESSON_NOT_FOUND);

  await db.transaction(async (tx) => {
    const [after] = await tx
      .update(lessons)
      .set({
        title,
        type: type as 'text' | 'video' | 'pdf' | 'quiz',
        estimatedMinutes: parseOptionalMinutes(formData.get('estimatedMinutes')),
        content: contentFor(type, formData, existing.content),
        updatedAt: new Date(),
      })
      .where(and(eq(lessons.id, lessonId), eq(lessons.tenantId, ctx.tenantId!)))
      .returning();
    await audited(tx, {
      tenantId: ctx.tenantId,
      actorUserId: ctx.userId,
      action: 'lesson.update',
      resourceType: 'lesson',
      resourceId: lessonId,
      before: existing,
      after,
    });
  });
  revalidateBuilder(slug, courseId);
}

export async function deleteLesson(slug: string, courseId: string, lessonId: string) {
  const ctx = await requireAdmin();
  const deleted = await db.transaction(async (tx) => {
    const [before] = await tx
      .delete(lessons)
      .where(and(eq(lessons.id, lessonId), eq(lessons.tenantId, ctx.tenantId!)))
      .returning();
    if (!before) return null;
    await audited(tx, {
      tenantId: ctx.tenantId,
      actorUserId: ctx.userId,
      action: 'lesson.delete',
      resourceType: 'lesson',
      resourceId: lessonId,
      before,
    });
    return before;
  });

  // Removing a lesson lowers the course's total, which can push an already
  // in-progress enrollment to 100%. See reconcileCourseCompletions for why this
  // is required on every path that removes lessons.
  if (deleted) {
    await reconcileCourseCompletions({ tenantId: ctx.tenantId!, courseId });
  }

  revalidateBuilder(slug, courseId);
}

/** Swaps a section (or lesson) with its neighbour to reorder. */
export async function moveSection(
  slug: string,
  courseId: string,
  sectionId: string,
  dir: 'up' | 'down',
) {
  const ctx = await requireAdmin();

  // Read AND write inside one transaction, with the rows locked.
  //
  // The read used to sit outside it, which made a position swap a read-modify-write
  // with a gap in the middle. Two overlapping calls both read the pre-swap
  // positions, so the second re-applied the swap the first had already committed —
  // two clicks, one move — and two moves in DIFFERENT directions could leave two
  // rows sharing a position, after which the list order was whatever Postgres felt
  // like. FOR UPDATE makes the second call wait and then re-read the truth.
  //
  // Tenant-scoped: Drizzle bypasses RLS, so scope by tenantId to prevent a
  // tenant admin reordering another tenant's content via a forged courseId.
  await db.transaction(async (tx) => {
    const ordered = await tx
      .select({ id: sections.id, position: sections.position })
      .from(sections)
      .where(and(eq(sections.courseId, courseId), eq(sections.tenantId, ctx.tenantId)))
      .orderBy(asc(sections.position))
      .for('update');

    const idx = ordered.findIndex((s) => s.id === sectionId);
    const swapIdx = dir === 'up' ? idx - 1 : idx + 1;
    if (idx < 0 || swapIdx < 0 || swapIdx >= ordered.length) return;

    const a = ordered[idx];
    const b = ordered[swapIdx];
    await tx
      .update(sections)
      .set({ position: b.position })
      .where(and(eq(sections.id, a.id), eq(sections.tenantId, ctx.tenantId!)));
    await tx
      .update(sections)
      .set({ position: a.position })
      .where(and(eq(sections.id, b.id), eq(sections.tenantId, ctx.tenantId!)));
    await audited(tx, {
      tenantId: ctx.tenantId,
      actorUserId: ctx.userId,
      action: 'section.reorder',
      resourceType: 'section',
      resourceId: sectionId,
      before: { position: a.position },
      after: { position: b.position, swappedWith: b.id },
    });
  });
  revalidateBuilder(slug, courseId);
}

/** Swaps a lesson with its neighbour within the same section to reorder. */
export async function moveLesson(
  slug: string,
  courseId: string,
  sectionId: string,
  lessonId: string,
  dir: 'up' | 'down',
) {
  const ctx = await requireAdmin();

  // Read AND write inside one transaction, with the rows locked.
  //
  // The read used to sit outside it, which made a position swap a read-modify-write
  // with a gap in the middle. Two overlapping calls both read the pre-swap
  // positions, so the second re-applied the swap the first had already committed —
  // two clicks, one move — and two moves in DIFFERENT directions could leave two
  // rows sharing a position, after which the list order was whatever Postgres felt
  // like. FOR UPDATE makes the second call wait and then re-read the truth.
  //
  // Tenant-scoped (Drizzle bypasses RLS).
  await db.transaction(async (tx) => {
    const ordered = await tx
      .select({ id: lessons.id, position: lessons.position })
      .from(lessons)
      .where(and(eq(lessons.sectionId, sectionId), eq(lessons.tenantId, ctx.tenantId)))
      .orderBy(asc(lessons.position))
      .for('update');

    const idx = ordered.findIndex((l) => l.id === lessonId);
    const swapIdx = dir === 'up' ? idx - 1 : idx + 1;
    if (idx < 0 || swapIdx < 0 || swapIdx >= ordered.length) return;

    const a = ordered[idx];
    const b = ordered[swapIdx];
    await tx
      .update(lessons)
      .set({ position: b.position })
      .where(and(eq(lessons.id, a.id), eq(lessons.tenantId, ctx.tenantId!)));
    await tx
      .update(lessons)
      .set({ position: a.position })
      .where(and(eq(lessons.id, b.id), eq(lessons.tenantId, ctx.tenantId!)));
    await audited(tx, {
      tenantId: ctx.tenantId,
      actorUserId: ctx.userId,
      action: 'lesson.reorder',
      resourceType: 'lesson',
      resourceId: lessonId,
      before: { position: a.position },
      after: { position: b.position, swappedWith: b.id },
    });
  });
  revalidateBuilder(slug, courseId);
}
