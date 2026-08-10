import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

async function render(pathname = "/") {
  const workerUrl = new URL("../dist/server/index.js", import.meta.url);
  workerUrl.searchParams.set("test", `${process.pid}-${Date.now()}-${pathname}`);
  const { default: worker } = await import(workerUrl.href);
  return worker.fetch(new Request(`http://localhost${pathname}`, { headers: { accept: "text/html" } }), {
    ASSETS: { fetch: async () => new Response("Not found", { status: 404 }) },
  }, { waitUntil() {}, passThroughOnException() {} });
}

test("renders the journal home without starter UI", async () => {
  const response = await render();
  assert.equal(response.status, 200);
  const html = await response.text();
  assert.match(html, /<title>Unfolding<\/title>/i);
  assert.match(html, /Personal journal &amp; research notebook/i);
  assert.match(html, /The first page is still unwritten/i);
  assert.match(html, /href="\/about"/i);
  assert.match(html, /href="\/search"/i);
  assert.match(html, />Theme</i);
  assert.match(html, /unfolding-theme/i);
  assert.doesNotMatch(html, /codex-preview|react-loading-skeleton|Your site is taking shape/i);
});

test("renders About and Search as separate minimal routes", async () => {
  const [aboutResponse, searchResponse] = await Promise.all([render("/about"), render("/search")]);
  assert.equal(aboutResponse.status, 200);
  assert.equal(searchResponse.status, 200);
  assert.match(await aboutResponse.text(), /personal journal, research notebook, and digital garden/i);
  assert.match(await searchResponse.text(), /Search titles, text, and tags/i);
});

test("keeps review records structured and connections independent", async () => {
  const [reviewSchema, connectionSchema, workflow, explore] = await Promise.all([
    readFile(new URL("../content/schemas/review.schema.json", import.meta.url), "utf8"),
    readFile(new URL("../content/schemas/connection.schema.json", import.meta.url), "utf8"),
    readFile(new URL("../docs/CONTENT_WORKFLOW.md", import.meta.url), "utf8"),
    readFile(new URL("../docs/EXPLORE_CONCEPT.md", import.meta.url), "utf8"),
  ]);
  assert.match(reviewSchema, /factual_claims/);
  assert.match(reviewSchema, /confidence/);
  assert.match(connectionSchema, /sourceEntryId/);
  assert.match(connectionSchema, /targetEntryId/);
  assert.match(workflow, /original\.md.*created once/is);
  assert.match(explore, /Tag[\s\S]*Concept[\s\S]*Cluster[\s\S]*Explore section/);
  assert.match(explore, /progressive disclosure/i);
});
