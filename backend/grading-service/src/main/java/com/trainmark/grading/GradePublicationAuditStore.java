package com.trainmark.grading;

import com.trainmark.shared.dto.GradePublicationAuditEntry;
import java.util.Collection;

public interface GradePublicationAuditStore {
  Collection<GradePublicationAuditEntry> listPublicationAudits(Long resultId);

  GradePublicationAuditEntry appendPublicationAudit(
      Long resultId,
      String action,
      String operatorName,
      String reason
  );
}
