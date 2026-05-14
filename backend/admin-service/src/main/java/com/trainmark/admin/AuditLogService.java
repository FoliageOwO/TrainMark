package com.trainmark.admin;

import com.trainmark.shared.dto.AuditLogSummary;
import java.time.OffsetDateTime;
import java.util.Collection;
import java.util.LinkedHashMap;
import java.util.Map;
import java.util.concurrent.atomic.AtomicLong;
import org.springframework.stereotype.Service;

@Service
public class AuditLogService {
  private final AtomicLong ids = new AtomicLong(8);
  private final Map<Long, AuditLogSummary> auditLogs = new LinkedHashMap<>();

  public AuditLogService() {
    add("王老师", "UPLOAD_COMPLETE", "SUBMISSION", "1", "学生张三提交 Java Web 综合实训报告", "127.0.0.1", OffsetDateTime.now().minusHours(7));
    add("系统任务", "OCR_COMPLETE", "OCR_JOB", "1", "完成 18 页文档 OCR 和结构化识别", "127.0.0.1", OffsetDateTime.now().minusHours(6));
    add("系统任务", "GRADING_COMPLETE", "GRADING_JOB", "1", "本地规则评分完成 65 份报告", "127.0.0.1", OffsetDateTime.now().minusHours(5));
    add("王老师", "REVIEW_UPDATE", "GRADING_RESULT", "1", "复核系统实现分项并保存教师评语", "127.0.0.1", OffsetDateTime.now().minusHours(4));
    add("王老师", "GRADE_PUBLISH", "GRADING_RESULT", "1", "发布成绩与批注 PDF", "127.0.0.1", OffsetDateTime.now().minusHours(3));
    add("张三", "APPEAL_SUBMIT", "APPEAL", "1", "学生针对系统实现分项提交申诉", "127.0.0.1", OffsetDateTime.now().minusHours(2));
    add("王老师", "GRADE_EXPORT", "GRADE_EXPORT", "1", "导出 CSV 成绩单 48 行", "127.0.0.1", OffsetDateTime.now().minusMinutes(35));
  }

  public Collection<AuditLogSummary> list(String action, String resourceType) {
    return auditLogs.values().stream()
        .filter(item -> action == null || action.equals(item.action()))
        .filter(item -> resourceType == null || resourceType.equals(item.resourceType()))
        .toList();
  }

  private void add(String actorName, String action, String resourceType, String resourceId, String detail, String ipAddress, OffsetDateTime createdAt) {
    var id = ids.getAndIncrement();
    auditLogs.put(id, new AuditLogSummary(id, actorName, action, resourceType, resourceId, detail, ipAddress, createdAt));
  }
}
