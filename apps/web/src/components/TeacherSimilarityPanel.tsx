import { ShieldCheck } from 'lucide-react';
import type { SimilarityJobSummary } from '../api/types';
import { toChineseText } from '../utils/displayText';

type TeacherSimilarityPanelProps = {
  similarityJobs: SimilarityJobSummary[];
  onStartSimilarity: () => void;
};

export function TeacherSimilarityPanel({ similarityJobs, onStartSimilarity }: TeacherSimilarityPanelProps) {
  return (
    <section className="management-grid">
      <article className="panel similarity-panel">
        <div className="panel-heading">
          <div>
            <p className="eyebrow">相似度检测</p>
            <h3>查重检测</h3>
          </div>
          <button className="ghost-button" type="button" onClick={onStartSimilarity}>
            <ShieldCheck size={15} /> 启动查重
          </button>
        </div>
        <div className="similarity-job-list">
          {similarityJobs.map((job) => (
            <div className="similarity-card" key={job.id}>
              <div className="similarity-summary">
                <strong>查重任务 #{job.id}</strong>
                <span>{job.checkedSubmissionCount} 份 · 最高相似度 {Math.round(job.maxSimilarity * 100)}% · 高风险 {job.highRiskPairCount} 组</span>
              </div>
              <div className="similarity-match-list">
                {job.matches.map((match) => (
                  <div className={`similarity-match ${match.riskLevel.toLowerCase()}`} key={`${job.id}-${match.sourceSubmissionId}-${match.targetSubmissionId}`}>
                    <div>
                      <strong>{match.sourceStudentName} / {match.targetStudentName}</strong>
                      <span>{toChineseText(match.matchedSection)}</span>
                    </div>
                    <b>{Math.round(match.similarity * 100)}%</b>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </article>
    </section>
  );
}
