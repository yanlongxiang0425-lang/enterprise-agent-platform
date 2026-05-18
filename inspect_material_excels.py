from pathlib import Path
import sys
import json

sys.path.insert(0, str(Path.cwd() / ".vendor"))
import pandas as pd


FILES = [
    Path("/Users/yanlongxiang/Documents/Claude/Projects/AI物料测试/试点物料 AI/IOT PLM TV整机-TV成品-TV整机  100201.xls"),
    Path("/Users/yanlongxiang/Documents/Claude/Projects/AI物料测试/试点物料 AI/10整机-TV成品-TV整机 目标模板.xlsx"),
    Path("/Users/yanlongxiang/Documents/Claude/Projects/AI物料测试/试点物料 AI/10整机-TV成品-TV整机-数据清洗试点_何海珍 20260509.xlsx"),
    Path("/Users/yanlongxiang/Documents/Claude/Projects/AI测试文件/第1步：输入1-旧字段标准.xls"),
    Path("/Users/yanlongxiang/Documents/Claude/Projects/AI测试文件/第2步：输入2-新字段标准.xls"),
    Path("/Users/yanlongxiang/Documents/Claude/Projects/AI测试文件/第3步：根据第1步第2步输出-新旧字段标准映射表.xls"),
    Path("/Users/yanlongxiang/Documents/Claude/Projects/AI测试文件/第4步：输入3-旧料号信息.xls"),
    Path("/Users/yanlongxiang/Documents/Claude/Projects/AI测试文件/第5步：根据第3步输出和第4步输入3输出清洗结果表.xls"),
]


def clean(v):
    if pd.isna(v):
        return ""
    return str(v).strip()


def detect_header(df):
    best = 0
    best_score = -1
    for i in range(min(12, len(df))):
        vals = [clean(x) for x in df.iloc[i].tolist()]
        non_empty = [v for v in vals if v and not v.lower().startswith("unnamed")]
        keywords = sum(any(k in v for k in ["编码", "名称", "字段", "属性", "分类", "物料", "旧", "新", "标准", "品类"]) for v in non_empty)
        score = len(non_empty) + keywords * 2
        if score > best_score:
            best, best_score = i, score
    return best


def summarize_file(path):
    xls = pd.ExcelFile(path)
    out = {"file": str(path), "sheets": []}
    for sheet in xls.sheet_names:
        raw = pd.read_excel(path, sheet_name=sheet, header=None, dtype=str)
        raw = raw.dropna(how="all").dropna(axis=1, how="all")
        if raw.empty:
            out["sheets"].append({"sheet": sheet, "rows": 0, "cols": 0})
            continue
        header_idx = detect_header(raw)
        headers = [clean(x) or f"列{j+1}" for j, x in enumerate(raw.iloc[header_idx].tolist())]
        sample_rows = []
        for _, row in raw.iloc[header_idx + 1 : header_idx + 6].iterrows():
            vals = [clean(x) for x in row.tolist()]
            if any(vals):
                sample_rows.append(dict(zip(headers, vals)))
        out["sheets"].append({
            "sheet": sheet,
            "rows": int(raw.shape[0]),
            "cols": int(raw.shape[1]),
            "header_row_1based": header_idx + 1,
            "headers": headers,
            "sample_rows": sample_rows[:3],
        })
    return out


def main():
    summaries = []
    for path in FILES:
        try:
            summaries.append(summarize_file(path))
        except Exception as e:
            summaries.append({"file": str(path), "error": repr(e)})
    print(json.dumps(summaries, ensure_ascii=False, indent=2))


if __name__ == "__main__":
    main()
