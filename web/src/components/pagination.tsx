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

  const linkClass =
    'rounded-md border border-border px-3 py-1.5 text-sm hover:bg-surface-muted';
  const disabledClass =
    'rounded-md border border-border px-3 py-1.5 text-sm text-muted opacity-50';

  return (
    <nav
      className="mt-4 flex items-center justify-between"
      aria-label="Pagination"
    >
      <p className="text-sm text-muted">
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
