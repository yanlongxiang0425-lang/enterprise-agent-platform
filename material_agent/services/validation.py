from __future__ import annotations

from typing import Iterable, List

from material_agent.domain.models import CompletionIssue, TargetField


class CompletionValidator:
    def validate_row(self, material_code: str, row: dict, target_fields: Iterable[TargetField]) -> List[CompletionIssue]:
        issues: List[CompletionIssue] = []
        for field in target_fields:
            if field.required in {"是", "Y", "必填", "true", "True"} and not row.get(field.name):
                issues.append(
                    CompletionIssue(
                        material_code=material_code,
                        field=field.name,
                        reason="必填字段未补全",
                        suggestion="补充字段映射、知识库来源或转人工确认",
                    )
                )
        return issues

