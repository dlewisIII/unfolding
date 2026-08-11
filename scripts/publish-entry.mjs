import { copyFile, readFile } from "node:fs/promises";
import path from "node:path";
import { ensureLifecycleOriginalIntegrity, lifecycleDirectory, localDateTime, readMetadata, resolveEntry, sha256, writeMetadata } from "./lib/content.mjs";

const [selector, locale, decision] = process.argv.slice(2);
if (!selector || !locale || !["--as-is", "--from-draft"].includes(decision)) throw new Error("Usage: pnpm entry:publish <slug|--active> <ru|en> (--as-is | --from-draft)");
const slug = await resolveEntry(selector);
const metadata = await readMetadata(slug);
const directory = lifecycleDirectory(slug, locale, metadata);
const lifecycle = locale === metadata.originalLanguage ? metadata : metadata.translations?.[locale];
if (!lifecycle || (lifecycle.status !== "reviewed" && !(lifecycle.status === "published" && lifecycle.revisionStatus === "reviewed"))) throw new Error("This language version must be reviewed before publication.");
await ensureLifecycleOriginalIntegrity(slug, locale, metadata);
const sourceName = decision === "--as-is" ? "original.md" : "draft.md";
const sourcePath = path.join(directory, sourceName);
const publishedBody = await readFile(sourcePath, "utf8");
if (!publishedBody.trim()) throw new Error("Selected publication source is empty.");
await copyFile(sourcePath, path.join(directory, "published.md"));
const lifecycleWithoutRevision = { ...lifecycle };
delete lifecycleWithoutRevision.revisionStatus;
delete lifecycleWithoutRevision.revisionStartedAt;
delete lifecycleWithoutRevision.revisionSubmittedAt;
delete lifecycleWithoutRevision.revisionDraftSha256;
const published = { ...lifecycleWithoutRevision, status: "published", publishedAt: localDateTime(), publishedFrom: decision === "--as-is" ? "original" : "draft", publishedSha256: sha256(publishedBody), authorDecision: decision === "--as-is" ? "publish_as_is" : "publish_current_draft" };
if (locale === metadata.originalLanguage) {
  const metadataWithoutRevision = { ...metadata };
  delete metadataWithoutRevision.revisionStatus;
  delete metadataWithoutRevision.revisionStartedAt;
  delete metadataWithoutRevision.revisionSubmittedAt;
  delete metadataWithoutRevision.revisionDraftSha256;
  await writeMetadata(slug, { ...metadataWithoutRevision, ...published });
}
else await writeMetadata(slug, { ...metadata, translations: { ...metadata.translations, [locale]: published } });
console.log(`Published ${slug} (${locale}) from ${sourceName}. Run content sync to update the site.`);
