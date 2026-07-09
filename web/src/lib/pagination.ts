/** Shared pagination math for admin list pages. Pure + unit-tested. */

export const PAGE_SIZE = 25;

export interface PageMeta {
  /** 1-based current page, clamped to [1, pageCount]. */
  page: number;
  /** Total number of matching rows. */
  total: number;
  /** Total number of pages (at least 1, even when empty). */
  pageCount: number;
  /** Rows to skip in the query. */
  offset: number;
  /** Rows to take in the query. */
  limit: number;
  hasPrev: boolean;
  hasNext: boolean;
}

/** Parses a raw `?page=` value into a positive integer, defaulting to 1. */
export function parsePage(raw: string | undefined): number {
  const n = Number(raw);
  if (!Number.isFinite(n) || n < 1) return 1;
  return Math.floor(n);
}

/**
 * Derives pagination metadata from a requested page and a total row count.
 * The requested page is clamped so an out-of-range `?page=` never yields a
 * negative offset or an empty page past the end.
 */
export function pageMeta(
  requestedPage: number,
  total: number,
  pageSize: number = PAGE_SIZE,
): PageMeta {
  const pageCount = Math.max(1, Math.ceil(total / pageSize));
  const page = Math.min(Math.max(1, requestedPage), pageCount);
  const offset = (page - 1) * pageSize;
  return {
    page,
    total,
    pageCount,
    offset,
    limit: pageSize,
    hasPrev: page > 1,
    hasNext: page < pageCount,
  };
}
