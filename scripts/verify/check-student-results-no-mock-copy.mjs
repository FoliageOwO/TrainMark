#!/usr/bin/env node
import { readFileSync } from 'node:fs';

const file = 'apps/web/src/components/StudentResultsPanel.tsx';
const content = readFileSync(file, 'utf8');

const bannedSnippets = [
  'mock-annotated-page',
  '报告结构完整，核心功能说明较清晰',
  '需求分析章节缺少非功能需求',
  '数据库设计章节未说明索引选择理由',
  '实训反思章节内容偏少',
];

const hits = bannedSnippets.filter((snippet) => content.includes(snippet));
if (hits.length > 0) {
  console.error('[check-student-results-no-mock-copy] FAILED');
  hits.forEach((hit) => console.error(`- found hardcoded mock copy: ${hit}`));
  process.exit(1);
}

console.log('[check-student-results-no-mock-copy] passed');
