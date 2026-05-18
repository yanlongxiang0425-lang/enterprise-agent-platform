from __future__ import annotations

from material_agent.graph.nodes import MaterialGraphNodes
from material_agent.graph.state import MaterialAgentState


class LinearMaterialAgentRunner:
    """Fallback runner used when LangGraph is not installed in the local CPU validation env."""

    def __init__(self, nodes: MaterialGraphNodes | None = None):
        self.nodes = nodes or MaterialGraphNodes()

    def invoke(self, state: MaterialAgentState) -> MaterialAgentState:
        state = self.nodes.inspect_inputs(state)
        state = self.nodes.analyze_template(state)
        state = self.nodes.complete_materials(state)
        return state


def build_material_graph():
    try:
        from langgraph.graph import END, StateGraph
    except ImportError:
        return LinearMaterialAgentRunner()

    nodes = MaterialGraphNodes()
    graph = StateGraph(MaterialAgentState)
    graph.add_node("inspect_inputs", nodes.inspect_inputs)
    graph.add_node("analyze_template", nodes.analyze_template)
    graph.add_node("complete_materials", nodes.complete_materials)
    graph.set_entry_point("inspect_inputs")
    graph.add_edge("inspect_inputs", "analyze_template")
    graph.add_edge("analyze_template", "complete_materials")
    graph.add_edge("complete_materials", END)
    return graph.compile()

