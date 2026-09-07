#!/usr/bin/env node
const fs = require('node:fs');
const path = require('node:path');
const file = path.resolve(__dirname, '../docs/gamer-qa-top50.json');
const rows = JSON.parse(fs.readFileSync(file, 'utf8'));
if (!Array.isArray(rows) || rows.length !== 50) throw new Error(`Gamer QA must contain exactly 50 items; found ${rows?.length ?? 'invalid'}.`);
const ids = new Set();
let runtime = 0;
for (const row of rows) {
  if (!Number.isInteger(row.id) || row.id < 1 || row.id > 50 || ids.has(row.id)) throw new Error(`Invalid/duplicate gamer QA id ${row.id}`);
  ids.add(row.id);
  if (!['critical','high','medium'].includes(row.priority)) throw new Error(`Invalid priority for #${row.id}`);
  if (!['pass','runtime_gate'].includes(row.status)) throw new Error(`Invalid status for #${row.id}`);
  if (typeof row.title !== 'string' || row.title.length < 8 || typeof row.evidence !== 'string' || row.evidence.length < 8) throw new Error(`Weak gamer QA evidence for #${row.id}`);
  if (row.status === 'runtime_gate') runtime += 1;
}
for (let i = 1; i <= 50; i += 1) if (!ids.has(i)) throw new Error(`Missing gamer QA id ${i}`);
if (runtime !== 8) throw new Error(`Expected 8 live-runtime gates; found ${runtime}.`);
console.log(`Gamer QA Top 50 passed structure/evidence gate: ${50-runtime} engineering items PASS, ${runtime} live-runtime gates intentionally require evidence.`);
