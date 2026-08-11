const MAX_PREVIEW_MEANINGFUL_BLOCKS = 2;

function isListBlock(block) {
  return /^\s*(?:[-+*]|\d+[.)])\s+/m.test(block);
}

function isHeadingBlock(block) {
  return /^\s*#{1,6}\s+/.test(block);
}

function isMajorSection(block) {
  return /^\s*##(?!#)\s+/.test(block);
}

function normalizeTitle(value) {
  return value.normalize("NFC").replace(/\s+/g, " ").trim();
}

export function leadingMarkdownH1(markdown) {
  const match = markdown.match(/^\uFEFF?\s*#(?!#)\s+(.+?)\s*(?:\n|$)/);
  return match ? normalizeTitle(match[1]) : null;
}

export function entryDisplayTitle(metadataTitle, markdown) {
  return metadataTitle || leadingMarkdownH1(markdown);
}

export function withoutDuplicateLeadingH1(markdown, displayTitle) {
  if (!displayTitle) return markdown;
  const match = markdown.match(/^(\uFEFF?\s*#(?!#)\s+(.+?)\s*(?:\n|$))([\s\S]*)$/);
  if (!match || normalizeTitle(match[2]) !== normalizeTitle(displayTitle)) return markdown;
  return match[3].replace(/^\n+/, "");
}

export function splitMarkdownBlocks(markdown) {
  const blocks = [];
  let current = [];
  let fence = null;
  let displayMath = false;
  const flush = () => {
    if (current.length) blocks.push(current.join("\n").trimEnd());
    current = [];
  };

  for (const line of markdown.replace(/\r\n?/g, "\n").split("\n")) {
    const trimmed = line.trim();
    if (fence) {
      current.push(line);
      if (trimmed.startsWith(fence)) fence = null;
      continue;
    }
    if (displayMath) {
      current.push(line);
      if (trimmed.endsWith("$$")) displayMath = false;
      continue;
    }
    const fenceMatch = trimmed.match(/^(`{3,}|~{3,})/);
    if (fenceMatch) {
      current.push(line);
      fence = fenceMatch[1][0].repeat(fenceMatch[1].length);
      continue;
    }
    if (trimmed.startsWith("$$")) {
      current.push(line);
      if (!(trimmed.length > 2 && trimmed.endsWith("$$"))) displayMath = true;
      continue;
    }
    if (!trimmed) {
      flush();
      continue;
    }
    current.push(line);
  }
  flush();
  return blocks.reduce((merged, block) => {
    if (merged.length && isListBlock(merged.at(-1)) && isListBlock(block)) merged[merged.length - 1] += `\n\n${block}`;
    else merged.push(block);
    return merged;
  }, []);
}

export function journalPreview(markdown) {
  const blocks = splitMarkdownBlocks(markdown);
  if (!blocks.length) return { body: markdown, truncated: false };

  if (isMajorSection(blocks[0])) {
    const nextSection = blocks.findIndex((block, index) => index > 0 && isMajorSection(block));
    if (nextSection > 0) return { body: blocks.slice(0, nextSection).join("\n\n"), truncated: true };
  }

  const selected = [];
  let meaningfulBlocks = 0;
  for (const block of blocks) {
    if (selected.length && meaningfulBlocks > 0 && isMajorSection(block)) break;
    selected.push(block);
    if (!isHeadingBlock(block)) meaningfulBlocks += 1;
    if (meaningfulBlocks >= MAX_PREVIEW_MEANINGFUL_BLOCKS) break;
  }
  return { body: selected.join("\n\n"), truncated: selected.length < blocks.length };
}

export function formatEntryDate(createdAt, locale) {
  const match = createdAt.match(/^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})/);
  if (!match) throw new Error(`Invalid createdAt: ${createdAt}`);
  const [, year, month, day, hour, minute] = match;
  const calendarDate = new Date(Date.UTC(Number(year), Number(month) - 1, Number(day)));
  const parts = new Intl.DateTimeFormat(locale, { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" }).formatToParts(calendarDate);
  const monthName = parts.find((part) => part.type === "month")?.value;
  return `${Number(day)} ${monthName} ${year} · ${hour}:${minute}`;
}
