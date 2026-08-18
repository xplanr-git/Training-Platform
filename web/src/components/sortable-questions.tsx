'use client';

import { useEffect, useMemo, useRef, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import {
  DndContext,
  DragOverlay,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
  type Announcements,
  type DragEndEvent,
  type DragStartEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  arrayMove,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Check, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { EmptyState } from '@/components/empty-state';
import { NavForm } from '@/components/nav-form';
import { DragHandle } from '@/components/drag-handle';
import { cn } from '@/components/ui/utils';

/** Mirrors the options in the add-question type select. */
const QUESTION_TYPE_LABEL: Record<string, string> = {
  mcq: 'Multiple choice — one answer',
  multi_select: 'Multiple choice — many answers',
  true_false: 'True / False',
};

export interface QuizQuestionItem {
  id: string;
  prompt: string;
  type: string;
  points: number;
  options: string[];
  correct: number[];
}

/**
 * The quiz editor's question list, orderable by drag (pointer or keyboard via
 * the handle). Question CONTENT is plain data, so unlike the course builder the
 * rows render here on the client — which keeps the visible numbering derived
 * from the live order instead of going stale between a drop and the server
 * round-trip.
 *
 * Writes go through reorderQuestions with the complete final order; on failure
 * the list reverts and the error is announced. The server order flows back in
 * through props after every save and is adopted whenever no drag or save is in
 * flight.
 */
export function SortableQuestions({
  questions,
  reorderAction,
  deleteAction,
}: {
  questions: QuizQuestionItem[];
  reorderAction: (orderedIds: string[]) => Promise<void>;
  deleteAction: (questionId: string) => Promise<void>;
}) {
  const router = useRouter();
  const [, startTransition] = useTransition();
  const byId = useMemo(() => new Map(questions.map((q) => [q.id, q])), [questions]);
  const [order, setOrder] = useState<string[]>(questions.map((q) => q.id));
  const [activeId, setActiveId] = useState<string | null>(null);
  const [saving, setSaving] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const preDrag = useRef<string[] | null>(null);

  // Adoption is keyed on the props CHANGING, not on the save clearing — see
  // the identical guard in sortable-builder.tsx for why (stale re-adoption
  // made a saved drag snap back until the refresh landed).
  const propsKey = JSON.stringify(questions.map((q) => q.id));
  const lastAdopted = useRef(propsKey);
  const savingRef = useRef(0);
  savingRef.current = saving;
  const activeRef = useRef<string | null>(null);
  activeRef.current = activeId;
  useEffect(() => {
    if (propsKey === lastAdopted.current) return;
    if (savingRef.current > 0 || activeRef.current !== null) return;
    lastAdopted.current = propsKey;
    setOrder(JSON.parse(propsKey) as string[]);
  }, [propsKey, saving, activeId]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  // A deleted id can outlive one render in `order`; rendering through the
  // filter keeps the list truthful rather than throwing on a missing lookup.
  const visible = order.filter((id) => byId.has(id));

  const announcements: Announcements = {
    onDragStart: ({ active }) =>
      `Picked up question ${visible.indexOf(String(active.id)) + 1} of ${visible.length}.`,
    onDragOver: ({ over }) =>
      over ? `Question is over position ${visible.indexOf(String(over.id)) + 1}.` : undefined,
    onDragEnd: ({ active }) =>
      `Question dropped at position ${visible.indexOf(String(active.id)) + 1}.`,
    onDragCancel: () => 'Reordering cancelled. The question returned to its original position.',
  };

  function handleDragStart(event: DragStartEvent) {
    preDrag.current = [...order];
    setActiveId(String(event.active.id));
    setError(null);
  }

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    const snapshot = preDrag.current;
    preDrag.current = null;
    setActiveId(null);
    if (!snapshot) return;
    if (!over || String(over.id) === String(active.id)) return;
    const from = order.indexOf(String(active.id));
    const to = order.indexOf(String(over.id));
    if (from < 0 || to < 0) return;
    const next = arrayMove(order, from, to);
    setOrder(next);
    setSaving((c) => c + 1);
    startTransition(async () => {
      try {
        await reorderAction(next.filter((id) => byId.has(id)));
        router.refresh();
      } catch (err) {
        console.error('[reorder failed]', err);
        setOrder(snapshot);
        setError('Could not save the new order. Reload the page and try again.');
        router.refresh();
      } finally {
        setSaving((c) => c - 1);
      }
    });
  }

  function handleDragCancel() {
    if (preDrag.current) setOrder(preDrag.current);
    preDrag.current = null;
    setActiveId(null);
  }

  if (questions.length === 0) {
    return (
      <div className="mt-6">
        <EmptyState title="No questions yet">
          Add the first one below. A question a learner skips is marked wrong, and they pass at the
          percentage set in Pass threshold above.
        </EmptyState>
      </div>
    );
  }

  const activeQuestion = activeId ? byId.get(activeId) : null;

  return (
    <DndContext
      id="quiz-questions-dnd"
      sensors={sensors}
      collisionDetection={closestCenter}
      accessibility={{ announcements }}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onDragCancel={handleDragCancel}
    >
      <SortableContext items={visible} strategy={verticalListSortingStrategy}>
        <ol className="mt-6 space-y-3">
          {visible.map((id, i) => (
            <SortableQuestionCard
              key={id}
              question={byId.get(id)!}
              index={i}
              deleteAction={deleteAction}
            />
          ))}
        </ol>
      </SortableContext>

      <DragOverlay>
        {activeQuestion ? (
          <div className="shadow-pop rounded-md border-[1.75px] border-foreground bg-surface px-3 py-2 text-sm">
            <span className="font-medium">
              {visible.indexOf(activeQuestion.id) + 1}. {activeQuestion.prompt}
            </span>
          </div>
        ) : null}
      </DragOverlay>

      <span aria-live="polite" className="sr-only">
        {saving > 0 ? 'Saving order…' : ''}
      </span>
      {error && (
        <p role="alert" className="mt-2 text-sm text-destructive">
          {error}
        </p>
      )}
    </DndContext>
  );
}

function SortableQuestionCard({
  question: q,
  index,
  deleteAction,
}: {
  question: QuizQuestionItem;
  index: number;
  deleteAction: (questionId: string) => Promise<void>;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: q.id,
    data: { type: 'question' },
  });
  return (
    <li
      ref={setNodeRef}
      style={{ transform: CSS.Translate.toString(transform), transition }}
      className={cn('flex items-start gap-1', isDragging && 'opacity-40')}
    >
      <DragHandle
        attributes={attributes}
        listeners={listeners}
        label={`Drag to reorder question ${index + 1}`}
        className="mt-2.5"
      />
      <Card className="min-w-0 flex-1">
        <CardContent className="py-4">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="font-medium">
                {index + 1}. {q.prompt}{' '}
                <span className="text-meta font-normal text-muted">({q.points} pt)</span>
              </p>
              {/*
                The type was never shown, so a multi-answer question and a
                single-answer one with two ticks looked identical — and which
                it is decides how the answer key was read.
              */}
              <p className="mt-0.5 text-meta text-muted">{QUESTION_TYPE_LABEL[q.type] ?? q.type}</p>
            </div>
            <NavForm
              action={() => deleteAction(q.id)}
              quiet
              confirm="Delete this question? Any answers learners have already given to it go too. This cannot be undone."
            >
              <Button
                type="submit"
                variant="destructive-ghost"
                size="icon"
                aria-label="Delete question"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </NavForm>
          </div>
          <ul className="mt-3 space-y-1.5 text-sm">
            {q.options.map((o, oi) => (
              <li key={oi} className="flex items-center gap-2 text-foreground-2">
                {q.correct.includes(oi) ? (
                  <Check aria-hidden="true" className="h-4 w-4 shrink-0 text-status-green" />
                ) : (
                  <span
                    aria-hidden="true"
                    className="inline-block h-3.5 w-3.5 shrink-0 rounded-full border border-current"
                  />
                )}
                <span>{o}</span>
                {/*
                  The tick and the colour were the ONLY signals. A screen
                  reader got neither, and colour alone fails WCAG 1.4.1, so
                  the state is now also stated in words.
                */}
                {q.correct.includes(oi) && (
                  <span className="text-meta font-semibold text-status-green">(correct)</span>
                )}
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>
    </li>
  );
}
