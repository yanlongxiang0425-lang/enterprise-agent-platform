from __future__ import annotations

from pathlib import Path
from typing import Any, Dict, List, TypedDict


class MaterialAgentState(TypedDict, total=False):
    run_id: str
    knowledge_file: Path
    template_file: Path
    output_file: Path
    limit: int
    workbook_profiles: List[Dict[str, Any]]
    fields: List[Dict[str, Any]]
    result: Dict[str, Any]
    issues: List[Dict[str, Any]]
    status: str

