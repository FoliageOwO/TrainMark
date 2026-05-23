import { useCallback, useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import {
  BarChart3,
  Bell,
  BookOpen,
  FileCheck2,
  FileText,
  GraduationCap,
  LayoutDashboard,
  LogOut,
  ShieldCheck,
  Sparkles,
  UploadCloud,
} from 'lucide-react';
import type { RoleCode, UserProfile } from '../api/types';
import { listNotifications, shouldUseHttpApi } from '../api/httpApi';
import { mockApi } from '../api/mockApi';
import { NotificationPanel } from './NotificationPanel';

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
  { icon: LayoutDashboard, label: '工作台', roles: ['TEACHER', 'COURSE_OWNER', 'SUPERVISOR'] },
  { icon: BookOpen, label: '课程与班级', roles: ['TEACHER', 'COURSE_OWNER', 'SUPERVISOR'] },
  { icon: FileText, label: '实训任务', roles: ['TEACHER', 'COURSE_OWNER', 'SUPERVISOR'] },
  { icon: UploadCloud, label: '报告收集', roles: ['TEACHER', 'COURSE_OWNER', 'SUPERVISOR'] },
  { icon: Sparkles, label: 'AI 批改中心', roles: ['TEACHER', 'COURSE_OWNER'] },
  { icon: FileCheck2, label: '人工复核', roles: ['TEACHER', 'COURSE_OWNER'] },
  { icon: BarChart3, label: '失分分析', roles: ['TEACHER', 'COURSE_OWNER', 'SUPERVISOR'] },
  { icon: ShieldCheck, label: '系统管理', roles: ['ADMIN'] },
  { icon: GraduationCap, label: '我的课程', roles: ['STUDENT'] },
  { icon: FileText, label: '提交报告', roles: ['STUDENT'] },
];

type AppChromeProps = {
  activeNav: string;
  apiModeLabel: string;
  children: ReactNode;
  primaryRole: RoleCode;
  user: UserProfile;
  onLogout: () => void | Promise<void>;
  onNavChange: (label: string) => void;
  onRoleChange: (role: RoleCode) => void | Promise<void>;
};

export function AppChrome({
  activeNav,
  children,
  primaryRole,
  user,
  onLogout,
  onNavChange,
  onRoleChange,
}: AppChromeProps) {
  const [notifOpen, setNotifOpen] = useState(false);
  const [unreadNotifications, setUnreadNotifications] = useState(0);

  const refreshUnreadNotifications = useCallback(async () => {
    try {
      const items = shouldUseHttpApi()
        ? await listNotifications(user.id, true)
        : mockApi.listNotifications(user.id, true);
      setUnreadNotifications(items.length);
    } catch {
      setUnreadNotifications(0);
    }
  }, [user.id]);

  useEffect(() => {
    refreshUnreadNotifications();
    const timer = window.setInterval(refreshUnreadNotifications, 30000);
    return () => window.clearInterval(timer);
  }, [refreshUnreadNotifications]);

  return (
    <main className="app-shell">
      <aside className="sidebar">
        <div className="brand">
          <img src="/icons/icon.svg" alt="智训批" className="brand-logo" width="44" height="44" />
          <div>
            <strong>智训批</strong>
            <span>TrainMark AI</span>
          </div>
        </div>
        <nav className="nav-list">
          {navItems
            .filter((item) => item.roles.includes(primaryRole))
            .map((item) => (
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
          <div className="topbar-left">
            <p className="page-title">{getPageTitle(activeNav, primaryRole)}</p>
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
            <button
              className="icon-button notification-trigger"
              type="button"
              aria-label={`通知，${unreadNotifications} 条未读`}
              onClick={() => setNotifOpen(!notifOpen)}
            >
              <Bell size={18} />
              {unreadNotifications > 0 && (
                <span className="topbar-notification-badge">{unreadNotifications > 99 ? '99+' : unreadNotifications}</span>
              )}
            </button>
            <button className="icon-button" type="button" aria-label="退出登录" title="退出登录" onClick={() => onLogout()}>
              <LogOut size={18} />
            </button>
            <div className="avatar">{user.name.slice(0, 1)}</div>
          </div>
        </header>

        {children}
      </section>

      <NotificationPanel
        userId={user.id}
        isOpen={notifOpen}
        onClose={() => setNotifOpen(false)}
        onUnreadCountChange={setUnreadNotifications}
      />
    </main>
  );
}

function getPageTitle(navLabel: string, role: RoleCode): string {
  if (role === 'STUDENT') {
    return navLabel;
  }
  return navLabel;
}
