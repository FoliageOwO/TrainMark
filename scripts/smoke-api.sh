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
    if curl --fail --silent --show-error --max-time 5 "$url" >/dev/null; then
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
    if response="$(curl --fail --silent --show-error --max-time 5 \
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

api_success() {
  python3 -c 'import json, sys; payload=json.load(sys.stdin); raise SystemExit(0 if payload.get("success") is True else 1)' <<< "$1"
}

json_field() {
  local field="$1"
  python3 -c "import json, sys; print(json.load(sys.stdin)['data']['$field'])"
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

check_url "gateway auth profile" "$GATEWAY_URL/api/auth/me"
check_url "gateway organizations" "$GATEWAY_URL/api/organizations"
check_url "gateway users" "$GATEWAY_URL/api/users"
check_url "gateway courses" "$GATEWAY_URL/api/courses"
check_url "gateway assignments" "$GATEWAY_URL/api/assignments"
check_url "gateway submissions" "$GATEWAY_URL/api/submissions"
check_url "gateway collection overview" "$GATEWAY_URL/api/notifications/assignments/1/collection"
check_url "gateway rubrics" "$GATEWAY_URL/api/rubrics"
check_url "gateway grading jobs" "$GATEWAY_URL/api/grading/jobs"
check_url "gateway grading results" "$GATEWAY_URL/api/grading/results"
check_url "gateway annotation PDF" "$GATEWAY_URL/annotations/submissions/1/annotated.pdf"
check_url "gateway grade export" "$GATEWAY_URL/exports/assignments/1/grades.csv"
check_url "gateway OCR jobs" "$GATEWAY_URL/api/ocr/jobs"
check_url "gateway similarity jobs" "$GATEWAY_URL/api/similarity/jobs"
check_url "gateway analytics" "$GATEWAY_URL/api/analytics/grade-statistics?assignmentId=1"
check_url "gateway admin audit logs" "$GATEWAY_URL/api/admin/audit-logs"
check_url "gateway admin settings" "$GATEWAY_URL/api/admin/settings"

if [[ "$SMOKE_INCLUDE_WRITES" == "1" ]]; then
  if [[ "$SMOKE_DRY_RUN" == "1" ]]; then
    post_json "upload init" "$GATEWAY_URL/api/submissions/upload/init" '{"assignmentId":1,"studentId":2,"fileName":"smoke-report.pdf","contentType":"application/pdf","fileSize":1048576,"checksum":null}'
    post_json "upload complete" "$GATEWAY_URL/api/submissions/upload/complete" '{"uploadId":"<from upload init>","objectKey":"<from upload init>","checksum":null}'
  else
    init_response="$(post_json "upload init" "$GATEWAY_URL/api/submissions/upload/init" '{"assignmentId":1,"studentId":2,"fileName":"smoke-report.pdf","contentType":"application/pdf","fileSize":1048576,"checksum":null}')"
    upload_id="$(json_field uploadId <<< "$init_response")"
    object_key="$(json_field objectKey <<< "$init_response")"
    post_json "upload complete" "$GATEWAY_URL/api/submissions/upload/complete" "{\"uploadId\":\"$upload_id\",\"objectKey\":\"$object_key\",\"checksum\":null}"
  fi
  post_json "grading job" "$GATEWAY_URL/api/grading/jobs" '{"assignmentId":1,"rubricId":1,"submissionIds":[1]}'
  post_json "grade export" "$GATEWAY_URL/api/grading/exports" '{"assignmentId":1,"format":"CSV","operatorName":"Smoke"}'
  post_json "remind unsubmitted" "$GATEWAY_URL/api/notifications/remind-unsubmitted" '{"assignmentId":1,"studentIds":[2],"channels":["IN_APP"],"message":"Smoke reminder"}'
  post_json "similarity job" "$GATEWAY_URL/api/similarity/jobs" '{"assignmentId":1,"submissionIds":[1,2],"includeHistory":true}'
fi

echo "[smoke] API smoke checks completed"
