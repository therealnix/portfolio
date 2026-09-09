import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const [sharpModule, cleanPlate] = process.argv.slice(2);
if (!sharpModule || !cleanPlate) throw new Error('Provide Sharp module path and generated clean-plate PNG.');
const sharp = require(sharpModule);
// Compression only: masks and projection are code-native geometry in photo-scene.ts.
await sharp(cleanPlate).webp({ quality: 93 }).toFile('public/flight/mountain-clean.webp');
