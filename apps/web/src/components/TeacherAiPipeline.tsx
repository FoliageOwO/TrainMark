import { useState, type FormEvent } from 'react';
import { FileText, Plus, Sparkles } from 'lucide-react';
import type { CreateRubricInput } from '../api/httpApi';
import type { AssignmentSummary, GradingJobSummary, OcrJobSummary, RubricSummary, TeachingClassSummary } from '../api/types';
import { toChineseText } from '../utils/displayText';

const gradingStatusText: Record<GradingJobSummary['status'], string> = {
  PENDING: '等待中',
  OCR_RUNNING: '识别中',
  STRUCTURING: '结构化',
  SCORING: '评分中',
  ANNOTATING: '生成批注',
  COMPLETED: '已完成',
  FAILED: '失败',
  RETRYING: '重试中',
};

const ocrStatusText: Record<OcrJobSummary['status'], string> = {
  PENDING: '等待中',
  PREPROCESSING: '预处理',
  RECOGNIZING: '识别中',
  STRUCTURING: '结构化',
  COMPLETED: '已完成',
  FAILED: '失败',
};

const ocrBlockTypeText: Record<OcrJobSummary['blocks'][number]['type'], string> = {
  heading: '标题',
  paragraph: '段落',
  table: '表格',
  image: '图片',
};

type TeacherAiPipelineProps = {
  assignments: AssignmentSummary[];
  classes: TeachingClassSummary[];
  selectedClassId: number;
  selectedAssignmentId: number;
  rubric: RubricSummary | null;
  rubricNotice: string;
  gradingJobs: GradingJobSummary[];
  ocrJobs: OcrJobSummary[];
  actionNotice: string;
  canStartOcr: boolean;
  onCreateRubric: (input: CreateRubricInput) => Promise<void>;
  onSelectClass: (classId: number) => void;
  onSelectAssignment: (assignmentId: number) => void;
  onStartGrading: () => void;
  onStartOcr: () => void;
};

export function TeacherAiPipeline({
  assignments,
  classes,
  selectedClassId,
  selectedAssignmentId,
  rubric,
  rubricNotice,
  gradingJobs,
  ocrJobs,
  actionNotice,
  canStartOcr,
  onCreateRubric,
  onSelectClass,
  onSelectAssignment,
  onStartGrading,
  onStartOcr,
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
      <section className="pipeline-stage-row">
        <article className="pipeline-stage-card">
          <span>评分标准</span>
          <strong>{rubric ? rubric.items.length : 0}</strong>
          <small>{rubric ? '评分项' : '未配置'}</small>
        </article>
        <article className="pipeline-stage-card">
          <span>识别队列</span>
          <strong>{ocrJobs.length}</strong>
          <small>{ocrJobs.filter((job) => job.status !== 'COMPLETED').length} 个处理中</small>
        </article>
        <article className="pipeline-stage-card">
          <span>批改队列</span>
          <strong>{gradingJobs.length}</strong>
          <small>{gradingJobs.filter((job) => job.status !== 'COMPLETED').length} 个处理中</small>
        </article>
      </section>

      <section className="management-grid">
        <article className="panel rubric-panel">
          <div className="panel-heading">
            <div>
              <h3>评分标准</h3>
            </div>
            <button className="ghost-button" type="button" onClick={() => setShowRubricForm((value) => !value)}>
              <Plus size={15} /> 新建标准
            </button>
          </div>
          <label className="file-name-field">
            当前批改任务
            <select
              value={selectedAssignmentId}
              onChange={(event) => onSelectAssignment(Number(event.target.value))}
            >
              {assignments.map((assignment) => (
                <option key={assignment.id} value={assignment.id}>
                  {toChineseText(assignment.title)} · {assignment.status === 'PUBLISHED' ? '已发布' : '草稿'}
                </option>
              ))}
            </select>
          </label>
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
          {showRubricForm && (
            <form className="assignment-create-form" onSubmit={handleSubmitRubric}>
              <label>
                适用任务
                <select name="assignmentId" required defaultValue={selectedAssignmentId || assignments[0]?.id || ''}>
                  {assignments.map((assignment) => (
                    <option key={assignment.id} value={assignment.id}>{toChineseText(assignment.title)}</option>
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
                  <strong>{toChineseText(rubric.name)}</strong>
                  <span>总分 {rubric.totalScore} · {rubric.items.length} 个评分项</span>
                </div>
                <span className="score-chip">可解释评分</span>
              </div>
              <div className="rubric-list">
                {rubric.items.map((item) => (
                  <div className="rubric-row" key={item.id}>
                    <div>
                      <strong>{toChineseText(item.title)}</strong>
                      <span>{item.courseOutcomeCode} · {toChineseText(item.points[0]?.title ?? '待配置得分点')}</span>
                    </div>
                    <b>{item.score} 分</b>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="empty-result">
              <strong>暂无评分标准</strong>
              <span>先为实训任务创建评分标准，再启动智能批改。</span>
            </div>
          )}
        </article>

        <article className="panel ocr-panel">
          <div className="panel-heading">
            <div>
              <h3>文档识别队列</h3>
            </div>
            <button className="ghost-button" type="button" onClick={onStartOcr} disabled={!canStartOcr}>
              <FileText size={15} /> 启动识别
            </button>
          </div>
          <div className="table-shell">
            <div className="table-scroll table-scroll-md">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>任务</th>
                    <th>处理进度</th>
                    <th>状态</th>
                    <th>处理时间</th>
                    <th>识别结果</th>
                  </tr>
                </thead>
                <tbody>
                  {ocrJobs.map((job) => {
                    const progress = ocrProgress(job);
                    return (
                      <tr key={job.id}>
                        <td>
                          <div className="queue-task-cell">
                            <strong>识别任务 #{job.id}</strong>
                            <span>{shortObjectKey(job.objectKey)}</span>
                          </div>
                        </td>
                        <td>
                          <ProgressMeter value={progress} />
                        </td>
                        <td><StatusPill status={job.status}>{ocrStatusText[job.status]}</StatusPill></td>
                        <td>{formatProcessTime(job.createdAt, job.updatedAt, job.status === 'COMPLETED' || job.status === 'FAILED')}</td>
                        <td>
                          <span className="queue-result-text">
                            {job.pageCount} 页 / {job.textBlockCount} 文本 / {job.tableCount} 表格 / {job.confidence}%
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </article>

        <article className="panel grading-panel">
          <div className="panel-heading">
            <div>
              <h3>智能批改队列</h3>
            </div>
            <button className="ghost-button" type="button" onClick={onStartGrading} disabled={!rubric}>
              <Sparkles size={15} /> 启动批改
            </button>
          </div>
          {actionNotice && <div className="inline-success">{actionNotice}</div>}
          <div className="table-shell">
            <div className="table-scroll table-scroll-md">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>任务</th>
                    <th>完成进度</th>
                    <th>状态</th>
                    <th>处理时间</th>
                    <th>置信度</th>
                  </tr>
                </thead>
                <tbody>
                  {gradingJobs.map((job) => {
                    const progress = gradingProgress(job);
                    return (
                      <tr key={job.id}>
                        <td>
                          <div className="queue-task-cell">
                            <strong>批改任务 #{job.id}</strong>
                            <span>{job.completedSubmissions}/{job.totalSubmissions} 份报告</span>
                          </div>
                        </td>
                        <td>
                          <ProgressMeter value={progress} />
                        </td>
                        <td><StatusPill status={job.status}>{gradingStatusText[job.status]}</StatusPill></td>
                        <td>{formatProcessTime(job.startedAt ?? job.createdAt, job.finishedAt ?? job.updatedAt, job.status === 'COMPLETED' || job.status === 'FAILED')}</td>
                        <td>{job.confidence}%</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </article>
      </section>

      <section className="management-grid">
        <article className="panel ocr-panel span-two">
          <div className="panel-heading">
            <div>
              <h3>结构识别结果</h3>
            </div>
            <span className="status-pill">最新任务</span>
          </div>
          <div className="table-shell">
            <div className="table-scroll table-scroll-md">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>标题</th>
                    <th>类型</th>
                    <th>页码</th>
                    <th>置信度</th>
                  </tr>
                </thead>
                <tbody>
                  {ocrJobs[0]?.blocks.map((block) => (
                    <tr key={`${block.type}-${block.page}-${block.title}`}>
                      <td>{toChineseText(block.title)}</td>
                      <td>{ocrBlockTypeText[block.type]}</td>
                      <td>第 {block.page} 页</td>
                      <td>{block.confidence}%</td>
                    </tr>
                  )) ?? null}
                </tbody>
              </table>
            </div>
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

function ProgressMeter({ value }: { value: number }) {
  const safeValue = Math.max(0, Math.min(100, Math.round(value)));
  return (
    <div className="queue-progress" aria-label={`处理进度 ${safeValue}%`}>
      <div className="queue-progress-track">
        <span style={{ width: `${safeValue}%` }} />
      </div>
      <b>{safeValue}%</b>
    </div>
  );
}

function StatusPill({ status, children }: { status: string; children: string }) {
  return <span className={`queue-status queue-status-${status.toLowerCase().replace(/_/g, '-')}`}>{children}</span>;
}

function gradingProgress(job: GradingJobSummary) {
  if (job.status === 'COMPLETED') {
    return 100;
  }
  if (job.status === 'FAILED') {
    return Math.max(0, Math.round((job.completedSubmissions / Math.max(job.totalSubmissions, 1)) * 100));
  }
  const base = Math.round((job.completedSubmissions / Math.max(job.totalSubmissions, 1)) * 100);
  const statusFloor: Record<GradingJobSummary['status'], number> = {
    PENDING: 5,
    OCR_RUNNING: 20,
    STRUCTURING: 40,
    SCORING: 65,
    ANNOTATING: 85,
    RETRYING: 50,
    COMPLETED: 100,
    FAILED: base,
  };
  return Math.max(base, statusFloor[job.status]);
}

function ocrProgress(job: OcrJobSummary) {
  const statusValue: Record<OcrJobSummary['status'], number> = {
    PENDING: 8,
    PREPROCESSING: 25,
    RECOGNIZING: 60,
    STRUCTURING: 85,
    COMPLETED: 100,
    FAILED: 100,
  };
  return statusValue[job.status];
}

function formatProcessTime(start?: string | null, end?: string | null, isFinished = false) {
  if (!start) {
    return '尚未开始';
  }
  const startText = formatDateTime(start);
  if (!end || end === start) {
    return isFinished ? `完成：${startText}` : `开始：${startText}`;
  }
  const endText = formatDateTime(end);
  return isFinished ? `开始：${startText} / 完成：${endText}` : `开始：${startText} / 更新：${endText}`;
}

function formatDateTime(value: string) {
  const timestamp = Date.parse(value);
  if (Number.isNaN(timestamp)) {
    return '时间未知';
  }
  return new Intl.DateTimeFormat('zh-CN', {
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  }).format(new Date(timestamp));
}

function shortObjectKey(value: string) {
  const fileName = value.split(/[\\/]/).filter(Boolean).at(-1) ?? value;
  return toChineseText(fileName);
}
