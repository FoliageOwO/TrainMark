import type { CSSProperties } from 'react';
import { Bell, CheckCircle2, Download } from 'lucide-react';
import { fetchApiAssetBlobUrl, shouldUseHttpApi } from '../api/httpApi';
import type { CollectionOverview, ReminderResult, SubmissionSummary, UnsubmittedStudent } from '../api/types';
import { toChineseFileName } from '../utils/displayText';

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
  selectedAssignmentTitle: string;
  selectedAssignmentId: number;
  unsubmittedStudents: UnsubmittedStudent[];
  reminderResult: ReminderResult | null;
  onRemindUnsubmitted: () => void;
};

export function TeacherCollectionPanel({
  collectionOverview,
  submissions,
  selectedAssignmentTitle,
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
  const openSubmissionFile = async (submission: SubmissionSummary) => {
    const url = await fetchApiAssetBlobUrl(`/api/submissions/${submission.id}/file`);
    const link = document.createElement('a');
    link.href = url;
    link.download = toChineseFileName(submission.fileName) || '实训报告';
    document.body.appendChild(link);
    link.click();
    link.remove();
    if (url.startsWith('blob:')) {
      window.setTimeout(() => URL.revokeObjectURL(url), 1000);
    }
  };

  return (
    <section className="collection-layout">
      <article className="panel collection-panel collection-board-panel">
        <div className="panel-heading">
          <div>
            <h3>报告收集看板</h3>
            <span className="panel-subtitle">{selectedAssignmentTitle}</span>
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
            <h3>已交报告</h3>
            <span className="panel-subtitle">{selectedAssignmentTitle}</span>
          </div>
          <span className="status-pill">{submittedReports.length} 份可查看</span>
        </div>
        {submittedReports.length === 0 ? (
          <div className="empty-result compact">
            <strong>暂无已交报告</strong>
            <span>学生提交后，报告文件会出现在这里。</span>
          </div>
        ) : (
          <div className="table-shell">
            <div className="table-scroll table-scroll-md">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>学生</th>
                    <th>文件</th>
                    <th>提交次数</th>
                    <th>状态</th>
                    <th className="actions-col">操作</th>
                  </tr>
                </thead>
                <tbody>
                  {submittedReports.map((submission) => (
                    <tr key={submission.id}>
                      <td>
                        <div className="table-primary">
                          <strong>{submission.studentName}</strong>
                          <span>{submission.studentNo}</span>
                        </div>
                      </td>
                      <td>{toChineseFileName(submission.fileName)}</td>
                      <td>
                        <div className="table-primary">
                          <strong>第 {submission.version} 次</strong>
                          <span>{submission.version > 1 ? '已覆盖上一份报告' : '首次提交'}</span>
                        </div>
                      </td>
                      <td>{submissionStatusText[submission.status]}</td>
                      <td>
                        {shouldUseHttpApi() && (
                          <button className="link-button" type="button" onClick={() => openSubmissionFile(submission)}>
                            <Download size={14} /> 原文件
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </article>

      <article className="panel collection-panel">
        <div className="panel-heading">
          <div>
            <h3>未交名单</h3>
            <span className="panel-subtitle">{selectedAssignmentTitle}</span>
          </div>
          <span className="status-pill">{unsubmittedStudents.length} 人待提醒</span>
        </div>
        <div className="table-shell">
          <div className="table-scroll table-scroll-md">
            <table className="data-table">
              <thead>
                <tr>
                  <th>学生</th>
                  <th>班级</th>
                  <th>学号</th>
                  <th>邮箱</th>
                </tr>
              </thead>
              <tbody>
                {unsubmittedStudents.map((student) => (
                  <tr key={student.studentId}>
                    <td>{student.name}</td>
                    <td>{student.className}</td>
                    <td>{student.studentNo}</td>
                    <td>{student.email}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </article>
    </section>
  );
}
