import { existsSync } from "node:fs";
import { unlink } from "node:fs/promises";
import { activeEntryPath, entryDirectory, readJson, setActiveEntry } from "./lib/content.mjs";

const [action, slug] = process.argv.slice(2);
if (action === "show") {
  if (!existsSync(activeEntryPath)) console.log("No explicit active entry.");
  else console.log((await readJson(activeEntryPath)).slug);
} else if (action === "set") {
  if (!slug || !existsSync(entryDirectory(slug))) throw new Error("Usage: pnpm entry:active set <slug> (entry must exist)");
  await setActiveEntry(slug);
  console.log(`Active entry: ${slug}`);
} else if (action === "clear") {
  if (existsSync(activeEntryPath)) await unlink(activeEntryPath);
  console.log("Active entry cleared.");
} else {
  throw new Error("Usage: pnpm entry:active <show|set <slug>|clear>");
}
