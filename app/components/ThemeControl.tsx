"use client";
/* eslint-disable react-hooks/set-state-in-effect -- state mirrors the theme applied by the pre-hydration boot script. */

import { useEffect, useState } from "react";
import type { Locale } from "../i18n";

type Theme = "light" | "dark";

function applyTheme(theme: Theme) {
  document.documentElement.dataset.theme = theme;
  document.querySelector('meta[name="theme-color"]')?.setAttribute("content", theme === "dark" ? "#171717" : "#f5f1e8");
}

function rememberTheme(theme: Theme) {
  localStorage.setItem("unfolding-theme", theme);
  document.cookie = `unfolding-theme=${theme}; Max-Age=31536000; Path=/; SameSite=Lax`;
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
    rememberTheme(next);
  }

  return (
    <div className="theme-toggle" role="group" aria-label={locale === "ru" ? "Цветовая тема" : "Color theme"}>
      <button type="button" aria-label={locale === "ru" ? "Тёмная тема" : "Dark theme"} aria-pressed={theme === "dark"} onClick={() => choose("dark")}>☾</button>
      <button type="button" aria-label={locale === "ru" ? "Светлая тема" : "Light theme"} aria-pressed={theme === "light"} onClick={() => choose("light")}>☼</button>
    </div>
  );
}
