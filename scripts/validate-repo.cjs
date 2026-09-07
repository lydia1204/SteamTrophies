#!/usr/bin/env node
const fs = require('node:fs');
const path = require('node:path');
const { spawnSync } = require('node:child_process');
const ROOT = path.resolve(__dirname, '..');
const errors = [];

function walk(dir, out = []) {
  if (!fs.existsSync(dir)) return out;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (['node_modules','.millennium','.test-build','dist','.git'].includes(entry.name)) continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full, out); else if (entry.isFile()) out.push(full);
  }
  return out;
}
const files = walk(ROOT);
for (const file of files) {
  const rel = path.relative(ROOT, file).replaceAll('\\','/');
  if (/\.(?:cjs|mjs|js)$/.test(file)) {
    const result = spawnSync(process.execPath, ['--check', file], { encoding: 'utf8' });
    if (result.status !== 0) errors.push(`${rel}: Node syntax check failed: ${result.stderr.trim()}`);
  }
  if (/\.json$/.test(file)) {
    try { JSON.parse(fs.readFileSync(file, 'utf8')); } catch (error) { errors.push(`${rel}: invalid JSON: ${error.message}`); }
  }
}
const toml = fs.readFileSync(path.join(ROOT,'millennium.toml'),'utf8');
for (const section of ['[plugin]','[assets]','[backend]','[frontend]','[compiler]']) if (!toml.includes(section)) errors.push(`millennium.toml missing ${section}`);
for (const required of ['id = "dev.steamtrophies.client"','entry = "backend/main.lua"','entry = "frontend/index.tsx"']) if (!toml.includes(required)) errors.push(`millennium.toml missing required contract: ${required}`);
const packageJson = JSON.parse(fs.readFileSync(path.join(ROOT,'package.json'),'utf8'));
if (!packageJson.private) errors.push('package.json must remain private to prevent accidental npm publish');
if (packageJson.devDependencies?.['@steambrew/starlight'] !== '1.1.4') errors.push('Starlight must be pinned to audited RC version 1.1.4');
if (fs.existsSync(path.join(ROOT,'package-lock.json'))) {
  const lock = JSON.parse(fs.readFileSync(path.join(ROOT,'package-lock.json'),'utf8'));
  if (!lock.lockfileVersion) errors.push('package-lock.json exists but is invalid');
}
const sourceMarkers = files.filter((f)=>/\.(?:ts|tsx|lua|py)$/.test(f) && !f.includes(`${path.sep}docs${path.sep}`));
for (const file of sourceMarkers) {
  const text = fs.readFileSync(file,'utf8');
  const rel = path.relative(ROOT,file).replaceAll('\\','/');
  const matches = text.match(/\b(?:TODO|FIXME|HACK)\b/g);
  if (matches && !rel.endsWith('backend/main.lua')) errors.push(`${rel}: unresolved ${matches.join(', ')} marker`);
}
if (errors.length) { console.error('Repository validation failed:'); errors.forEach((e)=>console.error(`  ✗ ${e}`)); process.exit(1); }
console.log(`Repository syntax/structure validation passed across ${files.length} files.`);
console.log(`Checked ${files.filter((f)=>/\.(?:cjs|mjs|js)$/.test(f)).length} Node scripts and ${files.filter((f)=>/\.json$/.test(f)).length} JSON files.`);
