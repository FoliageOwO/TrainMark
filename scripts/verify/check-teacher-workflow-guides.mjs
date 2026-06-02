#!/usr/bin/env node
import { readFileSync } from 'node:fs';

const files = {
  dashboard: 'apps/web/src/components/TeacherDashboard.tsx',
  collection: 'apps/web/src/components/TeacherCollectionPanel.tsx',
  pipeline: 'apps/web/src/components/TeacherAiPipeline.tsx',
  review: 'apps/web/src/components/TeacherReviewWorkspace.tsx',
  analytics: 'apps/web/src/components/TeacherAnalyticsPanel.tsx',
};

const checks = [
  [files.dashboard, 'const sectionGuides: Record<string, { title: string; next: string; nextSection?: string }>', 'dashboard section guides'],
  [files.dashboard, '前往下一步', 'dashboard next-step action button'],
  [files.collection, 'const currentBlocker =', 'collection blocker'],
  [files.collection, 'const nextAction =', 'collection next action'],
  [files.pipeline, 'const currentBlocker =', 'pipeline blocker'],
  [files.pipeline, 'const nextAction =', 'pipeline next action'],
  [files.review, 'const currentBlocker =', 'review blocker'],
  [files.review, 'const nextAction =', 'review next action'],
  [files.analytics, 'const currentBlocker =', 'analytics blocker'],
  [files.analytics, 'const nextAction =', 'analytics next action'],
];

const missing = [];
for (const [file, snippet, label] of checks) {
  const content = readFileSync(file, 'utf8');
  if (!content.includes(snippet)) missing.push(`${label} (${file})`);
}

if (missing.length) {
  console.error('[check-teacher-workflow-guides] FAILED');
  missing.forEach((m) => console.error(`- missing: ${m}`));
  process.exit(1);
}

console.log('[check-teacher-workflow-guides] passed');
