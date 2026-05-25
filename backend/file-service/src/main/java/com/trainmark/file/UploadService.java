package com.trainmark.file;

import com.trainmark.shared.FileUploadStatus;
import com.trainmark.shared.dto.CompleteUploadRequest;
import com.trainmark.shared.dto.InitializeUploadRequest;
import com.trainmark.shared.dto.InitializeUploadResponse;
import com.trainmark.shared.dto.SubmissionReceipt;
import com.trainmark.shared.dto.SubmissionSummary;
import com.trainmark.shared.dto.UploadObjectSummary;
import java.io.IOException;
import java.io.UncheckedIOException;
import java.util.Arrays;
import java.util.Collection;
import java.util.List;
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
  private final UploadObjectStore objectStore;
  private final boolean requireObjectContent;

  public UploadService(
      @Value("${trainmark.upload.max-file-size-mb:50}") long maxFileSizeMb,
      @Value("${trainmark.upload.allowed-content-types:application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,image/png,image/jpeg}") String allowedContentTypes,
      @Value("${trainmark.upload.require-object-content:false}") boolean requireObjectContent,
      UploadStore store,
      UploadObjectStore objectStore
  ) {
    this.maxFileSizeBytes = maxFileSizeMb * 1024 * 1024;
    this.allowedContentTypes = Arrays.stream(allowedContentTypes.split(","))
        .map(String::trim)
        .filter(item -> !item.isBlank())
        .collect(Collectors.toUnmodifiableSet());
    this.store = store;
    this.objectStore = objectStore;
    this.requireObjectContent = requireObjectContent;
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
    if (requireObjectContent && !objectStore.exists(request.objectKey())) {
      throw new IllegalArgumentException("Upload object content not found: " + request.objectKey());
    }
    return store.completeUpload(request);
  }

  public List<Long> assignmentTeacherIds(Long assignmentId) {
    return store.assignmentTeacherIds(assignmentId);
  }

  public Long findUploadStudentId(String uploadId) {
    return store.findUploadStudentId(uploadId);
  }

  public Collection<SubmissionSummary> listSubmissions(Long assignmentId, Long studentId) {
    return store.listSubmissions(assignmentId, studentId);
  }

  public DownloadedUpload downloadSubmissionFile(Long submissionId) {
    var file = store.getSubmissionFile(submissionId);
    try {
      return new DownloadedUpload(file.fileName(), contentType(file.fileName()), objectStore.get(file.objectKey()));
    } catch (IOException error) {
      throw new UncheckedIOException("Failed to read upload object", error);
    }
  }

  public SubmissionFileDescriptor getSubmissionFileDescriptor(Long submissionId) {
    return store.getSubmissionFile(submissionId);
  }

  public void deleteSubmission(Long submissionId) {
    store.deleteSubmission(submissionId);
  }

  public UploadObjectSummary storeContent(String uploadId, String objectKey, String contentType, long size, java.io.InputStream content) {
    validateObjectContent(objectKey, contentType, size);
    try {
      objectStore.put(objectKey, content, size, contentType);
      return new UploadObjectSummary(uploadId, objectKey, size, java.time.OffsetDateTime.now());
    } catch (IOException error) {
      throw new UncheckedIOException("Failed to store upload object", error);
    }
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

  private void validateObjectContent(String objectKey, String contentType, long size) {
    if (size > maxFileSizeBytes) {
      throw new IllegalArgumentException("File size exceeds limit: " + objectKey);
    }
    if (contentType == null || !allowedContentTypes.contains(contentType)) {
      throw new IllegalArgumentException("Unsupported content type: " + contentType);
    }
    var fileName = objectKey.toLowerCase();
    var allowedExtension = ALLOWED_EXTENSIONS.stream().anyMatch(fileName::endsWith);
    if (!allowedExtension) {
      throw new IllegalArgumentException("Unsupported file extension: " + objectKey);
    }
  }

  private String contentType(String fileName) {
    var normalized = fileName.toLowerCase();
    if (normalized.endsWith(".pdf")) {
      return "application/pdf";
    }
    if (normalized.endsWith(".doc")) {
      return "application/msword";
    }
    if (normalized.endsWith(".docx")) {
      return "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
    }
    if (normalized.endsWith(".png")) {
      return "image/png";
    }
    if (normalized.endsWith(".jpg") || normalized.endsWith(".jpeg")) {
      return "image/jpeg";
    }
    return "application/octet-stream";
  }

  public record DownloadedUpload(String fileName, String contentType, byte[] content) {}

}
