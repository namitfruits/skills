#!/usr/bin/env node
// Nhật ký chạy của một thư mục design: mỗi lệnh của skill (new-design.mjs, check.mjs) chạy xong thì ghi thêm một dòng
// vào <thư mục design>/run.log. File chỉ ghi thêm, không sửa dòng cũ; nhiều agent con ghi cùng lúc được.
//
//   <giờ ISO>  <lệnh>  <việc>  <page | ->  <giây | ->  <chi tiết>
//   2026-10-09T16:50:03.123+07:00  check  full  01-bang-lich-hen.html  30.8  178 tổ hợp · 0 lỗi · tĩnh 0.4 · …
//
// Đọc lại thành timeline từng page: mỗi bước dựng mất bao lâu, máy kiểm chạy mấy lần, bao nhiêu giây trong bước đó;
// phần còn lại của bước là agent nghĩ, viết, chạy tool khác.
//
//   node run-log.mjs <thư mục design>
//
// spec: F6.12

import { appendFileSync, existsSync, readFileSync } from "node:fs";
import { basename, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const columns = "\t";

// Giờ địa phương kèm múi giờ, đọc được bằng mắt và Date.parse được.
function localIso(date = new Date()) {
  const offset = -date.getTimezoneOffset();
  const pad = (value, size = 2) => String(Math.abs(value)).padStart(size, "0");
  const local = new Date(date.getTime() + offset * 60000).toISOString().slice(0, 23);
  return `${local}${offset >= 0 ? "+" : "-"}${pad(Math.trunc(offset / 60))}:${pad(offset % 60)}`;
}

export function appendRun(designDir, command, action, file, seconds, detail = "") {
  if (!designDir || !existsSync(designDir)) return;
  const sec = typeof seconds === "number" ? seconds.toFixed(1) : "-";
  const line = [localIso(), command, action, file || "-", sec, String(detail).replace(/[\t\n]+/g, " ")].join(columns);
  try {
    appendFileSync(join(designDir, "run.log"), `${line}\n`);
  } catch {}
}

export function readRun(designDir) {
  const path = join(designDir, "run.log");
  if (!existsSync(path)) return [];
  return readFileSync(path, "utf8").split("\n").filter(Boolean).map((line) => {
    const [time, command, action, file, sec, detail] = line.split(columns);
    return { t: Date.parse(time), time, command, action, file, sec: sec === "-" ? null : Number(sec), detail: detail ?? "" };
  }).filter((row) => !Number.isNaN(row.t));
}

const clock = (ms) => {
  const total = Math.round(ms / 1000);
  return `${Math.floor(total / 60)}:${String(total % 60).padStart(2, "0")}`;
};

function summary(designDir) {
  const rows = readRun(designDir);
  if (!rows.length) return `${basename(designDir)}: chưa có run.log`;
  const start = rows[0].t;
  const end = Math.max(...rows.map((row) => row.t));
  const out = [`run.log · ${basename(designDir)} · ${rows.length} dòng · ${rows[0].time.slice(11, 19)} → ${new Date(end).toTimeString().slice(0, 8)} (${clock(end - start)})`, ""];
  out.push("Mốc chung", "", "| Lúc | Việc |", "| --- | ---- |");
  for (const row of rows.filter((item) => item.command === "new-design" && ["init", "page", "prepared-all", "delivered-all"].includes(item.action))) {
    out.push(`| ${clock(row.t - start)} | ${row.action} ${row.file === "-" ? "" : row.file} ${row.detail}`.trimEnd() + " |");
  }
  const pages = [...new Set(rows.filter((row) => row.file.endsWith(".html")).map((row) => row.file))];
  for (const page of pages) {
    const own = rows.filter((row) => row.file === page);
    // Mốc của page: bước chuẩn bị xong, rồi từng --done. Mỗi khoảng giữa hai mốc là một bước.
    const marks = own.filter((row) => row.command === "new-design" && (row.action === "prepared" || row.action === "done"));
    out.push("", `${page}`, "", "| Bước | Xong lúc | Dài | Máy kiểm (lần · giây) | Còn lại: agent |", "| ---- | -------- | --- | --------------------- | -------------- |");
    const created = own.find((row) => row.command === "new-design" && row.action === "page");
    const prepared = marks.find((row) => row.action === "prepared");
    if (created && prepared) out.push(`| chuẩn bị: brief | ${clock(prepared.t - start)} | ${clock(prepared.t - created.t)} | — | ${clock(prepared.t - created.t)} |`);
    let from = prepared?.t ?? start;
    for (const mark of marks.filter((row) => row.action === "done")) {
      const checks = own.filter((row) => row.command === "check" && row.t > from && row.t <= mark.t && row.sec !== null);
      const checkSec = checks.reduce((sum, row) => sum + row.sec, 0);
      const counts = ["quick", "click", "full"].map((kind) => [kind, checks.filter((row) => row.action === kind).length]).filter(([, count]) => count).map(([kind, count]) => `${kind} ×${count}`).join(", ");
      const length = (mark.t - from) / 1000;
      out.push(`| ${mark.detail} | ${clock(mark.t - start)} | ${clock(mark.t - from)} | ${counts || "—"} · ${checkSec.toFixed(0)}s | ${clock(Math.max(0, length - checkSec) * 1000)} |`);
      from = mark.t;
    }
  }
  const checks = rows.filter((row) => row.command === "check" && row.sec !== null);
  out.push("", "Máy kiểm cả lượt", "", "| Việc | Lần | Tổng giây | Dài nhất |", "| ---- | --- | --------- | -------- |");
  for (const kind of ["brief", "quick", "click", "full", "folder"]) {
    const list = checks.filter((row) => row.action === kind);
    if (list.length) out.push(`| ${kind} | ${list.length} | ${list.reduce((sum, row) => sum + row.sec, 0).toFixed(0)} | ${Math.max(...list.map((row) => row.sec)).toFixed(1)}s |`);
  }
  const slow = checks.filter((row) => ["full", "folder"].includes(row.action)).sort((a, b) => b.sec - a.sec).slice(0, 5);
  if (slow.length) {
    out.push("", "Lần kiểm đầy đủ chậm nhất", "");
    for (const row of slow) out.push(`- ${clock(row.t - start)} · ${row.file} · ${row.sec}s · ${row.detail}`);
  }
  return out.join("\n");
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const dir = process.argv[2];
  if (!dir) {
    console.error("cách dùng: node run-log.mjs <thư mục design>");
    process.exit(2);
  }
  console.log(summary(resolve(dir)));
}
