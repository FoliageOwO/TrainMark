package com.trainmark.notification;

import com.trainmark.shared.NotificationChannel;
import com.trainmark.shared.NotificationStatus;
import com.trainmark.shared.dto.ReminderRequest;
import com.trainmark.shared.dto.ReminderResult;
import com.trainmark.shared.dto.SubmissionCollectionOverview;
import com.trainmark.shared.dto.UnsubmittedStudent;
import java.time.OffsetDateTime;
import java.util.Collection;
import java.util.List;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Component;

@Component
@ConditionalOnProperty(name = "trainmark.notification.store", havingValue = "memory", matchIfMissing = true)
public class InMemoryNotificationStore implements NotificationStore {
  private final List<UnsubmittedStudent> unsubmittedStudents = List.of(
      new UnsubmittedStudent(12L, "2024010112", "周明", "软件2401班", "zhouming@trainmark.local"),
      new UnsubmittedStudent(18L, "2024010118", "钱雨", "软件2401班", "qianyu@trainmark.local"),
      new UnsubmittedStudent(43L, "2024010243", "孙可", "软件2402班", "sunke@trainmark.local")
  );

  @Override
  public SubmissionCollectionOverview collectionOverview(Long assignmentId) {
    return new SubmissionCollectionOverview(assignmentId, 96, 65, 31, 4, 18, 12, 0);
  }

  @Override
  public Collection<UnsubmittedStudent> unsubmittedStudents(Long assignmentId) {
    return unsubmittedStudents;
  }

  @Override
  public ReminderResult remind(ReminderRequest request) {
    var channels = request.channels().isEmpty() ? List.of(NotificationChannel.IN_APP) : request.channels();
    return new ReminderResult(
        request.assignmentId(),
        request.studentIds().size(),
        request.studentIds().size() * channels.size(),
        channels,
        NotificationStatus.SENT,
        OffsetDateTime.now()
    );
  }
}
