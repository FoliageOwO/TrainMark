import { useCallback, useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import { BellOutlined, LogoutOutlined } from '@ant-design/icons';
import { ProLayout } from '@ant-design/pro-components';
import { Avatar, Badge, Button, Space, Tag } from 'antd';
import type { RoleCode, UserProfile } from '../api/types';
import { listNotifications, shouldUseHttpApi } from '../api/httpApi';
import { mockApi } from '../api/mockApi';
import { NotificationPanel } from './NotificationPanel';

type AppChromeProps = {
  activeNav: string;
  children: ReactNode;
  primaryRole: RoleCode;
  user: UserProfile;
  onLogout: () => void | Promise<void>;
  onNavChange: (label: string) => void;
  onRoleChange: (role: RoleCode) => void | Promise<void>;
  allowRoleSwitch?: boolean;
};

type MenuItem = { path: string; name: string; roles: RoleCode[] };
const roleLabels: Record<RoleCode, string> = {
  TEACHER: '教师端',
  STUDENT: '学生端',
  COURSE_OWNER: '课程负责人',
  SUPERVISOR: '督导端',
  ADMIN: '管理端',
};

const menuItems: MenuItem[] = [
  { path: '/overview', name: '工作台', roles: ['TEACHER', 'COURSE_OWNER', 'SUPERVISOR'] },
  { path: '/courses', name: '课程准备', roles: ['TEACHER', 'COURSE_OWNER', 'SUPERVISOR'] },
  { path: '/assignments', name: '任务发布', roles: ['TEACHER', 'COURSE_OWNER', 'SUPERVISOR'] },
  { path: '/collection', name: '报告收集', roles: ['TEACHER', 'COURSE_OWNER', 'SUPERVISOR'] },
  { path: '/ai-pipeline', name: 'AI 批改', roles: ['TEACHER', 'COURSE_OWNER'] },
  { path: '/review', name: '人工复核', roles: ['TEACHER', 'COURSE_OWNER'] },
  { path: '/analytics', name: '结果分析', roles: ['TEACHER', 'COURSE_OWNER', 'SUPERVISOR'] },
  { path: '/roster', name: '系统管理', roles: ['ADMIN'] },
  { path: '/student-courses', name: '我的课程', roles: ['STUDENT'] },
  { path: '/student-submit', name: '提交报告', roles: ['STUDENT'] },
];

export function AppChrome({
  activeNav,
  children,
  primaryRole,
  user,
  onLogout,
  onNavChange,
  onRoleChange,
  allowRoleSwitch = true,
}: AppChromeProps) {
  const [notifOpen, setNotifOpen] = useState(false);
  const [unreadNotifications, setUnreadNotifications] = useState(0);

  const refreshUnreadNotifications = useCallback(async () => {
    try {
      const items = shouldUseHttpApi() ? await listNotifications(user.id, true) : mockApi.listNotifications(user.id, true);
      setUnreadNotifications(items.length);
    } catch {
      setUnreadNotifications(0);
    }
  }, [user.id]);

  useEffect(() => {
    void refreshUnreadNotifications();
    const timer = window.setInterval(() => void refreshUnreadNotifications(), 30000);
    return () => window.clearInterval(timer);
  }, [refreshUnreadNotifications]);

  const routes = useMemo(
    () => menuItems.filter((item) => item.roles.includes(primaryRole)).map((item) => ({ path: item.path, name: item.name })),
    [primaryRole],
  );

  const activePath = routes.find((item) => item.name === activeNav)?.path ?? routes[0]?.path ?? '/overview';
  const roleOptions = user.roles;

  return (
    <>
      <ProLayout
        title="智训批 TrainMark"
        logo="/icons/icon.svg"
        location={{ pathname: activePath }}
        route={{ routes }}
        menuItemRender={(item, dom) => (
          <span onClick={() => item.name && onNavChange(item.name as string)} style={{ display: 'inline-block', width: '100%', cursor: 'pointer' }}>
            {dom}
          </span>
        )}
        avatarProps={{
          src: undefined,
          title: user.name,
          render: (_, dom) => (
            <Space>
              <Avatar>{user.name.slice(0, 1)}</Avatar>
              {dom}
            </Space>
          ),
        }}
        actionsRender={() => [
          <Badge key="notify" count={unreadNotifications} size="small">
            <Button icon={<BellOutlined />} onClick={() => setNotifOpen((v) => !v)} />
          </Badge>,
          <Button key="logout" icon={<LogoutOutlined />} onClick={() => onLogout()} />,
        ]}
        rightContentRender={() => (
          <Space>
            {allowRoleSwitch && roleOptions.length > 1
              ? roleOptions.map((role) => (
                  <Tag key={role} color={role === primaryRole ? 'blue' : 'default'} style={{ cursor: 'pointer' }} onClick={() => onRoleChange(role)}>
                    {roleLabels[role]}
                  </Tag>
                ))
              : <Tag color="blue">{roleLabels[primaryRole]}</Tag>}
          </Space>
        )}
        token={{ header: { colorBgHeader: '#fff' }, sider: { colorBgMenuItemSelected: 'rgba(22,119,255,0.12)' } }}
        contentStyle={{ padding: 16 }}
      >
        {children}
      </ProLayout>
      <NotificationPanel userId={user.id} isOpen={notifOpen} onClose={() => setNotifOpen(false)} onUnreadCountChange={setUnreadNotifications} />
    </>
  );
}
