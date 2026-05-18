from __future__ import annotations

from pathlib import Path
from typing import List

import pandas as pd

from material_agent.adapters.excel.workbook import ExcelWorkbookReader, find_column
from material_agent.domain.models import TargetField


class TargetTemplateAnalyzer:
    def __init__(self, reader: ExcelWorkbookReader | None = None):
        self.reader = reader or ExcelWorkbookReader()

    def load_target_standard(self, path: Path) -> pd.DataFrame:
        sheet = self.reader.read_sheet(path, "主数据标准")
        df = sheet.dataframe.copy()
        attr_col = find_column(
            df.columns.tolist(),
            ["描述该主数据属性的中文名称。例如：客户编码、客户名称等", "属性中文名称", "字段名称"],
        )
        if attr_col:
            df = df[df[attr_col].astype(str).str.strip() != ""].reset_index(drop=True)
        return df

    def extract_target_fields(self, path: Path) -> List[TargetField]:
        df = self.load_target_standard(path)
        attr_col = find_column(
            df.columns.tolist(),
            ["描述该主数据属性的中文名称。例如：客户编码、客户名称等", "属性中文名称", "字段名称"],
        )
        group_col = find_column(df.columns.tolist(), ["属性分组", "分类", "字段分类"])
        required_col = find_column(df.columns.tolist(), ["是否必填", "必填", "是否必须"])
        rule_col = find_column(df.columns.tolist(), ["清洗规则", "规则", "填写说明", "业务规则"])
        if not attr_col:
            return []
        fields: List[TargetField] = []
        for _, row in df.iterrows():
            name = str(row.get(attr_col, "")).strip()
            if not name:
                continue
            fields.append(
                TargetField(
                    name=name,
                    group=str(row.get(group_col, "")).strip() if group_col else "",
                    required=str(row.get(required_col, "")).strip() if required_col else "",
                    rule=str(row.get(rule_col, "")).strip() if rule_col else "",
                )
            )
        return fields

