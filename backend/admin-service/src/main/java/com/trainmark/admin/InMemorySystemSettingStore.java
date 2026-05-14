package com.trainmark.admin;

import com.trainmark.shared.dto.SystemSettingSummary;
import java.util.Collection;
import java.util.LinkedHashMap;
import java.util.Map;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Component;

@Component
@ConditionalOnProperty(name = "trainmark.admin.store", havingValue = "memory", matchIfMissing = true)
public class InMemorySystemSettingStore implements SystemSettingStore {
  private final Map<String, SystemSettingSummary> settings = new LinkedHashMap<>();

  public InMemorySystemSettingStore() {
    settings.put("ai.ocr.provider", new SystemSettingSummary("ai.ocr.provider", "OCR Provider", "LOCAL_DETERMINISTIC", "AI", false));
    settings.put("ai.scoring.provider", new SystemSettingSummary("ai.scoring.provider", "Scoring Provider", "LOCAL_RULES", "AI", false));
    settings.put("upload.max-file-size-mb", new SystemSettingSummary("upload.max-file-size-mb", "Max Upload Size", "50", "FILE", false));
    settings.put("export.retention-days", new SystemSettingSummary("export.retention-days", "Export Retention", "30", "EXPORT", false));
    settings.put("notification.default-channels", new SystemSettingSummary("notification.default-channels", "Default Reminder Channels", "IN_APP,EMAIL,WECHAT_WORK", "NOTIFICATION", false));
    settings.put("security.jwt-secret", new SystemSettingSummary("security.jwt-secret", "JWT Secret", "******", "SECURITY", true));
  }

  @Override
  public Collection<SystemSettingSummary> list(String category) {
    return settings.values().stream()
        .filter(item -> category == null || category.equals(item.category()))
        .toList();
  }
}
