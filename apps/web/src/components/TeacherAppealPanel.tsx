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
            <p className="eyebrow">成绩申诉</p>
            <h3>学生申诉处理</h3>
          </div>
          <span className="status-pill">{appeals.filter((item) => item.status === 'SUBMITTED').length} 条待处理</span>
        </div>
        <div className="appeal-list">
          {appeals.map((appeal) => (
            <div className="appeal-card" key={appeal.id}>
              <div className="appeal-heading">
                <div>
                  <strong>{appeal.studentName}</strong>
                  <span>结果 #{appeal.resultId} · 评分项 {appeal.rubricItemId ?? '总评'}</span>
                </div>
                <b>{appealStatusText[appeal.status]}</b>
              </div>
              <p>{toChineseText(appeal.reason)}</p>
              <div className="appeal-request">{toChineseText(appeal.requestedChange)}</div>
              {appeal.teacherReply && <div className="appeal-reply">{toChineseText(appeal.teacherReply)}</div>}
              {appeal.status === 'SUBMITTED' && (
                <div className="publication-buttons">
                  <button className="primary-button" type="button" onClick={() => onResolveAppeal(appeal.id, true)}>采纳申诉</button>
                  <button className="ghost-button" type="button" onClick={() => onResolveAppeal(appeal.id, false)}>驳回申诉</button>
                </div>
              )}
            </div>
          ))}
        </div>
      </article>
    </section>
  );
}
