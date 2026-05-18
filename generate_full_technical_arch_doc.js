const fs = require("fs");
const path = require("path");
const { execFileSync } = require("child_process");

const OUT = path.resolve("交付物");
const BUILD = path.resolve(".build_full_tech_arch");
fs.mkdirSync(OUT, { recursive: true });

function esc(s) {
  return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function p(text, style = "") {
  const st = style ? `<w:pStyle w:val="${style}"/>` : "";
  return `<w:p><w:pPr>${st}<w:spacing w:after="120"/></w:pPr><w:r><w:t xml:space="preserve">${esc(text)}</w:t></w:r></w:p>`;
}

function h(text, level = 1) {
  return p(text, `Heading${level}`);
}

function bullet(text) {
  return `<w:p><w:pPr><w:pStyle w:val="ListParagraph"/><w:ind w:left="420"/><w:spacing w:after="80"/></w:pPr><w:r><w:t xml:space="preserve">• ${esc(text)}</w:t></w:r></w:p>`;
}

function code(text) {
  return `<w:p><w:pPr><w:shd w:fill="F8FAFC"/><w:spacing w:before="80" w:after="80"/></w:pPr><w:r><w:rPr><w:rFonts w:ascii="Consolas" w:eastAsia="Consolas"/><w:sz w:val="18"/></w:rPr><w:t xml:space="preserve">${esc(text)}</w:t></w:r></w:p>`;
}

function table(headers, rows) {
  const tr = (cells, header = false) => `<w:tr>${cells.map(c => `<w:tc><w:tcPr><w:tcW w:w="${Math.max(1600, Math.floor(9000 / headers.length))}" w:type="dxa"/>${header ? '<w:shd w:fill="E2E8F0"/>' : ""}</w:tcPr><w:p><w:r>${header ? "<w:rPr><w:b/></w:rPr>" : ""}<w:t xml:space="preserve">${esc(c)}</w:t></w:r></w:p></w:tc>`).join("")}</w:tr>`;
  return `<w:tbl><w:tblPr><w:tblW w:w="0" w:type="auto"/><w:tblBorders><w:top w:val="single" w:sz="6" w:color="CBD5E1"/><w:left w:val="single" w:sz="6" w:color="CBD5E1"/><w:bottom w:val="single" w:sz="6" w:color="CBD5E1"/><w:right w:val="single" w:sz="6" w:color="CBD5E1"/><w:insideH w:val="single" w:sz="6" w:color="CBD5E1"/><w:insideV w:val="single" w:sz="6" w:color="CBD5E1"/></w:tblBorders></w:tblPr>${tr(headers, true)}${rows.map(r => tr(r)).join("")}</w:tbl>`;
}

function svgHeader(title, subtitle, body, w = 1400, h = 900) {
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">
  <defs>
    <marker id="arrow" markerWidth="10" markerHeight="10" refX="8" refY="3" orient="auto" markerUnits="strokeWidth"><path d="M0,0 L0,6 L9,3 z" fill="#64748B"/></marker>
    <style>
      .title{font:800 30px Arial,'PingFang SC','Microsoft YaHei',sans-serif;fill:#0f172a}
      .sub{font:16px Arial,'PingFang SC','Microsoft YaHei',sans-serif;fill:#475569}
      .h{font:700 18px Arial,'PingFang SC','Microsoft YaHei',sans-serif;fill:#111827}
      .t{font:14px Arial,'PingFang SC','Microsoft YaHei',sans-serif;fill:#334155}
      .s{font:12px Arial,'PingFang SC','Microsoft YaHei',sans-serif;fill:#64748b}
    </style>
  </defs>
  <rect width="100%" height="100%" fill="#ffffff"/>
  <text x="36" y="44" class="title">${esc(title)}</text>
  <text x="36" y="76" class="sub">${esc(subtitle)}</text>
  ${body}
</svg>`;
}

function rect(x, y, w, h, title, lines, fill, stroke) {
  let out = `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="12" fill="${fill}" stroke="${stroke}" stroke-width="2"/>`;
  out += `<text x="${x + 14}" y="${y + 26}" class="h">${esc(title)}</text>`;
  (lines || []).forEach((line, i) => out += `<text x="${x + 14}" y="${y + 50 + i * 19}" class="${line.startsWith('-') ? 's' : 't'}">${esc(line)}</text>`);
  return out;
}

function arr(x1, y1, x2, y2, color = "#64748B") {
  return `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${color}" stroke-width="2.5" marker-end="url(#arrow)"/>`;
}

function diagramOverallTech() {
  const colors = {
    app: ["#DBEAFE", "#2563EB"], access: ["#E0F2FE", "#0284C7"], runtime: ["#DCFCE7", "#16A34A"],
    tools: ["#FEF3C7", "#D97706"], knowledge: ["#F3E8FF", "#7C3AED"], model: ["#FFE4E6", "#E11D48"],
    data: ["#F8FAFC", "#334155"], observe: ["#ECFDF5", "#059669"]
  };
  let b = "";
  b += rect(40, 115, 1320, 74, "应用与接入层", ["Java/Spring Boot 管理后台 · Web UI · OpenAPI Client · 文件上传端 · 指标体系构建入口 · 字段填充入口"], ...colors.app);
  b += rect(40, 215, 1320, 74, "网关与安全入口", ["Nginx / APISIX · OAuth2/JWT/LDAP/SSO · 限流 · 灰度 · 请求大小控制 · 审计 request_id"], ...colors.access);
  b += rect(40, 315, 310, 142, "Agent API 服务", ["FastAPI + Uvicorn", "AgentTemplateRouter", "TaskContext 校验", "SSE/异步任务 API"], ...colors.runtime);
  b += rect(390, 315, 310, 142, "Agent Runtime", ["LangGraph 1.x", "Planner / Router / Executor", "Checkpoint / Replay", "HITL 人工确认节点"], ...colors.runtime);
  b += rect(740, 315, 300, 142, "任务与缓存", ["Redis 7.x", "Celery/RQ Worker", "schema hash cache", "query embedding cache"], ...colors.runtime);
  b += rect(1080, 315, 280, 142, "策略与治理", ["Policy Guard", "PII 脱敏 Presidio", "Prompt 注入防护", "Tool 权限控制"], ...colors.runtime);
  b += rect(40, 495, 310, 150, "Tool Registry", ["tool manifest", "Pydantic 入参", "超时/重试/熔断", "工具级审计"], ...colors.tools);
  b += rect(390, 495, 310, 150, "MCP Server 层", ["database-mcp", "file-mcp", "knowledge-mcp", "metrics-mcp"], ...colors.tools);
  b += rect(740, 495, 300, 150, "Skill Library", ["excel_row_chunking", "field_alias_learning", "metric_feasibility_check", "rag_quality_check"], ...colors.tools);
  b += rect(1080, 495, 280, 150, "Prompt/Schema Registry", ["Prompt version", "JSON Schema", "Agent template yaml", "评测样本绑定"], ...colors.tools);
  b += rect(40, 685, 310, 148, "知识构建服务", ["openpyxl/pandas", "python-docx/python-pptx", "PyMuPDF/unstructured/OCR", "chunk policy"], ...colors.knowledge);
  b += rect(390, 685, 310, 148, "RAG 检索服务", ["pgvector semantic search", "PostgreSQL exact query", "BM25/pg_trgm", "bge-reranker"], ...colors.knowledge);
  b += rect(740, 685, 300, 148, "模型网关", ["LLM Router", "llama.cpp CPU", "API 模型", "vLLM GPU"], ...colors.model);
  b += rect(1080, 685, 280, 148, "模型服务", ["Qwen 7B/14B/32B", "bge-m3 embedding", "bge-reranker-v2-m3", "guided JSON"], ...colors.model);
  b += rect(40, 870, 310, 150, "PostgreSQL 16/17", ["pgvector 0.8.x", "JSONB GIN / B-tree", "rag_chunks / excel_rows", "metric_artifacts"], ...colors.data);
  b += rect(390, 870, 310, 150, "对象/文件存储", ["本地目录 / MinIO 可选", "原始文件", "模型权重", "离线安装包"], ...colors.data);
  b += rect(740, 870, 300, 150, "可观测", ["OpenTelemetry", "Prometheus / Grafana", "Phoenix LLM Trace", "Loki 日志可选"], ...colors.observe);
  b += rect(1080, 870, 280, 150, "评测与发布", ["golden dataset", "回归评测", "Agent 版本", "灰度/回滚"], ...colors.observe);
  [185, 289, 457, 645, 833].forEach((y, i) => b += arr(700, y, 700, y + 28));
  b += arr(350, 575, 390, 575) + arr(700, 575, 740, 575) + arr(1040, 575, 1080, 575);
  b += arr(700, 760, 740, 760) + arr(1040, 760, 1080, 760);
  return svgHeader("公共智能体平台技术架构图（组件级）", "突出真实技术组件：API、Runtime、Tool/MCP/Skill、知识服务、模型网关、存储、观测、安全与离线部署。", b, 1400, 1060);
}

function diagramRuntime() {
  let b = "";
  const nodes = [
    [60, 140, "TaskContext Builder", ["file/json/prompt", "security_context", "agent_type"]],
    [315, 140, "AgentTemplateRouter", ["metric_system_builder", "rag_field_filler", "future agents"]],
    [570, 140, "LangGraph Runtime", ["state graph", "checkpoint", "parallel map/reduce"]],
    [825, 140, "Tool Executor", ["tool schema validate", "timeout/retry", "audit event"]],
    [1080, 140, "Model Gateway", ["route small/main model", "embedding/rerank", "structured output"]],
    [825, 420, "Validator", ["Pydantic", "JSON Schema", "citation check"]],
    [570, 420, "HITL Gateway", ["manual review", "approve/reject", "feedback patch"]],
    [315, 420, "Result Builder", ["metric JSON", "field filling", "answer citation"]],
    [60, 420, "Audit Replay", ["trace log", "tool calls", "eval sample"]],
  ];
  const centers = {};
  for (const [x, y, title, lines] of nodes) {
    b += rect(x, y, 205, 112, title, lines, "#F8FAFC", "#334155");
    centers[title] = [x + 102, y + 56];
  }
  const seq = ["TaskContext Builder", "AgentTemplateRouter", "LangGraph Runtime", "Tool Executor", "Model Gateway", "Validator", "HITL Gateway", "Result Builder", "Audit Replay"];
  for (let i = 0; i < seq.length - 1; i++) b += arr(...centers[seq[i]], ...centers[seq[i + 1]]);
  b += arr(930, 420, 930, 252, "#DC2626");
  b += `<text x="945" y="345" class="s" fill="#dc2626">校验失败回退重试</text>`;
  b += rect(60, 640, 1225, 115, "统一状态对象 TaskContext", ["run_id · agent_type · input_payload · security_context · plan · tool_calls · retrieval_context · model_outputs · validation_errors · human_feedback · final_result"], "#ECFDF5", "#059669");
  return svgHeader("Agent Runtime 内部技术流程", "业务 Agent 通过模板注册，运行时用同一套状态机、工具执行、模型网关、校验、人工确认和审计回放。", b, 1400, 820);
}

function diagramIngestQuery() {
  let b = "";
  b += `<rect x="45" y="115" width="1300" height="300" rx="18" fill="#F0FDF4" stroke="#16A34A" stroke-width="3"/>`;
  b += `<text x="70" y="150" class="h" fill="#166534">离线知识构建链路</text>`;
  const ingest = [
    ["File Gateway", ["Excel/CSV", "Word/PPT/PDF/TXT"]],
    ["Parser Router", ["openpyxl/pandas", "PyMuPDF/docx/pptx"]],
    ["Chunk Policy", ["Excel row chunk", "semantic paragraph"]],
    ["Embedding Worker", ["bge-m3", "batch retry"]],
    ["Index Writer", ["rag_chunks", "excel_rows", "field_dict"]],
  ];
  ingest.forEach((n, i) => { const x = 80 + i * 250; b += rect(x, 190, 205, 135, n[0], n[1], "#FFFFFF", "#22C55E"); if (i < 4) b += arr(x + 205, 255, x + 250, 255, "#16A34A"); });
  b += `<rect x="45" y="470" width="1300" height="300" rx="18" fill="#EEF2FF" stroke="#4F46E5" stroke-width="3"/>`;
  b += `<text x="70" y="505" class="h" fill="#3730A3">在线查询 / 指标构建链路</text>`;
  const query = [
    ["Request API", ["query/json/file", "auth context"]],
    ["Intent Router", ["metric build", "field filling", "qa"]],
    ["Retrieval Router", ["exact query", "vector search", "schema lookup"]],
    ["Agent Reasoning", ["tool calls", "model routing"]],
    ["Structured Output", ["JSON schema", "citation/audit"]],
  ];
  query.forEach((n, i) => { const x = 80 + i * 250; b += rect(x, 545, 205, 135, n[0], n[1], "#FFFFFF", "#6366F1"); if (i < 4) b += arr(x + 205, 610, x + 250, 610, "#4F46E5"); });
  b += arr(1130, 325, 1130, 545, "#64748B");
  return svgHeader("离线构建与在线运行双链路技术流程", "公共底座同时支撑文档知识构建、字段填充查询与指标体系构建。", b, 1400, 830);
}

function diagramDeployment() {
  let b = `<rect x="50" y="110" width="1300" height="660" rx="18" fill="#F8FAFC" stroke="#334155" stroke-width="2"/>`;
  const comps = [
    [90, 160, "Nginx/APISIX", ["80/443", "TLS/限流/鉴权"], "#DBEAFE", "#2563EB"],
    [390, 160, "agent-api", ["FastAPI", "Agent Template Router"], "#DCFCE7", "#16A34A"],
    [690, 160, "agent-worker", ["LangGraph", "Celery/RQ"], "#DCFCE7", "#16A34A"],
    [990, 160, "model-gateway", ["llama.cpp/API/vLLM", "OpenAI compatible"], "#FFE4E6", "#E11D48"],
    [90, 405, "knowledge-worker", ["parser/chunk", "embedding batch"], "#FEF3C7", "#D97706"],
    [390, 405, "PostgreSQL", ["pgvector/JSONB", "audit/metrics/rag"], "#F3E8FF", "#7C3AED"],
    [690, 405, "Redis", ["cache/queue", "rate counter"], "#FFEDD5", "#EA580C"],
    [990, 405, "observability", ["Prometheus/Grafana", "Phoenix/Loki"], "#E0F2FE", "#0284C7"],
  ];
  for (const c of comps) b += rect(c[0], c[1], 240, 135, c[2], c[3], c[4], c[5]);
  [[330,225,390,225],[630,225,690,225],[930,225,990,225],[810,295,810,405],[510,295,510,405],[210,295,210,405]].forEach(a => b += arr(...a));
  b += `<text x="90" y="710" class="t">CPU 验证：16C/64G/500G 跑通功能；GPU 生产：确认模型后将 model-gateway 切换到 vLLM + L20/A100。</text>`;
  b += `<text x="90" y="740" class="t">离线包：Docker tar、wheelhouse、模型权重、初始化 SQL、Agent 模板包、Tool/MCP manifest、评测样本、验收脚本。</text>`;
  return svgHeader("单机虚机到 GPU 生产的部署拓扑", "组件容器化部署，模型网关屏蔽 CPU/API/GPU 差异，上层 Agent 无需改造。", b, 1400, 820);
}

function imageRel(id, name, width = 6500000, height = 4920000) {
  return `<w:p><w:pPr><w:jc w:val="center"/></w:pPr><w:r><w:drawing><wp:inline distT="0" distB="0" distL="0" distR="0" xmlns:wp="http://schemas.openxmlformats.org/drawingml/2006/wordprocessingDrawing"><wp:extent cx="${width}" cy="${height}"/><wp:docPr id="${id}" name="${name}"/><a:graphic xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main"><a:graphicData uri="http://schemas.openxmlformats.org/drawingml/2006/picture"><pic:pic xmlns:pic="http://schemas.openxmlformats.org/drawingml/2006/picture"><pic:nvPicPr><pic:cNvPr id="${id}" name="${name}"/><pic:cNvPicPr/></pic:nvPicPr><pic:blipFill><a:blip r:embed="rId${id}" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"/><a:stretch><a:fillRect/></a:stretch></pic:blipFill><pic:spPr><a:xfrm><a:off x="0" y="0"/><a:ext cx="${width}" cy="${height}"/></a:xfrm><a:prstGeom prst="rect"><a:avLst/></a:prstGeom></pic:spPr></pic:pic></a:graphicData></a:graphic></wp:inline></w:drawing></w:r></w:p>`;
}

function caption(text) {
  return `<w:p><w:pPr><w:jc w:val="center"/></w:pPr><w:r><w:rPr><w:color w:val="64748B"/><w:sz w:val="18"/></w:rPr><w:t>${esc(text)}</w:t></w:r></w:p>`;
}

function styles() {
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><w:styles xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:style w:type="paragraph" w:default="1" w:styleId="Normal"><w:name w:val="Normal"/><w:rPr><w:rFonts w:ascii="Arial Unicode MS" w:eastAsia="Arial Unicode MS"/><w:sz w:val="21"/></w:rPr></w:style><w:style w:type="paragraph" w:styleId="Heading1"><w:name w:val="heading 1"/><w:basedOn w:val="Normal"/><w:rPr><w:b/><w:sz w:val="36"/><w:color w:val="0F172A"/></w:rPr></w:style><w:style w:type="paragraph" w:styleId="Heading2"><w:name w:val="heading 2"/><w:basedOn w:val="Normal"/><w:rPr><w:b/><w:sz w:val="28"/><w:color w:val="1F2937"/></w:rPr></w:style><w:style w:type="paragraph" w:styleId="Title"><w:name w:val="Title"/><w:rPr><w:b/><w:sz w:val="44"/></w:rPr></w:style><w:style w:type="paragraph" w:styleId="ListParagraph"><w:name w:val="List Paragraph"/><w:basedOn w:val="Normal"/></w:style></w:styles>`;
}

function documentXml(body) {
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><w:body>${body}<w:sectPr><w:pgSz w:w="11906" w:h="16838"/><w:pgMar w:top="864" w:right="720" w:bottom="864" w:left="720" w:header="720" w:footer="720" w:gutter="0"/></w:sectPr></w:body></w:document>`;
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

const svgs = [diagramOverallTech(), diagramRuntime(), diagramIngestQuery(), diagramDeployment()];

const body = [
  `<w:p><w:pPr><w:pStyle w:val="Title"/><w:jc w:val="center"/></w:pPr><w:r><w:t>公共底层智能体框架 · 完整技术架构设计文档</w:t></w:r></w:p>`,
  p("面向指标体系构建 Agent 与离线 RAG/字段填充 Agent 的组件级技术架构设计"),
  h("1. 文档定位与修正说明"),
  bullet("本文档是技术架构设计，不是业务流程说明。重点描述系统由哪些技术组件组成、组件之间如何交互、如何部署、如何扩展、如何治理。"),
  bullet("业务上同时满足两个需求：指标体系构建 Agent 与离线 RAG/字段填充 Agent。技术上抽象为统一的公共智能体平台。"),
  bullet("公共底座包括 Agent Runtime、Tool/MCP/Skill、Knowledge Service、Model Gateway、PostgreSQL/pgvector、Redis/Queue、审计脱敏、可观测和离线部署能力。"),
  h("2. 设计目标与边界"),
  table(["目标", "说明"], [
    ["统一底座", "用同一套 Agent Runtime 支撑多个业务 Agent，避免烟囱化建设。"],
    ["组件清晰", "每一层都明确技术组件、职责、输入输出和依赖关系。"],
    ["离线可部署", "内网无外网环境下，通过 Docker tar、wheelhouse、模型权重和 SQL 脚本交付。"],
    ["模型可切换", "前期 CPU 验证功能；API 验证模型效果；最终按压测结果采购 GPU 并切换 vLLM。"],
    ["可审计可回放", "所有 Agent Run、Tool Call、Retrieval、Model Call、Human Feedback 都落审计与 Trace。"],
  ]),
  h("3. 组件级总体技术架构"),
  imageRel(1, "overall-tech", 6500000, 4920000), caption("图 1：公共智能体平台技术架构图（组件级）"),
  p("总体架构从上到下分为应用接入、网关安全、Agent API、Agent Runtime、任务缓存、策略治理、Tool/MCP/Skill、知识服务、模型网关、模型服务、存储、可观测与评测发布层。图中所有组件均是可落地部署的工程组件。"),
  h("4. 核心组件清单与职责"),
  table(["组件", "建议技术", "核心职责", "被哪些 Agent 复用"], [
    ["Gateway", "Nginx 或 APISIX", "TLS、鉴权前置、限流、灰度、请求大小控制、request_id 注入", "全部 Agent"],
    ["Agent API", "FastAPI + Uvicorn", "对外 REST/SSE/异步任务 API，输入校验，AgentTemplateRouter", "全部 Agent"],
    ["Agent Runtime", "LangGraph 1.x", "状态机编排、并行 Map/Reduce、Checkpoint、Replay、HITL", "全部 Agent"],
    ["Task Queue", "Redis + Celery/RQ", "离线解析、embedding、长任务、失败重试、任务状态推进", "全部 Agent"],
    ["Policy Guard", "自研策略模块 + Presidio", "鉴权、数据域过滤、脱敏、Prompt 注入防护、Tool 权限控制", "全部 Agent"],
    ["Tool Registry", "Manifest + Pydantic Schema", "注册工具、参数校验、超时重试、审计、熔断", "全部 Agent"],
    ["MCP Server", "database/file/knowledge/metrics MCP", "将数据库、文件、知识库、指标服务封装为标准工具接口", "全部 Agent"],
    ["Skill Library", "Python 规则包", "Excel 行级分片、字段别名学习、指标可行性检查、RAG 质量检查", "全部 Agent"],
    ["Knowledge Service", "Parser + Chunker + RAG Service", "文件解析、分片、embedding、检索、字段字典、Schema Registry", "两个核心 Agent"],
    ["Model Gateway", "LLM Router", "统一 CPU/API/GPU 模式，路由小模型、主模型、Embedding、Rerank", "全部 Agent"],
    ["PostgreSQL", "PostgreSQL 16/17 + pgvector 0.8.x", "rag_chunks、excel_rows、metric_artifacts、agent_runs、audit_logs", "全部 Agent"],
    ["Observability", "OpenTelemetry + Prometheus + Grafana + Phoenix", "链路 Trace、指标、日志、LLM 调用观测、评测对比", "全部 Agent"],
  ]),
  h("5. Agent Runtime 内部设计"),
  imageRel(2, "runtime", 6500000, 3800000), caption("图 2：Agent Runtime 内部技术流程"),
  table(["阶段", "输入", "处理逻辑", "输出"], [
    ["TaskContext Builder", "文件、JSON、Prompt、API 参数", "统一生成 task_id、agent_type、security_context、input_payload", "TaskContext"],
    ["AgentTemplateRouter", "TaskContext.agent_type", "加载 metric_system_builder 或 rag_field_filler 模板", "GraphConfig"],
    ["LangGraph Runtime", "GraphConfig + TaskContext", "执行状态机、并行子任务、Checkpoint、失败恢复", "中间状态"],
    ["Tool Executor", "tool_name + args", "校验参数、执行工具、记录 tool_call、超时重试", "ToolResult"],
    ["Model Gateway", "prompt/messages/schema", "路由 CPU/API/GPU 模型，执行结构化输出", "ModelOutput"],
    ["Validator", "ToolResult/ModelOutput", "Pydantic/JSON Schema/引用/权限/事实一致性校验", "ValidatedResult"],
    ["HITL", "低置信度或需确认结果", "人工确认、修正、驳回、继续", "HumanFeedback"],
    ["Audit Replay", "全链路事件", "落库、Trace、评测样本生成", "可回放记录"],
  ]),
  h("6. 两个业务 Agent 的技术实现映射"),
  table(["技术能力", "指标体系构建 Agent", "离线 RAG/字段填充 Agent"], [
    ["输入适配", "table_json、大 JSON、Excel/Word、业务 Prompt", "Excel/CSV、Word、PPT、PDF、TXT/Markdown/HTML"],
    ["大输入处理", "Schema Slimmer、表分批、业务域 Map-Reduce", "Excel 行级 chunk、非 Excel 语义分片、metadata/row_json"],
    ["核心工具", "schema_lookup、metric_rag_search、domain_classifier、metric_generator、feasibility_check", "exact_row_query、vector_search、field_alias_map、row_json_fetch、answer_builder"],
    ["模型策略", "小模型做分类/路由，主模型做指标推导，JSON Schema 约束输出", "字段填充优先不用 LLM；问答用小/中模型生成；embedding/rerank 支撑检索"],
    ["结果校验", "指标 JSON 完整性、口径一致性、维度/度量关系、SQL 建议可执行性", "字段填充准确率、row_id 命中、引用正确性、权限过滤"],
    ["人工确认", "指标口径、可行性、发布版本确认", "低置信度字段填充、字段别名纠错、错误样本确认"],
  ]),
  h("7. 离线构建与在线运行双链路"),
  imageRel(3, "ingest-query", 6500000, 3850000), caption("图 3：离线构建与在线运行双链路技术流程"),
  h("8. 数据存储设计"),
  table(["表/集合", "关键字段", "说明"], [
    ["agent_templates", "agent_type, version, graph_config, input_schema, output_schema, enabled", "业务 Agent 模板注册。"],
    ["agent_runs", "run_id, agent_type, user_id, status, task_context, final_result, created_at", "一次 Agent 运行主记录。"],
    ["tool_calls", "run_id, node_id, tool_name, args_hash, result_ref, latency_ms, status", "工具调用审计与回放。"],
    ["model_calls", "run_id, model_name, prompt_hash, token_in, token_out, latency_ms, cost", "模型调用审计和成本分析。"],
    ["knowledge_collections", "collection_id, domain, source_type, acl_policy, parser_policy", "知识域管理。"],
    ["rag_chunks", "chunk_id, collection_id, chunk_text, embedding, metadata, source_ref", "语义检索主表。"],
    ["excel_rows", "row_id, source_id, sheet_name, row_no, row_json, indexed_fields", "Excel 字段填充主表。"],
    ["field_dictionary", "field_name, aliases, data_type, examples, source_scope", "字段别名与语义字典。"],
    ["metric_artifacts", "artifact_id, run_id, domain, metric_json, review_status, version", "指标体系构建结果。"],
    ["audit_logs", "request_id, user_id, action, masked_payload, hit_refs, result_summary", "合规审计。"],
    ["evaluation_cases", "case_id, agent_type, input, expected, scoring_rule, tags", "回归评测数据。"],
  ]),
  h("9. Tool / MCP / Skill 设计规范"),
  bullet("Tool 必须有名称、版本、入参 Schema、出参 Schema、权限等级、超时时间、重试策略、审计等级。"),
  bullet("MCP Server 用于封装可跨 Agent 复用的外部能力，例如 database-mcp、file-mcp、knowledge-mcp、metrics-mcp。"),
  bullet("Skill 用于沉淀稳定专家流程，例如 excel_row_chunking、field_alias_learning、metric_feasibility_check、rag_quality_check。"),
  bullet("Agent Template 只组合 Tool/MCP/Skill，不内嵌确定性实现，保证扩展时不复制底层逻辑。"),
  code(`tool_manifest 示例：
name: exact_row_query
version: 1.0.0
input_schema: { collection_id, field_name, field_value, target_fields }
output_schema: { row_id, row_json, confidence, source_ref }
permission: data.read
audit_level: high
timeout_ms: 3000`),
  h("10. 模型网关设计"),
  table(["模式", "组件", "用途", "切换策略"], [
    ["CPU 验证", "llama.cpp / llama-cpp-python", "前期验证 Agent、Tool、RAG、Schema 闭环", "LLM_ROUTER_MODE=cpu"],
    ["API 选型", "百炼/方舟/内部模型 API", "比较不同模型在指标推导和问答上的效果", "LLM_ROUTER_MODE=api"],
    ["GPU 生产", "vLLM OpenAI Compatible Server", "生产吞吐、并发、成本控制", "LLM_ROUTER_MODE=vllm"],
    ["Embedding", "bge-m3", "文档向量化与 query embedding", "独立 embedding endpoint"],
    ["Rerank", "bge-reranker-v2-m3", "召回结果重排", "独立 rerank endpoint"],
  ]),
  h("11. 部署架构"),
  imageRel(4, "deployment", 6500000, 3800000), caption("图 4：单机虚机到 GPU 生产的部署拓扑"),
  h("12. 非功能设计"),
  table(["维度", "设计"], [
    ["性能", "字段填充优先走 PostgreSQL 精确查询；LLM 只用于推理/解释；embedding 批处理异步化；Redis 缓存 schema、query embedding、字段别名。"],
    ["稳定性", "任务队列重试、Graph Checkpoint、工具超时熔断、失败节点可恢复、批次导入可回滚。"],
    ["安全", "鉴权、数据域过滤、Presidio 脱敏、Prompt 注入防护、Tool 权限控制、SQL 参数化。"],
    ["可观测", "OpenTelemetry 串联 request_id/run_id/tool_call_id/model_call_id；Prometheus 指标；Phoenix 观测 LLM Trace。"],
    ["扩展性", "新增 Agent 只注册模板、工具、Schema、Prompt、评测集和权限策略；公共底座不改。"],
    ["离线部署", "Docker 镜像 tar、Python wheelhouse、模型权重、初始化 SQL、验收脚本全部离线交付。"],
  ]),
  h("13. 实施阶段建议"),
  table(["阶段", "目标", "范围"], [
    ["P0：公共底座骨架", "跑通 Agent API、Runtime、Tool Registry、PostgreSQL、Redis、审计", "不追求模型效果，CPU 模型或 mock 模型均可。"],
    ["P1：离线 RAG/字段填充 Agent", "完成文件解析、Excel 行级 chunk、字段精确查询、语义召回", "验证 pgvector 和字段填充准确率。"],
    ["P2：指标体系构建 Agent", "完成 Schema 瘦身、业务域分类、指标推导、人工确认", "解决大 JSON 瓶颈与结构化输出。"],
    ["P3：模型选型与 GPU 压测", "比较 7B/14B/32B/API 模型效果和成本", "确定 GPU 型号和 vLLM 参数。"],
    ["P4：治理与规模化", "完善评测、灰度、回滚、SLA、监控看板", "进入生产试点。"],
  ]),
].join("");

const out = makeDocx("公共底层智能体框架_完整技术架构设计文档.docx", body, svgs);
console.log(out);
