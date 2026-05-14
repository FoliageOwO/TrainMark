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
  private final Map<String, StoredSetting> settings = new LinkedHashMap<>();

  public InMemorySystemSettingStore() {
    settings.put("ai.ocr.provider", new StoredSetting("ai.ocr.provider", "OCR Provider", "LOCAL_DETERMINISTIC", "AI", false));
    settings.put("ai.scoring.provider", new StoredSetting("ai.scoring.provider", "Scoring Provider", "LOCAL_RULES", "AI", false));
    settings.put("upload.max-file-size-mb", new StoredSetting("upload.max-file-size-mb", "Max Upload Size", "50", "FILE", false));
    settings.put("export.retention-days", new StoredSetting("export.retention-days", "Export Retention", "30", "EXPORT", false));
    settings.put("notification.default-channels", new StoredSetting("notification.default-channels", "Default Reminder Channels", "IN_APP,EMAIL,WECHAT_WORK", "NOTIFICATION", false));
    settings.put("security.jwt-secret", new StoredSetting("security.jwt-secret", "JWT Secret", "trainmark_dev_secret", "SECURITY", true));
  }

  @Override
  public Collection<SystemSettingSummary> list(String category) {
    return settings.values().stream()
        .filter(item -> category == null || category.isBlank() || category.equals(item.category()))
        .map(StoredSetting::toSummary)
        .toList();
  }

  @Override
  public SystemSettingSummary update(String key, String value) {
    var current = settings.get(key);
    if (current == null) {
      throw new IllegalArgumentException("System setting not found: " + key);
    }
    var updated = new StoredSetting(current.key(), current.name(), value, current.category(), current.sensitive());
    settings.put(key, updated);
    return updated.toSummary();
  }

  private record StoredSetting(String key, String name, String value, String category, boolean sensitive) {
    SystemSettingSummary toSummary() {
      return new SystemSettingSummary(key, name, sensitive ? "******" : value, category, sensitive);
    }
  }
}
