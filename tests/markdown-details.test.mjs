import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { runInNewContext } from "node:vm";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import ReactMarkdown from "react-markdown";
import rehypeKatex from "rehype-katex";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import { journalPreview, splitMarkdownBlocks } from "../app/lib/entry-display.mjs";
import { remarkDetails, withoutDetailsBlocks } from "../app/lib/markdown-details.mjs";
import { printDetailsBoot } from "../app/lib/print-details.mjs";

// The same plugin list as app/components/MarkdownContent.tsx (asserted below).
function render(markdown) {
  return renderToStaticMarkup(createElement(ReactMarkdown, { remarkPlugins: [remarkGfm, remarkMath, remarkDetails], rehypePlugins: [rehypeKatex] }, markdown));
}

test("renders the research-edition collapsible block with Markdown inside", () => {
  const html = render([
    "Text before.",
    "<details>\n<summary>Расширенный комментарий</summary>",
    "- Члены: `atha | yoga-anuśāsanam`; *курсив*.\n- MW (L 3531): «auspicious and inceptive particle».",
    "</details>",
    "Text after.",
  ].join("\n\n"));
  assert.match(html, /<p>Text before\.<\/p>\s*<details><summary>Расширенный комментарий<\/summary>\s*<ul>\s*<li>Члены: <code>atha \| yoga-anuśāsanam<\/code>; <em>курсив<\/em>\.<\/li>/);
  assert.match(html, /auspicious and inceptive particle»\.<\/li>\s*<\/ul>\s*<\/details>\s*<p>Text after\.<\/p>/);
  assert.doesNotMatch(html, /&lt;\/?(?:details|summary)/);
});

test("supports open blocks, a separate summary, nesting and math inside", () => {
  const html = render([
    "<details open>",
    "<summary>Outer</summary>",
    "$$\nx^2 + y^2\n$$",
    "<details>\n<summary>Inner</summary>",
    "Inner text.",
    "</details>",
    "</details>",
  ].join("\n\n"));
  assert.match(html, /^<details open=""><summary>Outer<\/summary>/);
  assert.match(html, /<details open="">[\s\S]*class="katex-display"[\s\S]*<details><summary>Inner<\/summary>\s*<p>Inner text\.<\/p>\s*<\/details>\s*<\/details>$/);
});

test("keeps every other raw HTML form literal", () => {
  const cases = [
    "<details onclick=\"alert(1)\">\n<summary>Attribute</summary>\n\nBody\n\n</details>",
    "<details>\n<summary>Never closed</summary>\n\nBody",
    "<details>\n<summary><em>Marked up</em></summary>\n\nBody\n\n</details>",
    "Inline <details> inside </details> a paragraph.",
    "</details>",
    "<script>alert(1)</script>",
  ];
  for (const markdown of cases) {
    const html = render(markdown);
    assert.doesNotMatch(html, /<(?:details|summary|script)[\s>]/, markdown);
    assert.match(html, /&lt;(?:details|\/details|script)/, markdown);
  }
});

test("keeps a collapsible block whole in the journal preview", () => {
  const markdown = [
    "Intro paragraph.",
    "<details>\n<summary>Notes</summary>",
    "- one\n- two",
    "Paragraph inside.",
    "</details>",
    "After the block.",
  ].join("\n\n");
  const blocks = splitMarkdownBlocks(markdown);
  assert.equal(blocks.length, 3);
  assert.match(blocks[1], /^<details>[\s\S]*Paragraph inside\.\n\n<\/details>$/);
  const preview = journalPreview(markdown);
  assert.equal(preview.truncated, true);
  assert.equal(preview.body, blocks.slice(0, 2).join("\n\n"));
});

test("leaves collapsed content out of the excerpt", async () => {
  const markdown = "Visible lead.\n\n<details>\n<summary>Hidden label</summary>\n\nHidden <details open>\n\nnested\n\n</details> text.\n\n</details>\n\nAlso visible.";
  const visible = withoutDetailsBlocks(markdown);
  assert.match(visible, /Visible lead\.[\s\S]*Also visible\./);
  assert.doesNotMatch(visible, /Hidden|nested|details/);
  const syncScript = await readFile(new URL("../scripts/sync-content.mjs", import.meta.url), "utf8");
  assert.match(syncScript, /withoutDetailsBlocks\(body\)/);
});

test("opens every collapsed block for printing and restores it afterwards", () => {
  const handlers = {};
  const blocks = [{ open: false }, { open: true }, { open: false }];
  runInNewContext(printDetailsBoot, {
    addEventListener: (type, handler) => { handlers[type] = handler; },
    document: { querySelectorAll: (selector) => (selector === "details:not([open])" ? blocks.filter((block) => !block.open) : []) },
  });
  handlers.beforeprint();
  assert.deepEqual(blocks.map((block) => block.open), [true, true, true]);
  handlers.afterprint();
  assert.deepEqual(blocks.map((block) => block.open), [false, true, false]);
});

test("wires the plugin into the site renderer and styles the research apparatus", async () => {
  const [component, layout, css] = await Promise.all([
    readFile(new URL("../app/components/MarkdownContent.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/layout.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/globals.css", import.meta.url), "utf8"),
  ]);
  assert.match(component, /remarkPlugins=\{\[remarkGfm, remarkMath, remarkDetails\]\}/);
  assert.match(layout, /__html: printDetailsBoot/);
  assert.match(css, /\.prose summary\s*\{[^}]*list-style:\s*none[^}]*cursor:\s*pointer/);
  assert.match(css, /\.prose details\[open\] > summary::before\s*\{[^}]*rotate\(90deg\)/);
  assert.match(css, /\.prose details ul\s*\{\s*list-style:\s*disc;?\s*\}/);
  assert.match(css, /\.prose details ol\s*\{\s*list-style:\s*decimal;?\s*\}/);
  assert.match(css, /@media print\s*\{[^}]*\.prose details::details-content\s*\{\s*content-visibility:\s*visible;?\s*\}/);
  // Research typography applies only to entries with collapsible apparatus.
  assert.match(css, /\.entry-content:has\(> details\) blockquote\s*\{[^}]*font-style:\s*normal/);
  assert.match(css, /\.entry-content:has\(> details\) blockquote \+ p\s*\{/);
  assert.match(css, /\.entry-content:has\(> details\) h2 \+ blockquote\s*\{/);
  assert.match(css, /\.prose blockquote\s*\{[^}]*font-style:\s*italic/);
});
