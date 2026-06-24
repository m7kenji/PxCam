import fs from 'fs';
import path from 'path';
import zlib from 'zlib';
import { fileURLToPath } from 'url';

// Resolve directory name in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Helper to write grayscale PNG files using Node's zlib and fs
function writePng(filePath, width, height, grayscaleData) {
  const signature = Buffer.from([0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A]);
  
  // Create CRC32 table
  const crcTable = [];
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) {
      c = ((c & 1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1));
    }
    crcTable[n] = c;
  }
  
  function crc32(buf) {
    let crc = 0xFFFFFFFF;
    for (let i = 0; i < buf.length; i++) {
      crc = crcTable[(crc ^ buf[i]) & 0xFF] ^ (crc >>> 8);
    }
    return (crc ^ 0xFFFFFFFF) >>> 0;
  }
  
  function createChunk(type, data) {
    const len = Buffer.alloc(4);
    len.writeUInt32BE(data.length, 0);
    
    const typeBuf = Buffer.from(type, 'ascii');
    const crc = Buffer.alloc(4);
    const crcVal = crc32(Buffer.concat([typeBuf, data]));
    crc.writeUInt32BE(crcVal, 0);
    
    return Buffer.concat([len, typeBuf, data, crc]);
  }
  
  const ihdrData = Buffer.alloc(13);
  ihdrData.writeUInt32BE(width, 0);
  ihdrData.writeUInt32BE(height, 4);
  ihdrData[8] = 8;  // bit depth: 8
  ihdrData[9] = 0;  // color type: 0 (grayscale)
  ihdrData[10] = 0; // compression method: 0 (deflate)
  ihdrData[11] = 0; // filter method: 0
  ihdrData[12] = 0; // interlace method: 0
  
  const ihdr = createChunk('IHDR', ihdrData);
  
  const scanlines = [];
  for (let y = 0; y < height; y++) {
    scanlines.push(0); // filter type 0 (none)
    for (let x = 0; x < width; x++) {
      scanlines.push(grayscaleData[y * width + x]);
    }
  }
  
  const compressed = zlib.deflateSync(Buffer.from(scanlines));
  const idat = createChunk('IDAT', compressed);
  const iend = createChunk('IEND', Buffer.alloc(0));
  
  fs.writeFileSync(filePath, Buffer.concat([signature, ihdr, idat, iend]));
}

// Dynamically extract this.presets from App.js to avoid duplicating data
const appJsPath = path.join(__dirname, '..', 'src', 'App.js');
const appJsContent = fs.readFileSync(appJsPath, 'utf8');

// Regex to grab this.presets array definition from constructor
const presetsRegex = /this\.presets\s*=\s*([\s\S]+?);\r?\n\s*\r?\n\s*\/\/ Premium Industrial Palettes/;
const match = appJsContent.match(presetsRegex);

if (!match) {
  console.error('Failed to extract presets from src/App.js');
  process.exit(1);
}

const presetsStr = match[1];
const getPresets = new Function(`return ${presetsStr};`);
const presets = getPresets();

const outputDir = path.join(__dirname, '..', 'public', 'patterns');
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

console.log(`Extracting presets from ${appJsPath}...`);
console.log(`Generating templates for ${presets.length} presets in ${outputDir}...`);

presets.forEach((preset) => {
  const { name, patterns8, patterns16 } = preset;

  // 1. Pack and write 8x8 pattern
  const data8 = [];
  const width8 = 32;
  const height8 = 8;
  for (let y = 0; y < height8; y++) {
    for (let s = 0; s < 4; s++) {
      const tone = patterns8[s];
      for (let x = 0; x < 8; x++) {
        data8.push(tone[y * 8 + x] === 1 ? 255 : 0);
      }
    }
  }
  const file8 = path.join(outputDir, `${name}_8.png`);
  writePng(file8, width8, height8, data8);

  // 2. Pack and write 16x16 pattern
  const data16 = [];
  const width16 = 64;
  const height16 = 16;
  for (let y = 0; y < height16; y++) {
    for (let s = 0; s < 4; s++) {
      const tone = patterns16[s];
      for (let x = 0; x < 16; x++) {
        data16.push(tone[y * 16 + x] === 1 ? 255 : 0);
      }
    }
  }
  const file16 = path.join(outputDir, `${name}_16.png`);
  writePng(file16, width16, height16, data16);

  console.log(`  - Generated: ${name}_8.png & ${name}_16.png`);
});

console.log('\nAll pattern templates successfully generated!');
