import assert from "node:assert/strict";
import test from "node:test";
import { entryDisplayTitle, formatEntryDate, journalPreview, splitMarkdownBlocks, withoutDuplicateLeadingH1, withoutDuplicateLeadingTitle } from "../app/lib/entry-display.mjs";

test("formats the stored local calendar time without timezone conversion", () => {
  assert.equal(formatEntryDate("2026-08-11T02:58:41+03:00", "ru"), "11 августа 2026 · 02:58");
  assert.equal(formatEntryDate("2026-08-11T02:58:41+03:00", "en"), "11 August 2026 · 02:58");
  assert.equal(formatEntryDate("2026-01-01T00:04:00+14:00", "en"), "1 January 2026 · 00:04");
  assert.equal(formatEntryDate("2026-12-31T23:58:00-12:00", "ru"), "31 декабря 2026 · 23:58");
});

test("truncates only between complete markdown blocks", () => {
  const markdown = [
    `First paragraph. ${"A".repeat(180)}`,
    "![A diagram](diagram.png)",
    "$$\nx^2 + y^2 = z^2\n$$",
    "```js\nconst answer = 42;\n```",
    `Second paragraph. ${"B".repeat(180)}`,
    `Third paragraph. ${"C".repeat(180)}`,
    "Fourth paragraph should remain outside the preview.",
  ].join("\n\n");
  const blocks = splitMarkdownBlocks(markdown);
  assert.equal(blocks.length, 7);
  assert.match(blocks[1], /^!\[/);
  assert.match(blocks[2], /^\$\$[\s\S]*\$\$$/);
  assert.match(blocks[3], /^```[\s\S]*```$/);
  const preview = journalPreview(markdown);
  assert.equal(preview.truncated, true);
  assert.equal(preview.body, blocks[0]);
  assert.doesNotMatch(preview.body, /diagram\.png|x\^2 \+ y\^2|const answer = 42|Fourth paragraph/);
});

test("keeps the complete initial mathematical statement and stops before Strategy", () => {
  const markdown = [
    "## Statement",
    "Suppose that",
    "1. $P \\rightarrow Q$,\n2. $Q \\rightarrow R$.",
    "Then",
    "$$\nP \\rightarrow R.\n$$",
    "## Strategy",
    "Assume P and derive R.",
    "## Proof",
    "Assume $P$.",
  ].join("\n\n");
  const preview = journalPreview(markdown);
  assert.equal(preview.truncated, true);
  assert.match(preview.body, /^## Statement[\s\S]*1\. \$P[\s\S]*P \\rightarrow R\.\n\$\$$/);
  assert.doesNotMatch(preview.body, /## Strategy|## Proof/);
});

test("keeps a list together even when its items contain blank lines", () => {
  const blocks = splitMarkdownBlocks("Before.\n\n1. First item.\n\n2. Second item.\n\nAfter.");
  assert.equal(blocks.length, 3);
  assert.match(blocks[1], /1\. First item\.\n\n2\. Second item\./);
});

test("includes a second paragraph when the opening paragraph is short", () => {
  const markdown = [
    "A sleepless summer night.",
    "At daybreak, I opened the window. The freshness and coolness of the motionless air. Tree branches stood frozen as if in a still frame.",
    "This third paragraph should remain outside the preview.",
  ].join("\n\n");
  const preview = journalPreview(markdown);
  assert.equal(preview.truncated, true);
  assert.match(preview.body, /^A sleepless summer night\.\n\nAt daybreak/);
  assert.doesNotMatch(preview.body, /third paragraph/);
});

test("uses a leading author H1 as a visual fallback and suppresses only a matching duplicate", () => {
  const markdown = "# Implication Chain\n\n## Statement\n\nSuppose that P.";
  assert.equal(entryDisplayTitle(null, markdown), "Implication Chain");
  assert.equal(entryDisplayTitle("Approved title", markdown), "Approved title");
  assert.equal(withoutDuplicateLeadingH1(markdown, "Implication Chain"), "## Statement\n\nSuppose that P.");
  assert.equal(withoutDuplicateLeadingH1(markdown, "Different title"), markdown);
});

test("suppresses a matching first plain-text title paragraph without changing other body text", () => {
  const markdown = "What if the magic of dawn could be carried through the day?\n\nA sleepless night.";
  assert.equal(withoutDuplicateLeadingTitle(markdown, "What if the magic of dawn could be carried through the day?"), "A sleepless night.");
  assert.equal(withoutDuplicateLeadingTitle(markdown, "The Magic of Dawn"), markdown);
});

test("shows short entries in full", () => {
  const markdown = "A short entry that fits in the journal feed.";
  assert.deepEqual(journalPreview(markdown), { body: markdown, truncated: false });
});
