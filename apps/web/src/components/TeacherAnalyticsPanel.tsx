import { BarChart3, FileText } from 'lucide-react';
import { resolveApiAssetUrl } from '../api/httpApi';
import type { CourseOutcomeAchievement, GradeExportSummary, GradeStatisticsSummary, LossPointSummary } from '../api/types';
import { formatDate } from '../utils/formatDate';

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
  return (
    <section className="analytics-grid">
      <article className="panel analytics-panel">
        <div className="panel-heading">
          <div>
            <p className="eyebrow">Grade Analytics</p>
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
              <span>{item.fileName} · {item.rowCount} 行</span>
              <small>
                {item.status} · {formatDate(item.createdAt)} ·{' '}
                <a href={resolveApiAssetUrl(item.downloadUrl)} rel="noreferrer" target="_blank">下载文件</a>
              </small>
            </div>
          ))}
        </div>
      </article>

      <article className="panel analytics-panel">
        <div className="panel-heading">
          <div>
            <p className="eyebrow">Loss Points</p>
            <h3>高频失分点</h3>
          </div>
          <BarChart3 size={22} />
        </div>
        <div className="loss-list">
          {lossPoints.map((item) => (
            <div className="loss-row" key={item.rubricItemId}>
              <div>
                <strong>{item.title}</strong>
                <span>{item.courseOutcomeCode} · 影响 {item.affectedStudentCount} 人</span>
                <p>{item.topReason}</p>
              </div>
              <b>-{item.averageLostScore}</b>
            </div>
          ))}
        </div>
      </article>

      <article className="panel analytics-panel outcome-panel">
        <div className="panel-heading">
          <div>
            <p className="eyebrow">Course Outcomes</p>
            <h3>课程目标达成度</h3>
          </div>
          <span className="status-pill">目标值 75%</span>
        </div>
        <div className="outcome-list">
          {courseOutcomes.map((item) => (
            <div className="outcome-row" key={item.courseOutcomeCode}>
              <div className="outcome-title">
                <strong>{item.courseOutcomeCode}</strong>
                <span>{item.title}</span>
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
