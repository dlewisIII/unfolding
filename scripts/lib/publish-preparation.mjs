import { spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";

const activeEntryFile = "content/.active-entry.json";
const generatedFile = "content/generated.ts";
// Files a review lifecycle may leave uncommitted before publication. published.md is
// absent on purpose: only the publish commit may create or change it.
const lifecycleFiles = new Set(["draft.md", "original.md", "review.json", "review.md", "suggested-tags.json", "suggested-title.json"]);

function git(cwd, args) {
  const result = spawnSync("git", args, { cwd, encoding: "utf8" });
  if (result.status !== 0) throw new Error((result.stderr || result.stdout || `git ${args[0]} failed`).trim());
  return result.stdout;
}
function sha256(text) { return createHash("sha256").update(text, "utf8").digest("hex"); }
function readText(cwd, file) {
  if (!existsSync(path.join(cwd, file))) throw new Error(`Missing ${file}.`);
  return readFileSync(path.join(cwd, file), "utf8");
}
function readJson(cwd, file) {
  try { return JSON.parse(readText(cwd, file)); } catch (error) { throw new Error(`Cannot read ${file}: ${error.message}`); }
}
function entryRoot(slug) {
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) throw new Error(`Invalid entry slug: ${slug}`);
  return `content/entries/${slug}`;
}

// Porcelain v1 records with every untracked file listed individually, so a new entry
// folder is inspected file by file instead of as one opaque directory.
function statusRecords(cwd, pathspecs) {
  const fields = git(cwd, ["status", "--porcelain=v1", "-z", "--untracked-files=all", "--", ...pathspecs]).split("\0").filter(Boolean);
  const records = [];
  for (let index = 0; index < fields.length; index += 1) {
    const status = fields[index].slice(0, 2);
    records.push({ status, file: fields[index].slice(3) });
    if (status.includes("R") || status.includes("C")) index += 1;
  }
  return records;
}
export function stagedPaths(cwd = process.cwd()) {
  return new Set(git(cwd, ["diff", "--cached", "--name-only", "-z"]).split("\0").filter(Boolean));
}

/**
 * `git diff --check` problems for the given files, except exactly two spaces after text
 * at the end of a Markdown line: that is the hard line break syntax, not an error.
 */
export function whitespaceErrors({ files, cached = false, cwd = process.cwd() }) {
  if (!files.length) return [];
  const result = spawnSync("git", ["diff", ...(cached ? ["--cached"] : []), "--check", "--no-color", "--", ...files], { cwd, encoding: "utf8" });
  if (result.status === 0) return [];
  if (result.status !== 2) throw new Error((result.stderr || result.stdout || "git diff --check failed").trim());
  const lines = result.stdout.split("\n");
  const errors = [];
  for (let index = 0; index < lines.length; index += 1) {
    const header = /^(.+):\d+: (.+)\.$/.exec(lines[index]);
    if (!header) continue;
    const content = lines[index + 1]?.startsWith("+") ? lines[index + 1].slice(1) : null;
    const hardBreak = header[1].endsWith(".md") && header[2] === "trailing whitespace" && content !== null && /\S {2}$/.test(content);
    if (!hardBreak) errors.push(content === null ? lines[index] : `${lines[index]}\n+${content}`);
  }
  return errors;
}

function assertRecord({ status, file }, slug, metadata) {
  if (/[DRCUT]/.test(status)) throw new Error(`${file} is deleted, renamed, copied, type-changed or conflicted (${status.trim()}); it cannot be prepared automatically.`);
  if (file === activeEntryFile) return;
  const match = /^(?:translations\/([a-z]+)\/)?([^/]+)$/.exec(file.slice(entryRoot(slug).length + 1));
  const [, locale, name] = match ?? [];
  const allowed = match && (locale
    ? locale !== metadata.originalLanguage && Boolean(metadata.translations?.[locale]) && lifecycleFiles.has(name)
    : name === "metadata.json" || lifecycleFiles.has(name));
  if (!allowed) throw new Error(`${file} is not a review lifecycle file of ${slug}; refusing to include it in the preparation commit.`);
  if (name === "original.md" && status !== "??" && status[0] !== "A") throw new Error(`${file} is an immutable review snapshot and must not change once committed.`);
}

function assertReviewedLifecycles(cwd, slug, metadata, source) {
  for (const locale of [metadata.originalLanguage, ...Object.keys(metadata.translations ?? {})]) {
    const lifecycle = locale === metadata.originalLanguage ? metadata : metadata.translations[locale];
    const directory = locale === metadata.originalLanguage ? entryRoot(slug) : `${entryRoot(slug)}/translations/${locale}`;
    if (!lifecycle.originalSha256 || sha256(readText(cwd, `${directory}/original.md`)) !== lifecycle.originalSha256) throw new Error(`${locale}: original.md does not match its sealed SHA-256.`);
    const review = readJson(cwd, `${directory}/review.json`);
    if (review.entryId !== metadata.id || review.locale !== locale || review.originalSha256 !== lifecycle.originalSha256) throw new Error(`${locale}: review.json does not belong to this entry, language and sealed original.`);
    if (source === "--from-draft" && review.draftSha256 !== sha256(readText(cwd, `${directory}/draft.md`))) throw new Error(`${locale}: draft.md changed after its last review; review it again before publishing.`);
  }
}

/**
 * Lists the active entry's uncommitted lifecycle files that must be committed before
 * Fast Publish can isolate its own changes. An empty list means nothing to prepare.
 */
export function planPreparation({ slug, source = "--from-draft", cwd = process.cwd() }) {
  const root = entryRoot(slug);
  const records = statusRecords(cwd, [root, activeEntryFile]);
  if (!records.some((record) => record.file !== activeEntryFile)) return { files: [], message: null };
  if (statusRecords(cwd, [generatedFile]).length) throw new Error(`${generatedFile} is already modified; a preparation commit cannot separate it from this publication.`);
  const metadata = readJson(cwd, `${root}/metadata.json`);
  if (metadata.slug !== slug) throw new Error(`${root}/metadata.json describes ${metadata.slug}, not ${slug}.`);
  for (const record of records) assertRecord(record, slug, metadata);
  if (records.some((record) => record.file === activeEntryFile) && readJson(cwd, activeEntryFile).slug !== slug) throw new Error(`${activeEntryFile} selects another entry.`);
  assertReviewedLifecycles(cwd, slug, metadata, source);
  const revision = [metadata, ...Object.values(metadata.translations ?? {})].some((lifecycle) => lifecycle.publishedAt);
  return { files: records.map((record) => record.file).sort(), message: revision ? `Prepare ${slug} revision` : `Prepare ${slug} bilingual entry` };
}

/** Commits exactly the planned files and verifies that nothing else entered the commit. */
export function commitPreparation({ plan, slug, cwd = process.cwd() }) {
  const before = stagedPaths(cwd);
  const planned = new Set(plan.files);
  const unstage = () => {
    const ours = plan.files.filter((file) => !before.has(file));
    if (ours.length) git(cwd, ["reset", "-q", "--", ...ours]);
  };
  git(cwd, ["add", "--", ...plan.files]);
  const staged = stagedPaths(cwd);
  const missing = plan.files.filter((file) => !staged.has(file));
  const unexpected = [...staged].filter((file) => !before.has(file) && !planned.has(file));
  if (missing.length || unexpected.length) {
    unstage();
    throw new Error(`Staged paths do not match the preparation plan.${missing.length ? `\nmissing: ${missing.join(", ")}` : ""}${unexpected.length ? `\nunexpected: ${unexpected.join(", ")}` : ""}`);
  }
  const whitespace = whitespaceErrors({ files: plan.files, cached: true, cwd });
  if (whitespace.length) {
    unstage();
    throw new Error(`Whitespace errors in the preparation scope:\n${whitespace.join("\n")}`);
  }
  git(cwd, ["commit", "-q", "-m", plan.message, "--", ...plan.files]);
  const sha = git(cwd, ["rev-parse", "--short=7", "HEAD"]).trim();
  const committed = git(cwd, ["show", "--name-only", "--format=", "HEAD"]).split("\n").filter(Boolean).sort();
  if (JSON.stringify(committed) !== JSON.stringify(plan.files)) throw new Error(`Preparation commit ${sha} does not contain exactly the planned files: ${committed.join(", ")}`);
  const left = statusRecords(cwd, [entryRoot(slug), activeEntryFile]);
  if (left.length) throw new Error(`Preparation commit ${sha} left uncommitted entry changes: ${left.map((record) => record.file).join(", ")}`);
  return { sha, files: plan.files };
}
