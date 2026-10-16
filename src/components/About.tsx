"use client";

import { useLanguage } from "@/i18n/LanguageContext";
import type { PortfolioData } from "@/lib/portfolio";
import { LangFade } from "./LangFade";
import { Reveal } from "./Reveal";

export function About({ profile }: { profile: PortfolioData["profile"] }) {
  const { locale, t } = useLanguage();
  const summary = locale === "id" ? profile.summaryId : profile.summaryEn;
  return (
    <section id="about" className="mt-24 sm:mt-32">
      <Reveal>
        <h2 className="text-[clamp(2rem,1.3rem+3.2vw,2.9rem)] font-semibold tracking-[-0.025em]">
          <LangFade text={t.about.heading} />
        </h2>
      </Reveal>
      <Reveal delay={0.06}>
        <div className="mt-8 max-w-[560px]">
          <p className="text-[14px] font-medium text-[rgb(var(--muted))]">{t.about.letter}</p>
          <div className="mt-4 space-y-4 text-[16px] leading-[1.55]">
            <p className="font-medium">{summary}</p>
            <p className="text-[rgb(var(--muted))]">
              {locale === "id"
                ? "Saya lulusan SMKS TI Airlangga Samarinda (Teknik Komputer Jaringan & Telekomunikasi) dan kini mahasiswa Informatika Universitas Mulawarman. Saya terbiasa memegang tanggung jawab penuh atas sistem yang saya kelola - dari gateway perimeter hingga mail server."
                : "I graduated from SMKS TI Airlangga Samarinda (Computer Network & Telecommunications Engineering) and now study Informatics at Mulawarman University. I take full ownership of the systems I run - from perimeter gateways to mail servers."}
            </p>
            <p className="text-[rgb(var(--muted))]">
              {locale === "id"
                ? "Di waktu luang saya mereproduksi topologi kompetisi LKS dan bereksperimen dengan Proxmox, Ansible, dan OPNsense di lab rumah."
                : "In my spare time I reproduce LKS competition topologies and experiment with Proxmox, Ansible and OPNsense in my home lab."}
            </p>
          </div>
          <p className="mt-6 text-[20px] italic">Anugerah Fakhriza Reswara</p>
          <p className="text-[14px] text-[rgb(var(--muted))]">
            {locale === "id" ? profile.titleId : profile.titleEn} · Samarinda
          </p>
        </div>
      </Reveal>
    </section>
  );
}
