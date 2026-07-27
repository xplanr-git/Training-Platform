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
        'inline-flex items-center gap-1.5 text-sm text-muted transition-colors hover:text-foreground disabled:opacity-50',
        className,
      )}
    >
      <LogOut className="h-4 w-4" />
      {pending ? 'Signing out…' : 'Sign out'}
    </button>
  );
}
