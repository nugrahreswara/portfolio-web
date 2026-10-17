import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { promises as fs } from "node:fs";
import path from "node:path";
import { verifyTokenString, ADMIN_COOKIE } from "@/lib/auth";
import {
  ALLOWED_TYPES,
  MAX_UPLOAD_BYTES,
  UPLOADS_DIR,
  contentTypeFor,
  isAllowed,
  resolveUpload,
  storedName,
} from "@/lib/uploads";

// Admin-only media library: list, upload, delete. Files are written into the
// data volume and served publicly by /files/* (see src/app/files).
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

async function authed(): Promise<boolean> {
  const token = (await cookies()).get(ADMIN_COOKIE)?.value;
  if (!token) return false;
  return verifyTokenString(token);
}

export async function GET() {
  if (!(await authed())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  await fs.mkdir(UPLOADS_DIR, { recursive: true });
  const entries = await fs.readdir(UPLOADS_DIR, { withFileTypes: true });
  const files = await Promise.all(
    entries
      .filter((e) => e.isFile() && !e.name.startsWith("."))
      .map(async (e) => {
        const stat = await fs.stat(path.join(UPLOADS_DIR, e.name));
        return {
          name: e.name,
          url: `/files/${e.name}`,
          size: stat.size,
          mtime: stat.mtimeMs,
          kind: contentTypeFor(e.name).startsWith("image/") ? "image" : "document",
        };
      })
  );
  files.sort((a, b) => b.mtime - a.mtime);
  return NextResponse.json(files);
}

export async function POST(req: Request) {
  if (!(await authed())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const form = await req.formData();
    const file = form.get("file");
    if (!(file instanceof File)) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }
    if (!isAllowed(file.name)) {
      return NextResponse.json(
        { error: `Unsupported file type. Allowed: ${Object.keys(ALLOWED_TYPES).join(", ")}` },
        { status: 415 }
      );
    }
    if (file.size > MAX_UPLOAD_BYTES) {
      return NextResponse.json({ error: "File exceeds the 12 MB limit" }, { status: 413 });
    }
    const name = storedName(file.name);
    await fs.mkdir(UPLOADS_DIR, { recursive: true });
    const buffer = Buffer.from(await file.arrayBuffer());
    await fs.writeFile(path.join(UPLOADS_DIR, name), buffer);
    return NextResponse.json(
      { name, url: `/files/${name}`, size: file.size, kind: file.type.startsWith("image/") ? "image" : "document" },
      { status: 201 }
    );
  } catch {
    return NextResponse.json({ error: "Upload failed" }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  if (!(await authed())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const name = new URL(req.url).searchParams.get("name") ?? "";
  const target = resolveUpload(name);
  if (!target || path.basename(target) !== name) {
    return NextResponse.json({ error: "Invalid name" }, { status: 400 });
  }
  try {
    await fs.unlink(target);
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
}
