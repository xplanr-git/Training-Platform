import {
  db,
  eq,
  and,
  gte,
  count,
  countDistinct,
  enrollments,
  quizAttempts,
  progressEvents,
} from '@training-platform/db';
import { withTenant } from '@/lib/tenant';

function pct(n: number, d: number) {
  return d === 0 ? 0 : Math.round((n / d) * 100);
}

/** Real reports overview — tenant-scoped aggregates over the event data. */
export default async function Analytics() {
  const ctx = await withTenant();
  const tid = ctx.tenantId;

  if (!tid) {
    return <p className="text-muted">No tenant context.</p>;
  }

  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

  const [
    [enr],
    [comp],
    [learners],
    [recent],
    [attempts],
    [passed],
  ] = await Promise.all([
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

  // Distinct learners active in the last 30 days (any progress event).
  const [active] = await db
    .select({ n: countDistinct(progressEvents.enrollmentId) })
    .from(progressEvents)
    .where(and(eq(progressEvents.tenantId, tid), gte(progressEvents.occurredAt, thirtyDaysAgo)));

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
      <h1 className="text-2xl font-semibold">Reports Center</h1>
      <p className="mt-1 text-muted">Live metrics for your academy.</p>

      <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
        {metrics.map((m) => (
          <div
            key={m.label}
            className="rounded-[--radius-card] border border-border bg-surface p-5"
          >
            <p className="text-sm text-muted">{m.label}</p>
            <p className="mt-1 text-2xl font-semibold">{m.value}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
