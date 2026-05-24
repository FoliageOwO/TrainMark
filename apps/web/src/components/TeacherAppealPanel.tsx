import type { AppealSummary } from '../api/types';
import { toChineseText } from '../utils/displayText';

const appealStatusText = {
  SUBMITTED: '待处理',
  ACCEPTED: '已采纳',
  REJECTED: '已驳回',
};

type TeacherAppealPanelProps = {
  appeals: AppealSummary[];
  onResolveAppeal: (appealId: number, accepted: boolean) => void;
};

export function TeacherAppealPanel({ appeals, onResolveAppeal }: TeacherAppealPanelProps) {
  return (
    <section className="management-grid">
      <article className="panel appeal-panel">
        <div className="panel-heading">
          <div>
            <h3>学生申诉处理</h3>
          </div>
          <span className="status-pill">{appeals.filter((item) => item.status === 'SUBMITTED').length} 条待处理</span>
        </div>
        <div className="table-shell">
          <div className="table-scroll table-scroll-lg">
            <table className="data-table">
              <thead>
                <tr>
                  <th>学生</th>
                  <th>结果</th>
                  <th>申诉理由</th>
                  <th>期望处理</th>
                  <th>状态</th>
                  <th className="actions-col">操作</th>
                </tr>
              </thead>
              <tbody>
                {appeals.map((appeal) => (
                  <tr key={appeal.id}>
                    <td>{appeal.studentName}</td>
                    <td>结果 #{appeal.resultId} / 评分项 {appeal.rubricItemId ?? '总评'}</td>
                    <td>{toChineseText(appeal.reason)}</td>
                    <td>{toChineseText(appeal.requestedChange)}</td>
                    <td>{appealStatusText[appeal.status]}</td>
                    <td>
                      {appeal.status === 'SUBMITTED' ? (
                        <div className="table-actions">
                          <button className="primary-button compact" type="button" onClick={() => onResolveAppeal(appeal.id, true)}>采纳</button>
                          <button className="ghost-button compact" type="button" onClick={() => onResolveAppeal(appeal.id, false)}>驳回</button>
                        </div>
                      ) : (
                        <span>{appeal.teacherReply ? toChineseText(appeal.teacherReply) : '-'}</span>
                      )}
                    </td>
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
