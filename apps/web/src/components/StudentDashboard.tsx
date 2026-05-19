import { useEffect, useRef, useState } from 'react';
import {
  CalendarClock,
  GraduationCap,
} from 'lucide-react';
import { createAppeal, createUploadReceipt } from '../api/httpApi';
import type { AppealSummary, GradingResultSummary, SubmissionTask, UploadReceipt } from '../api/types';
import { formatDate } from '../utils/formatDate';
import { StudentResultsPanel } from './StudentResultsPanel';
import { StudentUploadPanel } from './StudentUploadPanel';

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

      <StudentResultsPanel
        appeals={appealRows}
        publishedResults={publishedResults}
        resultsRef={resultsRef}
        onSubmitAppeal={submitAppeal}
      />

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
