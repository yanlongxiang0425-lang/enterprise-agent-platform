from __future__ import annotations

import argparse
import json
from dataclasses import asdict
from uuid import uuid4

from agent_platform.registry import default_registry
from material_agent.agent_definition import register_material_agent
from material_agent.adapters.excel.workbook import ExcelWorkbookReader
from material_agent.core.config import settings
from material_agent.domain.models import AgentRunRequest
from material_agent.graph.builder import build_material_graph
from material_agent.services.completion_engine import MaterialCompletionEngine
from material_agent.services.task_executor import ThreadPoolTaskExecutor
from material_agent.services.task_service import MaterialTaskService


register_material_agent()


def _json_print(payload) -> None:
    print(json.dumps(payload, ensure_ascii=False, indent=2, default=str))


def cmd_inspect_samples(_args):
    reader = ExcelWorkbookReader()
    paths = [
        settings.plm_knowledge_file,
        settings.target_template_file,
        settings.pilot_sample_output_file,
        settings.old_standard_file,
        settings.new_standard_file,
        settings.standard_mapping_file,
        settings.old_material_file,
        settings.five_step_expected_output_file,
    ]
    _json_print([asdict(reader.profile(path)) for path in paths])


def cmd_run_pilot(args):
    settings.output_dir.mkdir(parents=True, exist_ok=True)
    output = settings.output_dir / "试点物料_补全结果_本地验证.xlsx"
    graph = build_material_graph()
    result_state = graph.invoke(
        {
            "run_id": f"pilot-{uuid4().hex[:8]}",
            "knowledge_file": settings.plm_knowledge_file,
            "template_file": settings.target_template_file,
            "output_file": output,
            "limit": args.limit,
        }
    )
    _json_print(result_state.get("result", result_state))


def cmd_run_five_step(_args):
    settings.output_dir.mkdir(parents=True, exist_ok=True)
    engine = MaterialCompletionEngine()
    mapping_output = settings.output_dir / "第3步_新旧字段标准映射表_本地生成.xlsx"
    mapping_df = engine.build_mapping_from_files(settings.old_standard_file, settings.new_standard_file)
    mapping_df.to_excel(mapping_output, index=False)

    result_output = settings.output_dir / "第5步_清洗结果表_本地生成.xlsx"
    result = engine.transform_old_material(settings.old_material_file, settings.standard_mapping_file, result_output)
    _json_print(
        {
            "fields": result.fields,
            "rows": result.rows,
            "exceptions": result.exceptions,
            "output": str(result.output),
            "mapping_output": str(mapping_output),
        }
    )


def cmd_run_custom(args):
    engine = MaterialCompletionEngine()
    result = engine.run_pilot_completion(
        AgentRunRequest(
            knowledge_file=args.knowledge_file,
            template_file=args.template_file,
            output_file=args.output_file,
            limit=args.limit,
        )
    )
    _json_print({"rows": result.rows, "fields": result.fields, "exceptions": result.exceptions, "output": result.output})


def cmd_create_pilot_task(args):
    service = MaterialTaskService()
    task = service.create_default_pilot_task(limit=args.limit, created_by=args.created_by)
    _json_print(asdict(task))


def cmd_task_status(args):
    service = MaterialTaskService()
    _json_print(asdict(service.get_task(args.task_id)))


def cmd_task_events(args):
    service = MaterialTaskService()
    _json_print([asdict(event) for event in service.list_events(args.task_id)])


def cmd_run_task(args):
    service = MaterialTaskService()
    _json_print(asdict(service.run_task(args.task_id)))


def cmd_submit_task(args):
    service = MaterialTaskService()
    executor = ThreadPoolTaskExecutor(service)
    _json_print(asdict(executor.submit(args.task_id)))


def cmd_list_agents(_args):
    _json_print([asdict(agent) for agent in default_registry.list()])


def cmd_list_tools(_args):
    from material_agent.api import routes

    _json_print(routes.list_tools())


def cmd_list_model_routes(_args):
    from material_agent.api import routes

    _json_print(routes.list_model_routes())


def cmd_create_knowledge_import_task(args):
    service = MaterialTaskService()
    task = service.create_knowledge_import_task(args.source_file, name=args.name, created_by=args.created_by)
    _json_print(asdict(task))


def cmd_list_knowledge_bases(_args):
    service = MaterialTaskService()
    _json_print(service.knowledge_service.list_manifests())


def build_parser():
    parser = argparse.ArgumentParser(description="物料分类补全 Agent 本地验证 CLI")
    sub = parser.add_subparsers(dest="command", required=True)

    inspect = sub.add_parser("inspect-samples", help="输出样例文件结构")
    inspect.set_defaults(func=cmd_inspect_samples)

    agents = sub.add_parser("list-agents", help="列出当前平台注册的智能体能力")
    agents.set_defaults(func=cmd_list_agents)

    tools = sub.add_parser("list-tools", help="列出平台工具能力")
    tools.set_defaults(func=cmd_list_tools)

    model_routes = sub.add_parser("list-model-routes", help="列出 Model Gateway 路由")
    model_routes.set_defaults(func=cmd_list_model_routes)

    pilot = sub.add_parser("run-pilot", help="基于试点物料AI三文件生成补全结果")
    pilot.add_argument("--limit", type=int, default=30, help="验证时输出的知识库行数")
    pilot.set_defaults(func=cmd_run_pilot)

    five = sub.add_parser("run-five-step", help="基于AI测试文件五步样例生成映射和清洗结果")
    five.set_defaults(func=cmd_run_five_step)

    custom = sub.add_parser("run-custom", help="使用自定义知识库和模板执行补全")
    custom.add_argument("--knowledge-file", required=True)
    custom.add_argument("--template-file", required=True)
    custom.add_argument("--output-file", required=True)
    custom.add_argument("--limit", type=int, default=100)
    custom.set_defaults(func=cmd_run_custom)

    create_task = sub.add_parser("create-pilot-task", help="创建默认试点物料补全任务，不立即执行")
    create_task.add_argument("--limit", type=int, default=30)
    create_task.add_argument("--created-by", default="cli")
    create_task.set_defaults(func=cmd_create_pilot_task)

    kb_import = sub.add_parser("create-knowledge-import-task", help="创建知识库导入任务")
    kb_import.add_argument("source_file")
    kb_import.add_argument("--name", default="")
    kb_import.add_argument("--created-by", default="cli")
    kb_import.set_defaults(func=cmd_create_knowledge_import_task)

    kb_list = sub.add_parser("list-knowledge-bases", help="列出已导入知识库")
    kb_list.set_defaults(func=cmd_list_knowledge_bases)

    task_status = sub.add_parser("task-status", help="查询任务状态")
    task_status.add_argument("task_id")
    task_status.set_defaults(func=cmd_task_status)

    task_events = sub.add_parser("task-events", help="查询任务事件日志")
    task_events.add_argument("task_id")
    task_events.set_defaults(func=cmd_task_events)

    run_task = sub.add_parser("run-task", help="执行一个已创建任务")
    run_task.add_argument("task_id")
    run_task.set_defaults(func=cmd_run_task)

    submit_task = sub.add_parser("submit-task", help="提交任务到本地后台执行器")
    submit_task.add_argument("task_id")
    submit_task.set_defaults(func=cmd_submit_task)
    return parser


def main():
    parser = build_parser()
    args = parser.parse_args()
    args.func(args)


if __name__ == "__main__":
    main()
