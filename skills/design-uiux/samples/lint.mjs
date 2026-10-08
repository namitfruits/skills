#!/usr/bin/env node
// Soát bài mẫu của design-uiux:
//   node lint.mjs                    mỗi bài có khối đề, checklist là danh sách 1–8 mục, không mục nào có mã yêu cầu
//                                    SPEC hay chữ cảm tính. Exit 1 nếu có lỗi.
//   node lint.mjs --compare <a> <b>  so cột Kết quả của hai result.md theo từng dòng C<n> / G<n>. Exit 1 nếu có dòng lệch.
import { readFileSync, readdirSync, existsSync } from "node:fs";
import { join, dirname, basename } from "node:path";
import { fileURLToPath } from "node:url";

const samplesDir = dirname(fileURLToPath(import.meta.url));
const MAX_ITEMS = 8;
const VAGUE = ["giống", "hợp lý", "rõ", "đẹp", "dễ", "phù hợp", "tốt", "ổn"];

const cells = (line) => line.trim().replace(/^\||\|$/g, "").split("|").map((cell) => cell.trim());

// Nội dung dưới một heading `## <title>`, tới heading `##` kế tiếp.
function section(text, title) {
  const parts = text.split(new RegExp(`^## ${title}\\s*$`, "m"));
  return parts.length < 2 ? null : parts[1].split(/^## /m)[0];
}

// Mục danh sách cấp một; dòng thụt vào là phần tiếp của mục trước.
function items(body) {
  const list = [];
  for (const line of body.split("\n")) {
    if (line.startsWith("- ")) list.push(line.slice(2));
    else if (/^\s+\S/.test(line) && list.length) list[list.length - 1] += ` ${line.trim()}`;
  }
  return list;
}

function lint() {
  const errors = [];
  const samples = readdirSync(samplesDir, { withFileTypes: true })
    .filter((entry) => entry.isDirectory() && existsSync(join(samplesDir, entry.name, "sample.md")))
    .map((entry) => entry.name)
    .sort();
  let itemCount = 0;
  for (const sample of samples) {
    const file = `${sample}/sample.md`;
    const text = readFileSync(join(samplesDir, file), "utf8");
    if (!/```text\n[\s\S]*?\n```/.test(section(text, "Đề") ?? "")) errors.push(`${file}: thiếu khối \`\`\`text dưới "## Đề"`);
    const checklist = section(text, "Checklist");
    if (checklist === null) errors.push(`${file}: thiếu "## Checklist"`);
    for (const [title, body] of [["Checklist", checklist], ["Vòng góp ý", section(text, "Vòng góp ý")]]) {
      if (body === null) continue;
      const list = items(body);
      if (title === "Checklist" && !list.length) errors.push(`${file}: "## Checklist" không có mục nào`);
      if (list.length > MAX_ITEMS) errors.push(`${file} "${title}": ${list.length} mục, tối đa ${MAX_ITEMS}`);
      if (/^\|/m.test(body)) errors.push(`${file} "${title}": dùng danh sách, không dùng bảng`);
      list.forEach((item, i) => {
        itemCount++;
        const where = `${file} "${title}" mục ${i + 1}`;
        if (/`?F\d+(\.\d+)?`?(?!\w)/.test(item)) errors.push(`${where}: có mã yêu cầu SPEC`);
        for (const word of VAGUE) {
          if (new RegExp(`(?<!\\p{L})${word}(?!\\p{L})`, "iu").test(item)) errors.push(`${where}: có chữ cảm tính "${word}"`);
        }
      });
    }
  }
  if (errors.length) {
    for (const error of errors) console.error(`✗ ${error}`);
    process.exit(1);
  }
  console.log(`✓ ${samples.length} bài · ${itemCount} mục checklist`);
}

function results(path) {
  const rows = new Map();
  for (const line of readFileSync(path, "utf8").split("\n")) {
    const row = cells(line);
    if (line.trim().startsWith("|") && /^[CG]\d+$/.test(row[0])) rows.set(row[0], row[2]);
  }
  if (!rows.size) throw new Error(`${path}: không có dòng C<n> / G<n> nào`);
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
