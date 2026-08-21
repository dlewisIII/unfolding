import { execFileSync, spawnSync } from "node:child_process";
import { existsSync, statSync } from "node:fs";
import { mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

const started = Date.now();
const stages = [];
const deployCurrent = process.argv.includes("--deploy-current");
const verifyGitScope = process.argv.includes("--verify-git-scope");
const source = process.argv.includes("--as-is") ? "--as-is" : "--from-draft";
const host = process.env.UNFOLDING_VPS ?? "anastasia@77.222.47.125";
const remoteDir = process.env.UNFOLDING_VPS_DIR ?? "/home/anastasia/apps/unfolding-production";
const productionGit = { remote: "origin", branch: "main", pushUrl: "https://github.com/dlewisIII/unfolding.git" };
let commands = 0;

function fail(stage, detail, status = 1) { console.error(`FAST PUBLISH FAILED\nstage: ${stage}\n${detail}`); process.exit(status); }
function run(stage, command, args, options = {}) {
  const at = Date.now(); commands += 1;
  const result = spawnSync(command, args, { cwd: process.cwd(), encoding: "utf8", ...options });
  stages.push([stage, Date.now() - at]);
  if (result.status !== 0) fail(stage, `command: ${command} ${args.join(" ")}\n${(result.stderr || result.stdout || "unknown error").trim().slice(-2400)}`, result.status || 1);
  return result.stdout;
}
function git(args, options = {}) {
  const result = spawnSync("git", args, { cwd: process.cwd(), encoding: "utf8", ...options });
  if (result.status !== 0) throw new Error((result.stderr || result.stdout || "git command failed").trim());
  return result.stdout;
}
function statusSnapshot() { return git(["status", "--porcelain=v1", "-z"]); }
function stagedPaths() { return new Set(git(["diff", "--cached", "--name-only", "-z"]).split("\0").filter(Boolean)); }
function statusPaths(snapshot) {
  const fields = snapshot.split("\0").filter(Boolean); const paths = new Set();
  for (let index = 0; index < fields.length; index += 1) {
    const field = fields[index];
    if (!/^[ MADRCU?!]{2} /.test(field)) throw new Error(`Unrecognised git status record: ${field.slice(0, 80)}`);
    const status = field.slice(0, 2); paths.add(field.slice(3));
    if (status.includes("R") || status.includes("C")) { if (index + 1 >= fields.length) throw new Error("Incomplete rename/copy status record."); paths.add(fields[++index]); }
  }
  return paths;
}
function publicationPath(path, slug) { return path.startsWith(`content/entries/${slug}/`) || path === "content/generated.ts"; }
function fingerprints(paths) {
  return new Map([...paths].map((path) => {
    if (!existsSync(path)) return [path, "(missing)"];
    const stat = statSync(path);
    if (stat.isDirectory()) return [path, `directory:${stat.mtimeMs}:${stat.size}`];
    return [path, git(["hash-object", "--", path]).trim()];
  }));
}
function fingerprint(path) {
  if (!existsSync(path)) return "(missing)";
  const stat = statSync(path);
  return stat.isDirectory() ? `directory:${stat.mtimeMs}:${stat.size}` : git(["hash-object", "--", path]).trim();
}
function assertProductionGitTarget() {
  const branch = git(["branch", "--show-current"]).trim();
  const upstream = git(["rev-parse", "--abbrev-ref", "--symbolic-full-name", "@{upstream}"]).trim();
  const pushUrl = git(["remote", "get-url", "--push", productionGit.remote]).trim();
  const expectedUpstream = `${productionGit.remote}/${productionGit.branch}`;
  if (branch !== productionGit.branch || upstream !== expectedUpstream || pushUrl !== productionGit.pushUrl) throw new Error(`Expected branch ${productionGit.branch}, upstream ${expectedUpstream}, and push remote ${productionGit.pushUrl}; found branch ${branch || "(detached)"}, upstream ${upstream || "(none)"}, push remote ${pushUrl || "(none)"}.`);
}
function httpCheck(name, url, expected) {
  const at = Date.now(); commands += 1;
  const result = spawnSync("curl", ["-fsS", "-o", "/dev/null", "-w", "%{http_code}", url], { encoding: "utf8" }); stages.push([`HTTP ${name}`, Date.now() - at]);
  if (result.status !== 0 || result.stdout.trim() !== expected) fail(`HTTP ${name}`, `expected: ${expected}\nreceived: ${result.stdout.trim() || "curl failure"}\n${result.stderr.trim()}`);
}
function lifecycle(metadata, locale) { return locale === metadata.originalLanguage ? metadata : metadata.translations?.[locale]; }
async function preflight() {
  const active = JSON.parse(await readFile("content/.active-entry.json", "utf8")); if (!active.slug) throw new Error("No active entry.");
  const metadataPath = `content/entries/${active.slug}/metadata.json`; if (!existsSync(metadataPath)) throw new Error(`Missing metadata: ${metadataPath}`);
  const metadata = JSON.parse(await readFile(metadataPath, "utf8"));
  for (const locale of ["ru", "en"]) {
    const state = lifecycle(metadata, locale); const publishable = state?.status === "reviewed" || (state?.status === "published" && state?.revisionStatus === "reviewed");
    if (!verifyGitScope && (deployCurrent ? state?.status !== "published" : !publishable)) throw new Error(`${locale} is not publishable.`);
    if (!verifyGitScope && (!state?.title || !Array.isArray(state.tags) || !state.originalSha256)) throw new Error(`${locale} has incomplete approved metadata.`);
  }
  return active.slug;
}
function captureBaseline(slug) {
  const snapshot = statusSnapshot(); const paths = statusPaths(snapshot); const publicationDirty = [...paths].filter((path) => publicationPath(path, slug));
  if (publicationDirty.length) throw new Error(`Cannot identify this publication's changes because its scope was already dirty: ${publicationDirty.join(", ")}`);
  return { snapshot, staged: stagedPaths(), dirtyFingerprints: fingerprints(paths) };
}
function prepareCommit(slug, baseline) {
  const before = statusPaths(baseline.snapshot); const after = statusPaths(statusSnapshot());
  for (const [path, expectedFingerprint] of baseline.dirtyFingerprints) {
    const current = fingerprint(path);
    if (current !== expectedFingerprint) throw new Error(`A pre-existing dirty path changed during publication: ${path}`);
  }
  const scope = [...after].filter((path) => !before.has(path));
  const outsideScope = scope.filter((path) => !publicationPath(path, slug));
  if (outsideScope.length) throw new Error(`Publication changed files outside its allowlist: ${outsideScope.join(", ")}`);
  if (!scope.length) throw new Error("Publication made no Git changes; refusing to create an empty commit.");
  run("git diff check", "git", ["diff", "--check", "--", ...scope]);
  const scopedStatus = git(["status", "--short", "--", ...scope]).trim(); const scopedStat = git(["diff", "--stat", "--", ...scope]).trim();
  console.log(`GIT SCOPE\n${scopedStatus || "(new untracked files)"}\n${scopedStat || "(untracked files only)"}\nfiles:\n${scope.map((path) => `- ${path}`).join("\n")}`);
  run("git stage", "git", ["add", "--", ...scope]);
  const newlyStaged = [...stagedPaths()].filter((path) => !baseline.staged.has(path)).sort(); const expected = [...scope].sort();
  if (JSON.stringify(newlyStaged) !== JSON.stringify(expected)) throw new Error("Newly staged paths do not exactly match the publication allowlist.");
  run("commit", "git", ["commit", "-m", `publish: ${slug}`, "--", ...scope]);
  const sha = git(["rev-parse", "--short=7", "HEAD"]).trim(); assertProductionGitTarget(); run("push", "git", ["push", productionGit.remote, productionGit.branch]);
  return { sha, destination: `${productionGit.remote}/${productionGit.branch}` };
}
async function createCommittedBuildContext() {
  const directory = await mkdtemp(join(tmpdir(), "unfolding-fast-")); const archive = join(directory, "source.tar");
  run("source archive", "git", ["archive", "--format=tar", `--output=${archive}`, "HEAD"]); run("source extract", "tar", ["-xf", archive, "-C", directory]); await rm(archive, { force: true }); return directory;
}

const slug = await (async () => { const at = Date.now(); try { return await preflight(); } catch (error) { fail("preflight", error.message); } finally { stages.push(["preflight", Date.now() - at]); } })();
if (verifyGitScope) {
  try { captureBaseline(slug); console.log(`FAST PUBLISH GIT SCOPE CHECK\n\nentry: ${slug}\n✓ baseline captured\n✓ existing dirty paths left untouched\n✓ no files staged, committed, pushed, built, or deployed`); } catch (error) { fail("git baseline", error.message); }
  process.exit(0);
}
let baseline;
if (!deployCurrent) { try { assertProductionGitTarget(); baseline = captureBaseline(slug); } catch (error) { fail("git preflight", error.message); } }
run("validation", "node", ["scripts/validate-katex.mjs", "--all"]);
if (!deployCurrent) { run("publish RU", "node", ["scripts/publish-entry.mjs", "--active", "ru", source]); run("publish EN", "node", ["scripts/publish-entry.mjs", "--active", "en", source]); }
run("sync", "node", ["scripts/sync-content.mjs"]);
let gitResult;
if (!deployCurrent) { try { gitResult = prepareCommit(slug, baseline); } catch (error) { fail("git commit/push", error.message); } }
const revision = execFileSync("git", ["rev-parse", "--short=12", "HEAD"], { encoding: "utf8" }).trim(); const tag = `unfolding-web:${revision}-${Date.now()}`;
const buildContext = await createCommittedBuildContext(); try { run("build", "docker", ["buildx", "build", "--platform", "linux/amd64", "--load", "-f", "deploy/Dockerfile", "-t", tag, buildContext]); } finally { await rm(buildContext, { recursive: true, force: true }); }
const archive = `/tmp/${tag.replace(/[^a-z0-9.-]/gi, "-")}.tar`; run("image export", "docker", ["save", "-o", archive, tag]); run("image transfer", "scp", ["-o", "BatchMode=yes", archive, `${host}:${archive}`]); run("deploy VPS", "ssh", ["-o", "BatchMode=yes", host, `docker load -i ${archive} && rm -f ${archive}`]); await rm(archive, { force: true });
run("container update", "ssh", ["-o", "BatchMode=yes", host, `cd ${remoteDir} && UNFOLDING_IMAGE=${tag} docker compose up -d --force-recreate && for i in $(seq 1 12); do test "$(docker inspect -f '{{.State.Health.Status}}' unfolding-production-app-1)" = healthy && exit 0; sleep 5; done; exit 1`]);
for (const [name, url, code] of [["root", "https://unfolding.day/", "200"], ["EN", `https://unfolding.day/entries/${slug}`, "200"], ["RU", `https://unfolding.day/ru/entries/${slug}`, "200"], ["www", `https://www.unfolding.day/entries/${slug}`, "301"], ["asset", "https://unfolding.day/favicon.svg", "200"]]) httpCheck(name, url, code);
const gitSummary = gitResult ? `\n✓ git scope\n✓ commit ${gitResult.sha}\n✓ push ${gitResult.destination}` : "";
console.log(`FAST PUBLISH\n\nentry: ${slug}\n✓ preflight\n✓ validation\n${deployCurrent ? "" : "✓ publish RU\n✓ publish EN\n"}✓ sync${gitSummary}\n✓ build\n✓ image transfer\n✓ deploy VPS\n✓ healthy\n✓ EN 200\n✓ RU 200\n✓ www 301\n✓ asset 200\n\nduration: ${((Date.now() - started) / 1000).toFixed(1)}s`);
