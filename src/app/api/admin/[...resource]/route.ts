import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import type { Prisma } from "@prisma/client";
import { verifyTokenString, ADMIN_COOKIE } from "@/lib/auth";
import { db } from "@/lib/db";
import { normalizeCategory } from "@/lib/categories";
import {
  compactGroup,
  isOrderedResource,
  nextSortOrder,
  orderByFor,
  scopeOf,
  type OrderedResource,
} from "@/lib/ordering";

const MODELS = ["profile", "experiences", "educations", "certifications", "achievements", "skillGroups", "projects", "messages"] as const;
type Model = (typeof MODELS)[number];

async function authed(): Promise<boolean> {
  const token = (await cookies()).get(ADMIN_COOKIE)?.value;
  if (!token) return false;
  return verifyTokenString(token);
}

function delegate(model: Model, client: typeof db | Prisma.TransactionClient = db) {
  const c = client as any;
  switch (model) {
    case "profile": return c.profile;
    case "experiences": return c.experience;
    case "educations": return c.education;
    case "certifications": return c.certification;
    case "achievements": return c.achievement;
    case "skillGroups": return c.skillGroup;
    case "projects": return c.project;
    case "messages": return c.message;
  }
}

function normalize(model: Model, data: Record<string, unknown>) {
  // Convert newline-separated textarea input into JSON-string arrays for list fields
  const listFields: Record<string, string[]> = {
    experiences: ["bulletsEn", "bulletsId"],
    achievements: ["descriptionEn", "descriptionId"],
    skillGroups: ["itemsEn", "itemsId"],
  };
  const out: Record<string, unknown> = { ...data };
  for (const f of listFields[model] ?? []) {
    const v = out[f];
    if (Array.isArray(v)) out[f] = JSON.stringify(v);
    else if (typeof v === "string" && !v.trim().startsWith("[")) {
      out[f] = JSON.stringify(v.split("\n").map((s) => s.trim()).filter(Boolean));
    }
  }
  // `sortOrder` is never taken from the client: the server owns every position
  // (see src/lib/ordering.ts), so a stale form can not create a clash.
  delete out.sortOrder;
  for (const k of ["current", "featured", "read"]) {
    if (out[k] !== undefined) out[k] = out[k] === true || out[k] === "true" || out[k] === "on";
  }
  // Certification.category is the switch between the two public sections; a
  // blank or unknown value would silently fall into Training. Pin it down here.
  if (model === "certifications") out.category = normalizeCategory(out.category);
  if (out.id !== undefined) delete out.id;
  if (out.createdAt !== undefined) delete out.createdAt;
  if (out.updatedAt !== undefined) delete out.updatedAt;
  return out;
}

// Next.js 16: route handler params are async.
type RouteContext = { params: Promise<{ resource: string[] }> };

export async function GET(_req: Request, { params }: RouteContext) {
  if (!(await authed())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { resource } = await params;
  const model = resource?.[0] as Model;
  if (!MODELS.includes(model)) return NextResponse.json({ error: "Unknown resource" }, { status: 404 });
  const id = resource?.[1];
  const d = delegate(model) as any;
  if (model === "profile") {
    const row = await d.findUnique({ where: { id: 1 } });
    return NextResponse.json(row);
  }
  if (id) {
    const row = await d.findUnique({ where: { id: Number(id) } });
    return NextResponse.json(row);
  }
  const rows = await d.findMany({
    orderBy: isOrderedResource(model) ? orderByFor(model) : ({ createdAt: "desc" } as any),
  });
  return NextResponse.json(rows);
}

export async function POST(req: Request, { params }: RouteContext) {
  if (!(await authed())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { resource } = await params;
  const model = resource?.[0] as Model;
  if (!MODELS.includes(model) || model === "messages" || model === "profile") {
    return NextResponse.json({ error: "Unknown resource" }, { status: 404 });
  }
  const body = await req.json();
  const data = normalize(model, body);
  const d = delegate(model) as any;

  // Auto-increment: a new row always lands after the last one of its group
  // (MAX(order) + 1), computed inside the same transaction as the insert so two
  // quick saves can never pick the same slot.
  if (isOrderedResource(model)) {
    const row = await db.$transaction(async (tx) => {
      const sortOrder = await nextSortOrder(tx, model, scopeOf(model, data));
      return delegate(model, tx).create({ data: { ...data, sortOrder } });
    });
    return NextResponse.json(row, { status: 201 });
  }

  const row = await d.create({ data });
  return NextResponse.json(row, { status: 201 });
}

export async function PUT(req: Request, { params }: RouteContext) {
  if (!(await authed())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { resource } = await params;
  const [modelRaw, idRaw] = resource ?? [];
  const model = modelRaw as Model;
  if (!MODELS.includes(model)) return NextResponse.json({ error: "Unknown resource" }, { status: 404 });
  const body = await req.json();
  const data = normalize(model, body);
  const d = delegate(model) as any;
  if (model === "profile") {
    const row = await d.upsert({ where: { id: 1 }, update: data, create: { id: 1, ...data } });
    return NextResponse.json(row);
  }
  if (!idRaw) return NextResponse.json({ error: "Missing id" }, { status: 400 });
  const id = Number(idRaw);

  if (isOrderedResource(model)) {
    const row = await db.$transaction(async (tx) => {
      const current = await (delegate(model, tx) as any).findUnique({ where: { id } });
      if (!current) return null;
      const from = scopeOf(model, current);
      const to = scopeOf(model, data);
      // An edit keeps its position. Only a real category change (Certification
      // -> Training and back) moves the row: it is appended to the end of the
      // destination group, and the source group is compacted behind it.
      const moved = from !== to;
      const payload: Record<string, unknown> = { ...data };
      if (moved) payload.sortOrder = await nextSortOrder(tx, model, to);
      const updated = await (delegate(model, tx) as any).update({ where: { id }, data: payload });
      if (moved) await compactGroup(model, from, tx);
      return updated;
    });
    if (!row) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json(row);
  }

  const row = await d.update({ where: { id }, data });
  return NextResponse.json(row);
}

export async function DELETE(_req: Request, { params }: RouteContext) {
  if (!(await authed())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { resource } = await params;
  const [modelRaw, idRaw] = resource ?? [];
  const model = modelRaw as Model;
  if (!MODELS.includes(model) || model === "profile") {
    return NextResponse.json({ error: "Unknown resource" }, { status: 404 });
  }
  const d = delegate(model) as any;
  const id = Number(idRaw);
  if (isOrderedResource(model)) {
    const row = await d.findUnique({ where: { id } });
    if (!row) return NextResponse.json({ error: "Not found" }, { status: 404 });
    const scope = scopeOf(model, row);
    await d.delete({ where: { id } });
    // Close the gap so the list stays a dense 1..n sequence.
    await compactGroup(model, scope);
    return NextResponse.json({ ok: true });
  }
  await d.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
