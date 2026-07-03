import { redirect } from 'next/navigation';
import { getTenantContext } from '@/lib/tenant';

/** Learner dashboard. Enrollments + progress land in Phase D. */
export default async function Dashboard() {
  const ctx = await getTenantContext();
  if (!ctx) redirect('/login');

  return (
    <main className="mx-auto max-w-4xl px-6 py-16">
      <h1 className="text-2xl font-semibold">Your dashboard</h1>
      <p className="mt-2 text-neutral-600">
        Signed in as {ctx.email}. Your enrolled courses will appear here.
      </p>
    </main>
  );
}
