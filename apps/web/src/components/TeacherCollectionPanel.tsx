import type { CSSProperties } from 'react';
import { Bell, CheckCircle2, Download } from 'lucide-react';
import { resolveApiAssetUrl, shouldUseHttpApi } from '../api/httpApi';
import type { CollectionOverview, ReminderResult, SubmissionSummary, UnsubmittedStudent } from '../api/types';

const submissionStatusText: Record<SubmissionSummary['status'], string> = {
  NOT_SUBMITTED: '未提交',
  SUBMITTED: '已提交',
  LATE_SUBMITTED: '迟交',
  PROCESSING: '批改中',
  GRADED: '已批改',
  REVIEWING: '复核中',
  REVIEWED: '已复核',
  PUBLISHED: '已发布',
  RETURNED: '已退回',
  FAILED: '异常',
};

type TeacherCollectionPanelProps = {
  collectionOverview: CollectionOverview;
  submissions: SubmissionSummary[];
  selectedAssignmentId: number;
  unsubmittedStudents: UnsubmittedStudent[];
  reminderResult: ReminderResult | null;
  onRemindUnsubmitted: () => void;
};

export function TeacherCollectionPanel({
  collectionOverview,
  submissions,
  selectedAssignmentId,
  unsubmittedStudents,
  reminderResult,
  onRemindUnsubmitted,
}: TeacherCollectionPanelProps) {
  const submittedRate = collectionOverview.totalStudents === 0
    ? 0
    : Math.round((collectionOverview.submitted / collectionOverview.totalStudents) * 100);
  const submittedReports = submissions
    .filter((submission) => submission.assignmentId === selectedAssignmentId)
    .slice(0, 6);

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
            <p className="eyebrow">Submitted Reports</p>
            <h3>已交报告</h3>
          </div>
          <span className="status-pill">{submittedReports.length} 份可查看</span>
        </div>
        {submittedReports.length === 0 ? (
          <div className="empty-result compact">
            <strong>暂无已交报告</strong>
            <span>学生提交后，报告文件会出现在这里。</span>
          </div>
        ) : (
          <div className="submitted-report-list">
            {submittedReports.map((submission) => (
              <div className="submitted-report-row" key={submission.id}>
                <div>
                  <strong>{submission.fileName}</strong>
                  <span>{submission.studentName} · {submission.studentNo} · V{submission.version}</span>
                </div>
                <div className="submitted-report-actions">
                  <small>{submissionStatusText[submission.status]}</small>
                  {shouldUseHttpApi() && (
                    <a href={resolveApiAssetUrl(`/api/submissions/${submission.id}/file`)} rel="noreferrer" target="_blank">
                      <Download size={14} /> 原文件
                    </a>
                  )}
                </div>
              </div>
            ))}
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
