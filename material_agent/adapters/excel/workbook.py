from __future__ import annotations

from dataclasses import dataclass
from pathlib import Path
from typing import Dict, List, Optional

import pandas as pd

from material_agent.domain.models import SheetProfile, WorkbookProfile


def clean_cell(value) -> str:
    if pd.isna(value):
        return ""
    text = str(value).strip()
    if text.endswith(".0") and text[:-2].isdigit():
        return text[:-2]
    return text


def normalize_header(name: str) -> str:
    return str(name or "").strip().replace("\n", "").replace(" ", "")


def detect_header_row(raw: pd.DataFrame, max_scan_rows: int = 12) -> int:
    best_idx = 0
    best_score = -1
    keywords = ["编码", "名称", "字段", "属性", "分类", "物料", "旧", "新", "标准", "料号"]
    for idx in range(min(max_scan_rows, len(raw))):
        row_values = [clean_cell(v) for v in raw.iloc[idx].tolist()]
        non_empty = [v for v in row_values if v]
        keyword_hits = sum(any(k in v for k in keywords) for v in non_empty)
        score = len(non_empty) + keyword_hits * 3
        if score > best_score:
            best_score = score
            best_idx = idx
    return best_idx


def make_unique_headers(headers: List[str]) -> List[str]:
    seen: Dict[str, int] = {}
    result: List[str] = []
    for idx, header in enumerate(headers):
        name = header or f"列{idx + 1}"
        count = seen.get(name, 0)
        seen[name] = count + 1
        result.append(name if count == 0 else f"{name}_{count + 1}")
    return result


def find_column(columns: List[str], candidates: List[str]) -> str:
    normalized = {normalize_header(c): c for c in columns}
    for candidate in candidates:
        found = normalized.get(normalize_header(candidate))
        if found:
            return found
    for col in columns:
        ncol = normalize_header(col)
        if any(normalize_header(c) in ncol or ncol in normalize_header(c) for c in candidates):
            return col
    return ""


@dataclass
class SheetData:
    name: str
    raw_rows: int
    raw_cols: int
    header_row: int
    dataframe: pd.DataFrame


class ExcelWorkbookReader:
    def read_sheet(self, path: Path, sheet_name: str, header_row: Optional[int] = None) -> SheetData:
        raw = pd.read_excel(path, sheet_name=sheet_name, header=None, dtype=str)
        raw = raw.dropna(how="all").dropna(axis=1, how="all")
        if raw.empty:
            return SheetData(sheet_name, 0, 0, 0, pd.DataFrame())
        header_idx = detect_header_row(raw) if header_row is None else header_row
        headers = make_unique_headers([clean_cell(v) for v in raw.iloc[header_idx].tolist()])
        data = raw.iloc[header_idx + 1 :].copy()
        data.columns = headers
        data = data.applymap(clean_cell)
        data = data.loc[data.apply(lambda row: any(str(v).strip() for v in row), axis=1)]
        return SheetData(sheet_name, raw.shape[0], raw.shape[1], header_idx + 1, data.reset_index(drop=True))

    def read_workbook(self, path: Path) -> Dict[str, SheetData]:
        with pd.ExcelFile(path) as workbook:
            sheet_names = list(workbook.sheet_names)
        return {sheet: self.read_sheet(path, sheet) for sheet in sheet_names}

    def profile(self, path: Path) -> WorkbookProfile:
        sheets = self.read_workbook(path)
        return WorkbookProfile(
            file=str(path),
            sheets=[
                SheetProfile(
                    name=sheet.name,
                    rows=int(sheet.raw_rows),
                    cols=int(sheet.raw_cols),
                    header_row=int(sheet.header_row),
                    headers=list(sheet.dataframe.columns),
                    sample=sheet.dataframe.head(3).to_dict(orient="records"),
                )
                for sheet in sheets.values()
            ],
        )


class ExcelResultWriter:
    def write_frames(self, output_path: Path, frames: Dict[str, pd.DataFrame]) -> None:
        output_path.parent.mkdir(parents=True, exist_ok=True)
        with pd.ExcelWriter(output_path, engine="openpyxl") as writer:
            for sheet_name, frame in frames.items():
                safe_name = sheet_name[:31]
                frame.to_excel(writer, index=False, sheet_name=safe_name)
