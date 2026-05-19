import { CheckCircle2, Clock3, FileText, UploadCloud } from 'lucide-react';
import { resolveApiAssetUrl, shouldUseHttpApi } from '../api/httpApi';
import type { SubmissionTask, UploadReceipt } from '../api/types';

type StudentUploadPanelProps = {
  receipt: UploadReceipt | null;
  selectedFileName: string;
  selectedTask: SubmissionTask | undefined;
  tasks: SubmissionTask[];
  uploadProgress: number;
  userName: string;
  userStudentNo: string;
  onConfirmUpload: () => void | Promise<void>;
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
  onFileNameChange,
  onFileSelect,
  onTaskSelect,
}: StudentUploadPanelProps) {
  return (
    <article className="panel">
      <div className="panel-heading">
        <div>
          <p className="eyebrow">Upload</p>
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
          <span>PDF / Word / JPG / PNG，最大 50MB</span>
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
        {receipt ? (
          <div className="receipt-card">
            <CheckCircle2 size={18} />
            <div>
              <strong>提交成功</strong>
              <span>回执 #{receipt.submissionId} · 版本 {receipt.version}</span>
              {shouldUseHttpApi() && (
                <a href={resolveApiAssetUrl(`/api/submissions/${receipt.submissionId}/file`)} rel="noreferrer" target="_blank">查看原文件</a>
              )}
            </div>
          </div>
        ) : (
          <button className="primary-button full-width" type="button" onClick={onConfirmUpload} disabled={!selectedTask}>
            确认提交
          </button>
        )}
      </div>
      <ul className="feature-list">
        <li><FileText size={16} /> 支持 PDF、Word、JPG、PNG</li>
        <li><Clock3 size={16} /> 截止前可重复提交并保留版本</li>
        <li><CheckCircle2 size={16} /> 系统自动识别姓名、学号、班级</li>
      </ul>
    </article>
  );
}
