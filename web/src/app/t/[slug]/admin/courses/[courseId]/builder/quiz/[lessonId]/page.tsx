import Link from 'next/link';
import { notFound } from 'next/navigation';
import {
  db,
  eq,
  and,
  asc,
  lessons,
  quizzes,
  quizQuestions,
} from '@training-platform/db';
import { withTenant } from '@/lib/tenant';
import {
  ensureQuiz,
  addQuestion,
  deleteQuestion,
  setPassThreshold,
} from '../actions';

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
        <Link href={`/admin/courses/${courseId}/builder`} className="text-sm text-muted hover:underline">
          ← Content
        </Link>
        <h1 className="mt-2 text-2xl font-semibold">{lesson.title}</h1>
        <form action={ensureQuiz.bind(null, slug, courseId, lessonId)} className="mt-4">
          <button className="rounded-md bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700">
            Initialize quiz
          </button>
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
      <Link href={`/admin/courses/${courseId}/builder`} className="text-sm text-muted hover:underline">
        ← Content
      </Link>
      <h1 className="mt-2 text-2xl font-semibold">Quiz · {lesson.title}</h1>

      <form
        action={setPassThreshold.bind(null, slug, courseId, lessonId, quiz.id)}
        className="mt-4 flex items-end gap-2"
      >
        <label className="flex flex-col gap-1">
          <span className="text-sm font-medium">Pass threshold (%)</span>
          <input
            name="threshold"
            type="number"
            min="0"
            max="100"
            defaultValue={threshold}
            className="w-28 rounded-md border border-border px-2 py-1"
          />
        </label>
        <button className="rounded-md border border-border px-3 py-1.5 text-sm hover:bg-surface-muted">
          Save
        </button>
      </form>

      <ol className="mt-6 space-y-3">
        {questions.map((q, i) => {
          const opts = q.options as string[];
          const correct = q.correct as number[];
          return (
            <li key={q.id} className="rounded-[--radius-card] border border-border bg-surface p-4">
              <div className="flex items-start justify-between">
                <p className="font-medium">
                  {i + 1}. {q.prompt}{' '}
                  <span className="text-xs text-muted">({q.points} pt)</span>
                </p>
                <form action={deleteQuestion.bind(null, slug, courseId, lessonId, q.id)}>
                  <button className="text-xs text-red-600 hover:underline">Delete</button>
                </form>
              </div>
              <ul className="mt-2 space-y-1 text-sm">
                {opts.map((o, oi) => (
                  <li key={oi} className={correct.includes(oi) ? 'text-green-700' : 'text-muted'}>
                    {correct.includes(oi) ? '✓' : '○'} {o}
                  </li>
                ))}
              </ul>
            </li>
          );
        })}
        {questions.length === 0 && <li className="text-sm text-muted">No questions yet.</li>}
      </ol>

      <form
        action={addQuestion.bind(null, slug, courseId, lessonId, quiz.id)}
        className="mt-6 space-y-3 rounded-[--radius-card] border border-border bg-surface-muted p-4"
      >
        <h2 className="font-medium">Add question</h2>
        <input
          name="prompt"
          required
          placeholder="Question prompt"
          className="w-full rounded-md border border-border px-3 py-2 text-sm"
        />
        <div className="flex gap-2">
          <select name="type" className="rounded-md border border-border px-2 py-1 text-sm">
            <option value="mcq">Multiple choice (one answer)</option>
            <option value="multi_select">Multiple choice (many answers)</option>
            <option value="true_false">True / False</option>
          </select>
          <input
            name="points"
            type="number"
            min="1"
            defaultValue={1}
            className="w-20 rounded-md border border-border px-2 py-1 text-sm"
            title="Points"
          />
        </div>
        <textarea
          name="options"
          rows={3}
          placeholder="Options, one per line (ignored for True/False)"
          className="w-full rounded-md border border-border px-3 py-2 text-sm"
        />
        <div className="flex flex-wrap gap-3 text-sm">
          <label className="flex items-center gap-1">
            <span className="text-muted">Correct option #(s), comma-separated:</span>
            <input
              name="correct"
              placeholder="e.g. 2 or 1,3"
              className="w-28 rounded-md border border-border px-2 py-1"
            />
          </label>
          <label className="flex items-center gap-1">
            <span className="text-muted">For True/False:</span>
            <select name="correct_tf" className="rounded-md border border-border px-2 py-1">
              <option value="0">True</option>
              <option value="1">False</option>
            </select>
          </label>
        </div>
        <button className="rounded-md bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700">
          Add question
        </button>
      </form>
    </div>
  );
}
