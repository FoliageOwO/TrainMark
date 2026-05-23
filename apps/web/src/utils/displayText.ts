const exactTextMap: Record<string, string> = {
  'Smoke Rubric': '实训报告评分标准',
  'Smoke Training Task': '实训报告任务',
  'Smoke assignment creation': '实训任务说明',
  'Smoke approved': '已通过复核',
  'Smoke review comment': '请教师复核该分项并确认。',
  'Smoke publish': '发布成绩',
  'Smoke reminder': '请按时提交实训报告。',
  'Smoke Reviewer': '复核教师',
  'Smoke Student': '测试学生',
  'Smoke Imported Student': '导入测试学生',
  'Requirements and Design': '需求与设计',
  'Complete Requirements': '需求完整性',
  'System Implementation': '系统实现',
  'Complete Implementation': '实现完整性',
  'Report Quality': '报告质量',
  'Covers requirements, design, and constraints': '覆盖需求、设计与约束',
  'Covers core features and error handling': '覆盖核心功能与异常处理',
  'Covers screenshots and summary': '覆盖截图与总结',
  'Smoke appeal reason': '学生对自动评分结果提出申诉。',
  'Smoke requested change': '申请调整对应分项得分。',
  'Smoke appeal reply': '已复核申诉材料，维持原分。',
};

const phraseReplacements: Array<[RegExp, string]> = [
  [/\bSmoke Software Test Class\b/gi, '软件测试班级'],
  [/\bSmoke Imported Student\b/gi, '导入测试学生'],
  [/\bSmoke Student\b/gi, '测试学生'],
  [/\bSmoke Reviewer\b/gi, '复核教师'],
  [/\bSmoke Rubric\b/gi, '实训报告评分标准'],
  [/\bSmoke Training Task\b/gi, '实训报告任务'],
  [/\bSmoke assignment creation\b/gi, '实训任务说明'],
  [/\bSmoke approved\b/gi, '已通过复核'],
  [/\bSmoke review comment\b/gi, '请教师复核该分项并确认。'],
  [/\bSmoke publish\b/gi, '发布成绩'],
  [/\bSmoke reminder\b/gi, '请按时提交实训报告。'],
  [/\bRequirements and Design\b/gi, '需求与设计'],
  [/\bComplete Requirements\b/gi, '需求完整性'],
  [/\bSystem Implementation\b/gi, '系统实现'],
  [/\bComplete Implementation\b/gi, '实现完整性'],
  [/\bReport Quality\b/gi, '报告质量'],
  [/\bcore features\b/gi, '核心功能'],
  [/\berror handling\b/gi, '异常处理'],
  [/\brequirements\b/gi, '需求'],
  [/\brequirement\b/gi, '需求'],
  [/\bdesign\b/gi, '设计'],
  [/\bconstraints\b/gi, '约束'],
  [/\bconstraint\b/gi, '约束'],
  [/\bimplementation\b/gi, '实现'],
  [/\bfeatures\b/gi, '功能'],
  [/\bfeature\b/gi, '功能'],
  [/\bscreenshots\b/gi, '截图'],
  [/\bscreenshot\b/gi, '截图'],
  [/\bsummary\b/gi, '总结'],
  [/\bapi\b/gi, '接口'],
  [/\bCovers\b/gi, '覆盖'],
  [/\bComplete\b/gi, '完整'],
  [/\bSmoke\b/gi, '测试'],
];

export function toChineseText(value: string | null | undefined): string {
  if (!value) {
    return '';
  }
  const exact = exactTextMap[value.trim()];
  if (exact) {
    return exact;
  }

  return phraseReplacements.reduce((text, [pattern, replacement]) => (
    text.replace(pattern, replacement)
  ), normalizeFileName(value.trim()));
}

export function toChineseFileName(value: string | null | undefined): string {
  return toChineseText(value ?? '');
}

function normalizeFileName(value: string): string {
  return value
    .replace(/^assignment-(\d+)-grades\.(csv|pdf|zip)$/i, '任务 $1 成绩单.$2')
    .replace(/^grades-pending\.(csv|pdf|zip)$/i, '成绩单生成中.$1')
    .replace(/^grades-(\d+)\.(csv|pdf|zip)$/i, '成绩单-$1.$2')
    .replace(/^smoke-report\.(pdf|docx?|png|jpe?g)$/i, '实训报告.$1')
    .replace(/^smoke-peer-report\.(pdf|docx?|png|jpe?g)$/i, '同组实训报告.$1');
}
