const fs = require("fs");
const path = require("path");
const { execFileSync } = require("child_process");

const OUT = path.resolve("交付物");
const BUILD = path.resolve(".build_agent_platform_v7");
fs.mkdirSync(OUT, { recursive: true });

const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
const p = (text, style = "") => `<w:p><w:pPr>${style ? `<w:pStyle w:val="${style}"/>` : ""}<w:spacing w:after="120"/></w:pPr><w:r><w:t xml:space="preserve">${esc(text)}</w:t></w:r></w:p>`;
const h = (text, level = 1) => p(text, `Heading${level}`);
const bullet = (text) => `<w:p><w:pPr><w:pStyle w:val="ListParagraph"/><w:ind w:left="420"/><w:spacing w:after="80"/></w:pPr><w:r><w:t xml:space="preserve">• ${esc(text)}</w:t></w:r></w:p>`;
const caption = (text) => `<w:p><w:pPr><w:jc w:val="center"/></w:pPr><w:r><w:rPr><w:color w:val="64748B"/><w:sz w:val="18"/></w:rPr><w:t>${esc(text)}</w:t></w:r></w:p>`;
const code = (text) => `<w:p><w:pPr><w:shd w:fill="F8FAFC"/><w:spacing w:after="120"/></w:pPr><w:r><w:rPr><w:rFonts w:ascii="Consolas" w:eastAsia="Consolas"/><w:sz w:val="17"/></w:rPr><w:t xml:space="preserve">${esc(text)}</w:t></w:r></w:p>`;

function table(headers, rows) {
  const width = Math.max(1200, Math.floor(14200 / headers.length));
  const tr = (cells, header = false) =>
    `<w:tr>${cells.map((c) => `<w:tc><w:tcPr><w:tcW w:w="${width}" w:type="dxa"/>${header ? '<w:shd w:fill="E2E8F0"/>' : ""}</w:tcPr><w:p><w:r>${header ? "<w:rPr><w:b/></w:rPr>" : ""}<w:t xml:space="preserve">${esc(c)}</w:t></w:r></w:p></w:tc>`).join("")}</w:tr>`;
  return `<w:tbl><w:tblPr><w:tblW w:w="0" w:type="auto"/><w:tblBorders><w:top w:val="single" w:sz="6" w:color="CBD5E1"/><w:left w:val="single" w:sz="6" w:color="CBD5E1"/><w:bottom w:val="single" w:sz="6" w:color="CBD5E1"/><w:right w:val="single" w:sz="6" w:color="CBD5E1"/><w:insideH w:val="single" w:sz="6" w:color="CBD5E1"/><w:insideV w:val="single" w:sz="6" w:color="CBD5E1"/></w:tblBorders></w:tblPr>${tr(headers, true)}${rows.map((r) => tr(r)).join("")}</w:tbl>`;
}

function vml(widthPt, heightPt, coordW, coordH, body) {
  return `<w:p><w:r><w:pict><v:group style="width:${widthPt}pt;height:${heightPt}pt" coordsize="${coordW},${coordH}">${body}</v:group></w:pict></w:r></w:p>`;
}

function shape(id, x, y, w, h, title, lines, fill = "#F8FAFC", stroke = "#334155") {
  const text = [title, ...(lines || [])].map((t, i) =>
    `<w:p><w:pPr><w:jc w:val="center"/></w:pPr><w:r><w:rPr>${i === 0 ? "<w:b/>" : ""}<w:sz w:val="${i === 0 ? "19" : "15"}"/><w:color w:val="${i === 0 ? "111827" : "475569"}"/></w:rPr><w:t>${esc(t)}</w:t></w:r></w:p>`
  ).join("");
  return `<v:roundrect id="${id}" style="position:absolute;left:${x};top:${y};width:${w};height:${h}" arcsize="10%" fillcolor="${fill}" strokecolor="${stroke}" strokeweight="1.25pt"><v:textbox inset="5pt,4pt,5pt,3pt"><w:txbxContent>${text}</w:txbxContent></v:textbox></v:roundrect>`;
}
function lane(id, x, y, w, h, title, fill = "#F8FAFC", stroke = "#CBD5E1") {
  return `<v:roundrect id="${id}" style="position:absolute;left:${x};top:${y};width:${w};height:${h}" arcsize="5%" fillcolor="${fill}" strokecolor="${stroke}" strokeweight="1pt"><v:textbox inset="8pt,5pt,6pt,3pt"><w:txbxContent><w:p><w:r><w:rPr><w:b/><w:sz w:val="21"/><w:color w:val="0F172A"/></w:rPr><w:t>${esc(title)}</w:t></w:r></w:p></w:txbxContent></v:textbox></v:roundrect>`;
}
function line(id, x1, y1, x2, y2, color = "#64748B") {
  return `<v:line id="${id}" style="position:absolute" from="${x1},${y1}" to="${x2},${y2}" strokecolor="${color}" strokeweight="1.45pt"><v:stroke endarrow="block"/></v:line>`;
}
function titleBox(id, x, y, text, sub) {
  return `<v:shape id="${id}" type="#_x0000_t202" style="position:absolute;left:${x};top:${y};width:1650;height:72" stroked="f" filled="f"><v:textbox inset="0,0,0,0"><w:txbxContent><w:p><w:r><w:rPr><w:b/><w:sz w:val="31"/><w:color w:val="0F172A"/></w:rPr><w:t>${esc(text)}</w:t></w:r></w:p><w:p><w:r><w:rPr><w:sz w:val="17"/><w:color w:val="64748B"/></w:rPr><w:t>${esc(sub)}</w:t></w:r></w:p></w:txbxContent></v:textbox></v:shape>`;
}
function tag(id, x, y, text, color = "#0F766E") {
  return `<v:roundrect id="${id}" style="position:absolute;left:${x};top:${y};width:96;height:28" arcsize="50%" fillcolor="${color}" stroked="f"><v:textbox inset="0,2pt,0,0"><w:txbxContent><w:p><w:pPr><w:jc w:val="center"/></w:pPr><w:r><w:rPr><w:b/><w:sz w:val="15"/><w:color w:val="FFFFFF"/></w:rPr><w:t>${esc(text)}</w:t></w:r></w:p></w:txbxContent></v:textbox></v:roundrect>`;
}

function diagramOverall() {
  let b = titleBox("t1", 35, 20, "公共底层智能体平台总体架构（仅两个业务需求）", "业务范围收敛为：指标体系构建 Agent、基于物料分类/物料知识库的补全 Agent。");
  b += lane("l1", 40, 110, 1670, 86, "接入与体验层");
  b += shape("a1", 80, 148, 230, 38, "Web UI", ["任务提交/结果下载"], "#DBEAFE", "#2563EB");
  b += shape("a2", 340, 148, 250, 38, "Java 管理后台", ["用户/权限/配置"], "#DBEAFE", "#2563EB");
  b += shape("a3", 620, 148, 270, 38, "OpenAPI Client", ["批处理/系统集成"], "#DBEAFE", "#2563EB");
  b += shape("a4", 920, 148, 250, 38, "HITL 工作台", ["确认/修正/发布"], "#FEF3C7", "#D97706");
  b += shape("a5", 1200, 148, 200, 38, "文件上传", ["Excel/Word"], "#DBEAFE", "#2563EB");
  b += shape("a6", 1430, 148, 240, 38, "Nginx/APISIX", ["TLS/鉴权/限流"], "#E0F2FE", "#0284C7");

  b += lane("l2", 40, 230, 1670, 128, "公共智能体运行层");
  b += shape("b1", 80, 280, 210, 48, "Agent API", ["FastAPI/SSE"], "#DCFCE7", "#16A34A");
  b += shape("b2", 320, 280, 250, 48, "Template Router", ["按agent_type加载"], "#DCFCE7", "#16A34A");
  b += shape("b3", 600, 280, 280, 48, "LangGraph Runtime", ["StateGraph/Checkpoint"], "#DCFCE7", "#16A34A");
  b += shape("b4", 910, 280, 230, 48, "Task Queue", ["Redis/Celery/RQ"], "#DCFCE7", "#16A34A");
  b += shape("b5", 1170, 280, 230, 48, "Memory Manager", ["短期/长期记忆"], "#ECFDF5", "#059669");
  b += shape("b6", 1430, 280, 230, 48, "Policy/Audit", ["权限/脱敏/审计"], "#FFE4E6", "#E11D48");

  b += lane("l3", 40, 390, 760, 150, "业务 Agent 模板层");
  b += shape("c1", 120, 455, 260, 54, "指标体系构建 Agent", ["Schema理解/业务域分类/指标推导"], "#EFF6FF", "#2563EB");
  b += shape("c2", 450, 455, 290, 54, "物料分类补全 Agent", ["物料ID/分类识别/属性回填"], "#F0FDF4", "#16A34A");

  b += lane("l4", 840, 390, 870, 150, "能力插件与知识服务层");
  b += shape("d1", 880, 455, 170, 54, "Tool Registry", ["强Schema工具"], "#FEF3C7", "#D97706");
  b += shape("d2", 1075, 455, 170, 54, "MCP Servers", ["DB/File/Knowledge"], "#FEF3C7", "#D97706");
  b += shape("d3", 1270, 455, 180, 54, "Skill Library", ["专家流程"], "#FEF3C7", "#D97706");
  b += shape("d4", 1475, 455, 185, 54, "RAG Service", ["Chunk/Retrieve/Rerank"], "#F3E8FF", "#7C3AED");

  b += lane("l5", 40, 570, 820, 145, "模型路由与模型服务层");
  b += shape("e1", 85, 630, 220, 48, "Model Gateway", ["统一模型入口"], "#FFE4E6", "#E11D48");
  b += shape("e2", 330, 630, 160, 48, "路由模型", ["分类/意图/字段别名"], "#FFE4E6", "#E11D48");
  b += shape("e3", 515, 630, 160, 48, "推理模型", ["指标推导/解释"], "#FFE4E6", "#E11D48");
  b += shape("e4", 700, 630, 125, 48, "向量/重排", ["Embedding/Rerank"], "#FFE4E6", "#E11D48");

  b += lane("l6", 900, 570, 810, 145, "数据存储与治理层");
  b += shape("f1", 940, 630, 240, 48, "PostgreSQL+pgvector", ["agent/rag/material/metric"], "#FFFFFF", "#334155");
  b += shape("f2", 1210, 630, 145, 48, "Redis", ["cache/queue"], "#FFFFFF", "#EA580C");
  b += shape("f3", 1385, 630, 145, 48, "File Repo", ["文件/模型"], "#FFFFFF", "#0284C7");
  b += shape("f4", 1560, 630, 115, 48, "Observe", ["OTel/Phoenix"], "#FFFFFF", "#059669");

  b += line("x0", 1550, 186, 1550, 280);
  b += line("x1", 290, 304, 320, 304); b += line("x2", 570, 304, 600, 304); b += line("x3", 880, 304, 910, 304); b += line("x4", 1140, 304, 1170, 304); b += line("x5", 1400, 304, 1430, 304);
  b += line("x6", 740, 328, 740, 455); b += line("x7", 740, 482, 880, 482); b += line("x8", 1450, 482, 1475, 482);
  b += line("x9", 450, 509, 450, 630); b += line("x10", 1530, 509, 1530, 630);
  return vml(760, 360, 1750, 750, b);
}

function diagramModelSwitch() {
  let b = titleBox("t2", 40, 20, "三类模型分流与三种部署模式切换", "模型切换由 Model Gateway 统一完成，上层 LangGraph Node 只声明任务类型，不直接绑定具体模型。");
  b += lane("input", 60, 120, 360, 520, "任务类型输入");
  b += shape("i1", 110, 190, 260, 52, "路由/分类任务", ["业务域分类/字段别名/意图识别"], "#DBEAFE", "#2563EB");
  b += shape("i2", 110, 305, 260, 52, "复杂推理任务", ["指标推导/口径解释/异常说明"], "#DBEAFE", "#2563EB");
  b += shape("i3", 110, 420, 260, 52, "检索向量任务", ["知识入库/Query Embedding/Rerank"], "#DBEAFE", "#2563EB");
  b += shape("i4", 110, 535, 260, 52, "确定性任务", ["物料ID补全/SQL精确查询"], "#F0FDF4", "#16A34A");

  b += lane("gw", 500, 120, 450, 520, "Model Gateway");
  b += shape("g1", 575, 205, 300, 70, "模型路由策略", ["task_type / latency / cost / fallback"], "#FFE4E6", "#E11D48");
  b += shape("g2", 575, 335, 300, 70, "部署模式切换", ["cpu_local / api_remote / gpu_vllm"], "#FFE4E6", "#E11D48");
  b += shape("g3", 575, 465, 300, 70, "统一接口", ["OpenAI Compatible API"], "#FFE4E6", "#E11D48");

  b += lane("model", 1040, 120, 610, 520, "后端模型与执行器");
  b += shape("m1", 1095, 185, 220, 62, "Small LLM", ["Qwen 7B/14B", "分类/路由"], "#FFFFFF", "#E11D48");
  b += shape("m2", 1370, 185, 220, 62, "Main LLM", ["Qwen 14B/32B", "指标推导"], "#FFFFFF", "#E11D48");
  b += shape("m3", 1095, 325, 220, 62, "Embedding", ["bge-m3", "向量化"], "#FFFFFF", "#7C3AED");
  b += shape("m4", 1370, 325, 220, 62, "Reranker", ["bge-reranker", "重排"], "#FFFFFF", "#7C3AED");
  b += shape("m5", 1095, 465, 220, 62, "CPU Local", ["llama.cpp", "功能验证"], "#FFFFFF", "#334155");
  b += shape("m6", 1370, 465, 220, 62, "GPU/API", ["vLLM 或模型API", "生产/选型"], "#FFFFFF", "#334155");
  b += line("l1", 370, 216, 575, 240); b += line("l2", 370, 331, 575, 240); b += line("l3", 370, 446, 575, 240);
  b += line("l4", 875, 240, 1095, 216); b += line("l5", 875, 240, 1370, 216); b += line("l6", 875, 370, 1095, 356); b += line("l7", 875, 370, 1370, 356);
  b += line("l8", 875, 500, 1095, 496); b += line("l9", 875, 500, 1370, 496);
  b += tag("tag1", 105, 610, "LLM旁路", "#16A34A");
  return vml(760, 330, 1750, 680, b);
}

function diagramRag() {
  let b = titleBox("t3", 40, 20, "RAG 知识库写入、Chunk 分块与检索流程", "指标知识和物料分类规则可进入RAG；物料属性补全主路径仍是结构化精确查询。");
  b += lane("write", 55, 115, 790, 525, "知识库写入链路");
  const write = [
    ["文件接入", "Excel/Word/PDF/指标文档"],
    ["解析标准化", "Parser Router → DocumentModel"],
    ["Chunk策略", "按文档类型分块"],
    ["Embedding", "bge-m3 批量向量化"],
    ["落库索引", "rag_chunks + metadata + vector"],
  ];
  write.forEach((s, i) => {
    const y = 180 + i * 82;
    b += shape(`w${i}`, 120, y, 600, 50, s[0], [s[1]], "#FFFFFF", "#7C3AED");
    if (i < write.length - 1) b += line(`wl${i}`, 420, y + 50, 420, y + 68, "#7C3AED");
  });
  b += lane("read", 920, 115, 770, 525, "知识库检索链路");
  const read = [
    ["Query理解", "抽取问题、业务域、过滤条件"],
    ["检索路由", "结构化过滤 / 向量召回 / 混合检索"],
    ["召回候选", "pgvector topK + metadata filter"],
    ["重排过滤", "reranker + 权限/来源过滤"],
    ["上下文组装", "引用片段 + source/page/chunk_id"],
  ];
  read.forEach((s, i) => {
    const y = 180 + i * 82;
    b += shape(`r${i}`, 995, y, 600, 50, s[0], [s[1]], "#FFFFFF", "#16A34A");
    if (i < read.length - 1) b += line(`rl${i}`, 1295, y + 50, 1295, y + 68, "#16A34A");
  });
  b += shape("rules", 235, 610, 1280, 68, "Chunk 分块规则", ["Excel知识库：结构化表优先入 master_rows，必要时按行生成chunk；Word/PDF：标题层级+语义段落；PPT：slide/section；普通文本：300-800 tokens，50-100 overlap。"], "#FEF3C7", "#D97706");
  return vml(760, 350, 1750, 720, b);
}

function diagramState() {
  let b = titleBox("t4", 40, 20, "智能体状态扭转图", "两类业务Agent共用基础状态，差异状态由各自模板扩展。");
  const states = [
    [100, 150, "INIT", "创建run/加载模板"],
    [360, 150, "INPUT_VALIDATED", "输入校验/权限检查"],
    [620, 150, "PLANNED", "生成执行计划"],
    [880, 150, "RUNNING", "执行Node/Tool"],
    [1140, 150, "WAIT_HITL", "等待人工确认"],
    [1400, 150, "VALIDATING", "Schema/引用/权限校验"],
    [620, 390, "RETRYING", "失败重试/回退"],
    [880, 390, "COMPLETED", "生成最终结果"],
    [1140, 390, "FAILED", "失败终止"],
  ];
  states.forEach((s, i) => b += shape(`s${i}`, s[0], s[1], 190, 62, s[2], [s[3]], i === 7 ? "#DCFCE7" : i === 8 ? "#FFE4E6" : "#FFFFFF", i === 7 ? "#16A34A" : i === 8 ? "#E11D48" : "#334155"));
  b += line("l1", 290, 181, 360, 181); b += line("l2", 550, 181, 620, 181); b += line("l3", 810, 181, 880, 181); b += line("l4", 1070, 181, 1140, 181); b += line("l5", 1330, 181, 1400, 181);
  b += line("l6", 1495, 212, 975, 390, "#16A34A"); b += line("l7", 975, 390, 975, 212, "#64748B"); b += line("l8", 880, 212, 715, 390, "#D97706"); b += line("l9", 715, 390, 880, 181, "#D97706"); b += line("l10", 1070, 421, 1140, 421, "#E11D48");
  b += tag("ok", 1450, 250, "校验通过", "#16A34A"); b += tag("retry", 650, 330, "可重试", "#D97706"); b += tag("fail", 1080, 455, "不可恢复", "#E11D48");
  return vml(760, 280, 1750, 560, b);
}

function diagramLangGraph() {
  let b = titleBox("t5", 40, 20, "LangGraph Node 主题模块与链路编排", "通过公共节点 + 业务节点组合成两个Agent模板，节点之间用StateGraph串联。");
  b += lane("common", 60, 115, 1630, 155, "公共节点模块");
  const common = [
    ["input_adapter", "输入标准化"],
    ["policy_guard", "权限/脱敏"],
    ["planner", "计划生成"],
    ["tool_executor", "工具执行"],
    ["validator", "结果校验"],
    ["audit_writer", "审计落库"],
  ];
  common.forEach((s, i) => {
    const x = 95 + i * 255;
    b += shape(`c${i}`, x, 170, 205, 48, s[0], [s[1]], "#FFFFFF", "#334155");
    if (i < common.length - 1) b += line(`cl${i}`, x + 205, 194, x + 255, 194);
  });
  b += lane("metric", 60, 320, 780, 240, "指标体系构建 Agent 业务节点");
  const metric = [["schema_slimmer", "Schema瘦身"], ["domain_classifier", "业务域分类"], ["metric_retriever", "指标RAG检索"], ["metric_generator", "指标推导"], ["feasibility_checker", "可行性复评"], ["hitl_review", "人工确认"]];
  metric.forEach((s, i) => {
    const x = 95 + (i % 3) * 235, y = 375 + Math.floor(i / 3) * 85;
    b += shape(`m${i}`, x, y, 190, 44, s[0], [s[1]], "#EFF6FF", "#2563EB");
    if (i % 3 < 2) b += line(`ml${i}`, x + 190, y + 22, x + 235, y + 22, "#2563EB");
  });
  b += lane("fill", 900, 320, 790, 240, "物料分类补全 Agent 业务节点");
  const fill = [["parse_excel", "解析Excel"], ["detect_key", "识别物料ID/分类"], ["exact_lookup", "知识库精确匹配"], ["fill_attrs", "属性回填"], ["diff_validate", "差异校验"], ["export_report", "导出结果"]];
  fill.forEach((s, i) => {
    const x = 935 + (i % 3) * 235, y = 375 + Math.floor(i / 3) * 85;
    b += shape(`f${i}`, x, y, 190, 44, s[0], [s[1]], "#F0FDF4", "#16A34A");
    if (i % 3 < 2) b += line(`fl${i}`, x + 190, y + 22, x + 235, y + 22, "#16A34A");
  });
  b += shape("state", 390, 620, 960, 58, "GraphState", ["run_id · task_context · plan · memory · tool_results · retrieval_context · model_outputs · validation_errors · final_result"], "#FEF3C7", "#D97706");
  return vml(760, 350, 1750, 720, b);
}

function diagramMemory() {
  let b = titleBox("t6", 40, 20, "短期记忆与长期记忆设计", "两个需求都需要记忆，但记忆用途不同：指标构建偏过程上下文，物料补全偏批次与字段映射。");
  b += lane("short", 70, 120, 760, 430, "短期记忆：Run / Session Scope");
  b += shape("s1", 130, 190, 260, 60, "Conversation / Task Buffer", ["当前任务输入、用户反馈"], "#DBEAFE", "#2563EB");
  b += shape("s2", 440, 190, 300, 60, "LangGraph Checkpoint", ["节点状态、工具结果、错误"], "#DCFCE7", "#16A34A");
  b += shape("s3", 130, 330, 260, 60, "Retrieval Context", ["本轮召回chunk/schema"], "#F3E8FF", "#7C3AED");
  b += shape("s4", 440, 330, 300, 60, "Working Memory", ["中间指标候选/待补全行"], "#FEF3C7", "#D97706");
  b += line("sl1", 390, 220, 440, 220); b += line("sl2", 390, 360, 440, 360);

  b += lane("long", 920, 120, 760, 430, "长期记忆：Project / Domain Scope");
  b += shape("l1", 980, 190, 260, 60, "Field Dictionary", ["字段别名、主键映射"], "#F0FDF4", "#16A34A");
  b += shape("l2", 1290, 190, 300, 60, "Knowledge Collections", ["指标知识、物料分类规则"], "#F3E8FF", "#7C3AED");
  b += shape("l3", 980, 330, 260, 60, "Historical Runs", ["人工确认、错误样本"], "#ECFDF5", "#059669");
  b += shape("l4", 1290, 330, 300, 60, "Evaluation Cases", ["golden cases、回归基线"], "#FFE4E6", "#E11D48");
  b += line("ll1", 1240, 220, 1290, 220); b += line("ll2", 1240, 360, 1290, 360);
  b += shape("rule", 330, 605, 1080, 58, "记忆写入策略", ["短期记忆随run结束归档；长期记忆只写入人工确认过的字段映射、指标口径、错误样本和评测样本。"], "#FFFFFF", "#334155");
  return vml(760, 330, 1750, 700, b);
}

function diagramDeployment() {
  let b = titleBox("t7", 40, 20, "部署架构与离线交付", "单机虚机起步，模型确认后切换GPU推理；所有依赖以离线包交付。");
  b += lane("vm", 60, 115, 1630, 535, "内网虚拟机 / Docker Compose 部署");
  const comps = [
    [105, 180, "gateway", ["Nginx/APISIX", "TLS/Auth/Limit"], "#DBEAFE", "#2563EB"],
    [380, 180, "agent-api", ["FastAPI", "REST/SSE"], "#DCFCE7", "#16A34A"],
    [655, 180, "agent-worker", ["LangGraph", "Celery/RQ"], "#DCFCE7", "#16A34A"],
    [930, 180, "knowledge-worker", ["Parser/Chunk", "Embedding"], "#FEF3C7", "#D97706"],
    [1205, 180, "model-gateway", ["llama.cpp/API/vLLM", "OpenAI接口"], "#FFE4E6", "#E11D48"],
    [105, 400, "PostgreSQL", ["pgvector", "业务/审计表"], "#FFFFFF", "#334155"],
    [380, 400, "Redis", ["cache", "queue"], "#FFFFFF", "#EA580C"],
    [655, 400, "File/Model Repo", ["原始文件", "离线包/模型"], "#FFFFFF", "#0284C7"],
    [930, 400, "Observability", ["Prom/Grafana", "Phoenix"], "#FFFFFF", "#059669"],
    [1205, 400, "Evaluation", ["golden cases", "gray/rollback"], "#FFFFFF", "#7C3AED"],
  ];
  comps.forEach((c, i) => b += shape(`c${i}`, c[0], c[1], 215, 88, c[2], c[3], c[4], c[5]));
  b += line("d1", 320, 224, 380, 224); b += line("d2", 595, 224, 655, 224); b += line("d3", 870, 224, 930, 224); b += line("d4", 1145, 224, 1205, 224);
  b += line("d5", 760, 268, 760, 400); b += line("d6", 1035, 268, 1035, 400); b += line("d7", 485, 268, 485, 400);
  b += shape("conf1", 105, 700, 660, 62, "CPU验证配置", ["16C/64GB/500GB SSD：验证功能链路，不承诺模型推理延迟"], "#FFFFFF", "#334155");
  b += shape("conf2", 910, 700, 660, 62, "GPU生产建议", ["32C/128GB/2TB SSD + L20 48GB 或 A100 40GB，按模型压测确认"], "#FFFFFF", "#334155");
  return vml(760, 390, 1750, 820, b);
}

function styles() {
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><w:styles xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:style w:type="paragraph" w:default="1" w:styleId="Normal"><w:name w:val="Normal"/><w:rPr><w:rFonts w:ascii="Arial Unicode MS" w:eastAsia="Arial Unicode MS"/><w:sz w:val="21"/></w:rPr></w:style><w:style w:type="paragraph" w:styleId="Heading1"><w:name w:val="heading 1"/><w:basedOn w:val="Normal"/><w:rPr><w:b/><w:sz w:val="36"/><w:color w:val="0F172A"/></w:rPr></w:style><w:style w:type="paragraph" w:styleId="Heading2"><w:name w:val="heading 2"/><w:basedOn w:val="Normal"/><w:rPr><w:b/><w:sz w:val="28"/><w:color w:val="1F2937"/></w:rPr></w:style><w:style w:type="paragraph" w:styleId="Heading3"><w:name w:val="heading 3"/><w:basedOn w:val="Normal"/><w:rPr><w:b/><w:sz w:val="24"/><w:color w:val="334155"/></w:rPr></w:style><w:style w:type="paragraph" w:styleId="Title"><w:name w:val="Title"/><w:rPr><w:b/><w:sz w:val="44"/></w:rPr></w:style><w:style w:type="paragraph" w:styleId="ListParagraph"><w:name w:val="List Paragraph"/><w:basedOn w:val="Normal"/></w:style></w:styles>`;
}
function documentXml(body) {
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships" xmlns:v="urn:schemas-microsoft-com:vml" xmlns:o="urn:schemas-microsoft-com:office:office"><w:body>${body}<w:sectPr><w:pgSz w:w="16838" w:h="11906" w:orient="landscape"/><w:pgMar w:top="720" w:right="720" w:bottom="720" w:left="720" w:header="720" w:footer="720" w:gutter="0"/></w:sectPr></w:body></w:document>`;
}
function makeDocx(filename, body) {
  const dir = path.join(BUILD, filename.replace(".docx", ""));
  fs.rmSync(dir, { recursive: true, force: true });
  fs.mkdirSync(path.join(dir, "_rels"), { recursive: true });
  fs.mkdirSync(path.join(dir, "word", "_rels"), { recursive: true });
  fs.writeFileSync(path.join(dir, "[Content_Types].xml"), `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/><Override PartName="/word/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.styles+xml"/></Types>`);
  fs.writeFileSync(path.join(dir, "_rels", ".rels"), `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/></Relationships>`);
  fs.writeFileSync(path.join(dir, "word", "document.xml"), documentXml(body));
  fs.writeFileSync(path.join(dir, "word", "styles.xml"), styles());
  fs.writeFileSync(path.join(dir, "word", "_rels", "document.xml.rels"), `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"></Relationships>`);
  const out = path.join(OUT, filename);
  try { fs.unlinkSync(out); } catch {}
  execFileSync("zip", ["-qr", out, "."], { cwd: dir });
  return out;
}

const archBody = [
  `<w:p><w:pPr><w:pStyle w:val="Title"/><w:jc w:val="center"/></w:pPr><w:r><w:t>公共底层智能体平台架构设计文档（双需求完整版）</w:t></w:r></w:p>`,
  p("本版只围绕两个需求：指标体系构建 Agent、基于物料分类/物料知识库的补全 Agent。补齐模型切换、RAG分块检索、状态扭转、LangGraph节点、Memory、Tool/MCP/Skill等模块设计。"),
  h("1. 需求复述与边界"),
  bullet("需求一：指标体系构建 Agent。输入表结构 JSON、Excel/Word 说明和业务 Prompt，完成 Schema 瘦身、业务域分类、指标推导、可行性复评、人工确认和指标体系 JSON 输出。"),
  bullet("需求二：基于物料分类/物料知识库的补全 Agent。输入物料知识库 Excel 和待补全 Excel，根据物料 ID/物料分类等关键字段精确匹配知识库，补全属性字段，输出补全文件和异常报告。"),
  bullet("不再把泛化 RAG 问答作为独立业务需求；RAG 是两个需求的底层能力，用于指标知识检索、物料分类规则检索、字段别名和异常兜底。"),
  h("2. 总体架构"),
  diagramOverall(), caption("图 1：公共底层智能体平台总体架构（双需求版）"),
  h("3. 三类模型分流与切换"),
  diagramModelSwitch(), caption("图 2：三类模型分流与三种部署模式切换"),
  table(["模型/模式", "适用任务", "切换策略", "说明"], [
    ["路由模型 Small LLM", "业务域分类、意图识别、字段别名判断、物料分类辅助", "task_type=classify/route/alias", "低成本低延迟，可用 7B/14B。"],
    ["推理模型 Main LLM", "指标推导、口径解释、异常说明、补全报告摘要", "task_type=reason/generate", "复杂任务使用，输出必须经过 Schema 校验。"],
    ["Embedding/Rerank 模型", "知识入库向量化、query embedding、召回重排", "task_type=embedding/rerank", "服务于 RAG，不直接生成答案。"],
    ["CPU Local", "前期功能验证", "LLM_ROUTER_MODE=cpu_local", "llama.cpp/GGUF，验证链路不看性能。"],
    ["API Remote", "模型效果选型", "LLM_ROUTER_MODE=api_remote", "外部或内部模型 API，对比效果与成本。"],
    ["GPU vLLM", "生产推理", "LLM_ROUTER_MODE=gpu_vllm", "确认模型后采购 GPU，自部署 vLLM。"],
  ]),
  h("4. RAG 知识库写入、Chunk 与检索流程"),
  diagramRag(), caption("图 3：RAG 知识库写入、Chunk 分块与检索流程"),
  h("4.1 Chunk 分块策略"),
  table(["知识类型", "分块规则", "metadata", "用途"], [
    ["指标口径 Word/PDF", "按标题层级 + 语义段落分块，保留上下级标题路径", "source_id, heading_path, page_no, chunk_type", "指标推导时检索口径、维度、计算逻辑。"],
    ["指标/字段 Excel", "结构化表先入 schema/field 表，必要时按行生成 chunk", "sheet_name, row_no, field_names, domain", "业务域分类和字段语义辅助。"],
    ["物料分类规则 Excel", "分类编码/属性规则按行或规则组分块", "category_id, attr_group, row_id", "物料分类补全时检索分类规则和字段解释。"],
    ["物料主数据 Excel", "主路径入 master_rows，按物料ID精确查询；仅描述字段可生成 chunk", "material_id, category, row_id", "属性补全主路径不依赖向量。"],
    ["普通文本/Markdown", "300-800 tokens，50-100 overlap", "source_id, section, chunk_index", "通用知识解释。"],
  ]),
  h("4.2 检索策略"),
  bullet("指标体系构建：先按业务域、表名、字段名做 metadata filter，再 pgvector 召回指标知识，rerank 后组装上下文。"),
  bullet("物料分类补全：物料 ID/分类明确时走 PostgreSQL 精确查询；仅在字段别名、分类规则解释、低置信度候选时使用 RAG。"),
  bullet("召回结果必须携带 source_id、chunk_id、page/row、score，进入 Validator 做引用和权限校验。"),
  h("5. 智能体状态扭转"),
  diagramState(), caption("图 4：智能体状态扭转图"),
  h("6. LangGraph Node 主题模块与链路编排"),
  diagramLangGraph(), caption("图 5：LangGraph Node 主题模块与链路编排"),
  h("6.1 LangGraph 构建方式"),
  code(`GraphState 核心字段：
run_id, agent_type, task_context, security_context, plan,
memory, tool_results, retrieval_context, model_outputs,
validation_errors, human_feedback, final_result

公共节点：
input_adapter -> policy_guard -> planner -> tool_executor -> validator -> audit_writer

指标体系构建业务节点：
schema_slimmer -> domain_classifier -> metric_retriever -> metric_generator -> feasibility_checker -> hitl_review

物料分类补全业务节点：
parse_excel -> detect_key -> exact_lookup -> fill_attrs -> diff_validate -> export_report`),
  h("7. 短期记忆与长期记忆设计"),
  diagramMemory(), caption("图 6：短期记忆与长期记忆设计"),
  table(["记忆类型", "存储位置", "写入内容", "读取场景", "治理规则"], [
    ["短期记忆", "LangGraph checkpoint / Redis / agent_runs.task_context", "本次任务输入、中间计划、工具结果、召回上下文、待确认项", "节点重试、人工确认后继续执行、SSE 状态展示", "run 结束后归档，敏感字段脱敏。"],
    ["长期记忆", "PostgreSQL: field_dictionary, metric_artifacts, evaluation_cases, historical_feedback", "人工确认过的字段别名、指标口径、物料分类映射、错误样本、评测样本", "后续任务字段映射、指标推导、分类补全、回归评测", "只写人工确认/高置信结果，版本化管理。"],
  ]),
  h("8. Tool / MCP / Skill 使用设计"),
  table(["能力类型", "定位", "在指标 Agent 中的用法", "在物料补全 Agent 中的用法"], [
    ["Tool", "单个确定性能力，强输入输出 Schema", "schema_lookup、metric_rag_search、sql_advisor、feasibility_check", "excel_parse、detect_key_column、exact_material_lookup、fill_excel_export"],
    ["MCP", "把外部系统能力标准化暴露给 Agent", "database-mcp 查询表结构、metadata-mcp 查询数据资产", "file-mcp 读写 Excel、database-mcp 批量查询物料知识库"],
    ["Skill", "可复用专家流程/规则包", "schema_slimming、metric_feasibility_check、metric_json_validate", "excel_key_enrichment、field_alias_learning、diff_report_generate"],
    ["Prompt/Schema", "约束模型输出和工具参数", "指标体系 JSON Schema、口径解释 Prompt", "补全报告 Schema、异常说明 Prompt"],
  ]),
  h("9. 核心数据表"),
  table(["表名", "关键字段", "说明"], [
    ["agent_templates", "agent_type, version, graph_config, input_schema, output_schema", "两个 Agent 的模板配置。"],
    ["agent_runs", "run_id, agent_type, status, task_context, final_result", "执行主记录与短期记忆归档。"],
    ["tool_calls", "run_id, node_id, tool_name, args_hash, result_ref, latency_ms, status", "工具调用审计与回放。"],
    ["model_calls", "run_id, model_name, task_type, token_in, token_out, latency_ms, cost", "模型调用记录与成本分析。"],
    ["rag_chunks", "chunk_id, collection_id, chunk_text, embedding, metadata, source_ref", "RAG 检索主表。"],
    ["material_master_rows", "row_id, material_id, category_id, row_json, indexed_fields", "物料知识库快照和精确补全数据。"],
    ["material_enrichment_results", "run_id, row_no, material_id, match_status, filled_json, diff_json", "物料补全结果。"],
    ["metric_artifacts", "artifact_id, run_id, domain, metric_json, review_status, version", "指标体系构建产物。"],
    ["field_dictionary", "field_name, aliases, business_domain, confirmed_by, version", "长期记忆：字段别名和映射。"],
    ["evaluation_cases", "case_id, agent_type, input, expected, scoring_rule, tags", "回归评测样本。"],
  ]),
  h("10. 部署架构"),
  diagramDeployment(), caption("图 7：部署架构与离线交付"),
].join("");

const selectionBody = [
  `<w:p><w:pPr><w:pStyle w:val="Title"/><w:jc w:val="center"/></w:pPr><w:r><w:t>公共底层智能体平台技术选型方案（双需求完整版）</w:t></w:r></w:p>`,
  p("技术选型仅围绕两个需求：指标体系构建 Agent、基于物料分类/物料知识库的补全 Agent。"),
  h("1. 总体组件清单"),
  table(["层级", "组件", "建议版本", "作用"], [
    ["开发语言", "Python + Java", "Python 3.12.x；Java 17", "Python 承载 Agent/RAG/模型；Java 承载管理后台和企业集成。"],
    ["后端接入", "Spring Boot", "3.3.x", "用户、权限、配置、管理后台。"],
    ["API 服务", "FastAPI + Uvicorn", "FastAPI 0.136.x；Uvicorn 0.34.x+", "REST/SSE/异步任务接口。"],
    ["Agent Runtime", "LangGraph", "1.2.x", "状态机、Checkpoint、Replay、HITL。"],
    ["LLM 抽象", "LangChain", "1.3.x", "模型/消息/工具适配层。"],
    ["Schema 校验", "Pydantic", "2.12.x", "TaskContext、Tool 入参、输出 JSON Schema。"],
    ["任务队列", "Redis + Celery/RQ", "Redis 7.4.x；Celery 5.6.x / RQ 2.x", "长任务、解析、补全、embedding、缓存。"],
    ["数据库", "PostgreSQL + pgvector", "PostgreSQL 16/17；pgvector 0.8.2+", "结构化查询、JSONB、向量检索、审计。"],
    ["文档/Excel解析", "pandas/openpyxl/PyMuPDF/python-docx/python-pptx", "pandas 2.2.x；openpyxl 3.1.x；PyMuPDF 1.24.x+", "Excel、Word、PDF、PPT 解析。"],
    ["模型推理", "llama.cpp / vLLM / API", "llama.cpp 0.3.x；vLLM 0.20.x", "CPU 验证、API 选型、GPU 生产。"],
    ["Embedding/Rerank", "bge-m3 + bge-reranker-v2-m3", "离线固化模型", "RAG 向量化与重排。"],
    ["可观测", "OpenTelemetry + Prometheus + Grafana + Phoenix", "OTel 1.30.x+", "Trace、指标、LLM 调用观测和评测。"],
    ["脱敏审计", "Presidio + 自定义规则", "2.2.x+", "敏感字段识别、脱敏、审计落库。"],
  ]),
  h("2. 模型选型与切换"),
  table(["类型", "推荐", "作用", "切换方式"], [
    ["路由/分类模型", "Qwen 7B/14B 或同级小模型", "业务域分类、字段别名、物料分类辅助", "Model Gateway 按 task_type=classify 路由。"],
    ["主推理模型", "Qwen 14B/32B 或 API 候选模型", "指标推导、口径解释、异常说明", "task_type=reason/generate。"],
    ["Embedding模型", "bge-m3", "知识入库与 query embedding", "独立 embedding endpoint。"],
    ["Rerank模型", "bge-reranker-v2-m3", "召回结果重排", "独立 rerank endpoint。"],
    ["CPU模式", "llama.cpp + GGUF", "前期功能验证", "LLM_ROUTER_MODE=cpu_local。"],
    ["API模式", "内部/云模型 API", "效果选型与成本对比", "LLM_ROUTER_MODE=api_remote。"],
    ["GPU模式", "vLLM OpenAI Compatible Server", "生产推理", "LLM_ROUTER_MODE=gpu_vllm。"],
  ]),
  h("3. RAG 与结构化查询边界"),
  table(["场景", "主路径", "RAG 使用位置"], [
    ["指标体系构建", "Schema Slimming + 指标知识 RAG + 主模型推导", "检索指标口径、维度规则、字段语义。"],
    ["物料分类补全", "物料ID/分类/主键精确查询 + 批量回填", "字段别名、分类规则解释、低置信度候选兜底。"],
    ["知识入库", "Parser + Chunk + Embedding + pgvector", "为指标知识和分类规则提供语义检索能力。"],
  ]),
  h("4. PostgreSQL + pgvector 选型判断"),
  bullet("当前两类需求的数据规模和查询模式适合 PostgreSQL + pgvector，不建议第一阶段引入 Elasticsearch。"),
  bullet("物料补全依赖结构化精确查询，B-tree、JSONB GIN、pg_trgm 比向量检索更关键。"),
  bullet("指标知识检索使用 pgvector HNSW 足够支撑小规模知识库。"),
  bullet("后续只有在复杂中文全文检索、高亮、多字段聚合、高并发搜索出现时，再评估 OpenSearch/Elasticsearch。"),
  h("5. Memory 选型"),
  table(["记忆", "组件", "作用"], [
    ["短期记忆", "LangGraph Checkpoint + Redis + agent_runs.task_context", "保存当前 run 的中间状态、工具结果、召回上下文和人工确认状态。"],
    ["长期记忆", "PostgreSQL field_dictionary / metric_artifacts / evaluation_cases / feedback", "保存人工确认过的字段别名、指标口径、分类映射、错误样本。"],
    ["向量记忆", "pgvector rag_chunks", "保存指标知识、分类规则、文档语义块。"],
  ]),
  h("6. 最低环境配置"),
  table(["阶段", "配置", "用途"], [
    ["CPU 最小验证", "16C / 64GB RAM / 500GB SSD", "跑通 Agent、Tool、RAG、物料补全、审计。"],
    ["CPU 推荐验证", "32C / 128GB RAM / 1TB SSD", "几万字段、批量 Excel、非模型接口压测。"],
    ["GPU 生产起步", "32C / 128GB RAM / 2TB SSD + L20 48GB 或 A100 40GB", "14B/32B 量化模型推理和 embedding/rerank。"],
  ]),
  h("7. 离线包"),
  table(["包", "内容"], [
    ["Docker镜像", "gateway、agent-api、agent-worker、knowledge-worker、postgres、redis、observability。"],
    ["Python wheelhouse", "FastAPI、LangGraph、LangChain、Pydantic、pandas、openpyxl、PyMuPDF、psycopg、Presidio。"],
    ["模型包", "bge-m3、reranker、Qwen GGUF/API配置/vLLM权重。"],
    ["SQL包", "schema、索引、初始化字典、审计表、评测样本。"],
    ["配置包", "agent templates、tool manifests、prompts、JSON Schema。"],
  ]),
].join("");

const arch = makeDocx("公共底层智能体平台架构设计文档_双需求完整版.docx", archBody);
const tech = makeDocx("公共底层智能体平台技术选型方案_双需求完整版.docx", selectionBody);
console.log(arch);
console.log(tech);
