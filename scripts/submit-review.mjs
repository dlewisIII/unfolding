import { existsSync } from "node:fs";
import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { z } from "zod";
import { ensureOriginalIntegrity, entryDirectory, readJson, readMetadata, sha256, writeJson, writeMetadata } from "./lib/content.mjs";

const [slug, reviewInput] = process.argv.slice(2);
if (!slug || !reviewInput) throw new Error("Usage: pnpm entry:review <slug> <review.json>");

const issue = z.object({
  category: z.enum(["language", "clarity", "logic", "factual_claims", "mathematics"]),
  location: z.object({ paragraph: z.number().int().positive().optional(), fragment: z.string().min(1).optional() }).refine((v) => v.paragraph || v.fragment, "location needs paragraph or fragment"),
  explanation: z.string().min(1),
  severity: z.enum(["note", "minor", "major", "blocking"]),
  status: z.enum(["open", "accepted", "dismissed", "resolved"]).default("open"),
  confidence: z.number().min(0).max(1).optional(),
});
const reviewSchema = z.object({ summary: z.string().default(""), issues: z.array(issue) });

const directory = entryDirectory(slug);
const metadata = await readMetadata(slug);
if (metadata.status === "published") throw new Error("A published entry cannot be resubmitted in this vertical slice.");
const draft = await readFile(path.join(directory, "draft.md"), "utf8");
if (!draft.trim()) throw new Error("Draft is empty.");

const originalPath = path.join(directory, "original.md");
if (existsSync(originalPath)) await ensureOriginalIntegrity(slug, metadata);
else await writeFile(originalPath, draft, { encoding: "utf8", flag: "wx" });

const parsed = reviewSchema.parse(await readJson(path.resolve(reviewInput)));
const review = {
  schemaVersion: 1,
  entryId: metadata.id,
  reviewedAt: new Date().toISOString(),
  originalSha256: metadata.originalSha256 || sha256(draft),
  summary: parsed.summary,
  issues: parsed.issues.map((item, index) => ({ id: `issue-${index + 1}`, ...item })),
};
await writeJson(path.join(directory, "review.json"), review);

const counts = ["language", "clarity", "logic", "factual_claims", "mathematics"].map((category) => {
  const count = review.issues.filter((item) => item.category === category).length;
  return `- **${category.replace("_", " ")}**: ${count || "no issues"}`;
});
const details = review.issues.map((item) => {
  const place = item.location.fragment ? `“${item.location.fragment}”` : `paragraph ${item.location.paragraph}`;
  return `### ${item.category} · ${item.severity}\n\n${place}\n\n${item.explanation}`;
});
await writeFile(path.join(directory, "review.md"), `# Review\n\n${review.summary}\n\n${counts.join("\n")}\n${details.length ? `\n${details.join("\n\n")}` : ""}\n`, "utf8");
await writeMetadata(slug, { ...metadata, status: "reviewed", submittedAt: new Date().toISOString(), originalSha256: review.originalSha256 });
console.log(`Original snapshot sealed and structured review saved for: ${slug}`);
