import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import { mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { commitPreparation, planPreparation, whitespaceErrors } from "../scripts/lib/publish-preparation.mjs";

const slug = "first-note";
const entry = `content/entries/${slug}`;
const sha256 = (text) => createHash("sha256").update(text, "utf8").digest("hex");
const git = (cwd, ...args) => execFileSync("git", args, { cwd, encoding: "utf8" });
const status = (cwd) => git(cwd, "status", "--porcelain=v1", "--untracked-files=all").split("\n").filter(Boolean).sort();
const committedFiles = (cwd) => git(cwd, "show", "--name-only", "--format=", "HEAD").split("\n").filter(Boolean).sort();

async function write(cwd, file, text) {
  await mkdir(path.dirname(path.join(cwd, file)), { recursive: true });
  await writeFile(path.join(cwd, file), text, "utf8");
}
const json = (value) => `${JSON.stringify(value, null, 2)}\n`;

async function repository() {
  const cwd = await mkdtemp(path.join(os.tmpdir(), "unfolding-prepare-"));
  git(cwd, "init", "-q", "-b", "main");
  git(cwd, "config", "user.email", "test@example.com");
  git(cwd, "config", "user.name", "Test");
  git(cwd, "config", "commit.gpgsign", "false");
  await write(cwd, "README.md", "readme\n");
  await write(cwd, "content/generated.ts", "export const publishedEntries = [];\n");
  await write(cwd, "content/.active-entry.json", json({ slug: "older-note", selectedAt: "2026-10-01T10:00:00+03:00" }));
  git(cwd, "add", "-A");
  git(cwd, "commit", "-q", "-m", "init");
  return cwd;
}

// A reviewed bilingual lifecycle as the entry scripts leave it before publication.
async function writeReviewedEntry(cwd, { ru = "Текст.\n", en = "Text.\n", published = false } = {}) {
  const id = "00000000-0000-4000-8000-000000000001";
  const lifecycle = (locale, text) => ({ status: published ? "published" : "reviewed", publishedAt: published ? "2026-10-02T10:00:00+03:00" : null, originalSha256: sha256(text), title: `Title ${locale}`, tags: [] });
  const metadata = { schemaVersion: 2, id, slug, originalLanguage: "ru", ...lifecycle("ru", ru), translations: { en: { locale: "en", slug, ...lifecycle("en", en) } } };
  await write(cwd, `${entry}/metadata.json`, json(metadata));
  for (const [directory, locale, text] of [[entry, "ru", ru], [`${entry}/translations/en`, "en", en]]) {
    await write(cwd, `${directory}/draft.md`, text);
    await write(cwd, `${directory}/original.md`, text);
    await write(cwd, `${directory}/review.json`, json({ schemaVersion: 2, entryId: id, locale, originalSha256: sha256(text), draftSha256: sha256(text), checks: [], issues: [] }));
    await write(cwd, `${directory}/review.md`, "# Review\n");
    await write(cwd, `${directory}/suggested-tags.json`, json({ tags: ["a"] }));
  }
  await write(cwd, "content/.active-entry.json", json({ slug, selectedAt: "2026-10-03T10:00:00+03:00" }));
}

test("commits exactly the new entry folder and active entry, leaving other changes alone", async () => {
  const cwd = await repository();
  try {
    await write(cwd, "README.md", "edited elsewhere\n");
    await write(cwd, "notes.txt", "staged elsewhere\n");
    git(cwd, "add", "notes.txt");
    await writeReviewedEntry(cwd, { ru: "Строка с переносом  \nследующая строка.\n" });

    const plan = planPreparation({ slug, cwd });
    assert.equal(plan.message, "Prepare first-note bilingual entry");
    assert.deepEqual(plan.files, ["content/.active-entry.json", ...["draft.md", "metadata.json", "original.md", "review.json", "review.md", "suggested-tags.json", "translations/en/draft.md", "translations/en/original.md", "translations/en/review.json", "translations/en/review.md", "translations/en/suggested-tags.json"].map((file) => `${entry}/${file}`)].sort());

    const result = commitPreparation({ plan, slug, cwd });
    assert.deepEqual(committedFiles(cwd), plan.files);
    assert.equal(git(cwd, "log", "-1", "--format=%s").trim(), "Prepare first-note bilingual entry");
    assert.match(result.sha, /^[0-9a-f]{7}$/);
    assert.deepEqual(status(cwd), [" M README.md", "A  notes.txt"]);
    assert.deepEqual(planPreparation({ slug, cwd }).files, []);
  } finally { await rm(cwd, { recursive: true, force: true }); }
});

test("names a preparation of an already published entry as a revision", async () => {
  const cwd = await repository();
  try {
    await writeReviewedEntry(cwd, { published: true });
    git(cwd, "add", "-A");
    git(cwd, "commit", "-q", "-m", "published");
    const revised = "Исправленный текст.\n";
    await write(cwd, `${entry}/draft.md`, revised);
    const reviewPath = path.join(cwd, entry, "review.json");
    const review = JSON.parse(await readFile(reviewPath, "utf8"));
    await writeFile(reviewPath, json({ ...review, draftSha256: sha256(revised) }), "utf8");

    const plan = planPreparation({ slug, cwd });
    assert.equal(plan.message, "Prepare first-note revision");
    assert.deepEqual(plan.files, [`${entry}/draft.md`, `${entry}/review.json`]);
  } finally { await rm(cwd, { recursive: true, force: true }); }
});

for (const [name, change, pattern] of [
  ["a file outside the lifecycle allowlist", (cwd) => write(cwd, `${entry}/notes.txt`, "x\n"), /not a review lifecycle file/],
  ["a published.md change", (cwd) => write(cwd, `${entry}/published.md`, "x\n"), /not a review lifecycle file/],
  ["an unknown translation folder", (cwd) => write(cwd, `${entry}/translations/de/draft.md`, "x\n"), /not a review lifecycle file/],
  ["a draft edited after its review", (cwd) => write(cwd, `${entry}/translations/en/draft.md`, "Edited later.\n"), /changed after its last review/],
  ["a tampered original snapshot", (cwd) => write(cwd, `${entry}/original.md`, "Tampered.\n"), /sealed SHA-256/],
  ["an already modified generated.ts", (cwd) => write(cwd, "content/generated.ts", "changed\n"), /generated\.ts is already modified/],
  ["an active entry that selects another entry", (cwd) => write(cwd, "content/.active-entry.json", json({ slug: "other" })), /selects another entry/],
]) {
  test(`refuses ${name}`, async () => {
    const cwd = await repository();
    try {
      await writeReviewedEntry(cwd);
      await change(cwd);
      const head = git(cwd, "rev-parse", "HEAD");
      assert.throws(() => planPreparation({ slug, cwd }), pattern);
      assert.equal(git(cwd, "rev-parse", "HEAD"), head);
    } finally { await rm(cwd, { recursive: true, force: true }); }
  });
}

test("refuses to change or delete a committed original snapshot", async () => {
  for (const change of [
    (cwd) => write(cwd, `${entry}/original.md`, "Changed.\n"),
    (cwd) => rm(path.join(cwd, entry, "translations/en/original.md")),
  ]) {
    const cwd = await repository();
    try {
      await writeReviewedEntry(cwd);
      git(cwd, "add", "-A");
      git(cwd, "commit", "-q", "-m", "entry");
      await change(cwd);
      assert.throws(() => planPreparation({ slug, cwd }), /immutable review snapshot|deleted/);
    } finally { await rm(cwd, { recursive: true, force: true }); }
  }
});

test("accepts Markdown hard line breaks but still reports other whitespace errors", async () => {
  const cwd = await repository();
  try {
    await write(cwd, "text.md", "Original line.\n");
    git(cwd, "add", "text.md");
    git(cwd, "commit", "-q", "-m", "text");
    await write(cwd, "text.md", "Hard break  \nnext line\n");
    await write(cwd, "content/generated.ts", "export const value = 1;  \n");
    assert.deepEqual(whitespaceErrors({ files: ["text.md"], cwd }), []);
    assert.equal(whitespaceErrors({ files: ["content/generated.ts"], cwd }).length, 1);

    await write(cwd, "notes.md", ["two  ", "one ", "three   ", "tab\t", "  ", "two again  ", "", ""].join("\n"));
    git(cwd, "add", "notes.md");
    const errors = whitespaceErrors({ files: ["notes.md"], cached: true, cwd });
    assert.deepEqual(errors.map((error) => error.split("\n")[0]), ["notes.md:2: trailing whitespace.", "notes.md:3: trailing whitespace.", "notes.md:4: trailing whitespace.", "notes.md:5: trailing whitespace.", "notes.md:7: new blank line at EOF."]);
  } finally { await rm(cwd, { recursive: true, force: true }); }
});

test("refuses a single trailing space in Markdown during preparation", async () => {
  const cwd = await repository();
  try {
    const ru = "Строка с лишним пробелом \nследующая строка.\n";
    await writeReviewedEntry(cwd, { ru });
    const plan = planPreparation({ slug, cwd });
    const head = git(cwd, "rev-parse", "HEAD");
    assert.throws(() => commitPreparation({ plan, slug, cwd }), /first-note\/draft\.md:1: trailing whitespace/);
    assert.equal(git(cwd, "rev-parse", "HEAD"), head);
    assert.equal(git(cwd, "diff", "--cached", "--name-only"), "");
  } finally { await rm(cwd, { recursive: true, force: true }); }
});

test("unstages its files and creates no commit when the whitespace check fails", async () => {
  const cwd = await repository();
  try {
    await writeReviewedEntry(cwd);
    await write(cwd, `${entry}/suggested-tags.json`, "{ \"tags\": [] }   \n");
    const plan = planPreparation({ slug, cwd });
    const head = git(cwd, "rev-parse", "HEAD");
    assert.throws(() => commitPreparation({ plan, slug, cwd }), /Whitespace errors/);
    assert.equal(git(cwd, "rev-parse", "HEAD"), head);
    assert.equal(git(cwd, "diff", "--cached", "--name-only"), "");
  } finally { await rm(cwd, { recursive: true, force: true }); }
});
