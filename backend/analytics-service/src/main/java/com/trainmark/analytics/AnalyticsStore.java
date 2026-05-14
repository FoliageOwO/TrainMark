package com.trainmark.analytics;

import com.trainmark.shared.dto.CourseOutcomeAchievementSummary;
import com.trainmark.shared.dto.GradeStatisticsSummary;
import com.trainmark.shared.dto.LossPointSummary;
import java.util.List;

public interface AnalyticsStore {
  GradeStatisticsSummary getGradeStatistics(Long assignmentId);

  List<LossPointSummary> listLossPoints(Long assignmentId);

  List<CourseOutcomeAchievementSummary> listCourseOutcomeAchievements(Long assignmentId);
}
