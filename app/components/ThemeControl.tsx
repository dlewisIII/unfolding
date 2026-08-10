"use client";
/* eslint-disable react-hooks/set-state-in-effect -- state mirrors the theme applied by the pre-hydration boot script. */

import { useEffect, useState } from "react";
import type { Locale } from "../i18n";

type Theme = "light" | "dark";

function applyTheme(theme: Theme) {
  document.documentElement.dataset.theme = theme;
}

export function ThemeControl({ locale }: { locale: Locale }) {
  const [theme, setTheme] = useState<Theme>("light");

  useEffect(() => {
    const saved = localStorage.getItem("unfolding-theme");
    const resolved = saved === "light" || saved === "dark"
      ? saved
      : (window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light");
    setTheme(resolved);
  }, []);

  function choose(next: Theme) {
    setTheme(next);
    applyTheme(next);
    localStorage.setItem("unfolding-theme", next);
  }

  return (
    <div className="theme-toggle" role="group" aria-label={locale === "ru" ? "Цветовая тема" : "Color theme"}>
      <button type="button" aria-label={locale === "ru" ? "Тёмная тема" : "Dark theme"} aria-pressed={theme === "dark"} onClick={() => choose("dark")}>☾</button>
      <span aria-hidden="true" />
      <button type="button" aria-label={locale === "ru" ? "Светлая тема" : "Light theme"} aria-pressed={theme === "light"} onClick={() => choose("light")}>☼</button>
    </div>
  );
}
