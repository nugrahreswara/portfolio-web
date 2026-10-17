import type { Metadata, Viewport } from "next";
import { Zilla_Slab, JetBrains_Mono } from "next/font/google"; // taste-skill-ignore: mono reserved for the terminal emulator UI
import "./globals.css";
import { Providers } from "./providers";

const slab = Zilla_Slab({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-slab",
  display: "swap",
});

const mono = JetBrains_Mono({ // taste-skill-ignore: mono reserved for the terminal emulator UI
  subsets: ["latin"],
  weight: ["400", "500", "700"],
  variable: "--font-mono", // taste-skill-ignore: mono reserved for the terminal emulator UI
  display: "swap",
});

export const metadata: Metadata = {
  title: "Anugerah Fakhriza Reswara - IT Network & Systems Engineer",
  description:
    "Portfolio of Anugerah Fakhriza Reswara, Informatics student and IT Network Systems Administrator based in Samarinda, Indonesia. Cisco, MikroTik, Linux, OPNsense, Proxmox.",
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"),
  icons: { icon: "/favicon.svg" },
};

// mobile-native baseline: draw under the notch (viewport-fit=cover), and give
// each colour scheme its own status-bar colour matching the page ground.
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#0a0a0b" },
  ],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${slab.variable} ${mono.variable} font-slab`}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
