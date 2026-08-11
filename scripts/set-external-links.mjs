import path from "node:path";
import { z } from "zod";
import { readJson, readMetadata, resolveEntry, writeMetadata } from "./lib/content.mjs";

const args = process.argv.slice(2);
const slug = await resolveEntry(args[0]);
const fromIndex = args.indexOf("--from");
if (!slug || fromIndex < 0 || !args[fromIndex + 1]) throw new Error("Usage: pnpm entry:links <slug|--active> --from <external-links.json>");
const parsed = z.object({ externalLinks: z.array(z.object({ type: z.enum(["github", "external"]), url: z.url(), label: z.string().trim().min(1) })) }).parse(await readJson(path.resolve(args[fromIndex + 1])));
const metadata = await readMetadata(slug);
await writeMetadata(slug, { ...metadata, externalLinks: parsed.externalLinks.map((link) => ({ id: crypto.randomUUID(), ...link })) });
console.log(`External links saved for ${slug}; author text unchanged.`);
