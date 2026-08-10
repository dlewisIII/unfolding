import type { MetadataRoute } from "next";
import { publishedEntries } from "@/content/generated";
import { siteUrl } from "./i18n";

const locales = ["en", "ru"] as const;
const globalPaths = ["", "/about", "/search"] as const;

export default function sitemap(): MetadataRoute.Sitemap {
  const globalPages = globalPaths.flatMap((path) => locales.map((locale) => ({
    url: `${siteUrl}/${locale}${path}`,
    alternates: {
      languages: {
        en: `${siteUrl}/en${path}`,
        ru: `${siteUrl}/ru${path}`,
        "x-default": `${siteUrl}${path || "/"}`,
      },
    },
  })));

  const entries = publishedEntries.flatMap((entry) => {
    const existingVersions = locales.flatMap((locale) => {
      const version = entry.versions[locale];
      return version ? [{ locale, version }] : [];
    });
    const original = entry.versions[entry.originalLanguage] ?? existingVersions[0]?.version;
    if (!original) return [];

    const languages = Object.fromEntries([
      ...existingVersions.map(({ locale, version }) => [locale, `${siteUrl}/${locale}/entries/${version.slug}`]),
      ["x-default", `${siteUrl}/${original.locale}/entries/${original.slug}`],
    ]) as Record<string, string>;

    return existingVersions.map(({ locale, version }) => ({
      url: `${siteUrl}/${locale}/entries/${version.slug}`,
      lastModified: new Date(version.publishedAt),
      alternates: { languages },
    }));
  });

  return [...globalPages, ...entries];
}
