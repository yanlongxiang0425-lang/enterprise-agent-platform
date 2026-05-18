from __future__ import annotations

import json
import shutil
from dataclasses import asdict
from pathlib import Path
from uuid import uuid4

from material_agent.adapters.excel.workbook import ExcelWorkbookReader
from material_agent.core.config import settings
from material_agent.core.files import build_file_metadata


class KnowledgeBaseService:
    def __init__(self, root: Path | None = None, reader: ExcelWorkbookReader | None = None):
        self.root = root or settings.knowledge_store_dir
        self.reader = reader or ExcelWorkbookReader()
        self.root.mkdir(parents=True, exist_ok=True)

    def allocate_knowledge_base_id(self) -> str:
        return f"kb-{uuid4().hex[:12]}"

    def knowledge_base_dir(self, knowledge_base_id: str) -> Path:
        return self.root / knowledge_base_id

    def manifest_path(self, knowledge_base_id: str) -> Path:
        return self.knowledge_base_dir(knowledge_base_id) / "manifest.json"

    def artifact_path(self, knowledge_base_id: str, source_file: str | Path) -> Path:
        return self.knowledge_base_dir(knowledge_base_id) / Path(source_file).name

    def import_file(self, source_file: str | Path, knowledge_base_id: str, name: str = "") -> dict:
        source = Path(source_file).expanduser().resolve()
        kb_dir = self.knowledge_base_dir(knowledge_base_id)
        kb_dir.mkdir(parents=True, exist_ok=True)
        artifact = self.artifact_path(knowledge_base_id, source)
        shutil.copy2(source, artifact)

        workbook_profile = {}
        if artifact.suffix.lower() in {".xls", ".xlsx"}:
            workbook_profile = asdict(self.reader.profile(artifact))

        manifest = {
            "knowledge_base_id": knowledge_base_id,
            "name": name or source.stem,
            "artifact_file": str(artifact),
            "manifest_file": str(self.manifest_path(knowledge_base_id)),
            "source_metadata": build_file_metadata(source).__dict__,
            "artifact_metadata": build_file_metadata(artifact).__dict__,
            "workbook_profile": workbook_profile,
            "progress": 100,
        }
        self.manifest_path(knowledge_base_id).write_text(json.dumps(manifest, ensure_ascii=False, indent=2), encoding="utf-8")
        return manifest

    def get_manifest(self, knowledge_base_id: str) -> dict:
        path = self.manifest_path(knowledge_base_id)
        if not path.exists():
            raise FileNotFoundError(f"Knowledge base not found: {knowledge_base_id}")
        return json.loads(path.read_text(encoding="utf-8"))

    def list_manifests(self) -> list[dict]:
        manifests = []
        for path in sorted(self.root.glob("kb-*/manifest.json")):
            manifests.append(json.loads(path.read_text(encoding="utf-8")))
        return manifests

    def export_manifest(self, knowledge_base_id: str, output_file: str | Path | None = None) -> Path:
        manifest = self.get_manifest(knowledge_base_id)
        output = Path(output_file).expanduser().resolve() if output_file else self.knowledge_base_dir(knowledge_base_id) / "export.json"
        output.parent.mkdir(parents=True, exist_ok=True)
        output.write_text(json.dumps(manifest, ensure_ascii=False, indent=2), encoding="utf-8")
        return output
