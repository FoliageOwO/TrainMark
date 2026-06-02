import { CheckCircle2, Clock3, FileText, Trash2, UploadCloud } from 'lucide-react';
import { Alert, Button, Card, Input, Progress, Select, Space, Typography, Upload } from 'antd';
import { fetchApiAssetBlobUrl, shouldUseHttpApi } from '../api/httpApi';
import type { SubmissionTask, UploadReceipt } from '../api/types';
import { toChineseFileName } from '../utils/displayText';

type StudentUploadPanelProps = {
  receipt: UploadReceipt | null;
  selectedFileName: string;
  selectedTask: SubmissionTask | undefined;
  tasks: SubmissionTask[];
  uploadProgress: number;
  userName: string;
  userStudentNo: string;
  onConfirmUpload: () => void | Promise<void>;
  onDeleteSubmission: (submissionId: number) => void | Promise<void>;
  onFileNameChange: (fileName: string) => void;
  onFileSelect: (file: File | null) => void;
  onTaskSelect: (taskId: number) => void;
};

export function StudentUploadPanel({
  receipt,
  selectedFileName,
  selectedTask,
  tasks,
  uploadProgress,
  userName,
  userStudentNo,
  onConfirmUpload,
  onDeleteSubmission,
  onFileNameChange,
  onFileSelect,
  onTaskSelect,
}: StudentUploadPanelProps) {
  const activeSubmissionId = receipt?.submissionId ?? selectedTask?.submissionId;
  const activeFileName = receipt?.fileName ?? selectedTask?.fileName;
  const activeVersion = receipt?.version ?? selectedTask?.version;
  const hasSubmittedReport = Boolean(activeSubmissionId);
  const canDeleteSubmission = selectedTask?.status === '已提交';
  const isOverwrite = Boolean(selectedTask?.submissionId);
  const currentBlocker = !selectedTask
    ? '当前阻塞：尚未选择提交任务'
    : selectedTask.status === '已发布成绩'
      ? '当前阻塞：该任务成绩已发布，重新提交会触发重批流程'
      : '当前阻塞：无';
  const nextAction = !selectedTask
    ? '下一步：先选择任务再上传报告。'
    : hasSubmittedReport
      ? '下一步：如需更新内容，请覆盖提交最新版本。'
      : '下一步：确认文件后点击“确认提交”。';

  const openSubmissionFile = async (submissionId: number, fileName: string) => {
    const url = await fetchApiAssetBlobUrl(`/api/submissions/${submissionId}/file`);
    const link = document.createElement('a');
    link.href = url;
    link.download = toChineseFileName(fileName) || '实训报告';
    document.body.appendChild(link);
    link.click();
    link.remove();
    if (url.startsWith('blob:')) {
      window.setTimeout(() => URL.revokeObjectURL(url), 1000);
    }
  };

  return (
    <Card
      title="上传报告"
      extra={<Space><UploadCloud size={18} /><Typography.Text type="secondary">学生提交入口</Typography.Text></Space>}
    >
      <Space direction="vertical" size={16} style={{ width: '100%' }}>
        <Alert type={selectedTask?.status === '已发布成绩' ? 'warning' : 'info'} showIcon message={currentBlocker} description={nextAction} />

        <Upload.Dragger
          multiple={false}
          showUploadList={false}
          accept=".pdf,.doc,.docx,.png,.jpg,.jpeg,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,image/png,image/jpeg"
          beforeUpload={(file) => {
            onFileSelect(file);
            return false;
          }}
        >
          <p className="ant-upload-drag-icon"><UploadCloud size={28} /></p>
          <p className="ant-upload-text">拖拽报告到这里，或点击选择文件</p>
          <p className="ant-upload-hint">支持 PDF、Word、JPG、PNG，最大 50MB</p>
        </Upload.Dragger>

        <div>
          <Typography.Text type="secondary">提交任务</Typography.Text>
          <Select
            value={selectedTask?.id}
            style={{ width: '100%', marginTop: 8 }}
            options={tasks.map((task) => ({ value: task.id, label: task.title }))}
            onChange={(value) => onTaskSelect(value)}
          />
        </div>

        {selectedTask ? (
          <Card size="small" style={{ background: 'rgba(22,119,255,0.04)' }}>
            <Space direction="vertical" size={4}>
              <Typography.Text strong>{selectedTask.courseName} · {selectedTask.title}</Typography.Text>
              <Typography.Text type="secondary">
                {isOverwrite
                  ? '当前任务已提交，再次提交会覆盖上一份报告，教师端以最新文件为准。'
                  : '当前任务尚未提交，上传后教师端即可在报告收集中查看。'}
              </Typography.Text>
            </Space>
          </Card>
        ) : null}

        <div>
          <Typography.Text type="secondary">文件名</Typography.Text>
          <Input
            value={selectedFileName}
            onChange={(event) => {
              onFileNameChange(event.target.value);
            }}
            style={{ marginTop: 8 }}
          />
        </div>

        <Card size="small">
          <Space direction="vertical" size={8} style={{ width: '100%' }}>
            <Typography.Text type="secondary">识别信息</Typography.Text>
            <Typography.Text strong>{userName} / {userStudentNo}</Typography.Text>
            <Progress percent={uploadProgress} />
          </Space>
        </Card>

        {hasSubmittedReport && activeSubmissionId ? (
          <Alert
            type="success"
            showIcon
            message={receipt && (activeVersion ?? 1) > 1 ? '覆盖提交成功' : receipt ? '提交成功' : '已提交报告'}
            description={(
              <Space direction="vertical" size={6}>
                <Typography.Text>回执 #{activeSubmissionId} · 第 {activeVersion ?? 1} 次提交</Typography.Text>
                <Typography.Text type="secondary">
                  {(activeVersion ?? 1) > 1 ? '上一份报告已被覆盖，教师端将批改最新文件。' : '可在截止前重新提交，重新提交会覆盖当前报告。'}
                </Typography.Text>
                <Space wrap>
                  {shouldUseHttpApi() && activeFileName ? (
                    <Button type="link" onClick={() => openSubmissionFile(activeSubmissionId, activeFileName)}>
                      查看原文件
                    </Button>
                  ) : null}
                  {canDeleteSubmission ? (
                    <Button danger type="link" onClick={() => onDeleteSubmission(activeSubmissionId)}>
                      <Trash2 size={14} /> 撤回提交
                    </Button>
                  ) : null}
                </Space>
              </Space>
            )}
          />
        ) : null}

        <Button type="primary" block onClick={onConfirmUpload} disabled={!selectedTask}>
          {isOverwrite ? '覆盖上一份报告' : '确认提交'}
        </Button>

        <Space direction="vertical" size={6}>
          <Typography.Text><FileText size={16} /> 支持 PDF、Word、JPG、PNG</Typography.Text>
          <Typography.Text><Clock3 size={16} /> 截止前可重新提交，系统覆盖上一份报告</Typography.Text>
          <Typography.Text><CheckCircle2 size={16} /> 系统自动识别姓名、学号、班级</Typography.Text>
        </Space>
      </Space>
    </Card>
  );
}
