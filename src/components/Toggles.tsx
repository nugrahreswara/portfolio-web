"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { Moon, Network, Sun } from "lucide-react";
import { useLanguage } from "@/i18n/LanguageContext";
import { useBackground } from "./NodeField";
import type { Locale } from "@/i18n/dictionaries";

export function ThemeToggle() {
  const { theme, setTheme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  const dark = (mounted ? resolvedTheme ?? theme : "light") === "dark";
  return (
    <button
      onClick={() => setTheme(dark ? "light" : "dark")}
      aria-label={dark ? "Switch to light mode" : "Switch to dark mode"}
      className="inline-flex h-10 w-10 items-center justify-center rounded-[10px] tone-step transition-transform hover:-translate-y-0.5"
    >
      <AnimatePresence mode="wait" initial={false}>
        <motion.span
          key={dark ? "sun" : "moon"}
          className="inline-flex"
          initial={{ rotate: -70, opacity: 0, scale: 0.7 }}
          animate={{ rotate: 0, opacity: 1, scale: 1 }}
          exit={{ rotate: 70, opacity: 0, scale: 0.7 }}
          transition={{ duration: 0.18, ease: [0.22, 1, 0.36, 1] }}
        >
          {dark ? <Sun size={18} /> : <Moon size={18} />}
        </motion.span>
      </AnimatePresence>
    </button>
  );
}

export function BackgroundToggle() {
  const { enabled, toggle } = useBackground();
  const { t } = useLanguage();
  const label = enabled ? t.nav.bgOn : t.nav.bgOff;
  return (
    <button
      onClick={toggle}
      aria-pressed={enabled}
      aria-label={label}
      title={label}
      className="inline-flex h-10 w-10 items-center justify-center rounded-[10px] tone-step transition-transform hover:-translate-y-0.5"
    >
      <AnimatePresence mode="wait" initial={false}>
        <motion.span
          key={enabled ? "on" : "off"}
          className="inline-flex"
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: enabled ? 1 : 0.4, scale: 1 }}
          exit={{ opacity: 0, scale: 0.8 }}
          transition={{ duration: 0.18, ease: [0.22, 1, 0.36, 1] }}
        >
          <Network size={18} />
        </motion.span>
      </AnimatePresence>
    </button>
  );
}

export function LanguageSwitcher() {
  const { locale, setLocale } = useLanguage();
  const next: Locale = locale === "en" ? "id" : "en";
  return (
    <button
      onClick={() => setLocale(next)}
      aria-label={locale === "en" ? "Ganti ke Bahasa Indonesia" : "Switch to English"}
      className="inline-flex h-10 items-center gap-1.5 rounded-[10px] px-3 text-[14px] font-semibold tone-step transition-transform hover:-translate-y-0.5"
    >
      <span className={locale === "en" ? "opacity-100" : "opacity-40"}>EN</span>
      <span aria-hidden className="opacity-30">/</span>
      <span className={locale === "id" ? "opacity-100" : "opacity-40"}>ID</span>
    </button>
  );
}
