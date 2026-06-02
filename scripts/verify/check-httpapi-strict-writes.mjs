#!/usr/bin/env node
import { readFileSync } from 'node:fs';

const file = 'apps/web/src/api/httpApi.ts';
const content = readFileSync(file, 'utf8');

const criticalFns = [
  'createGradingJob','createCourse','createTeachingClass','createOcrJob','updateReviewItem',
  'deleteTeachingClass',
  'approveGradingResult','publishGradingResult','withdrawGradingResult','createGradeExport',
  'createAppeal','resolveAppeal','remindUnsubmitted','startSimilarityJob','createAssignment',
  'publishAssignment','createRubric','createOrganization','createUser','updateSystemSetting',
  'importStudents','createUploadReceipt','deleteSubmission','createNotification',
];

function extractFunctionBlock(src, fnName) {
  const sig = `export async function ${fnName}`;
  const start = src.indexOf(sig);
  if (start < 0) return null;
  const braceStart = src.indexOf('{', start);
  if (braceStart < 0) return null;
  let depth = 0;
  for (let i = braceStart; i < src.length; i += 1) {
    const ch = src[i];
    if (ch === '{') depth += 1;
    if (ch === '}') depth -= 1;
    if (depth === 0) return src.slice(start, i + 1);
  }
  return null;
}

const failures = [];
for (const fn of criticalFns) {
  const body = extractFunctionBlock(content, fn);
  if (!body) {
    failures.push(`missing function: ${fn}`);
    continue;
  }
  if (body.includes('mutateOr(')) failures.push(`${fn}: uses mutateOr`);
  if (body.includes('getOr(')) failures.push(`${fn}: uses getOr`);
  if (body.includes('shouldUseStrictHttpApi()')) failures.push(`${fn}: has strict fallback branch`);
}

if (failures.length > 0) {
  console.error('[check-httpapi-strict-writes] FAILED');
  for (const f of failures) console.error(`- ${f}`);
  process.exit(1);
}

console.log('[check-httpapi-strict-writes] passed');
