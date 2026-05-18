import os
from pathlib import Path
import sys

sys.path.insert(0, str(Path.cwd() / ".vendor"))
import xlsxwriter


OUT_DIR = Path("交付物")
OUT_DIR.mkdir(exist_ok=True)
OUT = OUT_DIR / "智能分类智能体_实施计划清单.xlsx"


plan_rows = [
    ["P0", "需求澄清", "业务目标确认", "确认智能分类智能体只覆盖物料分类与字段属性补全场景，明确输入Excel、目标模板、输出Excel、异常报告、人工确认边界。", "需求确认记录、输入输出样例、边界说明", "产品/业务/技术", "0.5天", "P0", "业务确认目标模板字段、分类口径、补全策略"],
    ["P0", "需求澄清", "样例数据收集", "收集物料知识库Excel、待分类/待补全Excel、已人工确认的历史分类样本、异常样本。", "样例数据包、样本说明", "业务/数据", "0.5天", "P0", "至少包含命中、未命中、多命中、字段缺失、分类冲突样例"],
    ["P0", "数据梳理", "目标Excel模板梳理", "梳理目标模板字段，包括物料ID、物料名称、分类字段、属性字段、必填字段、可覆盖字段、只填空字段。", "目标模板字段清单", "业务/数据", "1天", "P0", "字段名称、类型、是否必填、补全来源、覆盖策略明确"],
    ["P0", "数据梳理", "分类体系设计", "定义物料分类层级、分类编码、分类名称、分类规则、适用范围、冲突处理规则。", "物料分类体系表", "业务/数据", "1天", "P0", "分类层级与规则能覆盖主要样本，规则可被系统化表达"],
    ["P0", "数据梳理", "字段字典与别名设计", "整理字段别名、同义词、历史命名差异，例如物料ID、物料编码、物料号、material_id。", "field_dictionary字段字典", "数据/后端", "1天", "P0", "关键字段可自动识别，别名映射准确率达到验收要求"],
    ["P1", "知识库建设", "物料知识库导入", "解析物料知识库Excel，落库为material_master_rows、material_attributes、material_category_rules等结构。", "知识库导入程序、结构化表", "后端/数据", "2天", "P0", "支持多Sheet导入、版本记录、导入失败明细"],
    ["P1", "知识库建设", "数据清洗与标准化", "对物料ID、分类编码、文本字段、枚举字段、空值、重复值做标准化处理。", "清洗规则、清洗后数据", "数据/后端", "1.5天", "P0", "重复、空值、格式异常可识别并进入异常清单"],
    ["P1", "知识库建设", "分类规则知识库", "将分类规则、字段解释、典型样本、人工确认案例结构化入库；必要时生成RAG辅助索引。", "分类规则库、辅助RAG索引", "后端/AI", "1.5天", "P1", "主路径仍为结构化匹配，RAG只用于语义辅助和规则解释"],
    ["P1", "智能分类策略", "分类策略设计", "设计规则匹配、结构化检索、小模型分类、置信度融合的分层策略，避免所有记录都走大模型。", "分类策略设计说明", "AI/架构", "1天", "P0", "明确规则优先、检索辅助、模型兜底、人工确认触发条件"],
    ["P1", "智能分类策略", "候选召回设计", "基于物料ID、物料名称、规格型号、分类关键词、字段别名召回候选分类与候选属性。", "候选召回接口", "AI/后端", "1.5天", "P0", "可返回topK候选、来源、置信度、命中规则"],
    ["P1", "智能分类策略", "分类Prompt与输出Schema", "设计分类提示词、少样本示例、JSON Schema，约束输出分类编码、分类名称、补全字段、置信度、原因。", "Prompt模板、JSON Schema", "AI", "1天", "P1", "模型输出可被稳定解析，异常输出可重试或降级"],
    ["P2", "Agent编排", "GraphState设计", "定义智能分类Agent状态字段，包括run_id、文件信息、字段映射、候选分类、补全结果、异常列表、审计信息。", "GraphState定义", "AI/后端", "1天", "P0", "状态可支撑断点恢复、人工确认、结果导出"],
    ["P2", "Agent编排", "LangGraph节点拆分", "拆分parse_excel、detect_columns、normalize_rows、retrieve_candidates、classify_material、fill_attributes、validate_result、export_excel节点。", "节点设计清单", "AI/后端", "1天", "P0", "节点职责清晰，可单测，可独立重试"],
    ["P2", "Agent编排", "Excel解析节点", "解析待处理Excel的Sheet、表头、数据行、合并单元格、空列、隐藏列，生成标准行对象。", "parse_excel节点", "后端", "2天", "P0", "能保留原行号、原字段、异常单元格位置"],
    ["P2", "Agent编排", "字段识别节点", "根据字段字典识别物料ID列、名称列、分类列、待补全字段列，支持用户手动修正映射。", "detect_columns节点", "AI/后端", "1.5天", "P0", "关键字段识别失败时进入人工映射"],
    ["P2", "Agent编排", "分类与补全节点", "对每行执行候选召回、分类判断、属性补全，按只填空/覆盖/差异列策略生成结果。", "classify_material、fill_attributes节点", "AI/后端", "3天", "P0", "输出分类、补全字段、来源、置信度、原因"],
    ["P2", "Agent编排", "校验与异常节点", "校验分类为空、多候选冲突、属性缺失、字段覆盖冲突、低置信度，生成异常Sheet。", "validate_result节点", "后端/AI", "1.5天", "P0", "异常分类准确，错误原因可读"],
    ["P2", "工具接口", "数据库查询Tool", "封装物料主数据、分类规则、字段字典、历史确认样本查询工具，提供强Schema输入输出。", "DB Query Tool", "后端", "1.5天", "P0", "工具调用有权限、审计、超时、错误码"],
    ["P2", "工具接口", "Excel导出Tool", "导出补全后Excel、异常Sheet、差异报告、统计Sheet，保留原字段与原行顺序。", "Excel Export Tool", "后端", "1.5天", "P0", "导出文件可直接交付业务复核"],
    ["P2", "工具接口", "人工确认接口", "低置信度、多命中、字段冲突进入人工确认；人工修正结果写回长期记忆/样本库。", "HITL确认接口", "前后端", "2天", "P1", "人工确认后可继续批处理并沉淀样本"],
    ["P3", "服务集成", "Agent API开发", "提供任务创建、文件上传、进度查询、结果下载、异常下载、人工确认回写接口。", "REST API、接口文档", "后端", "2天", "P0", "接口可被Java后台或前端调用"],
    ["P3", "服务集成", "任务队列与批处理", "大文件异步处理，支持任务状态、分页处理、失败重试、断点续跑。", "异步任务处理能力", "后端", "2天", "P1", "万级行Excel可稳定处理，不阻塞API线程"],
    ["P3", "服务集成", "审计与脱敏", "记录上传人、文件版本、处理结果、工具调用、模型调用摘要、人工确认历史；敏感字段脱敏。", "审计日志、脱敏规则", "后端/安全", "1.5天", "P0", "满足内部审计要求，不泄露敏感原文"],
    ["P3", "评测验收", "评测集构建", "构建golden cases，覆盖分类命中、分类冲突、字段补全、字段覆盖、未命中、多命中等场景。", "评测集与基线结果", "业务/AI", "1.5天", "P0", "每次版本发布可回归评测"],
    ["P3", "评测验收", "准确率与性能评测", "统计分类准确率、字段补全准确率、未命中率、人工介入率、单文件耗时、单行耗时。", "评测报告", "AI/测试", "2天", "P0", "达到业务约定指标后进入试运行"],
    ["P4", "上线试运行", "业务试点", "选择一批真实物料分类数据进行试点，收集人工修正、异常样本、性能数据。", "试点报告、问题清单", "业务/测试/技术", "3天", "P1", "试点问题闭环，确认上线范围"],
    ["P4", "上线试运行", "上线与运维交接", "整理部署包、配置说明、操作手册、回滚方案、常见问题处理。", "上线包、运维手册", "后端/运维", "1.5天", "P1", "运维可独立部署、排查、回滚"],
]


milestones = [
    ["M1", "需求与数据确认", "P0", "完成样例数据、目标模板、分类体系、字段字典确认", "可进入开发"],
    ["M2", "知识库与分类策略完成", "P1", "物料知识库结构化入库，候选召回和分类策略完成", "可进入Agent编排"],
    ["M3", "Agent主链路可跑通", "P2", "上传Excel到导出补全结果全链路跑通", "可进入接口集成"],
    ["M4", "评测与试点通过", "P3-P4", "准确率、补全率、异常处理、性能满足验收", "可上线试运行"],
]


risks = [
    ["分类口径不统一", "同一物料在不同部门有不同分类口径", "先固化分类体系和优先级，冲突样本进入人工确认"],
    ["Excel模板不稳定", "业务上传文件字段名、Sheet结构经常变化", "建设字段字典和人工字段映射，保留模板版本"],
    ["数据质量差", "物料ID缺失、重复、规格描述不规范", "清洗规则前置，异常Sheet明确反馈"],
    ["过度依赖大模型", "成本高、速度慢、结果不稳定", "规则和结构化检索优先，小模型兜底，大模型只处理复杂样本"],
    ["补全覆盖风险", "覆盖已有字段可能引入业务争议", "默认只填空，覆盖策略需配置，输出差异列"],
    ["准确率无法解释", "业务不接受黑盒分类结果", "每条结果记录来源、命中规则、候选、置信度、原因"],
]


def set_widths(ws, widths):
    for idx, width in enumerate(widths):
        ws.set_column(idx, idx, width)


def main():
    wb = xlsxwriter.Workbook(str(OUT))
    wb.set_properties({
        "title": "智能分类智能体实施计划清单",
        "subject": "仅针对物料智能分类与属性补全Agent需求",
        "author": "Codex",
    })

    title_fmt = wb.add_format({"bold": True, "font_size": 16, "font_color": "#0F172A"})
    subtitle_fmt = wb.add_format({"font_size": 10, "font_color": "#475569"})
    header_fmt = wb.add_format({
        "bold": True, "bg_color": "#D9EAF7", "border": 1, "align": "center",
        "valign": "vcenter", "text_wrap": True
    })
    cell_fmt = wb.add_format({"border": 1, "valign": "top", "text_wrap": True})
    center_fmt = wb.add_format({"border": 1, "align": "center", "valign": "vcenter", "text_wrap": True})
    phase_fmt = wb.add_format({"border": 1, "align": "center", "valign": "vcenter", "text_wrap": True, "bold": True, "bg_color": "#F1F5F9"})
    p0_fmt = wb.add_format({"border": 1, "align": "center", "valign": "vcenter", "bold": True, "font_color": "#9F1239", "bg_color": "#FFE4E6"})
    p1_fmt = wb.add_format({"border": 1, "align": "center", "valign": "vcenter", "bold": True, "font_color": "#92400E", "bg_color": "#FEF3C7"})

    ws = wb.add_worksheet("智能分类计划总表")
    ws.freeze_panes(4, 0)
    ws.merge_range("A1:I1", "智能分类智能体实施计划清单", title_fmt)
    ws.merge_range("A2:I2", "范围：只针对物料智能分类与属性补全Agent；公共底座能力作为依赖，不作为本计划主任务。", subtitle_fmt)
    headers = ["阶段", "模块", "任务项", "建设内容", "主要产出", "责任角色", "预估工期", "优先级", "验收标准"]
    for col, h in enumerate(headers):
        ws.write(3, col, h, header_fmt)
    for row_idx, row in enumerate(plan_rows, start=4):
        for col_idx, value in enumerate(row):
            fmt = cell_fmt
            if col_idx == 0:
                fmt = phase_fmt
            elif col_idx in [5, 6, 7]:
                fmt = center_fmt
            if col_idx == 7:
                fmt = p0_fmt if value == "P0" else p1_fmt
            ws.write(row_idx, col_idx, value, fmt)
    ws.autofilter(3, 0, 3 + len(plan_rows), len(headers) - 1)
    set_widths(ws, [8, 14, 18, 44, 24, 14, 10, 10, 36])
    for r in range(4, 4 + len(plan_rows)):
        ws.set_row(r, 62)

    ws2 = wb.add_worksheet("里程碑")
    ws2.merge_range("A1:E1", "智能分类智能体里程碑", title_fmt)
    headers2 = ["里程碑", "名称", "阶段范围", "完成标准", "是否可进入下一阶段"]
    for col, h in enumerate(headers2):
        ws2.write(2, col, h, header_fmt)
    for r, row in enumerate(milestones, start=3):
        for c, v in enumerate(row):
            ws2.write(r, c, v, center_fmt if c in [0, 2, 4] else cell_fmt)
    set_widths(ws2, [12, 22, 14, 58, 20])
    for r in range(3, 3 + len(milestones)):
        ws2.set_row(r, 48)

    ws3 = wb.add_worksheet("风险与验收关注点")
    ws3.merge_range("A1:C1", "风险与验收关注点", title_fmt)
    headers3 = ["风险点", "表现", "应对策略"]
    for col, h in enumerate(headers3):
        ws3.write(2, col, h, header_fmt)
    for r, row in enumerate(risks, start=3):
        for c, v in enumerate(row):
            ws3.write(r, c, v, cell_fmt)
    set_widths(ws3, [24, 42, 54])
    for r in range(3, 3 + len(risks)):
        ws3.set_row(r, 48)

    wb.close()
    print(OUT.resolve())


if __name__ == "__main__":
    main()
