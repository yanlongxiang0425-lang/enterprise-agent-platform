from __future__ import annotations

from datetime import datetime, timezone
from pathlib import Path
from uuid import uuid4

from material_agent.core.config import settings
from material_agent.core.files import build_file_metadata
from material_agent.core.security import resolve_output_path, resolve_under_roots
from material_agent.domain.models import AgentRunRequest, AgentTask, AgentTaskEvent, AgentTaskEventType, AgentTaskStatus, AgentTaskType
from material_agent.repositories.task_repository import JsonFileTaskRepository, TaskRepository
from material_agent.services.completion_engine import MaterialCompletionEngine
from material_agent.services.knowledge_service import KnowledgeBaseService


def utc_now() -> str:
    return datetime.now(timezone.utc).isoformat(timespec="seconds")


class MaterialTaskService:
    def __init__(
        self,
        repository: TaskRepository | None = None,
        engine: MaterialCompletionEngine | None = None,
        knowledge_service: KnowledgeBaseService | None = None,
    ):
        self.repository = repository or JsonFileTaskRepository(settings.task_store_dir)
        self.engine = engine or MaterialCompletionEngine()
        self.knowledge_service = knowledge_service or KnowledgeBaseService()

    def _append_event(self, task: AgentTask, event_type: AgentTaskEventType, message: str = "", **details) -> None:
        self.repository.append_event(
            AgentTaskEvent(
                event_id=f"evt-{uuid4().hex[:12]}",
                task_id=task.task_id,
                event_type=event_type,
                created_at=utc_now(),
                message=message,
                details=details,
            )
        )

    def _refresh_file_metadata(self, task: AgentTask) -> None:
        metadata = {}
        for name, path in {**task.input_files, **task.output_files}.items():
            metadata[name] = build_file_metadata(path)
        task.file_metadata = metadata

    def create_pilot_task(
        self,
        knowledge_file: str | Path,
        template_file: str | Path,
        output_file: str | Path,
        *,
        limit: int = 100,
        created_by: str = "system",
    ) -> AgentTask:
        knowledge_path = resolve_under_roots(knowledge_file, settings.allowed_input_roots)
        template_path = resolve_under_roots(template_file, settings.allowed_input_roots)
        output_path = resolve_output_path(output_file, settings.output_dir)
        now = utc_now()
        task = AgentTask(
            task_id=f"mat-{uuid4().hex[:12]}",
            task_type=AgentTaskType.PILOT_COMPLETION,
            status=AgentTaskStatus.PENDING,
            created_at=now,
            updated_at=now,
            input_files={
                "knowledge_file": str(knowledge_path),
                "template_file": str(template_path),
            },
            output_files={"result_file": str(output_path)},
            params={"limit": limit},
            created_by=created_by,
        )
        self._refresh_file_metadata(task)
        saved = self.repository.save(task)
        self._append_event(saved, AgentTaskEventType.CREATED, "Task created", created_by=created_by)
        return saved

    def create_default_pilot_task(self, *, limit: int = 30, created_by: str = "system") -> AgentTask:
        output_file = f"试点物料_补全结果_{uuid4().hex[:8]}.xlsx"
        return self.create_pilot_task(
            settings.plm_knowledge_file,
            settings.target_template_file,
            output_file,
            limit=limit,
            created_by=created_by,
        )

    def create_knowledge_import_task(
        self,
        source_file: str | Path,
        *,
        name: str = "",
        created_by: str = "system",
    ) -> AgentTask:
        source_path = resolve_under_roots(source_file, settings.allowed_input_roots)
        knowledge_base_id = self.knowledge_service.allocate_knowledge_base_id()
        now = utc_now()
        task = AgentTask(
            task_id=f"kbimp-{uuid4().hex[:12]}",
            task_type=AgentTaskType.KNOWLEDGE_IMPORT,
            status=AgentTaskStatus.PENDING,
            created_at=now,
            updated_at=now,
            input_files={"source_file": str(source_path)},
            output_files={
                "artifact_file": str(self.knowledge_service.artifact_path(knowledge_base_id, source_path)),
                "manifest_file": str(self.knowledge_service.manifest_path(knowledge_base_id)),
            },
            params={"knowledge_base_id": knowledge_base_id, "name": name or source_path.stem},
            created_by=created_by,
        )
        self._refresh_file_metadata(task)
        saved = self.repository.save(task)
        self._append_event(saved, AgentTaskEventType.CREATED, "Knowledge import task created", created_by=created_by)
        return saved

    def get_task(self, task_id: str) -> AgentTask:
        return self.repository.get(task_id)

    def list_events(self, task_id: str):
        return self.repository.list_events(task_id)

    def mark_queued(self, task_id: str) -> AgentTask:
        task = self.repository.get(task_id)
        if task.status not in {AgentTaskStatus.PENDING, AgentTaskStatus.FAILED}:
            self._append_event(task, AgentTaskEventType.SKIPPED, "Task was not queued", status=task.status.value)
            return task
        task.status = AgentTaskStatus.QUEUED
        task.updated_at = utc_now()
        self.repository.save(task)
        self._append_event(task, AgentTaskEventType.QUEUED, "Task queued")
        return task

    def run_task(self, task_id: str) -> AgentTask:
        task = self.repository.get(task_id)
        if task.status == AgentTaskStatus.SUCCEEDED:
            self._append_event(task, AgentTaskEventType.SKIPPED, "Task already succeeded")
            return task
        if task.status == AgentTaskStatus.CANCELLED:
            self._append_event(task, AgentTaskEventType.SKIPPED, "Task was cancelled")
            return task
        if task.task_type == AgentTaskType.KNOWLEDGE_IMPORT:
            return self._run_knowledge_import(task)
        if task.task_type != AgentTaskType.PILOT_COMPLETION:
            raise ValueError(f"Unsupported task type: {task.task_type}")

        task.status = AgentTaskStatus.RUNNING
        task.updated_at = utc_now()
        task.error = ""
        self._refresh_file_metadata(task)
        self.repository.save(task)
        self._append_event(task, AgentTaskEventType.RUNNING, "Task execution started")

        try:
            result = self.engine.run_pilot_completion(
                AgentRunRequest(
                    knowledge_file=Path(task.input_files["knowledge_file"]),
                    template_file=Path(task.input_files["template_file"]),
                    output_file=Path(task.output_files["result_file"]),
                    limit=int(task.params.get("limit", 100)),
                    run_id=task.task_id,
                )
            )
            task.status = AgentTaskStatus.SUCCEEDED
            task.metrics = {
                "rows": result.rows,
                "fields": result.fields,
                "exceptions": result.exceptions,
                **result.metrics,
            }
            self._refresh_file_metadata(task)
            self._append_event(task, AgentTaskEventType.SUCCEEDED, "Task execution succeeded", metrics=task.metrics)
        except Exception as exc:
            task.status = AgentTaskStatus.FAILED
            task.error = str(exc)
            self._refresh_file_metadata(task)
            self._append_event(task, AgentTaskEventType.FAILED, "Task execution failed", error=task.error)
        finally:
            task.updated_at = utc_now()
            self.repository.save(task)
        return task

    def _run_knowledge_import(self, task: AgentTask) -> AgentTask:
        task.status = AgentTaskStatus.RUNNING
        task.updated_at = utc_now()
        task.error = ""
        self._refresh_file_metadata(task)
        self.repository.save(task)
        self._append_event(task, AgentTaskEventType.RUNNING, "Knowledge import started")

        try:
            manifest = self.knowledge_service.import_file(
                task.input_files["source_file"],
                task.params["knowledge_base_id"],
                task.params.get("name", ""),
            )
            task.status = AgentTaskStatus.SUCCEEDED
            task.metrics = {
                "progress": 100,
                "knowledge_base_id": manifest["knowledge_base_id"],
                "artifact_file": manifest["artifact_file"],
                "manifest_file": manifest["manifest_file"],
            }
            task.output_files["artifact_file"] = manifest["artifact_file"]
            task.output_files["manifest_file"] = manifest["manifest_file"]
            self._refresh_file_metadata(task)
            self._append_event(task, AgentTaskEventType.SUCCEEDED, "Knowledge import succeeded", metrics=task.metrics)
        except Exception as exc:
            task.status = AgentTaskStatus.FAILED
            task.error = str(exc)
            self._refresh_file_metadata(task)
            self._append_event(task, AgentTaskEventType.FAILED, "Knowledge import failed", error=task.error)
        finally:
            task.updated_at = utc_now()
            self.repository.save(task)
        return task
