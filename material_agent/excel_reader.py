from __future__ import annotations

from dataclasses import dataclass
from pathlib import Path
from typing import Dict, List, Optional

import pandas as pd


def clean_cell(value) -> str:
    if pd.isna(value):
        return ""
    text = str(value).strip()
    if text.endswith(".0") and text[:-2].isdigit():
        return text[:-2]
    return text


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


@dataclass
class SheetData:
    name: str
    raw_rows: int
    raw_cols: int
    header_row: int
    dataframe: pd.DataFrame


def read_sheet(path: Path, sheet_name: str, header_row: Optional[int] = None) -> SheetData:
    raw = pd.read_excel(path, sheet_name=sheet_name, header=None, dtype=str)
    raw = raw.dropna(how="all").dropna(axis=1, how="all")
    if raw.empty:
        return SheetData(sheet_name, 0, 0, 0, pd.DataFrame())
    header_idx = detect_header_row(raw) if header_row is None else header_row
    headers = make_unique_headers([clean_cell(v) for v in raw.iloc[header_idx].tolist()])
    data = raw.iloc[header_idx + 1 :].copy()
    data.columns = headers
    data = data.applymap(clean_cell)
    data = data.loc[data.apply(lambda r: any(str(v).strip() for v in r), axis=1)]
    return SheetData(sheet_name, raw.shape[0], raw.shape[1], header_idx + 1, data.reset_index(drop=True))


def read_workbook(path: Path) -> Dict[str, SheetData]:
    xls = pd.ExcelFile(path)
    return {sheet: read_sheet(path, sheet) for sheet in xls.sheet_names}


def workbook_profile(path: Path) -> Dict:
    sheets = read_workbook(path)
    return {
        "file": str(path),
        "sheets": [
            {
                "sheet": s.name,
                "rows": int(s.raw_rows),
                "cols": int(s.raw_cols),
                "header_row": int(s.header_row),
                "headers": list(s.dataframe.columns),
                "sample": s.dataframe.head(3).to_dict(orient="records"),
            }
            for s in sheets.values()
        ],
    }
