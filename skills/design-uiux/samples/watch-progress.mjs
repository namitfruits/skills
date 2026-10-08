#!/usr/bin/env node
// Theo dõi tiến độ dựng trong lúc chạy một bài mẫu: đọc mọi <page>.progress.js dưới một thư mục mỗi 2 giây, như shell
// của page đang mở. Mỗi lần thấy một page mới hay rev của nó đổi thì ghi một dòng vào file log:
//
//   <giờ hh:mm:ss.mmm>  <thư mục design>/<file page>  rev <n>  <tên bước vừa xong | "thấy lần đầu">
//
// Người chạy bật lệnh này (chạy nền) trước khi gọi skill, tắt sau tin giao cuối. Người chấm đọc log để biết page có
// dựng theo bước không, các page có dựng cùng lúc không, link có trước bước đầu tiên không.
//
//   node watch-progress.mjs <thư mục chứa .design> [--out progress.log] [--idle <giây, mặc định 1800>]
//
// Lệnh tự thoát khi không có gì đổi trong --idle giây.
//
// spec: F6.2 F6.7

import { appendFileSync, existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative, resolve } from "node:path";

const args = process.argv.slice(2);
const flag = (name, fallback) => (args.includes(name) ? args[args.indexOf(name) + 1] : fallback);
const root = resolve(args.find((arg, index) => !arg.startsWith("--") && !["--out", "--idle"].includes(args[index - 1])) ?? ".");
const out = resolve(flag("--out", "progress.log"));
const idle = Number(flag("--idle", 1800)) * 1000;

// Mọi file *.progress.js dưới root, bỏ node_modules và _shell.
function progressFiles(dir) {
  if (!existsSync(dir)) return [];
  return readdirSync(dir).flatMap((name) => {
    const path = join(dir, name);
    if (name === "node_modules" || name === "_shell") return [];
    if (statSync(path).isDirectory()) return progressFiles(path);
    return name.endsWith(".progress.js") ? [path] : [];
  });
}

// Đọc như shell: chạy file trong một window giả. File đang ghi dở thì bỏ lượt này.
function read(path) {
  try {
    const window = {};
    new Function("window", readFileSync(path, "utf8"))(window);
    return Object.values(window.DESIGN_PROGRESS ?? {})[0] ?? null;
  } catch {
    return null;
  }
}

const seen = new Map();
let lastChange = Date.now();
const stamp = () => new Date().toTimeString().slice(0, 8) + `.${String(Date.now() % 1000).padStart(3, "0")}`;
appendFileSync(out, `# theo dõi ${root} từ ${new Date().toISOString()}\n`);

function tick() {
  for (const path of progressFiles(root)) {
    const data = read(path);
    if (!data || typeof data.rev !== "number" || !Array.isArray(data.build)) continue;
    const before = seen.get(path);
    if (before && before.rev === data.rev) continue;
    // Bước vừa xong: bước có done = true mà lần đọc trước chưa xong (nhiều bước xong trong 2 giây thì ghi bước cuối).
    const fresh = data.build.filter((step, index) => step.done && !before?.build[index]?.done);
    const what = !before ? "thấy lần đầu" : fresh.length ? fresh.map((step) => step.task).join(" · ") : "đổi danh sách";
    const page = relative(root, path).replace(/\.progress\.js$/, ".html");
    appendFileSync(out, `${stamp()}  ${page}  rev ${data.rev}  ${what}\n`);
    seen.set(path, data);
    lastChange = Date.now();
  }
  if (Date.now() - lastChange > idle) process.exit(0);
}

tick();
setInterval(tick, 2000);
