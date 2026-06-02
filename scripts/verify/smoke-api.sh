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
SMOKE_STUDENT_TOKEN=""
PYTHON_BIN="${PYTHON_BIN:-}"
SMOKE_STUDENT_USERNAME="${SMOKE_STUDENT_USERNAME:-2024010101}"
SMOKE_STUDENT_PASSWORD="${SMOKE_STUDENT_PASSWORD:-trainmark}"
SMOKE_CHECK_ANNOTATION_EXPORT="${SMOKE_CHECK_ANNOTATION_EXPORT:-0}"
SMOKE_CHECK_ANNOTATED_EXPORT_BUNDLE="${SMOKE_CHECK_ANNOTATED_EXPORT_BUNDLE:-0}"

if [[ -z "$PYTHON_BIN" ]]; then
  for candidate in python3 python py; do
    if command -v "$candidate" >/dev/null 2>&1 && "$candidate" --version >/dev/null 2>&1; then
      PYTHON_BIN="$candidate"
      break
    fi
  done
fi

if [[ -z "$PYTHON_BIN" ]]; then
  echo "[smoke] Python 3 is required. Set PYTHON_BIN to a Python executable." >&2
  exit 1
fi

supports_inline_progress() {
  [[ -t 1 && "${TERM:-}" != "dumb" ]]
}

progress_update() {
  local message="$1"
  if supports_inline_progress; then
    printf '\r\033[2K%s' "$message" >&2
  else
    printf '%s\n' "$message" >&2
  fi
}

progress_done() {
  local message="$1"
  if supports_inline_progress; then
    printf '\r\033[2K%s\n' "$message" >&2
  else
    printf '%s\n' "$message" >&2
  fi
}

check_url() {
  local label="$1"
  local url="$2"
  local attempt=1
  local auth_args=()
  local curl_output
  local curl_status
  local download_path

  if [[ -n "$SMOKE_ACCESS_TOKEN" ]]; then
    auth_args=(-H "Authorization: Bearer $SMOKE_ACCESS_TOKEN")
  fi

  if [[ "$SMOKE_DRY_RUN" == "1" ]]; then
    echo "[smoke:dry-run] $label -> $url"
    return
  fi

  while true; do
    progress_update "[smoke] $label (attempt $attempt/$SMOKE_RETRIES)"
    download_path="$(mktemp)"
    curl_status=0
    if curl_output="$(curl --noproxy '*' --fail --silent --show-error --connect-timeout 2 --max-time 10 \
      "${auth_args[@]}" \
      -o "$download_path" \
      -w 'http_code=%{http_code} bytes=%{size_download} time=%{time_total}' \
      "$url" 2>&1)"; then
      if [[ -s "$download_path" ]]; then
        rm -f "$download_path"
        progress_done "[smoke] $label ok ($attempt/$SMOKE_RETRIES)"
        return
      fi
      curl_status=0
      curl_output="$curl_output empty response body"
    else
      curl_status=$?
    fi
    rm -f "$download_path"
    if ((attempt >= SMOKE_RETRIES)); then
      progress_done "[smoke] $label failed ($attempt/$SMOKE_RETRIES)"
      echo "[smoke] $label failed: curl_exit=$curl_status $curl_output" >&2
      return 1
    fi
    if ((curl_status != 0 && attempt == 1)); then
      echo "[smoke] $label retrying after: curl_exit=$curl_status $curl_output" >&2
    fi
    attempt=$((attempt + 1))
    sleep "$SMOKE_RETRY_DELAY_SECONDS"
  done
}

check_url_fast() {
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
    progress_update "[smoke] $label (attempt $attempt/$SMOKE_RETRIES)"
    if curl --noproxy '*' --fail --silent --show-error --max-time 5 "${auth_args[@]}" "$url" >/dev/null; then
      progress_done "[smoke] $label ok ($attempt/$SMOKE_RETRIES)"
      return
    fi
    if ((attempt >= SMOKE_RETRIES)); then
      progress_done "[smoke] $label failed ($attempt/$SMOKE_RETRIES)"
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
    progress_update "[smoke] API $label (attempt $attempt/$SMOKE_RETRIES)"
    if response="$(curl --noproxy '*' --fail --silent --show-error --max-time 5 "${auth_args[@]}" "$url")" && api_success "$response"; then
      progress_done "[smoke] API $label ok ($attempt/$SMOKE_RETRIES)"
      return
    fi
    if ((attempt >= SMOKE_RETRIES)); then
      progress_done "[smoke] API $label failed ($attempt/$SMOKE_RETRIES)"
      return 1
    fi
    attempt=$((attempt + 1))
    sleep "$SMOKE_RETRY_DELAY_SECONDS"
  done
}

get_api() {
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
    progress_update "[smoke] API $label (attempt $attempt/$SMOKE_RETRIES)"
    if response="$(curl --noproxy '*' --fail --silent --show-error --max-time 5 "${auth_args[@]}" "$url")" && api_success "$response"; then
      progress_done "[smoke] API $label ok ($attempt/$SMOKE_RETRIES)"
      printf '%s' "$response"
      return
    fi
    if ((attempt >= SMOKE_RETRIES)); then
      progress_done "[smoke] API $label failed ($attempt/$SMOKE_RETRIES)"
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
    progress_update "[smoke] API $label (attempt $attempt/$SMOKE_RETRIES)"
    if response="$(curl --noproxy '*' --fail --silent --show-error --max-time 5 \
      -H "Authorization: Bearer $token" \
      "$url")" && api_success "$response"; then
      progress_done "[smoke] API $label ok ($attempt/$SMOKE_RETRIES)"
      return
    fi
    if ((attempt >= SMOKE_RETRIES)); then
      progress_done "[smoke] API $label failed ($attempt/$SMOKE_RETRIES)"
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
  "$PYTHON_BIN" -c 'import json, sys; body, code = sys.stdin.read().rstrip("\n").rsplit("\n", 1); payload = json.loads(body); expected = sys.argv[1]; ok = code == "401" and payload.get("success") is False and expected in payload.get("message", ""); raise SystemExit(0 if ok else 1)' "$expected_message" <<< "$response"
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
  "$PYTHON_BIN" -c 'import json, sys; body, code = sys.stdin.read().rstrip("\n").rsplit("\n", 1); payload = json.loads(body); expected = sys.argv[1]; ok = code == "403" and payload.get("success") is False and expected in payload.get("message", ""); raise SystemExit(0 if ok else 1)' "$expected_message" <<< "$response"
}

expect_gateway_forbidden_json() {
  local label="$1"
  local url="$2"
  local token="$3"
  local body="$4"
  local expected_message="$5"
  local response

  if [[ "$SMOKE_DRY_RUN" == "1" ]]; then
    echo "[smoke:dry-run] EXPECT gateway forbidden POST $label -> $url :: Authorization=Bearer $token :: $body :: $expected_message"
    return
  fi

  echo "[smoke] EXPECT gateway forbidden POST $label" >&2
  response="$(curl --noproxy '*' --silent --show-error --max-time 5 -w '\n%{http_code}' \
    -H "Authorization: Bearer $token" \
    -H 'Content-Type: application/json' \
    -d "$body" \
    "$url")"
  "$PYTHON_BIN" -c 'import json, sys; body, code = sys.stdin.read().rstrip("\n").rsplit("\n", 1); payload = json.loads(body); expected = sys.argv[1]; ok = code == "403" and payload.get("success") is False and expected in payload.get("message", ""); raise SystemExit(0 if ok else 1)' "$expected_message" <<< "$response"
}

post_json() {
  local label="$1"
  local url="$2"
  local body="$3"
  local attempt=1
  local response
  local response_body
  local http_code
  local auth_args=()

  if [[ -n "$SMOKE_ACCESS_TOKEN" ]]; then
    auth_args=(-H "Authorization: Bearer $SMOKE_ACCESS_TOKEN")
  fi

  if [[ "$SMOKE_DRY_RUN" == "1" ]]; then
    echo "[smoke:dry-run] POST $label -> $url :: $body"
    return
  fi

  while true; do
    progress_update "[smoke] POST $label (attempt $attempt/$SMOKE_RETRIES)"
    if response="$(curl --noproxy '*' --silent --show-error --max-time 5 -w $'\n%{http_code}' \
      "${auth_args[@]}" \
      -H 'Content-Type: application/json; charset=utf-8' \
      -d "$body" \
      "$url")"; then
      http_code="${response##*$'\n'}"
      response_body="${response%$'\n'*}"
      if [[ "$http_code" =~ ^2[0-9][0-9]$ ]] && api_success "$response_body"; then
        progress_done "[smoke] POST $label ok ($attempt/$SMOKE_RETRIES)"
        printf '%s' "$response_body"
        return
      fi
      echo "[smoke] POST $label failed: HTTP $http_code ${response_body:-<empty response>}" >&2
    fi
    if ((attempt >= SMOKE_RETRIES)); then
      progress_done "[smoke] POST $label failed ($attempt/$SMOKE_RETRIES)"
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
  local response_body
  local http_code
  local auth_args=()

  if [[ -n "$SMOKE_ACCESS_TOKEN" ]]; then
    auth_args=(-H "Authorization: Bearer $SMOKE_ACCESS_TOKEN")
  fi

  if [[ "$SMOKE_DRY_RUN" == "1" ]]; then
    echo "[smoke:dry-run] PATCH $label -> $url :: $body"
    return
  fi

  while true; do
    progress_update "[smoke] PATCH $label (attempt $attempt/$SMOKE_RETRIES)"
    if response="$(curl --noproxy '*' --silent --show-error --max-time 5 -w $'\n%{http_code}' \
      -X PATCH \
      "${auth_args[@]}" \
      -H 'Content-Type: application/json; charset=utf-8' \
      -d "$body" \
      "$url")"; then
      http_code="${response##*$'\n'}"
      response_body="${response%$'\n'*}"
      if [[ "$http_code" =~ ^2[0-9][0-9]$ ]] && api_success "$response_body"; then
        progress_done "[smoke] PATCH $label ok ($attempt/$SMOKE_RETRIES)"
        printf '%s' "$response_body"
        return
      fi
      echo "[smoke] PATCH $label failed: HTTP $http_code ${response_body:-<empty response>}" >&2
    fi
    if ((attempt >= SMOKE_RETRIES)); then
      progress_done "[smoke] PATCH $label failed ($attempt/$SMOKE_RETRIES)"
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
    progress_update "[smoke] POST $label (attempt $attempt/$SMOKE_RETRIES)"
    if response="$(curl --noproxy '*' --fail --silent --show-error --max-time 5 \
      -X POST \
      -H "Authorization: Bearer $token" \
      "$url")" && api_success "$response"; then
      progress_done "[smoke] POST $label ok ($attempt/$SMOKE_RETRIES)"
      printf '%s' "$response"
      return
    fi
    if ((attempt >= SMOKE_RETRIES)); then
      progress_done "[smoke] POST $label failed ($attempt/$SMOKE_RETRIES)"
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
  local curl_file_path="$file_path"
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

  if command -v cygpath >/dev/null 2>&1; then
    curl_file_path="$(cygpath -m "$file_path")"
  fi

  while true; do
    progress_update "[smoke] PUT multipart $label (attempt $attempt/$SMOKE_RETRIES)"
    if response="$(curl --noproxy '*' --fail --silent --show-error --max-time 5 \
      -X PUT \
      "${auth_args[@]}" \
      -F "uploadId=$upload_id" \
      -F "objectKey=$object_key" \
      -F "file=@$curl_file_path;type=application/pdf" \
      "$url")" && api_success "$response"; then
      progress_done "[smoke] PUT multipart $label ok ($attempt/$SMOKE_RETRIES)"
      printf '%s' "$response"
      return
    fi
    if ((attempt >= SMOKE_RETRIES)); then
      progress_done "[smoke] PUT multipart $label failed ($attempt/$SMOKE_RETRIES)"
      return 1
    fi
    attempt=$((attempt + 1))
    sleep "$SMOKE_RETRY_DELAY_SECONDS"
  done
}

api_success() {
  "$PYTHON_BIN" -c 'import json, sys; payload=json.load(sys.stdin); raise SystemExit(0 if payload.get("success") is True else 1)' <<< "$1"
}

json_field() {
  local field="$1"
  "$PYTHON_BIN" -c "import json, sys; print(json.load(sys.stdin)['data']['$field'])"
}

json_data_path() {
  local path="$1"
  "$PYTHON_BIN" -c 'import json, sys; value=json.load(sys.stdin)["data"];
for part in sys.argv[1].split("."):
    value = value[int(part)] if isinstance(value, list) else value[part]
print(value)' "$path"
}

assert_json_field_equals() {
  if [[ "$SMOKE_DRY_RUN" == "1" ]]; then
    return
  fi
  local path="$1"
  local expected="$2"
  "$PYTHON_BIN" -c 'import json, sys; path = sys.argv[1].split("."); expected = sys.argv[2]; value = json.load(sys.stdin);
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
  "$PYTHON_BIN" -c 'import json, sys; path = sys.argv[1].split("."); expected = set(sys.argv[2:]); value = json.load(sys.stdin);
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
  if command -v psql >/dev/null 2>&1; then
    PGPASSWORD="${POSTGRES_PASSWORD:-trainmark_dev}" psql \
      -h "${POSTGRES_HOST:-localhost}" \
      -p "${POSTGRES_PORT:-55432}" \
      -U "${POSTGRES_USER:-trainmark}" \
      -d "${POSTGRES_DB:-trainmark_ai}" \
      -v ON_ERROR_STOP=1 \
      -At \
      -c "$sql" | tr -d '\r'
    return
  fi
  docker exec -e PGPASSWORD="${POSTGRES_PASSWORD:-trainmark_dev}" "${POSTGRES_CONTAINER:-trainmark-postgres}" \
    psql \
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
  "$PYTHON_BIN" -c 'import json, sys; expected = sys.argv[1]; payload = json.load(sys.stdin); data = payload.get("data", {}); roles = data.get("user", data).get("roles", []); raise SystemExit(0 if expected in roles else 1)' "$expected_role"
}

check_login_role() {
  local label="$1"
  local username="$2"
  local expected_role="$3"
  local password="trainmark"
  if [[ "$expected_role" == "STUDENT" ]]; then
    username="$SMOKE_STUDENT_USERNAME"
    password="$SMOKE_STUDENT_PASSWORD"
  fi

  if [[ "$SMOKE_DRY_RUN" == "1" ]]; then
    post_json "$label login" "$GATEWAY_URL/api/auth/login" "{\"username\":\"$username\",\"password\":\"$password\"}"
    check_api_auth "$label profile" "$GATEWAY_URL/api/auth/me" "<from $label login>"
    post_auth "$label refresh" "$GATEWAY_URL/api/auth/refresh" "<from $label login>"
    post_auth "$label logout" "$GATEWAY_URL/api/auth/logout" "<from $label login>"
    return
  fi

  local login_response
  local access_token
  local profile_response
  local refresh_response
  login_response="$(post_json "$label login" "$GATEWAY_URL/api/auth/login" "{\"username\":\"$username\",\"password\":\"$password\"}")"
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
  post_json "gateway student session login" "$GATEWAY_URL/api/auth/login" "{\"username\":\"$SMOKE_STUDENT_USERNAME\",\"password\":\"$SMOKE_STUDENT_PASSWORD\"}"
  expect_gateway_forbidden "teacher admin audit logs" "$GATEWAY_URL/api/admin/audit-logs" "<from gateway smoke session login>" "Access is denied"
  expect_gateway_forbidden "student grade exports" "$GATEWAY_URL/api/grading/exports?assignmentId=1" "<from gateway student session login>" "Access is denied"
  expect_gateway_forbidden "student grade export download" "$GATEWAY_URL/exports/assignments/1/grades.csv" "<from gateway student session login>" "Access is denied"
  expect_gateway_forbidden_json "student upload for another student" "$GATEWAY_URL/api/submissions/upload/init" "<from gateway student session login>" '{"assignmentId":1,"studentId":999,"fileName":"forbidden.pdf","contentType":"application/pdf","fileSize":128,"checksum":null}' "Students can only access their own data"
else
  smoke_session_response="$(post_json "gateway smoke session login" "$GATEWAY_URL/api/auth/login" '{"username":"teacher","password":"trainmark"}')"
  SMOKE_ACCESS_TOKEN="$(json_field accessToken <<< "$smoke_session_response")"
  admin_session_response="$(post_json "gateway admin session login" "$GATEWAY_URL/api/auth/login" '{"username":"admin","password":"trainmark"}')"
  SMOKE_ADMIN_TOKEN="$(json_field accessToken <<< "$admin_session_response")"
  student_session_response="$(post_json "gateway student session login" "$GATEWAY_URL/api/auth/login" "{\"username\":\"$SMOKE_STUDENT_USERNAME\",\"password\":\"$SMOKE_STUDENT_PASSWORD\"}")"
  SMOKE_STUDENT_TOKEN="$(json_field accessToken <<< "$student_session_response")"
  expect_gateway_forbidden "teacher admin audit logs" "$GATEWAY_URL/api/admin/audit-logs" "$SMOKE_ACCESS_TOKEN" "Access is denied"
  expect_gateway_forbidden "student grade exports" "$GATEWAY_URL/api/grading/exports?assignmentId=1" "$SMOKE_STUDENT_TOKEN" "Access is denied"
  expect_gateway_forbidden "student grade export download" "$GATEWAY_URL/exports/assignments/1/grades.csv" "$SMOKE_STUDENT_TOKEN" "Access is denied"
  expect_gateway_forbidden_json "student upload for another student" "$GATEWAY_URL/api/submissions/upload/init" "$SMOKE_STUDENT_TOKEN" '{"assignmentId":1,"studentId":999,"fileName":"forbidden.pdf","contentType":"application/pdf","fileSize":128,"checksum":null}' "Students can only access their own data"
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
if [[ "$SMOKE_CHECK_ANNOTATION_EXPORT" == "1" ]]; then
  check_url "gateway annotation PDF" "$GATEWAY_URL/annotations/submissions/1/annotated.pdf"
fi
check_url "gateway grade export" "$GATEWAY_URL/exports/assignments/1/grades.csv"
if [[ "$SMOKE_CHECK_ANNOTATED_EXPORT_BUNDLE" == "1" ]]; then
  check_url "gateway annotated PDF export bundle" "$GATEWAY_URL/exports/assignments/1/annotated-pdfs.zip"
fi
check_api "gateway OCR jobs" "$GATEWAY_URL/api/ocr/jobs"
check_api "gateway similarity jobs" "$GATEWAY_URL/api/similarity/jobs"
check_api "gateway analytics grade statistics" "$GATEWAY_URL/api/analytics/grade-statistics?assignmentId=1"
check_api "gateway analytics loss points" "$GATEWAY_URL/api/analytics/loss-points?assignmentId=1"
check_api "gateway analytics course outcomes" "$GATEWAY_URL/api/analytics/course-outcomes?assignmentId=1"
check_api_auth "gateway admin audit logs" "$GATEWAY_URL/api/admin/audit-logs" "${SMOKE_ADMIN_TOKEN:-<from gateway admin session login>}"
check_api_auth "gateway admin settings" "$GATEWAY_URL/api/admin/settings" "${SMOKE_ADMIN_TOKEN:-<from gateway admin session login>}"

if [[ "$SMOKE_INCLUDE_WRITES" == "1" ]]; then
  if [[ "$SMOKE_DRY_RUN" == "1" ]]; then
    post_json "organization" "$GATEWAY_URL/api/organizations" '{"parentId":2,"name":"\u8054\u8c03\u6d4b\u8bd5\u73ed","type":"CLASS"}'
    post_json "user" "$GATEWAY_URL/api/users" '{"organizationId":3,"username":"smoke-student","name":"\u8054\u8c03\u5b66\u751f","studentNo":"SMOKE001","email":"smoke.student@trainmark.local","phone":"13800000000","roles":["STUDENT"]}'
    post_json "student import" "$GATEWAY_URL/api/users/students/import" '{"classId":3,"rows":[{"studentNo":"SMOKE002","name":"\u8054\u8c03\u5bfc\u5165\u5b66\u751f","email":"smoke.import@trainmark.local","phone":"13800000001"}]}'
    patch_json "admin setting as admin" "$GATEWAY_URL/api/admin/settings/export.retention-days" '{"value":"45"}'
  else
    smoke_suffix="$(date +%s)"
    organization_response="$(post_json "organization" "$GATEWAY_URL/api/organizations" "{\"parentId\":2,\"name\":\"\\u8054\\u8c03\\u6d4b\\u8bd5\\u73ed $smoke_suffix\",\"type\":\"CLASS\"}")"
    organization_id="$(json_field id <<< "$organization_response")"
    assert_json_field_equals data.type CLASS <<< "$organization_response"
    assert_jdbc_scalar_equals "organization persisted" "SELECT count(*) FROM organizations WHERE id = $organization_id AND type = 'CLASS'" "1"
    user_response="$(post_json "user" "$GATEWAY_URL/api/users" "{\"organizationId\":$organization_id,\"username\":\"smoke-student-$smoke_suffix\",\"name\":\"\\u8054\\u8c03\\u5b66\\u751f\",\"studentNo\":\"SMOKE$smoke_suffix\",\"email\":\"smoke.student.$smoke_suffix@trainmark.local\",\"phone\":\"13800000000\",\"roles\":[\"STUDENT\"]}")"
    smoke_student_id="$(json_field id <<< "$user_response")"
    assert_json_field_equals data.roles.0 STUDENT <<< "$user_response"
    assert_jdbc_scalar_equals "student role persisted" "SELECT count(*) FROM user_roles ur JOIN roles r ON r.id = ur.role_id WHERE ur.user_id = $smoke_student_id AND r.code = 'STUDENT'" "1"
    student_import_response="$(post_json "student import" "$GATEWAY_URL/api/users/students/import" "{\"classId\":$organization_id,\"rows\":[{\"studentNo\":\"SMOKE-IMPORT-$smoke_suffix\",\"name\":\"\\u8054\\u8c03\\u5bfc\\u5165\\u5b66\\u751f\",\"email\":\"smoke.import.$smoke_suffix@trainmark.local\",\"phone\":\"13800000001\"}]}")"
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
    expect_gateway_forbidden "student peer submitted report file" "$GATEWAY_URL/api/submissions/$peer_submission_id/file" "$SMOKE_STUDENT_TOKEN" "Students can only access their own data"
    expect_gateway_forbidden "student explicit peer submissions" "$GATEWAY_URL/api/submissions?studentId=$smoke_student_id" "$SMOKE_STUDENT_TOKEN" "Students can only access their own data"
  fi
  if [[ "$SMOKE_DRY_RUN" == "1" ]]; then
    post_json "assignment" "$GATEWAY_URL/api/assignments" '{"courseId":1,"title":"\u5b9e\u8bad\u62a5\u544a\u8054\u8c03\u4efb\u52a1","description":"\u8054\u8c03\u4efb\u52a1\u521b\u5efa","deadline":"2030-05-20T23:59:00+08:00","totalScore":100,"classIds":[1,2],"similarityCheckEnabled":true,"aiGradingEnabled":true}'
    post_json "rubric" "$GATEWAY_URL/api/rubrics" '{"assignmentId":1,"name":"\u5b9e\u8bad\u62a5\u544a\u8bc4\u5206\u6807\u51c6","totalScore":100,"items":[{"title":"\u9700\u6c42\u4e0e\u8bbe\u8ba1","score":20,"courseOutcomeCode":"CO1","points":[{"title":"\u9700\u6c42\u5b8c\u6574\u6027","description":"\u8986\u76d6\u9700\u6c42\u3001\u8bbe\u8ba1\u4e0e\u7ea6\u675f","score":20,"keywords":["\u9700\u6c42","\u8bbe\u8ba1"],"synonyms":[]}]},{"title":"\u7cfb\u7edf\u5b9e\u73b0","score":50,"courseOutcomeCode":"CO2","points":[{"title":"\u5b9e\u73b0\u5b8c\u6574\u6027","description":"\u8986\u76d6\u6838\u5fc3\u529f\u80fd\u4e0e\u5f02\u5e38\u5904\u7406","score":50,"keywords":["\u529f\u80fd","\u63a5\u53e3"],"synonyms":[]}]},{"title":"\u62a5\u544a\u8d28\u91cf","score":30,"courseOutcomeCode":"CO3","points":[{"title":"\u62a5\u544a\u8d28\u91cf","description":"\u8986\u76d6\u622a\u56fe\u4e0e\u603b\u7ed3","score":30,"keywords":["\u622a\u56fe","\u603b\u7ed3"],"synonyms":[]}]}]}'
    post_json "grading job" "$GATEWAY_URL/api/grading/jobs" '{"assignmentId":1,"rubricId":"<from rubric>","submissionIds":["<from upload complete>"]}'
  else
    assignment_response="$(post_json "assignment" "$GATEWAY_URL/api/assignments" '{"courseId":1,"title":"\u5b9e\u8bad\u62a5\u544a\u8054\u8c03\u4efb\u52a1","description":"\u8054\u8c03\u4efb\u52a1\u521b\u5efa","deadline":"2030-05-20T23:59:00+08:00","totalScore":100,"classIds":[1,2],"similarityCheckEnabled":true,"aiGradingEnabled":true}')"
    assignment_id="$(json_field id <<< "$assignment_response")"
    assert_json_field_equals data.status DRAFT <<< "$assignment_response"
    assert_jdbc_scalar_equals "assignment persisted" "SELECT status FROM assignments WHERE id = $assignment_id" "DRAFT"
    rubric_response="$(post_json "rubric" "$GATEWAY_URL/api/rubrics" '{"assignmentId":1,"name":"\u5b9e\u8bad\u62a5\u544a\u8bc4\u5206\u6807\u51c6","totalScore":100,"items":[{"title":"\u9700\u6c42\u4e0e\u8bbe\u8ba1","score":20,"courseOutcomeCode":"CO1","points":[{"title":"\u9700\u6c42\u5b8c\u6574\u6027","description":"\u8986\u76d6\u9700\u6c42\u3001\u8bbe\u8ba1\u4e0e\u7ea6\u675f","score":20,"keywords":["\u9700\u6c42","\u8bbe\u8ba1"],"synonyms":[]}]},{"title":"\u7cfb\u7edf\u5b9e\u73b0","score":50,"courseOutcomeCode":"CO2","points":[{"title":"\u5b9e\u73b0\u5b8c\u6574\u6027","description":"\u8986\u76d6\u6838\u5fc3\u529f\u80fd\u4e0e\u5f02\u5e38\u5904\u7406","score":50,"keywords":["\u529f\u80fd","\u63a5\u53e3"],"synonyms":[]}]},{"title":"\u62a5\u544a\u8d28\u91cf","score":30,"courseOutcomeCode":"CO3","points":[{"title":"\u62a5\u544a\u8d28\u91cf","description":"\u8986\u76d6\u622a\u56fe\u4e0e\u603b\u7ed3","score":30,"keywords":["\u622a\u56fe","\u603b\u7ed3"],"synonyms":[]}]}]}')"
    rubric_id="$(json_field id <<< "$rubric_response")"
    assert_json_field_equals data.totalScore 100 <<< "$rubric_response"
    assert_jdbc_scalar_equals "rubric persisted" "SELECT count(*) FROM rubrics WHERE id = $rubric_id AND total_score = 100" "1"
    grading_job_response="$(post_json "grading job" "$GATEWAY_URL/api/grading/jobs" "{\"assignmentId\":1,\"rubricId\":$rubric_id,\"submissionIds\":[$submission_id]}")"
    grading_job_id="$(json_field id <<< "$grading_job_response")"
    if [[ "${GRADING_ASYNC_ENABLED:-false}" == "true" || "${GRADING_ASYNC_ENABLED:-0}" == "1" ]]; then
      assert_json_field_in data.status PENDING SCORING COMPLETED <<< "$grading_job_response"
      assert_jdbc_scalar_eventually_equals "async grading job completed" "SELECT status FROM grading_jobs WHERE id = $grading_job_id" "COMPLETED"
    else
      assert_json_field_equals data.status COMPLETED <<< "$grading_job_response"
      assert_jdbc_scalar_equals "grading job persisted" "SELECT status FROM grading_jobs WHERE id = $grading_job_id" "COMPLETED"
    fi
    assert_jdbc_audit_exists "GRADING_START" "GRADING_JOB" "$grading_job_id"
    grading_results_response="$(get_api "gateway grading results after job" "$GATEWAY_URL/api/grading/results?assignmentId=1")"
    grading_result_id="$(json_data_path "0.id" <<< "$grading_results_response")"
    grading_rubric_item_id="$(json_data_path "0.items.0.rubricItemId" <<< "$grading_results_response")"
    assert_jdbc_scalar_equals "grading result persisted" "SELECT count(*) FROM grading_results WHERE id = $grading_result_id AND submission_id = $submission_id" "1"
  fi
  if [[ "$SMOKE_DRY_RUN" == "1" ]]; then
    post_json "ocr job" "$GATEWAY_URL/api/ocr/jobs" '{"submissionId":"<from upload complete>","objectKey":"<from upload init>","mode":"STRUCTURE"}'
    check_api "gateway OCR result" "$GATEWAY_URL/api/ocr/jobs/<from ocr job>/result"
  else
    ocr_response="$(post_json "ocr job" "$GATEWAY_URL/api/ocr/jobs" "{\"submissionId\":$submission_id,\"objectKey\":\"$object_key\",\"mode\":\"STRUCTURE\"}")"
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
    patch_json "review item" "$GATEWAY_URL/api/grading/results/<from grading result>/items" '{"rubricItemId":"<from grading result item>","teacherScore":18,"teacherComment":"\u8bf7\u6559\u5e08\u590d\u6838\u8be5\u5206\u9879\u5e76\u786e\u8ba4\u3002"}'
    post_json "approve result" "$GATEWAY_URL/api/grading/results/<from grading result>/approve" '{"reviewerName":"\u590d\u6838\u6559\u5e08","overallComment":"\u5df2\u901a\u8fc7\u590d\u6838"}'
    post_json "publish result" "$GATEWAY_URL/api/grading/results/<from grading result>/publish" '{"operatorName":"\u8054\u8c03\u6559\u5e08","message":"\u53d1\u5e03\u6210\u7ee9"}'
  else
    review_response="$(patch_json "review item" "$GATEWAY_URL/api/grading/results/$grading_result_id/items" "{\"rubricItemId\":$grading_rubric_item_id,\"teacherScore\":18,\"teacherComment\":\"\\u8bf7\\u6559\\u5e08\\u590d\\u6838\\u8be5\\u5206\\u9879\\u5e76\\u786e\\u8ba4\\u3002\"}")"
    assert_json_field_equals data.reviewStatus IN_REVIEW <<< "$review_response"
    assert_jdbc_audit_exists "REVIEW_UPDATE" "GRADING_RESULT" "$grading_result_id"
    approve_response="$(post_json "approve result" "$GATEWAY_URL/api/grading/results/$grading_result_id/approve" '{"reviewerName":"\u590d\u6838\u6559\u5e08","overallComment":"\u5df2\u901a\u8fc7\u590d\u6838"}')"
    assert_json_field_equals data.reviewStatus APPROVED <<< "$approve_response"
    assert_jdbc_audit_exists "REVIEW_APPROVE" "GRADING_RESULT" "$grading_result_id"
    publish_response="$(post_json "publish result" "$GATEWAY_URL/api/grading/results/$grading_result_id/publish" '{"operatorName":"\u8054\u8c03\u6559\u5e08","message":"\u53d1\u5e03\u6210\u7ee9"}')"
    assert_json_field_equals data.publicationStatus PUBLISHED <<< "$publish_response"
    assert_jdbc_scalar_equals "grading result published" "SELECT publication_status FROM grading_results WHERE id = $grading_result_id" "PUBLISHED"
    assert_jdbc_audit_exists "GRADE_PUBLISH" "GRADING_RESULT" "$grading_result_id"
  fi
  check_api "gateway publications" "$GATEWAY_URL/api/grading/results/publications?assignmentId=1"
  check_api "gateway publication audits" "$GATEWAY_URL/api/grading/results/${grading_result_id:-<from grading result>}/publication-audits"
  if [[ "$SMOKE_DRY_RUN" == "1" ]]; then
    post_json "grade appeal" "$GATEWAY_URL/api/grading/results/appeals" '{"resultId":"<from grading result>","rubricItemId":"<from grading result item>","studentId":2,"reason":"\u5b66\u751f\u5bf9\u81ea\u52a8\u8bc4\u5206\u7ed3\u679c\u63d0\u51fa\u7533\u8bc9\u3002","requestedChange":"\u7533\u8bf7\u8c03\u6574\u5bf9\u5e94\u5206\u9879\u5f97\u5206\u3002"}'
    post_json "resolve grade appeal" "$GATEWAY_URL/api/grading/results/appeals/<from grade appeal>/resolve" '{"status":"REJECTED","teacherReply":"\u5df2\u590d\u6838\u7533\u8bc9\u6750\u6599\uff0c\u7ef4\u6301\u539f\u5206\u3002"}'
  else
    appeal_response="$(post_json "grade appeal" "$GATEWAY_URL/api/grading/results/appeals" "{\"resultId\":$grading_result_id,\"rubricItemId\":$grading_rubric_item_id,\"studentId\":2,\"reason\":\"\\u5b66\\u751f\\u5bf9\\u81ea\\u52a8\\u8bc4\\u5206\\u7ed3\\u679c\\u63d0\\u51fa\\u7533\\u8bc9\\u3002\",\"requestedChange\":\"\\u7533\\u8bf7\\u8c03\\u6574\\u5bf9\\u5e94\\u5206\\u9879\\u5f97\\u5206\\u3002\"}")"
    appeal_id="$(json_field id <<< "$appeal_response")"
    assert_jdbc_audit_exists "APPEAL_SUBMIT" "APPEAL" "$appeal_id"
    resolved_appeal_response="$(post_json "resolve grade appeal" "$GATEWAY_URL/api/grading/results/appeals/$appeal_id/resolve" '{"status":"REJECTED","teacherReply":"\u5df2\u590d\u6838\u7533\u8bc9\u6750\u6599\uff0c\u7ef4\u6301\u539f\u5206\u3002"}')"
    assert_json_field_equals data.status REJECTED <<< "$resolved_appeal_response"
    assert_jdbc_scalar_equals "grade appeal persisted" "SELECT status FROM grade_appeals WHERE id = $appeal_id" "REJECTED"
    assert_jdbc_audit_exists "APPEAL_RESOLVE" "APPEAL" "$appeal_id"
  fi
  check_api "gateway grade appeals" "$GATEWAY_URL/api/grading/results/appeals?resultId=${grading_result_id:-<from grading result>}"
  if [[ "$SMOKE_DRY_RUN" == "1" ]]; then
    post_json "grade export" "$GATEWAY_URL/api/grading/exports" '{"assignmentId":1,"format":"CSV","operatorName":"\u8054\u8c03\u6559\u5e08"}'
    post_json "generic notification" "$GATEWAY_URL/api/notifications" '{"assignmentId":1,"recipientId":2,"title":"\u8054\u8c03\u901a\u77e5","message":"\u901a\u77e5\u4e2d\u5fc3\u5199\u5165\u6821\u9a8c\u3002","type":"SMOKE","targetUrl":"/tasks/1"}'
    post_json "remind unsubmitted" "$GATEWAY_URL/api/notifications/remind-unsubmitted" '{"assignmentId":1,"studentIds":[2],"channels":["IN_APP"],"message":"\u8bf7\u6309\u65f6\u63d0\u4ea4\u5b9e\u8bad\u62a5\u544a\u3002"}'
    check_api "gateway notification list" "$GATEWAY_URL/api/notifications?userId=2"
    patch_json "notification mark read" "$GATEWAY_URL/api/notifications/<from notification>/read?userId=2" '{}'
    patch_json "notification mark all read" "$GATEWAY_URL/api/notifications/read-all?userId=2" '{}'
    post_json "similarity job" "$GATEWAY_URL/api/similarity/jobs" '{"assignmentId":1,"submissionIds":[1,2],"includeHistory":true}'
  else
    grade_export_response="$(post_json "grade export" "$GATEWAY_URL/api/grading/exports" '{"assignmentId":1,"format":"CSV","operatorName":"\u8054\u8c03\u6559\u5e08"}')"
    grade_export_id="$(json_field id <<< "$grade_export_response")"
    if [[ "${GRADE_EXPORT_ASYNC_ENABLED:-false}" == "true" || "${GRADE_EXPORT_ASYNC_ENABLED:-0}" == "1" ]]; then
      assert_json_field_in data.status PROCESSING READY <<< "$grade_export_response"
      assert_jdbc_scalar_eventually_equals "async grade export ready" "SELECT status FROM grade_exports WHERE id = $grade_export_id" "READY"
    else
      assert_json_field_equals data.status READY <<< "$grade_export_response"
      assert_jdbc_scalar_equals "grade export persisted" "SELECT status FROM grade_exports WHERE id = $grade_export_id" "READY"
    fi
    assert_jdbc_audit_exists "GRADE_EXPORT" "GRADE_EXPORT" "$grade_export_id"
    generic_notification_response="$(post_json "generic notification" "$GATEWAY_URL/api/notifications" '{"assignmentId":1,"recipientId":2,"title":"\u8054\u8c03\u901a\u77e5","message":"\u901a\u77e5\u4e2d\u5fc3\u5199\u5165\u6821\u9a8c\u3002","type":"SMOKE","targetUrl":"/tasks/1"}')"
    generic_notification_id="$(json_field id <<< "$generic_notification_response")"
    assert_json_field_equals data.type SMOKE <<< "$generic_notification_response"
    assert_jdbc_scalar_equals "generic notification persisted" "SELECT count(*) FROM notification_events WHERE id = $generic_notification_id AND recipient_id = 2 AND event_type = 'SMOKE' AND is_read = false" "1"
    reminder_response="$(post_json "remind unsubmitted" "$GATEWAY_URL/api/notifications/remind-unsubmitted" '{"assignmentId":1,"studentIds":[2],"channels":["IN_APP"],"message":"\u8bf7\u6309\u65f6\u63d0\u4ea4\u5b9e\u8bad\u62a5\u544a\u3002"}')"
    if [[ "${NOTIFICATION_ASYNC_ENABLED:-false}" == "true" || "${NOTIFICATION_ASYNC_ENABLED:-0}" == "1" ]]; then
      assert_json_field_equals data.status PENDING <<< "$reminder_response"
      assert_jdbc_scalar_eventually_equals "async reminder sent" "SELECT CASE WHEN EXISTS (SELECT 1 FROM notification_events WHERE assignment_id = 1 AND recipient_id = 2 AND status = 'SENT') THEN 1 ELSE 0 END" "1"
    else
      assert_json_field_equals data.status SENT <<< "$reminder_response"
      assert_jdbc_scalar_equals "reminder persisted" "SELECT CASE WHEN EXISTS (SELECT 1 FROM notification_events WHERE assignment_id = 1 AND recipient_id = 2 AND status = 'SENT') THEN 1 ELSE 0 END" "1"
    fi
    notification_list_response="$(get_api "gateway notification list" "$GATEWAY_URL/api/notifications?userId=2")"
    notification_id="$(json_data_path "0.id" <<< "$notification_list_response")"
    assert_json_field_equals data.0.isRead false <<< "$notification_list_response"
    assert_jdbc_scalar_equals "notification unread persisted" "SELECT is_read FROM notification_events WHERE id = $notification_id" "f"
    patch_json "notification mark read" "$GATEWAY_URL/api/notifications/$notification_id/read?userId=2" '{}' >/dev/null
    notification_after_read_response="$(get_api "gateway notification after read" "$GATEWAY_URL/api/notifications?userId=2")"
    assert_json_field_equals data.0.isRead true <<< "$notification_after_read_response"
    assert_jdbc_scalar_equals "notification read persisted" "SELECT is_read FROM notification_events WHERE id = $notification_id" "t"
    post_json "remind unsubmitted again" "$GATEWAY_URL/api/notifications/remind-unsubmitted" '{"assignmentId":1,"studentIds":[2],"channels":["IN_APP"],"message":"\u8bf7\u518d\u6b21\u786e\u8ba4\u5b9e\u8bad\u62a5\u544a\u63d0\u4ea4\u72b6\u6001\u3002"}' >/dev/null
    assert_jdbc_scalar_equals "notification unread recreated" "SELECT CASE WHEN EXISTS (SELECT 1 FROM notification_events WHERE recipient_id = 2 AND is_read = false) THEN 1 ELSE 0 END" "1"
    patch_json "notification mark all read" "$GATEWAY_URL/api/notifications/read-all?userId=2" '{}' >/dev/null
    assert_jdbc_scalar_equals "all notifications read persisted" "SELECT count(*) FROM notification_events WHERE recipient_id = 2 AND is_read = false" "0"
    similarity_response="$(post_json "similarity job" "$GATEWAY_URL/api/similarity/jobs" "{\"assignmentId\":1,\"submissionIds\":[$submission_id,$peer_submission_id],\"includeHistory\":true}")"
    similarity_job_id="$(json_field id <<< "$similarity_response")"
    assert_json_field_equals data.status COMPLETED <<< "$similarity_response"
    assert_json_field_equals data.checkedSubmissionCount 2 <<< "$similarity_response"
    assert_jdbc_scalar_equals "similarity job persisted" "SELECT checked_submission_count FROM similarity_jobs WHERE id = $similarity_job_id" "2"
    assert_jdbc_scalar_equals "similarity match persisted" "SELECT count(*) FROM similarity_matches WHERE similarity_job_id = $similarity_job_id AND source_submission_id = $submission_id AND target_submission_id = $peer_submission_id" "1"
  fi
fi

echo "[smoke] API smoke checks completed"
