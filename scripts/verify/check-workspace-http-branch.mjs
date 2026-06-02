#!/usr/bin/env node
import { readFileSync } from 'node:fs';

const file = 'apps/web/src/pages/App.tsx';
const content = readFileSync(file, 'utf8');

// Guardrail: in HTTP mode branches in App.tsx, the true branch must not call mockApi directly.
// We only enforce the common pattern currently used in file: (isHttpMode ? ... : mockApi.xxx)
// If the true branch ever includes mockApi, this regex catches it.
const badPatterns = [
  /\(isHttpMode\s*\?[^:]*mockApi\./g,
  /\(shouldUseHttpApi\(\)\s*\?[^:]*mockApi\./g,
];

const failures = [];
for (const pattern of badPatterns) {
  const m = content.match(pattern);
  if (m && m.length > 0) failures.push(...m);
}

if (failures.length > 0) {
  console.error('[check-workspace-http-branch] FAILED');
  failures.slice(0, 10).forEach((f) => console.error(`- suspicious http branch contains mockApi: ${f}`));
  process.exit(1);
}

console.log('[check-workspace-http-branch] passed');
