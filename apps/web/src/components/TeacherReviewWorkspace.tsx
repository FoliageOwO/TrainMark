import { useEffect, useState, type FormEvent } from 'react';
import { CheckCircle2, FileText } from 'lucide-react';
import { fetchApiAssetBlobUrl } from '../api/httpApi';
import type { GradePublicationAuditEntry, GradingResultSummary } from '../api/types';
import { toChineseFileName, toChineseText } from '../utils/displayText';
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
  const [annotationPreviewUrl, setAnnotationPreviewUrl] = useState<string | null>(null);
  const [annotationPreviewError, setAnnotationPreviewError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    let blobUrl: string | null = null;
    setAnnotationPreviewUrl(null);
    setAnnotationPreviewError(null);

    if (!selectedReview.annotationPdfUrl) {
      return undefined;
    }

    fetchApiAssetBlobUrl(selectedReview.annotationPdfUrl)
      .then((url) => {
        if (cancelled) {
          if (url.startsWith('blob:')) {
            URL.revokeObjectURL(url);
          }
          return;
        }
        blobUrl = url.startsWith('blob:') ? url : null;
        setAnnotationPreviewUrl(url);
      })
      .catch(() => {
        if (!cancelled) {
          setAnnotationPreviewError('批注文件加载失败，请确认后端服务已启动且当前账号有查看权限。');
        }
      });

    return () => {
      cancelled = true;
      if (blobUrl) {
        URL.revokeObjectURL(blobUrl);
      }
    };
  }, [selectedReview.annotationPdfUrl]);

  return (
    <section className="review-layout">
      <article className="panel review-list-panel">
        <div className="panel-heading">
          <div>
            <h3>待复核报告</h3>
          </div>
          <span className="status-pill">{reviewResults.length} 份</span>
        </div>
        <div className="table-shell">
          <div className="table-scroll table-scroll-lg">
            <table className="data-table review-table">
              <thead>
                <tr>
                  <th>学生</th>
                  <th>分数</th>
                  <th>状态</th>
                </tr>
              </thead>
              <tbody>
                {reviewResults.map((result) => (
                  <tr
                    className={selectedReview.id === result.id ? 'is-selected is-clickable' : 'is-clickable'}
                    key={result.id}
                    onClick={() => onSelectReview(result.id)}
                  >
                    <td>
                      <div className="table-primary">
                        <strong>{result.studentName}</strong>
                        <span>{result.studentNo}</span>
                      </div>
                    </td>
                    <td>{result.teacherScore}/{result.totalScore}</td>
                    <td>{reviewStatusText[result.reviewStatus]}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </article>

      <article className="panel review-preview-panel">
        <div className="panel-heading">
          <div>
            <h3>{selectedReview.studentName}</h3>
            <p className="panel-subtitle">{selectedReview.studentNo} · {toChineseFileName(selectedReview.fileName) || '未命名报告'}</p>
          </div>
          <span className="status-pill">{reviewStatusText[selectedReview.reviewStatus]}</span>
        </div>
        <div className="pdf-preview">
          <div className="pdf-toolbar">
            <span>批注预览</span>
            <div className="pdf-toolbar-actions">
              {annotationPreviewUrl ? (
                <a className="ghost-button compact-link" href={annotationPreviewUrl} rel="noreferrer" target="_blank">
                  <FileText size={14} /> 打开批注
                </a>
              ) : null}
            </div>
          </div>
          <div className="pdf-viewer">
            {annotationPreviewUrl ? (
              <iframe
                className="pdf-iframe"
                src={annotationPreviewUrl}
                title={`批注 PDF - ${selectedReview.studentName}`}
              />
            ) : selectedReview.annotationPdfUrl ? (
              <div className="pdf-fallback">
                <FileText size={48} />
                <p>{annotationPreviewError ?? '正在加载批注 PDF'}</p>
                <span>系统正在带登录状态读取批注文件，请稍候。</span>
              </div>
            ) : (
              <div className="pdf-fallback">
                <FileText size={48} />
                <p>PDF 预览需要后端服务提供文件</p>
                <span>部署后端并上传文件后，此处将直接显示批注 PDF</span>
              </div>
            )}
          </div>
        </div>
        <div className="annotation-list panel-scroll panel-scroll-md">
          {selectedReview.annotations.map((annotation) => (
            <div className={`annotation-row ${annotation.severity}`} key={annotation.id}>
              <strong>第 {annotation.page} 页 · {toChineseText(annotation.anchorText)}</strong>
              <span>{toChineseText(annotation.comment)}</span>
            </div>
          ))}
        </div>
      </article>

      <article className="panel review-score-panel">
        <div className="panel-heading">
          <div>
            <h3>复核结果</h3>
            <p className="panel-subtitle">{selectedReview.studentName} · {selectedReview.teacherScore}/{selectedReview.totalScore} 分</p>
          </div>
        </div>
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
          <p>{toChineseText(selectedReview.overallComment)}</p>
        </div>
        <div className="review-item-list panel-scroll panel-scroll-xl">
          {selectedReview.items.map((item) => (
            <form className="review-item-card" key={item.rubricItemId} onSubmit={(event) => onReviewItemSubmit(event, item.rubricItemId)}>
              <div className="review-item-heading">
                <div>
                  <strong>{toChineseText(item.title)}</strong>
                  <span>AI {item.aiScore}/{item.maxScore} · 置信度 {item.confidence}%</span>
                </div>
                <label>
                  教师分
                  <input name="teacherScore" type="number" min="0" max={item.maxScore} defaultValue={item.teacherScore} />
                </label>
              </div>
              <div className="deduction-box">
                <span>扣分原因</span>
                <p>{toChineseText(item.deductionReason)}</p>
              </div>
              <div className="evidence-tags">
                {item.evidence.map((evidence) => <span key={evidence}>{toChineseText(evidence)}</span>)}
              </div>
              <label className="comment-field">
                教师评语
                <textarea name="teacherComment" rows={2} defaultValue={toChineseText(item.teacherComment)} />
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
                <span>{audit.action === 'PUBLISH' ? '发布' : '撤回'} · {toChineseText(audit.operatorName)}</span>
                <small>{toChineseText(audit.reason)} · {formatDate(audit.createdAt)}</small>
              </div>
            ))
          )}
        </div>
      </article>
    </section>
  );
}
