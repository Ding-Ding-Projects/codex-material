/* Downloads the official Codex CLI for Windows x64 and stages it for bundling.
 *
 * Codex Studio prefers whatever `codex` the user already has — that install owns
 * their login, their `~/.codex` and their update channel, and quietly shadowing it
 * with a second copy is how you end up debugging why a machine is "logged out" in
 * one app and logged in everywhere else. The bundled copy is the fallback for a
 * machine that has none, so the app is useful the moment it is installed.
 *
 * The binary comes from the published npm package (`@openai/codex-win32-x64`),
 * which is OpenAI's own release artifact, not a mirror.
 *
 *   node tools/fetch-codex.mjs              latest published version
 *   node tools/fetch-codex.mjs 0.146.0      a specific one
 *   node tools/fetch-codex.mjs --check      report what is staged, download nothing
 */
import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync, readdirSync, statSync, cpSync, rmSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { tmpdir } from "node:os";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const dest = join(root, "vendor", "codex-bin");
const exe = join(dest, "bin", "codex.exe");
const stamp = join(root, "vendor", "codex-bin-version.json");

const args = process.argv.slice(2);

if (args.includes("--check")) {
  if (!existsSync(exe)) {
    process.stdout.write("no bundled CLI staged — run `node tools/fetch-codex.mjs`\n");
    process.exit(1);
  }
  const size = statSync(exe).size;
  process.stdout.write(`staged: ${exe} (${(size / 1_048_576).toFixed(1)} MB)\n`);
  process.exit(0);
}

/* The platform builds are published as VERSIONS of `@openai/codex`, not as separate
 * packages: `@openai/codex@0.146.0-win32-x64`. The bare `-win32-x64` package name in
 * the manifest is an npm alias, which `npm pack` will not resolve. */
const wanted = args.find((a) => !a.startsWith("--")) || "latest";
let base = wanted;
if (wanted === "latest") {
  base = execFileSync("npm", ["view", "@openai/codex", "version"], {
    encoding: "utf8",
    shell: process.platform === "win32",
  }).trim();
}
const spec = `@openai/codex@${base}-win32-x64`;

const work = join(tmpdir(), `codex-fetch-${Date.now()}`);
mkdirSync(work, { recursive: true });

process.stdout.write(`Fetching ${spec} …\n`);
let packed;
try {
  packed = execFileSync("npm", ["pack", spec, "--pack-destination", work], {
    encoding: "utf8",
    shell: process.platform === "win32",
  })
    .trim()
    .split("\n")
    .pop()
    .trim();
} catch (e) {
  process.stderr.write(
    `Could not fetch ${spec}: ${e.message}\n` +
      "The app still runs — it falls back to the `codex` already on PATH — but the\n" +
      "installer will not carry a CLI for machines that have none.\n",
  );
  process.exit(1);
}

/* GNU tar (the one Git for Windows puts on PATH) reads `C:\…` as a remote host and
 * tries to open an rsh connection to a machine called "C". Windows ships bsdtar at a
 * known path, which handles drive letters; fall back to GNU tar's --force-local. */
const systemTar = join(process.env.SystemRoot || "C:\\Windows", "System32", "tar.exe");
const tarball = join(work, packed);
if (existsSync(systemTar)) {
  execFileSync(systemTar, ["-xzf", tarball, "-C", work], { windowsHide: true });
} else {
  execFileSync("tar", ["--force-local", "-xzf", tarball, "-C", work], {
    shell: process.platform === "win32",
  });
}

/* The CLI is not a lone executable: it resolves `codex-path/rg.exe`,
 * `codex-resources/…` and the code-mode host relative to itself, so the whole
 * platform tree ships or none of it does. That tree is ~430 MB unpacked — the single
 * biggest thing in the installer by an order of magnitude, and worth knowing about
 * before wondering why a Material 3 GUI needs half a gigabyte. */
const vendorRoot = join(work, "package", "vendor", "x86_64-pc-windows-msvc");
if (!existsSync(vendorRoot)) {
  process.stderr.write(`no vendor/x86_64-pc-windows-msvc inside ${spec} — the package layout changed
`);
  process.exit(1);
}

rmSync(dest, { recursive: true, force: true });
mkdirSync(dirname(dest), { recursive: true });
cpSync(vendorRoot, dest, { recursive: true });

if (!existsSync(exe)) {
  process.stderr.write(`staged tree has no bin/codex.exe
`);
  process.exit(1);
}

let version = "unknown";
try {
  version = execFileSync(exe, ["--version"], { encoding: "utf8", windowsHide: true }).trim();
} catch {
  /* a binary that will not report its version still ships; the app reports that too */
}

function treeBytes(dir) {
  let total = 0;
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const p = join(dir, entry.name);
    total += entry.isDirectory() ? treeBytes(p) : statSync(p).size;
  }
  return total;
}
const bytes = treeBytes(dest);

writeFileSync(
  stamp,
  JSON.stringify({ spec, version, bytes, stagedAt: new Date().toISOString() }, null, 2) + "\n",
);
rmSync(work, { recursive: true, force: true });

const gb = (bytes / 1_073_741_824).toFixed(2);
process.stdout.write(
  [
    `Staged ${version || "codex"} -> vendor/codex-bin/ (${gb} GB unpacked)`,
    "Bundled so a machine with no Codex install still works. The app still prefers",
    "the user's own `codex` whenever one is on PATH.",
    "",
  ].join("\n"),
);
