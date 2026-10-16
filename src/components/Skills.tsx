"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Plus } from "lucide-react";
import { useEffect, useState } from "react";
import { useLanguage } from "@/i18n/LanguageContext";
import type { PortfolioData } from "@/lib/portfolio";
import { LangFade } from "./LangFade";
import { Magnetic } from "./Magnetic";
import { Reveal } from "./Reveal";

const chipList = {
  hidden: {},
  show: { transition: { staggerChildren: 0.045, delayChildren: 0.08 } },
};

const chip = {
  hidden: { opacity: 0, y: 14, scale: 0.94 },
  show: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { type: "spring" as const, stiffness: 320, damping: 22 },
  },
};

export function Skills({ groups }: { groups: PortfolioData["skillGroups"] }) {
  const { locale, t } = useLanguage();
  const [open, setOpen] = useState<number | null>(null);

  // First group starts expanded (ids come from the database).
  useEffect(() => {
    if (open === null && groups.length > 0) setOpen(groups[0].id);
  }, [open, groups]);
  return (
    <section id="expertise" className="mt-24 scroll-mt-24 sm:mt-32">
      <Reveal>
        <h2 className="text-[clamp(2rem,1.3rem+3.2vw,2.9rem)] font-semibold tracking-[-0.025em]">
          <LangFade text={t.skills.heading} />
        </h2>
      </Reveal>
      <div className="mt-8 space-y-2">
        {groups.map((g) => {
          const title = locale === "id" ? g.titleId || g.titleEn : g.titleEn;
          const items = locale === "id" ? g.itemsId : g.itemsEn;
          const isOpen = open === g.id;
          return (
            <Reveal key={g.id}>
              <div className="overflow-hidden rounded-[14px] tone-step">
                <button
                  onClick={() => setOpen(isOpen ? null : g.id)}
                  aria-expanded={isOpen}
                  className="flex w-full items-center justify-between px-5 py-4 text-left"
                >
                  <span className="text-[16px] font-semibold">{title}</span>
                  <motion.span
                    aria-hidden
                    className="inline-flex shrink-0"
                    animate={{ rotate: isOpen ? 45 : 0 }}
                    transition={{ type: "spring", stiffness: 300, damping: 20 }}
                  >
                    <Plus size={19} />
                  </motion.span>
                </button>
                <AnimatePresence initial={false}>
                  {isOpen && (
                    <motion.div
                      key="panel"
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
                      className="overflow-hidden"
                    >
                      <motion.ul
                        variants={chipList}
                        initial="hidden"
                        animate="show"
                        className="flex flex-wrap gap-2 px-5 pb-5"
                      >
                        {items.map((item, j) => (
                          <motion.li key={j} variants={chip}>
                            <Magnetic strength={0.32} className="rounded-[10px]">
                              <span className="block rounded-[10px] border border-[rgb(var(--line))] bg-[rgb(var(--bg))] px-3.5 py-2 text-[14px] font-medium transition-colors hover:border-[rgb(var(--accent))] hover:text-[rgb(var(--accent))]">
                                {item}
                              </span>
                            </Magnetic>
                          </motion.li>
                        ))}
                      </motion.ul>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </Reveal>
          );
        })}
      </div>
    </section>
  );
}

export function Stats() {
  const { t } = useLanguage();
  const figures = [
    { value: "10th", label: "National rank · LKS 2025" },
    { value: "6", label: `${t.stats.competitions}` },
  ];
  return (
    <section aria-label="Key figures" className="mt-24 scroll-mt-24 sm:mt-32">
      <motion.div
        className="grid gap-2 sm:grid-cols-2"
        initial="hidden"
        whileInView="show"
        viewport={{ once: true, margin: "-80px" }}
        variants={{ hidden: {}, show: { transition: { staggerChildren: 0.12 } } }}
      >
        {figures.map((f, i) => (
          <motion.div
            key={i}
            variants={{
              hidden: { opacity: 0, y: 28, scale: 0.97 },
              show: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] } },
            }}
          >
            <Magnetic strength={0.12} className="block h-full rounded-[14px]">
              <div className={`h-full rounded-[14px] p-8 text-center sm:p-10 ${i === 0 ? "bg-[rgb(var(--ink))] text-[rgb(var(--bg))]" : "tone-step"}`}>
                <p className="text-[clamp(3.2rem,2rem+5vw,5.2rem)] font-semibold leading-none tracking-[-0.03em] tabular-nums">{f.value}</p>
                <p className="mx-auto mt-3 max-w-[26ch] text-[16px] leading-snug opacity-80">{f.label}</p>
              </div>
            </Magnetic>
          </motion.div>
        ))}
      </motion.div>
    </section>
  );
}
