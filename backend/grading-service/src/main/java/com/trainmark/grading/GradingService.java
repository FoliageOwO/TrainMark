package com.trainmark.grading;

import com.trainmark.shared.AppealStatus;
import com.trainmark.shared.GradingJobStatus;
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
import java.sql.DriverManager;
import java.sql.SQLException;
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
  private final AuditLogClient auditLog;
  private final String jdbcUrl;
  private final String jdbcUsername;
  private final String jdbcPassword;
  private final boolean asyncEnabled;
  private final boolean exportAsyncEnabled;
  @Autowired(required = false)
  private GradingJobPublisher jobPublisher;
  @Autowired(required = false)
  private GradeExportPublisher gradeExportPublisher;

  public GradingService(
      RubricStore rubricStore,
      GradeExportStore gradeExportStore,
      GradePublicationAuditStore publicationAuditStore,
      AppealStore appealStore,
      GradingJobStore gradingJobStore,
      GradingResultStore gradingResultStore,
      ScoringProvider scoringProvider,
      AnnotationProvider annotationProvider,
      AuditLogClient auditLog,
      @Value("${trainmark.grading.jdbc.url:}") String jdbcUrl,
      @Value("${trainmark.grading.jdbc.username:}") String jdbcUsername,
      @Value("${trainmark.grading.jdbc.password:}") String jdbcPassword,
      @Value("${trainmark.grading.async-enabled:false}") boolean asyncEnabled,
      @Value("${trainmark.grading.export-async-enabled:false}") boolean exportAsyncEnabled
  ) {
    this.rubricStore = rubricStore;
    this.gradeExportStore = gradeExportStore;
    this.publicationAuditStore = publicationAuditStore;
    this.appealStore = appealStore;
    this.gradingJobStore = gradingJobStore;
    this.gradingResultStore = gradingResultStore;
    this.scoringProvider = scoringProvider;
    this.annotationProvider = annotationProvider;
    this.auditLog = auditLog;
    this.jdbcUrl = jdbcUrl;
    this.jdbcUsername = jdbcUsername;
    this.jdbcPassword = jdbcPassword;
    this.asyncEnabled = asyncEnabled;
    this.exportAsyncEnabled = exportAsyncEnabled;
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
    auditLog.log("系统任务", "GRADING_START", "GRADING_JOB", String.valueOf(job.id()),
        "启动 AI 批改，作业 " + request.assignmentId() + "，" + request.submissionIds().size() + " 份报告", null);

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
      processJobSynchronously(job, request);
    }

    return gradingJobStore.listJobs(request.assignmentId()).stream()
        .filter(item -> item.id().equals(job.id()))
        .findFirst()
        .orElse(job);
  }

  private void processJobSynchronously(GradingJobSummary job, CreateGradingJobRequest request) {
    gradingJobStore.updateJobStatus(job.id(), GradingJobStatus.SCORING);
    try {
      for (Long submissionId : request.submissionIds()) {
        ensureScoredResult(request.assignmentId(), submissionId);
        gradingJobStore.incrementJobProgress(job.id());
      }
    } catch (RuntimeException error) {
      gradingJobStore.updateJobStatus(job.id(), GradingJobStatus.FAILED);
      throw error;
    }
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
    auditLog.log("教师", "REVIEW_UPDATE", "GRADING_RESULT", String.valueOf(resultId),
        "复核评分项 " + request.rubricItemId() + "，得分 " + request.teacherScore(), null);
    return saveReviewedResult(result, updatedItems, ReviewStatus.IN_REVIEW, result.overallComment(), null);
  }

  public GradingResultSummary approveResult(Long resultId, ReviewDecisionRequest request) {
    var result = getResult(resultId);
    var comment = request.overallComment() == null || request.overallComment().isBlank()
        ? result.overallComment()
        : request.overallComment();
    auditLog.log(request.reviewerName() != null ? request.reviewerName() : "教师", "REVIEW_APPROVE", "GRADING_RESULT",
        String.valueOf(resultId), "复核通过，等待发布", null);
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
    auditLog.log(request.operatorName(), "GRADE_PUBLISH", "GRADING_RESULT", String.valueOf(resultId),
        request.message() == null || request.message().isBlank() ? "发布成绩与批注" : request.message(), null);
    return updated;
  }

  public GradingResultSummary withdrawResult(Long resultId, WithdrawGradeRequest request) {
    var result = getResult(resultId);
    var updated = saveResultWithPublication(result, PublicationStatus.WITHDRAWN, null);
    appendPublicationAudit(resultId, "WITHDRAW", request.operatorName(), request.reason());
    auditLog.log(request.operatorName(), "GRADE_WITHDRAW", "GRADING_RESULT", String.valueOf(resultId),
        request.reason(), null);
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
    var appeal = appealStore.createAppeal(request, result.studentName());
    auditLog.log(result.studentName(), "APPEAL_SUBMIT", "APPEAL", String.valueOf(appeal.id()),
        request.reason(), null);
    return appeal;
  }

  public AppealSummary resolveAppeal(Long appealId, ResolveAppealRequest request) {
    if (request.status() == AppealStatus.SUBMITTED) {
      throw new IllegalArgumentException("Resolved appeal status must be ACCEPTED or REJECTED");
    }
    var appeal = appealStore.resolveAppeal(appealId, request);
    auditLog.log("教师", "APPEAL_RESOLVE", "APPEAL", String.valueOf(appealId),
        request.status() == AppealStatus.ACCEPTED ? "采纳申诉" : "驳回申诉", null);
    return appeal;
  }

  public Collection<GradeExportSummary> listGradeExports(Long assignmentId) {
    return gradeExportStore.listGradeExports(assignmentId);
  }

  public GradeExportSummary createGradeExport(CreateGradeExportRequest request) {
    var rowCount = exportAsyncEnabled ? 0 : publishedResultCount(request.assignmentId());
    var export = gradeExportStore.createGradeExport(request, rowCount, exportAsyncEnabled ? "PROCESSING" : "READY");
    auditLog.log(request.operatorName(), "GRADE_EXPORT", "GRADE_EXPORT", String.valueOf(export.id()),
        "导出成绩表 " + request.format() + "，" + (exportAsyncEnabled ? "异步处理中" : rowCount + " 行"), null);
    if (exportAsyncEnabled) {
      if (gradeExportPublisher == null) {
        gradeExportStore.markGradeExportFailed(export.id());
        throw new IllegalStateException("Grade export async publisher is not available");
      }
      try {
        gradeExportPublisher.publish(new GradeExportMessage(export.id(), request.assignmentId()));
      } catch (RuntimeException error) {
        gradeExportStore.markGradeExportFailed(export.id());
        throw error;
      }
    }
    return export;
  }

  int publishedResultCount(Long assignmentId) {
    return (int) gradingResultStore.listResults(assignmentId, null).stream()
        .filter(item -> assignmentId.equals(item.assignmentId()))
        .filter(item -> item.publicationStatus() == PublicationStatus.PUBLISHED)
        .count();
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
    var submission = findSubmissionContext(assignmentId, submissionId);
    var scored = scoringProvider.score(new ScoringRequest(
        resultId,
        assignmentId,
        submissionId,
        submission.studentId(),
        submission.studentName(),
        submission.studentNo(),
        submission.fileName(),
        submission.fileContentText(),
        rubric
    ));
    gradingResultStore.saveScoredResult(annotationProvider.annotate(scored));
  }

  private SubmissionContext findSubmissionContext(Long assignmentId, Long submissionId) {
    if (jdbcUrl == null || jdbcUrl.isBlank()) {
      return fallbackSubmissionContext(assignmentId, submissionId);
    }

    var sql = """
        SELECT s.id, s.student_id,
               COALESCE(NULLIF(u.name, ''), '学生' || s.student_id) AS student_name,
               COALESCE(NULLIF(u.student_no, ''), u.username, '') AS student_no,
               COALESCE(NULLIF(sf.file_name, ''), NULLIF(s.file_name, ''), '提交报告-' || s.id || '.pdf') AS file_name,
               COALESCE(NULLIF(sf.object_key, ''), NULLIF(s.object_key, ''), '') AS object_key
        FROM submissions s
        LEFT JOIN users u ON u.id = s.student_id
        LEFT JOIN LATERAL (
          SELECT file_name, object_key
          FROM submission_files
          WHERE submission_id = s.id
          ORDER BY uploaded_at DESC, id DESC
          LIMIT 1
        ) sf ON true
        WHERE s.id = ? AND s.assignment_id = ?
        """;
    try (var connection = connect();
        var statement = connection.prepareStatement(sql)) {
      statement.setLong(1, submissionId);
      statement.setLong(2, assignmentId);
      try (var results = statement.executeQuery()) {
        if (results.next()) {
          var fileName = results.getString("file_name");
          var objectKey = results.getString("object_key");
          return new SubmissionContext(
              results.getLong("student_id"),
              results.getString("student_name"),
              results.getString("student_no"),
              fileName,
              fileContentText(submissionId, fileName, objectKey)
          );
        }
      }
    } catch (SQLException error) {
      throw new IllegalStateException("Failed to load submission for grading: " + submissionId, error);
    }
    throw new IllegalArgumentException("Submission not found for assignment " + assignmentId + ": " + submissionId);
  }

  private String fileContentText(Long submissionId, String fileName, String objectKey) {
    var ocrText = latestOcrText(submissionId);
    if (ocrText != null && !ocrText.isBlank()) {
      return ocrText;
    }
    return (fileName == null ? "" : fileName) + " " + (objectKey == null ? "" : objectKey);
  }

  private String latestOcrText(Long submissionId) {
    if (jdbcUrl == null || jdbcUrl.isBlank()) {
      return "";
    }
    var sql = """
        SELECT string_agg(COALESCE(NULLIF(b.text_content, ''), b.title), E'\\n' ORDER BY b.sort_order, b.id) AS text_content
        FROM ocr_jobs j
        JOIN ocr_blocks b ON b.ocr_job_id = j.id
        WHERE j.submission_id = ? AND j.status = 'COMPLETED'
        GROUP BY j.id
        ORDER BY max(j.updated_at) DESC NULLS LAST, j.id DESC
        LIMIT 1
        """;
    try (var connection = connect();
        var statement = connection.prepareStatement(sql)) {
      statement.setLong(1, submissionId);
      try (var results = statement.executeQuery()) {
        if (results.next()) {
          return results.getString("text_content");
        }
      }
    } catch (SQLException error) {
      throw new IllegalStateException("Failed to load OCR text for submission: " + submissionId, error);
    }
    return "";
  }

  private SubmissionContext fallbackSubmissionContext(Long assignmentId, Long submissionId) {
    return new SubmissionContext(
        2L,
        "张三",
        "2024010101",
        "自动批改报告-" + submissionId + ".pdf",
        "作业 " + assignmentId + " 提交 " + submissionId
    );
  }

  private java.sql.Connection connect() throws SQLException {
    if (jdbcUsername == null || jdbcUsername.isBlank()) {
      return DriverManager.getConnection(jdbcUrl);
    }
    return DriverManager.getConnection(jdbcUrl, jdbcUsername, jdbcPassword);
  }

  private record SubmissionContext(
      Long studentId,
      String studentName,
      String studentNo,
      String fileName,
      String fileContentText
  ) {}
}
