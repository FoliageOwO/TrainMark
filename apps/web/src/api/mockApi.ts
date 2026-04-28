import type {
  AssignmentSummary,
  CourseSummary,
  DashboardMetrics,
  OrganizationSummary,
  RoleCode,
  StudentImportPreview,
  SubmissionTask,
  TeachingClassSummary,
  UploadReceipt,
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
  { id: 1, title: 'Java Web 综合实训报告', courseName: 'Java Web 综合实训', status: '未提交', deadline: '2026-05-10T23:59:00+08:00' },
  { id: 2, title: '数据库设计报告', courseName: '数据库设计实训', status: '已发布成绩', deadline: '2026-04-20T23:59:00+08:00', score: 88 },
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
