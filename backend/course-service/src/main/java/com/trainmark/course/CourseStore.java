package com.trainmark.course;

import com.trainmark.shared.dto.AssignmentSummary;
import com.trainmark.shared.dto.CourseSummary;
import com.trainmark.shared.dto.CreateAssignmentRequest;
import com.trainmark.shared.dto.CreateCourseRequest;
import com.trainmark.shared.dto.CreateTeachingClassRequest;
import com.trainmark.shared.dto.TeachingClassSummary;
import java.util.Collection;
import java.util.List;

public interface CourseStore {
  Collection<CourseSummary> listCourses();

  CourseSummary createCourse(CreateCourseRequest request);

  Collection<TeachingClassSummary> listClasses(Long courseId);

  TeachingClassSummary createClass(Long courseId, CreateTeachingClassRequest request);

  void deleteClass(Long courseId, Long classId);

  Collection<AssignmentSummary> listAssignments(Long courseId);

  AssignmentSummary createAssignment(CreateAssignmentRequest request);

  AssignmentSummary publishAssignment(Long assignmentId);

  List<Long> assignmentStudentIds(Long assignmentId);
}
