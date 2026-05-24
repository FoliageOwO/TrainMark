import { Plus, Users } from 'lucide-react';
import type { CourseSummary, TeachingClassSummary } from '../api/types';

const statusText = {
  ACTIVE: '进行中',
  DRAFT: '草稿',
  ARCHIVED: '已归档',
  PUBLISHED: '已发布',
  CLOSED: '已截止',
};

type TeacherCoursePanelProps = {
  classes: TeachingClassSummary[];
  courses: CourseSummary[];
  selectedCourseId: number;
  onSelectCourse: (courseId: number) => void;
};

export function TeacherCoursePanel({
  classes,
  courses,
  selectedCourseId,
  onSelectCourse,
}: TeacherCoursePanelProps) {
  return (
    <article className="panel">
      <div className="panel-heading">
        <div>
          <h3>课程与班级</h3>
        </div>
        <button className="ghost-button" type="button"><Plus size={15} /> 新建课程</button>
      </div>

      <section className="management-grid">
        <div className="table-shell">
          <div className="table-scroll table-scroll-md">
            <table className="data-table">
              <thead>
                <tr>
                  <th>课程</th>
                  <th>学期</th>
                  <th>班级</th>
                  <th>学生</th>
                  <th>状态</th>
                </tr>
              </thead>
              <tbody>
                {courses.map((course) => (
                  <tr
                    className={selectedCourseId === course.id ? 'is-selected is-clickable' : 'is-clickable'}
                    key={course.id}
                    onClick={() => onSelectCourse(course.id)}
                  >
                    <td>
                      <div className="table-primary">
                        <strong>{course.name}</strong>
                        <span>{course.code}</span>
                      </div>
                    </td>
                    <td>{course.semester}</td>
                    <td>{course.classCount}</td>
                    <td>{course.studentCount}</td>
                    <td>{statusText[course.status]}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {classes.length === 0 ? (
          <div className="empty-state">
            <Users size={32} />
            <p>暂无班级</p>
            <span>导入学生名单时会自动创建班级</span>
          </div>
        ) : (
          <div className="table-shell">
            <div className="table-scroll table-scroll-md">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>班级</th>
                    <th>专业</th>
                    <th>年级</th>
                    <th>人数</th>
                  </tr>
                </thead>
                <tbody>
                  {classes.map((item) => (
                    <tr key={item.id}>
                      <td>{item.name}</td>
                      <td>{item.major}</td>
                      <td>{item.grade}级</td>
                      <td>{item.studentCount}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </section>
    </article>
  );
}
