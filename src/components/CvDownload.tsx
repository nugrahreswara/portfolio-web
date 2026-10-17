"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { ChevronDown, Download, FileText } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useLanguage } from "@/i18n/LanguageContext";

// Downloadable CV menu: one trigger, one entry per language. The file paths
// come from the Profile row, so the admin can replace either PDF from the
// Media tab without touching code.
export function CvDownload({
  cvEnUrl,
  cvIdUrl,
  variant = "step",
  className = "",
}: {
  cvEnUrl: string;
  cvIdUrl: string;
  variant?: "solid" | "step";
  className?: string;
}) {
  const { t } = useLanguage();
  const reduce = useReducedMotion();
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);
  const btnRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (e: PointerEvent) => {
      if (!wrapRef.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setOpen(false);
        btnRef.current?.focus();
      }
    };
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const items = [
    { url: cvEnUrl, label: t.cv.en },
    { url: cvIdUrl, label: t.cv.id },
  ];

  return (
    <div ref={wrapRef} className={`relative inline-block ${className}`}>
      <button
        ref={btnRef}
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="menu"
        aria-expanded={open}
        className={`inline-flex items-center gap-2 rounded-[10px] px-5 py-3 text-[16px] font-semibold ${
          variant === "solid"
            ? "btn-solid"
            : "tone-step transition-transform duration-150 hover:-translate-y-0.5"
        }`}
      >
        <Download size={17} aria-hidden />
        {t.cv.label}
        <motion.span
          aria-hidden
          className="inline-flex"
          animate={{ rotate: open ? 180 : 0 }}
          transition={{ duration: 0.18, ease: [0.22, 1, 0.36, 1] }}
        >
          <ChevronDown size={16} />
        </motion.span>
      </button>

      <AnimatePresence>
        {open ? (
          <motion.div
            role="menu"
            aria-label={t.cv.menuLabel}
            initial={reduce ? { opacity: 0 } : { opacity: 0, y: -6, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={reduce ? { opacity: 0 } : { opacity: 0, y: -4, scale: 0.98 }}
            transition={{ duration: 0.16, ease: [0.22, 1, 0.36, 1] }}
            className="absolute left-0 top-[calc(100%+8px)] z-30 w-[250px] origin-top-left rounded-[14px] border border-[rgb(var(--line))] bg-[rgb(var(--bg))] p-1.5 shadow-[0_24px_60px_-30px_rgba(0,0,0,0.5)]"
          >
            {items.map((item) => (
              <a
                key={item.url}
                role="menuitem"
                href={item.url}
                download
                onClick={() => setOpen(false)}
                className="flex items-center gap-3 rounded-[10px] px-3.5 py-3 text-[15px] font-medium transition-colors hover:bg-[rgb(var(--surface))]"
              >
                <FileText size={17} aria-hidden className="shrink-0 text-[rgb(var(--accent))]" />
                <span className="min-w-0 flex-1 truncate">{item.label}</span>
                <span className="shrink-0 text-[13px] tabular-nums text-[rgb(var(--muted))]">{t.cv.pdf}</span>
              </a>
            ))}
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}
