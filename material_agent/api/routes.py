from __future__ import annotations

from dataclasses import asdict

from agent_platform.capabilities import default_capability_registry, register_builtin_capabilities
from agent_platform.model_gateway import default_model_gateway, register_builtin_model_routes
from agent_platform.registry import default_registry
from material_agent.agent_definition import register_material_agent
from material_agent.api.errors import InvalidRequest, NotFound
from material_agent.api.schemas import AgentDefinitionResponse, CreatePilotTaskRequest, TaskEventResponse, TaskResponse
from material_agent.repositories.task_repository import TaskNotFoundError
from material_agent.services.completion_engine import MaterialCompletionEngine
from material_agent.services.task_executor import ThreadPoolTaskExecutor
from material_agent.services.task_service import MaterialTaskService


register_material_agent()
register_builtin_capabilities()
register_builtin_model_routes()
engine = MaterialCompletionEngine()
task_service = MaterialTaskService(engine=engine)
task_executor = ThreadPoolTaskExecutor(task_service)
MAX_SYNC_LIMIT = 500


def _validate_limit(limit: int) -> int:
    if limit < 1:
        raise InvalidRequest("limit must be greater than 0")
    if limit > MAX_SYNC_LIMIT:
        raise InvalidRequest(f"limit must be less than or equal to {MAX_SYNC_LIMIT}")
    return limit


def health() -> dict:
    return {"status": "ok", "component": "enterprise-agent-platform", "agents": len(default_registry.list())}


def list_agents() -> list[dict]:
    return [
        AgentDefinitionResponse(
            agent_key=agent.agent_key,
            display_name=agent.display_name,
            version=agent.version,
            description=agent.description,
            task_types=agent.task_types,
        ).__dict__
        for agent in default_registry.list()
    ]


def list_tools() -> list[dict]:
    return [asdict(tool) for tool in default_capability_registry.list_tools()]


def list_mcp_servers() -> list[dict]:
    return [asdict(server) for server in default_capability_registry.list_mcp_servers()]


def list_skills() -> list[dict]:
    return [asdict(skill) for skill in default_capability_registry.list_skills()]


def list_model_routes() -> list[dict]:
    return [asdict(route) for route in default_model_gateway.list_routes()]


def select_model_route(purpose: str) -> dict:
    try:
        return asdict(default_model_gateway.select_route(purpose))
    except KeyError:
        raise NotFound(f"Model route not found for purpose: {purpose}") from None


def _task_response(task) -> dict:
    return TaskResponse(
        task_id=task.task_id,
        task_type=task.task_type.value,
        status=task.status.value,
        created_at=task.created_at,
        updated_at=task.updated_at,
        input_files=task.input_files,
        output_files=task.output_files,
        params=task.params,
        metrics=task.metrics,
        file_metadata={
            name: {
                "path": metadata.path,
                "exists": metadata.exists,
                "size_bytes": metadata.size_bytes,
                "sha256": metadata.sha256,
            }
            for name, metadata in task.file_metadata.items()
        },
        error=task.error,
        created_by=task.created_by,
    ).__dict__


def _event_response(event) -> dict:
    return TaskEventResponse(
        event_id=event.event_id,
        task_id=event.task_id,
        event_type=event.event_type.value,
        created_at=event.created_at,
        message=event.message,
        details=event.details,
    ).__dict__


def create_default_pilot_task(limit: int = 30, created_by: str = "system") -> dict:
    limit = _validate_limit(limit)
    return _task_response(task_service.create_default_pilot_task(limit=limit, created_by=created_by))


def create_pilot_task(knowledge_file: str, template_file: str, output_file: str, limit: int = 100, created_by: str = "system") -> dict:
    request = CreatePilotTaskRequest(knowledge_file, template_file, output_file, _validate_limit(limit), created_by)
    task = task_service.create_pilot_task(
        request.knowledge_file,
        request.template_file,
        request.output_file,
        limit=request.limit,
        created_by=request.created_by,
    )
    return _task_response(task)


def create_knowledge_import_task(source_file: str, name: str = "", created_by: str = "system") -> dict:
    return _task_response(task_service.create_knowledge_import_task(source_file, name=name, created_by=created_by))


def get_task(task_id: str) -> dict:
    try:
        return _task_response(task_service.get_task(task_id))
    except TaskNotFoundError:
        raise NotFound(f"Task not found: {task_id}") from None


def list_task_events(task_id: str) -> list[dict]:
    try:
        task_service.get_task(task_id)
        return [_event_response(event) for event in task_service.list_events(task_id)]
    except TaskNotFoundError:
        raise NotFound(f"Task not found: {task_id}") from None


def run_task(task_id: str) -> dict:
    try:
        return _task_response(task_service.run_task(task_id))
    except TaskNotFoundError:
        raise NotFound(f"Task not found: {task_id}") from None


def submit_task(task_id: str) -> dict:
    try:
        return _task_response(task_executor.submit(task_id))
    except TaskNotFoundError:
        raise NotFound(f"Task not found: {task_id}") from None


def list_knowledge_bases() -> list[dict]:
    return task_service.knowledge_service.list_manifests()


def get_knowledge_base(knowledge_base_id: str) -> dict:
    try:
        return task_service.knowledge_service.get_manifest(knowledge_base_id)
    except FileNotFoundError:
        raise NotFound(f"Knowledge base not found: {knowledge_base_id}") from None


def export_knowledge_base(knowledge_base_id: str) -> dict:
    try:
        output = task_service.knowledge_service.export_manifest(knowledge_base_id)
        return {"knowledge_base_id": knowledge_base_id, "export_file": str(output)}
    except FileNotFoundError:
        raise NotFound(f"Knowledge base not found: {knowledge_base_id}") from None


def download_knowledge_base(knowledge_base_id: str) -> dict:
    manifest = get_knowledge_base(knowledge_base_id)
    return {
        "knowledge_base_id": knowledge_base_id,
        "artifact_file": manifest["artifact_file"],
        "manifest_file": manifest["manifest_file"],
    }
