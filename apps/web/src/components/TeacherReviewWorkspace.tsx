import { useEffect, useState, type FormEvent } from 'react';
import { Alert, Button, Card, Col, Descriptions, Empty, Form, Input, InputNumber, Row, Select, Space, Statistic, Table, Tag, Typography } from 'antd';
import { CheckCircle2, FileText } from 'lucide-react';
import { fetchApiAssetBlobUrl } from '../api/httpApi';
import type { AppealSummary, AssignmentSummary, GradePublicationAuditEntry, GradingResultSummary, TeachingClassSummary } from '../api/types';
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
  assignments: AssignmentSummary[];
  classes: TeachingClassSummary[];
  appeals: AppealSummary[];
  selectedClassId: number;
  selectedAssignmentId: number;
  reviewResults: GradingResultSummary[];
  selectedReview: GradingResultSummary;
  publicationAudits: GradePublicationAuditEntry[];
  onResolveAppeal: (appealId: number, accepted: boolean) => void;
  onSelectClass: (classId: number) => void;
  onSelectAssignment: (assignmentId: number) => void;
  onSelectReview: (resultId: number) => void;
  onReviewItemSubmit: (event: FormEvent<HTMLFormElement>, rubricItemId: number) => void;
  onApproveResult: () => void;
  onPublishResult: () => void;
  onWithdrawResult: () => void;
};

export function TeacherReviewWorkspace({
  assignments,
  classes,
  appeals,
  selectedClassId,
  selectedAssignmentId,
  reviewResults,
  selectedReview,
  publicationAudits,
  onResolveAppeal,
  onSelectClass,
  onSelectAssignment,
  onSelectReview,
  onReviewItemSubmit,
  onApproveResult,
  onPublishResult,
  onWithdrawResult,
}: TeacherReviewWorkspaceProps) {
  const selectedAudits = publicationAudits.filter((item) => item.resultId === selectedReview.id);
  const selectedAssignment = assignments.find((item) => item.id === selectedAssignmentId);
  const currentResultIds = new Set(reviewResults.map((item) => item.id));
  const assignmentAppeals = appeals.filter((item) => currentResultIds.has(item.resultId));
  const selectedAppeals = appeals.filter((item) => item.resultId === selectedReview.id);
  const selectedPendingAppeals = selectedAppeals.filter((item) => item.status === 'SUBMITTED');
  const selectedResolvedAppeals = selectedAppeals.filter((item) => item.status !== 'SUBMITTED');
  const pendingAppealCount = assignmentAppeals.filter((item) => item.status === 'SUBMITTED').length;
  const currentBlocker = selectedReview.reviewStatus !== 'APPROVED'
    ? '当前阻塞：复核结果未通过'
    : selectedReview.publicationStatus !== 'PUBLISHED'
      ? '当前阻塞：成绩尚未发布'
      : pendingAppealCount > 0
        ? `当前阻塞：仍有 ${pendingAppealCount} 条申诉待处理`
        : '当前阻塞：无';
  const nextAction = selectedReview.reviewStatus !== 'APPROVED'
    ? '下一步：先完成分项复核并点击“通过复核”。'
    : selectedReview.publicationStatus !== 'PUBLISHED'
      ? '下一步：点击“发布成绩”，完成结果发布。'
      : pendingAppealCount > 0
        ? '下一步：处理待办申诉，再确认是否需要撤回重发。'
        : '下一步：进入结果分析，查看失分点与达成度。';
  const [annotationPreviewUrl, setAnnotationPreviewUrl] = useState<string | null>(null);
  const [annotationPreviewError, setAnnotationPreviewError] = useState<string | null>(null);

  const reviewColumns = [
    {
      title: '学生',
      key: 'student',
      render: (_: unknown, result: GradingResultSummary) => (
        <div className="table-primary">
          <strong>{result.studentName}</strong>
          <span>{result.studentNo}</span>
        </div>
      ),
    },
    {
      title: '分数',
      key: 'score',
      render: (_: unknown, result: GradingResultSummary) => `${result.teacherScore}/${result.totalScore}`,
    },
    {
      title: '状态',
      key: 'status',
      render: (_: unknown, result: GradingResultSummary) => (
        <Tag color={result.reviewStatus === 'APPROVED' ? 'success' : result.reviewStatus === 'RETURNED' ? 'error' : 'warning'}>
          {reviewStatusText[result.reviewStatus]}
        </Tag>
      ),
    },
  ];

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
      <Card
        className="review-list-panel"
        title="待复核报告"
        extra={<Tag color="warning">{reviewResults.length} 份 · {pendingAppealCount} 条申诉</Tag>}
      >
        <Space direction="vertical" size={16} style={{ width: '100%' }}>
          <Typography.Text type="secondary">{selectedAssignment?.title ?? '当前实训任务'}</Typography.Text>
          <Select
            value={selectedAssignmentId}
            options={assignments.map((assignment) => ({ value: assignment.id, label: toChineseText(assignment.title) }))}
            onChange={(value) => onSelectAssignment(value)}
          />
          <Select
            value={selectedClassId}
            options={[
              { value: 0, label: '全部班级' },
              ...classes.map((teachingClass) => ({ value: teachingClass.id, label: teachingClass.name })),
            ]}
            onChange={(value) => onSelectClass(value)}
          />
          {reviewResults.length === 0 ? (
            <Empty description="当前实训任务暂无复核结果" />
          ) : (
            <Table<GradingResultSummary>
              rowKey="id"
              columns={reviewColumns}
              dataSource={reviewResults}
              pagination={false}
              onRow={(result) => ({ onClick: () => onSelectReview(result.id), style: { cursor: 'pointer' } })}
              rowClassName={(result) => (selectedReview.id === result.id ? 'is-selected' : '')}
            />
          )}
        </Space>
      </Card>

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
            <span>原报告批注版预览</span>
            <div className="pdf-toolbar-actions">
              {annotationPreviewUrl ? (
                <Button type="link" href={annotationPreviewUrl} rel="noreferrer" target="_blank">
                  <FileText size={14} /> 打开批注 PDF
                </Button>
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
                <p>暂无可预览的批注 PDF</p>
                <span>完成批改并生成批注后，这里会显示带批注的报告。</span>
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

      <Card className="review-score-panel" title="复核结果">
        <Space direction="vertical" size={16} style={{ width: '100%' }}>
          <Typography.Text type="secondary">{selectedReview.studentName} · {selectedReview.teacherScore}/{selectedReview.totalScore} 分</Typography.Text>
          <Alert
            type={selectedReview.reviewStatus !== 'APPROVED' || selectedReview.publicationStatus !== 'PUBLISHED' ? 'warning' : 'success'}
            showIcon
            message={currentBlocker}
            description={nextAction}
            action={selectedReview.reviewStatus !== 'APPROVED' ? (
              <Button type="primary" onClick={onApproveResult}>
                <CheckCircle2 size={16} /> 通过复核（下一步）
              </Button>
            ) : selectedReview.publicationStatus !== 'PUBLISHED' ? (
              <Button type="primary" onClick={onPublishResult}>
                <CheckCircle2 size={16} /> 发布成绩（下一步）
              </Button>
            ) : null}
          />
          <Descriptions bordered size="small" column={1}>
            <Descriptions.Item label="发布状态">
              {publicationStatusText[selectedReview.publicationStatus]} {selectedReview.publishedAt ? `· ${formatDate(selectedReview.publishedAt)} 发布` : ''}
            </Descriptions.Item>
          </Descriptions>
          <Space wrap>
            <Button onClick={onApproveResult}><CheckCircle2 size={16} /> 通过复核</Button>
            <Button type="primary" onClick={onPublishResult} disabled={selectedReview.reviewStatus !== 'APPROVED'}>
              <CheckCircle2 size={16} /> 发布成绩
            </Button>
            <Button onClick={onWithdrawResult}>撤回发布</Button>
          </Space>
          <Row gutter={[16, 16]}>
            <Col xs={24} md={8}><Card><Statistic title="AI 初评" value={selectedReview.aiScore} /></Card></Col>
            <Col xs={24} md={8}><Card><Statistic title="教师复核" value={selectedReview.teacherScore} /></Card></Col>
            <Col xs={24} md={8}><Card><Statistic title="置信度" value={selectedReview.confidence} suffix="%" /></Card></Col>
          </Row>
          <Card size="small">
            <Typography.Text type="secondary">总评</Typography.Text>
            <Typography.Paragraph style={{ marginBottom: 0 }}>{toChineseText(selectedReview.overallComment)}</Typography.Paragraph>
          </Card>
          <Card size="small" title={`申诉处理 · ${selectedPendingAppeals.length} 条待处理`}>
          {selectedAppeals.length === 0 ? (
            <Typography.Text type="secondary">该学生本次结果暂无申诉。</Typography.Text>
          ) : (
            selectedPendingAppeals.map((appeal) => (
              <Card className="review-appeal-card" key={appeal.id} size="small" style={{ marginBottom: 12 }}>
                <div>
                  <b>待处理</b>{' '}
                  <span>{appeal.rubricItemId ? `评分项 ${appeal.rubricItemId}` : '总评'} · {formatDate(appeal.createdAt)}</span>
                </div>
                <p>{toChineseText(appeal.reason)}</p>
                <small>{toChineseText(appeal.requestedChange)}</small>
                {appeal.teacherReply ? <small>{toChineseText(appeal.teacherReply)}</small> : null}
                <Space wrap style={{ marginTop: 8 }}>
                  <Button type="primary" onClick={() => onResolveAppeal(appeal.id, true)}>采纳申诉</Button>
                  <Button onClick={() => onResolveAppeal(appeal.id, false)}>驳回申诉</Button>
                </Space>
              </Card>
            ))
          )}
          {selectedResolvedAppeals.length > 0 ? (
            <details>
              <summary>查看已处理申诉（{selectedResolvedAppeals.length}）</summary>
              {selectedResolvedAppeals.map((appeal) => (
                <Card className="review-appeal-card" key={appeal.id} size="small" style={{ marginTop: 12 }}>
                  <div>
                    <b>{appeal.status === 'ACCEPTED' ? '已采纳' : '已驳回'}</b>
                    <span>{appeal.rubricItemId ? `评分项 ${appeal.rubricItemId}` : '总评'} · {formatDate(appeal.createdAt)}</span>
                  </div>
                  <p>{toChineseText(appeal.reason)}</p>
                  <small>{toChineseText(appeal.requestedChange)}</small>
                  {appeal.teacherReply ? <small>{toChineseText(appeal.teacherReply)}</small> : null}
                </Card>
              ))}
            </details>
          ) : null}
          </Card>
          <div className="review-item-list panel-scroll panel-scroll-xl">
          {selectedReview.items.map((item) => (
            <Card key={item.rubricItemId} className="review-item-card" size="small" style={{ marginBottom: 12 }}>
              <Form layout="vertical" onSubmitCapture={(event) => onReviewItemSubmit(event, item.rubricItemId)}>
                <Space style={{ width: '100%', justifyContent: 'space-between' }}>
                  <div>
                    <Typography.Text strong>{toChineseText(item.title)}</Typography.Text>
                    <Typography.Text type="secondary" style={{ display: 'block' }}>AI {item.aiScore}/{item.maxScore} · 置信度 {item.confidence}%</Typography.Text>
                  </div>
                  <Form.Item label="教师分" style={{ marginBottom: 0 }}>
                    <InputNumber name="teacherScore" min={0} max={item.maxScore} defaultValue={item.teacherScore} />
                  </Form.Item>
                </Space>
                <Card size="small" style={{ marginTop: 12, marginBottom: 12 }}>
                  <Typography.Text type="secondary">扣分原因</Typography.Text>
                  <Typography.Paragraph style={{ marginBottom: 0 }}>{toChineseText(item.deductionReason)}</Typography.Paragraph>
                </Card>
                <Space wrap style={{ marginBottom: 12 }}>
                  {item.evidence.map((evidence) => <Tag key={evidence}>{toChineseText(evidence)}</Tag>)}
                </Space>
                <Form.Item label="教师评语" style={{ marginBottom: 12 }}>
                  <Input.TextArea name="teacherComment" rows={2} defaultValue={toChineseText(item.teacherComment)} />
                </Form.Item>
                <Button htmlType="submit">保存分项复核</Button>
              </Form>
            </Card>
          ))}
          </div>
          <details className="audit-list">
          <summary>发布审计（{selectedAudits.length}）</summary>
          {selectedAudits.length === 0 ? (
            <Typography.Text type="secondary">暂无发布操作记录</Typography.Text>
          ) : (
            selectedAudits.map((audit) => (
              <div className="audit-row" key={audit.id}>
                <span>{audit.action === 'PUBLISH' ? '发布' : '撤回'} · {toChineseText(audit.operatorName)}</span>
                <small>{toChineseText(audit.reason)} · {formatDate(audit.createdAt)}</small>
              </div>
            ))
          )}
          </details>
        </Space>
      </Card>
    </section>
  );
}
