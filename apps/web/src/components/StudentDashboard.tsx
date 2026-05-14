import { useEffect, useState } from 'react';
import {
  CalendarClock,
  CheckCircle2,
  Clock3,
  FileCheck2,
  FileText,
  GraduationCap,
  UploadCloud,
} from 'lucide-react';
import { createAppeal, createUploadReceipt, resolveApiAssetUrl } from '../api/httpApi';
import type { AppealSummary, GradingResultSummary, SubmissionTask, UploadReceipt } from '../api/types';
import { formatDate } from '../utils/formatDate';

const appealStatusText = {
  SUBMITTED: '待处理',
  ACCEPTED: '已采纳',
  REJECTED: '已驳回',
};

type StudentDashboardProps = {
  tasks: SubmissionTask[];
  publishedResults: GradingResultSummary[];
  appeals: AppealSummary[];
  userId: number;
};

export function StudentDashboard({ tasks, publishedResults, appeals, userId }: StudentDashboardProps) {
  const [selectedFileName, setSelectedFileName] = useState('JavaWeb综合实训报告-张三-2024010101.pdf');
  const [uploadProgress, setUploadProgress] = useState(72);
  const [receipt, setReceipt] = useState<UploadReceipt | null>(null);
  const [appealRows, setAppealRows] = useState(appeals);
  const [taskRows, setTaskRows] = useState(tasks);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [selectedTaskId, setSelectedTaskId] = useState(() => tasks[0]?.id ?? 0);

  const selectedTask = taskRows.find((task) => task.id === selectedTaskId) ?? taskRows[0];

  const selectUploadFile = (file: File | null) => {
    setSelectedFile(file);
    if (file) {
      setSelectedFileName(file.name);
    }
    setReceipt(null);
    setUploadProgress(file ? 64 : 36);
  };

  useEffect(() => {
    setTaskRows((current) => reconcileTaskRows(tasks, current));
  }, [tasks]);

  useEffect(() => {
    if (taskRows.length > 0 && !taskRows.some((task) => task.id === selectedTaskId)) {
      setSelectedTaskId(taskRows[0].id);
    }
  }, [selectedTaskId, taskRows]);

  useEffect(() => {
    setAppealRows((current) => {
      const incomingIds = new Set(appeals.map((appeal) => appeal.id));
      const pendingRows = current.filter((appeal) => !incomingIds.has(appeal.id));
      return [...pendingRows, ...appeals];
    });
  }, [appeals]);

  const confirmUpload = async () => {
    if (!selectedTask) {
      return;
    }
    setUploadProgress(100);
    const nextReceipt = await createUploadReceipt(selectedFileName, selectedTask.id, userId, selectedFile);
    setReceipt(nextReceipt);
    setTaskRows((current) => current.map((task) => (
      task.id === selectedTask.id ? { ...task, status: '已提交', score: undefined } : task
    )));
  };

  const submitAppeal = async (resultId: number, rubricItemId: number | null) => {
    const appeal = await createAppeal(
      resultId,
      rubricItemId,
      userId,
      '我认为该评分项有可补充说明，申请教师复核。',
      '请重新查看报告中的相关章节和截图证据。'
    );
    setAppealRows((current) => [appeal, ...current.filter((item) => item.id !== appeal.id)]);
  };

  return (
    <section className="student-grid">
      <article className="panel wide-panel">
        <div className="panel-heading">
          <div>
            <p className="eyebrow">My Tasks</p>
            <h3>我的实训任务</h3>
          </div>
          <GraduationCap size={22} />
        </div>
        <div className="student-task-list">
          {taskRows.map((task) => (
            <div className="student-task-card" key={task.id}>
              <div>
                <strong>{task.title}</strong>
                <span>{task.courseName}</span>
              </div>
              <div className="assignment-meta">
                <span><CalendarClock size={14} /> {formatDate(task.deadline)}</span>
                <span className="status-pill">{task.status}</span>
                {task.score !== undefined && <span className="score-chip">{task.score} 分</span>}
              </div>
              <button
                className="primary-button"
                type="button"
                onClick={() => {
                  if (task.status === '未提交') {
                    setSelectedTaskId(task.id);
                    setReceipt(null);
                    setUploadProgress(36);
                  }
                }}
              >
                {task.status === '未提交' ? '立即上传' : '查看批注'}
              </button>
            </div>
          ))}
        </div>
      </article>

      <article className="panel wide-panel">
        <div className="panel-heading">
          <div>
            <p className="eyebrow">Published Results</p>
            <h3>成绩与批注</h3>
          </div>
          <FileCheck2 size={22} />
        </div>
        {publishedResults.length === 0 ? (
          <div className="empty-result">
            <strong>暂无已发布成绩</strong>
            <span>教师发布后会在这里显示总分、分项扣分和批注入口。</span>
          </div>
        ) : (
          <div className="published-result-list">
            {publishedResults.map((result) => (
              <div className="published-result-card" key={result.id}>
                <div className="published-score">
                  <span>最终成绩</span>
                  <strong>{result.teacherScore}</strong>
                  <small>{result.studentName} · {result.studentNo}</small>
                </div>
                <div className="published-detail">
                  <strong>{result.fileName}</strong>
                  <p>{result.overallComment}</p>
                  <div className="review-item-list compact">
                    {result.items.map((item) => (
                      <div className="student-score-row" key={item.rubricItemId}>
                        <span>{item.title}</span>
                        <b>{item.teacherScore}/{item.maxScore}</b>
                        <small>{item.deductionReason}</small>
                      </div>
                    ))}
                  </div>
                  <div className="student-result-actions">
                    <a className="primary-button" href={resolveApiAssetUrl(result.annotationPdfUrl)} rel="noreferrer" target="_blank">查看批注 PDF</a>
                    <button className="ghost-button" type="button" onClick={() => submitAppeal(result.id, null)}>提交申诉</button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
        <div className="appeal-status-list">
          <strong>我的申诉</strong>
          {appealRows.length === 0 ? (
            <span>暂无申诉记录</span>
          ) : (
            appealRows.map((appeal) => (
              <div className="student-appeal-row" key={appeal.id}>
                <span>{appealStatusText[appeal.status]} · 结果 #{appeal.resultId}</span>
                <small>{appeal.requestedChange}</small>
                {appeal.teacherReply && <small>{appeal.teacherReply}</small>}
              </div>
            ))
          )}
        </div>
      </article>

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
              selectUploadFile(event.dataTransfer.files?.[0] ?? null);
            }}
          >
            <UploadCloud size={24} />
            <strong>拖拽报告到这里</strong>
            <span>PDF / Word / JPG / PNG，最大 50MB</span>
            <input
              type="file"
              accept=".pdf,.doc,.docx,.png,.jpg,.jpeg,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,image/png,image/jpeg"
              onChange={(event) => {
                selectUploadFile(event.target.files?.[0] ?? null);
              }}
            />
          </label>
          <label className="file-name-field">
            提交任务
            <select
              value={selectedTask?.id ?? ''}
              onChange={(event) => {
                setSelectedTaskId(Number(event.target.value));
                setReceipt(null);
                setUploadProgress(36);
              }}
            >
              {taskRows.map((task) => (
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
                setSelectedFileName(event.target.value);
                setSelectedFile(null);
                setReceipt(null);
                setUploadProgress(36);
              }}
            />
          </label>
          <div className="detected-profile">
            <span>识别信息</span>
            <strong>张三 / 2024010101 / 软件2401班</strong>
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
              </div>
            </div>
          ) : (
            <button className="primary-button full-width" type="button" onClick={confirmUpload} disabled={!selectedTask}>
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
    </section>
  );
}

function reconcileTaskRows(incomingRows: SubmissionTask[], currentRows: SubmissionTask[]) {
  return incomingRows.map((incoming) => {
    const current = currentRows.find((task) => task.id === incoming.id);
    if (!current) {
      return incoming;
    }
    if (incoming.status === '未提交' && current.status !== '未提交') {
      return {
        ...incoming,
        status: current.status,
        score: current.score,
      };
    }
    return incoming;
  });
}
