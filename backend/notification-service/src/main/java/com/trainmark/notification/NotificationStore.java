package com.trainmark.notification;

import com.trainmark.shared.dto.ReminderRequest;
import com.trainmark.shared.dto.ReminderResult;
import com.trainmark.shared.dto.SubmissionCollectionOverview;
import com.trainmark.shared.dto.UnsubmittedStudent;
import java.util.Collection;

public interface NotificationStore {
  SubmissionCollectionOverview collectionOverview(Long assignmentId);

  Collection<UnsubmittedStudent> unsubmittedStudents(Long assignmentId);

  ReminderResult remind(ReminderRequest request);
}
