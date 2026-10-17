"use client";

import { useEffect, useRef, useState } from "react";
import { motion, useReducedMotion, useScroll, useTransform } from "framer-motion";
import { Mail } from "lucide-react";
import { LinkedInIcon } from "./icons";
import { useLanguage } from "@/i18n/LanguageContext";
import type { PortfolioData } from "@/lib/portfolio";
import { CvDownload } from "./CvDownload";
import { LangFade } from "./LangFade";
import { Reveal } from "./Reveal";

export function Contact({ profile }: { profile: PortfolioData["profile"] }) {
  const { t } = useLanguage();
  const [form, setForm] = useState({ name: "", email: "", message: "" });
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("sending");
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!res.ok) throw new Error("failed");
      setStatus("sent");
      setForm({ name: "", email: "", message: "" });
    } catch {
      setStatus("error");
    }
  }

  return (
    <section id="contact" className="mt-24 sm:mt-32">
      <Reveal>
        <p className="max-w-[30ch] text-[clamp(1.5rem,1.15rem+2vw,2.25rem)] font-semibold leading-[1.1] tracking-[-0.02em]">
          <LangFade text={t.contact.heading} />
        </p>
      </Reveal>
      <div className="mt-10 grid gap-10 lg:grid-cols-[1fr_1.1fr]">
        <Reveal delay={0.05}>
          <div>
            <p className="text-[18px] font-semibold">{t.contact.question}</p>
            <div className="mt-4 space-y-2.5 text-[16px]">
              <a className="link-underline flex items-center gap-2 font-medium" href={`mailto:${profile.email}`}>
                <Mail size={17} /> {profile.email}
              </a>
              <a className="link-underline flex items-center gap-2 font-medium" href={profile.linkedin} target="_blank" rel="noreferrer">
                <LinkedInIcon size={17} /> linkedin.com/in/nugrahreswara
              </a>
            </div>
            <p className="mt-4 text-[14px] text-[rgb(var(--muted))]">{t.contact.reply}</p>
            <Reveal delay={0.14}>
              <div className="mt-6">
                <CvDownload cvEnUrl={profile.cvEnUrl} cvIdUrl={profile.cvIdUrl} variant="solid" />
              </div>
            </Reveal>
          </div>
        </Reveal>
        <Reveal delay={0.1}>
          <form onSubmit={submit} className="space-y-3 rounded-[14px] p-5 tone-step sm:p-6">
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="block">
                <span className="mb-1.5 block text-[14px] font-medium">{t.contact.name}</span>
                <input
                  required
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="w-full rounded-[10px] border border-[rgb(var(--line))] bg-[rgb(var(--bg))] px-3.5 py-2.5 text-[16px] outline-none focus:border-[rgb(var(--accent))]"
                  autoComplete="name"
                />
              </label>
              <label className="block">
                <span className="mb-1.5 block text-[14px] font-medium">{t.contact.email}</span>
                <input
                  required
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  className="w-full rounded-[10px] border border-[rgb(var(--line))] bg-[rgb(var(--bg))] px-3.5 py-2.5 text-[16px] outline-none focus:border-[rgb(var(--accent))]"
                  autoComplete="email"
                />
              </label>
            </div>
            <label className="block">
              <span className="mb-1.5 block text-[14px] font-medium">{t.contact.message}</span>
              <textarea
                required
                rows={5}
                value={form.message}
                onChange={(e) => setForm({ ...form, message: e.target.value })}
                className="w-full resize-y rounded-[10px] border border-[rgb(var(--line))] bg-[rgb(var(--bg))] px-3.5 py-2.5 text-[16px] outline-none focus:border-[rgb(var(--accent))]"
              />
            </label>
            <button type="submit" disabled={status === "sending"} className="btn-solid w-full px-5 py-3 text-[16px] disabled:opacity-60">
              {status === "sending" ? "…" : t.contact.send}
            </button>
            {status === "sent" ? <p className="text-[14px] font-medium text-emerald-600">{t.contact.sent}</p> : null}
            {status === "error" ? <p className="text-[14px] font-medium text-red-600">Failed to send. Please email directly.</p> : null}
          </form>
        </Reveal>
      </div>
    </section>
  );
}

export function Footer({ profile }: { profile: PortfolioData["profile"] }) {
  const { t } = useLanguage();
  const reduce = useReducedMotion();
  const footRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: footRef, offset: ["start end", "end end"] });
  const rise = useTransform(scrollYProgress, [0, 1], ["-6%", "0%"]);
  return (
    <footer className="mt-24 sm:mt-32">
      <div ref={footRef} className="relative overflow-hidden rounded-[20px]">
        <motion.div className="h-[52svh] scale-[1.14]" style={reduce ? undefined : { y: rise }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="https://picsum.photos/id/508/2400/1350"
            alt="Tall vaulted interior with pale columns - photo by Jeff Sheldon"
            className="h-full w-full object-cover brightness-[0.62] dark:brightness-[0.45]"
            loading="lazy"
          />
        </motion.div>
        <div className="absolute inset-0 flex flex-col justify-between p-6 text-white sm:p-10">
          <div className="flex flex-wrap justify-between gap-4 text-[16px]">
            <div className="flex gap-5">
              <a href="#experience" className="underline underline-offset-4">{t.nav.experience}</a>
              <a href="#contact" className="underline underline-offset-4">{t.nav.contact}</a>
            </div>
            <span className="opacity-80">{profile.email}</span>
          </div>
          <div>
            <p className="text-[clamp(2.6rem,8vw,9rem)] font-semibold leading-[0.9] tracking-[-0.04em]">
              {profile.name.split(" ")[0]} {profile.name.split(" ").slice(-1)}
            </p>
            <p className="mt-3 text-[14px] opacity-70">
              © {new Date().getFullYear()} {profile.name} · {t.footer.rights} {t.footer.built} · Photos: Unsplash via picsum.photos
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
