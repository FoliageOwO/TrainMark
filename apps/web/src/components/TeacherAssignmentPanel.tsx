import { useState, type FormEvent } from 'react';
import { Alert, Button, Card, Empty, Form, Input, InputNumber, Select, Space, Switch, Table, Tag, Typography } from 'antd';
import { CalendarClock, FileText, Plus } from 'lucide-react';
import type { CreateAssignmentInput } from '../api/httpApi';
import type { AssignmentSummary, TeachingClassSummary } from '../api/types';
import { formatDate } from '../utils/formatDate';

const statusText = {
  ACTIVE: '进行中',
  DRAFT: '草稿',
  ARCHIVED: '已归档',
  PUBLISHED: '已发布',
  CLOSED: '已截止',
};

type TeacherAssignmentPanelProps = {
  assignments: AssignmentSummary[];
  classes: TeachingClassSummary[];
  selectedAssignmentId: number;
  selectedCourseId: number;
  selectedCourseName: string;
  assignmentNotice: string;
  onCreateAssignment: (input: CreateAssignmentInput) => Promise<void>;
  onPublishAssignment: (assignmentId: number) => Promise<void>;
  onSelectAssignment: (assignmentId: number) => void;
};

export function TeacherAssignmentPanel({
  assignments,
  classes,
  selectedAssignmentId,
  selectedCourseId,
  selectedCourseName,
  assignmentNotice,
  onCreateAssignment,
  onPublishAssignment,
  onSelectAssignment,
}: TeacherAssignmentPanelProps) {
  const [showForm, setShowForm] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [publishingId, setPublishingId] = useState<number | null>(null);
  const [aiGradingEnabled, setAiGradingEnabled] = useState(true);
  const [similarityCheckEnabled, setSimilarityCheckEnabled] = useState(true);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const title = String(formData.get('title') ?? '').trim();
    const deadline = String(formData.get('deadline') ?? '');
    const totalScore = Number(formData.get('totalScore') ?? 100);
    if (!title || !deadline) {
      return;
    }

    setIsCreating(true);
    try {
      await onCreateAssignment({
        courseId: selectedCourseId,
        title,
        description: String(formData.get('description') ?? ''),
        deadline: new Date(deadline).toISOString(),
        totalScore,
        classIds: classes.map((item) => item.id),
        similarityCheckEnabled,
        aiGradingEnabled,
      });
      event.currentTarget.reset();
      setAiGradingEnabled(true);
      setSimilarityCheckEnabled(true);
      setShowForm(false);
    } finally {
      setIsCreating(false);
    }
  };

  const handlePublish = async (assignmentId: number) => {
    setPublishingId(assignmentId);
    try {
      await onPublishAssignment(assignmentId);
    } finally {
      setPublishingId(null);
    }
  };

  const draftCount = assignments.filter((item) => item.status === 'DRAFT').length;
  const publishedCount = assignments.filter((item) => item.status === 'PUBLISHED').length;
  const currentBlocker = assignments.length === 0
    ? '当前阻塞：还没有可发布任务'
    : draftCount > 0
      ? `当前阻塞：仍有 ${draftCount} 个草稿未发布`
      : '当前阻塞：无';
  const nextAction = assignments.length === 0
    ? '下一步：先创建第一份任务。'
    : draftCount > 0
      ? '下一步：优先发布草稿任务，再进入报告收集。'
      : `下一步：任务已发布 ${publishedCount} 个，可进入报告收集。`;
  const firstDraft = assignments.find((item) => item.status === 'DRAFT') ?? null;

  const columns = [
    {
      title: '任务',
      key: 'title',
      render: (_: unknown, item: AssignmentSummary) => (
        <div className="table-primary">
          <strong>{item.title}</strong>
          <span>{selectedAssignmentId === item.id ? '当前任务' : `任务 #${item.id}`}</span>
        </div>
      ),
    },
    {
      title: '截止时间',
      key: 'deadline',
      render: (_: unknown, item: AssignmentSummary) => (
        <span className="table-inline"><CalendarClock size={14} /> {formatDate(item.deadline)}</span>
      ),
    },
    {
      title: '分值',
      key: 'score',
      render: (_: unknown, item: AssignmentSummary) => `${item.totalScore} 分`,
    },
    {
      title: '批改方式',
      key: 'grading',
      render: (_: unknown, item: AssignmentSummary) => item.aiGradingEnabled ? 'AI 批改' : '人工批改',
    },
    {
      title: '查重',
      key: 'similarity',
      render: (_: unknown, item: AssignmentSummary) => item.similarityCheckEnabled ? '开启' : '关闭',
    },
    {
      title: '状态',
      key: 'status',
      render: (_: unknown, item: AssignmentSummary) => <Tag color={item.status === 'PUBLISHED' ? 'success' : 'default'}>{statusText[item.status]}</Tag>,
    },
    {
      title: '操作',
      key: 'actions',
      render: (_: unknown, item: AssignmentSummary) => (
        <Space wrap>
          <Button onClick={() => onSelectAssignment(item.id)}>
            {selectedAssignmentId === item.id ? '当前任务' : '设为当前'}
          </Button>
          {item.status === 'DRAFT' ? (
            <Button type="primary" onClick={() => handlePublish(item.id)} loading={publishingId === item.id}>
              发布任务
            </Button>
          ) : null}
        </Space>
      ),
    },
  ];

  return (
    <Card
      title="实训任务"
      extra={<Button onClick={() => setShowForm((v) => !v)}><Plus size={15} /> 创建任务</Button>}
    >
      <Space direction="vertical" size={16} style={{ width: '100%' }}>
        <Typography.Text type="secondary">{selectedCourseName}</Typography.Text>
        <Alert
          type={assignments.length === 0 || draftCount > 0 ? 'warning' : 'success'}
          showIcon
          message={currentBlocker}
          description={nextAction}
          action={assignments.length === 0 ? (
            <Button type="primary" onClick={() => setShowForm(true)}>
              <Plus size={15} /> 先创建任务
            </Button>
          ) : firstDraft ? (
            <Button type="primary" onClick={() => handlePublish(firstDraft.id)} loading={publishingId === firstDraft.id}>
              先发布草稿任务 #{firstDraft.id}
            </Button>
          ) : null}
        />

        {showForm ? (
          <Form layout="vertical" className="assignment-create-form" onSubmitCapture={handleSubmit}>
            <Form.Item label="任务标题">
              <Input name="title" required defaultValue={`${selectedCourseName}阶段报告`} />
            </Form.Item>
            <Form.Item label="截止时间">
              <Input name="deadline" required type="datetime-local" defaultValue={defaultDeadlineValue()} />
            </Form.Item>
            <Form.Item label="总分">
              <InputNumber name="totalScore" min={1} max={1000} defaultValue={100} style={{ width: '100%' }} />
            </Form.Item>
            <Form.Item label="任务说明">
              <Input.TextArea name="description" rows={3} defaultValue="提交完整实训报告，包含需求分析、系统设计、核心实现、运行截图和总结。" />
            </Form.Item>
            <Space wrap>
              <span>AI 批改 <Switch checked={aiGradingEnabled} onChange={setAiGradingEnabled} /></span>
              <span>查重检测 <Switch checked={similarityCheckEnabled} onChange={setSimilarityCheckEnabled} /></span>
            </Space>
            <Button type="primary" htmlType="submit" loading={isCreating}>
              保存任务
            </Button>
          </Form>
        ) : null}
        {assignmentNotice ? <Alert type="success" showIcon message={assignmentNotice} /> : null}

        {assignments.length === 0 ? (
          <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description={<Space direction="vertical"><FileText size={32} /><span>暂无实训任务，点击右上角开始配置。</span></Space>} />
        ) : (
          <Table<AssignmentSummary> rowKey="id" columns={columns} dataSource={assignments} pagination={false} scroll={{ x: 1100 }} />
        )}
      </Space>
    </Card>
  );
}

function defaultDeadlineValue() {
  const value = new Date();
  value.setDate(value.getDate() + 7);
  value.setHours(23, 59, 0, 0);
  return value.toISOString().slice(0, 16);
}
