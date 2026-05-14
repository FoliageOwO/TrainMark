package com.trainmark.grading;

import com.trainmark.shared.PublicationStatus;
import com.trainmark.shared.ReviewStatus;
import com.trainmark.shared.dto.GradingAnnotationSummary;
import com.trainmark.shared.dto.GradingItemReview;
import com.trainmark.shared.dto.GradingResultSummary;
import java.time.OffsetDateTime;
import java.util.Collection;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.concurrent.atomic.AtomicLong;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Component;

@Component
@ConditionalOnProperty(name = "trainmark.grading.result-store", havingValue = "memory", matchIfMissing = true)
public class InMemoryGradingResultStore implements GradingResultStore {
  private final AtomicLong resultIds = new AtomicLong(2);
  private final Map<Long, GradingResultSummary> results = new LinkedHashMap<>();

  public InMemoryGradingResultStore() {
    results.put(1L, new GradingResultSummary(
        1L,
        1L,
        1L,
        2L,
        "张三",
        "2024010101",
        "JavaWeb综合实训报告-张三-2024010101.pdf",
        "/previews/submissions/1/report.pdf",
        "/annotations/submissions/1/annotated.pdf",
        100,
        84,
        84,
        88,
        ReviewStatus.NEEDS_REVIEW,
        PublicationStatus.PUBLISHED,
        "报告结构完整，核心功能说明较清楚；数据库约束和异常处理说明还需要补强。",
        null,
        OffsetDateTime.now().minusHours(3),
        List.of(
            new GradingItemReview(
                1L,
                "需求与设计",
                20,
                16,
                16,
                "用例描述完整，但数据库约束和边界条件说明不足。",
                "建议补充关键表约束和异常流程说明。",
                86,
                List.of("第 2 页需求分析", "第 7 页数据库表结构")
            ),
            new GradingItemReview(
                2L,
                "系统实现",
                50,
                43,
                43,
                "核心流程可运行，缺少批量异常处理和权限边界说明。",
                "上传、批改、发布主流程描述清晰，需补充失败重试策略。",
                91,
                List.of("第 11 页核心流程", "第 12 页运行截图")
            ),
            new GradingItemReview(
                3L,
                "报告规范",
                30,
                25,
                25,
                "章节完整，截图标注不够统一，结论部分偏简略。",
                "统一图表编号并补充实训反思。",
                87,
                List.of("第 1 页目录", "第 17 页总结")
            )
        ),
        List.of(
            new GradingAnnotationSummary(1L, 7, "数据库表结构", "外键约束说明不完整", "warning"),
            new GradingAnnotationSummary(2L, 12, "系统运行截图", "建议补充失败场景截图", "info"),
            new GradingAnnotationSummary(3L, 17, "实训总结", "总结需要对应评分标准展开", "warning")
        )
    ));
  }

  @Override
  public Collection<GradingResultSummary> listResults(Long assignmentId, ReviewStatus reviewStatus) {
    return results.values().stream()
        .filter(item -> assignmentId == null || assignmentId.equals(item.assignmentId()))
        .filter(item -> reviewStatus == null || reviewStatus == item.reviewStatus())
        .toList();
  }

  @Override
  public Optional<GradingResultSummary> findResult(Long resultId) {
    return Optional.ofNullable(results.get(resultId));
  }

  @Override
  public boolean hasSubmissionResult(Long submissionId) {
    return results.values().stream().anyMatch(item -> submissionId.equals(item.submissionId()));
  }

  @Override
  public long nextResultId() {
    return resultIds.getAndIncrement();
  }

  @Override
  public GradingResultSummary saveScoredResult(GradingResultSummary result) {
    results.put(result.id(), result);
    return result;
  }

  @Override
  public GradingResultSummary saveReviewedResult(GradingResultSummary result) {
    results.put(result.id(), result);
    return result;
  }

  @Override
  public GradingResultSummary savePublicationStatus(
      GradingResultSummary result,
      PublicationStatus publicationStatus,
      OffsetDateTime publishedAt
  ) {
    var updated = GradingResultStoreSupport.withPublicationStatus(result, publicationStatus, publishedAt);
    results.put(updated.id(), updated);
    return updated;
  }
}
