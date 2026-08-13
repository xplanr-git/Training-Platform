import type { ReactNode } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { cn } from '@/components/ui/utils';

/**
 * The one empty state.
 *
 * There were five different treatments for "there is nothing here yet" — a Card
 * with centred grey text, a table cell with `colSpan`, a dashed box, a dashed box
 * with a surface background, and a bare `<li>`. The dashed border is kept because
 * two surfaces already used it and it reads as "a container waiting to be filled"
 * rather than "a thing that failed to load".
 *
 * The substantive fix is the title colour. Every previous empty state was muted
 * grey top to bottom, which is the same styling this app uses for disabled and
 * secondary text — so an empty table looked broken rather than new. The title now
 * sits in normal foreground text and the explanation stays muted beneath it.
 *
 * An empty state should answer three questions, in this order: what belongs here,
 * why it is empty, and what to do next. `title` and `children` cover the first
 * two; `action` covers the third and should be present whenever the reader can
 * actually do something.
 */
type Action = { href: string; label: string };

export function EmptyState({
  icon,
  title,
  children,
  action,
  secondary,
  className,
}: {
  icon?: ReactNode;
  title: string;
  children?: ReactNode;
  action?: Action;
  secondary?: Action;
  className?: string;
}) {
  return (
    /*
      An OPEN composition, per core.css `.sb-empty`: generous padding (--s16),
      a 44px sunken icon tile, a 15/800 title over 13ish muted body — and no
      container at all. The previous dashed-border box was off-system twice
      over (dashed appears nowhere in core.css, and a box on the shell is the
      bordered-box look §4b rules out); whitespace does the separating.
    */
    <div className={cn('px-6 py-16 text-center', className)}>
      {icon ? (
        <div
          aria-hidden="true"
          className="mx-auto mb-4 flex h-11 w-11 items-center justify-center rounded-(--radius-card) bg-surface-muted text-muted [&>svg]:h-5 [&>svg]:w-5"
        >
          {icon}
        </div>
      ) : null}
      <p className="text-h3 font-extrabold">{title}</p>
      {children ? (
        <p className="mx-auto mt-1.5 max-w-md text-control leading-relaxed text-muted">
          {children}
        </p>
      ) : null}
      {action || secondary ? (
        <div className="mt-5 flex flex-wrap items-center justify-center gap-2">
          {action ? (
            <Button asChild size="sm">
              <Link href={action.href}>{action.label}</Link>
            </Button>
          ) : null}
          {secondary ? (
            <Button asChild size="sm" variant="outline">
              <Link href={secondary.href}>{secondary.label}</Link>
            </Button>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

/**
 * Empty state for a list nested inside something that already has a border — the
 * builder's lesson list, a course outline. A second dashed box inside a bordered
 * card is visual noise, so this drops the box and keeps the hierarchy: readable
 * title, muted explanation.
 */
export function EmptyRow({
  title,
  children,
  className,
}: {
  title: string;
  children?: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn('px-4 py-8 text-center', className)}>
      <p className="text-sm font-medium">{title}</p>
      {children ? (
        <p className="mx-auto mt-1 max-w-sm text-sm leading-relaxed text-muted">{children}</p>
      ) : null}
    </div>
  );
}

/**
 * A search that matched nothing is NOT the same as a thing that does not exist
 * yet, and conflating them is the most common empty-state mistake: telling
 * someone with 40 courses to "create your first course" because they mistyped a
 * search. Different copy, and a different action — the way out is clearing the
 * search, not creating something.
 */
export function NoMatches({
  query,
  basePath,
  className,
}: {
  query: string;
  basePath: string;
  className?: string;
}) {
  return (
    <EmptyState
      className={className}
      title={`No matches for “${query}”`}
      action={{ href: basePath, label: 'Clear search' }}
    >
      Check the spelling, or try a shorter search — a single word usually works better than a full
      title.
    </EmptyState>
  );
}
