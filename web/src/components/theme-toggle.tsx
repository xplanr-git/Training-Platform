'use client';

import { useEffect, useState } from 'react';

import { cn } from '@/components/ui/utils';
import {
  segmentedItem,
  segmentedItemActive,
  segmentedItemResting,
  segmentedTray,
} from '@/components/ui/segmented';

/**
 * The theme switch, as the design system's segmented control — the Reference
 * page shows exactly this trio (Light | Dark | Auto) as its segmented
 * specimen. Buttons, not links: theme is client state, not a URL.
 *
 * The chosen mode lives in localStorage('theme'); the boot script in
 * layout.tsx applies it before first paint, and this component keeps the
 * <html> class in sync afterwards. 'auto' (the default) follows
 * prefers-color-scheme live — the matchMedia listener below is what makes an
 * OS-level switch take effect without a reload.
 *
 * Renders nothing until mounted: the server cannot know localStorage, so any
 * server-rendered "active" segment would be a guess that hydration then has
 * to defend. A ~50ms pop-in on a tertiary control is cheaper than a wrong
 * initial state.
 */
type Mode = 'light' | 'dark' | 'auto';
const MODES: Mode[] = ['light', 'dark', 'auto'];

function apply(mode: Mode) {
  const dark =
    mode === 'dark' ||
    (mode === 'auto' && window.matchMedia('(prefers-color-scheme: dark)').matches);
  document.documentElement.classList.toggle('dark', dark);
}

function ThemeToggle({ className }: { className?: string }) {
  const [mode, setMode] = useState<Mode | null>(null);

  useEffect(() => {
    const stored = localStorage.getItem('theme');
    setMode(stored === 'dark' || stored === 'light' ? stored : 'auto');
  }, []);

  useEffect(() => {
    if (mode !== 'auto') return;
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const onChange = () => apply('auto');
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, [mode]);

  if (mode === null) return null;

  function choose(next: Mode) {
    setMode(next);
    localStorage.setItem('theme', next);
    apply(next);
  }

  return (
    <div role="group" aria-label="Colour theme" className={cn(segmentedTray, className)}>
      {MODES.map((m) => (
        <button
          key={m}
          type="button"
          aria-pressed={mode === m}
          onClick={() => choose(m)}
          className={cn(
            segmentedItem,
            'py-1 capitalize',
            mode === m ? segmentedItemActive : segmentedItemResting,
          )}
        >
          {m}
        </button>
      ))}
    </div>
  );
}

export { ThemeToggle };
