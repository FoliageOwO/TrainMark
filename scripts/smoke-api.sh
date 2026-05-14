#!/usr/bin/env bash
set -euo pipefail

GATEWAY_URL="${GATEWAY_URL:-http://localhost:8080}"
SMOKE_DRY_RUN="${SMOKE_DRY_RUN:-0}"
SMOKE_RETRIES="${SMOKE_RETRIES:-1}"
SMOKE_RETRY_DELAY_SECONDS="${SMOKE_RETRY_DELAY_SECONDS:-2}"
SMOKE_INCLUDE_WRITES="${SMOKE_INCLUDE_WRITES:-0}"

check_url() {
  local label="$1"
  local url="$2"
  local attempt=1

  if [[ "$SMOKE_DRY_RUN" == "1" ]]; then
    echo "[smoke:dry-run] $label -> $url"
    return
  fi

  while true; do
    echo "[smoke] $label (attempt $attempt/$SMOKE_RETRIES)"
    if curl --noproxy '*' --fail --silent --show-error --max-time 5 "$url" >/dev/null; then
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

  if [[ "$SMOKE_DRY_RUN" == "1" ]]; then
    echo "[smoke:dry-run] API $label -> $url"
    return
  fi

  while true; do
    echo "[smoke] API $label (attempt $attempt/$SMOKE_RETRIES)"
    if response="$(curl --noproxy '*' --fail --silent --show-error --max-time 5 "$url")" && api_success "$response"; then
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

post_json() {
  local label="$1"
  local url="$2"
  local body="$3"
  local attempt=1
  local response

  if [[ "$SMOKE_DRY_RUN" == "1" ]]; then
    echo "[smoke:dry-run] POST $label -> $url :: $body"
    return
  fi

  while true; do
    echo "[smoke] POST $label (attempt $attempt/$SMOKE_RETRIES)" >&2
    if response="$(curl --noproxy '*' --fail --silent --show-error --max-time 5 \
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

  if [[ "$SMOKE_DRY_RUN" == "1" ]]; then
    echo "[smoke:dry-run] PATCH $label -> $url :: $body"
    return
  fi

  while true; do
    echo "[smoke] PATCH $label (attempt $attempt/$SMOKE_RETRIES)" >&2
    if response="$(curl --noproxy '*' --fail --silent --show-error --max-time 5 \
      -X PATCH \
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

  if [[ "$SMOKE_DRY_RUN" == "1" ]]; then
    echo "[smoke:dry-run] PUT multipart $label -> $url :: uploadId=$upload_id objectKey=$object_key file=@$file_path"
    return
  fi

  while true; do
    echo "[smoke] PUT multipart $label (attempt $attempt/$SMOKE_RETRIES)" >&2
    if response="$(curl --noproxy '*' --fail --silent --show-error --max-time 5 \
      -X PUT \
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
check_api "gateway admin audit logs" "$GATEWAY_URL/api/admin/audit-logs"
check_api "gateway admin settings" "$GATEWAY_URL/api/admin/settings"

if [[ "$SMOKE_INCLUDE_WRITES" == "1" ]]; then
  if [[ "$SMOKE_DRY_RUN" == "1" ]]; then
    post_json "organization" "$GATEWAY_URL/api/organizations" '{"parentId":2,"name":"Smoke 软件测试班","type":"CLASS"}'
    post_json "user" "$GATEWAY_URL/api/users" '{"organizationId":3,"username":"smoke-student","name":"Smoke 学生","studentNo":"SMOKE001","email":"smoke.student@trainmark.local","phone":"13800000000","roles":["STUDENT"]}'
    post_json "student import" "$GATEWAY_URL/api/users/students/import" '{"classId":3,"rows":[{"studentNo":"SMOKE002","name":"Smoke 导入学生","email":"smoke.import@trainmark.local","phone":"13800000001"}]}'
    patch_json "admin setting" "$GATEWAY_URL/api/admin/settings/export.retention-days" '{"value":"45"}'
  else
    smoke_suffix="$(date +%s)"
    organization_response="$(post_json "organization" "$GATEWAY_URL/api/organizations" "{\"parentId\":2,\"name\":\"Smoke 软件测试班 $smoke_suffix\",\"type\":\"CLASS\"}")"
    organization_id="$(json_field id <<< "$organization_response")"
    post_json "user" "$GATEWAY_URL/api/users" "{\"organizationId\":$organization_id,\"username\":\"smoke-student-$smoke_suffix\",\"name\":\"Smoke 学生\",\"studentNo\":\"SMOKE$smoke_suffix\",\"email\":\"smoke.student.$smoke_suffix@trainmark.local\",\"phone\":\"13800000000\",\"roles\":[\"STUDENT\"]}"
    post_json "student import" "$GATEWAY_URL/api/users/students/import" "{\"classId\":$organization_id,\"rows\":[{\"studentNo\":\"SMOKE-IMPORT-$smoke_suffix\",\"name\":\"Smoke 导入学生\",\"email\":\"smoke.import.$smoke_suffix@trainmark.local\",\"phone\":\"13800000001\"}]}"
    patch_json "admin setting" "$GATEWAY_URL/api/admin/settings/export.retention-days" '{"value":"45"}'
  fi
  if [[ "$SMOKE_DRY_RUN" == "1" ]]; then
    post_json "upload init" "$GATEWAY_URL/api/submissions/upload/init" '{"assignmentId":1,"studentId":2,"fileName":"smoke-report.pdf","contentType":"application/pdf","fileSize":1048576,"checksum":null}'
    put_upload_content "upload content" "$GATEWAY_URL/api/submissions/upload/content" "<from upload init>" "<from upload init>" "smoke-report.pdf"
    post_json "upload complete" "$GATEWAY_URL/api/submissions/upload/complete" '{"uploadId":"<from upload init>","objectKey":"<from upload init>","checksum":null}'
    check_url "uploaded report file" "$GATEWAY_URL/api/submissions/<from upload complete>/file"
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
    check_url "uploaded report file" "$GATEWAY_URL/api/submissions/$submission_id/file"
  fi
  post_json "assignment" "$GATEWAY_URL/api/assignments" '{"courseId":1,"title":"Smoke 实训任务","description":"Smoke assignment creation","deadline":"2030-05-20T23:59:00+08:00","totalScore":100,"classIds":[1,2],"similarityCheckEnabled":true,"aiGradingEnabled":true}'
  post_json "rubric" "$GATEWAY_URL/api/rubrics" '{"assignmentId":1,"name":"Smoke 评分标准","totalScore":100,"items":[{"title":"需求与设计","score":20,"courseOutcomeCode":"CO1","points":[{"title":"需求完整","description":"覆盖需求、设计和约束","score":20,"keywords":["需求","设计"],"synonyms":[]}]},{"title":"系统实现","score":50,"courseOutcomeCode":"CO2","points":[{"title":"实现完整","description":"覆盖核心功能和异常处理","score":50,"keywords":["功能","接口"],"synonyms":[]}]},{"title":"报告规范","score":30,"courseOutcomeCode":"CO3","points":[{"title":"报告规范","description":"覆盖截图、总结和格式","score":30,"keywords":["截图","总结"],"synonyms":[]}]}]}'
  post_json "grading job" "$GATEWAY_URL/api/grading/jobs" '{"assignmentId":1,"rubricId":1,"submissionIds":[1]}'
  if [[ "$SMOKE_DRY_RUN" == "1" ]]; then
    post_json "ocr job" "$GATEWAY_URL/api/ocr/jobs" '{"submissionId":1,"objectKey":"assignments/1/students/2/database-report.docx","mode":"STRUCTURE"}'
    check_api "gateway OCR result" "$GATEWAY_URL/api/ocr/jobs/<from ocr job>/result"
  else
    ocr_response="$(post_json "ocr job" "$GATEWAY_URL/api/ocr/jobs" '{"submissionId":1,"objectKey":"assignments/1/students/2/database-report.docx","mode":"STRUCTURE"}')"
    ocr_job_id="$(json_field id <<< "$ocr_response")"
    check_api "gateway OCR result" "$GATEWAY_URL/api/ocr/jobs/$ocr_job_id/result"
  fi
  patch_json "review item" "$GATEWAY_URL/api/grading/results/1/items" '{"rubricItemId":1,"teacherScore":18,"teacherComment":"Smoke review comment"}'
  post_json "approve result" "$GATEWAY_URL/api/grading/results/1/approve" '{"reviewerName":"Smoke Reviewer","overallComment":"Smoke approved"}'
  post_json "publish result" "$GATEWAY_URL/api/grading/results/1/publish" '{"operatorName":"Smoke","message":"Smoke publish"}'
  check_api "gateway publications" "$GATEWAY_URL/api/grading/results/publications?assignmentId=1"
  check_api "gateway publication audits" "$GATEWAY_URL/api/grading/results/1/publication-audits"
  if [[ "$SMOKE_DRY_RUN" == "1" ]]; then
    post_json "grade appeal" "$GATEWAY_URL/api/grading/results/appeals" '{"resultId":1,"rubricItemId":1,"studentId":2,"reason":"Smoke appeal reason","requestedChange":"Smoke requested change"}'
    post_json "resolve grade appeal" "$GATEWAY_URL/api/grading/results/appeals/<from grade appeal>/resolve" '{"status":"REJECTED","teacherReply":"Smoke appeal reply"}'
  else
    appeal_response="$(post_json "grade appeal" "$GATEWAY_URL/api/grading/results/appeals" '{"resultId":1,"rubricItemId":1,"studentId":2,"reason":"Smoke appeal reason","requestedChange":"Smoke requested change"}')"
    appeal_id="$(json_field id <<< "$appeal_response")"
    post_json "resolve grade appeal" "$GATEWAY_URL/api/grading/results/appeals/$appeal_id/resolve" '{"status":"REJECTED","teacherReply":"Smoke appeal reply"}'
  fi
  check_api "gateway grade appeals" "$GATEWAY_URL/api/grading/results/appeals?resultId=1"
  post_json "grade export" "$GATEWAY_URL/api/grading/exports" '{"assignmentId":1,"format":"CSV","operatorName":"Smoke"}'
  post_json "remind unsubmitted" "$GATEWAY_URL/api/notifications/remind-unsubmitted" '{"assignmentId":1,"studentIds":[2],"channels":["IN_APP"],"message":"Smoke reminder"}'
  post_json "similarity job" "$GATEWAY_URL/api/similarity/jobs" '{"assignmentId":1,"submissionIds":[1,2],"includeHistory":true}'
fi

echo "[smoke] API smoke checks completed"
