#!/usr/bin/env node
import { readFileSync } from 'node:fs';

const file = 'apps/web/src/pages/App.tsx';
const content = readFileSync(file, 'utf8');

const requiredSnippets = [
  'function sanitizeSectionForRole',
  'allowedByRole: Record<RoleCode, string[]>',
  'sanitizeSectionForRole(role, getSectionFromLocation())',
  'sanitizeSectionForRole(primaryRole, section)',
  'const nextSection = sanitizeSectionForRole(effectiveRole, getSectionFromLocation())',
];

const missing = requiredSnippets.filter((s) => !content.includes(s));
if (missing.length > 0) {
  console.error('[check-role-section-guards] FAILED');
  missing.forEach((m) => console.error(`- missing: ${m}`));
  process.exit(1);
}

console.log('[check-role-section-guards] passed');
