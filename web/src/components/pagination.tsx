import Link from 'next/link';
import type { PageMeta } from '@/lib/pagination';

/**
 * Prev/next pager for admin list pages. Preserves existing query params (e.g.
 * the search `q`) while changing `page`. Renders nothing for a single page.
 */
export function Pagination({
  meta,
  basePath,
  params = {},
}: {
  meta: PageMeta;
  /** Path to link to, e.g. `/admin/courses`. */
  basePath: string;
  /** Other query params to preserve (search term, filters). */
  params?: Record<string, string | undefined>;
}) {
  if (meta.pageCount <= 1) return null;

  const href = (page: number) => {
    const sp = new URLSearchParams();
    for (const [k, v] of Object.entries(params)) {
      if (v) sp.set(k, v);
    }
    sp.set('page', String(page));
    return `${basePath}?${sp.toString()}`;
  };

  /*
   * These are controls, so they take --color-input (3.59:1) for their edge, not
   * the decorative --color-border (1.12:1) they had. 1.4.11 governs what marks a
   * component's extent, and a pager button whose boundary is invisible is a
   * button you have to guess the edges of. Hover darkens the edge rather than
   * filling it, matching Button's outline variant so the two read as one family.
   */
  const linkClass =
    'inline-flex h-9 items-center rounded-md border border-input px-3 text-control font-semibold text-foreground-2 transition-colors hover:border-foreground hover:text-foreground';
  const disabledClass =
    'inline-flex h-9 items-center rounded-md border border-border px-3 text-control font-semibold text-muted opacity-50';

  return (
    <nav className="mt-4 flex items-center justify-between" aria-label="Pagination">
      <p className="text-sm text-muted tabular-nums">
        Page {meta.page} of {meta.pageCount} · {meta.total} total
      </p>
      <div className="flex gap-2">
        {meta.hasPrev ? (
          <Link href={href(meta.page - 1)} className={linkClass} rel="prev">
            Previous
          </Link>
        ) : (
          <span className={disabledClass} aria-disabled="true">
            Previous
          </span>
        )}
        {meta.hasNext ? (
          <Link href={href(meta.page + 1)} className={linkClass} rel="next">
            Next
          </Link>
        ) : (
          <span className={disabledClass} aria-disabled="true">
            Next
          </span>
        )}
      </div>
    </nav>
  );
}
