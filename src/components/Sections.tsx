"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { ArrowUpRight, Award, BadgeCheck, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useLanguage } from "@/i18n/LanguageContext";
import { celebrateBurst, celebrateSparkle, medalFor, type Medal } from "@/lib/celebrate";
import { startScroll, stopScroll } from "@/lib/scroll";
import type { PortfolioData } from "@/lib/portfolio";
import { LangFade } from "./LangFade";
import { Reveal } from "./Reveal";
import { TiltCard } from "./TiltCard";
import { ProgressRail, TimelineItem } from "./Timeline";

type Achievement = PortfolioData["achievements"][number];

// Medal chips: the rank encoded in the data becomes an accent the visitor can
// read at a glance before the confetti even fires.
const MEDAL_CHIP: Record<Medal, string> = {
  gold: "bg-amber-400 text-amber-950",
  silver: "bg-slate-300 text-slate-800",
  national: "bg-[rgb(var(--accent))] text-[rgb(var(--accent-ink))]",
  plain: "bg-[rgb(var(--bg))]",
};

function AchievementModal({ a, onClose }: { a: Achievement; onClose: () => void }) {
  const { locale } = useLanguage();
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    stopScroll();
    panelRef.current?.focus({ preventScroll: true });
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("keydown", onKey);
      startScroll();
    };
  }, [onClose]);

  const details = locale === "id" ? a.descriptionId : a.descriptionEn;
  const medal = medalFor(a.result, locale === "id" ? a.titleId || a.titleEn : a.titleEn);
  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-end justify-center p-4 sm:items-center"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      role="dialog"
      aria-modal="true"
      aria-label={locale === "id" ? a.titleId || a.titleEn : a.titleEn}
    >
      <div className="absolute inset-0 bg-black/60" onClick={onClose} aria-hidden />
      <motion.div
        ref={panelRef}
        tabIndex={-1}
        role="document"
        className="relative max-h-[85svh] w-full max-w-[560px] overflow-y-auto rounded-[20px] bg-[rgb(var(--bg))] p-7 outline-none sm:p-8"
        initial={{ opacity: 0, y: 48, scale: 0.96 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 32, scale: 0.97 }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
      >
        <button
          onClick={onClose}
          aria-label="Close"
          className="absolute right-4 top-4 inline-flex h-10 w-10 items-center justify-center rounded-[10px] tone-step"
        >
          <X size={18} />
        </button>
        <span className={`inline-flex h-11 w-11 items-center justify-center rounded-[10px] ${MEDAL_CHIP[medal]}`}>
          <Award size={20} />
        </span>
        <h3 className="mt-4 pr-10 text-[20px] font-semibold leading-snug">
          {locale === "id" ? a.titleId || a.titleEn : a.titleEn}
        </h3>
        <p className="mt-1 text-[16px] font-medium text-[rgb(var(--accent))]">{a.event}</p>
        <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-[14px] text-[rgb(var(--muted))]">
          {a.result ? <span>{a.result}</span> : null}
          <span className="tabular-nums">{a.period}</span>
        </div>
        <ul className="mt-5 space-y-2.5 text-[16px] leading-[1.55]">
          {details.map((d, j) => (
            <li key={j} className="flex gap-3">
              <span aria-hidden className="mt-[9px] h-1.5 w-1.5 shrink-0 rounded-full bg-[rgb(var(--accent))]" />
              <span>{d}</span>
            </li>
          ))}
        </ul>
      </motion.div>
    </motion.div>
  );
}

export function Achievements({ items }: { items: PortfolioData["achievements"] }) {
  const { locale, t } = useLanguage();
  const reduce = useReducedMotion();
  const [selected, setSelected] = useState<Achievement | null>(null);
  // First hover celebrates once per card per visit; clicking always celebrates.
  const sparkled = useRef<Set<number>>(new Set());

  const open = (a: Achievement) => setSelected(a);

  return (
    <section id="achievements" className="mt-24 scroll-mt-24 sm:mt-32">
      <Reveal>
        <h2 className="text-[clamp(2rem,1.3rem+3.2vw,2.9rem)] font-semibold tracking-[-0.025em]">
          <LangFade text={t.achievements.heading} />
        </h2>
      </Reveal>
      <motion.ol
        className="mt-8 space-y-4"
        initial="hidden"
        whileInView="show"
        viewport={{ once: true, margin: "-60px" }}
        variants={{ hidden: {}, show: { transition: { staggerChildren: 0.09 } } }}
      >
        {items.map((a, i) => {
          const title = locale === "id" ? a.titleId || a.titleEn : a.titleEn;
          const medal = medalFor(a.result, title);
          return (
            <motion.li
              key={a.id}
              variants={{
                hidden: { opacity: 0, y: 30 },
                show: { opacity: 1, y: 0, transition: { duration: 0.55, ease: [0.22, 1, 0.36, 1] } },
              }}
            >
              <TiltCard max={reduce ? 0 : 7} glare={!reduce}>
                <motion.article
                  className="cursor-pointer rounded-[14px] border border-transparent tone-step p-6 sm:p-7"
                  onPointerEnter={(e) => {
                    if (e.pointerType !== "mouse" || sparkled.current.has(a.id)) return;
                    sparkled.current.add(a.id);
                    celebrateSparkle(e.clientX / window.innerWidth, e.clientY / window.innerHeight, medal);
                  }}
                  onClick={(e) => {
                    celebrateBurst(e.clientX / window.innerWidth, e.clientY / window.innerHeight, medal);
                    open(a);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      const r = e.currentTarget.getBoundingClientRect();
                      celebrateBurst(
                        (r.left + r.width / 2) / window.innerWidth,
                        (r.top + r.height / 2) / window.innerHeight,
                        medal
                      );
                      open(a);
                    }
                  }}
                  tabIndex={0}
                  role="button"
                  aria-label={`${title} - details`}
                  whileHover={{
                    y: -4,
                    scale: 1.008,
                    borderColor: "rgb(var(--accent))",
                    boxShadow: "0 22px 50px -22px rgba(26,75,224,0.5)",
                  }}
                  transition={{ type: "spring", stiffness: 260, damping: 22 }}
                >
                  <div className="flex items-start gap-3">
                    <motion.span
                      className={`mt-0.5 inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-[10px] ${MEDAL_CHIP[medal]}`}
                      whileHover={{ rotate: -8, scale: 1.08 }}
                    >
                      {i === 0 || medal === "national" ? <Award size={18} /> : <BadgeCheck size={18} />}
                    </motion.span>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
                        <h3 className="text-[18px] font-semibold leading-snug">{title}</h3>
                        <span className="shrink-0 text-[14px] tabular-nums text-[rgb(var(--muted))]">{a.period}</span>
                      </div>
                      <p className="mt-1 text-[16px] font-medium text-[rgb(var(--accent))]">{a.event}</p>
                      {a.result ? <p className="mt-0.5 text-[14px] text-[rgb(var(--muted))]">{a.result}</p> : null}
                    </div>
                    <ArrowUpRight size={18} className="mt-1 shrink-0 opacity-40" aria-hidden />
                  </div>
                </motion.article>
              </TiltCard>
            </motion.li>
          );
        })}
      </motion.ol>
      <AnimatePresence>
        {selected && <AchievementModal key="modal" a={selected} onClose={() => setSelected(null)} />}
      </AnimatePresence>
    </section>
  );
}

export function Credentials({ items }: { items: PortfolioData["certifications"] }) {
  const { locale, t } = useLanguage();
  const certs = items.filter((c) => c.category === "certification");
  const trainings = items.filter((c) => c.category !== "certification");
  const Row = ({ c }: { c: (typeof items)[number] }) => (
    <motion.div
      whileHover={{ x: 6, boxShadow: "0 12px 30px -18px rgba(26,75,224,0.55)" }}
      transition={{ type: "spring", stiffness: 320, damping: 22 }}
      className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 rounded-[14px] px-6 py-4 tone-step"
    >
      <div className="min-w-0">
        <p className="text-[16px] font-semibold leading-snug">{locale === "id" ? c.titleId || c.titleEn : c.titleEn}</p>
        <p className="text-[14px] text-[rgb(var(--muted))]">
          {c.issuer} {c.issuerDetail ? `· ${c.issuerDetail}` : ""}
        </p>
      </div>
      <span className="shrink-0 text-[14px] tabular-nums text-[rgb(var(--muted))]">{c.period}</span>
    </motion.div>
  );
  return (
    <section id="credentials" className="mt-24 scroll-mt-24 sm:mt-32">
      <Reveal>
        <h2 className="text-[clamp(2rem,1.3rem+3.2vw,2.9rem)] font-semibold tracking-[-0.025em]">
          <LangFade text={t.certs.heading} />
        </h2>
      </Reveal>
      {/* Certifications ride the same timeline rail as Experience and Education. */}
      <div className="relative mt-8">
        <ProgressRail />
        <ol className="space-y-2">
          {certs.map((c, i) => (
            <TimelineItem key={c.id} delay={Math.min(i * 0.05, 0.25)}>
              <Row c={c} />
            </TimelineItem>
          ))}
        </ol>
      </div>
      <Reveal delay={0.05}>
        <h3 className="mt-10 text-[20px] font-semibold">{t.certs.training}</h3>
      </Reveal>
      <div className="mt-4 space-y-2">
        {trainings.map((c) => (
          <Row key={c.id} c={c} />
        ))}
      </div>
    </section>
  );
}

const rowVariants = {
  rest: { x: 0 },
  hover: { x: 5, transition: { type: "spring" as const, stiffness: 320, damping: 22 } },
};
const arrowVariants = {
  rest: { opacity: 0, x: -10 },
  hover: { opacity: 1, x: 0, transition: { duration: 0.25, ease: [0.22, 1, 0.36, 1] as const } },
};

export function Projects({ items }: { items: PortfolioData["projects"] }) {
  const { locale, t } = useLanguage();
  if (!items.length) return null;
  return (
    <section id="work" className="mt-24 scroll-mt-24 sm:mt-32">
      <Reveal>
        <h2 className="text-[clamp(2rem,1.3rem+3.2vw,2.9rem)] font-semibold tracking-[-0.025em]">
          <LangFade text={t.projects.heading} />
        </h2>
      </Reveal>
      <motion.div
        className="mt-8 space-y-2"
        initial="hidden"
        whileInView="show"
        viewport={{ once: true, margin: "-60px" }}
        variants={{ hidden: {}, show: { transition: { staggerChildren: 0.07 } } }}
      >
        {items.map((p) => (
          <motion.div
            key={p.id}
            variants={{
              hidden: { opacity: 0, y: 22 },
              show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] } },
            }}
          >
            <motion.div
              className="group flex flex-col gap-y-2 rounded-[14px] px-6 py-5 tone-step sm:flex-row sm:flex-wrap sm:items-center sm:justify-between sm:gap-x-6"
              initial="rest"
              whileHover="hover"
              variants={rowVariants}
            >
              <div className="min-w-0 sm:flex-1">
                <p className="text-[16px] font-semibold">{locale === "id" ? p.titleId || p.titleEn : p.titleEn}</p>
                <p className="mt-1 max-w-[62ch] text-[16px] leading-relaxed text-[rgb(var(--muted))]">
                  {locale === "id" ? p.descriptionId || p.descriptionEn : p.descriptionEn}
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1 sm:shrink-0">
                <span className="text-[14px] tabular-nums text-[rgb(var(--muted))]">{p.tech}</span>
                <motion.span variants={arrowVariants} aria-hidden>
                  <ArrowUpRight size={18} className="text-[rgb(var(--accent))]" />
                </motion.span>
              </div>
            </motion.div>
          </motion.div>
        ))}
      </motion.div>
    </section>
  );
}
