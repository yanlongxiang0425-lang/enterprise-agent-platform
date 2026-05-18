const fs = require("fs");
const path = require("path");
const { execFileSync } = require("child_process");

const OUT = path.resolve("交付物");
const BUILD = path.resolve(".build_agent_platform_v3");
fs.mkdirSync(OUT, { recursive: true });

function esc(s) {
  return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

const p = (text, style = "") =>
  `<w:p><w:pPr>${style ? `<w:pStyle w:val="${style}"/>` : ""}<w:spacing w:after="120"/></w:pPr><w:r><w:t xml:space="preserve">${esc(text)}</w:t></w:r></w:p>`;
const h = (text, level = 1) => p(text, `Heading${level}`);
const bullet = (text) =>
  `<w:p><w:pPr><w:pStyle w:val="ListParagraph"/><w:ind w:left="420"/><w:spacing w:after="80"/></w:pPr><w:r><w:t xml:space="preserve">• ${esc(text)}</w:t></w:r></w:p>`;
const code = (text) =>
  `<w:p><w:pPr><w:shd w:fill="F8FAFC"/><w:spacing w:before="80" w:after="80"/></w:pPr><w:r><w:rPr><w:rFonts w:ascii="Consolas" w:eastAsia="Consolas"/><w:sz w:val="17"/></w:rPr><w:t xml:space="preserve">${esc(text)}</w:t></w:r></w:p>`;

function table(headers, rows) {
  const width = Math.max(1350, Math.floor(14200 / headers.length));
  const tr = (cells, header = false) =>
    `<w:tr>${cells.map((c) => `<w:tc><w:tcPr><w:tcW w:w="${width}" w:type="dxa"/>${header ? '<w:shd w:fill="E2E8F0"/>' : ""}</w:tcPr><w:p><w:r>${header ? "<w:rPr><w:b/></w:rPr>" : ""}<w:t xml:space="preserve">${esc(c)}</w:t></w:r></w:p></w:tc>`).join("")}</w:tr>`;
  return `<w:tbl><w:tblPr><w:tblW w:w="0" w:type="auto"/><w:tblBorders><w:top w:val="single" w:sz="6" w:color="CBD5E1"/><w:left w:val="single" w:sz="6" w:color="CBD5E1"/><w:bottom w:val="single" w:sz="6" w:color="CBD5E1"/><w:right w:val="single" w:sz="6" w:color="CBD5E1"/><w:insideH w:val="single" w:sz="6" w:color="CBD5E1"/><w:insideV w:val="single" w:sz="6" w:color="CBD5E1"/></w:tblBorders></w:tblPr>${tr(headers, true)}${rows.map((r) => tr(r)).join("")}</w:tbl>`;
}

function svg(title, subtitle, body, w = 1800, h = 1120) {
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">
<defs>
  <marker id="arrow" markerWidth="12" markerHeight="12" refX="10" refY="4" orient="auto" markerUnits="strokeWidth"><path d="M0,0 L0,8 L11,4 z" fill="#475569"/></marker>
  <filter id="shadow" x="-10%" y="-10%" width="120%" height="120%"><feDropShadow dx="0" dy="5" stdDeviation="6" flood-color="#0f172a" flood-opacity="0.12"/></filter>
  <style>
    .title{font:800 38px Arial,'PingFang SC','Microsoft YaHei',sans-serif;fill:#0f172a}
    .sub{font:19px Arial,'PingFang SC','Microsoft YaHei',sans-serif;fill:#475569}
    .lane{font:800 23px Arial,'PingFang SC','Microsoft YaHei',sans-serif;fill:#0f172a}
    .h{font:800 19px Arial,'PingFang SC','Microsoft YaHei',sans-serif;fill:#111827}
    .t{font:15px Arial,'PingFang SC','Microsoft YaHei',sans-serif;fill:#334155}
    .s{font:13px Arial,'PingFang SC','Microsoft YaHei',sans-serif;fill:#64748b}
    .num{font:800 16px Arial,'PingFang SC','Microsoft YaHei',sans-serif;fill:#ffffff}
  </style>
</defs>
<rect width="100%" height="100%" fill="#ffffff"/>
<text x="44" y="55" class="title">${esc(title)}</text>
<text x="44" y="91" class="sub">${esc(subtitle)}</text>
${body}
</svg>`;
}

function box(x, y, w, h, title, lines, fill, stroke, opts = {}) {
  const r = opts.r || 18;
  const titleSize = opts.titleSize || "h";
  let out = `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${r}" fill="${fill}" stroke="${stroke}" stroke-width="${opts.strokeWidth || 2.5}" filter="${opts.shadow ? "url(#shadow)" : ""}"/>`;
  out += `<text x="${x + 18}" y="${y + 31}" class="${titleSize}">${esc(title)}</text>`;
  (lines || []).forEach((line, i) => {
    out += `<text x="${x + 18}" y="${y + 58 + i * 22}" class="${line.startsWith("-") ? "s" : "t"}">${esc(line)}</text>`;
  });
  return out;
}

function group(x, y, w, h, title, color) {
  return `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="26" fill="${color}" stroke="#CBD5E1" stroke-width="2"/><text x="${x + 22}" y="${y + 36}" class="lane">${esc(title)}</text>`;
}

function arrow(x1, y1, x2, y2, color = "#475569", dashed = false) {
  return `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${color}" stroke-width="3" ${dashed ? 'stroke-dasharray="8 6"' : ""} marker-end="url(#arrow)"/>`;
}

function nlabel(n, x, y, color = "#0F766E") {
  return `<circle cx="${x}" cy="${y}" r="15" fill="${color}"/><text x="${x - (n > 9 ? 8 : 5)}" y="${y + 6}" class="num">${n}</text>`;
}

function diagramOverall() {
  let b = "";
  b += group(40, 130, 1720, 130, "一、应用接入与安全网关", "#F8FAFC");
  b += box(80, 180, 330, 55, "业务系统与前端", ["Java 管理后台 · Web UI · OpenAPI Client"], "#DBEAFE", "#2563EB", { shadow: true });
  b += box(460, 180, 300, 55, "文件与任务入口", ["Excel/Word/PPT/PDF · table_json · prompt"], "#DBEAFE", "#2563EB", { shadow: true });
  b += box(810, 180, 330, 55, "Nginx / APISIX", ["TLS · 鉴权 · 限流 · 灰度 · request_id"], "#E0F2FE", "#0284C7", { shadow: true });
  b += box(1190, 180, 520, 55, "Policy Guard", ["OAuth2/JWT/LDAP · 数据域过滤 · Presidio脱敏 · Prompt注入防护"], "#FFE4E6", "#E11D48", { shadow: true });

  b += group(40, 300, 1720, 265, "二、公共 Agent Runtime（平台核心）", "#F0FDF4");
  b += box(80, 365, 310, 140, "Agent API", ["FastAPI + Uvicorn", "REST / SSE / Async Task", "AgentTemplateRouter"], "#DCFCE7", "#16A34A", { shadow: true });
  b += box(430, 365, 350, 140, "LangGraph Runtime", ["StateGraph / Checkpoint", "Planner · Router · Executor", "Map-Reduce 并行调度"], "#DCFCE7", "#16A34A", { shadow: true });
  b += box(820, 365, 320, 140, "Task & Cache", ["Redis 7.x", "Celery/RQ Worker", "schema/query/result cache"], "#FFEDD5", "#EA580C", { shadow: true });
  b += box(1180, 365, 250, 140, "HITL Gateway", ["人工确认", "修正 / 驳回 / 继续", "版本发布"], "#FEF3C7", "#D97706", { shadow: true });
  b += box(1470, 365, 240, 140, "Audit Replay", ["run/tool/model trace", "回放 · 复盘 · 评测样本"], "#ECFDF5", "#059669", { shadow: true });

  b += group(40, 610, 830, 250, "三、能力插件层", "#FFFBEB");
  b += box(80, 675, 230, 125, "Tool Registry", ["manifest", "Pydantic Schema", "timeout/retry/audit"], "#FEF3C7", "#D97706", { shadow: true });
  b += box(335, 675, 230, 125, "MCP Servers", ["database-mcp", "file-mcp", "knowledge-mcp"], "#FEF3C7", "#D97706", { shadow: true });
  b += box(590, 675, 235, 125, "Skill Library", ["excel_row_chunking", "field_alias_learning", "metric_feasibility_check"], "#FEF3C7", "#D97706", { shadow: true });

  b += group(930, 610, 830, 250, "四、知识与模型服务层", "#FAF5FF");
  b += box(970, 675, 245, 125, "Knowledge Service", ["Parser Router", "Chunk Policy", "RAG Retriever"], "#F3E8FF", "#7C3AED", { shadow: true });
  b += box(1240, 675, 220, 125, "Model Gateway", ["CPU/API/GPU Router", "OpenAI Compatible", "JSON Schema Output"], "#FFE4E6", "#E11D48", { shadow: true });
  b += box(1485, 675, 230, 125, "Model Endpoints", ["Qwen 7B/14B/32B", "bge-m3", "bge-reranker-v2-m3"], "#FFE4E6", "#E11D48", { shadow: true });

  b += group(40, 900, 1720, 145, "五、数据存储、可观测与离线交付", "#F8FAFC");
  b += box(80, 955, 300, 60, "PostgreSQL 16/17 + pgvector", ["rag_chunks · excel_rows · metric_artifacts · audit_logs"], "#FFFFFF", "#334155", { shadow: true });
  b += box(420, 955, 260, 60, "Redis / Queue", ["cache · queue · rate counter"], "#FFFFFF", "#EA580C", { shadow: true });
  b += box(720, 955, 320, 60, "File / Model Repository", ["原始文件 · 模型权重 · wheelhouse · docker tar"], "#FFFFFF", "#0284C7", { shadow: true });
  b += box(1080, 955, 300, 60, "Observability", ["OpenTelemetry · Prometheus · Grafana · Phoenix"], "#FFFFFF", "#059669", { shadow: true });
  b += box(1420, 955, 290, 60, "Evaluation & Release", ["golden cases · regression · gray · rollback"], "#FFFFFF", "#7C3AED", { shadow: true });

  b += arrow(410, 208, 460, 208) + arrow(760, 208, 810, 208) + arrow(1140, 208, 1190, 208);
  b += arrow(700, 260, 700, 300) + arrow(700, 565, 700, 610) + arrow(1320, 565, 1320, 610) + arrow(700, 860, 700, 900) + arrow(1320, 860, 1320, 900);
  b += arrow(390, 435, 430, 435) + arrow(780, 435, 820, 435) + arrow(1140, 435, 1180, 435) + arrow(1430, 435, 1470, 435);
  b += arrow(825, 737, 970, 737, "#7C3AED") + arrow(1215, 737, 1240, 737, "#E11D48") + arrow(1460, 737, 1485, 737, "#E11D48");
  return svg("公共底层智能体平台 · 组件级总体架构", "大图强调真实技术组件、层间关系与横切治理；业务 Agent 只是运行在平台之上的模板。", b, 1800, 1100);
}

function diagramAgentBlueprint() {
  let b = "";
  b += group(45, 125, 810, 760, "指标体系构建 Agent：Metric System Builder", "#EFF6FF");
  const left = [
    ["1 输入归一", "table_json / Excel / Word / prompt"],
    ["2 Schema Slimming", "表字段瘦身 · 去除冗余 · 分批"],
    ["3 业务域分类", "小模型路由 · 字段字典 · RAG辅助"],
    ["4 指标推导", "按业务域并行 · MetricRAG · SQLAdvisor"],
    ["5 可行性复评", "字段可得性 · 口径冲突 · SQL建议"],
    ["6 人工确认", "专家确认 · 修正 · 版本发布"],
    ["7 输出产物", "metric_system_json · metric_artifacts"],
  ];
  left.forEach((s, i) => {
    const y = 185 + i * 92;
    b += box(95, y, 680, 64, s[0], [s[1]], "#FFFFFF", "#2563EB", { shadow: true });
    if (i < left.length - 1) b += arrow(435, y + 64, 435, y + 82, "#2563EB");
  });

  b += group(945, 125, 810, 760, "离线 RAG / 字段填充 Agent：RAG Field Filler", "#F0FDF4");
  const right = [
    ["1 文件接入", "Excel / CSV / Word / PPT / PDF / TXT"],
    ["2 文档解析", "Parser Router · OCR可选 · DocumentModel"],
    ["3 知识写入", "row chunk · row_json · pgvector · field_dict"],
    ["4 查询理解", "意图分类 · 字段名/值抽取 · 别名映射"],
    ["5 检索路由", "精确查询优先 · 向量召回补充 · rerank"],
    ["6 答案生成", "字段直返 · LLM解释 · 引用/置信度"],
    ["7 反馈闭环", "人工确认 · 错误样本 · 字段字典回流"],
  ];
  right.forEach((s, i) => {
    const y = 185 + i * 92;
    b += box(995, y, 680, 64, s[0], [s[1]], "#FFFFFF", "#16A34A", { shadow: true });
    if (i < right.length - 1) b += arrow(1335, y + 64, 1335, y + 82, "#16A34A");
  });
  b += box(420, 930, 960, 88, "公共复用底座", ["Agent Runtime · Tool/MCP/Skill · Knowledge Service · Model Gateway · PostgreSQL/pgvector · Audit · Evaluation"], "#FEF3C7", "#D97706", { shadow: true });
  b += arrow(435, 885, 760, 930, "#D97706") + arrow(1335, 885, 1040, 930, "#D97706");
  return svg("两个业务 Agent 的模板化设计", "两个需求不是两套系统，而是两个 Agent Template；差异在节点和工具，底座能力完全复用。", b, 1800, 1060);
}

function diagramDataFlow() {
  let b = "";
  b += group(45, 125, 1710, 345, "离线知识构建链路（Ingestion Pipeline）", "#F0FDF4");
  const ingest = [
    ["File Intake", ["source_id", "batch_id", "checksum"]],
    ["Parser Router", ["Excel: openpyxl/pandas", "PDF: PyMuPDF", "Word/PPT parser"]],
    ["Chunk Policy", ["Excel: row chunk", "Text: semantic chunk", "metadata/row_json"]],
    ["Embedding Batch", ["bge-m3", "retry", "quality check"]],
    ["Index Writer", ["rag_chunks", "excel_rows", "field_dictionary"]],
    ["Quality Gate", ["chunk count", "sample recall", "rollback"]],
  ];
  ingest.forEach((n, i) => {
    const x = 75 + i * 275;
    b += box(x, 215, 230, 150, n[0], n[1], "#FFFFFF", "#16A34A", { shadow: true });
    if (i < ingest.length - 1) b += arrow(x + 230, 290, x + 275, 290, "#16A34A");
    b += nlabel(i + 1, x + 20, 205, "#16A34A");
  });

  b += group(45, 525, 1710, 355, "在线 Agent 执行链路（Serving Pipeline）", "#EEF2FF");
  const online = [
    ["Request", ["metric / rag / field", "security_context"]],
    ["Intent Router", ["agent_type", "task mode", "confidence"]],
    ["Planner", ["LangGraph plan", "parallel nodes"]],
    ["Tool / Retriever", ["exact query", "vector search", "schema lookup"]],
    ["Model Gateway", ["small model", "main model", "structured output"]],
    ["Validator & Audit", ["schema check", "citation", "audit log"]],
  ];
  online.forEach((n, i) => {
    const x = 75 + i * 275;
    b += box(x, 625, 230, 150, n[0], n[1], "#FFFFFF", "#4F46E5", { shadow: true });
    if (i < online.length - 1) b += arrow(x + 230, 700, x + 275, 700, "#4F46E5");
    b += nlabel(i + 1, x + 20, 615, "#4F46E5");
  });
  b += arrow(1455, 365, 1455, 625, "#64748B", true);
  b += `<text x="1475" y="495" class="s">知识构建结果支撑在线检索</text>`;
  return svg("离线构建与在线执行双数据流", "用两条链路明确数据如何进入知识库、如何被 Agent 调用，避免把大 JSON 直接塞给模型。", b, 1800, 930);
}

function diagramRuntimeSequence() {
  const actors = ["Client", "Gateway", "Agent API", "Runtime", "Tool/MCP", "Knowledge DB", "Model GW", "Validator", "Audit"];
  const xs = [80, 270, 460, 650, 840, 1030, 1220, 1410, 1600];
  let b = "";
  xs.forEach((x, i) => {
    b += box(x - 78, 125, 156, 56, actors[i], [], "#E0F2FE", "#0284C7");
    b += `<line x1="${x}" y1="190" x2="${x}" y2="920" stroke="#CBD5E1" stroke-width="2"/>`;
  });
  const steps = [
    [0, 1, "提交任务：文件 / table_json / prompt / query"],
    [1, 2, "鉴权、限流、注入 request_id"],
    [2, 3, "构建 TaskContext，选择 Agent Template"],
    [3, 4, "生成计划，调用 Tool / MCP / Skill"],
    [4, 5, "精确查询 / 向量检索 / Schema 查询"],
    [5, 4, "返回 row_id / chunks / schema_context"],
    [3, 6, "必要时调用模型：分类 / 推理 / 生成"],
    [6, 3, "返回结构化 ModelOutput"],
    [3, 7, "Schema、引用、权限、事实一致性校验"],
    [7, 8, "写入审计、Trace、评测样本"],
    [7, 2, "返回 final_result 或 HITL 状态"],
    [2, 0, "同步返回 / SSE 流式返回 / 异步查询"],
  ];
  let y = 235;
  steps.forEach((s, i) => {
    b += arrow(xs[s[0]], y, xs[s[1]], y, i > 8 ? "#059669" : "#475569");
    b += `<text x="${Math.min(xs[s[0]], xs[s[1]]) + 10}" y="${y - 11}" class="s">${esc(i + 1 + ". " + s[2])}</text>`;
    y += 54;
  });
  return svg("统一 Agent 请求处理时序图", "指标构建、字段填充、RAG 问答都遵循同一生命周期：输入、计划、工具、模型、校验、审计、返回。", b, 1800, 980);
}

function diagramDeployment() {
  let b = "";
  b += `<rect x="55" y="125" width="1690" height="820" rx="28" fill="#F8FAFC" stroke="#334155" stroke-width="3"/>`;
  b += `<text x="90" y="165" class="lane">内网单机虚拟机 / 后续可拆分多节点</text>`;
  const comps = [
    [95, 210, 265, 130, "gateway", ["Nginx/APISIX", "80/443", "TLS · Auth · Limit"], "#DBEAFE", "#2563EB"],
    [430, 210, 265, 130, "agent-api", ["FastAPI + Uvicorn", "REST/SSE", "AgentTemplateRouter"], "#DCFCE7", "#16A34A"],
    [765, 210, 265, 130, "agent-worker", ["LangGraph Runtime", "Celery/RQ", "Checkpoint"], "#DCFCE7", "#16A34A"],
    [1100, 210, 265, 130, "knowledge-worker", ["Parser/Chunker", "Embedding Batch", "Quality Gate"], "#FEF3C7", "#D97706"],
    [1435, 210, 265, 130, "model-gateway", ["llama.cpp/API/vLLM", "OpenAI Compatible", "model routing"], "#FFE4E6", "#E11D48"],
    [95, 445, 265, 135, "PostgreSQL", ["16/17 + pgvector", "rag/excel/metric", "audit/run/model calls"], "#F3E8FF", "#7C3AED"],
    [430, 445, 265, 135, "Redis", ["cache", "queue", "rate counter"], "#FFEDD5", "#EA580C"],
    [765, 445, 265, 135, "File Repository", ["raw files", "model weights", "offline packages"], "#E0F2FE", "#0284C7"],
    [1100, 445, 265, 135, "Observability", ["OTel", "Prometheus/Grafana", "Phoenix/Loki"], "#ECFDF5", "#059669"],
    [1435, 445, 265, 135, "Evaluation", ["golden cases", "regression", "gray/rollback"], "#F8FAFC", "#334155"],
  ];
  comps.forEach((c) => (b += box(c[0], c[1], c[2], c[3], c[4], c[5], c[6], c[7], { shadow: true })));
  [[360,275,430,275],[695,275,765,275],[1030,275,1100,275],[1365,275,1435,275],[897,340,897,445],[562,340,562,445],[1228,340,1228,445],[1568,340,1568,445]].forEach((a)=>b+=arrow(...a));
  b += box(95, 690, 760, 105, "CPU 功能验证配置", ["16C / 64GB / 500GB SSD：跑通 Agent、RAG、Tool、审计；7B GGUF 慢速验证，不作为性能指标。"], "#FFFFFF", "#334155", { shadow: true });
  b += box(940, 690, 760, 105, "GPU 生产配置建议", ["32C / 128GB / 2TB SSD + L20 48GB 或 A100 40GB；以模型压测结果决定最终 GPU。"], "#FFFFFF", "#334155", { shadow: true });
  return svg("离线部署与生产演进拓扑", "第一阶段单机虚机离线部署；模型确认后只替换 model-gateway 后端为 vLLM/GPU，上层 Agent 不改造。", b, 1800, 1010);
}

function imageRel(id, name, w = 9300000, h = 5600000) {
  return `<w:p><w:pPr><w:jc w:val="center"/></w:pPr><w:r><w:drawing><wp:inline distT="0" distB="0" distL="0" distR="0" xmlns:wp="http://schemas.openxmlformats.org/drawingml/2006/wordprocessingDrawing"><wp:extent cx="${w}" cy="${h}"/><wp:docPr id="${id}" name="${name}"/><a:graphic xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main"><a:graphicData uri="http://schemas.openxmlformats.org/drawingml/2006/picture"><pic:pic xmlns:pic="http://schemas.openxmlformats.org/drawingml/2006/picture"><pic:nvPicPr><pic:cNvPr id="${id}" name="${name}"/><pic:cNvPicPr/></pic:nvPicPr><pic:blipFill><a:blip r:embed="rId${id}" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"/><a:stretch><a:fillRect/></a:stretch></pic:blipFill><pic:spPr><a:xfrm><a:off x="0" y="0"/><a:ext cx="${w}" cy="${h}"/></a:xfrm><a:prstGeom prst="rect"><a:avLst/></a:prstGeom></pic:spPr></pic:pic></a:graphicData></a:graphic></wp:inline></w:drawing></w:r></w:p>`;
}
const caption = (text) => `<w:p><w:pPr><w:jc w:val="center"/></w:pPr><w:r><w:rPr><w:color w:val="64748B"/><w:sz w:val="18"/></w:rPr><w:t>${esc(text)}</w:t></w:r></w:p>`;

function styles() {
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><w:styles xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:style w:type="paragraph" w:default="1" w:styleId="Normal"><w:name w:val="Normal"/><w:rPr><w:rFonts w:ascii="Arial Unicode MS" w:eastAsia="Arial Unicode MS"/><w:sz w:val="21"/></w:rPr></w:style><w:style w:type="paragraph" w:styleId="Heading1"><w:name w:val="heading 1"/><w:basedOn w:val="Normal"/><w:rPr><w:b/><w:sz w:val="36"/><w:color w:val="0F172A"/></w:rPr></w:style><w:style w:type="paragraph" w:styleId="Heading2"><w:name w:val="heading 2"/><w:basedOn w:val="Normal"/><w:rPr><w:b/><w:sz w:val="28"/><w:color w:val="1F2937"/></w:rPr></w:style><w:style w:type="paragraph" w:styleId="Heading3"><w:name w:val="heading 3"/><w:basedOn w:val="Normal"/><w:rPr><w:b/><w:sz w:val="24"/><w:color w:val="334155"/></w:rPr></w:style><w:style w:type="paragraph" w:styleId="Title"><w:name w:val="Title"/><w:rPr><w:b/><w:sz w:val="44"/></w:rPr></w:style><w:style w:type="paragraph" w:styleId="ListParagraph"><w:name w:val="List Paragraph"/><w:basedOn w:val="Normal"/></w:style></w:styles>`;
}

function documentXml(body) {
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><w:body>${body}<w:sectPr><w:pgSz w:w="16838" w:h="11906" w:orient="landscape"/><w:pgMar w:top="720" w:right="720" w:bottom="720" w:left="720" w:header="720" w:footer="720" w:gutter="0"/></w:sectPr></w:body></w:document>`;
}

function makeDocx(filename, body, svgs) {
  const dir = path.join(BUILD, filename.replace(".docx", ""));
  fs.rmSync(dir, { recursive: true, force: true });
  fs.mkdirSync(path.join(dir, "_rels"), { recursive: true });
  fs.mkdirSync(path.join(dir, "word", "_rels"), { recursive: true });
  fs.mkdirSync(path.join(dir, "word", "media"), { recursive: true });
  fs.writeFileSync(path.join(dir, "[Content_Types].xml"), `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Default Extension="svg" ContentType="image/svg+xml"/><Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/><Override PartName="/word/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.styles+xml"/></Types>`);
  fs.writeFileSync(path.join(dir, "_rels", ".rels"), `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/></Relationships>`);
  fs.writeFileSync(path.join(dir, "word", "document.xml"), documentXml(body));
  fs.writeFileSync(path.join(dir, "word", "styles.xml"), styles());
  let rels = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">`;
  svgs.forEach((svg, i) => {
    fs.writeFileSync(path.join(dir, "word", "media", `image${i + 1}.svg`), svg);
    rels += `<Relationship Id="rId${i + 1}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/image" Target="media/image${i + 1}.svg"/>`;
  });
  rels += `</Relationships>`;
  fs.writeFileSync(path.join(dir, "word", "_rels", "document.xml.rels"), rels);
  const out = path.join(OUT, filename);
  try { fs.unlinkSync(out); } catch {}
  execFileSync("zip", ["-qr", out, "."], { cwd: dir });
  return out;
}

const svgs = [diagramOverall(), diagramAgentBlueprint(), diagramDataFlow(), diagramRuntimeSequence(), diagramDeployment()];
const body = [
  `<w:p><w:pPr><w:pStyle w:val="Title"/><w:jc w:val="center"/></w:pPr><w:r><w:t>公共底层智能体框架详细设计方案（图示增强版）</w:t></w:r></w:p>`,
  p("参照工业级 Agent 详细设计方案的组织方式重写，重点增强技术架构图表达：组件更完整、分区更清晰、链路更明确、图面更适合汇报。"),
  h("1. 项目背景与定位"),
  h("1.1 项目简介", 2),
  p("本项目建设一个公共底层智能体平台，用统一的 Agent Runtime、工具体系、知识服务、模型网关、审计治理和离线部署能力，支撑“指标体系构建 Agent”和“离线 RAG/字段填充 Agent”两个首批业务智能体，并为后续企业内部 Agent 扩展提供标准底座。"),
  h("1.2 项目定位", 2),
  bullet("公共智能体框架：业务 Agent 以模板方式注册，底层能力统一复用。"),
  bullet("工业级详细设计：不仅描述业务流程，还明确服务组件、数据组件、模型组件、治理组件和部署组件。"),
  bullet("内网离线部署：组件、依赖、模型、SQL、模板和评测样本均可离线交付。"),
  h("1.3 核心设计原则", 2),
  table(["原则", "说明"], [
    ["业务 Agent 薄，平台底座厚", "业务侧只定义模板、状态机、工具组合和输出 Schema；通用能力沉淀到底座。"],
    ["确定性逻辑工具化", "文件解析、字段查询、向量检索、校验、审计等确定性能力全部下沉到 Tool/MCP/Skill。"],
    ["模型调用网关化", "CPU、API、GPU 三种模型部署方式由 Model Gateway 屏蔽，上层 Agent 不感知。"],
    ["全链路可回放", "Agent Run、Tool Call、Model Call、Retrieval Context、Human Feedback 全部可审计、可回放、可评测。"],
  ]),
  h("2. 系统概要设计"),
  h("2.1 总体技术架构", 2),
  imageRel(1, "overall", 9300000, 5680000),
  caption("图 1：公共底层智能体平台组件级总体架构"),
  p("总体架构分为应用接入与安全网关、公共 Agent Runtime、能力插件层、知识与模型服务层、数据存储与治理观测五个区域。图中每个方块均对应可部署或可实现的工程组件，避免只停留在业务概念层。"),
  h("2.2 架构关键点", 2),
  bullet("Agent API 使用 FastAPI 承载 REST/SSE/异步任务接口，Java 管理后台通过 OpenAPI 调用。"),
  bullet("LangGraph Runtime 是平台核心，负责状态机、并行 Map-Reduce、Checkpoint、HITL 和 Replay。"),
  bullet("Tool Registry、MCP Servers、Skill Library 组成能力插件层，统一承载业务工具、外部系统连接和专家流程。"),
  bullet("Knowledge Service 负责 Parser Router、Chunk Policy、RAG Retriever、Schema Registry 和 Field Dictionary。"),
  bullet("Model Gateway 负责 CPU/API/GPU 模式切换，并统一提供分类、推理、Embedding、Rerank 和结构化输出能力。"),
  h("3. 两个业务 Agent 的模板化设计"),
  imageRel(2, "agent-blueprint", 9300000, 5480000),
  caption("图 2：两个业务 Agent 的模板化设计"),
  h("3.1 指标体系构建 Agent", 2),
  p("指标体系构建 Agent 面向表结构、大 JSON、Excel/Word 文档和业务 prompt。核心挑战是输入巨大、字段复杂、指标口径需要可解释和可确认。因此设计上采用 Schema Slimming + 业务域 Map-Reduce + 指标知识 RAG + 可行性复评 + 人工确认。"),
  table(["阶段", "关键组件", "处理逻辑", "输出"], [
    ["输入归一", "Input Adapter", "table_json、Excel、Word、prompt 统一转 TaskContext", "NormalizedInput"],
    ["Schema 瘦身", "Schema Slimmer Skill", "保留 table/column/comment/dtype/sample/key hints，避免大 JSON 直塞模型", "SlimSchema"],
    ["业务域分类", "DomainClassifier Tool + 小模型", "按批次分类表和字段，必要时检索字段字典", "domain_tables"],
    ["指标推导", "MetricRAG + MetricGenerator", "按业务域并行生成指标、维度、口径、计算逻辑和 SQL 建议", "metric_candidates"],
    ["可行性复评", "FeasibilityCheck Skill", "检查字段可得性、口径冲突、SQL 可执行性、缺失字段", "review_result"],
    ["人工确认", "HITL Gateway", "专家确认、修正、驳回、发布", "metric_system_json"],
  ]),
  h("3.2 离线 RAG / 字段填充 Agent", 2),
  p("离线 RAG/字段填充 Agent 面向 Excel/Word/PPT/PDF/TXT 等文件。核心挑战是 Excel 行级字段填充不能只依赖向量召回，因此设计上采用 row_json + 常用字段索引 + pgvector 语义补充的组合。"),
  table(["阶段", "关键组件", "处理逻辑", "输出"], [
    ["文件接入", "File Gateway", "生成 source_id、batch_id、checksum，保存原始文件", "ImportBatch"],
    ["文档解析", "Parser Router", "Excel 结构化解析；Word/PPT/PDF 按标题、页码、slide、OCR 解析", "DocumentModel"],
    ["知识写入", "Chunk Policy + Index Writer", "Excel 一行一个主 chunk，row_json 保存整行；写入 rag_chunks/excel_rows", "KnowledgeIndex"],
    ["查询理解", "IntentRouter + FieldAlias", "抽取字段名、字段值、目标字段，完成别名映射", "QueryPlan"],
    ["检索路由", "Retriever Router", "明确字段值走精确查询；自然语言走向量；混合场景先过滤后召回", "RetrievalContext"],
    ["结果输出", "AnswerBuilder + Validator", "字段填充直返；复杂问答调用 LLM 并返回引用/置信度", "FinalAnswer"],
  ]),
  h("4. 数据流设计"),
  imageRel(3, "data-flow", 9300000, 4820000),
  caption("图 3：离线构建与在线执行双数据流"),
  h("4.1 大 JSON 处理策略", 2),
  bullet("禁止把全库表结构拼成一个长 JSON 一次性输入模型。"),
  bullet("通过 Schema Slimming 降低输入体积，只保留指标推导需要的字段语义信息。"),
  bullet("采用 Map-Reduce：先按批次/业务域分类，再在业务域内推导指标，最后聚合。"),
  bullet("每个业务域作为独立 Agent 子任务，支持并行、失败重试和断点续跑。"),
  h("4.2 Excel 行级字段填充策略", 2),
  bullet("一行业务记录作为主 chunk，chunk_text 用字段名和值串联，row_json 保存整行原始字段。"),
  bullet("编号、名称、日期、状态等高频字段单独建列并创建 B-tree 索引。"),
  bullet("row_json 使用 JSONB GIN 索引支持灵活字段查询，文本模糊查询使用 pg_trgm。"),
  bullet("pgvector 用于语义召回，不替代结构化精确查询。字段填充场景优先不调用 LLM。"),
  h("5. 核心模块详细设计"),
  h("5.1 Agent API 模块", 2),
  table(["接口", "方法", "说明", "返回"], [
    ["/api/v1/agents/runs", "POST", "提交 Agent 任务，agent_type 支持 metric_system_builder / rag_field_filler", "run_id/status"],
    ["/api/v1/agents/runs/{run_id}", "GET", "查询任务状态、阶段、结果摘要", "run_detail"],
    ["/api/v1/agents/runs/{run_id}/events", "GET/SSE", "流式返回节点事件、工具调用、模型输出、人工确认状态", "event stream"],
    ["/api/v1/knowledge/import", "POST", "提交知识库导入任务", "batch_id"],
    ["/api/v1/hitl/{run_id}/actions", "POST", "人工确认、修正、驳回、继续执行", "next_state"],
  ]),
  h("5.2 Agent Runtime 模块", 2),
  table(["子模块", "职责", "实现要点"], [
    ["TaskContext Builder", "统一封装输入、用户、安全、任务、上下文", "所有节点只读写 TaskContext，避免散乱参数传递。"],
    ["AgentTemplateRouter", "根据 agent_type 加载模板", "模板定义节点、边、工具权限、输入输出 Schema。"],
    ["Planner", "生成执行计划", "指标构建支持按业务域并行；RAG 查询支持精确/向量路由。"],
    ["Executor", "执行节点和工具调用", "工具入参校验、超时重试、熔断、结果落库。"],
    ["Checkpoint", "保存中间状态", "支持失败恢复、人工确认后继续执行。"],
    ["Validator", "输出校验", "JSON Schema、引用、权限、事实一致性校验。"],
  ]),
  h("5.3 Tool / MCP / Skill 模块", 2),
  table(["类型", "定位", "示例", "边界"], [
    ["Tool", "单个确定性能力", "schema_lookup、exact_row_query、vector_search、metric_rag_search", "只做一个清晰动作，输入输出强 Schema。"],
    ["MCP Server", "跨 Agent 复用的外部能力封装", "database-mcp、file-mcp、knowledge-mcp、metrics-mcp", "把内部数据库、文件、知识源标准化暴露。"],
    ["Skill", "专家规则流程", "excel_row_chunking、field_alias_learning、metric_feasibility_check", "沉淀稳定规则，减少 Prompt 依赖。"],
    ["Agent Template", "业务流程编排", "metric_system_builder、rag_field_filler", "只组合 Tool/MCP/Skill，不内嵌底层实现。"],
  ]),
  code(`tool_manifest.yaml
name: exact_row_query
version: 1.0.0
input_schema: { collection_id, field_name, field_value, target_fields }
output_schema: { row_id, row_json, confidence, source_ref }
permission: data.read
timeout_ms: 3000
audit_level: high`),
  h("5.4 Knowledge Service 模块", 2),
  bullet("Parser Router：按文件类型分发 Excel、Word、PPT、PDF、TXT/Markdown 解析器。"),
  bullet("Chunk Policy：Excel 行级 chunk、表格行 chunk、标题段落 chunk、slide/page chunk、长文本 overlap chunk。"),
  bullet("Index Writer：统一写入 rag_chunks、excel_rows、field_dictionary、ingest_batches。"),
  bullet("Retriever Router：精确字段查询、JSONB 查询、pg_trgm 模糊查询、pgvector 语义召回、rerank。"),
  h("5.5 Model Gateway 模块", 2),
  table(["模型类型", "阶段", "组件", "用途"], [
    ["小模型", "CPU/API/GPU 均可", "Qwen 7B/14B", "意图识别、业务域分类、字段别名判断。"],
    ["主模型", "API 验证后 GPU", "Qwen 14B/32B 或同级模型", "指标推导、复杂解释、结构化生成。"],
    ["Embedding", "离线固定", "bge-m3", "文档和 query 向量化。"],
    ["Rerank", "离线固定", "bge-reranker-v2-m3", "召回结果 top-k 重排。"],
    ["推理引擎", "CPU 验证 / GPU 生产", "llama.cpp / vLLM", "屏蔽部署差异，对上提供 OpenAI Compatible API。"],
  ]),
  h("6. 统一请求处理时序"),
  imageRel(4, "sequence", 9300000, 5060000),
  caption("图 4：统一 Agent 请求处理时序图"),
  h("7. 数据模型设计"),
  table(["表名", "关键字段", "用途"], [
    ["agent_templates", "agent_type, version, graph_config, input_schema, output_schema, enabled", "注册业务 Agent 模板。"],
    ["agent_runs", "run_id, agent_type, user_id, status, task_context, final_result", "记录一次 Agent 执行。"],
    ["tool_calls", "run_id, node_id, tool_name, args_hash, result_ref, latency_ms, status", "工具调用审计与回放。"],
    ["model_calls", "run_id, model_name, prompt_hash, token_in, token_out, latency_ms, cost", "模型调用成本和性能分析。"],
    ["knowledge_collections", "collection_id, domain, source_type, acl_policy, parser_policy", "知识域管理。"],
    ["rag_chunks", "chunk_id, collection_id, chunk_text, embedding, metadata, source_ref", "语义检索主表。"],
    ["excel_rows", "row_id, source_id, sheet_name, row_no, row_json, indexed_fields", "Excel 字段填充主表。"],
    ["field_dictionary", "field_name, aliases, data_type, examples, source_scope", "字段别名和语义字典。"],
    ["metric_artifacts", "artifact_id, run_id, domain, metric_json, review_status, version", "指标体系构建结果。"],
    ["audit_logs", "request_id, user_id, action, masked_payload, hit_refs, result_summary", "审计日志。"],
    ["evaluation_cases", "case_id, agent_type, input, expected, scoring_rule, tags", "回归评测样本。"],
  ]),
  h("8. 部署架构"),
  imageRel(5, "deployment", 9300000, 5220000),
  caption("图 5：离线部署与生产演进拓扑"),
  h("8.1 离线部署包", 2),
  table(["包类型", "内容", "说明"], [
    ["Docker 镜像包", "gateway、agent-api、agent-worker、knowledge-worker、postgres、redis、observability", "通过 docker save/load 离线交付。"],
    ["Python wheelhouse", "fastapi、langgraph、langchain、pydantic、pandas、openpyxl、pymupdf、psycopg、presidio", "内网 pip --no-index 安装。"],
    ["模型包", "bge-m3、bge-reranker、Qwen GGUF/API配置/vLLM权重", "按 CPU 验证、API 选型、GPU 生产分阶段固化。"],
    ["SQL 包", "schema、索引、初始化字典、审计表、评测样本", "支持一键初始化。"],
    ["配置包", "agent templates、tool manifests、prompt、JSON Schema", "平台扩展核心资产。"],
  ]),
  h("9. 安全、性能与可观测"),
  h("9.1 安全设计", 2),
  bullet("接入层支持 OAuth2/JWT/LDAP/SSO，内部服务使用 service token。"),
  bullet("每个请求携带 security_context，Tool Executor 在工具调用前注入 ACL filter。"),
  bullet("Presidio + 自定义正则处理手机号、身份证、邮箱、客户名、合同号等敏感信息。"),
  bullet("禁止 LLM 生成 SQL 后直接执行；数据库工具必须参数化查询。"),
  h("9.2 性能设计", 2),
  table(["方向", "设计"], [
    ["大 JSON", "Schema Slimming + Map-Reduce + 中间状态落库。"],
    ["字段填充", "PostgreSQL 精确查询优先，pgvector 仅做语义补充。"],
    ["检索", "B-tree / JSONB GIN / pg_trgm / pgvector HNSW + rerank。"],
    ["异步", "解析、embedding、指标推导走 Worker 队列，支持失败重试。"],
    ["缓存", "Redis 缓存 schema hash、字段字典、query embedding、常见查询结果。"],
  ]),
  h("9.3 可观测与评测", 2),
  bullet("OpenTelemetry 串联 request_id、run_id、node_id、tool_call_id、model_call_id。"),
  bullet("Prometheus/Grafana 监控 QPS、延迟、错误率、队列长度、模型 token、检索耗时。"),
  bullet("Phoenix 记录 LLM Trace、prompt、上下文、工具调用和模型输出。"),
  bullet("Evaluation 为两个核心 Agent 建立 golden cases，发布前做回归评测。"),
  h("10. 实施路线"),
  table(["阶段", "目标", "产出"], [
    ["P0 公共底座骨架", "打通 Agent API、Runtime、Tool Registry、PostgreSQL、Redis、审计", "可提交 mock Agent 并回放执行链路。"],
    ["P1 知识服务与字段填充", "完成文件解析、Excel 行级 chunk、精确查询、语义召回", "RAG/字段填充 Agent 可用。"],
    ["P2 指标体系构建", "完成 Schema 瘦身、业务域分类、指标推导、人工确认", "指标体系构建 Agent 可用。"],
    ["P3 模型选型压测", "CPU/API/GPU 三模式验证，确定模型与 GPU", "模型评测报告与部署参数。"],
    ["P4 生产治理", "完善权限、审计、可观测、评测、灰度、回滚", "生产试点版本。"],
  ]),
  h("11. 小结"),
  p("本版本重点强化图形表达：总体架构图采用五大技术区域，组件级表达清晰；两个业务 Agent 用模板化设计表达差异；数据流图明确离线构建与在线运行；时序图明确统一生命周期；部署图明确单机离线与 GPU 生产演进。整体目标是让文档既能作为评审材料，也能作为后续工程拆分和实施依据。"),
].join("");

const out = makeDocx("公共底层智能体框架详细设计方案_图示增强版.docx", body, svgs);
console.log(out);
