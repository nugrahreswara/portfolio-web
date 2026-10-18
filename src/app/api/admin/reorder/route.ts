import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifyTokenString, ADMIN_COOKIE } from "@/lib/auth";
import { isOrderedResource, reorder } from "@/lib/ordering";

// Drag-and-drop persistence: the admin panel posts the full order it just
// dropped, and the server rewrites every position (and category, when a card
// was dropped into the other Certification group) in one transaction.
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

async function authed(): Promise<boolean> {
  const token = (await cookies()).get(ADMIN_COOKIE)?.value;
  if (!token) return false;
  return verifyTokenString(token);
}

export async function POST(req: Request) {
  if (!(await authed())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  let body: { resource?: unknown; ids?: unknown; groups?: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const resource = String(body.resource ?? "");
  if (!isOrderedResource(resource)) {
    return NextResponse.json({ error: "Unknown resource" }, { status: 404 });
  }

  const groups = Array.isArray(body.groups)
    ? (body.groups as Array<{ category?: unknown; ids?: unknown }>).map((g) => ({
        category: g?.category,
        ids: Array.isArray(g?.ids) ? g.ids : [],
      }))
    : undefined;

  if (!groups && !Array.isArray(body.ids)) {
    return NextResponse.json({ error: "Nothing to reorder" }, { status: 400 });
  }

  try {
    const rows = await reorder({
      resource,
      ids: Array.isArray(body.ids) ? body.ids : undefined,
      groups,
    });
    return NextResponse.json(rows);
  } catch (error) {
    console.error("[reorder]", error);
    return NextResponse.json({ error: "Reorder failed" }, { status: 500 });
  }
}
