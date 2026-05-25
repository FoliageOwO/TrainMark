import { useEffect, useMemo, useState } from 'react';
import { mockApi } from '../api/mockApi';
import {
  loginAsRole,
  logoutCurrentSession,
  loadWorkspaceData,
  refreshCurrentSession,
  shouldUseHttpApi,
  type WorkspaceData,
} from '../api/httpApi';
import type {
  AssignmentSummary,
  CollectionOverview,
  DashboardMetrics,
  GradingJobSummary,
  GradingResultSummary,
  RoleCode,
  UserProfile,
} from '../api/types';
import { AdminDashboard } from '../components/AdminDashboard';
import { AppChrome } from '../components/AppChrome';
import { StudentDashboard } from '../components/StudentDashboard';
import { TeacherDashboard } from '../components/TeacherDashboard';

const routeRoleMap: Record<string, RoleCode> = {
  admin: 'ADMIN',
  course_owner: 'COURSE_OWNER',
  owner: 'COURSE_OWNER',
  student: 'STUDENT',
  supervisor: 'SUPERVISOR',
  teacher: 'TEACHER',
};

const sectionToNavLabel: Record<string, string> = {
  overview: '工作台',
  courses: '课程与班级',
  assignments: '实训任务',
  collection: '报告收集',
  'ai-pipeline': 'AI 批改中心',
  review: '人工复核',
  appeals: '申诉处理',
  analytics: '失分分析',
  roster: '工作台',
  similarity: 'AI 批改中心',
  operations: '工作台',
  'student-courses': '我的课程',
  'student-submit': '提交报告',
};

function getRoleFromLocation(): RoleCode {
  if (typeof window === 'undefined') {
    return 'TEACHER';
  }

  const role = new URLSearchParams(window.location.search).get('role')?.toLowerCase();
  return role ? routeRoleMap[role] ?? 'TEACHER' : 'TEACHER';
}

function writeRoleToLocation(role: RoleCode) {
  if (typeof window === 'undefined') {
    return;
  }

  const nextUrl = new URL(window.location.href);
  nextUrl.searchParams.set('role', role.toLowerCase());
  window.history.replaceState(null, '', nextUrl);
}

function getSectionFromLocation(): string {
  if (typeof window === 'undefined') {
    return 'overview';
  }

  return new URLSearchParams(window.location.search).get('section') ?? 'overview';
}

function writeSectionToLocation(section: string) {
  if (typeof window === 'undefined') {
    return;
  }

  const nextUrl = new URL(window.location.href);
  nextUrl.searchParams.set('section', section);
  window.history.replaceState(null, '', nextUrl);
}

function defaultNavForRole(role: RoleCode) {
  if (role === 'STUDENT') {
    return '我的课程';
  }
  if (role === 'ADMIN') {
    return '系统管理';
  }
  return '工作台';
}

function defaultSectionForRole(role: RoleCode) {
  if (role === 'STUDENT') {
    return 'student-courses';
  }
  if (role === 'ADMIN') {
    return 'roster';
  }
  return 'overview';
}

function navLabelFromLocation(role: RoleCode) {
  const section = getSectionFromLocation();
  if (role === 'STUDENT') {
    return section === 'student-submit' ? '提交报告' : '我的课程';
  }
  if (role === 'ADMIN') {
    return '系统管理';
  }
  return sectionToNavLabel[section] ?? defaultNavForRole(role);
}

export function App() {
  const [user, setUser] = useState<UserProfile>(() => mockApi.login(getRoleFromLocation()));
  const [activeNav, setActiveNav] = useState(() => navLabelFromLocation(getRoleFromLocation()));
  const [teacherSection, setTeacherSection] = useState(getSectionFromLocation);
  const [selectedCourseId, setSelectedCourseId] = useState(1);
  const [workspaceData, setWorkspaceData] = useState<WorkspaceData | null>(null);
  const [apiError, setApiError] = useState<string | null>(null);
  const [apiSessionReady, setApiSessionReady] = useState(() => !shouldUseHttpApi());

  const teacherNavMap: Record<string, string> = {
    '工作台': 'overview',
    '课程与班级': 'courses',
    '实训任务': 'assignments',
    '报告收集': 'collection',
    'AI 批改中心': 'ai-pipeline',
    '人工复核': 'review',
    '申诉处理': 'appeals',
    '失分分析': 'analytics',
    '系统管理': 'roster',
  };
  const studentNavMap: Record<string, string> = {
    '我的课程': 'student-courses',
    '提交报告': 'student-submit',
  };

  const handleNavChange = (label: string) => {
    setActiveNav(label);
    if (primaryRole === 'STUDENT') {
      writeSectionToLocation(studentNavMap[label] ?? 'student-courses');
      return;
    }
    const mapped = teacherNavMap[label];
    if (mapped && primaryRole !== 'STUDENT' && primaryRole !== 'ADMIN') {
      setTeacherSection(mapped);
      writeSectionToLocation(mapped);
    }
  };

  const handleSectionChange = (section: string) => {
    setTeacherSection(section);
    writeSectionToLocation(section);
    const label = sectionToNavLabel[section];
    if (label) {
      setActiveNav(label);
    }
  };

  const primaryRole = user.roles[0];
  const courses = workspaceData?.courses ?? mockApi.listCourses();
  const selectedCourse = courses.find((course) => course.id === selectedCourseId) ?? courses[0] ?? null;
  const selectedWorkspaceCourseId = selectedCourse?.id ?? selectedCourseId;
  const classes = workspaceData?.classes ?? (selectedCourse ? mockApi.listClasses(selectedCourse.id) : []);
  const assignments = workspaceData?.assignments ?? (selectedCourse ? mockApi.listAssignments(selectedCourse.id) : []);
  const selectedAssignmentId = assignments.find((assignment) => assignment.courseId === selectedWorkspaceCourseId)?.id ?? assignments[0]?.id ?? 1;
  const studentTasks = workspaceData?.studentTasks ?? mockApi.listStudentTasks();
  const organizations = workspaceData?.organizations ?? mockApi.listOrganizations();
  const directoryUsers = workspaceData?.users ?? mockApi.listUsers();
  const students = workspaceData?.students ?? mockApi.listUsers('STUDENT');
  const classStudents = workspaceData?.classStudents ?? buildMockClassStudents(classes);
  const importPreview = mockApi.getStudentImportPreview();
  const collectionOverview = workspaceData?.collectionOverview ?? mockApi.getCollectionOverview(selectedAssignmentId);
  const unsubmittedStudents = workspaceData?.unsubmittedStudents ?? mockApi.listUnsubmittedStudents(selectedAssignmentId);
  const rubrics = workspaceData?.rubrics ?? mockApi.listRubrics(selectedAssignmentId);
  const gradingJobs = workspaceData?.gradingJobs ?? mockApi.listGradingJobs(selectedAssignmentId);
  const ocrJobs = workspaceData?.ocrJobs ?? mockApi.listOcrJobs();
  const gradingResults = workspaceData?.gradingResults ?? mockApi.listGradingResults(selectedAssignmentId);
  const publicationAudits = workspaceData?.publicationAudits ?? mockApi.listPublicationAudits();
  const publishedResults = workspaceData?.publishedResults ?? mockApi.listPublishedResults(user.id);
  const gradeExports = workspaceData?.gradeExports ?? mockApi.listGradeExports(selectedAssignmentId);
  const gradeStatistics = workspaceData?.gradeStatistics ?? mockApi.getGradeStatistics(selectedAssignmentId);
  const lossPoints = workspaceData?.lossPoints ?? mockApi.listLossPoints(selectedAssignmentId);
  const courseOutcomes = workspaceData?.courseOutcomes ?? mockApi.listCourseOutcomes(selectedAssignmentId);
  const allAppeals = workspaceData?.appeals ?? mockApi.listAppeals();
  const studentAppeals = useMemo(
    () => allAppeals.filter((item) => item.studentId === user.id),
    [allAppeals, user.id],
  );
  const similarityJobs = workspaceData?.similarityJobs ?? mockApi.listSimilarityJobs(selectedAssignmentId);
  const auditLogs = workspaceData?.auditLogs ?? mockApi.listAuditLogs();
  const systemSettings = workspaceData?.systemSettings ?? mockApi.listSystemSettings();
  const metrics = deriveTeacherMetrics(assignments, gradingJobs, gradingResults, collectionOverview);

  useEffect(() => {
    let cancelled = false;
    const syncRoleFromLocation = async () => {
      const role = getRoleFromLocation();
      if (shouldUseHttpApi()) {
        setApiSessionReady(false);
      }
      try {
        const refreshedUser = await refreshCurrentSession();
        const nextUser = refreshedUser?.roles[0] === role ? refreshedUser : await loginAsRole(role);
        if (!cancelled) {
          setUser(nextUser);
          setApiError(null);
          setApiSessionReady(true);
          window.dispatchEvent(new Event('trainmark:notifications-changed'));
        }
      } catch (error) {
        if (!cancelled) {
          setApiError(errorMessage(error));
          setApiSessionReady(false);
        }
      }
    };

    void syncRoleFromLocation();
    window.addEventListener('popstate', syncRoleFromLocation);
    return () => {
      cancelled = true;
      window.removeEventListener('popstate', syncRoleFromLocation);
    };
  }, []);

  useEffect(() => {
    const syncSectionFromLocation = () => {
      const section = getSectionFromLocation();
      setTeacherSection(section);
      setActiveNav(navLabelFromLocation(getRoleFromLocation()));
    };

    window.addEventListener('popstate', syncSectionFromLocation);
    return () => {
      window.removeEventListener('popstate', syncSectionFromLocation);
    };
  }, []);

  const handleRoleChange = async (role: RoleCode) => {
    writeRoleToLocation(role);
    const nextSection = defaultSectionForRole(role);
    writeSectionToLocation(nextSection);
    setTeacherSection(nextSection);
    setActiveNav(defaultNavForRole(role));
    if (shouldUseHttpApi()) {
      setApiSessionReady(false);
      setWorkspaceData(null);
    }
    try {
      setUser(await loginAsRole(role));
      setApiError(null);
      setApiSessionReady(true);
      window.dispatchEvent(new Event('trainmark:notifications-changed'));
    } catch (error) {
      setApiError(errorMessage(error));
      setApiSessionReady(false);
    }
  };

  const handleLogout = async () => {
    const nextRole = getRoleFromLocation();
    if (shouldUseHttpApi()) {
      setApiSessionReady(false);
      setWorkspaceData(null);
    }
    try {
      await logoutCurrentSession();
      setWorkspaceData(null);
      setUser(await loginAsRole(nextRole));
      setApiError(null);
      setApiSessionReady(true);
      window.dispatchEvent(new Event('trainmark:notifications-changed'));
    } catch (error) {
      setApiError(errorMessage(error));
      setApiSessionReady(false);
    }
  };

  useEffect(() => {
    if (!shouldUseHttpApi()) {
      setWorkspaceData(null);
      setApiError(null);
      return;
    }

    if (!apiSessionReady) {
      return;
    }

    let cancelled = false;
    loadWorkspaceData(selectedCourseId, user.id, primaryRole)
      .then((data) => {
        if (!cancelled) {
          setWorkspaceData(data);
          setApiError(null);
        }
      })
      .catch((error) => {
        if (!cancelled) {
          setWorkspaceData(null);
          setApiError(errorMessage(error));
        }
      });
    return () => {
      cancelled = true;
    };
  }, [apiSessionReady, primaryRole, selectedCourseId, user.id]);

  const refreshWorkspaceData = async () => {
    const notifyChanged = () => {
      window.dispatchEvent(new Event('trainmark:notifications-changed'));
    };
    if (!shouldUseHttpApi() || !apiSessionReady) {
      notifyChanged();
      return;
    }
    try {
      const data = await loadWorkspaceData(selectedCourseId, user.id, primaryRole);
      setWorkspaceData(data);
      setApiError(null);
      notifyChanged();
    } catch (error) {
      setWorkspaceData(null);
      setApiError(errorMessage(error));
      throw error;
    }
  };

  const teacherStats = [
    { label: '进行中任务', value: String(metrics.activeAssignments), trend: '当前课程', tone: 'blue' },
    { label: '待 AI 批改', value: String(metrics.pendingGrading), trend: '来自批改队列', tone: 'violet' },
    { label: '待教师复核', value: String(metrics.pendingReview), trend: '未完成复核', tone: 'teal' },
    { label: '未提交学生', value: String(metrics.unsubmitted), trend: '当前任务', tone: 'orange' },
  ];

  return (
    <AppChrome
      activeNav={activeNav}
      primaryRole={primaryRole}
      user={user}
      onNavChange={handleNavChange}
      onLogout={handleLogout}
      onRoleChange={handleRoleChange}
    >
      {apiError ? (
      <section className="empty-result">
          <strong>HTTP API 联调失败</strong>
          <span>{apiError}</span>
        </section>
      ) : null}
      {primaryRole === 'STUDENT' ? (
        <StudentDashboard
          activeView={activeNav === '提交报告' ? 'submit' : 'courses'}
          courses={courses}
          selectedCourseId={selectedCourseId}
          tasks={studentTasks}
          publishedResults={publishedResults}
          appeals={studentAppeals}
          userId={user.id}
          userName={user.name}
          userStudentNo={user.username}
          onCourseChange={setSelectedCourseId}
          onOpenSubmit={() => handleNavChange('提交报告')}
          onWorkspaceRefresh={refreshWorkspaceData}
        />
      ) : primaryRole === 'ADMIN' ? (
        <AdminDashboard
          organizations={organizations}
          users={directoryUsers}
          auditLogs={auditLogs}
          systemSettings={systemSettings}
          onWorkspaceRefresh={refreshWorkspaceData}
        />
      ) : !selectedCourse ? (
        <section className="empty-result">
          <strong>暂无课程数据</strong>
          <span>当前接口没有返回可用课程，教师工作台会在课程数据同步后恢复。</span>
        </section>
      ) : (
        <TeacherDashboard
          assignments={assignments}
          classes={classes}
          courses={courses}
          selectedCourse={selectedCourse}
          selectedCourseId={selectedCourseId}
          setSelectedCourseId={setSelectedCourseId}
          stats={teacherStats}
          importPreview={importPreview}
          organizations={organizations}
          collectionOverview={collectionOverview}
          students={students}
          classStudents={classStudents}
          unsubmittedStudents={unsubmittedStudents}
          rubrics={rubrics}
          gradingJobs={gradingJobs}
          submissions={workspaceData?.submissions ?? []}
          ocrJobs={ocrJobs}
          gradingResults={gradingResults}
          publicationAudits={publicationAudits}
          operatorName={user.name}
          gradeExports={gradeExports}
          gradeStatistics={gradeStatistics}
          lossPoints={lossPoints}
          courseOutcomes={courseOutcomes}
          appeals={allAppeals}
          similarityJobs={similarityJobs}
          onWorkspaceRefresh={refreshWorkspaceData}
          activeSection={teacherSection}
          onSectionChange={handleSectionChange}
        />
      )}
    </AppChrome>
  );
}

function buildMockClassStudents(classes: Array<{ id: number }>) {
  return Object.fromEntries(classes.map((teachingClass) => [
    teachingClass.id,
    mockApi.listClassStudents(teachingClass.id),
  ]));
}

function deriveTeacherMetrics(
  assignments: AssignmentSummary[],
  gradingJobs: GradingJobSummary[],
  gradingResults: GradingResultSummary[],
  collectionOverview: CollectionOverview,
): DashboardMetrics {
  return {
    activeAssignments: assignments.filter((assignment) => assignment.status === 'PUBLISHED').length,
    pendingGrading: gradingJobs.reduce((total, job) => {
      if (job.status === 'COMPLETED' || job.status === 'FAILED') {
        return total;
      }
      return total + Math.max(job.totalSubmissions - job.completedSubmissions, 0);
    }, 0),
    pendingReview: gradingResults.filter((result) => (
      result.reviewStatus === 'NEEDS_REVIEW' || result.reviewStatus === 'IN_REVIEW'
    )).length,
    unsubmitted: collectionOverview.unsubmitted,
  };
}

function errorMessage(error: unknown) {
  return error instanceof Error ? error.message : '未知接口错误';
}
