import type {
  AppealSummary,
  AssignmentSummary,
  AuditLogSummary,
  CourseSummary,
  CollectionOverview,
  CourseOutcomeAchievement,
  DashboardMetrics,
  GradePublicationAuditEntry,
  GradeExportSummary,
  GradeStatisticsSummary,
  GradingResultSummary,
  GradingJobSummary,
  NotificationItem,
  OcrJobSummary,
  OrganizationSummary,
  ReminderResult,
  RoleCode,
  OrganizationType,
  RubricSummary,
  LossPointSummary,
  SimilarityJobSummary,
  SystemSettingSummary,
  StudentImportPreview,
  StudentImportResult,
  StudentImportRow,
  SubmissionSummary,
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

const classStudentIds = new Map<number, Set<number>>([
  [1, new Set([2, 3])],
  [2, new Set([4])],
  [3, new Set()],
]);

const assignments: AssignmentSummary[] = [
  { id: 1, courseId: 1, title: 'Java Web 综合实训报告', deadline: '2026-05-10T23:59:00+08:00', totalScore: 100, status: 'PUBLISHED', similarityCheckEnabled: true, aiGradingEnabled: true },
  { id: 2, courseId: 2, title: '数据库概念结构设计报告', deadline: '2026-05-18T23:59:00+08:00', totalScore: 100, status: 'DRAFT', similarityCheckEnabled: true, aiGradingEnabled: true },
];

const studentTasks: SubmissionTask[] = [
  { id: 1, title: 'Java Web 综合实训报告', courseId: 1, courseName: 'Java Web 综合实训', status: '已发布成绩', deadline: '2026-05-10T23:59:00+08:00', score: 84 },
  { id: 2, title: '数据库设计报告', courseId: 2, courseName: '数据库设计实训', status: '未提交', deadline: '2026-04-20T23:59:00+08:00' },
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

const submissions: SubmissionSummary[] = [
  {
    id: 1,
    assignmentId: 1,
    studentId: 2,
    studentName: '张三',
    studentNo: '2024010101',
    fileName: 'JavaWeb综合实训报告-张三-2024010101.pdf',
    objectKey: 'assignments/1/students/2/report.pdf',
    version: 1,
    status: 'PUBLISHED',
    submittedAt: '2026-05-10T20:18:00+08:00',
  },
];

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
    fileName: '张三-Java Web 综合实训-自动批改报告.pdf',
    previewUrl: null,
    annotationPdfUrl: null,
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

const auditLogs: AuditLogSummary[] = [
  { id: 1, actorName: '王老师', action: 'UPLOAD_COMPLETE', resourceType: 'SUBMISSION', resourceId: '1', detail: '学生张三提交 Java Web 综合实训报告', ipAddress: '127.0.0.1', createdAt: '2026-05-14T08:00:00+08:00' },
  { id: 2, actorName: '系统任务', action: 'OCR_COMPLETE', resourceType: 'OCR_JOB', resourceId: '1', detail: '完成 18 页文档 OCR 和结构化识别', ipAddress: '127.0.0.1', createdAt: '2026-05-14T09:00:00+08:00' },
  { id: 3, actorName: '系统任务', action: 'GRADING_COMPLETE', resourceType: 'GRADING_JOB', resourceId: '1', detail: '本地规则评分完成 65 份报告', ipAddress: '127.0.0.1', createdAt: '2026-05-14T10:00:00+08:00' },
  { id: 4, actorName: '王老师', action: 'REVIEW_UPDATE', resourceType: 'GRADING_RESULT', resourceId: '1', detail: '复核系统实现分项并保存教师评语', ipAddress: '127.0.0.1', createdAt: '2026-05-14T11:00:00+08:00' },
  { id: 5, actorName: '王老师', action: 'GRADE_PUBLISH', resourceType: 'GRADING_RESULT', resourceId: '1', detail: '发布成绩与批注 PDF', ipAddress: '127.0.0.1', createdAt: '2026-05-14T12:00:00+08:00' },
  { id: 6, actorName: '张三', action: 'APPEAL_SUBMIT', resourceType: 'APPEAL', resourceId: '1', detail: '学生针对系统实现分项提交申诉', ipAddress: '127.0.0.1', createdAt: '2026-05-14T13:00:00+08:00' },
  { id: 7, actorName: '王老师', action: 'GRADE_EXPORT', resourceType: 'GRADE_EXPORT', resourceId: '1', detail: '导出 CSV 成绩单 48 行', ipAddress: '127.0.0.1', createdAt: '2026-05-14T14:00:00+08:00' },
];

const systemSettings: SystemSettingSummary[] = [
  { key: 'ai.ocr.provider', name: '文档识别服务', value: 'LOCAL_DETERMINISTIC', category: 'AI', sensitive: false },
  { key: 'ai.scoring.provider', name: '语义评分服务', value: 'LOCAL_RULES', category: 'AI', sensitive: false },
  { key: 'upload.max-file-size-mb', name: '最大上传大小', value: '50', category: 'FILE', sensitive: false },
  { key: 'export.retention-days', name: '导出文件保留天数', value: '30', category: 'EXPORT', sensitive: false },
  { key: 'notification.default-channels', name: '默认催交通道', value: 'IN_APP,EMAIL,WECHAT_WORK', category: 'NOTIFICATION', sensitive: false },
  { key: 'security.jwt-secret', name: '登录令牌密钥', value: '******', category: 'SECURITY', sensitive: true },
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
  createCourse(input: { name: string; code: string; semester: string; description?: string }): CourseSummary {
    const course: CourseSummary = {
      id: Math.max(0, ...courses.map((item) => item.id)) + 1,
      name: input.name,
      code: input.code,
      semester: input.semester,
      status: 'ACTIVE',
      classCount: 0,
      studentCount: 0,
    };
    courses.unshift(course);
    return course;
  },
  createClass(input: { courseId: number; name: string; major?: string; grade?: string }): TeachingClassSummary {
    const teachingClass: TeachingClassSummary = {
      id: Math.max(0, ...classes.map((item) => item.id)) + 1,
      courseId: input.courseId,
      name: input.name,
      major: input.major ?? '',
      grade: input.grade ?? '',
      studentCount: 0,
    };
    classes.unshift(teachingClass);
    classStudentIds.set(teachingClass.id, new Set());
    refreshCourseCounts(input.courseId);
    return teachingClass;
  },
  deleteClass(courseId: number, classId: number): void {
    const index = classes.findIndex((item) => item.id === classId && item.courseId === courseId);
    if (index < 0) {
      throw new Error(`Teaching class not found: ${classId}`);
    }
    classes.splice(index, 1);
    classStudentIds.delete(classId);
    refreshCourseCounts(courseId);
  },
  listOrganizations(): OrganizationSummary[] {
    return organizations;
  },
  createOrganization(input: { parentId: number | null; name: string; type: OrganizationType }): OrganizationSummary {
    const organization: OrganizationSummary = {
      id: Math.max(...organizations.map((item) => item.id)) + 1,
      parentId: input.parentId,
      name: input.name,
      type: input.type,
    };
    organizations.unshift(organization);
    return organization;
  },
  listUsers(role?: RoleCode): UserSummary[] {
    return userDirectory.filter((item) => role === undefined || item.roles.includes(role));
  },
  listClassStudents(classId: number): UserSummary[] {
    const studentIds = getClassStudentIds(classId);
    return userDirectory
      .filter((item) => studentIds.has(item.id) && item.roles.includes('STUDENT'))
      .map((item) => ({ ...item }));
  },
  createUser(input: {
    organizationId: number;
    username: string;
    name: string;
    studentNo?: string;
    teacherNo?: string;
    email?: string;
    phone?: string;
    roles: RoleCode[];
  }): UserSummary {
    const user: UserSummary = {
      id: Math.max(...userDirectory.map((item) => item.id)) + 1,
      organizationId: input.organizationId,
      username: input.username,
      name: input.name,
      ...(input.studentNo ? { studentNo: input.studentNo } : {}),
      ...(input.teacherNo ? { teacherNo: input.teacherNo } : {}),
      ...(input.email ? { email: input.email } : {}),
      ...(input.phone ? { phone: input.phone } : {}),
      status: 'ACTIVE',
      roles: input.roles,
    };
    userDirectory.unshift(user);
    return user;
  },
  getStudentImportPreview(): StudentImportPreview {
    return importPreview;
  },
  importStudents(classId: number, rows: StudentImportRow[]): StudentImportResult {
    const warnings: string[] = [];
    const targetClass = classes.find((item) => item.id === classId);
    const linkedStudents = getClassStudentIds(classId);
    let imported = 0;
    let skipped = 0;
    rows.forEach((row) => {
      if (!row.studentNo || !row.name) {
        skipped += 1;
        warnings.push('存在缺少学号或姓名的记录，已跳过');
        return;
      }
      const existingUser = userDirectory.find((user) => user.studentNo === row.studentNo);
      const studentId = existingUser?.id ?? Math.max(...userDirectory.map((item) => item.id)) + 1;
      if (linkedStudents.has(studentId)) {
        skipped += 1;
        warnings.push(`学号 ${row.studentNo} 已在当前班级，已跳过`);
        return;
      }
      if (!existingUser) {
        userDirectory.unshift({
          id: studentId,
          organizationId: classId,
          username: row.studentNo,
          name: row.name,
          studentNo: row.studentNo,
          ...(row.email ? { email: row.email } : {}),
          ...(row.phone ? { phone: row.phone } : {}),
          status: 'ACTIVE',
          roles: ['STUDENT'],
        });
      }
      linkedStudents.add(studentId);
      imported += 1;
    });
    if (targetClass && imported > 0) {
      targetClass.studentCount += imported;
      refreshCourseCounts(targetClass.courseId);
    } else if (targetClass) {
      targetClass.studentCount = Math.max(targetClass.studentCount, linkedStudents.size);
      refreshCourseCounts(targetClass.courseId);
    }
    return {
      total: rows.length,
      created: imported,
      skipped,
      warnings,
    };
  },
  listClasses(courseId: number): TeachingClassSummary[] {
    refreshClassCounts(courseId);
    refreshCourseCounts(courseId);
    return classes.filter((item) => item.courseId === courseId);
  },
  listAssignments(courseId?: number): AssignmentSummary[] {
    return assignments.filter((item) => courseId === undefined || item.courseId === courseId);
  },
  createAssignment(input: {
    courseId: number;
    title: string;
    deadline: string;
    totalScore: number;
    similarityCheckEnabled: boolean;
    aiGradingEnabled: boolean;
  }): AssignmentSummary {
    const assignment: AssignmentSummary = {
      id: Math.max(...assignments.map((item) => item.id)) + 1,
      courseId: input.courseId,
      title: input.title,
      deadline: input.deadline,
      totalScore: input.totalScore,
      status: 'DRAFT',
      similarityCheckEnabled: input.similarityCheckEnabled,
      aiGradingEnabled: input.aiGradingEnabled,
    };
    assignments.unshift(assignment);
    return assignment;
  },
  publishAssignment(assignmentId: number): AssignmentSummary {
    const assignment = assignments.find((item) => item.id === assignmentId);
    if (!assignment) {
      throw new Error(`Assignment not found: ${assignmentId}`);
    }
    assignment.status = 'PUBLISHED';
    syncStudentTaskForAssignment(assignment);
    demoNotifications.unshift({
      id: Math.max(0, ...demoNotifications.map((item) => item.id)) + 1,
      recipientId: users.STUDENT.id,
      title: '任务发布',
      message: `${assignment.title} 已发布，请及时查看并提交报告。`,
      type: 'ASSIGNMENT_PUBLISHED',
      isRead: false,
      targetUrl: `/tasks/${assignment.id}`,
      createdAt: new Date().toISOString(),
    });
    return { ...assignment };
  },
  listStudentTasks(): SubmissionTask[] {
    assignments
      .filter((assignment) => assignment.status === 'PUBLISHED')
      .forEach(syncStudentTaskForAssignment);
    return studentTasks.filter((task) => assignments.some((assignment) => (
      assignment.id === task.id && assignment.status === 'PUBLISHED'
    )));
  },
  getCollectionOverview(assignmentId?: number): CollectionOverview {
    if (assignmentId === undefined || assignmentId === collectionOverview.assignmentId) {
      const submitted = submissions.filter((item) => item.assignmentId === collectionOverview.assignmentId).length;
      return {
        ...collectionOverview,
        submitted: Math.max(collectionOverview.submitted, submitted),
        unsubmitted: Math.max(0, collectionOverview.totalStudents - Math.max(collectionOverview.submitted, submitted)),
      };
    }
    return {
      assignmentId,
      totalStudents: 0,
      submitted: 0,
      unsubmitted: 0,
      lateSubmitted: 0,
      processing: 0,
      reviewed: 0,
      published: 0,
    };
  },
  listUnsubmittedStudents(assignmentId?: number): UnsubmittedStudent[] {
    return assignmentId === undefined || assignmentId === collectionOverview.assignmentId ? unsubmittedStudents : [];
  },
  listSubmissions(assignmentId?: number, studentId?: number): SubmissionSummary[] {
    return submissions
      .filter((item) => assignmentId === undefined || item.assignmentId === assignmentId)
      .filter((item) => studentId === undefined || item.studentId === studentId)
      .sort((a, b) => Date.parse(b.submittedAt) - Date.parse(a.submittedAt))
      .map((item) => ({ ...item }));
  },
  remindUnsubmitted(assignmentId = collectionOverview.assignmentId, studentIds = unsubmittedStudents.map((student) => student.studentId)): ReminderResult {
    const uniqueStudentIds = [...new Set(studentIds)];
    uniqueStudentIds.forEach((studentId) => {
      pushNotification({
        recipientId: studentId,
        title: '提交催交',
        message: '请尽快提交实训报告，逾期会影响成绩发布。',
        type: 'REMINDER',
        targetUrl: `/tasks/${assignmentId}`,
      });
    });
    return {
      recipientCount: uniqueStudentIds.length,
      messageCount: uniqueStudentIds.length,
      channels: ['站内信'],
      status: '已发送',
    };
  },
  listRubrics(assignmentId?: number): RubricSummary[] {
    return rubrics.filter((item) => assignmentId === undefined || item.assignmentId === assignmentId);
  },
  createRubric(input: {
    assignmentId: number;
    name: string;
    totalScore: number;
    items: Array<{
      title: string;
      score: number;
      courseOutcomeCode: string;
      points: Array<{
        title: string;
        description: string;
        score: number;
        keywords: string[];
        synonyms: string[];
      }>;
    }>;
  }): RubricSummary {
    const nextRubric: RubricSummary = {
      id: Math.max(0, ...rubrics.map((item) => item.id)) + 1,
      assignmentId: input.assignmentId,
      name: input.name,
      totalScore: input.totalScore,
      items: input.items.map((item, index) => ({
        id: Date.now() + index,
        title: item.title,
        score: item.score,
        courseOutcomeCode: item.courseOutcomeCode,
        points: item.points.map((point, pointIndex) => ({
          id: Date.now() + index * 10 + pointIndex,
          title: point.title,
          score: point.score,
          keywords: point.keywords,
        })),
      })),
    };
    rubrics.unshift(nextRubric);
    return nextRubric;
  },
  listGradingJobs(assignmentId?: number): GradingJobSummary[] {
    return gradingJobs.filter((item) => assignmentId === undefined || item.assignmentId === assignmentId);
  },
  listOcrJobs(): OcrJobSummary[] {
    return ocrJobs;
  },
  listGradingResults(assignmentId?: number): GradingResultSummary[] {
    return gradingResults.filter((item) => assignmentId === undefined || item.assignmentId === assignmentId);
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
    pushNotification({
      recipientId: result.studentId,
      title: '成绩发布',
      message: `您的实训报告成绩已发布，最终成绩 ${result.teacherScore}/${result.totalScore}。`,
      type: 'GRADE_PUBLISHED',
      targetUrl: `/results/${result.id}`,
    });
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
  getGradeStatistics(assignmentId?: number): GradeStatisticsSummary {
    if (assignmentId === undefined || assignmentId === gradeStatistics.assignmentId) {
      return gradeStatistics;
    }
    return {
      ...gradeStatistics,
      assignmentId,
      submittedCount: 0,
      publishedCount: 0,
      averageScore: 0,
      standardDeviation: 0,
      maxScore: 0,
      minScore: 0,
      difficultyIndex: 0,
      discriminationIndex: 0,
      scoreBuckets: gradeStatistics.scoreBuckets.map((bucket) => ({ ...bucket, studentCount: 0 })),
    };
  },
  listLossPoints(assignmentId?: number): LossPointSummary[] {
    return assignmentId === undefined || assignmentId === gradeStatistics.assignmentId ? lossPoints : [];
  },
  listCourseOutcomes(assignmentId?: number): CourseOutcomeAchievement[] {
    return assignmentId === undefined || assignmentId === gradeStatistics.assignmentId ? courseOutcomes : [];
  },
  listSimilarityJobs(assignmentId?: number): SimilarityJobSummary[] {
    return similarityJobs.filter((item) => assignmentId === undefined || item.assignmentId === assignmentId);
  },
  startSimilarityJob(assignmentId = 1, submissionIds = [1, 18, 43]): SimilarityJobSummary {
    const job: SimilarityJobSummary = {
      id: similarityJobs.length + 1,
      assignmentId,
      checkedSubmissionCount: submissionIds.length,
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
  listAuditLogs(): AuditLogSummary[] {
    return auditLogs;
  },
  listSystemSettings(): SystemSettingSummary[] {
    return systemSettings;
  },
  updateSystemSetting(key: string, value: string): SystemSettingSummary {
    const index = systemSettings.findIndex((item) => item.key === key);
    if (index < 0) {
      throw new Error(`System setting not found: ${key}`);
    }
    const current = systemSettings[index];
    const updated = {
      ...current,
      value: current.sensitive ? '******' : value,
    };
    systemSettings[index] = updated;
    return updated;
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
    pushNotification({
      recipientId: users.TEACHER.id,
      title: '学生提交申诉',
      message: `${appeal.studentName} 对批改结果提交了申诉，请及时处理。`,
      type: 'APPEAL',
      targetUrl: `/appeals/${appeal.id}`,
    });
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
    pushNotification({
      recipientId: appeal.studentId,
      title: accepted ? '申诉已采纳' : '申诉已驳回',
      message: teacherReply,
      type: 'APPEAL',
      targetUrl: `/results/${appeal.resultId}`,
    });
    return appeal;
  },
  startGradingJob(assignmentId = 1, rubricId = 1, submissionIds = [1]): GradingJobSummary {
    const job: GradingJobSummary = {
      id: gradingJobs.length + 1,
      assignmentId,
      rubricId,
      totalSubmissions: submissionIds.length,
      completedSubmissions: submissionIds.length,
      status: 'COMPLETED',
      confidence: 86,
      createdAt: new Date().toISOString(),
    };
    gradingJobs.unshift(job);
    createGradingResultsForSubmissions(assignmentId, submissionIds);
    pushNotification({
      recipientId: users.TEACHER.id,
      title: '批改完成',
      message: `AI 已完成 ${submissionIds.length} 份报告批改，请进入人工复核。`,
      type: 'GRADING_COMPLETE',
      targetUrl: `/review/${assignmentId}`,
    });
    return job;
  },
  createUploadReceipt(fileName: string, assignmentId = 1, studentId = 2): UploadReceipt {
    const student = userDirectory.find((item) => item.id === studentId);
    const submittedAt = new Date().toISOString();
    const existing = submissions.find((item) => item.assignmentId === assignmentId && item.studentId === studentId);
    const version = (existing?.version ?? 0) + 1;
    const submissionId = existing?.id ?? Math.max(0, ...submissions.map((item) => item.id)) + 1;
    const nextSubmission: SubmissionSummary = {
      id: submissionId,
      assignmentId,
      studentId,
      studentName: student?.name ?? '张三',
      studentNo: student?.studentNo ?? student?.username ?? '2024010101',
      fileName,
      objectKey: `assignments/${assignmentId}/students/${studentId}/${fileName}`,
      version,
      status: 'SUBMITTED',
      submittedAt,
    };
    if (existing) {
      Object.assign(existing, nextSubmission);
      for (let index = submissions.length - 1; index >= 0; index -= 1) {
        if (
          submissions[index].assignmentId === assignmentId &&
          submissions[index].studentId === studentId &&
          submissions[index].id !== submissionId
        ) {
          submissions.splice(index, 1);
        }
      }
      for (let index = gradingResults.length - 1; index >= 0; index -= 1) {
        if (gradingResults[index].submissionId === submissionId) {
          gradingResults.splice(index, 1);
        }
      }
    } else {
      submissions.unshift(nextSubmission);
    }
    const task = studentTasks.find((item) => item.id === assignmentId);
    if (task) {
      task.status = '已提交';
      task.score = undefined;
      task.submissionId = submissionId;
      task.fileName = fileName;
      task.version = version;
      task.submittedAt = submittedAt;
    }
    pushNotification({
      recipientId: users.TEACHER.id,
      title: existing ? '学生覆盖提交报告' : '学生已提交报告',
      message: existing
        ? `${student?.name ?? '学生'} 已覆盖上一份报告，教师端将以最新文件为准：${fileName}`
        : `${student?.name ?? '学生'} 已提交报告：${fileName}`,
      type: 'SUBMISSION_UPLOADED',
      targetUrl: `/collection/${assignmentId}`,
    });
    return {
      submissionId,
      fileName,
      version,
      submittedAt,
      status: '已提交',
    };
  },
  deleteSubmission(submissionId: number): void {
    const submissionIndex = submissions.findIndex((item) => item.id === submissionId);
    if (submissionIndex < 0) {
      throw new Error(`Submission not found: ${submissionId}`);
    }
    const [submission] = submissions.splice(submissionIndex, 1);
    for (let index = gradingResults.length - 1; index >= 0; index -= 1) {
      if (gradingResults[index].submissionId === submissionId) {
        gradingResults.splice(index, 1);
      }
    }
    const latest = submissions
      .filter((item) => item.assignmentId === submission.assignmentId && item.studentId === submission.studentId)
      .sort((a, b) => Date.parse(b.submittedAt) - Date.parse(a.submittedAt))[0];
    const task = studentTasks.find((item) => item.id === submission.assignmentId);
    const publishedResult = gradingResults.find((item) => (
      item.assignmentId === submission.assignmentId &&
      item.studentId === submission.studentId &&
      item.publicationStatus === 'PUBLISHED'
    ));
    if (task) {
      if (publishedResult) {
        task.status = '已发布成绩';
        task.score = publishedResult.teacherScore;
      } else if (latest) {
        task.status = latest.status === 'PROCESSING' || latest.status === 'GRADED' || latest.status === 'REVIEWED'
          ? '批改中'
          : '已提交';
        task.score = undefined;
      } else {
        task.status = '未提交';
        task.score = undefined;
      }
    }
  },
  listNotifications(userId: number, unreadOnly = false): NotificationItem[] {
    return demoNotifications
      .filter((n) => n.recipientId === userId)
      .filter((n) => !unreadOnly || !n.isRead)
      .map((n) => ({ ...n }));
  },
  markNotificationAsRead(notificationId: number): void {
    const notification = demoNotifications.find((n) => n.id === notificationId);
    if (notification) {
      notification.isRead = true;
    }
  },
  markAllNotificationsAsRead(userId?: number): void {
    demoNotifications.forEach((n) => {
      if (userId === undefined || n.recipientId === userId) {
        n.isRead = true;
      }
    });
  },
  createNotification(input: {
    assignmentId?: number | null;
    recipientId: number;
    title: string;
    message: string;
    type: string;
    targetUrl?: string | null;
  }): NotificationItem {
    const notification: DemoNotification = {
      id: Math.max(0, ...demoNotifications.map((item) => item.id)) + 1,
      recipientId: input.recipientId,
      title: input.title,
      message: input.message,
      type: input.type,
      isRead: false,
      targetUrl: input.targetUrl ?? '',
      createdAt: new Date().toISOString(),
    };
    demoNotifications.unshift(notification);
    return notification;
  },
};

type DemoNotification = NotificationItem & { recipientId: number };

const demoNotifications: DemoNotification[] = [
  { id: 1, recipientId: users.STUDENT.id, title: '任务发布', message: 'Java Web 综合实训报告已发布，请及时查看要求。', type: 'ASSIGNMENT_PUBLISHED', isRead: false, targetUrl: '/tasks/1', createdAt: new Date(Date.now() - 75 * 60_000).toISOString() },
  { id: 2, recipientId: users.TEACHER.id, title: '催交提醒', message: '您有 31 名学生未提交实训报告，请及时催交。', type: 'REMINDER', isRead: false, targetUrl: '/collection/1', createdAt: new Date(Date.now() - 60 * 60_000).toISOString() },
  { id: 3, recipientId: users.TEACHER.id, title: '批改完成', message: 'AI 已完成 65 份报告的批改，请前往复核。', type: 'GRADING_COMPLETE', isRead: false, targetUrl: '/review/1', createdAt: new Date(Date.now() - 45 * 60_000).toISOString() },
  { id: 4, recipientId: users.STUDENT.id, title: '成绩发布', message: '您的实训报告成绩已发布，请查看详情。', type: 'GRADE_PUBLISHED', isRead: true, targetUrl: '/results/1', createdAt: new Date(Date.now() - 30 * 60_000).toISOString() },
  { id: 5, recipientId: users.TEACHER.id, title: '申诉处理', message: '您有一条申诉需要处理。', type: 'APPEAL', isRead: true, targetUrl: '/appeals/1', createdAt: new Date(Date.now() - 15 * 60_000).toISOString() },
];

function pushNotification(input: {
  recipientId?: number;
  title: string;
  message: string;
  type: string;
  targetUrl: string;
}) {
  demoNotifications.unshift({
    id: Math.max(0, ...demoNotifications.map((item) => item.id)) + 1,
    recipientId: input.recipientId ?? users.TEACHER.id,
    title: input.title,
    message: input.message,
    type: input.type,
    isRead: false,
    targetUrl: input.targetUrl,
    createdAt: new Date().toISOString(),
  });
}

function refreshCourseCounts(courseId: number) {
  const course = courses.find((item) => item.id === courseId);
  if (!course) {
    return;
  }
  const courseClasses = classes.filter((item) => item.courseId === courseId);
  course.classCount = courseClasses.length;
  course.studentCount = courseClasses.reduce((total, item) => total + item.studentCount, 0);
}

function refreshClassCounts(courseId: number) {
  classes
    .filter((item) => item.courseId === courseId)
    .forEach((item) => {
      const linkedStudents = classStudentIds.get(item.id);
      if (linkedStudents) {
        item.studentCount = linkedStudents.size;
      }
    });
}

function getClassStudentIds(classId: number) {
  const linkedStudents = classStudentIds.get(classId);
  if (linkedStudents) {
    return linkedStudents;
  }
  const next = new Set<number>();
  classStudentIds.set(classId, next);
  return next;
}

function syncStudentTaskForAssignment(assignment: AssignmentSummary) {
  if (assignment.status !== 'PUBLISHED') {
    return;
  }
  const existing = studentTasks.find((task) => task.id === assignment.id);
  const course = courses.find((item) => item.id === assignment.courseId);
  const latestSubmission = submissions
    .filter((item) => item.assignmentId === assignment.id && item.studentId === users.STUDENT.id)
    .sort((a, b) => Date.parse(b.submittedAt) - Date.parse(a.submittedAt))[0];
  const publishedResult = gradingResults.find((item) => (
    item.assignmentId === assignment.id &&
    item.studentId === users.STUDENT.id &&
    item.publicationStatus === 'PUBLISHED'
  ));
  const nextTask: SubmissionTask = {
    id: assignment.id,
    title: assignment.title,
    courseId: assignment.courseId,
    courseName: course?.name ?? '未知课程',
    deadline: assignment.deadline,
    status: latestSubmission ? '已提交' : '未提交',
  };
  if (latestSubmission) {
    nextTask.submissionId = latestSubmission.id;
    nextTask.fileName = latestSubmission.fileName;
    nextTask.version = latestSubmission.version;
    nextTask.submittedAt = latestSubmission.submittedAt;
    if (latestSubmission.status === 'PROCESSING' || latestSubmission.status === 'GRADED' || latestSubmission.status === 'REVIEWED') {
      nextTask.status = '批改中';
    }
  }
  if (publishedResult) {
    nextTask.status = '已发布成绩';
    nextTask.score = publishedResult.teacherScore;
  }
  if (existing) {
    Object.assign(existing, nextTask);
  } else {
    studentTasks.unshift(nextTask);
  }
}

function createGradingResultsForSubmissions(assignmentId: number, submissionIds: number[]) {
  const assignment = assignments.find((item) => item.id === assignmentId);
  const rubric = rubrics.find((item) => item.assignmentId === assignmentId) ?? rubrics[0];
  const targetSubmissions = submissions.filter((item) => (
    item.assignmentId === assignmentId && submissionIds.includes(item.id)
  ));
  targetSubmissions.forEach((submission) => {
    if (gradingResults.some((result) => result.submissionId === submission.id)) {
      return;
    }
    submission.status = 'REVIEWED';
    const resultId = Math.max(0, ...gradingResults.map((item) => item.id)) + 1;
    const items = (rubric?.items ?? []).map((item) => ({
      rubricItemId: item.id,
      title: item.title,
      maxScore: item.score,
      aiScore: Math.max(0, Math.round(item.score * 0.82)),
      teacherScore: Math.max(0, Math.round(item.score * 0.82)),
      deductionReason: '系统根据当前报告内容生成初评，建议教师结合原文复核。',
      teacherComment: '请教师确认该分项得分和评语。',
      confidence: 82,
      evidence: ['学生提交报告', '评分标准关键点'],
    }));
    const teacherScore = items.reduce((total, item) => total + item.teacherScore, 0);
    gradingResults.unshift({
      id: resultId,
      assignmentId,
      submissionId: submission.id,
      studentId: submission.studentId,
      studentName: submission.studentName,
      studentNo: submission.studentNo,
      fileName: gradingReportFileName(submission, assignment),
      previewUrl: null,
      annotationPdfUrl: null,
      totalScore: assignment?.totalScore ?? rubric?.totalScore ?? 100,
      aiScore: teacherScore,
      teacherScore,
      confidence: 82,
      reviewStatus: 'NEEDS_REVIEW',
      publicationStatus: 'NOT_PUBLISHED',
      overallComment: 'AI 已生成初评结果，请教师完成复核后再发布成绩。',
      reviewedAt: null,
      publishedAt: null,
      items,
      annotations: [
        {
          id: resultId * 10 + 1,
          page: 1,
          anchorText: '学生提交报告',
          comment: '请教师核对报告内容与评分标准是否匹配。',
          severity: 'info',
        },
      ],
    });
  });
  assignments
    .filter((item) => item.status === 'PUBLISHED')
    .forEach(syncStudentTaskForAssignment);
}

function gradingReportFileName(submission: SubmissionSummary, assignment: AssignmentSummary | undefined) {
  const course = assignment ? courses.find((item) => item.id === assignment.courseId) : undefined;
  return `${submission.studentName}-${course?.name ?? '课程'}-自动批改报告.pdf`;
}
