import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { lifecycleDirectory, localDateTime, readMetadata, resolveEntry, setActiveEntry, writeMetadata } from "./lib/content.mjs";

const args = process.argv.slice(2);
const slug = await resolveEntry(args[0]);
const locale = args[1];
const fromIndex = args.indexOf("--from");
if (!slug || !locale || fromIndex < 0 || !args[fromIndex + 1]) throw new Error("Usage: pnpm entry:draft <slug|--active> <ru|en> --from <text-file>");
const metadata = await readMetadata(slug);
const directory = lifecycleDirectory(slug, locale, metadata);
const lifecycle = locale === metadata.originalLanguage ? metadata : metadata.translations?.[locale];
if (!lifecycle) throw new Error(`No ${locale} lifecycle exists. Create a translation first.`);
await writeFile(path.join(directory, "draft.md"), await readFile(path.resolve(args[fromIndex + 1])));
if (lifecycle.status === "published") {
  const revised = { ...lifecycle, revisionStatus: "draft", revisionStartedAt: localDateTime() };
  if (locale === metadata.originalLanguage) await writeMetadata(slug, { ...metadata, ...revised });
  else await writeMetadata(slug, { ...metadata, translations: { ...metadata.translations, [locale]: revised } });
}
await setActiveEntry(slug);
console.log(`Draft updated without changing immutable original or published text: ${slug} (${locale})`);
