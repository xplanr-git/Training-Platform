import { clsx, type ClassValue } from 'clsx';
import { extendTailwindMerge } from 'tailwind-merge';

/**
 * tailwind-merge only knows Tailwind's STOCK font-size names (text-sm,
 * text-2xl, …). The design-system ramp tokens (`--text-control`, `--text-h2`,
 * …) generate utilities it has never heard of, and an unknown `text-*` class
 * is classified as a text COLOUR — so `cn('text-control', 'text-primary-foreground')`
 * silently deleted `text-control` as a "conflicting colour". That is how the
 * Button's 13.5px control size vanished at runtime while the source read
 * correctly: the class was stripped in the merge, not overridden in CSS.
 *
 * Every ramp token that exists as a `--text-*` theme variable must be listed
 * here; a missing entry fails silently, in exactly one component, at runtime.
 */
const twMerge = extendTailwindMerge({
  extend: {
    classGroups: {
      'font-size': [
        {
          text: ['display', 'h1', 'h2', 'h3', 'body', 'control', 'meta', 'eyebrow', 'label', 'kpi'],
        },
      ],
    },
  },
});

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
