# Operations Runbook

## Health

```bash
curl http://127.0.0.1:8000/health
```

Expected:

```json
{"status":"ok","component":"enterprise-agent-platform"}
```

## List Platform Capabilities

```bash
curl http://127.0.0.1:8000/api/agent-platform/agents
curl http://127.0.0.1:8000/api/agent-platform/capabilities/tools
curl http://127.0.0.1:8000/api/agent-platform/model-gateway/routes
```

## Task Troubleshooting

Check task:

```bash
curl http://127.0.0.1:8000/api/agent-platform/tasks/<task_id>
```

Check events:

```bash
curl http://127.0.0.1:8000/api/agent-platform/tasks/<task_id>/events
```

Common states:

| Status | Meaning | Action |
|---|---|---|
| `pending` | Created but not submitted | Submit or run the task |
| `queued` | Accepted by executor | Wait or inspect worker |
| `running` | Currently executing | Watch events and logs |
| `succeeded` | Finished successfully | Download/export artifacts |
| `failed` | Execution failed | Read `error` and event details |

## Knowledge Base

List knowledge bases:

```bash
curl http://127.0.0.1:8000/api/agent-platform/knowledge-bases
```

Export manifest:

```bash
curl -X POST http://127.0.0.1:8000/api/agent-platform/knowledge-bases/<kb_id>/export
```

Download paths:

```bash
curl http://127.0.0.1:8000/api/agent-platform/knowledge-bases/<kb_id>/download
```

## Local CLI Verification

```bash
PYTHONPATH=.vendor:. python3 -m material_agent.cli list-agents
PYTHONPATH=.vendor:. python3 -m material_agent.cli list-tools
PYTHONPATH=.vendor:. python3 -m material_agent.cli list-model-routes
```
