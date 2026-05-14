import { useState, type FormEvent } from 'react';
import { CalendarClock, FileText, Plus } from 'lucide-react';
import type { CreateAssignmentInput } from '../api/httpApi';
import type { AssignmentSummary, CourseSummary, TeachingClassSummary } from '../api/types';
import { formatDate } from '../utils/formatDate';

const statusText = {
  ACTIVE: '进行中',
  DRAFT: '草稿',
  ARCHIVED: '已归档',
  PUBLISHED: '已发布',
  CLOSED: '已截止',
};

type TeacherCoursePanelProps = {
  assignments: AssignmentSummary[];
  classes: TeachingClassSummary[];
  courses: CourseSummary[];
  selectedCourse: CourseSummary;
  selectedCourseId: number;
  stats: Array<{ label: string; value: string; trend: string; tone: string }>;
  assignmentNotice: string;
  onCreateAssignment: (input: CreateAssignmentInput) => Promise<void>;
  onSelectCourse: (courseId: number) => void;
};

export function TeacherCoursePanel({
  assignments,
  classes,
  courses,
  selectedCourse,
  selectedCourseId,
  stats,
  assignmentNotice,
  onCreateAssignment,
  onSelectCourse,
}: TeacherCoursePanelProps) {
  const [showAssignmentForm, setShowAssignmentForm] = useState(false);
  const [isCreatingAssignment, setIsCreatingAssignment] = useState(false);

  const handleSubmitAssignment = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const title = String(formData.get('title') ?? '').trim();
    const deadline = String(formData.get('deadline') ?? '');
    const totalScore = Number(formData.get('totalScore') ?? 100);
    if (!title || !deadline) {
      return;
    }

    setIsCreatingAssignment(true);
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
      setShowAssignmentForm(false);
    } finally {
      setIsCreatingAssignment(false);
    }
  };

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

      <section className="management-grid">
        <article className="panel course-panel">
          <div className="panel-heading">
            <div>
              <p className="eyebrow">Courses</p>
              <h3>课程与班级</h3>
            </div>
            <button className="ghost-button" type="button"><Plus size={15} /> 新建课程</button>
          </div>
          <div className="course-tabs">
            {courses.map((course) => (
              <button
                className={selectedCourseId === course.id ? 'selected' : ''}
                key={course.id}
                type="button"
                onClick={() => onSelectCourse(course.id)}
              >
                <strong>{course.name}</strong>
                <span>{course.code}</span>
              </button>
            ))}
          </div>
          <div className="course-summary-card">
            <div>
              <p className="eyebrow">当前课程</p>
              <h3>{selectedCourse.name}</h3>
              <span>{selectedCourse.semester} · {statusText[selectedCourse.status]}</span>
            </div>
            <div className="summary-metrics">
              <span>{selectedCourse.classCount} 个班级</span>
              <span>{selectedCourse.studentCount} 名学生</span>
            </div>
          </div>
          <div className="class-list">
            {classes.map((item) => (
              <div className="class-row" key={item.id}>
                <div>
                  <strong>{item.name}</strong>
                  <span>{item.major} · {item.grade}级</span>
                </div>
                <span>{item.studentCount} 人</span>
              </div>
            ))}
          </div>
        </article>

        <article className="panel assignment-panel">
          <div className="panel-heading">
            <div>
              <p className="eyebrow">Assignments</p>
              <h3>实训任务</h3>
            </div>
            <button className="ghost-button" type="button" onClick={() => setShowAssignmentForm((value) => !value)}>
              <Plus size={15} /> 创建任务
            </button>
          </div>
          {showAssignmentForm && (
            <form className="assignment-create-form" onSubmit={handleSubmitAssignment}>
              <label>
                任务标题
                <input name="title" required defaultValue={`${selectedCourse.name}阶段报告`} />
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
              <button className="primary-button" type="submit" disabled={isCreatingAssignment}>
                {isCreatingAssignment ? '创建中...' : '保存任务'}
              </button>
            </form>
          )}
          {assignmentNotice && <div className="inline-success">{assignmentNotice}</div>}
          <div className="assignment-list">
            {assignments.map((item) => (
              <div className="assignment-card" key={item.id}>
                <div className="assignment-title">
                  <FileText size={18} />
                  <strong>{item.title}</strong>
                </div>
                <div className="assignment-meta">
                  <span><CalendarClock size={14} /> {formatDate(item.deadline)}</span>
                  <span>{item.totalScore} 分</span>
                  <span className="status-pill">{statusText[item.status]}</span>
                </div>
                <div className="assignment-flags">
                  <span>{item.aiGradingEnabled ? 'AI 批改开启' : '人工批改'}</span>
                  <span>{item.similarityCheckEnabled ? '查重开启' : '查重关闭'}</span>
                </div>
              </div>
            ))}
          </div>
        </article>
      </section>
    </>
  );
}

function defaultDeadlineValue() {
  const value = new Date();
  value.setDate(value.getDate() + 7);
  value.setHours(23, 59, 0, 0);
  return value.toISOString().slice(0, 16);
}
