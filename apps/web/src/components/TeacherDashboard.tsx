import { useEffect, useState, type FormEvent } from 'react';
import { mockApi } from '../api/mockApi';
import {
  createAssignment,
  approveGradingResult,
  createGradeExport,
  createGradingJob,
  importStudents,
  createOcrJob,
  createRubric,
  loadPublicationAudits,
  publishGradingResult,
  remindUnsubmitted,
  resolveAppeal,
  startSimilarityJob,
  updateReviewItem,
  withdrawGradingResult,
  type CreateAssignmentInput,
  type ImportStudentsInput,
  type CreateRubricInput,
} from '../api/httpApi';
import type { CourseSummary, GradingResultSummary, RubricSummary, StudentImportResult, SubmissionSummary } from '../api/types';
import { TeacherAnalyticsPanel } from './TeacherAnalyticsPanel';
import { TeacherAiPipeline } from './TeacherAiPipeline';
import { TeacherAppealPanel } from './TeacherAppealPanel';
import { TeacherCollectionPanel } from './TeacherCollectionPanel';
import { TeacherCoursePanel } from './TeacherCoursePanel';
import { TeacherOperationsPanel } from './TeacherOperationsPanel';
import { TeacherRosterPanel } from './TeacherRosterPanel';
import { TeacherReviewWorkspace } from './TeacherReviewWorkspace';
import { TeacherSectionTabs } from './TeacherSectionTabs';
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
  publicationAudits: ReturnType<typeof mockApi.listPublicationAudits>;
  operatorName: string;
  gradeExports: ReturnType<typeof mockApi.listGradeExports>;
  gradeStatistics: ReturnType<typeof mockApi.getGradeStatistics>;
  lossPoints: ReturnType<typeof mockApi.listLossPoints>;
  courseOutcomes: ReturnType<typeof mockApi.listCourseOutcomes>;
  appeals: ReturnType<typeof mockApi.listAppeals>;
  similarityJobs: ReturnType<typeof mockApi.listSimilarityJobs>;
  onWorkspaceRefresh: () => Promise<void>;
  activeSection?: string;
  onSectionChange?: (section: string) => void;
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
  publicationAudits,
  operatorName,
  gradeExports,
  gradeStatistics,
  lossPoints,
  courseOutcomes,
  appeals,
  similarityJobs,
  onWorkspaceRefresh,
  activeSection: externalSection,
  onSectionChange: externalOnChange,
}: TeacherDashboardProps) {
  const [activeSection, setActiveSection] = useState(externalSection ?? 'overview');
  const section = externalSection ?? activeSection;
  const setSection = (s: string) => {
    setActiveSection(s);
    externalOnChange?.(s);
  };
  const [reminderResult, setReminderResult] = useState<ReturnType<typeof mockApi.remindUnsubmitted> | null>(null);
  const [startedJob, setStartedJob] = useState<ReturnType<typeof mockApi.startGradingJob> | null>(null);
  const [reviewResults, setReviewResults] = useState(gradingResults);
  const [selectedReviewId, setSelectedReviewId] = useState(gradingResults[0]?.id ?? 0);
  const [publicationAuditRows, setPublicationAuditRows] = useState(publicationAudits);
  const [appealRows, setAppealRows] = useState(appeals);
  const [similarityRows, setSimilarityRows] = useState(similarityJobs);
  const [exportRows, setExportRows] = useState(gradeExports);
  const [ocrRows, setOcrRows] = useState(ocrJobs);
  const [assignmentRows, setAssignmentRows] = useState(assignments);
  const [rubricRows, setRubricRows] = useState<RubricSummary[]>(rubrics);
  const [studentRows, setStudentRows] = useState(students);
  const [studentImportResult, setStudentImportResult] = useState<StudentImportResult | null>(null);
  const [assignmentNotice, setAssignmentNotice] = useState('');
  const [rubricNotice, setRubricNotice] = useState('');
  const selectedAssignmentId = assignmentRows.find((assignment) => assignment.courseId === selectedCourseId)?.id
    ?? assignmentRows[0]?.id
    ?? collectionOverview.assignmentId;
  const rubric = rubricRows.find((item) => item.assignmentId === selectedAssignmentId) ?? rubricRows[0] ?? null;
  const visibleJobs = startedJob
    ? [startedJob, ...gradingJobs.filter((job) => job.id !== startedJob.id)]
    : gradingJobs;
  const selectedReview = reviewResults.find((item) => item.id === selectedReviewId) ?? reviewResults[0] ?? null;
  const ocrCandidate = submissions.find((submission) => (
    submission.assignmentId === selectedAssignmentId && Boolean(submission.objectKey)
  )) ?? null;

  useEffect(() => {
    setAssignmentRows(assignments);
  }, [assignments]);

  useEffect(() => {
    setRubricRows(rubrics);
  }, [rubrics]);

  useEffect(() => {
    setStudentRows(students);
  }, [students]);

  useEffect(() => {
    setStartedJob((current) => (
      current && gradingJobs.some((job) => job.id === current.id) ? null : current
    ));
  }, [gradingJobs]);

  useEffect(() => {
    if (gradingResults.length === 0) {
      setReviewResults([]);
      setSelectedReviewId(0);
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
    setOcrRows(ocrJobs);
  }, [ocrJobs]);

  useEffect(() => {
    setExportRows(gradeExports);
  }, [gradeExports]);

  useEffect(() => {
    setPublicationAuditRows(publicationAudits);
  }, [publicationAudits]);

  useEffect(() => {
    if (externalSection && externalSection !== activeSection) {
      setActiveSection(externalSection);
    }
  }, [externalSection, activeSection]);

  const syncReviewResult = (updated: GradingResultSummary) => {
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
    await onWorkspaceRefresh();
  };

  const handleReviewItemSubmit = async (event: FormEvent<HTMLFormElement>, rubricItemId: number) => {
    event.preventDefault();
    if (!selectedReview) {
      return;
    }
    const formData = new FormData(event.currentTarget);
    const teacherScore = Number(formData.get('teacherScore'));
    const teacherComment = String(formData.get('teacherComment') ?? '');
    syncReviewResult(await updateReviewItem(selectedReview.id, rubricItemId, teacherScore, teacherComment));
    await onWorkspaceRefresh();
  };

  const handleApproveResult = async () => {
    if (!selectedReview) {
      return;
    }
    syncReviewResult(await approveGradingResult(selectedReview.id, operatorName, selectedReview.overallComment));
    await onWorkspaceRefresh();
  };

  const handlePublishResult = async () => {
    if (!selectedReview) {
      return;
    }
    syncReviewResult(await publishGradingResult(selectedReview.id, operatorName));
    setPublicationAuditRows(await loadPublicationAudits(selectedReview.id));
    await onWorkspaceRefresh();
  };

  const handleWithdrawResult = async () => {
    if (!selectedReview) {
      return;
    }
    syncReviewResult(await withdrawGradingResult(selectedReview.id, operatorName));
    setPublicationAuditRows(await loadPublicationAudits(selectedReview.id));
    await onWorkspaceRefresh();
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
    await onWorkspaceRefresh();
  };

  const handleStartSimilarity = async () => {
    const submissionIds = submissions
      .filter((submission) => submission.assignmentId === selectedAssignmentId)
      .map((submission) => submission.id);
    const job = await startSimilarityJob(selectedAssignmentId, submissionIds.length > 0 ? submissionIds : [1]);
    setSimilarityRows((current) => [job, ...current.filter((item) => item.id !== job.id)]);
    await onWorkspaceRefresh();
  };

  const handleStartOcr = async () => {
    if (!ocrCandidate) {
      return;
    }
    const job = await createOcrJob(ocrCandidate.id, ocrCandidate.objectKey);
    setOcrRows((current) => [job, ...current.filter((item) => item.id !== job.id)]);
    await onWorkspaceRefresh();
  };

  const handleRemindUnsubmitted = async () => {
    const result = await remindUnsubmitted(
      collectionOverview.assignmentId,
      unsubmittedStudents.map((student) => student.studentId),
    );
    setReminderResult(result);
    await onWorkspaceRefresh();
  };

  const handleCreateGradeExport = async () => {
    const exportJob = await createGradeExport(gradeStatistics.assignmentId, operatorName, 'CSV');
    setExportRows((current) => [exportJob, ...current.filter((item) => item.id !== exportJob.id)]);
    await onWorkspaceRefresh();
  };

  const handleCreateAssignment = async (input: CreateAssignmentInput) => {
    const assignment = await createAssignment(input);
    setAssignmentRows((current) => [assignment, ...current.filter((item) => item.id !== assignment.id)]);
    setAssignmentNotice(`已创建任务：${assignment.title}`);
    await onWorkspaceRefresh();
  };

  const handleCreateRubric = async (input: CreateRubricInput) => {
    const nextRubric = await createRubric(input);
    setRubricRows((current) => [nextRubric, ...current.filter((item) => item.id !== nextRubric.id)]);
    setRubricNotice(`已保存评分标准：${nextRubric.name}`);
    await onWorkspaceRefresh();
  };

  const handleImportStudents = async (input: ImportStudentsInput) => {
    const result = await importStudents(input);
    setStudentImportResult(result);
    setStudentRows(mockApi.listUsers('STUDENT'));
    await onWorkspaceRefresh();
  };

  const isOverview = section === 'overview';

  return (
    <>
      <TeacherSectionTabs activeSection={section} onSectionChange={setSection} />

      {isOverview || section === 'collection' ? (
        <TeacherCollectionPanel
          collectionOverview={collectionOverview}
          submissions={submissions}
          selectedAssignmentId={selectedAssignmentId}
          unsubmittedStudents={unsubmittedStudents}
          reminderResult={reminderResult}
          onRemindUnsubmitted={handleRemindUnsubmitted}
        />
      ) : null}

      {isOverview || section === 'ai-pipeline' ? (
        <>
          <TeacherAiPipeline
            assignments={assignmentRows}
            rubric={rubric}
            rubricNotice={rubricNotice}
            gradingJobs={visibleJobs}
            ocrJobs={ocrRows}
            canStartOcr={Boolean(ocrCandidate)}
            onCreateRubric={handleCreateRubric}
            onStartGrading={handleStartGrading}
            onStartOcr={handleStartOcr}
          />
          {isOverview ? (
            <TeacherSimilarityPanel similarityJobs={similarityRows} onStartSimilarity={handleStartSimilarity} />
          ) : null}
        </>
      ) : null}

      {section === 'similarity' ? (
        <TeacherSimilarityPanel similarityJobs={similarityRows} onStartSimilarity={handleStartSimilarity} />
      ) : null}

      {isOverview || section === 'review' ? (
        selectedReview ? (
          <TeacherReviewWorkspace
            reviewResults={reviewResults}
            selectedReview={selectedReview}
            publicationAudits={publicationAuditRows}
            onSelectReview={setSelectedReviewId}
            onReviewItemSubmit={handleReviewItemSubmit}
            onApproveResult={handleApproveResult}
            onPublishResult={handlePublishResult}
            onWithdrawResult={handleWithdrawResult}
          />
        ) : (
          <section className="review-layout">
            <article className="panel wide-panel">
              <div className="panel-heading">
                <div>
                  <p className="eyebrow">Manual Review</p>
                  <h3>人工复核工作区</h3>
                </div>
                <span className="status-pill">暂无结果</span>
              </div>
              <div className="empty-result">
                <strong>暂无复核结果</strong>
                <span>当前作业还没有可复核的批改结果。启动 AI 批改后，结果会出现在这里。</span>
              </div>
            </article>
          </section>
        )
      ) : null}

      {isOverview || section === 'analytics' ? (
        <TeacherAnalyticsPanel
          gradeExports={exportRows}
          gradeStatistics={gradeStatistics}
          lossPoints={lossPoints}
          courseOutcomes={courseOutcomes}
          onCreateGradeExport={handleCreateGradeExport}
        />
      ) : null}

      {isOverview || section === 'appeals' ? (
        <TeacherAppealPanel appeals={appealRows} onResolveAppeal={handleResolveAppeal} />
      ) : null}

      {isOverview || section === 'roster' ? (
        <TeacherRosterPanel
          classes={classes}
          importPreview={importPreview}
          importResult={studentImportResult}
          organizations={organizations}
          students={studentRows}
          onImportStudents={handleImportStudents}
        />
      ) : null}

      {isOverview || section === 'operations' ? (
        <TeacherOperationsPanel />
      ) : null}

      {isOverview ? (
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
      ) : null}
    </>
  );
}
