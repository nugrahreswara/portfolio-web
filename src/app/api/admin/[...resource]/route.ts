import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifyTokenString, ADMIN_COOKIE } from "@/lib/auth";
import { db } from "@/lib/db";

const MODELS = ["profile", "experiences", "educations", "certifications", "achievements", "skillGroups", "projects", "messages"] as const;
type Model = (typeof MODELS)[number];

async function authed(): Promise<boolean> {
  const token = cookies().get(ADMIN_COOKIE)?.value;
  if (!token) return false;
  return verifyTokenString(token);
}

function delegate(model: Model) {
  switch (model) {
    case "profile": return db.profile;
    case "experiences": return db.experience;
    case "educations": return db.education;
    case "certifications": return db.certification;
    case "achievements": return db.achievement;
    case "skillGroups": return db.skillGroup;
    case "projects": return db.project;
    case "messages": return db.message;
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
  for (const k of ["sortOrder"]) {
    if (out[k] !== undefined && out[k] !== "") out[k] = Number(out[k]);
  }
  for (const k of ["current", "featured", "read"]) {
    if (out[k] !== undefined) out[k] = out[k] === true || out[k] === "true" || out[k] === "on";
  }
  if (out.id !== undefined) delete out.id;
  if (out.createdAt !== undefined) delete out.createdAt;
  if (out.updatedAt !== undefined) delete out.updatedAt;
  return out;
}

export async function GET(_req: Request, { params }: { params: { resource: string[] } }) {
  if (!(await authed())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const model = params.resource?.[0] as Model;
  if (!MODELS.includes(model)) return NextResponse.json({ error: "Unknown resource" }, { status: 404 });
  const id = params.resource?.[1];
  const d = delegate(model) as any;
  if (model === "profile") {
    const row = await d.findUnique({ where: { id: 1 } });
    return NextResponse.json(row);
  }
  if (id) {
    const row = await d.findUnique({ where: { id: Number(id) } });
    return NextResponse.json(row);
  }
  const rows = await d.findMany({ orderBy: (model === "messages" ? { createdAt: "desc" } : { sortOrder: "asc" }) as any });
  return NextResponse.json(rows);
}

export async function POST(req: Request, { params }: { params: { resource: string[] } }) {
  if (!(await authed())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const model = params.resource?.[0] as Model;
  if (!MODELS.includes(model) || model === "messages" || model === "profile") {
    return NextResponse.json({ error: "Unknown resource" }, { status: 404 });
  }
  const body = await req.json();
  const d = delegate(model) as any;
  const row = await d.create({ data: normalize(model, body) });
  return NextResponse.json(row, { status: 201 });
}

export async function PUT(req: Request, { params }: { params: { resource: string[] } }) {
  if (!(await authed())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const [modelRaw, idRaw] = params.resource ?? [];
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
  const row = await d.update({ where: { id: Number(idRaw) }, data });
  return NextResponse.json(row);
}

export async function DELETE(_req: Request, { params }: { params: { resource: string[] } }) {
  if (!(await authed())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const [modelRaw, idRaw] = params.resource ?? [];
  const model = modelRaw as Model;
  if (!MODELS.includes(model) || model === "profile") {
    return NextResponse.json({ error: "Unknown resource" }, { status: 404 });
  }
  const d = delegate(model) as any;
  await d.delete({ where: { id: Number(idRaw) } });
  return NextResponse.json({ ok: true });
}
