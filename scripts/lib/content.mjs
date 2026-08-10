import { createHash } from "node:crypto";
import { existsSync } from "node:fs";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

export const root = process.cwd();
export const entriesRoot = path.join(root, "content", "entries");
export const activeEntryPath = path.join(root, "content", ".active-entry.json");
export const locales = ["en", "ru"];
export const reviewCategories = ["language", "clarity", "logic", "factual_claims", "mathematics"];

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

export function assertLocale(locale) {
  if (!locales.includes(locale)) throw new Error("Language must be en or ru.");
}

export function lifecycleDirectory(slug, locale, metadata) {
  assertLocale(locale);
  const directory = entryDirectory(slug);
  return locale === metadata.originalLanguage ? directory : path.join(directory, "translations", locale);
}

export function localDateTime() {
  const date = new Date();
  const parts = new Intl.DateTimeFormat("sv-SE", {
    year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", second: "2-digit",
    hourCycle: "h23", timeZoneName: "longOffset",
  }).formatToParts(date);
  const get = (type) => parts.find((part) => part.type === type)?.value;
  const offset = (get("timeZoneName") || "GMT+00:00").replace("GMT", "");
  return `${get("year")}-${get("month")}-${get("day")}T${get("hour")}:${get("minute")}:${get("second")}${offset === "" ? "Z" : offset}`;
}

export async function setActiveEntry(slug) {
  await ensureEntriesRoot();
  await writeJson(activeEntryPath, { slug, selectedAt: localDateTime() });
}

export async function resolveEntry(selector) {
  if (selector !== "--active") return selector;
  if (!existsSync(activeEntryPath)) throw new Error("No explicit active entry. Select one before continuing.");
  const active = await readJson(activeEntryPath);
  if (!active.slug || !existsSync(entryDirectory(active.slug))) throw new Error("The explicit active entry is invalid. Select an entry before continuing.");
  return active.slug;
}

export async function ensureLifecycleOriginalIntegrity(slug, locale, metadata) {
  const directory = lifecycleDirectory(slug, locale, metadata);
  const lifecycle = locale === metadata.originalLanguage ? metadata : metadata.translations?.[locale];
  if (!lifecycle?.originalSha256) throw new Error("Original snapshot hash is missing for this language lifecycle.");
  const originalPath = path.join(directory, "original.md");
  if (!existsSync(originalPath)) throw new Error("Original snapshot is missing.");
  const original = await readFile(originalPath, "utf8");
  if (sha256(original) !== lifecycle.originalSha256) throw new Error("Original snapshot integrity check failed. Restore original.md before continuing.");
  return original;
}
