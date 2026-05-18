from __future__ import annotations

from pathlib import Path
from typing import Dict, List, Tuple

import pandas as pd

from material_agent.adapters.excel.workbook import ExcelResultWriter, ExcelWorkbookReader
from material_agent.domain.models import AgentRunRequest, CompletionIssue, CompletionResult, TargetField
from material_agent.services.field_mapping import build_mapping_from_old_new, map_standard_attr_to_plm
from material_agent.services.knowledge_loader import MaterialKnowledgeLoader
from material_agent.services.template_analyzer import TargetTemplateAnalyzer
from material_agent.services.validation import CompletionValidator


class MaterialCompletionEngine:
    def __init__(
        self,
        reader: ExcelWorkbookReader | None = None,
        writer: ExcelResultWriter | None = None,
        loader: MaterialKnowledgeLoader | None = None,
        analyzer: TargetTemplateAnalyzer | None = None,
        validator: CompletionValidator | None = None,
    ):
        self.reader = reader or ExcelWorkbookReader()
        self.writer = writer or ExcelResultWriter()
        self.loader = loader or MaterialKnowledgeLoader(self.reader)
        self.analyzer = analyzer or TargetTemplateAnalyzer(self.reader)
        self.validator = validator or CompletionValidator()

    def build_result_row(self, material: Dict[str, str], fields: List[TargetField]) -> Tuple[Dict[str, str], List[CompletionIssue]]:
        row: Dict[str, str] = {}
        issues: List[CompletionIssue] = []
        material_code = material.get("编号", "")
        for field in fields:
            mapping = map_standard_attr_to_plm(field.name)
            value = material.get(mapping.source_field, "") if mapping.source_field else ""
            if field.name == "是否批次管理" and value:
                value = "是" if value not in ["0", "false", "False", "否"] else "否"
            if field.name == "是否版本管理" and value:
                value = "是" if value not in ["0", "false", "False", "否"] else "否"
            row[field.name] = value
            if not mapping.source_field:
                issues.append(
                    CompletionIssue(
                        material_code=material_code,
                        field=field.name,
                        reason="未配置字段映射",
                        suggestion="补充字段字典、RAG检索规则或人工确认",
                    )
                )
        issues.extend(self.validator.validate_row(material_code, row, fields))
        return row, issues

    def run_pilot_completion(self, request: AgentRunRequest) -> CompletionResult:
        kb = self.loader.load_plm_knowledge(request.knowledge_file)
        fields = self.analyzer.extract_target_fields(request.template_file)
        output_rows: List[Dict[str, str]] = []
        issues: List[CompletionIssue] = []
        limit = min(request.limit, len(kb.rows))

        for material in kb.rows[:limit]:
            row, row_issues = self.build_result_row(material, fields)
            row["来源物料编号"] = material.get("编号", "")
            row["来源旧物料号"] = material.get("旧物料号", "")
            row["来源Sheet"] = material.get("_sheet", "")
            output_rows.append(row)
            issues.extend(row_issues)

        issue_rows = [
            {
                "物料编号": issue.material_code,
                "字段": issue.field,
                "原因": issue.reason,
                "建议": issue.suggestion,
            }
            for issue in issues
        ]
        summary = pd.DataFrame(
            [
                {"指标": "知识库行数", "值": len(kb.rows)},
                {"指标": "目标字段数", "值": len(fields)},
                {"指标": "本次输出行数", "值": len(output_rows)},
                {"指标": "字段映射异常数", "值": len(issues)},
            ]
        )
        self.writer.write_frames(
            request.output_file,
            {
                "补全结果": pd.DataFrame(output_rows),
                "异常明细": pd.DataFrame(issue_rows),
                "统计": summary,
            },
        )
        return CompletionResult(
            output=request.output_file,
            rows=len(output_rows),
            fields=len(fields),
            exceptions=len(issues),
            metrics={"knowledge_rows": len(kb.rows), "run_id": request.run_id or ""},
        )

    def build_mapping_from_files(self, old_standard_path: Path, new_standard_path: Path) -> pd.DataFrame:
        old_df = self.reader.read_sheet(old_standard_path, "Sheet1").dataframe
        new_df = self.reader.read_sheet(new_standard_path, "Sheet1").dataframe
        return build_mapping_from_old_new(old_df, new_df)

    def transform_old_material(self, old_material_path: Path, mapping_path: Path, output_path: Path) -> CompletionResult:
        material_df = self.reader.read_sheet(old_material_path, "Sheet1").dataframe
        mapping_df = self.reader.read_sheet(mapping_path, "Sheet1").dataframe
        old_value = {
            row.get("属性名称", ""): row.get("属性值", "")
            for _, row in material_df.iterrows()
            if row.get("属性名称")
        }
        result: Dict[str, str] = {}
        issues: List[Dict[str, str]] = []
        for _, row in mapping_df.iterrows():
            new_attr = row.get("新属性名称", "")
            old_attr = row.get("旧属性名称", "")
            result[new_attr] = old_value.get(old_attr, "")
            if old_attr and old_attr not in old_value:
                issues.append({"新属性名称": new_attr, "旧属性名称": old_attr, "原因": "旧料号信息中未找到旧属性"})

        self.writer.write_frames(
            output_path,
            {
                "清洗结果": pd.DataFrame([result]),
                "异常明细": pd.DataFrame(issues),
                "统计": pd.DataFrame(
                    [
                        {"指标": "输出字段数", "值": len(result)},
                        {"指标": "异常数", "值": len(issues)},
                    ]
                ),
            },
        )
        return CompletionResult(output=output_path, rows=1, fields=len(result), exceptions=len(issues))

