"use client";

import Link from "next/link";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { Download, Menu, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useLanguage } from "@/i18n/LanguageContext";
import type { PortfolioData } from "@/lib/portfolio";
import { BackgroundToggle, LanguageSwitcher, ThemeToggle } from "./Toggles";

// Floating glass navigation (explicit product requirement; a deliberate
// exception to the house "no glass" rule, marked data-ui below). Fixed with a
// page inset so it reads as a floating bar; solidifies slightly on scroll.
// Phones get a hamburger + animated panel with 44px rows; toggles live in the
// panel under 640px and in the bar above it.
export function Navbar({ profile }: { profile: PortfolioData["profile"] }) {
  const { t } = useLanguage();
  const reduce = useReducedMotion();
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    const onPointerDown = (e: PointerEvent) => {
      if (!wrapRef.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("keydown", onKey);
    document.addEventListener("pointerdown", onPointerDown);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("pointerdown", onPointerDown);
    };
  }, [open]);

  const links = [
    { href: "#experience", label: t.nav.experience },
    { href: "#expertise", label: t.nav.expertise },
    { href: "#achievements", label: t.nav.achievements },
    { href: "#credentials", label: t.nav.certs },
  ];

  return (
    <div
      ref={wrapRef}
      className="page-margin pointer-events-none fixed inset-x-0 top-0 z-50 pt-[max(0.75rem,env(safe-area-inset-top))]"
    >
      <header className="pointer-events-auto mx-auto max-w-[1400px]">
        {/* data-ui + taste-skill-ignore: floating glass bar is a product requirement */}
        <div
          data-ui
          data-scrolled={scrolled ? "true" : "false"}
          className="nav-glass flex h-14 items-center justify-between gap-2 rounded-[16px] pl-3 pr-2 sm:h-16 sm:px-4"
        >
          <Link href="#top" className="px-1.5 text-[18px] font-bold tracking-tight">
            nugrah<span className="text-[rgb(var(--accent))]">.</span>my.id
          </Link>

          <nav className="hidden items-center gap-7 text-[16px] font-medium lg:flex" aria-label="Primary">
            {links.map((l) => (
              <a key={l.href} href={l.href} className="opacity-80 transition-opacity hover:opacity-100">
                {l.label}
              </a>
            ))}
          </nav>

          <div className="flex items-center gap-2">
            <div className="hidden items-center gap-2 sm:flex">
              <BackgroundToggle />
              <LanguageSwitcher />
              <ThemeToggle />
            </div>
            <a href="#contact" className="btn-solid hidden px-4 py-2 text-[15px] lg:inline-flex">
              {t.nav.contact}
            </a>
            <button
              type="button"
              onClick={() => setOpen((o) => !o)}
              aria-expanded={open}
              aria-controls="mobile-menu"
              aria-label={open ? "Close menu" : "Open menu"}
              className="inline-flex h-11 w-11 items-center justify-center rounded-[12px] tone-step lg:hidden"
            >
              <AnimatePresence mode="wait" initial={false}>
                <motion.span
                  key={open ? "close" : "open"}
                  className="inline-flex"
                  initial={{ rotate: -60, opacity: 0, scale: 0.85 }}
                  animate={{ rotate: 0, opacity: 1, scale: 1 }}
                  exit={{ rotate: 60, opacity: 0, scale: 0.85 }}
                  transition={{ duration: 0.16, ease: [0.22, 1, 0.36, 1] }}
                >
                  {open ? <X size={20} /> : <Menu size={20} />}
                </motion.span>
              </AnimatePresence>
            </button>
          </div>
        </div>

        <AnimatePresence>
          {open ? (
            <motion.nav
              id="mobile-menu"
              aria-label="Menu"
              data-ui
              initial={reduce ? { opacity: 0 } : { opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={reduce ? { opacity: 0 } : { opacity: 0, y: -8 }}
              transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
              className="nav-glass mt-2 overflow-y-auto overscroll-contain rounded-[16px] p-2 lg:hidden"
              style={{ maxHeight: "min(32rem, calc(100svh - 6rem))" }}
            >
              <ul>
                {links.map((l) => (
                  <li key={l.href}>
                    <a
                      href={l.href}
                      onClick={() => setOpen(false)}
                      className="block rounded-[12px] px-4 py-3.5 text-[17px] font-medium transition-colors hover:bg-[rgb(var(--bg))]/60 active:bg-[rgb(var(--bg))]/60"
                    >
                      {l.label}
                    </a>
                  </li>
                ))}
                <li>
                  <a
                    href="#contact"
                    onClick={() => setOpen(false)}
                    className="block rounded-[12px] px-4 py-3.5 text-[17px] font-semibold text-[rgb(var(--accent))] transition-colors hover:bg-[rgb(var(--bg))]/60 active:bg-[rgb(var(--bg))]/60"
                  >
                    {t.nav.contact}
                  </a>
                </li>
              </ul>

              <div className="mt-1 border-t border-[rgb(var(--line))] px-4 py-3">
                <p className="flex items-center gap-2 text-[13px] font-medium text-[rgb(var(--muted))]">
                  <Download size={14} aria-hidden /> {t.cv.label}
                </p>
                <div className="mt-2 flex flex-wrap gap-2">
                  <a
                    href={profile.cvEnUrl}
                    download
                    className="inline-flex items-center rounded-[10px] px-3.5 py-2.5 text-[14px] font-semibold tone-step"
                  >
                    {t.cv.en}
                  </a>
                  <a
                    href={profile.cvIdUrl}
                    download
                    className="inline-flex items-center rounded-[10px] px-3.5 py-2.5 text-[14px] font-semibold tone-step"
                  >
                    {t.cv.id}
                  </a>
                </div>
              </div>

              <div className="flex items-center gap-2 border-t border-[rgb(var(--line))] px-3 py-3">
                <BackgroundToggle />
                <LanguageSwitcher />
                <ThemeToggle />
              </div>
            </motion.nav>
          ) : null}
        </AnimatePresence>
      </header>
    </div>
  );
}
