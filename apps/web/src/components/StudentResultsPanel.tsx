import { useEffect, useState, type RefObject } from 'react';
import { Alert, Button, Card, Empty, Modal, Space, Tag, Typography } from 'antd';
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
  const pendingAppeals = appeals.filter((item) => item.status === 'SUBMITTED').length;
  const currentBlocker = publishedResults.length === 0
    ? '当前阻塞：暂无已发布成绩'
    : pendingAppeals > 0
      ? `当前阻塞：有 ${pendingAppeals} 条申诉待教师处理`
      : '当前阻塞：无';
  const nextAction = publishedResults.length === 0
    ? '下一步：完成提交后等待教师发布。'
    : pendingAppeals > 0
      ? '下一步：等待教师处理申诉，可先查看批注细节。'
      : '下一步：如对评分有异议，可提交申诉。';
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
      <Card
        className="wide-panel"
        ref={resultsRef}
        title="成绩与批注"
        extra={<Space><FileCheck2 size={18} /><Typography.Text type="secondary">已发布成绩</Typography.Text></Space>}
      >
        <Alert type={publishedResults.length === 0 ? 'info' : pendingAppeals > 0 ? 'warning' : 'success'} showIcon message={currentBlocker} description={nextAction} style={{ marginBottom: 16 }} />
        {publishedResults.length === 0 ? (
          <Empty description="暂无已发布成绩，教师发布后会在这里显示总分、分项扣分和批注入口。" />
        ) : (
          <div className="published-result-list">
            {publishedResults.map((result) => (
              <Card key={result.id} style={{ marginBottom: 16 }}>
                <Space direction="vertical" size={16} style={{ width: '100%' }}>
                  <Space size={24} wrap>
                    <div>
                      <Typography.Text type="secondary">最终成绩</Typography.Text>
                      <Typography.Title level={2} style={{ margin: '6px 0 0' }}>{result.teacherScore}</Typography.Title>
                      <Typography.Text type="secondary">{result.studentName} · {result.studentNo}</Typography.Text>
                    </div>
                    <div>
                      <Typography.Text strong>{toChineseFileName(result.fileName)}</Typography.Text>
                      <Typography.Paragraph style={{ marginTop: 8, marginBottom: 0 }}>{toChineseText(result.overallComment)}</Typography.Paragraph>
                    </div>
                  </Space>
                  <div className="review-item-list compact">
                    {result.items.map((item) => (
                      <div className="student-score-row" key={item.rubricItemId}>
                        <span>{toChineseText(item.title)}</span>
                        <Tag color="processing">{item.teacherScore}/{item.maxScore}</Tag>
                        <small>{toChineseText(item.deductionReason)}</small>
                      </div>
                    ))}
                  </div>
                  <Space wrap>
                    <Button onClick={() => openAnnotationPreview(result)}>
                      <FileText size={14} /> 查看批注
                    </Button>
                    <Button type="primary" onClick={() => downloadAnnotation(result)} disabled={!result.annotationPdfUrl}>
                      下载批注 PDF
                    </Button>
                    <Button onClick={() => onSubmitAppeal(result.id, null)}>提交申诉</Button>
                  </Space>
                </Space>
              </Card>
            ))}
          </div>
        )}
        <div className="appeal-status-list">
          <Typography.Text strong>我的申诉</Typography.Text>
          {appeals.length === 0 ? (
            <Typography.Text type="secondary">暂无申诉记录</Typography.Text>
          ) : (
            appeals.map((appeal) => (
              <div className="student-appeal-row" key={appeal.id}>
                <span><Tag color={appeal.status === 'ACCEPTED' ? 'success' : appeal.status === 'REJECTED' ? 'error' : 'warning'}>{appealStatusText[appeal.status]}</Tag> 结果 #{appeal.resultId}</span>
                <small>{toChineseText(appeal.requestedChange)}</small>
                {appeal.teacherReply && <small>{toChineseText(appeal.teacherReply)}</small>}
              </div>
            ))
          )}
        </div>
      </Card>

      {viewingResult && (
        <Modal
          open
          title={toChineseFileName(viewingResult.fileName)}
          onCancel={() => setViewingResult(null)}
          footer={null}
          width={1080}
        >
          <div className="pdf-viewer-modal-header">
            <Typography.Text type="secondary">批注预览</Typography.Text>
            <Space>
              <Button type="text" onClick={() => setPdfZoom((value) => Math.max(50, value - 10))} aria-label="缩小">
                <ZoomOut size={16} />
              </Button>
              <span className="pdf-zoom-label" aria-live="polite">{pdfZoom}%</span>
              <Button type="text" onClick={() => setPdfZoom((value) => Math.min(200, value + 10))} aria-label="放大">
                <ZoomIn size={16} />
              </Button>
              <Button type="text" onClick={() => setViewingResult(null)} aria-label="关闭">
                <X size={18} />
              </Button>
            </Space>
          </div>
          <div className="pdf-viewer-modal-content">
            <div className="pdf-viewer-modal-body" style={{ transform: `scale(${pdfZoom / 100})`, transformOrigin: 'top center' }}>
              {annotationPreviewUrl ? (
                <iframe
                  className="pdf-iframe"
                  src={annotationPreviewUrl}
                  title={`批注 PDF - ${viewingResult.studentName}`}
                />
              ) : viewingResult.annotationPdfUrl ? (
                <div className="pdf-page annotated-preview-page">
                  <div className="pdf-annotation-header">
                    <h4>{toChineseFileName(viewingResult.fileName)}</h4>
                    <div className="pdf-annotation-score">{annotationPreviewError ?? '正在加载批注 PDF'}</div>
                  </div>
                </div>
              ) : (
                <div className="pdf-page annotated-preview-page">
                  <div className="pdf-annotation-header">
                    <h4>{toChineseFileName(viewingResult.fileName)}</h4>
                    <div className="pdf-annotation-score">暂无批注 PDF</div>
                  </div>
                  <div className="pdf-annotation-body">
                    <p className="pdf-annotation-text">
                      当前成绩尚未生成可预览的批注文件，请联系教师确认是否已完成发布。
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </Modal>
      )}
    </>
  );
}
