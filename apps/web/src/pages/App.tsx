import { useEffect, useState, type CSSProperties, type FormEvent } from 'react';
import {
  BarChart3,
  Bell,
  CalendarClock,
  CheckCircle2,
  Clock3,
  FileText,
  Plus,
  ShieldCheck,
  Sparkles,
  UploadCloud,
  Users,
} from 'lucide-react';
import { mockApi } from '../api/mockApi';
import {
  approveGradingResult,
  createGradeExport,
  createGradingJob,
  loadPublicationAudits,
  loadWorkspaceData,
  publishGradingResult,
  remindUnsubmitted,
  resolveAppeal,
  resolveApiAssetUrl,
  shouldUseHttpApi,
  startSimilarityJob,
  updateReviewItem,
  withdrawGradingResult,
  type WorkspaceData,
} from '../api/httpApi';
import type { CourseSummary, RoleCode, UserProfile } from '../api/types';
import { AppChrome } from '../components/AppChrome';
import { StudentDashboard } from '../components/StudentDashboard';
import { formatDate } from '../utils/formatDate';

const pipelineSteps = ['文件预处理', 'OCR 识别', '结构化提取', '语义评分', 'PDF 批注', '教师复核'];
const routeRoleMap: Record<string, RoleCode> = {
  admin: 'ADMIN',
  student: 'STUDENT',
  teacher: 'TEACHER',
};

const statusText = {
  ACTIVE: '进行中',
  DRAFT: '草稿',
  ARCHIVED: '已归档',
  PUBLISHED: '已发布',
  CLOSED: '已截止',
};

const gradingStatusText = {
  PENDING: '等待中',
  OCR_RUNNING: 'OCR中',
  STRUCTURING: '结构化',
  SCORING: '评分中',
  ANNOTATING: '生成批注',
  COMPLETED: '已完成',
  FAILED: '失败',
  RETRYING: '重试中',
};

const ocrStatusText = {
  PENDING: '等待中',
  PREPROCESSING: '预处理',
  RECOGNIZING: '识别中',
  STRUCTURING: '结构化',
  COMPLETED: '已完成',
  FAILED: '失败',
};

const reviewStatusText = {
  NEEDS_REVIEW: '待复核',
  IN_REVIEW: '复核中',
  APPROVED: '已通过',
  RETURNED: '已退回',
};

const publicationStatusText = {
  NOT_PUBLISHED: '未发布',
  PUBLISHED: '已发布',
  WITHDRAWN: '已撤回',
};

const appealStatusText = {
  SUBMITTED: '待处理',
  ACCEPTED: '已采纳',
  REJECTED: '已驳回',
};

function getRoleFromLocation(): RoleCode {
  if (typeof window === 'undefined') {
    return 'TEACHER';
  }

  const role = new URLSearchParams(window.location.search).get('role')?.toLowerCase();
  return role ? routeRoleMap[role] ?? 'TEACHER' : 'TEACHER';
}

function writeRoleToLocation(role: RoleCode) {
  if (typeof window === 'undefined') {
    return;
  }

  const nextUrl = new URL(window.location.href);
  nextUrl.searchParams.set('role', role.toLowerCase());
  window.history.replaceState(null, '', nextUrl);
}

export function App() {
  const [user, setUser] = useState<UserProfile>(() => mockApi.login(getRoleFromLocation()));
  const [activeNav, setActiveNav] = useState('工作台');
  const [selectedCourseId, setSelectedCourseId] = useState(1);
  const [workspaceData, setWorkspaceData] = useState<WorkspaceData | null>(null);
  const [apiModeLabel, setApiModeLabel] = useState(shouldUseHttpApi() ? 'HTTP API' : 'Mock 数据');

  const primaryRole = user.roles[0];
  const metrics = mockApi.getMetrics();
  const courses = workspaceData?.courses ?? mockApi.listCourses();
  const selectedCourse = courses.find((course) => course.id === selectedCourseId) ?? courses[0];
  const classes = workspaceData?.classes ?? mockApi.listClasses(selectedCourse.id);
  const assignments = workspaceData?.assignments ?? mockApi.listAssignments(selectedCourse.id);
  const studentTasks = mockApi.listStudentTasks();
  const organizations = workspaceData?.organizations ?? mockApi.listOrganizations();
  const students = workspaceData?.students ?? mockApi.listUsers('STUDENT');
  const importPreview = mockApi.getStudentImportPreview();
  const collectionOverview = workspaceData?.collectionOverview ?? mockApi.getCollectionOverview();
  const unsubmittedStudents = workspaceData?.unsubmittedStudents ?? mockApi.listUnsubmittedStudents();
  const rubrics = workspaceData?.rubrics ?? mockApi.listRubrics();
  const gradingJobs = workspaceData?.gradingJobs ?? mockApi.listGradingJobs();
  const ocrJobs = workspaceData?.ocrJobs ?? mockApi.listOcrJobs();
  const gradingResults = workspaceData?.gradingResults ?? mockApi.listGradingResults();
  const publishedResults = workspaceData?.publishedResults ?? mockApi.listPublishedResults(user.id);
  const gradeExports = workspaceData?.gradeExports ?? mockApi.listGradeExports(1);
  const gradeStatistics = workspaceData?.gradeStatistics ?? mockApi.getGradeStatistics();
  const lossPoints = workspaceData?.lossPoints ?? mockApi.listLossPoints();
  const courseOutcomes = workspaceData?.courseOutcomes ?? mockApi.listCourseOutcomes();
  const appeals = workspaceData?.appeals.filter((item) => item.studentId === user.id) ?? mockApi.listAppeals(undefined, user.id);
  const similarityJobs = workspaceData?.similarityJobs ?? mockApi.listSimilarityJobs();
  const auditLogs = workspaceData?.auditLogs ?? mockApi.listAuditLogs();
  const systemSettings = workspaceData?.systemSettings ?? mockApi.listSystemSettings();

  useEffect(() => {
    const syncRoleFromLocation = () => {
      setUser(mockApi.login(getRoleFromLocation()));
    };

    window.addEventListener('popstate', syncRoleFromLocation);
    return () => window.removeEventListener('popstate', syncRoleFromLocation);
  }, []);

  const handleRoleChange = (role: RoleCode) => {
    writeRoleToLocation(role);
    setUser(mockApi.login(role));
  };

  useEffect(() => {
    if (!shouldUseHttpApi()) {
      setWorkspaceData(null);
      setApiModeLabel('Mock 数据');
      return;
    }

    let cancelled = false;
    loadWorkspaceData(selectedCourseId, user.id).then((data) => {
      if (!cancelled) {
        setWorkspaceData(data);
        setApiModeLabel('HTTP API / Mock 兜底');
      }
    });
    return () => {
      cancelled = true;
    };
  }, [selectedCourseId, user.id]);

  const teacherStats = [
    { label: '进行中任务', value: String(metrics.activeAssignments), trend: '+2 本周', tone: 'blue' },
    { label: '待 AI 批改', value: String(metrics.pendingGrading), trend: '预计 42 分钟', tone: 'violet' },
    { label: '待教师复核', value: String(metrics.pendingReview), trend: '低置信度优先', tone: 'teal' },
    { label: '未提交学生', value: String(metrics.unsubmitted), trend: '今晚 18:00 催交', tone: 'orange' },
  ];

  return (
    <AppChrome
      activeNav={activeNav}
      apiModeLabel={apiModeLabel}
      primaryRole={primaryRole}
      user={user}
      onNavChange={setActiveNav}
      onRoleChange={handleRoleChange}
    >
      {primaryRole === 'STUDENT' ? (
        <StudentDashboard tasks={studentTasks} publishedResults={publishedResults} appeals={appeals} userId={user.id} />
      ) : primaryRole === 'ADMIN' ? (
        <AdminDashboard
          organizations={organizations}
          students={students}
          auditLogs={auditLogs}
          systemSettings={systemSettings}
        />
      ) : (
        <TeacherDashboard
          assignments={assignments}
          classes={classes}
          courses={courses}
          selectedCourse={selectedCourse}
          selectedCourseId={selectedCourseId}
          setSelectedCourseId={setSelectedCourseId}
          stats={teacherStats}
          importPreview={importPreview}
          organizations={organizations}
          collectionOverview={collectionOverview}
          students={students}
          unsubmittedStudents={unsubmittedStudents}
          rubrics={rubrics}
          gradingJobs={gradingJobs}
          ocrJobs={ocrJobs}
          gradingResults={gradingResults}
          operatorName={user.name}
          gradeExports={gradeExports}
          gradeStatistics={gradeStatistics}
          lossPoints={lossPoints}
          courseOutcomes={courseOutcomes}
          appeals={mockApi.listAppeals()}
          similarityJobs={similarityJobs}
        />
      )}
    </AppChrome>
  );
}

function TeacherDashboard({
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
  ocrJobs,
  gradingResults,
  operatorName,
  gradeExports,
  gradeStatistics,
  lossPoints,
  courseOutcomes,
  appeals,
  similarityJobs,
}: {
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
  ocrJobs: ReturnType<typeof mockApi.listOcrJobs>;
  gradingResults: ReturnType<typeof mockApi.listGradingResults>;
  operatorName: string;
  gradeExports: ReturnType<typeof mockApi.listGradeExports>;
  gradeStatistics: ReturnType<typeof mockApi.getGradeStatistics>;
  lossPoints: ReturnType<typeof mockApi.listLossPoints>;
  courseOutcomes: ReturnType<typeof mockApi.listCourseOutcomes>;
  appeals: ReturnType<typeof mockApi.listAppeals>;
  similarityJobs: ReturnType<typeof mockApi.listSimilarityJobs>;
}) {
  const [reminderResult, setReminderResult] = useState<ReturnType<typeof mockApi.remindUnsubmitted> | null>(null);
  const [startedJob, setStartedJob] = useState<ReturnType<typeof mockApi.startGradingJob> | null>(null);
  const [reviewResults, setReviewResults] = useState(gradingResults);
  const [selectedReviewId, setSelectedReviewId] = useState(gradingResults[0]?.id ?? 0);
  const [publicationAudits, setPublicationAudits] = useState(mockApi.listPublicationAudits());
  const [appealRows, setAppealRows] = useState(appeals);
  const [similarityRows, setSimilarityRows] = useState(similarityJobs);
  const [exportRows, setExportRows] = useState(gradeExports);
  const submittedRate = Math.round((collectionOverview.submitted / collectionOverview.totalStudents) * 100);
  const rubric = rubrics[0];
  const visibleJobs = startedJob ? [startedJob, ...gradingJobs] : gradingJobs;
  const selectedReview = reviewResults.find((item) => item.id === selectedReviewId) ?? reviewResults[0]!;

  const syncReviewResult = (updated: NonNullable<typeof selectedReview>) => {
    setReviewResults((current) => current.map((item) => (item.id === updated.id ? { ...updated } : item)));
    setSelectedReviewId(updated.id);
  };

  const handleStartGrading = async () => {
    setStartedJob(await createGradingJob(rubric.assignmentId, rubric.id));
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
    const job = await startSimilarityJob(selectedCourseId);
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

  return (
    <>
      <section className="stats-grid">
        {stats.map((item) => (
          <article className={`stat-card ${item.tone}`} key={item.label}>
            <span>{item.label}</span>
            <strong>{item.value}</strong>
            <small>{item.trend}</small>
          </article>
        ))}
      </section>

      <section className="management-grid">
        <article className="panel course-panel">
          <div className="panel-heading">
            <div>
              <p className="eyebrow">Courses</p>
              <h3>课程与班级</h3>
            </div>
            <button className="ghost-button" type="button"><Plus size={15} /> 新建课程</button>
          </div>
          <div className="course-tabs">
            {courses.map((course) => (
              <button
                className={selectedCourseId === course.id ? 'selected' : ''}
                key={course.id}
                type="button"
                onClick={() => setSelectedCourseId(course.id)}
              >
                <strong>{course.name}</strong>
                <span>{course.code}</span>
              </button>
            ))}
          </div>
          <div className="course-summary-card">
            <div>
              <p className="eyebrow">当前课程</p>
              <h3>{selectedCourse.name}</h3>
              <span>{selectedCourse.semester} · {statusText[selectedCourse.status]}</span>
            </div>
            <div className="summary-metrics">
              <span>{selectedCourse.classCount} 个班级</span>
              <span>{selectedCourse.studentCount} 名学生</span>
            </div>
          </div>
          <div className="class-list">
            {classes.map((item) => (
              <div className="class-row" key={item.id}>
                <div>
                  <strong>{item.name}</strong>
                  <span>{item.major} · {item.grade}级</span>
                </div>
                <span>{item.studentCount} 人</span>
              </div>
            ))}
          </div>
        </article>

        <article className="panel assignment-panel">
          <div className="panel-heading">
            <div>
              <p className="eyebrow">Assignments</p>
              <h3>实训任务</h3>
            </div>
            <button className="ghost-button" type="button"><Plus size={15} /> 创建任务</button>
          </div>
          <div className="assignment-list">
            {assignments.map((item) => (
              <div className="assignment-card" key={item.id}>
                <div className="assignment-title">
                  <FileText size={18} />
                  <strong>{item.title}</strong>
                </div>
                <div className="assignment-meta">
                  <span><CalendarClock size={14} /> {formatDate(item.deadline)}</span>
                  <span>{item.totalScore} 分</span>
                  <span className="status-pill">{statusText[item.status]}</span>
                </div>
                <div className="assignment-flags">
                  <span>{item.aiGradingEnabled ? 'AI 批改开启' : '人工批改'}</span>
                  <span>{item.similarityCheckEnabled ? '查重开启' : '查重关闭'}</span>
                </div>
              </div>
            ))}
          </div>
        </article>
      </section>

      <section className="management-grid">
        <article className="panel rubric-panel">
          <div className="panel-heading">
            <div>
              <p className="eyebrow">Rubric</p>
              <h3>评分标准</h3>
            </div>
            <button className="ghost-button" type="button"><Plus size={15} /> 编辑标准</button>
          </div>
          <div className="rubric-summary">
            <div>
              <strong>{rubric.name}</strong>
              <span>总分 {rubric.totalScore} · {rubric.items.length} 个评分项</span>
            </div>
            <span className="score-chip">可解释评分</span>
          </div>
          <div className="rubric-list">
            {rubric.items.map((item) => (
              <div className="rubric-row" key={item.id}>
                <div>
                  <strong>{item.title}</strong>
                  <span>{item.courseOutcomeCode} · {item.points[0]?.title ?? '待配置得分点'}</span>
                </div>
                <b>{item.score} 分</b>
              </div>
            ))}
          </div>
        </article>

        <article className="panel grading-panel">
          <div className="panel-heading">
            <div>
              <p className="eyebrow">AI Grading</p>
              <h3>批改队列</h3>
            </div>
            <button className="ghost-button" type="button" onClick={handleStartGrading}>
              <Sparkles size={15} /> 启动批改
            </button>
          </div>
          <div className="grading-job-list">
            {visibleJobs.map((job) => {
              const progress = job.totalSubmissions === 0 ? 0 : Math.round((job.completedSubmissions / job.totalSubmissions) * 100);
              return (
                <div className="grading-job-card" key={job.id}>
                  <div className="assignment-title">
                    <Sparkles size={18} />
                    <strong>批改任务 #{job.id}</strong>
                  </div>
                  <div className="assignment-meta">
                    <span>{job.completedSubmissions}/{job.totalSubmissions} 份完成</span>
                    <span className="status-pill">{gradingStatusText[job.status]}</span>
                    <span>置信度 {job.confidence}%</span>
                  </div>
                  <div className="upload-progress"><span style={{ width: `${progress}%` }} /></div>
                </div>
              );
            })}
          </div>
        </article>
      </section>

      <section className="management-grid">
        <article className="panel ocr-panel">
          <div className="panel-heading">
            <div>
              <p className="eyebrow">OCR Pipeline</p>
              <h3>文档识别与结构化</h3>
            </div>
            <span className="status-pill">PaddleOCR</span>
          </div>
          <div className="ocr-job-list">
            {ocrJobs.map((job) => (
              <div className="ocr-job-card" key={job.id}>
                <div className="assignment-title">
                  <FileText size={18} />
                  <strong>OCR 任务 #{job.id}</strong>
                </div>
                <div className="assignment-meta">
                  <span>{job.pageCount} 页</span>
                  <span>{job.textBlockCount} 文本块</span>
                  <span>{job.tableCount} 表格</span>
                  <span className="status-pill">{ocrStatusText[job.status]}</span>
                </div>
                <div className="ocr-confidence">
                  <span>识别置信度</span>
                  <strong>{job.confidence}%</strong>
                </div>
              </div>
            ))}
          </div>
        </article>

        <article className="panel ocr-panel">
          <div className="panel-heading">
            <div>
              <p className="eyebrow">Structured Blocks</p>
              <h3>结构识别结果</h3>
            </div>
            <span className="status-pill">可用于评分</span>
          </div>
          <div className="ocr-block-list">
            {ocrJobs[0]?.blocks.map((block) => (
              <div className="ocr-block-row" key={`${block.type}-${block.page}-${block.title}`}>
                <div>
                  <strong>{block.title}</strong>
                  <span>{block.type} · 第 {block.page} 页</span>
                </div>
                <b>{block.confidence}%</b>
              </div>
            ))}
          </div>
        </article>
      </section>

      <section className="management-grid">
        <article className="panel similarity-panel">
          <div className="panel-heading">
            <div>
              <p className="eyebrow">Similarity Check</p>
              <h3>查重检测</h3>
            </div>
            <button className="ghost-button" type="button" onClick={handleStartSimilarity}>
              <ShieldCheck size={15} /> 启动查重
            </button>
          </div>
          <div className="similarity-job-list">
            {similarityRows.map((job) => (
              <div className="similarity-card" key={job.id}>
                <div className="similarity-summary">
                  <strong>查重任务 #{job.id}</strong>
                  <span>{job.checkedSubmissionCount} 份 · 最高相似度 {Math.round(job.maxSimilarity * 100)}% · 高风险 {job.highRiskPairCount} 组</span>
                </div>
                <div className="similarity-match-list">
                  {job.matches.map((match) => (
                    <div className={`similarity-match ${match.riskLevel.toLowerCase()}`} key={`${job.id}-${match.sourceSubmissionId}-${match.targetSubmissionId}`}>
                      <div>
                        <strong>{match.sourceStudentName} / {match.targetStudentName}</strong>
                        <span>{match.matchedSection}</span>
                      </div>
                      <b>{Math.round(match.similarity * 100)}%</b>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </article>
      </section>

      <section className="review-layout">
        <article className="panel review-preview-panel">
          <div className="panel-heading">
            <div>
              <p className="eyebrow">Manual Review</p>
              <h3>人工复核工作区</h3>
            </div>
            <span className="status-pill">{reviewStatusText[selectedReview.reviewStatus]}</span>
          </div>
          <div className="review-switcher">
            {reviewResults.map((result) => (
              <button
                className={selectedReview.id === result.id ? 'selected' : ''}
                key={result.id}
                type="button"
                onClick={() => setSelectedReviewId(result.id)}
              >
                <strong>{result.studentName}</strong>
                <span>{result.studentNo} · {result.teacherScore}/{result.totalScore} 分</span>
              </button>
            ))}
          </div>
          <div className="pdf-preview">
            <div className="pdf-page">
              <div className="pdf-toolbar">
                <span>{selectedReview.fileName}</span>
                <a className="ghost-button compact-link" href={resolveApiAssetUrl(selectedReview.annotationPdfUrl)} rel="noreferrer" target="_blank">
                  <FileText size={14} /> 打开批注
                </a>
              </div>
              <h4>Java Web 综合实训报告</h4>
              <p>需求分析、系统设计、核心功能实现、数据库表结构、测试截图、实训总结。</p>
              <div className="pdf-highlight">数据库表结构：外键约束说明不完整</div>
              <div className="pdf-highlight muted">系统运行截图：建议补充失败场景截图</div>
              <div className="pdf-comment">AI 批注 PDF：{selectedReview.annotationPdfUrl}</div>
            </div>
          </div>
          <div className="annotation-list">
            {selectedReview.annotations.map((annotation) => (
              <div className={`annotation-row ${annotation.severity}`} key={annotation.id}>
                <strong>第 {annotation.page} 页 · {annotation.anchorText}</strong>
                <span>{annotation.comment}</span>
              </div>
            ))}
          </div>
        </article>

        <article className="panel review-score-panel">
          <div className="review-score-summary">
            <div>
              <span>AI 初评</span>
              <strong>{selectedReview.aiScore}</strong>
            </div>
            <div>
              <span>教师复核</span>
              <strong>{selectedReview.teacherScore}</strong>
            </div>
            <div>
              <span>置信度</span>
              <strong>{selectedReview.confidence}%</strong>
            </div>
          </div>
          <div className="publication-actions">
            <div>
              <span>发布状态</span>
              <strong>{publicationStatusText[selectedReview.publicationStatus]}</strong>
              {selectedReview.publishedAt && <small>{formatDate(selectedReview.publishedAt)} 发布</small>}
            </div>
            <div className="publication-buttons">
              <button
                className="primary-button"
                type="button"
                onClick={handlePublishResult}
                disabled={selectedReview.reviewStatus !== 'APPROVED'}
              >
                <CheckCircle2 size={16} /> 发布成绩
              </button>
              <button className="ghost-button" type="button" onClick={handleWithdrawResult}>
                撤回发布
              </button>
            </div>
          </div>
          <div className="overall-comment">
            <span>总评</span>
            <p>{selectedReview.overallComment}</p>
          </div>
          <div className="review-item-list">
            {selectedReview.items.map((item) => (
              <form className="review-item-card" key={item.rubricItemId} onSubmit={(event) => handleReviewItemSubmit(event, item.rubricItemId)}>
                <div className="review-item-heading">
                  <div>
                    <strong>{item.title}</strong>
                    <span>AI {item.aiScore}/{item.maxScore} · 置信度 {item.confidence}%</span>
                  </div>
                  <label>
                    教师分
                    <input name="teacherScore" type="number" min="0" max={item.maxScore} defaultValue={item.teacherScore} />
                  </label>
                </div>
                <div className="deduction-box">
                  <span>扣分原因</span>
                  <p>{item.deductionReason}</p>
                </div>
                <div className="evidence-tags">
                  {item.evidence.map((evidence) => <span key={evidence}>{evidence}</span>)}
                </div>
                <label className="comment-field">
                  教师评语
                  <textarea name="teacherComment" rows={2} defaultValue={item.teacherComment} />
                </label>
                <button className="ghost-button" type="submit">保存分项复核</button>
              </form>
            ))}
          </div>
          <button className="primary-button full-width" type="button" onClick={handleApproveResult}>
            <CheckCircle2 size={16} /> 通过复核，等待发布
          </button>
          <div className="audit-list">
            <strong>发布审计</strong>
            {publicationAudits.filter((item) => item.resultId === selectedReview.id).length === 0 ? (
              <span>暂无发布操作记录</span>
            ) : (
              publicationAudits.filter((item) => item.resultId === selectedReview.id).map((audit) => (
                <div className="audit-row" key={audit.id}>
                  <span>{audit.action === 'PUBLISH' ? '发布' : '撤回'} · {audit.operatorName}</span>
                  <small>{audit.reason} · {formatDate(audit.createdAt)}</small>
                </div>
              ))
            )}
          </div>
        </article>
      </section>

      <section className="analytics-grid">
        <article className="panel analytics-panel">
          <div className="panel-heading">
            <div>
              <p className="eyebrow">Grade Analytics</p>
              <h3>成绩统计</h3>
            </div>
            <button className="ghost-button" type="button" onClick={handleCreateGradeExport}>
              <FileText size={15} /> 导出成绩
            </button>
          </div>
          <span className="status-pill">{gradeStatistics.publishedCount} 份已发布</span>
          <div className="analytics-metrics">
            <span><strong>{gradeStatistics.averageScore}</strong>均分</span>
            <span><strong>{gradeStatistics.standardDeviation}</strong>标准差</span>
            <span><strong>{gradeStatistics.maxScore}</strong>最高分</span>
            <span><strong>{gradeStatistics.minScore}</strong>最低分</span>
          </div>
          <div className="score-buckets">
            {gradeStatistics.scoreBuckets.map((bucket) => {
              const width = gradeStatistics.publishedCount === 0 ? 0 : Math.round((bucket.studentCount / gradeStatistics.publishedCount) * 100);
              return (
                <div className="bucket-row" key={bucket.label}>
                  <span>{bucket.label}</span>
                  <div><b style={{ width: `${width}%` }} /></div>
                  <strong>{bucket.studentCount} 人</strong>
                </div>
              );
            })}
          </div>
          <div className="index-row">
            <span>难度系数 {gradeStatistics.difficultyIndex}</span>
            <span>区分度 {gradeStatistics.discriminationIndex}</span>
          </div>
          <div className="audit-list">
            <strong>导出记录</strong>
            {exportRows.map((item) => (
              <div className="audit-row" key={item.id}>
                <span>{item.fileName} · {item.rowCount} 行</span>
                <small>
                  {item.status} · {formatDate(item.createdAt)} ·{' '}
                  <a href={resolveApiAssetUrl(item.downloadUrl)} rel="noreferrer" target="_blank">下载文件</a>
                </small>
              </div>
            ))}
          </div>
        </article>

        <article className="panel analytics-panel">
          <div className="panel-heading">
            <div>
              <p className="eyebrow">Loss Points</p>
              <h3>高频失分点</h3>
            </div>
            <BarChart3 size={22} />
          </div>
          <div className="loss-list">
            {lossPoints.map((item) => (
              <div className="loss-row" key={item.rubricItemId}>
                <div>
                  <strong>{item.title}</strong>
                  <span>{item.courseOutcomeCode} · 影响 {item.affectedStudentCount} 人</span>
                  <p>{item.topReason}</p>
                </div>
                <b>-{item.averageLostScore}</b>
              </div>
            ))}
          </div>
        </article>

        <article className="panel analytics-panel outcome-panel">
          <div className="panel-heading">
            <div>
              <p className="eyebrow">Course Outcomes</p>
              <h3>课程目标达成度</h3>
            </div>
            <span className="status-pill">目标值 75%</span>
          </div>
          <div className="outcome-list">
            {courseOutcomes.map((item) => (
              <div className="outcome-row" key={item.courseOutcomeCode}>
                <div className="outcome-title">
                  <strong>{item.courseOutcomeCode}</strong>
                  <span>{item.title}</span>
                  <b>{item.status}</b>
                </div>
                <div className="outcome-bar">
                  <span style={{ width: `${Math.round(item.achievedValue * 100)}%` }} />
                  <i style={{ left: `${Math.round(item.targetValue * 100)}%` }} />
                </div>
                <small>{Math.round(item.achievedValue * 100)}% / 目标 {Math.round(item.targetValue * 100)}%</small>
              </div>
            ))}
          </div>
        </article>
      </section>

      <section className="management-grid">
        <article className="panel appeal-panel">
          <div className="panel-heading">
            <div>
              <p className="eyebrow">Appeals</p>
              <h3>学生申诉处理</h3>
            </div>
            <span className="status-pill">{appealRows.filter((item) => item.status === 'SUBMITTED').length} 条待处理</span>
          </div>
          <div className="appeal-list">
            {appealRows.map((appeal) => (
              <div className="appeal-card" key={appeal.id}>
                <div className="appeal-heading">
                  <div>
                    <strong>{appeal.studentName}</strong>
                    <span>结果 #{appeal.resultId} · 评分项 {appeal.rubricItemId ?? '总评'}</span>
                  </div>
                  <b>{appealStatusText[appeal.status]}</b>
                </div>
                <p>{appeal.reason}</p>
                <div className="appeal-request">{appeal.requestedChange}</div>
                {appeal.teacherReply && <div className="appeal-reply">{appeal.teacherReply}</div>}
                {appeal.status === 'SUBMITTED' && (
                  <div className="publication-buttons">
                    <button className="primary-button" type="button" onClick={() => handleResolveAppeal(appeal.id, true)}>采纳申诉</button>
                    <button className="ghost-button" type="button" onClick={() => handleResolveAppeal(appeal.id, false)}>驳回申诉</button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </article>
      </section>

      <section className="management-grid">
        <article className="panel collection-panel">
          <div className="panel-heading">
            <div>
              <p className="eyebrow">Submission Collection</p>
              <h3>报告收集看板</h3>
            </div>
            <button className="ghost-button" type="button" onClick={handleRemindUnsubmitted}>
              <Bell size={15} /> 一键催交
            </button>
          </div>
          <div className="collection-summary">
            <div className="collection-ring" style={{ '--rate': `${submittedRate}%` } as CSSProperties}>
              <strong>{submittedRate}%</strong>
              <span>提交率</span>
            </div>
            <div className="collection-stats">
              <span><strong>{collectionOverview.totalStudents}</strong>应交</span>
              <span><strong>{collectionOverview.submitted}</strong>已交</span>
              <span><strong>{collectionOverview.unsubmitted}</strong>未交</span>
              <span><strong>{collectionOverview.lateSubmitted}</strong>迟交</span>
            </div>
          </div>
          {reminderResult && (
            <div className="reminder-result">
              <CheckCircle2 size={18} />
              <span>{reminderResult.status}：{reminderResult.recipientCount} 名学生，{reminderResult.messageCount} 条消息</span>
            </div>
          )}
        </article>

        <article className="panel collection-panel">
          <div className="panel-heading">
            <div>
              <p className="eyebrow">Unsubmitted</p>
              <h3>未交名单</h3>
            </div>
            <span className="status-pill">{unsubmittedStudents.length} 人待提醒</span>
          </div>
          <div className="unsubmitted-list">
            {unsubmittedStudents.map((student) => (
              <div className="unsubmitted-row" key={student.studentId}>
                <div>
                  <strong>{student.name}</strong>
                  <span>{student.studentNo} · {student.className}</span>
                </div>
                <small>{student.email}</small>
              </div>
            ))}
          </div>
        </article>
      </section>

      <section className="management-grid">
        <article className="panel roster-panel">
          <div className="panel-heading">
            <div>
              <p className="eyebrow">Roster Import</p>
              <h3>学生名单导入</h3>
            </div>
            <button className="ghost-button" type="button"><UploadCloud size={15} /> 导入 Excel</button>
          </div>
          <div className="import-dropzone">
            <UploadCloud size={28} />
            <strong>拖拽学生名单到这里</strong>
            <span>支持 Excel 模板，字段包含学号、姓名、邮箱、手机号、班级</span>
          </div>
          <div className="import-metrics">
            <span><strong>{importPreview.total}</strong>总记录</span>
            <span><strong>{importPreview.valid}</strong>可导入</span>
            <span><strong>{importPreview.duplicated}</strong>重复</span>
            <span><strong>{importPreview.invalid}</strong>异常</span>
          </div>
        </article>

        <article className="panel roster-panel">
          <div className="panel-heading">
            <div>
              <p className="eyebrow">Directory</p>
              <h3>组织与学生</h3>
            </div>
            <span className="status-pill">{students.length} 名学生</span>
          </div>
          <div className="org-chain">
            {organizations.slice(0, 3).map((item) => (
              <span key={item.id}>{item.name}</span>
            ))}
          </div>
          <div className="student-list">
            {students.slice(0, 4).map((student) => (
              <div className="student-row" key={student.id}>
                <div>
                  <strong>{student.name}</strong>
                  <span>{student.studentNo} · {student.email}</span>
                </div>
                <span className="status-pill">{student.status === 'ACTIVE' ? '已激活' : '待激活'}</span>
              </div>
            ))}
          </div>
        </article>
      </section>

      <section className="content-grid">
        <article className="panel wide-panel">
          <div className="panel-heading">
            <div>
              <p className="eyebrow">Grading Pipeline</p>
              <h3>AI 批改流水线</h3>
            </div>
            <span className="status-pill">运行正常</span>
          </div>
          <div className="pipeline">
            {pipelineSteps.map((step, index) => (
              <div className="pipeline-step" key={step}>
                <CheckCircle2 size={18} />
                <span>{index + 1}. {step}</span>
              </div>
            ))}
          </div>
        </article>

        <article className="panel">
          <div className="panel-heading">
            <div>
              <p className="eyebrow">Operations</p>
              <h3>生产运维能力</h3>
            </div>
            <Users size={22} />
          </div>
          <ul className="feature-list">
            <li><Clock3 size={16} /> 异步批改队列与失败重试</li>
            <li><ShieldCheck size={16} /> RBAC 权限与成绩审计</li>
            <li><BarChart3 size={16} /> 失分分析与达成度报表</li>
          </ul>
        </article>
      </section>
    </>
  );
}

function AdminDashboard({
  organizations,
  students,
  auditLogs,
  systemSettings,
}: {
  organizations: ReturnType<typeof mockApi.listOrganizations>;
  students: ReturnType<typeof mockApi.listUsers>;
  auditLogs: ReturnType<typeof mockApi.listAuditLogs>;
  systemSettings: ReturnType<typeof mockApi.listSystemSettings>;
}) {
  const activeStudents = students.filter((student) => student.status === 'ACTIVE').length;
  const resourceTypes = Array.from(new Set(auditLogs.map((item) => item.resourceType)));
  const aiSettings = systemSettings.filter((item) => item.category === 'AI');

  return (
    <>
      <section className="stats-grid">
        <article className="stat-card blue">
          <span>组织节点</span>
          <strong>{organizations.length}</strong>
          <small>学院 / 专业 / 班级</small>
        </article>
        <article className="stat-card teal">
          <span>学生账号</span>
          <strong>{students.length}</strong>
          <small>{activeStudents} 个已激活</small>
        </article>
        <article className="stat-card violet">
          <span>审计事件</span>
          <strong>{auditLogs.length}</strong>
          <small>{resourceTypes.length} 类资源</small>
        </article>
        <article className="stat-card orange">
          <span>高风险操作</span>
          <strong>{auditLogs.filter((item) => item.action.includes('EXPORT') || item.action.includes('PUBLISH')).length}</strong>
          <small>发布 / 导出重点留痕</small>
        </article>
      </section>

      <section className="management-grid">
        <article className="panel roster-panel">
          <div className="panel-heading">
            <div>
              <p className="eyebrow">Directory</p>
              <h3>组织与账号状态</h3>
            </div>
            <ShieldCheck size={22} />
          </div>
          <div className="org-chain">
            {organizations.map((item) => (
              <span key={item.id}>{item.name}</span>
            ))}
          </div>
          <div className="student-list">
            {students.map((student) => (
              <div className="student-row" key={student.id}>
                <div>
                  <strong>{student.name}</strong>
                  <span>{student.studentNo ?? student.teacherNo ?? student.username} · {student.email}</span>
                </div>
                <span className="status-pill">{student.status === 'ACTIVE' ? '已激活' : '待处理'}</span>
              </div>
            ))}
          </div>
        </article>

        <article className="panel audit-panel">
          <div className="panel-heading">
            <div>
              <p className="eyebrow">Audit Logs</p>
              <h3>关键操作审计</h3>
            </div>
            <span className="status-pill">最近 {auditLogs.length} 条</span>
          </div>
          <div className="audit-list">
            {auditLogs.map((log) => (
              <div className="audit-row" key={log.id}>
                <span>{log.action} · {log.actorName}</span>
                <small>{log.resourceType} #{log.resourceId} · {log.detail} · {formatDate(log.createdAt)}</small>
              </div>
            ))}
          </div>
        </article>
      </section>

      <section className="management-grid">
        <article className="panel roster-panel">
          <div className="panel-heading">
            <div>
              <p className="eyebrow">System Settings</p>
              <h3>系统与模型配置</h3>
            </div>
            <span className="status-pill">{aiSettings.length} 项 AI 配置</span>
          </div>
          <div className="student-list">
            {systemSettings.map((setting) => (
              <div className="student-row" key={setting.key}>
                <div>
                  <strong>{setting.name}</strong>
                  <span>{setting.key} · {setting.category}</span>
                </div>
                <span className="status-pill">{setting.sensitive ? '敏感配置' : setting.value}</span>
              </div>
            ))}
          </div>
        </article>
      </section>
    </>
  );
}
