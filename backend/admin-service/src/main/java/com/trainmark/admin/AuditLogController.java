package com.trainmark.admin;

import com.trainmark.shared.ApiResponse;
import com.trainmark.shared.dto.AuditLogSummary;
import java.util.Collection;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/admin/audit-logs")
public class AuditLogController {
  private final AuditLogService auditLogService;

  public AuditLogController(AuditLogService auditLogService) {
    this.auditLogService = auditLogService;
  }

  @GetMapping
  public ApiResponse<Collection<AuditLogSummary>> list(
      @RequestParam(name = "action", required = false) String action,
      @RequestParam(name = "resourceType", required = false) String resourceType
  ) {
    return ApiResponse.ok(auditLogService.list(action, resourceType));
  }
}
