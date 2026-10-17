"use client";

import { motion } from "framer-motion";
import { GraduationCap } from "lucide-react";
import { useLanguage } from "@/i18n/LanguageContext";
import type { PortfolioData } from "@/lib/portfolio";
import { LangFade } from "./LangFade";
import { Reveal } from "./Reveal";
import { ProgressRail, TimelineItem } from "./Timeline";

export function Experience({ items }: { items: PortfolioData["experiences"] }) {
  const { locale, t } = useLanguage();
  return (
    <section id="experience" className="mt-24 scroll-mt-24 sm:mt-32">
      <Reveal>
        <h2 className="text-[clamp(2rem,1.3rem+3.2vw,2.9rem)] font-semibold tracking-[-0.025em]">
          <LangFade text={t.experience.heading} />
        </h2>
      </Reveal>
      <div className="relative mt-8">
        <ProgressRail />
        <ol className="space-y-8">
          {items.map((e) => (
            <TimelineItem key={e.id}>
              <motion.article
                className="rounded-[14px] border border-transparent tone-step p-6 sm:p-7"
                whileHover={{
                  y: -5,
                  borderColor: "rgb(var(--accent))",
                  boxShadow: "0 20px 46px -20px rgba(26,75,224,0.45)",
                }}
                transition={{ type: "spring", stiffness: 260, damping: 22 }}
              >
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <h3 className="text-[20px] font-semibold leading-tight">{e.company}</h3>
                  <span className="text-[14px] tabular-nums text-[rgb(var(--muted))]">{e.period}</span>
                </div>
                <p className="mt-1 text-[16px] font-medium text-[rgb(var(--accent))]">
                  {locale === "id" ? e.roleId || e.roleEn : e.roleEn}
                  {e.location ? <span className="font-normal text-[rgb(var(--muted))]"> · {e.location}</span> : null}
                </p>
                <ul className="mt-4 space-y-2.5 text-[16px] leading-[1.55]">
                  {(locale === "id" ? e.bulletsId : e.bulletsEn).map((b, j) => (
                    <li key={j} className="flex gap-3">
                      <span aria-hidden className="mt-[9px] h-1.5 w-1.5 shrink-0 rounded-full bg-[rgb(var(--accent))]" />
                      <span>{b}</span>
                    </li>
                  ))}
                </ul>
              </motion.article>
            </TimelineItem>
          ))}
        </ol>
      </div>
    </section>
  );
}

export function Education({ items }: { items: PortfolioData["educations"] }) {
  const { locale, t } = useLanguage();
  return (
    <section id="education" className="mt-24 scroll-mt-24 sm:mt-32">
      <Reveal>
        <h2 className="flex items-center gap-3 text-[clamp(2rem,1.3rem+3.2vw,2.9rem)] font-semibold tracking-[-0.025em]">
          <GraduationCap size={30} aria-hidden /> <LangFade text={t.education.heading} />
        </h2>
      </Reveal>
      <div className="relative mt-8">
        <ProgressRail />
        <ol className="space-y-2">
          {items.map((e) => (
            <TimelineItem key={e.id}>
              <motion.div
                className="flex flex-wrap items-baseline justify-between gap-2 rounded-[14px] px-6 py-5 tone-step"
                whileHover={{ x: 6, boxShadow: "0 14px 34px -18px rgba(26,75,224,0.5)" }}
                transition={{ type: "spring", stiffness: 280, damping: 22 }}
              >
                <div>
                  <p className="text-[16px] font-semibold">{e.school}</p>
                  <p className="text-[16px] text-[rgb(var(--muted))]">{locale === "id" ? e.degreeId || e.degreeEn : e.degreeEn}</p>
                </div>
                <span className="text-[14px] tabular-nums text-[rgb(var(--muted))]">{e.period}</span>
              </motion.div>
            </TimelineItem>
          ))}
        </ol>
      </div>
    </section>
  );
}
