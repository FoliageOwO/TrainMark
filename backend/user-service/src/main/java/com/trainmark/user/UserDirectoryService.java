package com.trainmark.user;

import com.trainmark.shared.OrganizationType;
import com.trainmark.shared.RoleCode;
import com.trainmark.shared.UserStatus;
import com.trainmark.shared.dto.CreateOrganizationRequest;
import com.trainmark.shared.dto.CreateUserRequest;
import com.trainmark.shared.dto.OrganizationSummary;
import com.trainmark.shared.dto.StudentImportRequest;
import com.trainmark.shared.dto.StudentImportResult;
import com.trainmark.shared.dto.UserSummary;
import java.util.ArrayList;
import java.util.Collection;
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.concurrent.atomic.AtomicLong;
import org.springframework.stereotype.Service;

@Service
public class UserDirectoryService {
  private final AtomicLong organizationIds = new AtomicLong(4);
  private final AtomicLong userIds = new AtomicLong(4);
  private final Map<Long, OrganizationSummary> organizations = new LinkedHashMap<>();
  private final Map<Long, UserSummary> users = new LinkedHashMap<>();

  public UserDirectoryService() {
    organizations.put(1L, new OrganizationSummary(1L, null, "信息工程学院", OrganizationType.COLLEGE));
    organizations.put(2L, new OrganizationSummary(2L, 1L, "软件技术", OrganizationType.MAJOR));
    organizations.put(3L, new OrganizationSummary(3L, 2L, "软件2401班", OrganizationType.CLASS));
    users.put(1L, new UserSummary(1L, 1L, "teacher", "王老师", null, "T2026001", "teacher@trainmark.local", null, UserStatus.ACTIVE, List.of(RoleCode.TEACHER)));
    users.put(2L, new UserSummary(2L, 3L, "2024010101", "张三", "2024010101", null, "student@trainmark.local", null, UserStatus.ACTIVE, List.of(RoleCode.STUDENT)));
    users.put(3L, new UserSummary(3L, 1L, "admin", "系统管理员", null, null, "admin@trainmark.local", null, UserStatus.ACTIVE, List.of(RoleCode.ADMIN)));
  }

  public Collection<OrganizationSummary> listOrganizations(Long parentId) {
    return organizations.values().stream()
        .filter(item -> parentId == null || parentId.equals(item.parentId()))
        .sorted(Comparator.comparing(OrganizationSummary::id))
        .toList();
  }

  public OrganizationSummary createOrganization(CreateOrganizationRequest request) {
    var id = organizationIds.getAndIncrement();
    var organization = new OrganizationSummary(id, request.parentId(), request.name(), request.type());
    organizations.put(id, organization);
    return organization;
  }

  public Collection<UserSummary> listUsers(Long organizationId, RoleCode role) {
    return users.values().stream()
        .filter(item -> organizationId == null || organizationId.equals(item.organizationId()))
        .filter(item -> role == null || item.roles().contains(role))
        .sorted(Comparator.comparing(UserSummary::id))
        .toList();
  }

  public UserSummary createUser(CreateUserRequest request) {
    var id = userIds.getAndIncrement();
    var user = new UserSummary(
        id,
        request.organizationId(),
        request.username(),
        request.name(),
        request.studentNo(),
        request.teacherNo(),
        request.email(),
        request.phone(),
        UserStatus.ACTIVE,
        request.roles()
    );
    users.put(id, user);
    return user;
  }

  public StudentImportResult importStudents(StudentImportRequest request) {
    var warnings = new ArrayList<String>();
    var rows = request.rows() == null ? List.<StudentImportRequest.StudentImportRow>of() : request.rows();
    var created = 0;
    var skipped = 0;
    for (var row : rows) {
      if (row.studentNo() == null || row.studentNo().isBlank() || row.name() == null || row.name().isBlank()) {
        skipped++;
        warnings.add("存在缺少学号或姓名的记录，已跳过");
        continue;
      }
      var exists = users.values().stream().anyMatch(user -> row.studentNo().equals(user.studentNo()));
      if (exists) {
        skipped++;
        warnings.add("学号 " + row.studentNo() + " 已存在，已跳过");
        continue;
      }
      var id = userIds.getAndIncrement();
      users.put(id, new UserSummary(
          id,
          request.classId(),
          row.studentNo(),
          row.name(),
          row.studentNo(),
          null,
          row.email(),
          row.phone(),
          UserStatus.ACTIVE,
          List.of(RoleCode.STUDENT)
      ));
      created++;
    }
    return new StudentImportResult(rows.size(), created, skipped, warnings);
  }
}
