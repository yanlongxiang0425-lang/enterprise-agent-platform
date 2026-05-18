from __future__ import annotations

from typing import Dict, List


STANDARD_TO_PLM_FIELD: Dict[str, str] = {
    "物料编码": "编号",
    "物料短描述": "短描述",
    "物料长描述": "长描述",
    "物料分类": "部件分类",
    "基本计量单位": "默认单位",
    "物料来源": "源",
    "是否批次管理": "追踪代码",
    "是否版本管理": "版本",
    "物料类别简称": "名称",
    "厂内机型": "厂内机型",
    "厂外/客户型号": "厂外/客户型号",
    "玻璃OC或者屏型号": "玻璃OC或者屏型号",
    "尺寸": "尺寸",
    "颜色": "颜色",
    "品牌": "品牌",
    "出口区域/国家": "出口区域/国家",
    "板卡方案/功能": "板卡方案/功能",
    "补充说明1": "补充说明1（长描述）",
    "补充说明2": "补充说明2（短描述）",
    "产品类别": "产品类别",
    "产品组": "产品组",
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


def normalize_header(name: str) -> str:
    return str(name or "").strip().replace("\n", "").replace(" ", "")


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
