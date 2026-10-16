"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useTheme } from "next-themes";

// A quiet field of connected nodes behind the page: the network topology that is
// the subject's world, drawn as flat dots and 1.5px links. It is decorative, so it
// never intercepts the pointer, and it stays cheap: a small fixed node budget, a
// device-pixel-ratio cap, no shadows, and no gradients.
//
// It pauses itself in three situations: the tab is hidden, the visitor prefers
// reduced motion (a single static frame is drawn), or the frame budget is blown
// for a sustained stretch (the field is thinned, then stopped). The navbar
// toggle lets it be switched off entirely, and the choice is remembered.

type BackgroundContextValue = { enabled: boolean; toggle: () => void };

const BackgroundContext = createContext<BackgroundContextValue | null>(null);
const STORAGE_KEY = "nugrah.background";

export function BackgroundProvider({ children }: { children: React.ReactNode }) {
  const [enabled, setEnabled] = useState(true);

  useEffect(() => {
    try {
      if (localStorage.getItem(STORAGE_KEY) === "off") setEnabled(false);
    } catch {
      /* storage unavailable, keep the default */
    }
  }, []);

  const toggle = useCallback(() => {
    setEnabled((prev) => {
      const next = !prev;
      try {
        localStorage.setItem(STORAGE_KEY, next ? "on" : "off");
      } catch {
        /* ignore */
      }
      return next;
    });
  }, []);

  const value = useMemo(() => ({ enabled, toggle }), [enabled, toggle]);
  return <BackgroundContext.Provider value={value}>{children}</BackgroundContext.Provider>;
}

export function useBackground() {
  const ctx = useContext(BackgroundContext);
  if (!ctx) throw new Error("useBackground must be used inside BackgroundProvider");
  return ctx;
}

type Particle = { x: number; y: number; vx: number; vy: number };

// Link weight. A 1px hairline reads as noise on a hidpi panel; 1.5px with a
// lifted mid-range falloff makes the mesh legible without shouting over the copy.
const LINK_WIDTH = 1.5;
const LINK_FALLOFF = 0.7;

function tokenRgb(name: string, fallback: string) {
  const raw = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
  return (raw || fallback).split(/[\s,]+/).slice(0, 3).join(",");
}

export function NodeField() {
  const { enabled } = useBackground();
  const { resolvedTheme } = useTheme();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const colorsRef = useRef({ node: "rgba(26,75,224,0.6)", link: "rgba(107,107,107,0.3)" });
  // Lets the theme/resize handlers repaint a single frame when the loop is off
  // (reduced motion) or between frames.
  const redrawRef = useRef<() => void>(() => {});

  // Recolour on theme flip without re-seeding, so the field keeps its shape.
  useEffect(() => {
    const dark = resolvedTheme === "dark";
    const accent = tokenRgb("--accent", "26 75 224");
    const muted = tokenRgb("--muted", "107 107 107");
    colorsRef.current = {
      node: `rgba(${accent},${dark ? 0.85 : 0.75})`,
      // Dark needs a touch more weight to sit at the same perceived contrast.
      link: `rgba(${muted},${dark ? 0.4 : 0.3})`,
    };
    redrawRef.current();
  }, [resolvedTheme]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    if (!enabled) {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      redrawRef.current = () => {};
      return;
    }

    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let width = 0;
    let height = 0;
    let dpr = 1;
    let linkDist = 150;
    let particles: Particle[] = [];
    let raf = 0;
    let running = true;
    let quality = 1;
    let autoPaused = false;
    let last = 0;
    let slowFor = 0;
    const pointer = { x: -1e5, y: -1e5, active: false };

    const budget = () => {
      const base = Math.round((width * height) / 24000);
      return Math.max(10, Math.round(Math.min(64, Math.max(16, base)) * quality));
    };

    const seed = () => {
      particles = Array.from({ length: budget() }, () => ({
        x: Math.random() * width,
        y: Math.random() * height,
        vx: (Math.random() - 0.5) * 0.16,
        vy: (Math.random() - 0.5) * 0.16,
      }));
    };

    const resize = () => {
      dpr = Math.min(2, window.devicePixelRatio || 1);
      width = canvas.clientWidth;
      height = canvas.clientHeight;
      canvas.width = Math.max(1, Math.round(width * dpr));
      canvas.height = Math.max(1, Math.round(height * dpr));
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      // Phones get a tighter reach: with the small mobile node budget a shorter
      // radius would leave the mesh looking like loose dots.
      linkDist = width < 640 ? 126 : 150;
      seed();
      if (reduce) draw();
    };

    const draw = () => {
      const { node, link } = colorsRef.current;
      ctx.clearRect(0, 0, width, height);
      const n = particles.length;
      ctx.lineWidth = LINK_WIDTH;
      ctx.lineCap = "round";
      ctx.strokeStyle = link;

      for (let i = 0; i < n; i++) {
        const a = particles[i];
        for (let j = i + 1; j < n; j++) {
          const b = particles[j];
          const dx = a.x - b.x;
          const dy = a.y - b.y;
          const d2 = dx * dx + dy * dy;
          if (d2 < linkDist * linkDist) {
            ctx.globalAlpha = (1 - Math.sqrt(d2) / linkDist) ** LINK_FALLOFF;
            ctx.beginPath();
            ctx.moveTo(a.x, a.y);
            ctx.lineTo(b.x, b.y);
            ctx.stroke();
          }
        }
      }

      if (pointer.active) {
        const reach = linkDist * 1.4;
        for (let i = 0; i < n; i++) {
          const a = particles[i];
          const d = Math.hypot(a.x - pointer.x, a.y - pointer.y);
          if (d < reach) {
            ctx.globalAlpha = (1 - d / reach) * 0.72;
            ctx.beginPath();
            ctx.moveTo(a.x, a.y);
            ctx.lineTo(pointer.x, pointer.y);
            ctx.stroke();
          }
        }
      }

      ctx.globalAlpha = 1;
      ctx.fillStyle = node;
      for (let i = 0; i < n; i++) {
        const a = particles[i];
        ctx.beginPath();
        ctx.arc(a.x, a.y, 1.6, 0, Math.PI * 2);
        ctx.fill();
      }
    };

    const step = () => {
      for (const p of particles) {
        p.x += p.vx;
        p.y += p.vy;
        if (p.x < 0) p.x = width;
        else if (p.x > width) p.x = 0;
        if (p.y < 0) p.y = height;
        else if (p.y > height) p.y = 0;
      }
    };

    const frame = (t: number) => {
      if (!running) return;
      const dt = t - last;
      last = t;
      // Sustained heavy frames: thin the field, then stop drawing.
      if (dt > 34) slowFor += dt;
      else slowFor = Math.max(0, slowFor - dt);
      if (slowFor > 900) {
        if (quality > 0.5) {
          quality = 0.5;
          seed();
          slowFor = 0;
        } else {
          running = false;
          autoPaused = true;
          draw();
          return;
        }
      }
      step();
      draw();
      raf = requestAnimationFrame(frame);
    };

    const onMove = (e: PointerEvent) => {
      if (e.pointerType !== "mouse") return;
      pointer.x = e.clientX;
      pointer.y = e.clientY;
      pointer.active = true;
    };
    const onLeave = () => {
      pointer.active = false;
    };
    const onVisibility = () => {
      if (autoPaused) return;
      if (document.hidden) {
        running = false;
        cancelAnimationFrame(raf);
      } else if (!reduce) {
        running = true;
        last = performance.now();
        raf = requestAnimationFrame(frame);
      }
    };

    redrawRef.current = draw;
    resize();
    window.addEventListener("resize", resize);
    document.addEventListener("visibilitychange", onVisibility);
    if (!reduce) {
      window.addEventListener("pointermove", onMove, { passive: true });
      document.documentElement.addEventListener("mouseleave", onLeave);
    }

    if (reduce) {
      draw();
    } else {
      last = performance.now();
      raf = requestAnimationFrame(frame);
    }

    return () => {
      running = false;
      cancelAnimationFrame(raf);
      redrawRef.current = () => {};
      window.removeEventListener("resize", resize);
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("pointermove", onMove);
      document.documentElement.removeEventListener("mouseleave", onLeave);
    };
  }, [enabled]);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden
      className="pointer-events-none fixed inset-0 -z-10 h-full w-full"
    />
  );
}
