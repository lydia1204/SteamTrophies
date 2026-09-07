const { readFileSync, writeFileSync } = require('node:fs');
const { join } = require('node:path');

const root = join(__dirname, '..');
const source = join(root, 'frontend', 'styles', 'trophies.css');
const target = join(root, 'frontend', 'styles', 'trophies.generated.ts');
const css = readFileSync(source, 'utf8');

writeFileSync(
  target,
  `// Generated from trophies.css by scripts/generate-css-module.cjs.\nexport const trophyStyles = ${JSON.stringify(css)};\n`,
  'utf8',
);
