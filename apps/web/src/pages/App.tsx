import { useState } from 'react';
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
  LogOut,
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
}: {
  assignments: ReturnType<typeof mockApi.listAssignments>;
  classes: ReturnType<typeof mockApi.listClasses>;
  courses: CourseSummary[];
  selectedCourse: CourseSummary;
  selectedCourseId: number;
  setSelectedCourseId: (courseId: number) => void;
  stats: Array<{ label: string; value: string; trend: string; tone: string }>;
}) {
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
            <p className="eyebrow">Upload Guide</p>
            <h3>提交要求</h3>
          </div>
          <UploadCloud size={22} />
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
