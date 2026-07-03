import Link from 'next/link';

export default function PlatformHome() {
  return (
    <main className="mx-auto flex min-h-screen max-w-3xl flex-col items-center justify-center gap-6 px-6 text-center">
      <h1 className="text-4xl font-semibold tracking-tight">
        Training Platform
      </h1>
      <p className="max-w-xl text-lg text-neutral-600">
        Multi-tenant LMS for training companies, consultancies, and academies.
        Launch a branded academy, sell accredited courses, and prove completion
        with audit-grade evidence.
      </p>
      <div className="flex gap-3">
        <Link
          href="/signup"
          className="rounded-md bg-neutral-900 px-5 py-2.5 text-sm font-medium text-white hover:bg-neutral-700"
        >
          Start free trial
        </Link>
        <Link
          href="/login"
          className="rounded-md border border-neutral-300 px-5 py-2.5 text-sm font-medium hover:bg-neutral-100"
        >
          Sign in
        </Link>
      </div>
    </main>
  );
}
