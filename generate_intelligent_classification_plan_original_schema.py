from pathlib import Path
import sys

sys.path.insert(0, str(Path.cwd() / ".vendor"))
import xlsxwriter


OUT = Path("交付物/智能分类智能体_计划清单_按原Excel结构版.xlsx")
OUT.parent.mkdir(exist_ok=True)


product_name = "智能分类智能体"
product_desc = "以主数据中物料分类数据为试点，智能补全物料目标模板中字段属性数据"

rows = [
    {
        "l3": "智能体基座平台",
        "l3_desc": "构建支持LangGraph智能体运行的底层能力、编排框架及工具集成环境，提供标准化的Agent开发SDK",
        "dev": "智能体整体架构设计",
        "item": "输出智能分类智能体技术架构设计方案，明确前端/后端/Agent/RAG/模型/数据存储/审计模块边界与交互关系",
        "effort": "1.0人日",
    },
    {
        "l3": "智能体基座平台",
        "l3_desc": "构建支持LangGraph智能体运行的底层能力、编排框架及工具集成环境，提供标准化的Agent开发SDK",
        "dev": "环境搭建",
        "item": "搭建智能体运行环境，准备Python运行环境、LangGraph/LangChain依赖、离线依赖包、基础配置与启动脚本",
        "effort": "1.0人日",
    },
    {
        "l3": "智能体基座平台",
        "l3_desc": "构建支持LangGraph智能体运行的底层能力、编排框架及工具集成环境，提供标准化的Agent开发SDK",
        "dev": "框架搭建",
        "item": "定义LangGraph状态、节点、边界与基础工具调用规范，封装base tool、文件解析、数据库查询、结果导出等公共能力",
        "effort": "2.0人日",
    },
    {
        "l3": "智能分类",
        "l3_desc": "构建面向物料分类场景的RAG增强知识库与LangGraph Agent智能体，完成业务逻辑编排、工具集成及接口开发，实现对物料数据的自动化分类与属性补全",
        "dev": "需求与样例梳理",
        "item": "明确智能分类范围、目标Excel模板、输入物料知识库、待补全Excel、输出补全结果、异常Sheet、差异报告及人工确认边界",
        "effort": "1.0人日",
    },
    {
        "l3": "智能分类",
        "l3_desc": "构建面向物料分类场景的RAG增强知识库与LangGraph Agent智能体，完成业务逻辑编排、工具集成及接口开发，实现对物料数据的自动化分类与属性补全",
        "dev": "分类体系与字段字典梳理",
        "item": "梳理物料分类层级、分类编码、分类名称、分类规则、属性字段、字段别名与同义词，形成目标模板字段清单和字段映射规则",
        "effort": "2.0人日",
    },
    {
        "l3": "智能分类",
        "l3_desc": "构建面向物料分类场景的RAG增强知识库与LangGraph Agent智能体，完成业务逻辑编排、工具集成及接口开发，实现对物料数据的自动化分类与属性补全",
        "dev": "RAG知识库构建",
        "item": "数据处理与索引构建：清洗物料分类数据，进行文件切片/Chunking，生成Embedding向量并写入向量数据库",
        "effort": "2.0人日",
    },
    {
        "l3": "智能分类",
        "l3_desc": "构建面向物料分类场景的RAG增强知识库与LangGraph Agent智能体，完成业务逻辑编排、工具集成及接口开发，实现对物料数据的自动化分类与属性补全",
        "dev": "RAG知识库构建",
        "item": "检索策略调优：优化向量检索、关键词检索、元数据过滤、Top-K参数与重排策略，提高分类规则和样例召回准确性",
        "effort": "1.5人日",
    },
    {
        "l3": "智能分类",
        "l3_desc": "构建面向物料分类场景的RAG增强知识库与LangGraph Agent智能体，完成业务逻辑编排、工具集成及接口开发，实现对物料数据的自动化分类与属性补全",
        "dev": "结构化物料库构建",
        "item": "将物料主数据、分类规则、属性字段、字段字典结构化入库，建立物料ID、分类编码、字段别名等索引，支撑精确匹配和批量补全",
        "effort": "2.0人日",
    },
    {
        "l3": "智能分类",
        "l3_desc": "构建面向物料分类场景的RAG增强知识库与LangGraph Agent智能体，完成业务逻辑编排、工具集成及接口开发，实现对物料数据的自动化分类与属性补全",
        "dev": "Prompt提示词工程开发",
        "item": "设计多场景Prompt模板，覆盖分类判断、候选解释、字段补全、异常说明等场景，配置system prompt与输出JSON Schema约束",
        "effort": "1.5人日",
    },
    {
        "l3": "智能分类",
        "l3_desc": "构建面向物料分类场景的RAG增强知识库与LangGraph Agent智能体，完成业务逻辑编排、工具集成及接口开发，实现对物料数据的自动化分类与属性补全",
        "dev": "智能分类策略开发",
        "item": "设计规则优先、结构化检索辅助、小模型分类兜底的分层策略，输出分类编码、分类名称、置信度、命中来源和判断原因",
        "effort": "2.0人日",
    },
    {
        "l3": "智能分类",
        "l3_desc": "构建面向物料分类场景的RAG增强知识库与LangGraph Agent智能体，完成业务逻辑编排、工具集成及接口开发，实现对物料数据的自动化分类与属性补全",
        "dev": "Agent开发",
        "item": "状态图与节点开发：定义LangGraph状态结构，编排Excel解析、字段识别、候选召回、分类判断、属性补全、结果校验、报告导出等节点",
        "effort": "3.0人日",
    },
    {
        "l3": "智能分类",
        "l3_desc": "构建面向物料分类场景的RAG增强知识库与LangGraph Agent智能体，完成业务逻辑编排、工具集成及接口开发，实现对物料数据的自动化分类与属性补全",
        "dev": "Agent开发",
        "item": "记忆与上下文管理：集成Redis或Checkpoint机制，实现多轮处理上下文缓存、异常重试、断点续跑和历史样本沉淀",
        "effort": "1.5人日",
    },
    {
        "l3": "智能分类",
        "l3_desc": "构建面向物料分类场景的RAG增强知识库与LangGraph Agent智能体，完成业务逻辑编排、工具集成及接口开发，实现对物料数据的自动化分类与属性补全",
        "dev": "工具集成开发",
        "item": "封装DB查询Tool、Excel解析Tool、Excel导出Tool、RAG检索Tool、字段映射Tool，统一工具入参、出参、异常码和审计日志",
        "effort": "2.5人日",
    },
    {
        "l3": "智能分类",
        "l3_desc": "构建面向物料分类场景的RAG增强知识库与LangGraph Agent智能体，完成业务逻辑编排、工具集成及接口开发，实现对物料数据的自动化分类与属性补全",
        "dev": "Excel补全结果生成",
        "item": "按目标模板生成补全后的Excel，保留原始字段和行号，输出分类结果、补全字段、来源、置信度、异常Sheet、差异报告和统计Sheet",
        "effort": "2.0人日",
    },
    {
        "l3": "智能分类",
        "l3_desc": "构建面向物料分类场景的RAG增强知识库与LangGraph Agent智能体，完成业务逻辑编排、工具集成及接口开发，实现对物料数据的自动化分类与属性补全",
        "dev": "服务接口开发",
        "item": "提供文件上传、任务创建、进度查询、结果下载、异常下载、人工确认回写等HTTP接口，支撑前端或Java后台集成调用",
        "effort": "2.0人日",
    },
    {
        "l3": "智能分类",
        "l3_desc": "构建面向物料分类场景的RAG增强知识库与LangGraph Agent智能体，完成业务逻辑编排、工具集成及接口开发，实现对物料数据的自动化分类与属性补全",
        "dev": "审计与脱敏",
        "item": "记录上传人、文件版本、处理批次、模型调用摘要、工具调用、人工确认记录；对敏感字段进行脱敏，保留结果可追溯信息",
        "effort": "1.5人日",
    },
    {
        "l3": "智能分类",
        "l3_desc": "构建面向物料分类场景的RAG增强知识库与LangGraph Agent智能体，完成业务逻辑编排、工具集成及接口开发，实现对物料数据的自动化分类与属性补全",
        "dev": "评估与系统集成",
        "item": "构建测试样本集，评估分类准确率、字段补全准确率、未命中率、人工介入率、单文件处理耗时；完成接口联调、试点验证和上线交付",
        "effort": "3.0人日",
    },
]


def write_wrapped(ws, row, col, value, fmt):
    ws.write(row, col, value, fmt)


def main():
    wb = xlsxwriter.Workbook(str(OUT))
    wb.set_properties({"title": "智能分类智能体计划清单_按原Excel结构版", "author": "Codex"})

    header = wb.add_format({
        "bold": True,
        "border": 1,
        "align": "center",
        "valign": "vcenter",
        "text_wrap": True,
        "bg_color": "#EAF2F8",
    })
    group_header = wb.add_format({
        "bold": True,
        "border": 1,
        "align": "center",
        "valign": "vcenter",
        "bg_color": "#D9EAD3",
    })
    cell = wb.add_format({"border": 1, "valign": "vcenter", "text_wrap": True})
    center = wb.add_format({"border": 1, "align": "center", "valign": "vcenter", "text_wrap": True})
    l3_fmt = wb.add_format({"border": 1, "align": "center", "valign": "vcenter", "text_wrap": True, "bg_color": "#F8FBFD"})
    item_fmt = wb.add_format({"border": 1, "valign": "top", "text_wrap": True})
    progress_fmt = wb.add_format({"border": 1, "valign": "top", "text_wrap": True, "bg_color": "#F7F7F7"})

    ws = wb.add_worksheet("主数据智能体")
    ws.hide_gridlines(2)
    ws.freeze_panes(2, 0)

    # Header layout follows the screenshot: A/B under L2, C/D under L3, E/F/G under matters.
    ws.merge_range("A1:B1", "L2", group_header)
    ws.merge_range("C1:D1", "L3", group_header)
    ws.merge_range("E1:H1", "事项", group_header)
    ws.write("A2", "产品/系统\n名称", header)
    ws.write("B2", "描述", header)
    ws.write("C2", "功能模块\n名称", header)
    ws.write("D2", "描述", header)
    ws.write("E2", "新功能开发", header)
    ws.write("F2", "事项", header)
    ws.write("G2", "工时", header)
    ws.write("H2", "进展", header)

    start_row = 2
    end_row = start_row + len(rows) - 1
    ws.merge_range(start_row, 0, end_row, 0, product_name, center)
    ws.merge_range(start_row, 1, end_row, 1, product_desc, cell)

    # Merge L3 module name and description by module group.
    idx = start_row
    while idx <= end_row:
        module = rows[idx - start_row]["l3"]
        desc = rows[idx - start_row]["l3_desc"]
        group_start = idx
        while idx <= end_row and rows[idx - start_row]["l3"] == module:
            idx += 1
        group_end = idx - 1
        ws.merge_range(group_start, 2, group_end, 2, module, l3_fmt)
        ws.merge_range(group_start, 3, group_end, 3, desc, cell)

    for i, row in enumerate(rows, start=start_row):
        write_wrapped(ws, i, 4, row["dev"], center)
        write_wrapped(ws, i, 5, row["item"], item_fmt)
        write_wrapped(ws, i, 6, row["effort"], center)
        write_wrapped(ws, i, 7, "", progress_fmt)
        ws.set_row(i, 48)

    ws.set_column("A:A", 18)
    ws.set_column("B:B", 36)
    ws.set_column("C:C", 16)
    ws.set_column("D:D", 44)
    ws.set_column("E:E", 22)
    ws.set_column("F:F", 62)
    ws.set_column("G:G", 12)
    ws.set_column("H:H", 28)
    ws.set_row(0, 24)
    ws.set_row(1, 34)

    # Add a concise note sheet for scope assumptions.
    note = wb.add_worksheet("说明")
    note.write("A1", "说明", group_header)
    notes = [
        ["范围", "本计划按原Excel结构整理，围绕智能分类智能体实现；智能体基座平台仅作为支撑模块列出必要建设项。"],
        ["主路径", "物料数据补全主路径为结构化物料库精确匹配与批量属性补全，RAG/模型用于分类规则解释、语义辅助、低置信度兜底。"],
        ["输出", "补全后的Excel、异常Sheet、差异报告、统计Sheet、审计记录。"],
        ["验收", "以分类准确率、字段补全准确率、未命中率、人工介入率、处理耗时和可追溯性为核心指标。"],
    ]
    note.write_row("A2", ["项", "内容"], header)
    for r, vals in enumerate(notes, start=2):
        note.write_row(r, 0, vals, cell)
        note.set_row(r, 44)
    note.set_column("A:A", 16)
    note.set_column("B:B", 100)

    wb.close()
    print(OUT.resolve())


if __name__ == "__main__":
    main()
