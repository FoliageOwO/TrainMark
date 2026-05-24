import { useState, type FormEvent } from 'react';
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
  onImportStudents: (input: ImportStudentsInput) => Promise<void>;
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
  const metrics = importResult
    ? {
      total: importResult.total,
      valid: importResult.created,
      duplicated: 0,
      invalid: importResult.skipped,
    }
    : importPreview;

  const handleImport = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const classId = Number(formData.get('classId'));
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
      <article className="panel roster-panel">
        <div className="panel-heading">
          <div>
            <p className="eyebrow">名单导入</p>
            <h3>学生名单导入</h3>
          </div>
          <span className="status-pill">粘贴导入</span>
        </div>
        <div className="import-dropzone">
          <UploadCloud size={28} />
          <strong>粘贴学生名单行</strong>
          <span>每行格式：学号, 姓名, 邮箱, 手机号。导入后会写入当前选择的班级。</span>
        </div>
        <form className="assignment-create-form" onSubmit={handleImport}>
          <label>
            导入班级
            <select name="classId" required defaultValue={classes[0]?.id ?? ''}>
              {classes.map((item) => (
                <option key={item.id} value={item.id}>{item.name}</option>
              ))}
            </select>
          </label>
          <label className="wide-field">
            学生名单
            <textarea name="rows" rows={4} defaultValue={sampleRows} required />
          </label>
          <button className="primary-button" type="submit"><UploadCloud size={15} /> 导入名单</button>
        </form>
        {notice && <div className="inline-success">{notice}</div>}
        {importResult && importResult.warnings.length > 0 && (
          <div className="inline-warning">
            {importResult.warnings.slice(0, 3).map((warning) => (
              <span key={warning}>{warning}</span>
            ))}
          </div>
        )}
        <div className="import-metrics">
          <span><strong>{metrics.total}</strong>总记录</span>
          <span><strong>{metrics.valid}</strong>已导入</span>
          <span><strong>{metrics.duplicated}</strong>重复</span>
          <span><strong>{metrics.invalid}</strong>跳过</span>
        </div>
      </article>

      <article className="panel roster-panel">
        <div className="panel-heading">
          <div>
            <h3>组织与学生</h3>
          </div>
          <span className="status-pill">{students.length} 名学生</span>
        </div>
        <div className="org-chain">
          {organizations.slice(0, 3).map((item) => (
            <span key={item.id}>{item.name}</span>
          ))}
        </div>
        <div className="table-shell">
          <div className="table-scroll table-scroll-md">
            <table className="data-table">
              <thead>
                <tr>
                  <th>姓名</th>
                  <th>学号</th>
                  <th>邮箱</th>
                  <th>状态</th>
                </tr>
              </thead>
              <tbody>
                {students.map((student) => (
                  <tr key={student.id}>
                    <td>{student.name}</td>
                    <td>{student.studentNo}</td>
                    <td>{student.email}</td>
                    <td>{student.status === 'ACTIVE' ? '已激活' : '待激活'}</td>
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
