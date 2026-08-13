import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

async function render(pathname = "/", headers = {}) {
  const workerUrl = new URL("../dist/server/index.js", import.meta.url);
  workerUrl.searchParams.set("test", `${process.pid}-${Date.now()}-${pathname}`);
  const { default: worker } = await import(workerUrl.href);
  return worker.fetch(new Request(`http://localhost${pathname}`, { headers: { accept: "text/html", ...headers } }), {
    ASSETS: { fetch: async () => new Response("Not found", { status: 404 }) },
  }, { waitUntil() {}, passThroughOnException() {} });
}

test("serves English at the root regardless of language preferences", async () => {
  const [english, russian, saved] = await Promise.all([
    render("/"),
    render("/", { "accept-language": "ru-RU,ru;q=0.9,en;q=0.8" }),
    render("/", { "accept-language": "ru-RU", cookie: "unfolding-language=en" }),
  ]);
  assert.equal(english.status, 200);
  assert.equal(russian.status, 200);
  assert.equal(saved.status, 200);
});

test("permanently redirects legacy English routes without changing their path or query", async () => {
  const [home, about, search, entry] = await Promise.all([
    render("/en?source=legacy"),
    render("/en/about?source=legacy"),
    render("/en/search?query=logic"),
    render("/en/entries/implication-chain?source=legacy"),
  ]);
  assert.equal(home.status, 301);
  assert.equal(home.headers.get("location"), "/?source=legacy");
  assert.equal(about.status, 301);
  assert.equal(about.headers.get("location"), "/about?source=legacy");
  assert.equal(search.status, 301);
  assert.equal(search.headers.get("location"), "/search?query=logic");
  assert.equal(entry.status, 301);
  assert.equal(entry.headers.get("location"), "/entries/implication-chain?source=legacy");
});

test("redirects the legacy Sites hostname to the canonical domain", async () => {
  const [page, legacyEnglish, asset] = await Promise.all([
    render("/about?source=legacy-host", { host: "unfolding-journal.davidlewisiii.chatgpt.site" }),
    render("/en/entries/implication-chain?source=legacy-host", { host: "unfolding-journal.davidlewisiii.chatgpt.site" }),
    render("/favicon.svg", { host: "unfolding-journal.davidlewisiii.chatgpt.site" }),
  ]);
  assert.equal(page.status, 301);
  assert.equal(page.headers.get("location"), "https://unfolding.day/about?source=legacy-host");
  assert.equal(legacyEnglish.status, 301);
  assert.equal(legacyEnglish.headers.get("location"), "https://unfolding.day/entries/implication-chain?source=legacy-host");
  assert.equal(asset.status, 301);
  assert.equal(asset.headers.get("location"), "https://unfolding.day/favicon.svg");
});

test("renders both indexable journal homes and published bilingual entries", async () => {
  const response = await render("/");
  assert.equal(response.status, 200);
  const html = await response.text();
  assert.match(html, /<title>Unfolding<\/title>/i);
  assert.match(html, /lang="en"/i);
  assert.match(html, /A scientific discovery may begin with a fact/i);
  assert.match(html, /<h2 class="feed-entry-title"><a href="\/entries\/implication-chain"[^>]*>Implication Chain<\/a><\/h2>/i);
  assert.match(html, /class="prose entry-content feed-entry-body"/i);
  assert.doesNotMatch(html, /class="prose entry-content feed-entry-body"><h1>Implication Chain<\/h1>/i);
  assert.match(html, /<h2>Statement<\/h2>[\s\S]*Suppose that[\s\S]*P[\s\S]*Q[\s\S]*Strategy[\s\S]*Proof/i);
  assert.match(html, /href="\/entries\/limits-of-scientific-description"/i);
  assert.match(html, /11 August 2026 · 02:58/i);
  assert.match(html, /class="open-entry-link" href="\/entries\/magic-of-dawn" aria-label="Open entry"[^>]*>→<\/a>/i);
  assert.match(html, /href="\/about"/i);
  assert.match(html, /href="\/search"/i);
  assert.match(html, /class="home-link" href="\/"[^>]+aria-label="Home"/i);
  assert.doesNotMatch(html, /target="_top"|target="_blank"/i);
  assert.match(html, /href="\/ru"/i);
  assert.match(html, /aria-label="UNFOLDING"/i);
  assert.match(html, /viewBox="0 0 1041 125"/i);
  assert.doesNotMatch(html, />Unfolding<\/a>/i);
  assert.match(html, /hreflang="ru"/i);
  assert.match(html, /hreflang="en"/i);
  assert.match(html, /rel="canonical" href="https:\/\/unfolding\.day\/?"/i);
  assert.match(html, /unfolding-theme/i);
  assert.doesNotMatch(html, /codex-preview|react-loading-skeleton|Your site is taking shape/i);

  const russianResponse = await render("/ru");
  const russianHtml = await russianResponse.text();
  assert.equal(russianResponse.status, 200);
  assert.match(russianHtml, /lang="ru"/i);
  assert.match(russianHtml, /Научное открытие может начаться с факта/i);
  assert.match(russianHtml, /href="\/ru\/entries\/limits-of-scientific-description"/i);
  assert.match(russianHtml, /11 августа 2026 · 02:58/i);
  assert.match(russianHtml, /class="home-link" href="\/ru"[^>]+aria-label="Главная"/i);
});

test("keeps permanent entry pages and localized copy-link actions", async () => {
  const [english, russian] = await Promise.all([
    render("/entries/limits-of-scientific-description"),
    render("/ru/entries/limits-of-scientific-description"),
  ]);
  const englishHtml = await english.text();
  const russianHtml = await russian.text();
  assert.equal(english.status, 200);
  assert.equal(russian.status, 200);
  assert.match(englishHtml, /rel="canonical" href="https:\/\/unfolding\.day\/entries\/limits-of-scientific-description"/i);
  assert.match(englishHtml, /aria-label="Copy link"/i);
  assert.match(englishHtml, /href="\/">← Notes<\/a>/i);
  assert.match(englishHtml, /class="chain-link-icon"/i);
  assert.match(englishHtml, /11 August 2026 · 02:58/i);
  assert.match(russianHtml, /aria-label="Скопировать ссылку"/i);
  assert.match(russianHtml, /href="\/ru">← Записи<\/a>/i);
  assert.doesNotMatch(englishHtml, />⌁<\/button>/i);
  assert.match(russianHtml, /11 августа 2026 · 02:58/i);
  assert.match(englishHtml, /hreflang="ru"/i);
  assert.match(russianHtml, /hreflang="en"/i);

  const implication = await render("/entries/implication-chain").then((response) => response.text());
  assert.match(implication, /<header class="entry-header">[\s\S]*<h1>Implication Chain<\/h1><\/header>/i);
  assert.match(implication, /class="prose entry-content"/i);
  assert.doesNotMatch(implication, /class="prose entry-content"><h1>Implication Chain<\/h1>/i);
  assert.match(implication, /href="https:\/\/github\.com\/avikulova\/study-math\/blob\/main\/logic\/proofs\/implication-chain\.md" target="_blank" rel="noopener noreferrer">GitHub ↗<\/a>/i);
});

test("renders $$ display math through KaTeX", async () => {
  const html = await render("/entries/implication-chain").then((response) => response.text());
  assert.match(html, /class="katex-display"/i);
  assert.match(html, /annotation encoding="application\/x-tex">P \\rightarrow R\.?<\/annotation>/i);
});

test("renders \\[…\\] display math through KaTeX", async () => {
  const [english, russian] = await Promise.all([
    render("/entries/what-lies-beyond-the-observer").then((response) => response.text()),
    render("/ru/entries/what-lies-beyond-the-observer").then((response) => response.text()),
  ]);
  for (const html of [english, russian]) {
    assert.match(html, /class="katex-display"/i);
    assert.doesNotMatch(html, /<p>\[\s*\\text\{/i);
    assert.doesNotMatch(html, /katex-stretchy fbox/i);
  }
  assert.match(english, /annotation encoding="application\/x-tex">\\text\{information about an event\}/i);
  assert.match(russian, /annotation encoding="application\/x-tex">\\text\{информация о событии\}/i);
});

test("keeps authorial emphasis visible in entry prose", async () => {
  const [english, russian] = await Promise.all([
    render("/entries/what-lies-beyond-the-observer").then((response) => response.text()),
    render("/ru/entries/what-lies-beyond-the-observer").then((response) => response.text()),
  ]);
  assert.match(russian, /<strong>расширение области реальности, доступной осознанию<\/strong>/i);
  assert.match(english, /<strong>an expansion of the region of reality accessible to awareness<\/strong>/i);
  const css = await readFile(new URL("../app/globals.css", import.meta.url), "utf8");
  assert.match(css, /\.prose strong\s*\{[^}]*font-weight:\s*600/i);
  assert.match(css, /\.entry-content h2\s*\{[^}]*font-size:\s*23px/i);
});

test("renders a saved theme before the document is painted", async () => {
  const response = await render("/", { cookie: "unfolding-theme=dark" });
  assert.equal(response.status, 200);
  const html = await response.text();
  assert.match(html, /<html lang="en" data-theme="dark"/i);
  assert.match(html, /<meta name="theme-color" content="#171717"/i);
  assert.doesNotMatch(html, /target="_top"/i);
});

test("enables MPA view transitions as a progressive enhancement", async () => {
  const css = await readFile(new URL("../app/globals.css", import.meta.url), "utf8");
  assert.match(css, /@view-transition\s*\{\s*navigation:\s*auto;\s*\}/i);
});

test("renders localized About and Search routes", async () => {
  const [aboutResponse, russianAboutResponse, searchResponse] = await Promise.all([render("/about"), render("/ru/about"), render("/search")]);
  assert.equal(aboutResponse.status, 200);
  assert.equal(searchResponse.status, 200);
  const aboutHtml = await aboutResponse.text();
  const searchHtml = await searchResponse.text();
  assert.match(aboutHtml, /href="https:\/\/unfolding\.day\/about" hreflang="x-default"/i);
  assert.match(aboutHtml, /my record of exploring consciousness, reality, the body, mathematics, science/i);
  assert.match(aboutHtml, /The question of what any of this ultimately means remains open\./i);
  assert.match(await russianAboutResponse.text(), /мои записи об исследовании сознания/i);
  assert.match(await render("/ru/about").then((response) => response.text()), /Об Unfolding/i);
  assert.match(aboutHtml, /Written and edited by Anastasia/i);
  assert.match(searchHtml, /Search titles, text, and tags/i);
  assert.match(searchHtml, /href="https:\/\/unfolding\.day\/search" hreflang="x-default"/i);
});

test("publishes robots and sitemap discovery files", async () => {
  const [robotsResponse, sitemapResponse] = await Promise.all([render("/robots.txt"), render("/sitemap.xml")]);
  assert.equal(robotsResponse.status, 200);
  assert.match(await robotsResponse.text(), /Sitemap: https:\/\/unfolding\.day\/sitemap\.xml/i);
  assert.equal(sitemapResponse.status, 200);
  const sitemap = await sitemapResponse.text();
  assert.match(sitemap, /https:\/\/unfolding\.day\/about/i);
  assert.match(sitemap, /hreflang="en"/i);
  assert.match(sitemap, /hreflang="ru"/i);
  assert.match(sitemap, /\/entries\/limits-of-scientific-description/i);
  assert.match(sitemap, /\/ru\/entries\/limits-of-scientific-description/i);
});

test("keeps review records structured and connections independent", async () => {
  const [reviewSchema, connectionSchema, workflow, explore, languageSwitcher, syncScript, externalLinks] = await Promise.all([
    readFile(new URL("../content/schemas/review.schema.json", import.meta.url), "utf8"),
    readFile(new URL("../content/schemas/connection.schema.json", import.meta.url), "utf8"),
    readFile(new URL("../docs/CONTENT_WORKFLOW.md", import.meta.url), "utf8"),
    readFile(new URL("../docs/EXPLORE_CONCEPT.md", import.meta.url), "utf8"),
    readFile(new URL("../app/components/LanguageSwitcher.tsx", import.meta.url), "utf8"),
    readFile(new URL("../scripts/sync-content.mjs", import.meta.url), "utf8"),
    readFile(new URL("../app/components/ExternalLinks.tsx", import.meta.url), "utf8"),
  ]);
  assert.match(reviewSchema, /factual_claims/);
  assert.match(reviewSchema, /confidence/);
  assert.match(connectionSchema, /sourceEntryId/);
  assert.match(connectionSchema, /targetEntryId/);
  assert.match(workflow, /original\.md.*created once/is);
  assert.match(workflow, /reviewed tag proposals for RU and EN are approved as a pair/i);
  assert.match(explore, /Tag[\s\S]*Concept[\s\S]*Cluster[\s\S]*Explore section/);
  assert.match(explore, /progressive disclosure/i);
  assert.match(await readFile(new URL("../docs/BILINGUAL_ARCHITECTURE.md", import.meta.url), "utf8"), /one stable `id`[\s\S]*originalLanguage[\s\S]*No translation is generated or published automatically/i);
  assert.match(languageSwitcher, /is-unavailable[\s\S]*Translation not published/i);
  assert.match(syncScript, /translation\.status !== "published"/i);
  assert.match(externalLinks, /link\.type === "github" \? "GitHub ↗"/i);
  assert.doesNotMatch(syncScript, /translationMethod/);
});
