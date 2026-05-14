import { useEffect, useMemo, useState } from 'react';
import { mockApi } from '../api/mockApi';
import {
  loadWorkspaceData,
  shouldUseHttpApi,
  type WorkspaceData,
} from '../api/httpApi';
import type { RoleCode, UserProfile } from '../api/types';
import { AdminDashboard } from '../components/AdminDashboard';
import { AppChrome } from '../components/AppChrome';
import { StudentDashboard } from '../components/StudentDashboard';
import { TeacherDashboard } from '../components/TeacherDashboard';

const routeRoleMap: Record<string, RoleCode> = {
  admin: 'ADMIN',
  student: 'STUDENT',
  teacher: 'TEACHER',
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

export function App() {
  const [user, setUser] = useState<UserProfile>(() => mockApi.login(getRoleFromLocation()));
  const [activeNav, setActiveNav] = useState('工作台');
  const [selectedCourseId, setSelectedCourseId] = useState(1);
  const [workspaceData, setWorkspaceData] = useState<WorkspaceData | null>(null);
  const [apiModeLabel, setApiModeLabel] = useState(shouldUseHttpApi() ? 'HTTP API' : 'Mock 数据');

  const primaryRole = user.roles[0];
  const metrics = mockApi.getMetrics();
  const courses = workspaceData?.courses ?? mockApi.listCourses();
  const selectedCourse = courses.find((course) => course.id === selectedCourseId) ?? courses[0];
  const classes = workspaceData?.classes ?? mockApi.listClasses(selectedCourse.id);
  const assignments = workspaceData?.assignments ?? mockApi.listAssignments(selectedCourse.id);
  const selectedAssignmentId = assignments.find((assignment) => assignment.courseId === selectedCourse.id)?.id ?? assignments[0]?.id ?? 1;
  const studentTasks = workspaceData?.studentTasks ?? mockApi.listStudentTasks();
  const organizations = workspaceData?.organizations ?? mockApi.listOrganizations();
  const students = workspaceData?.students ?? mockApi.listUsers('STUDENT');
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

  useEffect(() => {
    const syncRoleFromLocation = () => {
      setUser(mockApi.login(getRoleFromLocation()));
    };

    window.addEventListener('popstate', syncRoleFromLocation);
    return () => window.removeEventListener('popstate', syncRoleFromLocation);
  }, []);

  const handleRoleChange = (role: RoleCode) => {
    writeRoleToLocation(role);
    setUser(mockApi.login(role));
  };

  useEffect(() => {
    if (!shouldUseHttpApi()) {
      setWorkspaceData(null);
      setApiModeLabel('Mock 数据');
      return;
    }

    let cancelled = false;
    loadWorkspaceData(selectedCourseId, user.id, primaryRole).then((data) => {
      if (!cancelled) {
        setWorkspaceData(data);
        setApiModeLabel('HTTP API / Mock 兜底');
      }
    });
    return () => {
      cancelled = true;
    };
  }, [primaryRole, selectedCourseId, user.id]);

  const teacherStats = [
    { label: '进行中任务', value: String(metrics.activeAssignments), trend: '+2 本周', tone: 'blue' },
    { label: '待 AI 批改', value: String(metrics.pendingGrading), trend: '预计 42 分钟', tone: 'violet' },
    { label: '待教师复核', value: String(metrics.pendingReview), trend: '低置信度优先', tone: 'teal' },
    { label: '未提交学生', value: String(metrics.unsubmitted), trend: '今晚 18:00 催交', tone: 'orange' },
  ];

  return (
    <AppChrome
      activeNav={activeNav}
      apiModeLabel={apiModeLabel}
      primaryRole={primaryRole}
      user={user}
      onNavChange={setActiveNav}
      onRoleChange={handleRoleChange}
    >
      {primaryRole === 'STUDENT' ? (
        <StudentDashboard tasks={studentTasks} publishedResults={publishedResults} appeals={studentAppeals} userId={user.id} />
      ) : primaryRole === 'ADMIN' ? (
        <AdminDashboard
          organizations={organizations}
          students={students}
          auditLogs={auditLogs}
          systemSettings={systemSettings}
        />
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
        />
      )}
    </AppChrome>
  );
}
