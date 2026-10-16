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
    } else {
      const nav = navigator.language.toLowerCase();
      setLocaleState(nav.startsWith("id") ? "id" : "en");
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
