const teacherNavSections = [
  { key: 'overview', label: '工作台' },
  { key: 'courses', label: '课程与班级' },
  { key: 'assignments', label: '实训任务' },
  { key: 'collection', label: '报告收集' },
  { key: 'ai-pipeline', label: 'AI 批改' },
  { key: 'review', label: '人工复核' },
  { key: 'analytics', label: '失分分析' },
  { key: 'roster', label: '名单管理' },
  { key: 'appeals', label: '申诉处理' },
  { key: 'similarity', label: '查重检测' },
  { key: 'operations', label: '运维能力' },
];

type TeacherSectionTabsProps = {
  activeSection: string;
  onSectionChange: (section: string) => void;
};

export function TeacherSectionTabs({ activeSection, onSectionChange }: TeacherSectionTabsProps) {
  return (
    <nav className="teacher-section-tabs">
      {teacherNavSections.map((item) => (
        <button
          className={activeSection === item.key ? 'active' : ''}
          key={item.key}
          type="button"
          onClick={() => onSectionChange(item.key)}
        >
          {item.label}
        </button>
      ))}
    </nav>
  );
}
