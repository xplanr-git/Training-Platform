'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useRef, useState, useTransition } from 'react';
import { ActionError } from '@/lib/action-errors';
import { cn } from '@/components/ui/utils';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

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
 * Splits a confirm message into a heading and the rest for the dialog: the first
 * sentence becomes the title, the remainder the description. Confirms already
 * name the consequence in a second sentence (copy-conventions enforces it), so
 * both parts are populated; the fallback covers a single-sentence message.
 */
function splitConfirm(text: string): { title: string; body: string } {
  const m = text.match(/^(.*?[?.!])\s+([\s\S]+)$/);
  return m ? { title: m[1], body: m[2] } : { title: 'Please confirm', body: text };
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
  const [confirmOpen, setConfirmOpen] = useState(false);
  // The FormData captured at submit, held while the confirm dialog is open. A
  // ref, not state: it must survive the render the dialog triggers without being
  // one, and it is read once on confirm.
  const pendingData = useRef<FormData | null>(null);

  function run(formData: FormData) {
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

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    // Confirm through the in-app AlertDialog, NOT window.confirm — which is
    // off-brand and not theme-aware, and whose real hazard is that once the
    // browser offers "prevent this page from creating additional dialogs" and a
    // busy admin ticks it, EVERY window.confirm silently returns false. The
    // action then never fired, and on a `quiet` form there was no feedback at
    // all, so it read as "delete is broken".
    if (confirm) {
      pendingData.current = formData;
      setConfirmOpen(true);
      return;
    }
    run(formData);
  }

  function onConfirm() {
    const formData = pendingData.current;
    pendingData.current = null;
    setConfirmOpen(false);
    if (formData) run(formData);
  }

  const dialog = confirm ? splitConfirm(confirm) : null;

  // Auto-clear the confirmation so it reads as "that just happened" rather than
  // becoming permanent furniture that stops being noticed.
  useEffect(() => {
    if (!saved) return;
    const t = setTimeout(() => setSaved(false), 4000);
    return () => clearTimeout(t);
  }, [saved]);

  return (
    <form
      onSubmit={onSubmit}
      className={cn(className, 'data-[pending]:opacity-60')}
      data-pending={pending || undefined}
    >
      {/*
        A disabled fieldset is the one reliable way to make every control inside
        an arbitrary `children` tree go inert while the action is in flight —
        including the submit button, whose markup this component never sees.

        display: contents, and this is load-bearing: the caller's layout classes
        (`flex flex-col gap-5`) land on the <form>, whose only child is this
        fieldset — so with a normal box the fields inside received NO gap and
        every NavForm-based admin form rendered with its fields jammed together.
        With `contents` the children participate in the form's layout directly
        (and the status notes below join the same flow). A contents box paints
        nothing, so the in-flight dim rides on the form via data-pending instead
        of fieldset:disabled.
      */}
      <fieldset disabled={pending} aria-busy={pending || undefined} className="contents">
        {children}
      </fieldset>

      <div aria-live="polite" className="contents">
        {pending && !quiet && <p className="mt-1 text-sm text-muted">Saving…</p>}
        {saved && !pending && !quiet && <p className="text-status-green mt-1 text-sm">Saved.</p>}
        {error && (
          <p role="alert" className="mt-1 text-sm text-destructive">
            {error}
          </p>
        )}
      </div>

      {/*
        Portaled out of the form by Radix, so it never nests a form or affects the
        inline layout of a row of icon buttons — the reason `quiet` forms could not
        have used an inline confirmation before.
      */}
      {dialog && (
        <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>{dialog.title}</AlertDialogTitle>
              <AlertDialogDescription>{dialog.body}</AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={onConfirm}>Confirm</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}
    </form>
  );
}
