package com.trainmark.course;

import com.trainmark.shared.dto.AssignmentSummary;
import com.trainmark.shared.dto.CourseSummary;
import com.trainmark.shared.dto.CreateAssignmentRequest;
import com.trainmark.shared.dto.CreateCourseRequest;
import com.trainmark.shared.dto.CreateTeachingClassRequest;
import com.trainmark.shared.dto.TeachingClassSummary;
import java.util.Collection;
import java.util.List;
import org.springframework.stereotype.Service;

@Service
public class CourseService {
  private final CourseStore store;

  public CourseService(CourseStore store) {
    this.store = store;
  }

  public Collection<CourseSummary> listCourses() {
    return store.listCourses();
  }

  public CourseSummary createCourse(CreateCourseRequest request) {
    return store.createCourse(request);
  }

  public Collection<TeachingClassSummary> listClasses(Long courseId) {
    return store.listClasses(courseId);
  }

  public TeachingClassSummary createClass(Long courseId, CreateTeachingClassRequest request) {
    return store.createClass(courseId, request);
  }

  public Collection<AssignmentSummary> listAssignments(Long courseId) {
    return store.listAssignments(courseId);
  }

  public AssignmentSummary createAssignment(CreateAssignmentRequest request) {
    return store.createAssignment(request);
  }

  public AssignmentSummary publishAssignment(Long assignmentId) {
    return store.publishAssignment(assignmentId);
  }

  public List<Long> assignmentStudentIds(Long assignmentId) {
    return store.assignmentStudentIds(assignmentId);
  }
}
