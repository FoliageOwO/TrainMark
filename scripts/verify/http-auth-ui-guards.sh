#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$ROOT_DIR"

assert_contains() {
  local file="$1"
  local pattern="$2"
  local label="$3"
  if ! rg -n --fixed-strings "$pattern" "$file" >/dev/null; then
    echo "[auth-ui-guards] failed: missing $label ($pattern in $file)" >&2
    exit 1
  fi
  echo "[auth-ui-guards] ok: $label"
}

echo "[auth-ui-guards] 1/2 frontend auth guard invariants"
assert_contains "apps/web/src/pages/App.tsx" "<AuthPage" "auth page render gate"
assert_contains "apps/web/src/pages/App.tsx" "if (!user)" "unauthenticated short-circuit"
assert_contains "apps/web/src/pages/App.tsx" "logoutCurrentSession" "logout action wired"
assert_contains "apps/web/src/pages/App.tsx" "clearWorkspaceLocationParams" "url role/section cleanup"
assert_contains "apps/web/src/pages/App.tsx" "重试加载" "http error retry action"
assert_contains "apps/web/src/pages/App.tsx" "返回登录页" "http error fallback login action"
assert_contains "apps/web/src/pages/App.tsx" "已保留最近一次成功加载的数据，可继续查看并稍后重试同步。" "http error keeps last successful workspace snapshot"
assert_contains "apps/web/src/pages/App.tsx" "showDemoAccountsHint={!shouldUseHttpApi()}" "demo account hint hidden in HTTP mode"
assert_contains "apps/web/src/pages/App.tsx" "allowRoleSwitch={!shouldUseHttpApi()}" "role switcher disabled in HTTP mode"
assert_contains "apps/web/src/api/httpApi.ts" "persistTokens" "token persistence"
assert_contains "apps/web/src/api/httpApi.ts" "clearTokens" "token cleanup"
assert_contains "apps/web/src/api/httpApi.ts" "hasStoredAccessToken" "session restore precheck"
assert_contains "apps/web/src/api/httpApi.ts" "window.localStorage.getItem('trainmark.accessToken')" "access token read path"
if rg -n "formData.get\\('password'\\).*trim\\(\\)" "apps/web/src/components/AuthPage.tsx" >/dev/null; then
  echo "[auth-ui-guards] failed: password must not be trimmed in AuthPage" >&2
  exit 1
fi
echo "[auth-ui-guards] ok: password input preserved without trim"

if ! perl -0ne 'exit((/handleCredentialLogin[\s\S]*?const initialRole = profile\.roles\[0\];[\s\S]*?setActiveRole\(initialRole\)/ && /handleRegister[\s\S]*?const initialRole = profile\.roles\[0\];[\s\S]*?setActiveRole\(initialRole\)/) ? 0 : 1)' "apps/web/src/pages/App.tsx"; then
  echo "[auth-ui-guards] failed: initialRole must be declared before setActiveRole in login/register handlers" >&2
  exit 1
fi
echo "[auth-ui-guards] ok: auth role initialized before active role assignment (login/register)"

if ! perl -0ne 'exit((/handleCredentialLogin[\s\S]*?setWorkspaceData\(null\);[\s\S]*?setWorkspaceLoaded\(false\);/ && /handleRegister[\s\S]*?setWorkspaceData\(null\);[\s\S]*?setWorkspaceLoaded\(false\);/) ? 0 : 1)' "apps/web/src/pages/App.tsx"; then
  echo "[auth-ui-guards] failed: login/register must clear previous workspace snapshot before switching user" >&2
  exit 1
fi
echo "[auth-ui-guards] ok: login/register clear previous workspace snapshot"

if ! perl -0ne 'exit((/function writeRoleToLocation\(role: RoleCode\)[\s\S]*?if \(shouldUseHttpApi\(\)\) \{[\s\S]*?searchParams\.delete\('"'role'"'\);[\s\S]*?return;[\s\S]*?\}/) ? 0 : 1)' "apps/web/src/pages/App.tsx"; then
  echo "[auth-ui-guards] failed: writeRoleToLocation must strip role param in HTTP mode" >&2
  exit 1
fi
echo "[auth-ui-guards] ok: role query parameter stripped in HTTP mode"

echo "[auth-ui-guards] 2/2 strict auth backend smoke"
pnpm smoke:auth:strict:local

echo "[auth-ui-guards] passed"
