package com.trainmark.user;

import com.trainmark.shared.RoleCode;
import com.trainmark.shared.dto.CreateOrganizationRequest;
import com.trainmark.shared.dto.CreateUserRequest;
import com.trainmark.shared.dto.OrganizationSummary;
import com.trainmark.shared.dto.StudentImportRequest;
import com.trainmark.shared.dto.StudentImportResult;
import com.trainmark.shared.dto.UserSummary;
import java.util.Collection;
import org.springframework.stereotype.Service;

@Service
public class UserDirectoryService {
  private final UserDirectoryStore store;

  public UserDirectoryService(UserDirectoryStore store) {
    this.store = store;
  }

  public Collection<OrganizationSummary> listOrganizations(Long parentId) {
    return store.listOrganizations(parentId);
  }

  public OrganizationSummary createOrganization(CreateOrganizationRequest request) {
    return store.createOrganization(request);
  }

  public Collection<UserSummary> listUsers(Long organizationId, RoleCode role) {
    return store.listUsers(organizationId, role);
  }

  public Collection<UserSummary> listClassStudents(Long classId) {
    return store.listClassStudents(classId);
  }

  public UserSummary createUser(CreateUserRequest request) {
    return store.createUser(request);
  }

  public StudentImportResult importStudents(StudentImportRequest request) {
    return store.importStudents(request);
  }
}
