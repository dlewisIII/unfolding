import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { publishedEntries } from "@/content/generated";
import { copy, isLocale, pageMetadata } from "../i18n";
import { JournalFeedEntry } from "../components/JournalFeedEntry";

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
        ) : entries.map((entry) => entry && <JournalFeedEntry entry={entry} locale={locale} key={entry.slug} />)}
      </section>
    </main>
  );
}
