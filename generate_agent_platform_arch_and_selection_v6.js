const fs = require("fs");
const path = require("path");
const { execFileSync } = require("child_process");

const OUT = path.resolve("交付物");
const BUILD = path.resolve(".build_agent_platform_v6");
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
  let b = titleBox("t1", 35, 20, "公共底层智能体平台：组件级总体技术架构", "完整展示接入、运行时、业务Agent、能力插件、知识服务、模型网关、数据存储、治理观测与离线交付。");
  b += lane("l1", 40, 110, 1670, 86, "接入与体验层");
  b += shape("a1", 80, 148, 220, 38, "Web UI", ["任务与结果"], "#DBEAFE", "#2563EB");
  b += shape("a2", 325, 148, 250, 38, "Java 管理后台", ["用户/权限/配置"], "#DBEAFE", "#2563EB");
  b += shape("a3", 600, 148, 240, 38, "OpenAPI Client", ["批处理/系统集成"], "#DBEAFE", "#2563EB");
  b += shape("a4", 865, 148, 250, 38, "HITL 工作台", ["确认/修正/发布"], "#FEF3C7", "#D97706");
  b += shape("a5", 1140, 148, 240, 38, "文件上传入口", ["Excel/Word/PDF"], "#DBEAFE", "#2563EB");
  b += shape("a6", 1405, 148, 255, 38, "Nginx / APISIX", ["TLS/鉴权/限流/灰度"], "#E0F2FE", "#0284C7");

  b += lane("l2", 40, 230, 1670, 128, "公共智能体运行层");
  b += shape("b1", 80, 280, 210, 48, "Agent API", ["FastAPI/Uvicorn"], "#DCFCE7", "#16A34A");
  b += shape("b2", 320, 280, 250, 48, "Template Router", ["按agent_type加载"], "#DCFCE7", "#16A34A");
  b += shape("b3", 600, 280, 270, 48, "LangGraph Runtime", ["StateGraph/Checkpoint"], "#DCFCE7", "#16A34A");
  b += shape("b4", 900, 280, 230, 48, "Task Queue", ["Redis/Celery/RQ"], "#DCFCE7", "#16A34A");
  b += shape("b5", 1160, 280, 230, 48, "Policy Guard", ["ACL/脱敏/注入防护"], "#FFE4E6", "#E11D48");
  b += shape("b6", 1420, 280, 240, 48, "Audit Replay", ["Trace/回放/样本"], "#ECFDF5", "#059669");

  b += lane("l3", 40, 390, 760, 145, "业务 Agent 应用层");
  b += shape("c1", 85, 450, 200, 48, "指标构建Agent", ["指标JSON/口径"], "#EFF6FF", "#2563EB");
  b += shape("c2", 315, 450, 210, 48, "Excel补全Agent", ["主键匹配/属性回填"], "#F0FDF4", "#16A34A");
  b += shape("c3", 555, 450, 200, 48, "RAG问答Agent", ["检索/引用/回答"], "#F3E8FF", "#7C3AED");

  b += lane("l4", 840, 390, 870, 145, "能力插件层");
  b += shape("d1", 880, 450, 180, 48, "Tool Registry", ["强Schema工具"], "#FEF3C7", "#D97706");
  b += shape("d2", 1085, 450, 180, 48, "MCP Servers", ["DB/File/Knowledge"], "#FEF3C7", "#D97706");
  b += shape("d3", 1290, 450, 180, 48, "Skill Library", ["专家流程"], "#FEF3C7", "#D97706");
  b += shape("d4", 1495, 450, 170, 48, "Schema Registry", ["Prompt/JSONSchema"], "#FEF3C7", "#D97706");

  b += lane("l5", 40, 570, 820, 145, "知识服务层");
  b += shape("e1", 85, 630, 180, 48, "Parser Router", ["Excel/Doc/PDF"], "#F3E8FF", "#7C3AED");
  b += shape("e2", 290, 630, 180, 48, "Chunk Policy", ["行级/段落/表格"], "#F3E8FF", "#7C3AED");
  b += shape("e3", 495, 630, 180, 48, "Retriever", ["精确/向量/重排"], "#F3E8FF", "#7C3AED");
  b += shape("e4", 700, 630, 125, 48, "Field Dict", ["字段别名"], "#F3E8FF", "#7C3AED");

  b += lane("l6", 900, 570, 810, 145, "模型服务层");
  b += shape("f1", 940, 630, 190, 48, "Model Gateway", ["CPU/API/GPU路由"], "#FFE4E6", "#E11D48");
  b += shape("f2", 1155, 630, 170, 48, "Small LLM", ["分类/路由"], "#FFE4E6", "#E11D48");
  b += shape("f3", 1350, 630, 160, 48, "Main LLM", ["推理/生成"], "#FFE4E6", "#E11D48");
  b += shape("f4", 1535, 630, 140, 48, "Emb/Rerank", ["bge模型"], "#FFE4E6", "#E11D48");

  b += lane("l7", 40, 750, 1670, 110, "数据存储、观测与离线交付层");
  b += shape("g1", 85, 800, 245, 42, "PostgreSQL + pgvector", ["agent/rag/excel/metric/audit"], "#FFFFFF", "#334155");
  b += shape("g2", 360, 800, 170, 42, "Redis", ["cache/queue"], "#FFFFFF", "#EA580C");
  b += shape("g3", 560, 800, 250, 42, "File/Model Repo", ["文件/模型/离线包"], "#FFFFFF", "#0284C7");
  b += shape("g4", 840, 800, 250, 42, "Observability", ["OTel/Prom/Grafana/Phoenix"], "#FFFFFF", "#059669");
  b += shape("g5", 1120, 800, 230, 42, "Evaluation", ["golden cases/回归"], "#FFFFFF", "#7C3AED");
  b += shape("g6", 1380, 800, 275, 42, "Offline Package", ["docker/wheel/model/sql/template"], "#FFFFFF", "#334155");

  b += line("x0", 1530, 186, 1530, 280);
  b += line("x1", 290, 304, 320, 304); b += line("x2", 570, 304, 600, 304); b += line("x3", 870, 304, 900, 304); b += line("x4", 1130, 304, 1160, 304); b += line("x5", 1390, 304, 1420, 304);
  b += line("x6", 735, 328, 735, 450); b += line("x7", 755, 474, 880, 474); b += line("x8", 1470, 474, 1495, 474);
  b += line("x9", 455, 498, 455, 630); b += line("x10", 1280, 498, 1280, 630); b += line("x11", 765, 678, 765, 800); b += line("x12", 1225, 678, 1225, 800);
  return vml(760, 430, 1750, 900, b);
}

function diagramFlows() {
  let b = titleBox("t2", 40, 20, "三类核心业务流程与公共底座关系", "指标构建、Excel知识库补全、RAG问答共用Runtime/Tool/Knowledge/Model/Data治理能力。");
  const cols = [
    ["指标体系构建", "#EFF6FF", "#2563EB", [["输入", "table_json/文件/prompt"], ["处理", "Schema瘦身/业务域分类/指标推导"], ["输出", "指标JSON/口径/SQL建议"], ["治理", "人工确认/版本/评测"]]],
    ["Excel知识库补全", "#F0FDF4", "#16A34A", [["输入", "知识库Excel/待补全Excel"], ["处理", "主键识别/精确匹配/字段回填"], ["输出", "补全Excel/异常报告/差异明细"], ["治理", "命中率/冲突确认/数据版本"]]],
    ["RAG问答与扩展", "#F3E8FF", "#7C3AED", [["输入", "用户问题/文档集合"], ["处理", "混合检索/rerank/引用生成"], ["输出", "答案/引用/置信度"], ["治理", "反馈样本/召回评测/Prompt版本"]]],
  ];
  cols.forEach((c, i) => {
    const x = 70 + i * 560;
    b += lane(`lane${i}`, x, 120, 500, 550, c[0], c[1], c[2]);
    c[3].forEach((s, j) => {
      const y = 195 + j * 105;
      b += shape(`flow${i}${j}`, x + 55, y, 390, 58, s[0], [s[1]], "#FFFFFF", c[2]);
      if (j < 3) b += line(`fl${i}${j}`, x + 250, y + 58, x + 250, y + 78, c[2]);
    });
  });
  b += shape("base", 320, 730, 1100, 70, "公共底座", ["Agent Runtime · Tool/MCP/Skill · Knowledge Service · Model Gateway · PostgreSQL/pgvector · Audit · Evaluation"], "#FEF3C7", "#D97706");
  b += line("b1", 320, 670, 610, 730, "#D97706"); b += line("b2", 875, 670, 875, 730, "#D97706"); b += line("b3", 1430, 670, 1140, 730, "#D97706");
  return vml(760, 410, 1750, 850, b);
}

function diagramData() {
  let b = titleBox("t3", 40, 20, "统一数据流与存储模型", "把结构化补全、指标产物、RAG知识和审计评测统一纳入平台数据层。");
  b += lane("in", 60, 115, 1630, 95, "输入数据");
  b += shape("i1", 105, 152, 270, 42, "结构化Schema", ["table_json/字段注释"], "#EFF6FF", "#2563EB");
  b += shape("i2", 420, 152, 310, 42, "Excel知识库与待补全文件", ["主键/属性/row_json"], "#F0FDF4", "#16A34A");
  b += shape("i3", 775, 152, 270, 42, "非结构化文档", ["Word/PDF/PPT/TXT"], "#F3E8FF", "#7C3AED");
  b += shape("i4", 1090, 152, 270, 42, "用户查询/Prompt", ["任务上下文"], "#FEF3C7", "#D97706");
  b += shape("i5", 1405, 152, 220, 42, "人工反馈", ["确认/修正"], "#ECFDF5", "#059669");

  b += lane("proc", 60, 255, 1630, 130, "处理服务");
  b += shape("p1", 105, 305, 240, 46, "Parser/Normalizer", ["解析/归一/瘦身"], "#FFFFFF", "#0284C7");
  b += shape("p2", 390, 305, 240, 46, "Exact Lookup", ["主键精确匹配"], "#FFFFFF", "#16A34A");
  b += shape("p3", 675, 305, 240, 46, "RAG Retriever", ["pgvector/rerank"], "#FFFFFF", "#7C3AED");
  b += shape("p4", 960, 305, 240, 46, "Agent Runtime", ["计划/工具/模型"], "#FFFFFF", "#D97706");
  b += shape("p5", 1245, 305, 240, 46, "Validator/Audit", ["校验/审计/评测"], "#FFFFFF", "#059669");

  b += lane("store", 60, 435, 1630, 175, "核心存储");
  b += shape("d1", 95, 500, 225, 52, "metric_artifacts", ["指标体系产物"], "#FFFFFF", "#2563EB");
  b += shape("d2", 360, 500, 225, 52, "excel_master_rows", ["知识库快照/row_json"], "#FFFFFF", "#16A34A");
  b += shape("d3", 625, 500, 225, 52, "enrichment_results", ["补全结果/异常"], "#FFFFFF", "#16A34A");
  b += shape("d4", 890, 500, 225, 52, "rag_chunks", ["chunk/vector/metadata"], "#FFFFFF", "#7C3AED");
  b += shape("d5", 1155, 500, 225, 52, "agent_runs/tool_calls", ["状态/工具/模型调用"], "#FFFFFF", "#D97706");
  b += shape("d6", 1420, 500, 225, 52, "audit/evaluation", ["审计/评测样本"], "#FFFFFF", "#059669");
  b += line("l1", 510, 194, 510, 305); b += line("l2", 910, 194, 795, 305); b += line("l3", 1225, 194, 1080, 305); b += line("l4", 1350, 351, 1530, 500); b += line("l5", 510, 351, 472, 500); b += line("l6", 795, 351, 1002, 500);
  return vml(760, 315, 1750, 650, b);
}

function diagramDeployment() {
  let b = titleBox("t4", 40, 20, "部署架构与离线交付", "单机虚机起步，后续按服务拆分；模型确认后只替换Model Gateway后端。");
  b += lane("vm", 60, 115, 1630, 535, "内网虚拟机 / Docker Compose 部署");
  const comps = [
    [105, 180, "gateway", ["Nginx/APISIX", "TLS/Auth/Limit"], "#DBEAFE", "#2563EB"],
    [380, 180, "agent-api", ["FastAPI", "REST/SSE"], "#DCFCE7", "#16A34A"],
    [655, 180, "agent-worker", ["LangGraph", "Celery/RQ"], "#DCFCE7", "#16A34A"],
    [930, 180, "knowledge-worker", ["Parser", "Embedding"], "#FEF3C7", "#D97706"],
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
  `<w:p><w:pPr><w:pStyle w:val="Title"/><w:jc w:val="center"/></w:pPr><w:r><w:t>公共底层智能体平台架构设计文档（更新版）</w:t></w:r></w:p>`,
  p("本版对架构图进行补全：从接入、Runtime、业务 Agent、Tool/MCP/Skill、Knowledge Service、Model Gateway、存储、可观测、离线交付完整展开。"),
  h("1. 架构目标"),
  bullet("建设一个公共底层智能体平台，而不是针对单一业务的孤立 Agent。"),
  bullet("首批支持指标体系构建、Excel 知识库补全、RAG 问答三类业务 Agent。"),
  bullet("通过 Agent Template、Tool/MCP/Skill、Knowledge Service、Model Gateway 实现可扩展。"),
  bullet("满足内网单机虚机离线部署，前期 CPU 验证功能，模型确认后再选择 GPU。"),
  h("2. 组件级总体架构"),
  diagramOverall(), caption("图 1：公共底层智能体平台组件级总体架构"),
  h("2.1 分层说明"),
  table(["层级", "组件", "说明"], [
    ["接入与体验层", "Web UI、Java管理后台、OpenAPI、HITL工作台、Nginx/APISIX", "提供任务提交、文件上传、人工确认、API接入、安全入口。"],
    ["公共智能体运行层", "Agent API、Template Router、LangGraph Runtime、Task Queue、Policy Guard、Audit Replay", "平台核心，负责状态机、任务、权限、审计、回放。"],
    ["业务 Agent 应用层", "指标构建、Excel补全、RAG问答", "以模板方式注册，复用底座能力。"],
    ["能力插件层", "Tool Registry、MCP Servers、Skill Library、Schema Registry", "确定性能力、外部系统连接、专家流程和输出约束。"],
    ["知识服务层", "Parser Router、Chunk Policy、Retriever、Field Dictionary", "文档解析、结构化查询、向量检索、字段别名。"],
    ["模型服务层", "Model Gateway、Small LLM、Main LLM、Embedding/Rerank", "模型分流和部署方式屏蔽。"],
    ["存储与治理层", "PostgreSQL+pgvector、Redis、File Repo、Observability、Evaluation、Offline Package", "数据、缓存、文件、模型、监控、评测和离线交付。"],
  ]),
  h("3. 业务 Agent 与公共底座关系"),
  diagramFlows(), caption("图 2：三类核心业务流程与公共底座关系"),
  h("3.1 指标体系构建 Agent"),
  p("用于表结构理解和指标体系生成。它通过 Schema Slimming 避免大 JSON 直塞模型，通过业务域 Map-Reduce 做指标推导，通过可行性检查和人工确认保证结果可落地。"),
  h("3.2 Excel 知识库补全 Agent"),
  p("用于基于结构化 Excel 知识库的批量属性回填。主路径是主键精确匹配和批量回填，RAG/LLM 只用于字段别名、模糊兜底、异常说明和人工确认辅助。"),
  h("3.3 RAG 问答 Agent"),
  p("用于非结构化知识问答和引用回答。通过 Parser、Chunk、pgvector、rerank 和 AnswerBuilder 提供可追溯答案。"),
  h("4. 统一数据流与存储"),
  diagramData(), caption("图 3：统一数据流与存储模型"),
  h("4.1 核心数据表"),
  table(["表名", "关键字段", "作用"], [
    ["agent_templates", "agent_type, version, graph_config, input_schema, output_schema", "业务 Agent 模板注册。"],
    ["agent_runs", "run_id, agent_type, user_id, status, task_context, final_result", "一次 Agent 执行主记录。"],
    ["tool_calls", "run_id, node_id, tool_name, args_hash, result_ref, latency_ms, status", "工具调用审计与回放。"],
    ["model_calls", "run_id, model_name, prompt_hash, token_in, token_out, latency_ms, cost", "模型调用成本与性能分析。"],
    ["rag_chunks", "chunk_id, collection_id, chunk_text, embedding, metadata, source_ref", "RAG 向量检索主表。"],
    ["excel_master_rows", "row_id, collection_id, business_key, row_json, indexed_fields", "Excel 知识库补全主数据快照。"],
    ["enrichment_results", "run_id, row_no, business_key, match_status, filled_json, diff_json", "Excel 补全结果和异常明细。"],
    ["metric_artifacts", "artifact_id, run_id, domain, metric_json, review_status, version", "指标体系构建结果。"],
    ["audit_logs", "request_id, user_id, action, masked_payload, hit_refs, result_summary", "审计日志。"],
    ["evaluation_cases", "case_id, agent_type, input, expected, scoring_rule, tags", "回归评测样本。"],
  ]),
  h("5. 部署架构"),
  diagramDeployment(), caption("图 4：部署架构与离线交付"),
  h("6. 模块详细设计"),
  table(["模块", "职责", "关键实现"], [
    ["Agent API", "提供 REST/SSE/异步任务接口", "FastAPI、Pydantic、上传文件、任务状态查询。"],
    ["LangGraph Runtime", "执行 Agent 状态机", "Checkpoint、Replay、Map-Reduce、HITL。"],
    ["Tool Registry", "管理工具清单和权限", "Manifest、Pydantic Schema、超时、重试、审计。"],
    ["MCP Servers", "标准化外部系统连接", "database-mcp、file-mcp、knowledge-mcp、metrics-mcp。"],
    ["Knowledge Service", "知识解析和检索", "Parser、Chunk、Exact Lookup、pgvector、rerank、Field Dict。"],
    ["Model Gateway", "模型路由和统一接口", "CPU/API/GPU 三模式，OpenAI Compatible API。"],
    ["Observability", "监控、日志、Trace、评测", "OpenTelemetry、Prometheus、Grafana、Phoenix。"],
  ]),
  h("7. 安全与性能"),
  bullet("所有工具入参必须 Schema 校验，禁止用户输入直接拼接 SQL 或 metadata filter。"),
  bullet("Excel 补全主路径走结构化精确查询，避免不必要的模型调用。"),
  bullet("指标构建通过 Schema Slimming + Map-Reduce 解决大 JSON 瓶颈。"),
  bullet("RAG 问答通过 pgvector + rerank + 引用校验降低幻觉。"),
  bullet("全链路记录 request_id、run_id、tool_call_id、model_call_id，支持审计与回放。"),
].join("");

const selectionBody = [
  `<w:p><w:pPr><w:pStyle w:val="Title"/><w:jc w:val="center"/></w:pPr><w:r><w:t>公共底层智能体平台技术选型方案（更新版）</w:t></w:r></w:p>`,
  p("结合最新架构图逐层给出组件、版本、作用、选型理由、替代方案和离线部署注意事项。版本以 2026-05-16 可查公开版本为基准，内网部署需锁版本。"),
  h("1. 总体选型结论"),
  table(["层级", "推荐组件", "推荐版本", "作用"], [
    ["开发语言", "Python + Java", "Python 3.12.x；Java 17", "Python 承载 AI/Agent/RAG；Java 承载管理后台和企业系统集成。"],
    ["后端接入", "Spring Boot", "3.3.x LTS线", "公司 Java 主栈，用于权限、用户、配置、管理台。"],
    ["Agent 编排", "LangGraph", "1.2.0", "状态机、Checkpoint、Replay、多步骤 Agent。"],
    ["LLM 抽象", "LangChain", "1.3.0", "模型、消息、工具抽象；只作为适配层，不重业务绑定。"],
    ["API 服务", "FastAPI + Uvicorn", "FastAPI 0.136.1；Uvicorn 0.34.x+", "异步 API、SSE、自动文档、Pydantic 校验。"],
    ["数据校验", "Pydantic", "2.12.x", "TaskContext、Tool 参数、输出 JSON Schema。"],
    ["任务队列", "Redis + Celery/RQ", "Redis 7.4.x；Celery 5.6.x", "长任务、解析、embedding、补全任务、失败重试。"],
    ["关系/向量库", "PostgreSQL + pgvector", "PostgreSQL 16/17；pgvector 0.8.2", "结构化查询、JSONB、全文/模糊、向量检索一体。"],
    ["模型推理", "llama.cpp / vLLM", "CPU验证：llama.cpp 0.3.x；GPU生产：vLLM 0.20.x", "前期 CPU 跑通，生产 GPU 高吞吐。"],
    ["Embedding/Rerank", "bge-m3 + bge-reranker-v2-m3", "模型文件离线固化", "中文企业知识检索和重排。"],
    ["可观测", "OpenTelemetry + Prometheus + Grafana + Phoenix", "OTel 1.30.x+；Prom/Grafana 稳定版", "Trace、指标、日志、LLM 调用观测。"],
    ["安全脱敏", "Presidio + 自定义规则", "Presidio 2.2.x+", "PII 脱敏、审计、敏感字段保护。"],
  ]),
  h("2. 为什么选择 Python + Java 双栈"),
  table(["维度", "Java", "Python", "结论"], [
    ["企业工程", "权限、组织、后台、审批、集成能力成熟", "需要补工程规范", "Java 做接入和管理面。"],
    ["Agent/RAG 生态", "Spring AI、LangChain4j 可用但更新慢", "LangGraph、LangChain、vLLM、Embedding 生态完整", "Python 做智能体核心。"],
    ["文档/Excel 解析", "POI/Tika 稳定但组合重", "pandas/openpyxl/PyMuPDF/python-docx 更灵活", "知识服务用 Python。"],
    ["模型推理", "通常调用外部服务", "llama.cpp、vLLM、transformers 支持好", "Model Gateway 用 Python。"],
    ["最终边界", "业务系统、管理后台、权限", "Agent Runtime、Knowledge、Model Gateway", "HTTP/gRPC 解耦。"],
  ]),
  h("3. 分层组件选型"),
  h("3.1 接入与网关层", 2),
  table(["组件", "版本", "作用", "选型理由", "替代方案"], [
    ["Nginx", "1.26.x+", "反向代理、静态资源、TLS", "轻量稳定，单机虚机足够。", "APISIX"],
    ["APISIX", "3.10.x+", "API 网关、限流、灰度、鉴权插件", "后续多系统接入更方便。", "Nginx + 自研中间件"],
    ["Spring Boot", "3.3.x", "管理后台、用户权限、配置管理", "贴合公司 Java 主栈。", "FastAPI Admin"],
  ]),
  h("3.2 Agent Runtime 层", 2),
  table(["组件", "版本", "作用", "选型理由", "注意事项"], [
    ["FastAPI", "0.136.1", "Agent API、上传、任务查询、SSE", "性能好、Pydantic 生态好。", "离线锁 wheel。"],
    ["LangGraph", "1.2.0", "状态机、Checkpoint、Replay", "适合复杂 Agent 流程和人工确认。", "关注 checkpoint 依赖安全补丁。"],
    ["LangChain", "1.3.0", "模型/工具抽象", "与 LangGraph 协同，生态成熟。", "只做适配层，避免深度耦合。"],
    ["Pydantic", "2.12.x", "Schema 校验", "强类型输入输出约束。", "LLM 输出必须二次校验。"],
    ["Redis", "7.4.x", "缓存、队列、限流计数", "单机部署简单。", "生产可考虑 Redis Sentinel。"],
    ["Celery/RQ", "Celery 5.6.x / RQ 2.x", "异步任务", "解析/补全/embedding 适合异步。", "轻量场景可先 RQ。"],
  ]),
  h("3.3 Knowledge Service 层", 2),
  table(["组件", "版本", "作用", "选型理由"], [
    ["pandas", "2.2.x", "Excel/CSV 数据处理", "表格处理成熟。"],
    ["openpyxl", "3.1.x", "xlsx 读写", "保留 sheet、单元格、样式能力。"],
    ["python-docx", "1.1.x", "Word 解析", "轻量解析 docx。"],
    ["python-pptx", "1.0.x", "PPT 解析", "支持 slide 级文本抽取。"],
    ["PyMuPDF", "1.24.x+", "PDF 解析", "速度快、页级处理方便。"],
    ["PostgreSQL JSONB/pg_trgm", "随 PostgreSQL", "字段查询、模糊匹配", "Excel 补全和字段别名场景关键。"],
    ["pgvector", "0.8.2", "语义召回", "当前规模下无需引入 ES。"],
  ]),
  h("3.4 Model Gateway 层", 2),
  table(["组件/模型", "版本/规格", "作用", "选型理由"], [
    ["llama.cpp", "0.3.x+", "CPU 功能验证", "无 GPU 时跑通链路。"],
    ["vLLM", "0.20.x", "GPU 推理服务", "高吞吐、OpenAI 兼容。"],
    ["Qwen 7B/14B", "GGUF/API/量化权重", "分类、路由、字段别名判断", "成本低，适合轻任务。"],
    ["Qwen 14B/32B 或同级模型", "API 验证后再定", "指标推导、复杂解释", "先验证效果再买 GPU。"],
    ["bge-m3", "离线模型", "Embedding", "中文和多语言检索稳定。"],
    ["bge-reranker-v2-m3", "离线模型", "Rerank", "提高召回结果精度。"],
  ]),
  h("3.5 数据与治理层", 2),
  table(["组件", "版本", "作用", "选型理由"], [
    ["PostgreSQL", "16.x / 17.x", "业务数据、审计、任务、JSONB、向量扩展", "减少组件数量，适合内网单机起步。"],
    ["pgvector", "0.8.2", "向量检索", "官方发布修复 HNSW 并行构建安全问题，建议升级。"],
    ["OpenTelemetry", "1.30.x+", "Trace 标准", "打通 API、Runtime、Tool、Model。"],
    ["Prometheus + Grafana", "稳定版", "指标监控", "成熟易部署。"],
    ["Phoenix", "最新稳定版", "LLM Trace 和评测", "离线友好，适合 Prompt/检索调试。"],
    ["Presidio", "2.2.x+", "脱敏", "可扩展中文规则。"],
  ]),
  h("4. PostgreSQL + pgvector 是否足够"),
  bullet("当前需求核心包括指标构建、Excel 知识库补全、少量 RAG 问答，知识库规模不大，PostgreSQL + pgvector 足够。"),
  bullet("Excel 补全主路径是结构化精确查询，依赖 B-tree、JSONB GIN、pg_trgm，而不是向量库。"),
  bullet("RAG 问答使用 pgvector HNSW 召回即可，后续只有在大规模全文搜索、高亮、复杂中文分词、高并发搜索出现时再引入 Elasticsearch/OpenSearch。"),
  h("5. 最低环境配置"),
  table(["阶段", "配置", "可验证内容", "说明"], [
    ["CPU 最小验证", "16C / 64GB RAM / 500GB SSD", "Agent API、Runtime、Tool、Excel补全、RAG入库、审计", "模型慢速验证，不承诺延迟。"],
    ["CPU 推荐验证", "32C / 128GB RAM / 1TB SSD", "几万字段、批量 Excel、100 QPS 非模型接口压测", "适合内网 PoC。"],
    ["GPU 生产起步", "32C / 128GB RAM / 2TB SSD + L20 48GB 或 A100 40GB", "14B/32B 量化模型推理、embedding/rerank", "模型确认后采购。"],
  ]),
  h("6. 离线包清单"),
  table(["包", "内容", "说明"], [
    ["Docker 镜像包", "gateway、agent-api、agent-worker、knowledge-worker、postgres、redis、observability", "docker save/load。"],
    ["Python wheelhouse", "FastAPI、LangGraph、LangChain、Pydantic、pandas、openpyxl、PyMuPDF、psycopg、Presidio", "pip --no-index 安装。"],
    ["模型包", "bge-m3、reranker、Qwen GGUF/API配置/vLLM权重", "按阶段固化。"],
    ["SQL 包", "schema、索引、初始化字典、审计表、评测样本", "一键初始化。"],
    ["配置包", "agent templates、tool manifests、prompts、JSON Schema", "平台扩展资产。"],
  ]),
  h("7. 版本依据与安全提醒"),
  bullet("LangChain PyPI Release History 显示 1.3.0 于 2026-05-12 发布。"),
  bullet("LangGraph 1.2.0 已满足 1.0+ 要求；文档建议锁定该版本线并关注 checkpoint 组件安全补丁。"),
  bullet("FastAPI PyPI 显示 0.136.1 于 2026-04-23 发布。"),
  bullet("vLLM PyPI/Release 信息显示 0.20.x 为 2026-05 附近稳定版本线，GPU 生产建议按 CUDA/PyTorch 兼容性单独压测。"),
  bullet("pgvector 0.8.2 官方 PostgreSQL 新闻说明修复了并行 HNSW 索引构建相关安全问题，建议使用 0.8.2+。"),
].join("");

const arch = makeDocx("公共底层智能体平台架构设计文档_更新版.docx", archBody);
const tech = makeDocx("公共底层智能体平台技术选型方案_更新版.docx", selectionBody);
console.log(arch);
console.log(tech);
