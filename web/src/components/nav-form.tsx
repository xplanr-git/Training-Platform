'use client';

import { useRouter } from 'next/navigation';
import { useState, useTransition } from 'react';

type ActionResult = { redirectTo?: string; error?: string } | void;

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
    });
  }

  return (
    <form onSubmit={onSubmit} className={className} data-pending={pending || undefined}>
      {children}
      {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
    </form>
  );
}
