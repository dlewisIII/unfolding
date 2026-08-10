import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { SearchJournal } from "../../components/SearchJournal";
import { publishedEntries } from "@/content/generated";
import { copy, isLocale, pageMetadata } from "../../i18n";

type Props = { params: Promise<{ locale: string }> };
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  return pageMetadata(locale, copy[locale].search, locale === "ru" ? "Поиск по журналу Unfolding." : "Search the Unfolding journal.", "/search");
}

export default async function SearchPage({ params }: Props) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const entries = publishedEntries.flatMap((entry) => entry.versions[locale] ? [entry.versions[locale]] : []);
  return <main className="quiet-page search-page"><p className="eyebrow">{copy[locale].search}</p><h1>{copy[locale].findThought}</h1><SearchJournal entries={entries} locale={locale} /></main>;
}
