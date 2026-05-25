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
  MessageCircle,
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
};

type NavItem = {
  icon: typeof LayoutDashboard;
  label: string;
  roles: RoleCode[];
};

const roleOptions: RoleOption[] = [
  { role: 'TEACHER', label: '教师端' },
  { role: 'STUDENT', label: '学生端' },
  { role: 'COURSE_OWNER', label: '课程负责人' },
  { role: 'SUPERVISOR', label: '督导端' },
  { role: 'ADMIN', label: '管理端' },
];

const navItems: NavItem[] = [
  { icon: LayoutDashboard, label: '工作台', roles: ['TEACHER', 'COURSE_OWNER', 'SUPERVISOR'] },
  { icon: BookOpen, label: '课程与班级', roles: ['TEACHER', 'COURSE_OWNER', 'SUPERVISOR'] },
  { icon: FileText, label: '实训任务', roles: ['TEACHER', 'COURSE_OWNER', 'SUPERVISOR'] },
  { icon: UploadCloud, label: '报告收集', roles: ['TEACHER', 'COURSE_OWNER', 'SUPERVISOR'] },
  { icon: Sparkles, label: 'AI 批改中心', roles: ['TEACHER', 'COURSE_OWNER'] },
  { icon: FileCheck2, label: '人工复核', roles: ['TEACHER', 'COURSE_OWNER'] },
  { icon: MessageCircle, label: '申诉处理', roles: ['TEACHER', 'COURSE_OWNER'] },
  { icon: BarChart3, label: '失分分析', roles: ['TEACHER', 'COURSE_OWNER', 'SUPERVISOR'] },
  { icon: ShieldCheck, label: '系统管理', roles: ['ADMIN'] },
  { icon: GraduationCap, label: '我的课程', roles: ['STUDENT'] },
  { icon: FileText, label: '提交报告', roles: ['STUDENT'] },
];

type AppChromeProps = {
  activeNav: string;
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
  const visibleNavItems = navItems.filter((item) => item.roles.includes(primaryRole));
  const pageMeta = getPageMeta(activeNav, primaryRole);

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
    const handleNotificationChanged = () => {
      refreshUnreadNotifications();
      window.setTimeout(refreshUnreadNotifications, 800);
    };
    window.addEventListener('trainmark:notifications-changed', handleNotificationChanged);
    return () => {
      window.clearInterval(timer);
      window.removeEventListener('trainmark:notifications-changed', handleNotificationChanged);
    };
  }, [refreshUnreadNotifications, user.username]);

  return (
    <main className="app-shell">
      <aside className="sidebar">
        <div className="brand">
          <img src="/icons/icon.svg" alt="智训批" className="brand-logo" width="44" height="44" />
          <div>
            <strong>智训批</strong>
          </div>
        </div>
        <nav className="nav-list">
          {visibleNavItems.map((item) => (
            <button
              className={`nav-item ${activeNav === item.label ? 'active' : ''}`}
              key={item.label}
              type="button"
              onClick={() => onNavChange(item.label)}
            >
              <item.icon size={18} />
              <span className="nav-item-copy">
                <strong>{item.label}</strong>
              </span>
            </button>
          ))}
        </nav>
      </aside>

      <section className="workspace">
        <header className="topbar">
          <div className="topbar-left">
            <p className="page-title">{pageMeta.title}</p>
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
            <div className="user-chip">
              <span>{user.name}</span>
              <small>{user.username}</small>
            </div>
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

function getPageMeta(navLabel: string, role: RoleCode) {
  if (role === 'STUDENT') {
    if (navLabel === '提交报告') {
      return {
        title: '提交报告',
      };
    }
    return {
      title: '我的课程',
    };
  }

  const metaMap: Record<string, { title: string }> = {
    工作台: {
      title: '工作台',
    },
    '课程与班级': {
      title: '课程与班级',
    },
    实训任务: {
      title: '实训任务',
    },
    报告收集: {
      title: '报告收集',
    },
    'AI 批改中心': {
      title: 'AI 批改中心',
    },
    人工复核: {
      title: '人工复核',
    },
    申诉处理: {
      title: '申诉处理',
    },
    失分分析: {
      title: '失分分析',
    },
    系统管理: {
      title: '系统管理',
    },
  };

  return metaMap[navLabel] ?? {
    title: navLabel,
  };
}
