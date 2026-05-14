package com.trainmark.grading;

import com.trainmark.shared.GradingJobStatus;
import com.trainmark.shared.AppealStatus;
import com.trainmark.shared.PublicationStatus;
import com.trainmark.shared.ReviewStatus;
import com.trainmark.shared.dto.AppealSummary;
import com.trainmark.shared.dto.CreateAppealRequest;
import com.trainmark.shared.dto.CreateGradeExportRequest;
import com.trainmark.shared.dto.CreateGradingJobRequest;
import com.trainmark.shared.dto.CreateRubricRequest;
import com.trainmark.shared.dto.GradeExportSummary;
import com.trainmark.shared.dto.GradePublicationAuditEntry;
import com.trainmark.shared.dto.GradePublicationSummary;
import com.trainmark.shared.dto.GradingAnnotationSummary;
import com.trainmark.shared.dto.GradingItemReview;
import com.trainmark.shared.dto.GradingJobSummary;
import com.trainmark.shared.dto.GradingResultSummary;
import com.trainmark.shared.dto.PublishGradeRequest;
import com.trainmark.shared.dto.ResolveAppealRequest;
import com.trainmark.shared.dto.ReviewDecisionRequest;
import com.trainmark.shared.dto.RubricItemSummary;
import com.trainmark.shared.dto.RubricPointSummary;
import com.trainmark.shared.dto.RubricSummary;
import com.trainmark.shared.dto.UpdateReviewItemRequest;
import com.trainmark.shared.dto.WithdrawGradeRequest;
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
  private final AtomicLong auditIds = new AtomicLong(1);
  private final AtomicLong appealIds = new AtomicLong(2);
  private final AtomicLong exportIds = new AtomicLong(2);
  private final Map<Long, RubricSummary> rubrics = new LinkedHashMap<>();
  private final Map<Long, GradingJobSummary> jobs = new LinkedHashMap<>();
  private final Map<Long, GradingResultSummary> results = new LinkedHashMap<>();
  private final Map<Long, List<GradePublicationAuditEntry>> publicationAudits = new LinkedHashMap<>();
  private final Map<Long, AppealSummary> appeals = new LinkedHashMap<>();
  private final Map<Long, GradeExportSummary> exports = new LinkedHashMap<>();

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
    appeals.put(1L, new AppealSummary(
        1L,
        1L,
        2L,
        2L,
        "张三",
        "系统实现部分包含失败重试说明，可能未被识别。",
        "申请将系统实现分项由 43 分调整为 45 分。",
        AppealStatus.SUBMITTED,
        null,
        OffsetDateTime.now().minusHours(2),
        null
    ));
    exports.put(1L, new GradeExportSummary(
        1L,
        1L,
        "Java Web 综合实训-成绩单.csv",
        "CSV",
        48,
        "/exports/assignments/1/grades.csv",
        "READY",
        OffsetDateTime.now().minusMinutes(25)
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

  public Collection<GradePublicationSummary> listPublications(Long assignmentId, PublicationStatus publicationStatus) {
    return results.values().stream()
        .filter(item -> assignmentId == null || assignmentId.equals(item.assignmentId()))
        .filter(item -> publicationStatus == null || publicationStatus == item.publicationStatus())
        .map(this::toPublicationSummary)
        .toList();
  }

  public GradingResultSummary publishResult(Long resultId, PublishGradeRequest request) {
    var result = getResult(resultId);
    if (result.reviewStatus() != ReviewStatus.APPROVED) {
      throw new IllegalStateException("Only approved grading results can be published: " + resultId);
    }
    var publishedAt = OffsetDateTime.now();
    var updated = saveResultWithPublication(result, PublicationStatus.PUBLISHED, publishedAt);
    appendPublicationAudit(
        resultId,
        "PUBLISH",
        request.operatorName(),
        request.message() == null || request.message().isBlank() ? "发布成绩与批注" : request.message()
    );
    return updated;
  }

  public GradingResultSummary withdrawResult(Long resultId, WithdrawGradeRequest request) {
    var result = getResult(resultId);
    var updated = saveResultWithPublication(result, PublicationStatus.WITHDRAWN, null);
    appendPublicationAudit(resultId, "WITHDRAW", request.operatorName(), request.reason());
    return updated;
  }

  public Collection<GradePublicationAuditEntry> listPublicationAudits(Long resultId) {
    getResult(resultId);
    return publicationAudits.getOrDefault(resultId, List.of());
  }

  public Collection<AppealSummary> listAppeals(Long resultId, Long studentId, AppealStatus status) {
    return appeals.values().stream()
        .filter(item -> resultId == null || resultId.equals(item.resultId()))
        .filter(item -> studentId == null || studentId.equals(item.studentId()))
        .filter(item -> status == null || status == item.status())
        .toList();
  }

  public AppealSummary createAppeal(CreateAppealRequest request) {
    var result = getResult(request.resultId());
    if (result.publicationStatus() != PublicationStatus.PUBLISHED) {
      throw new IllegalStateException("Only published grading results can be appealed: " + request.resultId());
    }
    var id = appealIds.getAndIncrement();
    var appeal = new AppealSummary(
        id,
        request.resultId(),
        request.rubricItemId(),
        request.studentId(),
        result.studentName(),
        request.reason(),
        request.requestedChange(),
        AppealStatus.SUBMITTED,
        null,
        OffsetDateTime.now(),
        null
    );
    appeals.put(id, appeal);
    return appeal;
  }

  public AppealSummary resolveAppeal(Long appealId, ResolveAppealRequest request) {
    if (request.status() == AppealStatus.SUBMITTED) {
      throw new IllegalArgumentException("Resolved appeal status must be ACCEPTED or REJECTED");
    }
    var appeal = appeals.get(appealId);
    if (appeal == null) {
      throw new IllegalArgumentException("Appeal not found: " + appealId);
    }
    var resolved = new AppealSummary(
        appeal.id(),
        appeal.resultId(),
        appeal.rubricItemId(),
        appeal.studentId(),
        appeal.studentName(),
        appeal.reason(),
        appeal.requestedChange(),
        request.status(),
        request.teacherReply(),
        appeal.createdAt(),
        OffsetDateTime.now()
    );
    appeals.put(appealId, resolved);
    return resolved;
  }

  public Collection<GradeExportSummary> listGradeExports(Long assignmentId) {
    return exports.values().stream()
        .filter(item -> assignmentId == null || assignmentId.equals(item.assignmentId()))
        .toList();
  }

  public GradeExportSummary createGradeExport(CreateGradeExportRequest request) {
    var id = exportIds.getAndIncrement();
    var rowCount = (int) results.values().stream()
        .filter(item -> request.assignmentId().equals(item.assignmentId()))
        .filter(item -> item.publicationStatus() == PublicationStatus.PUBLISHED)
        .count();
    var format = request.format().toUpperCase();
    var suffix = switch (format) {
      case "PDF" -> "pdf";
      case "ZIP" -> "zip";
      default -> "csv";
    };
    var export = new GradeExportSummary(
        id,
        request.assignmentId(),
        "assignment-%d-grades.%s".formatted(request.assignmentId(), suffix),
        format,
        rowCount,
        "/exports/assignments/%d/grades-%d.%s".formatted(request.assignmentId(), id, suffix),
        "READY",
        OffsetDateTime.now()
    );
    exports.put(id, export);
    return export;
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
        result.publicationStatus(),
        overallComment,
        reviewedAt,
        result.publishedAt(),
        items,
        result.annotations()
    );
    results.put(result.id(), updated);
    return updated;
  }

  private GradingResultSummary saveResultWithPublication(
      GradingResultSummary result,
      PublicationStatus publicationStatus,
      OffsetDateTime publishedAt
  ) {
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
        result.teacherScore(),
        result.confidence(),
        result.reviewStatus(),
        publicationStatus,
        result.overallComment(),
        result.reviewedAt(),
        publishedAt,
        result.items(),
        result.annotations()
    );
    results.put(result.id(), updated);
    return updated;
  }

  private GradePublicationSummary toPublicationSummary(GradingResultSummary result) {
    return new GradePublicationSummary(
        result.id(),
        result.assignmentId(),
        result.studentId(),
        result.studentName(),
        result.studentNo(),
        result.teacherScore(),
        result.publicationStatus(),
        result.publishedAt()
    );
  }

  private void appendPublicationAudit(Long resultId, String action, String operatorName, String reason) {
    var entry = new GradePublicationAuditEntry(
        auditIds.getAndIncrement(),
        resultId,
        action,
        operatorName,
        reason,
        OffsetDateTime.now()
    );
    publicationAudits.merge(resultId, List.of(entry), (current, appended) -> {
      var entries = new java.util.ArrayList<>(current);
      entries.addAll(appended);
      return List.copyOf(entries);
    });
  }
}
