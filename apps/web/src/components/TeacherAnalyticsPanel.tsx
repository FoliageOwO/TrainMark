import { BarChart3, FileText } from 'lucide-react';
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

  return (
    <section className="analytics-grid">
      <article className="panel analytics-panel">
        <div className="panel-heading">
          <div>
            <p className="eyebrow">成绩分析</p>
            <h3>成绩统计</h3>
          </div>
          <button className="ghost-button" type="button" onClick={onCreateGradeExport}>
            <FileText size={15} /> 导出成绩
          </button>
        </div>
        <span className="status-pill">{gradeStatistics.publishedCount} 份已发布</span>
        <div className="analytics-metrics">
          <span><strong>{gradeStatistics.averageScore}</strong>均分</span>
          <span><strong>{gradeStatistics.standardDeviation}</strong>标准差</span>
          <span><strong>{gradeStatistics.maxScore}</strong>最高分</span>
          <span><strong>{gradeStatistics.minScore}</strong>最低分</span>
        </div>
        <div className="score-buckets">
          {gradeStatistics.scoreBuckets.map((bucket) => {
            const width = gradeStatistics.publishedCount === 0 ? 0 : Math.round((bucket.studentCount / gradeStatistics.publishedCount) * 100);
            return (
              <div className="bucket-row" key={bucket.label}>
                <span>{bucket.label}</span>
                <div><b style={{ width: `${width}%` }} /></div>
                <strong>{bucket.studentCount} 人</strong>
              </div>
            );
          })}
        </div>
        <div className="index-row">
          <span>难度系数 {gradeStatistics.difficultyIndex}</span>
          <span>区分度 {gradeStatistics.discriminationIndex}</span>
        </div>
        <div className="audit-list">
          <strong>导出记录</strong>
          {gradeExports.map((item) => (
            <div className="audit-row" key={item.id}>
              <span>{toChineseFileName(item.fileName)} · {item.rowCount} 行</span>
              <small>
                {exportStatusText[item.status]} · {formatDate(item.createdAt)} ·{' '}
                <button className="link-button" type="button" onClick={() => downloadGradeExport(item)}>下载文件</button>
              </small>
            </div>
          ))}
        </div>
      </article>

      <article className="panel analytics-panel">
        <div className="panel-heading">
          <div>
            <p className="eyebrow">失分点</p>
            <h3>高频失分点</h3>
          </div>
          <BarChart3 size={22} />
        </div>
        <div className="loss-list">
          {lossPoints.map((item) => (
            <div className="loss-row" key={item.rubricItemId}>
              <div>
                <strong>{toChineseText(item.title)}</strong>
                <span>{item.courseOutcomeCode} · 影响 {item.affectedStudentCount} 人</span>
                <p>{toChineseText(item.topReason)}</p>
              </div>
              <b>-{item.averageLostScore}</b>
            </div>
          ))}
        </div>
      </article>

      <article className="panel analytics-panel outcome-panel">
        <div className="panel-heading">
          <div>
            <p className="eyebrow">课程目标</p>
            <h3>课程目标达成度</h3>
          </div>
          <span className="status-pill">目标值 75%</span>
        </div>
        <div className="outcome-list">
          {courseOutcomes.map((item) => (
            <div className="outcome-row" key={item.courseOutcomeCode}>
              <div className="outcome-title">
                <strong>{item.courseOutcomeCode}</strong>
                <span>{toChineseText(item.title)}</span>
                <b>{item.status}</b>
              </div>
              <div className="outcome-bar">
                <span style={{ width: `${Math.round(item.achievedValue * 100)}%` }} />
                <i style={{ left: `${Math.round(item.targetValue * 100)}%` }} />
              </div>
              <small>{Math.round(item.achievedValue * 100)}% / 目标 {Math.round(item.targetValue * 100)}%</small>
            </div>
          ))}
        </div>
      </article>
    </section>
  );
}
