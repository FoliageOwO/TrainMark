import { CheckCircle2, Clock3, FileText, Trash2, UploadCloud } from 'lucide-react';
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
    <article className="panel">
      <div className="panel-heading">
        <div>
          <p className="eyebrow">报告上传</p>
          <h3>上传报告</h3>
        </div>
        <UploadCloud size={22} />
      </div>
      <div className="student-upload-card">
        <label
          className="upload-dropzone compact"
          onDragOver={(event) => event.preventDefault()}
          onDrop={(event) => {
            event.preventDefault();
            onFileSelect(event.dataTransfer.files?.[0] ?? null);
          }}
        >
          <UploadCloud size={24} />
          <strong>拖拽报告到这里</strong>
          <span>支持 PDF、Word、JPG、PNG，最大 50MB</span>
          <input
            type="file"
            accept=".pdf,.doc,.docx,.png,.jpg,.jpeg,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,image/png,image/jpeg"
            onChange={(event) => {
              onFileSelect(event.target.files?.[0] ?? null);
            }}
          />
        </label>
        <label className="file-name-field">
          提交任务
          <select
            value={selectedTask?.id ?? ''}
            onChange={(event) => {
              onTaskSelect(Number(event.target.value));
            }}
          >
            {tasks.map((task) => (
              <option key={task.id} value={task.id}>
                {task.title}
              </option>
            ))}
          </select>
        </label>
        {selectedTask && (
          <div className="upload-overwrite-note">
            <strong>{selectedTask.courseName} · {selectedTask.title}</strong>
            <span>
              {isOverwrite
                ? '当前任务已提交，再次提交会覆盖上一份报告，教师端以最新文件为准。'
                : '当前任务尚未提交，上传后教师端即可在报告收集中查看。'}
            </span>
          </div>
        )}
        <label className="file-name-field">
          文件名
          <input
            value={selectedFileName}
            onChange={(event) => {
              onFileNameChange(event.target.value);
            }}
          />
        </label>
        <div className="detected-profile">
          <span>识别信息</span>
          <strong>{userName} / {userStudentNo}</strong>
        </div>
        <div className="upload-progress" aria-label="上传进度">
          <span style={{ width: `${uploadProgress}%` }} />
        </div>
        {hasSubmittedReport && activeSubmissionId ? (
          <div className="receipt-card">
            <CheckCircle2 size={18} />
            <div>
              <strong>{receipt && (activeVersion ?? 1) > 1 ? '覆盖提交成功' : receipt ? '提交成功' : '已提交报告'}</strong>
              <span>回执 #{activeSubmissionId} · 第 {activeVersion ?? 1} 次提交</span>
              <span>{(activeVersion ?? 1) > 1 ? '上一份报告已被覆盖，教师端将批改最新文件。' : '可在截止前重新提交，重新提交会覆盖当前报告。'}</span>
              {shouldUseHttpApi() && activeFileName && (
                <button className="link-button" type="button" onClick={() => openSubmissionFile(activeSubmissionId, activeFileName)}>
                  查看原文件
                </button>
              )}
            </div>
            {canDeleteSubmission && (
              <button
                className="link-button danger-link"
                type="button"
                onClick={() => onDeleteSubmission(activeSubmissionId)}
              >
                <Trash2 size={14} /> 撤回提交
              </button>
            )}
          </div>
        ) : null}
        <button className="primary-button full-width" type="button" onClick={onConfirmUpload} disabled={!selectedTask}>
          {isOverwrite ? '覆盖上一份报告' : '确认提交'}
        </button>
      </div>
      <ul className="feature-list">
        <li><FileText size={16} /> 支持 PDF、Word、JPG、PNG</li>
        <li><Clock3 size={16} /> 截止前可重新提交，系统覆盖上一份报告</li>
        <li><CheckCircle2 size={16} /> 系统自动识别姓名、学号、班级</li>
      </ul>
    </article>
  );
}
