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
  selectedCourse: CourseSummary;
  selectedCourseId: number;
  onSelectCourse: (courseId: number) => void;
};

export function TeacherCoursePanel({
  classes,
  courses,
  selectedCourse,
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

      <div className="course-tabs">
        {courses.map((course) => (
          <button
            className={selectedCourseId === course.id ? 'selected' : ''}
            key={course.id}
            type="button"
            onClick={() => onSelectCourse(course.id)}
          >
            <strong>{course.name}</strong>
            <span>{course.code}</span>
          </button>
        ))}
      </div>

      <div className="course-summary-card">
        <div>
          <p className="eyebrow">当前课程</p>
          <h3>{selectedCourse.name}</h3>
          <span>{selectedCourse.semester} · {statusText[selectedCourse.status]}</span>
        </div>
        <div className="summary-metrics">
          <span>{selectedCourse.classCount} 个班级</span>
          <span>{selectedCourse.studentCount} 名学生</span>
        </div>
      </div>

      {classes.length === 0 ? (
        <div className="empty-state">
          <Users size={32} />
          <p>暂无班级</p>
          <span>导入学生名单时会自动创建班级</span>
        </div>
      ) : (
        <div className="class-list">
          {classes.map((item) => (
            <div className="class-row" key={item.id}>
              <div>
                <strong>{item.name}</strong>
                <span>{item.major} · {item.grade}级</span>
              </div>
              <span className="class-count">{item.studentCount} 人</span>
            </div>
          ))}
        </div>
      )}
    </article>
  );
}
