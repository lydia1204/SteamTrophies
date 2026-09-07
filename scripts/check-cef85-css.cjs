#!/usr/bin/env node
const fs = require('node:fs');
const path = require('node:path');

const cssPath = path.resolve(process.argv[2] || 'frontend/styles/trophies.css');
const source = fs.readFileSync(cssPath, 'utf8');
const css = source.replace(/\/\*[\s\S]*?\*\//g, '');
const banned = [
  ['CSS container queries', /@container\b/i],
  ['CSS aspect-ratio property', /(^|[;{}\s])aspect-ratio\s*:/im],
  [':has() selector', /:has\s*\(/i],
  [':focus-visible selector', /:focus-visible\b/i],
  ['container query units', /(?:\d|\))\s*(?:cqw|cqh|cqi|cqb|cqmin|cqmax)\b/i],
  ['dynamic/small/large viewport units', /(?:\d|\))\s*(?:dvh|dvw|svh|svw|lvh|lvw)\b/i],
  ['CSS subgrid', /\bsubgrid\b/i],
  ['color-mix()', /\bcolor-mix\s*\(/i],
];
const failures = banned.filter(([, regex]) => regex.test(css)).map(([name]) => name);
if (failures.length) {
  console.error(`CEF85 compatibility check failed for ${cssPath}:`);
  for (const failure of failures) console.error(`  - ${failure}`);
  process.exit(1);
}
console.log(`CEF85 CSS compatibility guard passed: ${path.relative(process.cwd(), cssPath)}`);
