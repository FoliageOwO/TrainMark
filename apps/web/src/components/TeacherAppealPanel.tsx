import { Alert, Button, Card, Empty, Space, Table, Tag, Typography } from 'antd';
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
  const pendingAppeals = appeals.filter((item) => item.status === 'SUBMITTED');
  const currentBlocker = pendingAppeals.length > 0
    ? `当前阻塞：仍有 ${pendingAppeals.length} 条申诉待处理`
    : '当前阻塞：无';
  const nextAction = pendingAppeals.length > 0
    ? '下一步：优先处理最早提交的申诉，再回到复核确认是否需要撤回重发。'
    : '下一步：申诉已清空，可继续推进结果分析。';

  const columns = [
    {
      title: '学生',
      dataIndex: 'studentName',
      key: 'studentName',
    },
    {
      title: '结果',
      key: 'result',
      render: (_: unknown, appeal: AppealSummary) => `结果 #${appeal.resultId} / 评分项 ${appeal.rubricItemId ?? '总评'}`,
    },
    {
      title: '申诉理由',
      key: 'reason',
      render: (_: unknown, appeal: AppealSummary) => toChineseText(appeal.reason),
    },
    {
      title: '期望处理',
      key: 'requestedChange',
      render: (_: unknown, appeal: AppealSummary) => toChineseText(appeal.requestedChange),
    },
    {
      title: '状态',
      key: 'status',
      render: (_: unknown, appeal: AppealSummary) => (
        <Tag color={appeal.status === 'SUBMITTED' ? 'warning' : appeal.status === 'ACCEPTED' ? 'success' : 'error'}>
          {appealStatusText[appeal.status]}
        </Tag>
      ),
    },
    {
      title: '操作',
      key: 'actions',
      render: (_: unknown, appeal: AppealSummary) => (
        appeal.status === 'SUBMITTED' ? (
          <Space wrap>
            <Button type="primary" onClick={() => onResolveAppeal(appeal.id, true)}>采纳</Button>
            <Button onClick={() => onResolveAppeal(appeal.id, false)}>驳回</Button>
          </Space>
        ) : (
          <Typography.Text type="secondary">{appeal.teacherReply ? toChineseText(appeal.teacherReply) : '-'}</Typography.Text>
        )
      ),
    },
  ];

  return (
    <section className="management-grid">
      <Card
        className="appeal-panel"
        title="学生申诉处理"
        extra={<Tag color="warning">{pendingAppeals.length} 条待处理</Tag>}
      >
        <Space direction="vertical" size={16} style={{ width: '100%' }}>
          <Alert
            type={pendingAppeals.length > 0 ? 'warning' : 'success'}
            showIcon
            message={currentBlocker}
            description={nextAction}
          />
          {appeals.length === 0 ? (
            <Empty description="暂无学生申诉" />
          ) : (
            <Table<AppealSummary> rowKey="id" columns={columns} dataSource={appeals} pagination={false} scroll={{ x: 1200 }} />
          )}
        </Space>
      </Card>
    </section>
  );
}
