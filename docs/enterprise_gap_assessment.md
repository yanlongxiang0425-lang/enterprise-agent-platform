# Enterprise Gap Assessment

## Current Status

The project has moved from a single material-classification agent prototype to an enterprise-agent-platform skeleton. It now includes:

- Platform naming and `/api/agent-platform/...` API namespace.
- Agent registry with `material-classification` as the first capability.
- Task lifecycle, event log, file metadata and local JSON persistence.
- Tool/MCP/Skill registry skeleton.
- Model Gateway route registry skeleton.
- Knowledge-base import/export/download-path skeleton.
- PostgreSQL schema draft.
- Tests for platform, task, capability, model route, knowledge-base and sample flows.
- Docker and offline deployment scaffolding.

## Gaps Fixed In This Iteration

| Area | Previous Gap | Fix |
|---|---|---|
| Offline delivery | No standard offline package flow | Added offline bundle build/install/verify scripts |
| Release discipline | No deployment checklist | Added offline deployment guide and release checklist |
| Runtime operation | No Makefile standard commands | Added `Makefile` with test/verify/sample targets |
| Container hygiene | Build context included local outputs | Added `.dockerignore` |
| Production env | Only local `.env.example` | Added `deploy/offline/env.production.example` |
| Service management | No Linux service template | Added systemd unit template |
| Dependency compatibility | Offline package could resolve incompatible transitive wheels | Pinned `numpy>=1.24,<2.0` for `pandas==2.0.3` and aligned `uvicorn` package metadata |

## Remaining Enterprise Gaps

| Area | Current State | Next Production Step |
|---|---|---|
| Persistence | JSON files | Implement PostgreSQL repositories and migrations |
| Queue/worker | Local thread pool | Add Redis/RQ/Celery executor and task locks |
| File storage | Local filesystem paths | Add object storage abstraction and signed download URLs |
| Knowledge base | Manifest + workbook profile | Add chunking, embedding, vector index and retrieval APIs |
| Security | Path constraints only | Add authn/authz, tenant isolation, rate limits and audit policy |
| Observability | Basic logs | Add structured logging, metrics and OpenTelemetry traces |
| Model gateway | Static route registry | Add provider adapters, circuit breaker, quota and fallback |
| Tool/MCP/Skill | Static registry | Add database-backed registry and runtime enable/disable |
| HITL | Not implemented | Add human review workflow and approval tasks |
| CI/CD | Local tests only | Add GitHub Actions or enterprise CI pipeline |

## Offline Package Verification Result

- Built package: `dist/offline/enterprise-agent-platform-0.4.0.tar.gz`
- Manifest included: `enterprise-agent-platform-0.4.0/OFFLINE_MANIFEST.txt`
- Python used for build: `Python 3.10.18`
- Local offline install simulation: `/private/tmp/eap-offline-install-0.4.0-final`
- Verification result: `offline verification passed`

## Recommended Next Phase

1. Introduce repository interfaces for PostgreSQL implementations.
2. Add a queue-backed executor and task lock.
3. Add upload API and object-storage compatible artifact service.
4. Add knowledge chunking and retrieval APIs.
5. Add authentication middleware and audit log policy.
