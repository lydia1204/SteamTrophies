const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const FILE = path.join(ROOT, 'docs', 'runtime-release-gates.json');
const requirePass = process.argv.includes('--require-pass');

function fail(message) {
  console.error(`Runtime gate validation failed: ${message}`);
  process.exitCode = 1;
}

let document;
try {
  document = JSON.parse(fs.readFileSync(FILE, 'utf8'));
} catch (error) {
  fail(`cannot read/parse ${path.relative(ROOT, FILE)}: ${error.message}`);
  process.exit();
}

if (document.schemaVersion !== 1) fail('schemaVersion must be 1');
if (!Array.isArray(document.gates)) fail('gates must be an array');
if (process.exitCode) process.exit();

if (document.gates.length !== 20) {
  fail(`expected exactly 20 release gates, received ${document.gates.length}`);
}

const allowed = new Set(['pending', 'pass', 'blocked', 'not_applicable']);
const ids = new Set();
let passed = 0;
let pending = 0;
let blocked = 0;
let requiredCount = 0;

for (const gate of document.gates) {
  if (!gate || typeof gate !== 'object' || Array.isArray(gate)) {
    fail('each gate must be an object');
    continue;
  }
  if (typeof gate.id !== 'string' || !/^R\d{2}$/.test(gate.id)) {
    fail(`invalid gate id: ${String(gate.id)}`);
  }
  if (ids.has(gate.id)) fail(`duplicate gate id ${gate.id}`);
  ids.add(gate.id);
  if (typeof gate.name !== 'string' || gate.name.trim().length < 6) {
    fail(`${gate.id}: name is missing or too short`);
  }
  if (!allowed.has(gate.status)) fail(`${gate.id}: invalid status ${gate.status}`);
  if (!Array.isArray(gate.evidence)) fail(`${gate.id}: evidence must be an array`);
  if (gate.required === true) requiredCount += 1;

  if (gate.status === 'pass') {
    passed += 1;
    if (!gate.evidence.length || gate.evidence.some((value) => typeof value !== 'string' || value.trim().length < 12)) {
      fail(`${gate.id}: a passed gate requires concrete evidence strings`);
    }
  } else if (gate.status === 'pending') {
    pending += 1;
  } else if (gate.status === 'blocked') {
    blocked += 1;
  }

  if (gate.status === 'not_applicable' && gate.required === true) {
    fail(`${gate.id}: a required gate cannot be not_applicable`);
  }

  if (requirePass && gate.required === true && gate.status !== 'pass') {
    fail(`${gate.id}: required gate is ${gate.status}, expected pass`);
  }
}

if (requiredCount !== 20) fail(`expected all 20 gates to be required, found ${requiredCount}`);

if (!process.exitCode) {
  console.log(`Runtime gate structure valid: ${passed} pass, ${pending} pending, ${blocked} blocked.`);
  if (!requirePass && pending + blocked > 0) {
    console.log('Pending live gates are expected for an offline RC. Use --require-pass only for public release finalization.');
  }
  if (requirePass) console.log('All required runtime release gates have evidence.');
}
