import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft, Check, Trash2 } from 'lucide-react';
import { db, eq, and, asc, lessons, quizzes, quizQuestions } from '@training-platform/db';
import { withTenant } from '@/lib/tenant';
import { ensureQuiz, addQuestion, deleteQuestion, setPassThreshold } from '../actions';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';

const SELECT_CLS =
  'h-9 rounded-md border border-input bg-transparent px-3 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring';

export default async function QuizEditor({
  params,
}: {
  params: Promise<{ slug: string; courseId: string; lessonId: string }>;
}) {
  const { slug, courseId, lessonId } = await params;
  const ctx = await withTenant();
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
      <div className="max-w-2xl">
        <Link
          href={`/admin/courses/${courseId}/builder`}
          className="inline-flex items-center gap-1.5 text-sm text-muted hover:underline"
        >
          <ArrowLeft className="h-4 w-4" /> Content
        </Link>
        <h1 className="mt-3 text-2xl font-semibold tracking-tight">{lesson.title}</h1>
        <form action={ensureQuiz.bind(null, slug, courseId, lessonId)} className="mt-4">
          <Button type="submit">Initialize quiz</Button>
        </form>
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
    <div className="max-w-2xl">
      <Link
        href={`/admin/courses/${courseId}/builder`}
        className="inline-flex items-center gap-1.5 text-sm text-muted hover:underline"
      >
        <ArrowLeft className="h-4 w-4" /> Content
      </Link>
      <h1 className="mt-3 text-2xl font-semibold tracking-tight">Quiz · {lesson.title}</h1>

      <form
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
      </form>

      <ol className="mt-6 space-y-3">
        {questions.map((q, i) => {
          const opts = q.options as string[];
          const correct = q.correct as number[];
          return (
            <li key={q.id}>
              <Card>
                <CardContent className="py-4">
                  <div className="flex items-start justify-between gap-3">
                    <p className="font-medium">
                      {i + 1}. {q.prompt}{' '}
                      <span className="text-xs font-normal text-muted">({q.points} pt)</span>
                    </p>
                    <form action={deleteQuestion.bind(null, slug, courseId, lessonId, q.id)}>
                      <Button
                        type="submit"
                        variant="ghost"
                        size="icon"
                        aria-label="Delete question"
                        className="text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </form>
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
                          <Check className="h-4 w-4 shrink-0" />
                        ) : (
                          <span className="inline-block h-3.5 w-3.5 shrink-0 rounded-full border border-current" />
                        )}
                        {o}
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            </li>
          );
        })}
        {questions.length === 0 && <li className="text-sm text-muted">No questions yet.</li>}
      </ol>

      <Card className="mt-6">
        <CardContent className="py-5">
          <form
            action={addQuestion.bind(null, slug, courseId, lessonId, quiz.id)}
            className="space-y-3"
          >
            <h2 className="font-medium">Add question</h2>
            <Input name="prompt" required placeholder="Question prompt" />
            <div className="flex gap-2">
              <select name="type" className={SELECT_CLS}>
                <option value="mcq">Multiple choice (one answer)</option>
                <option value="multi_select">Multiple choice (many answers)</option>
                <option value="true_false">True / False</option>
              </select>
              <Input name="points" type="number" min="1" defaultValue={1} className="w-20" title="Points" />
            </div>
            <Textarea
              name="options"
              rows={3}
              placeholder="Options, one per line (ignored for True/False)"
            />
            <div className="flex flex-wrap items-center gap-4 text-sm">
              <label className="flex items-center gap-2">
                <span className="text-muted">Correct option #(s):</span>
                <Input name="correct" placeholder="e.g. 2 or 1,3" className="w-28" />
              </label>
              <label className="flex items-center gap-2">
                <span className="text-muted">True/False:</span>
                <select name="correct_tf" className={SELECT_CLS}>
                  <option value="0">True</option>
                  <option value="1">False</option>
                </select>
              </label>
            </div>
            <Button type="submit">Add question</Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
