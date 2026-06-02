import type { CSSProperties } from 'react';
import { Alert, Button, Card, Empty, Progress, Select, Space, Table, Tag, Typography } from 'antd';
import { AlertCircle, Bell, CheckCircle2, Download } from 'lucide-react';
import { fetchApiAssetBlobUrl, shouldUseHttpApi } from '../api/httpApi';
import type { CollectionOverview, ReminderResult, SubmissionSummary, TeachingClassSummary, UnsubmittedStudent } from '../api/types';
import { toChineseFileName } from '../utils/displayText';

const submissionStatusText: Record<SubmissionSummary['status'], string> = {
  NOT_SUBMITTED: '未提交',
  SUBMITTED: '已提交',
  LATE_SUBMITTED: '迟交',
  PROCESSING: '批改中',
  GRADED: '已批改',
  REVIEWING: '复核中',
  REVIEWED: '已复核',
  PUBLISHED: '已发布',
  RETURNED: '已退回',
  FAILED: '异常',
};

type TeacherCollectionPanelProps = {
  classes: TeachingClassSummary[];
  selectedClassId: number;
  collectionOverview: CollectionOverview;
  submissions: SubmissionSummary[];
  selectedAssignmentTitle: string;
  selectedAssignmentId: number;
  unsubmittedStudents: UnsubmittedStudent[];
  reminderResult: ReminderResult | null;
  reminderPending: boolean;
  reminderError: string | null;
  onSelectClass: (classId: number) => void;
  onRemindUnsubmitted: () => void;
};

export function TeacherCollectionPanel({
  classes,
  selectedClassId,
  collectionOverview,
  submissions,
  selectedAssignmentTitle,
  selectedAssignmentId,
  unsubmittedStudents,
  reminderResult,
  reminderPending,
  reminderError,
  onSelectClass,
  onRemindUnsubmitted,
}: TeacherCollectionPanelProps) {
  const submittedRate = collectionOverview.totalStudents === 0
    ? 0
    : Math.round((collectionOverview.submitted / collectionOverview.totalStudents) * 100);
  const submittedReports = submissions
    .filter((submission) => submission.assignmentId === selectedAssignmentId)
    .slice(0, 6);
  const canSendReminder = unsubmittedStudents.length > 0 && !reminderPending;
  const reminderButtonText = reminderPending
    ? '发送中'
    : unsubmittedStudents.length === 0
      ? '无需催交'
      : '一键催交';
  const currentBlocker = unsubmittedStudents.length > 0
    ? `仍有 ${unsubmittedStudents.length} 名学生未交`
    : '当前任务已全部提交';
  const nextAction = unsubmittedStudents.length > 0
    ? '下一步：先发送催交，再回看提交率变化。'
    : '下一步：切换到 AI 批改，启动识别与评分。';
  const openSubmissionFile = async (submission: SubmissionSummary) => {
    const url = await fetchApiAssetBlobUrl(`/api/submissions/${submission.id}/file`);
    const link = document.createElement('a');
    link.href = url;
    link.download = toChineseFileName(submission.fileName) || '实训报告';
    document.body.appendChild(link);
    link.click();
    link.remove();
    if (url.startsWith('blob:')) {
      window.setTimeout(() => URL.revokeObjectURL(url), 1000);
    }
  };

  const submittedColumns = [
    {
      title: '学生',
      key: 'student',
      render: (_: unknown, submission: SubmissionSummary) => (
        <div className="table-primary">
          <strong>{submission.studentName}</strong>
          <span>{submission.studentNo}</span>
        </div>
      ),
    },
    {
      title: '文件',
      key: 'file',
      render: (_: unknown, submission: SubmissionSummary) => toChineseFileName(submission.fileName),
    },
    {
      title: '提交次数',
      key: 'version',
      render: (_: unknown, submission: SubmissionSummary) => (
        <div className="table-primary">
          <strong>第 {submission.version} 次</strong>
          <span>{submission.version > 1 ? '已覆盖上一份报告' : '首次提交'}</span>
        </div>
      ),
    },
    {
      title: '状态',
      key: 'status',
      render: (_: unknown, submission: SubmissionSummary) => <Tag color="processing">{submissionStatusText[submission.status]}</Tag>,
    },
    {
      title: '操作',
      key: 'actions',
      render: (_: unknown, submission: SubmissionSummary) => (
        shouldUseHttpApi() ? (
          <Button type="link" onClick={() => openSubmissionFile(submission)}>
            <Download size={14} /> 原文件
          </Button>
        ) : null
      ),
    },
  ];

  return (
    <section className="collection-layout">
      <Card
        className="collection-panel collection-board-panel"
        title="报告收集看板"
        extra={(
          <Button type="primary" disabled={!canSendReminder} loading={reminderPending} onClick={onRemindUnsubmitted}>
            <Bell size={15} /> {reminderButtonText}
          </Button>
        )}
      >
        <Space direction="vertical" size={16} style={{ width: '100%' }}>
          <div>
            <Typography.Text type="secondary">{selectedAssignmentTitle}</Typography.Text>
          </div>
          <Select
            value={selectedClassId}
            style={{ width: '100%' }}
            options={[
              { value: 0, label: '全部班级' },
              ...classes.map((teachingClass) => ({ value: teachingClass.id, label: teachingClass.name })),
            ]}
            onChange={(value) => onSelectClass(value)}
          />
          <div className="collection-summary">
            <div className="collection-ring" style={{ '--rate': `${submittedRate}%` } as CSSProperties}>
              <strong>{submittedRate}%</strong>
              <span>提交率</span>
            </div>
            <div className="collection-stats">
              <span><strong>{collectionOverview.totalStudents}</strong>应交</span>
              <span><strong>{collectionOverview.submitted}</strong>已交</span>
              <span><strong>{collectionOverview.unsubmitted}</strong>未交</span>
              <span><strong>{collectionOverview.lateSubmitted}</strong>迟交</span>
            </div>
          </div>
          <Progress percent={submittedRate} />
          <Alert
            type={unsubmittedStudents.length > 0 ? 'warning' : 'success'}
            showIcon
            message={currentBlocker}
            description={nextAction}
            action={unsubmittedStudents.length > 0 ? (
              <Button type="primary" size="small" disabled={!canSendReminder} loading={reminderPending} onClick={onRemindUnsubmitted}>
                <Bell size={15} /> 先催交未提交学生
              </Button>
            ) : null}
          />
          {reminderResult ? (
            <Alert
              type="success"
              showIcon
              message={`${reminderResult.status}：已给 ${reminderResult.recipientCount} 名未交学生发送 ${reminderResult.channels.join('、')}，共 ${reminderResult.messageCount} 条消息。`}
            />
          ) : null}
          {reminderError ? <Alert type="error" showIcon message={reminderError} /> : null}
          {!reminderResult && !reminderError && unsubmittedStudents.length === 0 ? (
            <Alert type="success" showIcon message="当前任务所有学生都已提交，无需催交。" />
          ) : null}
        </Space>
      </Card>

      <Card
        className="collection-panel"
        title="已交报告"
        extra={<Tag color="processing">{submittedReports.length} 份可查看</Tag>}
      >
        <Typography.Text type="secondary">{selectedAssignmentTitle}</Typography.Text>
        {submittedReports.length === 0 ? (
          <Empty description="暂无已交报告，学生提交后会在这里显示。" />
        ) : (
          <Table<SubmissionSummary> rowKey="id" columns={submittedColumns} dataSource={submittedReports} pagination={false} scroll={{ x: 900 }} />
        )}
      </Card>

      <Card className="collection-panel" title="未交名单" extra={<Tag color="warning">{unsubmittedStudents.length} 人待提醒</Tag>}>
        <Typography.Text type="secondary">{selectedAssignmentTitle}</Typography.Text>
        {unsubmittedStudents.length === 0 ? (
          <Empty description="暂无未交学生，当前班级范围内所有学生均已提交。" />
        ) : (
          <Table<UnsubmittedStudent>
            rowKey="studentId"
            columns={[
              { title: '学生', dataIndex: 'name', key: 'name' },
              { title: '班级', dataIndex: 'className', key: 'className' },
              { title: '学号', dataIndex: 'studentNo', key: 'studentNo' },
              { title: '邮箱', dataIndex: 'email', key: 'email' },
            ]}
            dataSource={unsubmittedStudents}
            pagination={false}
            scroll={{ x: 900 }}
          />
        )}
      </Card>
    </section>
  );
}
