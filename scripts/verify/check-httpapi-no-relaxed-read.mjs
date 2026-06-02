#!/usr/bin/env node
import { readFileSync } from 'node:fs';

const file = 'apps/web/src/api/httpApi.ts';
const content = readFileSync(file, 'utf8');

if (content.includes('async function mustGet<')) {
  console.error('[check-httpapi-no-relaxed-read] FAILED');
  console.error('- found relaxed read helper mustGet in httpApi.ts');
  process.exit(1);
}

if (!content.includes('async function mustGetStrict<')) {
  console.error('[check-httpapi-no-relaxed-read] FAILED');
  console.error('- missing mustGetStrict helper in httpApi.ts');
  process.exit(1);
}

console.log('[check-httpapi-no-relaxed-read] passed');
