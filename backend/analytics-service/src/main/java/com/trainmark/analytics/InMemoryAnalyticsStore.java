package com.trainmark.analytics;

import com.trainmark.shared.dto.CourseOutcomeAchievementSummary;
import com.trainmark.shared.dto.GradeStatisticsSummary;
import com.trainmark.shared.dto.LossPointSummary;
import com.trainmark.shared.dto.ScoreBucketSummary;
import java.util.List;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Component;

@Component
@ConditionalOnProperty(name = "trainmark.analytics.store", havingValue = "memory", matchIfMissing = true)
public class InMemoryAnalyticsStore implements AnalyticsStore {
  @Override
  public GradeStatisticsSummary getGradeStatistics(Long assignmentId) {
    return new GradeStatisticsSummary(
        assignmentId,
        65,
        48,
        83.6,
        7.8,
        96,
        62,
        0.84,
        0.31,
        List.of(
            new ScoreBucketSummary("90-100", 90, 100, 12),
            new ScoreBucketSummary("80-89", 80, 89, 24),
            new ScoreBucketSummary("70-79", 70, 79, 9),
            new ScoreBucketSummary("60-69", 60, 69, 3),
            new ScoreBucketSummary("<60", 0, 59, 0)
        )
    );
  }

  @Override
  public List<LossPointSummary> listLossPoints(Long assignmentId) {
    return List.of(
        new LossPointSummary(1L, "需求与设计", "CO1", 4.2, 31, "数据库约束、边界条件和异常流程说明不足"),
        new LossPointSummary(2L, "系统实现", "CO2", 6.8, 28, "失败重试、权限边界和批量处理说明缺失"),
        new LossPointSummary(3L, "报告规范", "CO3", 3.7, 22, "截图编号、图表说明和实训总结不够规范")
    );
  }

  @Override
  public List<CourseOutcomeAchievementSummary> listCourseOutcomeAchievements(Long assignmentId) {
    return List.of(
        new CourseOutcomeAchievementSummary("CO1", "需求分析与系统设计", 0.75, 0.79, "达成"),
        new CourseOutcomeAchievementSummary("CO2", "系统实现与调试", 0.75, 0.84, "达成"),
        new CourseOutcomeAchievementSummary("CO3", "工程表达与报告规范", 0.75, 0.72, "临界")
    );
  }
}
