import { useEffect, useMemo, useRef, useState } from 'react';
import { Alert, Button, Card, Col, Empty, Progress, Row, Select, Space, Statistic, Table, Tag, Typography } from 'antd';
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
  const nextPendingTask = visibleTasks.find((task) => task.status === '未提交') ?? null;
  const currentBlocker = pendingCount > 0
    ? `当前阻塞：还有 ${pendingCount} 个任务未提交`
    : latestPublishedResult
      ? '当前阻塞：无'
      : '当前阻塞：等待教师发布成绩';
  const nextAction = pendingCount > 0
    ? '下一步：优先提交最近截止的任务。'
    : latestPublishedResult
      ? '下一步：查看批注并按需提交申诉。'
      : '下一步：已完成提交，等待教师发布成绩。';

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
      <Card
        className="wide-panel"
        styles={{
          body: {
            background: 'linear-gradient(135deg, rgba(22,119,255,0.10), rgba(255,255,255,0.98))',
            borderRadius: 20,
          },
        }}
      >
        <Row gutter={[24, 24]} align="middle">
          <Col xs={24} lg={14}>
            <Typography.Text type="secondary">{activeView === 'submit' ? '提交报告' : '我的课程'}</Typography.Text>
            <Typography.Title level={2} style={{ marginTop: 8, marginBottom: 8 }}>
              {selectedCourse?.name ?? '我的课程'}
            </Typography.Title>
            <Typography.Paragraph style={{ maxWidth: 720, marginBottom: 0 }}>
              {activeView === 'submit'
                ? '确认课程与任务后上传报告。已提交任务再次提交会覆盖上一份文件，教师端只批改最新版本。'
                : '在这里切换课程，查看每门课程的实训任务、提交状态和已发布成绩。'}
            </Typography.Paragraph>
          </Col>
          <Col xs={24} lg={10}>
            <Row gutter={[16, 16]}>
              <Col span={8}><Card><Statistic title="待提交" value={pendingCount} /></Card></Col>
              <Col span={8}><Card><Statistic title="已提交" value={submittedCount} /></Card></Col>
              <Col span={8}><Card><Statistic title="最近成绩" value={latestPublishedResult?.teacherScore ?? '--'} suffix={latestPublishedResult ? '分' : ''} /></Card></Col>
            </Row>
          </Col>
        </Row>
      </Card>

      <Card
        className="wide-panel student-course-switcher"
        title="课程切换"
        extra={<Space><GraduationCap size={18} /><Typography.Text type="secondary">提交和任务列表会随课程同步</Typography.Text></Space>}
      >
        <Space direction="vertical" size={16} style={{ width: '100%' }}>
          <Select
            value={currentCourseId}
            style={{ width: '100%' }}
            options={courses.map((course) => ({ value: course.id, label: course.name }))}
            onChange={(value) => {
              onCourseChange(value);
              setReceipt(null);
            }}
          />
          <Row gutter={[16, 16]}>
            {courseStats.map(({ course, total, submitted, published }) => (
              <Col xs={24} md={12} xl={8} key={course.id}>
                <Card
                  hoverable
                  style={course.id === currentCourseId ? { borderColor: '#1677ff', boxShadow: '0 12px 30px rgba(22,119,255,0.12)' } : undefined}
                  onClick={() => {
                    onCourseChange(course.id);
                    setReceipt(null);
                  }}
                >
                  <Space direction="vertical" size={4}>
                    <Typography.Text strong>{course.name}</Typography.Text>
                    <Typography.Text type="secondary">{course.semester} · {course.code}</Typography.Text>
                    <Typography.Text type="secondary">{submitted}/{total} 已提交 · {published} 个成绩已发布</Typography.Text>
                    <Progress percent={total === 0 ? 0 : Math.round((submitted / total) * 100)} size="small" showInfo={false} />
                  </Space>
                </Card>
              </Col>
            ))}
          </Row>
        </Space>
      </Card>

      <Alert
        type={pendingCount > 0 ? 'warning' : 'success'}
        showIcon
        message={currentBlocker}
        description={nextAction}
        action={pendingCount > 0 && nextPendingTask ? (
          <Button type="primary" onClick={() => chooseTaskForUpload(nextPendingTask.id)}>
            先提交待办任务
          </Button>
        ) : (
          <Button onClick={scrollToResults}>查看已发布成绩</Button>
        )}
      />

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
  const columns = [
    {
      title: '任务',
      dataIndex: 'title',
      key: 'title',
    },
    {
      title: '截止时间',
      key: 'deadline',
      render: (_: unknown, task: SubmissionTask) => <span className="table-inline"><CalendarClock size={14} /> {formatDate(task.deadline)}</span>,
    },
    {
      title: '状态',
      key: 'status',
      render: (_: unknown, task: SubmissionTask) => (
        <Tag color={task.status === '未提交' ? 'default' : task.status === '已发布成绩' ? 'success' : 'processing'}>
          {task.status}
        </Tag>
      ),
    },
    {
      title: '成绩',
      key: 'score',
      render: (_: unknown, task: SubmissionTask) => (task.score !== undefined ? `${task.score} 分` : '-'),
    },
    {
      title: '提交说明',
      key: 'submission',
      render: (_: unknown, task: SubmissionTask) => (
        task.submissionId
          ? <span className="table-inline"><CheckCircle2 size={14} /> 已提交，重新提交会覆盖上一份</span>
          : '尚未提交'
      ),
    },
    {
      title: '操作',
      key: 'actions',
      render: (_: unknown, task: SubmissionTask) => (
        <Button
          type={task.status === '未提交' ? 'primary' : 'default'}
          onClick={() => {
            if (task.status === '已发布成绩') {
              onScrollToResults();
            } else {
              onChooseTask(task.id);
            }
          }}
        >
          {task.status === '未提交' ? '立即提交' : task.status === '已发布成绩' ? '查看批注' : '重新提交'}
        </Button>
      ),
    },
  ];

  return (
    <Card
      className="wide-panel student-task-panel"
      title="实训任务"
      extra={<Space><FileText size={18} /><Typography.Text type="secondary">已提交任务可重新上传，系统只保留最新版本</Typography.Text></Space>}
    >
      {tasks.length === 0 ? (
        <Empty description="当前课程暂无任务，教师发布后会在这里显示。" />
      ) : (
        <Table<SubmissionTask> rowKey="id" columns={columns} dataSource={tasks} pagination={false} scroll={{ x: 960 }} />
      )}
    </Card>
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
