import { useEffect, useState, type FormEvent } from 'react';
import { Alert, Button, Card, Descriptions, Form, Input, Select, Space, Table, Tag, Typography } from 'antd';
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
  const [parentOrganizationId, setParentOrganizationId] = useState<number | undefined>(undefined);
  const [organizationType, setOrganizationType] = useState<OrganizationType>('CLASS');
  const [selectedOrganizationId, setSelectedOrganizationId] = useState<number | undefined>(organizations[0]?.id);
  const [selectedRole, setSelectedRole] = useState<RoleCode>('STUDENT');
  const activeUsers = userRows.filter((user) => user.status === 'ACTIVE').length;
  const resourceTypes = Array.from(new Set(auditLogs.map((item) => item.resourceType)));
  const aiSettings = settingRows.filter((item) => item.category === 'AI');
  const adminMetrics = [
    { label: '组织节点', value: organizationRows.length, detail: '学院 / 专业 / 班级' },
    { label: '目录账号', value: userRows.length, detail: `${activeUsers} 个已激活` },
    { label: '审计事件', value: auditLogs.length, detail: `${resourceTypes.length} 类资源` },
    {
      label: '高风险操作',
      value: auditLogs.filter((item) => item.action.includes('EXPORT') || item.action.includes('PUBLISH')).length,
      detail: '发布 / 导出重点留痕',
    },
  ];

  const userColumns = [
    { title: '姓名', dataIndex: 'name', key: 'name' },
    {
      title: '账号',
      key: 'account',
      render: (_: unknown, user: UserSummary) => user.studentNo ?? user.teacherNo ?? user.username,
    },
    {
      title: '联系方式',
      key: 'contact',
      render: (_: unknown, user: UserSummary) => user.email ?? user.phone ?? '未填写联系方式',
    },
    {
      title: '角色',
      key: 'roles',
      render: (_: unknown, user: UserSummary) => user.roles.map((role) => roleText[role]).join(' / '),
    },
    {
      title: '状态',
      key: 'status',
      render: (_: unknown, user: UserSummary) => <Tag color={user.status === 'ACTIVE' ? 'success' : 'default'}>{user.status}</Tag>,
    },
  ];

  const auditColumns = [
    { title: '操作', key: 'action', render: (_: unknown, log: AuditLogSummary) => toAuditActionText(log.action) },
    { title: '执行人', dataIndex: 'actorName', key: 'actorName' },
    { title: '资源', key: 'resource', render: (_: unknown, log: AuditLogSummary) => `${toResourceTypeText(log.resourceType)} #${log.resourceId}` },
    { title: '详情', dataIndex: 'detail', key: 'detail' },
    { title: '时间', key: 'createdAt', render: (_: unknown, log: AuditLogSummary) => formatDate(log.createdAt) },
  ];

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
      parentId: parentOrganizationId ?? null,
      name: String(formData.get('name') ?? '').trim(),
      type: organizationType,
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
    const input: CreateUserInput = {
      organizationId: selectedOrganizationId ?? 0,
      username: String(formData.get('username') ?? '').trim(),
      name: String(formData.get('name') ?? '').trim(),
      roles: [selectedRole],
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
      <div className="stats-grid">
        {adminMetrics.map((metric) => (
          <div className="stats-grid-item" key={metric.label}>
            <Card className="admin-stat-card" bodyStyle={{ height: '100%' }}>
              <div className="admin-stat-card-body">
                <Typography.Text className="admin-stat-label" type="secondary">{metric.label}</Typography.Text>
                <Typography.Title level={2} className="admin-stat-value">{metric.value}</Typography.Title>
                <Typography.Text className="admin-stat-detail" type="secondary">{metric.detail}</Typography.Text>
              </div>
            </Card>
          </div>
        ))}
      </div>

      <section className="management-grid">
        <Card className="roster-panel" title="组织与账号状态" extra={<ShieldCheck size={18} />}>
          <Space direction="vertical" size={16} style={{ width: '100%' }}>
            <Form className="assignment-create-form" layout="vertical" onSubmitCapture={handleCreateOrganization}>
              <Form.Item label="上级组织">
                <Select
                  allowClear
                  placeholder="无上级"
                  value={parentOrganizationId}
                  options={organizationRows.map((item) => ({ value: item.id, label: item.name }))}
                  onChange={(value) => setParentOrganizationId(value)}
                />
              </Form.Item>
              <Form.Item label="组织名称"><Input name="name" required defaultValue="新建教学班" /></Form.Item>
              <Form.Item label="类型">
                <Select
                  value={organizationType}
                  options={Object.entries(organizationTypeText).map(([value, label]) => ({ value, label }))}
                  onChange={(value) => setOrganizationType(value as OrganizationType)}
                />
              </Form.Item>
              <Button type="primary" htmlType="submit"><Plus size={15} /> 新增组织</Button>
            </Form>
            <Form className="assignment-create-form" layout="vertical" onSubmitCapture={handleCreateUser}>
              <Form.Item label="所属组织">
                <Select
                  value={selectedOrganizationId}
                  options={organizationRows.map((item) => ({ value: item.id, label: item.name }))}
                  onChange={(value) => setSelectedOrganizationId(value)}
                />
              </Form.Item>
              <Form.Item label="账号"><Input name="username" required defaultValue="2024010199" /></Form.Item>
              <Form.Item label="姓名"><Input name="name" required defaultValue="新学生" /></Form.Item>
              <Form.Item label="角色">
                <Select
                  value={selectedRole}
                  options={Object.entries(roleText).map(([value, label]) => ({ value, label }))}
                  onChange={(value) => setSelectedRole(value as RoleCode)}
                />
              </Form.Item>
              <Form.Item label="学号"><Input name="studentNo" defaultValue="2024010199" /></Form.Item>
              <Form.Item label="工号"><Input name="teacherNo" /></Form.Item>
              <Form.Item label="邮箱"><Input name="email" type="email" defaultValue="new.student@trainmark.local" /></Form.Item>
              <Form.Item label="手机"><Input name="phone" /></Form.Item>
              <Button type="primary" htmlType="submit"><Plus size={15} /> 新增账号</Button>
            </Form>
            {directoryNotice ? <Alert type="success" showIcon message={directoryNotice} /> : null}
            <div className="org-chain">
              {organizationRows.map((item) => (
                <span key={item.id}>{item.name} · {organizationTypeText[item.type]}</span>
              ))}
            </div>
            <Table<UserSummary> rowKey="id" columns={userColumns} dataSource={userRows} pagination={false} scroll={{ x: 1000 }} />
          </Space>
        </Card>

        <Card className="audit-panel" title="关键操作审计" extra={<Tag color="processing">最近 {auditLogs.length} 条</Tag>}>
          <Table<AuditLogSummary> rowKey="id" columns={auditColumns} dataSource={auditLogs} pagination={false} scroll={{ x: 1200 }} />
        </Card>
      </section>

      <section className="management-grid">
        <Card className="roster-panel" title="系统与模型配置" extra={<Tag>{aiSettings.length} 项 AI 配置</Tag>}>
          <Space direction="vertical" size={16} style={{ width: '100%' }}>
            {settingNotice ? <Alert type="success" showIcon message={settingNotice} /> : null}
            {settingRows.map((setting) => (
              <Card key={setting.key} size="small">
                <Form className="student-row setting-row" layout="vertical" onSubmitCapture={handleUpdateSetting}>
                  <div>
                    <strong>{toSettingNameText(setting)}</strong>
                    <span>{setting.key} · {settingCategoryText[setting.category]}</span>
                  </div>
                  <input type="hidden" name="key" value={setting.key} />
                  <Form.Item label="配置值" style={{ marginBottom: 12 }}>
                    <Input
                      name="value"
                      type={setting.sensitive ? 'password' : 'text'}
                      defaultValue={setting.sensitive ? '' : setting.value}
                      placeholder={setting.sensitive ? '输入新敏感值' : '输入配置值'}
                      required
                    />
                  </Form.Item>
                  <Space wrap>
                    <Button type="primary" htmlType="submit">保存</Button>
                    <Tag>{setting.sensitive ? '敏感配置' : toSettingValueText(setting.value)}</Tag>
                  </Space>
                </Form>
              </Card>
            ))}
          </Space>
        </Card>
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
