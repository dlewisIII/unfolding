import assert from "node:assert/strict";
import test from "node:test";
import { formatEntryDate, journalPreview, splitMarkdownBlocks } from "../app/lib/entry-display.mjs";

test("formats the stored local calendar time without timezone conversion", () => {
  assert.equal(formatEntryDate("2026-08-11T02:58:41+03:00", "ru"), "11 августа 2026 · 02:58");
  assert.equal(formatEntryDate("2026-08-11T02:58:41+03:00", "en"), "11 August 2026 · 02:58");
  assert.equal(formatEntryDate("2026-01-01T00:04:00+14:00", "en"), "1 January 2026 · 00:04");
  assert.equal(formatEntryDate("2026-12-31T23:58:00-12:00", "ru"), "31 декабря 2026 · 23:58");
});

test("truncates only between complete markdown blocks", () => {
  const markdown = [
    "First paragraph.",
    "![A diagram](diagram.png)",
    "$$\nx^2 + y^2 = z^2\n$$",
    "```js\nconst answer = 42;\n```",
  ].join("\n\n");
  const blocks = splitMarkdownBlocks(markdown);
  assert.equal(blocks.length, 4);
  assert.match(blocks[1], /^!\[/);
  assert.match(blocks[2], /^\$\$[\s\S]*\$\$$/);
  assert.match(blocks[3], /^```[\s\S]*```$/);
  const preview = journalPreview(markdown);
  assert.equal(preview.truncated, true);
  assert.equal(preview.body, blocks.slice(0, 3).join("\n\n"));
});

test("shows short entries in full", () => {
  const markdown = "A short entry that fits in the journal feed.";
  assert.deepEqual(journalPreview(markdown), { body: markdown, truncated: false });
});
