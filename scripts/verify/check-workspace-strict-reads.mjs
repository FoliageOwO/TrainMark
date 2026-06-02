#!/usr/bin/env node
import { readFileSync } from 'node:fs';

const file = 'apps/web/src/api/httpApi.ts';
const content = readFileSync(file, 'utf8');

const fnStart = content.indexOf('export async function loadWorkspaceData');
if (fnStart < 0) {
  console.error('[check-workspace-strict-reads] FAILED');
  console.error('- loadWorkspaceData not found');
  process.exit(1);
}

const braceStart = content.indexOf('{', fnStart);
if (braceStart < 0) {
  console.error('[check-workspace-strict-reads] FAILED');
  console.error('- loadWorkspaceData body start not found');
  process.exit(1);
}
let depth = 0;
let end = -1;
for (let i = braceStart; i < content.length; i += 1) {
  const ch = content[i];
  if (ch === '{') depth += 1;
  if (ch === '}') {
    depth -= 1;
    if (depth === 0) {
      end = i;
      break;
    }
  }
}
if (end < 0) {
  console.error('[check-workspace-strict-reads] FAILED');
  console.error('- loadWorkspaceData body end not found');
  process.exit(1);
}
const body = content.slice(braceStart, end + 1);
if (body.includes('mustGet(')) {
  console.error('[check-workspace-strict-reads] FAILED');
  console.error('- loadWorkspaceData contains relaxed mustGet(...) calls, expected mustGetStrict(...) in HTTP mode chain');
  process.exit(1);
}

if (!body.includes('mustGetStrict(')) {
  console.error('[check-workspace-strict-reads] FAILED');
  console.error('- loadWorkspaceData missing mustGetStrict(...) calls');
  process.exit(1);
}

console.log('[check-workspace-strict-reads] passed');
