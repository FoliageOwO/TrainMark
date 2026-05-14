import { mockApi } from './mockApi';
import type {
  AppealSummary,
  AssignmentSummary,
  AuditLogSummary,
  CollectionOverview,
  CourseOutcomeAchievement,
  CourseSummary,
  GradeExportSummary,
  GradeStatisticsSummary,
  GradingResultSummary,
  GradingJobSummary,
  LossPointSummary,
  OcrJobSummary,
  OrganizationSummary,
  ReminderResult,
  RubricSummary,
  SimilarityJobSummary,
  SubmissionSummary,
  SubmissionTask,
  SystemSettingSummary,
  TeachingClassSummary,
  UploadReceipt,
  UnsubmittedStudent,
  UserSummary,
} from './types';

type ApiResponse<T> = {
  success: boolean;
  data: T;
  message: string;
};

export type WorkspaceData = {
  courses: CourseSummary[];
  classes: TeachingClassSummary[];
  assignments: AssignmentSummary[];
  organizations: OrganizationSummary[];
  students: UserSummary[];
  collectionOverview: CollectionOverview;
  unsubmittedStudents: UnsubmittedStudent[];
  rubrics: RubricSummary[];
  gradingJobs: GradingJobSummary[];
  ocrJobs: OcrJobSummary[];
  gradingResults: GradingResultSummary[];
  publishedResults: GradingResultSummary[];
  submissions: SubmissionSummary[];
  studentTasks: SubmissionTask[];
  gradeStatistics: GradeStatisticsSummary;
  gradeExports: GradeExportSummary[];
  lossPoints: LossPointSummary[];
  courseOutcomes: CourseOutcomeAchievement[];
  appeals: AppealSummary[];
  similarityJobs: SimilarityJobSummary[];
  auditLogs: AuditLogSummary[];
  systemSettings: SystemSettingSummary[];
};

export type CreateAssignmentInput = {
  courseId: number;
  title: string;
  description?: string;
  deadline: string;
  totalScore: number;
  classIds: number[];
  similarityCheckEnabled: boolean;
  aiGradingEnabled: boolean;
};

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8080';
const API_MODE = import.meta.env.VITE_API_MODE ?? 'mock';

export function shouldUseHttpApi() {
  return API_MODE === 'http';
}

export function resolveApiAssetUrl(path: string) {
  if (!path || path.startsWith('data:') || path.startsWith('blob:')) {
    return path;
  }
  if (/^https?:\/\//i.test(path)) {
    return path;
  }
  if (shouldUseHttpApi() && path.startsWith('/')) {
    return `${API_BASE_URL.replace(/\/$/, '')}${path}`;
  }
  return path;
}

export async function loadWorkspaceData(selectedCourseId: number, studentId: number): Promise<WorkspaceData> {
  const fallbackGradingResults = mockApi.listGradingResults();
  const [
    courses,
    classes,
    assignments,
    organizations,
    students,
    collectionOverview,
    unsubmittedStudents,
    rubrics,
    gradingJobs,
    ocrJobs,
    gradingResults,
    submissions,
    gradeExports,
    gradeStatistics,
    lossPoints,
    courseOutcomes,
    appeals,
    similarityJobs,
    auditLogs,
    systemSettings,
  ] = await Promise.all([
    getOr('/api/courses', mockApi.listCourses()),
    getOr(`/api/courses/${selectedCourseId}/classes`, mockApi.listClasses(selectedCourseId)),
    getOr(`/api/assignments?courseId=${selectedCourseId}`, mockApi.listAssignments(selectedCourseId)),
    getOr('/api/organizations', mockApi.listOrganizations()),
    getOr('/api/users?role=STUDENT', mockApi.listUsers('STUDENT')),
    getOr('/api/notifications/assignments/1/collection', mockApi.getCollectionOverview()),
    getOr('/api/notifications/assignments/1/unsubmitted', mockApi.listUnsubmittedStudents()),
    getOr('/api/rubrics', mockApi.listRubrics()),
    getOr('/api/grading/jobs', mockApi.listGradingJobs()),
    loadOcrJobs(),
    getOr('/api/grading/results', fallbackGradingResults),
    getOr(`/api/submissions?studentId=${studentId}`, [] as SubmissionSummary[]),
    getOr('/api/grading/exports?assignmentId=1', mockApi.listGradeExports(1)),
    getOr('/api/analytics/grade-statistics?assignmentId=1', mockApi.getGradeStatistics()),
    getOr('/api/analytics/loss-points?assignmentId=1', mockApi.listLossPoints()),
    getOr('/api/analytics/course-outcomes?assignmentId=1', mockApi.listCourseOutcomes()),
    getOr('/api/grading/results/appeals', mockApi.listAppeals()),
    getOr('/api/similarity/jobs', mockApi.listSimilarityJobs()),
    getOr('/api/admin/audit-logs', mockApi.listAuditLogs()),
    getOr('/api/admin/settings', mockApi.listSystemSettings()),
  ]);
  const publishedResults = gradingResults.filter((item) => item.publicationStatus === 'PUBLISHED' && item.studentId === studentId);

  return {
    courses,
    classes,
    assignments,
    organizations,
    students,
    collectionOverview,
    unsubmittedStudents,
    rubrics,
    gradingJobs,
    ocrJobs,
    gradingResults,
    publishedResults,
    submissions,
    studentTasks: deriveStudentTasks(assignments, courses, submissions, publishedResults, studentId),
    gradeExports,
    gradeStatistics,
    lossPoints,
    courseOutcomes,
    appeals,
    similarityJobs,
    auditLogs,
    systemSettings,
  };
}

function deriveStudentTasks(
  assignments: AssignmentSummary[],
  courses: CourseSummary[],
  submissions: SubmissionSummary[],
  publishedResults: GradingResultSummary[],
  studentId: number,
): SubmissionTask[] {
  const courseNameById = new Map(courses.map((course) => [course.id, course.name]));
  const submissionsByAssignment = groupLatestStudentSubmissions(submissions, studentId);
  const resultByAssignment = new Map(publishedResults.map((result) => [result.assignmentId, result]));

  return assignments.map((assignment) => {
    const submission = submissionsByAssignment.get(assignment.id);
    const result = resultByAssignment.get(assignment.id);
    return {
      id: assignment.id,
      title: assignment.title,
      courseName: courseNameById.get(assignment.courseId) ?? '未知课程',
      status: deriveTaskStatus(submission?.status, Boolean(result)),
      deadline: assignment.deadline,
      ...(result ? { score: result.teacherScore } : {}),
    };
  });
}

function groupLatestStudentSubmissions(submissions: SubmissionSummary[], studentId: number) {
  return submissions.reduce((latest, submission) => {
    if (submission.studentId !== studentId) {
      return latest;
    }
    const current = latest.get(submission.assignmentId);
    if (!current || Date.parse(submission.submittedAt) > Date.parse(current.submittedAt)) {
      latest.set(submission.assignmentId, submission);
    }
    return latest;
  }, new Map<number, SubmissionSummary>());
}

function deriveTaskStatus(status: SubmissionSummary['status'] | undefined, hasPublishedResult: boolean): SubmissionTask['status'] {
  if (hasPublishedResult || status === 'PUBLISHED') {
    return '已发布成绩';
  }
  if (status === 'PROCESSING' || status === 'GRADED' || status === 'REVIEWING' || status === 'REVIEWED') {
    return '批改中';
  }
  if (status === 'SUBMITTED' || status === 'LATE_SUBMITTED' || status === 'RETURNED' || status === 'FAILED') {
    return '已提交';
  }
  return '未提交';
}

async function getOr<T, R = T>(path: string, fallback: T, normalize?: (value: R) => T): Promise<T> {
  if (!shouldUseHttpApi()) {
    return fallback;
  }

  try {
    const response = await fetch(`${API_BASE_URL}${path}`);
    if (!response.ok) {
      return fallback;
    }
    const payload = (await response.json()) as ApiResponse<R>;
    if (!payload.success) {
      return fallback;
    }
    return normalize ? normalize(payload.data) : (payload.data as unknown as T);
  } catch {
    return fallback;
  }
}

export async function createGradingJob(assignmentId: number, rubricId: number): Promise<GradingJobSummary> {
  return mutateOr(
    'POST',
    '/api/grading/jobs',
    { assignmentId, rubricId, submissionIds: [1] },
    () => mockApi.startGradingJob(),
  );
}

export async function updateReviewItem(
  resultId: number,
  rubricItemId: number,
  teacherScore: number,
  teacherComment: string,
): Promise<GradingResultSummary> {
  return mutateOr(
    'PATCH',
    `/api/grading/results/${resultId}/items`,
    { rubricItemId, teacherScore, teacherComment },
    () => mockApi.updateReviewItem(resultId, rubricItemId, teacherScore, teacherComment),
  );
}

export async function approveGradingResult(resultId: number, reviewerName: string, overallComment: string): Promise<GradingResultSummary> {
  return mutateOr(
    'POST',
    `/api/grading/results/${resultId}/approve`,
    { reviewerName, overallComment },
    () => mockApi.approveGradingResult(resultId),
  );
}

export async function publishGradingResult(resultId: number, operatorName: string): Promise<GradingResultSummary> {
  return mutateOr(
    'POST',
    `/api/grading/results/${resultId}/publish`,
    { operatorName, message: '发布成绩与批注' },
    () => mockApi.publishGradingResult(resultId),
  );
}

export async function withdrawGradingResult(resultId: number, operatorName: string, reason = '复核后重新发布'): Promise<GradingResultSummary> {
  return mutateOr(
    'POST',
    `/api/grading/results/${resultId}/withdraw`,
    { operatorName, reason },
    () => mockApi.withdrawGradingResult(resultId, reason),
  );
}

export async function loadPublicationAudits(resultId: number) {
  return getOr(`/api/grading/results/${resultId}/publication-audits`, mockApi.listPublicationAudits(resultId));
}

export async function createGradeExport(assignmentId: number, operatorName: string, format: GradeExportSummary['format'] = 'CSV') {
  return mutateOr(
    'POST',
    '/api/grading/exports',
    { assignmentId, format, operatorName },
    () => mockApi.createGradeExport(assignmentId, format),
  );
}

export async function createAppeal(
  resultId: number,
  rubricItemId: number | null,
  studentId: number,
  reason: string,
  requestedChange: string,
) {
  return mutateOr(
    'POST',
    '/api/grading/results/appeals',
    { resultId, rubricItemId, studentId, reason, requestedChange },
    () => mockApi.createAppeal(resultId, rubricItemId, studentId, reason, requestedChange),
  );
}

export async function resolveAppeal(appealId: number, accepted: boolean, teacherReply: string) {
  return mutateOr(
    'POST',
    `/api/grading/results/appeals/${appealId}/resolve`,
    { status: accepted ? 'ACCEPTED' : 'REJECTED', teacherReply },
    () => mockApi.resolveAppeal(appealId, accepted, teacherReply),
  );
}

export async function remindUnsubmitted(assignmentId: number, studentIds: number[]): Promise<ReminderResult> {
  return mutateOr(
    'POST',
    '/api/notifications/remind-unsubmitted',
    {
      assignmentId,
      studentIds,
      channels: ['IN_APP', 'EMAIL', 'WECHAT_WORK'],
      message: '请尽快提交实训报告，逾期会影响成绩发布。',
    },
    () => mockApi.remindUnsubmitted(),
    normalizeReminderResult,
  );
}

export async function startSimilarityJob(assignmentId: number): Promise<SimilarityJobSummary> {
  return mutateOr(
    'POST',
    '/api/similarity/jobs',
    { assignmentId, submissionIds: [1, 18, 43], includeHistory: true },
    () => mockApi.startSimilarityJob(),
  );
}

export async function createAssignment(input: CreateAssignmentInput): Promise<AssignmentSummary> {
  return mutateOr(
    'POST',
    '/api/assignments',
    input,
    () => mockApi.createAssignment(input),
  );
}

export async function createUploadReceipt(fileName: string, assignmentId: number, studentId: number): Promise<UploadReceipt> {
  if (!shouldUseHttpApi()) {
    return mockApi.createUploadReceipt(fileName);
  }

  try {
    const init = await request<{ uploadId: string; objectKey: string }>('/api/submissions/upload/init', 'POST', {
      assignmentId,
      studentId,
      fileName,
      contentType: guessContentType(fileName),
      fileSize: 1024 * 1024,
      checksum: null,
    });
    const receipt = await request<BackendSubmissionReceipt>('/api/submissions/upload/complete', 'POST', {
      uploadId: init.uploadId,
      objectKey: init.objectKey,
      checksum: null,
    });
    return normalizeUploadReceipt(receipt);
  } catch {
    return mockApi.createUploadReceipt(fileName);
  }
}

async function mutateOr<T, R = T>(
  method: 'POST' | 'PATCH',
  path: string,
  body: unknown,
  fallback: () => T,
  normalize?: (value: R) => T,
): Promise<T> {
  if (!shouldUseHttpApi()) {
    return fallback();
  }

  try {
    const value = await request<R>(path, method, body);
    return normalize ? normalize(value) : (value as unknown as T);
  } catch {
    return fallback();
  }
}

async function request<T>(path: string, method: 'POST' | 'PATCH', body: unknown): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!response.ok) {
    throw new Error(`HTTP ${response.status} for ${path}`);
  }
  const payload = (await response.json()) as ApiResponse<T>;
  if (!payload.success) {
    throw new Error(payload.message || `API request failed for ${path}`);
  }
  return payload.data;
}

function normalizeOcrJobs(value: Array<Omit<OcrJobSummary, 'blocks'> & { blocks?: OcrJobSummary['blocks'] }>): OcrJobSummary[] {
  return value.map((item) => ({
    ...item,
    blocks: item.blocks ?? [],
  }));
}

async function loadOcrJobs(): Promise<OcrJobSummary[]> {
  const jobs = await getOr('/api/ocr/jobs', mockApi.listOcrJobs(), normalizeOcrJobs);
  if (!shouldUseHttpApi()) {
    return jobs;
  }

  return Promise.all(jobs.map(async (job) => {
    if (job.blocks.length > 0) {
      return job;
    }
    const result = await getOr(`/api/ocr/jobs/${job.id}/result`, { blocks: [] as OcrJobSummary['blocks'] });
    return {
      ...job,
      blocks: result.blocks,
    };
  }));
}

function normalizeReminderResult(value: {
  recipientCount: number;
  messageCount: number;
}): ReminderResult {
  return {
    recipientCount: value.recipientCount,
    messageCount: value.messageCount,
    channels: ['站内信', '邮件', '企业微信'],
    status: '已发送',
  };
}

type BackendSubmissionReceipt = {
  submissionId: number;
  fileName: string;
  version: number;
  submittedAt: string;
};

function normalizeUploadReceipt(value: BackendSubmissionReceipt): UploadReceipt {
  return {
    submissionId: value.submissionId,
    fileName: value.fileName,
    version: value.version,
    submittedAt: value.submittedAt,
    status: '已提交',
  };
}

function guessContentType(fileName: string) {
  const normalized = fileName.toLowerCase();
  if (normalized.endsWith('.pdf')) {
    return 'application/pdf';
  }
  if (normalized.endsWith('.docx')) {
    return 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
  }
  if (normalized.endsWith('.png')) {
    return 'image/png';
  }
  if (normalized.endsWith('.jpg') || normalized.endsWith('.jpeg')) {
    return 'image/jpeg';
  }
  return 'application/octet-stream';
}
