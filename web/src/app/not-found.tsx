import Link from 'next/link';
import { Button } from '@/components/ui/button';

/** Branded 404 for unmatched routes and notFound() calls. */
export default function NotFound() {
  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col items-center justify-center gap-4 px-6 text-center">
      {/* A kicker above the heading, which is what it always was — it just
          happened to be brand blue, so it read as a link to nowhere. */}
      <p className="text-eyebrow font-bold uppercase text-muted">404</p>
      <h1 className="text-2xl">Page not found</h1>
      <p className="text-muted">
        The page you&apos;re looking for doesn&apos;t exist or may have moved.
      </p>
      <Button asChild>
        <Link href="/">Go home</Link>
      </Button>
    </main>
  );
}
