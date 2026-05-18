from __future__ import annotations

from pathlib import Path
from typing import Dict, List

from material_agent.adapters.excel.workbook import ExcelWorkbookReader
from material_agent.domain.models import KnowledgeBase, Record


class MaterialKnowledgeLoader:
    def __init__(self, reader: ExcelWorkbookReader | None = None):
        self.reader = reader or ExcelWorkbookReader()

    def load_plm_knowledge(self, path: Path) -> KnowledgeBase:
        sheets = self.reader.read_workbook(path)
        rows: List[Record] = []
        for sheet in sheets.values():
            if sheet.dataframe.empty:
                continue
            df = sheet.dataframe
            if not df.empty and str(df.iloc[0].get("类型", "")).lower() == "type":
                df = df.iloc[1:].reset_index(drop=True)
            for record in df.to_dict(orient="records"):
                if record.get("编号") or record.get("旧物料号"):
                    record["_sheet"] = sheet.name
                    rows.append(record)

        return KnowledgeBase(
            rows=rows,
            by_number={row.get("编号", ""): row for row in rows if row.get("编号")},
            by_old_number={row.get("旧物料号", ""): row for row in rows if row.get("旧物料号")},
        )

