import { ShieldCheck } from 'lucide-react';
import type { AuditLogSummary, OrganizationSummary, SystemSettingSummary, UserSummary } from '../api/types';
import { formatDate } from '../utils/formatDate';

type AdminDashboardProps = {
  organizations: OrganizationSummary[];
  students: UserSummary[];
  auditLogs: AuditLogSummary[];
  systemSettings: SystemSettingSummary[];
};

export function AdminDashboard({ organizations, students, auditLogs, systemSettings }: AdminDashboardProps) {
  const activeStudents = students.filter((student) => student.status === 'ACTIVE').length;
  const resourceTypes = Array.from(new Set(auditLogs.map((item) => item.resourceType)));
  const aiSettings = systemSettings.filter((item) => item.category === 'AI');

  return (
    <>
      <section className="stats-grid">
        <article className="stat-card blue">
          <span>组织节点</span>
          <strong>{organizations.length}</strong>
          <small>学院 / 专业 / 班级</small>
        </article>
        <article className="stat-card teal">
          <span>学生账号</span>
          <strong>{students.length}</strong>
          <small>{activeStudents} 个已激活</small>
        </article>
        <article className="stat-card violet">
          <span>审计事件</span>
          <strong>{auditLogs.length}</strong>
          <small>{resourceTypes.length} 类资源</small>
        </article>
        <article className="stat-card orange">
          <span>高风险操作</span>
          <strong>{auditLogs.filter((item) => item.action.includes('EXPORT') || item.action.includes('PUBLISH')).length}</strong>
          <small>发布 / 导出重点留痕</small>
        </article>
      </section>

      <section className="management-grid">
        <article className="panel roster-panel">
          <div className="panel-heading">
            <div>
              <p className="eyebrow">Directory</p>
              <h3>组织与账号状态</h3>
            </div>
            <ShieldCheck size={22} />
          </div>
          <div className="org-chain">
            {organizations.map((item) => (
              <span key={item.id}>{item.name}</span>
            ))}
          </div>
          <div className="student-list">
            {students.map((student) => (
              <div className="student-row" key={student.id}>
                <div>
                  <strong>{student.name}</strong>
                  <span>{student.studentNo ?? student.teacherNo ?? student.username} · {student.email}</span>
                </div>
                <span className="status-pill">{student.status === 'ACTIVE' ? '已激活' : '待处理'}</span>
              </div>
            ))}
          </div>
        </article>

        <article className="panel audit-panel">
          <div className="panel-heading">
            <div>
              <p className="eyebrow">Audit Logs</p>
              <h3>关键操作审计</h3>
            </div>
            <span className="status-pill">最近 {auditLogs.length} 条</span>
          </div>
          <div className="audit-list">
            {auditLogs.map((log) => (
              <div className="audit-row" key={log.id}>
                <span>{log.action} · {log.actorName}</span>
                <small>{log.resourceType} #{log.resourceId} · {log.detail} · {formatDate(log.createdAt)}</small>
              </div>
            ))}
          </div>
        </article>
      </section>

      <section className="management-grid">
        <article className="panel roster-panel">
          <div className="panel-heading">
            <div>
              <p className="eyebrow">System Settings</p>
              <h3>系统与模型配置</h3>
            </div>
            <span className="status-pill">{aiSettings.length} 项 AI 配置</span>
          </div>
          <div className="student-list">
            {systemSettings.map((setting) => (
              <div className="student-row" key={setting.key}>
                <div>
                  <strong>{setting.name}</strong>
                  <span>{setting.key} · {setting.category}</span>
                </div>
                <span className="status-pill">{setting.sensitive ? '敏感配置' : setting.value}</span>
              </div>
            ))}
          </div>
        </article>
      </section>
    </>
  );
}
