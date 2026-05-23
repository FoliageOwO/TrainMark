import { useEffect, useState, type RefObject } from 'react';
import { FileCheck2, FileText, X, ZoomIn, ZoomOut } from 'lucide-react';
import { fetchApiAssetBlobUrl } from '../api/httpApi';
import type { AppealSummary, GradingResultSummary } from '../api/types';
import { toChineseFileName, toChineseText } from '../utils/displayText';

const appealStatusText = {
  SUBMITTED: '待处理',
  ACCEPTED: '已采纳',
  REJECTED: '已驳回',
};

type StudentResultsPanelProps = {
  appeals: AppealSummary[];
  publishedResults: GradingResultSummary[];
  resultsRef: RefObject<HTMLDivElement>;
  onSubmitAppeal: (resultId: number, rubricItemId: number | null) => void | Promise<void>;
};

export function StudentResultsPanel({
  appeals,
  publishedResults,
  resultsRef,
  onSubmitAppeal,
}: StudentResultsPanelProps) {
  const [viewingResult, setViewingResult] = useState<GradingResultSummary | null>(null);
  const [pdfZoom, setPdfZoom] = useState(100);
  const [annotationPreviewUrl, setAnnotationPreviewUrl] = useState<string | null>(null);
  const [annotationPreviewError, setAnnotationPreviewError] = useState<string | null>(null);

  useEffect(() => {
    if (!viewingResult) return;
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setViewingResult(null);
      }
    };
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [viewingResult]);

  const openAnnotationPreview = (result: GradingResultSummary) => {
    setViewingResult(result);
    setPdfZoom(100);
  };

  const downloadAnnotation = async (result: GradingResultSummary) => {
    if (!result.annotationPdfUrl) {
      return;
    }
    const url = await fetchApiAssetBlobUrl(result.annotationPdfUrl);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${toChineseFileName(result.fileName).replace(/\.[^.]+$/, '') || '批注'}-批注.pdf`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    if (url.startsWith('blob:')) {
      window.setTimeout(() => URL.revokeObjectURL(url), 1000);
    }
  };

  useEffect(() => {
    let cancelled = false;
    let blobUrl: string | null = null;
    setAnnotationPreviewUrl(null);
    setAnnotationPreviewError(null);

    if (!viewingResult?.annotationPdfUrl) {
      return undefined;
    }

    fetchApiAssetBlobUrl(viewingResult.annotationPdfUrl)
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
          setAnnotationPreviewError('批注文件加载失败，请确认教师已发布批注且当前账号有查看权限。');
        }
      });

    return () => {
      cancelled = true;
      if (blobUrl) {
        URL.revokeObjectURL(blobUrl);
      }
    };
  }, [viewingResult]);

  return (
    <>
      <article className="panel wide-panel" ref={resultsRef}>
        <div className="panel-heading">
          <div>
            <p className="eyebrow">已发布成绩</p>
            <h3>成绩与批注</h3>
          </div>
          <FileCheck2 size={22} />
        </div>
        {publishedResults.length === 0 ? (
          <div className="empty-result">
            <strong>暂无已发布成绩</strong>
            <span>教师发布后会在这里显示总分、分项扣分和批注入口。</span>
          </div>
        ) : (
          <div className="published-result-list">
            {publishedResults.map((result) => (
              <div className="published-result-card" key={result.id}>
                <div className="published-score">
                  <span>最终成绩</span>
                  <strong>{result.teacherScore}</strong>
                  <small>{result.studentName} · {result.studentNo}</small>
                </div>
                <div className="published-detail">
                  <strong>{toChineseFileName(result.fileName)}</strong>
                  <p>{toChineseText(result.overallComment)}</p>
                  <div className="review-item-list compact">
                    {result.items.map((item) => (
                      <div className="student-score-row" key={item.rubricItemId}>
                        <span>{toChineseText(item.title)}</span>
                        <b>{item.teacherScore}/{item.maxScore}</b>
                        <small>{toChineseText(item.deductionReason)}</small>
                      </div>
                    ))}
                  </div>
                  <div className="student-result-actions">
                    <button className="ghost-button" type="button" onClick={() => openAnnotationPreview(result)}>
                      <FileText size={14} /> 查看批注
                    </button>
                    <button className="primary-button" type="button" onClick={() => downloadAnnotation(result)} disabled={!result.annotationPdfUrl}>
                      下载批注 PDF
                    </button>
                    <button className="ghost-button" type="button" onClick={() => onSubmitAppeal(result.id, null)}>提交申诉</button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
        <div className="appeal-status-list">
          <strong>我的申诉</strong>
          {appeals.length === 0 ? (
            <span>暂无申诉记录</span>
          ) : (
            appeals.map((appeal) => (
              <div className="student-appeal-row" key={appeal.id}>
                <span>{appealStatusText[appeal.status]} · 结果 #{appeal.resultId}</span>
                <small>{toChineseText(appeal.requestedChange)}</small>
                {appeal.teacherReply && <small>{toChineseText(appeal.teacherReply)}</small>}
              </div>
            ))
          )}
        </div>
      </article>

      {viewingResult && (
        <div className="pdf-viewer-modal" role="dialog" aria-modal="true" aria-label="批注预览">
          <div className="pdf-viewer-backdrop" onClick={() => setViewingResult(null)} />
          <div className="pdf-viewer-modal-content">
            <div className="pdf-viewer-modal-header">
              <div>
                <strong>{toChineseFileName(viewingResult.fileName)}</strong>
                <span>批注预览</span>
              </div>
              <div className="pdf-viewer-modal-actions">
                <button className="icon-button" type="button" onClick={() => setPdfZoom((value) => Math.max(50, value - 10))} aria-label="缩小">
                  <ZoomOut size={16} />
                </button>
                <span className="pdf-zoom-label" aria-live="polite">{pdfZoom}%</span>
                <button className="icon-button" type="button" onClick={() => setPdfZoom((value) => Math.min(200, value + 10))} aria-label="放大">
                  <ZoomIn size={16} />
                </button>
                <button className="icon-button" type="button" onClick={() => setViewingResult(null)} aria-label="关闭">
                  <X size={18} />
                </button>
              </div>
            </div>
            <div className="pdf-viewer-modal-body" style={{ transform: `scale(${pdfZoom / 100})`, transformOrigin: 'top center' }}>
              {annotationPreviewUrl ? (
                <iframe
                  className="pdf-iframe"
                  src={annotationPreviewUrl}
                  title={`批注 PDF - ${viewingResult.studentName}`}
                />
              ) : viewingResult.annotationPdfUrl ? (
                <div className="pdf-page mock-annotated-page">
                  <div className="pdf-annotation-header">
                    <h4>{toChineseFileName(viewingResult.fileName)}</h4>
                    <div className="pdf-annotation-score">{annotationPreviewError ?? '正在加载批注 PDF'}</div>
                  </div>
                </div>
              ) : (
                <div className="pdf-page mock-annotated-page">
                <div className="pdf-annotation-header">
                  <h4>{toChineseFileName(viewingResult.fileName)}</h4>
                  <div className="pdf-annotation-score">总分 {viewingResult.teacherScore} / 100</div>
                </div>
                <div className="pdf-annotation-body">
                  <p className="pdf-annotation-text">
                    报告结构完整，核心功能说明较清晰；数据库约束和异常处理部分需要补充。建议在系统设计章节增加ER图和表结构说明。
                  </p>
                  <div className="pdf-annotation-highlights">
                    <div className="pdf-highlight-item">
                      <span className="pdf-highlight-label">扣分项</span>
                      <p>需求分析章节缺少非功能需求（性能、安全性、可维护性）说明。</p>
                    </div>
                    <div className="pdf-highlight-item">
                      <span className="pdf-highlight-label">扣分项</span>
                      <p>数据库设计章节未说明索引选择理由和外键约束策略。</p>
                    </div>
                    <div className="pdf-highlight-item">
                      <span className="pdf-highlight-label">扣分项</span>
                      <p>实训反思章节内容偏少，建议补充个人收获和改进方向。</p>
                    </div>
                  </div>
                  <div className="pdf-annotation-footer">
                    <strong>教师总评：</strong>
                    <p>{toChineseText(viewingResult.overallComment)}</p>
                  </div>
                </div>
              </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
