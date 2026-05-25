import { useCallback, useEffect, useState } from 'react';
import { Bell, CheckCheck, ExternalLink } from 'lucide-react';
import { formatDate } from '../utils/formatDate';
import { listNotifications, markNotificationAsRead, markAllNotificationsAsRead } from '../api/httpApi';
import { mockApi } from '../api/mockApi';
import { shouldUseHttpApi } from '../api/httpApi';
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

  const loadNotifications = useCallback(async () => {
    let items: NotificationItem[];
    if (shouldUseHttpApi()) {
      items = await listNotifications(userId);
    } else {
      items = mockApi.listNotifications(userId);
    }
    setNotifications(items);
    const nextUnreadCount = items.filter((n) => !n.isRead).length;
    setUnreadCount(nextUnreadCount);
    onUnreadCountChange?.(nextUnreadCount);
  }, [onUnreadCountChange, userId]);

  useEffect(() => {
    if (!isOpen) return;
    loadNotifications();
  }, [isOpen, loadNotifications]);

  const handleMarkRead = async (id: number) => {
    const item = notifications.find((n) => n.id === id);
    if (!item || item.isRead) {
      return;
    }
    if (shouldUseHttpApi()) {
      await markNotificationAsRead(id, userId);
    } else {
      mockApi.markNotificationAsRead(id);
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
    if (shouldUseHttpApi()) {
      await markAllNotificationsAsRead(userId);
    } else {
      mockApi.markAllNotificationsAsRead();
    }
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    setUnreadCount(0);
    onUnreadCountChange?.(0);
  };

  const handleOpenNotification = async (item: NotificationItem) => {
    await handleMarkRead(item.id);
    if (item.targetUrl) {
      const nextUrl = new URL(window.location.href);
      if (item.targetUrl.startsWith('/review')) {
        nextUrl.searchParams.set('section', 'review');
      } else if (item.targetUrl.startsWith('/appeals')) {
        nextUrl.searchParams.set('section', 'appeals');
      } else if (item.targetUrl.startsWith('/collection')) {
        nextUrl.searchParams.set('section', 'collection');
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
            <button className="ghost-button compact-link" type="button" onClick={handleMarkAllRead}>
              <CheckCheck size={14} /> 全部已读
            </button>
          )}
        </div>

        <div className="notification-list">
          {notifications.length === 0 ? (
            <div className="notification-empty">
              <p>暂无通知</p>
            </div>
          ) : (
            notifications.map((item) => (
              <div
                className={`notification-item ${item.isRead ? 'read' : 'unread'}`}
                key={item.id}
                onClick={() => handleOpenNotification(item)}
              >
                <span className="notification-icon">
                  {typeIconMap[item.type] || '📌'}
                </span>
                <div className="notification-content">
                  <strong>{item.title}</strong>
                  <p>{item.message}</p>
                  <small>{formatDate(item.createdAt)}</small>
                </div>
                {item.targetUrl && (
                  <span className="notification-link" title="查看详情">
                    <ExternalLink size={14} />
                  </span>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </>
  );
}
