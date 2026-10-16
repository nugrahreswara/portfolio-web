// Runs inside the container on startup. Seeds only when tables are empty
// so admin edits are never wiped by a restart.
import { PrismaClient } from "@prisma/client";
import { execSync } from "node:child_process";

const db = new PrismaClient();

try {
  const count = await db.experience.count();
  if (count === 0) {
    console.log("[entrypoint] empty database - running seed…");
    execSync("npx tsx prisma/seed.ts", { stdio: "inherit" });
  } else {
    console.log(`[entrypoint] database has ${count} experience rows - skipping seed.`);
  }
} catch (err) {
  console.error("[entrypoint] seed check failed:", err);
} finally {
  await db.$disconnect();
}
