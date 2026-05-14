import type {
  AppealSummary,
  AssignmentSummary,
  CourseSummary,
  CollectionOverview,
  CourseOutcomeAchievement,
  DashboardMetrics,
  GradePublicationAuditEntry,
  GradeExportSummary,
  GradeStatisticsSummary,
  GradingResultSummary,
  GradingJobSummary,
  OcrJobSummary,
  OrganizationSummary,
  ReminderResult,
  RoleCode,
  RubricSummary,
  LossPointSummary,
  SimilarityJobSummary,
  StudentImportPreview,
  SubmissionTask,
  TeachingClassSummary,
  UploadReceipt,
  UnsubmittedStudent,
  UserProfile,
  UserSummary,
} from './types';

const users: Record<RoleCode, UserProfile> = {
  TEACHER: { id: 1, name: '王老师', username: 'teacher', roles: ['TEACHER'] },
  STUDENT: { id: 2, name: '张三', username: 'student', roles: ['STUDENT'] },
  COURSE_OWNER: { id: 3, name: '刘主任', username: 'owner', roles: ['COURSE_OWNER'] },
  SUPERVISOR: { id: 4, name: '陈督导', username: 'supervisor', roles: ['SUPERVISOR'] },
  ADMIN: { id: 5, name: '系统管理员', username: 'admin', roles: ['ADMIN'] },
};

const courses: CourseSummary[] = [
  { id: 1, name: 'Java Web 综合实训', code: 'JAVA-WEB-2026', semester: '2025-2026-2', status: 'ACTIVE', classCount: 2, studentCount: 96 },
  { id: 2, name: '数据库设计实训', code: 'DB-DESIGN-2026', semester: '2025-2026-2', status: 'ACTIVE', classCount: 1, studentCount: 48 },
];

const organizations: OrganizationSummary[] = [
  { id: 1, parentId: null, name: '信息工程学院', type: 'COLLEGE' },
  { id: 2, parentId: 1, name: '软件技术', type: 'MAJOR' },
  { id: 3, parentId: 2, name: '软件2401班', type: 'CLASS' },
  { id: 4, parentId: 2, name: '软件2402班', type: 'CLASS' },
];

const userDirectory: UserSummary[] = [
  { id: 1, organizationId: 1, username: 'teacher', name: '王老师', teacherNo: 'T2026001', email: 'teacher@trainmark.local', status: 'ACTIVE', roles: ['TEACHER'] },
  { id: 2, organizationId: 3, username: '2024010101', name: '张三', studentNo: '2024010101', email: 'student@trainmark.local', status: 'ACTIVE', roles: ['STUDENT'] },
  { id: 3, organizationId: 3, username: '2024010102', name: '李四', studentNo: '2024010102', email: 'lisi@trainmark.local', status: 'ACTIVE', roles: ['STUDENT'] },
  { id: 4, organizationId: 4, username: '2024010201', name: '赵六', studentNo: '2024010201', email: 'zhaoliu@trainmark.local', status: 'PENDING', roles: ['STUDENT'] },
];

const importPreview: StudentImportPreview = {
  total: 48,
  valid: 45,
  duplicated: 2,
  invalid: 1,
};

const classes: TeachingClassSummary[] = [
  { id: 1, courseId: 1, name: '软件2401班', major: '软件技术', grade: '2024', studentCount: 48 },
  { id: 2, courseId: 1, name: '软件2402班', major: '软件技术', grade: '2024', studentCount: 48 },
  { id: 3, courseId: 2, name: '计应2401班', major: '计算机应用', grade: '2024', studentCount: 48 },
];

const assignments: AssignmentSummary[] = [
  { id: 1, courseId: 1, title: 'Java Web 综合实训报告', deadline: '2026-05-10T23:59:00+08:00', totalScore: 100, status: 'PUBLISHED', similarityCheckEnabled: true, aiGradingEnabled: true },
  { id: 2, courseId: 2, title: '数据库概念结构设计报告', deadline: '2026-05-18T23:59:00+08:00', totalScore: 100, status: 'DRAFT', similarityCheckEnabled: true, aiGradingEnabled: true },
];

const studentTasks: SubmissionTask[] = [
  { id: 1, title: 'Java Web 综合实训报告', courseName: 'Java Web 综合实训', status: '已发布成绩', deadline: '2026-05-10T23:59:00+08:00', score: 84 },
  { id: 2, title: '数据库设计报告', courseName: '数据库设计实训', status: '已发布成绩', deadline: '2026-04-20T23:59:00+08:00', score: 88 },
];

const collectionOverview: CollectionOverview = {
  assignmentId: 1,
  totalStudents: 96,
  submitted: 65,
  unsubmitted: 31,
  lateSubmitted: 4,
  processing: 18,
  reviewed: 12,
  published: 0,
};

const unsubmittedStudents: UnsubmittedStudent[] = [
  { studentId: 12, studentNo: '2024010112', name: '周明', className: '软件2401班', email: 'zhouming@trainmark.local' },
  { studentId: 18, studentNo: '2024010118', name: '钱雨', className: '软件2401班', email: 'qianyu@trainmark.local' },
  { studentId: 43, studentNo: '2024010243', name: '孙可', className: '软件2402班', email: 'sunke@trainmark.local' },
];

const rubrics: RubricSummary[] = [
  {
    id: 1,
    assignmentId: 1,
    name: 'Java Web 实训评分标准',
    totalScore: 100,
    items: [
      { id: 1, title: '需求与设计', score: 20, courseOutcomeCode: 'CO1', points: [{ id: 1, title: '功能模块完整', score: 12, keywords: ['登录', '课程', '任务', '提交'] }] },
      { id: 2, title: '系统实现', score: 50, courseOutcomeCode: 'CO2', points: [{ id: 2, title: '核心流程可运行', score: 30, keywords: ['上传', '批改', '发布'] }] },
      { id: 3, title: '报告规范', score: 30, courseOutcomeCode: 'CO3', points: [{ id: 3, title: '结构完整清晰', score: 20, keywords: ['目录', '截图', '总结'] }] },
    ],
  },
];

const gradingJobs: GradingJobSummary[] = [
  { id: 1, assignmentId: 1, rubricId: 1, totalSubmissions: 65, completedSubmissions: 47, status: 'SCORING', confidence: 86, createdAt: '2026-05-12T10:12:00+08:00' },
];

const ocrJobs: OcrJobSummary[] = [
  {
    id: 1,
    submissionId: 1,
    objectKey: 'assignments/1/students/2/report.pdf',
    status: 'STRUCTURING',
    pageCount: 18,
    textBlockCount: 142,
    tableCount: 6,
    confidence: 93,
    blocks: [
      { type: 'heading', title: '需求分析', page: 2, confidence: 96 },
      { type: 'table', title: '数据库表结构', page: 7, confidence: 91 },
      { type: 'image', title: '系统运行截图', page: 12, confidence: 88 },
    ],
  },
];

const gradingResults: GradingResultSummary[] = [
  {
    id: 1,
    assignmentId: 1,
    submissionId: 1,
    studentId: 2,
    studentName: '张三',
    studentNo: '2024010101',
    fileName: 'JavaWeb综合实训报告-张三-2024010101.pdf',
    previewUrl: '/previews/submissions/1/report.pdf',
    annotationPdfUrl: '/annotations/submissions/1/annotated.pdf',
    totalScore: 100,
    aiScore: 84,
    teacherScore: 84,
    confidence: 88,
    reviewStatus: 'APPROVED',
    publicationStatus: 'PUBLISHED',
    overallComment: '报告结构完整，核心功能说明较清楚；数据库约束和异常处理说明还需要补强。',
    reviewedAt: '2026-05-13T16:30:00+08:00',
    publishedAt: '2026-05-13T18:00:00+08:00',
    items: [
      {
        rubricItemId: 1,
        title: '需求与设计',
        maxScore: 20,
        aiScore: 16,
        teacherScore: 16,
        deductionReason: '用例描述完整，但数据库约束和边界条件说明不足。',
        teacherComment: '建议补充关键表约束和异常流程说明。',
        confidence: 86,
        evidence: ['第 2 页需求分析', '第 7 页数据库表结构'],
      },
      {
        rubricItemId: 2,
        title: '系统实现',
        maxScore: 50,
        aiScore: 43,
        teacherScore: 43,
        deductionReason: '核心流程可运行，缺少批量异常处理和权限边界说明。',
        teacherComment: '上传、批改、发布主流程描述清晰，需补充失败重试策略。',
        confidence: 91,
        evidence: ['第 11 页核心流程', '第 12 页运行截图'],
      },
      {
        rubricItemId: 3,
        title: '报告规范',
        maxScore: 30,
        aiScore: 25,
        teacherScore: 25,
        deductionReason: '章节完整，截图标注不够统一，结论部分偏简略。',
        teacherComment: '统一图表编号并补充实训反思。',
        confidence: 87,
        evidence: ['第 1 页目录', '第 17 页总结'],
      },
    ],
    annotations: [
      { id: 1, page: 7, anchorText: '数据库表结构', comment: '外键约束说明不完整', severity: 'warning' },
      { id: 2, page: 12, anchorText: '系统运行截图', comment: '建议补充失败场景截图', severity: 'info' },
      { id: 3, page: 17, anchorText: '实训总结', comment: '总结需要对应评分标准展开', severity: 'warning' },
    ],
  },
];

const publicationAudits: GradePublicationAuditEntry[] = [];

const gradeExports: GradeExportSummary[] = [
  {
    id: 1,
    assignmentId: 1,
    fileName: 'Java Web 综合实训-成绩单.csv',
    format: 'CSV',
    rowCount: 48,
    downloadUrl: '/exports/assignments/1/grades.csv',
    status: 'READY',
    createdAt: '2026-05-14T11:20:00+08:00',
  },
];

const appeals: AppealSummary[] = [
  {
    id: 1,
    resultId: 1,
    rubricItemId: 2,
    studentId: 2,
    studentName: '张三',
    reason: '系统实现部分包含失败重试说明，可能未被识别。',
    requestedChange: '申请将系统实现分项由 43 分调整为 45 分。',
    status: 'SUBMITTED',
    teacherReply: null,
    createdAt: '2026-05-14T09:20:00+08:00',
    resolvedAt: null,
  },
];

const gradeStatistics: GradeStatisticsSummary = {
  assignmentId: 1,
  submittedCount: 65,
  publishedCount: 48,
  averageScore: 83.6,
  standardDeviation: 7.8,
  maxScore: 96,
  minScore: 62,
  difficultyIndex: 0.84,
  discriminationIndex: 0.31,
  scoreBuckets: [
    { label: '90-100', minScore: 90, maxScore: 100, studentCount: 12 },
    { label: '80-89', minScore: 80, maxScore: 89, studentCount: 24 },
    { label: '70-79', minScore: 70, maxScore: 79, studentCount: 9 },
    { label: '60-69', minScore: 60, maxScore: 69, studentCount: 3 },
    { label: '<60', minScore: 0, maxScore: 59, studentCount: 0 },
  ],
};

const lossPoints: LossPointSummary[] = [
  { rubricItemId: 1, title: '需求与设计', courseOutcomeCode: 'CO1', averageLostScore: 4.2, affectedStudentCount: 31, topReason: '数据库约束、边界条件和异常流程说明不足' },
  { rubricItemId: 2, title: '系统实现', courseOutcomeCode: 'CO2', averageLostScore: 6.8, affectedStudentCount: 28, topReason: '失败重试、权限边界和批量处理说明缺失' },
  { rubricItemId: 3, title: '报告规范', courseOutcomeCode: 'CO3', averageLostScore: 3.7, affectedStudentCount: 22, topReason: '截图编号、图表说明和实训总结不够规范' },
];

const courseOutcomes: CourseOutcomeAchievement[] = [
  { courseOutcomeCode: 'CO1', title: '需求分析与系统设计', targetValue: 0.75, achievedValue: 0.79, status: '达成' },
  { courseOutcomeCode: 'CO2', title: '系统实现与调试', targetValue: 0.75, achievedValue: 0.84, status: '达成' },
  { courseOutcomeCode: 'CO3', title: '工程表达与报告规范', targetValue: 0.75, achievedValue: 0.72, status: '临界' },
];

const similarityJobs: SimilarityJobSummary[] = [
  {
    id: 1,
    assignmentId: 1,
    checkedSubmissionCount: 65,
    status: 'COMPLETED',
    maxSimilarity: 0.82,
    highRiskPairCount: 1,
    createdAt: '2026-05-14T10:30:00+08:00',
    matches: [
      { sourceSubmissionId: 1, targetSubmissionId: 18, sourceStudentName: '张三', targetStudentName: '钱雨', similarity: 0.82, matchedSection: '系统实现-上传流程', riskLevel: 'HIGH' },
      { sourceSubmissionId: 7, targetSubmissionId: 23, sourceStudentName: '李四', targetStudentName: '孙可', similarity: 0.68, matchedSection: '数据库表结构说明', riskLevel: 'MEDIUM' },
    ],
  },
];

export const mockApi = {
  login(role: RoleCode): UserProfile {
    return users[role];
  },
  getMetrics(): DashboardMetrics {
    return { activeAssignments: 8, pendingGrading: 126, pendingReview: 12, unsubmitted: 31 };
  },
  listCourses(): CourseSummary[] {
    return courses;
  },
  listOrganizations(): OrganizationSummary[] {
    return organizations;
  },
  listUsers(role?: RoleCode): UserSummary[] {
    return userDirectory.filter((item) => role === undefined || item.roles.includes(role));
  },
  getStudentImportPreview(): StudentImportPreview {
    return importPreview;
  },
  listClasses(courseId: number): TeachingClassSummary[] {
    return classes.filter((item) => item.courseId === courseId);
  },
  listAssignments(courseId?: number): AssignmentSummary[] {
    return assignments.filter((item) => courseId === undefined || item.courseId === courseId);
  },
  listStudentTasks(): SubmissionTask[] {
    return studentTasks;
  },
  getCollectionOverview(): CollectionOverview {
    return collectionOverview;
  },
  listUnsubmittedStudents(): UnsubmittedStudent[] {
    return unsubmittedStudents;
  },
  remindUnsubmitted(): ReminderResult {
    return {
      recipientCount: unsubmittedStudents.length,
      messageCount: unsubmittedStudents.length * 3,
      channels: ['站内信', '邮件', '企业微信'],
      status: '已发送',
    };
  },
  listRubrics(): RubricSummary[] {
    return rubrics;
  },
  listGradingJobs(): GradingJobSummary[] {
    return gradingJobs;
  },
  listOcrJobs(): OcrJobSummary[] {
    return ocrJobs;
  },
  listGradingResults(): GradingResultSummary[] {
    return gradingResults;
  },
  updateReviewItem(resultId: number, rubricItemId: number, teacherScore: number, teacherComment: string): GradingResultSummary {
    const result = gradingResults.find((item) => item.id === resultId);
    if (!result) {
      throw new Error(`Grading result not found: ${resultId}`);
    }
    result.items = result.items.map((item) => (
      item.rubricItemId === rubricItemId ? { ...item, teacherScore, teacherComment } : item
    ));
    result.teacherScore = result.items.reduce((total, item) => total + item.teacherScore, 0);
    result.reviewStatus = 'IN_REVIEW';
    result.reviewedAt = null;
    return result;
  },
  approveGradingResult(resultId: number): GradingResultSummary {
    const result = gradingResults.find((item) => item.id === resultId);
    if (!result) {
      throw new Error(`Grading result not found: ${resultId}`);
    }
    result.reviewStatus = 'APPROVED';
    result.reviewedAt = new Date().toISOString();
    return result;
  },
  publishGradingResult(resultId: number): GradingResultSummary {
    const result = gradingResults.find((item) => item.id === resultId);
    if (!result) {
      throw new Error(`Grading result not found: ${resultId}`);
    }
    result.publicationStatus = 'PUBLISHED';
    result.publishedAt = new Date().toISOString();
    publicationAudits.push({
      id: publicationAudits.length + 1,
      resultId,
      action: 'PUBLISH',
      operatorName: '王老师',
      reason: '发布成绩与批注',
      createdAt: result.publishedAt,
    });
    studentTasks[0] = {
      ...studentTasks[0],
      status: '已发布成绩',
      score: result.teacherScore,
    };
    return result;
  },
  withdrawGradingResult(resultId: number, reason = '复核后重新发布'): GradingResultSummary {
    const result = gradingResults.find((item) => item.id === resultId);
    if (!result) {
      throw new Error(`Grading result not found: ${resultId}`);
    }
    result.publicationStatus = 'WITHDRAWN';
    result.publishedAt = null;
    publicationAudits.push({
      id: publicationAudits.length + 1,
      resultId,
      action: 'WITHDRAW',
      operatorName: '王老师',
      reason,
      createdAt: new Date().toISOString(),
    });
    studentTasks[0] = {
      ...studentTasks[0],
      status: '批改中',
      score: undefined,
    };
    return result;
  },
  listPublicationAudits(resultId?: number): GradePublicationAuditEntry[] {
    return publicationAudits.filter((item) => resultId === undefined || item.resultId === resultId);
  },
  listGradeExports(assignmentId?: number): GradeExportSummary[] {
    return gradeExports.filter((item) => assignmentId === undefined || item.assignmentId === assignmentId);
  },
  createGradeExport(assignmentId: number, format: GradeExportSummary['format'] = 'CSV'): GradeExportSummary {
    const exportJob: GradeExportSummary = {
      id: gradeExports.length + 1,
      assignmentId,
      fileName: `assignment-${assignmentId}-grades.${format.toLowerCase()}`,
      format,
      rowCount: gradingResults.filter((item) => item.assignmentId === assignmentId && item.publicationStatus === 'PUBLISHED').length,
      downloadUrl: `/exports/assignments/${assignmentId}/grades-${gradeExports.length + 1}.${format.toLowerCase()}`,
      status: 'READY',
      createdAt: new Date().toISOString(),
    };
    gradeExports.unshift(exportJob);
    return exportJob;
  },
  listPublishedResults(studentId?: number): GradingResultSummary[] {
    return gradingResults.filter((item) => (
      item.publicationStatus === 'PUBLISHED' && (studentId === undefined || item.studentId === studentId)
    ));
  },
  getGradeStatistics(): GradeStatisticsSummary {
    return gradeStatistics;
  },
  listLossPoints(): LossPointSummary[] {
    return lossPoints;
  },
  listCourseOutcomes(): CourseOutcomeAchievement[] {
    return courseOutcomes;
  },
  listSimilarityJobs(): SimilarityJobSummary[] {
    return similarityJobs;
  },
  startSimilarityJob(): SimilarityJobSummary {
    const job: SimilarityJobSummary = {
      id: similarityJobs.length + 1,
      assignmentId: 1,
      checkedSubmissionCount: 65,
      status: 'COMPLETED',
      maxSimilarity: 0.74,
      highRiskPairCount: 0,
      createdAt: new Date().toISOString(),
      matches: [
        { sourceSubmissionId: 3, targetSubmissionId: 9, sourceStudentName: '待检测学生A', targetStudentName: '待检测学生B', similarity: 0.74, matchedSection: '需求分析章节', riskLevel: 'MEDIUM' },
      ],
    };
    similarityJobs.unshift(job);
    return job;
  },
  listAppeals(resultId?: number, studentId?: number): AppealSummary[] {
    return appeals.filter((item) => (
      (resultId === undefined || item.resultId === resultId) &&
      (studentId === undefined || item.studentId === studentId)
    ));
  },
  createAppeal(resultId: number, rubricItemId: number | null, studentId: number, reason: string, requestedChange: string): AppealSummary {
    const result = gradingResults.find((item) => item.id === resultId);
    if (!result) {
      throw new Error(`Grading result not found: ${resultId}`);
    }
    const appeal: AppealSummary = {
      id: appeals.length + 1,
      resultId,
      rubricItemId,
      studentId,
      studentName: result.studentName,
      reason,
      requestedChange,
      status: 'SUBMITTED',
      teacherReply: null,
      createdAt: new Date().toISOString(),
      resolvedAt: null,
    };
    appeals.push(appeal);
    return appeal;
  },
  resolveAppeal(appealId: number, accepted: boolean, teacherReply: string): AppealSummary {
    const appeal = appeals.find((item) => item.id === appealId);
    if (!appeal) {
      throw new Error(`Appeal not found: ${appealId}`);
    }
    appeal.status = accepted ? 'ACCEPTED' : 'REJECTED';
    appeal.teacherReply = teacherReply;
    appeal.resolvedAt = new Date().toISOString();
    return appeal;
  },
  startGradingJob(): GradingJobSummary {
    return { id: 2, assignmentId: 1, rubricId: 1, totalSubmissions: 18, completedSubmissions: 18, status: 'COMPLETED', confidence: 86, createdAt: new Date().toISOString() };
  },
  createUploadReceipt(fileName: string): UploadReceipt {
    return {
      submissionId: 2026051001,
      fileName,
      version: 1,
      submittedAt: new Date().toISOString(),
      status: '已提交',
    };
  },
};
