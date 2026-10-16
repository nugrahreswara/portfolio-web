"use client";

import Link from "next/link";
import { useLanguage } from "@/i18n/LanguageContext";
import { BackgroundToggle, LanguageSwitcher, ThemeToggle } from "./Toggles";

export function Navbar() {
  const { t } = useLanguage();
  return (
    <header className="sticky top-0 z-40 bg-[rgb(var(--bg))]">
      <div className="page-margin mx-auto flex h-16 max-w-[1400px] items-center justify-between gap-4">
        <Link href="#top" className="text-[18px] font-bold tracking-tight">
          nugrah<span className="text-[rgb(var(--accent))]">.</span>my.id
        </Link>
        <nav className="hidden items-center gap-7 text-[16px] font-medium lg:flex" aria-label="Primary">
          <a href="#experience" className="opacity-80 transition-opacity hover:opacity-100">{t.nav.experience}</a>
          <a href="#expertise" className="opacity-80 transition-opacity hover:opacity-100">{t.nav.expertise}</a>
          <a href="#achievements" className="opacity-80 transition-opacity hover:opacity-100">{t.nav.achievements}</a>
          <a href="#credentials" className="opacity-80 transition-opacity hover:opacity-100">{t.nav.certs}</a>
          <a href="#contact" className="btn-solid px-4 py-2">{t.nav.contact}</a>
        </nav>
        <div className="flex items-center gap-2">
          <BackgroundToggle />
          <LanguageSwitcher />
          <ThemeToggle />
        </div>
      </div>
      <nav className="page-margin mx-auto flex max-w-[1400px] gap-5 overflow-x-auto pb-3 text-[14px] font-medium lg:hidden" aria-label="Primary mobile">
        <a href="#experience">{t.nav.experience}</a>
        <a href="#expertise">{t.nav.expertise}</a>
        <a href="#achievements">{t.nav.achievements}</a>
        <a href="#credentials">{t.nav.certs}</a>
        <a href="#contact">{t.nav.contact}</a>
      </nav>
    </header>
  );
}
