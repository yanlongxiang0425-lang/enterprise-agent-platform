from __future__ import annotations

from dataclasses import dataclass
from typing import Any, Dict


@dataclass(frozen=True)
class CreatePilotTaskRequest:
    knowledge_file: str
    template_file: str
    output_file: str
    limit: int = 100
    created_by: str = "system"


@dataclass(frozen=True)
class TaskResponse:
    task_id: str
    task_type: str
    status: str
    created_at: str
    updated_at: str
    input_files: Dict[str, str]
    output_files: Dict[str, str]
    params: Dict[str, Any]
    metrics: Dict[str, Any]
    file_metadata: Dict[str, Any]
    error: str
    created_by: str


@dataclass(frozen=True)
class TaskEventResponse:
    event_id: str
    task_id: str
    event_type: str
    created_at: str
    message: str
    details: Dict[str, Any]


@dataclass(frozen=True)
class AgentDefinitionResponse:
    agent_key: str
    display_name: str
    version: str
    description: str
    task_types: list[str]
