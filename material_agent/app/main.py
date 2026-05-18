from __future__ import annotations

try:
    from fastapi import FastAPI, Request
    from fastapi.responses import JSONResponse
except ImportError:  # pragma: no cover - allows CLI-only offline validation.
    FastAPI = None

from material_agent.api import routes
from material_agent.api.errors import ApiError


def create_app():
    if FastAPI is None:
        raise RuntimeError("FastAPI is not installed. Install project requirements to run the HTTP service.")

    app = FastAPI(title="Enterprise Agent Platform", version="0.4.0")

    @app.exception_handler(ApiError)
    async def api_error_handler(_request: Request, exc: ApiError):
        return JSONResponse(
            status_code=exc.status_code,
            content={"error": {"code": exc.code, "message": exc.message}},
        )

    @app.get("/health")
    def health():
        return routes.health()

    @app.get("/api/agent-platform/agents")
    def list_agents():
        return routes.list_agents()

    @app.get("/api/agent-platform/capabilities/tools")
    def list_tools():
        return routes.list_tools()

    @app.get("/api/agent-platform/capabilities/mcp-servers")
    def list_mcp_servers():
        return routes.list_mcp_servers()

    @app.get("/api/agent-platform/capabilities/skills")
    def list_skills():
        return routes.list_skills()

    @app.get("/api/agent-platform/model-gateway/routes")
    def list_model_routes():
        return routes.list_model_routes()

    @app.get("/api/agent-platform/model-gateway/routes/select")
    def select_model_route(purpose: str):
        return routes.select_model_route(purpose)

    @app.post("/api/agent-platform/tasks/material-classification/default")
    def create_platform_default_material_task(limit: int = 30, created_by: str = "system"):
        return routes.create_default_pilot_task(limit=limit, created_by=created_by)

    @app.post("/api/agent-platform/tasks/material-classification")
    def create_platform_material_task(knowledge_file: str, template_file: str, output_file: str, limit: int = 100, created_by: str = "system"):
        return routes.create_pilot_task(knowledge_file, template_file, output_file, limit=limit, created_by=created_by)

    @app.post("/api/agent-platform/knowledge-bases/import")
    def create_knowledge_import_task(source_file: str, name: str = "", created_by: str = "system"):
        return routes.create_knowledge_import_task(source_file, name=name, created_by=created_by)

    @app.get("/api/agent-platform/knowledge-bases")
    def list_knowledge_bases():
        return routes.list_knowledge_bases()

    @app.get("/api/agent-platform/knowledge-bases/{knowledge_base_id}")
    def get_knowledge_base(knowledge_base_id: str):
        return routes.get_knowledge_base(knowledge_base_id)

    @app.post("/api/agent-platform/knowledge-bases/{knowledge_base_id}/export")
    def export_knowledge_base(knowledge_base_id: str):
        return routes.export_knowledge_base(knowledge_base_id)

    @app.get("/api/agent-platform/knowledge-bases/{knowledge_base_id}/download")
    def download_knowledge_base(knowledge_base_id: str):
        return routes.download_knowledge_base(knowledge_base_id)

    @app.get("/api/agent-platform/tasks/{task_id}")
    def get_platform_task(task_id: str):
        return routes.get_task(task_id)

    @app.get("/api/agent-platform/tasks/{task_id}/events")
    def list_platform_task_events(task_id: str):
        return routes.list_task_events(task_id)

    @app.post("/api/agent-platform/tasks/{task_id}/submit")
    def submit_platform_task(task_id: str):
        return routes.submit_task(task_id)

    @app.post("/api/agent-platform/tasks/{task_id}/run")
    def run_platform_task(task_id: str):
        return routes.run_task(task_id)

    return app


app = create_app() if FastAPI is not None else None
