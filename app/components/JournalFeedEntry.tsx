"use client";

import { useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import rehypeKatex from "rehype-katex";
import remarkMath from "remark-math";
import type { PublishedVersion } from "@/content/generated";
import { copy, type Locale } from "../i18n";
import { formatEntryDate, journalPreview } from "../lib/entry-display.mjs";
import { ExternalLinks } from "./ExternalLinks";

export function JournalFeedEntry({ entry, locale }: { entry: PublishedVersion; locale: Locale }) {
  const [expanded, setExpanded] = useState(false);
  const articleRef = useRef<HTMLElement>(null);
  const text = copy[locale];
  const permalink = `/${locale}/entries/${entry.slug}`;
  const preview = journalPreview(entry.body);

  function collapse() {
    const top = articleRef.current?.getBoundingClientRect().top ?? 0;
    setExpanded(false);
    if (top < -120) requestAnimationFrame(() => articleRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }));
  }

  return <article className="feed-entry" ref={articleRef}>
    <div className="entry-meta-line">
      <time dateTime={entry.createdAt}>{formatEntryDate(entry.createdAt, locale)}</time>
      <a className="open-entry-link" href={permalink} target="_blank" rel="noopener noreferrer" aria-label={text.openEntry} title={text.openEntry}>↗</a>
    </div>
    {entry.title ? <h2><a href={permalink} target="_top">{entry.title}</a></h2> : null}
    <div className="prose feed-entry-body"><ReactMarkdown remarkPlugins={[remarkMath]} rehypePlugins={[rehypeKatex]}>{expanded ? entry.body : preview.body}</ReactMarkdown></div>
    {preview.truncated && <button className="inline-entry-toggle" type="button" aria-expanded={expanded} onClick={expanded ? collapse : () => setExpanded(true)}>{expanded ? text.collapse : text.readMore}</button>}
    {(!preview.truncated || expanded) && <ExternalLinks links={entry.externalLinks} ariaLabel={text.externalLinks} />}
    {entry.tags.length > 0 && <ul className="tags" aria-label={text.tags}>{entry.tags.map((tag) => <li key={tag}>{tag}</li>)}</ul>}
  </article>;
}
