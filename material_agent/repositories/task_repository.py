from __future__ import annotations

import json
from dataclasses import asdict
from pathlib import Path
from typing import List, Protocol

from material_agent.domain.models import (
    AgentTask,
    AgentTaskEvent,
    AgentTaskEventType,
    AgentTaskStatus,
    AgentTaskType,
    FileMetadata,
)


class TaskNotFoundError(KeyError):
    """Raised when a task id cannot be found in the task repository."""


class TaskRepository(Protocol):
    def save(self, task: AgentTask) -> AgentTask: ...

    def get(self, task_id: str) -> AgentTask: ...

    def list(self) -> List[AgentTask]: ...

    def append_event(self, event: AgentTaskEvent) -> AgentTaskEvent: ...

    def list_events(self, task_id: str) -> List[AgentTaskEvent]: ...


class JsonFileTaskRepository:
    """Small local repository that mirrors the future database task table shape."""

    def __init__(self, root: Path):
        self.root = root
        self.root.mkdir(parents=True, exist_ok=True)

    def _path(self, task_id: str) -> Path:
        return self.root / f"{task_id}.json"

    def _events_path(self, task_id: str) -> Path:
        return self.root / f"{task_id}.events.jsonl"

    def _metadata_payload(self, metadata: dict[str, FileMetadata]) -> dict:
        return {name: asdict(value) for name, value in metadata.items()}

    def save(self, task: AgentTask) -> AgentTask:
        self.root.mkdir(parents=True, exist_ok=True)
        payload = asdict(task)
        payload["task_type"] = task.task_type.value
        payload["status"] = task.status.value
        payload["file_metadata"] = self._metadata_payload(task.file_metadata)
        self._path(task.task_id).write_text(json.dumps(payload, ensure_ascii=False, indent=2), encoding="utf-8")
        return task

    def get(self, task_id: str) -> AgentTask:
        path = self._path(task_id)
        if not path.exists():
            raise TaskNotFoundError(task_id)
        payload = json.loads(path.read_text(encoding="utf-8"))
        return AgentTask(
            task_id=payload["task_id"],
            task_type=AgentTaskType(payload["task_type"]),
            status=AgentTaskStatus(payload["status"]),
            created_at=payload["created_at"],
            updated_at=payload["updated_at"],
            input_files=payload.get("input_files", {}),
            output_files=payload.get("output_files", {}),
            params=payload.get("params", {}),
            metrics=payload.get("metrics", {}),
            file_metadata={
                name: FileMetadata(**metadata)
                for name, metadata in payload.get("file_metadata", {}).items()
            },
            error=payload.get("error", ""),
            created_by=payload.get("created_by", "system"),
        )

    def list(self) -> List[AgentTask]:
        return [self.get(path.stem) for path in sorted(self.root.glob("*.json"))]

    def append_event(self, event: AgentTaskEvent) -> AgentTaskEvent:
        self.root.mkdir(parents=True, exist_ok=True)
        payload = asdict(event)
        payload["event_type"] = event.event_type.value
        with self._events_path(event.task_id).open("a", encoding="utf-8") as file:
            file.write(json.dumps(payload, ensure_ascii=False) + "\n")
        return event

    def list_events(self, task_id: str) -> List[AgentTaskEvent]:
        path = self._events_path(task_id)
        if not path.exists():
            return []
        events: List[AgentTaskEvent] = []
        for line in path.read_text(encoding="utf-8").splitlines():
            if not line.strip():
                continue
            payload = json.loads(line)
            events.append(
                AgentTaskEvent(
                    event_id=payload["event_id"],
                    task_id=payload["task_id"],
                    event_type=AgentTaskEventType(payload["event_type"]),
                    created_at=payload["created_at"],
                    message=payload.get("message", ""),
                    details=payload.get("details", {}),
                )
            )
        return events
