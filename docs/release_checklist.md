# Release Checklist

## Pre-Release

- [ ] Version updated in `pyproject.toml`.
- [ ] `material_agent/requirements.txt` reviewed for offline wheel compatibility.
- [ ] `make verify` passes in the development environment.
- [ ] Offline bundle builds with `make offline-bundle`.
- [ ] Offline install verified in a clean VM or container.
- [ ] API namespace remains `/api/agent-platform/...`.
- [ ] No `.env`, `.vendor`, task stores, knowledge stores or generated runtime outputs are committed.

## Verification Commands

```bash
make compile
make test
make sample-pilot
make sample-five-step
make offline-bundle
INSTALL_ROOT=/private/tmp/eap-offline-install bash dist/offline/enterprise-agent-platform-<version>/install.sh
INSTALL_ROOT=/private/tmp/eap-offline-install bash dist/offline/enterprise-agent-platform-<version>/verify.sh
```

## Release Artifacts

- Source repository commit SHA.
- Offline tarball: `dist/offline/enterprise-agent-platform-<version>.tar.gz`.
- Deployment environment template: `deploy/offline/env.production.example`.
- Database schema draft: `deploy/sql/001_task_schema.sql`.
- Release notes or phase report under `交付物/`.

## Post-Release

- [ ] Git tag created.
- [ ] GitHub release or internal artifact uploaded.
- [ ] Offline package checksum recorded.
- [ ] Deployment smoke test attached to release record.
