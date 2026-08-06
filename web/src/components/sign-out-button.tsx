'use client';

import { useTransition } from 'react';
import { LogOut } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { cn } from '@/components/ui/utils';

/**
 * Signs the user out and returns them to the login page. Dealers often share
 * site/office machines, so this needs to be reachable from every signed-in
 * surface (admin sidebar + learner header).
 */
export function SignOutButton({ className }: { className?: string }) {
  const [pending, startTransition] = useTransition();

  function onClick() {
    startTransition(async () => {
      // Local scope: clears this browser's session without a round trip to
      // Supabase to revoke the refresh token everywhere. The reason this button
      // exists is a shared site or office machine, and clearing the cookie is
      // exactly what that needs. Global revocation is the stronger guarantee —
      // it signs you out on your phone too — but it is a network call the person
      // waits on, and it is not what "get me out of this browser" means.
      await createClient().auth.signOut({ scope: 'local' });

      // A HARD navigation, not router.push + router.refresh.
      //
      // Those cost two server round trips: one to fetch /login's payload, and
      // one for refresh() to re-render the route being left — which, since `/`
      // started landing on the catalogue, is the slowest page in the app
      // (measured: 854ms warm, 2.9s cold). So the button sat on "Signing out…"
      // re-rendering a page nobody was going to look at.
      //
      // Replacing the document also guarantees no client-side cache survives
      // holding a signed-in render, and replace() rather than assign() keeps
      // Back from returning to a page that no longer has a session.
      window.location.replace('/login');
    });
  }

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={pending}
      className={cn(
        // Padding, not just text: measured at 20px tall, under WCAG 2.2's 24px
        // minimum target size (2.5.8). It matters most exactly where it is smallest —
        // the mobile admin drawer, on a phone, on site. The negative inset keeps it
        // optically aligned with the text above it despite the new padding.
        'inline-flex -ml-1.5 items-center gap-1.5 rounded-md px-1.5 py-1.5 text-sm text-muted transition-colors hover:bg-surface-muted hover:text-foreground disabled:opacity-50',
        className,
      )}
    >
      <LogOut className="h-4 w-4" />
      {pending ? 'Signing out…' : 'Sign out'}
    </button>
  );
}
