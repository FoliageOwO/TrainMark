package com.trainmark.admin;

import com.trainmark.shared.dto.AuditLogSummary;
import java.util.Collection;

public interface AuditLogStore {
  Collection<AuditLogSummary> list(String action, String resourceType);

  AuditLogSummary add(String actorName, String action, String resourceType,
                      String resourceId, String detail, String ipAddress);
}
