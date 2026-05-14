package com.trainmark.admin;

import com.trainmark.shared.ApiResponse;
import com.trainmark.shared.dto.SystemSettingSummary;
import java.util.Collection;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/admin/settings")
public class SystemSettingController {
  private final SystemSettingService systemSettingService;

  public SystemSettingController(SystemSettingService systemSettingService) {
    this.systemSettingService = systemSettingService;
  }

  @GetMapping
  public ApiResponse<Collection<SystemSettingSummary>> list(@RequestParam(required = false) String category) {
    return ApiResponse.ok(systemSettingService.list(category));
  }
}
