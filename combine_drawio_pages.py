from pathlib import Path
import re


BASE = Path("交付物/drawio_architecture_diagrams")
OUT = Path("交付物/公共底层智能体平台_全量架构图.drawio")

PAGES = [
    ("总体技术架构图", "01_overall_technical_architecture.drawio"),
    ("业务流程图", "02_business_flow.drawio"),
    ("核心时序图", "03_core_sequence.drawio"),
    ("RAG写入与检索流程图", "04_rag_flow.drawio"),
    ("模型分流与切换图", "05_model_switch.drawio"),
    ("LangGraph节点编排图", "06_langgraph_nodes.drawio"),
    ("智能体状态扭转图", "07_agent_state_transition.drawio"),
    ("Tool-MCP-Skill调用图", "08_tool_mcp_skill.drawio"),
    ("短期长期记忆设计图", "09_memory_design.drawio"),
    ("数据存储与离线部署图", "10_data_deploy.drawio"),
]


def extract_diagram_xml(path: Path, page_name: str) -> str:
    text = path.read_text(encoding="utf-8")
    match = re.search(r"<diagram\b[^>]*>(.*?)</diagram>", text, re.S)
    if not match:
        raise ValueError(f"No diagram body found in {path}")
    body = match.group(1)
    return f'<diagram name="{page_name}">{body}</diagram>'


def main():
    diagrams = [extract_diagram_xml(BASE / file_name, page_name) for page_name, file_name in PAGES]
    xml = '<mxfile host="app.diagrams.net">' + "".join(diagrams) + "</mxfile>\n"
    OUT.write_text(xml, encoding="utf-8")
    print(OUT.resolve())


if __name__ == "__main__":
    main()
