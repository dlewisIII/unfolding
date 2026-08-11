import { existsSync } from "node:fs";
import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { z } from "zod";
import { ensureLifecycleOriginalIntegrity, lifecycleDirectory, localDateTime, readJson, readMetadata, resolveEntry, reviewCategories, sha256, writeJson, writeMetadata } from "./lib/content.mjs";

const [selector, locale, reviewInput, tagsInput] = process.argv.slice(2);
if (!selector || !locale || !reviewInput || !tagsInput) throw new Error("Usage: pnpm entry:review <slug|--active> <ru|en> <review.json> <suggested-tags.json>");
const slug = await resolveEntry(selector);
const check = z.object({ category: z.enum(reviewCategories), status: z.enum(["reviewed", "not_applicable"]), explanation: z.string().default("") });
const issue = z.object({
  category: z.enum(reviewCategories),
  location: z.object({ paragraph: z.number().int().positive().optional(), fragment: z.string().min(1).optional() }).refine((v) => v.paragraph || v.fragment, "location needs paragraph or fragment"),
  explanation: z.string().min(1), severity: z.enum(["note", "minor", "major", "blocking"]),
  status: z.enum(["open", "accepted", "dismissed", "resolved"]).default("open"), confidence: z.number().min(0).max(1).optional(),
});
const reviewSchema = z.object({ summary: z.string().default(""), checks: z.array(check).length(reviewCategories.length), issues: z.array(issue) }).superRefine((value, ctx) => {
  const categories = value.checks.map((item) => item.category);
  for (const category of reviewCategories) if (categories.filter((item) => item === category).length !== 1) ctx.addIssue({ code: "custom", message: `checks must contain ${category} exactly once` });
});
const tagsSchema = z.object({ tags: z.array(z.string().trim().min(1)).default([]), rationale: z.string().default("") });

const metadata = await readMetadata(slug);
const directory = lifecycleDirectory(slug, locale, metadata);
const lifecycle = locale === metadata.originalLanguage ? metadata : metadata.translations?.[locale];
if (!lifecycle) throw new Error(`No ${locale} lifecycle exists.`);
const draft = await readFile(path.join(directory, "draft.md"), "utf8");
if (!draft.trim()) throw new Error("Draft is empty.");
const originalPath = path.join(directory, "original.md");
let originalSha256 = lifecycle.originalSha256;
if (existsSync(originalPath)) await ensureLifecycleOriginalIntegrity(slug, locale, metadata);
else {
  await writeFile(originalPath, draft, { encoding: "utf8", flag: "wx" });
  originalSha256 = sha256(draft);
}
const parsed = reviewSchema.parse(await readJson(path.resolve(reviewInput)));
const reviewedAt = localDateTime();
const review = { schemaVersion: 2, entryId: metadata.id, locale, reviewedAt, originalSha256, draftSha256: sha256(draft), summary: parsed.summary, checks: parsed.checks, issues: parsed.issues.map((item, index) => ({ id: `issue-${index + 1}`, ...item })) };
await writeJson(path.join(directory, "review.json"), review);
await writeJson(path.join(directory, "suggested-tags.json"), { schemaVersion: 1, entryId: metadata.id, locale, suggestedAt: reviewedAt, ...tagsSchema.parse(await readJson(path.resolve(tagsInput))) });
const counts = review.checks.map((item) => `- **${item.category.replace("_", " ")}**: ${item.status}${item.explanation ? ` — ${item.explanation}` : ""}`);
const details = review.issues.map((item) => `### ${item.category} · ${item.severity}\n\n${item.location.fragment ? `“${item.location.fragment}”` : `paragraph ${item.location.paragraph}`}\n\n${item.explanation}`);
await writeFile(path.join(directory, "review.md"), `# Review\n\n${review.summary}\n\n${counts.join("\n")}\n${details.length ? `\n${details.join("\n\n")}` : ""}\n`, "utf8");
const reviewedLifecycle = lifecycle.status === "published"
  ? { ...lifecycle, revisionStatus: "reviewed", revisionSubmittedAt: reviewedAt, revisionDraftSha256: sha256(draft) }
  : { ...lifecycle, status: "reviewed", submittedAt: reviewedAt, originalSha256 };
if (locale === metadata.originalLanguage) await writeMetadata(slug, { ...metadata, ...reviewedLifecycle });
else await writeMetadata(slug, { ...metadata, translations: { ...metadata.translations, [locale]: reviewedLifecycle } });
const substantial = review.issues.filter((item) => item.status === "open" && ["major", "blocking"].includes(item.severity)).length;
console.log(substantial ? `Review saved: ${substantial} substantial open issue(s).` : "Review saved: ready for publication from the review perspective; author decision is still required.");
