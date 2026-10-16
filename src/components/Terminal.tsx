"use client";

import { useEffect, useRef, useState } from "react";
import { useLanguage } from "@/i18n/LanguageContext";

type Line = { kind: "in" | "out"; text: string };

const COMMANDS: Record<string, { en: string[]; id: string[] }> = {
  help: {
    en: ["available: whoami · experience · skills · certs · contact · clear"],
    id: ["tersedia: whoami · experience · skills · certs · contact · clear"],
  },
  whoami: {
    en: ["Anugerah Fakhriza Reswara - IT Network & Systems Engineer, Samarinda ID"],
    id: ["Anugerah Fakhriza Reswara - Insinyur Jaringan & Sistem TI, Samarinda ID"],
  },
  experience: {
    en: ["ICT Mulawarman (2026-) · PLN Icon Plus (2024) · Bank Sinarmas (2024) - scroll to #experience"],
    id: ["ICT Mulawarman (2026-) · PLN Icon Plus (2024) · Bank Sinarmas (2024) - gulir ke #experience"],
  },
  skills: {
    en: ["Linux · Cisco · MikroTik · OPNsense · Proxmox · ESXi · Docker · Ansible · OSPF · VLAN"],
    id: ["Linux · Cisco · MikroTik · OPNsense · Proxmox · ESXi · Docker · Ansible · OSPF · VLAN"],
  },
  certs: {
    en: ["MTCNA · BNSP Junior Technical Support · Omada RS + Wireless · RH124/RH134/RH294"],
    id: ["MTCNA · BNSP Junior Technical Support · Omada RS + Wireless · RH124/RH134/RH294"],
  },
  contact: {
    en: ["nugrahreswara@gmail.com - scroll to #contact to send a message"],
    id: ["nugrahreswara@gmail.com - gulir ke #contact untuk mengirim pesan"],
  },
};

export function Terminal() {
  const { locale, t } = useLanguage();
  const [lines, setLines] = useState<Line[]>([
    { kind: "out", text: "nugrah@edge:~$ whoami" },
    { kind: "out", text: COMMANDS.whoami.en[0] },
  ]);
  const [value, setValue] = useState("");
  const bodyRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const mirrorRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bodyRef.current?.scrollTo({ top: bodyRef.current.scrollHeight });
  }, [lines]);

  // Keep the fake block caret glued to the end of the typed text, even when
  // the command scrolls horizontally inside the input.
  function syncMirror() {
    const input = inputRef.current;
    const mirror = mirrorRef.current;
    if (input && mirror) mirror.scrollLeft = input.scrollLeft;
  }

  function run(raw: string) {
    const cmd = raw.trim().toLowerCase();
    const next: Line[] = [...lines, { kind: "in" as const, text: `nugrah@edge:~$ ${raw}` }];
    if (!cmd) {
      setLines(next);
      return;
    }
    if (cmd === "clear") {
      setLines([]);
      return;
    }
    const hit = COMMANDS[cmd];
    if (hit) {
      for (const l of hit[locale]) next.push({ kind: "out", text: l });
    } else {
      next.push({ kind: "out", text: locale === "id" ? `perintah tidak dikenal: ${cmd} - coba "help"` : `unknown command: ${cmd} - try "help"` });
    }
    setLines(next);
  }

  return (
    <div data-ui className="overflow-hidden rounded-[14px] border border-[rgb(var(--line))] bg-[#0d1117] text-[#e6edf3]">
      <div className="flex items-center gap-1.5 border-b border-white/10 px-4 py-2.5" aria-hidden> {/* taste-skill-ignore: terminal window chrome inside data-ui fragment */}
        <span className="h-2.5 w-2.5 rounded-full bg-[#ff5f57]" />
        <span className="h-2.5 w-2.5 rounded-full bg-[#febc2e]" />
        <span className="h-2.5 w-2.5 rounded-full bg-[#28c840]" />
        <code className="ml-3 font-mono text-[14px] text-white/50">nugrah@edge - zsh</code> {/* taste-skill-ignore: terminal emulator */}
      </div>
      <div ref={bodyRef} className="h-[240px] overflow-y-auto px-4 py-3 font-mono text-[14px] leading-relaxed" role="log" aria-label="Interactive terminal"> {/* taste-skill-ignore: terminal emulator */}
        {lines.map((l, i) => (
          <code key={i} className={`block font-mono ${l.kind === "in" ? "text-[#7ee787]" : "text-white/85"}`}>
            {l.text}
          </code>
        ))}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            run(value);
            setValue("");
            requestAnimationFrame(() => {
              if (mirrorRef.current) mirrorRef.current.scrollLeft = 0;
            });
          }}
          onClick={() => inputRef.current?.focus()}
          className="mt-1 flex cursor-text items-center gap-2"
        >
          <code className="shrink-0 font-mono text-[#7ee787]">nugrah@edge:~$</code>
          <div className="relative min-w-0 flex-1">
            <input
              ref={inputRef}
              value={value}
              onChange={(e) => {
                setValue(e.target.value);
                requestAnimationFrame(syncMirror);
              }}
              onScroll={syncMirror}
              onKeyUp={syncMirror}
              onClick={syncMirror}
              className="w-full bg-transparent p-0 font-mono text-[14px] leading-relaxed text-white outline-none caret-transparent placeholder:text-white/30" // taste-skill-ignore: terminal emulator
              placeholder={t.terminal.hint}
              aria-label="Terminal input"
              autoComplete="off"
              autoCapitalize="off"
              autoCorrect="off"
              spellCheck={false}
            />
            <div
              ref={mirrorRef}
              aria-hidden
              className="pointer-events-none absolute inset-0 select-none overflow-hidden whitespace-pre font-mono text-[14px] leading-relaxed" // taste-skill-ignore: terminal emulator
            >
              <code className="invisible font-mono">{value}</code><span className="caret-blink inline-block h-[14px] w-[8px] translate-y-[2px] bg-[#7ee787]" />
            </div>
          </div>
        </form>
      </div>
      <noscript>
        <pre className="px-4 py-2 font-mono text-[14px] text-white/70">Enable JavaScript to use the interactive terminal.</pre> {/* taste-skill-ignore: terminal emulator */}
      </noscript>
    </div>
  );
}
