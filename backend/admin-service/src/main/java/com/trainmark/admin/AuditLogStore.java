package com.trainmark.admin;

import com.trainmark.shared.dto.AuditLogSummary;
import java.util.Collection;

public interface AuditLogStore {
  Collection<AuditLogSummary> list(String action, String resourceType);
}
