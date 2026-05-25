import { useState, type FormEvent, type MouseEvent } from 'react';
import { Plus, Trash2, UploadCloud, Users, X } from 'lucide-react';
import type { CourseSummary, StudentImportResult, StudentImportRow, TeachingClassSummary } from '../api/types';
import type { CreateCourseInput, CreateTeachingClassInput, ImportStudentsInput } from '../api/httpApi';

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
  importResult: StudentImportResult | null;
  onCreateCourse: (input: CreateCourseInput) => void | Promise<void>;
  onCreateClass: (input: CreateTeachingClassInput) => Promise<TeachingClassSummary>;
  onDeleteClass: (courseId: number, classId: number) => Promise<void>;
  onImportStudents: (input: ImportStudentsInput) => Promise<StudentImportResult>;
  onSelectCourse: (courseId: number) => void;
};

const sampleRows = `2024010198,陈一,chenyi@trainmark.local,13800000001
2024010199,周二,zhouer@trainmark.local,13800000002`;

export function TeacherCoursePanel({
  classes,
  courses,
  selectedCourseId,
  courseNotice,
  importResult,
  onCreateCourse,
  onCreateClass,
  onDeleteClass,
  onImportStudents,
  onSelectCourse,
}: TeacherCoursePanelProps) {
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [showClassForm, setShowClassForm] = useState(false);
  const [formState, setFormState] = useState({
    name: '',
    code: '',
    semester: '2025-2026-2',
    description: '',
  });
  const [classFormState, setClassFormState] = useState({
    name: '',
    major: '',
    grade: '2024',
  });
  const [selectedClassId, setSelectedClassId] = useState(0);
  const [submitError, setSubmitError] = useState('');
  const [classSubmitError, setClassSubmitError] = useState('');
  const [classDeleteError, setClassDeleteError] = useState('');
  const [importError, setImportError] = useState('');
  const [classNotice, setClassNotice] = useState('');
  const [importNotice, setImportNotice] = useState('');
  const selectedClass = classes.find((item) => item.id === selectedClassId) ?? null;
  const activeClassId = selectedClass?.id ?? 0;

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

  const submitClass = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setClassSubmitError('');
    setClassDeleteError('');
    setClassNotice('');
    if (!classFormState.name.trim()) {
      setClassSubmitError('请填写班级名称。');
      return;
    }
    try {
      const teachingClass = await onCreateClass({
        courseId: selectedCourseId,
        name: classFormState.name.trim(),
        major: classFormState.major.trim() || undefined,
        grade: classFormState.grade.trim() || undefined,
      });
      setSelectedClassId(teachingClass.id);
      setClassNotice(`已新建班级：${teachingClass.name}`);
      setClassFormState({
        name: '',
        major: '',
        grade: classFormState.grade,
      });
      setShowClassForm(false);
    } catch (error) {
      setClassSubmitError(error instanceof Error ? error.message : '新建班级失败，请稍后重试。');
    }
  };

  const deleteClass = async (event: MouseEvent<HTMLButtonElement>, teachingClass: TeachingClassSummary) => {
    event.stopPropagation();
    setClassDeleteError('');
    const confirmed = window.confirm(
      `确定删除班级“${teachingClass.name}”吗？\n\n只会移除这个班级及其课程/任务关联，不会删除学生账号。`,
    );
    if (!confirmed) {
      return;
    }
    try {
      await onDeleteClass(teachingClass.courseId, teachingClass.id);
      if (selectedClassId === teachingClass.id) {
        setSelectedClassId(0);
        setImportNotice('');
        setImportError('');
      }
      setClassNotice(`已删除班级：${teachingClass.name}`);
    } catch (error) {
      setClassDeleteError(error instanceof Error ? error.message : '删除班级失败，请稍后重试。');
    }
  };

  const submitImport = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setImportError('');
    setImportNotice('');
    const form = event.currentTarget;
    const formData = new FormData(form);
    const classId = Number(formData.get('classId'));
    const rows = parseImportRows(String(formData.get('rows') ?? ''));
    if (!classId) {
      setImportError('请先选择要导入的班级。');
      return;
    }
    if (rows.length === 0) {
      setImportError('请粘贴至少一行学生名单。');
      return;
    }
    try {
      const result = await onImportStudents({ classId, rows });
      setSelectedClassId(classId);
      const targetClassName = classes.find((item) => item.id === classId)?.name ?? '当前班级';
      setImportNotice(`已导入到 ${targetClassName}：处理 ${rows.length} 条，成功加入 ${result.created} 人，跳过 ${result.skipped} 人。`);
    } catch (error) {
      setImportError(error instanceof Error ? error.message : '导入学生失败，请检查后端服务。');
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
                    onClick={() => {
                      onSelectCourse(course.id);
                      setSelectedClassId(0);
                      setClassNotice('');
                      setImportNotice('');
                    }}
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

        <div>
          <div className="panel-heading compact-heading">
            <div>
              <h3>班级</h3>
            </div>
            <button className="ghost-button" type="button" onClick={() => setShowClassForm((value) => !value)}>
              {showClassForm ? <X size={15} /> : <Plus size={15} />}
              {showClassForm ? '收起表单' : '新建班级'}
            </button>
          </div>
          {classNotice ? <div className="inline-success">{classNotice}</div> : null}
          {classDeleteError ? <div className="inline-error">{classDeleteError}</div> : null}
          {showClassForm ? (
            <form className="assignment-create-form course-create-form" onSubmit={submitClass}>
              <label>
                班级名称
                <input
                  value={classFormState.name}
                  onChange={(event) => setClassFormState((current) => ({ ...current, name: event.target.value }))}
                  placeholder="例如：软件2403班"
                />
              </label>
              <label>
                专业
                <input
                  value={classFormState.major}
                  onChange={(event) => setClassFormState((current) => ({ ...current, major: event.target.value }))}
                  placeholder="例如：软件技术"
                />
              </label>
              <label>
                年级
                <input
                  value={classFormState.grade}
                  onChange={(event) => setClassFormState((current) => ({ ...current, grade: event.target.value }))}
                  placeholder="例如：2024"
                />
              </label>
              {classSubmitError ? <div className="inline-error">{classSubmitError}</div> : null}
              <button className="primary-button" type="submit">保存班级</button>
            </form>
          ) : null}
          {classes.length === 0 ? (
            <div className="empty-state">
              <Users size={32} />
              <p>暂无班级</p>
              <span>请先新建班级，再导入学生名单</span>
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
                      <th>操作</th>
                    </tr>
                  </thead>
                  <tbody>
                    {classes.map((item) => (
                      <tr
                        className={activeClassId === item.id ? 'is-selected is-clickable' : 'is-clickable'}
                        key={item.id}
                        onClick={() => setSelectedClassId(item.id)}
                      >
                        <td>{item.name}</td>
                        <td>{item.major || '未填写'}</td>
                        <td>{item.grade ? `${item.grade}级` : '未填写'}</td>
                        <td>{item.studentCount}</td>
                        <td>
                          <button
                            aria-label={`删除班级 ${item.name}`}
                            className="link-button danger-link class-delete-button"
                            title="删除班级"
                            type="button"
                            onClick={(event) => deleteClass(event, item)}
                          >
                            <Trash2 size={14} />
                            删除
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </section>

      <section className="course-import-section">
        <div className="panel-heading">
          <div>
            <h3>导入学生</h3>
            <span className="panel-subtitle">选择班级后粘贴学生名单，已有学生会复用账号并加入当前班级</span>
          </div>
          <span className="status-pill">{selectedClass ? `当前导入：${selectedClass.name}` : '请先选择班级'}</span>
        </div>
        {!selectedClass ? (
          <div className="inline-warning">
            <span>请先在上方班级表格中选择一个班级；新建班级后会自动选中。</span>
          </div>
        ) : null}
        <div className="import-dropzone">
          <UploadCloud size={28} />
          <strong>粘贴学生名单行</strong>
          <span>每行格式：学号, 姓名, 邮箱, 手机号。已存在的学生会直接加入当前班级。</span>
        </div>
        <form className="assignment-create-form" onSubmit={submitImport}>
          <label>
            导入班级
            <select name="classId" required value={activeClassId || ''} onChange={(event) => setSelectedClassId(Number(event.target.value))}>
              <option value="" disabled>请选择班级</option>
              {classes.map((item) => (
                <option key={item.id} value={item.id}>{item.name}</option>
              ))}
            </select>
          </label>
          <label className="wide-field">
            学生名单
            <textarea name="rows" rows={4} defaultValue={sampleRows} required disabled={!activeClassId} />
          </label>
          {importError ? <div className="inline-error">{importError}</div> : null}
          <button className="primary-button" type="submit" disabled={!activeClassId}>
            <UploadCloud size={15} /> 导入名单
          </button>
        </form>
        {importNotice ? <div className="inline-success">{importNotice}</div> : null}
        {importResult && importResult.warnings.length > 0 && (
          <div className="inline-warning">
            {importResult.warnings.slice(0, 3).map((warning) => (
              <span key={warning}>{warning}</span>
            ))}
          </div>
        )}
        {importResult ? (
          <div className="import-metrics course-import-metrics">
            <span><strong>{importResult.total}</strong>总记录</span>
            <span><strong>{importResult.created}</strong>已加入</span>
            <span><strong>{importResult.skipped}</strong>已跳过</span>
          </div>
        ) : null}
      </section>
    </article>
  );
}

function parseImportRows(value: string): StudentImportRow[] {
  return value
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const [studentNo = '', name = '', email = '', phone = ''] = line.split(',').map((item) => item.trim());
      return {
        studentNo,
        name,
        ...(email ? { email } : {}),
        ...(phone ? { phone } : {}),
      };
    });
}
