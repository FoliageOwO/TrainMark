package com.trainmark.analytics;

import com.trainmark.shared.dto.CourseOutcomeAchievementSummary;
import com.trainmark.shared.dto.GradeStatisticsSummary;
import com.trainmark.shared.dto.LossPointSummary;
import java.util.List;
import org.springframework.stereotype.Service;

@Service
public class AnalyticsService {
  private final AnalyticsStore store;

  public AnalyticsService(AnalyticsStore store) {
    this.store = store;
  }

  public GradeStatisticsSummary getGradeStatistics(Long assignmentId) {
    return store.getGradeStatistics(assignmentId);
  }

  public List<LossPointSummary> listLossPoints(Long assignmentId) {
    return store.listLossPoints(assignmentId);
  }

  public List<CourseOutcomeAchievementSummary> listCourseOutcomeAchievements(Long assignmentId) {
    return store.listCourseOutcomeAchievements(assignmentId);
  }
}
