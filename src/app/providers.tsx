"use client";

import { ThemeProvider } from "next-themes";
import { LanguageProvider } from "@/i18n/LanguageContext";
import { SmoothScroll } from "@/components/SmoothScroll";
import { BackgroundProvider, NodeField } from "@/components/NodeField";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider attribute="class" defaultTheme="light" enableSystem={false}>
      <BackgroundProvider>
        <LanguageProvider>
          <SmoothScroll>{children}</SmoothScroll>
        </LanguageProvider>
        <NodeField />
      </BackgroundProvider>
    </ThemeProvider>
  );
}
