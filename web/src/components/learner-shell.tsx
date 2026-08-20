import Link from 'next/link';
import { GraduationCap } from 'lucide-react';
import { SignOutButton } from '@/components/sign-out-button';
import { cn } from '@/components/ui/utils';

/**
 * The learner's persistent product chrome. The beta's biggest orientation gap
 * was "where am I / how do I get home / where's my training / how do I get
 * help" — this header answers all four on every learner "app" page (Home, My
 * training, Help, Account). Deliberately light: a wordmark that returns Home,
 * four destinations, and sign-out. Not an enterprise sidebar.
 *
 * The learning FLOW pages (course map, lesson) keep their own focused back-nav;
 * they carry a compact Home + Get help affordance instead of this full bar so
 * the video stays the focus.
 */
type Item = 'home' | 'training' | 'help' | 'account';

export function LearnerShell({
  slug,
  tenantName,
  active,
}: {
  slug: string;
  tenantName: string;
  active?: Item;
}) {
  const base = `/t/${slug}`;
  const nav: { key: Item; label: string; href: string }[] = [
    { key: 'home', label: 'Home', href: `${base}/dashboard` },
    { key: 'training', label: 'My training', href: `${base}/training` },
    { key: 'help', label: 'Help', href: `${base}/help` },
    { key: 'account', label: 'Account', href: `${base}/account` },
  ];
  return (
    <header className="border-border border-b">
      <div className="mx-auto flex max-w-3xl flex-col gap-3 px-6 py-3 sm:flex-row sm:items-center sm:justify-between">
        <Link
          href={`${base}/dashboard`}
          className="text-foreground inline-flex items-center gap-2 font-semibold"
        >
          <GraduationCap aria-hidden="true" className="h-5 w-5" />
          <span className="truncate">{tenantName}</span>
        </Link>
        {/* -mx-2 lets the tap padding bleed to the row edge on mobile without
            widening the row; flex-wrap + tighter mobile padding keeps all five
            destinations on-screen at 375 (no horizontal overflow). */}
        <nav className="-mx-2 flex flex-wrap items-center gap-x-1 gap-y-0.5 text-sm">
          {nav.map((n) => (
            <Link
              key={n.key}
              href={n.href}
              aria-current={active === n.key ? 'page' : undefined}
              className={cn(
                'inline-flex min-h-11 items-center rounded-sm px-2 font-semibold transition-colors sm:min-h-0 sm:px-3 sm:py-1.5',
                active === n.key
                  ? 'text-foreground underline decoration-primary decoration-[1.75px] underline-offset-[5px]'
                  : 'text-foreground-2 hover:text-foreground',
              )}
            >
              {n.label}
            </Link>
          ))}
          <SignOutButton className="text-foreground-2 hover:text-foreground inline-flex min-h-11 items-center gap-1.5 rounded-sm px-2 text-sm font-semibold transition-colors sm:min-h-0 sm:px-3 sm:py-1.5" />
        </nav>
      </div>
    </header>
  );
}
