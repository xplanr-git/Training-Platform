'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import { Menu, GraduationCap } from 'lucide-react';
import { ADMIN_NAV } from '@/lib/nav';
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { SignOutButton } from '@/components/sign-out-button';
import { cn } from '@/components/ui/utils';

const ADMIN_BASE = '/admin';

/**
 * Admin layout shell: brand mark + grouped sidebar nav on desktop, a mobile
 * top bar with a slide-in drawer on small screens. Live items link to real
 * routes; gated items route to the coming-soon panel with a "Soon" badge.
 * Subdomain middleware maps `/admin/*` to the internal `/t/[slug]/admin/*` tree.
 */
function NavLinks({
  activePath,
  onNavigate,
}: {
  activePath: string;
  onNavigate?: () => void;
}) {
  return (
    <nav className="flex-1 overflow-y-auto px-3 py-4">
      {ADMIN_NAV.map((group) => (
        <div key={group.id} className="mb-5">
          <p className="px-2 pb-1 text-[11px] font-semibold uppercase tracking-wider text-muted">
            {group.label}
          </p>
          <ul className="space-y-0.5">
            {group.items.map((item) => {
              const href = `${ADMIN_BASE}${item.href}`;
              const base = href.split('?')[0];
              const target = item.href.split('?')[0];
              // Match on whole path SEGMENTS. A bare startsWith would light up
              // '/admin/courses' for a hypothetical '/admin/courses-archive', and
              // would light up two items at once as soon as one nav path is a
              // prefix of another. No nav path collides today, which is exactly
              // why this would have gone unnoticed until one did.
              const isActive =
                item.status === 'live' &&
                (target === ''
                  ? activePath === ADMIN_BASE
                  : base !== ADMIN_BASE &&
                    (activePath === base || activePath.startsWith(`${base}/`)));
              return (
                <li key={item.id}>
                  <Link
                    href={href}
                    onClick={onNavigate}
                    aria-current={isActive ? 'page' : undefined}
                    className={cn(
                      'flex items-center justify-between rounded-md px-2.5 py-2 text-sm transition-colors',
                      isActive
                        ? 'bg-brand-50 font-medium text-brand-700'
                        : 'text-foreground hover:bg-surface-muted',
                    )}
                  >
                    <span className="truncate">{item.label}</span>
                    {item.status === 'gated' && (
                      <span className="ml-2 rounded bg-surface-muted px-1.5 py-0.5 text-[10px] font-medium text-muted">
                        Soon
                      </span>
                    )}
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      ))}
    </nav>
  );
}

function Brand({ tenantName }: { tenantName: string }) {
  return (
    <div className="flex items-center gap-2.5 border-b border-border px-4 py-4">
      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-brand-600 text-white">
        <GraduationCap className="h-4 w-4" />
      </span>
      <div className="min-w-0">
        <p className="truncate text-sm font-semibold leading-tight">{tenantName}</p>
        <p className="text-xs text-muted">Academy admin</p>
      </div>
    </div>
  );
}

export function AdminShell({
  tenantName,
  userEmail,
  children,
}: {
  tenantName: string;
  userEmail: string | null;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  // The browser path drops the /t/[slug] prefix (added by rewrite).
  const activePath = pathname.replace(/^\/t\/[^/]+/, '');

  return (
    /*
      h-dvh, not min-h-screen. Both the sidebar nav and <main> already carry
      `flex-1 overflow-y-auto`, which can only engage if their container has a
      DEFINITE height — with min-h-screen the container grows with its content, so
      neither ever scrolled internally. With 42 nav items the aside simply made the
      document longer, pushing the email and sign-out footer off the bottom of a
      long page instead of pinning it.

      dvh rather than vh because the admin area is used on phones, where the
      browser's collapsing toolbar makes 100vh taller than the visible viewport.
    */
    <div className="flex h-dvh overflow-hidden bg-surface-muted">
      <a href="#main-content" className="sr-only skip-link">
        Skip to content
      </a>

      {/* Desktop sidebar */}
      <aside
        aria-label="Admin navigation"
        className="hidden w-64 flex-col border-r border-border bg-surface lg:flex"
      >
        <Brand tenantName={tenantName} />
        <NavLinks activePath={activePath} />
        <div className="border-t border-border px-4 py-3">
          {userEmail && <p className="truncate text-xs text-muted">{userEmail}</p>}
          <SignOutButton className="mt-1.5" />
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        {/* Mobile top bar */}
        <header className="flex items-center gap-3 border-b border-border bg-surface px-4 py-3 lg:hidden">
          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger
              aria-label="Open navigation"
              className="rounded-md p-1.5 text-foreground hover:bg-surface-muted"
            >
              <Menu className="h-5 w-5" />
            </SheetTrigger>
            <SheetContent side="left" className="flex w-72 flex-col gap-0 p-0">
              <SheetTitle className="sr-only">Admin navigation</SheetTitle>
              <Brand tenantName={tenantName} />
              <NavLinks activePath={activePath} onNavigate={() => setOpen(false)} />
              {/*
                Same footer as the desktop aside. It existed only there, so on a
                phone there was no way to sign out of the admin area at all —
                the drawer is the only navigation a mobile admin has.
              */}
              <div className="mt-auto border-t border-border px-4 py-3">
                {userEmail && <p className="truncate text-xs text-muted">{userEmail}</p>}
                <SignOutButton className="mt-1.5" />
              </div>
            </SheetContent>
          </Sheet>
          <span className="flex items-center gap-2 font-semibold">
            <GraduationCap className="h-5 w-5 text-brand-600" />
            {tenantName}
          </span>
        </header>

        <main id="main-content" className="flex-1 overflow-y-auto p-6 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  );
}
