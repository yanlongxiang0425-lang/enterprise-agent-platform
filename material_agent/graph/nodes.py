from __future__ import annotations

from dataclasses import asdict

from material_agent.adapters.excel.workbook import ExcelWorkbookReader
from material_agent.domain.models import AgentRunRequest
from material_agent.graph.state import MaterialAgentState
from material_agent.services.completion_engine import MaterialCompletionEngine


class MaterialGraphNodes:
    def __init__(self, engine: MaterialCompletionEngine | None = None, reader: ExcelWorkbookReader | None = None):
        self.engine = engine or MaterialCompletionEngine()
        self.reader = reader or ExcelWorkbookReader()

    def inspect_inputs(self, state: MaterialAgentState) -> MaterialAgentState:
        profiles = [
            asdict(self.reader.profile(state["knowledge_file"])),
            asdict(self.reader.profile(state["template_file"])),
        ]
        return {**state, "workbook_profiles": profiles, "status": "inputs_inspected"}

    def analyze_template(self, state: MaterialAgentState) -> MaterialAgentState:
        fields = self.engine.analyzer.extract_target_fields(state["template_file"])
        return {**state, "fields": [asdict(field) for field in fields], "status": "template_analyzed"}

    def complete_materials(self, state: MaterialAgentState) -> MaterialAgentState:
        result = self.engine.run_pilot_completion(
            AgentRunRequest(
                knowledge_file=state["knowledge_file"],
                template_file=state["template_file"],
                output_file=state["output_file"],
                limit=state.get("limit", 100),
                run_id=state.get("run_id"),
            )
        )
        return {
            **state,
            "result": {
                "output": str(result.output),
                "rows": result.rows,
                "fields": result.fields,
                "exceptions": result.exceptions,
                "metrics": result.metrics,
            },
            "status": "completed",
        }

