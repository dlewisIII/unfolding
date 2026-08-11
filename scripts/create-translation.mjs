import { existsSync } from "node:fs";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { assertLocale, entryDirectory, localDateTime, readMetadata, resolveEntry, setActiveEntry, writeMetadata } from "./lib/content.mjs";

const args = process.argv.slice(2);
const slug = await resolveEntry(args[0]);
const locale = args[1];
const fromIndex = args.indexOf("--from");
const titleIndex = args.indexOf("--title");
const methodIndex = args.indexOf("--method");
const translationMethod = methodIndex >= 0 ? args[methodIndex + 1] : null;
if (!slug || !locale || fromIndex < 0 || !args[fromIndex + 1] || !["author", "agent"].includes(translationMethod)) throw new Error("Usage: pnpm entry:translate <slug|--active> <ru|en> --from <text-file> --method <author|agent> [--title <approved-title>]");
assertLocale(locale);
const metadata = await readMetadata(slug);
if (locale === metadata.originalLanguage) throw new Error(`${locale} is the original language, not a translation.`);
if (metadata.translations?.[locale]) throw new Error(`A ${locale} translation lifecycle already exists. Update its draft instead.`);
const directory = path.join(entryDirectory(slug), "translations", locale);
if (existsSync(directory)) throw new Error(`Translation directory already exists: ${locale}`);
await mkdir(directory, { recursive: true });
await writeFile(path.join(directory, "draft.md"), await readFile(path.resolve(args[fromIndex + 1])));
await writeMetadata(slug, {
  ...metadata,
  translations: {
    ...(metadata.translations || {}),
    [locale]: {
      locale,
      title: titleIndex >= 0 ? args[titleIndex + 1] : null,
      slug: metadata.slug,
      status: "draft",
      translatedAt: localDateTime(),
      translationMethod,
      submittedAt: null,
      publishedAt: null,
      originalSha256: null,
      publishedFrom: null,
      tags: [],
    },
  },
});
await setActiveEntry(slug);
console.log(`Translation draft created for the same entry id and createdAt: ${slug} (${locale})`);
