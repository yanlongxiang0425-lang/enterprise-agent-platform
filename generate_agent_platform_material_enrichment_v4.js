const fs = require("fs");
const path = require("path");
const { execFileSync } = require("child_process");

const OUT = path.resolve("交付物");
const BUILD = path.resolve(".build_material_enrichment_v4");
fs.mkdirSync(OUT, { recursive: true });

const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
const p = (text, style = "") => `<w:p><w:pPr>${style ? `<w:pStyle w:val="${style}"/>` : ""}<w:spacing w:after="120"/></w:pPr><w:r><w:t xml:space="preserve">${esc(text)}</w:t></w:r></w:p>`;
const h = (text, level = 1) => p(text, `Heading${level}`);
const bullet = (text) => `<w:p><w:pPr><w:pStyle w:val="ListParagraph"/><w:ind w:left="420"/><w:spacing w:after="80"/></w:pPr><w:r><w:t xml:space="preserve">• ${esc(text)}</w:t></w:r></w:p>`;
const caption = (text) => `<w:p><w:pPr><w:jc w:val="center"/></w:pPr><w:r><w:rPr><w:color w:val="64748B"/><w:sz w:val="18"/></w:rPr><w:t>${esc(text)}</w:t></w:r></w:p>`;

function table(headers, rows) {
  const width = Math.max(1400, Math.floor(14200 / headers.length));
  const tr = (cells, header = false) =>
    `<w:tr>${cells.map((c) => `<w:tc><w:tcPr><w:tcW w:w="${width}" w:type="dxa"/>${header ? '<w:shd w:fill="E2E8F0"/>' : ""}</w:tcPr><w:p><w:r>${header ? "<w:rPr><w:b/></w:rPr>" : ""}<w:t xml:space="preserve">${esc(c)}</w:t></w:r></w:p></w:tc>`).join("")}</w:tr>`;
  return `<w:tbl><w:tblPr><w:tblW w:w="0" w:type="auto"/><w:tblBorders><w:top w:val="single" w:sz="6" w:color="CBD5E1"/><w:left w:val="single" w:sz="6" w:color="CBD5E1"/><w:bottom w:val="single" w:sz="6" w:color="CBD5E1"/><w:right w:val="single" w:sz="6" w:color="CBD5E1"/><w:insideH w:val="single" w:sz="6" w:color="CBD5E1"/><w:insideV w:val="single" w:sz="6" w:color="CBD5E1"/></w:tblBorders></w:tblPr>${tr(headers, true)}${rows.map((r) => tr(r)).join("")}</w:tbl>`;
}

function vmlDiagram(widthPt, heightPt, coordW, coordH, body) {
  return `<w:p><w:r><w:pict>
  <v:group style="width:${widthPt}pt;height:${heightPt}pt" coordsize="${coordW},${coordH}">
    ${body}
  </v:group>
  </w:pict></w:r></w:p>`;
}

function shape(id, x, y, w, h, title, lines, fill = "#F8FAFC", stroke = "#334155") {
  const text = [title, ...(lines || [])].map((t, i) =>
    `<w:p><w:pPr><w:jc w:val="center"/></w:pPr><w:r><w:rPr>${i === 0 ? "<w:b/>" : ""}<w:sz w:val="${i === 0 ? "20" : "16"}"/><w:color w:val="${i === 0 ? "111827" : "475569"}"/></w:rPr><w:t>${esc(t)}</w:t></w:r></w:p>`
  ).join("");
  return `<v:roundrect id="${id}" style="position:absolute;left:${x};top:${y};width:${w};height:${h}" arcsize="10%" fillcolor="${fill}" strokecolor="${stroke}" strokeweight="1.4pt">
    <v:textbox inset="6pt,5pt,6pt,4pt"><w:txbxContent>${text}</w:txbxContent></v:textbox>
  </v:roundrect>`;
}

function lane(id, x, y, w, h, title, fill = "#F8FAFC", stroke = "#CBD5E1") {
  return `<v:roundrect id="${id}" style="position:absolute;left:${x};top:${y};width:${w};height:${h}" arcsize="6%" fillcolor="${fill}" strokecolor="${stroke}" strokeweight="1pt">
    <v:textbox inset="9pt,6pt,6pt,3pt"><w:txbxContent><w:p><w:r><w:rPr><w:b/><w:sz w:val="22"/><w:color w:val="0F172A"/></w:rPr><w:t>${esc(title)}</w:t></w:r></w:p></w:txbxContent></v:textbox>
  </v:roundrect>`;
}

function line(id, x1, y1, x2, y2, color = "#64748B") {
  return `<v:line id="${id}" style="position:absolute" from="${x1},${y1}" to="${x2},${y2}" strokecolor="${color}" strokeweight="1.6pt"><v:stroke endarrow="block"/></v:line>`;
}

function label(id, x, y, text, color = "#334155") {
  return `<v:shape id="${id}" type="#_x0000_t202" style="position:absolute;left:${x};top:${y};width:260;height:32" stroked="f" filled="f">
    <v:textbox inset="0,0,0,0"><w:txbxContent><w:p><w:r><w:rPr><w:sz w:val="16"/><w:color w:val="${color.replace("#", "")}"/></w:rPr><w:t>${esc(text)}</w:t></w:r></w:p></w:txbxContent></v:textbox>
  </v:shape>`;
}

function titleBox(id, x, y, text, sub) {
  return `<v:shape id="${id}" type="#_x0000_t202" style="position:absolute;left:${x};top:${y};width:1600;height:70" stroked="f" filled="f">
    <v:textbox inset="0,0,0,0"><w:txbxContent>
      <w:p><w:r><w:rPr><w:b/><w:sz w:val="32"/><w:color w:val="0F172A"/></w:rPr><w:t>${esc(text)}</w:t></w:r></w:p>
      <w:p><w:r><w:rPr><w:sz w:val="18"/><w:color w:val="64748B"/></w:rPr><w:t>${esc(sub)}</w:t></w:r></w:p>
    </w:txbxContent></v:textbox>
  </v:shape>`;
}

function diagramOverall() {
  let b = titleBox("t1", 40, 20, "公共智能体平台技术架构（修正版）", "第二个需求修正为：基于 Excel 知识库的物料属性批量补全，而非离线 RAG 问答。");
  b += lane("l1", 40, 110, 1670, 125, "应用接入层");
  b += shape("a1", 90, 160, 300, 48, "Java 管理后台", ["任务提交 / 知识库管理"], "#DBEAFE", "#2563EB");
  b += shape("a2", 430, 160, 300, 48, "Web / OpenAPI", ["上传待补全 Excel"], "#DBEAFE", "#2563EB");
  b += shape("a3", 770, 160, 300, 48, "指标体系入口", ["table_json / prompt"], "#DBEAFE", "#2563EB");
  b += shape("a4", 1110, 160, 300, 48, "物料补全入口", ["material_id 批量回填"], "#DBEAFE", "#2563EB");
  b += shape("a5", 1450, 160, 210, 48, "API Gateway", ["APISIX / Nginx"], "#E0F2FE", "#0284C7");

  b += lane("l2", 40, 270, 1670, 170, "公共 Agent Runtime 层");
  b += shape("r1", 90, 335, 290, 65, "Agent API", ["FastAPI / SSE / Async"], "#DCFCE7", "#16A34A");
  b += shape("r2", 430, 335, 330, 65, "LangGraph Runtime", ["状态机 / Checkpoint / Replay"], "#DCFCE7", "#16A34A");
  b += shape("r3", 810, 335, 270, 65, "Task Queue", ["Redis + Celery/RQ"], "#DCFCE7", "#16A34A");
  b += shape("r4", 1130, 335, 250, 65, "Policy Guard", ["权限 / 脱敏 / 数据域"], "#FFE4E6", "#E11D48");
  b += shape("r5", 1430, 335, 230, 65, "Audit Replay", ["Trace / 回放 / 评测"], "#ECFDF5", "#059669");

  b += lane("l3", 40, 475, 805, 205, "业务 Agent 模板层");
  b += shape("m1", 90, 540, 320, 80, "指标体系构建 Agent", ["Schema 瘦身 / 业务域分类", "指标推导 / 人工确认"], "#EFF6FF", "#2563EB");
  b += shape("m2", 470, 540, 320, 80, "物料属性补全 Agent", ["物料ID识别 / 精确匹配", "属性回填 / 差异报告"], "#F0FDF4", "#16A34A");

  b += lane("l4", 905, 475, 805, 205, "能力与服务层");
  b += shape("s1", 950, 540, 220, 80, "Tool Registry", ["强 Schema 工具"], "#FEF3C7", "#D97706");
  b += shape("s2", 1210, 540, 220, 80, "Knowledge Service", ["Excel KB / 字段字典"], "#F3E8FF", "#7C3AED");
  b += shape("s3", 1470, 540, 200, 80, "Model Gateway", ["分类 / 解释 / 兜底"], "#FFE4E6", "#E11D48");

  b += lane("l5", 40, 720, 1670, 190, "数据存储与离线交付层");
  b += shape("d1", 90, 785, 290, 70, "PostgreSQL + pgvector", ["material_master / material_attrs", "rag_chunks / metric_artifacts"], "#FFFFFF", "#334155");
  b += shape("d2", 430, 785, 270, 70, "物料知识库表", ["material_id 精确索引", "属性列 / row_json"], "#FFFFFF", "#16A34A");
  b += shape("d3", 750, 785, 250, 70, "Redis", ["任务队列 / 缓存"], "#FFFFFF", "#EA580C");
  b += shape("d4", 1050, 785, 290, 70, "文件与模型目录", ["Excel 文件 / 模型权重", "wheelhouse / docker tar"], "#FFFFFF", "#0284C7");
  b += shape("d5", 1390, 785, 270, 70, "Observability", ["OTel / Prometheus", "Grafana / Phoenix"], "#FFFFFF", "#059669");

  b += line("x1", 1410, 184, 1450, 184);
  b += line("x2", 1555, 208, 1555, 335);
  b += line("x3", 380, 367, 430, 367);
  b += line("x4", 760, 367, 810, 367);
  b += line("x5", 1080, 367, 1130, 367);
  b += line("x6", 1380, 367, 1430, 367);
  b += line("x7", 595, 400, 595, 540);
  b += line("x8", 790, 580, 950, 580);
  b += line("x9", 1170, 580, 1210, 580);
  b += line("x10", 1430, 580, 1470, 580);
  b += line("x11", 1320, 620, 1320, 785);
  b += line("x12", 595, 620, 595, 785);
  return vmlDiagram(760, 430, 1750, 940, b);
}

function diagramMaterialFlow() {
  let b = titleBox("t2", 40, 20, "物料属性批量补全流程", "以物料ID为主键进行知识库精确匹配，RAG/LLM 仅用于字段别名、异常解释和低置信度兜底。");
  const steps = [
    ["上传待补全Excel", ["仅包含物料ID", "或少量已知字段"], "#DBEAFE", "#2563EB"],
    ["字段识别与校验", ["识别物料ID列", "空值/重复/格式校验"], "#E0F2FE", "#0284C7"],
    ["知识库精确匹配", ["material_id B-tree索引", "批量 SQL / upsert"], "#DCFCE7", "#16A34A"],
    ["属性补全", ["补全所有目标字段", "保留原始列和来源"], "#F0FDF4", "#16A34A"],
    ["异常处理", ["未命中/多命中/冲突", "字段别名/模糊兜底"], "#FEF3C7", "#D97706"],
    ["导出结果", ["补全Excel", "差异报告 / 审计日志"], "#F3E8FF", "#7C3AED"],
  ];
  steps.forEach((s, i) => {
    const x = 80 + i * 270;
    b += shape(`p${i}`, x, 190, 230, 115, s[0], s[1], s[2], s[3]);
    if (i < steps.length - 1) b += line(`pl${i}`, x + 230, 248, x + 270, 248, "#64748B");
  });
  b += lane("kb", 260, 390, 1230, 190, "物料知识库与检索策略");
  b += shape("k1", 315, 455, 260, 65, "material_master", ["物料ID / 名称 / 分类 / 状态"], "#FFFFFF", "#16A34A");
  b += shape("k2", 625, 455, 260, 65, "material_attrs", ["属性字段 / row_json / 来源版本"], "#FFFFFF", "#16A34A");
  b += shape("k3", 935, 455, 230, 65, "field_dictionary", ["字段别名 / 目标列映射"], "#FFFFFF", "#7C3AED");
  b += shape("k4", 1215, 455, 220, 65, "audit_logs", ["命中行 / 异常 / 操作人"], "#FFFFFF", "#059669");
  b += line("kb1", 780, 305, 780, 455, "#16A34A");
  b += line("kb2", 1325, 305, 1325, 455, "#D97706");
  b += label("lab1", 690, 340, "主路径：物料ID精确查询", "#166534");
  b += label("lab2", 1180, 340, "兜底：字段别名/异常解释", "#92400E");
  return vmlDiagram(760, 330, 1750, 650, b);
}

function diagramAgentTemplate() {
  let b = titleBox("t3", 40, 20, "两个业务 Agent 的模板化编排", "公共 Runtime 不变，差异通过 Agent Template、Tool 集合和输出 Schema 表达。");
  b += lane("left", 60, 120, 780, 620, "指标体系构建 Agent");
  const left = [
    ["normalize_schema", "表结构归一化"],
    ["domain_classify", "业务域分类"],
    ["metric_retrieve", "指标知识检索"],
    ["metric_generate", "指标候选生成"],
    ["feasibility_check", "可行性复评"],
    ["hitl_review", "人工确认发布"],
  ];
  left.forEach((s, i) => {
    const y = 185 + i * 78;
    b += shape(`l${i}`, 130, y, 590, 48, s[0], [s[1]], "#FFFFFF", "#2563EB");
    if (i < left.length - 1) b += line(`ll${i}`, 425, y + 48, 425, y + 65, "#2563EB");
  });
  b += lane("right", 910, 120, 780, 620, "物料属性补全 Agent");
  const right = [
    ["parse_input_excel", "解析待补全Excel"],
    ["detect_material_id", "识别物料ID列"],
    ["lookup_material_master", "批量精确匹配知识库"],
    ["fill_attributes", "补全目标字段"],
    ["validate_diff", "校验差异和异常"],
    ["export_excel_report", "导出补全Excel和报告"],
  ];
  right.forEach((s, i) => {
    const y = 185 + i * 78;
    b += shape(`r${i}`, 980, y, 590, 48, s[0], [s[1]], "#FFFFFF", "#16A34A");
    if (i < right.length - 1) b += line(`rl${i}`, 1275, y + 48, 1275, y + 65, "#16A34A");
  });
  b += shape("base", 395, 790, 960, 70, "公共底座", ["LangGraph Runtime · Tool Registry · Knowledge Service · Model Gateway · Audit · Evaluation"], "#FEF3C7", "#D97706");
  b += line("base1", 425, 740, 760, 790, "#D97706");
  b += line("base2", 1275, 740, 990, 790, "#D97706");
  return vmlDiagram(760, 410, 1750, 900, b);
}

function diagramDeploy() {
  let b = titleBox("t4", 40, 20, "内网离线部署拓扑", "单机虚机先跑通功能；模型确认后仅替换 Model Gateway 后端为 GPU/vLLM。");
  b += lane("vm", 60, 120, 1630, 600, "单机虚拟机 / 内网环境");
  const comps = [
    [110, 190, "gateway", ["Nginx/APISIX", "80/443"]],
    [390, 190, "agent-api", ["FastAPI", "REST/SSE"]],
    [670, 190, "agent-worker", ["LangGraph", "Celery/RQ"]],
    [950, 190, "knowledge-worker", ["Excel解析", "补全任务"]],
    [1230, 190, "model-gateway", ["CPU/API/GPU", "OpenAI API"]],
    [110, 430, "PostgreSQL", ["material库", "pgvector/audit"]],
    [390, 430, "Redis", ["cache/queue"]],
    [670, 430, "File Repo", ["Excel文件", "离线包/模型"]],
    [950, 430, "Observability", ["Prom/Grafana", "Phoenix"]],
    [1230, 430, "Evaluation", ["样本/回归", "灰度/回滚"]],
  ];
  comps.forEach((c, i) => b += shape(`c${i}`, c[0], c[1], 220, 95, c[2], c[3], i < 5 ? "#DCFCE7" : "#FFFFFF", i < 5 ? "#16A34A" : "#334155"));
  b += line("d1", 330, 238, 390, 238);
  b += line("d2", 610, 238, 670, 238);
  b += line("d3", 890, 238, 950, 238);
  b += line("d4", 1170, 238, 1230, 238);
  b += line("d5", 780, 285, 780, 430);
  b += line("d6", 1060, 285, 1060, 430);
  b += shape("conf1", 110, 770, 680, 70, "CPU功能验证最低配置", ["16C / 64GB / 500GB SSD：跑通解析、补全、Agent、审计；模型慢速验证即可"], "#FFFFFF", "#334155");
  b += shape("conf2", 920, 770, 680, 70, "GPU生产建议配置", ["32C / 128GB / 2TB SSD + L20 48GB 或 A100 40GB，按模型压测确认"], "#FFFFFF", "#334155");
  return vmlDiagram(760, 430, 1750, 900, b);
}

function image(id, name, h = 5000000) {
  return `<w:p><w:pPr><w:jc w:val="center"/></w:pPr><w:r><w:drawing><wp:inline distT="0" distB="0" distL="0" distR="0" xmlns:wp="http://schemas.openxmlformats.org/drawingml/2006/wordprocessingDrawing"><wp:extent cx="9300000" cy="${h}"/><wp:docPr id="${id}" name="${name}"/><a:graphic xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main"><a:graphicData uri="http://schemas.openxmlformats.org/drawingml/2006/picture"><pic:pic xmlns:pic="http://schemas.openxmlformats.org/drawingml/2006/picture"><pic:nvPicPr><pic:cNvPr id="${id}" name="${name}"/><pic:cNvPicPr/></pic:nvPicPr><pic:blipFill><a:blip r:embed="rId${id}" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"/><a:stretch><a:fillRect/></a:stretch></pic:blipFill><pic:spPr><a:xfrm><a:off x="0" y="0"/><a:ext cx="9300000" cy="${h}"/></a:xfrm><a:prstGeom prst="rect"><a:avLst/></a:prstGeom></pic:spPr></pic:pic></a:graphicData></a:graphic></wp:inline></w:drawing></w:r></w:p>`;
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
  `<w:p><w:pPr><w:pStyle w:val="Title"/><w:jc w:val="center"/></w:pPr><w:r><w:t>公共底层智能体框架详细设计方案（物料补全修正版）</w:t></w:r></w:p>`,
  p("本版修正第二个需求：不是离线 RAG 问答，而是基于 Excel 知识库的物料主数据/属性字段批量补全。流程图采用 Word VML 原生形状绘制，打开后更接近 Word 专用流程图表达。"),
  h("1. 需求修正说明"),
  bullet("原理解偏差：之前将需求描述为离线知识库 RAG/字段填充，偏向问答式检索。"),
  bullet("修正后的真实需求：提供物料知识库 Excel，里面包含物料基本信息和属性信息；用户上传待补全 Excel，通常只有物料 ID；系统根据物料 ID 在知识库中匹配，补全该 Excel 的所有字段数据。"),
  bullet("技术定位：这是“基于结构化知识库的批量数据补全/属性回填”需求，主路径是精确检索和结构化查询，不应把 RAG/LLM 作为主链路。"),
  bullet("RAG/LLM 的合理位置：字段别名映射、物料描述模糊兜底、未命中原因解释、补全报告生成、低置信度人工确认辅助。"),
  h("2. 修正后的总体技术架构"),
  diagramOverall(),
  caption("图 1：公共智能体平台技术架构（Word 原生流程图风格）"),
  h("2.1 架构说明"),
  table(["层级", "组件", "职责"], [
    ["应用接入层", "Java 管理后台、Web/OpenAPI、指标体系入口、物料补全入口", "提交任务、上传 Excel、管理知识库、查看补全结果。"],
    ["公共 Agent Runtime", "FastAPI、LangGraph、Redis/Celery、Policy Guard、Audit Replay", "统一承载业务 Agent 的任务编排、异步执行、权限、审计和回放。"],
    ["业务 Agent 模板层", "指标体系构建 Agent、物料属性补全 Agent", "两个业务能力以 Agent Template 形式运行在同一底座上。"],
    ["能力与服务层", "Tool Registry、Knowledge Service、Model Gateway", "工具注册、Excel 知识库解析/查询、模型路由和兜底能力。"],
    ["数据存储与离线交付层", "PostgreSQL、物料知识库表、Redis、文件模型目录、可观测组件", "存储物料主数据、属性数据、任务、审计、文件和运行指标。"],
  ]),
  h("3. 物料属性批量补全 Agent 设计"),
  diagramMaterialFlow(),
  caption("图 2：物料属性批量补全流程"),
  h("3.1 主流程说明"),
  table(["步骤", "处理逻辑", "技术重点"], [
    ["上传待补全 Excel", "用户上传只有物料 ID 或部分字段的 Excel", "保留原文件、sheet、行号、列名，生成 batch_id。"],
    ["字段识别与校验", "识别物料 ID 列，检查空值、重复值、格式异常", "字段别名可用 field_dictionary 辅助，例如物料编码=物料ID。"],
    ["知识库精确匹配", "基于 material_id 批量查询物料知识库", "主路径使用 PostgreSQL B-tree 索引，不走向量。"],
    ["属性补全", "将知识库中的物料基本信息和属性字段回填到目标 Excel", "按配置决定覆盖空值、保留原值或生成差异列。"],
    ["异常处理", "处理未命中、多命中、冲突字段、字段缺失", "生成异常 sheet 和低置信度待确认列表。"],
    ["导出结果", "输出补全后的 Excel 和差异报告", "记录命中 row_id、来源版本、补全时间、操作人。"],
  ]),
  h("3.2 数据表设计"),
  table(["表名", "关键字段", "说明"], [
    ["material_master", "material_id, material_name, category, status, source_version", "物料主数据表，material_id 建唯一或高选择性索引。"],
    ["material_attributes", "material_id, attr_code, attr_name, attr_value, attr_unit, row_json", "物料属性表，适合属性列动态变化场景。"],
    ["material_row_snapshot", "material_id, row_json, checksum, source_file, sheet_name, row_no", "保留知识库 Excel 原始整行数据，方便全字段回填。"],
    ["field_dictionary", "field_name, aliases, target_column, data_type, required", "字段别名和目标列映射。"],
    ["enrichment_batches", "batch_id, file_name, status, total_rows, hit_rows, miss_rows, conflict_rows", "补全任务批次状态。"],
    ["enrichment_results", "batch_id, row_no, material_id, match_status, filled_json, diff_json, error_msg", "每一行补全结果和异常原因。"],
    ["audit_logs", "request_id, user_id, action, batch_id, hit_refs, masked_payload", "审计日志。"],
  ]),
  h("3.3 检索策略"),
  bullet("物料 ID 明确时：走 PostgreSQL 精确查询，基于 material_id 的 B-tree 索引批量查询。"),
  bullet("物料 ID 列名不一致时：先用字段字典匹配，必要时用小模型判断字段别名。"),
  bullet("物料 ID 缺失但有名称/描述时：可启用 pg_trgm 或 pgvector 做候选召回，但必须进入低置信度人工确认。"),
  bullet("补全字段很多且知识库列动态变化时：使用 row_json 保存整行，结合字段映射配置生成输出列。"),
  h("4. 两个业务 Agent 的模板化编排"),
  diagramAgentTemplate(),
  caption("图 3：两个业务 Agent 的模板化编排"),
  h("5. 接口设计"),
  table(["接口", "方法", "说明", "返回"], [
    ["/api/v1/material-kb/import", "POST", "导入物料知识库 Excel，解析为 material_master/material_attributes/snapshot", "kb_batch_id"],
    ["/api/v1/material-enrichment/runs", "POST", "上传待补全 Excel，创建补全任务", "run_id/batch_id"],
    ["/api/v1/material-enrichment/runs/{run_id}", "GET", "查询补全任务状态、命中率、异常统计", "run_detail"],
    ["/api/v1/material-enrichment/runs/{run_id}/download", "GET", "下载补全后的 Excel", "file_url"],
    ["/api/v1/material-enrichment/runs/{run_id}/exceptions", "GET", "查看未命中、多命中、冲突字段明细", "exception_rows"],
    ["/api/v1/hitl/{run_id}/actions", "POST", "人工确认低置信度匹配或冲突字段处理策略", "next_state"],
  ]),
  h("6. 部署架构"),
  diagramDeploy(),
  caption("图 4：内网离线部署拓扑"),
  h("7. 与 RAG/LLM 的边界"),
  table(["能力", "是否主路径", "使用位置"], [
    ["物料 ID 精确补全", "是", "PostgreSQL 批量精确查询，LLM 不参与。"],
    ["字段别名识别", "辅助", "字段字典优先，小模型兜底。"],
    ["物料名称/描述模糊匹配", "辅助", "pg_trgm/pgvector 召回候选，必须带置信度和人工确认。"],
    ["补全结果解释", "辅助", "LLM 生成异常说明、差异报告摘要。"],
    ["指标体系构建", "是", "复杂推理任务，LLM/RAG 是核心能力。"],
  ]),
  h("8. 实施建议"),
  table(["阶段", "目标", "产出"], [
    ["P0 物料知识库导入", "解析知识库 Excel，建立 material_master/material_attributes/snapshot", "知识库导入和校验报告。"],
    ["P1 精确补全主链路", "上传待补全 Excel，根据物料 ID 批量回填字段", "补全 Excel、异常 sheet、任务统计。"],
    ["P2 字段映射与异常处理", "完善字段别名、冲突策略、未命中处理和人工确认", "字段字典、HITL、差异报告。"],
    ["P3 公共 Agent 底座融合", "与指标体系构建 Agent 共用 Runtime、Tool、审计、观测", "统一平台版本。"],
    ["P4 模型兜底能力", "引入小模型/向量检索处理模糊字段和异常解释", "低置信度候选推荐能力。"],
  ]),
  h("9. 小结"),
  p("修正后，第二个需求的主线是物料知识库的结构化检索和批量属性补全。架构上应把 PostgreSQL 精确查询、物料快照 row_json、字段字典和差异报告作为核心，而不是把它当成离线 RAG 问答。RAG/LLM 在该场景中定位为辅助能力，用于字段别名、模糊召回、异常解释和人工确认辅助。"),
].join("");

const out = makeDocx("公共底层智能体框架详细设计方案_物料补全修正版.docx", body);
console.log(out);
