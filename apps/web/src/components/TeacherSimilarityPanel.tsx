import { Button, Card, Empty, Select, Table, Tag } from 'antd';
import { ShieldCheck } from 'lucide-react';
import type { SimilarityJobSummary, TeachingClassSummary } from '../api/types';
import { toChineseText } from '../utils/displayText';

type TeacherSimilarityPanelProps = {
  classes: TeachingClassSummary[];
  selectedClassId: number;
  similarityJobs: SimilarityJobSummary[];
  onSelectClass: (classId: number) => void;
  onStartSimilarity: () => void;
};

export function TeacherSimilarityPanel({
  classes,
  selectedClassId,
  similarityJobs,
  onSelectClass,
  onStartSimilarity,
}: TeacherSimilarityPanelProps) {
  const matchRows = similarityJobs.flatMap((job) => job.matches.map((match) => ({
    jobId: job.id,
    checkedSubmissionCount: job.checkedSubmissionCount,
    maxSimilarity: job.maxSimilarity,
    highRiskPairCount: job.highRiskPairCount,
    ...match,
  })));

  const columns = [
    {
      title: '任务',
      key: 'jobId',
      render: (_: unknown, match: typeof matchRows[number]) => `#${match.jobId}`,
    },
    {
      title: '学生对',
      key: 'students',
      render: (_: unknown, match: typeof matchRows[number]) => `${match.sourceStudentName} / ${match.targetStudentName}`,
    },
    {
      title: '命中片段',
      key: 'section',
      render: (_: unknown, match: typeof matchRows[number]) => toChineseText(match.matchedSection),
    },
    {
      title: '相似度',
      key: 'similarity',
      render: (_: unknown, match: typeof matchRows[number]) => `${Math.round(match.similarity * 100)}%`,
    },
    {
      title: '风险',
      key: 'risk',
      render: (_: unknown, match: typeof matchRows[number]) => <Tag color={match.riskLevel === 'HIGH' ? 'error' : match.riskLevel === 'MEDIUM' ? 'warning' : 'default'}>{match.riskLevel}</Tag>,
    },
  ];

  return (
    <section className="management-grid">
      <Card
        className="similarity-panel"
        title="查重检测"
        extra={<Button onClick={onStartSimilarity}><ShieldCheck size={15} /> 启动查重</Button>}
      >
        <Select
          value={selectedClassId}
          style={{ width: '100%', marginBottom: 16 }}
          options={[
            { value: 0, label: '全部班级' },
            ...classes.map((teachingClass) => ({ value: teachingClass.id, label: teachingClass.name })),
          ]}
          onChange={(value) => onSelectClass(value)}
        />
        {matchRows.length === 0 ? (
          <Empty description="暂无查重命中结果" />
        ) : (
          <Table rowKey={(match) => `${match.jobId}-${match.sourceSubmissionId}-${match.targetSubmissionId}`} columns={columns} dataSource={matchRows} pagination={false} scroll={{ x: 1000 }} />
        )}
      </Card>
    </section>
  );
}
