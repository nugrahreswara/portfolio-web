import type { Metadata } from "next";
import { verifySession } from "@/lib/auth";
import { LoginScreen, Dashboard } from "@/components/admin";

export const dynamic = "force-dynamic";

// Reachable by URL only: nothing on the public site links here, and search
// engines are asked to stay away as well (see also public/robots.txt).
export const metadata: Metadata = {
  title: "Admin",
  robots: { index: false, follow: false },
};

export default async function AdminPage() {
  const authed = await verifySession();
  if (!authed) return <LoginScreen />;

  return (
    <main className="page-margin mx-auto max-w-[1100px] py-10">
      <a
        href="/"
        className="text-[14px] font-medium text-[rgb(var(--muted))] transition-colors hover:text-[rgb(var(--ink))]"
      >
        ← Back to portfolio
      </a>
      <h1 className="mt-3 text-[clamp(2rem,1.3rem+3.2vw,2.9rem)] font-semibold tracking-[-0.025em]">Admin panel</h1>
      <p className="mt-2 max-w-[60ch] text-[16px] text-[rgb(var(--muted))]">
        Manage experience, education, certifications, achievements, skills and projects. Changes go live immediately, with no code edits.
      </p>
      <div className="mt-8">
        <Dashboard />
      </div>
    </main>
  );
}
