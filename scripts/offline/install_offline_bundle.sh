#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
INSTALL_ROOT="${INSTALL_ROOT:-/opt/enterprise-agent-platform}"
if [ -z "${PYTHON_BIN:-}" ]; then
  if [ -x "/usr/local/anaconda3/envs/py310/bin/python" ]; then
    PYTHON_BIN="/usr/local/anaconda3/envs/py310/bin/python"
  else
    PYTHON_BIN="python3"
  fi
fi

"$PYTHON_BIN" - <<'PY'
import sys

if sys.version_info < (3, 10):
    raise SystemExit(
        "Python 3.10+ is required to install Enterprise Agent Platform. "
        "Set PYTHON_BIN to a Python 3.10/3.11 executable."
    )
PY

echo "Installing Enterprise Agent Platform to: $INSTALL_ROOT"
mkdir -p "$INSTALL_ROOT"
rsync -a "$SCRIPT_DIR/app/" "$INSTALL_ROOT/app/"
rsync -a "$SCRIPT_DIR/wheels/" "$INSTALL_ROOT/wheels/"
mkdir -p "$INSTALL_ROOT/data/projects" "$INSTALL_ROOT/data/uploads" "$INSTALL_ROOT/data/outputs" "$INSTALL_ROOT/data/tasks" "$INSTALL_ROOT/data/knowledge_bases"

if [ ! -d "$INSTALL_ROOT/venv" ]; then
  "$PYTHON_BIN" -m venv "$INSTALL_ROOT/venv"
fi

"$INSTALL_ROOT/venv/bin/python" -m pip install --no-cache-dir --no-index --find-links "$INSTALL_ROOT/wheels" --upgrade pip setuptools wheel
"$INSTALL_ROOT/venv/bin/python" -m pip install --no-cache-dir --no-index --find-links "$INSTALL_ROOT/wheels" "$INSTALL_ROOT/app"

if [ ! -f "$INSTALL_ROOT/.env" ]; then
  cp "$SCRIPT_DIR/deploy/.env.example" "$INSTALL_ROOT/.env"
fi

echo "Installation complete."
echo "Edit environment file if needed: $INSTALL_ROOT/.env"
echo "Run verification:"
echo "  INSTALL_ROOT=$INSTALL_ROOT bash $SCRIPT_DIR/verify.sh"
