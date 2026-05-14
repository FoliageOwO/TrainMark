package com.trainmark.file;

import com.trainmark.shared.FileUploadStatus;
import com.trainmark.shared.dto.CompleteUploadRequest;
import com.trainmark.shared.dto.InitializeUploadRequest;
import com.trainmark.shared.dto.InitializeUploadResponse;
import com.trainmark.shared.dto.SubmissionReceipt;
import com.trainmark.shared.dto.SubmissionSummary;
import java.util.Arrays;
import java.util.Collection;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

@Service
public class UploadService {
  private static final int PART_SIZE_MB = 8;
  private static final Set<String> ALLOWED_EXTENSIONS = Set.of(".pdf", ".doc", ".docx", ".png", ".jpg", ".jpeg");

  private final long maxFileSizeBytes;
  private final Set<String> allowedContentTypes;
  private final UploadStore store;

  public UploadService(
      @Value("${trainmark.upload.max-file-size-mb:50}") long maxFileSizeMb,
      @Value("${trainmark.upload.allowed-content-types:application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,image/png,image/jpeg}") String allowedContentTypes,
      UploadStore store
  ) {
    this.maxFileSizeBytes = maxFileSizeMb * 1024 * 1024;
    this.allowedContentTypes = Arrays.stream(allowedContentTypes.split(","))
        .map(String::trim)
        .filter(item -> !item.isBlank())
        .collect(Collectors.toUnmodifiableSet());
    this.store = store;
  }

  public InitializeUploadResponse initialize(InitializeUploadRequest request) {
    validateUploadRequest(request);
    var uploadId = UUID.randomUUID().toString();
    var objectKey = "assignments/%d/students/%d/%s".formatted(
        request.assignmentId(),
        request.studentId(),
        sanitizeFileName(request.fileName())
    );
    var expiresAt = java.time.OffsetDateTime.now().plusHours(2);
    store.saveUploadSession(uploadId, request, objectKey, expiresAt);
    return new InitializeUploadResponse(
        uploadId,
        request.assignmentId(),
        request.studentId(),
        objectKey,
        PART_SIZE_MB,
        FileUploadStatus.INITIALIZED,
        expiresAt
    );
  }

  public SubmissionReceipt complete(CompleteUploadRequest request) {
    return store.completeUpload(request);
  }

  public Collection<SubmissionSummary> listSubmissions(Long assignmentId, Long studentId) {
    return store.listSubmissions(assignmentId, studentId);
  }

  private String sanitizeFileName(String fileName) {
    return fileName.replaceAll("[^a-zA-Z0-9._\\-\\u4e00-\\u9fa5]", "_");
  }

  private void validateUploadRequest(InitializeUploadRequest request) {
    if (request.fileSize() > maxFileSizeBytes) {
      throw new IllegalArgumentException("File size exceeds limit: " + request.fileName());
    }
    if (!allowedContentTypes.contains(request.contentType())) {
      throw new IllegalArgumentException("Unsupported content type: " + request.contentType());
    }
    var fileName = request.fileName().toLowerCase();
    var allowedExtension = ALLOWED_EXTENSIONS.stream().anyMatch(fileName::endsWith);
    if (!allowedExtension) {
      throw new IllegalArgumentException("Unsupported file extension: " + request.fileName());
    }
  }

}
