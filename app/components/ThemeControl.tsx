"use client";

import { useEffect, useRef, useState } from "react";

type Theme = "auto" | "light" | "dark";
const themes: Array<{ value: Theme; label: string }> = [
  { value: "auto", label: "Auto" },
  { value: "light", label: "Light" },
  { value: "dark", label: "Dark" },
];

function applyTheme(theme: Theme) {
  if (theme === "auto") document.documentElement.removeAttribute("data-theme");
  else document.documentElement.dataset.theme = theme;
}

export function ThemeControl() {
  const [theme, setTheme] = useState<Theme>("auto");
  const detailsRef = useRef<HTMLDetailsElement>(null);

  useEffect(() => {
    const saved = localStorage.getItem("unfolding-theme");
    if (saved === "light" || saved === "dark") setTheme(saved);
  }, []);

  function choose(next: Theme) {
    setTheme(next);
    applyTheme(next);
    if (next === "auto") localStorage.removeItem("unfolding-theme");
    else localStorage.setItem("unfolding-theme", next);
    detailsRef.current?.removeAttribute("open");
  }

  return (
    <details className="theme-control" ref={detailsRef}>
      <summary>Theme</summary>
      <div className="theme-menu" role="group" aria-label="Color theme">
        {themes.map((item) => (
          <button
            type="button"
            key={item.value}
            aria-pressed={theme === item.value}
            onClick={() => choose(item.value)}
          >
            {item.label}
          </button>
        ))}
      </div>
    </details>
  );
}
