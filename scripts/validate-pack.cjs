#!/usr/bin/env node
const fs = require('node:fs');
const path = require('node:path');

const MAX_FILES = 96;
const MAX_TOTAL_BYTES = 64 * 1024 * 1024;
const MAX_ASSET_BYTES = 4 * 1024 * 1024;
const MAX_MANIFEST_BYTES = 128 * 1024;
const MAX_IMAGE_DIMENSION = 8192;
const MAX_IMAGE_PIXELS = 16_777_216;
const PACK_ID_RE = /^[a-z0-9][a-z0-9._-]{2,63}$/;
const SEMVERISH_RE = /^v?\d+\.\d+\.\d+(?:[-+][0-9A-Za-z.-]+)?$/;
const REQUIRED = ['trophy.bronze', 'trophy.silver', 'trophy.gold', 'trophy.platinum'];
const SOUND_KEYS = ['toast.bronze', 'toast.silver', 'toast.gold', 'toast.platinum'];
const IMAGE_EXTS = new Set(['.png', '.jpg', '.jpeg', '.webp']);
const AUDIO_EXTS = new Set(['.wav', '.ogg']);
const FILE_EXTS = new Set([...IMAGE_EXTS, ...AUDIO_EXTS]);

function fail(message) { throw new Error(message); }
function safeRelative(relative) {
  const normalized = relative.replaceAll('\\', '/');
  if (!normalized || normalized.length > 240) fail(`Unsafe path length: ${relative}`);
  if (/^[A-Za-z]:/.test(normalized) || normalized.startsWith('/') || normalized.startsWith('//')) fail(`Absolute path forbidden: ${relative}`);
  if (normalized.split('/').some((part) => !part || part === '.' || part === '..')) fail(`Traversal/ambiguous path forbidden: ${relative}`);
  if (/[<>:"|?*\0]/.test(normalized)) fail(`Unsafe filename: ${relative}`);
  if (normalized.startsWith('resources/')) fail(`User pack cannot reference bundled resources: ${relative}`);
  return normalized;
}
function readUInt24LE(buffer, offset) {
  return buffer[offset] | (buffer[offset + 1] << 8) | (buffer[offset + 2] << 16);
}
function imageDimensions(ext, buffer) {
  if (ext === '.png') {
    if (buffer.length < 24) fail('Truncated PNG.');
    return { width: buffer.readUInt32BE(16), height: buffer.readUInt32BE(20) };
  }
  if (ext === '.jpg' || ext === '.jpeg') {
    let offset = 2;
    while (offset + 4 <= buffer.length) {
      if (buffer[offset] !== 0xff) { offset += 1; continue; }
      while (offset < buffer.length && buffer[offset] === 0xff) offset += 1;
      const marker = buffer[offset++];
      if (marker === 0xd8 || marker === 0xd9) continue;
      if (marker === 0xda) break;
      if (offset + 2 > buffer.length) break;
      const length = buffer.readUInt16BE(offset);
      if (length < 2 || offset + length > buffer.length) break;
      const sof = (marker >= 0xc0 && marker <= 0xc3) || (marker >= 0xc5 && marker <= 0xc7) || (marker >= 0xc9 && marker <= 0xcb) || (marker >= 0xcd && marker <= 0xcf);
      if (sof) {
        if (length < 7) break;
        return { height: buffer.readUInt16BE(offset + 3), width: buffer.readUInt16BE(offset + 5) };
      }
      offset += length;
    }
    fail('JPEG dimensions unavailable.');
  }
  if (ext === '.webp') {
    if (buffer.length < 30) fail('Truncated WebP.');
    const kind = buffer.subarray(12, 16).toString('ascii');
    if (kind === 'VP8X') return { width: readUInt24LE(buffer, 24) + 1, height: readUInt24LE(buffer, 27) + 1 };
    if (kind === 'VP8L') {
      if (buffer[20] !== 0x2f) fail('Invalid VP8L header.');
      const b1 = buffer[21], b2 = buffer[22], b3 = buffer[23], b4 = buffer[24];
      return { width: 1 + (b1 | ((b2 & 0x3f) << 8)), height: 1 + ((b2 >> 6) | (b3 << 2) | ((b4 & 0x0f) << 10)) };
    }
    if (kind === 'VP8 ') {
      if (buffer.length < 30 || buffer[23] !== 0x9d || buffer[24] !== 0x01 || buffer[25] !== 0x2a) fail('Invalid VP8 header.');
      return { width: buffer.readUInt16LE(26) & 0x3fff, height: buffer.readUInt16LE(28) & 0x3fff };
    }
    fail('Unsupported WebP chunk.');
  }
  return null;
}
function validateImageDimensions(filename, buffer) {
  const ext = path.extname(filename).toLowerCase();
  if (!IMAGE_EXTS.has(ext)) return;
  const dimensions = imageDimensions(ext, buffer);
  if (!dimensions || dimensions.width < 1 || dimensions.height < 1) fail(`Invalid image dimensions: ${filename}`);
  if (dimensions.width > MAX_IMAGE_DIMENSION || dimensions.height > MAX_IMAGE_DIMENSION || dimensions.width * dimensions.height > MAX_IMAGE_PIXELS) {
    fail(`Image dimensions exceed safe decoder budget: ${filename} (${dimensions.width}x${dimensions.height})`);
  }
}
function checkMagic(filename, buffer) {
  const ext = path.extname(filename).toLowerCase();
  let valid = false;
  if (ext === '.png' && buffer.subarray(0, 8).equals(Buffer.from([137,80,78,71,13,10,26,10]))) valid = true;
  else if ((ext === '.jpg' || ext === '.jpeg') && buffer.length >= 4 && buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[buffer.length - 2] === 0xff && buffer[buffer.length - 1] === 0xd9) valid = true;
  else if (ext === '.webp' && buffer.subarray(0,4).toString('ascii') === 'RIFF' && buffer.subarray(8,12).toString('ascii') === 'WEBP') valid = true;
  else if (ext === '.wav' && buffer.subarray(0,4).toString('ascii') === 'RIFF' && buffer.subarray(8,12).toString('ascii') === 'WAVE') valid = true;
  else if (ext === '.ogg' && buffer.subarray(0,4).toString('ascii') === 'OggS') valid = true;
  if (!valid) fail(`File contents do not match supported declared type: ${filename}`);
  validateImageDimensions(filename, buffer);
}
function walk(root, current = root, out = []) {
  for (const name of fs.readdirSync(current)) {
    const full = path.join(current, name);
    const stat = fs.lstatSync(full);
    if (stat.isSymbolicLink()) fail(`Symlink forbidden: ${path.relative(root, full)}`);
    if (stat.isDirectory()) walk(root, full, out);
    else if (stat.isFile()) out.push({ full, relative: safeRelative(path.relative(root, full)), size: stat.size });
    else fail(`Unsupported filesystem entry: ${path.relative(root, full)}`);
    if (out.length > MAX_FILES) fail(`Pack exceeds ${MAX_FILES} files.`);
  }
  return out;
}
function validateManifest(value) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) fail('manifest.json must contain an object.');
  const allowedTop = new Set(['manifestVersion','id','name','version','author','description','license','homepage','tags','accentColor','attribution','type','minSteamTrophiesVersion','assets','customTrophies','sounds','preview','recommendedFor']);
  for (const key of Object.keys(value)) if (!allowedTop.has(key)) fail(`Unknown manifest field: ${key}`);
  if (value.manifestVersion !== 1) fail('manifestVersion must be 1.');
  if (value.type !== 'trophy-icon-pack') fail('type must be trophy-icon-pack.');
  if (typeof value.id !== 'string' || !PACK_ID_RE.test(value.id) || value.id.startsWith('builtin.')) fail('Invalid/reserved pack id.');
  if (typeof value.name !== 'string' || value.name.trim().length < 1 || value.name.length > 80) fail('Invalid pack name.');
  if (typeof value.version !== 'string' || !SEMVERISH_RE.test(value.version) || value.version.length > 40) fail('Invalid semantic version.');
  if (typeof value.author !== 'string' || value.author.trim().length < 1 || value.author.length > 80) fail('Invalid author.');
  if (value.homepage != null && (typeof value.homepage !== 'string' || !value.homepage.startsWith('https://') || value.homepage.length > 300)) fail('homepage must be an https URL.');
  if (value.tags != null && (!Array.isArray(value.tags) || value.tags.length > 12 || value.tags.some((tag) => typeof tag !== 'string' || !tag || tag.length > 32))) fail('Invalid tags.');
  if (value.accentColor != null && (typeof value.accentColor !== 'string' || !/^#[0-9a-fA-F]{6}$/.test(value.accentColor))) fail('Invalid accentColor.');
  if (value.recommendedFor != null && (!Array.isArray(value.recommendedFor) || value.recommendedFor.some((surface) => !['desktop','big_picture','deck'].includes(surface)))) fail('Invalid recommendedFor.');
  if (!value.assets || typeof value.assets !== 'object' || Array.isArray(value.assets)) fail('Missing assets object.');
  for (const key of Object.keys(value.assets)) if (!REQUIRED.includes(key)) fail(`Unknown asset key: ${key}`);
  for (const key of REQUIRED) validateDeclaredPath(value.assets[key], IMAGE_EXTS, `Missing/invalid ${key}`);
  if (value.customTrophies != null) {
    if (typeof value.customTrophies !== 'object' || Array.isArray(value.customTrophies) || Object.keys(value.customTrophies).length > 48) fail('customTrophies must be an object with at most 48 entries.');
    for (const [key, relative] of Object.entries(value.customTrophies)) {
      if (!/^custom\.[a-z0-9][a-z0-9._-]{0,63}$/.test(key)) fail(`Invalid custom trophy key: ${key}`);
      validateDeclaredPath(relative, IMAGE_EXTS, `Invalid custom trophy ${key}`);
    }
  }
  if (value.sounds != null) {
    if (typeof value.sounds !== 'object' || Array.isArray(value.sounds)) fail('sounds must be an object.');
    for (const [key, relative] of Object.entries(value.sounds)) {
      if (!SOUND_KEYS.includes(key)) fail(`Unknown sound key: ${key}`);
      validateDeclaredPath(relative, AUDIO_EXTS, `Invalid sound ${key}`);
    }
  }
  if (value.preview != null) validateDeclaredPath(value.preview, IMAGE_EXTS, 'Invalid preview');
  return value;
}
function validateDeclaredPath(value, extensions, message) {
  if (typeof value !== 'string') fail(message);
  const relative = safeRelative(value);
  if (!extensions.has(path.extname(relative).toLowerCase())) fail(`${message}: ${relative}`);
}
function main() {
  const requested = process.argv[2];
  if (!requested) fail('Usage: npm run pack:validate -- /path/to/pack-folder');
  const root = fs.realpathSync(requested);
  const rootStat = fs.lstatSync(root);
  if (!rootStat.isDirectory() || rootStat.isSymbolicLink()) fail('Pack source must be a real directory, not a symlink.');
  const entries = walk(root);
  const byRelative = new Map(entries.map((entry) => [entry.relative, entry]));
  const manifestEntry = byRelative.get('manifest.json');
  if (!manifestEntry) fail('Pack folder must contain manifest.json at its root.');
  if (manifestEntry.size > MAX_MANIFEST_BYTES) fail('manifest.json exceeds 128 KiB.');
  let total = 0;
  for (const entry of entries) {
    total += entry.size;
    if (total > MAX_TOTAL_BYTES) fail('Pack exceeds 64 MiB total.');
    if (entry.relative !== 'manifest.json' && !FILE_EXTS.has(path.extname(entry.relative).toLowerCase())) fail(`Unexpected file type: ${entry.relative}`);
  }
  const manifest = validateManifest(JSON.parse(fs.readFileSync(manifestEntry.full, 'utf8')));
  const declared = [
    ...REQUIRED.map((key) => [key, manifest.assets[key]]),
    ...Object.entries(manifest.customTrophies ?? {}),
    ...Object.entries(manifest.sounds ?? {}),
    ...(manifest.preview ? [['preview', manifest.preview]] : []),
  ];
  const declaredPaths = new Set(declared.map(([, relative]) => safeRelative(relative)));
  for (const entry of entries) if (entry.relative !== 'manifest.json' && !declaredPaths.has(entry.relative)) fail(`Undeclared file forbidden: ${entry.relative}`);
  for (const [label, relativeRaw] of declared) {
    const relative = safeRelative(relativeRaw);
    const entry = byRelative.get(relative);
    if (!entry) fail(`${label} points to missing file: ${relative}`);
    if (entry.size > MAX_ASSET_BYTES) fail(`${relative} exceeds 4 MiB.`);
    checkMagic(entry.full, fs.readFileSync(entry.full));
  }
  console.log(`✓ ${manifest.name} (${manifest.id}) v${manifest.version}`);
  console.log(`  ${entries.length} files, ${(total / 1024).toFixed(1)} KiB, ${declared.length} declared resources verified.`);
}
try { main(); } catch (error) { console.error(`✗ ${error.message}`); process.exitCode = 1; }
