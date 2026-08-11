import type { MetadataRoute } from "next";
import { publishedEntries } from "@/content/generated";
import { localePath, siteUrl } from "./i18n";

const locales = ["en", "ru"] as const;
const globalPaths = ["", "/about", "/search"] as const;

export default function sitemap(): MetadataRoute.Sitemap {
  const globalPages = globalPaths.flatMap((path) => locales.map((locale) => ({
    url: `${siteUrl}${localePath(locale, path)}`,
    alternates: {
      languages: {
        en: `${siteUrl}${localePath("en", path)}`,
        ru: `${siteUrl}${localePath("ru", path)}`,
        "x-default": `${siteUrl}${localePath("en", path)}`,
      },
    },
  })));

  const entries = publishedEntries.flatMap((entry) => {
    const existingVersions = locales.flatMap((locale) => {
      const version = entry.versions[locale];
      return version ? [{ locale, version }] : [];
    });
    if (existingVersions.length === 0) return [];
    const english = entry.versions.en;
    const defaultVersion = english ?? existingVersions[0].version;
    const defaultLocale = english ? "en" : existingVersions[0].locale;

    const languages = Object.fromEntries([
      ...existingVersions.map(({ locale, version }) => [locale, `${siteUrl}${localePath(locale, `/entries/${version.slug}`)}`]),
      ["x-default", `${siteUrl}${localePath(defaultLocale, `/entries/${defaultVersion.slug}`)}`],
    ]) as Record<string, string>;

    return existingVersions.map(({ locale, version }) => ({
      url: `${siteUrl}${localePath(locale, `/entries/${version.slug}`)}`,
      lastModified: new Date(version.publishedAt),
      alternates: { languages },
    }));
  });

  return [...globalPages, ...entries];
}
