import { useState, type FormEvent } from 'react';
import { Alert, Button, Card, Form, Input, Select, Table, Tag } from 'antd';
import { UploadCloud } from 'lucide-react';
import type { ImportStudentsInput } from '../api/httpApi';
import type {
  OrganizationSummary,
  StudentImportPreview,
  StudentImportResult,
  StudentImportRow,
  TeachingClassSummary,
  UserSummary,
} from '../api/types';

type TeacherRosterPanelProps = {
  classes: TeachingClassSummary[];
  importPreview: StudentImportPreview;
  importResult: StudentImportResult | null;
  organizations: OrganizationSummary[];
  students: UserSummary[];
  onImportStudents: (input: ImportStudentsInput) => Promise<StudentImportResult>;
};

const sampleRows = `2024010198,陈一,chenyi@trainmark.local,13800000001
2024010199,周二,zhouer@trainmark.local,13800000002`;

export function TeacherRosterPanel({
  classes,
  importPreview,
  importResult,
  organizations,
  students,
  onImportStudents,
}: TeacherRosterPanelProps) {
  const [notice, setNotice] = useState('');
  const [selectedClassId, setSelectedClassId] = useState<number | undefined>(classes[0]?.id);
  const metrics = importResult
    ? {
      total: importResult.total,
      valid: importResult.created,
      duplicated: 0,
      invalid: importResult.skipped,
    }
    : importPreview;

  const studentColumns = [
    { title: '姓名', dataIndex: 'name', key: 'name' },
    { title: '学号', dataIndex: 'studentNo', key: 'studentNo' },
    { title: '邮箱', dataIndex: 'email', key: 'email' },
    {
      title: '状态',
      key: 'status',
      render: (_: unknown, student: UserSummary) => <Tag color={student.status === 'ACTIVE' ? 'success' : 'default'}>{student.status === 'ACTIVE' ? '已激活' : '待激活'}</Tag>,
    },
  ];

  const handleImport = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const classId = selectedClassId ?? 0;
    const rows = parseImportRows(String(formData.get('rows') ?? ''));
    if (!classId || rows.length === 0) {
      return;
    }
    await onImportStudents({ classId, rows });
    setNotice(`已处理 ${rows.length} 条名单记录`);
    event.currentTarget.reset();
  };

  return (
    <section className="management-grid">
      <Card className="roster-panel" title="学生名单导入" extra={<Tag>粘贴导入</Tag>}>
        <Card className="import-dropzone" style={{ marginBottom: 16 }}>
          <UploadCloud size={28} />
          <strong>粘贴学生名单行</strong>
          <span>每行格式：学号, 姓名, 邮箱, 手机号。已有学生会复用账号并加入当前班级。</span>
        </Card>
        <Form className="assignment-create-form" layout="vertical" onSubmitCapture={handleImport}>
          <Form.Item label="导入班级">
            <Select
              value={selectedClassId}
              options={classes.map((item) => ({ value: item.id, label: item.name }))}
              onChange={(value) => setSelectedClassId(value)}
            />
          </Form.Item>
          <Form.Item label="学生名单" className="wide-field">
            <Input.TextArea name="rows" rows={4} defaultValue={sampleRows} required />
          </Form.Item>
          <Button type="primary" htmlType="submit"><UploadCloud size={15} /> 导入名单</Button>
        </Form>
        {notice ? <Alert type="success" showIcon message={notice} style={{ marginTop: 12 }} /> : null}
        {importResult && importResult.warnings.length > 0 && (
          <div className="inline-warning" style={{ marginTop: 12 }}>
            {importResult.warnings.slice(0, 3).map((warning) => (
              <span key={warning}>{warning}</span>
            ))}
          </div>
        )}
        <div className="import-metrics" style={{ marginTop: 12 }}>
          <span><strong>{metrics.total}</strong>总记录</span>
          <span><strong>{metrics.valid}</strong>已加入</span>
          <span><strong>{metrics.duplicated}</strong>重复</span>
          <span><strong>{metrics.invalid}</strong>跳过</span>
        </div>
      </Card>

      <Card className="roster-panel" title="组织与学生" extra={<Tag color="processing">{students.length} 名学生</Tag>}>
        <div className="org-chain" style={{ marginBottom: 12 }}>
          {organizations.slice(0, 3).map((item) => (
            <span key={item.id}>{item.name}</span>
          ))}
        </div>
        <Table<UserSummary> rowKey="id" columns={studentColumns} dataSource={students} pagination={false} scroll={{ x: 800 }} />
      </Card>
    </section>
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
