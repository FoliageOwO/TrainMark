package com.trainmark.notification;

import com.trainmark.shared.dto.ReminderRequest;
import com.trainmark.shared.dto.ReminderResult;
import com.trainmark.shared.dto.SubmissionCollectionOverview;
import com.trainmark.shared.dto.UnsubmittedStudent;
import java.util.Collection;
import org.springframework.stereotype.Service;

@Service
public class ReminderService {
  private final NotificationStore store;

  public ReminderService(NotificationStore store) {
    this.store = store;
  }

  public SubmissionCollectionOverview collectionOverview(Long assignmentId) {
    return store.collectionOverview(assignmentId);
  }

  public Collection<UnsubmittedStudent> unsubmittedStudents(Long assignmentId) {
    return store.unsubmittedStudents(assignmentId);
  }

  public ReminderResult remind(ReminderRequest request) {
    return store.remind(request);
  }
}
