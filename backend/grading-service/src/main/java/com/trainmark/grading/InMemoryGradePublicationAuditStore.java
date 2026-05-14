package com.trainmark.grading;

import com.trainmark.shared.dto.GradePublicationAuditEntry;
import java.time.OffsetDateTime;
import java.util.Collection;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.concurrent.atomic.AtomicLong;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Component;

@Component
@ConditionalOnProperty(name = "trainmark.grading.publication-audit-store", havingValue = "memory", matchIfMissing = true)
public class InMemoryGradePublicationAuditStore implements GradePublicationAuditStore {
  private final AtomicLong auditIds = new AtomicLong(1);
  private final Map<Long, List<GradePublicationAuditEntry>> publicationAudits = new LinkedHashMap<>();

  @Override
  public Collection<GradePublicationAuditEntry> listPublicationAudits(Long resultId) {
    return publicationAudits.getOrDefault(resultId, List.of());
  }

  @Override
  public GradePublicationAuditEntry appendPublicationAudit(
      Long resultId,
      String action,
      String operatorName,
      String reason
  ) {
    var entry = new GradePublicationAuditEntry(
        auditIds.getAndIncrement(),
        resultId,
        action,
        operatorName,
        reason,
        OffsetDateTime.now()
    );
    publicationAudits.merge(resultId, List.of(entry), (current, appended) -> {
      var entries = new java.util.ArrayList<>(current);
      entries.addAll(appended);
      return List.copyOf(entries);
    });
    return entry;
  }
}
