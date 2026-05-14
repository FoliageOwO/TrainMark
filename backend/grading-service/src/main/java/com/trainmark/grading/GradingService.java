package com.trainmark.grading;

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
  private final RubricStore rubricStore;
  private final GradeExportStore gradeExportStore;
  private final GradePublicationAuditStore publicationAuditStore;
  private final AppealStore appealStore;
  private final GradingJobStore gradingJobStore;
  private final ScoringProvider scoringProvider;
  private final AnnotationProvider annotationProvider;
  private final AtomicLong resultIds = new AtomicLong(2);
  private final Map<Long, GradingResultSummary> results = new LinkedHashMap<>();

  public GradingService(
      RubricStore rubricStore,
      GradeExportStore gradeExportStore,
      GradePublicationAuditStore publicationAuditStore,
      AppealStore appealStore,
      GradingJobStore gradingJobStore,
      ScoringProvider scoringProvider,
      AnnotationProvider annotationProvider
  ) {
    this.rubricStore = rubricStore;
    this.gradeExportStore = gradeExportStore;
    this.publicationAuditStore = publicationAuditStore;
    this.appealStore = appealStore;
    this.gradingJobStore = gradingJobStore;
    this.scoringProvider = scoringProvider;
    this.annotationProvider = annotationProvider;
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

  public Collection<RubricSummary> listRubrics(Long assignmentId) {
    return rubricStore.listRubrics(assignmentId);
  }

  public RubricSummary createRubric(CreateRubricRequest request) {
    return rubricStore.createRubric(request);
  }

  public Collection<GradingJobSummary> listJobs(Long assignmentId) {
    return gradingJobStore.listJobs(assignmentId);
  }

  public GradingJobSummary createJob(CreateGradingJobRequest request) {
    request.submissionIds().forEach(submissionId -> ensureScoredResult(request.assignmentId(), submissionId));
    return gradingJobStore.createJob(request);
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
    return publicationAuditStore.listPublicationAudits(resultId);
  }

  public Collection<AppealSummary> listAppeals(Long resultId, Long studentId, AppealStatus status) {
    return appealStore.listAppeals(resultId, studentId, status);
  }

  public AppealSummary createAppeal(CreateAppealRequest request) {
    var result = getResult(request.resultId());
    if (result.publicationStatus() != PublicationStatus.PUBLISHED) {
      throw new IllegalStateException("Only published grading results can be appealed: " + request.resultId());
    }
    return appealStore.createAppeal(request, result.studentName());
  }

  public AppealSummary resolveAppeal(Long appealId, ResolveAppealRequest request) {
    if (request.status() == AppealStatus.SUBMITTED) {
      throw new IllegalArgumentException("Resolved appeal status must be ACCEPTED or REJECTED");
    }
    return appealStore.resolveAppeal(appealId, request);
  }

  public Collection<GradeExportSummary> listGradeExports(Long assignmentId) {
    return gradeExportStore.listGradeExports(assignmentId);
  }

  public GradeExportSummary createGradeExport(CreateGradeExportRequest request) {
    var rowCount = (int) results.values().stream()
        .filter(item -> request.assignmentId().equals(item.assignmentId()))
        .filter(item -> item.publicationStatus() == PublicationStatus.PUBLISHED)
        .count();
    return gradeExportStore.createGradeExport(request, rowCount);
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
    publicationAuditStore.appendPublicationAudit(resultId, action, operatorName, reason);
  }

  private void ensureScoredResult(Long assignmentId, Long submissionId) {
    var exists = results.values().stream().anyMatch(item -> submissionId.equals(item.submissionId()));
    if (exists) {
      return;
    }

    var rubric = rubricStore.findFirstForAssignment(assignmentId)
        .orElse(new RubricSummary(1L, assignmentId, "默认评分标准", 100, List.<RubricItemSummary>of()));
    var resultId = resultIds.getAndIncrement();
    var scored = scoringProvider.score(new ScoringRequest(
        resultId,
        assignmentId,
        submissionId,
        2L,
        "张三",
        "2024010101",
        "自动批改报告-" + submissionId + ".pdf",
        rubric
    ));
    results.put(resultId, annotationProvider.annotate(scored));
  }
}
