import { useEffect, useState, type FormEvent } from 'react';
import {
  BarChart3,
  CalendarClock,
  CheckCircle2,
  Clock3,
  FileText,
  Plus,
  ShieldCheck,
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
  shouldUseHttpApi,
  startSimilarityJob,
  updateReviewItem,
  withdrawGradingResult,
  type WorkspaceData,
} from '../api/httpApi';
import type { CourseSummary, RoleCode, UserProfile } from '../api/types';
import { AdminDashboard } from '../components/AdminDashboard';
import { AppChrome } from '../components/AppChrome';
import { StudentDashboard } from '../components/StudentDashboard';
import { TeacherAnalyticsPanel } from '../components/TeacherAnalyticsPanel';
import { TeacherAiPipeline } from '../components/TeacherAiPipeline';
import { TeacherAppealPanel } from '../components/TeacherAppealPanel';
import { TeacherCollectionPanel } from '../components/TeacherCollectionPanel';
import { TeacherReviewWorkspace } from '../components/TeacherReviewWorkspace';
import { TeacherSimilarityPanel } from '../components/TeacherSimilarityPanel';
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

      <TeacherAiPipeline
        rubric={rubric}
        gradingJobs={visibleJobs}
        ocrJobs={ocrJobs}
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
