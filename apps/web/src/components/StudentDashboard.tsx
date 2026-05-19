import { useEffect, useRef, useState } from 'react';
import {
  CalendarClock,
  FileCheck2,
  FileText,
  GraduationCap,
  X,
  ZoomIn,
  ZoomOut,
} from 'lucide-react';
import { createAppeal, createUploadReceipt, resolveApiAssetUrl } from '../api/httpApi';
import type { AppealSummary, GradingResultSummary, SubmissionTask, UploadReceipt } from '../api/types';
import { formatDate } from '../utils/formatDate';
import { StudentUploadPanel } from './StudentUploadPanel';

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
  userName: string;
  userStudentNo: string;
  onWorkspaceRefresh: () => Promise<void>;
};

export function StudentDashboard({ tasks, publishedResults, appeals, userId, userName, userStudentNo, onWorkspaceRefresh }: StudentDashboardProps) {
  const [selectedFileName, setSelectedFileName] = useState('JavaWeb综合实训报告-张三-2024010101.pdf');
  const [uploadProgress, setUploadProgress] = useState(72);
  const [receipt, setReceipt] = useState<UploadReceipt | null>(null);
  const [appealRows, setAppealRows] = useState(appeals);
  const [taskRows, setTaskRows] = useState(tasks);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [selectedTaskId, setSelectedTaskId] = useState(() => tasks[0]?.id ?? 0);
  const [viewingResult, setViewingResult] = useState<GradingResultSummary | null>(null);
  const [pdfZoom, setPdfZoom] = useState(100);
  const resultsRef = useRef<HTMLDivElement>(null);

  const selectedTask = taskRows.find((task) => task.id === selectedTaskId) ?? taskRows[0];

  const selectUploadFile = (file: File | null) => {
    setSelectedFile(file);
    if (file) {
      setSelectedFileName(file.name);
    }
    setReceipt(null);
    setUploadProgress(file ? 64 : 36);
  };

  const scrollToResults = () => {
    resultsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  useEffect(() => {
    if (!viewingResult) return;
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setViewingResult(null);
      }
    };
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [viewingResult]);

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
    await onWorkspaceRefresh();
  };

  const handleUploadTaskSelect = (taskId: number) => {
    setSelectedTaskId(taskId);
    setReceipt(null);
    setUploadProgress(36);
  };

  const handleUploadFileNameChange = (fileName: string) => {
    setSelectedFileName(fileName);
    setSelectedFile(null);
    setReceipt(null);
    setUploadProgress(36);
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
    await onWorkspaceRefresh();
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
                  } else {
                    scrollToResults();
                  }
                }}
              >
                {task.status === '未提交' ? '立即上传' : '查看批注'}
              </button>
            </div>
          ))}
        </div>
      </article>

      <article className="panel wide-panel" ref={resultsRef}>
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
                    <button className="ghost-button" type="button" onClick={() => { setViewingResult(result); setPdfZoom(100); }}>
                      <FileText size={14} /> 查看批注
                    </button>
                    <a className="primary-button" href={resolveApiAssetUrl(result.annotationPdfUrl)} rel="noreferrer" target="_blank">下载批注 PDF</a>
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

      <StudentUploadPanel
        receipt={receipt}
        selectedFileName={selectedFileName}
        selectedTask={selectedTask}
        tasks={taskRows}
        uploadProgress={uploadProgress}
        userName={userName}
        userStudentNo={userStudentNo}
        onConfirmUpload={confirmUpload}
        onFileNameChange={handleUploadFileNameChange}
        onFileSelect={selectUploadFile}
        onTaskSelect={handleUploadTaskSelect}
      />

      {viewingResult && (
        <div className="pdf-viewer-modal" role="dialog" aria-modal="true" aria-label="批注预览">
          <div className="pdf-viewer-backdrop" onClick={() => setViewingResult(null)} />
          <div className="pdf-viewer-modal-content">
            <div className="pdf-viewer-modal-header">
              <div>
                <strong>{viewingResult.fileName}</strong>
                <span>批注预览</span>
              </div>
              <div className="pdf-viewer-modal-actions">
                <button className="icon-button" type="button" onClick={() => setPdfZoom((z) => Math.max(50, z - 10))} aria-label="缩小">
                  <ZoomOut size={16} />
                </button>
                <span className="pdf-zoom-label" aria-live="polite">{pdfZoom}%</span>
                <button className="icon-button" type="button" onClick={() => setPdfZoom((z) => Math.min(200, z + 10))} aria-label="放大">
                  <ZoomIn size={16} />
                </button>
                <button className="icon-button" type="button" onClick={() => setViewingResult(null)} aria-label="关闭">
                  <X size={18} />
                </button>
              </div>
            </div>
            <div className="pdf-viewer-modal-body" style={{ transform: `scale(${pdfZoom / 100})`, transformOrigin: 'top center' }}>
              <div className="pdf-page mock-annotated-page">
                <div className="pdf-annotation-header">
                  <h4>{viewingResult.fileName}</h4>
                  <div className="pdf-annotation-score">总分 {viewingResult.teacherScore} / 100</div>
                </div>
                <div className="pdf-annotation-body">
                  <p className="pdf-annotation-text">
                    报告结构完整，核心功能说明较清晰；数据库约束和异常处理部分需要补充。建议在系统设计章节增加ER图和表结构说明。
                  </p>
                  <div className="pdf-annotation-highlights">
                    <div className="pdf-highlight-item">
                      <span className="pdf-highlight-label">扣分项</span>
                      <p>需求分析章节缺少非功能需求（性能、安全性、可维护性）说明。</p>
                    </div>
                    <div className="pdf-highlight-item">
                      <span className="pdf-highlight-label">扣分项</span>
                      <p>数据库设计章节未说明索引选择理由和外键约束策略。</p>
                    </div>
                    <div className="pdf-highlight-item">
                      <span className="pdf-highlight-label">扣分项</span>
                      <p>实训反思章节内容偏少，建议补充个人收获和改进方向。</p>
                    </div>
                  </div>
                  <div className="pdf-annotation-footer">
                    <strong>教师总评：</strong>
                    <p>{viewingResult.overallComment}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
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
