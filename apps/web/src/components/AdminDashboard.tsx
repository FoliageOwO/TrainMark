import { useEffect, useState, type FormEvent } from 'react';
import { Plus, ShieldCheck } from 'lucide-react';
import {
  createOrganization,
  createUser,
  updateSystemSetting,
  type CreateOrganizationInput,
  type CreateUserInput,
} from '../api/httpApi';
import type { AuditLogSummary, OrganizationSummary, OrganizationType, RoleCode, SystemSettingSummary, UserSummary } from '../api/types';
import { formatDate } from '../utils/formatDate';

type AdminDashboardProps = {
  organizations: OrganizationSummary[];
  users: UserSummary[];
  auditLogs: AuditLogSummary[];
  systemSettings: SystemSettingSummary[];
  onWorkspaceRefresh: () => Promise<void>;
};

const organizationTypeText: Record<OrganizationType, string> = {
  COLLEGE: '学院',
  MAJOR: '专业',
  CLASS: '班级',
};

const roleText: Record<RoleCode, string> = {
  STUDENT: '学生',
  TEACHER: '教师',
  COURSE_OWNER: '课程负责人',
  SUPERVISOR: '督导',
  ADMIN: '管理员',
};

const auditActionText: Record<string, string> = {
  UPLOAD_COMPLETE: '报告提交完成',
  OCR_COMPLETE: '文档识别完成',
  GRADING_START: '启动智能批改',
  GRADING_COMPLETE: '智能批改完成',
  REVIEW_UPDATE: '复核更新',
  REVIEW_APPROVE: '复核通过',
  GRADE_PUBLISH: '发布成绩',
  GRADE_WITHDRAW: '撤回成绩',
  GRADE_EXPORT: '导出成绩',
  APPEAL_SUBMIT: '提交申诉',
  APPEAL_RESOLVE: '处理申诉',
};

const resourceTypeText: Record<string, string> = {
  SUBMISSION: '提交报告',
  OCR_JOB: '识别任务',
  GRADING_JOB: '批改任务',
  GRADING_RESULT: '批改结果',
  GRADE_EXPORT: '成绩导出',
  APPEAL: '申诉',
  USER: '用户',
  ORGANIZATION: '组织',
  SYSTEM_SETTING: '系统配置',
};

const settingCategoryText: Record<SystemSettingSummary['category'], string> = {
  AI: '智能模型',
  FILE: '文件',
  EXPORT: '导出',
  NOTIFICATION: '通知',
  SECURITY: '安全',
};

const settingNameText: Record<string, string> = {
  'ai.ocr.provider': '文档识别服务',
  'ai.scoring.provider': '语义评分服务',
  'upload.max-file-size-mb': '最大上传大小',
  'export.retention-days': '导出文件保留天数',
  'notification.default-channels': '默认催交通道',
  'security.jwt-secret': '登录令牌密钥',
};

const settingValueText: Record<string, string> = {
  LOCAL_DETERMINISTIC: '本地确定性识别',
  LOCAL_RULES: '本地规则评分',
  IN_APP: '站内信',
  EMAIL: '邮件',
  WECHAT_WORK: '企业微信',
};

export function AdminDashboard({ organizations, users, auditLogs, systemSettings, onWorkspaceRefresh }: AdminDashboardProps) {
  const [organizationRows, setOrganizationRows] = useState(organizations);
  const [userRows, setUserRows] = useState(users);
  const [settingRows, setSettingRows] = useState(systemSettings);
  const [directoryNotice, setDirectoryNotice] = useState('');
  const [settingNotice, setSettingNotice] = useState('');
  const activeUsers = userRows.filter((user) => user.status === 'ACTIVE').length;
  const resourceTypes = Array.from(new Set(auditLogs.map((item) => item.resourceType)));
  const aiSettings = settingRows.filter((item) => item.category === 'AI');

  useEffect(() => {
    setOrganizationRows(organizations);
  }, [organizations]);

  useEffect(() => {
    setUserRows(users);
  }, [users]);

  useEffect(() => {
    setSettingRows(systemSettings);
  }, [systemSettings]);

  const handleCreateOrganization = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const input: CreateOrganizationInput = {
      parentId: parseNullableNumber(formData.get('parentId')),
      name: String(formData.get('name') ?? '').trim(),
      type: String(formData.get('type') ?? 'CLASS') as OrganizationType,
    };
    if (!input.name) {
      return;
    }
    const organization = await createOrganization(input);
    setOrganizationRows((current) => [organization, ...current.filter((item) => item.id !== organization.id)]);
    setDirectoryNotice(`已创建组织：${organization.name}`);
    event.currentTarget.reset();
    await onWorkspaceRefresh();
  };

  const handleUpdateSetting = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const key = String(formData.get('key') ?? '').trim();
    const value = String(formData.get('value') ?? '').trim();
    if (!key || !value) {
      return;
    }
    const setting = await updateSystemSetting({ key, value });
    setSettingRows((current) => current.map((item) => (item.key === setting.key ? setting : item)));
    setSettingNotice(`已更新配置：${setting.name}`);
    event.currentTarget.reset();
    await onWorkspaceRefresh();
  };

  const handleCreateUser = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const role = String(formData.get('role') ?? 'STUDENT') as RoleCode;
    const input: CreateUserInput = {
      organizationId: Number(formData.get('organizationId')),
      username: String(formData.get('username') ?? '').trim(),
      name: String(formData.get('name') ?? '').trim(),
      roles: [role],
      ...optionalField('studentNo', formData),
      ...optionalField('teacherNo', formData),
      ...optionalField('email', formData),
      ...optionalField('phone', formData),
    };
    if (!input.organizationId || !input.username || !input.name) {
      return;
    }
    const user = await createUser(input);
    setUserRows((current) => [user, ...current.filter((item) => item.id !== user.id)]);
    setDirectoryNotice(`已创建账号：${user.name}`);
    event.currentTarget.reset();
    await onWorkspaceRefresh();
  };

  return (
    <>
      <section className="stats-grid">
        <article className="stat-card blue">
          <span>组织节点</span>
          <strong>{organizationRows.length}</strong>
          <small>学院 / 专业 / 班级</small>
        </article>
        <article className="stat-card teal">
          <span>目录账号</span>
          <strong>{userRows.length}</strong>
          <small>{activeUsers} 个已激活</small>
        </article>
        <article className="stat-card violet">
          <span>审计事件</span>
          <strong>{auditLogs.length}</strong>
          <small>{resourceTypes.length} 类资源</small>
        </article>
        <article className="stat-card orange">
          <span>高风险操作</span>
          <strong>{auditLogs.filter((item) => item.action.includes('EXPORT') || item.action.includes('PUBLISH')).length}</strong>
          <small>发布 / 导出重点留痕</small>
        </article>
      </section>

      <section className="management-grid">
        <article className="panel roster-panel">
          <div className="panel-heading">
            <div>
              <p className="eyebrow">组织目录</p>
              <h3>组织与账号状态</h3>
            </div>
            <ShieldCheck size={22} />
          </div>
          <form className="assignment-create-form" onSubmit={handleCreateOrganization}>
            <label>
              上级组织
              <select name="parentId" defaultValue="">
                <option value="">无上级</option>
                {organizationRows.map((item) => (
                  <option key={item.id} value={item.id}>{item.name}</option>
                ))}
              </select>
            </label>
            <label>
              组织名称
              <input name="name" required defaultValue="新建教学班" />
            </label>
            <label>
              类型
              <select name="type" defaultValue="CLASS">
                {Object.entries(organizationTypeText).map(([value, label]) => (
                  <option key={value} value={value}>{label}</option>
                ))}
              </select>
            </label>
            <button className="primary-button" type="submit">
              <Plus size={15} /> 新增组织
            </button>
          </form>
          <form className="assignment-create-form" onSubmit={handleCreateUser}>
            <label>
              所属组织
              <select name="organizationId" required defaultValue={organizationRows[0]?.id ?? ''}>
                {organizationRows.map((item) => (
                  <option key={item.id} value={item.id}>{item.name}</option>
                ))}
              </select>
            </label>
            <label>
              账号
              <input name="username" required defaultValue="2024010199" />
            </label>
            <label>
              姓名
              <input name="name" required defaultValue="新学生" />
            </label>
            <label>
              角色
              <select name="role" defaultValue="STUDENT">
                {Object.entries(roleText).map(([value, label]) => (
                  <option key={value} value={value}>{label}</option>
                ))}
              </select>
            </label>
            <label>
              学号
              <input name="studentNo" defaultValue="2024010199" />
            </label>
            <label>
              工号
              <input name="teacherNo" />
            </label>
            <label>
              邮箱
              <input name="email" type="email" defaultValue="new.student@trainmark.local" />
            </label>
            <label>
              手机
              <input name="phone" />
            </label>
            <button className="primary-button" type="submit">
              <Plus size={15} /> 新增账号
            </button>
          </form>
          {directoryNotice && <div className="inline-success">{directoryNotice}</div>}
          <div className="org-chain">
            {organizationRows.map((item) => (
              <span key={item.id}>{item.name} · {organizationTypeText[item.type]}</span>
            ))}
          </div>
          <div className="student-list">
            {userRows.map((user) => (
              <div className="student-row" key={user.id}>
                <div>
                  <strong>{user.name}</strong>
                  <span>{user.studentNo ?? user.teacherNo ?? user.username} · {user.email ?? user.phone ?? '未填写联系方式'}</span>
                </div>
                <span className="status-pill">{user.roles.map((role) => roleText[role]).join(' / ')}</span>
              </div>
            ))}
          </div>
        </article>

        <article className="panel audit-panel">
          <div className="panel-heading">
            <div>
              <p className="eyebrow">审计日志</p>
              <h3>关键操作审计</h3>
            </div>
            <span className="status-pill">最近 {auditLogs.length} 条</span>
          </div>
          <div className="audit-list">
            {auditLogs.map((log) => (
              <div className="audit-row" key={log.id}>
                <span>{toAuditActionText(log.action)} · {log.actorName}</span>
                <small>{toResourceTypeText(log.resourceType)} #{log.resourceId} · {log.detail} · {formatDate(log.createdAt)}</small>
              </div>
            ))}
          </div>
        </article>
      </section>

      <section className="management-grid">
        <article className="panel roster-panel">
          <div className="panel-heading">
            <div>
              <p className="eyebrow">系统配置</p>
              <h3>系统与模型配置</h3>
            </div>
            <span className="status-pill">{aiSettings.length} 项 AI 配置</span>
          </div>
          {settingNotice && <div className="inline-success">{settingNotice}</div>}
          <div className="student-list">
            {settingRows.map((setting) => (
              <form className="student-row setting-row" key={setting.key} onSubmit={handleUpdateSetting}>
                <div>
                  <strong>{toSettingNameText(setting)}</strong>
                  <span>{setting.key} · {settingCategoryText[setting.category]}</span>
                </div>
                <input type="hidden" name="key" value={setting.key} />
                <label>
                  配置值
                  <input
                    name="value"
                    type={setting.sensitive ? 'password' : 'text'}
                    defaultValue={setting.sensitive ? '' : setting.value}
                    placeholder={setting.sensitive ? '输入新敏感值' : '输入配置值'}
                    required
                  />
                </label>
                <button className="primary-button" type="submit">保存</button>
                <span className="status-pill">{setting.sensitive ? '敏感配置' : toSettingValueText(setting.value)}</span>
              </form>
            ))}
          </div>
        </article>
      </section>
    </>
  );
}

function parseNullableNumber(value: FormDataEntryValue | null) {
  const normalized = String(value ?? '').trim();
  return normalized ? Number(normalized) : null;
}

function optionalField(field: 'studentNo' | 'teacherNo' | 'email' | 'phone', formData: FormData) {
  const value = String(formData.get(field) ?? '').trim();
  return value ? { [field]: value } : {};
}

function toAuditActionText(action: string) {
  return auditActionText[action] ?? action;
}

function toResourceTypeText(resourceType: string) {
  return resourceTypeText[resourceType] ?? resourceType;
}

function toSettingNameText(setting: SystemSettingSummary) {
  return settingNameText[setting.key] ?? setting.name;
}

function toSettingValueText(value: string) {
  return value
    .split(',')
    .map((item) => settingValueText[item.trim()] ?? item.trim())
    .join('、');
}
