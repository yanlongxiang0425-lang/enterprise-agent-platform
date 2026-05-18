# Enterprise Agent Platform - Material Classification Agent

`material_agent` 是通用 `enterprise-agent-platform` 底座上的首个业务智能体实现，负责物料分类补全和 Excel 主数据清洗。当前已支持两类样例流程，并补充了企业工程基础规范：

1. `试点物料 AI` 三文件流程：PLM 知识源 Excel + 目标模板 Excel -> 补全结果 Excel。
2. `AI测试文件` 五步流程：旧字段标准 + 新字段标准 -> 字段映射表；字段映射表 + 旧料号信息 -> 清洗结果表。

## Runtime

建议 Python 版本：`3.10+`。

当前机器可用 conda 环境：

```bash
/usr/local/anaconda3/envs/py310/bin/python --version
```

离线部署时建议提前下载 `requirements.txt` 中的 wheels 包，并保存在内网离线包仓库。

## Production Baseline

当前版本定位为“企业生产级工程骨架第一阶段”，已具备：

- 通用智能体底座：项目级命名为 `enterprise-agent-platform`，通用包为 `agent_platform`。
- Agent 注册表：当前注册 `material-classification`，后续可挂载指标、合同、知识库等其他智能体。
- 标准 Python 包配置：项目根目录 `pyproject.toml`。
- 环境变量配置：参考项目根目录 `.env.example`，避免在代码中固化生产路径。
- 路径安全控制：HTTP 自定义运行入口会限制输入文件根目录和输出目录。
- API 错误模型：同步长任务默认关闭，避免生产 HTTP 请求直接阻塞执行大 Excel。
- 回归测试：项目根目录 `tests/` 覆盖配置、路径安全、字段映射和样例流程。
- 容器化骨架：项目根目录 `Dockerfile`、`docker-compose.yml`。
- 任务化执行：支持创建任务、查询任务、执行任务，并用本地 JSON 仓储模拟后续数据库任务表。
- 任务事件与文件元数据：记录 created/running/succeeded/failed 事件，并采集输入输出文件大小和 SHA-256。
- 后台执行器抽象：提供本地 ThreadPool 执行器，后续可替换 Redis/Celery/RQ。

仍待进入下一阶段的能力：

- 异步任务队列和任务状态持久化。
- PostgreSQL/Redis 存储、审计表、文件指纹、数据库迁移脚本。
- LangGraph checkpoint、人审节点、失败重试和状态回放。
- OpenTelemetry/结构化日志/指标监控。
- 生产鉴权、租户隔离、上传文件杀毒和敏感字段脱敏。

## Commands

当前本地验证使用项目已有 `.vendor` 依赖：

```bash
PYTHONPATH=.vendor:. python3 -m material_agent.cli inspect-samples
PYTHONPATH=.vendor:. python3 -m material_agent.cli list-agents
PYTHONPATH=.vendor:. python3 -m material_agent.cli run-pilot --limit 30
PYTHONPATH=.vendor:. python3 -m material_agent.cli run-five-step
PYTHONPATH=.vendor:. python3 -m unittest discover -s tests -v
```

任务化验证：

```bash
PYTHONPATH=.vendor:. python3 -m material_agent.cli create-pilot-task --limit 30 --created-by cli
PYTHONPATH=.vendor:. python3 -m material_agent.cli task-status <task_id>
PYTHONPATH=.vendor:. python3 -m material_agent.cli run-task <task_id>
PYTHONPATH=.vendor:. python3 -m material_agent.cli task-status <task_id>
PYTHONPATH=.vendor:. python3 -m material_agent.cli task-events <task_id>
```

生产环境安装依赖后可使用 Python 3.10 conda 环境运行：

```bash
/usr/local/anaconda3/envs/py310/bin/python -m pip install --no-index --find-links ./offline_wheels -r material_agent/requirements.txt
/usr/local/anaconda3/envs/py310/bin/python -m material_agent.cli run-pilot --limit 30
```

生产推荐使用任务接口：

```text
GET  /api/agent-platform/agents
GET  /api/agent-platform/capabilities/tools
GET  /api/agent-platform/capabilities/mcp-servers
GET  /api/agent-platform/capabilities/skills
GET  /api/agent-platform/model-gateway/routes
POST /api/agent-platform/tasks/material-classification/default
POST /api/agent-platform/tasks/material-classification
GET  /api/agent-platform/tasks/{task_id}
GET  /api/agent-platform/tasks/{task_id}/events
POST /api/agent-platform/tasks/{task_id}/submit
POST /api/agent-platform/knowledge-bases/import
GET  /api/agent-platform/knowledge-bases
GET  /api/agent-platform/knowledge-bases/{knowledge_base_id}
POST /api/agent-platform/knowledge-bases/{knowledge_base_id}/export
GET  /api/agent-platform/knowledge-bases/{knowledge_base_id}/download
```

## Structure

```text
material_agent/
  core/                 # runtime config and logging
  domain/               # request/result/domain models
  adapters/excel/       # Excel read/write and workbook profiling
  services/             # knowledge loading, template parsing, mapping, completion
  graph/                # LangGraph state/nodes/builder with linear fallback
  api/                  # FastAPI route handlers
  app/main.py           # FastAPI app factory
  cli.py                # local validation CLI
```

The graph layer tries to use LangGraph when installed. If LangGraph is absent in the offline CPU validation environment, it falls back to `LinearMaterialAgentRunner` so Excel processing can still be verified.

## Outputs

Generated files are written to:

```text
交付物/material_agent_outputs/
```
