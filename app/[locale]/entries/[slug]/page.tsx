import type { Metadata } from "next";
import { notFound } from "next/navigation";
import ReactMarkdown from "react-markdown";
import rehypeKatex from "rehype-katex";
import remarkMath from "remark-math";
import { publishedEntries } from "@/content/generated";
import { authorName, copy, isLocale, localePath, siteUrl, type Locale } from "../../../i18n";
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

function jsonLd(value: unknown) {
  return JSON.stringify(value).replace(/</g, "\\u003c").replace(/>/g, "\\u003e").replace(/&/g, "\\u0026").replace(/\u2028/g, "\\u2028").replace(/\u2029/g, "\\u2029");
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale: rawLocale, slug } = await params;
  if (!isLocale(rawLocale)) return {};
  const entry = findEntry(rawLocale, slug);
  const version = entry?.versions[rawLocale];
  if (!entry || !version) return { title: copy[rawLocale].notFound, robots: { index: false } };
  const languages: Record<string, string> = { [rawLocale]: localePath(rawLocale, `/entries/${version.slug}`) };
  const otherLocale: Locale = rawLocale === "ru" ? "en" : "ru";
  const other = entry.versions[otherLocale];
  if (other) languages[otherLocale] = localePath(otherLocale, `/entries/${other.slug}`);
  const english = entry.versions.en;
  languages["x-default"] = english ? localePath("en", `/entries/${english.slug}`) : localePath(rawLocale, `/entries/${version.slug}`);
  return {
    title: version.title || "UNFOLDING",
    description: version.excerpt,
    alternates: { canonical: localePath(rawLocale, `/entries/${version.slug}`), languages },
    openGraph: { type: "article", title: version.title || "UNFOLDING", description: version.excerpt, url: `${siteUrl}${localePath(rawLocale, `/entries/${version.slug}`)}`, locale: rawLocale === "ru" ? "ru_RU" : "en_US" },
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
  const canonicalPath = localePath(rawLocale, `/entries/${version.slug}`);
  const canonicalUrl = `${siteUrl}${canonicalPath}`;
  const displayTitle = entryDisplayTitle(version.title, version.body);
  const renderedBody = withoutDuplicateLeadingTitle(version.body, displayTitle);
  const structuredData = version.title ? {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: version.title,
    description: version.excerpt,
    datePublished: version.publishedAt,
    author: { "@type": "Person", name: authorName },
    inLanguage: rawLocale,
    url: canonicalUrl,
    mainEntityOfPage: { "@type": "WebPage", "@id": canonicalUrl },
  } : null;

  return <main>
    {structuredData && <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd(structuredData) }} />}
    <nav className="entry-nav"><a href={localePath(rawLocale)}>{text.back}</a><CopyEntryLink locale={rawLocale} canonicalPath={canonicalPath} /></nav>
    <article>
      <header className="entry-header"><time className="entry-time" dateTime={version.createdAt}>{date}</time>{displayTitle ? <h1>{displayTitle}</h1> : null}</header>
      <div className="prose entry-content"><ReactMarkdown remarkPlugins={[remarkMath]} rehypePlugins={[rehypeKatex]}>{renderedBody}</ReactMarkdown></div>
      <ExternalLinks links={version.externalLinks} ariaLabel={text.externalLinks} />
      {version.tags.length > 0 && <footer className="entry-taxonomy"><h2>{text.tags}</h2><ul className="tags">{version.tags.map((tag) => <li key={tag}>{tag}</li>)}</ul></footer>}
    </article>
  </main>;
}
