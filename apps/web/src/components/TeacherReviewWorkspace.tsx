import type { FormEvent } from 'react';
import { CheckCircle2, FileText } from 'lucide-react';
import { resolveApiAssetUrl } from '../api/httpApi';
import type { GradePublicationAuditEntry, GradingResultSummary } from '../api/types';
import { formatDate } from '../utils/formatDate';

const reviewStatusText = {
  NEEDS_REVIEW: '待复核',
  IN_REVIEW: '复核中',
  APPROVED: '已通过',
  RETURNED: '已退回',
};

const publicationStatusText = {
  NOT_PUBLISHED: '未发布',
  PUBLISHED: '已发布',
  WITHDRAWN: '已撤回',
};

type TeacherReviewWorkspaceProps = {
  reviewResults: GradingResultSummary[];
  selectedReview: GradingResultSummary;
  publicationAudits: GradePublicationAuditEntry[];
  onSelectReview: (resultId: number) => void;
  onReviewItemSubmit: (event: FormEvent<HTMLFormElement>, rubricItemId: number) => void;
  onApproveResult: () => void;
  onPublishResult: () => void;
  onWithdrawResult: () => void;
};

export function TeacherReviewWorkspace({
  reviewResults,
  selectedReview,
  publicationAudits,
  onSelectReview,
  onReviewItemSubmit,
  onApproveResult,
  onPublishResult,
  onWithdrawResult,
}: TeacherReviewWorkspaceProps) {
  const selectedAudits = publicationAudits.filter((item) => item.resultId === selectedReview.id);

  return (
    <section className="review-layout">
      <article className="panel review-preview-panel">
        <div className="panel-heading">
          <div>
            <p className="eyebrow">Manual Review</p>
            <h3>人工复核工作区</h3>
          </div>
          <span className="status-pill">{reviewStatusText[selectedReview.reviewStatus]}</span>
        </div>
        <div className="review-switcher">
          {reviewResults.map((result) => (
            <button
              className={selectedReview.id === result.id ? 'selected' : ''}
              key={result.id}
              type="button"
              onClick={() => onSelectReview(result.id)}
            >
              <strong>{result.studentName}</strong>
              <span>{result.studentNo} · {result.teacherScore}/{result.totalScore} 分</span>
            </button>
          ))}
        </div>
        <div className="pdf-preview">
          <div className="pdf-toolbar">
            <span>{selectedReview.fileName ?? '未命名报告'}</span>
            <div className="pdf-toolbar-actions">
              {selectedReview.annotationPdfUrl ? (
                <a className="ghost-button compact-link" href={resolveApiAssetUrl(selectedReview.annotationPdfUrl)} rel="noreferrer" target="_blank">
                  <FileText size={14} /> 打开批注
                </a>
              ) : null}
            </div>
          </div>
          <div className="pdf-viewer">
            <iframe
              className="pdf-iframe"
              src={resolveApiAssetUrl(selectedReview.annotationPdfUrl) ?? undefined}
              title={`批注 PDF - ${selectedReview.studentName}`}
              sandbox="allow-scripts allow-same-origin"
            />
          </div>
        </div>
        <div className="annotation-list">
          {selectedReview.annotations.map((annotation) => (
            <div className={`annotation-row ${annotation.severity}`} key={annotation.id}>
              <strong>第 {annotation.page} 页 · {annotation.anchorText}</strong>
              <span>{annotation.comment}</span>
            </div>
          ))}
        </div>
      </article>

      <article className="panel review-score-panel">
        <div className="review-score-summary">
          <div>
            <span>AI 初评</span>
            <strong>{selectedReview.aiScore}</strong>
          </div>
          <div>
            <span>教师复核</span>
            <strong>{selectedReview.teacherScore}</strong>
          </div>
          <div>
            <span>置信度</span>
            <strong>{selectedReview.confidence}%</strong>
          </div>
        </div>
        <div className="publication-actions">
          <div>
            <span>发布状态</span>
            <strong>{publicationStatusText[selectedReview.publicationStatus]}</strong>
            {selectedReview.publishedAt && <small>{formatDate(selectedReview.publishedAt)} 发布</small>}
          </div>
          <div className="publication-buttons">
            <button
              className="primary-button"
              type="button"
              onClick={onPublishResult}
              disabled={selectedReview.reviewStatus !== 'APPROVED'}
            >
              <CheckCircle2 size={16} /> 发布成绩
            </button>
            <button className="ghost-button" type="button" onClick={onWithdrawResult}>
              撤回发布
            </button>
          </div>
        </div>
        <div className="overall-comment">
          <span>总评</span>
          <p>{selectedReview.overallComment}</p>
        </div>
        <div className="review-item-list">
          {selectedReview.items.map((item) => (
            <form className="review-item-card" key={item.rubricItemId} onSubmit={(event) => onReviewItemSubmit(event, item.rubricItemId)}>
              <div className="review-item-heading">
                <div>
                  <strong>{item.title}</strong>
                  <span>AI {item.aiScore}/{item.maxScore} · 置信度 {item.confidence}%</span>
                </div>
                <label>
                  教师分
                  <input name="teacherScore" type="number" min="0" max={item.maxScore} defaultValue={item.teacherScore} />
                </label>
              </div>
              <div className="deduction-box">
                <span>扣分原因</span>
                <p>{item.deductionReason}</p>
              </div>
              <div className="evidence-tags">
                {item.evidence.map((evidence) => <span key={evidence}>{evidence}</span>)}
              </div>
              <label className="comment-field">
                教师评语
                <textarea name="teacherComment" rows={2} defaultValue={item.teacherComment} />
              </label>
              <button className="ghost-button" type="submit">保存分项复核</button>
            </form>
          ))}
        </div>
        <button className="primary-button full-width" type="button" onClick={onApproveResult}>
          <CheckCircle2 size={16} /> 通过复核，等待发布
        </button>
        <div className="audit-list">
          <strong>发布审计</strong>
          {selectedAudits.length === 0 ? (
            <span>暂无发布操作记录</span>
          ) : (
            selectedAudits.map((audit) => (
              <div className="audit-row" key={audit.id}>
                <span>{audit.action === 'PUBLISH' ? '发布' : '撤回'} · {audit.operatorName}</span>
                <small>{audit.reason} · {formatDate(audit.createdAt)}</small>
              </div>
            ))
          )}
        </div>
      </article>
    </section>
  );
}
