#!/usr/bin/env node
// Kiểm lệnh progress của new-design.mjs: danh sách bước dựng mà page mới tạo có sẵn, thứ tự đánh dấu, chèn bước, vòng
// góp ý, ghi qua file tạm. Mỗi ca chạy lệnh thật trên một .design/ mẫu trong thư mục tạm rồi so mã thoát, stdout và
// file <page>.progress.js với mong đợi. Không cần trình duyệt; chạy sau mỗi lần sửa phần progress của new-design.mjs.
//
//   node test-progress.mjs
//
// spec: F4.4 F6.2 F6.6

import { spawnSync } from "node:child_process";
import { existsSync, mkdtempSync, readdirSync, readFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { basename, dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const script = join(dirname(fileURLToPath(import.meta.url)), "new-design.mjs");
const work = mkdtempSync(join(tmpdir(), "design-uiux-progress-"));
const run = (...params) => {
  const result = spawnSync(process.execPath, [script, ...params], { cwd: work, encoding: "utf8" });
  return { code: result.status, out: result.stdout.trim(), err: result.stderr.trim() };
};
const results = [];
const expect = (name, ok, detail) => results.push(`${ok ? "✓" : "✗"} ${name}${detail ? ` — ${detail}` : ""}`);

const dir = run("init", "progress-test", "--root", join(work, ".design")).out.split("\n").pop();
const file = basename(run("page", dir, "dang-nhap", "--title", "Đăng nhập", "--option", "A · Vào thẳng").out);
const progressFile = join(dir, file.replace(/\.html$/, ".progress.js"));
const read = () => {
  const window = {};
  new Function("window", readFileSync(progressFile, "utf8"))(window);
  return window.DESIGN_PROGRESS[file];
};
const progress = (...params) => run("progress", dir, file, ...params);
const leftovers = () => readdirSync(dir).filter((name) => name.endsWith(".tmp"));

{
  const data = read();
  const html = readFileSync(join(dir, file), "utf8");
  expect("page mới có danh sách sáu bước dựng, rev 0, bước cuối là kiểm đầy đủ", data.rev === 0 && data.build.length === 6 && data.build.every((item) => !item.done && item.round === 1) && data.build[5].final === true, JSON.stringify(data.build.map((item) => item.task)));
  expect('page mới chỉ có khối chờ "Đang dựng" mang tên phương án, không có màn mẫu', html.includes("A · Vào thẳng") && html.includes("data-ds-waiting") && !html.includes("Thành viên"));
}

{
  const listed = progress();
  expect("progress không cờ in bước dựng đầu tiên chưa xong, không ghi", listed.code === 0 && /bước dựng tiếp theo là 1 · Khung các khối/.test(listed.out) && read().rev === 0, listed.out.split("\n").pop());
  const wrong = progress("--done", "2");
  expect("--done sai thứ tự thì exit 1, nói bước đầu tiên chưa xong, không ghi", wrong.code === 1 && /1 · Khung các khối/.test(wrong.err) && read().rev === 0, wrong.err);
  const right = progress("--done", "1");
  expect("--done đúng bước thì đánh dấu, rev + 1", right.code === 0 && read().build[0].done && read().rev === 1, right.out.split("\n").pop());
}

{
  const inserted = progress("--insert", "Bảng so sánh gói");
  const tasks = read().build.map((item) => item.task);
  expect("--insert chèn ngay trước bước kiểm đầy đủ của vòng đang mở, rev + 1", inserted.code === 0 && tasks.length === 7 && tasks[5] === "Bảng so sánh gói" && read().build[6].final && read().rev === 2, tasks.join(" | "));
  const early = progress("--round", "nút to hơn");
  expect("--round khi vòng đang dở thì exit 1, không ghi", early.code === 1 && /2 · Đang tải/.test(early.err) && read().rev === 2, early.err);
}

{
  for (let step = 2; step <= 7; step += 1) progress("--done", String(step));
  const finished = progress();
  expect("đánh dấu hết thì in mọi bước đã xong", /mọi bước dựng đã xong/.test(finished.out) && read().rev === 8, finished.out.split("\n").pop());
  const extra = progress("--done", "8");
  expect("--done khi mọi bước đã xong thì exit 1", extra.code === 1, extra.err);
  const round = progress("--round", "nút to hơn", "đổi chữ nút");
  const data = read();
  const added = data.build.filter((item) => item.round === 2);
  expect("--round mở vòng 2: mỗi ý một bước, thêm bước kiểm đầy đủ; bước vòng 1 giữ nguyên", round.code === 0 && added.map((item) => item.task).join(" | ") === "Góp ý: nút to hơn | Góp ý: đổi chữ nút | Kiểm đầy đủ" && added[2].final && data.build.filter((item) => item.round === 1).every((item) => item.done) && data.rev === 9, added.map((item) => item.task).join(" | "));
  const next = progress();
  expect("vòng 2: bước dựng tiếp theo là ý góp ý đầu tiên", /bước dựng tiếp theo là 8 · Góp ý: nút to hơn/.test(next.out), next.out.split("\n").pop());
}

{
  const writes = read().rev;
  expect("mọi lần ghi tăng rev đúng 1 (9 lần ghi → rev 9)", writes === 9, `rev ${writes}`);
  expect("ghi xong không còn file tạm", leftovers().length === 0, leftovers().join(" "));
  const missing = run("progress", dir, "99-khong-co.html");
  expect("page không có thì exit 1", missing.code === 1, missing.err);
}

console.log(results.join("\n"));
console.log(`\n.design/ mẫu: ${dir}`);
process.exit(results.some((line) => line.startsWith("✗")) ? 1 : 0);
