'use client';

import { useRouter } from 'next/navigation';
import { useState, useTransition } from 'react';
import { ChevronUp, ChevronDown, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

type Move = () => Promise<void>;

/**
 * Up/down controls for one row of an ordered list.
 *
 * These were two separate NavForms, one per chevron, and that produced three
 * problems that all look like the same thing to the person clicking:
 *
 *  1. The only feedback was a 16px ghost icon fading to 60% opacity. On a fast
 *     connection that flickers past; on a slow one the click just feels lost.
 *  2. Each form only disabled ITSELF, so the opposite chevron stayed live during
 *     the round trip — and so did the same chevron, once the flicker passed.
 *  3. Clicking again while a move was in flight did not do what it looked like it
 *     did. The two calls read positions before either had written, so the second
 *     one re-applied the swap the first had already made: two clicks, one move.
 *     (The server side of that is fixed too — the read now happens inside the
 *     transaction that writes. This component stops it being provoked.)
 *
 * So: one pending state for both directions, a spinner in place of the pressed
 * chevron, and both buttons inert until the server has answered.
 */
export function ReorderControls({
  up,
  down,
  canMoveUp,
  canMoveDown,
  label,
}: {
  up: Move;
  down: Move;
  canMoveUp: boolean;
  canMoveDown: boolean;
  /** What is being moved, for the accessible button names — e.g. "section". */
  label: string;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [movingDir, setMovingDir] = useState<'up' | 'down' | null>(null);
  const [error, setError] = useState<string | null>(null);

  function run(dir: 'up' | 'down', move: Move) {
    setError(null);
    setMovingDir(dir);
    startTransition(async () => {
      try {
        await move();
        router.refresh();
      } catch (err) {
        // A silent failure here is indistinguishable from "the list is already in
        // that order", which is why this is surfaced rather than logged.
        console.error('[reorder failed]', err);
        setError('Could not move that. Reload and try again.');
      } finally {
        setMovingDir(null);
      }
    });
  }

  const busy = pending || movingDir !== null;

  return (
    <div className="flex flex-col items-end">
      <div className="flex items-center gap-0.5">
        <Button
          type="button"
          variant="ghost"
          size="icon"
          aria-label={`Move ${label} up`}
          disabled={!canMoveUp || busy}
          onClick={() => run('up', up)}
        >
          {movingDir === 'up' ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <ChevronUp className="h-4 w-4" />
          )}
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          aria-label={`Move ${label} down`}
          disabled={!canMoveDown || busy}
          onClick={() => run('down', down)}
        >
          {movingDir === 'down' ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <ChevronDown className="h-4 w-4" />
          )}
        </Button>
      </div>

      {/*
        The spinner covers sighted users. This covers everyone else: a reorder
        changes nothing that a screen reader announces on its own, so without it
        the action is completely silent.
      */}
      <span aria-live="polite" className="sr-only">
        {busy ? `Moving ${label}…` : ''}
      </span>

      {error && (
        <p role="alert" className="mt-1 text-meta text-destructive">
          {error}
        </p>
      )}
    </div>
  );
}
