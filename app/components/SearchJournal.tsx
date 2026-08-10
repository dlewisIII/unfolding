"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import type { PublishedEntry } from "@/content/generated";

export function SearchJournal({ entries }: { entries: PublishedEntry[] }) {
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
      <label htmlFor="journal-search">Search titles, text, and tags</label>
      <input
        id="journal-search"
        type="search"
        autoComplete="off"
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        placeholder="A word, phrase, or concept…"
      />
      <p className="search-status" aria-live="polite">
        {!normalized ? "Begin typing to search the journal." : `${results.length} ${results.length === 1 ? "entry" : "entries"} found.`}
      </p>
      {normalized && results.length > 0 && (
        <ol className="search-results">
          {results.map((entry) => (
            <li key={entry.slug}>
              <Link href={`/entries/${entry.slug}`}>{entry.title}</Link>
              {entry.excerpt && <p>{entry.excerpt}</p>}
              {entry.tags.length > 0 && <span>{entry.tags.join(" · ")}</span>}
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}
