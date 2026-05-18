import os
import html
import json
import subprocess
from pathlib import Path

from docx import Document
from docx.shared import Inches, Pt, RGBColor
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.enum.section import WD_ORIENT
from docx.enum.table import WD_TABLE_ALIGNMENT, WD_CELL_VERTICAL_ALIGNMENT
from docx.oxml import OxmlElement
from docx.oxml.ns import qn


ROOT = Path.cwd()
OUT = ROOT / "交付物"
DIAGRAM_DIR = OUT / "drawio_architecture_diagrams"
DOCX = OUT / "公共底层智能体平台技术架构设计文档_drawio增强版.docx"
DRAWIO = Path("/Applications/draw.io.app/Contents/MacOS/draw.io")

OUT.mkdir(exist_ok=True)
DIAGRAM_DIR.mkdir(exist_ok=True)


def esc(s):
    return html.escape(str(s), quote=True)


def label_html(s):
    return "&lt;br&gt;".join(esc(part) for part in str(s).split("<br>"))


class Drawio:
    def __init__(self, name, w=1800, h=1100):
        self.name = name
        self.w = w
        self.h = h
        self.cells = [
            '<mxCell id="0"/>',
            '<mxCell id="1" parent="0"/>',
        ]
        self.next_id = 2

    def _id(self, prefix="c"):
        i = f"{prefix}{self.next_id}"
        self.next_id += 1
        return i

    def rect(self, x, y, w, h, label, fill="#FFFFFF", stroke="#334155", rounded=True, font=14, bold=False):
        style = (
            f"rounded={1 if rounded else 0};whiteSpace=wrap;html=1;"
            f"fillColor={fill};strokeColor={stroke};strokeWidth=1.4;"
            f"fontColor=#0F172A;fontSize={font};"
            f"{'fontStyle=1;' if bold else ''}"
            "spacing=8;arcSize=8;"
        )
        cid = self._id()
        self.cells.append(
            f'<mxCell id="{cid}" value="{label_html(label)}" style="{style}" vertex="1" parent="1">'
            f'<mxGeometry x="{x}" y="{y}" width="{w}" height="{h}" as="geometry"/></mxCell>'
        )
        return cid

    def lane(self, x, y, w, h, label, fill="#F8FAFC", stroke="#CBD5E1"):
        style = (
            f"rounded=1;whiteSpace=wrap;html=1;fillColor={fill};strokeColor={stroke};"
            "strokeWidth=1.2;fontStyle=1;fontSize=18;fontColor=#0F172A;"
            "verticalAlign=top;align=left;spacingLeft=14;spacingTop=10;arcSize=6;"
        )
        cid = self._id("lane")
        self.cells.append(
            f'<mxCell id="{cid}" value="{label_html(label)}" style="{style}" vertex="1" parent="1">'
            f'<mxGeometry x="{x}" y="{y}" width="{w}" height="{h}" as="geometry"/></mxCell>'
        )
        return cid

    def title(self, text, sub=""):
        value = f'&lt;b&gt;&lt;font style=&quot;font-size: 26px&quot;&gt;{esc(text)}&lt;/font&gt;&lt;/b&gt;'
        if sub:
            value += f'&lt;br&gt;&lt;font color=&quot;#64748B&quot; style=&quot;font-size: 14px&quot;&gt;{esc(sub)}&lt;/font&gt;'
        style = "text;html=1;strokeColor=none;fillColor=none;align=left;verticalAlign=middle;whiteSpace=wrap;rounded=0;"
        cid = self._id("title")
        self.cells.append(
            f'<mxCell id="{cid}" value="{value}" style="{style}" vertex="1" parent="1">'
            f'<mxGeometry x="40" y="24" width="{self.w - 80}" height="70" as="geometry"/></mxCell>'
        )
        return cid

    def edge(self, src, dst, label="", color="#64748B", dashed=False):
        return None

    def save(self, path):
        model = (
            f'<mxGraphModel dx="1600" dy="900" grid="1" gridSize="10" guides="1" tooltips="1" connect="1" '
            f'arrows="1" fold="1" page="1" pageScale="1" pageWidth="{self.w}" pageHeight="{self.h}" math="0" shadow="0">'
            f'<root>{"".join(self.cells)}</root></mxGraphModel>'
        )
        xml = f'<mxfile host="app.diagrams.net"><diagram name="{esc(self.name)}">{model}</diagram></mxfile>'
        path.write_text(xml, encoding="utf-8")


def diagram_overall():
    d = Drawio("总体技术架构图", 1900, 1120)

    # Reference-style canvas: internal title bar, side pillars, simple layered blocks.
    d.rect(75, 55, 86, 1010, "公共<br>底层<br>智能体<br>平台<br>分层<br>体系", "#BFBFBF", "#263238", rounded=False, font=20, bold=True)
    d.rect(1739, 55, 86, 1010, "安全<br>审计<br>运维<br>保障<br>体系", "#BFBFBF", "#263238", rounded=False, font=20, bold=True)
    d.rect(175, 55, 1550, 1010, "", "#FFFFFF", "#263238", rounded=False)
    d.rect(175, 55, 1550, 42, "公共底层智能体平台总体技术架构图", "#FFFDD0", "#263238", rounded=False, font=20, bold=True)

    def row_label(y, label):
        d.rect(198, y, 130, 44, label, "#FFFFFF", "#FFFFFF", rounded=False, font=20, bold=True)

    def layer(y, h, label, fill, top_dash=False):
        row_label(y + h / 2 - 22, label)
        d.rect(335, y, 1340, h, "", fill, "#263238", rounded=True)

    def box(x, y, w, h, label, fill="#BDEFF2", font=18):
        d.rect(x, y, w, h, label, fill, "#263238", rounded=True, font=font, bold=True)

    # 应用层
    layer(125, 108, "应用层", "#FFE7C7")
    for x, label in zip([520, 820, 1120], ["指标体系构建", "物料分类补全", "管理后台"]):
        box(x, 166, 220, 52, label)

    # 接口层
    layer(280, 100, "接口层", "#E4F5D8", top_dash=True)
    for x, label in zip([600, 930, 1260], ["API接口", "FastAPI", "AI接口"]):
        box(x, 315, 210, 52, label)

    # Agent层
    layer(410, 100, "Agent层", "#E4F5D8")
    for x, label in zip([500, 835, 1170], ["指标Agent", "物料补全Agent", "……智能体"]):
        box(x, 445, 230, 52, label)

    # 功能层
    layer(560, 105, "功能层", "#C7FF8B")
    for x, label in zip([380, 595, 810, 1025, 1240, 1455], ["RAG知识检索", "Tool工具", "MCP服务", "Skill专家流程", "文件解析", "审计脱敏"]):
        box(x, 594, 165, 52, label, "#FFFFFF", font=16)

    # AI模型层
    layer(705, 135, "AI模型层", "#E4F5D8", top_dash=True)
    for x, label in zip([485, 835, 1185], ["Qwen系列", "bge-m3", "bge-reranker"]):
        box(x, 730, 240, 45, label)
    for x, label in zip([640, 995], ["CPU功能验证", "GPU后续选型"]):
        box(x, 790, 260, 36, label, "#BDEFF2", font=15)

    # 数据层
    layer(925, 90, "数据层", "#908CFF", top_dash=True)
    for x, label in zip([430, 720, 1010, 1300], ["PostgreSQL<br>pgvector", "Redis", "Audit Log", "离线包仓库"]):
        box(x, 950, 210, 45, label, "#DDF7F8", font=14)

    return d


def diagram_business_flow():
    d = Drawio("两个业务流程总览", 1800, 1050)
    d.title("两个业务需求的端到端业务流程图", "只保留两个业务入口：指标体系构建、基于物料分类/知识库的补全")
    d.lane(60, 130, 780, 770, "指标体系构建 Agent 流程", "#EFF6FF", "#93C5FD")
    metric_steps = [
        ("输入表结构/Excel/Word/Prompt", "#DBEAFE", "#2563EB"),
        ("输入归一化 TaskContext", "#FFFFFF", "#2563EB"),
        ("Schema 瘦身与业务域切分", "#FFFFFF", "#2563EB"),
        ("指标知识 RAG 检索", "#F3E8FF", "#7C3AED"),
        ("主模型生成指标体系 JSON", "#FFE4E6", "#E11D48"),
        ("可行性复评与 SQL/字段校验", "#FFFFFF", "#2563EB"),
        ("低置信度进入 HITL", "#FEF3C7", "#D97706"),
        ("输出指标体系 JSON / 审计入库", "#DCFCE7", "#16A34A"),
    ]
    prev = None
    for i, (label, fill, stroke) in enumerate(metric_steps):
        node = d.rect(150, 190 + i * 82, 600, 50, label, fill, stroke, bold=True)
        if prev:
            d.edge(prev, node, color=stroke)
        prev = node

    d.lane(960, 130, 780, 770, "物料分类补全 Agent 流程", "#F0FDF4", "#86EFAC")
    material_steps = [
        ("导入物料知识库 Excel", "#DBEAFE", "#2563EB"),
        ("解析字段/分类/属性并落库", "#FFFFFF", "#16A34A"),
        ("上传待补全 Excel", "#DBEAFE", "#2563EB"),
        ("识别物料ID/分类/字段别名", "#FFFFFF", "#16A34A"),
        ("PostgreSQL 精确匹配", "#FFFFFF", "#334155"),
        ("批量属性回填", "#FFFFFF", "#16A34A"),
        ("未命中/多命中/冲突进入 HITL", "#FEF3C7", "#D97706"),
        ("输出补全 Excel / 差异报告 / 审计", "#DCFCE7", "#16A34A"),
    ]
    prev = None
    for i, (label, fill, stroke) in enumerate(material_steps):
        node = d.rect(1050, 190 + i * 82, 600, 50, label, fill, stroke, bold=True)
        if prev:
            d.edge(prev, node, color=stroke)
        prev = node
    return d


def diagram_sequence():
    d = Drawio("核心时序图", 1900, 1160)
    d.title("核心执行时序图", "标准时序图：横向参与方、纵向生命线、消息按时间顺序自上而下流转")
    actors = [
        ("用户/Java后台", 90),
        ("FastAPI", 330),
        ("LangGraph", 570),
        ("Tool/MCP/Skill", 810),
        ("RAG Service", 1050),
        ("Model Gateway", 1290),
        ("PostgreSQL/pgvector", 1530),
    ]
    top, bottom = 140, 1040
    for label, x in actors:
        d.rect(x, top, 165, 46, label, "#FFFFFF", "#334155", bold=True)
        # Lifeline is a thin dashed rectangle instead of a draw.io edge.
        d.rect(x + 80, top + 62, 4, bottom - top - 62, "", "#CBD5E1", "#CBD5E1", rounded=False)

    def lifeline_x(name):
        return dict(actors)[name] + 82

    def msg(a, b, y, text, color="#64748B", dashed=False):
        x1, x2 = lifeline_x(a), lifeline_x(b)
        left, width = min(x1, x2), abs(x2 - x1)
        style = (
            f"shape=line;html=1;strokeColor={color};strokeWidth=1.6;"
            f"{'dashed=1;' if dashed else ''}"
            f"endArrow=block;endFill=1;"
        )
        cid = d._id("seq")
        d.cells.append(
            f'<mxCell id="{cid}" value="{label_html(text)}" style="{style}" vertex="1" parent="1">'
            f'<mxGeometry x="{left}" y="{y}" width="{width}" height="1" as="geometry"/></mxCell>'
        )

    msg("用户/Java后台", "FastAPI", 235, "1. 提交任务 / 上传文件")
    msg("FastAPI", "PostgreSQL/pgvector", 300, "2. 创建 run / 保存文件元数据")
    msg("FastAPI", "LangGraph", 365, "3. 启动 StateGraph")
    msg("LangGraph", "Tool/MCP/Skill", 430, "4. 文件解析 / DB工具 / 专家Skill")
    msg("Tool/MCP/Skill", "PostgreSQL/pgvector", 495, "5. 读写业务表 / 知识库")
    msg("LangGraph", "RAG Service", 560, "6. 按任务检索知识上下文")
    msg("RAG Service", "PostgreSQL/pgvector", 625, "7. metadata filter + vector topK")
    msg("LangGraph", "Model Gateway", 690, "8. 路由到分类 / 推理 / 向量模型")
    msg("Model Gateway", "LangGraph", 755, "9. 返回结构化输出", "#16A34A", True)
    msg("LangGraph", "PostgreSQL/pgvector", 820, "10. 保存 checkpoint / audit / artifact")
    msg("LangGraph", "FastAPI", 885, "11. 返回进度 / 结果地址", "#16A34A", True)
    msg("FastAPI", "用户/Java后台", 950, "12. 下载 JSON 或 Excel 报告", "#16A34A", True)
    return d


def diagram_rag():
    d = Drawio("RAG写入与检索流程", 1800, 1080)
    d.title("RAG 知识库写入、Chunk 分块与检索流程", "物料补全主链路是结构化精确查询；RAG 用于指标知识、分类规则解释、字段语义辅助和低置信度场景")
    d.lane(70, 130, 760, 760, "知识写入链路", "#F3E8FF", "#C084FC")
    write_steps = [
        ("文件接入", "Excel / Word / PDF / 历史指标"),
        ("Parser Router", "按文件类型解析为 DocumentModel"),
        ("结构化抽取", "表格行、标题层级、字段字典、元数据"),
        ("Chunk 分块", "标题层级/表格行/语义段落/Token窗口"),
        ("Embedding", "bge-m3 批量向量化"),
        ("索引落库", "rag_documents / rag_chunks / pgvector"),
    ]
    prev = None
    for i, (t, sub) in enumerate(write_steps):
        node = d.rect(150, 205 + i * 95, 590, 54, f"{t}<br>{sub}", "#FFFFFF", "#7C3AED", bold=True)
        if prev:
            d.edge(prev, node, color="#7C3AED")
        prev = node
    d.lane(970, 130, 760, 760, "知识检索链路", "#F0FDF4", "#86EFAC")
    read_steps = [
        ("Query 理解", "抽取问题、业务域、过滤条件"),
        ("检索路由", "结构化过滤 / 向量召回 / 混合检索"),
        ("候选召回", "pgvector topK + metadata filter"),
        ("重排过滤", "reranker + 权限/来源/版本过滤"),
        ("上下文组装", "chunk + source + page + confidence"),
        ("注入 GraphState", "供 Agent 节点引用与校验"),
    ]
    prev = None
    for i, (t, sub) in enumerate(read_steps):
        node = d.rect(1050, 205 + i * 95, 590, 54, f"{t}<br>{sub}", "#FFFFFF", "#16A34A", bold=True)
        if prev:
            d.edge(prev, node, color="#16A34A")
        prev = node
    d.rect(230, 925, 1340, 70, "Chunk策略：Excel知识库优先结构化入库，必要时按 sheet/row/业务主键生成 chunk；Word/PDF按标题层级+语义段落；普通文本 300-800 tokens，50-100 overlap；检索时必须带 metadata、权限、版本、来源过滤。", "#FEF3C7", "#D97706", bold=True)
    return d


def diagram_model_switch():
    d = Drawio("模型分流与切换", 1800, 980)
    d.title("三类模型分流与部署模式切换图", "上层节点声明任务类型，Model Gateway 决定使用小模型、主推理模型、Embedding/Rerank，支持 CPU 验证与后续 GPU 切换")
    d.lane(60, 130, 420, 660, "任务类型", "#EFF6FF", "#93C5FD")
    task_nodes = []
    for i, label in enumerate(["路由/分类任务<br>业务域/意图/字段别名", "复杂推理任务<br>指标推导/口径解释", "检索向量任务<br>Embedding/Rerank", "确定性任务<br>SQL精确查询/Excel回填"]):
        task_nodes.append(d.rect(125, 210 + i * 130, 300, 60, label, "#DBEAFE" if i < 3 else "#F0FDF4", "#2563EB" if i < 3 else "#16A34A", bold=True))
    d.lane(620, 130, 480, 660, "Model Gateway", "#FFF1F2", "#FDA4AF")
    policy = d.rect(705, 240, 310, 70, "路由策略<br>task_type / latency / cost / fallback", "#FFE4E6", "#E11D48", bold=True)
    mode = d.rect(705, 410, 310, 70, "部署模式切换<br>cpu_local / api_remote / gpu_vllm", "#FFE4E6", "#E11D48", bold=True)
    api = d.rect(705, 580, 310, 70, "统一接口<br>OpenAI Compatible API", "#FFE4E6", "#E11D48", bold=True)
    d.edge(policy, mode, color="#E11D48")
    d.edge(mode, api, color="#E11D48")
    for node in task_nodes[:3]:
        d.edge(node, policy)
    d.edge(task_nodes[3], api, "LLM旁路", "#16A34A")
    d.lane(1240, 130, 500, 660, "模型与执行器", "#F8FAFC", "#CBD5E1")
    m1 = d.rect(1300, 210, 165, 60, "Small LLM<br>7B/14B", "#FFFFFF", "#E11D48", bold=True)
    m2 = d.rect(1510, 210, 165, 60, "Main LLM<br>14B/32B", "#FFFFFF", "#E11D48", bold=True)
    m3 = d.rect(1300, 390, 165, 60, "Embedding<br>bge-m3", "#FFFFFF", "#7C3AED", bold=True)
    m4 = d.rect(1510, 390, 165, 60, "Reranker<br>bge-reranker", "#FFFFFF", "#7C3AED", bold=True)
    m5 = d.rect(1300, 570, 165, 60, "CPU Local<br>功能验证", "#FFFFFF", "#334155", bold=True)
    m6 = d.rect(1510, 570, 165, 60, "GPU/API<br>生产扩展", "#FFFFFF", "#334155", bold=True)
    for node in [m1, m2, m3, m4, m5, m6]:
        d.edge(api, node)
    return d


def diagram_langgraph():
    d = Drawio("LangGraph节点编排", 1900, 1120)
    d.title("LangGraph Node 主题模块与链路编排图", "公共节点 + 业务节点组合为两个 Agent 模板，所有节点围绕 GraphState 读写")
    d.lane(60, 130, 1780, 170, "公共节点模块", "#F8FAFC", "#CBD5E1")
    common_labels = ["input_adapter<br>输入标准化", "policy_guard<br>权限/脱敏", "planner<br>计划生成", "tool_executor<br>工具执行", "validator<br>结果校验", "audit_writer<br>审计落库"]
    common = []
    for i, label in enumerate(common_labels):
        common.append(d.rect(100 + i * 285, 200, 215, 55, label, "#FFFFFF", "#334155", bold=True))
        if i:
            d.edge(common[i-1], common[i])
    d.lane(60, 360, 820, 360, "指标体系构建 Agent 业务节点", "#EFF6FF", "#93C5FD")
    metric_labels = ["schema_slimmer<br>Schema瘦身", "domain_classifier<br>业务域分类", "metric_retriever<br>指标RAG", "metric_generator<br>指标推导", "feasibility_checker<br>可行性复评", "hitl_review<br>人工确认"]
    prev = None
    for i, label in enumerate(metric_labels):
        node = d.rect(120 + (i % 3) * 240, 440 + (i // 3) * 120, 190, 55, label, "#EFF6FF", "#2563EB", bold=True)
        if prev:
            d.edge(prev, node, color="#2563EB")
        prev = node
    d.lane(980, 360, 860, 360, "物料分类补全 Agent 业务节点", "#F0FDF4", "#86EFAC")
    material_labels = ["parse_excel<br>解析Excel", "detect_key<br>识别ID/分类", "exact_lookup<br>精确匹配", "fill_attrs<br>属性回填", "diff_validate<br>差异校验", "export_report<br>导出报告"]
    prev = None
    for i, label in enumerate(material_labels):
        node = d.rect(1040 + (i % 3) * 250, 440 + (i // 3) * 120, 195, 55, label, "#F0FDF4", "#16A34A", bold=True)
        if prev:
            d.edge(prev, node, color="#16A34A")
        prev = node
    state = d.rect(330, 810, 1240, 74, "GraphState<br>run_id · task_context · plan · memory · tool_results · retrieval_context · model_outputs · validation_errors · final_result", "#FEF3C7", "#D97706", bold=True)
    for node in [common[2], common[3], common[4]]:
        d.edge(node, state, "读写状态", "#D97706", dashed=True)
    return d


def diagram_state():
    d = Drawio("智能体状态扭转", 1800, 900)
    d.title("智能体状态扭转图", "两类业务 Agent 共用基础状态机，业务差异体现在节点实现和状态载荷")
    positions = {
        "INIT<br>创建run/加载模板": (110, 200),
        "INPUT_VALIDATED<br>输入校验/权限检查": (360, 200),
        "PLANNED<br>生成执行计划": (650, 200),
        "RUNNING<br>执行Node/Tool": (900, 200),
        "WAIT_HITL<br>等待人工确认": (1150, 200),
        "VALIDATING<br>Schema/引用/权限校验": (1410, 200),
        "RETRYING<br>失败重试/回退": (650, 500),
        "COMPLETED<br>生成最终结果": (950, 500),
        "FAILED<br>失败终止": (1220, 500),
    }
    nodes = {}
    for label, (x, y) in positions.items():
        fill, stroke = "#FFFFFF", "#334155"
        if "COMPLETED" in label:
            fill, stroke = "#DCFCE7", "#16A34A"
        if "FAILED" in label:
            fill, stroke = "#FFE4E6", "#E11D48"
        if "WAIT_HITL" in label:
            fill, stroke = "#FEF3C7", "#D97706"
        nodes[label] = d.rect(x, y, 200, 65, label, fill, stroke, bold=True)
    order = list(positions.keys())[:6]
    for a, b in zip(order, order[1:]):
        d.edge(nodes[a], nodes[b])
    d.edge(nodes[order[-1]], nodes["COMPLETED<br>生成最终结果"], "校验通过", "#16A34A")
    d.edge(nodes["RUNNING<br>执行Node/Tool"], nodes["RETRYING<br>失败重试/回退"], "可恢复错误", "#D97706")
    d.edge(nodes["RETRYING<br>失败重试/回退"], nodes["RUNNING<br>执行Node/Tool"], "重试", "#D97706")
    d.edge(nodes["RUNNING<br>执行Node/Tool"], nodes["FAILED<br>失败终止"], "不可恢复", "#E11D48")
    d.edge(nodes["WAIT_HITL<br>等待人工确认"], nodes["RUNNING<br>执行Node/Tool"], "人工确认后继续", "#D97706")
    return d


def diagram_tools():
    d = Drawio("Tool MCP Skill调用架构", 1800, 1050)
    d.title("Tool / MCP / Skill 能力体系调用图", "Tool 解决确定性动作，MCP 解决外部系统协议接入，Skill 封装专家流程与可复用图/文档能力")
    d.lane(70, 130, 1660, 130, "Agent Node 调用入口", "#F0FDF4", "#86EFAC")
    node = d.rect(180, 180, 260, 55, "LangGraph Node<br>声明需要的 capability", "#DCFCE7", "#16A34A", bold=True)
    registry = d.rect(560, 180, 260, 55, "Capability Registry<br>权限/Schema/超时/重试", "#FFFFFF", "#334155", bold=True)
    executor = d.rect(940, 180, 260, 55, "Executor Sandbox<br>审计/脱敏/结果校验", "#FFE4E6", "#E11D48", bold=True)
    d.edge(node, registry)
    d.edge(registry, executor)
    d.lane(70, 340, 500, 430, "Tool", "#FFF7ED", "#FDBA74")
    t1 = d.rect(145, 430, 350, 65, "DB Query Tool<br>结构化查询/物料精确匹配", "#FEF3C7", "#D97706", bold=True)
    t2 = d.rect(145, 560, 350, 65, "File Parse Tool<br>Excel/Word解析", "#FEF3C7", "#D97706", bold=True)
    t3 = d.rect(145, 690, 350, 65, "Export Tool<br>Excel/JSON/报告导出", "#FEF3C7", "#D97706", bold=True)
    d.lane(650, 340, 500, 430, "MCP", "#EFF6FF", "#93C5FD")
    m1 = d.rect(725, 430, 350, 65, "PostgreSQL MCP<br>表结构/查询/写入", "#DBEAFE", "#2563EB", bold=True)
    m2 = d.rect(725, 560, 350, 65, "File System MCP<br>文件仓库/版本/权限", "#DBEAFE", "#2563EB", bold=True)
    m3 = d.rect(725, 690, 350, 65, "Knowledge MCP<br>RAG索引/检索", "#DBEAFE", "#2563EB", bold=True)
    d.lane(1230, 340, 500, 430, "Skill", "#F3E8FF", "#C084FC")
    s1 = d.rect(1305, 430, 350, 65, "Metric Design Skill<br>指标口径/维度度量模板", "#F3E8FF", "#7C3AED", bold=True)
    s2 = d.rect(1305, 560, 350, 65, "Material Fill Skill<br>字段别名/补全策略", "#F3E8FF", "#7C3AED", bold=True)
    s3 = d.rect(1305, 690, 350, 65, "Drawio Skill<br>架构图/流程图生成", "#F3E8FF", "#7C3AED", bold=True)
    for c in [t1, t2, t3, m1, m2, m3, s1, s2, s3]:
        d.edge(executor, c)
    d.rect(280, 850, 1240, 70, "统一治理：所有 Tool/MCP/Skill 调用必须记录 run_id、输入摘要、输出摘要、耗时、错误、权限、脱敏状态和可重放参数；敏感原文不进入模型提示词。", "#FFE4E6", "#E11D48", bold=True)
    return d


def diagram_memory():
    d = Drawio("记忆设计", 1800, 900)
    d.title("短期记忆与长期记忆设计图", "短期记忆承载一次 Run 的过程状态；长期记忆沉淀领域知识、字段映射、人工确认和评测样本")
    d.lane(80, 140, 740, 520, "短期记忆：Run / Session Scope", "#EFF6FF", "#93C5FD")
    s1 = d.rect(150, 230, 250, 70, "Conversation Buffer<br>当前任务输入/用户反馈", "#DBEAFE", "#2563EB", bold=True)
    s2 = d.rect(470, 230, 270, 70, "LangGraph Checkpoint<br>节点状态/工具结果/错误", "#DCFCE7", "#16A34A", bold=True)
    s3 = d.rect(150, 410, 250, 70, "Retrieval Context<br>本轮召回chunk/schema", "#F3E8FF", "#7C3AED", bold=True)
    s4 = d.rect(470, 410, 270, 70, "Working Memory<br>指标候选/待补全行", "#FEF3C7", "#D97706", bold=True)
    d.edge(s1, s2)
    d.edge(s3, s4)
    d.lane(980, 140, 740, 520, "长期记忆：Project / Domain Scope", "#F0FDF4", "#86EFAC")
    l1 = d.rect(1050, 230, 250, 70, "Field Dictionary<br>字段别名/主键映射", "#F0FDF4", "#16A34A", bold=True)
    l2 = d.rect(1370, 230, 270, 70, "Knowledge Collections<br>指标知识/物料分类规则", "#F3E8FF", "#7C3AED", bold=True)
    l3 = d.rect(1050, 410, 250, 70, "Historical Runs<br>人工确认/错误样本", "#ECFDF5", "#059669", bold=True)
    l4 = d.rect(1370, 410, 270, 70, "Evaluation Cases<br>golden cases/回归基线", "#FFE4E6", "#E11D48", bold=True)
    d.edge(l1, l2)
    d.edge(l3, l4)
    d.rect(260, 720, 1280, 60, "记忆使用原则：短期记忆可进提示词；长期记忆必须先经过权限过滤、检索过滤和脱敏摘要，再进入模型上下文。", "#FEF3C7", "#D97706", bold=True)
    return d


def diagram_data_deploy():
    d = Drawio("数据与部署架构", 1900, 1050)
    d.title("离线单机部署架构图", "AI能力合并为一个 agent-api 服务；单机 VM 内仅保留 agent-admin 与 agent-api 两个应用单体")

    def line(x1, y1, x2, y2, label="", color="#263238", dashed=False):
        if label:
            d.rect(x1 - 95, min(y1, y2) + 8, 190, 28, label, "#FFFFFF", "#FFFFFF", rounded=False, font=15, bold=True)
        height = max(28, abs(y2 - y1) - 24)
        style = f"shape=singleArrow;direction=south;html=1;fillColor={color};strokeColor={color};strokeWidth=1;"
        cid = d._id("dep")
        d.cells.append(
            f'<mxCell id="{cid}" value="" style="{style}" vertex="1" parent="1">'
            f'<mxGeometry x="{x1 - 10}" y="{min(y1, y2) + 36}" width="20" height="{height}" as="geometry"/></mxCell>'
        )

    def cylinder(x, y, w, h, label):
        style = (
            "shape=cylinder3d;whiteSpace=wrap;html=1;boundedLbl=1;backgroundOutline=1;"
            "size=15;fillColor=#D9EAF7;strokeColor=#2563EB;strokeWidth=1.6;"
            "fontColor=#0F172A;fontSize=18;fontStyle=1;spacing=8;"
        )
        cid = d._id("db")
        d.cells.append(
            f'<mxCell id="{cid}" value="{label_html(label)}" style="{style}" vertex="1" parent="1">'
            f'<mxGeometry x="{x}" y="{y}" width="{w}" height="{h}" as="geometry"/></mxCell>'
        )
        return cid

    d.rect(660, 105, 580, 78, "管理后台 · 业务系统", "#FFFFFF", "#334155", rounded=True, font=20, bold=True)
    line(950, 183, 950, 255, "① HTTPS")
    d.rect(660, 255, 580, 86, "接入网关<br>Nginx / APISIX", "#DBEAFE", "#2563EB", rounded=True, font=20, bold=True)
    line(950, 341, 950, 415, "② 路由转发")

    d.rect(230, 415, 1440, 310, "单机 VM · 应用服务（2个单体）", "#FFF7ED", "#C2410C", rounded=True, font=20, bold=True)
    d.rect(330, 505, 430, 130, "agent-admin（已有服务）<br>Java · Spring Boot<br>:8080<br>用户/权限/配置/任务下发", "#F8FAFC", "#334155", rounded=True, font=17, bold=True)
    d.rect(890, 485, 600, 160, "agent-api<br>Python · FastAPI/Uvicorn :8000<br>LangGraph任务编排 · RAG · Tool/MCP<br>Model Gateway模块（进程内，模型路由/限流）<br>REST · SSE · Redis队列", "#DBEAFE", "#2563EB", rounded=True, font=16, bold=True)
    d.rect(430, 665, 1040, 38, "admin → api（HTTP REST 触发任务） → api进程内：LangGraph编排 → Model Gateway 调内部/远程模型 API", "#FFF7ED", "#C2410C", rounded=False, font=15, bold=False)
    d.rect(520, 705, 860, 34, "Nginx：admin=HTTPS+REST · api=HTTPS+REST/SSE", "#FFF7ED", "#C2410C", rounded=False, font=15, bold=False)

    line(950, 725, 950, 800, "③ 持久化")
    cylinder(675, 800, 550, 130, "数据存储<br>PostgreSQL + pgvector :5432<br>Redis :6379")
    d.rect(360, 960, 1180, 55, "部署说明：AI能力不再拆分独立服务；RAG、LangGraph、Tool/MCP、Model Gateway统一收敛在agent-api进程内，便于前期单机离线部署和问题排查。", "#FEF3C7", "#D97706", rounded=True, font=16, bold=True)
    return d


DIAGRAMS = [
    ("01_overall_technical_architecture", diagram_overall, "总体技术架构图"),
    ("02_business_flow", diagram_business_flow, "两个业务需求端到端流程图"),
    ("03_core_sequence", diagram_sequence, "核心执行时序图"),
    ("04_rag_flow", diagram_rag, "RAG写入、Chunk与检索流程图"),
    ("05_model_switch", diagram_model_switch, "三类模型分流与切换图"),
    ("06_langgraph_nodes", diagram_langgraph, "LangGraph节点编排图"),
    ("07_agent_state_transition", diagram_state, "智能体状态扭转图"),
    ("08_tool_mcp_skill", diagram_tools, "Tool/MCP/Skill调用架构图"),
    ("09_memory_design", diagram_memory, "短期记忆与长期记忆设计图"),
    ("10_data_deploy", diagram_data_deploy, "数据存储与离线部署架构图"),
]


def export_diagrams():
    outputs = []
    for stem, factory, caption in DIAGRAMS:
        drawio = DIAGRAM_DIR / f"{stem}.drawio"
        png = DIAGRAM_DIR / f"{stem}.drawio.png"
        factory().save(drawio)
        if DRAWIO.exists():
            subprocess.run(
                [str(DRAWIO), "--no-sandbox", "-x", "-f", "png", "-e", "-b", "12", "-o", str(png), str(drawio)],
                check=True,
                timeout=90,
            )
        outputs.append({"stem": stem, "drawio": drawio, "png": png, "caption": caption})
    return outputs


def shade_cell(cell, fill):
    tc_pr = cell._tc.get_or_add_tcPr()
    shd = OxmlElement("w:shd")
    shd.set(qn("w:fill"), fill)
    tc_pr.append(shd)


def set_cell_text(cell, text, bold=False, color="0F172A"):
    cell.text = ""
    p = cell.paragraphs[0]
    p.alignment = WD_ALIGN_PARAGRAPH.LEFT
    r = p.add_run(text)
    r.bold = bold
    r.font.size = Pt(9)
    r.font.color.rgb = RGBColor.from_string(color)


def add_table(doc, headers, rows, widths=None):
    table = doc.add_table(rows=1, cols=len(headers))
    table.alignment = WD_TABLE_ALIGNMENT.CENTER
    table.style = "Table Grid"
    for i, h in enumerate(headers):
        cell = table.rows[0].cells[i]
        shade_cell(cell, "E8EEF5")
        set_cell_text(cell, h, True, "0B2545")
        cell.vertical_alignment = WD_CELL_VERTICAL_ALIGNMENT.CENTER
    for row in rows:
        cells = table.add_row().cells
        for i, val in enumerate(row):
            set_cell_text(cells[i], val)
            cells[i].vertical_alignment = WD_CELL_VERTICAL_ALIGNMENT.CENTER
    if widths:
        for row in table.rows:
            for i, width in enumerate(widths):
                row.cells[i].width = Inches(width)
    doc.add_paragraph()
    return table


def add_bullet(doc, text):
    p = doc.add_paragraph(style="List Bullet")
    p.paragraph_format.space_after = Pt(4)
    p.add_run(text)


def add_figure(doc, info, idx):
    doc.add_paragraph()
    p = doc.add_paragraph()
    p.alignment = WD_ALIGN_PARAGRAPH.CENTER
    if info["png"].exists():
        p.add_run().add_picture(str(info["png"]), width=Inches(9.15))
    else:
        p.add_run(f"[图像导出失败，请打开 {info['drawio'].name}]")
    cap = doc.add_paragraph(f"图 {idx}：{info['caption']}（源文件：{info['drawio'].name}）")
    cap.alignment = WD_ALIGN_PARAGRAPH.CENTER
    cap.runs[0].font.size = Pt(9)
    cap.runs[0].font.color.rgb = RGBColor(100, 116, 139)


def create_docx(diagrams):
    doc = Document()
    section = doc.sections[0]
    section.orientation = WD_ORIENT.LANDSCAPE
    section.page_width = Inches(11)
    section.page_height = Inches(8.5)
    section.top_margin = Inches(0.55)
    section.bottom_margin = Inches(0.55)
    section.left_margin = Inches(0.55)
    section.right_margin = Inches(0.55)

    styles = doc.styles
    styles["Normal"].font.name = "Arial"
    styles["Normal"]._element.rPr.rFonts.set(qn("w:eastAsia"), "微软雅黑")
    styles["Normal"].font.size = Pt(10.5)
    styles["Heading 1"].font.name = "Arial"
    styles["Heading 1"]._element.rPr.rFonts.set(qn("w:eastAsia"), "微软雅黑")
    styles["Heading 1"].font.size = Pt(16)
    styles["Heading 1"].font.color.rgb = RGBColor(46, 116, 181)
    styles["Heading 2"].font.name = "Arial"
    styles["Heading 2"]._element.rPr.rFonts.set(qn("w:eastAsia"), "微软雅黑")
    styles["Heading 2"].font.size = Pt(13)
    styles["Heading 2"].font.color.rgb = RGBColor(31, 77, 120)

    title = doc.add_paragraph()
    title.alignment = WD_ALIGN_PARAGRAPH.CENTER
    run = title.add_run("公共底层智能体平台技术架构设计文档")
    run.bold = True
    run.font.size = Pt(24)
    run.font.color.rgb = RGBColor(15, 23, 42)
    sub = doc.add_paragraph()
    sub.alignment = WD_ALIGN_PARAGRAPH.CENTER
    sr = sub.add_run("draw.io 增强版｜覆盖指标体系构建 Agent 与物料分类补全 Agent")
    sr.font.size = Pt(11)
    sr.font.color.rgb = RGBColor(100, 116, 139)

    doc.add_paragraph()
    doc.add_heading("1. 需求复述与设计边界", level=1)
    doc.add_paragraph(
        "本架构不是为单一业务写死的一套流程，而是抽象公共底层智能体平台，通过 Agent 模板承载两个当前业务需求："
        "指标体系构建 Agent、基于物料分类/物料知识库的补全 Agent。平台底座需要同时具备 Agent Runtime、LangGraph 状态机、"
        "RAG 知识服务、Tool/MCP/Skill 能力体系、模型路由、审计脱敏、可观测、离线部署与后续扩展能力。"
    )
    add_table(
        doc,
        ["业务需求", "核心输入", "核心输出", "主处理路径"],
        [
            ["指标体系构建 Agent", "表结构 JSON、Excel/Word 指标说明、Prompt、业务域上下文", "指标体系 JSON、SQL 建议、可行性检查、人工确认状态", "Schema瘦身 + RAG检索 + 模型推导 + 规则复评 + HITL"],
            ["物料分类补全 Agent", "物料知识库 Excel、待补全 Excel、物料ID/分类/字段别名", "补全后 Excel、异常 Sheet、差异报告、审计日志", "结构化精确查询 + 批量字段回填；RAG/LLM只做辅助"],
        ],
        [1.5, 1.9, 1.8, 2.1],
    )

    doc.add_heading("2. 总体技术架构", level=1)
    doc.add_paragraph(
        "总体架构采用 Python AI 服务 + Java 管理后台的组合。Java 继续承担企业后台、权限配置、任务管理等能力；Python 服务负责 FastAPI 接入、"
        "LangGraph 编排、RAG、模型调用、工具执行与文件处理。模型由 Model Gateway 统一路由，存储使用 PostgreSQL + pgvector 作为主库和向量库，"
        "Redis 承担队列、缓存和分布式锁。"
    )
    add_figure(doc, diagrams[0], 1)

    doc.add_heading("3. 端到端业务流程", level=1)
    doc.add_paragraph(
        "两个业务流程共享底座但主路径不同：指标 Agent 是偏生成式推理流程，需要 Schema 瘦身、知识检索和指标生成；物料补全 Agent 是偏数据处理流程，"
        "主路径必须落到结构化精确匹配和批量回填，不能把它设计成普通问答式 RAG。"
    )
    add_figure(doc, diagrams[1], 2)

    doc.add_heading("4. 核心执行时序", level=1)
    doc.add_paragraph(
        "所有任务以 run_id 为主线追踪。FastAPI 创建任务并持久化元数据后，由 LangGraph 驱动节点执行；节点通过 Tool/MCP/Skill 调用外部能力，"
        "需要知识上下文时访问 RAG，需要模型能力时访问 Model Gateway。每一步写入 checkpoint、artifact 和 audit_log，支持断点恢复与审计追溯。"
    )
    add_figure(doc, diagrams[2], 3)

    doc.add_heading("5. RAG 知识库流程", level=1)
    doc.add_paragraph(
        "RAG 服务拆成写入链路和检索链路。写入时按文件类型解析为统一 DocumentModel，再依据文档结构分块、生成 embedding 并落入 pgvector。"
        "检索时先进行 Query 理解，再结合 metadata filter、向量召回、重排与权限过滤，最终把可引用片段注入 GraphState。"
    )
    add_figure(doc, diagrams[3], 4)
    add_table(
        doc,
        ["知识类型", "分块策略", "检索策略", "使用场景"],
        [
            ["指标口径/业务说明 Word", "按标题层级、段落语义和 token 窗口分块", "业务域过滤 + 向量召回 + rerank", "指标定义、口径解释、维度度量建议"],
            ["物料知识库 Excel", "主路径结构化落库；必要时按 sheet/row/主键生成辅助 chunk", "物料ID/分类精确查询优先，低置信度才用语义辅助", "字段解释、分类规则、异常匹配说明"],
            ["历史人工确认样本", "按案例、业务域、问题类型沉淀", "metadata filter + topK 相似案例", "复用修正经验、生成评测样本"],
        ],
        [1.5, 2.1, 2.0, 1.8],
    )

    doc.add_heading("6. 模型分流与切换", level=1)
    doc.add_paragraph(
        "模型不在业务节点里硬编码。节点只声明 task_type，Model Gateway 根据任务类型、成本、延迟、可用性和 fallback 策略选择小模型、主推理模型、"
        "Embedding/Rerank 或确定性执行器。前期可用 CPU Local/API Stub 验证功能，确认模型后再选择 GPU 与 vLLM 等推理框架。"
    )
    add_figure(doc, diagrams[4], 5)

    doc.add_heading("7. LangGraph 节点编排", level=1)
    doc.add_paragraph(
        "LangGraph 由公共节点和业务节点组成。公共节点负责输入标准化、权限脱敏、计划生成、工具执行、校验与审计；业务节点只实现具体业务差异。"
        "这样新增 Agent 时只需增加模板和少量业务节点，而不需要重写底层运行框架。"
    )
    add_figure(doc, diagrams[5], 6)

    doc.add_heading("8. 状态机与记忆设计", level=1)
    doc.add_paragraph(
        "智能体状态围绕 run 生命周期扭转。短期记忆用于当前任务的上下文、检索片段、工具结果和中间结果；长期记忆用于字段字典、指标知识、物料分类规则、"
        "人工确认样本与评测样本。长期记忆进入模型前必须经过权限过滤和脱敏摘要。"
    )
    add_figure(doc, diagrams[6], 7)
    add_figure(doc, diagrams[8], 8)

    doc.add_heading("9. Tool / MCP / Skill 能力体系", level=1)
    doc.add_paragraph(
        "Tool 用于确定性动作，例如数据库查询、文件解析、Excel 导出；MCP 用于标准化外部系统协议接入，例如 PostgreSQL、文件仓库和知识服务；"
        "Skill 用于封装可复用专家流程，例如指标设计流程、物料补全策略和 draw.io 图生成。所有能力调用都必须经过注册、权限、超时、重试、审计和输出校验。"
    )
    add_figure(doc, diagrams[7], 9)

    doc.add_heading("10. 数据与部署架构", level=1)
    doc.add_paragraph(
        "前期按内网单机 VM 部署设计，应用服务收敛为两个单体：agent-admin 负责用户、权限、配置和任务下发；agent-api 作为统一 AI 服务，"
        "在同一 Python 进程内承载 FastAPI、LangGraph 编排、RAG、Tool/MCP、Model Gateway、REST/SSE 与 Redis 队列能力。"
        "这种方式减少早期部署复杂度，便于离线环境验证、排查和交付。"
    )
    add_figure(doc, diagrams[9], 10)
    add_table(
        doc,
        ["组件", "建议版本", "作用", "离线部署要点"],
        [
            ["Python", "3.11.x", "AI 服务、RAG、LangGraph、文件处理", "制作 wheels 离线包，固定 constraints"],
            ["FastAPI", "0.115+", "Agent API、SSE进度、文件上传", "与 uvicorn/gunicorn 一并离线安装"],
            ["LangChain / LangGraph", "1.0+", "模型抽象、状态图编排、checkpoint", "版本锁定，避免 API 兼容问题"],
            ["PostgreSQL + pgvector", "PostgreSQL 16 + pgvector 0.7+", "业务主库、向量库、审计库", "内网安装包、扩展预编译或源码包"],
            ["Redis", "7.x", "任务队列、缓存、锁", "单机可用，后续可主从/哨兵"],
            ["agent-api", "Python 3.11 + FastAPI + LangGraph 1.0+", "统一AI服务，进程内集成RAG、Tool/MCP、Model Gateway、任务队列", "与Python依赖、模型配置、工具清单一起打包"],
            ["agent-admin", "Java Spring Boot，沿用现有服务", "管理后台、用户权限、配置、任务下发", "通过REST调用agent-api，不承载AI推理逻辑"],
            ["MCP/Tool/Skill", "按内部封装版本管理", "外部能力、确定性工具、专家流程", "作为agent-api内部能力注册，随服务配置发布"],
        ],
        [1.3, 1.2, 2.0, 2.1],
    )

    doc.add_heading("11. 高性能与治理要点", level=1)
    for item in [
        "避免把上千/上万张表拼成超大 JSON 直接喂给模型，必须先做 schema 瘦身、业务域切分、字段摘要和候选表检索。",
        "物料补全按批次进行结构化查询和批量回填，使用 B-tree 索引、JSONB row_snapshot 和批量写入，RAG/LLM 不进入主链路。",
        "QPS 100 的目标通过 FastAPI 异步接口、Redis 队列、任务状态轮询/SSE、RAG 缓存、模型限流和批处理实现。",
        "所有模型输入前做权限过滤和脱敏，所有 Tool/MCP/Skill 调用写 audit_log，输出结果做 JSON Schema 或 Excel 结构校验。",
        "离线部署需要同步准备 Python wheels、系统 RPM/DEB、Docker 镜像、模型文件、pgvector 扩展包和回滚脚本。",
    ]:
        add_bullet(doc, item)

    doc.add_heading("12. 交付物说明", level=1)
    doc.add_paragraph("本次生成的架构图均为原生 draw.io 文件，并导出为嵌入 XML 的 PNG，后续可直接用 draw.io 打开 PNG 或 .drawio 源文件继续编辑。")
    add_table(
        doc,
        ["编号", "图名称", "draw.io 源文件", "PNG 导出文件"],
        [[str(i + 1), info["caption"], info["drawio"].name, info["png"].name] for i, info in enumerate(diagrams)],
        [0.45, 1.8, 2.25, 2.25],
    )
    doc.save(DOCX)


def main():
    diagrams = export_diagrams()
    create_docx(diagrams)
    print(json.dumps({"docx": str(DOCX), "diagram_dir": str(DIAGRAM_DIR), "count": len(diagrams)}, ensure_ascii=False, indent=2))


if __name__ == "__main__":
    main()
