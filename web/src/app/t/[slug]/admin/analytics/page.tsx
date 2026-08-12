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
  lessons,
} from '@training-platform/db';
import { requireAdminForSlug } from '@/lib/tenant';
import { EmptyState } from '@/components/empty-state';
import { Card, CardContent } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

export const metadata = { title: 'Insights' };

function pct(n: number, d: number) {
  return d === 0 ? 0 : Math.round((n / d) * 100);
}

/** Compact duration for table cells: "48s", "3m 20s", "1h 4m". */
function formatSeconds(total: number): string {
  const s = Math.max(0, Math.round(total));
  if (s < 60) return `${s}s`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ${s % 60}s`;
  return `${Math.floor(m / 60)}h ${m % 60}m`;
}

/** Live insights — tenant-scoped aggregates + per-question friction metrics. */
export default async function Analytics({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const ctx = await requireAdminForSlug(slug);
  const tid = ctx.tenantId;

  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

  // One wave, not four. All nine queries are independent, so awaiting the counts,
  // then `active`, then `friction`, then `watch` in sequence stacked four Sydney
  // round trips onto the page's time-to-first-byte. Batched, it waits on the
  // slowest single query. (Indexes for these scans land in migration 0018.)
  const [[enr], [comp], [learners], [recent], [attempts], [passed], [active], friction, watch] =
    await Promise.all([
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
      // Distinct enrollments with any event in the last 30 days.
      db
        .select({ n: countDistinct(progressEvents.enrollmentId) })
        .from(progressEvents)
        .where(
          and(eq(progressEvents.tenantId, tid), gte(progressEvents.occurredAt, thirtyDaysAgo)),
        ),
      // Per-question friction: attempts, average time spent (duration_ms), and
      // how often the question is answered wrong. Ranked by attempts, hardest first.
      db
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
        .limit(8),
      // Video watch time per lesson, from the append-only watch events. Compared
      // against the author's time estimate to show how much is actually watched.
      db
        .select({
          title: lessons.title,
          estimatedMinutes: lessons.estimatedMinutes,
          viewers: countDistinct(progressEvents.enrollmentId),
          watchedSec: sql<string>`coalesce(sum(${progressEvents.durationMs}), 0) / 1000`,
          furthestSec: sql<
            string | null
          >`max((${progressEvents.payload} ->> 'positionSec')::numeric)`,
        })
        .from(progressEvents)
        .innerJoin(lessons, eq(lessons.id, progressEvents.lessonId))
        .where(
          and(eq(progressEvents.tenantId, tid), eq(progressEvents.eventType, 'video_progress')),
        )
        .groupBy(progressEvents.lessonId, lessons.title, lessons.estimatedMinutes)
        .orderBy(sql`sum(${progressEvents.durationMs}) desc`)
        .limit(8),
    ]);

  const totalEnr = Number(enr.n);
  const completed = Number(comp.n);
  const totalAttempts = Number(attempts.n);
  const passedAttempts = Number(passed.n);

  const metrics = [
    { label: 'Enrolments', value: totalEnr },
    { label: 'Completions', value: completed },
    { label: 'Completion rate', value: `${pct(completed, totalEnr)}%` },
    { label: 'Learners', value: Number(learners.n) },
    { label: 'Active (30d)', value: Number(active.n) },
    { label: 'New enrolments (30d)', value: Number(recent.n) },
    { label: 'Quiz attempts', value: totalAttempts },
    { label: 'Quiz pass rate', value: `${pct(passedAttempts, totalAttempts)}%` },
  ];

  return (
    <div>
      <h1 className="text-2xl">Insights</h1>
      <p className="mt-1 text-muted">Live metrics for your academy.</p>

      <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {metrics.map((m) => (
          <Card key={m.label}>
            <CardContent className="py-4">
              <p className="text-sm text-muted">{m.label}</p>
              <p className="mt-1 text-2xl font-extrabold tracking-[-0.02em] tabular-nums">
                {m.value}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      {watch.length > 0 && (
        <section className="mt-10">
          <h2 className="text-h2">Video engagement</h2>
          <p className="mt-1 text-sm text-muted">
            Actual time played per video lesson — not just who clicked “complete”.
          </p>
          <div className="mt-4 overflow-x-auto rounded-(--radius-card) bg-surface">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Lesson</TableHead>
                  <TableHead className="text-right">Viewers</TableHead>
                  <TableHead className="text-right">Total watched</TableHead>
                  <TableHead className="text-right">Avg per viewer</TableHead>
                  <TableHead className="text-right">Furthest point</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {watch.map((w, i) => {
                  const viewers = Number(w.viewers) || 0;
                  const totalSec = Number(w.watchedSec) || 0;
                  const avgSec = viewers ? Math.round(totalSec / viewers) : 0;
                  const furthest = w.furthestSec == null ? null : Number(w.furthestSec);
                  return (
                    <TableRow key={i}>
                      <TableCell className="max-w-xs truncate font-medium">{w.title}</TableCell>
                      <TableCell className="text-right tabular-nums">{viewers}</TableCell>
                      <TableCell className="text-right tabular-nums">
                        {formatSeconds(totalSec)}
                      </TableCell>
                      <TableCell className="text-right tabular-nums">
                        {formatSeconds(avgSec)}
                      </TableCell>
                      <TableCell className="text-right tabular-nums">
                        {furthest == null ? '—' : formatSeconds(Math.round(furthest))}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </section>
      )}

      <section className="mt-10">
        <h2 className="text-h2">Where learners get stuck</h2>
        <p className="mt-1 text-sm text-muted">
          Questions ranked by attempts, with average time spent and how often they&apos;re answered
          wrong — to spot friction points.
        </p>
        {friction.length === 0 ? (
          <EmptyState className="mt-4" title="No quiz answers yet">
            Once learners start answering quiz questions, the ones they get wrong most often — and
            spend longest on — will be listed here, hardest first.
          </EmptyState>
        ) : (
          <div className="mt-4 overflow-x-auto rounded-(--radius-card) bg-surface">
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
