package com.trainmark.admin;

import com.trainmark.shared.dto.SystemSettingSummary;
import java.util.Collection;
import org.springframework.stereotype.Service;

@Service
public class SystemSettingService {
  private final SystemSettingStore store;

  public SystemSettingService(SystemSettingStore store) {
    this.store = store;
  }

  public Collection<SystemSettingSummary> list(String category) {
    return store.list(category);
  }

  public SystemSettingSummary update(String key, String value) {
    if (key == null || key.isBlank()) {
      throw new IllegalArgumentException("Setting key is required");
    }
    if (value == null || value.isBlank()) {
      throw new IllegalArgumentException("Setting value is required");
    }
    return store.update(key, value.trim());
  }
}
