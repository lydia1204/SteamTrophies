#!/usr/bin/env node
const { spawnSync } = require('node:child_process');
const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');

const files = [];
function collect(directory) {
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    const absolute = path.join(directory, entry.name);
    if (entry.isDirectory()) collect(absolute);
    else if (entry.isFile() && entry.name.endsWith('.lua')) files.push(absolute);
  }
}
collect(path.resolve('backend'));

function available(command, args) {
  const result = spawnSync(command, args, { stdio: 'ignore' });
  return !result.error && result.status === 0;
}

let compiler;
let argsFor;
if (available('luajit', ['-v'])) {
  compiler = 'luajit';
  argsFor = (file) => ['-b', file, path.join(os.tmpdir(), `steamtrophies-${path.basename(file)}.ljbc`)];
} else if (available('luac', ['-v'])) {
  compiler = 'luac';
  argsFor = (file) => ['-p', file];
} else {
  console.error('Lua validation requires luajit or luac on PATH.');
  process.exit(1);
}

for (const file of files.sort()) {
  const result = spawnSync(compiler, argsFor(file), { stdio: 'inherit' });
  if (result.error || result.status !== 0) process.exit(result.status ?? 1);
}
console.log(`${compiler} syntax/bytecode validation passed for ${files.length} backend Lua files.`);
