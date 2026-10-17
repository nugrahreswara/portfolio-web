import path from "node:path";

// Uploads live inside the data volume (/app/data/uploads in Docker, ./data
// /uploads in local dev) so they survive rebuilds and restarts. The public
// /files/* route serves them read-only.
export const UPLOADS_DIR =
  process.env.UPLOADS_DIR ?? path.join(process.cwd(), "data", "uploads");

export const MAX_UPLOAD_BYTES = 12 * 1024 * 1024; // 12 MB

// PDFs and web-safe raster images only. SVG is deliberately excluded (it can
// carry scripts even when served with a strict content type).
export const ALLOWED_TYPES: Record<string, string> = {
  ".pdf": "application/pdf",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp",
  ".avif": "image/avif",
  ".gif": "image/gif",
};

export function extensionOf(name: string): string {
  return path.extname(name).toLowerCase();
}

export function isAllowed(name: string): boolean {
  return extensionOf(name) in ALLOWED_TYPES;
}

export function contentTypeFor(name: string): string {
  return ALLOWED_TYPES[extensionOf(name)] ?? "application/octet-stream";
}

// "Policy Brief (2026).pdf" -> "policy-brief-2026.pdf", then prefixed with a
// timestamp + random tag so uploads never collide and can be cached forever.
export function storedName(original: string): string {
  const ext = extensionOf(original);
  const base = path
    .basename(original, ext)
    .toLowerCase()
    .replace(/[^a-z0-9-_]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
  const tag = Math.random().toString(36).slice(2, 8);
  return `${Date.now().toString(36)}-${tag}-${base || "file"}${ext}`;
}

// Resolve a request path inside UPLOADS_DIR; anything that escapes is refused.
export function resolveUpload(name: string): string | null {
  // Uploads live in a runtime data volume (or a directory created after build),
  // so keep Turbopack's tracer from scanning the whole project for it.
  const base = path.resolve(/* turbopackIgnore: true */ UPLOADS_DIR);
  const target = path.resolve(base, name);
  if (target !== base && !target.startsWith(base + path.sep)) return null;
  return target;
}
