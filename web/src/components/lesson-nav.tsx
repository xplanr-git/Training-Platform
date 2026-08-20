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
  showSectionTitles = true,
}: {
  sections: OutlineSection[];
  courseSlug: string;
  currentLessonId: string;
  completed: ReadonlySet<string>;
  /** Hide the per-section title — used by the lesson page's "In this topic"
   *  block, which is already scoped to one topic and carries its own heading. */
  showSectionTitles?: boolean;
}) {
  return (
    <nav className="space-y-4">
      {sections.map((g) => (
        <div key={g.id}>
          {showSectionTitles && (
            <p className="mb-1 px-1 text-eyebrow font-bold uppercase text-muted">
              {g.title || 'Section'}
            </p>
          )}
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
                      // The RESOLVED side-menu grammar, same as the admin shell:
                      // current = ink label + the 1.75px ink underline hugging
                      // the text — NO side bar, NO block wash, NO radius (all
                      // three are the forbidden selection treatments; this row
                      // carried all three at once). Resting rows sit a step
                      // down and take the square wash on hover only. 13.5 is
                      // the system's named nav/control size.
                      'flex items-center gap-2 px-2 py-3 text-control transition-colors lg:py-1.5',
                      isCurrent
                        ? 'font-semibold text-foreground underline decoration-primary decoration-[1.75px] underline-offset-[5px]'
                        : 'text-foreground-2 hover:bg-surface-muted hover:text-foreground',
                    )}
                  >
                    {lDone ? (
                      <Check aria-hidden="true" className="text-status-green h-4 w-4 shrink-0" />
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
