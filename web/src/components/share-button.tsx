'use client';

import { useState } from 'react';
import { Share2, Check } from 'lucide-react';
import { cn } from '@/components/ui/utils';

/**
 * A quiet share utility. Uses the native OS/browser share sheet where available
 * (great on a phone), and falls back to copying the link. No proprietary sharing
 * machinery, no Save/Remind/Send-to-device clutter.
 *
 * `path` is app-relative; the absolute URL is built on the client from the
 * current origin. `variant`: "utility" is a quiet inline text control (Share
 * lesson); "action" is a secondary DS-outline button (Invite a colleague).
 */
export function ShareButton({
  path,
  title,
  text,
  label,
  variant = 'utility',
}: {
  path: string;
  title: string;
  text: string;
  label: string;
  variant?: 'utility' | 'action';
}) {
  const [copied, setCopied] = useState(false);

  async function onClick() {
    const url = new URL(path, window.location.origin).href;
    if (typeof navigator !== 'undefined' && navigator.share) {
      try {
        await navigator.share({ title, text, url });
        return;
      } catch {
        // cancelled or unsupported — fall through to copy
      }
    }
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // last resort: nothing to do; the button simply does nothing rather than error
    }
  }

  const Icon = copied ? Check : Share2;
  const text2 = copied ? 'Link copied' : label;

  if (variant === 'action') {
    return (
      <button
        type="button"
        onClick={onClick}
        className="border-input text-foreground-2 hover:border-foreground hover:text-foreground inline-flex min-h-11 items-center gap-2 rounded-sm border bg-white px-4 text-sm font-semibold transition-colors dark:bg-transparent"
      >
        <Icon aria-hidden="true" className="h-4 w-4" /> {text2}
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'text-foreground-2 hover:text-foreground inline-flex min-h-11 items-center gap-2 text-sm font-semibold transition-colors',
      )}
    >
      <Icon aria-hidden="true" className="h-4 w-4" /> {text2}
    </button>
  );
}
