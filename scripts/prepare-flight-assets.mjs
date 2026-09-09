// Format/size optimization of the AI-generated assets; no scene edits.
import { createRequire } from 'node:module';
import { mkdir } from 'node:fs/promises';
const require = createRequire(import.meta.url);
const [sharpModule, heroSource] = process.argv.slice(2);
if (!sharpModule || !heroSource) throw new Error('Usage: node scripts/prepare-flight-assets.mjs <sharp module> <hero PNG>');
const sharp = require(sharpModule);
await mkdir('public/flight', { recursive: true });
await sharp(heroSource).resize(2560, 1440, { fit: 'cover' }).webp({ quality: 88 }).toFile('public/flight/mountain-upscaled.webp');
console.log('Prepared full-screen hero.');
