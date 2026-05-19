#!/usr/bin/env bash
set -euo pipefail

GATEWAY_URL="${GATEWAY_URL:-http://localhost:8080}"
SMOKE_DRY_RUN="${SMOKE_DRY_RUN:-0}"
SMOKE_RETRIES="${SMOKE_RETRIES:-1}"
SMOKE_RETRY_DELAY_SECONDS="${SMOKE_RETRY_DELAY_SECONDS:-2}"
SMOKE_INCLUDE_WRITES="${SMOKE_INCLUDE_WRITES:-0}"
TRAINMARK_JDBC_ASSERTIONS="${TRAINMARK_JDBC_ASSERTIONS:-0}"
SMOKE_ACCESS_TOKEN=""
SMOKE_ADMIN_TOKEN=""

check_url() {
  local label="$1"
  local url="$2"
  local attempt=1
  local auth_args=()

  if [[ -n "$SMOKE_ACCESS_TOKEN" ]]; then
    auth_args=(-H "Authorization: Bearer $SMOKE_ACCESS_TOKEN")
  fi

  if [[ "$SMOKE_DRY_RUN" == "1" ]]; then
    echo "[smoke:dry-run] $label -> $url"
    return
  fi

  while true; do
    echo "[smoke] $label (attempt $attempt/$SMOKE_RETRIES)"
    if curl --noproxy '*' --fail --silent --show-error --max-time 5 "${auth_args[@]}" "$url" >/dev/null; then
      return
    fi
    if ((attempt >= SMOKE_RETRIES)); then
      return 1
    fi
    attempt=$((attempt + 1))
    sleep "$SMOKE_RETRY_DELAY_SECONDS"
  done
}

check_api() {
  local label="$1"
  local url="$2"
  local attempt=1
  local response
  local auth_args=()

  if [[ -n "$SMOKE_ACCESS_TOKEN" ]]; then
    auth_args=(-H "Authorization: Bearer $SMOKE_ACCESS_TOKEN")
  fi

  if [[ "$SMOKE_DRY_RUN" == "1" ]]; then
    echo "[smoke:dry-run] API $label -> $url"
    return
  fi

  while true; do
    echo "[smoke] API $label (attempt $attempt/$SMOKE_RETRIES)"
    if response="$(curl --noproxy '*' --fail --silent --show-error --max-time 5 "${auth_args[@]}" "$url")" && api_success "$response"; then
      return
    fi
    if ((attempt >= SMOKE_RETRIES)); then
      return 1
    fi
    attempt=$((attempt + 1))
    sleep "$SMOKE_RETRY_DELAY_SECONDS"
  done
}

check_api_auth() {
  local label="$1"
  local url="$2"
  local token="$3"
  local attempt=1
  local response

  if [[ "$SMOKE_DRY_RUN" == "1" ]]; then
    echo "[smoke:dry-run] API $label -> $url"
    return
  fi

  while true; do
    echo "[smoke] API $label (attempt $attempt/$SMOKE_RETRIES)"
    if response="$(curl --noproxy '*' --fail --silent --show-error --max-time 5 \
      -H "Authorization: Bearer $token" \
      "$url")" && api_success "$response"; then
      return
    fi
    if ((attempt >= SMOKE_RETRIES)); then
      return 1
    fi
    attempt=$((attempt + 1))
    sleep "$SMOKE_RETRY_DELAY_SECONDS"
  done
}

expect_gateway_auth_failure() {
  local label="$1"
  local url="$2"
  local expected_message="$3"
  local response

  if [[ "$SMOKE_DRY_RUN" == "1" ]]; then
    echo "[smoke:dry-run] EXPECT gateway auth failure $label -> $url :: $expected_message"
    return
  fi

  echo "[smoke] EXPECT gateway auth failure $label" >&2
  response="$(curl --noproxy '*' --silent --show-error --max-time 5 -w '\n%{http_code}' "$url")"
  python3 -c 'import json, sys; body, code = sys.stdin.read().rstrip("\n").rsplit("\n", 1); payload = json.loads(body); expected = sys.argv[1]; ok = code == "401" and payload.get("success") is False and expected in payload.get("message", ""); raise SystemExit(0 if ok else 1)' "$expected_message" <<< "$response"
}

expect_gateway_forbidden() {
  local label="$1"
  local url="$2"
  local token="$3"
  local expected_message="$4"
  local response

  if [[ "$SMOKE_DRY_RUN" == "1" ]]; then
    echo "[smoke:dry-run] EXPECT gateway forbidden $label -> $url :: Authorization=Bearer $token :: $expected_message"
    return
  fi

  echo "[smoke] EXPECT gateway forbidden $label" >&2
  response="$(curl --noproxy '*' --silent --show-error --max-time 5 -w '\n%{http_code}' \
    -H "Authorization: Bearer $token" \
    "$url")"
  python3 -c 'import json, sys; body, code = sys.stdin.read().rstrip("\n").rsplit("\n", 1); payload = json.loads(body); expected = sys.argv[1]; ok = code == "403" and payload.get("success") is False and expected in payload.get("message", ""); raise SystemExit(0 if ok else 1)' "$expected_message" <<< "$response"
}

post_json() {
  local label="$1"
  local url="$2"
  local body="$3"
  local attempt=1
  local response
  local auth_args=()

  if [[ -n "$SMOKE_ACCESS_TOKEN" ]]; then
    auth_args=(-H "Authorization: Bearer $SMOKE_ACCESS_TOKEN")
  fi

  if [[ "$SMOKE_DRY_RUN" == "1" ]]; then
    echo "[smoke:dry-run] POST $label -> $url :: $body"
    return
  fi

  while true; do
    echo "[smoke] POST $label (attempt $attempt/$SMOKE_RETRIES)" >&2
    if response="$(curl --noproxy '*' --fail --silent --show-error --max-time 5 \
      "${auth_args[@]}" \
      -H 'Content-Type: application/json' \
      -d "$body" \
      "$url")" && api_success "$response"; then
      printf '%s' "$response"
      return
    fi
    if ((attempt >= SMOKE_RETRIES)); then
      return 1
    fi
    attempt=$((attempt + 1))
    sleep "$SMOKE_RETRY_DELAY_SECONDS"
  done
}

patch_json() {
  local label="$1"
  local url="$2"
  local body="$3"
  local attempt=1
  local response
  local auth_args=()

  if [[ -n "$SMOKE_ACCESS_TOKEN" ]]; then
    auth_args=(-H "Authorization: Bearer $SMOKE_ACCESS_TOKEN")
  fi

  if [[ "$SMOKE_DRY_RUN" == "1" ]]; then
    echo "[smoke:dry-run] PATCH $label -> $url :: $body"
    return
  fi

  while true; do
    echo "[smoke] PATCH $label (attempt $attempt/$SMOKE_RETRIES)" >&2
    if response="$(curl --noproxy '*' --fail --silent --show-error --max-time 5 \
      -X PATCH \
      "${auth_args[@]}" \
      -H 'Content-Type: application/json' \
      -d "$body" \
      "$url")" && api_success "$response"; then
      printf '%s' "$response"
      return
    fi
    if ((attempt >= SMOKE_RETRIES)); then
      return 1
    fi
    attempt=$((attempt + 1))
    sleep "$SMOKE_RETRY_DELAY_SECONDS"
  done
}

post_auth() {
  local label="$1"
  local url="$2"
  local token="$3"
  local attempt=1
  local response

  if [[ "$SMOKE_DRY_RUN" == "1" ]]; then
    echo "[smoke:dry-run] POST $label -> $url :: Authorization=Bearer $token"
    return
  fi

  while true; do
    echo "[smoke] POST $label (attempt $attempt/$SMOKE_RETRIES)" >&2
    if response="$(curl --noproxy '*' --fail --silent --show-error --max-time 5 \
      -X POST \
      -H "Authorization: Bearer $token" \
      "$url")" && api_success "$response"; then
      printf '%s' "$response"
      return
    fi
    if ((attempt >= SMOKE_RETRIES)); then
      return 1
    fi
    attempt=$((attempt + 1))
    sleep "$SMOKE_RETRY_DELAY_SECONDS"
  done
}

put_upload_content() {
  local label="$1"
  local url="$2"
  local upload_id="$3"
  local object_key="$4"
  local file_path="$5"
  local attempt=1
  local response
  local auth_args=()

  if [[ -n "$SMOKE_ACCESS_TOKEN" ]]; then
    auth_args=(-H "Authorization: Bearer $SMOKE_ACCESS_TOKEN")
  fi

  if [[ "$SMOKE_DRY_RUN" == "1" ]]; then
    echo "[smoke:dry-run] PUT multipart $label -> $url :: uploadId=$upload_id objectKey=$object_key file=@$file_path"
    return
  fi

  while true; do
    echo "[smoke] PUT multipart $label (attempt $attempt/$SMOKE_RETRIES)" >&2
    if response="$(curl --noproxy '*' --fail --silent --show-error --max-time 5 \
      -X PUT \
      "${auth_args[@]}" \
      -F "uploadId=$upload_id" \
      -F "objectKey=$object_key" \
      -F "file=@$file_path;type=application/pdf" \
      "$url")" && api_success "$response"; then
      printf '%s' "$response"
      return
    fi
    if ((attempt >= SMOKE_RETRIES)); then
      return 1
    fi
    attempt=$((attempt + 1))
    sleep "$SMOKE_RETRY_DELAY_SECONDS"
  done
}

api_success() {
  python3 -c 'import json, sys; payload=json.load(sys.stdin); raise SystemExit(0 if payload.get("success") is True else 1)' <<< "$1"
}

json_field() {
  local field="$1"
  python3 -c "import json, sys; print(json.load(sys.stdin)['data']['$field'])"
}

assert_json_field_equals() {
  if [[ "$SMOKE_DRY_RUN" == "1" ]]; then
    return
  fi
  local path="$1"
  local expected="$2"
  python3 -c 'import json, sys; path = sys.argv[1].split("."); expected = sys.argv[2]; value = json.load(sys.stdin);
for part in path:
    value = value[int(part)] if isinstance(value, list) else value[part]
actual = "true" if value is True else "false" if value is False else "null" if value is None else str(value)
raise SystemExit(0 if actual == expected else 1)' "$path" "$expected"
}

assert_json_field_in() {
  if [[ "$SMOKE_DRY_RUN" == "1" ]]; then
    return
  fi
  local path="$1"
  shift
  python3 -c 'import json, sys; path = sys.argv[1].split("."); expected = set(sys.argv[2:]); value = json.load(sys.stdin);
for part in path:
    value = value[int(part)] if isinstance(value, list) else value[part]
actual = "true" if value is True else "false" if value is False else "null" if value is None else str(value)
raise SystemExit(0 if actual in expected else 1)' "$path" "$@"
}

jdbc_assertions_enabled() {
  [[ "$SMOKE_DRY_RUN" != "1" && "$TRAINMARK_JDBC_ASSERTIONS" == "1" ]]
}

jdbc_scalar() {
  local sql="$1"
  PGPASSWORD="${POSTGRES_PASSWORD:-trainmark_dev}" psql \
    -h "${POSTGRES_HOST:-localhost}" \
    -p "${POSTGRES_PORT:-55432}" \
    -U "${POSTGRES_USER:-trainmark}" \
    -d "${POSTGRES_DB:-trainmark_ai}" \
    -v ON_ERROR_STOP=1 \
    -At \
    -c "$sql" | tr -d '\r'
}

assert_jdbc_scalar_equals() {
  local label="$1"
  local sql="$2"
  local expected="$3"
  local actual

  if ! jdbc_assertions_enabled; then
    return
  fi

  echo "[smoke] JDBC $label" >&2
  actual="$(jdbc_scalar "$sql")"
  if [[ "$actual" != "$expected" ]]; then
    echo "[smoke] JDBC assertion failed for $label: expected '$expected', got '$actual'" >&2
    return 1
  fi
}

assert_jdbc_scalar_eventually_equals() {
  local label="$1"
  local sql="$2"
  local expected="$3"
  local attempt=1
  local actual

  if ! jdbc_assertions_enabled; then
    return
  fi

  echo "[smoke] JDBC $label" >&2
  while true; do
    actual="$(jdbc_scalar "$sql")"
    if [[ "$actual" == "$expected" ]]; then
      return
    fi
    if ((attempt >= SMOKE_RETRIES)); then
      echo "[smoke] JDBC assertion failed for $label: expected '$expected', got '$actual'" >&2
      return 1
    fi
    attempt=$((attempt + 1))
    sleep "$SMOKE_RETRY_DELAY_SECONDS"
  done
}

assert_jdbc_audit_exists() {
  local action="$1"
  local resource_type="$2"
  local resource_id="$3"
  local attempt=1
  local actual

  if ! jdbc_assertions_enabled; then
    return
  fi

  echo "[smoke] JDBC audit $action $resource_type $resource_id" >&2
  while true; do
    actual="$(jdbc_scalar "SELECT count(*) FROM audit_logs WHERE action = '$action' AND resource_type = '$resource_type' AND resource_id = '$resource_id'")"
    if [[ "$actual" != "0" ]]; then
      return
    fi
    if ((attempt >= SMOKE_RETRIES)); then
      echo "[smoke] JDBC audit assertion failed for $action/$resource_type/$resource_id" >&2
      return 1
    fi
    attempt=$((attempt + 1))
    sleep "$SMOKE_RETRY_DELAY_SECONDS"
  done
}

assert_profile_role() {
  local expected_role="$1"
  python3 -c 'import json, sys; expected = sys.argv[1]; payload = json.load(sys.stdin); data = payload.get("data", {}); roles = data.get("user", data).get("roles", []); raise SystemExit(0 if expected in roles else 1)' "$expected_role"
}

check_login_role() {
  local label="$1"
  local username="$2"
  local expected_role="$3"

  if [[ "$SMOKE_DRY_RUN" == "1" ]]; then
    post_json "$label login" "$GATEWAY_URL/api/auth/login" "{\"username\":\"$username\",\"password\":\"trainmark\"}"
    check_api_auth "$label profile" "$GATEWAY_URL/api/auth/me" "<from $label login>"
    post_auth "$label refresh" "$GATEWAY_URL/api/auth/refresh" "<from $label login>"
    post_auth "$label logout" "$GATEWAY_URL/api/auth/logout" "<from $label login>"
    return
  fi

  local login_response
  local access_token
  local profile_response
  local refresh_response
  login_response="$(post_json "$label login" "$GATEWAY_URL/api/auth/login" "{\"username\":\"$username\",\"password\":\"trainmark\"}")"
  access_token="$(json_field accessToken <<< "$login_response")"
  profile_response="$(curl --noproxy '*' --fail --silent --show-error --max-time 5 \
    -H "Authorization: Bearer $access_token" \
    "$GATEWAY_URL/api/auth/me")"
  api_success "$profile_response"
  assert_profile_role "$expected_role" <<< "$profile_response"
  refresh_response="$(post_auth "$label refresh" "$GATEWAY_URL/api/auth/refresh" "$access_token")"
  assert_profile_role "$expected_role" <<< "$refresh_response"
  post_auth "$label logout" "$GATEWAY_URL/api/auth/logout" "$access_token" >/dev/null
}

check_url "gateway health" "$GATEWAY_URL/actuator/health"

check_url "auth-service health" "${AUTH_SERVICE_URL:-http://localhost:8081}/actuator/health"
check_url "user-service health" "${USER_SERVICE_URL:-http://localhost:8082}/actuator/health"
check_url "course-service health" "${COURSE_SERVICE_URL:-http://localhost:8083}/actuator/health"
check_url "file-service health" "${FILE_SERVICE_URL:-http://localhost:8084}/actuator/health"
check_url "grading-service health" "${GRADING_SERVICE_URL:-http://localhost:8085}/actuator/health"
check_url "ocr-service health" "${OCR_SERVICE_URL:-http://localhost:8086}/actuator/health"
check_url "similarity-service health" "${SIMILARITY_SERVICE_URL:-http://localhost:8087}/actuator/health"
check_url "notification-service health" "${NOTIFICATION_SERVICE_URL:-http://localhost:8089}/actuator/health"
check_url "admin-service health" "${ADMIN_SERVICE_URL:-http://localhost:8090}/actuator/health"
check_url "analytics-service health" "${ANALYTICS_SERVICE_URL:-http://localhost:8091}/actuator/health"

check_login_role "teacher" "teacher" "TEACHER"
check_login_role "student" "student" "STUDENT"
check_login_role "course owner" "owner" "COURSE_OWNER"
check_login_role "supervisor" "supervisor" "SUPERVISOR"
check_login_role "admin" "admin" "ADMIN"

expect_gateway_auth_failure "organizations without token" "$GATEWAY_URL/api/organizations" "Authentication is required"

if [[ "$SMOKE_DRY_RUN" == "1" ]]; then
  post_json "gateway smoke session login" "$GATEWAY_URL/api/auth/login" '{"username":"teacher","password":"trainmark"}'
  post_json "gateway admin session login" "$GATEWAY_URL/api/auth/login" '{"username":"admin","password":"trainmark"}'
  expect_gateway_forbidden "teacher admin audit logs" "$GATEWAY_URL/api/admin/audit-logs" "<from gateway smoke session login>" "Access is denied"
else
  smoke_session_response="$(post_json "gateway smoke session login" "$GATEWAY_URL/api/auth/login" '{"username":"teacher","password":"trainmark"}')"
  SMOKE_ACCESS_TOKEN="$(json_field accessToken <<< "$smoke_session_response")"
  admin_session_response="$(post_json "gateway admin session login" "$GATEWAY_URL/api/auth/login" '{"username":"admin","password":"trainmark"}')"
  SMOKE_ADMIN_TOKEN="$(json_field accessToken <<< "$admin_session_response")"
  expect_gateway_forbidden "teacher admin audit logs" "$GATEWAY_URL/api/admin/audit-logs" "$SMOKE_ACCESS_TOKEN" "Access is denied"
fi

check_api "gateway organizations" "$GATEWAY_URL/api/organizations"
check_api "gateway users" "$GATEWAY_URL/api/users"
check_api "gateway courses" "$GATEWAY_URL/api/courses"
check_api "gateway assignments" "$GATEWAY_URL/api/assignments"
check_api "gateway submissions" "$GATEWAY_URL/api/submissions"
check_api "gateway collection overview" "$GATEWAY_URL/api/notifications/assignments/1/collection"
check_api "gateway rubrics" "$GATEWAY_URL/api/rubrics"
check_api "gateway grading jobs" "$GATEWAY_URL/api/grading/jobs"
check_api "gateway grading results" "$GATEWAY_URL/api/grading/results"
check_url "gateway annotation PDF" "$GATEWAY_URL/annotations/submissions/1/annotated.pdf"
check_url "gateway grade export" "$GATEWAY_URL/exports/assignments/1/grades.csv"
check_url "gateway annotated PDF export bundle" "$GATEWAY_URL/exports/assignments/1/annotated-pdfs.zip"
check_api "gateway OCR jobs" "$GATEWAY_URL/api/ocr/jobs"
check_api "gateway similarity jobs" "$GATEWAY_URL/api/similarity/jobs"
check_api "gateway analytics" "$GATEWAY_URL/api/analytics/grade-statistics?assignmentId=1"
check_api_auth "gateway admin audit logs" "$GATEWAY_URL/api/admin/audit-logs" "${SMOKE_ADMIN_TOKEN:-<from gateway admin session login>}"
check_api_auth "gateway admin settings" "$GATEWAY_URL/api/admin/settings" "${SMOKE_ADMIN_TOKEN:-<from gateway admin session login>}"

if [[ "$SMOKE_INCLUDE_WRITES" == "1" ]]; then
  if [[ "$SMOKE_DRY_RUN" == "1" ]]; then
    post_json "organization" "$GATEWAY_URL/api/organizations" '{"parentId":2,"name":"Smoke 软件测试班","type":"CLASS"}'
    post_json "user" "$GATEWAY_URL/api/users" '{"organizationId":3,"username":"smoke-student","name":"Smoke 学生","studentNo":"SMOKE001","email":"smoke.student@trainmark.local","phone":"13800000000","roles":["STUDENT"]}'
    post_json "student import" "$GATEWAY_URL/api/users/students/import" '{"classId":3,"rows":[{"studentNo":"SMOKE002","name":"Smoke 导入学生","email":"smoke.import@trainmark.local","phone":"13800000001"}]}'
    patch_json "admin setting as admin" "$GATEWAY_URL/api/admin/settings/export.retention-days" '{"value":"45"}'
  else
    smoke_suffix="$(date +%s)"
    organization_response="$(post_json "organization" "$GATEWAY_URL/api/organizations" "{\"parentId\":2,\"name\":\"Smoke 软件测试班 $smoke_suffix\",\"type\":\"CLASS\"}")"
    organization_id="$(json_field id <<< "$organization_response")"
    assert_json_field_equals data.type CLASS <<< "$organization_response"
    assert_jdbc_scalar_equals "organization persisted" "SELECT count(*) FROM organizations WHERE id = $organization_id AND type = 'CLASS'" "1"
    user_response="$(post_json "user" "$GATEWAY_URL/api/users" "{\"organizationId\":$organization_id,\"username\":\"smoke-student-$smoke_suffix\",\"name\":\"Smoke 学生\",\"studentNo\":\"SMOKE$smoke_suffix\",\"email\":\"smoke.student.$smoke_suffix@trainmark.local\",\"phone\":\"13800000000\",\"roles\":[\"STUDENT\"]}")"
    smoke_student_id="$(json_field id <<< "$user_response")"
    assert_json_field_equals data.roles.0 STUDENT <<< "$user_response"
    assert_jdbc_scalar_equals "student role persisted" "SELECT count(*) FROM user_roles ur JOIN roles r ON r.id = ur.role_id WHERE ur.user_id = $smoke_student_id AND r.code = 'STUDENT'" "1"
    student_import_response="$(post_json "student import" "$GATEWAY_URL/api/users/students/import" "{\"classId\":$organization_id,\"rows\":[{\"studentNo\":\"SMOKE-IMPORT-$smoke_suffix\",\"name\":\"Smoke 导入学生\",\"email\":\"smoke.import.$smoke_suffix@trainmark.local\",\"phone\":\"13800000001\"}]}")"
    assert_json_field_equals data.created 1 <<< "$student_import_response"
    teacher_token="$SMOKE_ACCESS_TOKEN"
    SMOKE_ACCESS_TOKEN="$SMOKE_ADMIN_TOKEN"
    admin_setting_response="$(patch_json "admin setting as admin" "$GATEWAY_URL/api/admin/settings/export.retention-days" '{"value":"45"}')"
    SMOKE_ACCESS_TOKEN="$teacher_token"
    assert_json_field_equals data.value 45 <<< "$admin_setting_response"
    assert_jdbc_scalar_equals "admin setting persisted" "SELECT setting_value FROM system_settings WHERE setting_key = 'export.retention-days'" "45"
  fi
  if [[ "$SMOKE_DRY_RUN" == "1" ]]; then
    post_json "upload init" "$GATEWAY_URL/api/submissions/upload/init" '{"assignmentId":1,"studentId":2,"fileName":"smoke-report.pdf","contentType":"application/pdf","fileSize":1048576,"checksum":null}'
    put_upload_content "upload content" "$GATEWAY_URL/api/submissions/upload/content" "<from upload init>" "<from upload init>" "smoke-report.pdf"
    post_json "upload complete" "$GATEWAY_URL/api/submissions/upload/complete" '{"uploadId":"<from upload init>","objectKey":"<from upload init>","checksum":null}'
    check_url "uploaded report file" "$GATEWAY_URL/api/submissions/<from upload complete>/file"
    post_json "peer upload init" "$GATEWAY_URL/api/submissions/upload/init" '{"assignmentId":1,"studentId":"<from user>","fileName":"smoke-peer-report.pdf","contentType":"application/pdf","fileSize":1048576,"checksum":null}'
    put_upload_content "peer upload content" "$GATEWAY_URL/api/submissions/upload/content" "<from peer upload init>" "<from peer upload init>" "smoke-peer-report.pdf"
    post_json "peer upload complete" "$GATEWAY_URL/api/submissions/upload/complete" '{"uploadId":"<from peer upload init>","objectKey":"<from peer upload init>","checksum":null}'
    check_url "peer uploaded report file" "$GATEWAY_URL/api/submissions/<from peer upload complete>/file"
  else
    init_response="$(post_json "upload init" "$GATEWAY_URL/api/submissions/upload/init" '{"assignmentId":1,"studentId":2,"fileName":"smoke-report.pdf","contentType":"application/pdf","fileSize":1048576,"checksum":null}')"
    upload_id="$(json_field uploadId <<< "$init_response")"
    object_key="$(json_field objectKey <<< "$init_response")"
    tmp_upload="$(mktemp)"
    printf 'TrainMark smoke upload\n' > "$tmp_upload"
    put_upload_content "upload content" "$GATEWAY_URL/api/submissions/upload/content" "$upload_id" "$object_key" "$tmp_upload" >/dev/null
    rm -f "$tmp_upload"
    complete_response="$(post_json "upload complete" "$GATEWAY_URL/api/submissions/upload/complete" "{\"uploadId\":\"$upload_id\",\"objectKey\":\"$object_key\",\"checksum\":null}")"
    submission_id="$(json_field submissionId <<< "$complete_response")"
    assert_json_field_equals data.assignmentId 1 <<< "$complete_response"
    assert_json_field_equals data.studentId 2 <<< "$complete_response"
    assert_jdbc_scalar_equals "upload session completed" "SELECT status FROM upload_sessions WHERE upload_id = '$upload_id'::uuid" "COMPLETED"
    assert_jdbc_scalar_equals "submission persisted" "SELECT count(*) FROM submissions WHERE id = $submission_id AND assignment_id = 1 AND student_id = 2" "1"
    assert_jdbc_scalar_equals "submission file metadata persisted" "SELECT count(*) FROM submissions WHERE id = $submission_id AND object_key = '$object_key' AND file_name = 'smoke-report.pdf'" "1"
    check_url "uploaded report file" "$GATEWAY_URL/api/submissions/$submission_id/file"

    peer_init_response="$(post_json "peer upload init" "$GATEWAY_URL/api/submissions/upload/init" "{\"assignmentId\":1,\"studentId\":$smoke_student_id,\"fileName\":\"smoke-peer-report.pdf\",\"contentType\":\"application/pdf\",\"fileSize\":1048576,\"checksum\":null}")"
    peer_upload_id="$(json_field uploadId <<< "$peer_init_response")"
    peer_object_key="$(json_field objectKey <<< "$peer_init_response")"
    tmp_peer_upload="$(mktemp)"
    printf 'TrainMark peer smoke upload\n' > "$tmp_peer_upload"
    put_upload_content "peer upload content" "$GATEWAY_URL/api/submissions/upload/content" "$peer_upload_id" "$peer_object_key" "$tmp_peer_upload" >/dev/null
    rm -f "$tmp_peer_upload"
    peer_complete_response="$(post_json "peer upload complete" "$GATEWAY_URL/api/submissions/upload/complete" "{\"uploadId\":\"$peer_upload_id\",\"objectKey\":\"$peer_object_key\",\"checksum\":null}")"
    peer_submission_id="$(json_field submissionId <<< "$peer_complete_response")"
    assert_json_field_equals data.assignmentId 1 <<< "$peer_complete_response"
    assert_json_field_equals data.studentId "$smoke_student_id" <<< "$peer_complete_response"
    assert_jdbc_scalar_equals "peer upload session completed" "SELECT status FROM upload_sessions WHERE upload_id = '$peer_upload_id'::uuid" "COMPLETED"
    assert_jdbc_scalar_equals "peer submission persisted" "SELECT count(*) FROM submissions WHERE id = $peer_submission_id AND assignment_id = 1 AND student_id = $smoke_student_id" "1"
    assert_jdbc_scalar_equals "peer submission file metadata persisted" "SELECT count(*) FROM submissions WHERE id = $peer_submission_id AND object_key = '$peer_object_key' AND file_name = 'smoke-peer-report.pdf'" "1"
    check_url "peer uploaded report file" "$GATEWAY_URL/api/submissions/$peer_submission_id/file"
  fi
  if [[ "$SMOKE_DRY_RUN" == "1" ]]; then
    post_json "assignment" "$GATEWAY_URL/api/assignments" '{"courseId":1,"title":"Smoke 实训任务","description":"Smoke assignment creation","deadline":"2030-05-20T23:59:00+08:00","totalScore":100,"classIds":[1,2],"similarityCheckEnabled":true,"aiGradingEnabled":true}'
    post_json "rubric" "$GATEWAY_URL/api/rubrics" '{"assignmentId":1,"name":"Smoke 评分标准","totalScore":100,"items":[{"title":"需求与设计","score":20,"courseOutcomeCode":"CO1","points":[{"title":"需求完整","description":"覆盖需求、设计和约束","score":20,"keywords":["需求","设计"],"synonyms":[]}]},{"title":"系统实现","score":50,"courseOutcomeCode":"CO2","points":[{"title":"实现完整","description":"覆盖核心功能和异常处理","score":50,"keywords":["功能","接口"],"synonyms":[]}]},{"title":"报告规范","score":30,"courseOutcomeCode":"CO3","points":[{"title":"报告规范","description":"覆盖截图、总结","score":30,"keywords":["截图","总结"],"synonyms":[]}]}]}'
    post_json "grading job" "$GATEWAY_URL/api/grading/jobs" '{"assignmentId":1,"rubricId":1,"submissionIds":[1]}'
  else
    assignment_response="$(post_json "assignment" "$GATEWAY_URL/api/assignments" '{"courseId":1,"title":"Smoke 实训任务","description":"Smoke assignment creation","deadline":"2030-05-20T23:59:00+08:00","totalScore":100,"classIds":[1,2],"similarityCheckEnabled":true,"aiGradingEnabled":true}')"
    assignment_id="$(json_field id <<< "$assignment_response")"
    assert_json_field_equals data.status DRAFT <<< "$assignment_response"
    assert_jdbc_scalar_equals "assignment persisted" "SELECT status FROM assignments WHERE id = $assignment_id" "DRAFT"
    rubric_response="$(post_json "rubric" "$GATEWAY_URL/api/rubrics" '{"assignmentId":1,"name":"Smoke 评分标准","totalScore":100,"items":[{"title":"需求与设计","score":20,"courseOutcomeCode":"CO1","points":[{"title":"需求完整","description":"覆盖需求、设计和约束","score":20,"keywords":["需求","设计"],"synonyms":[]}]},{"title":"系统实现","score":50,"courseOutcomeCode":"CO2","points":[{"title":"实现完整","description":"覆盖核心功能和异常处理","score":50,"keywords":["功能","接口"],"synonyms":[]}]},{"title":"报告规范","score":30,"courseOutcomeCode":"CO3","points":[{"title":"报告规范","description":"覆盖截图、总结","score":30,"keywords":["截图","总结"],"synonyms":[]}]}]}')"
    rubric_id="$(json_field id <<< "$rubric_response")"
    assert_json_field_equals data.totalScore 100 <<< "$rubric_response"
    assert_jdbc_scalar_equals "rubric persisted" "SELECT count(*) FROM rubrics WHERE id = $rubric_id AND total_score = 100" "1"
    grading_job_response="$(post_json "grading job" "$GATEWAY_URL/api/grading/jobs" '{"assignmentId":1,"rubricId":1,"submissionIds":[1]}')"
    grading_job_id="$(json_field id <<< "$grading_job_response")"
    if [[ "${GRADING_ASYNC_ENABLED:-false}" == "true" || "${GRADING_ASYNC_ENABLED:-0}" == "1" ]]; then
      assert_json_field_in data.status PENDING SCORING COMPLETED <<< "$grading_job_response"
      assert_jdbc_scalar_eventually_equals "async grading job completed" "SELECT status FROM grading_jobs WHERE id = $grading_job_id" "COMPLETED"
    else
      assert_json_field_equals data.status COMPLETED <<< "$grading_job_response"
      assert_jdbc_scalar_equals "grading job persisted" "SELECT status FROM grading_jobs WHERE id = $grading_job_id" "COMPLETED"
    fi
    assert_jdbc_audit_exists "GRADING_START" "GRADING_JOB" "$grading_job_id"
  fi
  if [[ "$SMOKE_DRY_RUN" == "1" ]]; then
    post_json "ocr job" "$GATEWAY_URL/api/ocr/jobs" '{"submissionId":1,"objectKey":"assignments/1/students/2/database-report.docx","mode":"STRUCTURE"}'
    check_api "gateway OCR result" "$GATEWAY_URL/api/ocr/jobs/<from ocr job>/result"
  else
    ocr_response="$(post_json "ocr job" "$GATEWAY_URL/api/ocr/jobs" '{"submissionId":1,"objectKey":"assignments/1/students/2/database-report.docx","mode":"STRUCTURE"}')"
    ocr_job_id="$(json_field id <<< "$ocr_response")"
    if [[ "${OCR_ASYNC_ENABLED:-false}" == "true" || "${OCR_ASYNC_ENABLED:-0}" == "1" ]]; then
      assert_json_field_in data.status PENDING RECOGNIZING COMPLETED <<< "$ocr_response"
      assert_jdbc_scalar_eventually_equals "async ocr job completed" "SELECT status FROM ocr_jobs WHERE id = $ocr_job_id" "COMPLETED"
    else
      assert_json_field_equals data.status COMPLETED <<< "$ocr_response"
      assert_jdbc_scalar_equals "ocr job persisted" "SELECT status FROM ocr_jobs WHERE id = $ocr_job_id" "COMPLETED"
    fi
    check_api "gateway OCR result" "$GATEWAY_URL/api/ocr/jobs/$ocr_job_id/result"
  fi
  if [[ "$SMOKE_DRY_RUN" == "1" ]]; then
    patch_json "review item" "$GATEWAY_URL/api/grading/results/1/items" '{"rubricItemId":1,"teacherScore":18,"teacherComment":"Smoke review comment"}'
    post_json "approve result" "$GATEWAY_URL/api/grading/results/1/approve" '{"reviewerName":"Smoke Reviewer","overallComment":"Smoke approved"}'
    post_json "publish result" "$GATEWAY_URL/api/grading/results/1/publish" '{"operatorName":"Smoke","message":"Smoke publish"}'
  else
    review_response="$(patch_json "review item" "$GATEWAY_URL/api/grading/results/1/items" '{"rubricItemId":1,"teacherScore":18,"teacherComment":"Smoke review comment"}')"
    assert_json_field_equals data.reviewStatus IN_REVIEW <<< "$review_response"
    assert_jdbc_audit_exists "REVIEW_UPDATE" "GRADING_RESULT" "1"
    approve_response="$(post_json "approve result" "$GATEWAY_URL/api/grading/results/1/approve" '{"reviewerName":"Smoke Reviewer","overallComment":"Smoke approved"}')"
    assert_json_field_equals data.reviewStatus APPROVED <<< "$approve_response"
    assert_jdbc_audit_exists "REVIEW_APPROVE" "GRADING_RESULT" "1"
    publish_response="$(post_json "publish result" "$GATEWAY_URL/api/grading/results/1/publish" '{"operatorName":"Smoke","message":"Smoke publish"}')"
    assert_json_field_equals data.publicationStatus PUBLISHED <<< "$publish_response"
    assert_jdbc_scalar_equals "grading result published" "SELECT publication_status FROM grading_results WHERE id = 1" "PUBLISHED"
    assert_jdbc_audit_exists "GRADE_PUBLISH" "GRADING_RESULT" "1"
  fi
  check_api "gateway publications" "$GATEWAY_URL/api/grading/results/publications?assignmentId=1"
  check_api "gateway publication audits" "$GATEWAY_URL/api/grading/results/1/publication-audits"
  if [[ "$SMOKE_DRY_RUN" == "1" ]]; then
    post_json "grade appeal" "$GATEWAY_URL/api/grading/results/appeals" '{"resultId":1,"rubricItemId":1,"studentId":2,"reason":"Smoke appeal reason","requestedChange":"Smoke requested change"}'
    post_json "resolve grade appeal" "$GATEWAY_URL/api/grading/results/appeals/<from grade appeal>/resolve" '{"status":"REJECTED","teacherReply":"Smoke appeal reply"}'
  else
    appeal_response="$(post_json "grade appeal" "$GATEWAY_URL/api/grading/results/appeals" '{"resultId":1,"rubricItemId":1,"studentId":2,"reason":"Smoke appeal reason","requestedChange":"Smoke requested change"}')"
    appeal_id="$(json_field id <<< "$appeal_response")"
    assert_jdbc_audit_exists "APPEAL_SUBMIT" "APPEAL" "$appeal_id"
    resolved_appeal_response="$(post_json "resolve grade appeal" "$GATEWAY_URL/api/grading/results/appeals/$appeal_id/resolve" '{"status":"REJECTED","teacherReply":"Smoke appeal reply"}')"
    assert_json_field_equals data.status REJECTED <<< "$resolved_appeal_response"
    assert_jdbc_scalar_equals "grade appeal persisted" "SELECT status FROM grade_appeals WHERE id = $appeal_id" "REJECTED"
    assert_jdbc_audit_exists "APPEAL_RESOLVE" "APPEAL" "$appeal_id"
  fi
  check_api "gateway grade appeals" "$GATEWAY_URL/api/grading/results/appeals?resultId=1"
  if [[ "$SMOKE_DRY_RUN" == "1" ]]; then
    post_json "grade export" "$GATEWAY_URL/api/grading/exports" '{"assignmentId":1,"format":"CSV","operatorName":"Smoke"}'
    post_json "remind unsubmitted" "$GATEWAY_URL/api/notifications/remind-unsubmitted" '{"assignmentId":1,"studentIds":[2],"channels":["IN_APP"],"message":"Smoke reminder"}'
    post_json "similarity job" "$GATEWAY_URL/api/similarity/jobs" '{"assignmentId":1,"submissionIds":[1,2],"includeHistory":true}'
  else
    grade_export_response="$(post_json "grade export" "$GATEWAY_URL/api/grading/exports" '{"assignmentId":1,"format":"CSV","operatorName":"Smoke"}')"
    grade_export_id="$(json_field id <<< "$grade_export_response")"
    if [[ "${GRADE_EXPORT_ASYNC_ENABLED:-false}" == "true" || "${GRADE_EXPORT_ASYNC_ENABLED:-0}" == "1" ]]; then
      assert_json_field_in data.status PROCESSING READY <<< "$grade_export_response"
      assert_jdbc_scalar_eventually_equals "async grade export ready" "SELECT status FROM grade_exports WHERE id = $grade_export_id" "READY"
    else
      assert_json_field_equals data.status READY <<< "$grade_export_response"
      assert_jdbc_scalar_equals "grade export persisted" "SELECT status FROM grade_exports WHERE id = $grade_export_id" "READY"
    fi
    assert_jdbc_audit_exists "GRADE_EXPORT" "GRADE_EXPORT" "$grade_export_id"
    reminder_response="$(post_json "remind unsubmitted" "$GATEWAY_URL/api/notifications/remind-unsubmitted" '{"assignmentId":1,"studentIds":[2],"channels":["IN_APP"],"message":"Smoke reminder"}')"
    if [[ "${NOTIFICATION_ASYNC_ENABLED:-false}" == "true" || "${NOTIFICATION_ASYNC_ENABLED:-0}" == "1" ]]; then
      assert_json_field_equals data.status PENDING <<< "$reminder_response"
      assert_jdbc_scalar_eventually_equals "async reminder sent" "SELECT CASE WHEN EXISTS (SELECT 1 FROM notification_events WHERE assignment_id = 1 AND recipient_id = 2 AND status = 'SENT' AND message = 'Smoke reminder') THEN 1 ELSE 0 END" "1"
    else
      assert_json_field_equals data.status SENT <<< "$reminder_response"
      assert_jdbc_scalar_equals "reminder persisted" "SELECT CASE WHEN EXISTS (SELECT 1 FROM notification_events WHERE assignment_id = 1 AND recipient_id = 2 AND status = 'SENT' AND message = 'Smoke reminder') THEN 1 ELSE 0 END" "1"
    fi
    similarity_response="$(post_json "similarity job" "$GATEWAY_URL/api/similarity/jobs" "{\"assignmentId\":1,\"submissionIds\":[$submission_id,$peer_submission_id],\"includeHistory\":true}")"
    similarity_job_id="$(json_field id <<< "$similarity_response")"
    assert_json_field_equals data.status COMPLETED <<< "$similarity_response"
    assert_json_field_equals data.checkedSubmissionCount 2 <<< "$similarity_response"
    assert_jdbc_scalar_equals "similarity job persisted" "SELECT checked_submission_count FROM similarity_jobs WHERE id = $similarity_job_id" "2"
    assert_jdbc_scalar_equals "similarity match persisted" "SELECT count(*) FROM similarity_matches WHERE similarity_job_id = $similarity_job_id AND source_submission_id = $submission_id AND target_submission_id = $peer_submission_id" "1"
  fi
fi

echo "[smoke] API smoke checks completed"
