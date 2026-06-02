import { ArrowRight } from 'lucide-react';
import { Button, Card, Col, Progress, Row, Space, Steps, Tag, Typography } from 'antd';
import type { AssignmentSummary, CollectionOverview, GradingJobSummary, GradingResultSummary } from '../api/types';

type TeacherOverviewDashboardProps = {
  stats: Array<{ label: string; value: string; trend: string; tone: string }>;
  collectionOverview: CollectionOverview;
  assignments: AssignmentSummary[];
  gradingJobs: GradingJobSummary[];
  gradingResults: GradingResultSummary[];
  onSectionChange: (section: string) => void;
};

const pipelineSteps = [
  { key: 'courses', label: '课程准备', hint: '班级与学生名单' },
  { key: 'assignments', label: '任务发布', hint: '评分规则与发布' },
  { key: 'collection', label: '报告收集', hint: '提交进度与催交' },
  { key: 'ai-pipeline', label: 'AI 批改', hint: '识别、评分、查重' },
  { key: 'review', label: '复核与发布', hint: '复核、发布、申诉' },
  { key: 'analytics', label: '结果分析', hint: '失分与达成度' },
];

export function TeacherOverviewDashboard({
  stats,
  collectionOverview,
  assignments,
  gradingJobs,
  gradingResults,
  onSectionChange,
}: TeacherOverviewDashboardProps) {
  const pendingReview = gradingResults.filter((r) => r.reviewStatus === 'NEEDS_REVIEW' || r.reviewStatus === 'IN_REVIEW').length;
  const completedJobs = gradingJobs.filter((j) => j.status === 'COMPLETED').length;
  const totalJobs = gradingJobs.length;
  const activeAssignments = assignments.filter((a) => a.status === 'PUBLISHED').length;
  const checklist = [
    { label: '已发布任务', done: activeAssignments > 0, value: `${activeAssignments}`, section: 'assignments' },
    { label: '已启动批改', done: totalJobs > 0, value: `${totalJobs}`, section: 'ai-pipeline' },
    { label: '待复核已清空', done: pendingReview === 0, value: `${pendingReview}`, section: 'review' },
  ];
  const nextAction = activeAssignments === 0
    ? {
      title: '尚未发布任务',
      detail: '请先创建并发布一个实训任务',
      actionLabel: '任务发布',
      section: 'assignments',
    }
    : totalJobs === 0
      ? {
        title: '尚未启动批改',
        detail: '请选择已发布任务并启动 AI 批改',
        actionLabel: 'AI 批改',
        section: 'ai-pipeline',
      }
    : pendingReview > 0
    ? {
      title: '待复核结果',
      detail: `${pendingReview} 份`,
      actionLabel: '人工复核',
      section: 'review',
    }
    : collectionOverview.unsubmitted > 0
      ? {
        title: '未提交学生',
        detail: `${collectionOverview.unsubmitted} 名`,
        actionLabel: '报告收集',
        section: 'collection',
      }
      : {
        title: '批改任务',
        detail: totalJobs === 0 ? '暂无进行中任务' : `${totalJobs} 个任务`,
        actionLabel: 'AI 批改',
        section: 'ai-pipeline',
      };

  return (
    <>
      <div className="teacher-overview-hero-grid">
        <Card className="teacher-overview-card teacher-overview-priority-card" bodyStyle={{ height: '100%' }}>
          <div className="teacher-overview-card-body teacher-overview-priority-body">
            <div className="teacher-overview-copy">
              <Typography.Text type="secondary">当前优先事项</Typography.Text>
              <Typography.Title level={3} style={{ margin: 0 }}>{nextAction.title}</Typography.Title>
              <Typography.Paragraph style={{ marginBottom: 0 }}>{nextAction.detail}</Typography.Paragraph>
            </div>
            <Button type="primary" onClick={() => onSectionChange(nextAction.section)}>
              {nextAction.actionLabel} <ArrowRight size={16} />
            </Button>
          </div>
        </Card>

        <div className="teacher-overview-metrics-grid">
          <Card className="teacher-overview-card teacher-overview-metric-card" bodyStyle={{ height: '100%' }}>
            <div className="teacher-overview-card-body teacher-overview-metric-body">
              <Typography.Text type="secondary">已发布任务</Typography.Text>
              <Typography.Title level={2} style={{ margin: 0 }}>{activeAssignments}</Typography.Title>
              <Typography.Text type="secondary">当前课程的可收集任务数</Typography.Text>
            </div>
          </Card>
          <Card className="teacher-overview-card teacher-overview-metric-card" bodyStyle={{ height: '100%' }}>
            <div className="teacher-overview-card-body teacher-overview-metric-body">
              <Typography.Text type="secondary">批改完成率</Typography.Text>
              <Typography.Title level={2} style={{ margin: 0 }}>
                {totalJobs === 0 ? '0%' : `${Math.round((completedJobs / totalJobs) * 100)}%`}
              </Typography.Title>
              <Progress percent={totalJobs === 0 ? 0 : Math.round((completedJobs / totalJobs) * 100)} showInfo={false} size="small" />
              <Typography.Text type="secondary">已完成 {completedJobs} / {totalJobs} 个批改任务</Typography.Text>
            </div>
          </Card>
          <Card className="teacher-overview-card teacher-overview-metric-card" bodyStyle={{ height: '100%' }}>
            <div className="teacher-overview-card-body teacher-overview-metric-body">
              <Typography.Text type="secondary">当前风险点</Typography.Text>
              <Typography.Title level={2} style={{ margin: 0 }}>{pendingReview + collectionOverview.unsubmitted}</Typography.Title>
              <Typography.Text type="secondary">待复核 {pendingReview}，未提交 {collectionOverview.unsubmitted}</Typography.Text>
            </div>
          </Card>
        </div>
      </div>
      <Row gutter={[16, 16]}>
        <Col span={24}>
          <Card title="流程步骤">
            <Steps
              className="teacher-progress-steps"
              responsive
              progressDot
              items={pipelineSteps.map((step) => ({
                title: step.label,
                description: step.hint,
              }))}
            />
          </Card>
        </Col>
        <Col span={24}>
          <Card title="开课检查清单">
            <Row gutter={[16, 16]}>
              {checklist.map((item) => (
                <Col xs={24} md={8} key={item.label}>
                  <Card hoverable onClick={() => onSectionChange(item.section)}>
                    <Space direction="vertical" size={8} style={{ width: '100%' }}>
                      <Typography.Text strong>{item.label}</Typography.Text>
                      <Tag color={item.done ? 'success' : 'warning'}>
                        {item.done ? `已满足（${item.value}）` : `未完成（${item.value}）`}
                      </Tag>
                    </Space>
                  </Card>
                </Col>
              ))}
            </Row>
          </Card>
        </Col>
      </Row>
    </>
  );
}
