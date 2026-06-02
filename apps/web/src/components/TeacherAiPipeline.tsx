import { useState, type FormEvent } from 'react';
import { Alert, Button, Card, Col, Empty, Form, Input, InputNumber, Progress, Row, Select, Space, Table, Tag, Typography } from 'antd';
import { FileText, Plus, Sparkles } from 'lucide-react';
import type { CreateRubricInput } from '../api/httpApi';
import type { AssignmentSummary, GradingJobSummary, OcrJobSummary, RubricSummary, TeachingClassSummary } from '../api/types';
import { toChineseText } from '../utils/displayText';

const gradingStatusText: Record<GradingJobSummary['status'], string> = {
  PENDING: '等待中',
  OCR_RUNNING: '识别中',
  STRUCTURING: '结构化',
  SCORING: '评分中',
  ANNOTATING: '生成批注',
  COMPLETED: '已完成',
  FAILED: '失败',
  RETRYING: '重试中',
};

const ocrStatusText: Record<OcrJobSummary['status'], string> = {
  PENDING: '等待中',
  PREPROCESSING: '预处理',
  RECOGNIZING: '识别中',
  STRUCTURING: '结构化',
  COMPLETED: '已完成',
  FAILED: '失败',
};

const ocrBlockTypeText: Record<OcrJobSummary['blocks'][number]['type'], string> = {
  heading: '标题',
  paragraph: '段落',
  table: '表格',
  image: '图片',
};

type TeacherAiPipelineProps = {
  assignments: AssignmentSummary[];
  classes: TeachingClassSummary[];
  selectedClassId: number;
  selectedAssignmentId: number;
  rubric: RubricSummary | null;
  rubricNotice: string;
  gradingJobs: GradingJobSummary[];
  ocrJobs: OcrJobSummary[];
  actionNotice: string;
  canStartOcr: boolean;
  onCreateRubric: (input: CreateRubricInput) => Promise<void>;
  onSelectClass: (classId: number) => void;
  onSelectAssignment: (assignmentId: number) => void;
  onStartGrading: () => void;
  onStartOcr: () => void;
};

export function TeacherAiPipeline({
  assignments,
  classes,
  selectedClassId,
  selectedAssignmentId,
  rubric,
  rubricNotice,
  gradingJobs,
  ocrJobs,
  actionNotice,
  canStartOcr,
  onCreateRubric,
  onSelectClass,
  onSelectAssignment,
  onStartGrading,
  onStartOcr,
}: TeacherAiPipelineProps) {
  const [showRubricForm, setShowRubricForm] = useState(false);
  const [isCreatingRubric, setIsCreatingRubric] = useState(false);

  const handleSubmitRubric = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const assignmentId = Number(formData.get('assignmentId'));
    const name = String(formData.get('name') ?? '').trim();
    const totalScore = Number(formData.get('totalScore') ?? 100);
    if (!assignmentId || !name) {
      return;
    }

    setIsCreatingRubric(true);
    try {
      await onCreateRubric({
        assignmentId,
        name,
        totalScore,
        items: buildRubricItems(formData),
      });
      event.currentTarget.reset();
      setShowRubricForm(false);
    } finally {
      setIsCreatingRubric(false);
    }
  };
  const runningOcrCount = ocrJobs.filter((job) => job.status !== 'COMPLETED' && job.status !== 'FAILED').length;
  const runningGradingCount = gradingJobs.filter((job) => job.status !== 'COMPLETED' && job.status !== 'FAILED').length;
  const nextAction = !rubric
    ? '先创建评分标准，再启动批改'
    : runningOcrCount > 0 || runningGradingCount > 0
      ? `当前有 ${runningOcrCount + runningGradingCount} 个处理中任务`
      : '可直接启动 OCR 或批改';
  const currentBlocker = !rubric
    ? '当前阻塞：缺少评分标准'
    : runningOcrCount > 0 || runningGradingCount > 0
      ? `当前阻塞：仍有 ${runningOcrCount + runningGradingCount} 个任务处理中`
      : '当前阻塞：无';

  const ocrColumns = [
    {
      title: '任务',
      key: 'task',
      render: (_: unknown, job: OcrJobSummary) => (
        <div className="queue-task-cell">
          <strong>识别任务 #{job.id}</strong>
          <span>{shortObjectKey(job.objectKey)}</span>
        </div>
      ),
    },
    {
      title: '处理进度',
      key: 'progress',
      render: (_: unknown, job: OcrJobSummary) => <Progress percent={ocrProgress(job)} size="small" />,
    },
    {
      title: '状态',
      key: 'status',
      render: (_: unknown, job: OcrJobSummary) => <Tag color={job.status === 'COMPLETED' ? 'success' : job.status === 'FAILED' ? 'error' : 'processing'}>{ocrStatusText[job.status]}</Tag>,
    },
    {
      title: '处理时间',
      key: 'time',
      render: (_: unknown, job: OcrJobSummary) => formatProcessTime(job.createdAt, job.updatedAt, job.status === 'COMPLETED' || job.status === 'FAILED'),
    },
    {
      title: '识别结果',
      key: 'result',
      render: (_: unknown, job: OcrJobSummary) => `${job.pageCount} 页 / ${job.textBlockCount} 文本 / ${job.tableCount} 表格 / ${job.confidence}%`,
    },
  ];

  const gradingColumns = [
    {
      title: '任务',
      key: 'task',
      render: (_: unknown, job: GradingJobSummary) => (
        <div className="queue-task-cell">
          <strong>批改任务 #{job.id}</strong>
          <span>{job.completedSubmissions}/{job.totalSubmissions} 份报告</span>
        </div>
      ),
    },
    {
      title: '完成进度',
      key: 'progress',
      render: (_: unknown, job: GradingJobSummary) => <Progress percent={gradingProgress(job)} size="small" />,
    },
    {
      title: '状态',
      key: 'status',
      render: (_: unknown, job: GradingJobSummary) => <Tag color={job.status === 'COMPLETED' ? 'success' : job.status === 'FAILED' ? 'error' : 'processing'}>{gradingStatusText[job.status]}</Tag>,
    },
    {
      title: '处理时间',
      key: 'time',
      render: (_: unknown, job: GradingJobSummary) => formatProcessTime(job.startedAt ?? job.createdAt, job.finishedAt ?? job.updatedAt, job.status === 'COMPLETED' || job.status === 'FAILED'),
    },
    {
      title: '置信度',
      key: 'confidence',
      render: (_: unknown, job: GradingJobSummary) => `${job.confidence}%`,
    },
  ];

  const blockColumns = [
    {
      title: '标题',
      key: 'title',
      render: (_: unknown, block: OcrJobSummary['blocks'][number]) => toChineseText(block.title),
    },
    {
      title: '类型',
      key: 'type',
      render: (_: unknown, block: OcrJobSummary['blocks'][number]) => ocrBlockTypeText[block.type],
    },
    {
      title: '页码',
      key: 'page',
      render: (_: unknown, block: OcrJobSummary['blocks'][number]) => `第 ${block.page} 页`,
    },
    {
      title: '置信度',
      key: 'confidence',
      render: (_: unknown, block: OcrJobSummary['blocks'][number]) => `${block.confidence}%`,
    },
  ];

  return (
    <>
      <Row gutter={[16, 16]}>
        <Col xs={24} md={8}><Card><Typography.Text type="secondary">评分标准</Typography.Text><Typography.Title level={2}>{rubric ? rubric.items.length : 0}</Typography.Title><Typography.Text type="secondary">{rubric ? '评分项' : '未配置'}</Typography.Text></Card></Col>
        <Col xs={24} md={8}><Card><Typography.Text type="secondary">识别队列</Typography.Text><Typography.Title level={2}>{ocrJobs.length}</Typography.Title><Typography.Text type="secondary">{ocrJobs.filter((job) => job.status !== 'COMPLETED').length} 个处理中</Typography.Text></Card></Col>
        <Col xs={24} md={8}><Card><Typography.Text type="secondary">批改队列</Typography.Text><Typography.Title level={2}>{gradingJobs.length}</Typography.Title><Typography.Text type="secondary">{gradingJobs.filter((job) => job.status !== 'COMPLETED').length} 个处理中</Typography.Text></Card></Col>
      </Row>
      <Card style={{ marginTop: 16 }}>
        <Alert
          type={!rubric || runningOcrCount > 0 || runningGradingCount > 0 ? 'warning' : 'success'}
          showIcon
          message={currentBlocker}
          description={nextAction}
          action={!rubric ? (
            <Button type="primary" onClick={() => setShowRubricForm(true)}>
              <Plus size={15} /> 先创建评分标准
            </Button>
          ) : runningOcrCount + runningGradingCount === 0 ? (
            <Button type="primary" onClick={onStartOcr} disabled={!canStartOcr}>
              <FileText size={15} /> 先启动识别
            </Button>
          ) : null}
        />
      </Card>

      <section className="management-grid">
        <Card
          className="rubric-panel"
          title="评分标准"
          extra={<Button onClick={() => setShowRubricForm((value) => !value)}><Plus size={15} /> 新建标准</Button>}
        >
          <Space direction="vertical" size={16} style={{ width: '100%' }}>
            <div>
              <Typography.Text type="secondary">当前批改任务</Typography.Text>
              <Select
                value={selectedAssignmentId}
                style={{ width: '100%', marginTop: 8 }}
                options={assignments.map((assignment) => ({
                  value: assignment.id,
                  label: `${toChineseText(assignment.title)} · ${assignment.status === 'PUBLISHED' ? '已发布' : '草稿'}`,
                }))}
                onChange={(value) => onSelectAssignment(value)}
              />
            </div>
            <div>
              <Typography.Text type="secondary">当前班级</Typography.Text>
              <Select
                value={selectedClassId}
                style={{ width: '100%', marginTop: 8 }}
                options={[
                  { value: 0, label: '全部班级' },
                  ...classes.map((teachingClass) => ({ value: teachingClass.id, label: teachingClass.name })),
                ]}
                onChange={(value) => onSelectClass(value)}
              />
            </div>
          {showRubricForm && (
            <Form layout="vertical" className="assignment-create-form" onSubmitCapture={handleSubmitRubric}>
              <Form.Item label="适用任务">
                <Select
                  defaultValue={selectedAssignmentId || assignments[0]?.id || undefined}
                  options={assignments.map((assignment) => ({ value: assignment.id, label: toChineseText(assignment.title) }))}
                  onChange={(value) => {
                    const hidden = document.querySelector<HTMLInputElement>('input[name="assignmentId"]');
                    if (hidden) hidden.value = String(value);
                  }}
                />
                <input type="hidden" name="assignmentId" defaultValue={String(selectedAssignmentId || assignments[0]?.id || '')} />
              </Form.Item>
              <Form.Item label="标准名称"><Input name="name" required defaultValue="实训报告评分标准" /></Form.Item>
              <Form.Item label="总分"><InputNumber name="totalScore" min={1} max={1000} defaultValue={100} style={{ width: '100%' }} /></Form.Item>
              <Form.Item label="评分项一"><Input name="item1Title" required defaultValue="需求与设计" /></Form.Item>
              <Form.Item label="分值"><InputNumber name="item1Score" min={1} defaultValue={20} style={{ width: '100%' }} /></Form.Item>
              <Form.Item label="关键词"><Input name="item1Keywords" defaultValue="需求,设计,ER图,约束" /></Form.Item>
              <Form.Item label="评分项二"><Input name="item2Title" required defaultValue="系统实现" /></Form.Item>
              <Form.Item label="分值"><InputNumber name="item2Score" min={1} defaultValue={50} style={{ width: '100%' }} /></Form.Item>
              <Form.Item label="关键词"><Input name="item2Keywords" defaultValue="功能,接口,权限,异常" /></Form.Item>
              <Form.Item label="评分项三"><Input name="item3Title" required defaultValue="报告规范" /></Form.Item>
              <Form.Item label="分值"><InputNumber name="item3Score" min={1} defaultValue={30} style={{ width: '100%' }} /></Form.Item>
              <Form.Item label="关键词"><Input name="item3Keywords" defaultValue="截图,总结,目录,格式" /></Form.Item>
              <Button type="primary" htmlType="submit" loading={isCreatingRubric} disabled={assignments.length === 0}>
                保存评分标准
              </Button>
            </Form>
          )}
          {rubricNotice ? <Alert type="success" showIcon message={rubricNotice} /> : null}
          {rubric ? (
            <>
              <Card size="small" style={{ background: 'rgba(22,119,255,0.04)' }}>
                <Space direction="vertical" size={8} style={{ width: '100%' }}>
                  <Space style={{ width: '100%', justifyContent: 'space-between' }}>
                    <div>
                      <Typography.Text strong>{toChineseText(rubric.name)}</Typography.Text>
                      <Typography.Text type="secondary" style={{ display: 'block' }}>总分 {rubric.totalScore} · {rubric.items.length} 个评分项</Typography.Text>
                    </div>
                    <Tag color="processing">可解释评分</Tag>
                  </Space>
                  {rubric.items.map((item) => (
                    <Card key={item.id} size="small">
                      <Space style={{ width: '100%', justifyContent: 'space-between' }}>
                        <div>
                          <Typography.Text strong>{toChineseText(item.title)}</Typography.Text>
                          <Typography.Text type="secondary" style={{ display: 'block' }}>{item.courseOutcomeCode} · {toChineseText(item.points[0]?.title ?? '待配置得分点')}</Typography.Text>
                        </div>
                        <Tag>{item.score} 分</Tag>
                      </Space>
                    </Card>
                  ))}
                </Space>
              </Card>
            </>
          ) : (
            <Empty description="暂无评分标准，先为实训任务创建评分标准，再启动智能批改。" />
          )}
          </Space>
        </Card>

        <Card
          className="ocr-panel"
          title="文档识别队列"
          extra={<Button onClick={onStartOcr} disabled={!canStartOcr}><FileText size={15} /> 启动识别</Button>}
        >
          {ocrJobs.length === 0 ? (
            <Empty description="暂无识别任务，先在上方点击“启动识别”。" />
          ) : (
            <Table<OcrJobSummary> rowKey="id" columns={ocrColumns} dataSource={ocrJobs} pagination={false} scroll={{ x: 1100 }} />
          )}
        </Card>

        <Card
          className="grading-panel"
          title="智能批改队列"
          extra={<Button onClick={onStartGrading} disabled={!rubric}><Sparkles size={15} /> 启动批改</Button>}
        >
          <Space direction="vertical" size={16} style={{ width: '100%' }}>
            {actionNotice ? <Alert type="success" showIcon message={actionNotice} /> : null}
            {gradingJobs.length === 0 ? (
              <Empty description="暂无批改任务，先准备评分标准后点击“启动批改”。" />
            ) : (
              <Table<GradingJobSummary> rowKey="id" columns={gradingColumns} dataSource={gradingJobs} pagination={false} scroll={{ x: 1100 }} />
            )}
          </Space>
        </Card>
      </section>

      <section className="management-grid">
        <Card className="ocr-panel span-two" title="结构识别结果" extra={<Tag>最新任务</Tag>}>
          {ocrJobs[0]?.blocks?.length ? (
            <Table<OcrJobSummary['blocks'][number]>
              rowKey={(block) => `${block.type}-${block.page}-${block.title}`}
              columns={blockColumns}
              dataSource={ocrJobs[0].blocks}
              pagination={false}
              scroll={{ x: 900 }}
            />
          ) : (
            <Empty description="暂无结构识别结果" />
          )}
        </Card>
      </section>
    </>
  );
}

function buildRubricItems(formData: FormData): CreateRubricInput['items'] {
  return [1, 2, 3].map((index) => {
    const title = String(formData.get(`item${index}Title`) ?? '').trim();
    const score = Number(formData.get(`item${index}Score`) ?? 1);
    const keywords = splitKeywords(String(formData.get(`item${index}Keywords`) ?? ''));
    return {
      title,
      score,
      courseOutcomeCode: `CO${index}`,
      points: [{
        title: `${title}关键点`,
        description: `围绕${title}的完整性、准确性和证据进行评分。`,
        score,
        keywords,
        synonyms: [],
      }],
    };
  });
}

function splitKeywords(value: string) {
  return value
    .split(/[,，]/)
    .map((item) => item.trim())
    .filter(Boolean);
}

function gradingProgress(job: GradingJobSummary) {
  if (job.status === 'COMPLETED') {
    return 100;
  }
  if (job.status === 'FAILED') {
    return Math.max(0, Math.round((job.completedSubmissions / Math.max(job.totalSubmissions, 1)) * 100));
  }
  const base = Math.round((job.completedSubmissions / Math.max(job.totalSubmissions, 1)) * 100);
  const statusFloor: Record<GradingJobSummary['status'], number> = {
    PENDING: 5,
    OCR_RUNNING: 20,
    STRUCTURING: 40,
    SCORING: 65,
    ANNOTATING: 85,
    RETRYING: 50,
    COMPLETED: 100,
    FAILED: base,
  };
  return Math.max(base, statusFloor[job.status]);
}

function ocrProgress(job: OcrJobSummary) {
  const statusValue: Record<OcrJobSummary['status'], number> = {
    PENDING: 8,
    PREPROCESSING: 25,
    RECOGNIZING: 60,
    STRUCTURING: 85,
    COMPLETED: 100,
    FAILED: 100,
  };
  return statusValue[job.status];
}

function formatProcessTime(start?: string | null, end?: string | null, isFinished = false) {
  if (!start) {
    return '尚未开始';
  }
  const startText = formatDateTime(start);
  if (!end || end === start) {
    return isFinished ? `完成：${startText}` : `开始：${startText}`;
  }
  const endText = formatDateTime(end);
  return isFinished ? `开始：${startText} / 完成：${endText}` : `开始：${startText} / 更新：${endText}`;
}

function formatDateTime(value: string) {
  const timestamp = Date.parse(value);
  if (Number.isNaN(timestamp)) {
    return '时间未知';
  }
  return new Intl.DateTimeFormat('zh-CN', {
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  }).format(new Date(timestamp));
}

function shortObjectKey(value: string) {
  const fileName = value.split(/[\\/]/).filter(Boolean).at(-1) ?? value;
  return toChineseText(fileName);
}
