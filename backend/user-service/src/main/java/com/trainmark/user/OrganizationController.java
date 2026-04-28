package com.trainmark.user;

import com.trainmark.shared.ApiResponse;
import com.trainmark.shared.dto.CreateOrganizationRequest;
import com.trainmark.shared.dto.OrganizationSummary;
import jakarta.validation.Valid;
import java.util.Collection;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/organizations")
public class OrganizationController {
  private final UserDirectoryService userDirectoryService;

  public OrganizationController(UserDirectoryService userDirectoryService) {
    this.userDirectoryService = userDirectoryService;
  }

  @GetMapping
  public ApiResponse<Collection<OrganizationSummary>> list(@RequestParam(required = false) Long parentId) {
    return ApiResponse.ok(userDirectoryService.listOrganizations(parentId));
  }

  @PostMapping
  public ApiResponse<OrganizationSummary> create(@Valid @RequestBody CreateOrganizationRequest request) {
    return ApiResponse.ok(userDirectoryService.createOrganization(request));
  }
}
