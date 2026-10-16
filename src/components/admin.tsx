"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { ArrowLeft, ArrowRight, Eye, EyeOff, Loader2, Lock } from "lucide-react";
import { useEffect, useRef, useState } from "react";

export function LoginScreen() {
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [visible, setVisible] = useState(false);
  const reduce = useReducedMotion();
  const inputRef = useRef<HTMLInputElement>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (busy) return;
    if (!password) {
      setError("Enter the admin password.");
      inputRef.current?.focus();
      return;
    }
    setBusy(true);
    setError("");
    try {
      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      if (res.ok) {
        window.location.reload();
        return;
      }
      setError("Wrong password. Check ADMIN_PASSWORD in your .env.");
    } catch {
      setError("Could not reach the server. Try again.");
    }
    setBusy(false);
    inputRef.current?.focus();
    inputRef.current?.select();
  }

  return (
    <main className="relative flex min-h-[100svh] items-center justify-center px-5 py-14">
      <h1 className="sr-only">Admin sign in</h1>

      <a
        href="/"
        className="absolute left-5 top-6 inline-flex items-center gap-1.5 text-[14px] font-medium text-[rgb(var(--muted))] transition-colors hover:text-[rgb(var(--ink))] sm:left-8"
      >
        <ArrowLeft size={15} /> Back to portfolio
      </a>

      <motion.section
        data-ui
        aria-labelledby="admin-card-title"
        initial={reduce ? false : { opacity: 0, y: 26, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        className="panel-glass w-full max-w-[440px] rounded-[20px] p-8 sm:p-10"
      >
        <span className="inline-flex h-11 w-11 items-center justify-center rounded-[12px] bg-[rgb(var(--accent))] text-[rgb(var(--accent-ink))]">
          <Lock size={19} />
        </span>

        <h2 id="admin-card-title" className="mt-5 text-[20px] font-semibold tracking-[-0.02em]">
          Admin access
        </h2>
        <p className="mt-1.5 text-[16px] leading-relaxed text-[rgb(var(--muted))]">
          Sign in to manage the portfolio content.
        </p>

        <form onSubmit={submit} noValidate className="mt-7">
          <label htmlFor="admin-password" className="block text-[14px] font-medium text-[rgb(var(--muted))]">
            Password
          </label>

          <motion.div
            animate={error && !reduce ? { x: [0, -7, 7, -5, 5, 0] } : { x: 0 }}
            transition={{ duration: 0.42, ease: "easeInOut" }}
            className="relative mt-2"
          >
            <input
              id="admin-password"
              ref={inputRef}
              type={visible ? "text" : "password"}
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                if (error) setError("");
              }}
              autoComplete="current-password"
              autoFocus
              required
              aria-invalid={error ? true : undefined}
              aria-describedby={error ? "admin-password-error" : undefined}
              className="field w-full rounded-[12px] py-3 pl-4 pr-12 text-[16px]"
            />
            <button
              type="button"
              onClick={() => {
                setVisible((v) => !v);
                inputRef.current?.focus();
              }}
              aria-label={visible ? "Hide password" : "Show password"}
              aria-pressed={visible}
              className="absolute right-1.5 top-1/2 inline-flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-[10px] text-[rgb(var(--muted))] transition-colors hover:bg-[rgb(var(--surface))] hover:text-[rgb(var(--ink))]"
            >
              <AnimatePresence mode="wait" initial={false}>
                <motion.span
                  key={visible ? "hide" : "show"}
                  className="inline-flex"
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  transition={{ duration: 0.15 }}
                >
                  {visible ? <EyeOff size={17} /> : <Eye size={17} />}
                </motion.span>
              </AnimatePresence>
            </button>
          </motion.div>

          <AnimatePresence initial={false}>
            {error ? (
              <motion.p
                id="admin-password-error"
                role="alert"
                initial={{ opacity: 0, y: -6, height: 0 }}
                animate={{ opacity: 1, y: 0, height: "auto" }}
                exit={{ opacity: 0, y: -6, height: 0 }}
                transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
                className="overflow-hidden text-[14px] font-medium text-red-600 dark:text-red-400"
              >
                <span className="mt-2.5 block">{error}</span>
              </motion.p>
            ) : null}
          </AnimatePresence>

          <button
            type="submit"
            disabled={busy}
            className="btn-solid mt-5 flex w-full items-center justify-center gap-2 px-5 py-3 text-[16px] disabled:cursor-not-allowed disabled:opacity-70"
          >
            {busy ? (
              <>
                <Loader2 size={17} className="animate-spin" /> Signing in
              </>
            ) : (
              <>
                Sign in <ArrowRight size={17} />
              </>
            )}
          </button>
        </form>
      </motion.section>
    </main>
  );
}

type Field = { key: string; label: string; kind: "text" | "textarea" | "list" | "check" | "number" | "select"; options?: string[] };

const CONFIG: Record<string, { label: string; fields: Field[]; singleton?: boolean; readonly?: boolean }> = {
  profile: {
    label: "Profile",
    singleton: true,
    fields: [
      { key: "name", label: "Name", kind: "text" },
      { key: "titleEn", label: "Title (EN)", kind: "text" },
      { key: "titleId", label: "Title (ID)", kind: "text" },
      { key: "summaryEn", label: "Summary (EN)", kind: "textarea" },
      { key: "summaryId", label: "Summary (ID)", kind: "textarea" },
      { key: "email", label: "Email", kind: "text" },
      { key: "phone", label: "Phone", kind: "text" },
      { key: "location", label: "Location", kind: "text" },
      { key: "linkedin", label: "LinkedIn URL", kind: "text" },
      { key: "portfolioUrl", label: "Portfolio URL", kind: "text" },
      { key: "github", label: "GitHub URL", kind: "text" },
    ],
  },
  experiences: {
    label: "Experience",
    fields: [
      { key: "company", label: "Company", kind: "text" },
      { key: "roleEn", label: "Role (EN)", kind: "text" },
      { key: "roleId", label: "Role (ID)", kind: "text" },
      { key: "location", label: "Location", kind: "text" },
      { key: "period", label: "Period label", kind: "text" },
      { key: "current", label: "Current role", kind: "check" },
      { key: "bulletsEn", label: "Bullets (EN) - one per line", kind: "list" },
      { key: "bulletsId", label: "Bullets (ID) - one per line", kind: "list" },
      { key: "sortOrder", label: "Order", kind: "number" },
    ],
  },
  educations: {
    label: "Education",
    fields: [
      { key: "school", label: "School", kind: "text" },
      { key: "degreeEn", label: "Degree (EN)", kind: "text" },
      { key: "degreeId", label: "Degree (ID)", kind: "text" },
      { key: "field", label: "Field", kind: "text" },
      { key: "period", label: "Period label", kind: "text" },
      { key: "current", label: "Current", kind: "check" },
      { key: "sortOrder", label: "Order", kind: "number" },
    ],
  },
  certifications: {
    label: "Certifications & Training",
    fields: [
      { key: "titleEn", label: "Title (EN)", kind: "text" },
      { key: "titleId", label: "Title (ID)", kind: "text" },
      { key: "issuer", label: "Issuer", kind: "text" },
      { key: "period", label: "Period label", kind: "text" },
      { key: "category", label: "Category", kind: "select", options: ["certification", "training"] },
      { key: "credentialUrl", label: "Credential URL", kind: "text" },
      { key: "sortOrder", label: "Order", kind: "number" },
    ],
  },
  achievements: {
    label: "Achievements",
    fields: [
      { key: "titleEn", label: "Title (EN)", kind: "text" },
      { key: "titleId", label: "Title (ID)", kind: "text" },
      { key: "event", label: "Event", kind: "text" },
      { key: "result", label: "Result", kind: "text" },
      { key: "period", label: "Period label", kind: "text" },
      { key: "descriptionEn", label: "Details (EN) - one per line", kind: "list" },
      { key: "descriptionId", label: "Details (ID) - one per line", kind: "list" },
      { key: "sortOrder", label: "Order", kind: "number" },
    ],
  },
  skillGroups: {
    label: "Skill groups",
    fields: [
      { key: "titleEn", label: "Title (EN)", kind: "text" },
      { key: "titleId", label: "Title (ID)", kind: "text" },
      { key: "itemsEn", label: "Items (EN) - one per line", kind: "list" },
      { key: "itemsId", label: "Items (ID) - one per line", kind: "list" },
      { key: "sortOrder", label: "Order", kind: "number" },
    ],
  },
  projects: {
    label: "Projects",
    fields: [
      { key: "titleEn", label: "Title (EN)", kind: "text" },
      { key: "titleId", label: "Title (ID)", kind: "text" },
      { key: "descriptionEn", label: "Description (EN)", kind: "textarea" },
      { key: "descriptionId", label: "Description (ID)", kind: "textarea" },
      { key: "tech", label: "Tech (comma separated)", kind: "text" },
      { key: "url", label: "URL", kind: "text" },
      { key: "repo", label: "Repo URL", kind: "text" },
      { key: "featured", label: "Featured", kind: "check" },
      { key: "sortOrder", label: "Order", kind: "number" },
    ],
  },
  messages: { label: "Inbox", fields: [], readonly: true },
};

function toFormValue(v: unknown): string | boolean {
  if (typeof v === "boolean") return v;
  if (v == null) return "";
  if (typeof v === "string" && v.trim().startsWith("[")) {
    try {
      const arr = JSON.parse(v);
      if (Array.isArray(arr)) return arr.join("\n");
    } catch { /* fall through */ }
  }
  return String(v);
}

function Editor({ resource, row, onSaved, onCancel }: { resource: string; row: Record<string, any> | null; onSaved: () => void; onCancel: () => void }) {
  const fields = CONFIG[resource].fields;
  const [form, setForm] = useState<Record<string, any>>(() => {
    const init: Record<string, any> = {};
    for (const f of fields) init[f.key] = row ? toFormValue(row[f.key]) : f.kind === "check" ? false : "";
    return init;
  });
  const [busy, setBusy] = useState(false);

  async function save() {
    setBusy(true);
    const isSingleton = CONFIG[resource].singleton;
    const url = isSingleton ? `/api/admin/${resource}` : row?.id ? `/api/admin/${resource}/${row.id}` : `/api/admin/${resource}`;
    const method = isSingleton ? "PUT" : row?.id ? "PUT" : "POST";
    await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
    setBusy(false);
    onSaved();
  }

  return (
    <div className="rounded-[14px] border border-[rgb(var(--accent))] p-5">
      <div className="grid gap-3 sm:grid-cols-2">
        {fields.map((f) => (
          <label key={f.key} className={`block ${f.kind === "textarea" || f.kind === "list" ? "sm:col-span-2" : ""} ${f.kind === "check" ? "flex items-center gap-2" : ""}`}>
            {f.kind === "check" ? (
              <>
                <input type="checkbox" checked={!!form[f.key]} onChange={(e) => setForm({ ...form, [f.key]: e.target.checked })} className="h-4 w-4" />
                <span className="text-[14.5px] font-medium">{f.label}</span>
              </>
            ) : (
              <>
                <span className="mb-1 block text-[13.5px] font-semibold text-[rgb(var(--muted))]">{f.label}</span>
                {f.kind === "select" ? (
                  <select value={String(form[f.key] ?? "")} onChange={(e) => setForm({ ...form, [f.key]: e.target.value })} className="w-full rounded-[10px] border border-[rgb(var(--line))] bg-[rgb(var(--bg))] px-3 py-2 text-[15px]">
                    {(f.options ?? []).map((o) => <option key={o} value={o}>{o}</option>)}
                  </select>
                ) : f.kind === "textarea" || f.kind === "list" ? (
                  <textarea value={String(form[f.key] ?? "")} onChange={(e) => setForm({ ...form, [f.key]: e.target.value })} rows={f.kind === "list" ? 4 : 3} className="w-full rounded-[10px] border border-[rgb(var(--line))] bg-[rgb(var(--bg))] px-3 py-2 text-[14px]" />
                ) : (
                  <input type={f.kind === "number" ? "number" : "text"} value={String(form[f.key] ?? "")} onChange={(e) => setForm({ ...form, [f.key]: e.target.value })} className="w-full rounded-[10px] border border-[rgb(var(--line))] bg-[rgb(var(--bg))] px-3 py-2 text-[15px]" />
                )}
              </>
            )}
          </label>
        ))}
      </div>
      <div className="mt-4 flex gap-2">
        <button onClick={save} disabled={busy} className="btn-solid px-5 py-2.5 text-[15px] disabled:opacity-60">{busy ? "…" : "Save"}</button>
        <button onClick={onCancel} className="rounded-[10px] border border-[rgb(var(--line))] px-5 py-2.5 text-[15px] font-semibold">Cancel</button>
      </div>
    </div>
  );
}

export function Dashboard() {
  const tabs = Object.keys(CONFIG);
  const [tab, setTab] = useState("experiences");
  const [rows, setRows] = useState<any[]>([]);
  const [singleton, setSingleton] = useState<any>(null);
  const [editing, setEditing] = useState<{ row: any | null } | null>(null);
  const [loading, setLoading] = useState(true);

  async function load(resource: string) {
    setLoading(true);
    const res = await fetch(`/api/admin/${resource}`);
    const data = await res.json();
    if (CONFIG[resource].singleton) setSingleton(data);
    else setRows(Array.isArray(data) ? data : []);
    setLoading(false);
  }

  useEffect(() => {
    setEditing(null);
    load(tab);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab]);

  async function remove(id: number) {
    if (!confirm("Delete this entry?")) return;
    await fetch(`/api/admin/${tab}/${id}`, { method: "DELETE" });
    load(tab);
  }

  async function logout() {
    await fetch("/api/admin/login", { method: "DELETE" });
    window.location.reload();
  }

  const cfg = CONFIG[tab];

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-2">
          {tabs.map((k) => {
            const active = tab === k;
            return (
              <button
                key={k}
                onClick={() => setTab(k)}
                className={`relative overflow-hidden rounded-[10px] px-3.5 py-2 text-[14.5px] font-semibold ${active ? "text-[rgb(var(--accent-ink))]" : "tone-step"}`}
              >
                {active && (
                  <motion.span
                    layoutId="admin-tab-bg"
                    className="absolute inset-0 bg-[rgb(var(--accent))]"
                    transition={{ type: "spring", stiffness: 420, damping: 34 }}
                  />
                )}
                <span className="relative">{CONFIG[k].label}</span>
              </button>
            );
          })}
        </div>
        <button onClick={logout} className="rounded-[10px] border border-[rgb(var(--line))] px-4 py-2 text-[14.5px] font-semibold">
          Sign out
        </button>
      </div>

      <div className="mt-6">
        {editing ? (
          <Editor resource={tab} row={editing.row} onSaved={() => { setEditing(null); load(tab); }} onCancel={() => setEditing(null)} />
        ) : cfg.singleton ? (
          <div className="space-y-4">
            <div className="rounded-[14px] border border-[rgb(var(--line))] p-5 text-[15px]">
              <p className="font-semibold">{singleton?.name}</p>
              <p className="text-[rgb(var(--muted))]">{singleton?.titleEn} · {singleton?.email}</p>
            </div>
            <button onClick={() => setEditing({ row: singleton })} className="btn-solid px-5 py-2.5 text-[15px]">Edit profile</button>
          </div>
        ) : cfg.readonly ? (
          <div className="space-y-3">
            {loading ? <p className="text-[15px] text-[rgb(var(--muted))]">Loading…</p> : rows.length === 0 ? <p className="text-[15px] text-[rgb(var(--muted))]">No messages yet.</p> : rows.map((m) => (
              <div key={m.id} className="rounded-[14px] border border-[rgb(var(--line))] p-5">
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <p className="font-semibold">{m.name} <span className="font-normal text-[rgb(var(--muted))]">· {m.email}</span></p>
                  <span className="text-[13px] text-[rgb(var(--muted))]">{new Date(m.createdAt).toLocaleString()}</span>
                </div>
                <p className="mt-2 text-[15px]">{m.message}</p>
                <button onClick={() => remove(m.id)} className="mt-3 text-[14px] font-semibold text-red-600 underline underline-offset-4">Delete</button>
              </div>
            ))}
          </div>
        ) : (
          <div className="space-y-3">
            <button onClick={() => setEditing({ row: null })} className="btn-solid px-5 py-2.5 text-[15px]">+ Add {cfg.label.toLowerCase()}</button>
            {loading ? <p className="text-[15px] text-[rgb(var(--muted))]">Loading…</p> : rows.map((r) => (
              <div key={r.id} className="flex flex-wrap items-center justify-between gap-3 rounded-[14px] border border-[rgb(var(--line))] px-5 py-4">
                <div className="min-w-0 text-[15px]">
                  <p className="truncate font-semibold">{r.company ?? r.school ?? r.titleEn ?? r.name ?? `#${r.id}`}</p>
                  <p className="truncate text-[rgb(var(--muted))]">{r.roleEn ?? r.degreeEn ?? r.issuer ?? r.event ?? r.tech ?? ""}</p>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => setEditing({ row: r })} className="rounded-[10px] border border-[rgb(var(--line))] px-4 py-1.5 text-[14px] font-semibold">Edit</button>
                  <button onClick={() => remove(r.id)} className="rounded-[10px] border border-red-300 px-4 py-1.5 text-[14px] font-semibold text-red-600">Delete</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
