/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: "class",
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        slab: ["var(--font-slab)", "Georgia", "serif"],
        mono: ["var(--font-mono)", "ui-monospace", "monospace"], // taste-skill-ignore: mono reserved for the terminal emulator UI
      },
      colors: {
        paper: "rgb(var(--bg) / <alpha-value>)",
        surface: "rgb(var(--surface) / <alpha-value>)",
        ink: "rgb(var(--ink) / <alpha-value>)",
        muted: "rgb(var(--muted) / <alpha-value>)",
        accent: "rgb(var(--accent) / <alpha-value>)",
      },
      borderRadius: {
        page: "20px",
        card: "14px",
      },
    },
  },
  plugins: [],
};
