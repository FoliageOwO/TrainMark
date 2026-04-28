package com.trainmark.user;

import com.trainmark.shared.ApiResponse;
import com.trainmark.shared.RoleCode;
import com.trainmark.shared.dto.CreateUserRequest;
import com.trainmark.shared.dto.StudentImportRequest;
import com.trainmark.shared.dto.StudentImportResult;
import com.trainmark.shared.dto.UserSummary;
import jakarta.validation.Valid;
import java.util.Collection;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/users")
public class UserController {
  private final UserDirectoryService userDirectoryService;

  public UserController(UserDirectoryService userDirectoryService) {
    this.userDirectoryService = userDirectoryService;
  }

  @GetMapping
  public ApiResponse<Collection<UserSummary>> list(
      @RequestParam(required = false) Long organizationId,
      @RequestParam(required = false) RoleCode role
  ) {
    return ApiResponse.ok(userDirectoryService.listUsers(organizationId, role));
  }

  @PostMapping
  public ApiResponse<UserSummary> create(@Valid @RequestBody CreateUserRequest request) {
    return ApiResponse.ok(userDirectoryService.createUser(request));
  }

  @PostMapping("/students/import")
  public ApiResponse<StudentImportResult> importStudents(@Valid @RequestBody StudentImportRequest request) {
    return ApiResponse.ok(userDirectoryService.importStudents(request));
  }
}
