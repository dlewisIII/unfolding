import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { publishedEntries } from "@/content/generated";
import { copy, isLocale, pageMetadata } from "../i18n";

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  return pageMetadata(locale);
}

export default async function LocaleHome({ params }: Props) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const text = copy[locale];
  const entries = publishedEntries.flatMap((entry) => entry.versions[locale] ? [entry.versions[locale]] : []);

  return (
    <main>
      <section className="feed" aria-labelledby="journal-heading">
        <h1 id="journal-heading" className="sr-only">Journal</h1>
        {entries.length === 0 ? (
          <div className="empty-state">
            <p className="eyebrow">{text.journalReady}</p>
            <h2>{text.emptyTitle}</h2>
            <p>{text.emptyBody}</p>
          </div>
        ) : entries.map((entry) => entry && (
          <article className="feed-entry" key={entry.slug}>
            <time dateTime={entry.createdAt}>{new Intl.DateTimeFormat(locale, { day: "numeric", month: "long", year: "numeric" }).format(new Date(entry.createdAt))}</time>
            {entry.title ? <h2><a href={`/${locale}/entries/${entry.slug}`} target="_top">{entry.title}</a></h2> : null}
            {entry.excerpt && <p className="excerpt">{entry.title ? entry.excerpt : <a href={`/${locale}/entries/${entry.slug}`} target="_top">{entry.excerpt}</a>}</p>}
            {entry.tags.length > 0 && <ul className="tags" aria-label={text.tags}>{entry.tags.map((tag) => <li key={tag}>{tag}</li>)}</ul>}
          </article>
        ))}
      </section>
    </main>
  );
}
