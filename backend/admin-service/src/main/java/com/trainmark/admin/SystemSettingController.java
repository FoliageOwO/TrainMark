package com.trainmark.admin;

import com.trainmark.shared.ApiResponse;
import com.trainmark.shared.dto.SystemSettingSummary;
import com.trainmark.shared.dto.UpdateSystemSettingRequest;
import jakarta.validation.Valid;
import java.util.Collection;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestBody;
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
  public ApiResponse<Collection<SystemSettingSummary>> list(
      @RequestParam(name = "category", required = false) String category
  ) {
    return ApiResponse.ok(systemSettingService.list(category));
  }

  @PatchMapping("/{key}")
  public ApiResponse<SystemSettingSummary> update(
      @PathVariable("key") String key,
      @Valid @RequestBody UpdateSystemSettingRequest request
  ) {
    return ApiResponse.ok(systemSettingService.update(key, request.value()));
  }
}
