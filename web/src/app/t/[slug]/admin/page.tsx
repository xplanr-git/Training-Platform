import Link from 'next/link';
import {
  db,
  eq,
  and,
  count,
  countDistinct,
  courses,
  enrollments,
} from '@training-platform/db';
import { withTenant } from '@/lib/tenant';

/** Tenant admin dashboard overview. Auth + role are enforced by the layout. */
export default async function TenantAdminOverview() {
  const ctx = await withTenant();
  const tid = ctx.tenantId;

  const [[pub], [learners], [completions]] = tid
    ? await Promise.all([
        db
          .select({ n: count() })
          .from(courses)
          .where(and(eq(courses.tenantId, tid), eq(courses.status, 'published'))),
        db
          .select({ n: countDistinct(enrollments.userId) })
          .from(enrollments)
          .where(eq(enrollments.tenantId, tid)),
        db
          .select({ n: count() })
          .from(enrollments)
          .where(and(eq(enrollments.tenantId, tid), eq(enrollments.status, 'completed'))),
      ])
    : [[{ n: 0 }], [{ n: 0 }], [{ n: 0 }]];

  const stats = [
    { label: 'Published courses', value: Number(pub.n), href: '/admin/courses' },
    { label: 'Learners', value: Number(learners.n), href: '/admin/people' },
    { label: 'Completions', value: Number(completions.n), href: '/admin/analytics' },
  ];

  return (
    <div>
      <h1 className="text-2xl font-semibold">Dashboard</h1>
      <p className="mt-2 text-muted">
        Welcome to your academy admin. Use the sidebar to manage courses, people,
        and settings.
      </p>
      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
        {stats.map((s) => (
          <Link
            key={s.label}
            href={s.href}
            className="rounded-[--radius-card] border border-border bg-surface p-5 transition hover:shadow-md"
          >
            <p className="text-sm text-muted">{s.label}</p>
            <p className="mt-1 text-2xl font-semibold">{s.value}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
