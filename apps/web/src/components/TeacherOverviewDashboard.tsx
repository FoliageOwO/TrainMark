import { BarChart3, BookOpen, CheckCircle2, FileCheck2, FileText, Sparkles, UploadCloud, Users } from 'lucide-react';
import type { AssignmentSummary, CollectionOverview, GradingJobSummary, GradingResultSummary } from '../api/types';

type TeacherOverviewDashboardProps = {
  stats: Array<{ label: string; value: string; trend: string; tone: string }>;
  collectionOverview: CollectionOverview;
  assignments: AssignmentSummary[];
  gradingJobs: GradingJobSummary[];
  gradingResults: GradingResultSummary[];
  onSectionChange: (section: string) => void;
};

const quickLinks = [
  { icon: BookOpen, label: '课程与班级', section: 'courses', color: 'var(--brand)' },
  { icon: FileText, label: '实训任务', section: 'assignments', color: 'var(--brand)' },
  { icon: UploadCloud, label: '报告收集', section: 'collection', color: 'var(--success)' },
  { icon: Sparkles, label: 'AI 批改', section: 'ai-pipeline', color: '#7c3aed' },
  { icon: FileCheck2, label: '人工复核', section: 'review', color: 'var(--brand)' },
  { icon: BarChart3, label: '失分分析', section: 'analytics', color: 'var(--success)' },
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

  return (
    <>
      <section className="stats-grid">
        {stats.map((item) => (
          <article className={`stat-card ${item.tone}`} key={item.label}>
            <span>{item.label}</span>
            <strong>{item.value}</strong>
            <small>{item.trend}</small>
          </article>
        ))}
      </section>

      <section className="overview-quick-links">
        <h3>快捷入口</h3>
        <div className="quick-links-grid">
          {quickLinks.map((link) => (
            <button
              className="quick-link-card"
              key={link.section}
              type="button"
              onClick={() => onSectionChange(link.section)}
            >
              <link.icon size={22} style={{ color: link.color }} />
              <span>{link.label}</span>
            </button>
          ))}
        </div>
      </section>

      <section className="overview-highlights">
        <article className="highlight-card">
          <div className="highlight-header">
            <h4><CheckCircle2 size={16} /> 批改进度</h4>
            <button className="ghost-button compact" type="button" onClick={() => onSectionChange('ai-pipeline')}>
              查看详情
            </button>
          </div>
          {totalJobs === 0 ? (
            <p className="highlight-empty">暂无批改任务</p>
          ) : (
            <div className="highlight-metrics">
              <div className="highlight-metric">
                <strong>{completedJobs}</strong>
                <span>已完成</span>
              </div>
              <div className="highlight-metric">
                <strong>{totalJobs - completedJobs}</strong>
                <span>进行中</span>
              </div>
              <div className="highlight-metric">
                <strong>{totalJobs}</strong>
                <span>总计</span>
              </div>
            </div>
          )}
        </article>

        <article className="highlight-card">
          <div className="highlight-header">
            <h4><FileCheck2 size={16} /> 待复核</h4>
            <button className="ghost-button compact" type="button" onClick={() => onSectionChange('review')}>
              去复核
            </button>
          </div>
          {pendingReview === 0 ? (
            <p className="highlight-empty">暂无待复核报告</p>
          ) : (
            <div className="highlight-metrics">
              <div className="highlight-metric">
                <strong>{pendingReview}</strong>
                <span>待复核</span>
              </div>
              <div className="highlight-metric">
                <strong>{gradingResults.length - pendingReview}</strong>
                <span>已复核</span>
              </div>
              <div className="highlight-metric">
                <strong>{gradingResults.length}</strong>
                <span>总计</span>
              </div>
            </div>
          )}
        </article>

        <article className="highlight-card">
          <div className="highlight-header">
            <h4><Users size={16} /> 提交概况</h4>
            <button className="ghost-button compact" type="button" onClick={() => onSectionChange('collection')}>
              查看详情
            </button>
          </div>
          <div className="highlight-metrics">
            <div className="highlight-metric">
              <strong>{collectionOverview.submitted}</strong>
              <span>已交</span>
            </div>
            <div className="highlight-metric">
              <strong>{collectionOverview.unsubmitted}</strong>
              <span>未交</span>
            </div>
            <div className="highlight-metric">
              <strong>{collectionOverview.lateSubmitted}</strong>
              <span>迟交</span>
            </div>
          </div>
        </article>

        <article className="highlight-card">
          <div className="highlight-header">
            <h4><FileText size={16} /> 当前任务</h4>
            <button className="ghost-button compact" type="button" onClick={() => onSectionChange('assignments')}>
              管理任务
            </button>
          </div>
          {activeAssignments === 0 ? (
            <p className="highlight-empty">暂无进行中的任务</p>
          ) : (
            <div className="highlight-assignments">
              {assignments.filter((a) => a.status === 'PUBLISHED').slice(0, 3).map((a) => (
                <div className="highlight-assignment" key={a.id}>
                  <strong>{a.title}</strong>
                  <span>{a.totalScore} 分</span>
                </div>
              ))}
            </div>
          )}
        </article>
      </section>
    </>
  );
}
