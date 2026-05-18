const fs = require("fs");
const path = require("path");
const { execFileSync } = require("child_process");

const OUT = path.resolve("交付物");
const BUILD = path.resolve(".build_agent_platform_v2");
fs.mkdirSync(OUT, { recursive: true });

const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
const p = (text, style = "") => `<w:p><w:pPr>${style ? `<w:pStyle w:val="${style}"/>` : ""}<w:spacing w:after="120"/></w:pPr><w:r><w:t xml:space="preserve">${esc(text)}</w:t></w:r></w:p>`;
const h = (text, level = 1) => p(text, `Heading${level}`);
const bullet = (text) => `<w:p><w:pPr><w:pStyle w:val="ListParagraph"/><w:ind w:left="420"/><w:spacing w:after="80"/></w:pPr><w:r><w:t xml:space="preserve">• ${esc(text)}</w:t></w:r></w:p>`;
const code = (text) => `<w:p><w:pPr><w:shd w:fill="F8FAFC"/><w:spacing w:before="80" w:after="80"/></w:pPr><w:r><w:rPr><w:rFonts w:ascii="Consolas" w:eastAsia="Consolas"/><w:sz w:val="18"/></w:rPr><w:t xml:space="preserve">${esc(text)}</w:t></w:r></w:p>`;

function table(headers, rows) {
  const w = Math.max(1400, Math.floor(9200 / headers.length));
  const tr = (cells, header = false) => `<w:tr>${cells.map(c => `<w:tc><w:tcPr><w:tcW w:w="${w}" w:type="dxa"/>${header ? '<w:shd w:fill="E2E8F0"/>' : ""}</w:tcPr><w:p><w:r>${header ? "<w:rPr><w:b/></w:rPr>" : ""}<w:t xml:space="preserve">${esc(c)}</w:t></w:r></w:p></w:tc>`).join("")}</w:tr>`;
  return `<w:tbl><w:tblPr><w:tblW w:w="0" w:type="auto"/><w:tblBorders><w:top w:val="single" w:sz="6" w:color="CBD5E1"/><w:left w:val="single" w:sz="6" w:color="CBD5E1"/><w:bottom w:val="single" w:sz="6" w:color="CBD5E1"/><w:right w:val="single" w:sz="6" w:color="CBD5E1"/><w:insideH w:val="single" w:sz="6" w:color="CBD5E1"/><w:insideV w:val="single" w:sz="6" w:color="CBD5E1"/></w:tblBorders></w:tblPr>${tr(headers, true)}${rows.map(r => tr(r)).join("")}</w:tbl>`;
}

function svg(title, subtitle, body, w = 1400, h = 900) {
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">
<defs>
<marker id="arrow" markerWidth="10" markerHeight="10" refX="8" refY="3" orient="auto" markerUnits="strokeWidth"><path d="M0,0 L0,6 L9,3 z" fill="#64748B"/></marker>
<style>.title{font:800 30px Arial,'PingFang SC','Microsoft YaHei',sans-serif;fill:#0f172a}.sub{font:16px Arial,'PingFang SC','Microsoft YaHei',sans-serif;fill:#475569}.h{font:700 17px Arial,'PingFang SC','Microsoft YaHei',sans-serif;fill:#111827}.t{font:13px Arial,'PingFang SC','Microsoft YaHei',sans-serif;fill:#334155}.s{font:12px Arial,'PingFang SC','Microsoft YaHei',sans-serif;fill:#64748b}</style>
</defs><rect width="100%" height="100%" fill="#fff"/><text x="36" y="44" class="title">${esc(title)}</text><text x="36" y="76" class="sub">${esc(subtitle)}</text>${body}</svg>`;
}
function rect(x,y,w,h,title,lines,fill,stroke){let o=`<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="12" fill="${fill}" stroke="${stroke}" stroke-width="2"/><text x="${x+14}" y="${y+26}" class="h">${esc(title)}</text>`;(lines||[]).forEach((l,i)=>o+=`<text x="${x+14}" y="${y+50+i*18}" class="${l.startsWith('-')?'s':'t'}">${esc(l)}</text>`);return o}
function arr(x1,y1,x2,y2,c="#64748B"){return `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${c}" stroke-width="2.5" marker-end="url(#arrow)"/>`}

function diagramLayered() {
  const rows = [
    ["应用接入层", "Java 管理后台 / Web UI / OpenAPI Client / 文件上传端 / 指标体系入口 / 字段填充入口", "#DBEAFE", "#2563EB"],
    ["安全网关层", "Nginx 或 APISIX / OAuth2-JWT-LDAP / 限流 / 灰度 / request_id / 请求大小控制", "#E0F2FE", "#0284C7"],
    ["Agent 服务层", "FastAPI / AgentTemplateRouter / LangGraph Runtime / TaskContext / HITL / SSE", "#DCFCE7", "#16A34A"],
    ["能力编排层", "Tool Registry / MCP Server / Skill Library / Prompt & Schema Registry / Policy Guard", "#FEF3C7", "#D97706"],
    ["知识服务层", "Parser Router / Chunk Policy / RAG Service / Schema Registry / Field Dictionary / Rerank", "#F3E8FF", "#7C3AED"],
    ["模型服务层", "Model Gateway / llama.cpp CPU / API Models / vLLM GPU / bge-m3 / bge-reranker", "#FFE4E6", "#E11D48"],
    ["数据存储层", "PostgreSQL + pgvector / Redis / 文件与模型目录 / audit_logs / agent_runs / metric_artifacts", "#F8FAFC", "#334155"],
    ["治理观测层", "OpenTelemetry / Prometheus / Grafana / Phoenix / Evaluation / Release / Offline Package", "#ECFDF5", "#059669"],
  ];
  let b = "", y = 115;
  rows.forEach((r,i)=>{b+=rect(60,y,1280,72,r[0],[r[1]],r[2],r[3]); if(i<rows.length-1)b+=arr(700,y+72,700,y+94,r[3]); y+=94;});
  return svg("公共智能体平台分层技术架构", "采用公共底座支撑两个业务 Agent，明确每一层真实技术组件与职责边界。", b, 1400, 900);
}

function diagramComponent() {
  let b = "";
  const comps = [
    [50,120,250,105,"Gateway",["Nginx/APISIX","auth/rate limit/gray"],"#DBEAFE","#2563EB"],
    [350,120,250,105,"Agent API",["FastAPI/Uvicorn","REST/SSE/Task API"],"#DCFCE7","#16A34A"],
    [650,120,250,105,"Agent Runtime",["LangGraph 1.x","planner/router/executor"],"#DCFCE7","#16A34A"],
    [950,120,250,105,"Model Gateway",["CPU/API/GPU route","OpenAI compatible"],"#FFE4E6","#E11D48"],
    [50,310,250,120,"Tool Registry",["manifest/schema","timeout/retry/audit"],"#FEF3C7","#D97706"],
    [350,310,250,120,"MCP Servers",["database/file","knowledge/metrics"],"#FEF3C7","#D97706"],
    [650,310,250,120,"Skill Library",["row chunking","metric feasibility"],"#FEF3C7","#D97706"],
    [950,310,250,120,"Policy Guard",["PII mask","data domain/tool ACL"],"#FFE4E6","#E11D48"],
    [50,520,250,120,"Knowledge Service",["parser/chunker","RAG/retriever/rerank"],"#F3E8FF","#7C3AED"],
    [350,520,250,120,"PostgreSQL",["pgvector/JSONB","agent/audit/rag tables"],"#F8FAFC","#334155"],
    [650,520,250,120,"Redis/Queue",["cache/queue","rate counter"],"#FFEDD5","#EA580C"],
    [950,520,250,120,"Observability",["OTel/Prometheus","Grafana/Phoenix"],"#ECFDF5","#059669"],
  ];
  comps.forEach(c=>b+=rect(c[0],c[1],c[2],c[3],c[4],c[5],c[6],c[7]));
  [[300,172,350,172],[600,172,650,172],[900,172,950,172],[775,225,775,310],[475,225,475,310],[175,225,175,310],[175,430,175,520],[475,430,475,520],[775,430,775,520],[1075,430,1075,520],[300,580,350,580],[600,580,650,580],[900,580,950,580]].forEach(a=>b+=arr(...a));
  return svg("组件级技术架构与依赖关系", "突出服务组件、运行时组件、工具组件、模型组件、存储组件与观测组件的调用依赖。", b, 1260, 720);
}

function diagramDataFlow() {
  let b = "";
  b += `<rect x="40" y="105" width="1320" height="270" rx="18" fill="#F0FDF4" stroke="#16A34A" stroke-width="3"/><text x="70" y="138" class="h" fill="#166534">离线知识构建数据流</text>`;
  const ingest = [["File Intake",["Excel/Word/PDF/PPT"]],["Parser Router",["openpyxl/PyMuPDF/docx"]],["Chunk Policy",["row chunk/semantic chunk"]],["Embedding",["bge-m3 batch"]],["Index Writer",["rag_chunks/excel_rows"]]];
  ingest.forEach((n,i)=>{const x=75+i*255;b+=rect(x,175,210,120,n[0],n[1],"#FFFFFF","#22C55E"); if(i<4)b+=arr(x+210,235,x+255,235,"#16A34A")});
  b += `<rect x="40" y="430" width="1320" height="305" rx="18" fill="#EEF2FF" stroke="#4F46E5" stroke-width="3"/><text x="70" y="463" class="h" fill="#3730A3">在线 Agent 执行数据流</text>`;
  const online = [["Request",["metric/rag/field"]],["Intent Router",["agent_type"]],["Retriever/Tool",["exact/vector/schema"]],["LLM Router",["small/main model"]],["Validator",["schema/citation"]],["Result",["json/answer/audit"]]];
  online.forEach((n,i)=>{const x=70+i*215;b+=rect(x,500,180,120,n[0],n[1],"#FFFFFF","#6366F1"); if(i<5)b+=arr(x+180,560,x+215,560,"#4F46E5")});
  b+=arr(1115,295,1115,500,"#64748B");
  return svg("离线构建与在线执行数据流", "清晰区分知识入库链路与 Agent 在线运行链路，避免大 JSON 直塞模型。", b, 1400, 790);
}

function diagramSequence() {
  const actors = ["Client","Gateway","Agent API","Runtime","Tool/MCP","Knowledge DB","Model GW","Audit"];
  const xs = [70,235,400,565,730,895,1060,1225];
  let b="";
  xs.forEach((x,i)=>{b+=rect(x-58,115,116,48,actors[i],[],"#E0F2FE","#0284C7"); b+=`<line x1="${x}" y1="168" x2="${x}" y2="690" stroke="#CBD5E1" stroke-width="2"/>`;});
  const steps = [
    [0,1,"1 request + file/json/prompt"],[1,2,"2 auth/rate/request_id"],[2,3,"3 build TaskContext"],[3,4,"4 plan & call tool"],[4,5,"5 exact/vector/schema query"],[3,6,"6 model call if needed"],[6,3,"7 structured output"],[3,7,"8 trace/tool/model audit"],[3,2,"9 validated result"],[2,0,"10 response/SSE"]
  ];
  let y=210; steps.forEach(s=>{b+=arr(xs[s[0]],y,xs[s[1]],y,s[5]||"#64748B"); b+=`<text x="${Math.min(xs[s[0]],xs[s[1]])+8}" y="${y-10}" class="s">${esc(s[2])}</text>`; y+=48;});
  return svg("统一 Agent 请求处理时序图", "字段填充、指标构建、RAG 问答均遵循同一请求生命周期。", b, 1320, 740);
}

function diagramDeployment() {
  let b = `<rect x="45" y="105" width="1295" height="600" rx="18" fill="#F8FAFC" stroke="#334155" stroke-width="2"/>`;
  const comps = [
    [80,150,"nginx/apisix",["80/443","auth/limit"],"#DBEAFE","#2563EB"],
    [370,150,"agent-api",["FastAPI","template router"],"#DCFCE7","#16A34A"],
    [660,150,"agent-worker",["LangGraph","Celery/RQ"],"#DCFCE7","#16A34A"],
    [950,150,"model-gateway",["cpu/api/vllm","openai api"],"#FFE4E6","#E11D48"],
    [80,385,"knowledge-worker",["parser/chunk","embedding"],"#FEF3C7","#D97706"],
    [370,385,"postgresql",["pgvector/jsonb","audit/rag/metrics"],"#F3E8FF","#7C3AED"],
    [660,385,"redis",["cache/queue","rate counter"],"#FFEDD5","#EA580C"],
    [950,385,"observability",["prom/grafana","phoenix/loki"],"#ECFDF5","#059669"],
  ];
  comps.forEach(c=>b+=rect(c[0],c[1],230,115,c[2],c[3],c[4],c[5]));
  [[310,205,370,205],[600,205,660,205],[890,205,950,205],[775,265,775,385],[485,265,485,385],[195,265,195,385]].forEach(a=>b+=arr(...a));
  b += `<text x="80" y="655" class="t">CPU验证：16C/64G/500G；GPU生产：32C/128G/2T + L20 48G 或 A100 40G，按模型压测决定。</text>`;
  return svg("单机虚机部署拓扑", "内网离线部署，后续通过替换 model-gateway 后端切换 GPU 推理。", b, 1400, 760);
}

function imageRel(id, name, w = 6500000, h = 4300000) {
  return `<w:p><w:pPr><w:jc w:val="center"/></w:pPr><w:r><w:drawing><wp:inline distT="0" distB="0" distL="0" distR="0" xmlns:wp="http://schemas.openxmlformats.org/drawingml/2006/wordprocessingDrawing"><wp:extent cx="${w}" cy="${h}"/><wp:docPr id="${id}" name="${name}"/><a:graphic xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main"><a:graphicData uri="http://schemas.openxmlformats.org/drawingml/2006/picture"><pic:pic xmlns:pic="http://schemas.openxmlformats.org/drawingml/2006/picture"><pic:nvPicPr><pic:cNvPr id="${id}" name="${name}"/><pic:cNvPicPr/></pic:nvPicPr><pic:blipFill><a:blip r:embed="rId${id}" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"/><a:stretch><a:fillRect/></a:stretch></pic:blipFill><pic:spPr><a:xfrm><a:off x="0" y="0"/><a:ext cx="${w}" cy="${h}"/></a:xfrm><a:prstGeom prst="rect"><a:avLst/></a:prstGeom></pic:spPr></pic:pic></a:graphicData></a:graphic></wp:inline></w:drawing></w:r></w:p>`;
}
const caption = (t) => `<w:p><w:pPr><w:jc w:val="center"/></w:pPr><w:r><w:rPr><w:color w:val="64748B"/><w:sz w:val="18"/></w:rPr><w:t>${esc(t)}</w:t></w:r></w:p>`;

function styles() {
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><w:styles xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:style w:type="paragraph" w:default="1" w:styleId="Normal"><w:name w:val="Normal"/><w:rPr><w:rFonts w:ascii="Arial Unicode MS" w:eastAsia="Arial Unicode MS"/><w:sz w:val="21"/></w:rPr></w:style><w:style w:type="paragraph" w:styleId="Heading1"><w:name w:val="heading 1"/><w:basedOn w:val="Normal"/><w:rPr><w:b/><w:sz w:val="36"/><w:color w:val="0F172A"/></w:rPr></w:style><w:style w:type="paragraph" w:styleId="Heading2"><w:name w:val="heading 2"/><w:basedOn w:val="Normal"/><w:rPr><w:b/><w:sz w:val="28"/><w:color w:val="1F2937"/></w:rPr></w:style><w:style w:type="paragraph" w:styleId="Heading3"><w:name w:val="heading 3"/><w:basedOn w:val="Normal"/><w:rPr><w:b/><w:sz w:val="24"/><w:color w:val="334155"/></w:rPr></w:style><w:style w:type="paragraph" w:styleId="Title"><w:name w:val="Title"/><w:rPr><w:b/><w:sz w:val="44"/></w:rPr></w:style><w:style w:type="paragraph" w:styleId="ListParagraph"><w:name w:val="List Paragraph"/><w:basedOn w:val="Normal"/></w:style></w:styles>`;
}
const documentXml = (body) => `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><w:body>${body}<w:sectPr><w:pgSz w:w="11906" w:h="16838"/><w:pgMar w:top="864" w:right="720" w:bottom="864" w:left="720" w:header="720" w:footer="720" w:gutter="0"/></w:sectPr></w:body></w:document>`;

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
  svgs.forEach((svg, i) => { fs.writeFileSync(path.join(dir, "word", "media", `image${i+1}.svg`), svg); rels += `<Relationship Id="rId${i+1}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/image" Target="media/image${i+1}.svg"/>`; });
  rels += `</Relationships>`;
  fs.writeFileSync(path.join(dir, "word", "_rels", "document.xml.rels"), rels);
  const out = path.join(OUT, filename);
  try { fs.unlinkSync(out); } catch {}
  execFileSync("zip", ["-qr", out, "."], { cwd: dir });
  return out;
}

const svgs = [diagramLayered(), diagramComponent(), diagramDataFlow(), diagramSequence(), diagramDeployment()];

const body = [
`<w:p><w:pPr><w:pStyle w:val="Title"/><w:jc w:val="center"/></w:pPr><w:r><w:t>公共底层智能体框架详细设计方案（优化版）</w:t></w:r></w:p>`,
p("参照工业级 Agent 详细设计文档结构重写：项目背景、概要设计、分层架构、组件详设、核心流程、接口数据、部署治理。"),
h("1. 项目背景"),
h("1.1 项目简介",2),
p("本项目目标是建设一个公共底层智能体平台，用统一的 Agent Runtime、工具体系、知识服务、模型网关和治理能力，支撑多个业务智能体的快速构建与稳定运行。第一阶段重点承载两个业务 Agent：指标体系构建 Agent 与离线 RAG/字段填充 Agent。"),
h("1.2 项目定位",2),
bullet("公共智能体框架：不是为单一场景定制的 RAG 系统，而是可持续扩展的 Agent 平台底座。"),
bullet("企业内网可部署：支持无外网环境，组件、模型、依赖均可离线交付。"),
bullet("业务 Agent 可插拔：新增 Agent 通过模板、工具、Schema、Prompt、评测集注册，不复制底层工程。"),
h("1.3 设计范围",2),
table(["范围", "包含内容", "不包含内容"], [
["平台底座", "Agent Runtime、Tool/MCP/Skill、Model Gateway、Knowledge Service、Audit、Evaluation", "具体业务 UI 详细交互设计"],
["指标体系构建", "Schema 瘦身、业务域分类、指标推导、可行性复评、人工确认、指标 JSON 输出", "指标管理系统全量功能"],
["离线 RAG/字段填充", "文件解析、Excel 行级 chunk、pgvector 写入、精确查询、语义召回、字段填充", "大型搜索中台或 ES 集群建设"],
]),
h("2. 系统概要设计"),
h("2.1 总体设计思想",2),
p("系统采用“业务 Agent 应用层 + 公共智能体底座”的设计。业务 Agent 只负责定义任务模板、状态流转、工具组合和输出 Schema；公共底座负责模型调用、知识检索、工具执行、审计、安全、观测、部署和评测。"),
h("2.2 分层架构",2),
imageRel(1,"layered",6500000,4200000), caption("图 1：公共智能体平台分层技术架构"),
h("2.3 分层组件说明",2),
table(["层级", "核心组件", "职责"], [
["应用接入层", "Java 管理后台、Web UI、OpenAPI Client、文件上传端", "提供用户入口、业务系统集成、Agent 任务提交与结果展示。"],
["安全网关层", "Nginx/APISIX、OAuth2/JWT/LDAP/SSO、限流、灰度", "统一接入控制、身份认证、流量保护和请求追踪。"],
["Agent 服务层", "FastAPI、LangGraph Runtime、TaskContext、HITL", "承载 Agent API、状态机执行、人工确认、异步任务与流式响应。"],
["能力编排层", "Tool Registry、MCP Server、Skill Library、Prompt/Schema Registry", "沉淀可复用能力，避免业务 Agent 重复实现确定性逻辑。"],
["知识服务层", "Parser Router、Chunk Policy、RAG Service、Schema Registry、Field Dictionary", "完成文件解析、分片、入库、检索、字段别名和表结构语义管理。"],
["模型服务层", "Model Gateway、llama.cpp、API 模型、vLLM、Embedding、Rerank", "统一模型调用接口并支持 CPU/API/GPU 模式切换。"],
["数据存储层", "PostgreSQL+pgvector、Redis、文件/模型目录", "存储结构化数据、向量、任务状态、审计日志、缓存与离线资源。"],
["治理观测层", "OpenTelemetry、Prometheus、Grafana、Phoenix、Evaluation", "实现全链路观测、评测、版本发布、灰度和回滚。"],
]),
h("2.4 组件级技术架构",2),
imageRel(2,"component",6500000,3750000), caption("图 2：组件级技术架构与依赖关系"),
h("3. 核心业务 Agent 概述"),
h("3.1 指标体系构建 Agent",2),
p("该 Agent 面向表结构、业务文档和数据域说明，自动完成表结构理解、业务域分类、指标候选推导、指标口径生成、维度度量识别、可行性复评和人工确认。"),
table(["阶段", "输入", "处理", "输出"], [
["Schema 接入", "table_json / Excel / Word / prompt", "解析表、字段、注释、样例值，生成轻量 Schema", "NormalizedSchema"],
["业务域分类", "NormalizedSchema", "小模型分批分类，字段字典/RAG 辅助", "domain_tables"],
["指标推导", "domain_tables + 指标知识库", "按业务域并行推导指标、维度、口径、计算逻辑", "metric_candidates"],
["可行性复评", "metric_candidates + schema", "检查字段可得性、SQL 可执行性、口径冲突", "review_result"],
["人工确认", "review_result", "业务专家确认、修正、发布", "metric_system_json"],
]),
h("3.2 离线 RAG/字段填充 Agent",2),
p("该 Agent 面向 Excel/Word/PPT/PDF/TXT 等知识文件，重点支持 Excel 行级字段填充。系统先把文件解析入库，查询时优先使用结构化字段精确查询，再用向量检索补充语义上下文。"),
table(["阶段", "输入", "处理", "输出"], [
["文件解析", "Excel/CSV/Word/PPT/PDF/TXT", "按类型路由解析器，生成 DocumentModel", "document_units"],
["分片入库", "document_units", "Excel 一行一个主 chunk，row_json 保存整行", "rag_chunks / excel_rows"],
["查询理解", "用户问题", "抽取字段名、字段值、目标字段、意图", "query_plan"],
["检索路由", "query_plan", "字段明确走精确查询，自然语言走向量检索", "retrieval_context"],
["结果生成", "retrieval_context", "字段填充直返；复杂问答调用 LLM", "answer / filled_fields"],
]),
h("4. 数据流设计"),
imageRel(3,"data-flow",6500000,3850000), caption("图 3：离线构建与在线执行数据流"),
h("4.1 大 JSON 瓶颈处理",2),
bullet("不再将上千/上万表拼成一个大 JSON 直接输入模型。"),
bullet("先进行 Schema Slimming，只保留 table、column、comment、dtype、sample、key hints。"),
bullet("按库、业务域、表批次进行 Map-Reduce 分类与推导，每批只处理有限表集合。"),
bullet("中间结果全部落 agent_runs/tool_calls/metric_artifacts，失败可重试，结果可回放。"),
h("4.2 Excel 行级字段填充处理",2),
bullet("Excel 推荐主规则：一行业务记录等于一个主 chunk。"),
bullet("chunk_text 使用“字段名: 字段值; 字段名: 字段值”格式便于语义召回。"),
bullet("row_json 保存整行原始字段，row_id 作为字段填充的核心关联键。"),
bullet("高频字段如编号、名称、日期、状态独立建列和索引；长文本字段可二级分片但必须回指 row_id。"),
h("5. 模块详细设计"),
h("5.1 Agent API 模块",2),
table(["接口", "方法", "说明"], [
["/api/v1/agents/runs", "POST", "提交 Agent 任务，支持 metric_system_builder 与 rag_field_filler。"],
["/api/v1/agents/runs/{run_id}", "GET", "查询任务状态、阶段、结果摘要。"],
["/api/v1/agents/runs/{run_id}/events", "GET/SSE", "流式返回状态、工具调用、模型输出和人工确认事件。"],
["/api/v1/knowledge/import", "POST", "提交知识库导入任务。"],
["/api/v1/hitl/{run_id}/actions", "POST", "人工确认、修正、驳回、继续执行。"],
]),
h("5.2 Agent Runtime 模块",2),
bullet("基于 LangGraph 1.x 实现状态机，每个业务 Agent 由 agent template 定义节点和边。"),
bullet("统一 TaskContext 保存输入、安全上下文、执行计划、工具结果、模型结果、校验错误、人工反馈和最终结果。"),
bullet("支持 Checkpoint 和 Replay，故障后可从失败节点恢复，不必重跑完整任务。"),
h("5.3 Tool Registry 模块",2),
table(["工具", "职责", "典型调用方"], [
["schema_lookup", "查询表结构、字段注释、字段样例和字段别名", "指标体系构建 Agent"],
["metric_rag_search", "查询指标口径、行业指标、企业指标知识库", "指标体系构建 Agent"],
["exact_row_query", "根据字段名和值精确查 excel_rows", "字段填充 Agent"],
["vector_search", "基于 pgvector 检索相关 chunk", "两个 Agent"],
["field_alias_map", "字段别名映射，如合同号=合同编号", "字段填充 Agent"],
["audit_write", "写入审计事件", "全部 Agent"],
]),
h("5.4 Knowledge Service 模块",2),
bullet("Parser Router：按文件类型分发到 Excel、Word、PPT、PDF、TXT/Markdown 解析器。"),
bullet("Chunk Policy：根据业务场景选择行级 chunk、段落 chunk、页级 chunk 或表格 chunk。"),
bullet("Retriever：支持精确字段查询、JSONB 查询、pg_trgm 模糊查询、pgvector 语义检索和 rerank。"),
bullet("Schema Registry：管理表结构、字段含义、字段别名、业务域映射和指标候选关系。"),
h("5.5 Model Gateway 模块",2),
table(["能力", "实现", "说明"], [
["模型路由", "LLM Router", "根据任务类型路由小模型、主模型、embedding、rerank。"],
["CPU 验证", "llama.cpp", "用于前期功能验证，不承诺性能。"],
["API 验证", "百炼/方舟/内部 API", "用于模型效果对比和成本评估。"],
["GPU 生产", "vLLM", "确认模型后自部署，暴露 OpenAI compatible API。"],
["结构化输出", "JSON Schema / guided decoding", "模型输出必须经过 Schema 校验后才能落库。"],
]),
h("6. 统一请求处理时序"),
imageRel(4,"sequence",6500000,3650000), caption("图 4：统一 Agent 请求处理时序图"),
h("7. 数据模型设计"),
table(["表名", "关键字段", "用途"], [
["agent_templates", "agent_type, version, graph_config, input_schema, output_schema", "注册业务 Agent 模板。"],
["agent_runs", "run_id, agent_type, status, user_id, task_context, final_result", "记录一次 Agent 执行。"],
["tool_calls", "run_id, node_id, tool_name, args_hash, result_ref, latency_ms, status", "工具调用审计与回放。"],
["model_calls", "run_id, model_name, prompt_hash, token_in, token_out, latency_ms, cost", "模型调用成本与性能分析。"],
["knowledge_collections", "collection_id, domain, source_type, acl_policy, parser_policy", "知识域管理。"],
["rag_chunks", "chunk_id, collection_id, chunk_text, embedding, metadata, source_ref", "语义检索主表。"],
["excel_rows", "row_id, source_id, sheet_name, row_no, row_json, indexed_fields", "Excel 字段填充主表。"],
["field_dictionary", "field_name, aliases, data_type, examples, source_scope", "字段别名与语义字典。"],
["metric_artifacts", "artifact_id, run_id, domain, metric_json, review_status, version", "指标体系构建结果。"],
["audit_logs", "request_id, user_id, action, masked_payload, hit_refs, result_summary", "审计日志。"],
["evaluation_cases", "case_id, agent_type, input, expected, scoring_rule, tags", "回归评测样本。"],
]),
h("8. 核心类与配置结构"),
code(`class TaskContext:
    run_id: str
    agent_type: str
    input_payload: dict
    security_context: SecurityContext
    plan: list[PlanStep]
    tool_calls: list[ToolCallRecord]
    retrieval_context: dict
    model_outputs: list[ModelOutput]
    validation_errors: list[ValidationError]
    human_feedback: list[HumanFeedback]
    final_result: dict`),
code(`agent_template.yaml:
agent_type: metric_system_builder
version: 1.0.0
input_schema: schemas/metric_input.json
output_schema: schemas/metric_system_output.json
graph:
  nodes: [normalize_input, classify_domain, retrieve_metric_knowledge, generate_metrics, validate, hitl, finalize]
  checkpoint: postgres
tools: [schema_lookup, metric_rag_search, feasibility_check, audit_write]`),
h("9. 部署架构"),
imageRel(5,"deployment",6500000,3650000), caption("图 5：单机虚机部署拓扑"),
h("9.1 离线部署包",2),
table(["包类型", "内容", "说明"], [
["Docker 镜像包", "gateway、agent-api、agent-worker、knowledge-worker、postgres、redis、observability", "通过 docker save/load 交付。"],
["Python wheelhouse", "fastapi、langgraph、langchain、pydantic、pandas、openpyxl、pymupdf、psycopg、presidio 等", "内网 pip --no-index 安装。"],
["模型包", "bge-m3、bge-reranker、Qwen GGUF/API 配置/vLLM 权重", "按阶段交付，生产模型确认后再固化。"],
["SQL 包", "schema、索引、初始化字典、审计表、评测样本", "支持一键初始化。"],
["配置包", "agent templates、tool manifests、prompt、JSON Schema", "平台扩展核心资产。"],
]),
h("10. 安全与隐私设计"),
bullet("身份认证：接入层支持 OAuth2/JWT/LDAP/SSO，内部服务使用 service token。"),
bullet("数据域过滤：每个请求携带 security_context，Tool Executor 在工具调用前注入 ACL filter。"),
bullet("脱敏：Presidio + 自定义正则，覆盖手机号、身份证、邮箱、客户名、合同号等。"),
bullet("Prompt 注入防护：对用户输入和检索上下文做规则检测；Tool 权限由 manifest 控制，模型不能越权调用。"),
bullet("SQL 安全：所有数据库查询必须参数化，禁止 LLM 生成 SQL 后直接执行。"),
h("11. 性能与扩展性设计"),
table(["方向", "设计"], [
["大 JSON", "Schema Slimming + Map-Reduce + 中间状态落库，避免一次性输入模型。"],
["字段填充", "结构化精确查询优先，LLM 只用于复杂解释，降低延迟和幻觉。"],
["检索性能", "PostgreSQL B-tree/GIN/pg_trgm + pgvector HNSW，rerank 只处理 top-k。"],
["异步任务", "文件解析、embedding、指标推导等长任务走队列，支持失败重试。"],
["缓存", "Redis 缓存字段字典、schema hash、query embedding、常见查询结果。"],
["横向扩展", "agent-api、agent-worker、knowledge-worker、model-gateway 均可独立扩容。"],
]),
h("12. 可观测与评测设计"),
bullet("Trace：OpenTelemetry 贯穿 request_id、run_id、node_id、tool_call_id、model_call_id。"),
bullet("Metrics：请求量、延迟、错误率、工具耗时、模型 token、检索召回、字段填充准确率。"),
bullet("LLM Trace：Phoenix 记录 prompt、上下文、工具调用、模型输出和评分。"),
bullet("Evaluation：为两个核心 Agent 建立 golden cases，发布前做回归评测。"),
h("13. 实施路线"),
table(["阶段", "目标", "产出"], [
["P0 公共底座骨架", "打通 Agent API、Runtime、Tool Registry、PostgreSQL、Redis、审计", "可提交 mock Agent 并回放执行链路。"],
["P1 知识服务与字段填充", "完成文件解析、Excel 行级 chunk、精确查询、语义召回", "RAG/字段填充 Agent 可用。"],
["P2 指标体系构建", "完成 Schema 瘦身、业务域分类、指标推导、人工确认", "指标体系构建 Agent 可用。"],
["P3 模型选型压测", "CPU/API/GPU 三模式验证，确定模型与 GPU", "模型评测报告与部署参数。"],
["P4 生产治理", "完善权限、审计、可观测、评测、灰度、回滚", "生产试点版本。"],
]),
h("14. 小结"),
p("本设计将两个看似不同的需求抽象为同一套公共智能体平台能力：业务 Agent 通过模板表达差异，底层复用 Runtime、Tool/MCP/Skill、Knowledge Service、Model Gateway、数据存储、审计、安全和观测体系。这样既能满足当前指标体系构建与离线 RAG/字段填充需求，也能支撑后续更多企业内部 Agent 扩展。")
].join("");

const out = makeDocx("公共底层智能体框架详细设计方案_优化版.docx", body, svgs);
console.log(out);
