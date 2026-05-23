#!/usr/bin/env bash
set -euo pipefail

AUTH_SERVICE_URL="${AUTH_SERVICE_URL:-http://localhost:8081}"
AUTH_USERNAME="${AUTH_USERNAME:-owner}"
AUTH_PASSWORD="${AUTH_PASSWORD:-trainmark}"
AUTH_EXPECTED_ROLE="${AUTH_EXPECTED_ROLE:-COURSE_OWNER}"
SMOKE_DRY_RUN="${SMOKE_DRY_RUN:-0}"
PYTHON_BIN="${PYTHON_BIN:-}"

if [[ -z "$PYTHON_BIN" ]]; then
  for candidate in python3 python py; do
    if command -v "$candidate" >/dev/null 2>&1 && "$candidate" --version >/dev/null 2>&1; then
      PYTHON_BIN="$candidate"
      break
    fi
  done
fi

if [[ -z "$PYTHON_BIN" ]]; then
  echo "[auth-strict] Python 3 is required. Set PYTHON_BIN to a Python executable." >&2
  exit 1
fi

post_json() {
  local label="$1"
  local path="$2"
  local body="$3"

  if [[ "$SMOKE_DRY_RUN" == "1" ]]; then
    echo "[auth-strict:dry-run] POST $label -> $AUTH_SERVICE_URL$path :: $body"
    return
  fi

  echo "[auth-strict] POST $label" >&2
  curl --noproxy '*' --fail --silent --show-error --max-time 5 \
    -H 'Content-Type: application/json' \
    -d "$body" \
    "$AUTH_SERVICE_URL$path"
}

post_auth() {
  local label="$1"
  local path="$2"
  local token="$3"

  if [[ "$SMOKE_DRY_RUN" == "1" ]]; then
    echo "[auth-strict:dry-run] POST $label -> $AUTH_SERVICE_URL$path :: Authorization=Bearer $token"
    return
  fi

  echo "[auth-strict] POST $label" >&2
  curl --noproxy '*' --fail --silent --show-error --max-time 5 \
    -X POST \
    -H "Authorization: Bearer $token" \
    "$AUTH_SERVICE_URL$path"
}

get_auth() {
  local label="$1"
  local path="$2"
  local token="$3"

  if [[ "$SMOKE_DRY_RUN" == "1" ]]; then
    echo "[auth-strict:dry-run] GET $label -> $AUTH_SERVICE_URL$path :: Authorization=Bearer $token"
    return
  fi

  echo "[auth-strict] GET $label" >&2
  curl --noproxy '*' --fail --silent --show-error --max-time 5 \
    -H "Authorization: Bearer $token" \
    "$AUTH_SERVICE_URL$path"
}

expect_post_failure() {
  local label="$1"
  local path="$2"
  local auth_header="${3:-}"
  local expected_message="$4"
  local response

  if [[ "$SMOKE_DRY_RUN" == "1" ]]; then
    echo "[auth-strict:dry-run] EXPECT POST failure $label -> $AUTH_SERVICE_URL$path :: $expected_message"
    return
  fi

  echo "[auth-strict] EXPECT POST failure $label" >&2
  if [[ -n "$auth_header" ]]; then
    response="$(curl --noproxy '*' --silent --show-error --max-time 5 -w '\n%{http_code}' \
      -X POST \
      -H "Authorization: $auth_header" \
      "$AUTH_SERVICE_URL$path")"
  else
    response="$(curl --noproxy '*' --silent --show-error --max-time 5 -w '\n%{http_code}' \
      -X POST \
      "$AUTH_SERVICE_URL$path")"
  fi
  assert_failure "$response" "$expected_message"
}

api_field() {
  local expression="$1"
  "$PYTHON_BIN" -c "import json, sys; payload=json.load(sys.stdin); print($expression)"
}

assert_success_role() {
  local expected_role="$1"
  "$PYTHON_BIN" -c 'import json, sys; expected = sys.argv[1]; payload = json.load(sys.stdin); roles = payload.get("data", {}).get("user", payload.get("data", {})).get("roles", []); raise SystemExit(0 if payload.get("success") is True and expected in roles else 1)' "$expected_role"
}

assert_success() {
  "$PYTHON_BIN" -c 'import json, sys; payload = json.load(sys.stdin); raise SystemExit(0 if payload.get("success") is True else 1)'
}

assert_failure() {
  local response="$1"
  local expected_message="$2"
  "$PYTHON_BIN" -c 'import json, sys; body, code = sys.stdin.read().rstrip("\n").rsplit("\n", 1); payload = json.loads(body); expected = sys.argv[1]; ok = code == "400" and payload.get("success") is False and expected in payload.get("message", ""); raise SystemExit(0 if ok else 1)' "$expected_message" <<< "$response"
}

unknown_access_token() {
  printf 'access:strict-unknown-user:smoke' | base64 -w0 | tr '+/' '-_' | tr -d '='
}

if [[ "$SMOKE_DRY_RUN" == "1" ]]; then
  post_json "$AUTH_USERNAME login" "/api/auth/login" "{\"username\":\"$AUTH_USERNAME\",\"password\":\"$AUTH_PASSWORD\"}"
  get_auth "$AUTH_USERNAME profile" "/api/auth/me" "<from login>"
  post_auth "$AUTH_USERNAME refresh" "/api/auth/refresh" "<from login>"
  post_auth "$AUTH_USERNAME logout" "/api/auth/logout" "<from login>"
  expect_post_failure "refresh without token" "/api/auth/refresh" "" "Authentication is required"
  expect_post_failure "logout without token" "/api/auth/logout" "" "Authentication is required"
  expect_post_failure "refresh unknown token" "/api/auth/refresh" "Bearer <unknown access token>" "Invalid access token"
  echo "[auth-strict] strict auth smoke checks completed"
  exit 0
fi

health="$(curl --noproxy '*' --fail --silent --show-error --max-time 5 "$AUTH_SERVICE_URL/actuator/health")"
status="$(api_field 'payload["status"]' <<< "$health")"
if [[ "$status" != "UP" ]]; then
  echo "auth-service health is $status" >&2
  exit 1
fi

login_response="$(post_json "$AUTH_USERNAME login" "/api/auth/login" "{\"username\":\"$AUTH_USERNAME\",\"password\":\"$AUTH_PASSWORD\"}")"
assert_success_role "$AUTH_EXPECTED_ROLE" <<< "$login_response"
access_token="$(api_field 'payload["data"]["accessToken"]' <<< "$login_response")"

profile_response="$(get_auth "$AUTH_USERNAME profile" "/api/auth/me" "$access_token")"
assert_success_role "$AUTH_EXPECTED_ROLE" <<< "$profile_response"

refresh_response="$(post_auth "$AUTH_USERNAME refresh" "/api/auth/refresh" "$access_token")"
assert_success_role "$AUTH_EXPECTED_ROLE" <<< "$refresh_response"

logout_response="$(post_auth "$AUTH_USERNAME logout" "/api/auth/logout" "$access_token")"
assert_success <<< "$logout_response"

expect_post_failure "refresh without token" "/api/auth/refresh" "" "Authentication is required"
expect_post_failure "logout without token" "/api/auth/logout" "" "Authentication is required"
expect_post_failure "refresh unknown token" "/api/auth/refresh" "Bearer $(unknown_access_token)" "Invalid access token"

echo "[auth-strict] strict auth smoke checks completed"
