import Link from "next/link";
import { publishedEntries } from "@/content/generated";

function formatDate(value: string, language: string) {
  return new Intl.DateTimeFormat(language, {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date(value));
}

export default function Home() {
  return (
    <main className="site-shell">
      <header className="site-header">
        <Link className="wordmark" href="/">Unfolding</Link>
        <p>Personal journal & research notebook</p>
      </header>

      <section className="feed" aria-labelledby="journal-heading">
        <h1 id="journal-heading" className="sr-only">Journal</h1>
        {publishedEntries.length === 0 ? (
          <div className="empty-state">
            <p className="eyebrow">The journal is ready.</p>
            <h2>The first page is still unwritten.</h2>
            <p>Published notes will appear here in chronological order.</p>
          </div>
        ) : (
          publishedEntries.map((entry) => (
            <article className="feed-entry" key={entry.slug}>
              <time dateTime={entry.publishedAt}>
                {formatDate(entry.publishedAt, entry.originalLanguage)}
              </time>
              <h2><Link href={`/entries/${entry.slug}`}>{entry.title}</Link></h2>
              {entry.excerpt && <p className="excerpt">{entry.excerpt}</p>}
              {entry.tags.length > 0 && (
                <ul className="tags" aria-label="Tags">
                  {entry.tags.map((tag) => <li key={tag}>{tag}</li>)}
                </ul>
              )}
            </article>
          ))
        )}
      </section>

      <footer className="site-footer">Written and tended by Anastasia.</footer>
    </main>
  );
}
