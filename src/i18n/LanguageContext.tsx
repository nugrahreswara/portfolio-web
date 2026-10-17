"use client";

import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { dictionaries, type Dictionary, type Locale } from "@/i18n/dictionaries";

const LanguageContext = createContext<{
  locale: Locale;
  t: Dictionary;
  setLocale: (l: Locale) => void;
}>({ locale: "en", t: dictionaries.en as Dictionary, setLocale: () => {} });

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>("en");

  useEffect(() => {
    const stored = localStorage.getItem("locale") as Locale | null;
    if (stored === "en" || stored === "id") {
      setLocaleState(stored);
      return;
    }
    // Auto-detect: browser language first, then location via timezone
    // (an Indonesian timezone defaults the site to Indonesian).
    const nav = navigator.language.toLowerCase();
    if (nav.startsWith("id")) {
      setLocaleState("id");
      return;
    }
    try {
      const tz = Intl.DateTimeFormat().resolvedOptions().timeZone ?? "";
      if (/^Asia\/(Jakarta|Pontianak|Makassar|Jayapura)$/.test(tz)) setLocaleState("id");
    } catch {
      /* keep the English default */
    }
  }, []);

  useEffect(() => {
    document.documentElement.lang = locale === "id" ? "id" : "en";
  }, [locale]);

  const setLocale = useCallback((l: Locale) => {
    setLocaleState(l);
    localStorage.setItem("locale", l);
  }, []);

  return (
    <LanguageContext.Provider value={{ locale, t: dictionaries[locale] as Dictionary, setLocale }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  return useContext(LanguageContext);
}
