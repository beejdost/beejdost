import fs from 'fs';
import path from 'path';
import zlib from 'zlib';

function createPng(width, height, r, g, b) {
  // PNG Signature
  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

  // IHDR Chunk
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr.writeUInt8(8, 8); // 8-bit depth
  ihdr.writeUInt8(2, 9); // Color type 2 (RGB)
  ihdr.writeUInt8(0, 10); // Compression
  ihdr.writeUInt8(0, 11); // Filter
  ihdr.writeUInt8(0, 12); // Interlace

  const ihdrChunk = createChunk('IHDR', ihdr);

  // Scanlines: 1 filter byte (0) + 3 bytes per pixel
  const rowSize = 1 + width * 3;
  const rawData = Buffer.alloc(rowSize * height);

  for (let y = 0; y < height; y++) {
    const rowOffset = y * rowSize;
    rawData[rowOffset] = 0; // Filter byte: None

    for (let x = 0; x < width; x++) {
      const pixelOffset = rowOffset + 1 + x * 3;
      // Draw a subtle leaf/circle pattern
      const dx = x - width / 2;
      const dy = y - height / 2;
      const dist = Math.sqrt(dx * dx + dy * dy);
      const radius = width * 0.38;

      if (dist < radius) {
        // Inner circle: seedling color (golden harvest or bright green)
        if (dy > -radius * 0.4 && dy < radius * 0.6 && Math.abs(dx) < radius * 0.45) {
          rawData[pixelOffset] = 234;     // R (Amber/Golden)
          rawData[pixelOffset + 1] = 179; // G
          rawData[pixelOffset + 2] = 8;   // B
        } else {
          rawData[pixelOffset] = Math.min(255, r + 40);
          rawData[pixelOffset + 1] = Math.min(255, g + 50);
          rawData[pixelOffset + 2] = Math.min(255, b + 30);
        }
      } else {
        // Background color: deep emerald green
        rawData[pixelOffset] = r;
        rawData[pixelOffset + 1] = g;
        rawData[pixelOffset + 2] = b;
      }
    }
  }

  const compressed = zlib.deflateSync(rawData);
  const idatChunk = createChunk('IDAT', compressed);
  const iendChunk = createChunk('IEND', Buffer.alloc(0));

  return Buffer.concat([signature, ihdrChunk, idatChunk, iendChunk]);
}

function createChunk(type, data) {
  const length = data.length;
  const header = Buffer.alloc(8);
  header.writeUInt32BE(length, 0);
  header.write(type, 4, 4, 'ascii');

  const crcPayload = Buffer.concat([Buffer.from(type, 'ascii'), data]);
  const crc = crc32(crcPayload);

  const footer = Buffer.alloc(4);
  footer.writeUInt32BE(crc, 0);

  return Buffer.concat([header, data, footer]);
}

// Standard CRC32
function crc32(buf) {
  let crc = 0xffffffff;
  for (let i = 0; i < buf.length; i++) {
    const byte = buf[i];
    crc = crc ^ byte;
    for (let j = 0; j < 8; j++) {
      const mask = -(crc & 1);
      crc = (crc >>> 1) ^ (0xedb88320 & mask);
    }
  }
  return (crc ^ 0xffffffff) >>> 0;
}

const iconsDir = path.resolve('public/icons');
fs.mkdirSync(iconsDir, { recursive: true });

// Primary colors: Emerald Green (#1b4332 = 27, 67, 50)
const icon192 = createPng(192, 192, 27, 67, 50);
fs.writeFileSync(path.join(iconsDir, 'icon-192x192.png'), icon192);

const icon512 = createPng(512, 512, 27, 67, 50);
fs.writeFileSync(path.join(iconsDir, 'icon-512x512.png'), icon512);

const iconMaskable = createPng(512, 512, 18, 48, 36);
fs.writeFileSync(path.join(iconsDir, 'icon-maskable-512x512.png'), iconMaskable);

// Also generate apple-touch-icon and favicon
fs.writeFileSync(path.resolve('public/apple-touch-icon.png'), icon192);

// Generate SVG Icon
const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="100" height="100">
  <circle cx="50" cy="50" r="48" fill="#1b4332" stroke="#2d6a4f" stroke-width="4"/>
  <path d="M50 20 C65 20, 75 35, 75 50 C75 68, 60 80, 50 82 C40 80, 25 68, 25 50 C25 35, 35 20, 50 20 Z" fill="#2d6a4f"/>
  <path d="M50 24 C50 50, 42 70, 36 74" stroke="#d97706" stroke-width="3" stroke-linecap="round" fill="none"/>
  <path d="M50 45 C58 42, 66 46, 68 52" stroke="#52b788" stroke-width="2.5" stroke-linecap="round" fill="none"/>
  <path d="M48 60 C56 58, 62 62, 64 68" stroke="#52b788" stroke-width="2.5" stroke-linecap="round" fill="none"/>
  <circle cx="50" cy="22" r="3" fill="#d97706"/>
</svg>`;
fs.writeFileSync(path.resolve('public/favicon.svg'), svg);
fs.writeFileSync(path.resolve('public/masked-icon.svg'), svg);

// Create _redirects for Cloudflare Pages SPA routing
fs.writeFileSync(path.resolve('public/_redirects'), '/*    /index.html   200\n');

console.log('Successfully created PWA icons, favicon, and Cloudflare Pages _redirects');
