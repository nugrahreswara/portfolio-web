// Server-side ordering engine.
//
// Every ordered table (Experience, Education, Certification, Achievement, Skill
// Group, Project) is now positioned by the server, never by hand:
//
//   * a new row lands on MAX(order) + 1 inside its own group,
//   * Certification is ordered *per category*, so the two public sections can be
//     sorted independently,
//   * a delete or a category change re-compacts its group, and
//   * the admin panel's drag and drop sends the full order, which is written in
//     one transaction.
//
// The database backs this with unique indexes (Experience_sortOrder_key,
// Certification_category_sortOrder_key, ...), so a duplicate position can never
// be written even by a stale form. Positions are rewritten in two phases -
// park on unique negative numbers, then land on 1..n - so reordering can never
// trip over the unique constraint mid-flight.

import { Prisma } from "@prisma/client";
import { db } from "./db";
import { CERT_CATEGORIES, normalizeCategory, type CertCategory } from "./categories";

export const ORDERED_RESOURCES = [
  "experiences",
  "educations",
  "certifications",
  "achievements",
  "skillGroups",
  "projects",
] as const;
export type OrderedResource = (typeof ORDERED_RESOURCES)[number];

export function isOrderedResource(value: string): value is OrderedResource {
  return (ORDERED_RESOURCES as readonly string[]).includes(value);
}

// Minimal structural view of a Prisma delegate: only the calls ordering needs.
type Delegate = {
  findMany(args?: any): Promise<any[]>;
  findUnique(args: any): Promise<any | null>;
  aggregate(args: any): Promise<any>;
  create(args: any): Promise<any>;
  update(args: any): Promise<any>;
};

type Client = Prisma.TransactionClient | typeof db;

function delegate(client: Client, resource: OrderedResource): Delegate {
  const c = client as any;
  switch (resource) {
    case "experiences": return c.experience;
    case "educations": return c.education;
    case "certifications": return c.certification;
    case "achievements": return c.achievement;
    case "skillGroups": return c.skillGroup;
    case "projects": return c.project;
  }
}

/** Certifications are grouped by category; every other table is a single list. */
export function scopeOf(resource: OrderedResource, row: { category?: unknown }): CertCategory | null {
  return resource === "certifications" ? normalizeCategory(row.category) : null;
}

export function orderByFor(resource: OrderedResource): any {
  return resource === "certifications"
    ? [{ category: "asc" }, { sortOrder: "asc" }]
    : [{ sortOrder: "asc" }];
}

function scopeWhere(resource: OrderedResource, category: CertCategory | null): any {
  return resource === "certifications" ? { category } : undefined;
}

/** MAX(order) + 1 inside the row's own group. */
export async function nextSortOrder(
  client: Client,
  resource: OrderedResource,
  category: CertCategory | null = null
): Promise<number> {
  const agg = await delegate(client, resource).aggregate({
    where: scopeWhere(resource, category),
    _max: { sortOrder: true },
  });
  return Number(agg?._max?.sortOrder ?? 0) + 1;
}

type Position = { id: number; position: number; category: CertCategory | null };

async function writePositions(client: Client, resource: OrderedResource, positions: Position[]) {
  const d = delegate(client, resource);
  // Phase 1: park on globally unique negative numbers. Nothing can collide here
  // (the stored values are always positive), so items can swap freely.
  for (let i = 0; i < positions.length; i++) {
    const p = positions[i];
    const data: Record<string, unknown> = { sortOrder: -(i + 1) };
    if (p.category) data.category = p.category;
    await d.update({ where: { id: p.id }, data });
  }
  // Phase 2: land on the real 1..n positions of each group.
  for (const p of positions) {
    await d.update({ where: { id: p.id }, data: { sortOrder: p.position } });
  }
}

/**
 * Renumber one group to a dense 1..n sequence. No-op when already dense.
 * Pass `client` when the caller already opened a transaction.
 */
export async function compactGroup(
  resource: OrderedResource,
  category: CertCategory | null = null,
  client?: Client
): Promise<void> {
  const runner = client ?? db;
  const rows = await delegate(runner, resource).findMany({
    where: scopeWhere(resource, category),
    orderBy: [{ sortOrder: "asc" }, { id: "asc" }],
  });
  if (!rows.some((r, i) => r.sortOrder !== i + 1)) return;
  const positions = rows.map((r, i) => ({ id: r.id as number, position: i + 1, category }));
  if (client) {
    await writePositions(client, resource, positions);
    return;
  }
  await db.$transaction(async (tx) => writePositions(tx, resource, positions));
}

export type ReorderRequest = {
  resource: OrderedResource;
  /** Single-list resources (Experience, Education, ...): the full order. */
  ids?: unknown[];
  /** Certifications: one entry per category, in display order. */
  groups?: Array<{ category?: unknown; ids?: unknown[] }>;
};

type FinalGroup = { category: CertCategory | null; ids: number[] };

/**
 * Writes a drag-and-drop result. Ids the client did not mention keep their
 * relative order at the end of their own group, so a partial payload can never
 * drop rows, and an id moved into the other group also changes its category.
 */
export async function reorder(request: ReorderRequest): Promise<any[]> {
  const { resource } = request;
  const rows = await delegate(db, resource).findMany();
  const known = new Set<number>(rows.map((r) => r.id as number));

  const final: FinalGroup[] = [];
  const seenGroups = new Set<string | null>();

  const pushGroup = (category: CertCategory | null, ids: unknown[]) => {
    const key = category ?? "";
    if (seenGroups.has(key)) return;
    seenGroups.add(key);
    const clean: number[] = [];
    for (const raw of ids) {
      const id = Number(raw);
      if (!Number.isInteger(id) || !known.has(id) || final.some((g) => g.ids.includes(id))) continue;
      clean.push(id);
    }
    final.push({ category, ids: clean });
  };

  if (resource === "certifications") {
    for (const group of request.groups ?? []) {
      const category = normalizeCategory(group?.category);
      pushGroup(category, group?.ids ?? []);
    }
    // Safety net: a group the client forgot still gets its own list.
    for (const category of CERT_CATEGORIES) if (!seenGroups.has(category)) pushGroup(category, []);
  } else {
    pushGroup(null, request.ids ?? []);
  }

  // Anything unmentioned stays, appended after the ids the client sent.
  for (const row of rows) {
    if (final.some((g) => g.ids.includes(row.id as number))) continue;
    const scope = scopeOf(resource, row);
    let group = final.find((g) => g.category === scope);
    if (!group) {
      group = { category: scope, ids: [] };
      final.push(group);
    }
    group.ids.push(row.id as number);
  }

  const positions: Position[] = final.flatMap((group) =>
    group.ids.map((id, index) => ({ id, position: index + 1, category: group.category }))
  );

  if (positions.length) {
    await db.$transaction(async (tx) => writePositions(tx, resource, positions));
  }

  return delegate(db, resource).findMany({ orderBy: orderByFor(resource) });
}
