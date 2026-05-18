from __future__ import annotations

from dataclasses import dataclass, field
from typing import Dict, List


@dataclass(frozen=True)
class AgentDefinition:
    agent_key: str
    display_name: str
    version: str
    description: str
    task_types: List[str] = field(default_factory=list)


class AgentRegistry:
    """In-process registry for agent capabilities exposed by the platform."""

    def __init__(self):
        self._agents: Dict[str, AgentDefinition] = {}

    def register(self, definition: AgentDefinition) -> AgentDefinition:
        self._agents[definition.agent_key] = definition
        return definition

    def get(self, agent_key: str) -> AgentDefinition:
        return self._agents[agent_key]

    def list(self) -> List[AgentDefinition]:
        return [self._agents[key] for key in sorted(self._agents)]


default_registry = AgentRegistry()
