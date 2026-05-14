import { mockApi } from './mockApi';
import type {
  AppealSummary,
  AssignmentSummary,
  CollectionOverview,
  CourseOutcomeAchievement,
  CourseSummary,
  GradeStatisticsSummary,
  GradingResultSummary,
  GradingJobSummary,
  LossPointSummary,
  OcrJobSummary,
  OrganizationSummary,
  RubricSummary,
  SimilarityJobSummary,
  TeachingClassSummary,
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
  gradeStatistics: GradeStatisticsSummary;
  lossPoints: LossPointSummary[];
  courseOutcomes: CourseOutcomeAchievement[];
  appeals: AppealSummary[];
  similarityJobs: SimilarityJobSummary[];
};

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8080';
const API_MODE = import.meta.env.VITE_API_MODE ?? 'mock';

export function shouldUseHttpApi() {
  return API_MODE === 'http';
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
    gradeStatistics,
    lossPoints,
    courseOutcomes,
    appeals,
    similarityJobs,
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
    getOr('/api/ocr/jobs', mockApi.listOcrJobs(), normalizeOcrJobs),
    getOr('/api/grading/results', fallbackGradingResults),
    getOr('/api/analytics/grade-statistics?assignmentId=1', mockApi.getGradeStatistics()),
    getOr('/api/analytics/loss-points?assignmentId=1', mockApi.listLossPoints()),
    getOr('/api/analytics/course-outcomes?assignmentId=1', mockApi.listCourseOutcomes()),
    getOr('/api/grading/results/appeals', mockApi.listAppeals()),
    getOr('/api/similarity/jobs', mockApi.listSimilarityJobs()),
  ]);

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
    publishedResults: gradingResults.filter((item) => item.publicationStatus === 'PUBLISHED' && item.studentId === studentId),
    gradeStatistics,
    lossPoints,
    courseOutcomes,
    appeals,
    similarityJobs,
  };
}

async function getOr<T, R = T>(path: string, fallback: T, normalize?: (value: R) => T): Promise<T> {
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

function normalizeOcrJobs(value: Array<Omit<OcrJobSummary, 'blocks'> & { blocks?: OcrJobSummary['blocks'] }>): OcrJobSummary[] {
  return value.map((item) => ({
    ...item,
    blocks: item.blocks ?? [],
  }));
}
