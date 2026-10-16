"use client";

import { motion, useInView, useMotionValue, useReducedMotion, useSpring } from "framer-motion";
import { GraduationCap } from "lucide-react";
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { useLanguage } from "@/i18n/LanguageContext";
import type { PortfolioData } from "@/lib/portfolio";
import { LangFade } from "./LangFade";
import { Reveal } from "./Reveal";

const EASE = [0.22, 1, 0.36, 1] as const;

// A dot lights, and the rail reaches it, exactly when its centre crosses this
// fraction of the viewport height (measured from the top).
const READ_LINE = 0.6;
// The matching IntersectionObserver inset: hide the bottom (1 - READ_LINE) of
// the viewport so an element counts as "in view" only once it crosses the line.
// (Literal because framer-motion types this as a template-literal union.)
const READ_MARGIN = "0px 0px -40% 0px";

// Scroll-linked progress rail.
//
// The track is measured in the DOM from the centre of the first node to the
// centre of the last node, so it can never run short of or overshoot the dots.
// The glowing fill's tip is pinned to the reading line: `progress` is the
// fraction of the track that sits above the line, which means the tip meets
// each node at the exact instant that node crosses the line.
function ProgressRail() {
  const reduce = useReducedMotion();
  const trackRef = useRef<HTMLDivElement>(null);
  const [geom, setGeom] = useState<{ top: number; height: number } | null>(null);
  const progress = useMotionValue(0);
  const scaleY = useSpring(progress, { stiffness: 220, damping: 32, mass: 0.35 });

  // Measure first-node-centre -> last-node-centre, relative to the list box.
  // (Scoped from the rail's own parent: a child layout effect runs before the
  // parent's ref is attached, so a passed-in ref would still be null here.)
  useLayoutEffect(() => {
    const list = trackRef.current?.parentElement;
    if (!list) return;
    const measure = () => {
      const nodes = list.querySelectorAll<HTMLElement>("ol > li > span[aria-hidden]");
      if (!nodes.length) return;
      const lr = list.getBoundingClientRect();
      const first = nodes[0].getBoundingClientRect();
      const last = nodes[nodes.length - 1].getBoundingClientRect();
      const top = first.top + first.height / 2 - lr.top;
      const bottom = last.top + last.height / 2 - lr.top;
      const height = Math.max(0, bottom - top);
      setGeom((g) => (g && g.top === top && g.height === height ? g : { top, height }));
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(list);
    window.addEventListener("resize", measure);
    if (document.fonts) document.fonts.ready.then(measure).catch(() => {});
    return () => {
      ro.disconnect();
      window.removeEventListener("resize", measure);
    };
  }, []);

  // Track the reading line as the page scrolls (works with Lenis' native scroll).
  useEffect(() => {
    if (reduce) {
      progress.set(1);
      return;
    }
    const update = () => {
      const track = trackRef.current;
      if (!track) return;
      const r = track.getBoundingClientRect();
      if (r.height <= 0) {
        progress.set(0);
        return;
      }
      const line = window.innerHeight * READ_LINE;
      progress.set(Math.min(1, Math.max(0, (line - r.top) / r.height)));
    };
    update();
    window.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
    return () => {
      window.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
    };
  }, [geom, progress, reduce]);

  return (
    <div
      ref={trackRef}
      aria-hidden
      className="absolute left-0 flex w-4 justify-center"
      style={{ top: geom?.top ?? 0, height: geom?.height ?? 0 }}
    >
      <div className="h-full w-[4px] rounded-full bg-[rgb(var(--line))]">
        <motion.div
          className="h-full w-full origin-top rounded-full bg-[rgb(var(--accent))]"
          style={reduce ? { scaleY: 1 } : { scaleY, boxShadow: "0 0 14px rgb(var(--accent))" }}
        />
      </div>
    </div>
  );
}

function Node({ active, nodeRef }: { active: boolean; nodeRef: React.RefObject<HTMLSpanElement> }) {
  return (
    <motion.span
      ref={nodeRef}
      aria-hidden
      className="absolute left-0 top-7 h-4 w-4 rounded-full bg-[rgb(var(--line))]"
      initial={false}
      animate={
        active
          ? { scale: 1, backgroundColor: "rgb(var(--accent))", boxShadow: "0 0 0 5px rgba(26,75,224,0.16), 0 0 14px rgb(var(--accent))" }
          : { scale: 0.8, backgroundColor: "rgb(var(--line))", boxShadow: "0 0 0 0px rgba(26,75,224,0)" }
      }
      transition={{ type: "spring", stiffness: 320, damping: 20 }}
    />
  );
}

function TimelineItem({ children, delay = 0 }: { children: React.ReactNode; delay?: number }) {
  const ref = useRef<HTMLLIElement>(null);
  const inView = useInView(ref, { once: true, margin: "-12% 0px" });
  const nodeRef = useRef<HTMLSpanElement>(null);
  // Lit exactly while the node is above the reading line, in step with the rail.
  const lit = useInView(nodeRef, { margin: READ_MARGIN });
  return (
    <li ref={ref} className="relative pl-10">
      <Node active={lit} nodeRef={nodeRef} />
      <motion.div
        initial={{ opacity: 0, x: -16, y: 14 }}
        animate={inView ? { opacity: 1, x: 0, y: 0 } : {}}
        transition={{ duration: 0.65, delay, ease: [...EASE] }}
      >
        {children}
      </motion.div>
    </li>
  );
}

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
