import type { Metadata } from "next";
import { SearchJournal } from "../components/SearchJournal";
import { publishedEntries } from "@/content/generated";

export const metadata: Metadata = { title: "Search", description: "Search the Unfolding journal." };

export default function SearchPage() {
  return (
    <main className="quiet-page search-page">
      <p className="eyebrow">Search</p>
      <h1>Find a thought.</h1>
      <SearchJournal entries={publishedEntries} />
    </main>
  );
}
