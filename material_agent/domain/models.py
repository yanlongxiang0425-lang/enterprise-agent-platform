from __future__ import annotations

from dataclasses import dataclass, field
from enum import Enum
from pathlib import Path
from typing import Any, Dict, List, Optional


Record = Dict[str, str]


@dataclass(frozen=True)
class SheetProfile:
    name: str
    rows: int
    cols: int
    header_row: int
    headers: List[str]
    sample: List[Record] = field(default_factory=list)


@dataclass(frozen=True)
class WorkbookProfile:
    file: str
    sheets: List[SheetProfile]


@dataclass
class KnowledgeBase:
    rows: List[Record]
    by_number: Dict[str, Record]
    by_old_number: Dict[str, Record]


@dataclass(frozen=True)
class TargetField:
    name: str
    group: str = ""
    required: str = ""
    rule: str = ""
    source_column: str = ""


@dataclass(frozen=True)
class FieldMapping:
    target_field: str
    source_field: str
    strategy: str
    confidence: float = 1.0
    reason: str = ""


@dataclass
class CompletionIssue:
    material_code: str
    field: str
    reason: str
    suggestion: str = ""


@dataclass
class CompletionResult:
    output: Path
    rows: int
    fields: int
    exceptions: int
    artifacts: Dict[str, Path] = field(default_factory=dict)
    metrics: Dict[str, Any] = field(default_factory=dict)


@dataclass
class AgentRunRequest:
    knowledge_file: Path
    template_file: Path
    output_file: Path
    limit: int = 100
    run_id: Optional[str] = None


class AgentTaskType(str, Enum):
    PILOT_COMPLETION = "pilot_completion"
    FIVE_STEP_CLEANING = "five_step_cleaning"
    KNOWLEDGE_IMPORT = "knowledge_import"
    KNOWLEDGE_EXPORT = "knowledge_export"


class AgentTaskStatus(str, Enum):
    PENDING = "pending"
    QUEUED = "queued"
    RUNNING = "running"
    SUCCEEDED = "succeeded"
    FAILED = "failed"
    CANCELLED = "cancelled"


class AgentTaskEventType(str, Enum):
    CREATED = "created"
    QUEUED = "queued"
    RUNNING = "running"
    SUCCEEDED = "succeeded"
    FAILED = "failed"
    SKIPPED = "skipped"
    CANCELLED = "cancelled"


@dataclass(frozen=True)
class FileMetadata:
    path: str
    exists: bool
    size_bytes: int = 0
    sha256: str = ""


@dataclass(frozen=True)
class AgentTaskEvent:
    event_id: str
    task_id: str
    event_type: AgentTaskEventType
    created_at: str
    message: str = ""
    details: Dict[str, Any] = field(default_factory=dict)


@dataclass
class AgentTask:
    task_id: str
    task_type: AgentTaskType
    status: AgentTaskStatus
    created_at: str
    updated_at: str
    input_files: Dict[str, str]
    output_files: Dict[str, str] = field(default_factory=dict)
    params: Dict[str, Any] = field(default_factory=dict)
    metrics: Dict[str, Any] = field(default_factory=dict)
    file_metadata: Dict[str, FileMetadata] = field(default_factory=dict)
    error: str = ""
    created_by: str = "system"
