#!/usr/bin/env node
// Kiểm lệnh progress của new-design.mjs: danh sách bước dựng mà page mới tạo có sẵn, thứ tự đánh dấu, chèn bước, mục
// góp ý (comment, ý trong chat), đọc file kiểu cũ xếp theo vòng, ghi qua file tạm. Mỗi ca chạy lệnh thật trên một .design/ mẫu trong thư mục tạm rồi so mã thoát, stdout và
// file <page>.progress.js với mong đợi. Không cần trình duyệt; chạy sau mỗi lần sửa phần progress của new-design.mjs.
//
//   node test-progress.mjs
//
// spec: F4.4 F6.2 F6.5 F6.6 F6.8 F6.9 F6.10 F6.16 F7.5 F7.10

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
  expect("page mới có bước chuẩn bị chưa xong và danh sách sáu bước dựng, rev 0, bước cuối là kiểm đầy đủ", data.prep?.task === "Viết brief chung" && data.prep.done === false && data.rev === 0 && data.build.length === 6 && data.build.every((item) => !item.done && !("round" in item)) && data.build[5].final === true && Array.isArray(data.feedback) && data.feedback.length === 0, JSON.stringify(data.build.map((item) => item.task)));
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
  expect("--insert chèn ngay trước bước kiểm đầy đủ của danh sách dựng, rev + 1", inserted.code === 0 && tasks.length === 7 && tasks[5] === "Bảng so sánh gói" && read().build[6].final && read().rev === 2, tasks.join(" | "));
  const early = progress("--chat", "nút to hơn");
  expect("--chat khi còn bước dựng thì exit 1, không ghi", early.code === 1 && /2 · Đang tải/.test(early.err) && read().feedback.length === 0 && read().rev === 2, early.err);
  const soon = progress("--delivered");
  expect("--delivered khi còn bước dựng thì exit 1, nói bước đầu tiên chưa xong, không ghi", soon.code === 1 && /2 · Đang tải/.test(soon.err) && !read().deliver.done && read().rev === 2, soon.err);
}

{
  for (let step = 2; step <= 7; step += 1) progress("--done", String(step));
  const finished = progress();
  expect("đánh dấu hết thì in mọi bước đã xong", /mọi bước dựng và góp ý đã xong/.test(finished.out) && read().rev === 8, finished.out.split("\n").pop());
  const extra = progress("--done", "8");
  expect("--done khi mọi bước đã xong thì exit 1", extra.code === 1, extra.err);
  const late = progress("--doing", "Sửa thêm");
  expect("--doing khi mọi bước đã xong và không có góp ý mở thì exit 1, không ghi", late.code === 1 && read().build.every((item) => !item.doing) && /--comment <id> hay --chat/.test(late.err), late.err);
  expect("hết bước dựng mà chưa giao: progress không cờ nói chạy --delivered", /chưa giao; agent chính chạy --delivered/.test(finished.out), finished.out.split("\n").pop());
  const delivered = progress("--delivered");
  expect("--delivered đánh dấu bước giao xong, rev giữ nguyên", delivered.code === 0 && read().deliver.done === true && read().rev === 8 && /đã giao/.test(delivered.out), delivered.err || delivered.out.split("\n").pop());
  const twice = progress("--delivered");
  expect("--delivered lần hai exit 1, nói mở mục bằng --comment hay --chat", twice.code === 1 && /--comment <id> hay --chat/.test(twice.err), twice.err);
  const round = progress("--round", "nút to hơn");
  expect("--round không còn: exit 1, chỉ sang --comment, --chat", round.code === 1 && /--comment/.test(round.err) && /--chat/.test(round.err), round.err);

  const opened = progress("--comment", "3", "tab lọc đậm hơn");
  let data = read();
  expect("--comment 3 mở mục comment: có việc cuối Kiểm đầy đủ, mở lại bước giao, rev giữ nguyên", opened.code === 0 && data.feedback.length === 1 && data.feedback[0].source === "comment" && data.feedback[0].id === 3 && data.feedback[0].task === "tab lọc đậm hơn" && data.feedback[0].actions.map((action) => action.task).join() === "Kiểm đầy đủ" && data.feedback[0].actions[0].final && !data.deliver.done && data.rev === 8, JSON.stringify(data.feedback[0]));
  const busy = progress("--chat", "đổi tiêu đề");
  expect("mở mục khi còn mục mở thì exit 1, nêu mục đang mở (comment chờ mục trước xong)", busy.code === 1 && /#3 tab lọc đậm hơn/.test(busy.err) && read().feedback.length === 1, busy.err);
  progress("--doing", "Chữ tab đậm 600");
  const first = read();
  progress("--doing", "Giữ bề rộng tab");
  data = read();
  const actions = data.feedback[0].actions;
  expect("--doing lần một thêm việc đang làm, rev giữ; lần hai: việc trước thành xong và ở lại, rev + 1", first.rev === 8 && actions.map((action) => `${action.done ? "✓" : "○"}${action.task}`).join(" | ") === "✓Chữ tab đậm 600 | ○Giữ bề rộng tab | ○Kiểm đầy đủ" && data.rev === 9, actions.map((action) => `${action.done ? "✓" : "○"}${action.task}`).join(" | "));
  progress("--doing", "Kiểm đầy đủ");
  data = read();
  expect("--doing đúng tên việc cuối chỉ đóng việc đang làm, không thêm dòng Kiểm đầy đủ thứ hai", data.feedback[0].actions.filter((action) => action.task === "Kiểm đầy đủ").length === 1 && data.feedback[0].actions[1].done && data.rev === 10, data.feedback[0].actions.map((action) => action.task).join(" | "));
  const listed = progress();
  expect("progress không cờ: nhóm Comment, mục #3, việc thụt dưới mục, không chữ vòng", /\nComment\n  ● #3 tab lọc đậm hơn\n       ✓ Chữ tab đậm 600/.test(listed.out) && !/vòng/i.test(listed.out) && /đang sửa góp ý #3/.test(listed.out), listed.out.split("\n").slice(-6).join(" / "));
  const blockedDeliver = progress("--delivered");
  expect("--delivered khi còn mục góp ý mở thì exit 1", blockedDeliver.code === 1 && /góp ý #3/.test(blockedDeliver.err), blockedDeliver.err);
  const checked = progress("--checked");
  data = read();
  expect("--checked đóng mục: mọi việc xong, mục xong, rev + 1", checked.code === 0 && data.feedback[0].done && data.feedback[0].actions.every((action) => action.done) && data.rev === 11, checked.out.split("\n").pop());
  const again = progress("--comment", "3", "lần nữa");
  expect("--comment với id đã có mục thì exit 1", again.code === 1 && /#3 đã có mục/.test(again.err), again.err);
  progress("--chat", "đổi tiêu đề thành Hôm nay");
  progress("--doing", "Sửa tiêu đề h1");
  progress("--checked");
  const both = progress();
  expect("ý trong chat vào nhóm Góp ý trong chat, không số", /\nGóp ý trong chat\n  ✓ đổi tiêu đề thành Hôm nay\n       ✓ Sửa tiêu đề h1\n       ✓ Kiểm đầy đủ/.test(both.out) && read().feedback[1].source === "chat" && !("id" in read().feedback[1]), both.out.split("\n").slice(-8).join(" / "));
  const noOpen = progress("--checked");
  expect("--checked khi không có mục mở thì exit 1", noOpen.code === 1, noOpen.err);
}

{
  // File kiểu cũ: góp ý là bước round ≥ 2 trong build. Lệnh đọc thành mục góp ý, ghi lại thì ghi dạng mới.
  const old = basename(run("page", dir, "vong-cu", "--title", "Vòng cũ", "--option", "C · Vòng cũ").out);
  const oldFile = join(dir, old.replace(/\.html$/, ".progress.js"));
  const build = [
    ...["Khung", "Tải", "Riêng", "Tương tác", "Preset"].map((task) => ({ task, done: true, round: 1 })),
    { task: "Kiểm đầy đủ và tự kiểm", done: true, round: 1, final: true },
    { task: "Góp ý: Comment #1: bỏ dòng Bây giờ", done: true, round: 2 },
    { task: "Comment #2: phân trang", done: true, round: 2 },
    { task: "Kiểm đầy đủ", done: true, round: 2, final: true },
    { task: "Góp ý: nút to hơn", done: false, round: 3, doing: "Sửa nút" },
    { task: "Kiểm đầy đủ", done: false, round: 3, final: true },
  ];
  writeFileSync(oldFile, `(window.DESIGN_PROGRESS ||= {})[${JSON.stringify(old)}] = ${JSON.stringify({ rev: 5, prep: { task: "Viết brief chung", done: true }, deliver: { task: "Kiểm lại và giao", done: false }, build })};\n`);
  const shown = run("progress", dir, old);
  expect("file kiểu cũ: vòng 2 thành mục #1, #2 trong nhóm Comment (cả bước chèn bằng --insert), vòng 3 thành mục chat đang mở có việc đang làm", /\nComment\n  ✓ #1 bỏ dòng Bây giờ\n       ✓ Kiểm đầy đủ\n  ✓ #2 phân trang\n       ✓ Kiểm đầy đủ\nGóp ý trong chat\n  ● nút to hơn\n       ● Sửa nút\n       ○ Kiểm đầy đủ/.test(shown.out) && !/vòng/i.test(shown.out.split("\n").slice(0, -1).join("\n")), shown.out.replace(/\n/g, " / "));
  run("progress", dir, old, "--checked");
  const rewritten = readFileSync(oldFile, "utf8");
  expect("file kiểu cũ ghi lại thành dạng mới: build không còn round, có feedback", !/"round"/.test(rewritten) && /"feedback"/.test(rewritten), rewritten.slice(0, 120));
}

{
  const writes = read().rev;
  expect("rev tăng ở --done, --insert, --checked, --doing đóng việc của mục góp ý (12 lần → rev 12)", writes === 12, `rev ${writes}`);
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
