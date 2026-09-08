// Read-only integration check against an explicitly supplied installed Steam chunk.
const fs = require('node:fs');
const assert = require('node:assert/strict');
const vm = require('node:vm');
const path = require('node:path');
const file = process.argv[2];
assert.ok(file, 'Supply the installed Steam chunk path');
assert.equal(path.basename(file), 'chunk~2dcc5aaf7.js', 'Unverified Steam build: do not install this hook');
const lua = fs.readFileSync(path.join(__dirname, '../backend/main.lua'), 'utf8');
const find = new RegExp(lua.match(/find = \[=\[([\s\S]*?)\]=\]/)[1], 'g');
const match = new RegExp(lua.match(/match = \[\[([\s\S]*?)\]\]/)[1], 'g');
const replace = lua.match(/replace = \[\[([\s\S]*?)\]\]/)[1].replace('#{{self}}', 'globalThis.SteamTrophies');
const source = fs.readFileSync(file, 'utf8');
const regions = [...source.matchAll(find)];
assert.equal(regions.length, 1, 'Header must match exactly once');
assert.equal([...regions[0][0].matchAll(match)].length, 1, 'Notification must match exactly once');
const patched = source.replace(find, region => region.replace(match, replace));
const controls = /\(0,i\.jsx\)\([a-zA-Z_$]+,\{\}\)/g;
assert.deepEqual([...patched.matchAll(controls)].map(m => m[0]), [...source.matchAll(controls)].map(m => m[0]), 'Native controls must be unchanged');
assert.equal((patched.match(/hookedToolbar/g) || []).length, 1);
assert.ok(patched.includes('(0,i.jsx)(dr,{}),(0,i.jsx)(globalThis.SteamTrophies?.hookedToolbar'));
new vm.Script(patched); // Parse, never execute Steam code.
console.log('PASS: one verified header insertion after notifications; every native control preserved; patched chunk parses.');
