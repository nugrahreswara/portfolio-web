"use client";

import Lenis from "lenis";
import { useEffect } from "react";
import { setLenis } from "@/lib/scroll";

export function SmoothScroll({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const lenis = new Lenis({
      duration: 1.15,
      smoothWheel: true,
      anchors: { offset: -96 },
    });
    setLenis(lenis);
    let raf = 0;
    const loop = (time: number) => {
      lenis.raf(time);
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);

    // Adopt scrolls we did not start (skip links, window.scrollTo, hash jumps,
    // automation) instead of dragging them back to Lenis' own target. Lenis
    // keeps `animatedScroll` in lockstep with the real position while it
    // animates, so a divergence means something else moved the page.
    const onScroll = () => {
      const y = window.scrollY;
      if (Math.abs(y - lenis.animatedScroll) > 4) {
        lenis.scrollTo(y, { immediate: true, force: true });
      }
    };
    window.addEventListener("scroll", onScroll, { passive: true });

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("scroll", onScroll);
      lenis.destroy();
      setLenis(null);
    };
  }, []);

  return <>{children}</>;
}
