from __future__ import annotations

from dataclasses import dataclass
from pathlib import Path
from typing import Dict, List, Tuple

import pandas as pd

from .excel_reader import read_sheet, read_workbook, workbook_profile
from .mappings import FIELD_ALIASES, STANDARD_TO_PLM_FIELD, find_column, normalize_header


@dataclass
class KnowledgeBase:
    rows: List[Dict[str, str]]
    by_number: Dict[str, Dict[str, str]]
    by_old_number: Dict[str, Dict[str, str]]


def load_plm_knowledge(path: Path) -> KnowledgeBase:
    sheets = read_workbook(path)
    rows: List[Dict[str, str]] = []
    for sheet in sheets.values():
        if sheet.dataframe.empty:
            continue
        df = sheet.dataframe
        # WPS PLM files include an English field-code row just below the Chinese header.
        if not df.empty and str(df.iloc[0].get("类型", "")).lower() == "type":
            df = df.iloc[1:].reset_index(drop=True)
        for record in df.to_dict(orient="records"):
            if record.get("编号") or record.get("旧物料号"):
                record["_sheet"] = sheet.name
                rows.append(record)

    by_number = {r.get("编号", ""): r for r in rows if r.get("编号")}
    by_old_number = {r.get("旧物料号", ""): r for r in rows if r.get("旧物料号")}
    return KnowledgeBase(rows=rows, by_number=by_number, by_old_number=by_old_number)


def load_target_standard(path: Path) -> pd.DataFrame:
    sheet = read_sheet(path, "主数据标准")
    df = sheet.dataframe.copy()
    attr_col = find_column(df.columns.tolist(), ["描述该主数据属性的中文名称。例如：客户编码、客户名称等", "属性中文名称"])
    if attr_col:
        df = df[df[attr_col].astype(str).str.strip() != ""].reset_index(drop=True)
    return df


def extract_target_attributes(path: Path) -> List[str]:
    df = load_target_standard(path)
    attr_col = find_column(df.columns.tolist(), ["描述该主数据属性的中文名称。例如：客户编码、客户名称等", "属性中文名称"])
    if not attr_col:
        return []
    return [str(v).strip() for v in df[attr_col].tolist() if str(v).strip()]


def map_standard_attr_to_plm(attr: str) -> str:
    if attr in STANDARD_TO_PLM_FIELD:
        return STANDARD_TO_PLM_FIELD[attr]
    nattr = normalize_header(attr)
    for standard, plm_field in STANDARD_TO_PLM_FIELD.items():
        if normalize_header(standard) in nattr or nattr in normalize_header(standard):
            return plm_field
    return ""


def build_result_row(material: Dict[str, str], attrs: List[str]) -> Tuple[Dict[str, str], List[Dict[str, str]]]:
    row: Dict[str, str] = {}
    exceptions: List[Dict[str, str]] = []
    for attr in attrs:
        plm_field = map_standard_attr_to_plm(attr)
        value = material.get(plm_field, "") if plm_field else ""
        if attr == "是否批次管理" and value:
            value = "是" if value not in ["0", "false", "False", "否"] else "否"
        if attr == "是否版本管理" and value:
            value = "是" if value not in ["0", "false", "False", "否"] else "否"
        row[attr] = value
        if not plm_field:
            exceptions.append({"字段": attr, "原因": "未配置字段映射", "建议": "补充字段字典或人工确认"})
    return row, exceptions


def generate_pilot_completion(knowledge_path: Path, template_path: Path, output_path: Path, limit: int = 30) -> Dict:
    kb = load_plm_knowledge(knowledge_path)
    attrs = extract_target_attributes(template_path)
    output_rows: List[Dict[str, str]] = []
    exceptions: List[Dict[str, str]] = []

    for material in kb.rows[:limit]:
        row, row_exceptions = build_result_row(material, attrs)
        row["来源物料编号"] = material.get("编号", "")
        row["来源旧物料号"] = material.get("旧物料号", "")
        row["来源Sheet"] = material.get("_sheet", "")
        output_rows.append(row)
        for exc in row_exceptions:
            exceptions.append({"物料编号": material.get("编号", ""), **exc})

    summary = pd.DataFrame([
        {"指标": "知识库行数", "值": len(kb.rows)},
        {"指标": "目标字段数", "值": len(attrs)},
        {"指标": "本次输出行数", "值": len(output_rows)},
        {"指标": "字段映射异常数", "值": len(exceptions)},
    ])

    with pd.ExcelWriter(output_path, engine="openpyxl") as writer:
        pd.DataFrame(output_rows).to_excel(writer, index=False, sheet_name="补全结果")
        pd.DataFrame(exceptions).to_excel(writer, index=False, sheet_name="异常明细")
        summary.to_excel(writer, index=False, sheet_name="统计")
    return {"rows": len(output_rows), "exceptions": len(exceptions), "output": str(output_path)}


def load_standard_mapping(mapping_path: Path) -> pd.DataFrame:
    sheet = read_sheet(mapping_path, "Sheet1")
    return sheet.dataframe


def build_mapping_from_old_new(old_standard_path: Path, new_standard_path: Path) -> pd.DataFrame:
    old_df = read_sheet(old_standard_path, "Sheet1").dataframe
    new_df = read_sheet(new_standard_path, "Sheet1").dataframe
    old_names = [v for v in old_df.get("属性名称", pd.Series(dtype=str)).tolist() if v]
    records = []
    for _, row in new_df.iterrows():
        new_attr = row.get("新属性名称", "")
        if not new_attr:
            continue
        matched = ""
        for old in old_names:
            if normalize_header(new_attr) in normalize_header(old) or normalize_header(old) in normalize_header(new_attr):
                matched = old
                break
        for standard, aliases in FIELD_ALIASES.items():
            if normalize_header(new_attr) == normalize_header(standard):
                matched = next((old for old in old_names if normalize_header(old) in [normalize_header(a) for a in aliases]), matched)
        records.append({
            "属性分类": row.get("属性分类", ""),
            "新属性名称": new_attr,
            "旧属性名称": matched,
            "属性值单位": "",
        })
    return pd.DataFrame(records)


def transform_old_material(old_material_path: Path, mapping_path: Path, output_path: Path) -> Dict:
    material_df = read_sheet(old_material_path, "Sheet1").dataframe
    mapping_df = load_standard_mapping(mapping_path)
    old_value = {
        row.get("属性名称", ""): row.get("属性值", "")
        for _, row in material_df.iterrows()
        if row.get("属性名称")
    }
    result: Dict[str, str] = {}
    exceptions = []
    for _, row in mapping_df.iterrows():
        new_attr = row.get("新属性名称", "")
        old_attr = row.get("旧属性名称", "")
        result[new_attr] = old_value.get(old_attr, "")
        if old_attr and old_attr not in old_value:
            exceptions.append({"新属性名称": new_attr, "旧属性名称": old_attr, "原因": "旧料号信息中未找到旧属性"})
    with pd.ExcelWriter(output_path, engine="openpyxl") as writer:
        pd.DataFrame([result]).to_excel(writer, index=False, sheet_name="清洗结果")
        pd.DataFrame(exceptions).to_excel(writer, index=False, sheet_name="异常明细")
        pd.DataFrame([{"指标": "输出字段数", "值": len(result)}, {"指标": "异常数", "值": len(exceptions)}]).to_excel(writer, index=False, sheet_name="统计")
    return {"fields": len(result), "exceptions": len(exceptions), "output": str(output_path)}


def sample_profiles(paths: List[Path]) -> List[Dict]:
    return [workbook_profile(path) for path in paths]
