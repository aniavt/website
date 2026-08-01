#!/usr/bin/env bash
# Fail if an app Dockerfile is missing COPY lines for:
# - every root app workspace package.json (pnpm workspace install)
# - package.json of every @ania/* workspace dep used by any app (sibling manifests)
# - source of @ania/* deps used by that app only (selective)
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

declare -A APP_DOCKERFILE=(
  [server]="docker/server/Dockerfile"
  [admin-website]="docker/admin-website/Dockerfile"
  [client]="docker/web/Dockerfile"
)

ROOT_APP_WORKSPACES=(server admin-website client)

errors=0

ania_workspace_deps() {
  local pkg_json="$1"
  node -e "
    const pkg = require('./${pkg_json}');
    const deps = { ...pkg.dependencies, ...pkg.devDependencies };
    for (const [name, version] of Object.entries(deps ?? {})) {
      if (version === 'workspace:*' && name.startsWith('@ania/')) {
        console.log(name.slice('@ania/'.length));
      }
    }
  "
}

mapfile -t ALL_ANIA_PACKAGES < <(
  {
    for app in "${!APP_DOCKERFILE[@]}"; do
      ania_workspace_deps "$app/package.json"
    done
  } | sort -u
)

for app in "${!APP_DOCKERFILE[@]}"; do
  dockerfile="${APP_DOCKERFILE[$app]}"
  pkg_json="$app/package.json"

  if [[ ! -f "$pkg_json" ]]; then
    echo "error: missing $pkg_json" >&2
    errors=$((errors + 1))
    continue
  fi
  if [[ ! -f "$dockerfile" ]]; then
    echo "error: missing $dockerfile" >&2
    errors=$((errors + 1))
    continue
  fi

  for ws in "${ROOT_APP_WORKSPACES[@]}"; do
    if ! grep -qE "^COPY ${ws}/package\\.json " "$dockerfile"; then
      echo "error: $app → $dockerfile missing COPY ${ws}/package.json (root workspace manifest)" >&2
      errors=$((errors + 1))
    fi
  done

  # Manifests for the union of all @ania deps (required once sibling app package.json files are present)
  for pkg in "${ALL_ANIA_PACKAGES[@]}"; do
    [[ -z "$pkg" ]] && continue
    if ! grep -qE "^COPY packages/${pkg}/package\\.json " "$dockerfile"; then
      echo "error: $app → $dockerfile missing COPY packages/${pkg}/package.json (shared workspace manifest)" >&2
      errors=$((errors + 1))
    fi
  done

  # Source only for this app's own @ania deps
  mapfile -t app_packages < <(ania_workspace_deps "$pkg_json" | sort -u)
  for pkg in "${app_packages[@]}"; do
    [[ -z "$pkg" ]] && continue
    if ! grep -qE "^COPY packages/${pkg} " "$dockerfile"; then
      echo "error: $app → $dockerfile missing COPY packages/${pkg} (workspace dep @ania/${pkg})" >&2
      errors=$((errors + 1))
    fi
  done
done

if [[ "$errors" -gt 0 ]]; then
  echo "check-docker-workspace-packages: $errors issue(s)" >&2
  exit 1
fi

echo "check-docker-workspace-packages: ok"
