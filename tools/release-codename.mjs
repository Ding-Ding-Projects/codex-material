/* Assigns a dim sum code name to a build.
 *
 * A code name is a label beside the version, never a replacement for it — the version
 * is still what a user and a machine identify a build by. Each dish is used ONCE per
 * project: a repeated code name makes two different builds indistinguishable in
 * conversation, which is the one job a code name has.
 *
 * Only dishes with a real bundled image are eligible. The shared catalog is built
 * incrementally, and naming a build after a record whose photo does not exist yet
 * produces a release whose code name renders as a broken image.
 *
 * Usage:
 *   node tools/release-codename.mjs --peek                 print the next unused dish
 *   node tools/release-codename.mjs --assign <tag>         claim it for <tag> and record it
 *   node tools/release-codename.mjs --for <tag>            print the dish already assigned
 *   node tools/release-codename.mjs --derive <n>           the dish for build number <n>
 *
 * CI uses `--derive`, not `--assign`: writing the ledger back from a workflow would
 * push to the branch that triggered it, and that is how a release pipeline turns into
 * an infinite loop. Deriving from the monotonic build number gives the same
 * one-dish-per-build guarantee and stays auditable, because the tag reproduces it.
 *
 * A release is NEVER blocked by this tool. If no dish can be resolved it exits 0 with
 * `assigned: false`, and the caller ships the version alone and says so.
 */
import { readFileSync, writeFileSync, existsSync, mkdirSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const MANIFEST = join(root, "app", "dimsum", "manifest.json");
const LEDGER = join(root, "docs", "release-codenames.json");

function readJson(path, fallback) {
  try {
    return JSON.parse(readFileSync(path, "utf8"));
  } catch {
    return fallback;
  }
}

const manifest = readJson(MANIFEST, null);
const ledger = readJson(LEDGER, { schema: 1, project: "codex-studio", assignments: [] });

function fail(reason) {
  // Not an error exit: the release must still ship.
  process.stdout.write(JSON.stringify({ assigned: false, reason }, null, 2) + "\n");
  process.exit(0);
}

function record(entry) {
  mkdirSync(dirname(LEDGER), { recursive: true });
  writeFileSync(LEDGER, JSON.stringify(ledger, null, 2) + "\n");
  process.stdout.write(JSON.stringify(entry, null, 2) + "\n");
}

function describe(dish, extra) {
  return {
    assigned: true,
    codeName: `${dish.en} · ${dish.yue}`,
    en: dish.en,
    zhHant: dish.yue,
    jyutping: dish.jyutping || "",
    id: dish.id,
    slug: dish.slug,
    /** Bundled 256px derivative — what the app and the site render. */
    bundledImage: dish.image,
    /** Path inside the shared catalog to the native-resolution original. The release
     *  workflow attaches the bundled copy; a local publisher with the catalog checked
     *  out can attach the original instead. */
    catalogSource: dish.source,
    altEn: dish.altEn || dish.alt?.en || "",
    altYue: dish.altYue || dish.alt?.yue || "",
    ...extra,
  };
}

const args = process.argv.slice(2);
const mode = args[0] || "--peek";
const tag = args[1] || "";

if (mode === "--for") {
  const hit = ledger.assignments.find((a) => a.tag === tag);
  if (!hit) fail(`no code name has been assigned to ${tag}`);
  const dish = (manifest?.dishes || []).find((d) => d.id === hit.id);
  if (!dish) fail(`${tag} was assigned ${hit.id}, which is no longer in the bundled manifest`);
  process.stdout.write(JSON.stringify(describe(dish, { tag: hit.tag, at: hit.at }), null, 2) + "\n");
  process.exit(0);
}

if (!manifest || !Array.isArray(manifest.dishes) || manifest.dishes.length === 0) {
  fail("no bundled dim sum manifest — run tools/sync-dimsum.ps1 with the catalog available");
}

if (mode === "--derive") {
  const n = Number.parseInt(tag, 10);
  if (!Number.isFinite(n) || n < 1) {
    process.stderr.write("--derive needs a positive build number\n");
    process.exit(2);
  }
  // Deliberately NOT modulo. Wrapping would silently hand two different builds the
  // same code name, and a code name that identifies two builds identifies neither.
  const dish = manifest.dishes[n - 1];
  if (!dish) {
    fail(
      `build ${n} is past the ${manifest.dishes.length} bundled dishes — every one has been used by an earlier build. Bundle more with tools/sync-dimsum.ps1.`,
    );
  }
  process.stdout.write(JSON.stringify(describe(dish, { build: n }), null, 2) + "\n");
  process.exit(0);
}

const used = new Set(ledger.assignments.map((a) => a.id));
const next = manifest.dishes.find((d) => !used.has(d.id));
if (!next) {
  fail(`every one of the ${manifest.dishes.length} bundled dishes is already used; bundle more with tools/sync-dimsum.ps1`);
}

if (mode === "--peek") {
  process.stdout.write(JSON.stringify(describe(next), null, 2) + "\n");
  process.exit(0);
}

if (mode === "--assign") {
  if (!tag) {
    process.stderr.write("--assign needs a tag, e.g. --assign v0.1.0+build.12\n");
    process.exit(2);
  }
  const already = ledger.assignments.find((a) => a.tag === tag);
  if (already) {
    const dish = manifest.dishes.find((d) => d.id === already.id) || next;
    process.stdout.write(JSON.stringify(describe(dish, { tag, at: already.at, reused: true }), null, 2) + "\n");
    process.exit(0);
  }
  ledger.assignments.push({
    tag,
    id: next.id,
    slug: next.slug,
    en: next.en,
    zhHant: next.yue,
    at: new Date().toISOString(),
  });
  record(describe(next, { tag }));
  process.exit(0);
}

process.stderr.write(`unknown mode ${mode}\n`);
process.exit(2);
