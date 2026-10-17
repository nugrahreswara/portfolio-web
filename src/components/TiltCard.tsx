"use client";

import { motion, useMotionValue, useReducedMotion, useSpring } from "framer-motion";
import { useRef, useState } from "react";

// 3D tilt on pointer move with spring return. Perspective + rotate only.
// `glare` adds a soft light sheen that tracks the pointer for card-depth
// reactions (achievements). taste-skill-ignore: the sheen is a 3D depth cue
// requested for the achievements cards, kept faint on purpose.
export function TiltCard({
  children,
  max = 7,
  glare = false,
  className,
  style,
}: {
  children: React.ReactNode;
  max?: number;
  glare?: boolean;
  className?: string;
  style?: React.CSSProperties;
}) {
  const reduce = useReducedMotion();
  const ref = useRef<HTMLDivElement>(null);
  const [hovering, setHovering] = useState(false);
  const rx = useMotionValue(0);
  const ry = useMotionValue(0);
  const srx = useSpring(rx, { stiffness: 180, damping: 18, mass: 0.5 });
  const sry = useSpring(ry, { stiffness: 180, damping: 18, mass: 0.5 });

  if (reduce) return <div className={className} style={style}>{children}</div>;

  return (
    <motion.div
      ref={ref}
      className={`relative ${className ?? ""}`}
      style={{ ...style, rotateX: srx, rotateY: sry, transformPerspective: 900 }}
      onMouseEnter={() => setHovering(true)}
      onMouseMove={(e) => {
        const el = ref.current;
        if (!el) return;
        const r = el.getBoundingClientRect();
        const px = (e.clientX - r.left) / r.width - 0.5;
        const py = (e.clientY - r.top) / r.height - 0.5;
        ry.set(px * max * 2);
        rx.set(-py * max * 2);
        if (glare) {
          el.style.setProperty("--gx", `${e.clientX - r.left}px`);
          el.style.setProperty("--gy", `${e.clientY - r.top}px`);
        }
      }}
      onMouseLeave={() => {
        setHovering(false);
        rx.set(0);
        ry.set(0);
      }}
    >
      {children}
      {glare ? (
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 rounded-[14px]"
          style={{
            background:
              "radial-gradient(220px circle at var(--gx, 50%) var(--gy, 50%), rgba(255,255,255,0.13), transparent 58%)",
            opacity: hovering ? 1 : 0,
            transition: "opacity 240ms ease",
          }}
        />
      ) : null}
    </motion.div>
  );
}
