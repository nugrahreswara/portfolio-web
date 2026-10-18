"use client";

// Drag-and-drop ordering for the admin panel.
//
// Replaces the manual "Order" number inputs: every list is a sortable stack, the
// drop commits optimistically and the new positions are saved to the server in
// one request (POST /api/admin/reorder). The card reacts in 3D while it is
// dragged - it lifts off the page, tilts with the pointer's velocity through
// springs, and casts a deeper shadow - then settles back with a spring drop.
//
// Accessibility (WCAG 2.2 AA "Dragging Movements"): dragging is never the only
// way to reorder. Every row also ships Move up / Move down buttons, the whole
// list is operable from the keyboard through dnd-kit's keyboard sensor, and
// moves are announced to screen readers through dnd-kit's live region.

import {
  DndContext,
  DragOverlay,
  KeyboardSensor,
  MeasuringStrategy,
  PointerSensor,
  TouchSensor,
  closestCenter,
  defaultDropAnimationSideEffects,
  useDroppable,
  useSensor,
  useSensors,
  type Announcements,
  type DragEndEvent,
  type DragMoveEvent,
  type DragStartEvent,
  type DropAnimation,
} from "@dnd-kit/core";
import {
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { AnimatePresence, motion, useReducedMotion, useSpring } from "framer-motion";
import { Check, ChevronDown, ChevronUp, GripVertical, Loader2, Pencil, Sparkles, Trash2, TriangleAlert } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { CERT_CATEGORIES, normalizeCategory, type CertCategory } from "@/lib/categories";
import { GROUP_DROPPABLE_PREFIX, applyDrop, moveByOffset } from "@/lib/order-state";

type Row = Record<string, any> & { id: number };

const EASE = [0.22, 1, 0.36, 1] as const;

const GROUP_COPY: Record<CertCategory, { label: string; hint: string }> = {
  certification: { label: "Certifications", hint: "The Certifications heading on the site" },
  training: { label: "Training", hint: "The Training sub-section under Certifications" },
};

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function defaultPrimary(row: Row): string {
  return String(row.company ?? row.school ?? row.titleEn ?? row.name ?? `#${row.id}`);
}

function defaultSecondary(row: Row): string {
  return String(row.roleEn ?? row.degreeEn ?? row.issuer ?? row.event ?? row.tech ?? "");
}

// Position chip. The number slides out and the next one slides in, so a reorder
// reads as a physical change rather than a text swap.
function PositionChip({ value, reduce }: { value: number; reduce: boolean }) {
  return (
    <span
      aria-hidden
      className="relative inline-flex h-7 w-7 shrink-0 items-center justify-center overflow-hidden rounded-[9px] bg-[rgb(var(--surface))] text-[12.5px] font-semibold tabular-nums text-[rgb(var(--muted))]"
    >
      <AnimatePresence initial={false} mode="popLayout">
        <motion.span
          key={value}
          initial={reduce ? false : { y: 13, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={reduce ? { opacity: 0 } : { y: -13, opacity: 0 }}
          transition={{ type: "spring", stiffness: 520, damping: 34 }}
        >
          {value}
        </motion.span>
      </AnimatePresence>
    </span>
  );
}

function RowCard({
  row,
  index,
  primary,
  secondary,
  dragging,
  reduce,
  showCategory = true,
  handleRef,
  handleProps,
  onEdit,
  onDelete,
  onMove,
  canMoveUp,
  canMoveDown,
}: {
  row: Row;
  index: number;
  primary: string;
  secondary: string;
  dragging: boolean;
  reduce: boolean;
  showCategory?: boolean;
  handleRef?: (node: HTMLElement | null) => void;
  handleProps?: Record<string, any>;
  onEdit?: () => void;
  onDelete?: () => void;
  onMove?: (direction: -1 | 1) => void;
  canMoveUp?: boolean;
  canMoveDown?: boolean;
}) {
  const category = showCategory && row.category ? normalizeCategory(row.category) : null;
  const title = primary;

  // Double-bezel: a machined outer tray, the content on its own inner plate.
  return (
    <div
      className={`rounded-[18px] p-[3px] transition-colors duration-300 ${
        dragging ? "bg-[rgb(var(--accent)/0.14)]" : "bg-[rgb(var(--surface)/0.55)]"
      }`}
    >
      <div
        className={`flex items-center gap-2.5 rounded-[15px] border bg-[rgb(var(--bg))] px-3 py-2.5 transition-[border-color,box-shadow] duration-300 ${
          dragging
            ? "border-[rgb(var(--accent))] shadow-[0_38px_80px_-38px_rgba(26,75,224,0.75)]"
            : "border-[rgb(var(--line))]"
        }`}
      >
        {handleRef ? (
          <button
            ref={handleRef as any}
            type="button"
            {...handleProps}
            aria-label={`Reorder ${title}. Drag, or use the arrow keys and the move buttons.`}
            className="group inline-flex h-10 w-9 shrink-0 cursor-grab touch-none items-center justify-center rounded-[9px] text-[rgb(var(--muted))] transition-colors duration-200 hover:bg-[rgb(var(--surface))] hover:text-[rgb(var(--ink))] active:cursor-grabbing"
          >
            <GripVertical size={16} aria-hidden className="transition-transform duration-300 group-hover:scale-110" />
          </button>
        ) : (
          <span className="inline-flex h-10 w-9 shrink-0 items-center justify-center text-[rgb(var(--muted))]">
            <GripVertical size={16} aria-hidden />
          </span>
        )}

        <PositionChip value={index + 1} reduce={reduce} />

        <div className="min-w-0 flex-1">
          <p className="truncate text-[15px] font-semibold">{primary}</p>
          {secondary ? <p className="truncate text-[13.5px] text-[rgb(var(--muted))]">{secondary}</p> : null}
        </div>

        {category ? (
          <span className="hidden shrink-0 rounded-full bg-[rgb(var(--surface))] px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-[rgb(var(--muted))] sm:inline-flex">
            {GROUP_COPY[category].label}
          </span>
        ) : null}

        {onMove ? (
          <div className="flex shrink-0 items-center gap-1">
            <button
              type="button"
              onClick={() => onMove(-1)}
              disabled={!canMoveUp}
              aria-label={`Move ${title} up`}
              className="inline-flex h-8 w-8 items-center justify-center rounded-[9px] border border-[rgb(var(--line))] text-[rgb(var(--muted))] transition-colors duration-200 hover:border-[rgb(var(--accent))] hover:text-[rgb(var(--ink))] disabled:cursor-not-allowed disabled:opacity-35 disabled:hover:border-[rgb(var(--line))]"
            >
              <ChevronUp size={15} aria-hidden />
            </button>
            <button
              type="button"
              onClick={() => onMove(1)}
              disabled={!canMoveDown}
              aria-label={`Move ${title} down`}
              className="inline-flex h-8 w-8 items-center justify-center rounded-[9px] border border-[rgb(var(--line))] text-[rgb(var(--muted))] transition-colors duration-200 hover:border-[rgb(var(--accent))] hover:text-[rgb(var(--ink))] disabled:cursor-not-allowed disabled:opacity-35 disabled:hover:border-[rgb(var(--line))]"
            >
              <ChevronDown size={15} aria-hidden />
            </button>
          </div>
        ) : null}

        {onEdit ? (
          <button
            type="button"
            onClick={onEdit}
            className="inline-flex shrink-0 items-center gap-1.5 rounded-[9px] border border-[rgb(var(--line))] px-3 py-1.5 text-[13.5px] font-semibold transition-colors duration-200 hover:border-[rgb(var(--accent))]"
          >
            <Pencil size={13} aria-hidden />
            Edit
          </button>
        ) : null}
        {onDelete ? (
          <button
            type="button"
            onClick={onDelete}
            className="inline-flex shrink-0 items-center gap-1.5 rounded-[9px] border border-red-300 px-3 py-1.5 text-[13.5px] font-semibold text-red-600 transition-colors duration-200 hover:bg-red-50 dark:border-red-900 dark:text-red-400 dark:hover:bg-red-950/40"
          >
            <Trash2 size={13} aria-hidden />
            Delete
          </button>
        ) : null}
      </div>
    </div>
  );
}

function SortableRow({
  row,
  index,
  primary,
  secondary,
  reduce,
  showCategory,
  onEdit,
  onDelete,
  onMove,
  canMoveUp,
  canMoveDown,
}: {
  row: Row;
  index: number;
  primary: string;
  secondary: string;
  reduce: boolean;
  showCategory: boolean;
  onEdit: () => void;
  onDelete: () => void;
  onMove: (direction: -1 | 1) => void;
  canMoveUp: boolean;
  canMoveDown: boolean;
}) {
  const { attributes, listeners, setNodeRef, setActivatorNodeRef, transform, transition, isDragging } = useSortable({
    id: row.id,
  });

  return (
    <li
      ref={setNodeRef}
      style={{
        transform: CSS.Transform.toString(transform),
        transition: transition ?? undefined,
        // The dragged original becomes a dashed placeholder so the landing slot
        // is obvious while the lifted card follows the pointer.
        zIndex: isDragging ? 20 : undefined,
      }}
      className={isDragging ? "relative opacity-45" : "relative"}
    >
      <div data-row-shell className={isDragging ? "rounded-[18px] outline-dashed outline-1 outline-[rgb(var(--accent)/0.6)]" : ""}>
        <RowCard
          row={row}
          index={index}
          primary={primary}
          secondary={secondary}
          dragging={isDragging}
          reduce={reduce}
          showCategory={showCategory}
          handleRef={setActivatorNodeRef}
          handleProps={{ ...attributes, ...listeners }}
          onEdit={onEdit}
          onDelete={onDelete}
          onMove={onMove}
          canMoveUp={canMoveUp}
          canMoveDown={canMoveDown}
        />
      </div>
    </li>
  );
}

function GroupDropZone({
  category,
  count,
  children,
}: {
  category: CertCategory;
  count: number;
  children: React.ReactNode;
}) {
  const { setNodeRef, isOver } = useDroppable({ id: `${GROUP_DROPPABLE_PREFIX}${category}` });
  const copy = GROUP_COPY[category];

  return (
    <section className="rounded-[20px] border border-dashed p-4 transition-colors duration-300 sm:p-5"
      style={{
        borderColor: isOver ? "rgb(var(--accent))" : "rgb(var(--line))",
        backgroundColor: isOver ? "rgb(var(--accent) / 0.06)" : "transparent",
      }}
    >
      <header className="mb-3 flex flex-wrap items-baseline justify-between gap-2">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[rgb(var(--accent))]">{copy.label}</p>
          <p className="text-[13.5px] text-[rgb(var(--muted))]">{copy.hint}</p>
        </div>
        <span className="text-[13px] tabular-nums text-[rgb(var(--muted))]">
          {count} {count === 1 ? "item" : "items"}
        </span>
      </header>
      <div ref={setNodeRef} className="min-h-[64px]">
        {children}
      </div>
    </section>
  );
}

const dropAnimation: DropAnimation = {
  duration: 280,
  easing: "cubic-bezier(0.22, 1, 0.36, 1)",
  sideEffects: defaultDropAnimationSideEffects({
    styles: { active: { opacity: "0.4" } },
  }),
};

export function OrderList({
  resource,
  rows,
  groupByCategory = false,
  primary = defaultPrimary,
  secondary = defaultSecondary,
  onEdit,
  onDelete,
  onReordered,
}: {
  resource: string;
  rows: Row[];
  groupByCategory?: boolean;
  primary?: (row: Row) => string;
  secondary?: (row: Row) => string;
  onEdit: (row: Row) => void;
  onDelete: (row: Row) => void;
  onReordered?: (rows: Row[]) => void;
}) {
  const reduce = Boolean(useReducedMotion());
  const [items, setItems] = useState<Row[]>(rows);
  const [status, setStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [activeId, setActiveId] = useState<number | null>(null);
  const savedTimer = useRef<number | null>(null);

  // Server truth always wins once a load or a save completes.
  useEffect(() => {
    setItems(rows);
  }, [rows]);

  useEffect(() => () => {
    if (savedTimer.current) window.clearTimeout(savedTimer.current);
  }, []);

  // 3D tilt, driven by the drag vector through springs (no React re-render per
  // pointer event - the motion values stay on the compositor).
  const tiltX = useSpring(0, { stiffness: 380, damping: 30, mass: 0.5 });
  const tiltY = useSpring(0, { stiffness: 380, damping: 30, mass: 0.5 });
  const lift = useSpring(1, { stiffness: 420, damping: 24, mass: 0.4 });

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 180, tolerance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const scopeOf = (row: Row): string => (groupByCategory ? normalizeCategory(row.category) : "");

  const grouped = useMemo(() => {
    const map = new Map<string, Row[]>();
    for (const row of items) {
      const key = scopeOf(row);
      const list = map.get(key) ?? [];
      list.push(row);
      map.set(key, list);
    }
    return map;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [items, groupByCategory]);

  function persist(next: Row[]) {
    setItems(next);
    setStatus("saving");
    const body = groupByCategory
      ? {
          resource,
          groups: CERT_CATEGORIES.map((category) => ({
            category,
            ids: next.filter((row) => normalizeCategory(row.category) === category).map((row) => row.id),
          })),
        }
      : { resource, ids: next.map((row) => row.id) };

    fetch("/api/admin/reorder", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    })
      .then(async (res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return (await res.json()) as Row[];
      })
      .then((saved) => {
        setStatus("saved");
        if (Array.isArray(saved) && saved.length) {
          setItems(saved);
          onReordered?.(saved);
        }
        if (savedTimer.current) window.clearTimeout(savedTimer.current);
        savedTimer.current = window.setTimeout(() => setStatus("idle"), 2200);
      })
      .catch(() => {
        setStatus("error");
        setItems(rows); // revert to the last server truth
      });
  }

  function applyResult(result: { items: Row[]; changed: boolean }) {
    if (result.changed) persist(result.items);
  }

  function handleDragStart({ active }: DragStartEvent) {
    setActiveId(Number(active.id));
    tiltX.set(0);
    tiltY.set(0);
    lift.set(reduce ? 1 : 1.05);
  }

  function handleDragMove({ delta }: DragMoveEvent) {
    if (reduce) return;
    tiltY.set(clamp(delta.x * 0.12, -15, 15));
    tiltX.set(clamp(-delta.y * 0.05, -9, 9));
  }

  function handleDragEnd({ active, over }: DragEndEvent) {
    setActiveId(null);
    tiltX.set(0);
    tiltY.set(0);
    lift.set(1);
    if (!over) return;
    applyResult(
      applyDrop(items, {
        activeId: Number(active.id),
        overId: String(over.id),
        groupByCategory,
      })
    );
  }

  function moveBy(row: Row, direction: -1 | 1) {
    applyResult(moveByOffset(items, row.id, direction, groupByCategory));
  }

  const labelOf = (id: number | string) => {
    const row = items.find((item) => item.id === Number(id));
    return row ? primary(row) : String(id);
  };

  const announcements: Announcements = {
    onDragStart: ({ active }) => `Picked up ${labelOf(active.id)}. Use the arrow keys to move it, space to drop, escape to cancel.`,
    onDragOver: ({ active, over }) =>
      over ? `${labelOf(active.id)} is over position ${(items.findIndex((row) => row.id === Number(over.id)) + 1) || "?"}.` : undefined,
    onDragEnd: ({ active, over }) =>
      over ? `${labelOf(active.id)} moved. New order saved automatically.` : `${labelOf(active.id)} dropped back.`,
    onDragCancel: ({ active }) => `Moving ${labelOf(active.id)} was cancelled.`,
  };

  const activeRow = activeId !== null ? items.find((row) => row.id === activeId) ?? null : null;
  const activeIndex = activeRow
    ? (grouped.get(scopeOf(activeRow)) ?? []).findIndex((row) => row.id === activeRow.id)
    : 0;

  const lists = groupByCategory
    ? CERT_CATEGORIES.map((category) => ({ key: category, items: grouped.get(category) ?? [] }))
    : [{ key: "", items: grouped.get("") ?? [] }];

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="flex items-center gap-2 text-[13.5px] text-[rgb(var(--muted))]">
          <GripVertical size={15} aria-hidden className="opacity-60" />
          Drag a card to reorder — or use the move buttons. Positions save automatically.
        </p>
        <div className="flex min-h-[30px] items-center">
          <AnimatePresence mode="wait" initial={false}>
            {status !== "idle" ? (
              <motion.span
                key={status}
                role="status"
                aria-live="polite"
                initial={reduce ? { opacity: 0 } : { opacity: 0, y: 8, scale: 0.96 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={reduce ? { opacity: 0 } : { opacity: 0, y: -8, scale: 0.98 }}
                transition={{ type: "spring", stiffness: 420, damping: 30 }}
                className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[12.5px] font-semibold ${
                  status === "error"
                    ? "bg-red-100 text-red-700 dark:bg-red-950/50 dark:text-red-300"
                    : "bg-[rgb(var(--surface))] text-[rgb(var(--muted))]"
                }`}
              >
                {status === "saving" ? <Loader2 size={13} className="animate-spin" aria-hidden /> : null}
                {status === "saved" ? <Check size={13} aria-hidden className="text-[rgb(var(--accent))]" /> : null}
                {status === "error" ? <TriangleAlert size={13} aria-hidden /> : null}
                {status === "saving" ? "Saving order…" : status === "saved" ? "Order saved" : "Could not save — reverted"}
              </motion.span>
            ) : null}
          </AnimatePresence>
        </div>
      </div>

      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        measuring={{ droppable: { strategy: MeasuringStrategy.Always } }}
        accessibility={{ announcements }}
        onDragStart={handleDragStart}
        onDragMove={handleDragMove}
        onDragEnd={handleDragEnd}
        onDragCancel={() => {
          setActiveId(null);
          tiltX.set(0);
          tiltY.set(0);
          lift.set(1);
        }}
      >
        {lists.map((list) => (
          <div key={list.key || "single"} className={groupByCategory ? "mb-4 last:mb-0" : ""}>
            {groupByCategory ? (
              <GroupDropZone category={list.key as CertCategory} count={list.items.length}>
                <SortableContext items={list.items.map((row) => row.id)} strategy={verticalListSortingStrategy}>
                  <ul className="space-y-2">
                    {list.items.map((row, index) => (
                      <SortableRow
                        key={row.id}
                        row={row}
                        index={index}
                        primary={primary(row)}
                        secondary={secondary(row)}
                        reduce={reduce}
                        showCategory={false}
                        onEdit={() => onEdit(row)}
                        onDelete={() => onDelete(row)}
                        onMove={(direction) => moveBy(row, direction)}
                        canMoveUp={index > 0}
                        canMoveDown={index < list.items.length - 1}
                      />
                    ))}
                  </ul>
                  {list.items.length === 0 ? (
                    <p className="rounded-[14px] border border-[rgb(var(--line))] px-4 py-5 text-center text-[13.5px] text-[rgb(var(--muted))]">
                      Nothing here yet — drag an item in, or add one.
                    </p>
                  ) : null}
                </SortableContext>
              </GroupDropZone>
            ) : (
              <SortableContext items={list.items.map((row) => row.id)} strategy={verticalListSortingStrategy}>
                <ul className="space-y-2">
                  {list.items.map((row, index) => (
                    <SortableRow
                      key={row.id}
                      row={row}
                      index={index}
                      primary={primary(row)}
                      secondary={secondary(row)}
                      reduce={reduce}
                      showCategory={!groupByCategory}
                      onEdit={() => onEdit(row)}
                      onDelete={() => onDelete(row)}
                      onMove={(direction) => moveBy(row, direction)}
                      canMoveUp={index > 0}
                      canMoveDown={index < list.items.length - 1}
                    />
                  ))}
                </ul>
              </SortableContext>
            )}
          </div>
        ))}

        <DragOverlay dropAnimation={dropAnimation} zIndex={60}>
          {activeRow ? (
            // The lifted plate: a spring tilt that follows the drag velocity,
            // plus a deeper shadow so it reads as physically above the list.
            <motion.div
              data-drag-overlay
              style={{
                rotateX: tiltX,
                rotateY: tiltY,
                scale: lift,
                transformPerspective: 1100,
                transformStyle: "preserve-3d",
              }}
              className="cursor-grabbing"
            >
              <div className="pointer-events-none rounded-[18px] bg-[rgb(var(--surface))] p-[3px] shadow-[0_44px_90px_-40px_rgba(0,0,0,0.6),0_30px_60px_-30px_rgba(26,75,224,0.5)]">
                <RowCard
                  row={activeRow}
                  index={activeIndex}
                  primary={primary(activeRow)}
                  secondary={secondary(activeRow)}
                  dragging
                  reduce={reduce}
                  showCategory={!groupByCategory}
                />
              </div>
            </motion.div>
          ) : null}
        </DragOverlay>
      </DndContext>

      <p className="flex items-center gap-1.5 text-[13px] text-[rgb(var(--muted))]">
        <Sparkles size={13} aria-hidden className="text-[rgb(var(--accent))]" />
        New items land at the end of their group automatically — no order number to fill in.
      </p>
    </div>
  );
}
