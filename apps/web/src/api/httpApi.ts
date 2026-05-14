import { mockApi } from './mockApi';
import type {
  AppealSummary,
  AssignmentSummary,
  AuditLogSummary,
  CollectionOverview,
  CourseOutcomeAchievement,
  CourseSummary,
  GradeExportSummary,
  GradePublicationAuditEntry,
  GradeStatisticsSummary,
  GradingResultSummary,
  GradingJobSummary,
  LossPointSummary,
  LoginResponse,
  OcrJobSummary,
  OrganizationType,
  OrganizationSummary,
  ReminderResult,
  RubricSummary,
  SimilarityJobSummary,
  StudentImportResult,
  StudentImportRow,
  SubmissionSummary,
  SubmissionTask,
  SystemSettingSummary,
  TeachingClassSummary,
  UploadReceipt,
  UnsubmittedStudent,
  UserSummary,
  RoleCode,
  UserProfile,
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
  users: UserSummary[];
  students: UserSummary[];
  collectionOverview: CollectionOverview;
  unsubmittedStudents: UnsubmittedStudent[];
  rubrics: RubricSummary[];
  gradingJobs: GradingJobSummary[];
  ocrJobs: OcrJobSummary[];
  gradingResults: GradingResultSummary[];
  publishedResults: GradingResultSummary[];
  publicationAudits: GradePublicationAuditEntry[];
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

export type CreateRubricInput = {
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
};

export type CreateOrganizationInput = {
  parentId: number | null;
  name: string;
  type: OrganizationType;
};

export type CreateUserInput = {
  organizationId: number;
  username: string;
  name: string;
  studentNo?: string;
  teacherNo?: string;
  email?: string;
  phone?: string;
  roles: RoleCode[];
};

export type UpdateSystemSettingInput = {
  key: string;
  value: string;
};

export type ImportStudentsInput = {
  classId: number;
  rows: StudentImportRow[];
};

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8080';
const API_MODE = import.meta.env.VITE_API_MODE ?? 'mock';
const API_STRICT_HTTP = import.meta.env.VITE_API_STRICT_HTTP === '1';

export function shouldUseHttpApi() {
  return API_MODE === 'http';
}

export function shouldUseStrictHttpApi() {
  return shouldUseHttpApi() && API_STRICT_HTTP;
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

const roleLoginUsernames: Record<RoleCode, string> = {
  TEACHER: 'teacher',
  STUDENT: 'student',
  COURSE_OWNER: 'owner',
  SUPERVISOR: 'supervisor',
  ADMIN: 'admin',
};

export async function loginAsRole(role: RoleCode): Promise<UserProfile> {
  if (!shouldUseHttpApi()) {
    return mockApi.login(role);
  }
  try {
    const response = await request<LoginResponse>(
      '/api/auth/login',
      'POST',
      {
        username: roleLoginUsernames[role],
        password: 'trainmark',
      },
      false,
    );
    persistTokens(response);
    return response.user;
  } catch (error) {
    clearTokens();
    if (shouldUseStrictHttpApi()) {
      throw error;
    }
    return mockApi.login(role);
  }
}

export async function loadWorkspaceData(selectedCourseId: number, userId: number, role: RoleCode): Promise<WorkspaceData> {
  const isStudent = role === 'STUDENT';
  const submissionPath = role === 'STUDENT' ? `/api/submissions?studentId=${userId}` : '/api/submissions';
  const assignmentPath = isStudent ? '/api/assignments' : `/api/assignments?courseId=${selectedCourseId}`;
  const assignmentFallback = isStudent ? mockApi.listAssignments() : mockApi.listAssignments(selectedCourseId);
  const assignments = await getOr(assignmentPath, assignmentFallback);
  const selectedAssignmentId = resolveWorkspaceAssignmentId(assignments, selectedCourseId);
  const gradingResultsPath = isStudent ? '/api/grading/results' : `/api/grading/results?assignmentId=${selectedAssignmentId}`;
  const fallbackGradingResults = isStudent ? mockApi.listGradingResults() : mockApi.listGradingResults(selectedAssignmentId);
  const [
    courses,
    classes,
    organizations,
    users,
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
    getOr('/api/organizations', mockApi.listOrganizations()),
    getOr('/api/users', mockApi.listUsers()),
    getOr('/api/users?role=STUDENT', mockApi.listUsers('STUDENT')),
    getOr(`/api/notifications/assignments/${selectedAssignmentId}/collection`, mockApi.getCollectionOverview(selectedAssignmentId)),
    getOr(`/api/notifications/assignments/${selectedAssignmentId}/unsubmitted`, mockApi.listUnsubmittedStudents(selectedAssignmentId)),
    getOr(`/api/rubrics?assignmentId=${selectedAssignmentId}`, mockApi.listRubrics(selectedAssignmentId)),
    getOr(`/api/grading/jobs?assignmentId=${selectedAssignmentId}`, mockApi.listGradingJobs(selectedAssignmentId)),
    loadOcrJobs(),
    getOr(gradingResultsPath, fallbackGradingResults),
    getOr(submissionPath, [] as SubmissionSummary[]),
    getOr(`/api/grading/exports?assignmentId=${selectedAssignmentId}`, mockApi.listGradeExports(selectedAssignmentId)),
    getOr(`/api/analytics/grade-statistics?assignmentId=${selectedAssignmentId}`, mockApi.getGradeStatistics(selectedAssignmentId)),
    getOr(`/api/analytics/loss-points?assignmentId=${selectedAssignmentId}`, mockApi.listLossPoints(selectedAssignmentId)),
    getOr(`/api/analytics/course-outcomes?assignmentId=${selectedAssignmentId}`, mockApi.listCourseOutcomes(selectedAssignmentId)),
    getOr('/api/grading/results/appeals', mockApi.listAppeals()),
    getOr(`/api/similarity/jobs?assignmentId=${selectedAssignmentId}`, mockApi.listSimilarityJobs(selectedAssignmentId)),
    getOr('/api/admin/audit-logs', mockApi.listAuditLogs()),
    getOr('/api/admin/settings', mockApi.listSystemSettings()),
  ]);
  const publishedResults = gradingResults.filter((item) => item.publicationStatus === 'PUBLISHED' && item.studentId === userId);
  const publicationAudits = await loadPublicationAuditsForResults(gradingResults);

  return {
    courses,
    classes,
    assignments,
    organizations,
    users,
    students,
    collectionOverview,
    unsubmittedStudents,
    rubrics,
    gradingJobs,
    ocrJobs,
    gradingResults,
    publishedResults,
    publicationAudits,
    submissions,
    studentTasks: deriveStudentTasks(assignments, courses, submissions, publishedResults, userId),
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

async function loadPublicationAuditsForResults(gradingResults: GradingResultSummary[]) {
  if (gradingResults.length === 0) {
    return mockApi.listPublicationAudits();
  }
  const resultIds = [...new Set(gradingResults.map((result) => result.id))];
  const auditGroups = await Promise.all(resultIds.map((resultId) => loadPublicationAudits(resultId)));
  return auditGroups.flat();
}

function resolveWorkspaceAssignmentId(assignments: AssignmentSummary[], selectedCourseId: number) {
  return assignments.find((assignment) => assignment.courseId === selectedCourseId)?.id ?? assignments[0]?.id ?? 1;
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
    const response = await fetch(`${API_BASE_URL}${path}`, {
      headers: authHeaders(),
    });
    if (!response.ok) {
      if (shouldUseStrictHttpApi()) {
        throw new Error(`HTTP ${response.status} for ${path}`);
      }
      return fallback;
    }
    const payload = (await response.json()) as ApiResponse<R>;
    if (!payload.success) {
      if (shouldUseStrictHttpApi()) {
        throw new Error(payload.message || `API request failed for ${path}`);
      }
      return fallback;
    }
    return normalize ? normalize(payload.data) : (payload.data as unknown as T);
  } catch (error) {
    if (shouldUseStrictHttpApi()) {
      throw error;
    }
    return fallback;
  }
}

export async function createGradingJob(assignmentId: number, rubricId: number, submissionIds: number[] = [1]): Promise<GradingJobSummary> {
  return mutateOr(
    'POST',
    '/api/grading/jobs',
    { assignmentId, rubricId, submissionIds },
    () => mockApi.startGradingJob(assignmentId, rubricId, submissionIds),
  );
}

export async function createOcrJob(submissionId: number, objectKey: string): Promise<OcrJobSummary> {
  return mutateOr(
    'POST',
    '/api/ocr/jobs',
    { submissionId, objectKey, mode: 'STRUCTURE' },
    () => ({
      id: Date.now(),
      submissionId,
      objectKey,
      status: 'COMPLETED',
      pageCount: 1,
      textBlockCount: 0,
      tableCount: 0,
      confidence: 80,
      blocks: [],
    }),
    normalizeOcrJob,
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

export async function startSimilarityJob(assignmentId: number, submissionIds: number[] = [1, 18, 43]): Promise<SimilarityJobSummary> {
  return mutateOr(
    'POST',
    '/api/similarity/jobs',
    { assignmentId, submissionIds, includeHistory: true },
    () => mockApi.startSimilarityJob(assignmentId, submissionIds),
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

export async function createRubric(input: CreateRubricInput): Promise<RubricSummary> {
  return mutateOr(
    'POST',
    '/api/rubrics',
    input,
    () => mockApi.createRubric(input),
  );
}

export async function createOrganization(input: CreateOrganizationInput): Promise<OrganizationSummary> {
  return mutateOr(
    'POST',
    '/api/organizations',
    input,
    () => mockApi.createOrganization(input),
  );
}

export async function createUser(input: CreateUserInput): Promise<UserSummary> {
  return mutateOr(
    'POST',
    '/api/users',
    input,
    () => mockApi.createUser(input),
  );
}

export async function updateSystemSetting(input: UpdateSystemSettingInput): Promise<SystemSettingSummary> {
  return mutateOr(
    'PATCH',
    `/api/admin/settings/${encodeURIComponent(input.key)}`,
    { value: input.value },
    () => mockApi.updateSystemSetting(input.key, input.value),
  );
}

export async function importStudents(input: ImportStudentsInput): Promise<StudentImportResult> {
  return mutateOr(
    'POST',
    '/api/users/students/import',
    input,
    () => mockApi.importStudents(input.classId, input.rows),
  );
}

export async function createUploadReceipt(fileName: string, assignmentId: number, studentId: number, file?: File | null): Promise<UploadReceipt> {
  if (!shouldUseHttpApi()) {
    return mockApi.createUploadReceipt(fileName);
  }

  try {
    const uploadFile = file ?? new File(['TrainMark AI local upload placeholder'], fileName, {
      type: guessContentType(fileName),
    });
    const init = await request<{ uploadId: string; objectKey: string }>('/api/submissions/upload/init', 'POST', {
      assignmentId,
      studentId,
      fileName: uploadFile.name,
      contentType: uploadFile.type || guessContentType(uploadFile.name),
      fileSize: uploadFile.size,
      checksum: null,
    });
    await uploadObjectContent(init.uploadId, init.objectKey, uploadFile);
    const receipt = await request<BackendSubmissionReceipt>('/api/submissions/upload/complete', 'POST', {
      uploadId: init.uploadId,
      objectKey: init.objectKey,
      checksum: null,
    });
    return normalizeUploadReceipt(receipt);
  } catch (error) {
    if (shouldUseStrictHttpApi()) {
      throw error;
    }
    return mockApi.createUploadReceipt(fileName);
  }
}

async function uploadObjectContent(uploadId: string, objectKey: string, file: File): Promise<void> {
  const body = new FormData();
  body.append('uploadId', uploadId);
  body.append('objectKey', objectKey);
  body.append('file', file);
  const response = await fetch(`${API_BASE_URL}/api/submissions/upload/content`, {
    method: 'PUT',
    headers: authHeaders(),
    body,
  });
  if (!response.ok) {
    throw new Error(`HTTP ${response.status} for upload content`);
  }
  const payload = (await response.json()) as ApiResponse<unknown>;
  if (!payload.success) {
    throw new Error(payload.message || 'Upload content failed');
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
  } catch (error) {
    if (shouldUseStrictHttpApi()) {
      throw error;
    }
    return fallback();
  }
}

async function request<T>(path: string, method: 'POST' | 'PATCH', body: unknown, includeAuth = true): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    method,
    headers: authHeaders({ contentType: 'application/json', includeAuth }),
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

function persistTokens(response: LoginResponse) {
  if (typeof window === 'undefined') {
    return;
  }
  window.localStorage.setItem('trainmark.accessToken', response.accessToken);
  window.localStorage.setItem('trainmark.refreshToken', response.refreshToken);
}

function clearTokens() {
  if (typeof window === 'undefined') {
    return;
  }
  window.localStorage.removeItem('trainmark.accessToken');
  window.localStorage.removeItem('trainmark.refreshToken');
}

function authHeaders(options?: { contentType?: string; includeAuth?: boolean }): Record<string, string> {
  const headers: Record<string, string> = {};
  if (options?.contentType) {
    headers['Content-Type'] = options.contentType;
  }
  if (options?.includeAuth === false || typeof window === 'undefined') {
    return headers;
  }
  const token = window.localStorage.getItem('trainmark.accessToken');
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }
  return headers;
}

type BackendOcrJobSummary = Omit<OcrJobSummary, 'blocks'> & { blocks?: OcrJobSummary['blocks'] };

function normalizeOcrJob(value: BackendOcrJobSummary): OcrJobSummary {
  return {
    ...value,
    blocks: value.blocks ?? [],
  };
}

function normalizeOcrJobs(value: BackendOcrJobSummary[]): OcrJobSummary[] {
  return value.map(normalizeOcrJob);
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
