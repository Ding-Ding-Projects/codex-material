/* Copies the root CHANGELOG.md into the frontend directory.
 *
 * The in-app changelog viewer reads `./CHANGELOG.md` relative to the app origin, which
 * under Tauri is the bundled frontend directory — the root file is outside it. Rather
 * than teaching the viewer two different load paths, the file is mirrored here and the
 * frontend test asserts the two copies match, so the mirror cannot silently drift.
 *
 *   node tools/sync-changelog.mjs          write the mirror
 *   node tools/sync-changelog.mjs --check  fail if the mirror is stale
 */
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const source = join(root, "CHANGELOG.md");
const mirror = join(root, "app", "CHANGELOG.md");

if (!existsSync(source)) {
  process.stderr.write("CHANGELOG.md is missing from the repository root.\n");
  process.exit(1);
}

const text = readFileSync(source, "utf8");
const check = process.argv.includes("--check");

if (check) {
  const current = existsSync(mirror) ? readFileSync(mirror, "utf8") : null;
  if (current !== text) {
    process.stderr.write(
      "app/CHANGELOG.md is out of date. Run `node tools/sync-changelog.mjs` and commit the result.\n",
    );
    process.exit(1);
  }
  process.stdout.write("app/CHANGELOG.md matches the root copy.\n");
  process.exit(0);
}

writeFileSync(mirror, text);
process.stdout.write(`Mirrored ${text.length} bytes into app/CHANGELOG.md\n`);
