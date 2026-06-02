#!/usr/bin/env node
import { readFileSync } from 'node:fs';

const files = {
  dashboard: 'apps/web/src/components/StudentDashboard.tsx',
  results: 'apps/web/src/components/StudentResultsPanel.tsx',
  upload: 'apps/web/src/components/StudentUploadPanel.tsx',
};

const checks = [
  [files.dashboard, 'const currentBlocker =', 'student dashboard blocker'],
  [files.dashboard, 'const nextAction =', 'student dashboard next action'],
  [files.dashboard, '先提交待办任务', 'student dashboard primary next action'],
  [files.results, 'const currentBlocker =', 'student results blocker'],
  [files.results, 'const nextAction =', 'student results next action'],
  [files.upload, 'const currentBlocker =', 'student upload blocker'],
  [files.upload, 'const nextAction =', 'student upload next action'],
];

const missing = [];
for (const [file, snippet, label] of checks) {
  const content = readFileSync(file, 'utf8');
  if (!content.includes(snippet)) missing.push(`${label} (${file})`);
}

if (missing.length) {
  console.error('[check-student-workflow-guides] FAILED');
  missing.forEach((m) => console.error(`- missing: ${m}`));
  process.exit(1);
}

console.log('[check-student-workflow-guides] passed');
