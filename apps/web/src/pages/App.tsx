import {
  BarChart3,
  Bell,
  BookOpen,
  CheckCircle2,
  Clock3,
  FileCheck2,
  FileText,
  GraduationCap,
  LayoutDashboard,
  ShieldCheck,
  Sparkles,
  UploadCloud,
  Users,
} from 'lucide-react';

const teacherStats = [
  { label: '进行中任务', value: '8', trend: '+2 本周', tone: 'blue' },
  { label: '待 AI 批改', value: '126', trend: '预计 42 分钟', tone: 'violet' },
  { label: '待教师复核', value: '12', trend: '低置信度优先', tone: 'teal' },
  { label: '未提交学生', value: '31', trend: '今晚 18:00 催交', tone: 'orange' },
];

const studentTasks = [
  { title: 'Java Web 综合实训报告', status: '未提交', meta: '今晚 23:59 截止', action: '立即上传' },
  { title: '数据库设计报告', status: '已发布成绩', meta: '得分 88 / 100', action: '查看批注' },
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

export function App() {
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
            <button className="nav-item" key={item.label} type="button">
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
            <button className="icon-button" type="button" aria-label="通知">
              <Bell size={18} />
            </button>
            <div className="avatar">王</div>
          </div>
        </header>

        <section className="hero-card">
          <div>
            <p className="eyebrow">Teacher Workspace</p>
            <h2>老师端工作台</h2>
            <p>
              聚合任务进度、待复核报告、未提交名单和教学风险，让教师从收集、批改到发布成绩全流程可控。
            </p>
          </div>
          <button className="primary-button" type="button">
            创建实训任务
          </button>
        </section>

        <section className="stats-grid">
          {teacherStats.map((item) => (
            <article className={`stat-card ${item.tone}`} key={item.label}>
              <span>{item.label}</span>
              <strong>{item.value}</strong>
              <small>{item.trend}</small>
            </article>
          ))}
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
              {['文件预处理', 'OCR 识别', '结构化提取', '语义评分', 'PDF 批注', '教师复核'].map((step, index) => (
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
                <p className="eyebrow">Student Portal</p>
                <h3>学生端任务</h3>
              </div>
              <GraduationCap size={22} />
            </div>
            <div className="task-list">
              {studentTasks.map((task) => (
                <div className="task-card" key={task.title}>
                  <div>
                    <strong>{task.title}</strong>
                    <span>{task.meta}</span>
                  </div>
                  <div className="task-footer">
                    <span className="task-status">{task.status}</span>
                    <button type="button">{task.action}</button>
                  </div>
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
      </section>
    </main>
  );
}
