import { execFile } from "node:child_process";
import { readdir, readFile, stat } from "node:fs/promises";
import path from "node:path";
import { promisify } from "node:util";
import { pathToFileURL } from "node:url";
import katex from "katex";

const execFileAsync = promisify(execFile);
const entryMarkdownPattern = /^content\/entries\/.+\.md$/;
const mathPipelineFiles = new Set([
  "app/components/MarkdownContent.tsx",
  "app/globals.css",
  "package.json",
  "pnpm-lock.yaml",
  "tests/rendered-html.test.mjs",
]);

export function extractMath(source) {
  const expressions = [];
  const withoutDisplay = source
    .replace(/\$\$([\s\S]*?)\$\$/g, (_, expression) => {
      expressions.push({ expression, displayMode: true });
      return "";
    })
    .replace(/\\\[([\s\S]*?)\\\]/g, (_, expression) => {
      expressions.push({ expression, displayMode: true });
      return "";
    });

  for (const match of withoutDisplay.matchAll(/(?<!\\)\$([^\n$]+?)(?<!\\)\$/g)) {
    expressions.push({ expression: match[1], displayMode: false });
  }

  return expressions;
}

export function validateMath(source, filename = "content") {
  const expressions = extractMath(source);
  for (const { expression, displayMode } of expressions) {
    try {
      katex.renderToString(expression.trim(), { displayMode, throwOnError: true });
    } catch (error) {
      throw new Error(`${filename}: ${error.message}`);
    }
  }
  return expressions.length;
}

async function walkMarkdown(directory) {
  const files = [];
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const target = path.join(directory, entry.name);
    if (entry.isDirectory()) files.push(...await walkMarkdown(target));
    else if (entry.isFile() && target.endsWith(".md")) files.push(target);
  }
  return files;
}

async function gitLines(args) {
  const { stdout } = await execFileAsync("git", args, { encoding: "utf8" });
  return stdout.split("\n").map((line) => line.trim()).filter(Boolean);
}

async function changedFiles() {
  const [tracked, untracked] = await Promise.all([
    gitLines(["diff", "--name-only", "--diff-filter=ACMR", "HEAD"]),
    gitLines(["ls-files", "--others", "--exclude-standard"]),
  ]);
  return [...new Set([...tracked, ...untracked])];
}

async function existingEntryMarkdown(files) {
  const selected = [];
  for (const file of files) {
    const normalized = file.split(path.sep).join("/");
    if (!entryMarkdownPattern.test(normalized)) continue;
    try {
      if ((await stat(file)).isFile()) selected.push(file);
    } catch {
      // Deleted files do not need rendering validation.
    }
  }
  return selected;
}

export async function runValidation({ all = false, files = [] } = {}) {
  const changes = files.length ? files : await changedFiles();
  const pipelineChanged = changes.some((file) => mathPipelineFiles.has(file.split(path.sep).join("/")));
  const full = all || pipelineChanged;
  const candidates = full
    ? await walkMarkdown(path.join("content", "entries"))
    : await existingEntryMarkdown(changes);

  let expressions = 0;
  let validatedFiles = 0;
  for (const file of candidates.sort()) {
    const source = await readFile(file, "utf8");
    const count = extractMath(source).length;
    if (!count) continue;
    expressions += validateMath(source, file);
    validatedFiles += 1;
  }

  const scope = full ? "full-site" : "targeted";
  console.log(`KaTeX ${scope} validation passed: ${validatedFiles} file(s), ${expressions} expression(s).`);
  return { scope, validatedFiles, expressions };
}

async function main() {
  const args = process.argv.slice(2);
  const all = args.includes("--all");
  const files = args.filter((argument) => argument !== "--all");
  await runValidation({ all, files });
}

if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) {
  await main();
}
