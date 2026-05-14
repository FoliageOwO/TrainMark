package com.trainmark.admin;

import com.trainmark.shared.dto.SystemSettingSummary;
import java.util.Collection;

public interface SystemSettingStore {
  Collection<SystemSettingSummary> list(String category);

  SystemSettingSummary update(String key, String value);
}
