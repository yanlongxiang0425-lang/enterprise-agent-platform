# Enterprise Agent Platform

企业级通用智能体底座。当前已注册的首个业务智能体是 `material-classification`，用于物料分类补全和 Excel 主数据清洗验证。

当前版本完成第一阶段生产化调整：

- 标准 Python 包配置：`pyproject.toml`
- 环境变量模板：`.env.example`
- 路径安全控制：`material_agent/core/security.py`
- API 错误模型：`material_agent/api/errors.py`
- 回归测试：`tests/`
- 容器化骨架：`Dockerfile`、`docker-compose.yml`
- 第二阶段任务化骨架：本地 JSON 任务仓储、任务创建/执行/查询 API 与 CLI
- 第三阶段执行准备：仓储协议、任务事件日志、文件 SHA-256 元数据、PostgreSQL 表结构草案
- 第四阶段平台化命名：`enterprise-agent-platform` 项目名、`agent_platform` 通用底座包、Agent 注册表、后台执行器、平台级 API
- 第五阶段平台入口：Tool/MCP/Skill、Model Gateway、知识库导入/导出/下载骨架
- 离线部署：提供离线依赖包构建、安装、验证脚本和 systemd 模板

本地样例验证：

```bash
make verify
PYTHONPATH=.vendor:. python3 -m material_agent.cli list-agents
```

离线部署：

```bash
make offline-bundle
```

更多文档：

- `docs/enterprise_gap_assessment.md`
- `docs/offline_deployment.md`
- `docs/operations_runbook.md`
- `docs/release_checklist.md`

详细工程说明见 `material_agent/README.md`。
