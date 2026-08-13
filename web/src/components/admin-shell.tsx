'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import { Menu } from 'lucide-react';
import { ADMIN_NAV } from '@/lib/nav';
import { BrandMark } from '@/components/brand-mark';
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { SignOutButton } from '@/components/sign-out-button';
import { ThemeToggle } from '@/components/theme-toggle';
import { SkipLink } from '@/components/skip-link';
import { cn } from '@/components/ui/utils';

const ADMIN_BASE = '/admin';

/**
 * Admin layout shell: brand mark + grouped sidebar nav on desktop, a mobile
 * top bar with a slide-in drawer on small screens. Live items link to real
 * routes; gated items route to the coming-soon panel with a "Soon" badge.
 * Subdomain middleware maps `/admin/*` to the internal `/t/[slug]/admin/*` tree.
 */
/** Whole-path-segment match, so '/admin/courses' never lights '/admin/courses-archive'. */
function itemIsActive(item: { href: string; status: string }, activePath: string): boolean {
  const href = `${ADMIN_BASE}${item.href}`;
  const base = href.split('?')[0];
  const target = item.href.split('?')[0];
  return (
    item.status === 'live' &&
    (target === ''
      ? activePath === ADMIN_BASE
      : base !== ADMIN_BASE && (activePath === base || activePath.startsWith(`${base}/`)))
  );
}

function NavRow({
  item,
  activePath,
  onNavigate,
  sub = false,
}: {
  item: (typeof ADMIN_NAV)[number]['items'][number];
  activePath: string;
  onNavigate?: () => void;
  sub?: boolean;
}) {
  const isActive = itemIsActive(item, activePath);
  return (
    <li>
      <Link
        href={`${ADMIN_BASE}${item.href}`}
        onClick={onNavigate}
        aria-current={isActive ? 'page' : undefined}
        className={cn(
          // Current item = ink label + a 1.75px ink underline hugging the
          // text, per the RESOLVED side-nav grammar: text-forward, NO
          // block-background wash and NO side-bar on the current item.
          // Square, not rounded — "Navigation hover/selection is square".
          //
          // Measured against core.css, not inferred:
          //   `.sb-nav a`    height:42px; padding:0 20px; 13.5/500; text-2
          //   `.sb-subnav a` height:37px; padding-left:32px; 12.5/500; text-3
          // Sub rows sit inside a section (see NavSection) and recede a step
          // in both size and tone so the section rows read as the structure.
          'flex items-center justify-between transition-colors',
          sub
            ? 'h-[37px] pl-8 pr-5 text-meta'
            : // text-control (13.5) is the system's named size for nav/controls.
              'h-[42px] px-5 text-control',
          isActive
            ? // `.sb-nav a.is-active`: ink, 600, underline
              // text-decoration-thickness:1.75px; text-underline-offset:5px.
              'font-semibold text-foreground underline decoration-primary decoration-[1.75px] underline-offset-[5px]'
            : // `.sb-nav a:hover { background:var(--sunken); color:var(--text) }`
              // — the wash belongs on HOVER; core.css is unambiguous here and
              // `.sb-nav` has no :active rule at all.
              cn(
                'font-medium hover:bg-surface-muted hover:text-foreground',
                sub ? 'text-muted' : 'text-foreground-2',
              ),
        )}
      >
        <span className="truncate">{item.label}</span>
        {item.status === 'gated' && (
          // 11px is the eyebrow, the smallest size the ramp has.
          <span className="ml-2 rounded-sm bg-surface-muted px-2 py-0.5 text-eyebrow font-semibold text-muted">
            Soon
          </span>
        )}
      </Link>
    </li>
  );
}

/**
 * The RESOLVED side-menu grammar (the design system's Navigation page): plain
 * rows for top-level items, and collapsible SECTIONS — `.sb-navsec` rows with
 * a right chevron that rotates open, their children bracketed by hairlines
 * (`.sb-subnav`) — instead of the legacy uppercase `.grp` micro-labels. The
 * section row is a real button (aria-expanded), not a label.
 *
 * Default state: sections with a live item open, all-gated sections collapsed
 * — the menu's breadth stays discoverable (it is a sales asset, per nav.ts)
 * without 42 rows of "Soon" burying the six screens that exist. A section
 * containing the current page always starts open.
 */
function NavSection({
  group,
  activePath,
  onNavigate,
}: {
  group: (typeof ADMIN_NAV)[number];
  activePath: string;
  onNavigate?: () => void;
}) {
  const hasLive = group.items.some((i) => i.status === 'live');
  const hasActive = group.items.some((i) => itemIsActive(i, activePath));
  const [open, setOpen] = useState(hasLive || hasActive);

  return (
    <li>
      <button
        type="button"
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
        className={cn(
          // `.sb-navsec`: same 42px row as a nav item; open = ink + 600 with
          // the chevron turned down; hover darkens label and chevron. No wash
          // — core.css gives the section row a colour transition only.
          'flex h-[42px] w-full items-center justify-between px-5 text-control transition-colors',
          open
            ? 'font-semibold text-foreground'
            : 'font-medium text-foreground-2 hover:text-foreground',
        )}
      >
        <span className="truncate">{group.label}</span>
        {/* Collapsed points RIGHT; open rotates to point down (core.css). */}
        <svg
          aria-hidden="true"
          width="13"
          height="13"
          viewBox="0 0 16 16"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.7"
          strokeLinecap="round"
          className={cn('shrink-0 text-muted transition-transform', open && 'rotate-90')}
        >
          <path d="M6 4l4 4-4 4" />
        </svg>
      </button>
      {open && (
        // `.sb-subnav`: hairline rules top and bottom bracket the expanded
        // children — the light --border-2 divider, never the keyline.
        <ul className="my-[3px] border-y border-border py-[3px]">
          {group.items.map((item) => (
            <NavRow key={item.id} item={item} activePath={activePath} onNavigate={onNavigate} sub />
          ))}
        </ul>
      )}
    </li>
  );
}

function NavLinks({ activePath, onNavigate }: { activePath: string; onNavigate?: () => void }) {
  return (
    /*
      Full-bleed rows, per core.css. `.sb-side` pads 12px vertically and ZERO
      horizontally, and `.sb-nav a` carries its own 20px inset — so the hover wash
      spans the whole sidebar as a band. `.sb-nav { gap: 0 }` — the rows do the
      separating.
    */
    <nav className="flex-1 overflow-y-auto py-3">
      <ul>
        {ADMIN_NAV.map((group) =>
          // A single-item group is a plain top-level row — the resolved page
          // shows Dashboard as a bare item, and a one-child section head whose
          // label duplicates its child is furniture.
          group.items.length === 1 ? (
            <NavRow
              key={group.id}
              item={group.items[0]}
              activePath={activePath}
              onNavigate={onNavigate}
            />
          ) : (
            <NavSection
              key={group.id}
              group={group}
              activePath={activePath}
              onNavigate={onNavigate}
            />
          ),
        )}
      </ul>
    </nav>
  );
}

function Brand({ tenantName }: { tenantName: string }) {
  return (
    <div className="flex items-center gap-2.5 border-b border-border px-4 py-4">
      <BrandMark size={32} />
      <div className="min-w-0">
        <p className="truncate text-sm font-semibold leading-tight">{tenantName}</p>
        <p className="text-meta text-muted">Academy admin</p>
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
      <SkipLink />

      {/* Desktop sidebar */}
      <aside
        aria-label="Admin navigation"
        // 248px, per core.css `.sb-side { width: 248px }`. w-64 is 256.
        className="hidden w-62 flex-col border-r border-border bg-surface lg:flex"
      >
        <Brand tenantName={tenantName} />
        <NavLinks activePath={activePath} />
        <div className="border-t border-border px-4 py-3">
          <ThemeToggle className="mb-2.5" />
          {userEmail && <p className="truncate text-meta text-muted">{userEmail}</p>}
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
                <ThemeToggle className="mb-2.5" />
                {userEmail && <p className="truncate text-meta text-muted">{userEmail}</p>}
                <SignOutButton className="mt-1.5" />
              </div>
            </SheetContent>
          </Sheet>
          <span className="flex items-center gap-2 font-semibold">
            <BrandMark size={28} />
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
