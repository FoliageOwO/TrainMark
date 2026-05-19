import type { ComponentProps } from 'react';
import { TeacherAiPipeline } from './TeacherAiPipeline';
import { TeacherAnalyticsPanel } from './TeacherAnalyticsPanel';
import { TeacherAppealPanel } from './TeacherAppealPanel';
import { TeacherCollectionPanel } from './TeacherCollectionPanel';
import { TeacherCoursePanel } from './TeacherCoursePanel';
import { TeacherOperationsPanel } from './TeacherOperationsPanel';
import { TeacherRosterPanel } from './TeacherRosterPanel';
import { TeacherReviewWorkspace } from './TeacherReviewWorkspace';
import { TeacherSimilarityPanel } from './TeacherSimilarityPanel';

type TeacherOverviewDashboardProps = {
  aiPipeline: ComponentProps<typeof TeacherAiPipeline>;
  analytics: ComponentProps<typeof TeacherAnalyticsPanel>;
  appeals: ComponentProps<typeof TeacherAppealPanel>;
  collection: ComponentProps<typeof TeacherCollectionPanel>;
  courses: ComponentProps<typeof TeacherCoursePanel>;
  roster: ComponentProps<typeof TeacherRosterPanel>;
  review: ComponentProps<typeof TeacherReviewWorkspace> | null;
  similarity: ComponentProps<typeof TeacherSimilarityPanel>;
};

export function TeacherOverviewDashboard({
  aiPipeline,
  analytics,
  appeals,
  collection,
  courses,
  roster,
  review,
  similarity,
}: TeacherOverviewDashboardProps) {
  return (
    <>
      <TeacherCollectionPanel {...collection} />
      <TeacherAiPipeline {...aiPipeline} />
      <TeacherSimilarityPanel {...similarity} />
      {review ? <TeacherReviewWorkspace {...review} /> : <TeacherReviewEmptyState />}
      <TeacherAnalyticsPanel {...analytics} />
      <TeacherAppealPanel {...appeals} />
      <TeacherRosterPanel {...roster} />
      <TeacherOperationsPanel />
      <TeacherCoursePanel {...courses} />
    </>
  );
}

function TeacherReviewEmptyState() {
  return (
    <section className="review-layout">
      <article className="panel wide-panel">
        <div className="panel-heading">
          <div>
            <p className="eyebrow">Manual Review</p>
            <h3>人工复核工作区</h3>
          </div>
          <span className="status-pill">暂无结果</span>
        </div>
        <div className="empty-result">
          <strong>暂无复核结果</strong>
          <span>当前作业还没有可复核的批改结果。启动 AI 批改后，结果会出现在这里。</span>
        </div>
      </article>
    </section>
  );
}
