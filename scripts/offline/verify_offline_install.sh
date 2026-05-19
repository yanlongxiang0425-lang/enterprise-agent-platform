#!/usr/bin/env bash
set -euo pipefail

INSTALL_ROOT="${INSTALL_ROOT:-/opt/enterprise-agent-platform}"
PYTHON_BIN="$INSTALL_ROOT/venv/bin/python"

if [ ! -x "$PYTHON_BIN" ]; then
  echo "Python venv not found: $PYTHON_BIN" >&2
  exit 1
fi

cd "$INSTALL_ROOT/app"

"$PYTHON_BIN" -m compileall -q agent_platform material_agent
"$PYTHON_BIN" -m material_agent.cli list-agents
"$PYTHON_BIN" - <<'PY'
from material_agent.api.routes import health, list_model_routes, list_tools

assert health()["component"] == "enterprise-agent-platform"
assert list_tools()
assert list_model_routes()
print("offline verification passed")
PY
