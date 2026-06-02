import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { Alert, Button, Card, Col, Row, Select, Space, Steps, Tag, Typography } from 'antd';
import { mockApi } from '../api/mockApi';
import {
  createAssignment,
  approveGradingResult,
  createCourse,
  createTeachingClass,
  deleteTeachingClass,
  createGradeExport,
  createGradingJob,
  importStudents,
  createOcrJob,
  createRubric,
  loadGradingResults,
  loadPublicationAudits,
  publishAssignment,
  publishGradingResult,
  remindUnsubmitted,
  resolveAppeal,
  shouldUseHttpApi,
  startSimilarityJob,
  updateReviewItem,
  withdrawGradingResult,
  type CreateAssignmentInput,
  type CreateCourseInput,
  type CreateTeachingClassInput,
  type ImportStudentsInput,
  type CreateRubricInput,
} from '../api/httpApi';
import type { CollectionOverview, CourseSummary, GradingJobSummary, GradingResultSummary, OcrJobSummary, RubricSummary, StudentImportResult, SubmissionSummary, TeachingClassSummary, UserSummary } from '../api/types';
import { TeacherAnalyticsPanel } from './TeacherAnalyticsPanel';
import { TeacherAiPipeline } from './TeacherAiPipeline';
import { TeacherAppealPanel } from './TeacherAppealPanel';
import { TeacherCollectionPanel } from './TeacherCollectionPanel';
import { TeacherCoursePanel } from './TeacherCoursePanel';
import { TeacherOverviewDashboard } from './TeacherOverviewDashboard';
import { TeacherRosterPanel } from './TeacherRosterPanel';
import { TeacherReviewWorkspace } from './TeacherReviewWorkspace';
import { TeacherAssignmentPanel } from './TeacherAssignmentPanel';

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
  classStudents: Record<number, UserSummary[]>;
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
  classStudents,
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
  const [reminderPending, setReminderPending] = useState(false);
  const [reminderError, setReminderError] = useState<string | null>(null);
  const [exportRows, setExportRows] = useState(gradeExports);
  const [ocrRows, setOcrRows] = useState(ocrJobs);
  const [assignmentRows, setAssignmentRows] = useState(assignments);
  const [selectedAssignmentId, setSelectedAssignmentId] = useState(() => (
    assignments.find((assignment) => assignment.courseId === selectedCourseId && assignment.status === 'PUBLISHED')?.id
    ?? assignments.find((assignment) => assignment.courseId === selectedCourseId)?.id
    ?? collectionOverview.assignmentId
  ));
  const [rubricRows, setRubricRows] = useState<RubricSummary[]>(rubrics);
  const [studentRows, setStudentRows] = useState(students);
  const [studentImportResult, setStudentImportResult] = useState<StudentImportResult | null>(null);
  const [courseRows, setCourseRows] = useState(courses);
  const [classRows, setClassRows] = useState(classes);
  const [selectedClassFilterId, setSelectedClassFilterId] = useState(0);
  const [assignmentNotice, setAssignmentNotice] = useState('');
  const [courseNotice, setCourseNotice] = useState('');
  const [rubricNotice, setRubricNotice] = useState('');
  const [actionNotice, setActionNotice] = useState('');
  const selectedAssignment = assignmentRows.find((assignment) => assignment.id === selectedAssignmentId)
    ?? assignmentRows.find((assignment) => assignment.courseId === selectedCourseId)
    ?? assignmentRows[0]
    ?? null;
  const activeAssignmentId = selectedAssignment?.id ?? collectionOverview.assignmentId;
  const selectedFilterClass = classRows.find((item) => item.id === selectedClassFilterId) ?? null;
  const selectedClassStudentIds = new Set((selectedFilterClass ? classStudents[selectedFilterClass.id] ?? [] : []).map((student) => student.id));
  const classScopedSubmissions = filterBySelectedClass(
    submissions.filter((submission) => submission.assignmentId === activeAssignmentId),
    selectedClassStudentIds,
    Boolean(selectedFilterClass),
  );
  const classScopedReviewResults = filterBySelectedClass(
    reviewResults.filter((item) => item.assignmentId === activeAssignmentId),
    selectedClassStudentIds,
    Boolean(selectedFilterClass),
  );
  const classScopedUnsubmittedStudents = filterBySelectedClass(unsubmittedStudents, selectedClassStudentIds, Boolean(selectedFilterClass));
  const classScopedCollectionOverview = buildClassScopedCollectionOverview(
    collectionOverview,
    activeAssignmentId,
    selectedFilterClass,
    classScopedSubmissions,
  );
  const rubric = latestRubricForAssignment(rubricRows, activeAssignmentId);
  const visibleJobs = useMemo(() => (startedJob
    ? [startedJob, ...gradingJobs.filter((job) => job.id !== startedJob.id)]
    : gradingJobs), [gradingJobs, startedJob]);
  const visibleReviewResults = classScopedReviewResults;
  const selectedReview = visibleReviewResults.find((item) => item.id === selectedReviewId) ?? visibleReviewResults[0] ?? null;
  const ocrCandidate = classScopedSubmissions.find((submission) => Boolean(submission.objectKey)) ?? null;

  useEffect(() => {
    setAssignmentRows(assignments);
  }, [assignments]);

  useEffect(() => {
    setSelectedAssignmentId((current) => {
      if (assignments.some((assignment) => assignment.id === current && assignment.courseId === selectedCourseId)) {
        return current;
      }
      return assignments.find((assignment) => assignment.courseId === selectedCourseId && assignment.status === 'PUBLISHED')?.id
        ?? assignments.find((assignment) => assignment.courseId === selectedCourseId)?.id
        ?? collectionOverview.assignmentId;
    });
  }, [assignments, collectionOverview.assignmentId, selectedCourseId]);

  useEffect(() => {
    setRubricRows((current) => mergeById(current, rubrics));
  }, [rubrics]);

  useEffect(() => {
    setStudentRows(students);
  }, [students]);

  useEffect(() => {
    setCourseRows(courses);
  }, [courses]);

  useEffect(() => {
    setClassRows(classes);
  }, [classes]);

  useEffect(() => {
    setSelectedClassFilterId((current) => (
      current === 0 || classes.some((item) => item.id === current) ? current : 0
    ));
  }, [classes]);

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
    setReviewResults((current) => mergeById(current, gradingResults));
    setSelectedReviewId((current) => (
      gradingResults.some((item) => item.id === current) ? current : gradingResults[0].id
    ));
  }, [gradingResults]);

  useEffect(() => {
    const assignmentResults = visibleReviewResults;
    setSelectedReviewId((current) => (
      assignmentResults.some((item) => item.id === current) ? current : assignmentResults[0]?.id ?? 0
    ));
  }, [activeAssignmentId, visibleReviewResults]);

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

  useEffect(() => {
    if (section !== 'ai-pipeline') {
      return undefined;
    }
    const hasRunningJobs = visibleJobs.some((job) => job.status !== 'COMPLETED' && job.status !== 'FAILED')
      || ocrRows.some((job) => job.status !== 'COMPLETED' && job.status !== 'FAILED');
    if (!hasRunningJobs) {
      return undefined;
    }
    const timer = window.setInterval(() => {
      void onWorkspaceRefresh();
    }, 3000);
    return () => window.clearInterval(timer);
  }, [ocrRows, onWorkspaceRefresh, section, visibleJobs]);

  const syncReviewResult = (updated: GradingResultSummary) => {
    setReviewResults((current) => current.map((item) => (item.id === updated.id ? { ...updated } : item)));
    setSelectedReviewId(updated.id);
  };
  const runAction = async <T,>(action: () => Promise<T>, onError: (message: string) => void = (message) => setActionNotice(message)) => {
    try {
      return await action();
    } catch (error) {
      onError(`操作失败：${formatActionError(error)}`);
      throw error;
    }
  };

  const handleStartGrading = async () => {
    if (!rubric) {
      setActionNotice('请先为当前任务创建评分标准，再启动批改。');
      return;
    }
    const submissionIds = submissions
      .filter((submission) => submission.assignmentId === activeAssignmentId)
      .filter((submission) => !selectedFilterClass || selectedClassStudentIds.has(submission.studentId))
      .map((submission) => submission.id);
    if (submissionIds.length === 0) {
      setActionNotice('当前任务暂无学生提交，学生提交报告后才能启动批改。');
      return;
    }
    const pendingJob = buildPendingGradingJob(activeAssignmentId, rubric.id, submissionIds.length);
    setStartedJob(pendingJob);
    setActionNotice(`已提交批改任务：${submissionIds.length} 份报告，正在处理...`);
    try {
      const job = await createGradingJob(activeAssignmentId, rubric.id, submissionIds);
      setStartedJob(job);
      const latestReviewResults = await loadGradingResults(activeAssignmentId);
      setReviewResults(latestReviewResults);
      setSelectedReviewId(latestReviewResults[0]?.id ?? 0);
      setActionNotice(`批改完成：${submissionIds.length} 份报告。`);
      await onWorkspaceRefresh();
    } catch (error) {
      setStartedJob({
        ...pendingJob,
        status: 'FAILED',
        finishedAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
      setActionNotice(`批改失败：${formatActionError(error)}`);
    }
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
    await runAction(async () => {
      syncReviewResult(await approveGradingResult(selectedReview.id, operatorName, selectedReview.overallComment));
      await onWorkspaceRefresh();
    });
  };

  const handlePublishResult = async () => {
    if (!selectedReview) {
      return;
    }
    await runAction(async () => {
      const updated = await publishGradingResult(selectedReview.id, operatorName);
      syncReviewResult(updated);
      setPublicationAuditRows(await loadPublicationAudits(selectedReview.id));
      await onWorkspaceRefresh();
    });
  };

  const handleWithdrawResult = async () => {
    if (!selectedReview) {
      return;
    }
    await runAction(async () => {
      syncReviewResult(await withdrawGradingResult(selectedReview.id, operatorName));
      setPublicationAuditRows(await loadPublicationAudits(selectedReview.id));
      await onWorkspaceRefresh();
    });
  };

  const handleResolveAppeal = async (appealId: number, accepted: boolean) => {
    const reply = accepted
      ? '已采纳申诉，教师将复核对应评分项并重新发布结果。'
      : '已复核原始报告和评分依据，维持当前评分。';
    await runAction(async () => {
      await resolveAppeal(appealId, accepted, reply);
      setAppealRows((current) => current.map((item) => (
        item.id === appealId
          ? { ...item, status: accepted ? 'ACCEPTED' : 'REJECTED', teacherReply: reply, resolvedAt: new Date().toISOString() }
          : item
      )));
      await onWorkspaceRefresh();
    });
  };

  const handleStartSimilarity = async () => {
    const submissionIds = submissions
      .filter((submission) => submission.assignmentId === activeAssignmentId)
      .filter((submission) => !selectedFilterClass || selectedClassStudentIds.has(submission.studentId))
      .map((submission) => submission.id);
    if (submissionIds.length === 0) {
      setActionNotice('当前任务暂无学生提交，学生提交报告后才能启动查重。');
      return;
    }
    await runAction(async () => {
      const job = await startSimilarityJob(activeAssignmentId, submissionIds);
      setSimilarityRows((current) => [job, ...current.filter((item) => item.id !== job.id)]);
      setActionNotice(`已启动查重：${submissionIds.length} 份报告。`);
      await onWorkspaceRefresh();
    });
  };

  const handleStartOcr = async () => {
    if (!ocrCandidate) {
      return;
    }
    const pendingJob = buildPendingOcrJob(ocrCandidate.id, ocrCandidate.objectKey);
    setOcrRows((current) => [pendingJob, ...current.filter((item) => item.id !== pendingJob.id)]);
    try {
      const job = await createOcrJob(ocrCandidate.id, ocrCandidate.objectKey);
      setOcrRows((current) => [job, ...current.filter((item) => item.id !== pendingJob.id && item.id !== job.id)]);
      await onWorkspaceRefresh();
    } catch (error) {
      setOcrRows((current) => current.map((item) => (
        item.id === pendingJob.id ? { ...item, status: 'FAILED', updatedAt: new Date().toISOString() } : item
      )));
      setActionNotice(`识别失败：${formatActionError(error)}`);
    }
  };

  const handleRemindUnsubmitted = async () => {
    const studentIds = classScopedUnsubmittedStudents.map((student) => student.studentId);
    if (studentIds.length === 0) {
      setReminderResult(null);
      setReminderError('当前任务没有未交学生，无需催交。');
      return;
    }
    setReminderPending(true);
    setReminderError(null);
    try {
      const result = await remindUnsubmitted(activeAssignmentId, studentIds);
      setReminderResult(result);
      window.dispatchEvent(new Event('trainmark:notifications-changed'));
      await onWorkspaceRefresh();
    } catch (error) {
      setReminderResult(null);
      setReminderError(`催交发送失败：${formatActionError(error)}`);
    } finally {
      setReminderPending(false);
    }
  };

  const handleCreateGradeExport = async () => {
    await runAction(async () => {
      const exportJob = await createGradeExport(activeAssignmentId, operatorName, 'CSV');
      setExportRows((current) => [exportJob, ...current.filter((item) => item.id !== exportJob.id)]);
      await onWorkspaceRefresh();
    });
  };

  const handleCreateAssignment = async (input: CreateAssignmentInput) => {
    await runAction(async () => {
      const assignment = await createAssignment(input);
      setAssignmentRows((current) => [assignment, ...current.filter((item) => item.id !== assignment.id)]);
      setSelectedAssignmentId(assignment.id);
      setAssignmentNotice(`已创建任务：${assignment.title}`);
      setActionNotice('任务已保存为草稿，发布后学生端才会看到。');
      await onWorkspaceRefresh();
    }, (message) => setAssignmentNotice(message));
  };

  const handlePublishAssignment = async (assignmentId: number) => {
    await runAction(async () => {
      const assignment = await publishAssignment(assignmentId);
      setAssignmentRows((current) => current.map((item) => (item.id === assignment.id ? assignment : item)));
      setSelectedAssignmentId(assignment.id);
      setAssignmentNotice(`已发布任务：${assignment.title}`);
      setActionNotice('任务已发布，学生端可以提交报告。');
      await onWorkspaceRefresh();
    }, (message) => setAssignmentNotice(message));
  };

  const handleCreateCourse = async (input: CreateCourseInput) => {
    await runAction(async () => {
      const course = await createCourse(input);
      setCourseRows((current) => [course, ...current.filter((item) => item.id !== course.id)]);
      setSelectedCourseId(course.id);
      setClassRows([]);
      setCourseNotice(`已新建课程：${course.name}`);
      await onWorkspaceRefresh();
    }, (message) => setCourseNotice(message));
  };

  const handleCreateClass = async (input: CreateTeachingClassInput) => {
    return runAction(async () => {
      const teachingClass = await createTeachingClass(input);
      if (shouldUseHttpApi()) {
        setClassRows((current) => [teachingClass, ...current.filter((item) => item.id !== teachingClass.id)]);
        setCourseRows((current) => incrementCourseClassCount(current, teachingClass.courseId));
      } else {
        setClassRows(mockApi.listClasses(selectedCourseId));
        setCourseRows(mockApi.listCourses());
      }
      setCourseNotice(`已新建班级：${teachingClass.name}`);
      await onWorkspaceRefresh();
      return teachingClass;
    }, (message) => setCourseNotice(message));
  };

  const handleDeleteClass = async (courseId: number, classId: number) => {
    await runAction(async () => {
      const targetClass = classRows.find((item) => item.id === classId && item.courseId === courseId);
      await deleteTeachingClass(courseId, classId);
      setClassRows((current) => current.filter((item) => item.id !== classId));
      setSelectedClassFilterId((current) => (current === classId ? 0 : current));
      if (targetClass) {
        setCourseRows((current) => decrementCourseCounts(current, courseId, targetClass.studentCount));
      }
      setCourseNotice(targetClass ? `已删除班级：${targetClass.name}` : '已删除班级');
      await onWorkspaceRefresh();
    }, (message) => setCourseNotice(message));
  };

  const handleCreateRubric = async (input: CreateRubricInput) => {
    await runAction(async () => {
      const nextRubric = await createRubric(input);
      setRubricRows((current) => [nextRubric, ...current.filter((item) => item.id !== nextRubric.id)]);
      setRubricNotice(`已保存评分标准：${nextRubric.name}`);
      await onWorkspaceRefresh();
    }, (message) => setRubricNotice(message));
  };

  const handleReviewAssignmentSelect = async (assignmentId: number) => {
    setSelectedAssignmentId(assignmentId);
    const latestResults = await loadGradingResults(assignmentId);
    setReviewResults((current) => mergeById(current, latestResults));
    setSelectedReviewId(latestResults[0]?.id ?? 0);
  };

  const handleImportStudents = async (input: ImportStudentsInput) => {
    return runAction(async () => {
      const result = await importStudents(input);
      setStudentImportResult(result);
      if (shouldUseHttpApi()) {
        setClassRows((current) => incrementClassStudentCount(current, input.classId, result.created));
        const importedClass = classRows.find((item) => item.id === input.classId);
        if (importedClass) {
          setCourseRows((current) => incrementCourseStudentCount(current, importedClass.courseId, result.created));
        }
      } else {
        setStudentRows(mockApi.listUsers('STUDENT'));
        setClassRows(mockApi.listClasses(selectedCourseId));
        setCourseRows(mockApi.listCourses());
      }
      try {
        await onWorkspaceRefresh();
      } catch {
        // Import succeeded; keep the local count update even if a later dashboard refresh fails.
      }
      return result;
    }, (message) => setCourseNotice(message));
  };

  const collectionPanelProps = {
    classes: classRows,
    selectedClassId: selectedClassFilterId,
    collectionOverview: classScopedCollectionOverview,
    submissions: classScopedSubmissions,
    selectedAssignmentTitle: selectedAssignment?.title ?? '当前任务',
    selectedAssignmentId: activeAssignmentId,
    unsubmittedStudents: classScopedUnsubmittedStudents,
    reminderResult,
    reminderPending,
    reminderError,
    onSelectClass: setSelectedClassFilterId,
    onRemindUnsubmitted: handleRemindUnsubmitted,
  };
  const aiPipelineProps = {
    assignments: assignmentRows,
    classes: classRows,
    selectedClassId: selectedClassFilterId,
    selectedAssignmentId: activeAssignmentId,
    rubric,
    rubricNotice,
    gradingJobs: visibleJobs,
    ocrJobs: ocrRows,
    actionNotice,
    canStartOcr: Boolean(ocrCandidate),
    onCreateRubric: handleCreateRubric,
    onSelectClass: setSelectedClassFilterId,
    onSelectAssignment: setSelectedAssignmentId,
    onStartGrading: handleStartGrading,
    onStartOcr: handleStartOcr,
  };
  const similarityPanelProps = {
    classes: classRows,
    selectedClassId: selectedClassFilterId,
    similarityJobs: filterSimilarityJobsBySubmissions(similarityRows, classScopedSubmissions, Boolean(selectedFilterClass)),
    onSelectClass: setSelectedClassFilterId,
    onStartSimilarity: handleStartSimilarity,
  };
  const reviewWorkspaceProps = selectedReview ? {
    assignments: assignmentRows,
    classes: classRows,
    appeals: appealRows,
    selectedClassId: selectedClassFilterId,
    selectedAssignmentId: activeAssignmentId,
    reviewResults: visibleReviewResults,
    selectedReview,
    publicationAudits: publicationAuditRows,
    onResolveAppeal: handleResolveAppeal,
    onSelectClass: setSelectedClassFilterId,
    onSelectAssignment: handleReviewAssignmentSelect,
    onSelectReview: setSelectedReviewId,
    onReviewItemSubmit: handleReviewItemSubmit,
    onApproveResult: handleApproveResult,
    onPublishResult: handlePublishResult,
    onWithdrawResult: handleWithdrawResult,
  } : null;
  const analyticsPanelProps = {
    gradeExports: exportRows,
    gradeStatistics,
    lossPoints,
    courseOutcomes,
    onCreateGradeExport: handleCreateGradeExport,
  };
  const appealPanelProps = {
    appeals: appealRows,
    onResolveAppeal: handleResolveAppeal,
  };
  const reviewEmptyProps = {
    assignmentRows,
    classRows,
    activeAssignmentId,
    selectedClassFilterId,
    appealPanelProps,
    onSelectClass: setSelectedClassFilterId,
    onSelectAssignment: handleReviewAssignmentSelect,
  };
  const rosterPanelProps = {
    classes: classRows,
    importPreview,
    importResult: studentImportResult,
    organizations,
    students: studentRows,
    onImportStudents: handleImportStudents,
  };
  const coursePanelProps = {
    classes: classRows,
    courses: courseRows,
    selectedCourseId,
    courseNotice,
    importResult: studentImportResult,
    onCreateCourse: handleCreateCourse,
    onCreateClass: handleCreateClass,
    onDeleteClass: handleDeleteClass,
    onImportStudents: handleImportStudents,
    onSelectCourse: setSelectedCourseId,
  };
  const assignmentPanelProps = {
    assignments: assignmentRows,
    classes: classRows,
    selectedAssignmentId: activeAssignmentId,
    selectedCourseId,
    selectedCourseName: selectedCourse.name,
    assignmentNotice,
    onCreateAssignment: handleCreateAssignment,
    onPublishAssignment: handlePublishAssignment,
    onSelectAssignment: setSelectedAssignmentId,
  };

  const isOverview = section === 'overview';
  const workflowSteps = [
    { key: 'courses', label: '课程准备' },
    { key: 'assignments', label: '任务发布' },
    { key: 'collection', label: '报告收集' },
    { key: 'ai-pipeline', label: 'AI 批改' },
    { key: 'review', label: '人工复核' },
    { key: 'analytics', label: '结果分析' },
  ] as const;
  return (
    <>
      {!isOverview ? (
        <Card className="workflow-rail" style={{ marginBottom: 16 }}>
          <Space direction="vertical" size={12} style={{ width: '100%' }}>
            <Typography.Text type="secondary">教师流程导航</Typography.Text>
            <Steps
              className="teacher-progress-steps workflow-progress-steps"
              current={Math.max(workflowSteps.findIndex((item) => item.key === section), 0)}
              responsive
              progressDot
              items={workflowSteps.map((step) => ({ title: step.label }))}
            />
          </Space>
        </Card>
      ) : null}

      {isOverview ? (
        <Row gutter={[16, 16]}>
          <Col span={24}>
            <Card className="teacher-workspace-hero">
              <Typography.Text type="secondary">教师工作台</Typography.Text>
              <Typography.Title level={2} style={{ marginTop: 6, marginBottom: 0 }}>
                {selectedCourse.name}
              </Typography.Title>
            </Card>
          </Col>
          <Col span={24}>
            <TeacherOverviewDashboard
              stats={stats}
              collectionOverview={collectionOverview}
              assignments={assignmentRows}
              gradingJobs={visibleJobs}
              gradingResults={reviewResults}
              onSectionChange={setSection}
            />
          </Col>
        </Row>
      ) : null}

      {section === 'collection' ? (
        <TeacherCollectionPanel {...collectionPanelProps} />
      ) : null}

      {section === 'ai-pipeline' ? (
        <>
          <TeacherAiPipeline {...aiPipelineProps} />
          <TeacherAppealPanel {...appealPanelProps} />
        </>
      ) : null}

      {section === 'review' ? (
        reviewWorkspaceProps ? (
          <TeacherReviewWorkspace
            {...reviewWorkspaceProps}
          />
        ) : (
          <section className="review-layout">
            <Card className="wide-panel" title="人工复核工作区" extra={<Tag>暂无结果</Tag>}>
              <Space direction="vertical" size={16} style={{ width: '100%' }}>
                <Select
                  value={reviewEmptyProps.activeAssignmentId}
                  options={reviewEmptyProps.assignmentRows.map((assignment) => ({ value: assignment.id, label: assignment.title }))}
                  onChange={(value: number) => reviewEmptyProps.onSelectAssignment(value)}
                />
                <Select
                  value={reviewEmptyProps.selectedClassFilterId}
                  options={[
                    { value: 0, label: '全部班级' },
                    ...reviewEmptyProps.classRows.map((teachingClass) => ({ value: teachingClass.id, label: teachingClass.name })),
                  ]}
                  onChange={(value: number) => reviewEmptyProps.onSelectClass(value)}
                />
                <Alert
                  type="info"
                  showIcon
                  message="暂无复核结果"
                  description="当前实训任务还没有可复核的批改结果。可先在 AI 批改中心启动批改，或切换到已有批改结果的任务。"
                />
              </Space>
            </Card>
            <TeacherAppealPanel {...reviewEmptyProps.appealPanelProps} />
          </section>
        )
      ) : null}

      {section === 'analytics' ? (
        <TeacherAnalyticsPanel {...analyticsPanelProps} />
      ) : null}

      {section === 'roster' ? (
        <TeacherRosterPanel {...rosterPanelProps} />
      ) : null}

      {section === 'courses' ? (
        <TeacherCoursePanel {...coursePanelProps} />
      ) : null}

      {section === 'assignments' ? (
        <TeacherAssignmentPanel {...assignmentPanelProps} />
      ) : null}
    </>
  );
}

function mergeById<T extends { id: number }>(currentRows: T[], incomingRows: T[]) {
  const merged = new Map<number, T>();
  incomingRows.forEach((item) => merged.set(item.id, item));
  currentRows.forEach((item) => {
    if (!merged.has(item.id)) {
      merged.set(item.id, item);
    }
  });
  return Array.from(merged.values());
}

function filterBySelectedClass<T extends { studentId: number }>(
  rows: T[],
  selectedClassStudentIds: Set<number>,
  hasSelectedClass: boolean,
) {
  if (!hasSelectedClass) {
    return rows;
  }
  return rows.filter((item) => selectedClassStudentIds.has(item.studentId));
}

function buildClassScopedCollectionOverview(
  collectionOverview: CollectionOverview,
  assignmentId: number,
  selectedClass: TeachingClassSummary | null,
  submissions: SubmissionSummary[],
): CollectionOverview {
  if (!selectedClass) {
    return collectionOverview;
  }
  const submitted = submissions.length;
  const lateSubmitted = submissions.filter((item) => item.status === 'LATE_SUBMITTED').length;
  const processing = submissions.filter((item) => item.status === 'PROCESSING' || item.status === 'GRADED').length;
  const reviewed = submissions.filter((item) => item.status === 'REVIEWING' || item.status === 'REVIEWED').length;
  const published = submissions.filter((item) => item.status === 'PUBLISHED').length;
  return {
    assignmentId,
    totalStudents: selectedClass.studentCount,
    submitted,
    unsubmitted: Math.max(0, selectedClass.studentCount - submitted),
    lateSubmitted,
    processing,
    reviewed,
    published,
  };
}

function filterSimilarityJobsBySubmissions(
  jobs: ReturnType<typeof mockApi.listSimilarityJobs>,
  submissions: SubmissionSummary[],
  hasSelectedClass: boolean,
) {
  if (!hasSelectedClass) {
    return jobs;
  }
  const submissionIds = new Set(submissions.map((item) => item.id));
  return jobs.map((job) => ({
    ...job,
    matches: job.matches.filter((match) => (
      submissionIds.has(match.sourceSubmissionId) && submissionIds.has(match.targetSubmissionId)
    )),
  })).map((job) => ({
    ...job,
    checkedSubmissionCount: submissions.length,
    maxSimilarity: job.matches.reduce((max, match) => Math.max(max, match.similarity), 0),
    highRiskPairCount: job.matches.filter((match) => match.riskLevel === 'HIGH').length,
  }));
}

function latestRubricForAssignment(rubrics: RubricSummary[], assignmentId: number) {
  return rubrics
    .filter((item) => item.assignmentId === assignmentId)
    .sort((a, b) => b.id - a.id)[0] ?? null;
}

function incrementClassStudentCount(classes: TeachingClassSummary[], classId: number, count: number) {
  if (count <= 0) {
    return classes;
  }
  return classes.map((item) => (
    item.id === classId ? { ...item, studentCount: item.studentCount + count } : item
  ));
}

function incrementCourseClassCount(courses: CourseSummary[], courseId: number) {
  return courses.map((item) => (
    item.id === courseId ? { ...item, classCount: item.classCount + 1 } : item
  ));
}

function incrementCourseStudentCount(courses: CourseSummary[], courseId: number, count: number) {
  if (count <= 0) {
    return courses;
  }
  return courses.map((item) => (
    item.id === courseId ? { ...item, studentCount: item.studentCount + count } : item
  ));
}

function decrementCourseCounts(courses: CourseSummary[], courseId: number, removedStudentCount: number) {
  return courses.map((item) => (
    item.id === courseId
      ? {
        ...item,
        classCount: Math.max(0, item.classCount - 1),
        studentCount: Math.max(0, item.studentCount - removedStudentCount),
      }
      : item
  ));
}

function buildPendingGradingJob(assignmentId: number, rubricId: number, totalSubmissions: number): GradingJobSummary {
  const now = new Date().toISOString();
  return {
    id: -Date.now(),
    assignmentId,
    rubricId,
    totalSubmissions,
    completedSubmissions: 0,
    status: 'SCORING',
    confidence: 0,
    createdAt: now,
    startedAt: now,
    updatedAt: now,
    finishedAt: null,
  };
}

function buildPendingOcrJob(submissionId: number, objectKey: string): OcrJobSummary {
  const now = new Date().toISOString();
  return {
    id: -Date.now(),
    submissionId,
    objectKey,
    status: 'RECOGNIZING',
    pageCount: 0,
    textBlockCount: 0,
    tableCount: 0,
    confidence: 0,
    blocks: [],
    createdAt: now,
    updatedAt: now,
  };
}

function formatActionError(error: unknown) {
  const reason = error instanceof Error ? error.message : '未知错误';
  return `${reason}。请检查登录状态、后端服务与网络连接后重试。`;
}
