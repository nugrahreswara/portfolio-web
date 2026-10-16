"use client";

import Image from "next/image";
import { motion, useReducedMotion, useScroll, useTransform } from "framer-motion";
import { useEffect, useRef, useState } from "react";

// Full-width photographic band below the hero: the place behind the work.
// (Formerly the fixed half of the split-stage hero; the hero itself is now a
// strict terminal | profile grid, so the photography lives here instead.)
const PHOTOS = [
  { src: "https://picsum.photos/id/1081/2400/1200", alt: "Stepped white modern building corner against a pale sky - photo by Julien Moreau" },
  { src: "https://picsum.photos/id/618/2400/1200", alt: "Curving glass and steel lattice roof - photo by Mika Ruusunen" },
  { src: "https://picsum.photos/id/887/2400/1200", alt: "White apartment facade with repeating balconies - photo by Roman Kraft" },
];

export function PhotoBand() {
  const [index, setIndex] = useState(0);
  const reduce = useReducedMotion();
  const bandRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: bandRef, offset: ["start end", "end start"] });
  const drift = useTransform(scrollYProgress, [0, 1], ["-9%", "9%"]);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const id = setInterval(() => setIndex((i) => (i + 1) % PHOTOS.length), 6000);
    return () => clearInterval(id);
  }, []);

  return (
    <section aria-label="Samarinda and the built environment" className="mt-14 lg:mt-20">
      <div ref={bandRef} className="relative overflow-hidden rounded-[20px]">
        <div className="relative h-[34svh] min-h-[220px] w-full lg:h-[44svh]">
          {PHOTOS.map((p, i) => (
            <motion.div
              key={p.src}
              className="absolute inset-0 scale-[1.22]"
              style={reduce ? undefined : { y: drift }}
              aria-hidden={i !== index}
            >
              <Image
                src={p.src}
                alt={p.alt}
                fill
                sizes="100vw"
                priority={i === 0}
                loading={i === 0 ? undefined : "lazy"}
                className="stage-photo object-cover transition-opacity duration-[1600ms]"
                style={{ opacity: i === index ? 1 : 0 }}
              />
            </motion.div>
          ))}
        </div>
        <div className="absolute inset-x-0 bottom-0 flex items-center justify-between bg-black/45 px-5 py-3 text-[14px] font-medium text-white">
          <span>Samarinda, ID - 0.5°S 117.1°E</span>
          <span className="tabular-nums opacity-80">AS 2024 → 2026</span>
        </div>
      </div>
    </section>
  );
}
