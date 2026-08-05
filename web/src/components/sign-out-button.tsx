'use client';

import { useRouter } from 'next/navigation';
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
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function onClick() {
    startTransition(async () => {
      await createClient().auth.signOut();
      router.push('/login');
      router.refresh();
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
