import { useEffect, useState, type FormEvent } from 'react';
import { mockApi } from '../api/mockApi';
import {
  createAssignment,
  approveGradingResult,
  createGradeExport,
  createGradingJob,
  createRubric,
  loadPublicationAudits,
  publishGradingResult,
  remindUnsubmitted,
  resolveAppeal,
  startSimilarityJob,
  updateReviewItem,
  withdrawGradingResult,
  type CreateAssignmentInput,
  type CreateRubricInput,
} from '../api/httpApi';
import type { CourseSummary, RubricSummary, SubmissionSummary } from '../api/types';
import { TeacherAnalyticsPanel } from './TeacherAnalyticsPanel';
import { TeacherAiPipeline } from './TeacherAiPipeline';
import { TeacherAppealPanel } from './TeacherAppealPanel';
import { TeacherCollectionPanel } from './TeacherCollectionPanel';
import { TeacherCoursePanel } from './TeacherCoursePanel';
import { TeacherOperationsPanel } from './TeacherOperationsPanel';
import { TeacherRosterPanel } from './TeacherRosterPanel';
import { TeacherReviewWorkspace } from './TeacherReviewWorkspace';
import { TeacherSimilarityPanel } from './TeacherSimilarityPanel';

type TeacherDashboardProps = {
  assignments: ReturnType<typeof mockApi.listAssignments>;
  classes: ReturnType<typeof mockApi.listClasses>;
  courses: CourseSummary[];
  selectedCourse: CourseSummary;
  selectedCourseId: number;
  setSelectedCourseId: (courseId: number) => void;
  stats: Array<{ label: string; value: string; trend: string; tone: string }>;
  importPreview: ReturnType<typeof mockApi.getStudentImportPreview>;
  organizations: ReturnType<typeof mockApi.listOrganizations>;
  collectionOverview: ReturnType<typeof mockApi.getCollectionOverview>;
  students: ReturnType<typeof mockApi.listUsers>;
  unsubmittedStudents: ReturnType<typeof mockApi.listUnsubmittedStudents>;
  rubrics: ReturnType<typeof mockApi.listRubrics>;
  gradingJobs: ReturnType<typeof mockApi.listGradingJobs>;
  submissions: SubmissionSummary[];
  ocrJobs: ReturnType<typeof mockApi.listOcrJobs>;
  gradingResults: ReturnType<typeof mockApi.listGradingResults>;
  operatorName: string;
  gradeExports: ReturnType<typeof mockApi.listGradeExports>;
  gradeStatistics: ReturnType<typeof mockApi.getGradeStatistics>;
  lossPoints: ReturnType<typeof mockApi.listLossPoints>;
  courseOutcomes: ReturnType<typeof mockApi.listCourseOutcomes>;
  appeals: ReturnType<typeof mockApi.listAppeals>;
  similarityJobs: ReturnType<typeof mockApi.listSimilarityJobs>;
};

export function TeacherDashboard({
  assignments,
  classes,
  courses,
  selectedCourse,
  selectedCourseId,
  setSelectedCourseId,
  stats,
  importPreview,
  organizations,
  collectionOverview,
  students,
  unsubmittedStudents,
  rubrics,
  gradingJobs,
  submissions,
  ocrJobs,
  gradingResults,
  operatorName,
  gradeExports,
  gradeStatistics,
  lossPoints,
  courseOutcomes,
  appeals,
  similarityJobs,
}: TeacherDashboardProps) {
  const [reminderResult, setReminderResult] = useState<ReturnType<typeof mockApi.remindUnsubmitted> | null>(null);
  const [startedJob, setStartedJob] = useState<ReturnType<typeof mockApi.startGradingJob> | null>(null);
  const [reviewResults, setReviewResults] = useState(gradingResults);
  const [selectedReviewId, setSelectedReviewId] = useState(gradingResults[0]?.id ?? 0);
  const [publicationAudits, setPublicationAudits] = useState(mockApi.listPublicationAudits());
  const [appealRows, setAppealRows] = useState(appeals);
  const [similarityRows, setSimilarityRows] = useState(similarityJobs);
  const [exportRows, setExportRows] = useState(gradeExports);
  const [assignmentRows, setAssignmentRows] = useState(assignments);
  const [rubricRows, setRubricRows] = useState<RubricSummary[]>(rubrics);
  const [assignmentNotice, setAssignmentNotice] = useState('');
  const [rubricNotice, setRubricNotice] = useState('');
  const selectedAssignmentId = assignmentRows.find((assignment) => assignment.courseId === selectedCourseId)?.id
    ?? assignmentRows[0]?.id
    ?? collectionOverview.assignmentId;
  const rubric = rubricRows.find((item) => item.assignmentId === selectedAssignmentId) ?? rubricRows[0] ?? null;
  const visibleJobs = startedJob ? [startedJob, ...gradingJobs] : gradingJobs;
  const selectedReview = reviewResults.find((item) => item.id === selectedReviewId) ?? reviewResults[0]!;

  useEffect(() => {
    setAssignmentRows(assignments);
  }, [assignments]);

  useEffect(() => {
    setRubricRows(rubrics);
  }, [rubrics]);

  useEffect(() => {
    if (gradingResults.length === 0) {
      return;
    }
    setReviewResults(gradingResults);
    setSelectedReviewId((current) => (
      gradingResults.some((item) => item.id === current) ? current : gradingResults[0].id
    ));
  }, [gradingResults]);

  useEffect(() => {
    setAppealRows(appeals);
  }, [appeals]);

  useEffect(() => {
    setSimilarityRows(similarityJobs);
  }, [similarityJobs]);

  useEffect(() => {
    setExportRows(gradeExports);
  }, [gradeExports]);

  const syncReviewResult = (updated: NonNullable<typeof selectedReview>) => {
    setReviewResults((current) => current.map((item) => (item.id === updated.id ? { ...updated } : item)));
    setSelectedReviewId(updated.id);
  };

  const handleStartGrading = async () => {
    if (!rubric) {
      return;
    }
    const submissionIds = submissions
      .filter((submission) => submission.assignmentId === rubric.assignmentId)
      .map((submission) => submission.id);
    setStartedJob(await createGradingJob(rubric.assignmentId, rubric.id, submissionIds.length > 0 ? submissionIds : [1]));
  };

  const handleReviewItemSubmit = async (event: FormEvent<HTMLFormElement>, rubricItemId: number) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const teacherScore = Number(formData.get('teacherScore'));
    const teacherComment = String(formData.get('teacherComment') ?? '');
    syncReviewResult(await updateReviewItem(selectedReview.id, rubricItemId, teacherScore, teacherComment));
  };

  const handleApproveResult = async () => {
    syncReviewResult(await approveGradingResult(selectedReview.id, operatorName, selectedReview.overallComment));
  };

  const handlePublishResult = async () => {
    syncReviewResult(await publishGradingResult(selectedReview.id, operatorName));
    setPublicationAudits(await loadPublicationAudits(selectedReview.id));
  };

  const handleWithdrawResult = async () => {
    syncReviewResult(await withdrawGradingResult(selectedReview.id, operatorName));
    setPublicationAudits(await loadPublicationAudits(selectedReview.id));
  };

  const handleResolveAppeal = async (appealId: number, accepted: boolean) => {
    const reply = accepted
      ? '已采纳申诉，教师将复核对应评分项并重新发布结果。'
      : '已复核原始报告和评分依据，维持当前评分。';
    await resolveAppeal(appealId, accepted, reply);
    setAppealRows((current) => current.map((item) => (
      item.id === appealId
        ? { ...item, status: accepted ? 'ACCEPTED' : 'REJECTED', teacherReply: reply, resolvedAt: new Date().toISOString() }
        : item
    )));
  };

  const handleStartSimilarity = async () => {
    const submissionIds = submissions
      .filter((submission) => submission.assignmentId === selectedAssignmentId)
      .map((submission) => submission.id);
    const job = await startSimilarityJob(selectedAssignmentId, submissionIds.length > 0 ? submissionIds : [1]);
    setSimilarityRows((current) => [job, ...current.filter((item) => item.id !== job.id)]);
  };

  const handleRemindUnsubmitted = async () => {
    const result = await remindUnsubmitted(
      collectionOverview.assignmentId,
      unsubmittedStudents.map((student) => student.studentId),
    );
    setReminderResult(result);
  };

  const handleCreateGradeExport = async () => {
    const exportJob = await createGradeExport(gradeStatistics.assignmentId, operatorName, 'CSV');
    setExportRows((current) => [exportJob, ...current.filter((item) => item.id !== exportJob.id)]);
  };

  const handleCreateAssignment = async (input: CreateAssignmentInput) => {
    const assignment = await createAssignment(input);
    setAssignmentRows((current) => [assignment, ...current.filter((item) => item.id !== assignment.id)]);
    setAssignmentNotice(`已创建任务：${assignment.title}`);
  };

  const handleCreateRubric = async (input: CreateRubricInput) => {
    const nextRubric = await createRubric(input);
    setRubricRows((current) => [nextRubric, ...current.filter((item) => item.id !== nextRubric.id)]);
    setRubricNotice(`已保存评分标准：${nextRubric.name}`);
  };

  return (
    <>
      <TeacherCoursePanel
        assignments={assignmentRows}
        classes={classes}
        courses={courses}
        selectedCourse={selectedCourse}
        selectedCourseId={selectedCourseId}
        stats={stats}
        assignmentNotice={assignmentNotice}
        onCreateAssignment={handleCreateAssignment}
        onSelectCourse={setSelectedCourseId}
      />

      <TeacherAiPipeline
        assignments={assignmentRows}
        rubric={rubric}
        rubricNotice={rubricNotice}
        gradingJobs={visibleJobs}
        ocrJobs={ocrJobs}
        onCreateRubric={handleCreateRubric}
        onStartGrading={handleStartGrading}
      />

      <TeacherSimilarityPanel similarityJobs={similarityRows} onStartSimilarity={handleStartSimilarity} />

      <TeacherReviewWorkspace
        reviewResults={reviewResults}
        selectedReview={selectedReview}
        publicationAudits={publicationAudits}
        onSelectReview={setSelectedReviewId}
        onReviewItemSubmit={handleReviewItemSubmit}
        onApproveResult={handleApproveResult}
        onPublishResult={handlePublishResult}
        onWithdrawResult={handleWithdrawResult}
      />

      <TeacherAnalyticsPanel
        gradeExports={exportRows}
        gradeStatistics={gradeStatistics}
        lossPoints={lossPoints}
        courseOutcomes={courseOutcomes}
        onCreateGradeExport={handleCreateGradeExport}
      />

      <TeacherAppealPanel appeals={appealRows} onResolveAppeal={handleResolveAppeal} />

      <TeacherCollectionPanel
        collectionOverview={collectionOverview}
        unsubmittedStudents={unsubmittedStudents}
        reminderResult={reminderResult}
        onRemindUnsubmitted={handleRemindUnsubmitted}
      />

      <TeacherRosterPanel importPreview={importPreview} organizations={organizations} students={students} />

      <TeacherOperationsPanel />
    </>
  );
}
