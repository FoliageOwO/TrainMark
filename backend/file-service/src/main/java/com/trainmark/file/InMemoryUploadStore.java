package com.trainmark.file;

import com.trainmark.shared.SubmissionStatus;
import com.trainmark.shared.dto.CompleteUploadRequest;
import com.trainmark.shared.dto.InitializeUploadRequest;
import com.trainmark.shared.dto.SubmissionReceipt;
import com.trainmark.shared.dto.SubmissionSummary;
import java.time.OffsetDateTime;
import java.util.Collection;
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.concurrent.atomic.AtomicLong;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Component;

@Component
@ConditionalOnProperty(name = "trainmark.file.store", havingValue = "memory", matchIfMissing = true)
public class InMemoryUploadStore implements UploadStore {
  private final AtomicLong submissionIds = new AtomicLong(2);
  private final Map<String, PendingUpload> pendingUploads = new LinkedHashMap<>();
  private final Map<Long, SubmissionSummary> submissions = new LinkedHashMap<>();
  private final Map<Long, String> objectKeys = new LinkedHashMap<>();

  public InMemoryUploadStore() {
    submissions.put(1L, new SubmissionSummary(
        1L,
        2L,
        2L,
        "张三",
        "2024010101",
        "数据库设计报告.pdf",
        "assignments/1/students/2/database-report.pdf",
        1,
        SubmissionStatus.PUBLISHED,
        OffsetDateTime.now().minusDays(4)
    ));
    objectKeys.put(1L, "assignments/1/students/2/database-report.pdf");
  }

  @Override
  public void saveUploadSession(String uploadId, InitializeUploadRequest request, String objectKey, OffsetDateTime expiresAt) {
    pendingUploads.put(uploadId, new PendingUpload(request, objectKey, expiresAt));
  }

  @Override
  public Long findUploadStudentId(String uploadId) {
    var upload = pendingUploads.get(uploadId);
    if (upload == null) {
      throw new IllegalArgumentException("Upload session not found: " + uploadId);
    }
    return upload.request().studentId();
  }

  @Override
  public SubmissionReceipt completeUpload(CompleteUploadRequest request) {
    var upload = pendingUploads.remove(request.uploadId());
    if (upload == null) {
      throw new IllegalArgumentException("Upload session not found: " + request.uploadId());
    }
    validateUpload(request, upload);
    var submittedAt = OffsetDateTime.now();
    var existing = latestSubmission(upload.request().assignmentId(), upload.request().studentId());
    var id = existing == null ? submissionIds.getAndIncrement() : existing.id();
    var version = existing == null ? 1 : existing.version() + 1;
    var summary = new SubmissionSummary(
        id,
        upload.request().assignmentId(),
        upload.request().studentId(),
        "张三",
        "2024010101",
        upload.request().fileName(),
        upload.objectKey(),
        version,
        SubmissionStatus.SUBMITTED,
        submittedAt
    );
    if (existing != null) {
      submissions.values().removeIf(item ->
          upload.request().assignmentId().equals(item.assignmentId())
              && upload.request().studentId().equals(item.studentId())
              && !id.equals(item.id()));
      objectKeys.keySet().removeIf(submissionId -> !submissions.containsKey(submissionId));
    }
    submissions.put(id, summary);
    objectKeys.put(id, upload.objectKey());
    return new SubmissionReceipt(
        id,
        summary.assignmentId(),
        summary.studentId(),
        summary.fileName(),
        upload.objectKey(),
        summary.version(),
        summary.status(),
        submittedAt
    );
  }

  @Override
  public Collection<SubmissionSummary> listSubmissions(Long assignmentId, Long studentId) {
    return submissions.values().stream()
        .filter(item -> assignmentId == null || assignmentId.equals(item.assignmentId()))
        .filter(item -> studentId == null || studentId.equals(item.studentId()))
        .sorted(Comparator.comparing(SubmissionSummary::submittedAt).reversed())
        .toList();
  }

  @Override
  public SubmissionFileDescriptor getSubmissionFile(Long submissionId) {
    var submission = submissions.get(submissionId);
    var objectKey = objectKeys.get(submissionId);
    if (submission == null || objectKey == null) {
      throw new IllegalArgumentException("Submission file not found: " + submissionId);
    }
    return new SubmissionFileDescriptor(
        submissionId,
        submission.assignmentId(),
        submission.studentId(),
        submission.fileName(),
        objectKey
    );
  }

  @Override
  public List<Long> assignmentTeacherIds(Long assignmentId) {
    return List.of(1L);
  }

  @Override
  public void deleteSubmission(Long submissionId) {
    if (!submissions.containsKey(submissionId)) {
      throw new IllegalArgumentException("Submission file not found: " + submissionId);
    }
    submissions.remove(submissionId);
    objectKeys.remove(submissionId);
  }

  private void validateUpload(CompleteUploadRequest request, PendingUpload upload) {
    if (!upload.objectKey().equals(request.objectKey())) {
      throw new IllegalArgumentException("Upload object key does not match initialized session");
    }
    var initializedChecksum = upload.request().checksum();
    if (hasText(initializedChecksum) && hasText(request.checksum()) && !initializedChecksum.equals(request.checksum())) {
      throw new IllegalArgumentException("Upload checksum does not match initialized session");
    }
  }

  private SubmissionSummary latestSubmission(Long assignmentId, Long studentId) {
    return submissions.values().stream()
        .filter(item -> assignmentId.equals(item.assignmentId()))
        .filter(item -> studentId.equals(item.studentId()))
        .max(Comparator.comparing(SubmissionSummary::version)
            .thenComparing(SubmissionSummary::submittedAt)
            .thenComparing(SubmissionSummary::id))
        .orElse(null);
  }

  private boolean hasText(String value) {
    return value != null && !value.isBlank();
  }

  private record PendingUpload(InitializeUploadRequest request, String objectKey, OffsetDateTime expiresAt) {}
}
