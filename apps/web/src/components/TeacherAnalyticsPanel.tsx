import { BarChart3, FileText } from 'lucide-react';
import { Alert, Button, Card, Col, Progress, Row, Space, Table, Tag, Typography } from 'antd';
import { fetchApiAssetBlobUrl } from '../api/httpApi';
import type { CourseOutcomeAchievement, GradeExportSummary, GradeStatisticsSummary, LossPointSummary } from '../api/types';
import { toChineseFileName, toChineseText } from '../utils/displayText';
import { formatDate } from '../utils/formatDate';

const exportStatusText: Record<GradeExportSummary['status'], string> = {
  READY: '已生成',
  RUNNING: '生成中',
  FAILED: '生成失败',
};

type TeacherAnalyticsPanelProps = {
  gradeExports: GradeExportSummary[];
  gradeStatistics: GradeStatisticsSummary;
  lossPoints: LossPointSummary[];
  courseOutcomes: CourseOutcomeAchievement[];
  onCreateGradeExport: () => void;
};

export function TeacherAnalyticsPanel({
  gradeExports,
  gradeStatistics,
  lossPoints,
  courseOutcomes,
  onCreateGradeExport,
}: TeacherAnalyticsPanelProps) {
  const currentBlocker = gradeStatistics.publishedCount === 0
    ? '当前阻塞：暂无已发布成绩'
    : gradeExports.length === 0
      ? '当前阻塞：尚未生成导出记录'
      : '当前阻塞：无';
  const nextAction = gradeStatistics.publishedCount === 0
    ? '下一步：先回到人工复核完成发布，再分析结果。'
    : gradeExports.length === 0
      ? '下一步：先导出成绩，沉淀当前批次结果。'
      : '下一步：结合失分点和达成度制定下一轮改进。';
  const downloadGradeExport = async (item: GradeExportSummary) => {
    const url = await fetchApiAssetBlobUrl(item.downloadUrl);
    const link = document.createElement('a');
    link.href = url;
    link.download = toChineseFileName(item.fileName) || '成绩导出文件';
    document.body.appendChild(link);
    link.click();
    link.remove();
    if (url.startsWith('blob:')) {
      window.setTimeout(() => URL.revokeObjectURL(url), 1000);
    }
  };

  const exportColumns = [
    {
      title: '文件',
      key: 'file',
      render: (_: unknown, item: GradeExportSummary) => toChineseFileName(item.fileName),
    },
    {
      title: '行数',
      key: 'rowCount',
      render: (_: unknown, item: GradeExportSummary) => `${item.rowCount} 行`,
    },
    {
      title: '状态',
      key: 'status',
      render: (_: unknown, item: GradeExportSummary) => <Tag color={item.status === 'READY' ? 'success' : item.status === 'FAILED' ? 'error' : 'processing'}>{exportStatusText[item.status]}</Tag>,
    },
    {
      title: '时间',
      key: 'createdAt',
      render: (_: unknown, item: GradeExportSummary) => formatDate(item.createdAt),
    },
    {
      title: '操作',
      key: 'actions',
      render: (_: unknown, item: GradeExportSummary) => (
        <Button type="link" onClick={() => downloadGradeExport(item)}>下载文件</Button>
      ),
    },
  ];

  return (
    <section className="analytics-grid">
      <Card
        className="analytics-panel"
        title="成绩统计"
        extra={<Button onClick={onCreateGradeExport}><FileText size={15} /> 导出成绩</Button>}
      >
        <Space direction="vertical" size={16} style={{ width: '100%' }}>
          <Alert
            type={gradeStatistics.publishedCount === 0 || gradeExports.length === 0 ? 'warning' : 'success'}
            showIcon
            message={currentBlocker}
            description={nextAction}
            action={gradeStatistics.publishedCount > 0 ? (
              <Button type="primary" onClick={onCreateGradeExport}>
                <FileText size={15} /> 先导出当前成绩
              </Button>
            ) : null}
          />
          <Tag color="processing">{gradeStatistics.publishedCount} 份已发布</Tag>
          <Row gutter={[16, 16]}>
            <Col xs={24} md={12} xl={6}><Card><Typography.Text type="secondary">均分</Typography.Text><Typography.Title level={3}>{gradeStatistics.averageScore}</Typography.Title></Card></Col>
            <Col xs={24} md={12} xl={6}><Card><Typography.Text type="secondary">标准差</Typography.Text><Typography.Title level={3}>{gradeStatistics.standardDeviation}</Typography.Title></Card></Col>
            <Col xs={24} md={12} xl={6}><Card><Typography.Text type="secondary">最高分</Typography.Text><Typography.Title level={3}>{gradeStatistics.maxScore}</Typography.Title></Card></Col>
            <Col xs={24} md={12} xl={6}><Card><Typography.Text type="secondary">最低分</Typography.Text><Typography.Title level={3}>{gradeStatistics.minScore}</Typography.Title></Card></Col>
          </Row>
          <Space direction="vertical" size={12} style={{ width: '100%' }}>
            {gradeStatistics.scoreBuckets.map((bucket) => {
              const percent = gradeStatistics.publishedCount === 0 ? 0 : Math.round((bucket.studentCount / gradeStatistics.publishedCount) * 100);
              return (
                <div key={bucket.label}>
                  <Space style={{ width: '100%', justifyContent: 'space-between' }}>
                    <Typography.Text>{bucket.label}</Typography.Text>
                    <Typography.Text>{bucket.studentCount} 人</Typography.Text>
                  </Space>
                  <Progress percent={percent} showInfo={false} />
                </div>
              );
            })}
          </Space>
          <Space wrap>
            <Tag>难度系数 {gradeStatistics.difficultyIndex}</Tag>
            <Tag>区分度 {gradeStatistics.discriminationIndex}</Tag>
          </Space>
          <Table<GradeExportSummary> rowKey="id" columns={exportColumns} dataSource={gradeExports} pagination={false} scroll={{ x: 900 }} />
        </Space>
      </Card>

      <Card className="analytics-panel" title="高频失分点" extra={<BarChart3 size={18} />}>
        <Space direction="vertical" size={12} style={{ width: '100%' }}>
          {lossPoints.map((item) => (
            <Card key={item.rubricItemId} size="small">
              <Space direction="vertical" size={6} style={{ width: '100%' }}>
                <Space style={{ width: '100%', justifyContent: 'space-between' }}>
                  <Typography.Text strong>{toChineseText(item.title)}</Typography.Text>
                  <Tag color="error">-{item.averageLostScore}</Tag>
                </Space>
                <Typography.Text type="secondary">{item.courseOutcomeCode} · 影响 {item.affectedStudentCount} 人</Typography.Text>
                <Typography.Paragraph style={{ marginBottom: 0 }}>{toChineseText(item.topReason)}</Typography.Paragraph>
              </Space>
            </Card>
          ))}
        </Space>
      </Card>

      <Card className="analytics-panel outcome-panel" title="课程目标达成度" extra={<Tag>目标值 75%</Tag>}>
        <Space direction="vertical" size={12} style={{ width: '100%' }}>
          {courseOutcomes.map((item) => (
            <Card key={item.courseOutcomeCode} size="small">
              <Space direction="vertical" size={8} style={{ width: '100%' }}>
                <Space style={{ width: '100%', justifyContent: 'space-between' }}>
                  <div>
                    <Typography.Text strong>{item.courseOutcomeCode}</Typography.Text>
                    <Typography.Text type="secondary" style={{ marginLeft: 8 }}>{toChineseText(item.title)}</Typography.Text>
                  </div>
                  <Tag color={item.status === '达成' ? 'success' : item.status === '临界' ? 'warning' : 'error'}>{item.status}</Tag>
                </Space>
                <Progress percent={Math.round(item.achievedValue * 100)} success={{ percent: Math.round(item.targetValue * 100) }} />
                <Typography.Text type="secondary">{Math.round(item.achievedValue * 100)}% / 目标 {Math.round(item.targetValue * 100)}%</Typography.Text>
              </Space>
            </Card>
          ))}
        </Space>
      </Card>
    </section>
  );
}
