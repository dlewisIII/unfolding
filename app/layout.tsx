import type { Metadata } from "next";
import { headers } from "next/headers";
import { SiteHeader } from "./components/SiteHeader";
import { copy, isLocale, siteUrl, type Locale } from "./i18n";
import { publishedEntries } from "@/content/generated";
import "@fontsource/italiana/400.css";
import "@fontsource/cormorant-garamond/400.css";
import "@fontsource/cormorant-garamond/500.css";
import "@fontsource/source-sans-3/400.css";
import "@fontsource/source-sans-3/600.css";
import "@fontsource-variable/inter/wght.css";
import "katex/dist/katex.min.css";
import "./globals.css";

const themeBoot = `(function(){try{var e=document.documentElement,m=document.querySelector('meta[name="theme-color"]'),t=localStorage.getItem('unfolding-theme');if(t==='light'||t==='dark')e.setAttribute('data-theme',t);var r=e.dataset.theme||(matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light');if(m)m.setAttribute('content',r==='dark'?'#171717':'#f5f1e8');requestAnimationFrame(function(){e.setAttribute('data-theme-ready','')})}catch(e){}})()`;

export async function generateMetadata(): Promise<Metadata> {
  const requestHeaders = await headers();
  const host = requestHeaders.get("x-forwarded-host") ?? requestHeaders.get("host");
  const protocol = requestHeaders.get("x-forwarded-proto") ?? (host?.startsWith("localhost") || host?.startsWith("127.0.0.1") ? "http" : "https");
  const origin = host ? `${protocol}://${host}` : siteUrl;
  return {
    metadataBase: new URL(origin || siteUrl),
    title: { default: "Unfolding", template: "%s · Unfolding" },
    description: "A personal journal and research notebook.",
    icons: { icon: "/favicon.svg", shortcut: "/favicon.svg" },
    openGraph: {
      type: "website",
      title: "Unfolding",
      description: "Personal journal & research notebook",
      images: [{ url: `${origin}/og.png`, width: 1200, height: 630, alt: "Unfolding — Personal journal & research notebook" }],
    },
    twitter: { card: "summary_large_image", images: [`${origin}/og.png`] },
  };
}

export default async function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const requestHeaders = await headers();
  const headerLocale = requestHeaders.get("x-unfolding-locale") ?? "en";
  const locale: Locale = isLocale(headerLocale) ? headerLocale : "en";
  const headerTheme = requestHeaders.get("x-unfolding-theme");
  const theme = headerTheme === "light" || headerTheme === "dark" ? headerTheme : undefined;
  const alternateRoutes = Object.fromEntries(publishedEntries.flatMap((entry) => {
    const en = entry.versions.en;
    const ru = entry.versions.ru;
    const routes: Array<[string, Partial<Record<Locale, string>>]> = [];
    if (en) routes.push([`/en/entries/${en.slug}`, { en: `/en/entries/${en.slug}`, ...(ru ? { ru: `/ru/entries/${ru.slug}` } : {}) }]);
    if (ru) routes.push([`/ru/entries/${ru.slug}`, { ru: `/ru/entries/${ru.slug}`, ...(en ? { en: `/en/entries/${en.slug}` } : {}) }]);
    return routes;
  }));
  return (
    <html lang={locale} data-theme={theme} suppressHydrationWarning>
      <head>
        <meta name="theme-color" content={theme === "dark" ? "#171717" : "#f5f1e8"} />
        <script dangerouslySetInnerHTML={{ __html: themeBoot }} />
      </head>
      <body>
        <div className="site-shell">
          <SiteHeader locale={locale} alternateRoutes={alternateRoutes} />
          {children}
          <footer className="site-footer">{copy[locale].footer}</footer>
        </div>
      </body>
    </html>
  );
}
