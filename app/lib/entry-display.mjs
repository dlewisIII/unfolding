const MAX_PREVIEW_BLOCKS = 3;
const MAX_PREVIEW_CHARACTERS = 700;

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
  return blocks;
}

export function journalPreview(markdown) {
  const blocks = splitMarkdownBlocks(markdown);
  if (blocks.length <= MAX_PREVIEW_BLOCKS && markdown.length <= MAX_PREVIEW_CHARACTERS) return { body: markdown, truncated: false };
  const selected = [];
  let characters = 0;
  for (const block of blocks) {
    if (selected.length >= MAX_PREVIEW_BLOCKS) break;
    const projected = characters + block.length + (selected.length ? 2 : 0);
    if (selected.length && projected > MAX_PREVIEW_CHARACTERS) break;
    selected.push(block);
    characters = projected;
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
