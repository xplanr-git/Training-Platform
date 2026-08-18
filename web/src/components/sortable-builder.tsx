'use client';

import { useEffect, useRef, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import {
  DndContext,
  DragOverlay,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  closestCorners,
  useDroppable,
  useSensor,
  useSensors,
  type Announcements,
  type CollisionDetection,
  type DragEndEvent,
  type DragOverEvent,
  type DragStartEvent,
  type Over,
} from '@dnd-kit/core';
import {
  SortableContext,
  arrayMove,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Card } from '@/components/ui/card';
import { DragHandle } from '@/components/drag-handle';
import { InlineTextField } from '@/components/inline-edit';
import { cn } from '@/components/ui/utils';

export interface BuilderSection {
  id: string;
  title: string;
  lessonIds: string[];
}

type ActiveItem = { type: 'section' | 'lesson'; id: string } | null;

/**
 * Drag-and-drop for the course builder: sections reorder within the course,
 * lessons reorder within a section AND move between sections.
 *
 * The server page stays the owner of every row's CONTENT — each lesson's edit
 * form, video upload and delete confirm arrives here as an opaque ReactNode.
 * This component owns only the ARRANGEMENT: which lessons sit in which section,
 * in what order. That split is what lets a drop feel instant (the arrangement
 * is local state, updated optimistically) without rebuilding any of the
 * server-rendered machinery inside the rows.
 *
 * Writes go through full-order Server Actions (reorderSections /
 * moveLessonToSection): the complete final order, not a delta, so the last
 * committed drag wins and a replay changes nothing. On failure the arrangement
 * reverts to its pre-drag state and the error is announced. After any save the
 * router refreshes and the server's order flows back in through props — the
 * effect below adopts it whenever no drag or save is in flight.
 *
 * The chevron buttons the builder always had stay alongside as the
 * discoverable non-drag path; the handles add dnd-kit's keyboard grammar on
 * top (space to lift, arrows to move, space to drop).
 */
export function SortableBuilder({
  layout: layoutProp,
  sectionControls,
  sectionFooters,
  lessonNodes,
  lessonTitles,
  emptyLesson,
  reorderSectionsAction,
  moveLessonAction,
  renameSectionAction,
}: {
  layout: BuilderSection[];
  sectionControls: Record<string, React.ReactNode>;
  sectionFooters: Record<string, React.ReactNode>;
  lessonNodes: Record<string, React.ReactNode>;
  lessonTitles: Record<string, string>;
  emptyLesson: React.ReactNode;
  reorderSectionsAction: (orderedIds: string[]) => Promise<void>;
  moveLessonAction: (
    lessonId: string,
    targetSectionId: string,
    orderedIds: string[],
  ) => Promise<void>;
  renameSectionAction: (sectionId: string, title: string) => Promise<void>;
}) {
  const router = useRouter();
  const [, startTransition] = useTransition();
  const [layout, setLayout] = useState<BuilderSection[]>(layoutProp);
  const [activeItem, setActiveItem] = useState<ActiveItem>(null);
  const [saving, setSaving] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const preDrag = useRef<BuilderSection[] | null>(null);

  // Adopt the server's order only when the server actually sends a NEW one —
  // never mid-drag (it would yank the list out from under the pointer) and
  // never mid-save. Crucially, adoption is keyed on the props CHANGING, not on
  // the save clearing: setSaving(0) runs before router.refresh() has delivered
  // fresh props, and re-adopting the stale props at that moment snapped the
  // list back to its pre-drag order for the second or two the round-trip took
  // — a saved drag that LOOKED like it hadn't worked.
  const propsKey = JSON.stringify(layoutProp);
  const lastAdopted = useRef(propsKey);
  const savingRef = useRef(0);
  savingRef.current = saving;
  const activeRef = useRef<ActiveItem>(null);
  activeRef.current = activeItem;
  useEffect(() => {
    if (propsKey === lastAdopted.current) return;
    if (savingRef.current > 0 || activeRef.current !== null) return;
    lastAdopted.current = propsKey;
    setLayout(JSON.parse(propsKey) as BuilderSection[]);
  }, [propsKey, saving, activeItem]);

  const sensors = useSensors(
    // The distance constraint keeps a plain click on the handle from starting
    // a zero-length drag that would swallow the click.
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  /**
   * Sections only ever measure against sections; lessons against lesson rows
   * and the per-section list areas (the list is a droppable of its own so an
   * EMPTY section can still receive a drop). Without the split, a dragged
   * section could resolve "closest" to a lesson row inside a neighbour and
   * the drop would dead-end.
   */
  const collisionDetection: CollisionDetection = (args) => {
    const type = args.active.data.current?.type;
    if (type === 'section') {
      return closestCenter({
        ...args,
        droppableContainers: args.droppableContainers.filter(
          (c) => c.data.current?.type === 'section',
        ),
      });
    }
    return closestCorners({
      ...args,
      droppableContainers: args.droppableContainers.filter((c) => {
        const t = c.data.current?.type;
        return t === 'lesson' || t === 'lessonList';
      }),
    });
  };

  function containerFrom(over: Over): string | null {
    const data = over.data.current as { type?: string; sectionId?: string } | undefined;
    if (data?.type === 'lesson' || data?.type === 'lessonList') return data.sectionId ?? null;
    if (data?.type === 'section') return String(over.id);
    return null;
  }

  function describe(id: string, type: string | undefined): string {
    if (type === 'section') {
      const s = layout.find((x) => x.id === id);
      return `section “${s?.title ?? ''}”`;
    }
    return `lesson “${lessonTitles[id] ?? ''}”`;
  }

  const announcements: Announcements = {
    onDragStart: ({ active }) =>
      `Picked up ${describe(String(active.id), active.data.current?.type as string)}.`,
    onDragOver: ({ active, over }) => {
      if (!over || active.data.current?.type !== 'lesson') return;
      const target = containerFrom(over);
      const s = layout.find((x) => x.id === target);
      return s ? `Lesson is over section “${s.title}”.` : undefined;
    },
    onDragEnd: ({ active }) =>
      `${describe(String(active.id), active.data.current?.type as string)} dropped.`,
    onDragCancel: ({ active }) =>
      `Reordering cancelled. ${describe(String(active.id), active.data.current?.type as string)} returned to its original position.`,
  };

  function handleDragStart(event: DragStartEvent) {
    const type = event.active.data.current?.type as 'section' | 'lesson' | undefined;
    if (!type) return;
    preDrag.current = layout.map((s) => ({ ...s, lessonIds: [...s.lessonIds] }));
    setActiveItem({ type, id: String(event.active.id) });
    setError(null);
  }

  // Live re-parenting: as a lesson crosses into another section it moves in
  // local state immediately, so the preview IS the outcome.
  function handleDragOver(event: DragOverEvent) {
    const { active, over } = event;
    if (active.data.current?.type !== 'lesson' || !over) return;
    const activeId = String(active.id);
    const overContainer = containerFrom(over);
    if (!overContainer) return;
    setLayout((prev) => {
      const fromIdx = prev.findIndex((s) => s.lessonIds.includes(activeId));
      const toIdx = prev.findIndex((s) => s.id === overContainer);
      if (fromIdx < 0 || toIdx < 0 || fromIdx === toIdx) return prev;
      const next = prev.map((s) => ({ ...s, lessonIds: [...s.lessonIds] }));
      next[fromIdx].lessonIds = next[fromIdx].lessonIds.filter((id) => id !== activeId);
      const overIdx =
        over.data.current?.type === 'lesson' ? next[toIdx].lessonIds.indexOf(String(over.id)) : -1;
      const insertAt = overIdx >= 0 ? overIdx : next[toIdx].lessonIds.length;
      next[toIdx].lessonIds.splice(insertAt, 0, activeId);
      return next;
    });
  }

  function commit(
    next: BuilderSection[],
    revertTo: BuilderSection[],
    save: () => Promise<void>,
    failureMessage = 'Could not save the new order. Reload the page and try again.',
  ) {
    setLayout(next);
    setSaving((c) => c + 1);
    startTransition(async () => {
      try {
        await save();
        router.refresh();
      } catch (err) {
        // A silently dropped save would leave the screen showing a state the
        // server never accepted — surfaced and reverted instead.
        console.error('[builder save failed]', err);
        setLayout(revertTo);
        setError(failureMessage);
        router.refresh();
      } finally {
        setSaving((c) => c - 1);
      }
    });
  }

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    const type = active.data.current?.type;
    const snapshot = preDrag.current;
    preDrag.current = null;
    setActiveItem(null);
    if (!snapshot) return;
    if (!over) {
      setLayout(snapshot);
      return;
    }

    if (type === 'section') {
      const from = layout.findIndex((s) => s.id === String(active.id));
      const to = layout.findIndex((s) => s.id === String(over.id));
      if (from < 0 || to < 0) {
        setLayout(snapshot);
        return;
      }
      const next = arrayMove(layout, from, to);
      if (JSON.stringify(next) === JSON.stringify(snapshot)) {
        setLayout(snapshot);
        return;
      }
      commit(next, snapshot, () => reorderSectionsAction(next.map((s) => s.id)));
      return;
    }

    if (type === 'lesson') {
      const activeId = String(active.id);
      // handleDragOver already parked the lesson in its target section.
      const container = layout.find((s) => s.lessonIds.includes(activeId));
      if (!container) {
        setLayout(snapshot);
        return;
      }
      let ids = [...container.lessonIds];
      const overId = String(over.id);
      if (over.data.current?.type === 'lesson' && overId !== activeId && ids.includes(overId)) {
        ids = arrayMove(ids, ids.indexOf(activeId), ids.indexOf(overId));
      }
      const next = layout.map((s) => (s.id === container.id ? { ...s, lessonIds: ids } : s));
      if (JSON.stringify(next) === JSON.stringify(snapshot)) {
        setLayout(snapshot);
        return;
      }
      commit(next, snapshot, () => moveLessonAction(activeId, container.id, ids));
    }
  }

  function handleDragCancel() {
    if (preDrag.current) setLayout(preDrag.current);
    preDrag.current = null;
    setActiveItem(null);
  }

  const activeSection =
    activeItem?.type === 'section' ? layout.find((s) => s.id === activeItem.id) : null;

  return (
    <DndContext
      id="course-builder-dnd"
      sensors={sensors}
      collisionDetection={collisionDetection}
      accessibility={{ announcements }}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
      onDragCancel={handleDragCancel}
    >
      <div className="space-y-5">
        <SortableContext items={layout.map((s) => s.id)} strategy={verticalListSortingStrategy}>
          {layout.map((section) => (
            <SortableSectionCard
              key={section.id}
              section={section}
              controls={sectionControls[section.id]}
              footer={sectionFooters[section.id]}
              lessonNodes={lessonNodes}
              lessonTitles={lessonTitles}
              emptyLesson={emptyLesson}
              renameAction={renameSectionAction}
            />
          ))}
        </SortableContext>
      </div>

      {/* A compact stand-in follows the pointer; the real row stays in place,
          dimmed, holding the drop gap open. */}
      <DragOverlay>
        {activeItem?.type === 'section' && activeSection ? (
          <OverlayChip
            title={activeSection.title}
            meta={`${activeSection.lessonIds.length} ${activeSection.lessonIds.length === 1 ? 'lesson' : 'lessons'}`}
          />
        ) : activeItem?.type === 'lesson' ? (
          <OverlayChip title={lessonTitles[activeItem.id] ?? ''} />
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

function SortableSectionCard({
  section,
  controls,
  footer,
  lessonNodes,
  lessonTitles,
  emptyLesson,
  renameAction,
}: {
  section: BuilderSection;
  controls: React.ReactNode;
  footer: React.ReactNode;
  lessonNodes: Record<string, React.ReactNode>;
  lessonTitles: Record<string, string>;
  emptyLesson: React.ReactNode;
  renameAction: (sectionId: string, title: string) => Promise<void>;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: section.id,
    data: { type: 'section' },
  });
  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Translate.toString(transform), transition }}
      className={cn(isDragging && 'opacity-40')}
    >
      <Card className="overflow-hidden p-0">
        <header className="flex items-center justify-between gap-2 border-b border-border bg-surface-muted px-4 py-2.5">
          <div className="flex min-w-0 flex-1 items-center gap-1">
            <DragHandle
              attributes={attributes}
              listeners={listeners}
              label={`Drag to move section “${section.title}”`}
              className="-ml-2"
            />
            <h2 className="min-w-0 flex-1 text-h2">
              <InlineTextField
                value={section.title}
                label={`title of section “${section.title}”`}
                onSave={(title) => renameAction(section.id, title)}
                className="w-full"
                inputClassName="h-8 w-full max-w-md"
              />
            </h2>
          </div>
          <div className="flex shrink-0 items-center gap-0.5">{controls}</div>
        </header>

        <SortableContext items={section.lessonIds} strategy={verticalListSortingStrategy}>
          <LessonList
            sectionId={section.id}
            lessonIds={section.lessonIds}
            lessonNodes={lessonNodes}
            lessonTitles={lessonTitles}
            emptyLesson={emptyLesson}
          />
        </SortableContext>

        {footer}
      </Card>
    </div>
  );
}

function LessonList({
  sectionId,
  lessonIds,
  lessonNodes,
  lessonTitles,
  emptyLesson,
}: {
  sectionId: string;
  lessonIds: string[];
  lessonNodes: Record<string, React.ReactNode>;
  lessonTitles: Record<string, string>;
  emptyLesson: React.ReactNode;
}) {
  // The list itself is a droppable so a lesson can be dropped into a section
  // with nothing in it — rows alone would give an empty section no target.
  const { setNodeRef } = useDroppable({
    id: `list:${sectionId}`,
    data: { type: 'lessonList', sectionId },
  });
  return (
    <ul ref={setNodeRef} className="divide-y divide-border">
      {lessonIds.map((id) => (
        <SortableLessonRow key={id} id={id} sectionId={sectionId} title={lessonTitles[id] ?? ''}>
          {lessonNodes[id]}
        </SortableLessonRow>
      ))}
      {lessonIds.length === 0 && <li>{emptyLesson}</li>}
    </ul>
  );
}

function SortableLessonRow({
  id,
  sectionId,
  title,
  children,
}: {
  id: string;
  sectionId: string;
  title: string;
  children: React.ReactNode;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id,
    data: { type: 'lesson', sectionId },
  });
  return (
    <li
      ref={setNodeRef}
      style={{ transform: CSS.Translate.toString(transform), transition }}
      className={cn('flex items-start gap-1 px-4 py-2.5 text-sm', isDragging && 'opacity-40')}
    >
      <DragHandle
        attributes={attributes}
        listeners={listeners}
        label={`Drag to move lesson “${title}”`}
        className="-ml-2 mt-0.5"
      />
      <div className="min-w-0 flex-1">{children}</div>
    </li>
  );
}

/** What travels under the pointer: the item's name on the DS ink keyline. */
function OverlayChip({ title, meta }: { title: string; meta?: string }) {
  return (
    <div className="shadow-pop rounded-md border-[1.75px] border-foreground bg-surface px-3 py-2 text-sm">
      <span className="font-medium">{title}</span>
      {meta && <span className="ml-2 text-meta text-muted">{meta}</span>}
    </div>
  );
}
