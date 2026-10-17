import { promises as fs } from "node:fs";
import { contentTypeFor, resolveUpload } from "@/lib/uploads";

// Public, read-only serving of admin-uploaded files (PDFs / images) from the
// data volume. Stored names are timestamped and never reused, so responses can
// be cached hard. No directory listing, no traversal, no inline script types.
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Next.js 16: route handler params are async.
export async function GET(_req: Request, { params }: { params: Promise<{ path: string[] }> }) {
  const name = ((await params).path ?? []).join("/");
  const target = resolveUpload(name);
  if (!target || name.includes("..") || name.includes("\\")) {
    return new Response("Not found", { status: 404 });
  }
  try {
    const data = await fs.readFile(target);
    return new Response(data, {
      status: 200,
      headers: {
        "Content-Type": contentTypeFor(target),
        "Content-Length": String(data.byteLength),
        "Cache-Control": "public, max-age=31536000, immutable",
        "X-Content-Type-Options": "nosniff",
        "Content-Security-Policy": "default-src 'none'; img-src 'self'; style-src 'unsafe-inline'",
      },
    });
  } catch {
    return new Response("Not found", { status: 404 });
  }
}
