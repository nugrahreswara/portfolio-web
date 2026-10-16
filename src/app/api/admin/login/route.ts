import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { createSession, clearSession } from "@/lib/auth";

export async function POST(req: Request) {
  try {
    const { password } = (await req.json()) as { password?: string };
    const expected = process.env.ADMIN_PASSWORD ?? "";
    if (!password || !expected) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    // Support both plain-text env password and bcrypt hash ($2a/$2b prefix)
    let ok = false;
    if (expected.startsWith("$2a$") || expected.startsWith("$2b$") || expected.startsWith("$2y$")) {
      ok = await bcrypt.compare(password, expected);
    } else {
      ok = password === expected;
    }
    if (!ok) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    await createSession();
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}

export async function DELETE() {
  clearSession();
  return NextResponse.json({ ok: true });
}
