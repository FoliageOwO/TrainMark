import { useCallback, useEffect, useState } from 'react';
import { Badge, Button, Empty, Spin, Typography } from 'antd';
import { Bell, CheckCheck, ExternalLink } from 'lucide-react';
import { formatDate } from '../utils/formatDate';
import { listNotifications, markNotificationAsRead, markAllNotificationsAsRead, shouldUseHttpApi } from '../api/httpApi';
import { mockApi } from '../api/mockApi';
import type { NotificationItem } from '../api/types';

const typeIconMap: Record<string, string> = {
  ASSIGNMENT_PUBLISHED: '📋',
  REMINDER: '🔔',
  GRADING_COMPLETE: '✅',
  GRADE_PUBLISHED: '📊',
  APPEAL: '💬',
  REMINDER_SENT: '📧',
  SUBMISSION_UPLOADED: '📄',
};

type NotificationPanelProps = {
  userId: number;
  isOpen: boolean;
  onClose: () => void;
  onUnreadCountChange?: (count: number) => void;
};

export function NotificationPanel({ userId, isOpen, onClose, onUnreadCountChange }: NotificationPanelProps) {
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadNotifications = useCallback(async () => {
    setLoading(true);
    setError(null);
    let items: NotificationItem[];
    try {
      if (shouldUseHttpApi()) {
        items = await listNotifications(userId);
      } else {
        items = mockApi.listNotifications(userId);
      }
    } catch {
      setError('通知加载失败，请稍后重试。');
      setLoading(false);
      return;
    }
    setNotifications(items);
    const nextUnreadCount = items.filter((n) => !n.isRead).length;
    setUnreadCount(nextUnreadCount);
    onUnreadCountChange?.(nextUnreadCount);
    setLoading(false);
  }, [onUnreadCountChange, userId]);

  useEffect(() => {
    if (!isOpen) return;
    loadNotifications();
  }, [isOpen, loadNotifications]);

  useEffect(() => {
    if (isOpen) {
      return;
    }
    setLoading(false);
    setError(null);
  }, [isOpen]);

  const handleMarkRead = async (id: number) => {
    const item = notifications.find((n) => n.id === id);
    if (!item || item.isRead) {
      return;
    }
    try {
      if (shouldUseHttpApi()) {
        await markNotificationAsRead(id, userId);
      } else {
        mockApi.markNotificationAsRead(id);
      }
    } catch {
      setError('标记已读失败，请重试。');
      return;
    }
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, isRead: true } : n)),
    );
    setUnreadCount((count) => {
      const nextUnreadCount = Math.max(0, count - 1);
      onUnreadCountChange?.(nextUnreadCount);
      return nextUnreadCount;
    });
  };

  const handleMarkAllRead = async () => {
    try {
      if (shouldUseHttpApi()) {
        await markAllNotificationsAsRead(userId);
      } else {
        mockApi.markAllNotificationsAsRead(userId);
      }
    } catch {
      setError('全部已读操作失败，请重试。');
      return;
    }
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    setUnreadCount(0);
    onUnreadCountChange?.(0);
  };

  const handleOpenNotification = async (item: NotificationItem) => {
    await handleMarkRead(item.id);
    if (item.targetUrl) {
      const nextUrl = new URL(window.location.href);
      const teacherSection = mapNotificationTargetToTeacherSection(item.targetUrl);
      if (teacherSection) {
        nextUrl.searchParams.set('section', teacherSection);
      } else if (item.targetUrl.startsWith('/tasks') || item.targetUrl.startsWith('/results')) {
        nextUrl.searchParams.set('role', 'student');
      }
      window.history.replaceState(null, '', nextUrl);
      window.dispatchEvent(new PopStateEvent('popstate'));
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <>
      <div className="notification-backdrop" onClick={onClose} />
      <div className="notification-panel">
        <div className="notification-header">
          <div>
            <Bell size={18} />
            <strong>通知中心</strong>
            {unreadCount > 0 && <span className="notification-badge">{unreadCount}</span>}
          </div>
          {unreadCount > 0 && (
            <Button type="link" size="small" onClick={handleMarkAllRead}>
              <CheckCheck size={14} /> 全部已读
            </Button>
          )}
        </div>

        <div className="notification-list">
          {loading ? (
            <div className="notification-empty"><Spin tip="正在加载通知..." /></div>
          ) : error ? (
            <div className="notification-empty">
              <Typography.Text>{error}</Typography.Text>
              <Button
                type="link"
                size="small"
                aria-busy={loading}
                disabled={loading}
                onClick={() => void loadNotifications()}
              >
                {loading ? '重试中...' : '重试'}
              </Button>
            </div>
          ) : notifications.length === 0 ? (
            <div className="notification-empty"><Empty description="暂无通知" /></div>
          ) : (
            <div className="notification-stack">
              {notifications.map((item) => (
                <button
                  type="button"
                  key={item.id}
                  className={`notification-item ${item.isRead ? 'read' : 'unread'}`}
                  onClick={() => handleOpenNotification(item)}
                >
                  <div className="notification-item-main">
                    <span className="notification-icon">{typeIconMap[item.type] || '📌'}</span>
                    <div className="notification-item-copy">
                      <SpaceTitle title={item.title} unread={!item.isRead} />
                      <div className="notification-copy">
                        <Typography.Paragraph className="notification-message">{item.message}</Typography.Paragraph>
                        <Typography.Text className="notification-time" type="secondary">
                          {formatDate(item.createdAt)}
                        </Typography.Text>
                      </div>
                    </div>
                  </div>
                  {item.targetUrl ? (
                    <span className="notification-link" title="查看详情">
                      <ExternalLink size={14} />
                    </span>
                  ) : null}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
}

function mapNotificationTargetToTeacherSection(targetUrl: string): string | null {
  if (targetUrl.startsWith('/review') || targetUrl.startsWith('/appeals')) {
    return 'review';
  }
  if (targetUrl.startsWith('/collection')) {
    return 'collection';
  }
  if (targetUrl.startsWith('/ai') || targetUrl.startsWith('/grading') || targetUrl.startsWith('/ocr')) {
    return 'ai-pipeline';
  }
  if (targetUrl.startsWith('/assignments')) {
    return 'assignments';
  }
  return null;
}

function SpaceTitle({ title, unread }: { title: string; unread: boolean }) {
  const content = <span className="notification-title-text">{title}</span>;
  return unread ? <Badge dot>{content}</Badge> : content;
}
