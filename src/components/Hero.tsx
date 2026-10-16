"use client";

import { motion, useReducedMotion } from "framer-motion";
import { ArrowDown, ArrowUpRight, MapPin } from "lucide-react";
import { useLanguage } from "@/i18n/LanguageContext";
import type { PortfolioData } from "@/lib/portfolio";
import { LangFade } from "./LangFade";
import { Magnetic } from "./Magnetic";
import { Terminal } from "./Terminal";
import { Reveal } from "./Reveal";

export function HeroSection({ profile }: { profile: PortfolioData["profile"] }) {
  const { locale, t } = useLanguage();
  const reduce = useReducedMotion();
  return (
    <section id="top" className="grid items-center gap-10 pt-12 sm:pt-16 lg:grid-cols-[1fr_1.05fr] lg:gap-14">
      {/* Right column on desktop: profile. First in DOM for heading order and mobile. */}
      <div className="min-w-0 lg:order-2">
        <motion.h1
          initial={reduce ? false : { opacity: 0, y: 28 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
          className="mt-4 text-balance text-[clamp(2.6rem,1.3rem+4.5vw,4rem)] font-semibold leading-[0.95] tracking-[-0.03em]"
        >
          {profile.name}
        </motion.h1>
        <motion.p
          initial={reduce ? false : { opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.08 }}
          className="mt-4 text-[clamp(1.25rem,1.1rem+0.9vw,1.625rem)] font-medium leading-snug"
        >
          <LangFade text={locale === "id" ? profile.titleId : profile.titleEn} />
        </motion.p>
        <Reveal delay={0.1}>
          <p className="measure mt-5 text-[18px] leading-[1.55]">
            <LangFade text={t.hero.intro} />
          </p>
        </Reveal>
        <Reveal delay={0.16}>
          <div className="mt-7 flex flex-wrap items-center gap-3">
            <Magnetic strength={0.18} className="rounded-[10px]">
              <a href="#experience" className="btn-solid inline-flex items-center gap-2 px-5 py-3 text-[16px]">
                {t.hero.ctaPrimary} <ArrowDown size={17} />
              </a>
            </Magnetic>
            <Magnetic strength={0.18} className="rounded-[10px]">
              <a
                href="#contact"
                className="inline-flex items-center gap-2 rounded-[10px] px-5 py-3 text-[16px] font-semibold tone-step"
              >
                {t.hero.ctaSecondary} <ArrowUpRight size={17} />
              </a>
            </Magnetic>
          </div>
        </Reveal>
        <Reveal delay={0.2}>
          <div className="mt-7 flex flex-wrap items-center gap-x-5 gap-y-2 text-[14px] text-[rgb(var(--muted))]">
            <span className="inline-flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-emerald-500" /> {t.hero.status}
            </span>
            <span className="inline-flex items-center gap-1.5">
              <MapPin size={15} /> {profile.location}
            </span>
          </div>
        </Reveal>
      </div>

      {/* Left column on desktop: terminal + system status. */}
      <div className="min-w-0 lg:order-1">
        <Reveal delay={0.08}>
          <Terminal />
        </Reveal>
        <Reveal delay={0.14}>
          <div className="mt-4 flex items-center gap-2 text-[14px] text-[rgb(var(--muted))]">
            <span className="relative flex h-2 w-2">
              <span className="absolute h-full w-full rounded-full bg-emerald-500 opacity-60" />
              <span className="h-2 w-2 rounded-full bg-emerald-500" />
            </span>
            <span>edge-01 · OPNsense · WireGuard up · 99.98% uptime</span>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
