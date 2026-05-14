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

export type UploadReceipt = {
  submissionId: number;
  fileName: string;
  version: number;
  submittedAt: string;
  status: '已提交' | '批改中' | '已发布成绩';
};

export type CollectionOverview = {
  assignmentId: number;
  totalStudents: number;
  submitted: number;
  unsubmitted: number;
  lateSubmitted: number;
  processing: number;
  reviewed: number;
  published: number;
};

export type UnsubmittedStudent = {
  studentId: number;
  studentNo: string;
  name: string;
  className: string;
  email: string;
};

export type ReminderResult = {
  recipientCount: number;
  messageCount: number;
  channels: Array<'站内信' | '邮件' | '企业微信'>;
  status: '已发送';
};

export type RubricPoint = {
  id: number;
  title: string;
  score: number;
  keywords: string[];
};

export type RubricItem = {
  id: number;
  title: string;
  score: number;
  courseOutcomeCode: string;
  points: RubricPoint[];
};

export type RubricSummary = {
  id: number;
  assignmentId: number;
  name: string;
  totalScore: number;
  items: RubricItem[];
};

export type GradingJobStatus = 'PENDING' | 'OCR_RUNNING' | 'STRUCTURING' | 'SCORING' | 'ANNOTATING' | 'COMPLETED' | 'FAILED' | 'RETRYING';

export type GradingJobSummary = {
  id: number;
  assignmentId: number;
  rubricId: number;
  totalSubmissions: number;
  completedSubmissions: number;
  status: GradingJobStatus;
  confidence: number;
  createdAt: string;
};

export type OcrJobStatus = 'PENDING' | 'PREPROCESSING' | 'RECOGNIZING' | 'STRUCTURING' | 'COMPLETED' | 'FAILED';

export type OcrBlock = {
  type: 'heading' | 'paragraph' | 'table' | 'image';
  title: string;
  page: number;
  confidence: number;
};

export type OcrJobSummary = {
  id: number;
  submissionId: number;
  objectKey: string;
  status: OcrJobStatus;
  pageCount: number;
  textBlockCount: number;
  tableCount: number;
  confidence: number;
  blocks: OcrBlock[];
};

export type ReviewStatus = 'NEEDS_REVIEW' | 'IN_REVIEW' | 'APPROVED' | 'RETURNED';

export type PublicationStatus = 'NOT_PUBLISHED' | 'PUBLISHED' | 'WITHDRAWN';

export type GradingReviewItem = {
  rubricItemId: number;
  title: string;
  maxScore: number;
  aiScore: number;
  teacherScore: number;
  deductionReason: string;
  teacherComment: string;
  confidence: number;
  evidence: string[];
};

export type GradingAnnotation = {
  id: number;
  page: number;
  anchorText: string;
  comment: string;
  severity: 'info' | 'warning' | 'error';
};

export type GradingResultSummary = {
  id: number;
  assignmentId: number;
  submissionId: number;
  studentId: number;
  studentName: string;
  studentNo: string;
  fileName: string;
  previewUrl: string;
  annotationPdfUrl: string;
  totalScore: number;
  aiScore: number;
  teacherScore: number;
  confidence: number;
  reviewStatus: ReviewStatus;
  publicationStatus: PublicationStatus;
  overallComment: string;
  reviewedAt: string | null;
  publishedAt: string | null;
  items: GradingReviewItem[];
  annotations: GradingAnnotation[];
};

export type GradePublicationAuditEntry = {
  id: number;
  resultId: number;
  action: 'PUBLISH' | 'WITHDRAW';
  operatorName: string;
  reason: string;
  createdAt: string;
};
