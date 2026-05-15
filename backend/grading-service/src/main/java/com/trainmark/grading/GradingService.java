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
import java.util.List;
import java.util.Optional;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

@Service
public class GradingService {
  private final RubricStore rubricStore;
  private final GradeExportStore gradeExportStore;
  private final GradePublicationAuditStore publicationAuditStore;
  private final AppealStore appealStore;
  private final GradingJobStore gradingJobStore;
  private final GradingResultStore gradingResultStore;
  private final ScoringProvider scoringProvider;
  private final AnnotationProvider annotationProvider;
  private final boolean asyncEnabled;
  @Autowired(required = false)
  private GradingJobPublisher jobPublisher;

  public GradingService(
      RubricStore rubricStore,
      GradeExportStore gradeExportStore,
      GradePublicationAuditStore publicationAuditStore,
      AppealStore appealStore,
      GradingJobStore gradingJobStore,
      GradingResultStore gradingResultStore,
      ScoringProvider scoringProvider,
      AnnotationProvider annotationProvider,
      @Value("${trainmark.grading.async-enabled:false}") boolean asyncEnabled
  ) {
    this.rubricStore = rubricStore;
    this.gradeExportStore = gradeExportStore;
    this.publicationAuditStore = publicationAuditStore;
    this.appealStore = appealStore;
    this.gradingJobStore = gradingJobStore;
    this.gradingResultStore = gradingResultStore;
    this.scoringProvider = scoringProvider;
    this.annotationProvider = annotationProvider;
    this.asyncEnabled = asyncEnabled;
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
    var job = gradingJobStore.createJob(request);

    if (asyncEnabled && jobPublisher != null) {
      // Async mode: publish to RabbitMQ, processing happens in consumer
      jobPublisher.publish(new GradingJobMessage(
          job.id(),
          request.assignmentId(),
          request.rubricId(),
          request.submissionIds()
      ));
    } else {
      // Sync mode: process immediately (default for local/demo)
      request.submissionIds().forEach(submissionId -> ensureScoredResult(request.assignmentId(), submissionId));
    }

    return job;
  }

  public Collection<GradingResultSummary> listResults(Long assignmentId, ReviewStatus reviewStatus) {
    return gradingResultStore.listResults(assignmentId, reviewStatus);
  }

  public GradingResultSummary getResult(Long resultId) {
    return gradingResultStore.findResult(resultId)
        .orElseThrow(() -> new IllegalArgumentException("Grading result not found: " + resultId));
  }

  public Optional<GradingResultSummary> findResultBySubmission(Long submissionId) {
    return gradingResultStore.listResults(null, null).stream()
        .filter(result -> submissionId.equals(result.submissionId()))
        .findFirst();
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
    return gradingResultStore.listResults(assignmentId, null).stream()
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
    var rowCount = (int) gradingResultStore.listResults(request.assignmentId(), null).stream()
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
    return gradingResultStore.saveReviewedResult(updated);
  }

  private GradingResultSummary saveResultWithPublication(
      GradingResultSummary result,
      PublicationStatus publicationStatus,
      OffsetDateTime publishedAt
  ) {
    return gradingResultStore.savePublicationStatus(result, publicationStatus, publishedAt);
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

  void ensureScoredResult(Long assignmentId, Long submissionId) {
    if (gradingResultStore.hasSubmissionResult(submissionId)) {
      return;
    }

    var rubric = rubricStore.findFirstForAssignment(assignmentId)
        .orElse(new RubricSummary(1L, assignmentId, "默认评分标准", 100, List.<RubricItemSummary>of()));
    var resultId = gradingResultStore.nextResultId();
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
    gradingResultStore.saveScoredResult(annotationProvider.annotate(scored));
  }
}
