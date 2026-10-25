/**
 * Collapsible blocks in authorial Markdown.
 *
 * react-markdown deliberately renders raw HTML as literal text. This module
 * recognizes one narrow form, the one already used in research editions:
 *
 *   <details>
 *   <summary>Plain-text label</summary>
 *
 *   …ordinary Markdown…
 *
 *   </details>
 *
 * The opening and closing tags must stand as their own HTML blocks (blank
 * lines around the Markdown content), the only allowed attribute is `open`,
 * and the summary is plain text. Anything else, including unmatched tags,
 * stays literal so the author can see and correct it.
 */

const OPENING = /^<details(\s+open)?\s*>\s*(?:<summary>([^<]*)<\/summary>)?$/i;
const SUMMARY = /^<summary>([^<]*)<\/summary>$/i;
const CLOSING = /^<\/details>$/i;
const OPENING_TAG = /<details(?:\s+open)?\s*>/gi;
const CLOSING_TAG = /<\/details>/gi;

function htmlValue(node) {
  return node?.type === "html" ? node.value.trim() : null;
}

function pairDetails(children) {
  const pairs = new Map();
  const open = [];
  children.forEach((node, index) => {
    const value = htmlValue(node);
    if (value === null) return;
    if (OPENING.test(value)) open.push(index);
    else if (CLOSING.test(value) && open.length) pairs.set(open.pop(), index);
  });
  return pairs;
}

function buildDetails(children, start, end, pairs) {
  const output = [];
  for (let index = start; index < end; index += 1) {
    const node = children[index];
    const close = pairs.get(index);
    if (close === undefined) {
      output.push(node);
      continue;
    }
    const [, open, inlineSummary] = htmlValue(node).match(OPENING);
    let contentStart = index + 1;
    let summary = inlineSummary;
    const separateSummary = summary === undefined && contentStart < close ? htmlValue(children[contentStart])?.match(SUMMARY) : null;
    if (separateSummary) {
      summary = separateSummary[1];
      contentStart += 1;
    }
    const details = {
      type: "details",
      data: { hName: "details", hProperties: open ? { open: true } : {} },
      children: [],
      position: node.position,
    };
    if (summary !== undefined) {
      details.children.push({ type: "detailsSummary", data: { hName: "summary" }, children: [{ type: "text", value: summary.trim() }] });
    }
    details.children.push(...buildDetails(children, contentStart, close, pairs));
    output.push(details);
    index = close;
  }
  return output;
}

// Inline HTML inside a paragraph never becomes a block element.
const FLOW_PARENTS = new Set(["root", "blockquote", "listItem", "footnoteDefinition"]);

function transform(parent) {
  if (!Array.isArray(parent.children)) return;
  for (const child of parent.children) transform(child);
  if (!FLOW_PARENTS.has(parent.type)) return;
  const pairs = pairDetails(parent.children);
  if (pairs.size) parent.children = buildDetails(parent.children, 0, parent.children.length, pairs);
}

export function remarkDetails() {
  return transform;
}

/** Net change in <details> nesting on one Markdown line. */
export function detailsDepthChange(line) {
  return (line.match(OPENING_TAG)?.length || 0) - (line.match(CLOSING_TAG)?.length || 0);
}

/** Markdown without collapsed blocks, for excerpts that describe the visible text. */
export function withoutDetailsBlocks(markdown) {
  const innermost = /<details(?:\s+open)?\s*>(?:(?!<details(?:\s+open)?\s*>)[\s\S])*?<\/details>/gi;
  let current = markdown;
  for (let previous = null; previous !== current;) {
    previous = current;
    current = current.replace(innermost, "");
  }
  return current;
}
