// Generates PWA PNG icons (192 & 512) with a tiny zero-dependency PNG encoder.
// Draws the Macro Katori mark: charcoal rounded square, saffron katori bowl,
// emerald steam. Run once: `node scripts/generate-icons.js`.

import { deflateSync } from 'node:zlib';
import { mkdirSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const outDir = join(__dirname, '..', 'public', 'icons');
mkdirSync(outDir, { recursive: true });

const hex = (h) => [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)];
const CHARCOAL = hex('#1a1c1e');
const SAFFRON = hex('#f5a623');
const SAFFRON_L = hex('#ffc15e');
const EMERALD = hex('#1fb574');
const EMERALD_L = hex('#36d995');

function render(size) {
  const s = size;
  const px = Buffer.alloc(s * s * 4);
  const set = (x, y, [r, g, b], a = 255) => {
    if (x < 0 || y < 0 || x >= s || y >= s) return;
    const i = (y * s + x) * 4;
    px[i] = r; px[i + 1] = g; px[i + 2] = b; px[i + 3] = a;
  };
  // background rounded square
  const radius = s * 0.22;
  for (let y = 0; y < s; y++) {
    for (let x = 0; x < s; x++) {
      const inRound =
        (x >= radius && x < s - radius) ||
        (y >= radius && y < s - radius) ||
        ((x - radius) ** 2 + (y - radius) ** 2 < radius ** 2) ||
        ((x - (s - radius)) ** 2 + (y - radius) ** 2 < radius ** 2) ||
        ((x - radius) ** 2 + (y - (s - radius)) ** 2 < radius ** 2) ||
        ((x - (s - radius)) ** 2 + (y - (s - radius)) ** 2 < radius ** 2);
      set(x, y, CHARCOAL, inRound ? 255 : 0);
    }
  }
  // katori bowl: a half-ellipse from rim line downward
  const cx = s * 0.5;
  const rimY = s * 0.46;
  const rx = s * 0.30;
  const ry = s * 0.34;
  for (let y = 0; y < s; y++) {
    for (let x = 0; x < s; x++) {
      const nx = (x - cx) / rx;
      const ny = (y - rimY) / ry;
      if (ny >= 0 && nx * nx + ny * ny <= 1) set(x, y, SAFFRON);
    }
  }
  // rim ellipse (lighter)
  const rimRy = s * 0.06;
  for (let y = 0; y < s; y++) {
    for (let x = 0; x < s; x++) {
      const nx = (x - cx) / rx;
      const ny = (y - rimY) / rimRy;
      if (nx * nx + ny * ny <= 1) set(x, y, SAFFRON_L);
    }
  }
  // steam: three vertical emerald strokes above the rim
  const drawStroke = (sx, col) => {
    const w = Math.max(2, s * 0.022);
    for (let y = s * 0.16; y < s * 0.40; y++) {
      const wobble = Math.sin((y / s) * 26) * s * 0.03;
      for (let dx = -w; dx <= w; dx++) set(Math.round(sx + wobble + dx), Math.round(y), col);
    }
  };
  drawStroke(s * 0.40, EMERALD);
  drawStroke(s * 0.5, EMERALD_L);
  drawStroke(s * 0.60, EMERALD);
  return { px, s };
}

// --- minimal PNG encoder ---
function crc32(buf) {
  let c = ~0;
  for (let i = 0; i < buf.length; i++) {
    c ^= buf[i];
    for (let k = 0; k < 8; k++) c = (c >>> 1) ^ (0xedb88320 & -(c & 1));
  }
  return ~c >>> 0;
}
function chunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length, 0);
  const typeBuf = Buffer.from(type, 'ascii');
  const crcBuf = Buffer.alloc(4);
  crcBuf.writeUInt32BE(crc32(Buffer.concat([typeBuf, data])), 0);
  return Buffer.concat([len, typeBuf, data, crcBuf]);
}
function encodePNG({ px, s }) {
  const sig = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(s, 0);
  ihdr.writeUInt32BE(s, 4);
  ihdr[8] = 8; ihdr[9] = 6; // 8-bit, RGBA
  const raw = Buffer.alloc((s * 4 + 1) * s);
  for (let y = 0; y < s; y++) {
    raw[y * (s * 4 + 1)] = 0; // filter none
    px.copy(raw, y * (s * 4 + 1) + 1, y * s * 4, (y + 1) * s * 4);
  }
  const idat = deflateSync(raw, { level: 9 });
  return Buffer.concat([sig, chunk('IHDR', ihdr), chunk('IDAT', idat), chunk('IEND', Buffer.alloc(0))]);
}

for (const size of [192, 512]) {
  const png = encodePNG(render(size));
  writeFileSync(join(outDir, `icon-${size}.png`), png);
  console.log(`wrote icons/icon-${size}.png (${png.length} bytes)`);
}
