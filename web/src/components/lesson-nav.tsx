import Link from 'next/link';
import { Check, Video, FileText, HelpCircle, BookOpen } from 'lucide-react';
import { cn } from '@/components/ui/utils';

const LESSON_ICON: Record<string, typeof Video> = {
  video: Video,
  pdf: FileText,
  quiz: HelpCircle,
  text: BookOpen,
};

export type OutlineSection = {
  id: string;
  title: string | null;
  items: { id: string; title: string | null; type: string }[];
};

/**
 * The course's lesson list, as shown beside the player.
 *
 * Extracted so the desktop sidebar and the mobile disclosure render the same thing.
 * Before this, the sidebar was `hidden lg:block` and the mobile substitute was a back
 * link and a progress bar — so on a phone the course structure was simply gone. A
 * contractor on site could not see which lesson they were on, how many were left, or
 * jump to another one; the only way through was prev/next at the bottom, or back out
 * to the outline page and in again.
 *
 * Rows are `py-3 lg:py-1.5`: a 44px target on a phone, and the original 32px in the
 * desktop sidebar where a pointer is doing the work and vertical space is scarcer.
 */
export function LessonNav({
  sections,
  courseSlug,
  currentLessonId,
  completed,
}: {
  sections: OutlineSection[];
  courseSlug: string;
  currentLessonId: string;
  completed: ReadonlySet<string>;
}) {
  return (
    <nav className="space-y-4">
      {sections.map((g) => (
        <div key={g.id}>
          <p className="mb-1 px-1 text-[11px] font-semibold uppercase tracking-wider text-muted">
            {g.title || 'Section'}
          </p>
          <ul className="space-y-0.5">
            {g.items.map((l) => {
              const Icon = LESSON_ICON[l.type] ?? BookOpen;
              const isCurrent = l.id === currentLessonId;
              const lDone = completed.has(l.id);
              return (
                <li key={l.id}>
                  <Link
                    href={`/learn/${courseSlug}/${l.id}`}
                    aria-current={isCurrent ? 'page' : undefined}
                    className={cn(
                      'flex items-center gap-2 rounded-md px-2 py-3 text-sm transition-colors lg:py-1.5',
                      isCurrent
                        ? 'bg-brand-50 font-medium text-brand-700'
                        : 'text-foreground hover:bg-surface-muted',
                    )}
                  >
                    {lDone ? (
                      <Check aria-hidden="true" className="h-4 w-4 shrink-0 text-brand-600" />
                    ) : (
                      <Icon aria-hidden="true" className="h-4 w-4 shrink-0 text-muted" />
                    )}
                    <span className="truncate">{l.title || 'Untitled'}</span>
                    {lDone && <span className="sr-only">(completed)</span>}
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
