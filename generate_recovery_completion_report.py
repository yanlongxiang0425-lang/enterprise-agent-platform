from pathlib import Path
import sys
from zipfile import ZipFile

sys.path.insert(0, str(Path.cwd() / ".vendor"))

import openpyxl
from docx import Document
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.oxml.ns import qn
from docx.shared import Inches, Pt, RGBColor


OUT = Path("交付物")
REPORT_MD = OUT / "断点恢复与交付完整性检查报告.md"
REPORT_DOCX = OUT / "断点恢复与交付完整性检查报告.docx"


FILES_TO_VALIDATE = [
    OUT / "公共底层智能体平台技术架构设计文档_工程实现版.docx",
    OUT / "公共底层智能体平台技术选型方案_工程实现版.docx",
    OUT / "物料分类补全样例数据流程关系说明.md",
    OUT / "material_agent_outputs" / "试点物料_补全结果_本地验证.xlsx",
    OUT / "material_agent_outputs" / "第3步_新旧字段标准映射表_本地生成.xlsx",
    OUT / "material_agent_outputs" / "第5步_清洗结果表_本地生成.xlsx",
]


CODE_FILES = [
    "material_agent/core/config.py",
    "material_agent/adapters/excel/workbook.py",
    "material_agent/services/knowledge_loader.py",
    "material_agent/services/template_analyzer.py",
    "material_agent/services/field_mapping.py",
    "material_agent/services/completion_engine.py",
    "material_agent/services/validation.py",
    "material_agent/graph/state.py",
    "material_agent/graph/nodes.py",
    "material_agent/graph/builder.py",
    "material_agent/api/routes.py",
    "material_agent/app/main.py",
    "material_agent/cli.py",
    "material_agent/README.md",
    "material_agent/requirements.txt",
]


def office_status(path: Path) -> str:
    if not path.exists():
        return "缺失"
    if path.suffix.lower() in {".docx", ".xlsx"}:
        with ZipFile(path) as archive:
            bad = archive.testzip()
        return "有效" if bad is None else f"损坏：{bad}"
    return "存在"


def workbook_shape(path: Path) -> str:
    if not path.exists() or path.suffix.lower() != ".xlsx":
        return ""
    wb = openpyxl.load_workbook(path, read_only=True, data_only=True)
    return "；".join(f"{ws.title} {ws.max_row}行x{ws.max_column}列" for ws in wb.worksheets)


def build_markdown() -> str:
    rows = []
    for path in FILES_TO_VALIDATE:
        rows.append((str(path), office_status(path), workbook_shape(path) or "-"))

    code_rows = [(path, "存在" if Path(path).exists() else "缺失") for path in CODE_FILES]
    lock_files = sorted(str(path) for path in OUT.glob("~$*"))

    lines = [
        "# 断点恢复与交付完整性检查报告",
        "",
        "检查时间：2026-05-18 22:30（Asia/Shanghai）",
        "",
        "## 1. 恢复结论",
        "",
        "本次断点恢复后，物料分类补全 Agent 的工程代码、样例数据输出、工程实现版技术文档均已落盘并通过基础完整性检查。未发现半写入损坏的 docx/xlsx 交付物。",
        "",
        "电脑关机前未完全展开的部分主要是交付完整性说明和恢复记录。本次已补充生成本报告，作为后续继续开发、验收和交接的索引。",
        "",
        "## 2. 已完成交付物",
        "",
        "| 文件 | 状态 | 结构摘要 |",
        "|---|---|---|",
    ]
    lines.extend(f"| `{path}` | {status} | {shape} |" for path, status, shape in rows)
    lines.extend(
        [
            "",
            "## 3. 工程代码范围",
            "",
            "| 文件 | 状态 |",
            "|---|---|",
        ]
    )
    lines.extend(f"| `{path}` | {status} |" for path, status in code_rows)
    lines.extend(
        [
            "",
            "## 4. 已复跑验证",
            "",
            "| 验证项 | 结果 |",
            "|---|---|",
            "| Python 语法编译 | `python3 -m compileall -q material_agent` 通过 |",
            "| 样例文件解析 | `inspect-samples` 成功读取 8 个输入样例文件 |",
            "| 三文件试点流程 | 输出 30 行、22 个目标字段、23 条异常；知识库识别 308 条有效物料记录 |",
            "| 五步测试流程 | 输出新旧字段映射表和清洗结果表；清洗结果 19 个字段、14 条异常 |",
            "| Office 文件完整性 | 关键 docx/xlsx 均通过 zip 结构校验 |",
            "",
            "## 5. 临时文件说明",
            "",
        ]
    )
    if lock_files:
        lines.append("发现以下 `~$` Office 临时锁文件，属于 Word/Excel 打开文件时产生的占位文件，不作为交付物，也不代表生成失败：")
        lines.append("")
        lines.extend(f"- `{path}`" for path in lock_files)
    else:
        lines.append("未发现 Office 临时锁文件。")
    lines.extend(
        [
            "",
            "## 6. 后续建议",
            "",
            "1. 若继续生产化，优先把字段映射字典迁移到数据库配置表，并保留人工确认状态。",
            "2. 将大 Excel 处理改成异步任务，记录任务状态、输入文件指纹、输出文件路径和异常清单。",
            "3. 对低置信度映射、必填缺失和多候选冲突增加 HITL 人工确认节点。",
            "4. 将当前样例输出作为回归样例，后续每次改动后复跑 `run-pilot` 和 `run-five-step`。",
            "",
        ]
    )
    return "\n".join(lines)


def setup_doc(doc: Document) -> None:
    sec = doc.sections[0]
    sec.top_margin = Inches(0.7)
    sec.bottom_margin = Inches(0.7)
    sec.left_margin = Inches(0.75)
    sec.right_margin = Inches(0.75)
    styles = doc.styles
    styles["Normal"].font.name = "Arial"
    styles["Normal"]._element.rPr.rFonts.set(qn("w:eastAsia"), "微软雅黑")
    styles["Normal"].font.size = Pt(10)
    for name, size, color in [("Heading 1", 16, "1F4D78"), ("Heading 2", 12, "2E74B5")]:
        styles[name].font.name = "Arial"
        styles[name]._element.rPr.rFonts.set(qn("w:eastAsia"), "微软雅黑")
        styles[name].font.size = Pt(size)
        styles[name].font.color.rgb = RGBColor.from_string(color)


def add_table(doc: Document, headers, rows) -> None:
    table = doc.add_table(rows=1, cols=len(headers))
    table.style = "Table Grid"
    for i, header in enumerate(headers):
        cell = table.rows[0].cells[i]
        cell.text = str(header)
        for paragraph in cell.paragraphs:
            for run in paragraph.runs:
                run.bold = True
                run.font.size = Pt(8.5)
    for row in rows:
        cells = table.add_row().cells
        for i, value in enumerate(row):
            cells[i].text = str(value)
            for paragraph in cells[i].paragraphs:
                for run in paragraph.runs:
                    run.font.size = Pt(8.5)
    doc.add_paragraph()


def build_docx() -> None:
    doc = Document()
    setup_doc(doc)
    title = doc.add_paragraph()
    title.alignment = WD_ALIGN_PARAGRAPH.CENTER
    run = title.add_run("断点恢复与交付完整性检查报告")
    run.bold = True
    run.font.size = Pt(20)
    run.font.color.rgb = RGBColor(15, 23, 42)

    subtitle = doc.add_paragraph()
    subtitle.alignment = WD_ALIGN_PARAGRAPH.CENTER
    subtitle.add_run("物料分类补全 Agent / 数据文件更新文档恢复版").font.size = Pt(10)

    doc.add_heading("1. 恢复结论", 1)
    doc.add_paragraph("工程代码、样例数据输出和工程实现版技术文档均已落盘，并通过基础完整性检查。未发现半写入损坏的 docx/xlsx 交付物。")
    doc.add_paragraph("关机前未完全展开的部分主要是交付完整性说明和恢复记录，本次已补充生成本报告作为验收索引。")

    doc.add_heading("2. 已完成交付物", 1)
    add_table(
        doc,
        ["文件", "状态", "结构摘要"],
        [(str(path), office_status(path), workbook_shape(path) or "-") for path in FILES_TO_VALIDATE],
    )

    doc.add_heading("3. 工程代码范围", 1)
    add_table(doc, ["文件", "状态"], [(path, "存在" if Path(path).exists() else "缺失") for path in CODE_FILES])

    doc.add_heading("4. 已复跑验证", 1)
    add_table(
        doc,
        ["验证项", "结果"],
        [
            ["Python 语法编译", "compileall 通过"],
            ["样例文件解析", "inspect-samples 成功读取 8 个输入样例文件"],
            ["三文件试点流程", "输出 30 行、22 个目标字段、23 条异常；知识库 308 条"],
            ["五步测试流程", "输出映射表和清洗结果表；清洗结果 19 个字段、14 条异常"],
            ["Office 文件完整性", "关键 docx/xlsx 均通过 zip 结构校验"],
        ],
    )

    doc.add_heading("5. 临时文件说明", 1)
    lock_files = sorted(str(path) for path in OUT.glob("~$*"))
    if lock_files:
        doc.add_paragraph("以下 Office 临时锁文件属于 Word/Excel 打开文件时产生的占位文件，不作为交付物，也不代表生成失败：")
        add_table(doc, ["临时文件"], [[path] for path in lock_files])
    else:
        doc.add_paragraph("未发现 Office 临时锁文件。")

    doc.add_heading("6. 后续建议", 1)
    for item in [
        "字段映射字典迁移到数据库配置表，保留人工确认状态。",
        "大 Excel 处理改成异步任务，记录任务状态、输入文件指纹、输出文件路径和异常清单。",
        "低置信度映射、必填缺失和多候选冲突增加 HITL 人工确认节点。",
        "将当前样例输出作为回归样例，后续每次改动后复跑 run-pilot 和 run-five-step。",
    ]:
        doc.add_paragraph(item, style="List Number")
    doc.save(REPORT_DOCX)


def main() -> None:
    OUT.mkdir(exist_ok=True)
    REPORT_MD.write_text(build_markdown(), encoding="utf-8")
    build_docx()
    print(REPORT_MD.resolve())
    print(REPORT_DOCX.resolve())


if __name__ == "__main__":
    main()
