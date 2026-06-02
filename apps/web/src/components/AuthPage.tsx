import { useState } from 'react';
import { ProForm, ProFormText } from '@ant-design/pro-components';
import { Alert, Card, Tabs, Typography } from 'antd';

type AuthPageProps = {
  onLogin: (username: string, password: string) => Promise<void>;
  onRegister: (payload: { username: string; name: string; password: string }) => Promise<void>;
  error: string | null;
  registerDisabledHint?: string;
  showDemoAccountsHint?: boolean;
};

export function AuthPage({ onLogin, onRegister, error, registerDisabledHint, showDemoAccountsHint = false }: AuthPageProps) {
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [localError, setLocalError] = useState<string | null>(null);
  const registerDisabled = Boolean(registerDisabledHint);

  return (
    <div className="auth-shell">
      <div className="auth-bg" aria-hidden="true" />
      <Card className="auth-card" bordered={false}>
        <div className="auth-header">
          <img src="/icons/icon.svg" alt="TrainMark" className="auth-logo" />
          <Typography.Title level={2} style={{ margin: 0 }}>智训批 TrainMark</Typography.Title>
          <Typography.Text type="secondary">课程实训中后台</Typography.Text>
        </div>

        <Tabs
          activeKey={mode}
          onChange={(key) => {
            setLocalError(null);
            setMode(key as 'login' | 'register');
          }}
          items={[
            { key: 'login', label: '登录' },
            { key: 'register', label: '注册' },
          ]}
        />

        {localError ? <Alert type="error" showIcon message={localError} style={{ marginBottom: 16 }} /> : null}
        {error ? <Alert type="error" showIcon message={error} style={{ marginBottom: 16 }} /> : null}

        <ProForm
          layout="vertical"
          submitter={{
            searchConfig: { submitText: mode === 'login' ? '登录' : registerDisabled ? '当前不可注册' : '注册' },
            submitButtonProps: { block: true, size: 'large', disabled: mode === 'register' && registerDisabled },
            resetButtonProps: { style: { display: 'none' } },
          }}
          onFinish={async (values) => {
            setLocalError(null);
            if (mode === 'login') {
              await onLogin(String(values.username ?? '').trim(), String(values.password ?? ''));
              return true;
            }
            const username = String(values.username ?? '').trim();
            const name = String(values.name ?? '').trim();
            const password = String(values.password ?? '');
            const confirmPassword = String(values.confirmPassword ?? '');
            if (password !== confirmPassword) {
              setLocalError('两次输入的密码不一致，请重新输入。');
              return false;
            }
            await onRegister({ username, name, password });
            setMode('login');
            return true;
          }}
        >
          <ProFormText
            name="username"
            fieldProps={{ autoComplete: 'username', autoCapitalize: 'none', spellCheck: false, size: 'large' }}
            placeholder={mode === 'login' ? '用户名，例如 teacher' : '用户名（学号/工号）'}
            rules={[{ required: true }, { pattern: /^[A-Za-z0-9_-]{3,32}$/, message: '用户名需为 3-32 位字母/数字/_/-' }]}
          />

          {mode === 'register' ? <ProFormText name="name" fieldProps={{ size: 'large' }} placeholder="姓名" rules={[{ required: true }]} /> : null}

          <ProFormText.Password
            name="password"
            fieldProps={{ autoComplete: mode === 'login' ? 'current-password' : 'new-password', size: 'large' }}
            placeholder={mode === 'login' ? '密码' : '密码（至少 6 位）'}
            rules={[{ required: true }, { min: 6, message: '密码至少 6 位' }]}
          />

          {mode === 'register' ? (
            <ProFormText.Password
              name="confirmPassword"
              fieldProps={{ size: 'large' }}
              placeholder="确认密码"
              rules={[{ required: true }, { min: 6, message: '密码至少 6 位' }]}
            />
          ) : null}

          {mode === 'login' && showDemoAccountsHint ? (
            <Typography.Text type="secondary">联调账号：teacher / admin / owner / supervisor / 2024010101，默认密码：trainmark。</Typography.Text>
          ) : null}

          {mode === 'register' && registerDisabledHint ? <Typography.Text type="secondary">{registerDisabledHint}</Typography.Text> : null}
        </ProForm>
      </Card>
    </div>
  );
}
