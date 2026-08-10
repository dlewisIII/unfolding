import { readFile } from "node:fs/promises";
import path from "node:path";
import { z } from "zod";
import { readMetadata, resolveEntry, writeMetadata } from "./lib/content.mjs";

const args = process.argv.slice(2);
const slug = await resolveEntry(args[0]);
const locale = args[1];
const fromIndex = args.indexOf("--from");
if (!slug || !locale || fromIndex < 0 || !args[fromIndex + 1]) throw new Error("Usage: pnpm entry:tags <slug|--active> <ru|en> --from <approved-tags.json>");
const { tags } = z.object({ tags: z.array(z.string().trim().min(1)) }).parse(JSON.parse(await readFile(path.resolve(args[fromIndex + 1]), "utf8")));
const metadata = await readMetadata(slug);
if (locale === metadata.originalLanguage) await writeMetadata(slug, { ...metadata, tags });
else {
  const lifecycle = metadata.translations?.[locale];
  if (!lifecycle) throw new Error(`No ${locale} lifecycle exists.`);
  await writeMetadata(slug, { ...metadata, translations: { ...metadata.translations, [locale]: { ...lifecycle, tags } } });
}
console.log(`Approved tags saved for ${slug} (${locale}); publication status unchanged.`);
