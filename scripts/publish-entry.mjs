import { copyFile, readFile } from "node:fs/promises";
import path from "node:path";
import { ensureOriginalIntegrity, entryDirectory, readMetadata, sha256, writeMetadata } from "./lib/content.mjs";

const [slug, decision] = process.argv.slice(2);
if (!slug || !["--as-is", "--from-draft"].includes(decision)) {
  throw new Error("Usage: pnpm entry:publish <slug> (--as-is | --from-draft)");
}
const directory = entryDirectory(slug);
const metadata = await readMetadata(slug);
if (metadata.status !== "reviewed") throw new Error("Entry must be submitted for review before publication.");
await ensureOriginalIntegrity(slug, metadata);

const sourceName = decision === "--as-is" ? "original.md" : "draft.md";
const sourcePath = path.join(directory, sourceName);
const publishedBody = await readFile(sourcePath, "utf8");
if (!publishedBody.trim()) throw new Error("Selected publication source is empty.");
await copyFile(sourcePath, path.join(directory, "published.md"));
await writeMetadata(slug, {
  ...metadata,
  status: "published",
  publishedAt: new Date().toISOString(),
  publishedFrom: decision === "--as-is" ? "original" : "draft",
  publishedSha256: sha256(publishedBody),
  authorDecision: decision === "--as-is" ? "publish_as_is" : "publish_current_draft",
});
console.log(`Published ${slug} from ${sourceName}. Run content sync to update the site.`);
