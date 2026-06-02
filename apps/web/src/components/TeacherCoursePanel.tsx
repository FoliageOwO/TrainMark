import { useState, type FormEvent, type MouseEvent } from 'react';
import { Alert, Button, Card, Empty, Form, Input, Select, Space, Table, Tag, Typography } from 'antd';
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

  const courseColumns = [
    {
      title: '课程',
      key: 'course',
      render: (_: unknown, course: CourseSummary) => (
        <div className="table-primary">
          <strong>{course.name}</strong>
          <span>{course.code}</span>
        </div>
      ),
    },
    { title: '学期', dataIndex: 'semester', key: 'semester' },
    { title: '班级', dataIndex: 'classCount', key: 'classCount' },
    { title: '学生', dataIndex: 'studentCount', key: 'studentCount' },
    {
      title: '状态',
      key: 'status',
      render: (_: unknown, course: CourseSummary) => <Tag color={course.status === 'ACTIVE' ? 'success' : 'default'}>{statusText[course.status]}</Tag>,
    },
  ];

  const classColumns = [
    { title: '班级', dataIndex: 'name', key: 'name' },
    { title: '专业', key: 'major', render: (_: unknown, item: TeachingClassSummary) => item.major || '未填写' },
    { title: '年级', key: 'grade', render: (_: unknown, item: TeachingClassSummary) => item.grade ? `${item.grade}级` : '未填写' },
    { title: '人数', dataIndex: 'studentCount', key: 'studentCount' },
    {
      title: '操作',
      key: 'actions',
      render: (_: unknown, item: TeachingClassSummary) => (
        <Button
          danger
          type="link"
          aria-label={`删除班级 ${item.name}`}
          title="删除班级"
          onClick={(event) => deleteClass(event as unknown as MouseEvent<HTMLButtonElement>, item)}
        >
          <Trash2 size={14} />
          删除
        </Button>
      ),
    },
  ];

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
    <Card
      title="课程与班级"
      extra={(
        <Button onClick={() => setShowCreateForm((value) => !value)}>
          {showCreateForm ? <X size={15} /> : <Plus size={15} />}
          {showCreateForm ? '收起表单' : '新建课程'}
        </Button>
      )}
    >
      <Space direction="vertical" size={16} style={{ width: '100%' }}>
      {courseNotice ? <Alert type="success" showIcon message={courseNotice} /> : null}
      {showCreateForm ? (
        <Form className="assignment-create-form course-create-form" layout="vertical" onSubmitCapture={submitCourse}>
          <Form.Item label="课程名称">
            <Input
              value={formState.name}
              onChange={(event) => setFormState((current) => ({ ...current, name: event.target.value }))}
              placeholder="例如：数据库设计实训"
            />
          </Form.Item>
          <Form.Item label="课程代码">
            <Input
              value={formState.code}
              onChange={(event) => setFormState((current) => ({ ...current, code: event.target.value }))}
              placeholder="例如：DB-DESIGN-2026"
            />
          </Form.Item>
          <Form.Item label="学期">
            <Input
              value={formState.semester}
              onChange={(event) => setFormState((current) => ({ ...current, semester: event.target.value }))}
              placeholder="例如：2025-2026-2"
            />
          </Form.Item>
          <Form.Item label="课程说明" className="wide-field">
            <Input.TextArea
              rows={3}
              value={formState.description}
              onChange={(event) => setFormState((current) => ({ ...current, description: event.target.value }))}
              placeholder="可选，填写课程目标或实训说明"
            />
          </Form.Item>
          {submitError ? <Alert type="error" showIcon message={submitError} /> : null}
          <Button type="primary" htmlType="submit">保存课程</Button>
        </Form>
      ) : null}

      <section className="management-grid">
        <Table<CourseSummary>
          rowKey="id"
          columns={courseColumns}
          dataSource={courses}
          pagination={false}
          onRow={(course) => ({
            onClick: () => {
              onSelectCourse(course.id);
              setSelectedClassId(0);
              setClassNotice('');
              setImportNotice('');
            },
            style: { cursor: 'pointer' },
          })}
          rowClassName={(course) => (selectedCourseId === course.id ? 'is-selected' : '')}
        />

        <div>
          <Space style={{ width: '100%', justifyContent: 'space-between', marginBottom: 12 }}>
            <Typography.Title level={4} style={{ margin: 0 }}>班级</Typography.Title>
            <Button onClick={() => setShowClassForm((value) => !value)}>
              {showClassForm ? <X size={15} /> : <Plus size={15} />}
              {showClassForm ? '收起表单' : '新建班级'}
            </Button>
          </Space>
          {classNotice ? <Alert type="success" showIcon message={classNotice} style={{ marginBottom: 12 }} /> : null}
          {classDeleteError ? <Alert type="error" showIcon message={classDeleteError} style={{ marginBottom: 12 }} /> : null}
          {showClassForm ? (
            <Form className="assignment-create-form course-create-form" layout="vertical" onSubmitCapture={submitClass}>
              <Form.Item label="班级名称">
                <Input
                  value={classFormState.name}
                  onChange={(event) => setClassFormState((current) => ({ ...current, name: event.target.value }))}
                  placeholder="例如：软件2403班"
                />
              </Form.Item>
              <Form.Item label="专业">
                <Input
                  value={classFormState.major}
                  onChange={(event) => setClassFormState((current) => ({ ...current, major: event.target.value }))}
                  placeholder="例如：软件技术"
                />
              </Form.Item>
              <Form.Item label="年级">
                <Input
                  value={classFormState.grade}
                  onChange={(event) => setClassFormState((current) => ({ ...current, grade: event.target.value }))}
                  placeholder="例如：2024"
                />
              </Form.Item>
              {classSubmitError ? <Alert type="error" showIcon message={classSubmitError} /> : null}
              <Button type="primary" htmlType="submit">保存班级</Button>
            </Form>
          ) : null}
          {classes.length === 0 ? (
            <Empty description={<Space direction="vertical"><Users size={32} /><span>暂无班级，请先新建班级，再导入学生名单。</span></Space>} />
          ) : (
            <Table<TeachingClassSummary>
              rowKey="id"
              columns={classColumns}
              dataSource={classes}
              pagination={false}
              onRow={(item) => ({ onClick: () => setSelectedClassId(item.id), style: { cursor: 'pointer' } })}
              rowClassName={(item) => (activeClassId === item.id ? 'is-selected' : '')}
            />
          )}
        </div>
      </section>

      <section className="course-import-section">
        <Space style={{ width: '100%', justifyContent: 'space-between', marginBottom: 12 }}>
          <div>
            <Typography.Title level={4} style={{ margin: 0 }}>导入学生</Typography.Title>
            <Typography.Text type="secondary">选择班级后粘贴学生名单，已有学生会复用账号并加入当前班级</Typography.Text>
          </div>
          <Tag>{selectedClass ? `当前导入：${selectedClass.name}` : '请先选择班级'}</Tag>
        </Space>
        {!selectedClass ? (
          <Alert type="warning" showIcon message="请先在上方班级表格中选择一个班级；新建班级后会自动选中。" style={{ marginBottom: 12 }} />
        ) : null}
        <Card className="import-dropzone" style={{ marginBottom: 16 }}>
          <UploadCloud size={28} />
          <strong>粘贴学生名单行</strong>
          <span>每行格式：学号, 姓名, 邮箱, 手机号。已存在的学生会直接加入当前班级。</span>
        </Card>
        <Form className="assignment-create-form" layout="vertical" onSubmitCapture={submitImport}>
          <Form.Item label="导入班级">
            <Select value={activeClassId || undefined} onChange={(value) => setSelectedClassId(value)} placeholder="请选择班级">
              {classes.map((item) => (
                <Select.Option key={item.id} value={item.id}>{item.name}</Select.Option>
              ))}
            </Select>
            <input type="hidden" name="classId" value={activeClassId || ''} readOnly />
          </Form.Item>
          <Form.Item label="学生名单" className="wide-field">
            <Input.TextArea name="rows" rows={4} defaultValue={sampleRows} required disabled={!activeClassId} />
          </Form.Item>
          {importError ? <Alert type="error" showIcon message={importError} /> : null}
          <Button type="primary" htmlType="submit" disabled={!activeClassId}>
            <UploadCloud size={15} /> 导入名单
          </Button>
        </Form>
        {importNotice ? <Alert type="success" showIcon message={importNotice} style={{ marginTop: 12 }} /> : null}
        {importResult && importResult.warnings.length > 0 && (
          <div className="inline-warning" style={{ marginTop: 12 }}>
            {importResult.warnings.slice(0, 3).map((warning) => (
              <span key={warning}>{warning}</span>
            ))}
          </div>
        )}
        {importResult ? (
          <div className="import-metrics course-import-metrics" style={{ marginTop: 12 }}>
            <span><strong>{importResult.total}</strong>总记录</span>
            <span><strong>{importResult.created}</strong>已加入</span>
            <span><strong>{importResult.skipped}</strong>已跳过</span>
          </div>
        ) : null}
      </section>
      </Space>
    </Card>
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
