import { UploadCloud } from 'lucide-react';
import type { OrganizationSummary, StudentImportPreview, UserSummary } from '../api/types';

type TeacherRosterPanelProps = {
  importPreview: StudentImportPreview;
  organizations: OrganizationSummary[];
  students: UserSummary[];
};

export function TeacherRosterPanel({ importPreview, organizations, students }: TeacherRosterPanelProps) {
  return (
    <section className="management-grid">
      <article className="panel roster-panel">
        <div className="panel-heading">
          <div>
            <p className="eyebrow">Roster Import</p>
            <h3>学生名单导入</h3>
          </div>
          <button className="ghost-button" type="button"><UploadCloud size={15} /> 导入 Excel</button>
        </div>
        <div className="import-dropzone">
          <UploadCloud size={28} />
          <strong>拖拽学生名单到这里</strong>
          <span>支持 Excel 模板，字段包含学号、姓名、邮箱、手机号、班级</span>
        </div>
        <div className="import-metrics">
          <span><strong>{importPreview.total}</strong>总记录</span>
          <span><strong>{importPreview.valid}</strong>可导入</span>
          <span><strong>{importPreview.duplicated}</strong>重复</span>
          <span><strong>{importPreview.invalid}</strong>异常</span>
        </div>
      </article>

      <article className="panel roster-panel">
        <div className="panel-heading">
          <div>
            <p className="eyebrow">Directory</p>
            <h3>组织与学生</h3>
          </div>
          <span className="status-pill">{students.length} 名学生</span>
        </div>
        <div className="org-chain">
          {organizations.slice(0, 3).map((item) => (
            <span key={item.id}>{item.name}</span>
          ))}
        </div>
        <div className="student-list">
          {students.slice(0, 4).map((student) => (
            <div className="student-row" key={student.id}>
              <div>
                <strong>{student.name}</strong>
                <span>{student.studentNo} · {student.email}</span>
              </div>
              <span className="status-pill">{student.status === 'ACTIVE' ? '已激活' : '待激活'}</span>
            </div>
          ))}
        </div>
      </article>
    </section>
  );
}
