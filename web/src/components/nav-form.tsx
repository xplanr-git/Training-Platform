'use client';

import { useRouter } from 'next/navigation';
import { useState, useTransition } from 'react';

type ActionResult = { redirectTo?: string; error?: string } | void;

/**
 * Next signals redirect() and notFound() from a Server Action by throwing an
 * error carrying a `digest`. Those must propagate or the navigation is
 * swallowed and the user is stranded.
 */
function isFrameworkNavigation(err: unknown): boolean {
  const digest = (err as { digest?: unknown })?.digest;
  return typeof digest === 'string' && digest.startsWith('NEXT_');
}

/**
 * Turns the sentinel messages the guards throw into something a person can act
 * on. Anything unrecognised falls back to a generic line rather than leaking an
 * internal message or a stack.
 */
function friendly(message: string): string {
  if (message.includes('UNAUTHENTICATED')) {
    return 'Your session has expired. Please sign in again.';
  }
  if (message.includes('FORBIDDEN')) {
    return "You don't have permission to do that.";
  }
  if (message.includes('TENANT_INACTIVE')) {
    return 'This academy is not currently active. Please contact support.';
  }
  if (message.includes('TENANT_MISMATCH') || message.includes('TENANT_NOT_FOUND')) {
    return 'That academy could not be found.';
  }
  if (message.includes('Enrollment not found')) {
    return 'We could not find your enrolment for this course. Reload the page and try again.';
  }
  if (message.includes('Lesson not found')) {
    return 'That lesson is no longer part of this course. Reload the page.';
  }
  // Validator messages ('Invalid role.', 'Price cannot be negative.') are
  // already written for humans — short, punctuated, no internals.
  if (message.length < 120 && !message.includes('\n') && !/\bat\s+\//.test(message)) {
    return message;
  }
  return 'Something went wrong. Please reload and try again.';
}

/**
 * A <form> whose Server Action returns a { redirectTo } target that we navigate
 * to CLIENT-SIDE (router.push). Server Action `redirect()` does not apply the
 * middleware subdomain rewrite (it 404s on rewritten tenant paths), but client
 * navigation does — so actions return the target and we push it here.
 */
export function NavForm({
  action,
  children,
  className,
  confirm,
}: {
  action: (formData: FormData) => Promise<ActionResult>;
  children: React.ReactNode;
  className?: string;
  confirm?: string;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (confirm && !window.confirm(confirm)) return;
    const formData = new FormData(e.currentTarget);
    setError(null);
    startTransition(async () => {
      try {
        const result = await action(formData);
        if (result && 'error' in result && result.error) {
          setError(result.error);
          return;
        }
        if (result && 'redirectTo' in result && result.redirectTo) {
          router.push(result.redirectTo);
          router.refresh();
        } else {
          router.refresh();
        }
      } catch (err) {
        // Without this, a THROWN action (as opposed to one returning {error})
        // became an unhandled rejection: no message, no navigation, the button
        // simply appeared inert. Several actions throw by design —
        // requireAdmin() on FORBIDDEN, verifyEnrollment on a stale enrollment id,
        // the input validators — so this was the difference between "your session
        // expired" and "this button is broken".
        if (isFrameworkNavigation(err)) throw err;
        console.error('[action failed]', err);
        setError(
          err instanceof Error && err.message
            ? friendly(err.message)
            : 'Something went wrong. Please reload and try again.',
        );
      }
    });
  }

  return (
    <form onSubmit={onSubmit} className={className} data-pending={pending || undefined}>
      {children}
      {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
    </form>
  );
}
