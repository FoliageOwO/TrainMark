package com.trainmark.admin;

import com.trainmark.shared.dto.AuditLogSummary;
import java.util.Collection;
import org.springframework.stereotype.Service;

@Service
public class AuditLogService {
  private final AuditLogStore store;

  public AuditLogService(AuditLogStore store) {
    this.store = store;
  }

  public Collection<AuditLogSummary> list(String action, String resourceType) {
    return store.list(action, resourceType);
  }
}
