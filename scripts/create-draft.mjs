import { existsSync } from "node:fs";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { assertLocale, entryDirectory, ensureEntriesRoot, localDateTime, setActiveEntry, writeJson } from "./lib/content.mjs";

const args = process.argv.slice(2);
const [originalLanguage, slug] = args;
const fromIndex = args.indexOf("--from");
const titleIndex = args.indexOf("--title");
if (!slug || fromIndex < 0 || !args[fromIndex + 1]) throw new Error("Usage: pnpm entry:create <ru|en> <slug> --from <text-file> [--title <title>]");
assertLocale(originalLanguage);
const sourcePath = path.resolve(args[fromIndex + 1]);
const title = titleIndex >= 0 ? args[titleIndex + 1] : null;
const draft = await readFile(sourcePath);

await ensureEntriesRoot();
const directory = entryDirectory(slug);
if (existsSync(directory)) throw new Error(`Entry already exists: ${slug}`);
await mkdir(directory, { recursive: false });
await writeFile(path.join(directory, "draft.md"), draft);
await writeJson(path.join(directory, "metadata.json"), {
  schemaVersion: 2,
  id: crypto.randomUUID(),
  slug,
  title,
  originalLanguage,
  status: "draft",
  createdAt: localDateTime(),
  submittedAt: null,
  publishedAt: null,
  originalSha256: null,
  publishedFrom: null,
  tags: [],
  externalLinks: [],
  translations: {},
});
await setActiveEntry(slug);
console.log(`Draft created: content/entries/${slug}/draft.md`);
