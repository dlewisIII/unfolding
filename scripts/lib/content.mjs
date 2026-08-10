import { createHash } from "node:crypto";
import { existsSync } from "node:fs";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

export const root = process.cwd();
export const entriesRoot = path.join(root, "content", "entries");

export function assertSlug(slug) {
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) {
    throw new Error("Slug must contain lowercase Latin letters, numbers, and single hyphens only.");
  }
}

export function entryDirectory(slug) {
  assertSlug(slug);
  return path.join(entriesRoot, slug);
}

export function sha256(text) {
  return createHash("sha256").update(text, "utf8").digest("hex");
}

export async function readJson(file) {
  return JSON.parse(await readFile(file, "utf8"));
}

export async function writeJson(file, value) {
  await writeFile(file, `${JSON.stringify(value, null, 2)}\n`, "utf8");
}

export async function readMetadata(slug) {
  return readJson(path.join(entryDirectory(slug), "metadata.json"));
}

export async function writeMetadata(slug, metadata) {
  await writeJson(path.join(entryDirectory(slug), "metadata.json"), metadata);
}

export async function ensureOriginalIntegrity(slug, metadata) {
  const originalPath = path.join(entryDirectory(slug), "original.md");
  if (!existsSync(originalPath)) throw new Error("Original snapshot is missing.");
  const original = await readFile(originalPath, "utf8");
  if (sha256(original) !== metadata.originalSha256) {
    throw new Error("Original snapshot integrity check failed. Restore original.md before continuing.");
  }
  return original;
}

export async function ensureEntriesRoot() {
  await mkdir(entriesRoot, { recursive: true });
}
