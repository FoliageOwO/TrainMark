import { useEffect, useMemo, useState } from 'react';
import { mockApi } from '../api/mockApi';
import {
  loginWithCredentials,
  registerWithCredentials,
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
  GradeStatisticsSummary,
  GradingJobSummary,
  GradingResultSummary,
  RoleCode,
  StudentImportPreview,
  UserProfile,
} from '../api/types';
import { AdminDashboard } from '../components/AdminDashboard';
import { AppChrome } from '../components/AppChrome';
import { AuthPage } from '../components/AuthPage';
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
  courses: '课程准备',
  assignments: '任务发布',
  collection: '报告收集',
  'ai-pipeline': 'AI 批改',
  review: '人工复核',
  analytics: '结果分析',
  roster: '工作台',
  similarity: 'AI 批改',
  'student-courses': '我的课程',
  'student-submit': '提交报告',
};

const teacherNavLabelToSection: Record<string, string> = {
  工作台: 'overview',
  课程准备: 'courses',
  任务发布: 'assignments',
  报告收集: 'collection',
  'AI 批改': 'ai-pipeline',
  人工复核: 'review',
  结果分析: 'analytics',
  系统管理: 'roster',
};

function getRoleFromLocation(): RoleCode {
  if (shouldUseHttpApi()) {
    return 'TEACHER';
  }
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
  if (shouldUseHttpApi()) {
    nextUrl.searchParams.delete('role');
    window.history.replaceState(null, '', nextUrl);
    return;
  }
  nextUrl.searchParams.set('role', role.toLowerCase());
  window.history.replaceState(null, '', nextUrl);
}

function getSectionFromLocation(): string {
  if (typeof window === 'undefined') {
    return 'overview';
  }
  return normalizeTeacherSection(new URLSearchParams(window.location.search).get('section') ?? 'overview');
}

function writeSectionToLocation(section: string) {
  if (typeof window === 'undefined') {
    return;
  }

  const nextUrl = new URL(window.location.href);
  nextUrl.searchParams.set('section', normalizeTeacherSection(section));
  window.history.replaceState(null, '', nextUrl);
}

function normalizeTeacherSection(section: string) {
  return section === 'appeals' ? 'review' : section;
}

function sanitizeSectionForRole(role: RoleCode, section: string) {
  const normalized = normalizeTeacherSection(section);
  const allowedByRole: Record<RoleCode, string[]> = {
    TEACHER: ['overview', 'courses', 'assignments', 'collection', 'ai-pipeline', 'review', 'analytics'],
    COURSE_OWNER: ['overview', 'courses', 'assignments', 'collection', 'ai-pipeline', 'review', 'analytics'],
    SUPERVISOR: ['overview', 'courses', 'assignments', 'collection', 'analytics'],
    ADMIN: ['roster'],
    STUDENT: ['student-courses', 'student-submit'],
  };
  const allowed = allowedByRole[role] ?? ['overview'];
  return allowed.includes(normalized) ? normalized : defaultSectionForRole(role);
}

function clearWorkspaceLocationParams() {
  if (typeof window === 'undefined') {
    return;
  }
  const nextUrl = new URL(window.location.href);
  nextUrl.searchParams.delete('role');
  nextUrl.searchParams.delete('section');
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
  const section = sanitizeSectionForRole(role, getSectionFromLocation());
  if (role === 'STUDENT') {
    return section === 'student-submit' ? '提交报告' : '我的课程';
  }
  if (role === 'ADMIN') {
    return '系统管理';
  }
  return sectionToNavLabel[section] ?? defaultNavForRole(role);
}

export function App() {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [activeRole, setActiveRole] = useState<RoleCode | null>(null);
  const [activeNav, setActiveNav] = useState(() => navLabelFromLocation(getRoleFromLocation()));
  const [teacherSection, setTeacherSection] = useState(getSectionFromLocation);
  const [selectedCourseId, setSelectedCourseId] = useState(1);
  const [workspaceData, setWorkspaceData] = useState<WorkspaceData | null>(null);
  const [apiError, setApiError] = useState<string | null>(null);
  const [apiSessionReady, setApiSessionReady] = useState(() => !shouldUseHttpApi());
  const [retryingWorkspace, setRetryingWorkspace] = useState(false);
  const [workspaceLoaded, setWorkspaceLoaded] = useState(() => !shouldUseHttpApi());

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
    const mapped = teacherNavLabelToSection[label];
    if (mapped && primaryRole !== 'ADMIN') {
      setTeacherSection(mapped);
      writeSectionToLocation(mapped);
    }
  };

  const handleSectionChange = (section: string) => {
    const normalizedSection = sanitizeSectionForRole(primaryRole, section);
    setTeacherSection(normalizedSection);
    writeSectionToLocation(normalizedSection);
    const label = sectionToNavLabel[normalizedSection];
    if (label) {
      setActiveNav(label);
    }
  };

  const primaryRole = user
    ? (activeRole && user.roles.includes(activeRole) ? activeRole : user.roles[0])
    : 'TEACHER';
  const isHttpMode = shouldUseHttpApi();
  const hasHttpWorkspaceData = !isHttpMode || workspaceLoaded;
  const courses = workspaceData?.courses ?? (isHttpMode && !hasHttpWorkspaceData ? [] : (isHttpMode ? [] : mockApi.listCourses()));
  const selectedCourse = courses.find((course) => course.id === selectedCourseId) ?? courses[0] ?? null;
  const selectedWorkspaceCourseId = selectedCourse?.id ?? selectedCourseId;
  const classes = workspaceData?.classes ?? (isHttpMode ? [] : (selectedCourse ? mockApi.listClasses(selectedCourse.id) : []));
  const assignments = workspaceData?.assignments ?? (isHttpMode ? [] : (selectedCourse ? mockApi.listAssignments(selectedCourse.id) : []));
  const selectedAssignmentId = assignments.find((assignment) => assignment.courseId === selectedWorkspaceCourseId)?.id ?? assignments[0]?.id ?? 1;
  const studentTasks = workspaceData?.studentTasks ?? (isHttpMode ? [] : mockApi.listStudentTasks());
  const organizations = workspaceData?.organizations ?? (isHttpMode ? [] : mockApi.listOrganizations());
  const directoryUsers = workspaceData?.users ?? (isHttpMode ? [] : mockApi.listUsers());
  const students = workspaceData?.students ?? (isHttpMode ? [] : mockApi.listUsers('STUDENT'));
  const classStudents = workspaceData?.classStudents ?? (isHttpMode ? {} : buildMockClassStudents(classes));
  const importPreview: StudentImportPreview = isHttpMode
    ? { total: 0, valid: 0, duplicated: 0, invalid: 0 }
    : mockApi.getStudentImportPreview();
  const collectionOverview = workspaceData?.collectionOverview ?? (isHttpMode ? {
    assignmentId: selectedAssignmentId, totalStudents: 0, submitted: 0, unsubmitted: 0, lateSubmitted: 0, processing: 0, reviewed: 0, published: 0,
  } : mockApi.getCollectionOverview(selectedAssignmentId));
  const unsubmittedStudents = workspaceData?.unsubmittedStudents ?? (isHttpMode ? [] : mockApi.listUnsubmittedStudents(selectedAssignmentId));
  const rubrics = workspaceData?.rubrics ?? (isHttpMode ? [] : mockApi.listRubrics(selectedAssignmentId));
  const gradingJobs = workspaceData?.gradingJobs ?? (isHttpMode ? [] : mockApi.listGradingJobs(selectedAssignmentId));
  const ocrJobs = workspaceData?.ocrJobs ?? (isHttpMode ? [] : mockApi.listOcrJobs());
  const gradingResults = workspaceData?.gradingResults ?? (isHttpMode ? [] : mockApi.listGradingResults(selectedAssignmentId));
  const publicationAudits = workspaceData?.publicationAudits ?? (isHttpMode ? [] : mockApi.listPublicationAudits());
  const publishedResults = workspaceData?.publishedResults ?? (isHttpMode ? [] : mockApi.listPublishedResults(user?.id ?? 0));
  const gradeExports = workspaceData?.gradeExports ?? (isHttpMode ? [] : mockApi.listGradeExports(selectedAssignmentId));
  const gradeStatistics: GradeStatisticsSummary = workspaceData?.gradeStatistics ?? (isHttpMode
    ? {
      assignmentId: selectedAssignmentId,
      submittedCount: 0,
      publishedCount: 0,
      averageScore: 0,
      standardDeviation: 0,
      maxScore: 0,
      minScore: 0,
      difficultyIndex: 0,
      discriminationIndex: 0,
      scoreBuckets: [],
    }
    : mockApi.getGradeStatistics(selectedAssignmentId));
  const lossPoints = workspaceData?.lossPoints ?? (isHttpMode ? [] : mockApi.listLossPoints(selectedAssignmentId));
  const courseOutcomes = workspaceData?.courseOutcomes ?? (isHttpMode ? [] : mockApi.listCourseOutcomes(selectedAssignmentId));
  const allAppeals = workspaceData?.appeals ?? (isHttpMode ? [] : mockApi.listAppeals());
  const studentAppeals = useMemo(
    () => allAppeals.filter((item) => item.studentId === (user?.id ?? -1)),
    [allAppeals, user?.id],
  );
  const similarityJobs = workspaceData?.similarityJobs ?? (isHttpMode ? [] : mockApi.listSimilarityJobs(selectedAssignmentId));
  const auditLogs = workspaceData?.auditLogs ?? (isHttpMode ? [] : mockApi.listAuditLogs());
  const systemSettings = workspaceData?.systemSettings ?? (isHttpMode ? [] : mockApi.listSystemSettings());
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
        if (!cancelled && refreshedUser) {
          const nextUser = refreshedUser;
          const effectiveRole = nextUser.roles.includes(role) ? role : nextUser.roles[0];
          const nextSection = sanitizeSectionForRole(effectiveRole, getSectionFromLocation());
          setUser(nextUser);
          setActiveRole(effectiveRole);
          writeRoleToLocation(effectiveRole);
          writeSectionToLocation(nextSection);
          setTeacherSection(nextSection);
          setActiveNav(sectionToNavLabel[nextSection] ?? defaultNavForRole(effectiveRole));
          setApiError(null);
          setApiSessionReady(true);
          setWorkspaceLoaded(false);
          window.dispatchEvent(new Event('trainmark:notifications-changed'));
        } else if (!cancelled) {
          setUser(null);
          setActiveRole(null);
          clearWorkspaceLocationParams();
          setApiSessionReady(false);
          setWorkspaceLoaded(false);
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
    if (!user) {
      return;
    }
    if (!user.roles.includes(role)) {
      setApiError('当前账号没有该角色权限');
      return;
    }
    writeRoleToLocation(role);
    const nextSection = sanitizeSectionForRole(role, getSectionFromLocation());
    writeSectionToLocation(nextSection);
    setTeacherSection(nextSection);
    setActiveNav(defaultNavForRole(role));
    if (shouldUseHttpApi()) {
      setApiSessionReady(false);
      setWorkspaceData(null);
      setWorkspaceLoaded(false);
    }
    try {
      setActiveRole(role);
      setApiError(null);
      setApiSessionReady(true);
      window.dispatchEvent(new Event('trainmark:notifications-changed'));
    } catch (error) {
      setApiError(errorMessage(error));
      setApiSessionReady(false);
    }
  };

  const handleLogout = async () => {
    if (shouldUseHttpApi()) {
      setApiSessionReady(false);
      setWorkspaceData(null);
      setWorkspaceLoaded(false);
    }
    try {
      await logoutCurrentSession();
      setWorkspaceData(null);
      setUser(null);
      setActiveRole(null);
      clearWorkspaceLocationParams();
      setApiError(null);
      setApiSessionReady(false);
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
      setWorkspaceLoaded(true);
      return;
    }

    if (!apiSessionReady) {
      return;
    }

    let cancelled = false;
    if (!user) {
      return;
    }
    loadWorkspaceData(selectedCourseId, user.id, primaryRole)
      .then((data) => {
        if (!cancelled) {
          setWorkspaceData(data);
          setApiError(null);
          setWorkspaceLoaded(true);
        }
      })
      .catch((error) => {
        if (!cancelled) {
          setApiError(errorMessage(error));
          setWorkspaceLoaded(false);
        }
      });
    return () => {
      cancelled = true;
    };
  }, [apiSessionReady, primaryRole, selectedCourseId, user]);

  const refreshWorkspaceData = async () => {
    if (retryingWorkspace) {
      return;
    }
    setRetryingWorkspace(true);
    setApiError(null);
    const notifyChanged = () => {
      window.dispatchEvent(new Event('trainmark:notifications-changed'));
    };
    if (!shouldUseHttpApi() || !apiSessionReady || !user) {
      notifyChanged();
      setRetryingWorkspace(false);
      return;
    }
    try {
      const data = await loadWorkspaceData(selectedCourseId, user.id, primaryRole);
      setWorkspaceData(data);
      setApiError(null);
      setWorkspaceLoaded(true);
      notifyChanged();
    } catch (error) {
      setApiError(errorMessage(error));
      setWorkspaceLoaded(false);
      throw error;
    } finally {
      setRetryingWorkspace(false);
    }
  };

  const teacherStats = [
    { label: '进行中任务', value: String(metrics.activeAssignments), trend: '当前课程', tone: 'blue' },
    { label: '待 AI 批改', value: String(metrics.pendingGrading), trend: '来自批改队列', tone: 'violet' },
    { label: '待教师复核', value: String(metrics.pendingReview), trend: '未完成复核', tone: 'teal' },
    { label: '未提交学生', value: String(metrics.unsubmitted), trend: '当前任务', tone: 'orange' },
  ];

  const handleCredentialLogin = async (username: string, password: string) => {
    const profile = await loginWithCredentials(username, password);
    const initialRole = profile.roles[0];
    setWorkspaceData(null);
    setWorkspaceLoaded(false);
    setUser(profile);
    setActiveRole(initialRole);
    writeRoleToLocation(initialRole);
    const nextSection = defaultSectionForRole(initialRole);
    setTeacherSection(nextSection);
    writeSectionToLocation(nextSection);
    setActiveNav(defaultNavForRole(initialRole));
    setApiError(null);
    setApiSessionReady(true);
  };

  const handleBackToLogin = async () => {
    try {
      await logoutCurrentSession();
    } catch {
      // Ignore logout errors here; this action is best-effort cleanup for a broken session.
    } finally {
      setWorkspaceData(null);
      setUser(null);
      setActiveRole(null);
      clearWorkspaceLocationParams();
      setApiError(null);
      setApiSessionReady(false);
      window.dispatchEvent(new Event('trainmark:notifications-changed'));
    }
  };

  const handleRegister = async (payload: { username: string; name: string; password: string }) => {
    const profile = await registerWithCredentials(payload.username, payload.name, payload.password);
    const initialRole = profile.roles[0];
    setWorkspaceData(null);
    setWorkspaceLoaded(false);
    setUser(profile);
    setActiveRole(initialRole);
    writeRoleToLocation(initialRole);
    const nextSection = defaultSectionForRole(initialRole);
    setTeacherSection(nextSection);
    writeSectionToLocation(nextSection);
    setActiveNav(defaultNavForRole(initialRole));
    setApiError(null);
    setApiSessionReady(true);
  };

  if (!user) {
    const registerDisabledHint = shouldUseHttpApi()
      ? undefined
      : '当前处于 mock 模式，注册仅用于演示。请切换到 HTTP 模式完成真实注册。';
    return (
      <AuthPage
        onLogin={handleCredentialLogin}
        onRegister={handleRegister}
        error={apiError}
        registerDisabledHint={registerDisabledHint}
        showDemoAccountsHint={!shouldUseHttpApi()}
      />
    );
  }

  return (
    <AppChrome
      activeNav={activeNav}
      primaryRole={primaryRole}
      user={user}
      onNavChange={handleNavChange}
      onLogout={handleLogout}
      onRoleChange={handleRoleChange}
      allowRoleSwitch={!shouldUseHttpApi()}
    >
      {apiError ? (
        <section className={workspaceData ? 'reminder-result error' : 'empty-result'}>
          <strong>HTTP API 联调失败</strong>
          <span>{apiError}</span>
          {workspaceData ? <span>已保留最近一次成功加载的数据，可继续查看并稍后重试同步。</span> : null}
          <button className="ghost-button" type="button" aria-busy={retryingWorkspace} disabled={retryingWorkspace} onClick={() => void refreshWorkspaceData()}>
            {retryingWorkspace ? '重试中...' : '重试加载'}
          </button>
          <button className="ghost-button" type="button" aria-disabled={retryingWorkspace} disabled={retryingWorkspace} onClick={handleBackToLogin}>返回登录页</button>
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
