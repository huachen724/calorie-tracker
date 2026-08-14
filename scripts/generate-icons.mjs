// Generates the app's PNG icons with no image-library dependency: a hand-rolled
// PNG encoder (zlib for deflate, a manual CRC32) plus simple pixel-rect drawing.
import { writeFileSync, mkdirSync } from 'node:fs';
import { deflateSync } from 'node:zlib';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const outDir = join(__dirname, '..', 'public', 'icons');
mkdirSync(outDir, { recursive: true });

const BG = [42, 120, 214, 255]; // --series-calories (light)
const FG = [255, 255, 255, 255];

let crcTable;
function crc32(buf) {
  if (!crcTable) {
    crcTable = new Uint32Array(256);
    for (let n = 0; n < 256; n++) {
      let c = n;
      for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
      crcTable[n] = c >>> 0;
    }
  }
  let crc = 0xffffffff;
  for (let i = 0; i < buf.length; i++) crc = crcTable[(crc ^ buf[i]) & 0xff] ^ (crc >>> 8);
  return (crc ^ 0xffffffff) >>> 0;
}

function chunk(type, data) {
  const typeBuf = Buffer.from(type, 'ascii');
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length, 0);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(Buffer.concat([typeBuf, data])), 0);
  return Buffer.concat([len, typeBuf, data, crc]);
}

function encodePNG(width, height, rgba) {
  const sig = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  const ihdrData = Buffer.alloc(13);
  ihdrData.writeUInt32BE(width, 0);
  ihdrData.writeUInt32BE(height, 4);
  ihdrData[8] = 8;
  ihdrData[9] = 6;
  const raw = Buffer.alloc((width * 4 + 1) * height);
  for (let y = 0; y < height; y++) {
    const rowStart = y * (width * 4 + 1);
    raw[rowStart] = 0;
    rgba.copy(raw, rowStart + 1, y * width * 4, (y + 1) * width * 4);
  }
  const idat = chunk('IDAT', deflateSync(raw, { level: 9 }));
  return Buffer.concat([sig, chunk('IHDR', ihdrData), idat, chunk('IEND', Buffer.alloc(0))]);
}

function setPixel(buf, size, x, y, color) {
  if (x < 0 || y < 0 || x >= size || y >= size) return;
  const i = (y * size + x) * 4;
  buf[i] = color[0];
  buf[i + 1] = color[1];
  buf[i + 2] = color[2];
  buf[i + 3] = color[3];
}

/** Fills a rect with rounded top corners and a square bottom (the app's bar-chart mark spec). */
function fillBarRoundedTop(buf, size, x, y, w, h, radius) {
  for (let py = y; py < y + h; py++) {
    for (let px = x; px < x + w; px++) {
      const localY = py - y;
      if (localY >= radius) {
        setPixel(buf, size, px, py, FG);
        continue;
      }
      const localX = px - x;
      const inLeftCorner = localX < radius;
      const inRightCorner = localX >= w - radius;
      if (!inLeftCorner && !inRightCorner) {
        setPixel(buf, size, px, py, FG);
        continue;
      }
      const cx = inLeftCorner ? x + radius : x + w - radius;
      const cy = y + radius;
      const dx = px - cx + 0.5;
      const dy = py - cy + 0.5;
      if (dx * dx + dy * dy <= radius * radius) setPixel(buf, size, px, py, FG);
    }
  }
}

function drawIcon(size) {
  const buf = Buffer.alloc(size * size * 4);
  for (let i = 0; i < size * size; i++) {
    buf[i * 4] = BG[0];
    buf[i * 4 + 1] = BG[1];
    buf[i * 4 + 2] = BG[2];
    buf[i * 4 + 3] = BG[3];
  }

  const barW = Math.round(size * 0.14);
  const gap = Math.round(size * 0.08);
  const radius = Math.max(2, Math.round(barW * 0.35));
  const baseline = Math.round(size * 0.72);
  const heights = [0.28, 0.44, 0.6].map((f) => Math.round(size * f));
  const totalW = barW * 3 + gap * 2;
  let x = Math.round((size - totalW) / 2);

  for (const h of heights) {
    fillBarRoundedTop(buf, size, x, baseline - h, barW, h, radius);
    x += barW + gap;
  }

  return encodePNG(size, size, buf);
}

const sizes = [32, 180, 192, 512];
for (const size of sizes) {
  const png = drawIcon(size);
  const path = join(outDir, `icon-${size}.png`);
  writeFileSync(path, png);
  console.log(`wrote ${path} (${png.length} bytes)`);
}
