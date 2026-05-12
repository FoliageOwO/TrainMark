import { useState, type CSSProperties } from 'react';
import {
  BarChart3,
  Bell,
  BookOpen,
  CalendarClock,
  CheckCircle2,
  Clock3,
  FileCheck2,
  FileText,
  GraduationCap,
  LayoutDashboard,
  Plus,
  ShieldCheck,
  Sparkles,
  UploadCloud,
  Users,
} from 'lucide-react';
import { mockApi } from '../api/mockApi';
import type { CourseSummary, RoleCode, UserProfile } from '../api/types';

const roleOptions: Array<{ role: RoleCode; label: string; hint: string }> = [
  { role: 'TEACHER', label: '教师端', hint: '任务、批改、复核、统计' },
  { role: 'STUDENT', label: '学生端', hint: '提交报告、查看批注' },
  { role: 'ADMIN', label: '管理端', hint: '用户、权限、系统配置' },
];

const navItems = [
  { icon: LayoutDashboard, label: '工作台' },
  { icon: BookOpen, label: '课程与班级' },
  { icon: FileText, label: '实训任务' },
  { icon: UploadCloud, label: '报告收集' },
  { icon: Sparkles, label: 'AI 批改中心' },
  { icon: FileCheck2, label: '人工复核' },
  { icon: BarChart3, label: '失分分析' },
  { icon: ShieldCheck, label: '系统管理' },
];

const pipelineSteps = ['文件预处理', 'OCR 识别', '结构化提取', '语义评分', 'PDF 批注', '教师复核'];

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

export function App() {
  const [user, setUser] = useState<UserProfile>(() => mockApi.login('TEACHER'));
  const [activeNav, setActiveNav] = useState('工作台');
  const [selectedCourseId, setSelectedCourseId] = useState(1);

  const primaryRole = user.roles[0];
  const metrics = mockApi.getMetrics();
  const courses = mockApi.listCourses();
  const selectedCourse = courses.find((course) => course.id === selectedCourseId) ?? courses[0];
  const classes = mockApi.listClasses(selectedCourse.id);
  const assignments = mockApi.listAssignments(selectedCourse.id);
  const studentTasks = mockApi.listStudentTasks();
  const organizations = mockApi.listOrganizations();
  const students = mockApi.listUsers('STUDENT');
  const importPreview = mockApi.getStudentImportPreview();
  const collectionOverview = mockApi.getCollectionOverview();
  const unsubmittedStudents = mockApi.listUnsubmittedStudents();
  const rubrics = mockApi.listRubrics();
  const gradingJobs = mockApi.listGradingJobs();
  const ocrJobs = mockApi.listOcrJobs();

  const teacherStats = [
    { label: '进行中任务', value: String(metrics.activeAssignments), trend: '+2 本周', tone: 'blue' },
    { label: '待 AI 批改', value: String(metrics.pendingGrading), trend: '预计 42 分钟', tone: 'violet' },
    { label: '待教师复核', value: String(metrics.pendingReview), trend: '低置信度优先', tone: 'teal' },
    { label: '未提交学生', value: String(metrics.unsubmitted), trend: '今晚 18:00 催交', tone: 'orange' },
  ];

  return (
    <main className="app-shell">
      <aside className="sidebar">
        <div className="brand">
          <div className="brand-mark">智</div>
          <div>
            <strong>智训批</strong>
            <span>TrainMark AI</span>
          </div>
        </div>
        <nav className="nav-list">
          {navItems.map((item) => (
            <button
              className={`nav-item ${activeNav === item.label ? 'active' : ''}`}
              key={item.label}
              type="button"
              onClick={() => setActiveNav(item.label)}
            >
              <item.icon size={18} />
              {item.label}
            </button>
          ))}
        </nav>
      </aside>

      <section className="workspace">
        <header className="topbar">
          <div>
            <p className="eyebrow">生产级实训报告智能批改与管理平台</p>
            <h1>智训批 TrainMark AI</h1>
          </div>
          <div className="topbar-actions">
            <div className="role-switcher" aria-label="角色切换">
              {roleOptions.map((option) => (
                <button
                  className={primaryRole === option.role ? 'selected' : ''}
                  key={option.role}
                  type="button"
                  onClick={() => setUser(mockApi.login(option.role))}
                >
                  {option.label}
                </button>
              ))}
            </div>
            <button className="icon-button" type="button" aria-label="通知">
              <Bell size={18} />
            </button>
            <div className="avatar">{user.name.slice(0, 1)}</div>
          </div>
        </header>

        <section className="hero-card">
          <div>
            <p className="eyebrow">{primaryRole === 'STUDENT' ? 'Student Portal' : 'Teacher Workspace'}</p>
            <h2>{primaryRole === 'STUDENT' ? '学生端学习与提交中心' : '老师端教学管理工作台'}</h2>
            <p>
              {primaryRole === 'STUDENT'
                ? '聚合待提交任务、批改进度、成绩反馈和申诉入口，让学生清楚知道下一步要做什么。'
                : '聚合任务进度、待复核报告、未提交名单和教学风险，让教师从收集、批改到发布成绩全流程可控。'}
            </p>
          </div>
          <div className="hero-actions">
            <div className="user-chip">
              <span>{user.name}</span>
              <small>{roleOptions.find((item) => item.role === primaryRole)?.hint}</small>
            </div>
            <button className="primary-button" type="button">
              <Plus size={16} /> {primaryRole === 'STUDENT' ? '上传报告' : '创建实训任务'}
            </button>
          </div>
        </section>

        {primaryRole === 'STUDENT' ? (
          <StudentDashboard tasks={studentTasks} />
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
          />
        )}
      </section>
    </main>
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
}) {
  const [reminderResult, setReminderResult] = useState<ReturnType<typeof mockApi.remindUnsubmitted> | null>(null);
  const [startedJob, setStartedJob] = useState<ReturnType<typeof mockApi.startGradingJob> | null>(null);
  const submittedRate = Math.round((collectionOverview.submitted / collectionOverview.totalStudents) * 100);
  const rubric = rubrics[0];
  const visibleJobs = startedJob ? [startedJob, ...gradingJobs] : gradingJobs;

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
            <button className="ghost-button" type="button" onClick={() => setStartedJob(mockApi.startGradingJob())}>
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
        <article className="panel collection-panel">
          <div className="panel-heading">
            <div>
              <p className="eyebrow">Submission Collection</p>
              <h3>报告收集看板</h3>
            </div>
            <button className="ghost-button" type="button" onClick={() => setReminderResult(mockApi.remindUnsubmitted())}>
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

function StudentDashboard({ tasks }: { tasks: ReturnType<typeof mockApi.listStudentTasks> }) {
  const [selectedFileName, setSelectedFileName] = useState('JavaWeb综合实训报告-张三-2024010101.pdf');
  const [uploadProgress, setUploadProgress] = useState(72);
  const [receipt, setReceipt] = useState<ReturnType<typeof mockApi.createUploadReceipt> | null>(null);

  const confirmUpload = () => {
    setUploadProgress(100);
    setReceipt(mockApi.createUploadReceipt(selectedFileName));
  };

  return (
    <section className="student-grid">
      <article className="panel wide-panel">
        <div className="panel-heading">
          <div>
            <p className="eyebrow">My Tasks</p>
            <h3>我的实训任务</h3>
          </div>
          <GraduationCap size={22} />
        </div>
        <div className="student-task-list">
          {tasks.map((task) => (
            <div className="student-task-card" key={task.id}>
              <div>
                <strong>{task.title}</strong>
                <span>{task.courseName}</span>
              </div>
              <div className="assignment-meta">
                <span><CalendarClock size={14} /> {formatDate(task.deadline)}</span>
                <span className="status-pill">{task.status}</span>
                {task.score !== undefined && <span className="score-chip">{task.score} 分</span>}
              </div>
              <button className="primary-button" type="button">
                {task.status === '未提交' ? '立即上传' : '查看批注'}
              </button>
            </div>
          ))}
        </div>
      </article>

      <article className="panel">
        <div className="panel-heading">
          <div>
            <p className="eyebrow">Upload</p>
            <h3>上传报告</h3>
          </div>
          <UploadCloud size={22} />
        </div>
        <div className="student-upload-card">
          <div className="upload-dropzone compact">
            <UploadCloud size={24} />
            <strong>拖拽报告到这里</strong>
            <span>PDF / Word / JPG / PNG，最大 50MB</span>
          </div>
          <label className="file-name-field">
            文件名
            <input
              value={selectedFileName}
              onChange={(event) => {
                setSelectedFileName(event.target.value);
                setReceipt(null);
                setUploadProgress(36);
              }}
            />
          </label>
          <div className="detected-profile">
            <span>识别信息</span>
            <strong>张三 / 2024010101 / 软件2401班</strong>
          </div>
          <div className="upload-progress" aria-label="上传进度">
            <span style={{ width: `${uploadProgress}%` }} />
          </div>
          {receipt ? (
            <div className="receipt-card">
              <CheckCircle2 size={18} />
              <div>
                <strong>提交成功</strong>
                <span>回执 #{receipt.submissionId} · 版本 {receipt.version}</span>
              </div>
            </div>
          ) : (
            <button className="primary-button full-width" type="button" onClick={confirmUpload}>
              确认提交
            </button>
          )}
        </div>
        <ul className="feature-list">
          <li><FileText size={16} /> 支持 PDF、Word、JPG、PNG</li>
          <li><Clock3 size={16} /> 截止前可重复提交并保留版本</li>
          <li><CheckCircle2 size={16} /> 系统自动识别姓名、学号、班级</li>
        </ul>
      </article>
    </section>
  );
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat('zh-CN', {
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(value));
}
