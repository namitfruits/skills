#!/usr/bin/env node
// Kiểm lệnh progress của new-design.mjs: danh sách bước dựng mà page mới tạo có sẵn, thứ tự đánh dấu, chèn bước, vòng
// góp ý, ghi qua file tạm. Mỗi ca chạy lệnh thật trên một .design/ mẫu trong thư mục tạm rồi so mã thoát, stdout và
// file <page>.progress.js với mong đợi. Không cần trình duyệt; chạy sau mỗi lần sửa phần progress của new-design.mjs.
//
//   node test-progress.mjs
//
// spec: F4.4 F6.2 F6.5 F6.6 F6.8 F6.9 F6.10

import { spawnSync } from "node:child_process";
import { existsSync, mkdtempSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
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
const file = basename(run("page", dir, "dang-nhap", "--title", "Đăng nhập · Vào thẳng", "--option", "A · Vào thẳng", "--layout", "Một ô email và nút Tiếp tục giữa trang. Đăng nhập bằng mạng xã hội nằm dưới, chữ nhỏ.", "--good-for", "vào app trong một lần gõ · đổi tài khoản").out);
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
  expect("page mới có bước chuẩn bị chưa xong và danh sách sáu bước dựng, rev 0, bước cuối là kiểm đầy đủ", data.prep?.task === "Viết brief chung" && data.prep.done === false && data.rev === 0 && data.build.length === 6 && data.build.every((item) => !item.done && item.round === 1) && data.build[5].final === true, JSON.stringify(data.build.map((item) => item.task)));
  expect("page mới có bước giao chưa xong", data.deliver?.task === "Kiểm lại và giao" && data.deliver.done === false, JSON.stringify(data.deliver));
  const waiting = html.match(/<section data-ds-waiting[\s\S]*?<\/section>/)?.[0] ?? "";
  const lines = [...waiting.matchAll(/<(h1|p)[^>]*>([^<]*)</g)].map((match) => `${match[1]}: ${match[2]}`);
  expect("page mới chỉ có khối chờ: tên màn, tên phương án, bố cục, \"Tiện cho:\"; không có màn mẫu", lines.join(" | ") === "p: Đăng nhập | h1: A · Vào thẳng | p: Một ô email và nút Tiếp tục giữa trang. Đăng nhập bằng mạng xã hội nằm dưới, chữ nhỏ. | p: Tiện cho: vào app trong một lần gõ · đổi tài khoản" && !html.includes("Thành viên") && !html.includes("{{") && !html.includes("Đang dựng"), lines.join(" | "));
  const listed = (() => { const window = {}; new Function("window", readFileSync(join(dir, "pages.js"), "utf8"))(window); return window.DESIGN_PAGES?.find((page) => page.file === file); })();
  expect("pages.js lưu layout và goodFor cho khung mô tả của nút phương án", listed?.layout?.startsWith("Một ô email") && listed?.goodFor === "vào app trong một lần gõ · đổi tài khoản", JSON.stringify(listed));
  const flowDir = run("init", "progress-luong", "--root", join(work, ".design")).out.split("\n").pop();
  const screen = readFileSync(run("page", flowDir, "dang-ky", "--title", "Mở tài khoản · Đăng ký", "--screen", "2 · Đăng ký", "--purpose", "Tạo tài khoản bằng email").out, "utf8");
  const screenLines = [...(screen.match(/<section data-ds-waiting[\s\S]*?<\/section>/)?.[0] ?? "").matchAll(/<(h1|p)[^>]*>([^<]*)</g)].map((match) => `${match[1]}: ${match[2]}`);
  expect("màn của luồng: tên luồng, tên màn, việc của màn; không có dòng nhỏ trống", screenLines.join(" | ") === "p: Mở tài khoản | h1: 2 · Đăng ký | p: Tạo tài khoản bằng email" && !screen.includes("{{"), screenLines.join(" | "));
  const bare = readFileSync(run("page", flowDir, "xac-nhan", "--title", "Xác nhận email", "--screen", "3 · Xác nhận email").out, "utf8");
  const bareLines = [...(bare.match(/<section data-ds-waiting[\s\S]*?<\/section>/)?.[0] ?? "").matchAll(/<(h1|p)[^>]*>([^<]*)</g)].map((match) => `${match[1]}: ${match[2]}`);
  expect("--title không có \" · \" và không có --purpose: chỉ còn tiêu đề", bareLines.join(" | ") === "h1: 3 · Xác nhận email" && !bare.includes("{{"), bareLines.join(" | "));
}

{
  const preparing = progress();
  expect("bước chuẩn bị chưa xong: progress không cờ nói đang chuẩn bị, không ghi", preparing.code === 0 && /đang chuẩn bị \(Viết brief chung\)/.test(preparing.out) && read().rev === 0, preparing.out.split("\n").pop());
  const early = [progress("--done", "1"), progress("--doing", "Chuẩn bị dữ liệu")];
  expect("bước chuẩn bị chưa xong: --done, --doing exit 1, nói chạy --prepared trước, không ghi", early.every((result) => result.code === 1 && /--prepared/.test(result.err)) && !read().build[0].done && !read().build[0].doing, early.map((result) => result.err).join(" / "));
  const prepared = progress("--prepared");
  expect("--prepared đánh dấu bước chuẩn bị xong, ghi sẵn việc con \"Đọc brief và luật UX, UI\" cho bước dựng 1, rev giữ nguyên", prepared.code === 0 && read().prep.done === true && read().build[0].doing === "Đọc brief và luật UX, UI" && read().rev === 0, prepared.out.split("\n").pop());
  const again = progress("--prepared");
  expect("--prepared lần hai exit 1", again.code === 1, again.err);
  const listed = progress();
  expect("progress không cờ in bước dựng đầu tiên chưa xong, không ghi", listed.code === 0 && /bước dựng tiếp theo là 1 · Khung các khối/.test(listed.out) && read().rev === 0, listed.out.split("\n").pop());
  const wrong = progress("--done", "2");
  expect("--done sai thứ tự thì exit 1, nói bước đầu tiên chưa xong, không ghi", wrong.code === 1 && /1 · Khung các khối/.test(wrong.err) && read().rev === 0, wrong.err);
  const doing = progress("--doing", "Chuẩn bị dữ liệu");
  expect("--doing ghi việc con vào bước dở, rev giữ nguyên, in việc con dưới bước đó", doing.code === 0 && read().build[0].doing === "Chuẩn bị dữ liệu" && read().rev === 0 && /↳ Chuẩn bị dữ liệu/.test(doing.out), doing.out);
  progress("--doing", "Viết bảng đơn hàng");
  expect("--doing lần hai ghi đè việc con trước", read().build[0].doing === "Viết bảng đơn hàng" && read().build.filter((item) => item.doing).length === 1 && read().rev === 0, JSON.stringify(read().build[0]));
  const empty = progress("--doing", " ");
  expect("--doing chữ rỗng thì exit 1, không ghi", empty.code === 1 && read().build[0].doing === "Viết bảng đơn hàng", empty.err);
  const right = progress("--done", "1");
  expect("--done đúng bước thì đánh dấu, xoá việc con, rev + 1", right.code === 0 && read().build[0].done && !("doing" in read().build[0]) && read().rev === 1, right.out.split("\n").pop());
}

{
  const inserted = progress("--insert", "Bảng so sánh gói");
  const tasks = read().build.map((item) => item.task);
  expect("--insert chèn ngay trước bước kiểm đầy đủ của vòng đang mở, rev + 1", inserted.code === 0 && tasks.length === 7 && tasks[5] === "Bảng so sánh gói" && read().build[6].final && read().rev === 2, tasks.join(" | "));
  const early = progress("--round", "nút to hơn");
  expect("--round khi vòng đang dở thì exit 1, không ghi", early.code === 1 && /2 · Đang tải/.test(early.err) && read().rev === 2, early.err);
  const soon = progress("--delivered");
  expect("--delivered khi còn bước dựng thì exit 1, nói bước đầu tiên chưa xong, không ghi", soon.code === 1 && /2 · Đang tải/.test(soon.err) && !read().deliver.done && read().rev === 2, soon.err);
}

{
  for (let step = 2; step <= 7; step += 1) progress("--done", String(step));
  const finished = progress();
  expect("đánh dấu hết thì in mọi bước đã xong", /mọi bước dựng đã xong/.test(finished.out) && read().rev === 8, finished.out.split("\n").pop());
  const extra = progress("--done", "8");
  expect("--done khi mọi bước đã xong thì exit 1", extra.code === 1, extra.err);
  const late = progress("--doing", "Sửa thêm");
  expect("--doing khi mọi bước đã xong thì exit 1, không ghi", late.code === 1 && read().build.every((item) => !item.doing), late.err);
  expect("hết bước dựng mà chưa giao: progress không cờ nói chạy --delivered", /chưa giao; agent chính chạy --delivered/.test(finished.out), finished.out.split("\n").pop());
  const delivered = progress("--delivered");
  expect("--delivered đánh dấu bước giao xong, rev giữ nguyên", delivered.code === 0 && read().deliver.done === true && read().rev === 8 && /đã giao/.test(delivered.out), delivered.err || delivered.out.split("\n").pop());
  const twice = progress("--delivered");
  expect("--delivered lần hai exit 1, nói mở vòng bằng --round", twice.code === 1 && /--round/.test(twice.err), twice.err);
  const round = progress("--round", "nút to hơn", "đổi chữ nút");
  const data = read();
  const added = data.build.filter((item) => item.round === 2);
  expect("--round mở vòng 2: mỗi ý một bước, thêm bước kiểm đầy đủ; bước vòng 1 giữ nguyên", round.code === 0 && added.map((item) => item.task).join(" | ") === "Góp ý: nút to hơn | Góp ý: đổi chữ nút | Kiểm đầy đủ" && added[2].final && data.build.filter((item) => item.round === 1).every((item) => item.done) && data.rev === 9, added.map((item) => item.task).join(" | "));
  expect("--round mở lại bước giao", data.deliver.done === false, JSON.stringify(data.deliver));
  const next = progress();
  expect("vòng 2: bước dựng tiếp theo là ý góp ý đầu tiên", /bước dựng tiếp theo là 8 · Góp ý: nút to hơn/.test(next.out), next.out.split("\n").pop());
}

{
  const writes = read().rev;
  expect("mọi lần ghi trừ --prepared, --doing, --delivered tăng rev đúng 1 (9 lần ghi → rev 9)", writes === 9, `rev ${writes}`);
  expect("ghi xong không còn file tạm", leftovers().length === 0, leftovers().join(" "));
  // Page tạo trước khi có bước chuẩn bị: file không có prep, --done nhận như đã chuẩn bị xong.
  const legacy = basename(run("page", dir, "cu", "--title", "Cũ", "--option", "B · Cũ").out);
  const legacyFile = join(dir, legacy.replace(/\.html$/, ".progress.js"));
  writeFileSync(legacyFile, readFileSync(legacyFile, "utf8").replace(/\n  "prep": [^\n]*/, ""));
  const legacyDone = run("progress", dir, legacy, "--done", "1");
  expect("file không có prep (page cũ): --done nhận ngay", legacyDone.code === 0 && !readFileSync(legacyFile, "utf8").includes("prep"), legacyDone.err || legacyDone.out.split("\n").pop());
  const missing = run("progress", dir, "99-khong-co.html");
  expect("page không có thì exit 1", missing.code === 1, missing.err);
}

{
  // --prepared --all: mọi page trong pages.js, theo thứ tự; page đã chuẩn bị thì bỏ qua.
  const allDir = run("init", "progress-all", "--root", join(work, ".design")).out.split("\n").pop();
  const names = ["mot", "hai"].map((slug, index) => basename(run("page", allDir, slug, "--title", `Màn · ${slug}`, "--option", `${"AB"[index]} · ${slug}`, "--layout", "Một bảng.").out));
  const readAll = (name) => { const window = {}; new Function("window", readFileSync(join(allDir, name.replace(/\.html$/, ".progress.js")), "utf8"))(window); return window.DESIGN_PROGRESS[name]; };
  run("progress", allDir, names[1], "--prepared");
  // Brief còn là khuôn trống: --prepared --all từ chối, không page nào đổi.
  const unfilled = run("progress", allDir, "--prepared", "--all");
  expect("--prepared --all khi brief.md còn chỗ trống thì exit 1, nêu lỗi brief, không đánh dấu page nào", unfilled.code === 1 && /brief\.md chưa xong/.test(unfilled.err) && /còn chỗ trống/.test(unfilled.err) && !readAll(names[0]).prep.done, unfilled.err || unfilled.out);
  const filled = readFileSync(join(dirname(script), "fixtures/check/hai-page-brief.md"), "utf8").replace("01-a.html", names[0]).replace("02-b.html", names[1]);
  writeFileSync(join(allDir, "brief.md"), filled);
  const all = run("progress", allDir, "--prepared", "--all");
  // Mọi lệnh ghi một dòng vào run.log: init, page, prepared, prepared-all; lệnh đọc in bảng bước của từng page.
  const runLog = readFileSync(join(allDir, "run.log"), "utf8").trim().split("\n").map((line) => line.split("\t"));
  const actions = runLog.map((cells) => `${cells[1]} ${cells[2]}`);
  const summary = spawnSync(process.execPath, [join(dirname(script), "run-log.mjs"), allDir], { encoding: "utf8" }).stdout;
  expect("run.log có dòng init, page, prepared, prepared-all; mỗi dòng 6 cột, cột đầu là giờ đọc được", ["new-design init", "new-design page", "new-design prepared", "new-design prepared-all"].every((action) => actions.includes(action)) && runLog.every((cells) => cells.length === 6 && !Number.isNaN(Date.parse(cells[0]))), actions.join(" / "));
  expect("run-log.mjs in bảng bước của từng page, có dòng chuẩn bị", summary.includes(names[0]) && summary.includes("chuẩn bị: brief"), summary.slice(0, 200));
  expect("--prepared --all đánh dấu bước chuẩn bị mọi page, bỏ qua page đã chuẩn bị, rev giữ nguyên", all.code === 0 && names.every((name) => readAll(name).prep.done && readAll(name).rev === 0) && all.out.includes(`${names[1]}: bước chuẩn bị đã xong, bỏ qua`) && all.out.indexOf(names[0]) < all.out.indexOf(names[1]), all.err || all.out.replace(/\n/g, " / "));
  // --delivered --all: page nào còn bước dựng thì không ghi page nào; đủ thì đánh dấu mọi page, page đã giao thì bỏ qua.
  for (let step = 1; step <= 6; step += 1) run("progress", allDir, names[0], "--done", String(step));
  const blocked = run("progress", allDir, "--delivered", "--all");
  expect("--delivered --all khi một page còn bước dựng thì exit 1, nêu page đó, không ghi page nào", blocked.code === 1 && blocked.err.includes(`${names[1]}: 1 · Khung các khối`) && !blocked.err.includes(`${names[0]}:`) && names.every((name) => !readAll(name).deliver.done), blocked.err);
  for (let step = 1; step <= 6; step += 1) run("progress", allDir, names[1], "--done", String(step));
  run("progress", allDir, names[0], "--delivered");
  const shipped = run("progress", allDir, "--delivered", "--all");
  expect("--delivered --all đánh dấu bước giao mọi page, bỏ qua page đã giao", shipped.code === 0 && names.every((name) => readAll(name).deliver.done) && shipped.out.includes(`${names[0]}: đã giao, bỏ qua`), shipped.err || shipped.out.replace(/\n/g, " / "));
  const wrong = [run("progress", allDir, names[0], "--prepared", "--all"), run("progress", allDir, "--done", "1", "--all"), run("progress", allDir, "--prepared", "--delivered", "--all")];
  expect("--all kèm <file>, kèm cờ khác hay kèm cả --prepared lẫn --delivered thì exit 1", wrong.every((result) => result.code === 1 && /--all chỉ đi với --prepared/.test(result.err)), wrong.map((result) => result.err).join(" / "));
}

console.log(results.join("\n"));
console.log(`\n.design/ mẫu: ${dir}`);
process.exit(results.some((line) => line.startsWith("✗")) ? 1 : 0);
