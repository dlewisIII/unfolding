import type { Metadata } from "next";
import { notFound } from "next/navigation";
import ReactMarkdown from "react-markdown";
import rehypeKatex from "rehype-katex";
import remarkMath from "remark-math";
import { publishedEntries } from "@/content/generated";
import { copy, isLocale, siteUrl, type Locale } from "../../../i18n";
import { CopyEntryLink } from "../../../components/CopyEntryLink";
import { entryDisplayTitle, formatEntryDate, withoutDuplicateLeadingTitle } from "../../../lib/entry-display.mjs";
import { ExternalLinks } from "../../../components/ExternalLinks";

type Props = { params: Promise<{ locale: string; slug: string }> };

export function generateStaticParams() {
  return publishedEntries.flatMap((entry) => (["en", "ru"] as const).flatMap((locale) => {
    const version = entry.versions[locale];
    return version ? [{ locale, slug: version.slug }] : [];
  }));
}

function findEntry(locale: Locale, slug: string) {
  return publishedEntries.find((item) => item.versions[locale]?.slug === slug);
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale: rawLocale, slug } = await params;
  if (!isLocale(rawLocale)) return {};
  const entry = findEntry(rawLocale, slug);
  const version = entry?.versions[rawLocale];
  if (!entry || !version) return { title: copy[rawLocale].notFound, robots: { index: false } };
  const languages: Record<string, string> = { [rawLocale]: `/${rawLocale}/entries/${version.slug}` };
  const otherLocale: Locale = rawLocale === "ru" ? "en" : "ru";
  const other = entry.versions[otherLocale];
  if (other) languages[otherLocale] = `/${otherLocale}/entries/${other.slug}`;
  const original = entry.versions[entry.originalLanguage] ?? version;
  languages["x-default"] = `/${original.locale}/entries/${original.slug}`;
  return {
    title: version.title || "UNFOLDING",
    description: version.excerpt,
    alternates: { canonical: `/${rawLocale}/entries/${version.slug}`, languages },
    openGraph: { type: "article", title: version.title || "UNFOLDING", description: version.excerpt, url: `${siteUrl}/${rawLocale}/entries/${version.slug}`, locale: rawLocale === "ru" ? "ru_RU" : "en_US" },
  };
}

export default async function EntryPage({ params }: Props) {
  const { locale: rawLocale, slug } = await params;
  if (!isLocale(rawLocale)) notFound();
  const entry = findEntry(rawLocale, slug);
  const version = entry?.versions[rawLocale];
  if (!entry || !version) notFound();
  const text = copy[rawLocale];
  const date = formatEntryDate(version.createdAt, rawLocale);
  const canonicalPath = `/${rawLocale}/entries/${version.slug}`;
  const displayTitle = entryDisplayTitle(version.title, version.body);
  const renderedBody = withoutDuplicateLeadingTitle(version.body, displayTitle);

  return <main>
    <nav className="entry-nav"><a href={`/${rawLocale}`}>{text.back}</a><CopyEntryLink locale={rawLocale} canonicalPath={canonicalPath} /></nav>
    <article>
      <header className="entry-header"><time className="entry-time" dateTime={version.createdAt}>{date}</time>{displayTitle ? <h1>{displayTitle}</h1> : null}</header>
      <div className="prose entry-content"><ReactMarkdown remarkPlugins={[remarkMath]} rehypePlugins={[rehypeKatex]}>{renderedBody}</ReactMarkdown></div>
      <ExternalLinks links={version.externalLinks} ariaLabel={text.externalLinks} />
      {version.tags.length > 0 && <footer className="entry-taxonomy"><h2>{text.tags}</h2><ul className="tags">{version.tags.map((tag) => <li key={tag}>{tag}</li>)}</ul></footer>}
    </article>
  </main>;
}
