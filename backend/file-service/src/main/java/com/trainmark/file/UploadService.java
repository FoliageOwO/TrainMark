package com.trainmark.file;

import com.trainmark.shared.FileUploadStatus;
import com.trainmark.shared.SubmissionStatus;
import com.trainmark.shared.dto.CompleteUploadRequest;
import com.trainmark.shared.dto.InitializeUploadRequest;
import com.trainmark.shared.dto.InitializeUploadResponse;
import com.trainmark.shared.dto.SubmissionReceipt;
import com.trainmark.shared.dto.SubmissionSummary;
import java.time.OffsetDateTime;
import java.util.Collection;
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.Map;
import java.util.UUID;
import java.util.concurrent.atomic.AtomicLong;
import org.springframework.stereotype.Service;

@Service
public class UploadService {
  private static final int PART_SIZE_MB = 8;

  private final AtomicLong submissionIds = new AtomicLong(2);
  private final Map<String, PendingUpload> pendingUploads = new LinkedHashMap<>();
  private final Map<Long, SubmissionSummary> submissions = new LinkedHashMap<>();

  public UploadService() {
    submissions.put(1L, new SubmissionSummary(
        1L,
        2L,
        2L,
        "张三",
        "2024010101",
        "数据库设计报告.pdf",
        1,
        SubmissionStatus.PUBLISHED,
        OffsetDateTime.now().minusDays(4)
    ));
  }

  public InitializeUploadResponse initialize(InitializeUploadRequest request) {
    var uploadId = UUID.randomUUID().toString();
    var objectKey = "assignments/%d/students/%d/%s".formatted(
        request.assignmentId(),
        request.studentId(),
        sanitizeFileName(request.fileName())
    );
    pendingUploads.put(uploadId, new PendingUpload(request, objectKey));
    return new InitializeUploadResponse(
        uploadId,
        request.assignmentId(),
        request.studentId(),
        objectKey,
        PART_SIZE_MB,
        FileUploadStatus.INITIALIZED,
        OffsetDateTime.now().plusHours(2)
    );
  }

  public SubmissionReceipt complete(CompleteUploadRequest request) {
    var upload = pendingUploads.remove(request.uploadId());
    if (upload == null) {
      throw new IllegalArgumentException("Upload session not found: " + request.uploadId());
    }
    var id = submissionIds.getAndIncrement();
    var submittedAt = OffsetDateTime.now();
    var summary = new SubmissionSummary(
        id,
        upload.request().assignmentId(),
        upload.request().studentId(),
        "张三",
        "2024010101",
        upload.request().fileName(),
        1,
        SubmissionStatus.SUBMITTED,
        submittedAt
    );
    submissions.put(id, summary);
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

  public Collection<SubmissionSummary> listSubmissions(Long assignmentId, Long studentId) {
    return submissions.values().stream()
        .filter(item -> assignmentId == null || assignmentId.equals(item.assignmentId()))
        .filter(item -> studentId == null || studentId.equals(item.studentId()))
        .sorted(Comparator.comparing(SubmissionSummary::submittedAt).reversed())
        .toList();
  }

  private String sanitizeFileName(String fileName) {
    return fileName.replaceAll("[^a-zA-Z0-9._\\-\\u4e00-\\u9fa5]", "_");
  }

  private record PendingUpload(InitializeUploadRequest request, String objectKey) {}
}
