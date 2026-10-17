"use client";

import { useEffect, useRef } from "react";
import { useTheme } from "next-themes";

// The hero's interactive element: a small constellation of nodes in real 3D
// space (yaw rotation + pointer parallax + perspective projection drawn on a
// 2D canvas). Depth decides size, weight and alpha, the cursor pulls light
// links out of the nearest nodes, and the whole field tilts gently toward the
// pointer. Same engineering budget as the page background: capped DPR, small
// node count, no shadows/gradients, one static frame under reduced motion,
// paused while the hero is off screen or the tab is hidden.
//
// (three.js / R3F were considered for this; ~150KB gzip for what is a
// points-and-links scene with no meshes, materials or lights did not pay for
// itself on a portfolio that otherwise ships lean.)

type Node3 = { x: number; y: number; z: number; accent: boolean; phase: number };

function tokenRgb(name: string, fallback: string) {
  const raw = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
  return (raw || fallback).split(/[\s,]+/).slice(0, 3).join(",");
}

export function HeroNodes() {
  const { resolvedTheme } = useTheme();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  // Painted colours follow the theme tokens on light/dark flips.
  const colorsRef = useRef({
    node: "rgba(107,107,107,0.55)",
    accent: "rgba(26,75,224,0.95)",
    link: "rgba(107,107,107,0.3)",
  });
  const redrawRef = useRef<() => void>(() => {});

  useEffect(() => {
    const dark = resolvedTheme === "dark";
    const accent = tokenRgb("--accent", "26 75 224");
    const muted = tokenRgb("--muted", "107 107 107");
    colorsRef.current = {
      node: `rgba(${muted},${dark ? 0.75 : 0.6})`,
      accent: `rgba(${accent},${dark ? 1 : 0.92})`,
      link: `rgba(${muted},${dark ? 0.42 : 0.3})`,
    };
    redrawRef.current();
  }, [resolvedTheme]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const finePointer = window.matchMedia("(hover: hover) and (pointer: fine)").matches;

    let nodes: Node3[] = [];
    let width = 0;
    let height = 0;
    let cx = 0;
    let cy = 0;
    let baseYaw = 0.35;
    let yaw = baseYaw;
    let pitch = 0.1;
    let targetYaw = 0;
    let targetPitch = 0;
    let raf = 0;
    let running = false;
    let visible = true;
    let last = 0;
    const pointer = { sx: -1e5, sy: -1e5, active: false };

    const budget = () => {
      if (width < 640) return 44;
      return Math.min(96, Math.max(56, Math.round((width * height) / 26000)));
    };

    const seed = () => {
      const n = budget();
      nodes = Array.from({ length: n }, (_, i) => {
        // Rejection-sampled inside the unit sphere, flattened on Y so the
        // constellation reads as a wide network cloud rather than a ball.
        let x = 0;
        let y = 0;
        let z = 0;
        let d = 2;
        while (d > 1) {
          x = Math.random() * 2 - 1;
          y = Math.random() * 2 - 1;
          z = Math.random() * 2 - 1;
          d = x * x + y * y + z * z;
        }
        return { x, y: y * 0.68, z, accent: i % 6 === 0, phase: Math.random() * Math.PI * 2 };
      });
    };

    const resize = () => {
      const dpr = Math.min(2, window.devicePixelRatio || 1);
      width = canvas.clientWidth;
      height = canvas.clientHeight;
      canvas.width = Math.max(1, Math.round(width * dpr));
      canvas.height = Math.max(1, Math.round(height * dpr));
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      cx = width * 0.58;
      cy = height * 0.46;
      seed();
      if (reduce) draw(performance.now(), 16);
    };

    const draw = (t: number, dt: number) => {
      const { node: nodeColor, accent, link } = colorsRef.current;
      const scale = Math.min(width, height) * 0.46;
      const f = 3.6;
      const linkDist = 0.72;

      ctx.clearRect(0, 0, width, height);

      if (!reduce) {
        // Pointer tilt, eased so the constellation feels physical.
        const ease = (cur: number, target: number) => cur + (target - cur) * 0.055;
        yaw = ease(yaw, baseYaw + targetYaw);
        pitch = ease(pitch, targetPitch);
        baseYaw += 0.000052 * dt;
      }

      const cosY = Math.cos(yaw);
      const sinY = Math.sin(yaw);
      const cosP = Math.cos(pitch);
      const sinP = Math.sin(pitch);

      // Rotate + project every node once, keep world coords for linking.
      const proj = nodes.map((p) => {
        const x1 = p.x * cosY + p.z * sinY;
        const z1 = -p.x * sinY + p.z * cosY;
        const y2 = p.y * cosP - z1 * sinP;
        const z2 = p.y * sinP + z1 * cosP;
        const k = f / (f - z2);
        return {
          sx: cx + x1 * scale * k,
          sy: cy - y2 * scale * k,
          wx: x1,
          wy: y2,
          wz: z2,
          k,
          accent: p.accent,
          phase: p.phase,
        };
      });

      const depthNorm = (k: number) => (k - f / (f + 1)) / (f / (f - 1) - f / (f + 1));

      // Links first (under the dots), far pairs fading out.
      ctx.lineWidth = 1.2;
      ctx.lineCap = "round";
      ctx.strokeStyle = link;
      for (let i = 0; i < proj.length; i++) {
        const a = proj[i];
        for (let j = i + 1; j < proj.length; j++) {
          const b = proj[j];
          const dx = a.wx - b.wx;
          const dy = a.wy - b.wy;
          const dz = a.wz - b.wz;
          const d2 = dx * dx + dy * dy + dz * dz;
          if (d2 < linkDist * linkDist) {
            const depth = (depthNorm(a.k) + depthNorm(b.k)) / 2;
            ctx.globalAlpha = Math.pow(1 - Math.sqrt(d2) / linkDist, 1.5) * (0.35 + 0.65 * depth);
            ctx.beginPath();
            ctx.moveTo(a.sx, a.sy);
            ctx.lineTo(b.sx, b.sy);
            ctx.stroke();
          }
        }
      }

      // Cursor light: links from the pointer to nearby nodes.
      if (!reduce && pointer.active) {
        const reach = 170;
        for (const p of proj) {
          const d = Math.hypot(p.sx - pointer.sx, p.sy - pointer.sy);
          if (d < reach) {
            ctx.globalAlpha = (1 - d / reach) * 0.6;
            ctx.beginPath();
            ctx.moveTo(p.sx, p.sy);
            ctx.lineTo(pointer.sx, pointer.sy);
            ctx.stroke();
          }
        }
      }

      // Dots, painted far-to-near so nearer nodes sit on top.
      const order = proj.map((_, i) => i).sort((a, b) => proj[a].k - proj[b].k);
      for (const idx of order) {
        const p = proj[idx];
        const depth = depthNorm(p.k);
        const r = 1.1 + depth * 2.1;
        if (p.accent) {
          const pulse = reduce ? 0.9 : 0.78 + 0.22 * Math.sin(t * 0.0016 + p.phase);
          ctx.fillStyle = accent;
          ctx.globalAlpha = (0.35 + 0.65 * depth) * pulse;
        } else {
          ctx.fillStyle = nodeColor;
          ctx.globalAlpha = 0.3 + 0.7 * depth;
        }
        ctx.beginPath();
        ctx.arc(p.sx, p.sy, r, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalAlpha = 1;
    };

    const frame = (t: number) => {
      if (!running) return;
      const dt = Math.min(48, t - last);
      last = t;
      draw(t, dt);
      raf = requestAnimationFrame(frame);
    };

    const start = () => {
      if (reduce || running || !visible || document.hidden) return;
      running = true;
      last = performance.now();
      raf = requestAnimationFrame(frame);
    };
    const stop = () => {
      running = false;
      cancelAnimationFrame(raf);
    };

    const onMove = (e: PointerEvent) => {
      if (e.pointerType !== "mouse") return;
      const r = canvas.getBoundingClientRect();
      pointer.sx = e.clientX - r.left;
      pointer.sy = e.clientY - r.top;
      pointer.active =
        pointer.sx >= -40 && pointer.sy >= -40 && pointer.sx <= width + 40 && pointer.sy <= height + 40;
      if (!pointer.active) return;
      targetYaw = ((e.clientX - r.left) / Math.max(1, r.width) - 0.5) * 0.55;
      targetPitch = ((e.clientY - r.top) / Math.max(1, r.height) - 0.5) * 0.42;
    };
    const onLeave = () => {
      pointer.active = false;
      targetYaw = 0;
      targetPitch = 0;
    };

    redrawRef.current = () => draw(performance.now(), 16);
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(canvas);

    const io = new IntersectionObserver(
      ([entry]) => {
        visible = entry.isIntersecting;
        if (visible) start();
        else stop();
      },
      { threshold: 0.02 }
    );
    io.observe(canvas);

    const onVisibility = () => {
      if (document.hidden) stop();
      else if (visible) start();
    };
    document.addEventListener("visibilitychange", onVisibility);
    if (!reduce && finePointer) {
      window.addEventListener("pointermove", onMove, { passive: true });
      document.documentElement.addEventListener("mouseleave", onLeave);
    }

    start();

    return () => {
      stop();
      ro.disconnect();
      io.disconnect();
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("pointermove", onMove);
      document.documentElement.removeEventListener("mouseleave", onLeave);
      redrawRef.current = () => {};
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden
      className="pointer-events-none absolute inset-0 -z-10 h-full w-full"
      style={{
        maskImage: "radial-gradient(95% 92% at 58% 42%, #000 40%, transparent 78%)",
        WebkitMaskImage: "radial-gradient(95% 92% at 58% 42%, #000 40%, transparent 78%)",
      }}
    />
  );
}
