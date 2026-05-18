const fs = require("fs");
const path = require("path");
const { execFileSync } = require("child_process");

const OUT = path.resolve("交付物");
const BUILD = path.resolve(".build_agent_platform_v5");
fs.mkdirSync(OUT, { recursive: true });

const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
const p = (text, style = "") => `<w:p><w:pPr>${style ? `<w:pStyle w:val="${style}"/>` : ""}<w:spacing w:after="120"/></w:pPr><w:r><w:t xml:space="preserve">${esc(text)}</w:t></w:r></w:p>`;
const h = (text, level = 1) => p(text, `Heading${level}`);
const bullet = (text) => `<w:p><w:pPr><w:pStyle w:val="ListParagraph"/><w:ind w:left="420"/><w:spacing w:after="80"/></w:pPr><w:r><w:t xml:space="preserve">• ${esc(text)}</w:t></w:r></w:p>`;
const caption = (text) => `<w:p><w:pPr><w:jc w:val="center"/></w:pPr><w:r><w:rPr><w:color w:val="64748B"/><w:sz w:val="18"/></w:rPr><w:t>${esc(text)}</w:t></w:r></w:p>`;
const code = (text) => `<w:p><w:pPr><w:shd w:fill="F8FAFC"/><w:spacing w:after="120"/></w:pPr><w:r><w:rPr><w:rFonts w:ascii="Consolas" w:eastAsia="Consolas"/><w:sz w:val="17"/></w:rPr><w:t xml:space="preserve">${esc(text)}</w:t></w:r></w:p>`;

function table(headers, rows) {
  const width = Math.max(1300, Math.floor(14200 / headers.length));
  const tr = (cells, header = false) =>
    `<w:tr>${cells.map((c) => `<w:tc><w:tcPr><w:tcW w:w="${width}" w:type="dxa"/>${header ? '<w:shd w:fill="E2E8F0"/>' : ""}</w:tcPr><w:p><w:r>${header ? "<w:rPr><w:b/></w:rPr>" : ""}<w:t xml:space="preserve">${esc(c)}</w:t></w:r></w:p></w:tc>`).join("")}</w:tr>`;
  return `<w:tbl><w:tblPr><w:tblW w:w="0" w:type="auto"/><w:tblBorders><w:top w:val="single" w:sz="6" w:color="CBD5E1"/><w:left w:val="single" w:sz="6" w:color="CBD5E1"/><w:bottom w:val="single" w:sz="6" w:color="CBD5E1"/><w:right w:val="single" w:sz="6" w:color="CBD5E1"/><w:insideH w:val="single" w:sz="6" w:color="CBD5E1"/><w:insideV w:val="single" w:sz="6" w:color="CBD5E1"/></w:tblBorders></w:tblPr>${tr(headers, true)}${rows.map((r) => tr(r)).join("")}</w:tbl>`;
}

function vml(widthPt, heightPt, coordW, coordH, body) {
  return `<w:p><w:r><w:pict><v:group style="width:${widthPt}pt;height:${heightPt}pt" coordsize="${coordW},${coordH}">${body}</v:group></w:pict></w:r></w:p>`;
}

function shape(id, x, y, w, h, title, lines, fill = "#F8FAFC", stroke = "#334155") {
  const text = [title, ...(lines || [])].map((t, i) =>
    `<w:p><w:pPr><w:jc w:val="center"/></w:pPr><w:r><w:rPr>${i === 0 ? "<w:b/>" : ""}<w:sz w:val="${i === 0 ? "20" : "16"}"/><w:color w:val="${i === 0 ? "111827" : "475569"}"/></w:rPr><w:t>${esc(t)}</w:t></w:r></w:p>`
  ).join("");
  return `<v:roundrect id="${id}" style="position:absolute;left:${x};top:${y};width:${w};height:${h}" arcsize="10%" fillcolor="${fill}" strokecolor="${stroke}" strokeweight="1.35pt"><v:textbox inset="6pt,5pt,6pt,4pt"><w:txbxContent>${text}</w:txbxContent></v:textbox></v:roundrect>`;
}

function lane(id, x, y, w, h, title, fill = "#F8FAFC", stroke = "#CBD5E1") {
  return `<v:roundrect id="${id}" style="position:absolute;left:${x};top:${y};width:${w};height:${h}" arcsize="6%" fillcolor="${fill}" strokecolor="${stroke}" strokeweight="1pt"><v:textbox inset="9pt,6pt,6pt,3pt"><w:txbxContent><w:p><w:r><w:rPr><w:b/><w:sz w:val="22"/><w:color w:val="0F172A"/></w:rPr><w:t>${esc(title)}</w:t></w:r></w:p></w:txbxContent></v:textbox></v:roundrect>`;
}
function line(id, x1, y1, x2, y2, color = "#64748B") {
  return `<v:line id="${id}" style="position:absolute" from="${x1},${y1}" to="${x2},${y2}" strokecolor="${color}" strokeweight="1.6pt"><v:stroke endarrow="block"/></v:line>`;
}
function titleBox(id, x, y, text, sub) {
  return `<v:shape id="${id}" type="#_x0000_t202" style="position:absolute;left:${x};top:${y};width:1650;height:72" stroked="f" filled="f"><v:textbox inset="0,0,0,0"><w:txbxContent><w:p><w:r><w:rPr><w:b/><w:sz w:val="32"/><w:color w:val="0F172A"/></w:rPr><w:t>${esc(text)}</w:t></w:r></w:p><w:p><w:r><w:rPr><w:sz w:val="18"/><w:color w:val="64748B"/></w:rPr><w:t>${esc(sub)}</w:t></w:r></w:p></w:txbxContent></v:textbox></v:shape>`;
}
function tag(id, x, y, text, color = "#0F766E") {
  return `<v:roundrect id="${id}" style="position:absolute;left:${x};top:${y};width:84;height:28" arcsize="50%" fillcolor="${color}" stroked="f"><v:textbox inset="0,2pt,0,0"><w:txbxContent><w:p><w:pPr><w:jc w:val="center"/></w:pPr><w:r><w:rPr><w:b/><w:sz w:val="15"/><w:color w:val="FFFFFF"/></w:rPr><w:t>${esc(text)}</w:t></w:r></w:p></w:txbxContent></v:textbox></v:roundrect>`;
}

function diagramOverall() {
  let b = titleBox("t1", 40, 20, "公共底层智能体平台总体架构", "以公共 Agent Runtime 为核心，支撑指标体系构建、Excel 知识库补全、RAG 问答等多个业务 Agent。");
  b += lane("la", 40, 115, 1670, 95, "接入与体验层");
  b += shape("a1", 85, 155, 260, 42, "Web UI / Java 管理台", ["任务提交 · 配置管理"], "#DBEAFE", "#2563EB");
  b += shape("a2", 385, 155, 260, 42, "OpenAPI / 批处理入口", ["文件上传 · JSON任务"], "#DBEAFE", "#2563EB");
  b += shape("a3", 685, 155, 260, 42, "业务系统集成", ["数据治理 · 指标平台"], "#DBEAFE", "#2563EB");
  b += shape("a4", 985, 155, 260, 42, "HITL 人工工作台", ["确认 · 修正 · 发布"], "#FEF3C7", "#D97706");
  b += shape("a5", 1285, 155, 330, 42, "API Gateway", ["Nginx/APISIX · TLS · 鉴权 · 限流"], "#E0F2FE", "#0284C7");

  b += lane("lb", 40, 245, 1670, 150, "公共智能体运行层");
  b += shape("b1", 85, 305, 250, 60, "Agent API", ["FastAPI · REST/SSE"], "#DCFCE7", "#16A34A");
  b += shape("b2", 375, 305, 310, 60, "Agent Template Router", ["按 agent_type 加载模板"], "#DCFCE7", "#16A34A");
  b += shape("b3", 725, 305, 310, 60, "LangGraph Runtime", ["状态机 · Checkpoint · Replay"], "#DCFCE7", "#16A34A");
  b += shape("b4", 1075, 305, 250, 60, "Task Queue", ["Redis · Celery/RQ"], "#DCFCE7", "#16A34A");
  b += shape("b5", 1365, 305, 250, 60, "Policy / Audit", ["权限 · 脱敏 · 审计"], "#FFE4E6", "#E11D48");

  b += lane("lc", 40, 430, 820, 180, "业务 Agent 应用层");
  b += shape("c1", 85, 500, 230, 62, "指标体系构建 Agent", ["Schema理解 · 指标推导"], "#EFF6FF", "#2563EB");
  b += shape("c2", 345, 500, 230, 62, "Excel知识库补全 Agent", ["ID匹配 · 属性回填"], "#F0FDF4", "#16A34A");
  b += shape("c3", 605, 500, 210, 62, "RAG问答 Agent", ["检索增强 · 引用回答"], "#F3E8FF", "#7C3AED");

  b += lane("ld", 900, 430, 810, 180, "能力插件与知识服务层");
  b += shape("d1", 945, 500, 190, 62, "Tool Registry", ["强Schema工具"], "#FEF3C7", "#D97706");
  b += shape("d2", 1160, 500, 190, 62, "MCP Servers", ["DB/File/Knowledge"], "#FEF3C7", "#D97706");
  b += shape("d3", 1375, 500, 280, 62, "Knowledge Service", ["Parser · Chunk · Retriever · FieldDict"], "#F3E8FF", "#7C3AED");

  b += lane("le", 40, 645, 1670, 165, "模型、数据与治理基础设施");
  b += shape("e1", 85, 710, 250, 60, "Model Gateway", ["CPU/API/GPU · OpenAI兼容"], "#FFE4E6", "#E11D48");
  b += shape("e2", 375, 710, 260, 60, "Model Endpoints", ["Qwen · bge-m3 · reranker"], "#FFE4E6", "#E11D48");
  b += shape("e3", 675, 710, 300, 60, "PostgreSQL + pgvector", ["agent/rag/excel/metric/audit"], "#FFFFFF", "#334155");
  b += shape("e4", 1015, 710, 250, 60, "File & Model Repo", ["原始文件 · 模型 · 离线包"], "#FFFFFF", "#0284C7");
  b += shape("e5", 1305, 710, 300, 60, "Observability & Evaluation", ["OTel · Prometheus · Phoenix · 回归评测"], "#ECFDF5", "#059669");
  b += line("x1", 1485, 197, 1485, 305);
  b += line("x2", 335, 335, 375, 335); b += line("x3", 685, 335, 725, 335); b += line("x4", 1035, 335, 1075, 335); b += line("x5", 1325, 335, 1365, 335);
  b += line("x6", 880, 365, 880, 500); b += line("x7", 815, 531, 945, 531); b += line("x8", 1350, 531, 1375, 531);
  b += line("x9", 1515, 562, 1515, 710); b += line("x10", 880, 610, 880, 710);
  return vml(760, 392, 1750, 850, b);
}

function diagramAgentMap() {
  let b = titleBox("t2", 40, 20, "业务 Agent 与公共能力映射", "强调整体智能体平台：物料/Excel 补全只是其中一个业务 Agent，不是平台唯一主线。");
  b += lane("l1", 60, 120, 500, 620, "指标体系构建 Agent");
  b += shape("m1", 110, 190, 400, 58, "输入", ["table_json / Excel / Word / prompt"], "#FFFFFF", "#2563EB");
  b += shape("m2", 110, 280, 400, 58, "核心处理", ["Schema瘦身 · 业务域分类 · 指标推导"], "#FFFFFF", "#2563EB");
  b += shape("m3", 110, 370, 400, 58, "工具", ["schema_lookup · metric_rag · feasibility_check"], "#FFFFFF", "#2563EB");
  b += shape("m4", 110, 460, 400, 58, "输出", ["指标体系JSON · 指标口径 · SQL建议"], "#FFFFFF", "#2563EB");
  b += shape("m5", 110, 550, 400, 58, "治理", ["人工确认 · 版本发布 · 评测回归"], "#FFFFFF", "#2563EB");

  b += lane("l2", 625, 120, 500, 620, "Excel 知识库补全 Agent");
  b += shape("f1", 675, 190, 400, 58, "输入", ["待补全Excel · 主键列 · 目标字段"], "#FFFFFF", "#16A34A");
  b += shape("f2", 675, 280, 400, 58, "核心处理", ["主键识别 · 精确匹配 · 批量回填"], "#FFFFFF", "#16A34A");
  b += shape("f3", 675, 370, 400, 58, "工具", ["excel_parse · exact_lookup · fill_export"], "#FFFFFF", "#16A34A");
  b += shape("f4", 675, 460, 400, 58, "输出", ["补全Excel · 异常Sheet · 差异报告"], "#FFFFFF", "#16A34A");
  b += shape("f5", 675, 550, 400, 58, "治理", ["命中率 · 冲突确认 · 数据版本追踪"], "#FFFFFF", "#16A34A");

  b += lane("l3", 1190, 120, 500, 620, "RAG 问答 / 后续扩展 Agent");
  b += shape("r1", 1240, 190, 400, 58, "输入", ["自然语言问题 · 文件集合 · 业务上下文"], "#FFFFFF", "#7C3AED");
  b += shape("r2", 1240, 280, 400, 58, "核心处理", ["意图识别 · 混合检索 · 引用生成"], "#FFFFFF", "#7C3AED");
  b += shape("r3", 1240, 370, 400, 58, "工具", ["vector_search · rerank · answer_builder"], "#FFFFFF", "#7C3AED");
  b += shape("r4", 1240, 460, 400, 58, "输出", ["答案 · 引用 · 置信度"], "#FFFFFF", "#7C3AED");
  b += shape("r5", 1240, 550, 400, 58, "治理", ["反馈样本 · 召回评测 · prompt版本"], "#FFFFFF", "#7C3AED");
  b += shape("base", 340, 785, 1080, 70, "公共底座复用", ["Agent Runtime · Tool/MCP/Skill · Knowledge Service · Model Gateway · PostgreSQL · Audit · Evaluation"], "#FEF3C7", "#D97706");
  b += line("b1", 310, 740, 610, 785, "#D97706"); b += line("b2", 875, 740, 875, 785, "#D97706"); b += line("b3", 1430, 740, 1135, 785, "#D97706");
  return vml(760, 430, 1750, 900, b);
}

function diagramCoreFlow() {
  let b = titleBox("t3", 40, 20, "统一 Agent 执行流程", "参考模板中的核心流程章节：初始化、请求处理、工具调用、知识检索、状态转换、输出审计。");
  const steps = [
    ["1 Agent 初始化", ["加载模板", "加载工具权限", "创建TaskContext"], "#DBEAFE", "#2563EB"],
    ["2 请求解析", ["文件/JSON/Prompt", "安全上下文", "输入Schema校验"], "#E0F2FE", "#0284C7"],
    ["3 计划生成", ["Planner", "节点编排", "并行/串行策略"], "#DCFCE7", "#16A34A"],
    ["4 工具执行", ["Tool/MCP/Skill", "超时/重试/熔断", "结果落库"], "#FEF3C7", "#D97706"],
    ["5 知识/数据检索", ["结构化查询", "向量检索", "字段字典"], "#F3E8FF", "#7C3AED"],
    ["6 模型推理", ["小模型/主模型", "结构化输出", "成本记录"], "#FFE4E6", "#E11D48"],
    ["7 校验确认", ["Schema校验", "权限/引用检查", "HITL"], "#ECFDF5", "#059669"],
    ["8 输出审计", ["结果生成", "审计日志", "评测样本"], "#F8FAFC", "#334155"],
  ];
  steps.forEach((s, i) => {
    const x = 85 + (i % 4) * 410;
    const y = i < 4 ? 170 : 455;
    b += shape(`s${i}`, x, y, 330, 120, s[0], s[1], s[2], s[3]);
    if (i < 3) b += line(`l${i}`, x + 330, y + 60, x + 410, y + 60, "#64748B");
    if (i === 3) b += line("down", x + 165, y + 120, x + 165, 455, "#64748B");
    if (i > 4 && i < 7) b += line(`l${i}`, x, y + 60, x - 80, y + 60, "#64748B");
  });
  b += line("ret", 85, 515, 85, 230, "#059669");
  b += tag("tag", 35, 365, "可回放");
  return vml(760, 355, 1750, 760, b);
}

function diagramDataFlow() {
  let b = titleBox("t4", 40, 20, "数据流与存储模型", "把三类业务输入统一进入平台，并分别落到指标产物、Excel补全结果、RAG知识索引和审计评测体系。");
  b += lane("in", 60, 115, 1630, 105, "输入数据");
  b += shape("i1", 110, 155, 300, 42, "表结构 / table_json", ["指标体系构建"], "#EFF6FF", "#2563EB");
  b += shape("i2", 470, 155, 300, 42, "Excel知识库 / 待补全Excel", ["批量属性回填"], "#F0FDF4", "#16A34A");
  b += shape("i3", 830, 155, 300, 42, "Word/PPT/PDF/TXT", ["RAG知识检索"], "#F3E8FF", "#7C3AED");
  b += shape("i4", 1190, 155, 300, 42, "用户Prompt / 查询", ["任务上下文"], "#FEF3C7", "#D97706");

  b += lane("proc", 60, 260, 1630, 160, "处理层");
  b += shape("p1", 110, 320, 280, 56, "Parser Router", ["文件解析 / 表结构解析"], "#FFFFFF", "#0284C7");
  b += shape("p2", 445, 320, 280, 56, "Normalizer", ["字段归一 / Schema瘦身"], "#FFFFFF", "#16A34A");
  b += shape("p3", 780, 320, 280, 56, "Retriever / Lookup", ["精确查询 / 向量检索"], "#FFFFFF", "#7C3AED");
  b += shape("p4", 1115, 320, 280, 56, "Agent Runtime", ["计划 / 工具 / 模型 / 校验"], "#FFFFFF", "#D97706");

  b += lane("store", 60, 465, 1630, 180, "存储层");
  b += shape("d1", 110, 535, 260, 60, "metric_artifacts", ["指标体系JSON / 版本"], "#FFFFFF", "#2563EB");
  b += shape("d2", 415, 535, 260, 60, "excel_enrichment", ["补全结果 / 异常明细"], "#FFFFFF", "#16A34A");
  b += shape("d3", 720, 535, 260, 60, "rag_chunks", ["chunk_text / vector / metadata"], "#FFFFFF", "#7C3AED");
  b += shape("d4", 1025, 535, 260, 60, "agent_runs / tool_calls", ["状态 / 工具 / 模型调用"], "#FFFFFF", "#D97706");
  b += shape("d5", 1330, 535, 260, 60, "audit / evaluation", ["审计 / 回归样本"], "#FFFFFF", "#059669");

  b += line("l1", 260, 197, 250, 320); b += line("l2", 620, 197, 585, 320); b += line("l3", 980, 197, 920, 320); b += line("l4", 1340, 197, 1255, 320);
  b += line("l5", 390, 348, 445, 348); b += line("l6", 725, 348, 780, 348); b += line("l7", 1060, 348, 1115, 348);
  b += line("l8", 1255, 376, 1255, 535); b += line("l9", 920, 376, 850, 535); b += line("l10", 585, 376, 545, 535); b += line("l11", 250, 376, 240, 535);
  return vml(760, 340, 1750, 700, b);
}

function diagramDeployment() {
  let b = titleBox("t5", 40, 20, "部署架构与离线交付", "单机虚机起步，后续按组件拆分；模型确认后只替换 Model Gateway 后端。");
  b += lane("vm", 60, 115, 1630, 550, "内网虚拟机 / Docker Compose 部署");
  const comps = [
    [110, 180, "gateway", ["Nginx/APISIX", "TLS / Auth / Limit"], "#DBEAFE", "#2563EB"],
    [390, 180, "agent-api", ["FastAPI", "REST / SSE"], "#DCFCE7", "#16A34A"],
    [670, 180, "agent-worker", ["LangGraph", "Celery/RQ"], "#DCFCE7", "#16A34A"],
    [950, 180, "knowledge-worker", ["Parser", "Embedding"], "#FEF3C7", "#D97706"],
    [1230, 180, "model-gateway", ["llama.cpp/API/vLLM", "OpenAI接口"], "#FFE4E6", "#E11D48"],
    [110, 410, "PostgreSQL", ["pgvector", "业务/审计表"], "#FFFFFF", "#334155"],
    [390, 410, "Redis", ["cache", "queue"], "#FFFFFF", "#EA580C"],
    [670, 410, "File/Model Repo", ["原始文件", "离线包/模型"], "#FFFFFF", "#0284C7"],
    [950, 410, "Observability", ["Prom/Grafana", "Phoenix"], "#FFFFFF", "#059669"],
    [1230, 410, "Evaluation", ["golden cases", "gray/rollback"], "#FFFFFF", "#7C3AED"],
  ];
  comps.forEach((c, i) => b += shape(`c${i}`, c[0], c[1], 220, 92, c[2], c[3], c[4], c[5]));
  b += line("a", 330, 226, 390, 226); b += line("b", 610, 226, 670, 226); b += line("c", 890, 226, 950, 226); b += line("d", 1170, 226, 1230, 226);
  b += line("e", 780, 272, 780, 410); b += line("f", 1060, 272, 1060, 410); b += line("g", 500, 272, 500, 410);
  b += shape("conf1", 110, 710, 660, 62, "CPU验证配置", ["16C / 64GB / 500GB SSD：验证功能链路，不承诺模型延迟"], "#FFFFFF", "#334155");
  b += shape("conf2", 900, 710, 660, 62, "GPU生产建议", ["32C / 128GB / 2TB SSD + L20 48GB 或 A100 40GB，按压测确定"], "#FFFFFF", "#334155");
  return vml(760, 385, 1750, 820, b);
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

const body = [
  `<w:p><w:pPr><w:pStyle w:val="Title"/><w:jc w:val="center"/></w:pPr><w:r><w:t>公共底层智能体平台详细设计方案（合并增强版）</w:t></w:r></w:p>`,
  p("本版合并前面所有需求：以整体智能体平台为主线，物料/Excel补全仅作为业务 Agent 示例之一；图形采用 Word 原生流程图风格。"),
  h("1. 项目背景"),
  h("1.1 项目简介", 2),
  p("本项目建设一个公共底层智能体平台，用统一的 Agent Runtime、工具体系、知识服务、模型网关和治理能力，支撑企业内部多类智能体应用。首批业务包括指标体系构建 Agent、Excel 知识库数据补全 Agent，以及可扩展的 RAG 问答 Agent。"),
  h("1.2 项目定位与功能", 2),
  bullet("公共智能体平台：提供 Agent 模板、状态机编排、工具注册、模型路由、知识检索、安全审计和评测发布能力。"),
  bullet("指标体系构建：面向表结构 JSON、Excel/Word 说明和业务 Prompt，自动完成业务域分类、指标推导、可行性复评和人工确认。"),
  bullet("Excel 知识库补全：面向结构化知识库 Excel 和待补全 Excel，通过主键/字段精确匹配批量补全属性字段，并生成异常报告。"),
  bullet("RAG 问答扩展：面向非结构化文档知识库，支持语义检索、引用回答和反馈评测。"),
  h("1.3 技术特色", 2),
  table(["技术特色", "说明"], [
    ["公共 Runtime", "所有业务 Agent 运行在同一 LangGraph Runtime 上，通过模板定义差异。"],
    ["工具化架构", "确定性能力通过 Tool/MCP/Skill 注册，模型只负责推理和生成。"],
    ["混合知识服务", "同时支持结构化查询、Excel 行级回填、字段字典、pgvector 语义检索。"],
    ["模型分流", "小模型分类/路由，主模型复杂推理，Embedding/Rerank 支撑检索，字段补全优先不用 LLM。"],
    ["离线部署", "支持内网无外网环境，Docker、wheelhouse、模型权重、SQL 和模板包离线交付。"],
  ]),
  h("2. 系统概要设计"),
  diagramOverall(), caption("图 1：公共底层智能体平台总体架构"),
  h("2.1 架构说明", 2),
  p("平台按接入与体验层、公共智能体运行层、业务 Agent 应用层、能力插件与知识服务层、模型数据与治理基础设施五层建设。业务 Agent 只表达领域差异；底层运行、工具、模型、知识、审计和部署能力统一复用。"),
  h("2.2 分层组件", 2),
  table(["层级", "核心组件", "职责"], [
    ["接入与体验层", "Web UI、Java 管理后台、OpenAPI、HITL 工作台、API Gateway", "任务提交、文件上传、人工确认、业务系统集成和统一入口治理。"],
    ["公共智能体运行层", "Agent API、AgentTemplateRouter、LangGraph Runtime、Task Queue、Policy/Audit", "统一任务生命周期、状态机编排、异步执行、安全策略和审计回放。"],
    ["业务 Agent 应用层", "指标体系构建 Agent、Excel 知识库补全 Agent、RAG 问答 Agent", "通过模板定义不同业务流程、工具集合和输出 Schema。"],
    ["能力插件与知识服务层", "Tool Registry、MCP Servers、Knowledge Service、Skill Library", "沉淀确定性工具、外部能力连接、文档解析、字段字典和检索能力。"],
    ["模型数据与治理层", "Model Gateway、PostgreSQL/pgvector、Redis、File Repo、Observability、Evaluation", "模型路由、数据存储、缓存队列、文件模型管理、监控评测和发布回滚。"],
  ]),
  h("3. 业务 Agent 与公共能力映射"),
  diagramAgentMap(), caption("图 2：业务 Agent 与公共能力映射"),
  h("3.1 指标体系构建 Agent", 2),
  p("指标体系构建 Agent 用于表结构理解和指标体系生成。它的核心不是简单问答，而是将大 JSON 或文件中的表字段信息转为可推导、可校验、可发布的指标体系 JSON。"),
  table(["阶段", "处理内容", "公共能力"], [
    ["输入接入", "table_json、Excel、Word、业务 Prompt", "Input Adapter、TaskContext"],
    ["Schema 瘦身", "避免全库大 JSON 直塞模型，按表/字段/业务域分批", "Schema Slimmer Skill"],
    ["业务域分类", "对表和字段进行业务域划分", "小模型、字段字典、RAG Tool"],
    ["指标推导", "生成指标、维度、口径、计算逻辑和 SQL 建议", "MetricRAG、Model Gateway"],
    ["可行性复评", "字段可得性、口径冲突、SQL 可执行性检查", "FeasibilityCheck Tool"],
    ["人工确认", "专家确认、修正、发布版本", "HITL、Audit、Evaluation"],
  ]),
  h("3.2 Excel 知识库补全 Agent", 2),
  p("Excel 知识库补全 Agent 用于结构化数据回填。典型场景是：知识库 Excel 中有物料、客户、组织、产品等主数据及属性；待补全 Excel 只有主键或少量字段；系统按主键精确匹配知识库并补全目标字段。物料只是示例，平台应支持多类主数据补全。"),
  table(["阶段", "处理内容", "公共能力"], [
    ["知识库导入", "解析知识库 Excel，生成主数据表、属性表、row_json 快照", "Parser、Index Writer、PostgreSQL"],
    ["待补全文件上传", "识别主键列和目标字段", "Field Dictionary、Excel Parser"],
    ["精确匹配", "基于主键批量查询，不以向量检索为主路径", "ExactLookup Tool、B-tree Index"],
    ["字段回填", "按映射规则补全属性字段，保留来源和差异", "FillExport Skill"],
    ["异常处理", "未命中、多命中、冲突、格式错误", "HITL、Exception Report"],
    ["导出结果", "补全 Excel、异常 Sheet、差异报告、审计记录", "File Service、Audit"],
  ]),
  h("3.3 RAG 问答 Agent", 2),
  p("RAG 问答 Agent 作为可扩展能力，主要用于非结构化文档问答、指标口径解释、异常说明生成等场景。它不是 Excel 补全的主路径，但可以作为字段别名、模糊匹配和解释型输出的辅助能力。"),
  h("4. 核心流程设计"),
  diagramCoreFlow(), caption("图 3：统一 Agent 执行流程"),
  h("4.1 Agent 初始化流程", 2),
  bullet("加载 agent_template.yaml，读取 agent_type、version、graph_config、input_schema、output_schema。"),
  bullet("加载工具权限和 Tool Manifest，生成当前 Agent 可见工具集。"),
  bullet("初始化 TaskContext，绑定 user_id、security_context、request_id、run_id。"),
  h("4.2 请求处理流程", 2),
  bullet("接入层完成鉴权、限流、request_id 注入和文件大小校验。"),
  bullet("Agent API 将文件/JSON/Prompt 转为统一输入对象，并按 agent_type 选择模板。"),
  bullet("Runtime 执行状态机节点，长任务进入队列，短任务可同步或 SSE 流式返回。"),
  h("4.3 工具调用流程", 2),
  bullet("Planner 生成工具调用计划，Tool Executor 校验入参 Schema。"),
  bullet("工具执行过程中记录 tool_call_id、参数哈希、耗时、状态和结果引用。"),
  bullet("失败工具根据策略重试、熔断或进入人工确认。"),
  h("4.4 知识检索流程", 2),
  bullet("结构化补全场景优先使用 PostgreSQL 精确查询，向量检索只做兜底。"),
  bullet("RAG 问答场景使用 pgvector 召回 + rerank + 引用生成。"),
  bullet("指标构建场景使用 Schema Registry + 指标知识库 RAG 共同辅助推导。"),
  h("5. 数据流与存储模型"),
  diagramDataFlow(), caption("图 4：数据流与存储模型"),
  h("5.1 核心数据表", 2),
  table(["表名", "关键字段", "说明"], [
    ["agent_templates", "agent_type, version, graph_config, input_schema, output_schema", "业务 Agent 模板注册。"],
    ["agent_runs", "run_id, agent_type, user_id, status, task_context, final_result", "一次 Agent 执行主记录。"],
    ["tool_calls", "run_id, node_id, tool_name, args_hash, result_ref, latency_ms, status", "工具调用审计与回放。"],
    ["model_calls", "run_id, model_name, prompt_hash, token_in, token_out, latency_ms, cost", "模型调用成本与性能分析。"],
    ["knowledge_collections", "collection_id, domain, source_type, acl_policy, parser_policy", "知识域管理。"],
    ["rag_chunks", "chunk_id, collection_id, chunk_text, embedding, metadata, source_ref", "语义检索主表。"],
    ["excel_master_rows", "row_id, collection_id, business_key, row_json, indexed_fields", "Excel 知识库补全的主数据快照表。"],
    ["field_dictionary", "field_name, aliases, target_column, data_type, required", "字段别名和目标列映射。"],
    ["metric_artifacts", "artifact_id, run_id, domain, metric_json, review_status, version", "指标体系构建结果。"],
    ["enrichment_results", "run_id, row_no, business_key, match_status, filled_json, diff_json", "Excel 补全结果和异常明细。"],
    ["audit_logs", "request_id, user_id, action, masked_payload, hit_refs, result_summary", "审计日志。"],
    ["evaluation_cases", "case_id, agent_type, input, expected, scoring_rule, tags", "回归评测样本。"],
  ]),
  h("6. 模块详细设计"),
  h("6.1 Agent API 模块", 2),
  table(["接口", "方法", "说明"], [
    ["/api/v1/agents/runs", "POST", "提交通用 Agent 任务，支持不同 agent_type。"],
    ["/api/v1/agents/runs/{run_id}", "GET", "查询任务状态、阶段、结果摘要。"],
    ["/api/v1/agents/runs/{run_id}/events", "GET/SSE", "流式返回节点事件、工具调用、模型输出和人工确认事件。"],
    ["/api/v1/knowledge/import", "POST", "导入文档或 Excel 知识库。"],
    ["/api/v1/excel-enrichment/runs", "POST", "提交 Excel 知识库补全任务。"],
    ["/api/v1/hitl/{run_id}/actions", "POST", "人工确认、修正、驳回、继续执行。"],
  ]),
  h("6.2 Tool / MCP / Skill 设计", 2),
  table(["类型", "定位", "示例"], [
    ["Tool", "单个确定性能力，入参与出参强 Schema", "schema_lookup、exact_lookup、vector_search、metric_rag_search、audit_write"],
    ["MCP Server", "跨 Agent 复用的外部能力封装", "database-mcp、file-mcp、knowledge-mcp、metrics-mcp"],
    ["Skill", "可复用专家流程", "excel_key_enrichment、field_alias_learning、metric_feasibility_check、rag_quality_check"],
    ["Agent Template", "业务级流程编排", "metric_system_builder、excel_knowledge_enrichment、rag_qa"],
  ]),
  code(`agent_template.yaml 示例
agent_type: excel_knowledge_enrichment
version: 1.0.0
input_schema: schemas/excel_enrichment_input.json
output_schema: schemas/excel_enrichment_output.json
graph:
  nodes: [parse_excel, detect_key_column, exact_lookup, fill_fields, validate_diff, export_result, audit]
tools: [excel_parse, exact_lookup, field_alias_map, fill_export, audit_write]`),
  h("6.3 Model Gateway 设计", 2),
  table(["能力", "模型/组件", "用途"], [
    ["分类/路由", "Qwen 7B/14B 或 API 小模型", "业务域分类、字段别名判断、意图识别。"],
    ["复杂推理", "Qwen 14B/32B 或同级模型", "指标推导、复杂解释、结构化生成。"],
    ["Embedding", "bge-m3", "文档向量化和 query embedding。"],
    ["Rerank", "bge-reranker-v2-m3", "召回结果重排。"],
    ["推理引擎", "llama.cpp / API / vLLM", "CPU 功能验证、API 效果验证、GPU 生产部署。"],
  ]),
  h("7. 部署架构"),
  diagramDeployment(), caption("图 5：部署架构与离线交付"),
  h("7.1 离线部署包", 2),
  table(["包类型", "内容"], [
    ["Docker 镜像包", "gateway、agent-api、agent-worker、knowledge-worker、postgres、redis、observability。"],
    ["Python wheelhouse", "fastapi、langgraph、langchain、pydantic、pandas、openpyxl、pymupdf、psycopg、presidio。"],
    ["模型包", "bge-m3、bge-reranker、Qwen GGUF/API 配置/vLLM 权重。"],
    ["SQL 包", "schema、索引、初始化字典、审计表、评测样本。"],
    ["配置包", "agent templates、tool manifests、prompt、JSON Schema。"],
  ]),
  h("8. 安全、性能与可观测"),
  bullet("安全：OAuth2/JWT/LDAP/SSO、数据域过滤、Presidio 脱敏、Tool 权限、参数化 SQL。"),
  bullet("性能：结构化补全走精确查询；RAG 问答走 pgvector + rerank；指标构建走 Schema Slimming + Map-Reduce。"),
  bullet("可观测：OpenTelemetry 串联 request_id、run_id、tool_call_id、model_call_id；Prometheus/Grafana 监控；Phoenix 记录 LLM Trace。"),
  bullet("评测：为每类 Agent 建立 golden cases，发布前做回归评测，支持版本对比和灰度回滚。"),
  h("9. 实施路线"),
  table(["阶段", "目标", "产出"], [
    ["P0 公共底座骨架", "Agent API、Runtime、Tool Registry、PostgreSQL、Redis、审计跑通", "可运行 mock Agent。"],
    ["P1 Excel 知识库补全", "知识库导入、主键识别、精确补全、异常报告", "Excel 补全 Agent。"],
    ["P2 指标体系构建", "Schema 瘦身、业务域分类、指标推导、人工确认", "指标体系构建 Agent。"],
    ["P3 RAG 问答扩展", "文档解析、向量检索、引用回答、反馈评测", "RAG 问答 Agent。"],
    ["P4 模型选型与生产治理", "CPU/API/GPU 三模式验证，完善监控、评测、灰度", "生产试点版本。"],
  ]),
  h("10. 小结"),
  p("本版把物料/Excel 补全从单一主线降级为业务 Agent 示例，重新回到整体智能体平台视角。平台通过公共 Runtime、Tool/MCP/Skill、Knowledge Service、Model Gateway、PostgreSQL/pgvector、审计观测和评测发布体系，统一承载指标体系构建、Excel 知识库补全、RAG 问答以及未来更多企业 Agent。"),
].join("");

const out = makeDocx("公共底层智能体平台详细设计方案_合并增强版.docx", body);
console.log(out);
