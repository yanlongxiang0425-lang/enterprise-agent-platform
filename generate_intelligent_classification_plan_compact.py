import sys
from pathlib import Path

sys.path.insert(0, str(Path.cwd() / ".vendor"))
import xlsxwriter


OUT_DIR = Path("交付物")
OUT_DIR.mkdir(exist_ok=True)
OUT = OUT_DIR / "智能分类智能体_实施计划清单_合并版.xlsx"


rows = [
    [
        "P0",
        "需求与样例确认",
        "业务边界、输入输出、样例数据确认",
        "确认智能分类智能体只覆盖物料分类与属性补全；明确物料知识库Excel、待处理Excel、目标模板、输出结果、异常报告、人工确认边界；收集命中、未命中、多命中、字段缺失、分类冲突等样例。",
        "需求确认记录；输入输出样例；异常样例集；业务边界说明",
        "业务/产品/技术",
        "1天",
        "P0",
        "业务确认目标模板、分类口径、补全范围与异常处理边界",
    ],
    [
        "P0",
        "数据与分类体系梳理",
        "目标模板、分类体系、字段字典统一设计",
        "梳理目标Excel字段、必填字段、可补全字段、覆盖策略；定义物料分类层级、分类编码、分类规则；整理字段别名和同义词，例如物料ID、物料编码、物料号、material_id。",
        "目标模板字段清单；物料分类体系表；字段字典/别名映射表",
        "业务/数据/后端",
        "2天",
        "P0",
        "关键字段可识别，分类口径可系统化表达，补全字段来源明确",
    ],
    [
        "P1",
        "物料知识库建设",
        "知识库导入、清洗、结构化存储",
        "解析物料知识库Excel，多Sheet入库；对物料ID、分类编码、文本字段、枚举字段、空值、重复值做标准化；建立material_master_rows、material_attributes、material_category_rules等结构。",
        "知识库导入程序；结构化数据表；数据清洗规则；导入异常清单",
        "数据/后端",
        "3天",
        "P0",
        "支持版本记录、异常明细、重复/空值/格式异常识别",
    ],
    [
        "P1",
        "智能分类策略设计",
        "规则匹配、候选召回、模型分类、置信度融合",
        "设计规则优先、结构化检索辅助、小模型分类兜底的分层策略；基于物料ID、名称、规格型号、分类关键词召回候选；输出分类编码、分类名称、补全字段、置信度和原因。",
        "分类策略说明；候选召回接口；Prompt模板；JSON Schema",
        "AI/架构/后端",
        "3天",
        "P0",
        "明确规则优先、模型兜底、人工确认触发条件；模型输出可稳定解析",
    ],
    [
        "P2",
        "Agent状态与节点编排",
        "GraphState与LangGraph节点设计开发",
        "定义run_id、文件信息、字段映射、候选分类、补全结果、异常列表、审计信息等状态；开发parse_excel、detect_columns、normalize_rows、retrieve_candidates、classify_material、fill_attributes、validate_result、export_excel等节点。",
        "GraphState定义；LangGraph节点实现；节点单测用例",
        "AI/后端",
        "5天",
        "P0",
        "上传Excel到输出补全结果主链路可跑通，节点可独立重试和定位问题",
    ],
    [
        "P2",
        "Excel处理与结果导出",
        "Excel解析、字段识别、补全结果、异常Sheet、差异报告",
        "解析待处理Excel的Sheet、表头、行号、空列、隐藏列；识别物料ID列、名称列、分类列、待补全字段列；导出补全后Excel、异常Sheet、差异报告、统计Sheet，并保留原字段和原行顺序。",
        "Excel解析能力；字段映射能力；补全结果Excel；异常/差异/统计Sheet",
        "后端/数据",
        "4天",
        "P0",
        "导出文件可直接交付业务复核，异常原因、来源和置信度可追溯",
    ],
    [
        "P2",
        "工具与接口封装",
        "DB查询Tool、Excel导出Tool、人工确认接口",
        "封装物料主数据、分类规则、字段字典、历史确认样本查询工具；封装Excel导出工具；低置信度、多命中、字段冲突进入人工确认，人工修正结果写回样本库。",
        "DB Query Tool；Excel Export Tool；HITL确认接口；工具调用审计",
        "后端/前端/AI",
        "4天",
        "P1",
        "工具具备强Schema、权限、超时、错误码和审计记录；人工确认可回写沉淀",
    ],
    [
        "P3",
        "服务集成与异步处理",
        "Agent API、任务队列、批处理、断点续跑",
        "提供任务创建、文件上传、进度查询、结果下载、异常下载、人工确认回写接口；大文件异步处理，支持任务状态、分页处理、失败重试、断点续跑。",
        "REST API；接口文档；异步任务处理能力；任务状态管理",
        "后端",
        "4天",
        "P0",
        "接口可被Java后台/前端调用，万级行Excel可稳定处理，不阻塞API线程",
    ],
    [
        "P3",
        "审计脱敏与可追溯",
        "处理链路、模型调用、工具调用、人工确认审计",
        "记录上传人、文件版本、处理结果、工具调用、模型调用摘要、人工确认历史；敏感字段脱敏，保留结果来源、命中规则、候选、置信度、原因。",
        "审计日志；脱敏规则；结果追溯字段",
        "后端/安全",
        "2天",
        "P0",
        "满足内部审计要求，敏感原文不进入模型提示词，可解释每条分类结果",
    ],
    [
        "P3",
        "评测与验收",
        "评测集、准确率、补全率、性能评估",
        "构建golden cases，覆盖命中、冲突、字段补全、字段覆盖、未命中、多命中；统计分类准确率、字段补全准确率、未命中率、人工介入率、单文件耗时、单行耗时。",
        "评测集；评测报告；问题清单；验收结论",
        "业务/AI/测试",
        "3天",
        "P0",
        "达到业务约定准确率、补全率和性能指标后进入试运行",
    ],
    [
        "P4",
        "试点上线与交接",
        "真实数据试点、问题闭环、上线包与运维交接",
        "选择真实物料分类数据试点，收集人工修正、异常样本、性能数据；整理部署包、配置说明、操作手册、回滚方案、常见问题处理。",
        "试点报告；上线包；操作手册；回滚方案；运维交接材料",
        "业务/测试/后端/运维",
        "4天",
        "P1",
        "试点问题闭环，运维可独立部署、排查和回滚",
    ],
]


milestones = [
    ["M1", "需求与数据确认", "完成业务边界、目标模板、分类体系、字段字典、样例数据确认", "第1周"],
    ["M2", "分类主链路跑通", "知识库导入、候选召回、分类策略、Agent节点主链路可运行", "第2周"],
    ["M3", "接口与批处理完成", "API、异步任务、Excel导出、人工确认、审计追溯完成", "第3周"],
    ["M4", "评测试点通过", "准确率、补全率、性能和异常处理满足验收", "第4周"],
]


risks = [
    ["分类口径不统一", "先固化分类体系和优先级，冲突样本进入人工确认"],
    ["Excel模板不稳定", "字段字典 + 模板版本 + 人工字段映射兜底"],
    ["数据质量差", "导入清洗前置，异常Sheet反馈缺失/重复/格式问题"],
    ["过度依赖大模型", "规则和结构化检索优先，小模型兜底，大模型只处理复杂样本"],
    ["覆盖已有字段有争议", "默认只填空，覆盖策略配置化，输出差异列"],
]


def main():
    wb = xlsxwriter.Workbook(str(OUT))
    wb.set_properties({"title": "智能分类智能体实施计划清单_合并版", "author": "Codex"})

    title_fmt = wb.add_format({"bold": True, "font_size": 16, "font_color": "#0F172A"})
    note_fmt = wb.add_format({"font_size": 10, "font_color": "#475569"})
    header_fmt = wb.add_format({"bold": True, "bg_color": "#D9EAF7", "border": 1, "align": "center", "valign": "vcenter", "text_wrap": True})
    cell_fmt = wb.add_format({"border": 1, "valign": "top", "text_wrap": True})
    center_fmt = wb.add_format({"border": 1, "align": "center", "valign": "vcenter", "text_wrap": True})
    phase_fmt = wb.add_format({"border": 1, "align": "center", "valign": "vcenter", "bold": True, "bg_color": "#F1F5F9"})
    p0_fmt = wb.add_format({"border": 1, "align": "center", "valign": "vcenter", "bold": True, "font_color": "#9F1239", "bg_color": "#FFE4E6"})
    p1_fmt = wb.add_format({"border": 1, "align": "center", "valign": "vcenter", "bold": True, "font_color": "#92400E", "bg_color": "#FEF3C7"})

    ws = wb.add_worksheet("智能分类计划合并版")
    ws.freeze_panes(4, 0)
    ws.merge_range("A1:I1", "智能分类智能体实施计划清单（合并版）", title_fmt)
    ws.merge_range("A2:I2", "范围：仅针对物料智能分类与属性补全Agent；同类小任务已合并为任务包，便于项目排期。", note_fmt)
    headers = ["阶段", "模块", "任务包", "包含内容", "主要产出", "责任角色", "预估工期", "优先级", "验收标准"]
    for c, h in enumerate(headers):
        ws.write(3, c, h, header_fmt)
    for r, row in enumerate(rows, start=4):
        for c, v in enumerate(row):
            fmt = cell_fmt
            if c == 0:
                fmt = phase_fmt
            elif c in [5, 6]:
                fmt = center_fmt
            elif c == 7:
                fmt = p0_fmt if v == "P0" else p1_fmt
            ws.write(r, c, v, fmt)
        ws.set_row(r, 78)
    widths = [8, 18, 24, 54, 32, 16, 10, 10, 42]
    for c, w in enumerate(widths):
        ws.set_column(c, c, w)
    ws.autofilter(3, 0, 3 + len(rows), len(headers) - 1)

    ws2 = wb.add_worksheet("里程碑与风险")
    ws2.merge_range("A1:D1", "里程碑", title_fmt)
    for c, h in enumerate(["里程碑", "名称", "完成标准", "建议周期"]):
        ws2.write(2, c, h, header_fmt)
    for r, row in enumerate(milestones, start=3):
        for c, v in enumerate(row):
            ws2.write(r, c, v, center_fmt if c in [0, 3] else cell_fmt)
        ws2.set_row(r, 46)
    ws2.merge_range("A9:B9", "主要风险与应对", title_fmt)
    for c, h in enumerate(["风险点", "应对策略"]):
        ws2.write(10, c, h, header_fmt)
    for r, row in enumerate(risks, start=11):
        for c, v in enumerate(row):
            ws2.write(r, c, v, cell_fmt)
        ws2.set_row(r, 44)
    for c, w in enumerate([24, 60, 60, 14]):
        ws2.set_column(c, c, w)

    wb.close()
    print(OUT.resolve())


if __name__ == "__main__":
    main()
