from __future__ import annotations

from pathlib import Path

from material_agent.adapters.excel.workbook import ExcelWorkbookReader


def inspect_excel(path: str | Path) -> dict:
    return ExcelWorkbookReader().profile(Path(path)).__dict__

