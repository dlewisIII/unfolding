import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { lifecycleDirectory, readMetadata, resolveEntry, setActiveEntry } from "./lib/content.mjs";

const args = process.argv.slice(2);
const slug = await resolveEntry(args[0]);
const locale = args[1];
const fromIndex = args.indexOf("--from");
if (!slug || !locale || fromIndex < 0 || !args[fromIndex + 1]) throw new Error("Usage: pnpm entry:draft <slug|--active> <ru|en> --from <text-file>");
const metadata = await readMetadata(slug);
const directory = lifecycleDirectory(slug, locale, metadata);
const lifecycle = locale === metadata.originalLanguage ? metadata : metadata.translations?.[locale];
if (!lifecycle) throw new Error(`No ${locale} lifecycle exists. Create a translation first.`);
if (lifecycle.status === "published") throw new Error("Published text is immutable; create an explicit new editorial workflow before changing it.");
await writeFile(path.join(directory, "draft.md"), await readFile(path.resolve(args[fromIndex + 1])));
await setActiveEntry(slug);
console.log(`Draft updated without changing the immutable original: ${slug} (${locale})`);
