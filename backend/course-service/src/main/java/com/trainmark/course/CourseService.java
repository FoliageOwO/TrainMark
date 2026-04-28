package com.trainmark.course;

import com.trainmark.shared.AssignmentStatus;
import com.trainmark.shared.CourseStatus;
import com.trainmark.shared.dto.AssignmentSummary;
import com.trainmark.shared.dto.CourseSummary;
import com.trainmark.shared.dto.CreateAssignmentRequest;
import com.trainmark.shared.dto.CreateCourseRequest;
import com.trainmark.shared.dto.CreateTeachingClassRequest;
import com.trainmark.shared.dto.TeachingClassSummary;
import java.util.Collection;
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.Map;
import java.util.concurrent.atomic.AtomicLong;
import org.springframework.stereotype.Service;

@Service
public class CourseService {
  private final AtomicLong courseIds = new AtomicLong(2);
  private final AtomicLong classIds = new AtomicLong(3);
  private final AtomicLong assignmentIds = new AtomicLong(2);
  private final Map<Long, CourseSummary> courses = new LinkedHashMap<>();
  private final Map<Long, TeachingClassSummary> classes = new LinkedHashMap<>();
  private final Map<Long, AssignmentSummary> assignments = new LinkedHashMap<>();

  public CourseService() {
    courses.put(1L, new CourseSummary(1L, "Java Web 综合实训", "JAVA-WEB-2026", "2025-2026-2", CourseStatus.ACTIVE, 2, 96));
    classes.put(1L, new TeachingClassSummary(1L, 1L, "软件2401班", "软件技术", "2024", 48));
    classes.put(2L, new TeachingClassSummary(2L, 1L, "软件2402班", "软件技术", "2024", 48));
    assignments.put(1L, new AssignmentSummary(1L, 1L, "Java Web 综合实训报告", java.time.OffsetDateTime.now().plusDays(7), 100, AssignmentStatus.PUBLISHED, true, true));
  }

  public Collection<CourseSummary> listCourses() {
    return courses.values();
  }

  public CourseSummary createCourse(CreateCourseRequest request) {
    var id = courseIds.getAndIncrement();
    var course = new CourseSummary(id, request.name(), request.code(), request.semester(), CourseStatus.ACTIVE, 0, 0);
    courses.put(id, course);
    return course;
  }

  public Collection<TeachingClassSummary> listClasses(Long courseId) {
    return classes.values().stream()
        .filter(item -> item.courseId().equals(courseId))
        .sorted(Comparator.comparing(TeachingClassSummary::id))
        .toList();
  }

  public TeachingClassSummary createClass(Long courseId, CreateTeachingClassRequest request) {
    var id = classIds.getAndIncrement();
    var teachingClass = new TeachingClassSummary(id, courseId, request.name(), request.major(), request.grade(), 0);
    classes.put(id, teachingClass);
    refreshCourseCounts(courseId);
    return teachingClass;
  }

  public Collection<AssignmentSummary> listAssignments(Long courseId) {
    return assignments.values().stream()
        .filter(item -> courseId == null || item.courseId().equals(courseId))
        .sorted(Comparator.comparing(AssignmentSummary::id))
        .toList();
  }

  public AssignmentSummary createAssignment(CreateAssignmentRequest request) {
    var id = assignmentIds.getAndIncrement();
    var assignment = new AssignmentSummary(
        id,
        request.courseId(),
        request.title(),
        request.deadline(),
        request.totalScore() == null ? 100 : request.totalScore(),
        AssignmentStatus.DRAFT,
        request.similarityCheckEnabled(),
        request.aiGradingEnabled()
    );
    assignments.put(id, assignment);
    return assignment;
  }

  private void refreshCourseCounts(Long courseId) {
    var old = courses.get(courseId);
    if (old == null) {
      return;
    }
    var classCount = (int) classes.values().stream().filter(item -> item.courseId().equals(courseId)).count();
    var studentCount = classes.values().stream()
        .filter(item -> item.courseId().equals(courseId))
        .mapToInt(TeachingClassSummary::studentCount)
        .sum();
    courses.put(courseId, new CourseSummary(old.id(), old.name(), old.code(), old.semester(), old.status(), classCount, studentCount));
  }
}
