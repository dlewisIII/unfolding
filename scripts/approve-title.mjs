import { readMetadata, resolveEntry, writeMetadata } from "./lib/content.mjs";

const args = process.argv.slice(2);
const slug = await resolveEntry(args[0]);
const locale = args[1];
const titleIndex = args.indexOf("--title");
const title = titleIndex >= 0 ? args[titleIndex + 1]?.trim() : "";
if (!slug || !locale || !title) throw new Error("Usage: pnpm entry:title:approve <slug|--active> <ru|en> --title <title>");
const metadata = await readMetadata(slug);
if (locale === metadata.originalLanguage) await writeMetadata(slug, { ...metadata, title });
else {
  const lifecycle = metadata.translations?.[locale];
  if (!lifecycle) throw new Error(`No ${locale} lifecycle exists.`);
  await writeMetadata(slug, { ...metadata, translations: { ...metadata.translations, [locale]: { ...lifecycle, title } } });
}
console.log(`Approved metadata title saved for ${slug} (${locale}); author text unchanged.`);
