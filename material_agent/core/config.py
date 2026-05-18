from __future__ import annotations

import os
from dataclasses import dataclass, field
from pathlib import Path
from typing import Tuple


def _path_from_env(name: str, default: str | Path) -> Path:
    return Path(os.getenv(name, str(default))).expanduser()


def _int_from_env(name: str, default: int) -> int:
    raw = os.getenv(name)
    return default if raw is None else int(raw)


def _float_from_env(name: str, default: float) -> float:
    raw = os.getenv(name)
    return default if raw is None else float(raw)


def _bool_from_env(name: str, default: bool) -> bool:
    raw = os.getenv(name)
    if raw is None:
        return default
    return raw.strip().lower() in {"1", "true", "yes", "y", "on"}


def _tuple_paths_from_env(name: str, defaults: Tuple[Path, ...]) -> Tuple[Path, ...]:
    raw = os.getenv(name)
    if not raw:
        return defaults
    return tuple(Path(part.strip()).expanduser() for part in raw.split(os.pathsep) if part.strip())


@dataclass(frozen=True)
class MaterialAgentSettings:
    """Runtime configuration for the material classification completion agent."""

    projects_root: Path = field(
        default_factory=lambda: _path_from_env("MATERIAL_AGENT_PROJECTS_ROOT", "/Users/yanlongxiang/Documents/Claude/Projects")
    )
    output_dir: Path = field(default_factory=lambda: _path_from_env("MATERIAL_AGENT_OUTPUT_DIR", Path("交付物") / "material_agent_outputs"))
    task_store_dir: Path = field(default_factory=lambda: _path_from_env("MATERIAL_AGENT_TASK_STORE_DIR", Path("交付物") / "material_agent_tasks"))
    knowledge_store_dir: Path = field(default_factory=lambda: _path_from_env("AGENT_PLATFORM_KNOWLEDGE_STORE_DIR", Path("交付物") / "knowledge_bases"))
    max_preview_rows: int = field(default_factory=lambda: _int_from_env("MATERIAL_AGENT_MAX_PREVIEW_ROWS", 30))
    retrieval_top_k: int = field(default_factory=lambda: _int_from_env("MATERIAL_AGENT_RETRIEVAL_TOP_K", 5))
    confidence_threshold: float = field(default_factory=lambda: _float_from_env("MATERIAL_AGENT_CONFIDENCE_THRESHOLD", 0.72))
    audit_enabled: bool = field(default_factory=lambda: _bool_from_env("MATERIAL_AGENT_AUDIT_ENABLED", True))
    model_provider: str = field(default_factory=lambda: os.getenv("MATERIAL_AGENT_MODEL_PROVIDER", "offline"))
    model_name: str = field(default_factory=lambda: os.getenv("MATERIAL_AGENT_MODEL_NAME", "rule-first"))
    run_sync_api: bool = field(default_factory=lambda: _bool_from_env("MATERIAL_AGENT_RUN_SYNC_API", False))

    @property
    def allowed_input_roots(self) -> Tuple[Path, ...]:
        return _tuple_paths_from_env("MATERIAL_AGENT_ALLOWED_INPUT_ROOTS", (self.projects_root,))

    @property
    def pilot_dir(self) -> Path:
        return self.projects_root / "AI物料测试" / "试点物料 AI"

    @property
    def five_step_dir(self) -> Path:
        return self.projects_root / "AI测试文件"

    @property
    def plm_knowledge_file(self) -> Path:
        return self.pilot_dir / "IOT PLM TV整机-TV成品-TV整机  100201.xls"

    @property
    def target_template_file(self) -> Path:
        return self.pilot_dir / "10整机-TV成品-TV整机 目标模板.xlsx"

    @property
    def pilot_sample_output_file(self) -> Path:
        return self.pilot_dir / "10整机-TV成品-TV整机-数据清洗试点_何海珍 20260509.xlsx"

    @property
    def old_standard_file(self) -> Path:
        return self.five_step_dir / "第1步：输入1-旧字段标准.xls"

    @property
    def new_standard_file(self) -> Path:
        return self.five_step_dir / "第2步：输入2-新字段标准.xls"

    @property
    def standard_mapping_file(self) -> Path:
        return self.five_step_dir / "第3步：根据第1步第2步输出-新旧字段标准映射表.xls"

    @property
    def old_material_file(self) -> Path:
        return self.five_step_dir / "第4步：输入3-旧料号信息.xls"

    @property
    def five_step_expected_output_file(self) -> Path:
        return self.five_step_dir / "第5步：根据第3步输出和第4步输入3输出清洗结果表.xls"


settings = MaterialAgentSettings()
