#!/usr/bin/env node
const { classifyResponsiveMetrics, RESOLUTION_TEST_MATRIX } = require('../.test-build/packages/customization/src/index.js');

let failed = false;
const rows = RESOLUTION_TEST_MATRIX.map((fixture) => {
  const m = classifyResponsiveMetrics(fixture.width, fixture.height, fixture.surface);
  const ok = m.columns >= 1 && m.columns <= 6 && m.safeInlinePx >= 12 && m.safeBlockPx >= 12 && Number.isFinite(m.aspectRatio);
  if (!ok) failed = true;
  return {
    fixture: fixture.name,
    surface: fixture.surface,
    cssPx: `${fixture.width}x${fixture.height}`,
    widthBand: m.widthBand,
    aspect: m.aspectBand,
    columns: m.columns,
    safe: `${m.safeInlinePx}/${m.safeBlockPx}`,
    ok,
  };
});
console.table(rows);
if (failed) process.exit(1);
const g9 = classifyResponsiveMetrics(5120, 1440, 'desktop');
if (g9.columns !== 6 || g9.aspectBand !== 'super_ultrawide') {
  console.error('32:9 guard failed: expected capped six-column super-ultrawide layout.');
  process.exit(1);
}
const deck = classifyResponsiveMetrics(1280, 800, 'deck');
if (deck.columns > 3) {
  console.error('Steam Deck guard failed: handheld shell exceeded three columns.');
  process.exit(1);
}
console.log('Resolution matrix passed. Measurements are CSS-pixel container sizes, not assumed panel resolutions.');
