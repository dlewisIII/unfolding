import path from "node:path";
import { z } from "zod";
import { lifecycleDirectory, localDateTime, readJson, readMetadata, resolveEntry, writeJson } from "./lib/content.mjs";

const [selector, locale, input] = process.argv.slice(2);
if (!selector || !locale || !input) throw new Error("Usage: pnpm entry:title:suggest <slug|--active> <ru|en> <suggested-title.json>");
const slug = await resolveEntry(selector);
const metadata = await readMetadata(slug);
const lifecycle = locale === metadata.originalLanguage ? metadata : metadata.translations?.[locale];
if (!lifecycle) throw new Error(`No ${locale} lifecycle exists.`);
if (lifecycle.title) throw new Error("This language lifecycle already has an approved title.");
const parsed = z.object({
  source: z.enum(["h1", "generated"]),
  options: z.array(z.object({ title: z.string().trim().min(1), rationale: z.string().default("") })).min(1).max(3),
}).parse(await readJson(path.resolve(input)));
await writeJson(path.join(lifecycleDirectory(slug, locale, metadata), "suggested-title.json"), { schemaVersion: 1, entryId: metadata.id, locale, suggestedAt: localDateTime(), ...parsed });
console.log(`Suggested title saved for ${slug} (${locale}); metadata title remains unapproved.`);
