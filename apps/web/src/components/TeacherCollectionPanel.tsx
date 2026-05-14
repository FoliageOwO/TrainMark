import type { CSSProperties } from 'react';
import { Bell, CheckCircle2 } from 'lucide-react';
import type { CollectionOverview, ReminderResult, UnsubmittedStudent } from '../api/types';

type TeacherCollectionPanelProps = {
  collectionOverview: CollectionOverview;
  unsubmittedStudents: UnsubmittedStudent[];
  reminderResult: ReminderResult | null;
  onRemindUnsubmitted: () => void;
};

export function TeacherCollectionPanel({
  collectionOverview,
  unsubmittedStudents,
  reminderResult,
  onRemindUnsubmitted,
}: TeacherCollectionPanelProps) {
  const submittedRate = Math.round((collectionOverview.submitted / collectionOverview.totalStudents) * 100);

  return (
    <section className="management-grid">
      <article className="panel collection-panel">
        <div className="panel-heading">
          <div>
            <p className="eyebrow">Submission Collection</p>
            <h3>报告收集看板</h3>
          </div>
          <button className="ghost-button" type="button" onClick={onRemindUnsubmitted}>
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
  );
}
