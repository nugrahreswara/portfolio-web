import type Lenis from "lenis";

let instance: Lenis | null = null;

export function setLenis(lenis: Lenis | null) {
  instance = lenis;
}

export function stopScroll() {
  instance?.stop();
  document.documentElement.style.overflow = "hidden";
}

export function startScroll() {
  document.documentElement.style.overflow = "";
  instance?.start();
}
