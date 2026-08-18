'use client';

import { GripVertical } from 'lucide-react';
import type { DraggableAttributes, DraggableSyntheticListeners } from '@dnd-kit/core';
import { Button } from '@/components/ui/button';
import { cn } from '@/components/ui/utils';

/**
 * The grab affordance for a sortable row. A dedicated handle, not a draggable
 * row: every row here is full of live controls (forms, links, <summary>
 * disclosures), and activation constraints only reduce the conflict — a handle
 * removes it. `touch-none` is required, not decorative: without it a phone
 * cannot drag at all, because the browser claims the gesture for scrolling
 * before dnd-kit sees it.
 *
 * Spreading `attributes` gives the button dnd-kit's keyboard grammar (space to
 * lift, arrows to move, space to drop) and points aria-describedby at the
 * instructions dnd-kit renders — so the handle is the accessible path too, on
 * top of any chevron buttons a caller keeps.
 */
export function DragHandle({
  attributes,
  listeners,
  label,
  className,
}: {
  attributes: DraggableAttributes;
  listeners: DraggableSyntheticListeners;
  label: string;
  className?: string;
}) {
  return (
    <Button
      type="button"
      variant="ghost"
      size="icon"
      className={cn('cursor-grab touch-none active:cursor-grabbing', className)}
      aria-label={label}
      {...attributes}
      {...listeners}
    >
      <GripVertical className="h-4 w-4" />
    </Button>
  );
}
