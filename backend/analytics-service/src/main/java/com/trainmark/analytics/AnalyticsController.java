package com.trainmark.analytics;

import com.trainmark.shared.ApiResponse;
import com.trainmark.shared.dto.CourseOutcomeAchievementSummary;
import com.trainmark.shared.dto.GradeStatisticsSummary;
import com.trainmark.shared.dto.LossPointSummary;
import java.util.Collection;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/analytics")
public class AnalyticsController {
  private final AnalyticsService analyticsService;

  public AnalyticsController(AnalyticsService analyticsService) {
    this.analyticsService = analyticsService;
  }

  @GetMapping("/grade-statistics")
  public ApiResponse<GradeStatisticsSummary> getGradeStatistics(@RequestParam(name = "assignmentId") Long assignmentId) {
    return ApiResponse.ok(analyticsService.getGradeStatistics(assignmentId));
  }

  @GetMapping("/loss-points")
  public ApiResponse<Collection<LossPointSummary>> listLossPoints(@RequestParam(name = "assignmentId") Long assignmentId) {
    return ApiResponse.ok(analyticsService.listLossPoints(assignmentId));
  }

  @GetMapping("/course-outcomes")
  public ApiResponse<Collection<CourseOutcomeAchievementSummary>> listCourseOutcomes(
      @RequestParam(name = "assignmentId") Long assignmentId
  ) {
    return ApiResponse.ok(analyticsService.listCourseOutcomeAchievements(assignmentId));
  }
}
