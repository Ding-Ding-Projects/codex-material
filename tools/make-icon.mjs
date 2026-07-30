/* Renders the Codex Studio source icon (1024x1024 PNG) with no image dependencies.
   `npx tauri icon` fans this out into every size the Windows bundler needs.

   The mark is the app's own Material 3 primary ramp: a squircle in the M3 purple
   tones carrying a white prompt chevron and caret — a CLI, with a GUI on top. */
import { deflateSync } from "node:zlib";
import { writeFileSync, mkdirSync } from "node:fs";
import { dirname } from "node:path";

const SIZE = 1024;
const SS = 3; // supersampling factor for anti-aliasing

const hex = (h) => [
  parseInt(h.slice(1, 3), 16),
  parseInt(h.slice(3, 5), 16),
  parseInt(h.slice(5, 7), 16),
];
const A = hex("#4F378B"); // m3 primary-container (dark end)
const B = hex("#D0BCFF"); // m3 primary (light end)
const FG = [255, 255, 255];

/** Signed-distance helper: rounded rectangle centred on (cx, cy). */
function insideSquircle(x, y, cx, cy, halfW, halfH, r) {
  const dx = Math.abs(x - cx) - (halfW - r);
  const dy = Math.abs(y - cy) - (halfH - r);
  const ox = Math.max(dx, 0);
  const oy = Math.max(dy, 0);
  return Math.hypot(ox, oy) + Math.min(Math.max(dx, dy), 0) <= r;
}

/** Thick line segment test with round caps. */
function onSegment(x, y, x1, y1, x2, y2, w) {
  const vx = x2 - x1;
  const vy = y2 - y1;
  const len2 = vx * vx + vy * vy;
  const t = len2 === 0 ? 0 : Math.max(0, Math.min(1, ((x - x1) * vx + (y - y1) * vy) / len2));
  return Math.hypot(x - (x1 + t * vx), y - (y1 + t * vy)) <= w / 2;
}

const px = Buffer.alloc(SIZE * SIZE * 4);

for (let y = 0; y < SIZE; y++) {
  for (let x = 0; x < SIZE; x++) {
    let rSum = 0;
    let gSum = 0;
    let bSum = 0;
    let aSum = 0;
    for (let sy = 0; sy < SS; sy++) {
      for (let sx = 0; sx < SS; sx++) {
        const fx = x + (sx + 0.5) / SS;
        const fy = y + (sy + 0.5) / SS;
        if (!insideSquircle(fx, fy, 512, 512, 472, 472, 216)) continue;

        // Diagonal ramp across the tile, dark top-left to light bottom-right.
        const t = Math.max(0, Math.min(1, (fx + fy) / (SIZE * 2)));
        let r = A[0] + (B[0] - A[0]) * t;
        let g = A[1] + (B[1] - A[1]) * t;
        let b = A[2] + (B[2] - A[2]) * t;

        // Prompt chevron ">" and the caret underscore beside it.
        const chevron =
          onSegment(fx, fy, 348, 372, 508, 512, 78) ||
          onSegment(fx, fy, 348, 652, 508, 512, 78);
        const caret = onSegment(fx, fy, 566, 660, 716, 660, 74);
        if (chevron || caret) {
          r = FG[0];
          g = FG[1];
          b = FG[2];
        }
        rSum += r;
        gSum += g;
        bSum += b;
        aSum += 255;
      }
    }
    const n = SS * SS;
    const i = (y * SIZE + x) * 4;
    const cov = aSum / (n * 255);
    px[i] = cov ? Math.round(rSum / (n * cov)) : 0;
    px[i + 1] = cov ? Math.round(gSum / (n * cov)) : 0;
    px[i + 2] = cov ? Math.round(bSum / (n * cov)) : 0;
    px[i + 3] = Math.round(aSum / n);
  }
}

/* --- minimal PNG writer (RGBA, filter type 0) --- */
const raw = Buffer.alloc((SIZE * 4 + 1) * SIZE);
for (let y = 0; y < SIZE; y++) {
  raw[y * (SIZE * 4 + 1)] = 0;
  px.copy(raw, y * (SIZE * 4 + 1) + 1, y * SIZE * 4, (y + 1) * SIZE * 4);
}
const chunk = (type, data) => {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length);
  const body = Buffer.concat([Buffer.from(type, "latin1"), data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(body) >>> 0);
  return Buffer.concat([len, body, crc]);
};
let CRC_TABLE = null;
function crc32(buf) {
  if (!CRC_TABLE) {
    CRC_TABLE = new Int32Array(256);
    for (let n = 0; n < 256; n++) {
      let c = n;
      for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
      CRC_TABLE[n] = c;
    }
  }
  let c = -1;
  for (let i = 0; i < buf.length; i++) c = CRC_TABLE[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  return c ^ -1;
}
const ihdr = Buffer.alloc(13);
ihdr.writeUInt32BE(SIZE, 0);
ihdr.writeUInt32BE(SIZE, 4);
ihdr[8] = 8; // bit depth
ihdr[9] = 6; // colour type RGBA
const png = Buffer.concat([
  Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
  chunk("IHDR", ihdr),
  chunk("IDAT", deflateSync(raw, { level: 9 })),
  chunk("IEND", Buffer.alloc(0)),
]);

const out = process.argv[2] || "assets/icon-source.png";
mkdirSync(dirname(out), { recursive: true });
writeFileSync(out, png);
console.log(`wrote ${out} (${png.length} bytes)`);
