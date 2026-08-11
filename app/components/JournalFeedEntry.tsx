"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import ReactMarkdown from "react-markdown";
import rehypeKatex from "rehype-katex";
import remarkMath from "remark-math";
import type { PublishedVersion } from "@/content/generated";
import { copy, type Locale } from "../i18n";
import { entryDisplayTitle, formatEntryDate, journalPreview, withoutDuplicateLeadingTitle } from "../lib/entry-display.mjs";
import { ExternalLinks } from "./ExternalLinks";

export function JournalFeedEntry({ entry, locale }: { entry: PublishedVersion; locale: Locale }) {
  const [expanded, setExpanded] = useState(false);
  const articleRef = useRef<HTMLElement>(null);
  const text = copy[locale];
  const permalink = `/${locale}/entries/${entry.slug}`;
  const displayTitle = entryDisplayTitle(entry.title, entry.body);
  const renderedBody = withoutDuplicateLeadingTitle(entry.body, displayTitle);
  const preview = journalPreview(renderedBody);

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
    {displayTitle ? <h2 className="feed-entry-title"><Link href={permalink}>{displayTitle}</Link></h2> : null}
    <div className="prose entry-content feed-entry-body"><ReactMarkdown remarkPlugins={[remarkMath]} rehypePlugins={[rehypeKatex]}>{expanded ? renderedBody : preview.body}</ReactMarkdown></div>
    {preview.truncated && <button className="inline-entry-toggle" type="button" aria-expanded={expanded} onClick={expanded ? collapse : () => setExpanded(true)}>{expanded ? text.collapse : text.readMore}</button>}
    {(!preview.truncated || expanded) && <ExternalLinks links={entry.externalLinks} ariaLabel={text.externalLinks} />}
    {entry.tags.length > 0 && <ul className="tags" aria-label={text.tags}>{entry.tags.map((tag) => <li key={tag}>{tag}</li>)}</ul>}
  </article>;
}
