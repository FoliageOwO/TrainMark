import { useState, type FormEvent } from 'react';
import { CalendarClock, FileText, Plus } from 'lucide-react';
import type { CreateAssignmentInput } from '../api/httpApi';
import type { AssignmentSummary, TeachingClassSummary } from '../api/types';
import { formatDate } from '../utils/formatDate';

const statusText = {
  ACTIVE: '进行中',
  DRAFT: '草稿',
  ARCHIVED: '已归档',
  PUBLISHED: '已发布',
  CLOSED: '已截止',
};

type TeacherAssignmentPanelProps = {
  assignments: AssignmentSummary[];
  classes: TeachingClassSummary[];
  selectedAssignmentId: number;
  selectedCourseId: number;
  selectedCourseName: string;
  assignmentNotice: string;
  onCreateAssignment: (input: CreateAssignmentInput) => Promise<void>;
  onPublishAssignment: (assignmentId: number) => Promise<void>;
  onSelectAssignment: (assignmentId: number) => void;
};

export function TeacherAssignmentPanel({
  assignments,
  classes,
  selectedAssignmentId,
  selectedCourseId,
  selectedCourseName,
  assignmentNotice,
  onCreateAssignment,
  onPublishAssignment,
  onSelectAssignment,
}: TeacherAssignmentPanelProps) {
  const [showForm, setShowForm] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [publishingId, setPublishingId] = useState<number | null>(null);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const title = String(formData.get('title') ?? '').trim();
    const deadline = String(formData.get('deadline') ?? '');
    const totalScore = Number(formData.get('totalScore') ?? 100);
    if (!title || !deadline) {
      return;
    }

    setIsCreating(true);
    try {
      await onCreateAssignment({
        courseId: selectedCourseId,
        title,
        description: String(formData.get('description') ?? ''),
        deadline: new Date(deadline).toISOString(),
        totalScore,
        classIds: classes.map((item) => item.id),
        similarityCheckEnabled: formData.get('similarityCheckEnabled') === 'on',
        aiGradingEnabled: formData.get('aiGradingEnabled') === 'on',
      });
      event.currentTarget.reset();
      setShowForm(false);
    } finally {
      setIsCreating(false);
    }
  };

  const handlePublish = async (assignmentId: number) => {
    setPublishingId(assignmentId);
    try {
      await onPublishAssignment(assignmentId);
    } finally {
      setPublishingId(null);
    }
  };

  return (
    <article className="panel">
      <div className="panel-heading">
        <div>
          <h3>实训任务</h3>
          <p className="panel-subtitle">{selectedCourseName}</p>
        </div>
        <button className="ghost-button" type="button" onClick={() => setShowForm((v) => !v)}>
          <Plus size={15} /> 创建任务
        </button>
      </div>

      {showForm && (
        <form className="assignment-create-form" onSubmit={handleSubmit}>
          <label>
            任务标题
            <input name="title" required defaultValue={`${selectedCourseName}阶段报告`} />
          </label>
          <label>
            截止时间
            <input name="deadline" required type="datetime-local" defaultValue={defaultDeadlineValue()} />
          </label>
          <label>
            总分
            <input name="totalScore" min="1" max="1000" required type="number" defaultValue="100" />
          </label>
          <label className="wide-field">
            任务说明
            <textarea name="description" rows={3} defaultValue="提交完整实训报告，包含需求分析、系统设计、核心实现、运行截图和总结。" />
          </label>
          <div className="assignment-toggle-row">
            <label><input name="aiGradingEnabled" type="checkbox" defaultChecked /> AI 批改</label>
            <label><input name="similarityCheckEnabled" type="checkbox" defaultChecked /> 查重检测</label>
          </div>
          <button className="primary-button" type="submit" disabled={isCreating}>
            {isCreating ? '创建中...' : '保存任务'}
          </button>
        </form>
      )}
      {assignmentNotice && <div className="inline-success">{assignmentNotice}</div>}

      {assignments.length === 0 ? (
        <div className="empty-state">
          <FileText size={32} />
          <p>暂无实训任务</p>
          <span>点击右上角"创建任务"开始配置</span>
        </div>
      ) : (
        <div className="table-shell">
          <div className="table-scroll table-scroll-lg">
            <table className="data-table">
              <thead>
                <tr>
                  <th>任务</th>
                  <th>截止时间</th>
                  <th>分值</th>
                  <th>批改方式</th>
                  <th>查重</th>
                  <th>状态</th>
                  <th className="actions-col">操作</th>
                </tr>
              </thead>
              <tbody>
                {assignments.map((item) => (
                  <tr className={selectedAssignmentId === item.id ? 'is-selected' : ''} key={item.id}>
                    <td>
                      <div className="table-primary">
                        <strong>{item.title}</strong>
                        <span>{selectedAssignmentId === item.id ? '当前任务' : `任务 #${item.id}`}</span>
                      </div>
                    </td>
                    <td>
                      <span className="table-inline"><CalendarClock size={14} /> {formatDate(item.deadline)}</span>
                    </td>
                    <td>{item.totalScore} 分</td>
                    <td>{item.aiGradingEnabled ? 'AI 批改' : '人工批改'}</td>
                    <td>{item.similarityCheckEnabled ? '开启' : '关闭'}</td>
                    <td>
                      <span className={`status-badge status-${item.status.toLowerCase()}`}>{statusText[item.status]}</span>
                    </td>
                    <td>
                      <div className="table-actions">
                        <button
                          className="ghost-button compact"
                          type="button"
                          onClick={() => onSelectAssignment(item.id)}
                        >
                          {selectedAssignmentId === item.id ? '当前任务' : '设为当前'}
                        </button>
                        {item.status === 'DRAFT' && (
                          <button
                            className="primary-button compact"
                            type="button"
                            onClick={() => handlePublish(item.id)}
                            disabled={publishingId === item.id}
                          >
                            {publishingId === item.id ? '发布中...' : '发布任务'}
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </article>
  );
}

function defaultDeadlineValue() {
  const value = new Date();
  value.setDate(value.getDate() + 7);
  value.setHours(23, 59, 0, 0);
  return value.toISOString().slice(0, 16);
}
