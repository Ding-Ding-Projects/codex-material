#!/usr/bin/env node
/* Bundles the NAMES of every dish in the shared Hong Kong dim sum catalog.
 *
 *   node tools/sync-dimsum-roster.mjs [--catalog <path>]
 *
 * This is the text half of tools/sync-dimsum.ps1, split out because it needs no image
 * decoder and therefore no PowerShell and no Windows.
 *
 * Why a roster separate from app/dimsum/manifest.json: the manifest describes the
 * dishes whose 256px photo is bundled in the installer, and that set has to stay small
 * — the catalog's originals are ~2.3 MB each, so bundling all 703 would add well over
 * a hundred megabytes to an app that draws one dish at 56 CSS pixels, once per hundred
 * launches. Release code names, on the other hand, need only a name, and a name is
 * about 200 bytes. Keeping them apart lets the code names run to the end of the
 * catalog while the installer carries a curated slice.
 *
 * The roster is COMMITTED, so a release never needs the (private) catalog repository.
 * Re-run this when the catalog grows.
 */
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { homedir } from "node:os";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");

function catalogRoot() {
  const flag = process.argv.indexOf("--catalog");
  if (flag !== -1 && process.argv[flag + 1]) return resolve(process.argv[flag + 1]);
  // Resolve the instructions repository from the user's Documents folder rather than
  // hard-coding a drive or a username.
  return join(homedir(), "Documents", "GitHub", "agent-global-memory", "dim-sum");
}

const catalog = catalogRoot();
const indexPath = join(catalog, "index.json");
if (!existsSync(indexPath)) {
  process.stderr.write(
    `Dim sum catalog not found at ${indexPath}.\n` +
      "Clone the instructions repository, or pass --catalog <path>.\n",
  );
  process.exit(2);
}

const index = JSON.parse(readFileSync(indexPath, "utf8"));
const dishes = Array.isArray(index.dishes) ? index.dishes : [];
if (dishes.length === 0) {
  process.stderr.write("The catalog index lists no dishes.\n");
  process.exit(2);
}

// Which dishes already ship a bundled photo. A roster entry that names one of them can
// carry a picture into the release; the rest travel as a name alone, which is the whole
// point of keeping the two lists at different sizes.
const bundled = new Map();
try {
  const manifest = JSON.parse(readFileSync(join(root, "app", "dimsum", "manifest.json"), "utf8"));
  for (const d of manifest.dishes || []) bundled.set(d.id, d.image);
} catch {
  /* No bundled manifest yet: every roster entry is then a name without a photo. */
}

const seen = new Set();
const roster = [];
for (const d of dishes) {
  // An id that appears twice would make --derive ambiguous and the ledger unresolvable.
  if (!d.id || seen.has(d.id)) continue;
  const en = d.name?.en || "";
  const yue = d.name?.zhHant || d.name?.yue || "";
  // A dish missing either language cannot satisfy the bilingual naming rule, and a
  // half-named release is worse than an unnamed one.
  if (!en || !yue || !d.slug) continue;
  seen.add(d.id);
  roster.push({
    id: d.id,
    slug: d.slug,
    en,
    yue,
    jyutping: d.jyutping || "",
    altEn: d.image?.alt?.en || "",
    altYue: d.image?.alt?.yue || "",
    /** Path inside the shared catalog to the native-resolution original, for a local
     *  publisher who has it checked out. */
    source: d.image?.path || "",
    /** Set only when the 256px derivative is bundled here; null otherwise. */
    image: bundled.get(d.id) || null,
  });
}

const out = {
  generatedFrom: "the shared Hong Kong dim sum catalog",
  catalogStatus: index.catalogStatus || "unknown",
  catalogTotal: index.total || dishes.length,
  named: roster.length,
  withBundledImage: roster.filter((r) => r.image).length,
  dishes: roster,
};

const dest = join(root, "app", "dimsum", "roster.json");
writeFileSync(dest, JSON.stringify(out, null, 2) + "\n", "utf8");

process.stdout.write(
  `Roster: ${out.named} named dishes (${out.withBundledImage} with a bundled photo) ` +
    `from a catalog of ${out.catalogTotal}, status ${out.catalogStatus}\n` +
    `Wrote app/dimsum/roster.json\n`,
);
