// Celebration bursts for achievement milestones ("Medallion for Excellence",
// provincial/city 1st places...). canvas-confetti is imported on demand so it
// never lands in the initial bundle, and every path no-ops under
// prefers-reduced-motion. Decorative only: failures are swallowed.
//
// taste-skill-ignore: confetti is an explicit product requirement for the
// achievements section (celebrating top ranks), not a stock ornament.

export type Medal = "gold" | "silver" | "national" | "plain";

const GOLD = ["#e2b53f", "#f7d774", "#1a4be0", "#ffffff"];
const SILVER = ["#c3cad6", "#9aa4b2", "#1a4be0", "#ffffff"];
const ACCENT = ["#1a4be0", "#608cff", "#ffffff"];

// Rank read from the data the admin already curates: title/result text.
export function medalFor(result: string, title: string): Medal {
  const s = `${result} ${title}`;
  if (/medallion/i.test(s)) return "national";
  if (/(^|\D)1st\b|juara\s*1\b|winner|champion/i.test(s)) return "gold";
  if (/(^|\D)2nd\b|juara\s*2\b|runner[- ]?up/i.test(s)) return "silver";
  return "plain";
}

function palette(medal: Medal) {
  return medal === "gold" ? GOLD : medal === "silver" ? SILVER : ACCENT;
}

function reducedMotion() {
  return (
    typeof window !== "undefined" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches
  );
}

// Full celebration: hover completion / click on a milestone card.
export async function celebrateBurst(x: number, y: number, medal: Medal) {
  if (typeof window === "undefined" || reducedMotion()) return;
  try {
    const { default: confetti } = await import("canvas-confetti");
    const colors = palette(medal);
    confetti({
      particleCount: medal === "gold" || medal === "national" ? 100 : 70,
      spread: 78,
      startVelocity: 34,
      scalar: 0.95,
      ticks: 170,
      origin: { x, y },
      colors,
      disableForReducedMotion: true,
    });
    confetti({
      particleCount: 42,
      spread: 120,
      startVelocity: 20,
      scalar: 0.7,
      decay: 0.92,
      ticks: 140,
      origin: { x, y },
      colors,
      disableForReducedMotion: true,
    });
  } catch {
    /* decorative; never break the page for confetti */
  }
}

// Small sparkle: first hover over a milestone card (once per card per visit).
export async function celebrateSparkle(x: number, y: number, medal: Medal) {
  if (typeof window === "undefined" || reducedMotion()) return;
  try {
    const { default: confetti } = await import("canvas-confetti");
    confetti({
      particleCount: 16,
      spread: 56,
      startVelocity: 15,
      scalar: 0.6,
      gravity: 0.9,
      ticks: 90,
      origin: { x, y },
      colors: palette(medal),
      disableForReducedMotion: true,
    });
  } catch {
    /* decorative */
  }
}
