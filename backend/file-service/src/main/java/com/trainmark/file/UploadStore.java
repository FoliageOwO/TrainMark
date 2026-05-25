package com.trainmark.file;

import com.trainmark.shared.dto.CompleteUploadRequest;
import com.trainmark.shared.dto.InitializeUploadRequest;
import com.trainmark.shared.dto.SubmissionReceipt;
import com.trainmark.shared.dto.SubmissionSummary;
import java.time.OffsetDateTime;
import java.util.Collection;
import java.util.List;

public interface UploadStore {
  void saveUploadSession(String uploadId, InitializeUploadRequest request, String objectKey, OffsetDateTime expiresAt);

  Long findUploadStudentId(String uploadId);

  SubmissionReceipt completeUpload(CompleteUploadRequest request);

  List<Long> assignmentTeacherIds(Long assignmentId);

  Collection<SubmissionSummary> listSubmissions(Long assignmentId, Long studentId);

  SubmissionFileDescriptor getSubmissionFile(Long submissionId);

  void deleteSubmission(Long submissionId);
}
