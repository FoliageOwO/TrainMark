#!/usr/bin/env node
import { readFileSync } from 'node:fs';

const file = 'apps/web/src/pages/App.tsx';
const content = readFileSync(file, 'utf8');

if (!content.includes('已保留最近一次成功加载的数据，可继续查看并稍后重试同步。')) {
  console.error('[check-workspace-error-no-clear] FAILED');
  console.error('- missing "keep last successful snapshot" user hint in HTTP error panel');
  process.exit(1);
}

if (!content.includes("className={workspaceData ? 'reminder-result error' : 'empty-result'}")) {
  console.error('[check-workspace-error-no-clear] FAILED');
  console.error('- missing lightweight error banner style when workspace snapshot is available');
  process.exit(1);
}

const loadCatchAnchor = content.indexOf('.catch((error) => {');
if (loadCatchAnchor >= 0) {
  const loadCatchSlice = content.slice(loadCatchAnchor, loadCatchAnchor + 260);
  if (loadCatchSlice.includes('setWorkspaceData(null)')) {
    console.error('[check-workspace-error-no-clear] FAILED');
    console.error('- found setWorkspaceData(null) in loadWorkspaceData .catch branch');
    process.exit(1);
  }
}

const refreshCatchAnchor = content.indexOf('} catch (error) {');
if (refreshCatchAnchor >= 0) {
  const refreshSlice = content.slice(refreshCatchAnchor, refreshCatchAnchor + 260);
  if (refreshSlice.includes('const data = await loadWorkspaceData') && refreshSlice.includes('setWorkspaceData(null)')) {
    console.error('[check-workspace-error-no-clear] FAILED');
    console.error('- found setWorkspaceData(null) in refreshWorkspaceData catch branch');
    process.exit(1);
  }
}

console.log('[check-workspace-error-no-clear] passed');
