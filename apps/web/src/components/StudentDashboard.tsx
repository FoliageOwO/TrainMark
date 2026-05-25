import { useEffect, useMemo, useRef, useState } from 'react';
import {
  CalendarClock,
  CheckCircle2,
  FileText,
  GraduationCap,
} from 'lucide-react';
import { createAppeal, createUploadReceipt, deleteSubmission } from '../api/httpApi';
import type { AppealSummary, CourseSummary, GradingResultSummary, SubmissionTask, UploadReceipt } from '../api/types';
import { formatDate } from '../utils/formatDate';
import { StudentResultsPanel } from './StudentResultsPanel';
import { StudentUploadPanel } from './StudentUploadPanel';

type StudentDashboardProps = {
  activeView: 'courses' | 'submit';
  courses: CourseSummary[];
  selectedCourseId: number;
  tasks: SubmissionTask[];
  publishedResults: GradingResultSummary[];
  appeals: AppealSummary[];
  userId: number;
  userName: string;
  userStudentNo: string;
  onCourseChange: (courseId: number) => void;
  onOpenSubmit: () => void;
  onWorkspaceRefresh: () => Promise<void>;
};

export function StudentDashboard({
  activeView,
  courses,
  selectedCourseId,
  tasks,
  publishedResults,
  appeals,
  userId,
  userName,
  userStudentNo,
  onCourseChange,
  onOpenSubmit,
  onWorkspaceRefresh,
}: StudentDashboardProps) {
  const [selectedFileName, setSelectedFileName] = useState('JavaWeb综合实训报告-张三-2024010101.pdf');
  const [uploadProgress, setUploadProgress] = useState(72);
  const [receipt, setReceipt] = useState<UploadReceipt | null>(null);
  const [appealRows, setAppealRows] = useState(appeals);
  const [taskRows, setTaskRows] = useState(tasks);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [selectedTaskId, setSelectedTaskId] = useState(() => tasks[0]?.id ?? 0);
  const resultsRef = useRef<HTMLDivElement>(null);

  const selectedCourse = courses.find((course) => course.id === selectedCourseId) ?? courses[0] ?? null;
  const currentCourseId = selectedCourse?.id ?? selectedCourseId;
  const visibleTasks = useMemo(
    () => taskRows.filter((task) => task.courseId === currentCourseId),
    [currentCourseId, taskRows],
  );
  const selectedTask = visibleTasks.find((task) => task.id === selectedTaskId) ?? visibleTasks[0];
  const submittedCount = visibleTasks.filter((task) => task.status !== '未提交').length;
  const pendingCount = Math.max(visibleTasks.length - submittedCount, 0);
  const latestPublishedResult = publishedResults.find((result) => (
    visibleTasks.some((task) => task.id === result.assignmentId)
  )) ?? null;

  const courseStats = courses.map((course) => {
    const courseTasks = taskRows.filter((task) => task.courseId === course.id);
    return {
      course,
      total: courseTasks.length,
      submitted: courseTasks.filter((task) => task.status !== '未提交').length,
      published: courseTasks.filter((task) => task.status === '已发布成绩').length,
    };
  });

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

  const chooseTaskForUpload = (taskId: number) => {
    setSelectedTaskId(taskId);
    setReceipt(null);
    setUploadProgress(36);
    onOpenSubmit();
  };

  useEffect(() => {
    setTaskRows((current) => reconcileTaskRows(tasks, current));
  }, [tasks]);

  useEffect(() => {
    if (!selectedCourse && courses[0]) {
      onCourseChange(courses[0].id);
    }
  }, [courses, onCourseChange, selectedCourse]);

  useEffect(() => {
    if (visibleTasks.length > 0 && !visibleTasks.some((task) => task.id === selectedTaskId)) {
      setSelectedTaskId(visibleTasks[0].id);
      setReceipt(null);
    }
  }, [selectedTaskId, visibleTasks]);

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
      task.id === selectedTask.id
        ? {
          ...task,
          status: '已提交',
          score: undefined,
          submissionId: nextReceipt.submissionId,
          fileName: nextReceipt.fileName,
          version: nextReceipt.version,
          submittedAt: nextReceipt.submittedAt,
        }
        : task
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

  const handleDeleteSubmission = async (submissionId: number) => {
    await deleteSubmission(submissionId);
    setReceipt(null);
    setTaskRows((current) => current.map((task) => (
      task.submissionId === submissionId
        ? {
          ...task,
          status: '未提交',
          score: undefined,
          submissionId: undefined,
          fileName: undefined,
          version: undefined,
          submittedAt: undefined,
        }
        : task
    )));
    setUploadProgress(36);
    await onWorkspaceRefresh();
  };

  const submitAppeal = async (resultId: number, rubricItemId: number | null) => {
    const appeal = await createAppeal(
      resultId,
      rubricItemId,
      userId,
      '我认为该评分项有可补充说明，申请教师复核。',
      '请重新查看报告中的相关章节和截图证据。',
    );
    setAppealRows((current) => [appeal, ...current.filter((item) => item.id !== appeal.id)]);
    await onWorkspaceRefresh();
  };

  return (
    <section className="student-grid">
      <article className="student-hero panel wide-panel">
        <div>
          <p className="eyebrow">{activeView === 'submit' ? '提交报告' : '我的课程'}</p>
          <h2>{selectedCourse?.name ?? '我的课程'}</h2>
          <p className="student-hero-copy">
            {activeView === 'submit'
              ? '请确认当前课程和任务后上传报告。已提交任务再次提交会覆盖上一份报告，教师端只批改最新文件。'
              : '在这里切换课程，查看每门课程的实训任务和提交状态。'}
          </p>
        </div>
        <div className="student-hero-metrics">
          <div>
            <span>待提交</span>
            <strong>{pendingCount}</strong>
          </div>
          <div>
            <span>已提交</span>
            <strong>{submittedCount}</strong>
          </div>
          <div>
            <span>最近成绩</span>
            <strong>{latestPublishedResult?.teacherScore ?? '--'}</strong>
          </div>
        </div>
      </article>

      <article className="panel wide-panel student-course-switcher">
        <div className="panel-heading">
          <div>
            <h3>课程切换</h3>
            <span className="panel-subtitle">当前提交和任务列表都会跟随课程切换</span>
          </div>
          <GraduationCap size={22} />
        </div>
        <div className="student-course-controls">
          <label className="file-name-field">
            当前课程
            <select
              value={currentCourseId}
              onChange={(event) => {
                onCourseChange(Number(event.target.value));
                setReceipt(null);
              }}
            >
              {courses.map((course) => (
                <option key={course.id} value={course.id}>
                  {course.name}
                </option>
              ))}
            </select>
          </label>
          <div className="student-course-cards">
            {courseStats.map(({ course, total, submitted, published }) => (
              <button
                className={`student-course-card ${course.id === currentCourseId ? 'selected' : ''}`}
                key={course.id}
                type="button"
                onClick={() => {
                  onCourseChange(course.id);
                  setReceipt(null);
                }}
              >
                <strong>{course.name}</strong>
                <span>{course.semester} · {course.code}</span>
                <small>{submitted}/{total} 已提交 · {published} 个成绩已发布</small>
              </button>
            ))}
          </div>
        </div>
      </article>

      {activeView === 'courses' ? (
        <StudentCourseTaskTable
          tasks={visibleTasks}
          onChooseTask={chooseTaskForUpload}
          onScrollToResults={scrollToResults}
        />
      ) : (
        <>
          <StudentUploadPanel
            receipt={receipt}
            selectedFileName={selectedFileName}
            selectedTask={selectedTask}
            tasks={visibleTasks}
            uploadProgress={uploadProgress}
            userName={userName}
            userStudentNo={userStudentNo}
            onConfirmUpload={confirmUpload}
            onDeleteSubmission={handleDeleteSubmission}
            onFileNameChange={handleUploadFileNameChange}
            onFileSelect={selectUploadFile}
            onTaskSelect={handleUploadTaskSelect}
          />
          <StudentCourseTaskTable
            tasks={visibleTasks}
            onChooseTask={chooseTaskForUpload}
            onScrollToResults={scrollToResults}
          />
        </>
      )}

      <StudentResultsPanel
        appeals={appealRows}
        publishedResults={publishedResults.filter((result) => visibleTasks.some((task) => task.id === result.assignmentId))}
        resultsRef={resultsRef}
        onSubmitAppeal={submitAppeal}
      />
    </section>
  );
}

function StudentCourseTaskTable({
  tasks,
  onChooseTask,
  onScrollToResults,
}: {
  tasks: SubmissionTask[];
  onChooseTask: (taskId: number) => void;
  onScrollToResults: () => void;
}) {
  return (
    <article className="panel wide-panel student-task-panel">
      <div className="panel-heading">
        <div>
          <h3>实训任务</h3>
          <span className="panel-subtitle">已提交任务可重新上传，系统会覆盖上一份报告</span>
        </div>
        <FileText size={22} />
      </div>
      {tasks.length === 0 ? (
        <div className="empty-result compact">
          <strong>当前课程暂无任务</strong>
          <span>教师发布任务后会在这里显示。</span>
        </div>
      ) : (
        <div className="table-shell">
          <div className="table-scroll table-scroll-md">
            <table className="data-table">
              <thead>
                <tr>
                  <th>任务</th>
                  <th>截止时间</th>
                  <th>状态</th>
                  <th>成绩</th>
                  <th>提交说明</th>
                  <th className="actions-col">操作</th>
                </tr>
              </thead>
              <tbody>
                {tasks.map((task) => (
                  <tr key={task.id}>
                    <td>{task.title}</td>
                    <td><span className="table-inline"><CalendarClock size={14} /> {formatDate(task.deadline)}</span></td>
                    <td>{task.status}</td>
                    <td>{task.score !== undefined ? `${task.score} 分` : '-'}</td>
                    <td>
                      {task.submissionId ? (
                        <span className="table-inline"><CheckCircle2 size={14} /> 已提交，重新提交会覆盖上一份</span>
                      ) : '尚未提交'}
                    </td>
                    <td>
                      <button
                        className={task.status === '未提交' ? 'primary-button compact' : 'ghost-button compact'}
                        type="button"
                        onClick={() => {
                          if (task.status === '已发布成绩') {
                            onScrollToResults();
                          } else {
                            onChooseTask(task.id);
                          }
                        }}
                      >
                        {task.status === '未提交' ? '立即提交' : task.status === '已发布成绩' ? '查看批注' : '重新提交'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </article>
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
        submissionId: current.submissionId,
        fileName: current.fileName,
        version: current.version,
        submittedAt: current.submittedAt,
      };
    }
    return incoming;
  });
}
