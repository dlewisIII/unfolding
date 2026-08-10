import type { Metadata } from "next";
import Link from "next/link";
import ReactMarkdown from "react-markdown";
import rehypeKatex from "rehype-katex";
import remarkMath from "remark-math";
import { publishedEntries } from "@/content/generated";

type Props = { params: Promise<{ slug: string }> };

export function generateStaticParams() {
  return publishedEntries.map(({ slug }) => ({ slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const entry = publishedEntries.find((item) => item.slug === slug);
  return entry ? { title: entry.title, description: entry.excerpt } : { title: "Entry not found" };
}

export default async function EntryPage({ params }: Props) {
  const { slug } = await params;
  const entry = publishedEntries.find((item) => item.slug === slug);
  if (!entry) return (
    <main className="entry-shell not-found"><p className="eyebrow">404</p><h1>Entry not found.</h1><Link href="/">← Return to journal</Link></main>
  );

  const date = new Intl.DateTimeFormat(entry.originalLanguage, {
    day: "numeric", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit",
  }).format(new Date(entry.publishedAt));

  return (
    <main className="entry-shell">
      <nav className="entry-nav"><Link href="/">← Journal</Link></nav>
      <article>
        <header className="entry-header">
          <time className="entry-time" dateTime={entry.publishedAt}>{date}</time>
          <h1>{entry.title}</h1>
        </header>
        <div className="prose">
          <ReactMarkdown remarkPlugins={[remarkMath]} rehypePlugins={[rehypeKatex]}>{entry.body}</ReactMarkdown>
        </div>
        {entry.tags.length > 0 && (
          <footer className="entry-taxonomy"><h2>Tags</h2><ul className="tags">{entry.tags.map((tag) => <li key={tag}>{tag}</li>)}</ul></footer>
        )}
      </article>
    </main>
  );
}
