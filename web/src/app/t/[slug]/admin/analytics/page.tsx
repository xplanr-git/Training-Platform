import {
  db,
  eq,
  and,
  gte,
  count,
  countDistinct,
  sql,
  enrollments,
  quizAttempts,
  progressEvents,
  quizAnswers,
  quizQuestions,
} from '@training-platform/db';
import { withTenant } from '@/lib/tenant';
import { Card, CardContent } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

function pct(n: number, d: number) {
  return d === 0 ? 0 : Math.round((n / d) * 100);
}

/** Live insights — tenant-scoped aggregates + per-question friction metrics. */
export default async function Analytics() {
  const ctx = await withTenant();
  const tid = ctx.tenantId;

  if (!tid) {
    return <p className="text-muted">No tenant context.</p>;
  }

  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

  const [[enr], [comp], [learners], [recent], [attempts], [passed]] = await Promise.all([
    db.select({ n: count() }).from(enrollments).where(eq(enrollments.tenantId, tid)),
    db
      .select({ n: count() })
      .from(enrollments)
      .where(and(eq(enrollments.tenantId, tid), eq(enrollments.status, 'completed'))),
    db
      .select({ n: countDistinct(enrollments.userId) })
      .from(enrollments)
      .where(eq(enrollments.tenantId, tid)),
    db
      .select({ n: count() })
      .from(enrollments)
      .where(and(eq(enrollments.tenantId, tid), gte(enrollments.startedAt, thirtyDaysAgo))),
    db.select({ n: count() }).from(quizAttempts).where(eq(quizAttempts.tenantId, tid)),
    db
      .select({ n: count() })
      .from(quizAttempts)
      .where(and(eq(quizAttempts.tenantId, tid), eq(quizAttempts.passed, true))),
  ]);

  const [active] = await db
    .select({ n: countDistinct(progressEvents.enrollmentId) })
    .from(progressEvents)
    .where(and(eq(progressEvents.tenantId, tid), gte(progressEvents.occurredAt, thirtyDaysAgo)));

  // Per-question friction: attempts, average time spent (duration_ms), and how
  // often the question is answered wrong. Ranked by attempts (most-answered
  // first). Aggregated in SQL; small internal data so no extra indexing needed.
  const friction = await db
    .select({
      prompt: quizQuestions.prompt,
      answers: count(),
      avgMs: sql<string | null>`round(avg(${quizAnswers.durationMs}))`,
      wrong: sql<string>`sum(case when ${quizAnswers.isCorrect} is false then 1 else 0 end)`,
    })
    .from(quizAnswers)
    .innerJoin(quizQuestions, eq(quizQuestions.id, quizAnswers.questionId))
    .where(eq(quizAnswers.tenantId, tid))
    .groupBy(quizAnswers.questionId, quizQuestions.prompt)
    .orderBy(sql`count(*) desc`)
    .limit(8);

  const totalEnr = Number(enr.n);
  const completed = Number(comp.n);
  const totalAttempts = Number(attempts.n);
  const passedAttempts = Number(passed.n);

  const metrics = [
    { label: 'Enrollments', value: totalEnr },
    { label: 'Completions', value: completed },
    { label: 'Completion rate', value: `${pct(completed, totalEnr)}%` },
    { label: 'Learners', value: Number(learners.n) },
    { label: 'Active (30d)', value: Number(active.n) },
    { label: 'New enrollments (30d)', value: Number(recent.n) },
    { label: 'Quiz attempts', value: totalAttempts },
    { label: 'Quiz pass rate', value: `${pct(passedAttempts, totalAttempts)}%` },
  ];

  return (
    <div>
      <h1 className="text-2xl font-semibold tracking-tight">Insights</h1>
      <p className="mt-1 text-muted">Live metrics for your academy.</p>

      <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {metrics.map((m) => (
          <Card key={m.label}>
            <CardContent className="py-4">
              <p className="text-sm text-muted">{m.label}</p>
              <p className="mt-1 text-2xl font-semibold tabular-nums">{m.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <section className="mt-10">
        <h2 className="text-lg font-semibold">Where learners get stuck</h2>
        <p className="mt-1 text-sm text-muted">
          Questions ranked by attempts, with average time spent and how often they&apos;re
          answered wrong — to spot friction points.
        </p>
        {friction.length === 0 ? (
          <Card className="mt-4">
            <CardContent className="py-8 text-center text-muted">
              No quiz activity yet.
            </CardContent>
          </Card>
        ) : (
          <div className="mt-4 overflow-x-auto rounded-[--radius-card] border border-border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Question</TableHead>
                  <TableHead className="text-right">Attempts</TableHead>
                  <TableHead className="text-right">Avg time</TableHead>
                  <TableHead className="text-right">Wrong</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {friction.map((f, i) => {
                  const ans = Number(f.answers);
                  const ms = f.avgMs == null ? null : Number(f.avgMs);
                  const wrong = Number(f.wrong ?? 0);
                  return (
                    <TableRow key={i}>
                      <TableCell className="max-w-md truncate font-medium">{f.prompt}</TableCell>
                      <TableCell className="text-right tabular-nums">{ans}</TableCell>
                      <TableCell className="text-right tabular-nums">
                        {ms == null ? '—' : `${(ms / 1000).toFixed(1)}s`}
                      </TableCell>
                      <TableCell className="text-right tabular-nums">{pct(wrong, ans)}%</TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        )}
      </section>
    </div>
  );
}
