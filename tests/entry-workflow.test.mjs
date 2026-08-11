import assert from "node:assert/strict";
import { execFile } from "node:child_process";
import { mkdtemp, readFile, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { promisify } from "node:util";
import test from "node:test";

const run = promisify(execFile);
const project = process.cwd();
const script = (name) => path.join(project, "scripts", name);
const review = {
  summary: "No substantial issues.",
  checks: [
    { category: "language", status: "reviewed", explanation: "Checked." },
    { category: "clarity", status: "reviewed", explanation: "Checked." },
    { category: "logic", status: "reviewed", explanation: "Checked." },
    { category: "factual_claims", status: "not_applicable", explanation: "No factual claims." },
    { category: "mathematics", status: "not_applicable", explanation: "No mathematics." }
  ],
  issues: []
};

test("keeps one root identity and independent immutable language lifecycles", async () => {
  const workspace = await mkdtemp(path.join(os.tmpdir(), "unfolding-workflow-"));
  const ruSource = path.join(workspace, "ru.txt");
  const enSource = path.join(workspace, "en.txt");
  const revisedRu = path.join(workspace, "ru-revised.txt");
  const reviewInput = path.join(workspace, "review-input.json");
  const tagsInput = path.join(workspace, "tags-input.json");
  const titleInput = path.join(workspace, "title-input.json");
  const linksInput = path.join(workspace, "links-input.json");
  await writeFile(ruSource, "Исходный текст.\n", "utf8");
  await writeFile(enSource, "Original translation.\n", "utf8");
  await writeFile(revisedRu, "Исправленный автором текст.\n", "utf8");
  await writeFile(reviewInput, JSON.stringify(review), "utf8");
  await writeFile(tagsInput, JSON.stringify({ tags: ["experience"], rationale: "From the text." }), "utf8");
  await writeFile(titleInput, JSON.stringify({ source: "generated", options: [{ title: "A possible title", rationale: "Concise." }] }), "utf8");
  await writeFile(linksInput, JSON.stringify({ externalLinks: [{ type: "github", url: "https://github.com/example/repository/blob/main/proof.md", label: "Repository proof" }] }), "utf8");

  await run(process.execPath, [script("create-draft.mjs"), "ru", "first-note", "--from", ruSource], { cwd: workspace });
  const root = JSON.parse(await readFile(path.join(workspace, "content/entries/first-note/metadata.json"), "utf8"));
  assert.equal(root.originalLanguage, "ru");
  assert.equal(root.title, null);
  assert.deepEqual(root.externalLinks, []);
  assert.equal(await readFile(path.join(workspace, "content/entries/first-note/draft.md"), "utf8"), "Исходный текст.\n");

  await run(process.execPath, [script("submit-review.mjs"), "first-note", "ru", reviewInput, tagsInput], { cwd: workspace });
  const sealedRu = await readFile(path.join(workspace, "content/entries/first-note/original.md"), "utf8");
  assert.equal(sealedRu, "Исходный текст.\n");
  assert.equal((JSON.parse(await readFile(path.join(workspace, "content/entries/first-note/review.json"), "utf8"))).checks.length, 5);
  assert.equal((JSON.parse(await readFile(path.join(workspace, "content/entries/first-note/suggested-tags.json"), "utf8"))).tags[0], "experience");
  assert.equal(root.tags.length, 0);
  await run(process.execPath, [script("suggest-title.mjs"), "--active", "ru", titleInput], { cwd: workspace });
  assert.equal((JSON.parse(await readFile(path.join(workspace, "content/entries/first-note/suggested-title.json"), "utf8"))).options[0].title, "A possible title");
  assert.equal((JSON.parse(await readFile(path.join(workspace, "content/entries/first-note/metadata.json"), "utf8"))).title, null);
  await run(process.execPath, [script("set-external-links.mjs"), "--active", "--from", linksInput], { cwd: workspace });
  assert.equal((JSON.parse(await readFile(path.join(workspace, "content/entries/first-note/metadata.json"), "utf8"))).externalLinks[0].url, "https://github.com/example/repository/blob/main/proof.md");
  assert.equal(await readFile(path.join(workspace, "content/entries/first-note/draft.md"), "utf8"), "Исходный текст.\n");

  await run(process.execPath, [script("update-draft.mjs"), "--active", "ru", "--from", revisedRu], { cwd: workspace });
  await run(process.execPath, [script("submit-review.mjs"), "--active", "ru", reviewInput, tagsInput], { cwd: workspace });
  assert.equal(await readFile(path.join(workspace, "content/entries/first-note/original.md"), "utf8"), sealedRu);

  await run(process.execPath, [script("create-translation.mjs"), "--active", "en", "--from", enSource, "--method", "author"], { cwd: workspace });
  const translated = JSON.parse(await readFile(path.join(workspace, "content/entries/first-note/metadata.json"), "utf8"));
  assert.equal(translated.id, root.id);
  assert.equal(translated.createdAt, root.createdAt);
  assert.equal(translated.originalLanguage, "ru");
  assert.ok(translated.translations.en.translatedAt);
  assert.equal(translated.translations.en.translationMethod, "author");
  assert.equal(translated.translations.en.status, "draft");
  assert.rejects(readFile(path.join(workspace, "content/entries/first-note/translations/en/published.md"), "utf8"));

  await run(process.execPath, [script("submit-review.mjs"), "--active", "en", reviewInput, tagsInput], { cwd: workspace });
  assert.equal(await readFile(path.join(workspace, "content/entries/first-note/translations/en/original.md"), "utf8"), "Original translation.\n");
  assert.rejects(readFile(path.join(workspace, "content/entries/first-note/translations/en/published.md"), "utf8"));
});
