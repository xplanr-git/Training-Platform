'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import { ADMIN_NAV } from '@/lib/nav';

const ADMIN_BASE = '/admin';

/**
 * Admin layout shell: grouped sidebar nav + content area. Live items link to
 * real routes; gated items route to the coming-soon panel with a "Soon" badge.
 * Subdomain middleware maps `/admin/*` to the internal `/t/[slug]/admin/*` tree.
 */
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
  const [collapsed, setCollapsed] = useState(false);

  // The browser path drops the /t/[slug] prefix (added by rewrite), so compare
  // against the trailing /admin/... segment.
  const activePath = pathname.replace(/^\/t\/[^/]+/, '');

  return (
    <div className="flex min-h-screen bg-surface-muted">
      <aside
        className={`flex flex-col border-r border-border bg-surface transition-all ${
          collapsed ? 'w-16' : 'w-64'
        }`}
      >
        <div className="flex items-center justify-between border-b border-border p-4">
          {!collapsed && (
            <div className="min-w-0">
              <p className="truncate font-semibold">{tenantName}</p>
              <p className="text-xs text-muted">Admin</p>
            </div>
          )}
          <button
            onClick={() => setCollapsed((c) => !c)}
            aria-label="Toggle sidebar"
            className="rounded p-1 text-muted hover:bg-surface-muted"
          >
            {collapsed ? '»' : '«'}
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto p-2">
          {ADMIN_NAV.map((group) => (
            <div key={group.id} className="mb-4">
              {!collapsed && (
                <p className="px-2 py-1 text-xs font-medium uppercase tracking-wide text-muted">
                  {group.label}
                </p>
              )}
              <ul>
                {group.items.map((item) => {
                  const href = `${ADMIN_BASE}${item.href}`;
                  const base = href.split('?')[0];
                  const isActive =
                    base === `${ADMIN_BASE}` + (item.href.split('?')[0] || '')
                      ? activePath === base
                      : activePath.startsWith(base) && base !== ADMIN_BASE;
                  return (
                    <li key={item.id}>
                      <Link
                        href={href}
                        className={`flex items-center justify-between rounded px-2 py-1.5 text-sm ${
                          isActive
                            ? 'bg-brand-50 font-medium text-brand-700'
                            : 'text-foreground hover:bg-surface-muted'
                        }`}
                      >
                        {!collapsed && <span className="truncate">{item.label}</span>}
                        {!collapsed && item.status === 'gated' && (
                          <span className="ml-2 rounded bg-neutral-100 px-1.5 py-0.5 text-[10px] text-muted">
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

        {!collapsed && (
          <div className="border-t border-border p-4 text-xs text-muted">
            <p className="truncate">{userEmail}</p>
          </div>
        )}
      </aside>

      <main className="flex-1 overflow-y-auto p-8">{children}</main>
    </div>
  );
}
