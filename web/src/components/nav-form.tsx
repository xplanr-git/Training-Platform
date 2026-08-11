'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState, useTransition } from 'react';
import { ActionError } from '@/lib/action-errors';

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
  if (message.includes(ActionError.UNAUTHENTICATED)) {
    return 'Your session has expired. Please sign in again.';
  }
  if (message.includes(ActionError.FORBIDDEN)) {
    return "You don't have permission to do that.";
  }
  if (message.includes(ActionError.VIEW_AS_READONLY)) {
    return "You're viewing as someone else — exit view-as to make changes.";
  }
  if (message.includes(ActionError.TENANT_INACTIVE)) {
    return 'This academy is switched off, so nothing can be saved. Contact Outdure to switch it back on.';
  }
  if (message.includes(ActionError.TENANT_NOT_FOUND)) {
    return 'That academy could not be found.';
  }
  if (message.includes(ActionError.ENROLLMENT_NOT_FOUND)) {
    return 'We could not find your enrolment for this course. Reload the page and try again.';
  }
  if (message.includes(ActionError.LESSON_NOT_FOUND)) {
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
  quiet,
}: {
  action: (formData: FormData) => Promise<ActionResult>;
  children: React.ReactNode;
  className?: string;
  confirm?: string;
  /**
   * Suppresses the "Saved." confirmation, keeping the in-flight disable and the
   * error message. For actions whose effect is self-evident — reordering a
   * lesson, deleting a row, revoking a certificate — the list visibly changes,
   * so a success line is noise, and in a row of icon buttons it would also
   * break the layout. Errors are never suppressed.
   */
  quiet?: boolean;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (confirm && !window.confirm(confirm)) return;
    const formData = new FormData(e.currentTarget);
    setError(null);
    setSaved(false);
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
          // Nothing on screen necessarily changes after a save, so without an
          // explicit acknowledgement the form looks inert and people click again.
          // (Observed: a course saved five times in 70 seconds because each
          // successful save was silent.)
          setSaved(true);
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

  // Auto-clear the confirmation so it reads as "that just happened" rather than
  // becoming permanent furniture that stops being noticed.
  useEffect(() => {
    if (!saved) return;
    const t = setTimeout(() => setSaved(false), 4000);
    return () => clearTimeout(t);
  }, [saved]);

  return (
    <form onSubmit={onSubmit} className={className} data-pending={pending || undefined}>
      {/*
        A disabled fieldset is the one reliable way to make every control inside
        an arbitrary `children` tree go inert while the action is in flight —
        including the submit button, whose markup this component never sees. The
        reset classes stop the fieldset affecting layout.
      */}
      <fieldset
        disabled={pending}
        aria-busy={pending || undefined}
        className="m-0 min-w-0 border-0 p-0 disabled:opacity-60"
      >
        {children}
      </fieldset>

      <div aria-live="polite" className="contents">
        {pending && !quiet && <p className="mt-1 text-sm text-muted">Saving…</p>}
        {saved && !pending && !quiet && <p className="text-status-green mt-1 text-sm">Saved.</p>}
        {error && (
          <p role="alert" className="mt-1 text-sm text-red-600">
            {error}
          </p>
        )}
      </div>
    </form>
  );
}
