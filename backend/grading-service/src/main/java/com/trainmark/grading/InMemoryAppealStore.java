package com.trainmark.grading;

import com.trainmark.shared.AppealStatus;
import com.trainmark.shared.dto.AppealSummary;
import com.trainmark.shared.dto.CreateAppealRequest;
import com.trainmark.shared.dto.ResolveAppealRequest;
import java.time.OffsetDateTime;
import java.util.Collection;
import java.util.LinkedHashMap;
import java.util.Map;
import java.util.concurrent.atomic.AtomicLong;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Component;

@Component
@ConditionalOnProperty(name = "trainmark.grading.appeal-store", havingValue = "memory", matchIfMissing = true)
public class InMemoryAppealStore implements AppealStore {
  private final AtomicLong appealIds = new AtomicLong(2);
  private final Map<Long, AppealSummary> appeals = new LinkedHashMap<>();

  public InMemoryAppealStore() {
    appeals.put(1L, new AppealSummary(
        1L,
        1L,
        2L,
        2L,
        "张三",
        "系统实现部分包含失败重试说明，可能未被识别。",
        "申请将系统实现分项由 43 分调整为 45 分。",
        AppealStatus.SUBMITTED,
        null,
        OffsetDateTime.now().minusHours(2),
        null
    ));
  }

  @Override
  public Collection<AppealSummary> listAppeals(Long resultId, Long studentId, AppealStatus status) {
    return appeals.values().stream()
        .filter(item -> resultId == null || resultId.equals(item.resultId()))
        .filter(item -> studentId == null || studentId.equals(item.studentId()))
        .filter(item -> status == null || status == item.status())
        .toList();
  }

  @Override
  public AppealSummary createAppeal(CreateAppealRequest request, String studentName) {
    var id = appealIds.getAndIncrement();
    var appeal = new AppealSummary(
        id,
        request.resultId(),
        request.rubricItemId(),
        request.studentId(),
        studentName,
        request.reason(),
        request.requestedChange(),
        AppealStatus.SUBMITTED,
        null,
        OffsetDateTime.now(),
        null
    );
    appeals.put(id, appeal);
    return appeal;
  }

  @Override
  public AppealSummary resolveAppeal(Long appealId, ResolveAppealRequest request) {
    var appeal = appeals.get(appealId);
    if (appeal == null) {
      throw new IllegalArgumentException("Appeal not found: " + appealId);
    }
    var resolved = new AppealSummary(
        appeal.id(),
        appeal.resultId(),
        appeal.rubricItemId(),
        appeal.studentId(),
        appeal.studentName(),
        appeal.reason(),
        appeal.requestedChange(),
        request.status(),
        request.teacherReply(),
        appeal.createdAt(),
        OffsetDateTime.now()
    );
    appeals.put(appealId, resolved);
    return resolved;
  }
}
