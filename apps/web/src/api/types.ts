export type RoleCode = 'STUDENT' | 'TEACHER' | 'COURSE_OWNER' | 'SUPERVISOR' | 'ADMIN';

export type UserProfile = {
  id: number;
  name: string;
  username: string;
  roles: RoleCode[];
};

export type OrganizationType = 'COLLEGE' | 'MAJOR' | 'CLASS';

export type UserStatus = 'ACTIVE' | 'DISABLED' | 'PENDING';

export type OrganizationSummary = {
  id: number;
  parentId: number | null;
  name: string;
  type: OrganizationType;
};

export type UserSummary = {
  id: number;
  organizationId: number;
  username: string;
  name: string;
  studentNo?: string;
  teacherNo?: string;
  email?: string;
  phone?: string;
  status: UserStatus;
  roles: RoleCode[];
};

export type StudentImportPreview = {
  total: number;
  valid: number;
  duplicated: number;
  invalid: number;
};

export type CourseStatus = 'DRAFT' | 'ACTIVE' | 'ARCHIVED';

export type AssignmentStatus = 'DRAFT' | 'PUBLISHED' | 'CLOSED' | 'ARCHIVED';

export type CourseSummary = {
  id: number;
  name: string;
  code: string;
  semester: string;
  status: CourseStatus;
  classCount: number;
  studentCount: number;
};

export type TeachingClassSummary = {
  id: number;
  courseId: number;
  name: string;
  major: string;
  grade: string;
  studentCount: number;
};

export type AssignmentSummary = {
  id: number;
  courseId: number;
  title: string;
  deadline: string;
  totalScore: number;
  status: AssignmentStatus;
  similarityCheckEnabled: boolean;
  aiGradingEnabled: boolean;
};

export type DashboardMetrics = {
  activeAssignments: number;
  pendingGrading: number;
  pendingReview: number;
  unsubmitted: number;
};

export type SubmissionTask = {
  id: number;
  title: string;
  courseName: string;
  status: '未提交' | '已提交' | '批改中' | '已发布成绩';
  deadline: string;
  score?: number;
};
