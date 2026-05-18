from __future__ import annotations

from agent_platform.registry import AgentDefinition, default_registry
from material_agent.domain.models import AgentTaskType


MATERIAL_CLASSIFICATION_AGENT = AgentDefinition(
    agent_key="material-classification",
    display_name="Material Classification Agent",
    version="0.4.0",
    description="Excel-based material master data classification and completion agent.",
    task_types=[AgentTaskType.PILOT_COMPLETION.value, AgentTaskType.FIVE_STEP_CLEANING.value],
)


def register_material_agent() -> AgentDefinition:
    return default_registry.register(MATERIAL_CLASSIFICATION_AGENT)
