/* Copies the images the landing page needs into the Pages source tree.
 *
 * GitHub Pages serves `/docs` and nothing above it, so a `../../assets/...` reference
 * from `docs/site/` resolves locally when you open the file and 404s the moment it is
 * published. The site has to carry its own copies.
 *
 *   node tools/sync-site-assets.mjs           copy
 *   node tools/sync-site-assets.mjs --check   fail if anything is missing or stale
 */
import { readFileSync, writeFileSync, mkdirSync, existsSync, copyFileSync, statSync, readdirSync } from "node:fs";
import { dirname, join, resolve, basename } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const siteAssets = join(root, "docs", "site", "assets");
const check = process.argv.includes("--check");

/** Everything the page references, and where it comes from. */
const sources = [
  { from: join(root, "assets", "icon.png"), to: "icon.png" },
  { from: join(root, "assets", "icon-source.png"), to: "icon-source.png" },
];

for (const file of readdirSync(join(root, "assets", "screenshots"))) {
  if (file.endsWith(".png")) {
    sources.push({ from: join(root, "assets", "screenshots", file), to: join("screenshots", file) });
  }
}
sources.push({
  from: join(root, "assets", "screenshots", "manifest.json"),
  to: join("screenshots", "manifest.json"),
});

// The page uses the same bundled Roboto faces as the app — no font host, ever.
const fontDir = join(root, "app", "fonts");
if (existsSync(fontDir)) {
  for (const file of readdirSync(fontDir)) {
    if (file.endsWith(".woff2") || file.startsWith("LICENSE")) {
      sources.push({ from: join(fontDir, file), to: join("fonts", file) });
    }
  }
}

// The dim sum surprise on the site uses the same bundled photographs as the app.
const dimsumDir = join(root, "app", "dimsum");
if (existsSync(dimsumDir)) {
  for (const file of readdirSync(dimsumDir)) {
    if (file.endsWith(".png") || file === "manifest.json") {
      sources.push({ from: join(dimsumDir, file), to: join("dimsum", file) });
    }
  }
}

const stale = [];
let copied = 0;

for (const item of sources) {
  if (!existsSync(item.from)) {
    stale.push(`missing source: ${item.from}`);
    continue;
  }
  const dest = join(siteAssets, item.to);
  const same =
    existsSync(dest) &&
    statSync(dest).size === statSync(item.from).size &&
    statSync(dest).mtimeMs >= statSync(item.from).mtimeMs;
  if (same) continue;
  if (check) {
    stale.push(`stale or absent: docs/site/assets/${item.to.replace(/\\/g, "/")}`);
    continue;
  }
  mkdirSync(dirname(dest), { recursive: true });
  copyFileSync(item.from, dest);
  copied += 1;
}

if (check) {
  if (stale.length) {
    process.stderr.write(
      `The landing page's assets are out of date:\n  ${stale.join("\n  ")}\n` +
        "Run `node tools/sync-site-assets.mjs` and commit the result.\n",
    );
    process.exit(1);
  }
  process.stdout.write(`All ${sources.length} site assets are present and current.\n`);
  process.exit(0);
}

if (stale.length) {
  process.stderr.write(`Skipped ${stale.length}:\n  ${stale.join("\n  ")}\n`);
}
process.stdout.write(`Synced ${copied} of ${sources.length} site assets into docs/site/assets/\n`);
