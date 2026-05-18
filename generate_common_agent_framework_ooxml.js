const fs = require("fs");
const path = require("path");
const { execFileSync } = require("child_process");

const OUT = path.resolve("交付物");
const BUILD = path.resolve(".build_common_agent_ooxml");
fs.mkdirSync(OUT, { recursive: true });

function esc(s) {
  return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function para(text, style = "") {
  const st = style ? `<w:pStyle w:val="${style}"/>` : "";
  return `<w:p><w:pPr>${st}</w:pPr><w:r><w:t xml:space="preserve">${esc(text)}</w:t></w:r></w:p>`;
}

function heading(text, level = 1) {
  return para(text, `Heading${level}`);
}

function bullet(text) {
  return `<w:p><w:pPr><w:pStyle w:val="ListParagraph"/><w:ind w:left="420"/></w:pPr><w:r><w:t xml:space="preserve">• ${esc(text)}</w:t></w:r></w:p>`;
}

function table(headers, rows) {
  const rowXml = (cells, header = false) => `<w:tr>${cells.map(c => `<w:tc><w:tcPr><w:tcW w:w="2400" w:type="dxa"/>${header ? '<w:shd w:fill="E2E8F0"/>' : ""}</w:tcPr><w:p><w:r>${header ? "<w:rPr><w:b/></w:rPr>" : ""}<w:t xml:space="preserve">${esc(c)}</w:t></w:r></w:p></w:tc>`).join("")}</w:tr>`;
  return `<w:tbl><w:tblPr><w:tblW w:w="0" w:type="auto"/><w:tblBorders><w:top w:val="single" w:sz="6" w:color="CBD5E1"/><w:left w:val="single" w:sz="6" w:color="CBD5E1"/><w:bottom w:val="single" w:sz="6" w:color="CBD5E1"/><w:right w:val="single" w:sz="6" w:color="CBD5E1"/><w:insideH w:val="single" w:sz="6" w:color="CBD5E1"/><w:insideV w:val="single" w:sz="6" w:color="CBD5E1"/></w:tblBorders></w:tblPr>${rowXml(headers, true)}${rows.map(r => rowXml(r)).join("")}</w:tbl>`;
}

function svgBox(x, y, w, h, title, lines, fill, stroke) {
  const t = [`<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="14" fill="${fill}" stroke="${stroke}" stroke-width="2"/>`,
    `<text x="${x + 14}" y="${y + 28}" font-size="18" font-weight="700" fill="#111827">${esc(title)}</text>`];
  (lines || []).forEach((line, i) => t.push(`<text x="${x + 14}" y="${y + 56 + i * 22}" font-size="14" fill="#334155">${esc(line)}</text>`));
  return t.join("");
}

function svgArrow(x1, y1, x2, y2, color = "#64748B") {
  return `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${color}" stroke-width="3" marker-end="url(#arrow)"/>`;
}

function svgWrap(title, subtitle, body, w = 1200, h = 760) {
  return `<?xml version="1.0" encoding="UTF-8"?><svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">
  <defs><marker id="arrow" markerWidth="10" markerHeight="10" refX="8" refY="3" orient="auto" markerUnits="strokeWidth"><path d="M0,0 L0,6 L9,3 z" fill="#64748B"/></marker></defs>
  <rect width="100%" height="100%" fill="#ffffff"/>
  <text x="36" y="44" font-size="28" font-weight="800" fill="#0F172A">${esc(title)}</text>
  <text x="36" y="78" font-size="15" fill="#475569">${esc(subtitle)}</text>
  ${body}
  </svg>`;
}

function diagramFramework() {
  const layers = [
    ["业务 Agent 应用层", ["指标体系构建 Agent", "离线 RAG/字段填充 Agent", "后续扩展 Agent"], "#DBEAFE", "#2563EB"],
    ["Agent Runtime 层", ["LangGraph 状态机", "Planner/Router/Executor", "HITL/Checkpoint/Replay"], "#DCFCE7", "#16A34A"],
    ["能力插件层", ["Tool Registry", "MCP Server", "Skill Library", "Prompt/Schema Registry"], "#FEF3C7", "#D97706"],
    ["知识与数据服务层", ["文档解析 Pipeline", "Schema/字段字典", "混合检索", "业务数据查询"], "#F3E8FF", "#7C3AED"],
    ["模型网关层", ["LLM Router", "Embedding/Rerank", "CPU/API/GPU", "JSON Schema 输出"], "#FFE4E6", "#E11D48"],
    ["基础设施与治理层", ["PostgreSQL+pgvector", "Redis/Queue", "审计脱敏", "可观测/评测/离线包"], "#E0F2FE", "#0284C7"],
  ];
  let y = 120, body = "";
  layers.forEach((l, i) => {
    body += svgBox(60, y, 1080, 78, l[0], [l[1].join("  ·  ")], l[2], l[3]);
    if (i < layers.length - 1) body += svgArrow(600, y + 78, 600, y + 105, l[3]);
    y += 105;
  });
  return svgWrap("公共底层智能体框架总体架构", "同一套 Agent OS 承载两个业务需求，业务 Agent 薄、公共底座厚。", body);
}

function diagramMapping() {
  let body = "";
  body += `<rect x="55" y="115" width="520" height="520" rx="18" fill="#EFF6FF" stroke="#2563EB" stroke-width="3"/>`;
  body += `<text x="85" y="155" font-size="24" font-weight="800" fill="#1D4ED8">A. 指标体系构建 Agent</text>`;
  const a = [["输入", "表结构JSON/Excel/Word/Prompt"], ["Schema瘦身", "不拼大JSON，分批Map"], ["业务域分类", "小模型+字段字典+RAG"], ["指标推导", "按业务域并行生成"], ["复评确认", "可行性复评+人工确认"], ["输出", "指标体系JSON/口径/SQL建议"]];
  a.forEach((s, i) => { body += svgBox(95, 185 + i*70, 430, 50, s[0], [s[1]], "#FFFFFF", "#60A5FA"); if(i<5) body += svgArrow(310, 235+i*70, 310, 255+i*70, "#2563EB"); });
  body += `<rect x="625" y="115" width="520" height="520" rx="18" fill="#F0FDF4" stroke="#16A34A" stroke-width="3"/>`;
  body += `<text x="655" y="155" font-size="24" font-weight="800" fill="#15803D">B. 离线 RAG / 字段填充 Agent</text>`;
  const b = [["输入", "Excel/Word/PPT/PDF/TXT"], ["文件解析", "按类型路由解析器"], ["知识写入", "行级chunk+row_json+pgvector"], ["查询理解", "字段名/字段值/别名"], ["检索路由", "精确查询优先，向量补充"], ["输出", "字段填充/问答/引用审计"]];
  b.forEach((s, i) => { body += svgBox(665, 185 + i*70, 430, 50, s[0], [s[1]], "#FFFFFF", "#4ADE80"); if(i<5) body += svgArrow(880, 235+i*70, 880, 255+i*70, "#16A34A"); });
  body += `<rect x="210" y="675" width="780" height="55" rx="15" fill="#FEF3C7" stroke="#D97706" stroke-width="2"/><text x="245" y="710" font-size="20" font-weight="800" fill="#92400E">公共复用底座：Runtime / Tool / MCP / Skill / RAG / Model Gateway / Audit / Evaluation</text>`;
  body += svgArrow(310, 635, 480, 675, "#D97706") + svgArrow(880, 635, 720, 675, "#D97706");
  return svgWrap("两个需求在公共框架上的落地关系", "差异在业务模板和工具组合，共用底层智能体能力。", body);
}

function diagramRuntime() {
  const nodes = [
    ["Input Adapter", "文件/JSON/Prompt→TaskContext", 60, 145, "#DBEAFE", "#2563EB"],
    ["Policy Guard", "鉴权/脱敏/数据域", 300, 145, "#FFE4E6", "#E11D48"],
    ["Planner", "选择模板/拆解计划", 540, 145, "#DCFCE7", "#16A34A"],
    ["Tool Executor", "RAG/DB/MCP/Skill", 780, 145, "#FEF3C7", "#D97706"],
    ["Model Gateway", "小模型/主模型/Embedding", 1020, 145, "#F3E8FF", "#7C3AED"],
    ["Validator", "Schema/引用/权限校验", 780, 400, "#E0F2FE", "#0284C7"],
    ["HITL", "人工确认/修正", 540, 400, "#FEF3C7", "#D97706"],
    ["Answer Builder", "JSON/答案/引用", 300, 400, "#DCFCE7", "#16A34A"],
    ["Audit & Replay", "Trace/评测/回放", 60, 400, "#F8FAFC", "#334155"],
  ];
  let body = "";
  const centers = {};
  nodes.forEach(n => { body += svgBox(n[2], n[3], 180, 95, n[0], [n[1]], n[4], n[5], 13); centers[n[0]] = [n[2]+90,n[3]+48]; });
  const seq = ["Input Adapter","Policy Guard","Planner","Tool Executor","Model Gateway","Validator","HITL","Answer Builder","Audit & Replay"];
  for (let i=0;i<seq.length-1;i++) body += svgArrow(...centers[seq[i]], ...centers[seq[i+1]]);
  body += `<rect x="80" y="610" width="1040" height="70" rx="16" fill="#F8FAFC" stroke="#CBD5E1"/><text x="105" y="650" font-size="18" font-weight="800">统一状态对象 TaskContext：task_id、agent_type、security_context、plan、tool_calls、retrieval_context、model_outputs、validation_errors、human_feedback、final_result</text>`;
  return svgWrap("公共 Agent Runtime 状态机", "所有业务 Agent 都按统一生命周期运行，可审计、可回放、可扩展。", body, 1200, 720);
}

function diagramDeployment() {
  const comps = [
    ["Gateway", "Nginx/APISIX\n鉴权/限流/灰度", 70, 150, "#DBEAFE", "#2563EB"],
    ["Agent API", "FastAPI\nAgent Template Router", 350, 150, "#DCFCE7", "#16A34A"],
    ["Agent Worker", "LangGraph Runtime\n任务队列/断点恢复", 630, 150, "#DCFCE7", "#16A34A"],
    ["Model Gateway", "CPU/API/GPU\n统一接口", 910, 150, "#F3E8FF", "#7C3AED"],
    ["Knowledge Service", "文档解析/分片\nRAG/字段字典", 70, 390, "#FEF3C7", "#D97706"],
    ["PostgreSQL 16", "pgvector/audit\nexcel_rows/metrics", 350, 390, "#FFE4E6", "#E11D48"],
    ["Redis / Queue", "缓存/队列\n限流计数", 630, 390, "#FFEDD5", "#EA580C"],
    ["Observability", "Prometheus/Grafana\nPhoenix/Loki", 910, 390, "#E0F2FE", "#0284C7"],
  ];
  let body = `<rect x="40" y="110" width="1120" height="570" rx="20" fill="#F8FAFC" stroke="#334155" stroke-width="2"/>`;
  comps.forEach(c => body += svgBox(c[2], c[3], 220, 110, c[0], c[1].split("\n"), c[4], c[5]));
  [[290,205,350,205],[570,205,630,205],[850,205,910,205],[460,260,460,390],[740,260,740,390]].forEach(a => body += svgArrow(a[0],a[1],a[2],a[3]));
  body += `<text x="75" y="725" font-size="16" fill="#334155">离线包：Docker 镜像 tar、wheelhouse、模型权重、初始化 SQL、Agent 模板包、Tool/MCP manifest、评测样本、验收脚本。</text>`;
  return svgWrap("公共智能体平台离线部署架构", "单机虚机起步，CPU 验证功能；确认模型后切换 GPU 推理。", body, 1200, 760);
}

function imageRel(id, name, width = 6120000, height = 3870000) {
  return `<w:p><w:pPr><w:jc w:val="center"/></w:pPr><w:r><w:drawing><wp:inline distT="0" distB="0" distL="0" distR="0" xmlns:wp="http://schemas.openxmlformats.org/drawingml/2006/wordprocessingDrawing"><wp:extent cx="${width}" cy="${height}"/><wp:docPr id="${id}" name="${name}"/><a:graphic xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main"><a:graphicData uri="http://schemas.openxmlformats.org/drawingml/2006/picture"><pic:pic xmlns:pic="http://schemas.openxmlformats.org/drawingml/2006/picture"><pic:nvPicPr><pic:cNvPr id="${id}" name="${name}"/><pic:cNvPicPr/></pic:nvPicPr><pic:blipFill><a:blip r:embed="rId${id}" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"/><a:stretch><a:fillRect/></a:stretch></pic:blipFill><pic:spPr><a:xfrm><a:off x="0" y="0"/><a:ext cx="${width}" cy="${height}"/></a:xfrm><a:prstGeom prst="rect"><a:avLst/></a:prstGeom></pic:spPr></pic:pic></a:graphicData></a:graphic></wp:inline></w:drawing></w:r></w:p>`;
}

function caption(text) {
  return `<w:p><w:pPr><w:jc w:val="center"/></w:pPr><w:r><w:rPr><w:color w:val="64748B"/><w:sz w:val="18"/></w:rPr><w:t>${esc(text)}</w:t></w:r></w:p>`;
}

function stylesXml() {
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><w:styles xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:style w:type="paragraph" w:default="1" w:styleId="Normal"><w:name w:val="Normal"/><w:rPr><w:rFonts w:ascii="Arial Unicode MS" w:eastAsia="Arial Unicode MS"/><w:sz w:val="21"/></w:rPr></w:style><w:style w:type="paragraph" w:styleId="Heading1"><w:name w:val="heading 1"/><w:basedOn w:val="Normal"/><w:rPr><w:b/><w:sz w:val="36"/><w:color w:val="0F172A"/></w:rPr></w:style><w:style w:type="paragraph" w:styleId="Heading2"><w:name w:val="heading 2"/><w:basedOn w:val="Normal"/><w:rPr><w:b/><w:sz w:val="28"/><w:color w:val="1F2937"/></w:rPr></w:style><w:style w:type="paragraph" w:styleId="Title"><w:name w:val="Title"/><w:rPr><w:b/><w:sz w:val="44"/></w:rPr></w:style><w:style w:type="paragraph" w:styleId="ListParagraph"><w:name w:val="List Paragraph"/><w:basedOn w:val="Normal"/></w:style></w:styles>`;
}

function documentXml(body) {
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><w:body>${body}<w:sectPr><w:pgSz w:w="11906" w:h="16838"/><w:pgMar w:top="936" w:right="864" w:bottom="936" w:left="864" w:header="720" w:footer="720" w:gutter="0"/></w:sectPr></w:body></w:document>`;
}

function contentTypes() {
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Default Extension="svg" ContentType="image/svg+xml"/><Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/><Override PartName="/word/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.styles+xml"/></Types>`;
}

function makeDocx(filename, body, svgs) {
  const dir = path.join(BUILD, filename.replace(".docx", ""));
  fs.rmSync(dir, { recursive: true, force: true });
  fs.mkdirSync(path.join(dir, "_rels"), { recursive: true });
  fs.mkdirSync(path.join(dir, "word", "_rels"), { recursive: true });
  fs.mkdirSync(path.join(dir, "word", "media"), { recursive: true });
  fs.writeFileSync(path.join(dir, "[Content_Types].xml"), contentTypes());
  fs.writeFileSync(path.join(dir, "_rels", ".rels"), `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/></Relationships>`);
  fs.writeFileSync(path.join(dir, "word", "document.xml"), documentXml(body));
  fs.writeFileSync(path.join(dir, "word", "styles.xml"), stylesXml());
  let rels = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">`;
  svgs.forEach((svg, i) => {
    fs.writeFileSync(path.join(dir, "word", "media", `image${i+1}.svg`), svg);
    rels += `<Relationship Id="rId${i+1}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/image" Target="media/image${i+1}.svg"/>`;
  });
  rels += `</Relationships>`;
  fs.writeFileSync(path.join(dir, "word", "_rels", "document.xml.rels"), rels);
  const out = path.join(OUT, filename);
  try { fs.unlinkSync(out); } catch {}
  execFileSync("zip", ["-qr", out, "."], { cwd: dir });
  return out;
}

const svgs = [diagramFramework(), diagramMapping(), diagramRuntime(), diagramDeployment()];

const archBody = [
  `<w:p><w:pPr><w:pStyle w:val="Title"/><w:jc w:val="center"/></w:pPr><w:r><w:t>公共底层智能体框架 · 架构设计文档</w:t></w:r></w:p>`,
  para("面向指标体系构建 Agent 与离线 RAG/字段填充 Agent 的统一架构"),
  heading("1. 修正后的需求理解"),
  bullet("目标不是只为单一 RAG 场景画架构，而是设计一个公共底层智能体框架，用同一套平台能力承载多个业务 Agent。"),
  bullet("需求一：指标体系构建 Agent。输入表结构 JSON、Excel/Word 文档或业务 prompt，完成 Schema 瘦身、业务域分类、RAG 辅助、指标推导、可行性复评、人工确认和标准指标体系 JSON 输出。"),
  bullet("需求二：离线 RAG/字段填充 Agent。输入 Excel/CSV、Word、PPT、PDF、TXT 等文件，完成离线解析、行级 chunk、pgvector 写入、字段别名映射、精确查询、语义召回、字段填充、问答和审计反馈。"),
  bullet("两个需求的差异是业务流程与工具组合；共同能力是 Agent Runtime、Tool/MCP/Skill、模型路由、知识服务、审计脱敏、可观测、离线部署和评测闭环。"),
  heading("2. 总体架构"),
  imageRel(1, "framework"), caption("图 1：公共底层智能体框架总体架构"),
  heading("3. 两个需求如何落到同一个框架"),
  imageRel(2, "mapping"), caption("图 2：两个业务 Agent 在公共框架上的落地关系"),
  table(["能力域", "指标体系构建 Agent", "离线 RAG/字段填充 Agent", "公共底座复用点"], [
    ["输入适配", "表结构 JSON、Excel、Word、业务 prompt", "Excel/CSV、Word、PPT、PDF、TXT", "Input Adapter + DocumentModel + TaskContext"],
    ["大输入处理", "Schema 瘦身、分批 Map、按业务域 Reduce", "行级 chunk、metadata、row_json", "Chunking Policy + Schema Registry"],
    ["知识使用", "指标口径库、表字段语义库、行业参考库", "文档知识库、字段字典、Excel 行数据", "Knowledge Service + RAG Tool"],
    ["工具调用", "SchemaLookup、MetricRAG、SQLAdvisor、FeasibilityCheck", "ExactRowQuery、VectorSearch、FieldAlias、AnswerBuilder", "Tool Registry / MCP / Skill Library"],
    ["输出约束", "指标体系 JSON、口径、维度、SQL 建议", "字段值、整行记录、问答答案、引用", "Pydantic / JSON Schema / Validator"],
  ]),
  heading("4. 公共 Agent Runtime 设计"),
  imageRel(3, "runtime"), caption("图 3：公共 Agent Runtime 状态机"),
  bullet("Input Adapter：把文件、JSON、Prompt、API 请求统一转换为 TaskContext。"),
  bullet("Policy Guard：做鉴权、数据域过滤、脱敏、Prompt 注入检测、工具权限控制。"),
  bullet("Planner：根据 agent_type 选择业务模板，生成步骤计划、并行度、工具调用策略。"),
  bullet("Tool Executor：执行 RAG 检索、字段查询、Schema 查询、指标推导辅助、审计写入等工具。"),
  bullet("Validator：对模型输出做 JSON Schema/Pydantic 校验、引用校验、权限校验与事实一致性检查。"),
  heading("5. Tool / MCP / Skill 分层"),
  table(["层级", "定位", "示例", "边界"], [
    ["Tool", "单个确定性能力", "pgvector_search、exact_row_query、schema_lookup、metric_rag_search", "只完成一个清晰动作"],
    ["MCP Server", "跨 Agent 复用的外部能力封装", "database-mcp、file-mcp、knowledge-mcp、metrics-mcp", "把数据库/文件/内部服务标准化暴露"],
    ["Skill", "可复用专家流程或规则包", "excel_row_chunking、field_alias_learning、metric_feasibility_check", "沉淀业务规则，减少 Prompt 依赖"],
    ["Agent Template", "业务级流程编排", "metric_system_builder、offline_rag_field_filler", "只组合 Tool/MCP/Skill，不内嵌底层实现"],
  ]),
  heading("6. 部署架构"),
  imageRel(4, "deployment"), caption("图 4：公共智能体平台离线部署架构"),
].join("");

const techBody = [
  `<w:p><w:pPr><w:pStyle w:val="Title"/><w:jc w:val="center"/></w:pPr><w:r><w:t>公共底层智能体框架 · 技术选型方案</w:t></w:r></w:p>`,
  para("支撑指标体系构建与离线 RAG/字段填充两个业务需求的统一组件选型"),
  heading("1. 公共框架定位"),
  imageRel(1, "framework"), caption("图 1：公共底层智能体框架总体架构"),
  para("技术选型围绕公共底座展开：业务 Agent 只定义模板和工具组合，模型、RAG、审计、评测、部署能力统一下沉。"),
  heading("2. 选型总览"),
  table(["层级", "推荐组件", "版本建议", "理由"], [
    ["开发语言", "Python + Java", "Python 3.12.x；Java 17 / Spring Boot 3.3.x", "Python 承载 AI 底座；Java 承载企业接入、权限和管理后台。"],
    ["Agent Runtime", "LangGraph", "1.2.0", "1.x 生产稳定，适合状态机、多步骤、可回放 Agent。"],
    ["LLM 抽象", "LangChain", "1.3.1", "模型/工具/消息抽象成熟，配合 LangGraph 使用。"],
    ["API 服务", "FastAPI + Uvicorn", "FastAPI 0.136.1；Uvicorn 0.34.x+", "异步 API、SSE、Pydantic 生态好。"],
    ["数据校验", "Pydantic", "2.12.x+", "统一定义 TaskContext、Tool 参数、Agent 输出 JSON Schema。"],
    ["数据库", "PostgreSQL + pgvector", "PostgreSQL 16/17；pgvector 0.8.2+", "普通列、JSONB、pg_trgm、全文索引和向量检索一体。"],
    ["任务队列", "Redis + Celery/RQ", "Redis 7.4.x；Celery 5.5.x+", "离线解析、embedding、批量任务、重试与缓存。"],
    ["模型网关", "llama.cpp / API / vLLM", "CPU 验证；API 选型；GPU 生产", "同一接口切换模型部署方式。"],
    ["Embedding/Rerank", "bge-m3 + bge-reranker-v2-m3", "离线固化版本", "中文企业知识检索稳定。"],
    ["审计脱敏", "Presidio + 自定义规则", "2.2.x+", "覆盖手机号、身份证、邮箱、合同号、客户名等。"],
    ["可观测", "OpenTelemetry + Prometheus + Grafana + Phoenix", "OTel 1.30.x+", "指标、日志、Trace、LLM 调用链路和评测闭环。"],
  ]),
  heading("2. 为什么采用公共底座"),
  table(["对比项", "两个独立系统", "公共智能体框架"], [
    ["建设成本", "解析、检索、模型、审计各做一套", "公共能力一次建设，多 Agent 复用"],
    ["扩展性", "新增需求继续复制工程", "新增 Agent 模板 + Tool/Skill 注册"],
    ["治理", "日志、权限、评测分散", "统一审计、统一权限、统一评测"],
    ["模型切换", "每个系统各自适配", "Model Gateway 统一切换 CPU/API/GPU"],
    ["知识复用", "指标知识、文档知识割裂", "Knowledge Service 统一 collection/domain 管理"],
  ]),
  heading("3. Python 与 Java 对比"),
  table(["维度", "Java", "Python", "推荐"], [
    ["公司基础", "后端团队熟悉，工程治理强", "AI 工程规范需建立", "Java 保留接入层和管理后台"],
    ["Agent/RAG 生态", "Spring AI、LangChain4j 可用但新能力跟进较慢", "LangGraph/LangChain/vLLM/Transformers 生态完整", "公共 Agent 底座选 Python"],
    ["文档解析", "POI/Tika 稳定但组合复杂", "pandas/openpyxl/PyMuPDF/unstructured 灵活", "解析与 RAG Pipeline 选 Python"],
    ["模型推理", "通常调用外部模型服务", "CPU/GPU 推理生态成熟", "Model Gateway 选 Python"],
    ["企业集成", "权限、组织、审批、门户集成优势强", "需额外开发", "企业系统集成仍用 Java"],
  ]),
  heading("4. 核心组件如何满足两个需求"),
  table(["组件", "支撑指标体系构建", "支撑离线 RAG/字段填充"], [
    ["LangGraph", "业务域分类、并行指标推导、可行性复评、人工确认", "离线写入、查询理解、检索路由、答案生成、审计反馈"],
    ["Tool Registry", "SchemaLookup、MetricRAG、SQLAdvisor、FeasibilityCheck", "ExactRowQuery、VectorSearch、FieldAlias、AnswerBuilder"],
    ["Knowledge Service", "指标口径库、表字段语义库、行业参考库", "文档知识库、Excel row_json、字段字典"],
    ["Model Gateway", "小模型分类、主模型推导、结构化 JSON 输出", "意图识别、问答生成、Embedding/Rerank"],
    ["PostgreSQL + pgvector", "存储 schema、指标产物、指标知识 chunk", "存储 rag_chunks、excel_rows、字段索引、审计"],
    ["Evaluation", "指标 JSON 完整性、口径一致性、SQL 可执行性", "字段填充准确率、召回率、引用正确性"],
  ]),
  heading("5. 最低环境配置"),
  table(["环境", "配置", "可验证内容", "注意事项"], [
    ["CPU 最小验证", "16C / 64GB RAM / 500GB SSD", "API、Agent Runtime、Tool、RAG、审计、7B 慢速推理", "只验证功能，不承诺响应时间。"],
    ["CPU 推荐验证", "32C / 128GB RAM / 1TB SSD", "批量文档导入、几万字段索引、100 QPS 非模型接口压测", "适合内网 PoC。"],
    ["GPU 生产起步", "32C / 128GB RAM / 2TB SSD + L20 48GB 或 A100 40GB", "14B/32B 量化模型推理、Embedding/Rerank 服务", "最终以模型压测确定。"],
    ["离线包", "Docker tar + wheelhouse + 模型权重 + SQL + Agent 模板", "无外网安装部署", "全部组件需锁版本和校验 hash。"],
  ]),
  heading("6. 参考版本依据"),
  bullet("LangChain 1.3.1、LangGraph 1.2.0、FastAPI 0.136.1 采用当前公开包版本线；离线环境需私有 wheelhouse 固化。"),
  bullet("pgvector 采用 0.8.2+，该版本线包含 HNSW 与安全修复；当前规模优先 PostgreSQL + pgvector，不优先引入 Elasticsearch。"),
].join("");

const arch = makeDocx("公共底层智能体框架_架构设计文档.docx", archBody, svgs);
const tech = makeDocx("公共底层智能体框架_技术选型方案.docx", techBody, svgs);
console.log(arch);
console.log(tech);
