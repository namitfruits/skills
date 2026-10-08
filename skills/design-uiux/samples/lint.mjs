#!/usr/bin/env node
// Soát bài mẫu của design-uiux:
//   node lint.mjs                    mọi sub-scope của SPEC có dòng checklist hay phép kiểm khác nhìn tới; bảng checklist
//                                    đúng ba cột; ô "Đạt khi" không có chữ cảm tính. Exit 1 nếu có lỗi.
//   node lint.mjs --compare <a> <b>  so cột Kết quả của hai result.md theo từng dòng Q<n> / G<n>. Exit 1 nếu có dòng lệch.
import { readFileSync, readdirSync, existsSync } from "node:fs";
import { join, dirname, basename } from "node:path";
import { fileURLToPath } from "node:url";

const samplesDir = dirname(fileURLToPath(import.meta.url));
const specPath = process.env.LINT_SPEC ?? join(samplesDir, "../SPEC.md");
const HEADER = ["Mã", "Mở file", "Đạt khi"];
const VAGUE = ["giống", "hợp lý", "rõ", "đẹp", "dễ", "phù hợp", "tốt", "ổn"];

const cells = (line) => line.trim().replace(/^\||\|$/g, "").split("|").map((cell) => cell.trim());
const codesIn = (cell) => [...cell.matchAll(/`([^`]+)`/g)].map((match) => match[1]);

// Dòng của các bảng nằm dưới một heading `## <title>`, tới heading `##` kế tiếp.
function tablesUnder(text, title) {
  const lines = text.split("\n");
  const start = lines.findIndex((line) => line.trim() === `## ${title}`);
  if (start < 0) return null;
  const end = lines.findIndex((line, i) => i > start && /^## /.test(line));
  const tables = [];
  let current = null;
  for (const line of lines.slice(start + 1, end < 0 ? undefined : end)) {
    if (line.trim().startsWith("|")) {
      if (!current) tables.push((current = { header: cells(line), rows: [] }));
      else if (!/^\|[\s|:-]+\|$/.test(line.trim())) current.rows.push(cells(line));
    } else current = null;
  }
  return tables;
}

function specCodes() {
  const text = readFileSync(specPath, "utf8");
  const section = text.split(/^## 2\. /m)[1]?.split(/^## 3\. /m)[0] ?? "";
  return [...section.matchAll(/^\s+- `(F\d+\.\d+)`/gm)].map((match) => match[1]);
}

function lint() {
  const spec = specCodes();
  const errors = [];
  const coveredBy = new Map(spec.map((code) => [code, []]));

  const readme = readFileSync(join(samplesDir, "README.md"), "utf8");
  const elsewhere = new Map();
  for (const table of tablesUnder(readme, "Phủ ở chỗ khác") ?? []) {
    for (const row of table.rows) for (const code of codesIn(row[0])) elsewhere.set(code, row[1]);
  }
  for (const code of elsewhere.keys()) if (!coveredBy.has(code)) errors.push(`README.md: "Phủ ở chỗ khác" ghi \`${code}\`, SPEC không có`);

  const samples = readdirSync(samplesDir, { withFileTypes: true })
    .filter((entry) => entry.isDirectory() && existsSync(join(samplesDir, entry.name, "sample.md")))
    .map((entry) => entry.name)
    .sort();
  let rowCount = 0;
  for (const sample of samples) {
    const file = `${sample}/sample.md`;
    const text = readFileSync(join(samplesDir, file), "utf8");
    const sections = ["Checklist", "Vòng góp ý"].map((title) => [title, tablesUnder(text, title)]);
    if (!sections[0][1]?.length) errors.push(`${file}: thiếu bảng dưới "## Checklist"`);
    for (const [title, tables] of sections) {
      for (const table of tables ?? []) {
        if (table.header.join("|") !== HEADER.join("|")) {
          errors.push(`${file} "${title}": bảng phải có đúng ba cột ${HEADER.join(" · ")}, đang là ${table.header.join(" · ")}`);
          continue;
        }
        table.rows.forEach((row, i) => {
          rowCount++;
          const where = `${file} "${title}" dòng ${i + 1}`;
          const codes = codesIn(row[0]);
          if (!codes.length && row[0] !== "—" && row[0] !== "`—`") errors.push(`${where}: cột Mã trống`);
          for (const code of codes.filter((code) => code !== "—")) {
            if (/^F\d+$/.test(code)) errors.push(`${where}: \`${code}\` là mã scope, ghi sub-scope`);
            else if (!coveredBy.has(code)) errors.push(`${where}: \`${code}\` không có trong SPEC`);
            else coveredBy.get(code).push(sample.slice(0, 2));
          }
          if (!row[1]) errors.push(`${where}: cột "Mở file" trống`);
          for (const word of VAGUE) {
            if (new RegExp(`(?<!\\p{L})${word}(?!\\p{L})`, "iu").test(row[2] ?? "")) errors.push(`${where}: "Đạt khi" có chữ cảm tính "${word}"`);
          }
        });
      }
    }
  }

  console.log("| Mã | Bài | Chỗ khác |\n| --- | --- | --- |");
  for (const [code, hits] of coveredBy) {
    console.log(`| ${code} | ${[...new Set(hits)].join(" ") || "—"} | ${elsewhere.get(code) ?? ""} |`);
    if (!hits.length && !elsewhere.has(code)) errors.push(`\`${code}\` chưa bài nào nhìn tới, cũng không có trong "Phủ ở chỗ khác" của README.md`);
  }
  if (errors.length) {
    for (const error of errors) console.error(`✗ ${error}`);
    process.exit(1);
  }
  console.log(`✓ ${spec.length} sub-scope · ${samples.length} bài · ${rowCount} dòng checklist`);
}

function results(path) {
  const rows = new Map();
  for (const line of readFileSync(path, "utf8").split("\n")) {
    const row = cells(line);
    if (line.trim().startsWith("|") && /^[QG]\d+$/.test(row[0])) rows.set(row[0], row[2]);
  }
  if (!rows.size) throw new Error(`${path}: không có dòng Q<n> / G<n> nào`);
  return rows;
}

function compare(a, b) {
  const [left, right] = [results(a), results(b)];
  const ids = [...new Set([...left.keys(), ...right.keys()])];
  const diffs = ids.filter((id) => left.get(id) !== right.get(id));
  for (const id of diffs) console.error(`✗ ${id}: ${basename(dirname(a))}/${basename(a)} "${left.get(id) ?? "thiếu"}" · ${basename(dirname(b))}/${basename(b)} "${right.get(id) ?? "thiếu"}"`);
  if (diffs.length) process.exit(1);
  console.log(`✓ ${ids.length} dòng cùng kết quả`);
}

const args = process.argv.slice(2);
if (args[0] === "--compare") {
  if (args.length !== 3) {
    console.error("cách dùng: node lint.mjs --compare <result.md> <result.md>");
    process.exit(2);
  }
  compare(args[1], args[2]);
} else lint();
