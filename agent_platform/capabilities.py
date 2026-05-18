from __future__ import annotations

from dataclasses import dataclass
from typing import Dict, List


@dataclass(frozen=True)
class ToolDefinition:
    tool_key: str
    display_name: str
    description: str
    input_schema: dict
    enabled: bool = True


@dataclass(frozen=True)
class McpServerDefinition:
    server_key: str
    display_name: str
    transport: str
    endpoint: str
    enabled: bool = True


@dataclass(frozen=True)
class SkillDefinition:
    skill_key: str
    display_name: str
    description: str
    version: str = "1.0.0"
    enabled: bool = True


class CapabilityRegistry:
    def __init__(self):
        self._tools: Dict[str, ToolDefinition] = {}
        self._mcp_servers: Dict[str, McpServerDefinition] = {}
        self._skills: Dict[str, SkillDefinition] = {}

    def register_tool(self, definition: ToolDefinition) -> ToolDefinition:
        self._tools[definition.tool_key] = definition
        return definition

    def register_mcp_server(self, definition: McpServerDefinition) -> McpServerDefinition:
        self._mcp_servers[definition.server_key] = definition
        return definition

    def register_skill(self, definition: SkillDefinition) -> SkillDefinition:
        self._skills[definition.skill_key] = definition
        return definition

    def list_tools(self) -> List[ToolDefinition]:
        return [self._tools[key] for key in sorted(self._tools)]

    def list_mcp_servers(self) -> List[McpServerDefinition]:
        return [self._mcp_servers[key] for key in sorted(self._mcp_servers)]

    def list_skills(self) -> List[SkillDefinition]:
        return [self._skills[key] for key in sorted(self._skills)]


default_capability_registry = CapabilityRegistry()


def register_builtin_capabilities() -> CapabilityRegistry:
    default_capability_registry.register_tool(
        ToolDefinition(
            tool_key="excel-profile",
            display_name="Excel Workbook Profiler",
            description="Inspect sheets, headers and sample rows from enterprise Excel workbooks.",
            input_schema={"type": "object", "required": ["file_path"], "properties": {"file_path": {"type": "string"}}},
        )
    )
    default_capability_registry.register_tool(
        ToolDefinition(
            tool_key="excel-export",
            display_name="Excel Result Exporter",
            description="Write agent results, exception details and summary metrics to Excel workbooks.",
            input_schema={"type": "object", "required": ["output_path"], "properties": {"output_path": {"type": "string"}}},
        )
    )
    default_capability_registry.register_mcp_server(
        McpServerDefinition(
            server_key="local-filesystem",
            display_name="Local Filesystem MCP",
            transport="stdio",
            endpoint="configured-by-deployment",
        )
    )
    default_capability_registry.register_skill(
        SkillDefinition(
            skill_key="material-classification-completion",
            display_name="Material Classification Completion",
            description="Complete material master data fields from PLM knowledge files and target templates.",
            version="0.4.0",
        )
    )
    return default_capability_registry
