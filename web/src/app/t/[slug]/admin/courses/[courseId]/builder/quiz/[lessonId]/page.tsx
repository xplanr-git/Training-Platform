import Link from 'next/link';
import { BackLink } from '@/components/back-link';
import { EmptyState } from '@/components/empty-state';
import { notFound } from 'next/navigation';
import { Check, Trash2 } from 'lucide-react';
import { db, eq, and, asc, lessons, quizzes, quizQuestions } from '@training-platform/db';
import { requireAdminForSlug } from '@/lib/tenant';
import { ensureQuiz, addQuestion, deleteQuestion, setPassThreshold } from '../actions';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { NavForm } from '@/components/nav-form';

const SELECT_CLS =
  'h-9 rounded-md border border-input bg-transparent px-3 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring';

/** Mirrors the options in the add-question type select. */
const QUESTION_TYPE_LABEL: Record<string, string> = {
  mcq: 'Multiple choice — one answer',
  multi_select: 'Multiple choice — many answers',
  true_false: 'True / False',
};

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
        <h1 className="mt-3 text-2xl font-semibold tracking-tight">
          Quiz &middot; {lesson.title}
        </h1>
        <p className="mt-1 text-sm text-muted">
          This lesson has no quiz attached yet. Setting one up gives it a pass mark of
          70%, which you can change straight afterwards.
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

  const threshold = (quiz.settings as { passThreshold?: number })?.passThreshold ?? 70;

  return (
    <div className="max-w-3xl">
      <BackLink href={`/admin/courses/${courseId}/builder`}>Content</BackLink>
      <h1 className="mt-3 text-2xl font-semibold tracking-tight">Quiz · {lesson.title}</h1>

      <NavForm
        action={setPassThreshold.bind(null, slug, courseId, lessonId, quiz.id)}
        className="mt-4 flex items-end gap-2"
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
        <Button type="submit" variant="outline">
          Save
        </Button>
      </NavForm>

      <ol className="mt-6 space-y-3">
        {questions.map((q, i) => {
          const opts = q.options as string[];
          const correct = q.correct as number[];
          return (
            <li key={q.id}>
              <Card>
                <CardContent className="py-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="font-medium">
                        {i + 1}. {q.prompt}{' '}
                        <span className="text-xs font-normal text-muted">({q.points} pt)</span>
                      </p>
                      {/*
                        The type was never shown, so a multi-answer question and a
                        single-answer one with two ticks looked identical — and which
                        it is decides how the answer key was read.
                      */}
                      <p className="mt-0.5 text-xs text-muted">
                        {QUESTION_TYPE_LABEL[q.type] ?? q.type}
                      </p>
                    </div>
                    <NavForm action={deleteQuestion.bind(null, slug, courseId, lessonId, q.id)} quiet confirm="Delete this question?">
                      <Button
                        type="submit"
                        variant="ghost"
                        size="icon"
                        aria-label="Delete question"
                        className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </NavForm>
                  </div>
                  <ul className="mt-3 space-y-1.5 text-sm">
                    {opts.map((o, oi) => (
                      <li
                        key={oi}
                        className={`flex items-center gap-2 ${
                          correct.includes(oi) ? 'text-brand-700' : 'text-muted'
                        }`}
                      >
                        {correct.includes(oi) ? (
                          <Check aria-hidden="true" className="h-4 w-4 shrink-0" />
                        ) : (
                          <span
                            aria-hidden="true"
                            className="inline-block h-3.5 w-3.5 shrink-0 rounded-full border border-current"
                          />
                        )}
                        <span>{o}</span>
                        {/*
                          The tick and the colour were the ONLY signals. A screen
                          reader got neither, and colour alone fails WCAG 1.4.1, so
                          the state is now also stated in words.
                        */}
                        {correct.includes(oi) && (
                          <span className="text-xs font-medium">(correct)</span>
                        )}
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            </li>
          );
        })}
        {questions.length === 0 && (
          <li>
            <EmptyState title="No questions yet">
              Add the first one below. A question a learner skips is marked wrong, and they
              pass at the percentage set in Pass threshold above.
            </EmptyState>
          </li>
        )}
      </ol>

      <Card className="mt-6">
        <CardContent className="py-5">
          <NavForm
            action={addQuestion.bind(null, slug, courseId, lessonId, quiz.id)}
            className="space-y-3"
            quiet
          >
            <h2 className="font-medium">Add question</h2>
            <Input
              name="prompt"
              required
              aria-label="Question prompt"
              placeholder="Question prompt"
            />
            <div className="flex gap-2">
              <select name="type" aria-label="Question type" className={SELECT_CLS}>
                <option value="mcq">Multiple choice (one answer)</option>
                <option value="multi_select">Multiple choice (many answers)</option>
                <option value="true_false">True / False</option>
              </select>
              <Input
                name="points"
                type="number"
                min="1"
                aria-label="Points for this question"
                defaultValue={1}
                className="w-20"
              />
            </div>
            <Textarea
              name="options"
              rows={3}
              aria-label="Options, one per line — multiple choice only"
              placeholder="Options, one per line (ignored for True/False)"
            />
            {/*
              Only ONE of these is ever read — addQuestion branches on the type select
              above, and true_false ignores `correct` entirely while every other type
              ignores `correct_tf`. Both are rendered unconditionally, so the label
              text has to say which applies to what; otherwise an author fills in the
              wrong box and the question silently takes the other one's answer.
            */}
            <div className="flex flex-wrap items-center gap-4 text-sm">
              <label className="flex items-center gap-2">
                <span className="text-muted">
                  Correct option #(s) <span className="text-xs">— multiple choice only</span>
                </span>
                <Input name="correct" placeholder="e.g. 2 or 1,3" className="w-28" />
              </label>
              <label className="flex items-center gap-2">
                <span className="text-muted">
                  Correct answer <span className="text-xs">— True / False only</span>
                </span>
                <select name="correct_tf" className={SELECT_CLS}>
                  <option value="0">True</option>
                  <option value="1">False</option>
                </select>
              </label>
            </div>
            <Button type="submit">Add question</Button>
          </NavForm>
        </CardContent>
      </Card>
    </div>
  );
}
