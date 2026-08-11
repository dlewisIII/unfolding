import type { Metadata } from "next";

export const locales = ["en", "ru"] as const;
export type Locale = (typeof locales)[number];
export const siteUrl = "https://unfolding.day";
export const authorName = "Anastasia";

export function localePath(locale: Locale, suffix = "") {
  return locale === "ru" ? `/ru${suffix}` : suffix || "/";
}

export function isLocale(value: string): value is Locale {
  return locales.includes(value as Locale);
}

export const copy = {
  en: {
    about: "About",
    search: "Search",
    theme: "Theme",
    journalReady: "The journal is ready.",
    emptyTitle: "The first page is still unwritten.",
    emptyBody: "Published notes will appear here in chronological order.",
    findThought: "Find a thought.",
    searchLabel: "Search titles, text, and tags",
    searchPlaceholder: "A word, phrase, or concept…",
    searchStart: "Begin typing to search the journal.",
    entry: "entry",
    entries: "entries",
    found: "found.",
    back: "← Notes",
    notFound: "Entry not found.",
    tags: "Tags",
    translationMissing: "Translation not published",
    readMore: "Read more",
    collapse: "Collapse",
    openEntry: "Open entry",
    copyLink: "Copy link",
    linkCopied: "Link copied",
    externalLinks: "External links",
    footer: "Written and edited by Anastasia · © 2026 Unfolding",
    description: "A personal journal of inquiry, observation, and creation.",
  },
  ru: {
    about: "Об Unfolding",
    search: "Поиск",
    theme: "Тема",
    journalReady: "Журнал готов.",
    emptyTitle: "Первая страница ещё не написана.",
    emptyBody: "Опубликованные записи появятся здесь в хронологическом порядке.",
    findThought: "Найти мысль.",
    searchLabel: "Поиск по заголовкам, тексту и тегам",
    searchPlaceholder: "Слово, фраза или понятие…",
    searchStart: "Начните вводить запрос для поиска по журналу.",
    entry: "запись",
    entries: "записей",
    found: "найдено.",
    back: "← Записи",
    notFound: "Запись не найдена.",
    tags: "Теги",
    translationMissing: "Перевод не опубликован",
    readMore: "Читать дальше",
    collapse: "Свернуть",
    openEntry: "Открыть запись",
    copyLink: "Скопировать ссылку",
    linkCopied: "Ссылка скопирована",
    externalLinks: "Внешние ссылки",
    footer: "Written and edited by Anastasia · © 2026 Unfolding",
    description: "Личный журнал исследования, наблюдения и творчества.",
  },
} as const;

export function pageMetadata(locale: Locale, title?: string, description?: string, suffix = ""): Metadata {
  const path = localePath(locale, suffix);
  const xDefault = localePath("en", suffix);
  return {
    title: title ?? { absolute: "Unfolding" },
    description: description ?? copy[locale].description,
    alternates: {
      canonical: path,
      languages: { en: localePath("en", suffix), ru: localePath("ru", suffix), "x-default": xDefault },
    },
    openGraph: {
      type: "website",
      locale: locale === "ru" ? "ru_RU" : "en_US",
      alternateLocale: locale === "ru" ? ["en_US"] : ["ru_RU"],
      title: title ?? "Unfolding",
      description: description ?? copy[locale].description,
      url: `${siteUrl}${path}`,
    },
  };
}
