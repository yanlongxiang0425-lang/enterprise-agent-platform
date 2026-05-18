from __future__ import annotations

from typing import Dict, Iterable, List

import pandas as pd

from material_agent.adapters.excel.workbook import normalize_header
from material_agent.domain.models import FieldMapping


STANDARD_TO_PLM_FIELD: Dict[str, str] = {
    "物料编码": "编号",
    "物料短描述": "短描述",
    "物料长描述": "长描述",
    "物料分类": "部件分类",
    "基本计量单位": "默认单位",
    "物料单位（BOM中单位）": "默认单位",
    "物料来源": "源",
    "采购类型": "源",
    "是否批次管理": "追踪代码",
    "是否做批次管理": "追踪代码",
    "是否版本管理": "版本",
    "是否做版本管控": "版本",
    "物料类别简称": "名称",
    "物料名称": "名称",
    "厂内机型": "厂内机型",
    "厂外/客户型号": "厂外/客户型号",
    "厂外型号": "厂外/客户型号",
    "玻璃OC或者屏型号": "玻璃OC或者屏型号",
    "OC型号": "玻璃OC或者屏型号",
    "尺寸": "尺寸",
    "颜色": "颜色",
    "品牌": "品牌",
    "出口区域/国家": "出口区域/国家",
    "出口国家": "出口区域/国家",
    "板卡方案/功能": "板卡方案/功能",
    "板卡型号": "板卡方案/功能",
    "板卡内存": "板卡方案/功能",
    "按键": "补充说明2（短描述）",
    "背光方案": "补充说明1（长描述）",
    "补充说明1": "补充说明1（长描述）",
    "补充说明2": "补充说明2（短描述）",
    "产品类别": "产品类别",
    "产品组": "产品组",
    "中类": "中类",
    "小类": "小类",
    "旧物料号": "旧物料号",
}


FIELD_ALIASES: Dict[str, List[str]] = {
    "物料编码": ["物料编码", "编号", "新料号", "物料号", "Material Code", "Number"],
    "旧物料号": ["旧物料号", "旧料号", "新标准前集团内物料唯一标识代码，简称料号"],
    "物料短描述": ["物料短描述", "短描述", "Material Name（short）"],
    "物料长描述": ["物料长描述", "长描述", "Material Name（long）"],
    "物料分类": ["物料分类", "部件分类", "分类", "Classification"],
    "基本计量单位": ["基本计量单位", "默认单位", "单位", "Unit of Measure"],
}


def map_standard_attr_to_plm(attr: str) -> FieldMapping:
    if attr in STANDARD_TO_PLM_FIELD:
        return FieldMapping(attr, STANDARD_TO_PLM_FIELD[attr], "dictionary", 1.0, "命中标准字段字典")
    nattr = normalize_header(attr)
    for standard, plm_field in STANDARD_TO_PLM_FIELD.items():
        nstandard = normalize_header(standard)
        if nstandard in nattr or nattr in nstandard:
            return FieldMapping(attr, plm_field, "fuzzy-name", 0.82, f"与标准字段 {standard} 名称相近")
    return FieldMapping(attr, "", "unmapped", 0.0, "未命中字段字典")


def build_mapping_from_old_new(old_standard: pd.DataFrame, new_standard: pd.DataFrame) -> pd.DataFrame:
    old_names = [v for v in old_standard.get("属性名称", pd.Series(dtype=str)).tolist() if v]
    records = []
    normalized_aliases = {
        standard: [normalize_header(alias) for alias in aliases]
        for standard, aliases in FIELD_ALIASES.items()
    }
    for _, row in new_standard.iterrows():
        new_attr = row.get("新属性名称", "")
        if not new_attr:
            continue
        matched = ""
        strategy = "name-contains"
        for old in old_names:
            if normalize_header(new_attr) in normalize_header(old) or normalize_header(old) in normalize_header(new_attr):
                matched = old
                break
        for standard, aliases in normalized_aliases.items():
            if normalize_header(new_attr) == normalize_header(standard):
                matched = next((old for old in old_names if normalize_header(old) in aliases), matched)
                strategy = "alias-dictionary" if matched else strategy
        records.append(
            {
                "属性分类": row.get("属性分类", ""),
                "新属性名称": new_attr,
                "旧属性名称": matched,
                "属性值单位": "",
                "映射策略": strategy if matched else "manual-required",
                "置信度": 0.9 if matched else 0.0,
            }
        )
    return pd.DataFrame(records)
