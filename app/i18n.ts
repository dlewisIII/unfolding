import type { Metadata } from "next";

export const locales = ["en", "ru"] as const;
export type Locale = (typeof locales)[number];
export const siteUrl = "https://unfolding-journal.davidlewisiii.chatgpt.site";

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
    back: "← Journal",
    notFound: "Entry not found.",
    tags: "Tags",
    translationMissing: "Translation not published",
    footer: "Written and tended by Anastasia.",
    description: "A personal journal of inquiry, observation, and creation.",
  },
  ru: {
    about: "О журнале",
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
    back: "← Журнал",
    notFound: "Запись не найдена.",
    tags: "Теги",
    translationMissing: "Перевод не опубликован",
    footer: "Автор и хранитель журнала — Анастасия.",
    description: "Личный журнал исследования, наблюдения и творчества.",
  },
} as const;

export function pageMetadata(locale: Locale, title?: string, description?: string, suffix = ""): Metadata {
  const path = `/${locale}${suffix}`;
  const alternateSuffix = suffix;
  return {
    title: title ?? { absolute: "Unfolding" },
    description: description ?? copy[locale].description,
    alternates: {
      canonical: path,
      languages: { "en-US": `/en${alternateSuffix}`, "ru-RU": `/ru${alternateSuffix}`, "x-default": "/" },
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
