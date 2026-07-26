import Link from 'next/link';

export default function PlatformHome() {
  return (
    <main className="mx-auto flex min-h-screen max-w-3xl flex-col items-center justify-center gap-6 px-6 text-center">
      <h1 className="text-4xl font-semibold tracking-tight">Outdure Academy</h1>
      <p className="max-w-xl text-lg text-neutral-600">
        Product training and certification for Outdure contractors and dealers.
        Work through the courses at your own pace, on any device, and get
        certified.
      </p>
      <div className="flex gap-3">
        <Link
          href="/login"
          className="rounded-md bg-neutral-900 px-5 py-2.5 text-sm font-medium text-white hover:bg-neutral-700"
        >
          Sign in
        </Link>
      </div>
    </main>
  );
}
