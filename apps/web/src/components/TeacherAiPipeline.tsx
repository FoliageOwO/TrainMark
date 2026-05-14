import { FileText, Plus, Sparkles } from 'lucide-react';
import type { GradingJobSummary, OcrJobSummary, RubricSummary } from '../api/types';

const gradingStatusText = {
  PENDING: '等待中',
  OCR_RUNNING: 'OCR中',
  STRUCTURING: '结构化',
  SCORING: '评分中',
  ANNOTATING: '生成批注',
  COMPLETED: '已完成',
  FAILED: '失败',
  RETRYING: '重试中',
};

const ocrStatusText = {
  PENDING: '等待中',
  PREPROCESSING: '预处理',
  RECOGNIZING: '识别中',
  STRUCTURING: '结构化',
  COMPLETED: '已完成',
  FAILED: '失败',
};

type TeacherAiPipelineProps = {
  rubric: RubricSummary;
  gradingJobs: GradingJobSummary[];
  ocrJobs: OcrJobSummary[];
  onStartGrading: () => void;
};

export function TeacherAiPipeline({ rubric, gradingJobs, ocrJobs, onStartGrading }: TeacherAiPipelineProps) {
  return (
    <>
      <section className="management-grid">
        <article className="panel rubric-panel">
          <div className="panel-heading">
            <div>
              <p className="eyebrow">Rubric</p>
              <h3>评分标准</h3>
            </div>
            <button className="ghost-button" type="button"><Plus size={15} /> 编辑标准</button>
          </div>
          <div className="rubric-summary">
            <div>
              <strong>{rubric.name}</strong>
              <span>总分 {rubric.totalScore} · {rubric.items.length} 个评分项</span>
            </div>
            <span className="score-chip">可解释评分</span>
          </div>
          <div className="rubric-list">
            {rubric.items.map((item) => (
              <div className="rubric-row" key={item.id}>
                <div>
                  <strong>{item.title}</strong>
                  <span>{item.courseOutcomeCode} · {item.points[0]?.title ?? '待配置得分点'}</span>
                </div>
                <b>{item.score} 分</b>
              </div>
            ))}
          </div>
        </article>

        <article className="panel grading-panel">
          <div className="panel-heading">
            <div>
              <p className="eyebrow">AI Grading</p>
              <h3>批改队列</h3>
            </div>
            <button className="ghost-button" type="button" onClick={onStartGrading}>
              <Sparkles size={15} /> 启动批改
            </button>
          </div>
          <div className="grading-job-list">
            {gradingJobs.map((job) => {
              const progress = job.totalSubmissions === 0 ? 0 : Math.round((job.completedSubmissions / job.totalSubmissions) * 100);
              return (
                <div className="grading-job-card" key={job.id}>
                  <div className="assignment-title">
                    <Sparkles size={18} />
                    <strong>批改任务 #{job.id}</strong>
                  </div>
                  <div className="assignment-meta">
                    <span>{job.completedSubmissions}/{job.totalSubmissions} 份完成</span>
                    <span className="status-pill">{gradingStatusText[job.status]}</span>
                    <span>置信度 {job.confidence}%</span>
                  </div>
                  <div className="upload-progress"><span style={{ width: `${progress}%` }} /></div>
                </div>
              );
            })}
          </div>
        </article>
      </section>

      <section className="management-grid">
        <article className="panel ocr-panel">
          <div className="panel-heading">
            <div>
              <p className="eyebrow">OCR Pipeline</p>
              <h3>文档识别与结构化</h3>
            </div>
            <span className="status-pill">PaddleOCR</span>
          </div>
          <div className="ocr-job-list">
            {ocrJobs.map((job) => (
              <div className="ocr-job-card" key={job.id}>
                <div className="assignment-title">
                  <FileText size={18} />
                  <strong>OCR 任务 #{job.id}</strong>
                </div>
                <div className="assignment-meta">
                  <span>{job.pageCount} 页</span>
                  <span>{job.textBlockCount} 文本块</span>
                  <span>{job.tableCount} 表格</span>
                  <span className="status-pill">{ocrStatusText[job.status]}</span>
                </div>
                <div className="ocr-confidence">
                  <span>识别置信度</span>
                  <strong>{job.confidence}%</strong>
                </div>
              </div>
            ))}
          </div>
        </article>

        <article className="panel ocr-panel">
          <div className="panel-heading">
            <div>
              <p className="eyebrow">Structured Blocks</p>
              <h3>结构识别结果</h3>
            </div>
            <span className="status-pill">可用于评分</span>
          </div>
          <div className="ocr-block-list">
            {ocrJobs[0]?.blocks.map((block) => (
              <div className="ocr-block-row" key={`${block.type}-${block.page}-${block.title}`}>
                <div>
                  <strong>{block.title}</strong>
                  <span>{block.type} · 第 {block.page} 页</span>
                </div>
                <b>{block.confidence}%</b>
              </div>
            ))}
          </div>
        </article>
      </section>
    </>
  );
}
