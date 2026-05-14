import { BarChart3, CheckCircle2, Clock3, ShieldCheck, Users } from 'lucide-react';

const pipelineSteps = ['文件预处理', 'OCR 识别', '结构化提取', '语义评分', 'PDF 批注', '教师复核'];

export function TeacherOperationsPanel() {
  return (
    <section className="content-grid">
      <article className="panel wide-panel">
        <div className="panel-heading">
          <div>
            <p className="eyebrow">Grading Pipeline</p>
            <h3>AI 批改流水线</h3>
          </div>
          <span className="status-pill">运行正常</span>
        </div>
        <div className="pipeline">
          {pipelineSteps.map((step, index) => (
            <div className="pipeline-step" key={step}>
              <CheckCircle2 size={18} />
              <span>{index + 1}. {step}</span>
            </div>
          ))}
        </div>
      </article>

      <article className="panel">
        <div className="panel-heading">
          <div>
            <p className="eyebrow">Operations</p>
            <h3>生产运维能力</h3>
          </div>
          <Users size={22} />
        </div>
        <ul className="feature-list">
          <li><Clock3 size={16} /> 异步批改队列与失败重试</li>
          <li><ShieldCheck size={16} /> RBAC 权限与成绩审计</li>
          <li><BarChart3 size={16} /> 失分分析与达成度报表</li>
        </ul>
      </article>
    </section>
  );
}
