"use client";

import { useMemo, useState } from "react";
import type { PublishedVersion } from "@/content/generated";
import { copy, type Locale } from "../i18n";

export function SearchJournal({ entries, locale }: { entries: PublishedVersion[]; locale: Locale }) {
  const text = copy[locale];
  const [query, setQuery] = useState("");
  const normalized = query.trim().toLocaleLowerCase();
  const results = useMemo(() => {
    if (!normalized) return [];
    return entries.filter((entry) =>
      [entry.title, entry.body, entry.tags.join(" ")].join(" ").toLocaleLowerCase().includes(normalized),
    );
  }, [entries, normalized]);

  return (
    <div className="search-tool">
      <label htmlFor="journal-search">{text.searchLabel}</label>
      <input
        id="journal-search"
        type="search"
        autoComplete="off"
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        placeholder={text.searchPlaceholder}
      />
      <p className="search-status" aria-live="polite">
        {!normalized ? text.searchStart : `${results.length} ${results.length === 1 ? text.entry : text.entries} ${text.found}`}
      </p>
      {normalized && results.length > 0 && (
        <ol className="search-results">
          {results.map((entry) => (
            <li key={entry.slug}>
              <a href={`/${locale}/entries/${entry.slug}`} target="_top">{entry.title}</a>
              {entry.excerpt && <p>{entry.excerpt}</p>}
              {entry.tags.length > 0 && <span>{entry.tags.join(" · ")}</span>}
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}
