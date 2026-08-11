"use client";

import { usePathname } from "next/navigation";
import type { Locale } from "../i18n";

type AlternateRoutes = Record<string, Partial<Record<Locale, string>>>;

function remember(locale: Locale) {
  localStorage.setItem("unfolding-language", locale);
  document.cookie = `unfolding-language=${locale}; Max-Age=31536000; Path=/; SameSite=Lax`;
}

export function LanguageSwitcher({ locale, alternateRoutes }: { locale: Locale; alternateRoutes: AlternateRoutes }) {
  const pathname = usePathname();

  function routeFor(target: Locale) {
    if (target === locale) return pathname;
    if (pathname.includes("/entries/")) return alternateRoutes[pathname]?.[target] ?? null;
    if (target === "ru") return pathname === "/" ? "/ru" : `/ru${pathname}`;
    return pathname.replace(/^\/ru(?=\/|$)/, "") || "/";
  }

  return (
    <div className="language-switcher" aria-label={locale === "ru" ? "Язык" : "Language"}>
      {(["ru", "en"] as const).map((target, index) => {
        const route = routeFor(target);
        const active = target === locale;
        const label = target.toUpperCase();
        return (
          <span className="language-option-wrap" key={target}>
            {index > 0 && <span className="language-divider" aria-hidden="true">/</span>}
            {active ? (
              <span className="language-option is-active" aria-current="page">{label}</span>
            ) : route ? (
              <a className="language-option" href={route} hrefLang={target} onClick={() => remember(target)}>{label}</a>
            ) : (
              <span className="language-option is-unavailable" aria-disabled="true" title={locale === "ru" ? "Перевод не опубликован" : "Translation not published"}>{label}</span>
            )}
          </span>
        );
      })}
    </div>
  );
}
