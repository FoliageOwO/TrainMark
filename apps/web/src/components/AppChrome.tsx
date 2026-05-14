import type { ReactNode } from 'react';
import {
  BarChart3,
  Bell,
  BookOpen,
  FileCheck2,
  FileText,
  LayoutDashboard,
  Plus,
  ShieldCheck,
  Sparkles,
  UploadCloud,
} from 'lucide-react';
import type { RoleCode, UserProfile } from '../api/types';

type RoleOption = {
  role: RoleCode;
  label: string;
  hint: string;
};

const roleOptions: RoleOption[] = [
  { role: 'TEACHER', label: '教师端', hint: '任务、批改、复核、统计' },
  { role: 'STUDENT', label: '学生端', hint: '提交报告、查看批注' },
  { role: 'COURSE_OWNER', label: '课程负责人', hint: '课程质量、成绩发布、达成分析' },
  { role: 'SUPERVISOR', label: '督导端', hint: '教学质量、风险查看、统计分析' },
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

type AppChromeProps = {
  activeNav: string;
  apiModeLabel: string;
  children: ReactNode;
  primaryRole: RoleCode;
  user: UserProfile;
  onNavChange: (label: string) => void;
  onRoleChange: (role: RoleCode) => void | Promise<void>;
};

export function AppChrome({
  activeNav,
  apiModeLabel,
  children,
  primaryRole,
  user,
  onNavChange,
  onRoleChange,
}: AppChromeProps) {
  const roleHint = roleOptions.find((item) => item.role === primaryRole)?.hint;
  const isStudent = primaryRole === 'STUDENT';
  const hero = heroCopy(primaryRole);

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
              onClick={() => onNavChange(item.label)}
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
                  onClick={() => onRoleChange(option.role)}
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
            <p className="eyebrow">{hero.eyebrow}</p>
            <h2>{hero.title}</h2>
            <p>{hero.description}</p>
          </div>
          <div className="hero-actions">
            <div className="user-chip">
              <span>{user.name}</span>
              <small>{roleHint} · {apiModeLabel}</small>
            </div>
            <button className="primary-button" type="button">
              <Plus size={16} /> {isStudent ? '上传报告' : '创建实训任务'}
            </button>
          </div>
        </section>

        {children}
      </section>
    </main>
  );
}

function heroCopy(role: RoleCode) {
  switch (role) {
    case 'STUDENT':
      return {
        eyebrow: 'Student Portal',
        title: '学生端学习与提交中心',
        description: '聚合待提交任务、批改进度、成绩反馈和申诉入口，让学生清楚知道下一步要做什么。',
      };
    case 'COURSE_OWNER':
      return {
        eyebrow: 'Course Owner Workspace',
        title: '课程负责人质量工作台',
        description: '聚合课程任务、批改进度、成绩发布和目标达成情况，让课程负责人把控教学质量闭环。',
      };
    case 'SUPERVISOR':
      return {
        eyebrow: 'Supervisor View',
        title: '督导端教学质量看板',
        description: '聚合课程风险、未交比例、成绩分布和达成分析，让督导快速定位需要关注的教学问题。',
      };
    case 'ADMIN':
      return {
        eyebrow: 'Admin Console',
        title: '管理端系统配置中心',
        description: '聚合组织账号、系统配置和审计日志，让管理员维护本地演示和真实联调所需的基础数据。',
      };
    case 'TEACHER':
    default:
      return {
        eyebrow: 'Teacher Workspace',
        title: '老师端教学管理工作台',
        description: '聚合任务进度、待复核报告、未提交名单和教学风险，让教师从收集、批改到发布成绩全流程可控。',
      };
  }
}
