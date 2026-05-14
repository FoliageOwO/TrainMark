package com.trainmark.grading;

import com.trainmark.shared.GradingJobStatus;
import com.trainmark.shared.ReviewStatus;
import com.trainmark.shared.dto.CreateGradingJobRequest;
import com.trainmark.shared.dto.CreateRubricRequest;
import com.trainmark.shared.dto.GradingAnnotationSummary;
import com.trainmark.shared.dto.GradingItemReview;
import com.trainmark.shared.dto.GradingJobSummary;
import com.trainmark.shared.dto.GradingResultSummary;
import com.trainmark.shared.dto.ReviewDecisionRequest;
import com.trainmark.shared.dto.RubricItemSummary;
import com.trainmark.shared.dto.RubricPointSummary;
import com.trainmark.shared.dto.RubricSummary;
import com.trainmark.shared.dto.UpdateReviewItemRequest;
import java.time.OffsetDateTime;
import java.util.Collection;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.concurrent.atomic.AtomicLong;
import org.springframework.stereotype.Service;

@Service
public class GradingService {
  private final AtomicLong rubricIds = new AtomicLong(2);
  private final AtomicLong itemIds = new AtomicLong(10);
  private final AtomicLong pointIds = new AtomicLong(100);
  private final AtomicLong jobIds = new AtomicLong(2);
  private final Map<Long, RubricSummary> rubrics = new LinkedHashMap<>();
  private final Map<Long, GradingJobSummary> jobs = new LinkedHashMap<>();
  private final Map<Long, GradingResultSummary> results = new LinkedHashMap<>();

  public GradingService() {
    var points = List.of(
        new RubricPointSummary(1L, "功能模块完整", "覆盖登录、课程、任务、提交核心流程", 12, List.of("登录", "课程", "任务", "提交"), List.of("上传", "报告提交")),
        new RubricPointSummary(2L, "数据库设计合理", "实体关系清晰，字段和约束完整", 8, List.of("ER图", "表结构", "约束"), List.of("实体关系", "数据表"))
    );
    var items = List.of(
        new RubricItemSummary(1L, "需求与设计", 20, "CO1", points),
        new RubricItemSummary(2L, "系统实现", 50, "CO2", List.of()),
        new RubricItemSummary(3L, "报告规范", 30, "CO3", List.of())
    );
    rubrics.put(1L, new RubricSummary(1L, 1L, "Java Web 实训评分标准", 100, items));
    jobs.put(1L, new GradingJobSummary(1L, 1L, 1L, 65, 47, GradingJobStatus.SCORING, 86, OffsetDateTime.now().minusMinutes(18)));
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
        "报告结构完整，核心功能说明较清楚；数据库约束和异常处理说明还需要补强。",
        null,
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

  public Collection<RubricSummary> listRubrics(Long assignmentId) {
    return rubrics.values().stream()
        .filter(item -> assignmentId == null || assignmentId.equals(item.assignmentId()))
        .toList();
  }

  public RubricSummary createRubric(CreateRubricRequest request) {
    var rubricId = rubricIds.getAndIncrement();
    var items = request.items() == null ? List.<RubricItemSummary>of() : request.items().stream()
        .map(item -> new RubricItemSummary(
            itemIds.getAndIncrement(),
            item.title(),
            item.score(),
            item.courseOutcomeCode(),
            item.points() == null ? List.of() : item.points().stream()
                .map(point -> new RubricPointSummary(
                    pointIds.getAndIncrement(),
                    point.title(),
                    point.description(),
                    point.score(),
                    point.keywords(),
                    point.synonyms()
                ))
                .toList()
        ))
        .toList();
    var rubric = new RubricSummary(rubricId, request.assignmentId(), request.name(), request.totalScore(), items);
    rubrics.put(rubricId, rubric);
    return rubric;
  }

  public Collection<GradingJobSummary> listJobs(Long assignmentId) {
    return jobs.values().stream()
        .filter(item -> assignmentId == null || assignmentId.equals(item.assignmentId()))
        .toList();
  }

  public GradingJobSummary createJob(CreateGradingJobRequest request) {
    var id = jobIds.getAndIncrement();
    var job = new GradingJobSummary(
        id,
        request.assignmentId(),
        request.rubricId(),
        request.submissionIds().size(),
        0,
        GradingJobStatus.PENDING,
        0,
        OffsetDateTime.now()
    );
    jobs.put(id, job);
    return job;
  }

  public Collection<GradingResultSummary> listResults(Long assignmentId, ReviewStatus reviewStatus) {
    return results.values().stream()
        .filter(item -> assignmentId == null || assignmentId.equals(item.assignmentId()))
        .filter(item -> reviewStatus == null || reviewStatus == item.reviewStatus())
        .toList();
  }

  public GradingResultSummary getResult(Long resultId) {
    var result = results.get(resultId);
    if (result == null) {
      throw new IllegalArgumentException("Grading result not found: " + resultId);
    }
    return result;
  }

  public GradingResultSummary updateReviewItem(Long resultId, UpdateReviewItemRequest request) {
    var result = getResult(resultId);
    var updatedItems = result.items().stream()
        .map(item -> item.rubricItemId().equals(request.rubricItemId())
            ? new GradingItemReview(
                item.rubricItemId(),
                item.title(),
                item.maxScore(),
                item.aiScore(),
                request.teacherScore(),
                item.deductionReason(),
                request.teacherComment(),
                item.confidence(),
                item.evidence()
            )
            : item)
        .toList();
    return saveReviewedResult(result, updatedItems, ReviewStatus.IN_REVIEW, result.overallComment(), null);
  }

  public GradingResultSummary approveResult(Long resultId, ReviewDecisionRequest request) {
    var result = getResult(resultId);
    var comment = request.overallComment() == null || request.overallComment().isBlank()
        ? result.overallComment()
        : request.overallComment();
    return saveReviewedResult(result, result.items(), ReviewStatus.APPROVED, comment, OffsetDateTime.now());
  }

  private GradingResultSummary saveReviewedResult(
      GradingResultSummary result,
      List<GradingItemReview> items,
      ReviewStatus reviewStatus,
      String overallComment,
      OffsetDateTime reviewedAt
  ) {
    var teacherScore = items.stream().mapToInt(GradingItemReview::teacherScore).sum();
    var updated = new GradingResultSummary(
        result.id(),
        result.assignmentId(),
        result.submissionId(),
        result.studentId(),
        result.studentName(),
        result.studentNo(),
        result.fileName(),
        result.previewUrl(),
        result.annotationPdfUrl(),
        result.totalScore(),
        result.aiScore(),
        teacherScore,
        result.confidence(),
        reviewStatus,
        overallComment,
        reviewedAt,
        items,
        result.annotations()
    );
    results.put(result.id(), updated);
    return updated;
  }
}
