import { existsSync } from "node:fs";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { entryDirectory, ensureEntriesRoot, writeJson } from "./lib/content.mjs";

const [slug, title, originalLanguage = "en"] = process.argv.slice(2);
if (!slug || !title) throw new Error("Usage: pnpm entry:create <slug> \"Title\" [language]");
if (!["en", "ru"].includes(originalLanguage)) throw new Error("Language must be en or ru.");

await ensureEntriesRoot();
const directory = entryDirectory(slug);
if (existsSync(directory)) throw new Error(`Entry already exists: ${slug}`);
await mkdir(directory, { recursive: false });
await writeFile(path.join(directory, "draft.md"), "", "utf8");
await writeJson(path.join(directory, "metadata.json"), {
  schemaVersion: 2,
  id: crypto.randomUUID(),
  slug,
  title,
  originalLanguage,
  status: "draft",
  createdAt: new Date().toISOString(),
  submittedAt: null,
  publishedAt: null,
  originalSha256: null,
  publishedFrom: null,
  tags: [],
  translations: {},
});
console.log(`Draft created: content/entries/${slug}/draft.md`);
