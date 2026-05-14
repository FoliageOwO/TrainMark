import { useState, type FormEvent } from 'react';
import { FileText, Plus, Sparkles } from 'lucide-react';
import type { CreateRubricInput } from '../api/httpApi';
import type { AssignmentSummary, GradingJobSummary, OcrJobSummary, RubricSummary } from '../api/types';

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
  assignments: AssignmentSummary[];
  rubric: RubricSummary | null;
  rubricNotice: string;
  gradingJobs: GradingJobSummary[];
  ocrJobs: OcrJobSummary[];
  onCreateRubric: (input: CreateRubricInput) => Promise<void>;
  onStartGrading: () => void;
};

export function TeacherAiPipeline({
  assignments,
  rubric,
  rubricNotice,
  gradingJobs,
  ocrJobs,
  onCreateRubric,
  onStartGrading,
}: TeacherAiPipelineProps) {
  const [showRubricForm, setShowRubricForm] = useState(false);
  const [isCreatingRubric, setIsCreatingRubric] = useState(false);

  const handleSubmitRubric = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const assignmentId = Number(formData.get('assignmentId'));
    const name = String(formData.get('name') ?? '').trim();
    const totalScore = Number(formData.get('totalScore') ?? 100);
    if (!assignmentId || !name) {
      return;
    }

    setIsCreatingRubric(true);
    try {
      await onCreateRubric({
        assignmentId,
        name,
        totalScore,
        items: buildRubricItems(formData),
      });
      event.currentTarget.reset();
      setShowRubricForm(false);
    } finally {
      setIsCreatingRubric(false);
    }
  };

  return (
    <>
      <section className="management-grid">
        <article className="panel rubric-panel">
          <div className="panel-heading">
            <div>
              <p className="eyebrow">Rubric</p>
              <h3>评分标准</h3>
            </div>
            <button className="ghost-button" type="button" onClick={() => setShowRubricForm((value) => !value)}>
              <Plus size={15} /> 新建标准
            </button>
          </div>
          {showRubricForm && (
            <form className="assignment-create-form" onSubmit={handleSubmitRubric}>
              <label>
                适用任务
                <select name="assignmentId" required defaultValue={assignments[0]?.id ?? ''}>
                  {assignments.map((assignment) => (
                    <option key={assignment.id} value={assignment.id}>{assignment.title}</option>
                  ))}
                </select>
              </label>
              <label>
                标准名称
                <input name="name" required defaultValue="实训报告评分标准" />
              </label>
              <label>
                总分
                <input name="totalScore" min="1" max="1000" required type="number" defaultValue="100" />
              </label>
              <label>
                评分项一
                <input name="item1Title" required defaultValue="需求与设计" />
              </label>
              <label>
                分值
                <input name="item1Score" min="1" required type="number" defaultValue="20" />
              </label>
              <label>
                关键词
                <input name="item1Keywords" defaultValue="需求,设计,ER图,约束" />
              </label>
              <label>
                评分项二
                <input name="item2Title" required defaultValue="系统实现" />
              </label>
              <label>
                分值
                <input name="item2Score" min="1" required type="number" defaultValue="50" />
              </label>
              <label>
                关键词
                <input name="item2Keywords" defaultValue="功能,接口,权限,异常" />
              </label>
              <label>
                评分项三
                <input name="item3Title" required defaultValue="报告规范" />
              </label>
              <label>
                分值
                <input name="item3Score" min="1" required type="number" defaultValue="30" />
              </label>
              <label>
                关键词
                <input name="item3Keywords" defaultValue="截图,总结,目录,格式" />
              </label>
              <button className="primary-button" type="submit" disabled={isCreatingRubric || assignments.length === 0}>
                {isCreatingRubric ? '保存中...' : '保存评分标准'}
              </button>
            </form>
          )}
          {rubricNotice && <div className="inline-success">{rubricNotice}</div>}
          {rubric ? (
            <>
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
            </>
          ) : (
            <div className="empty-result">
              <strong>暂无评分标准</strong>
              <span>先为实训任务创建评分标准，再启动 AI 批改。</span>
            </div>
          )}
        </article>

        <article className="panel grading-panel">
          <div className="panel-heading">
            <div>
              <p className="eyebrow">AI Grading</p>
              <h3>批改队列</h3>
            </div>
            <button className="ghost-button" type="button" onClick={onStartGrading} disabled={!rubric}>
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

function buildRubricItems(formData: FormData): CreateRubricInput['items'] {
  return [1, 2, 3].map((index) => {
    const title = String(formData.get(`item${index}Title`) ?? '').trim();
    const score = Number(formData.get(`item${index}Score`) ?? 1);
    const keywords = splitKeywords(String(formData.get(`item${index}Keywords`) ?? ''));
    return {
      title,
      score,
      courseOutcomeCode: `CO${index}`,
      points: [{
        title: `${title}关键点`,
        description: `围绕${title}的完整性、准确性和证据进行评分。`,
        score,
        keywords,
        synonyms: [],
      }],
    };
  });
}

function splitKeywords(value: string) {
  return value
    .split(/[,，]/)
    .map((item) => item.trim())
    .filter(Boolean);
}
