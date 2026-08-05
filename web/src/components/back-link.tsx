import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { cn } from '@/components/ui/utils';

/**
 * The "back to where I came from" link, which appeared nine times with an identical
 * hand-written class string and measured 20px tall — under WCAG 2.2's 24px minimum
 * (2.5.8), never mind the 44px this project asks for. On the course landing it is the
 * only way back, and the people using it are on a phone on a building site.
 *
 * The trick is `py-3` for a 44px hit area with `-my-1.5` giving 12px of it back to
 * the layout, so the target is 44px tall while the page rhythm stays as it was. A
 * bigger target here should not push the heading down the page.
 *
 * `-ml-2` offsets the horizontal padding so the text still aligns with the content
 * column, exactly as it did without padding.
 */
export function BackLink({
  href,
  children,
  className,
}: {
  href: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <Link
      href={href}
      className={cn(
        '-my-1.5 -ml-2 inline-flex items-center gap-1.5 rounded-md px-2 py-3 text-sm text-muted transition-colors hover:bg-surface-muted hover:text-foreground',
        className,
      )}
    >
      <ArrowLeft aria-hidden="true" className="h-4 w-4 shrink-0" />
      <span className="truncate">{children}</span>
    </Link>
  );
}
