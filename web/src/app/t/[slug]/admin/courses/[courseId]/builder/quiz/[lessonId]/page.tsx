import Link from 'next/link';
import { BackLink } from '@/components/back-link';
import { notFound } from 'next/navigation';
import { db, eq, and, asc, lessons, quizzes, quizQuestions } from '@training-platform/db';
import { requireAdminForSlug } from '@/lib/tenant';
import type { QuizSettings } from '@/lib/content-types';
import {
  ensureQuiz,
  addQuestion,
  deleteQuestion,
  reorderQuestions,
  saveQuizSettings,
} from '../actions';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { AutoSubmit } from '@/components/auto-submit';
import { NavForm } from '@/components/nav-form';
import { QuizAnswerFields } from '@/components/quiz-answer-fields';
import { SortableQuestions } from '@/components/sortable-questions';

export const metadata = { title: 'Quiz' };

export default async function QuizEditor({
  params,
}: {
  params: Promise<{ slug: string; courseId: string; lessonId: string }>;
}) {
  const { slug, courseId, lessonId } = await params;
  const ctx = await requireAdminForSlug(slug);
  if (!ctx.tenantId) notFound();

  const [lesson] = await db
    .select({ id: lessons.id, title: lessons.title, type: lessons.type })
    .from(lessons)
    .where(and(eq(lessons.id, lessonId), eq(lessons.tenantId, ctx.tenantId)))
    .limit(1);
  if (!lesson || lesson.type !== 'quiz') notFound();

  const [quiz] = await db
    .select({ id: quizzes.id, settings: quizzes.settings })
    .from(quizzes)
    .where(and(eq(quizzes.lessonId, lessonId), eq(quizzes.tenantId, ctx.tenantId)))
    .limit(1);

  if (!quiz) {
    return (
      <div className="max-w-3xl">
        <BackLink href={`/admin/courses/${courseId}/builder`}>Content</BackLink>
        <h1 className="mt-3 text-2xl">Quiz &middot; {lesson.title}</h1>
        <p className="mt-1 text-sm text-muted">
          This lesson has no quiz attached yet. Setting one up gives it a pass mark of 70%, which
          you can change straight afterwards.
        </p>
        <NavForm action={ensureQuiz.bind(null, slug, courseId, lessonId)} className="mt-4">
          <Button type="submit">Set up this quiz</Button>
        </NavForm>
      </div>
    );
  }

  const questions = await db
    .select()
    .from(quizQuestions)
    .where(eq(quizQuestions.quizId, quiz.id))
    .orderBy(asc(quizQuestions.position));

  const quizSettings = quiz.settings as QuizSettings;
  const threshold = quizSettings?.passThreshold ?? 70;
  // Mirrors DEFAULT_MAX_ATTEMPTS in the learner action, which applies to every
  // quiz authored before this control existed.
  const maxAttempts = quizSettings?.maxAttempts ?? 10;

  return (
    <div className="max-w-3xl">
      <BackLink href={`/admin/courses/${courseId}/builder`}>Content</BackLink>
      <h1 className="mt-3 text-2xl">Quiz · {lesson.title}</h1>

      <NavForm
        action={saveQuizSettings.bind(null, slug, courseId, lessonId, quiz.id)}
        className="mt-4 flex flex-wrap items-end gap-2"
      >
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="threshold">Pass threshold (%)</Label>
          <Input
            id="threshold"
            name="threshold"
            type="number"
            min="0"
            max="100"
            defaultValue={threshold}
            className="w-28"
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="maxAttempts">Attempts allowed</Label>
          <Input
            id="maxAttempts"
            name="maxAttempts"
            type="number"
            min="1"
            max="100"
            defaultValue={maxAttempts}
            className="w-28"
            aria-describedby="maxAttempts-hint"
          />
        </div>
        {/* Saves itself when a field changes — NavForm shows Saving…/Saved. */}
        <AutoSubmit />
        <p id="maxAttempts-hint" className="w-full text-meta text-muted">
          A learner who uses every attempt cannot submit again. Unlimited attempts would let someone
          guess their way to a pass, and a pass issues a certificate.
        </p>
      </NavForm>

      {/*
        Question content is plain data, so the whole list renders client-side in
        SortableQuestions — which is what keeps the visible numbering derived
        from the live order while a drag is being saved.
      */}
      <SortableQuestions
        questions={questions.map((q) => ({
          id: q.id,
          prompt: q.prompt,
          type: q.type,
          points: q.points,
          options: q.options as string[],
          correct: q.correct as number[],
        }))}
        reorderAction={reorderQuestions.bind(null, slug, courseId, lessonId, quiz.id)}
        deleteAction={deleteQuestion.bind(null, slug, courseId, lessonId)}
      />

      <Card className="mt-6">
        <CardContent className="py-5">
          <NavForm
            action={addQuestion.bind(null, slug, courseId, lessonId, quiz.id)}
            className="space-y-3"
            quiet
          >
            <h2 className="text-h2">Add question</h2>
            <Input
              name="prompt"
              required
              aria-label="Question prompt"
              placeholder="Question prompt"
            />
            <QuizAnswerFields />
            <Button type="submit">Add question</Button>
          </NavForm>
        </CardContent>
      </Card>
    </div>
  );
}
