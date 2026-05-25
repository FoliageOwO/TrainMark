package com.trainmark.user;

import com.trainmark.shared.RoleCode;
import com.trainmark.shared.dto.CreateOrganizationRequest;
import com.trainmark.shared.dto.CreateUserRequest;
import com.trainmark.shared.dto.OrganizationSummary;
import com.trainmark.shared.dto.StudentImportRequest;
import com.trainmark.shared.dto.StudentImportResult;
import com.trainmark.shared.dto.UserSummary;
import java.util.Collection;

public interface UserDirectoryStore {
  Collection<OrganizationSummary> listOrganizations(Long parentId);

  OrganizationSummary createOrganization(CreateOrganizationRequest request);

  Collection<UserSummary> listUsers(Long organizationId, RoleCode role);

  Collection<UserSummary> listClassStudents(Long classId);

  UserSummary createUser(CreateUserRequest request);

  StudentImportResult importStudents(StudentImportRequest request);
}
