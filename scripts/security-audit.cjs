#!/usr/bin/env node
const fs = require('node:fs');
const path = require('node:path');

const ROOT = path.resolve(__dirname, '..');
const RUNTIME_DIRS = ['frontend', 'packages', 'backend', 'decky', 'webkit'];
const SOURCE_EXTS = new Set(['.ts', '.tsx', '.js', '.jsx', '.cjs', '.mjs', '.lua', '.py']);
const violations = [];

function walk(dir, out = []) {
  if (!fs.existsSync(dir)) return out;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (['test', 'tests', 'node_modules', '.test-build', 'dist'].includes(entry.name)) continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full, out);
    else if (entry.isFile() && SOURCE_EXTS.has(path.extname(entry.name))) out.push(full);
  }
  return out;
}

const forbidden = [
  [/\beval\s*\(/, 'runtime eval'],
  [/\bnew\s+Function\s*\(/, 'dynamic Function constructor'],
  [/['\"](?:node:)?child_process['\"]/, 'Node child_process'],
  [/\bos\.execute\s*\(/, 'Lua shell execution'],
  [/\bio\.popen\s*\(/, 'Lua shell pipe'],
  [/dangerouslySetInnerHTML\s*=/, 'raw React HTML injection'],
  [/document\.cookie\b/, 'cookie access'],
  [/\bfile:\/\//i, 'raw file:// URL construction'],
  [/localStorage\.(?:setItem|getItem).*api.?key/i, 'API key in browser localStorage'],
];

const urlPattern = /https?:\/\/([A-Za-z0-9.-]+)/g;
const allowedHosts = new Set(['api.steampowered.com']);

const files = RUNTIME_DIRS.flatMap((dir) => walk(path.join(ROOT, dir)));
for (const file of files) {
  const text = fs.readFileSync(file, 'utf8');
  const rel = path.relative(ROOT, file).replaceAll('\\', '/');
  for (const [pattern, label] of forbidden) if (pattern.test(text)) violations.push(`${rel}: ${label}`);
  for (const match of text.matchAll(urlPattern)) if (!allowedHosts.has(match[1])) violations.push(`${rel}: unexpected hard-coded network host ${match[1]}`);
  if (rel.startsWith('frontend/') && /x-webapi-key/i.test(text)) violations.push(`${rel}: Steam Web API key handling must stay outside the frontend`);
}

const webApi = fs.readFileSync(path.join(ROOT, 'packages/friends/src/web-api.ts'), 'utf8');
if (!webApi.includes("'x-webapi-key'")) violations.push('friends Web API fallback must authenticate with x-webapi-key header');
if (/key=|apikey=/i.test(webApi)) violations.push('friends Web API fallback appears to place a key in a URL/query string');

const hookingDocs = fs.readFileSync(path.join(ROOT, 'backend/main.lua'), 'utf8');
if (/findElement|AddWindowCreateHook/.test(hookingDocs)) violations.push('backend/main.lua references deprecated Steam runtime DOM/window hooks');

if (violations.length) {
  console.error('Security audit failed:');
  for (const violation of violations) console.error(`  ✗ ${violation}`);
  process.exit(1);
}
console.log(`Security audit passed across ${files.length} runtime source files.`);
console.log('No runtime eval/shell execution/raw HTML/cookie/file:// patterns or unexpected hard-coded network hosts detected.');
