#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
if [ -z "${PYTHON_BIN:-}" ]; then
  if [ -x "/usr/local/anaconda3/envs/py310/bin/python" ]; then
    PYTHON_BIN="/usr/local/anaconda3/envs/py310/bin/python"
  else
    PYTHON_BIN="python3"
  fi
fi
BUNDLE_ROOT="${BUNDLE_ROOT:-$ROOT_DIR/dist/offline}"
APP_NAME="enterprise-agent-platform"
VERSION="$(awk -F '"' '/^version = / {print $2; exit}' "$ROOT_DIR/pyproject.toml")"
BUNDLE_DIR="$BUNDLE_ROOT/${APP_NAME}-${VERSION}"

"$PYTHON_BIN" - <<'PY'
import sys

if sys.version_info < (3, 10):
    raise SystemExit(
        "Python 3.10+ is required to build the offline bundle. "
        "Set PYTHON_BIN to a Python 3.10/3.11 executable."
    )
PY

echo "Building offline bundle at: $BUNDLE_DIR"
rm -rf "$BUNDLE_DIR"
mkdir -p "$BUNDLE_DIR/app" "$BUNDLE_DIR/wheels" "$BUNDLE_DIR/deploy"

rsync -a \
  --exclude ".git/" \
  --exclude ".vendor/" \
  --exclude ".venv/" \
  --exclude "__pycache__/" \
  --exclude "*.pyc" \
  --exclude ".pytest_cache/" \
  --exclude ".ruff_cache/" \
  --exclude ".mypy_cache/" \
  --exclude ".build_*/" \
  --exclude "dist/" \
  --exclude "交付物/material_agent_outputs/" \
  --exclude "交付物/material_agent_tasks/" \
  --exclude "交付物/knowledge_bases/" \
  "$ROOT_DIR/" "$BUNDLE_DIR/app/"

"$PYTHON_BIN" -m pip download \
  --dest "$BUNDLE_DIR/wheels" \
  --requirement "$ROOT_DIR/material_agent/requirements.txt" \
  "setuptools>=68" "wheel" "pip"

cp "$ROOT_DIR/scripts/offline/install_offline_bundle.sh" "$BUNDLE_DIR/install.sh"
cp "$ROOT_DIR/scripts/offline/verify_offline_install.sh" "$BUNDLE_DIR/verify.sh"
cp "$ROOT_DIR/deploy/offline/env.production.example" "$BUNDLE_DIR/deploy/.env.example"
cp "$ROOT_DIR/deploy/offline/enterprise-agent-platform.service" "$BUNDLE_DIR/deploy/enterprise-agent-platform.service"

cat > "$BUNDLE_DIR/OFFLINE_MANIFEST.txt" <<EOF
name=${APP_NAME}
version=${VERSION}
created_at=$(date -u +"%Y-%m-%dT%H:%M:%SZ")
python=$("$PYTHON_BIN" --version 2>&1)
entrypoint=uvicorn material_agent.app.main:app --host 0.0.0.0 --port 8000
EOF

(
  cd "$BUNDLE_ROOT"
  tar -czf "${APP_NAME}-${VERSION}.tar.gz" "${APP_NAME}-${VERSION}"
)

echo "Offline bundle created:"
echo "  directory: $BUNDLE_DIR"
echo "  archive:   $BUNDLE_ROOT/${APP_NAME}-${VERSION}.tar.gz"
