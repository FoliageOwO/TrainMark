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

  return (
    <section className="management-grid">
      <article className="panel similarity-panel">
        <div className="panel-heading">
          <div>
            <h3>查重检测</h3>
          </div>
          <button className="ghost-button" type="button" onClick={onStartSimilarity}>
            <ShieldCheck size={15} /> 启动查重
          </button>
        </div>
        <label className="file-name-field section-filter-field">
          当前班级
          <select value={selectedClassId} onChange={(event) => onSelectClass(Number(event.target.value))}>
            <option value={0}>全部班级</option>
            {classes.map((teachingClass) => (
              <option key={teachingClass.id} value={teachingClass.id}>
                {teachingClass.name}
              </option>
            ))}
          </select>
        </label>
        <div className="table-shell">
          <div className="table-scroll table-scroll-lg">
            <table className="data-table">
              <thead>
                <tr>
                  <th>任务</th>
                  <th>学生对</th>
                  <th>命中片段</th>
                  <th>相似度</th>
                  <th>风险</th>
                </tr>
              </thead>
              <tbody>
                {matchRows.map((match) => (
                  <tr key={`${match.jobId}-${match.sourceSubmissionId}-${match.targetSubmissionId}`}>
                    <td>#{match.jobId}</td>
                    <td>{match.sourceStudentName} / {match.targetStudentName}</td>
                    <td>{toChineseText(match.matchedSection)}</td>
                    <td>{Math.round(match.similarity * 100)}%</td>
                    <td>{match.riskLevel}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </article>
    </section>
  );
}
