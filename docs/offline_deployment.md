# Offline Deployment Guide

## Goal

Package Enterprise Agent Platform in a connected build environment, transfer the package to an offline server, install dependencies from local wheels only, and run the API without internet access.

## Build Machine

Requirements:

- Python 3.10 or 3.11
- Internet access to Python package indexes
- `rsync`, `tar`, `bash`

Build the offline package:

```bash
make offline-bundle
```

If the server has multiple Python versions, point the build to Python 3.10+ explicitly:

```bash
PYTHON_BIN=/usr/local/anaconda3/envs/py310/bin/python make offline-bundle
```

Output:

```text
dist/offline/enterprise-agent-platform-<version>/
dist/offline/enterprise-agent-platform-<version>.tar.gz
```

The bundle contains:

- `app/`: source code and deployment files
- `wheels/`: Python dependencies
- `deploy/.env.example`: production environment template
- `deploy/enterprise-agent-platform.service`: systemd template
- `install.sh`: offline installer
- `verify.sh`: offline verification script

## Offline Server

Copy the archive to the offline server:

```bash
tar -xzf enterprise-agent-platform-<version>.tar.gz
cd enterprise-agent-platform-<version>
sudo INSTALL_ROOT=/opt/enterprise-agent-platform bash install.sh
```

If `python3` on the offline server is older than 3.10, pass the production Python path:

```bash
sudo INSTALL_ROOT=/opt/enterprise-agent-platform PYTHON_BIN=/usr/local/anaconda3/envs/py310/bin/python bash install.sh
```

Edit runtime configuration:

```bash
sudo vi /opt/enterprise-agent-platform/.env
```

Verify installation:

```bash
sudo INSTALL_ROOT=/opt/enterprise-agent-platform bash verify.sh
```

Run manually:

```bash
cd /opt/enterprise-agent-platform/app
set -a
. /opt/enterprise-agent-platform/.env
set +a
/opt/enterprise-agent-platform/venv/bin/uvicorn material_agent.app.main:app --host 0.0.0.0 --port 8000
```

Install as systemd service:

```bash
sudo cp deploy/enterprise-agent-platform.service /etc/systemd/system/
sudo systemctl daemon-reload
sudo systemctl enable enterprise-agent-platform
sudo systemctl start enterprise-agent-platform
sudo systemctl status enterprise-agent-platform
```

## Smoke Checks

```bash
curl http://127.0.0.1:8000/health
curl http://127.0.0.1:8000/api/agent-platform/agents
curl http://127.0.0.1:8000/api/agent-platform/model-gateway/routes
```

## Upgrade Procedure

1. Build a new offline bundle on the connected build machine.
2. Stop the service on the offline server.
3. Back up `/opt/enterprise-agent-platform/.env` and `/opt/enterprise-agent-platform/data`.
4. Run `install.sh` from the new bundle.
5. Restore or compare `.env` if needed.
6. Run `verify.sh`.
7. Start the service.

## Rollback Procedure

1. Stop the service.
2. Restore the previous `/opt/enterprise-agent-platform/app` directory and wheel set from backup.
3. Keep `/opt/enterprise-agent-platform/data` unless a migration explicitly requires rollback.
4. Run `verify.sh`.
5. Start the service.
