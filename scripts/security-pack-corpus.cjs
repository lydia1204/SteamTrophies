#!/usr/bin/env node
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { spawnSync } = require('node:child_process');

const ROOT = path.resolve(__dirname, '..');
const TEMPLATE = path.join(ROOT, 'examples/trophy-pack-template');
const VALIDATOR = path.join(ROOT, 'scripts/validate-pack.cjs');
const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'stt-pack-corpus-'));

function copyTemplate(name) {
  const target = path.join(tempRoot, name);
  fs.cpSync(TEMPLATE, target, { recursive: true });
  return target;
}
function readManifest(dir) { return JSON.parse(fs.readFileSync(path.join(dir, 'manifest.json'), 'utf8')); }
function writeManifest(dir, manifest) { fs.writeFileSync(path.join(dir, 'manifest.json'), `${JSON.stringify(manifest, null, 2)}\n`); }
function run(dir) { return spawnSync(process.execPath, [VALIDATOR, dir], { encoding: 'utf8' }); }
function expect(name, mutate, shouldPass = false) {
  const dir = copyTemplate(name.replace(/[^a-z0-9]+/gi, '-').toLowerCase());
  mutate?.(dir);
  const result = run(dir);
  const passed = result.status === 0;
  if (passed !== shouldPass) {
    console.error(`✗ ${name}: expected ${shouldPass ? 'pass' : 'rejection'} but validator ${passed ? 'accepted' : 'rejected'}`);
    console.error(result.stdout, result.stderr);
    return false;
  }
  console.log(`✓ ${name}: ${shouldPass ? 'accepted control' : 'rejected'}`);
  return true;
}

const results = [];
results.push(expect('valid control pack', null, true));
results.push(expect('path traversal', (dir) => { const m = readManifest(dir); m.assets['trophy.bronze'] = '../evil.png'; writeManifest(dir, m); }));
results.push(expect('absolute path', (dir) => { const m = readManifest(dir); m.assets['trophy.bronze'] = '/tmp/evil.png'; writeManifest(dir, m); }));
results.push(expect('reserved builtin namespace', (dir) => { const m = readManifest(dir); m.id = 'builtin.stolen'; writeManifest(dir, m); }));
results.push(expect('executable masquerading as PNG', (dir) => { fs.writeFileSync(path.join(dir, 'trophies/bronze.png'), Buffer.from('MZnot-a-png')); }));
results.push(expect('oversized individual asset', (dir) => { fs.writeFileSync(path.join(dir, 'trophies/bronze.png'), Buffer.alloc(4 * 1024 * 1024 + 1)); }));
results.push(expect('decoder bomb image dimensions', (dir) => {
  const file = path.join(dir, 'trophies/bronze.png'); const b = fs.readFileSync(file); b.writeUInt32BE(9000, 16); b.writeUInt32BE(9000, 20); fs.writeFileSync(file, b);
}));
results.push(expect('undeclared payload', (dir) => { fs.writeFileSync(path.join(dir, 'surprise.bin'), 'payload'); }));
results.push(expect('unknown manifest capability', (dir) => { const m = readManifest(dir); m.script = 'evil.js'; writeManifest(dir, m); }));
results.push(expect('malformed manifest JSON', (dir) => { fs.writeFileSync(path.join(dir, 'manifest.json'), '{ nope'); }));

try {
  const dir = copyTemplate('symlink');
  fs.symlinkSync(path.join(dir, 'trophies/gold.png'), path.join(dir, 'trophies/link.png'));
  const result = run(dir);
  if (result.status === 0) { results.push(false); console.error('✗ symlink entry was accepted'); }
  else console.log('✓ symlink entry: rejected (extra platform-supported attack)');
} catch { console.log('• symlink attack skipped: platform/permissions do not permit creating test symlink'); }

fs.rmSync(tempRoot, { recursive: true, force: true });
if (results.some((value) => !value)) process.exit(1);
console.log(`Pack security corpus passed ${results.length}/${results.length} deterministic cases.`);
