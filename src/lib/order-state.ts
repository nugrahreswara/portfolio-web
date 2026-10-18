// Pure list arithmetic behind the admin drag-and-drop list.
//
// Kept out of the React component on purpose: "where does the card land" is the
// part of dragging that can actually be wrong (same-group nudges, cross-group
// drops into Certification vs Training, drops onto an empty group, drops back
// onto the card itself), and this way it is a plain function that can be tested
// without a browser. The component only wires events and rendering around it.

import { CERT_CATEGORIES, normalizeCategory, type CertCategory } from "./categories";

export type OrderedRow = { id: number; category?: unknown };

/** Droppable id used by the group containers (see AdminOrderList). */
export const GROUP_DROPPABLE_PREFIX = "group:";

export type DropInput = {
  activeId: number;
  /** Item id, or `group:<category>` when the card was dropped on the group itself. */
  overId: string;
  groupByCategory: boolean;
};

export type DropResult<T> = { items: T[]; changed: boolean };

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function scopeKey(row: OrderedRow, groupByCategory: boolean): string {
  return groupByCategory ? normalizeCategory(row.category) : "";
}

/**
 * Applies one drop and returns the list in its new order. Rows other than the
 * dragged one keep their relative order; the dragged row also changes category
 * when it crossed into the other group.
 */
export function applyDrop<T extends OrderedRow>(items: T[], input: DropInput): DropResult<T> {
  const { activeId, overId, groupByCategory } = input;
  const active = items.find((row) => row.id === activeId);
  if (!active) return { items, changed: false };

  const overRow = items.find((row) => String(row.id) === overId);
  if (overRow && overRow.id === activeId) return { items, changed: false };

  const overIsGroup = overId.startsWith(GROUP_DROPPABLE_PREFIX);
  if (!overRow && (!overIsGroup || !groupByCategory)) return { items, changed: false };

  const fromKey = scopeKey(active, groupByCategory);
  const toKey = groupByCategory
    ? overRow
      ? scopeKey(overRow, true)
      : normalizeCategory(overId.slice(GROUP_DROPPABLE_PREFIX.length))
    : "";
  // Dropped on the container of the group it already sits in: keep the position
  // (only the other group's container means "move me over there").
  if (!overRow && fromKey === toKey) return { items, changed: false };

  // The destination list is the target group without the dragged card, so the
  // insert index can be computed the same way dnd-kit's arrayMove does it.
  const destination = items.filter((row) => scopeKey(row, groupByCategory) === toKey && row.id !== activeId);
  let index = destination.length;
  if (overRow) {
    const overIndex = destination.findIndex((row) => row.id === overRow.id);
    if (overIndex < 0) return { items, changed: false };
    // Inside one group, dropping onto a later card means landing after it once
    // the dragged card has been pulled out of the list.
    const movingDown =
      fromKey === toKey &&
      items.findIndex((row) => row.id === activeId) < items.findIndex((row) => row.id === overRow.id);
    index = overIndex + (movingDown ? 1 : 0);
  }

  const moved: T = fromKey === toKey ? active : ({ ...active, category: toKey as CertCategory } as T);
  const target = [...destination];
  target.splice(clamp(index, 0, target.length), 0, moved);

  const rebuilt: T[] = groupByCategory
    ? CERT_CATEGORIES.flatMap((category) =>
        category === toKey ? target : items.filter((row) => scopeKey(row, true) === category && row.id !== activeId)
      )
    : target;

  const changed =
    fromKey !== toKey ||
    rebuilt.length !== items.length ||
    rebuilt.some((row, i) => row.id !== items[i]?.id);
  return changed ? { items: rebuilt, changed } : { items, changed: false };
}

/** Move up / move down buttons - the keyboard and screen-reader alternative to dragging. */
export function moveByOffset<T extends OrderedRow>(
  items: T[],
  id: number,
  direction: -1 | 1,
  groupByCategory: boolean
): DropResult<T> {
  const row = items.find((item) => item.id === id);
  if (!row) return { items, changed: false };
  const key = scopeKey(row, groupByCategory);
  const list = items.filter((item) => scopeKey(item, groupByCategory) === key);
  const index = list.findIndex((item) => item.id === id);
  const target = index + direction;
  if (index < 0 || target < 0 || target >= list.length) return { items, changed: false };
  return applyDrop(items, { activeId: id, overId: String(list[target].id), groupByCategory });
}
