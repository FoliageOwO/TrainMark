import { useState, type FormEvent } from 'react';
import { Plus, Users, X } from 'lucide-react';
import type { CourseSummary, TeachingClassSummary } from '../api/types';
import type { CreateCourseInput } from '../api/httpApi';

const statusText = {
  ACTIVE: '进行中',
  DRAFT: '草稿',
  ARCHIVED: '已归档',
  PUBLISHED: '已发布',
  CLOSED: '已截止',
};

type TeacherCoursePanelProps = {
  classes: TeachingClassSummary[];
  courses: CourseSummary[];
  selectedCourseId: number;
  courseNotice?: string;
  onCreateCourse: (input: CreateCourseInput) => void | Promise<void>;
  onSelectCourse: (courseId: number) => void;
};

export function TeacherCoursePanel({
  classes,
  courses,
  selectedCourseId,
  courseNotice,
  onCreateCourse,
  onSelectCourse,
}: TeacherCoursePanelProps) {
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [formState, setFormState] = useState({
    name: '',
    code: '',
    semester: '2025-2026-2',
    description: '',
  });
  const [submitError, setSubmitError] = useState('');

  const submitCourse = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitError('');
    if (!formState.name.trim() || !formState.code.trim() || !formState.semester.trim()) {
      setSubmitError('请填写课程名称、课程代码和学期。');
      return;
    }
    try {
      await onCreateCourse({
        name: formState.name.trim(),
        code: formState.code.trim(),
        semester: formState.semester.trim(),
        description: formState.description.trim() || undefined,
      });
      setFormState({
        name: '',
        code: '',
        semester: formState.semester,
        description: '',
      });
      setShowCreateForm(false);
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : '新建课程失败，请稍后重试。');
    }
  };

  return (
    <article className="panel">
      <div className="panel-heading">
        <div>
          <h3>课程与班级</h3>
        </div>
        <button className="ghost-button" type="button" onClick={() => setShowCreateForm((value) => !value)}>
          {showCreateForm ? <X size={15} /> : <Plus size={15} />}
          {showCreateForm ? '收起表单' : '新建课程'}
        </button>
      </div>
      {courseNotice ? <div className="inline-success">{courseNotice}</div> : null}
      {showCreateForm ? (
        <form className="assignment-create-form course-create-form" onSubmit={submitCourse}>
          <label>
            课程名称
            <input
              value={formState.name}
              onChange={(event) => setFormState((current) => ({ ...current, name: event.target.value }))}
              placeholder="例如：数据库设计实训"
            />
          </label>
          <label>
            课程代码
            <input
              value={formState.code}
              onChange={(event) => setFormState((current) => ({ ...current, code: event.target.value }))}
              placeholder="例如：DB-DESIGN-2026"
            />
          </label>
          <label>
            学期
            <input
              value={formState.semester}
              onChange={(event) => setFormState((current) => ({ ...current, semester: event.target.value }))}
              placeholder="例如：2025-2026-2"
            />
          </label>
          <label className="wide-field">
            课程说明
            <textarea
              rows={3}
              value={formState.description}
              onChange={(event) => setFormState((current) => ({ ...current, description: event.target.value }))}
              placeholder="可选，填写课程目标或实训说明"
            />
          </label>
          {submitError ? <div className="inline-error">{submitError}</div> : null}
          <button className="primary-button" type="submit">保存课程</button>
        </form>
      ) : null}

      <section className="management-grid">
        <div className="table-shell">
          <div className="table-scroll table-scroll-md">
            <table className="data-table">
              <thead>
                <tr>
                  <th>课程</th>
                  <th>学期</th>
                  <th>班级</th>
                  <th>学生</th>
                  <th>状态</th>
                </tr>
              </thead>
              <tbody>
                {courses.map((course) => (
                  <tr
                    className={selectedCourseId === course.id ? 'is-selected is-clickable' : 'is-clickable'}
                    key={course.id}
                    onClick={() => onSelectCourse(course.id)}
                  >
                    <td>
                      <div className="table-primary">
                        <strong>{course.name}</strong>
                        <span>{course.code}</span>
                      </div>
                    </td>
                    <td>{course.semester}</td>
                    <td>{course.classCount}</td>
                    <td>{course.studentCount}</td>
                    <td>{statusText[course.status]}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {classes.length === 0 ? (
          <div className="empty-state">
            <Users size={32} />
            <p>暂无班级</p>
            <span>导入学生名单时会自动创建班级</span>
          </div>
        ) : (
          <div className="table-shell">
            <div className="table-scroll table-scroll-md">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>班级</th>
                    <th>专业</th>
                    <th>年级</th>
                    <th>人数</th>
                  </tr>
                </thead>
                <tbody>
                  {classes.map((item) => (
                    <tr key={item.id}>
                      <td>{item.name}</td>
                      <td>{item.major}</td>
                      <td>{item.grade}级</td>
                      <td>{item.studentCount}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </section>
    </article>
  );
}
