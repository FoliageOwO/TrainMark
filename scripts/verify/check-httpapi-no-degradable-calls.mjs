#!/usr/bin/env node
import { readFileSync } from 'node:fs';

const file = 'apps/web/src/api/httpApi.ts';
const content = readFileSync(file, 'utf8');

const bannedCalls = ['getOr(', 'mutateOr('];
const failures = [];

for (const call of bannedCalls) {
  if (content.includes(call)) {
    failures.push(`banned call detected: ${call}`);
  }
}

if (failures.length > 0) {
  console.error('[check-httpapi-no-degradable-calls] FAILED');
  failures.forEach((f) => console.error(`- ${f}`));
  process.exit(1);
}

console.log('[check-httpapi-no-degradable-calls] passed');
