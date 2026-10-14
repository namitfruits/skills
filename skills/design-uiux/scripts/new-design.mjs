#!/usr/bin/env node
// Dựng và cập nhật thư mục design: tạo thư mục .design-uiux/NNN-slug, thêm page từ mẫu, sinh tokens.js.
//
//   node new-design.mjs init <slug> [--root .design-uiux] [--tokens <DESIGN.md | tokens.css> | --getdesign <tên>] [--page-width <1280px | 80rem | full>]
//   node new-design.mjs designs
//   node new-design.mjs page <thư mục design> <slug> --title "<tên>" [--option "A · <tên phương án>"] [--layout "<bố cục page>"]
//                       [--good-for "<việc 1> · <việc 2>"] [--note "<một dòng>"]
//   node new-design.mjs page <thư mục design> <slug> --title "<luồng> · <tên màn>" --screen "<n> · <tên màn>" --purpose "<để làm gì>"
//   node new-design.mjs progress <thư mục design> <file> [--prepared | --doing "<việc>" | --done <n> | --insert "<việc>" | --delivered]
//   node new-design.mjs progress <thư mục design> <file> (--comment <id> "<tóm tắt>" | --chat "<ý>" | --checked)
//   node new-design.mjs progress <thư mục design> (--prepared | --delivered) --all
//   node new-design.mjs touch <thư mục design> <file> --note "<góp ý vừa sửa>"
//   node new-design.mjs tokens <DESIGN.md | tokens.css> [--page-width <…>] [--out <tokens.js>]
//   node new-design.mjs shell [--root .design-uiux]
//   node new-design.mjs open <thư mục design> [--dry-run]
//   node new-design.mjs comment-bridge <thư mục design> [--stop]
//   node new-design.mjs comment <thư mục design> (--pending | --status <id> doing|done | --add '<json>')
//
// Mỗi phương án được dựng đúng một page; góp ý thì sửa thẳng page đó rồi touch để pages.js ghi ngày sửa và góp ý.
// Thư mục luồng: mỗi màn một page, tạo bằng --screen theo thứ tự màn. Một thư mục là thư mục phương án (--option) hay
// thư mục luồng (--screen), không trộn.
// init chép khuôn brief.md: bản tóm tắt chung mà mọi page, và mọi agent con dựng page song song, cùng đọc.
// page chép khuôn trống templates/page.html (chỉ có khối chờ: tên màn, tên page, bố cục page hay việc của màn, các
// việc page tiện cho) và tạo danh sách bước dựng <file>.progress.js cạnh page: bước chuẩn bị (prep: agent chính
// viết brief) rồi sáu bước dựng. progress không cờ in danh sách và bước đầu tiên chưa xong; --prepared đánh dấu bước
// chuẩn bị xong và ghi sẵn việc con đầu tiên của bước dựng 1 (agent con đọc brief, luật UX, UI vài phút trước khi tự ghi
// việc con), agent chính chạy cho mọi page sau khi điền brief (--prepared --all: mọi page trong pages.js); --doing ghi việc con đang làm vào bước dựng dở;
// --done đánh dấu bước dựng đó xong và xoá việc con; --insert chèn một bước trước bước kiểm đầy đủ của danh sách dựng.
// Góp ý sau khi dựng là mục góp ý (feedback), không là bước dựng: --comment <id> mở mục cho comment gửi từ page, --chat
// mở mục cho một ý gõ trong chat; mỗi lúc chỉ một mục mở, mở mục thì mở lại bước giao. Trong mục đang mở, --doing ghi
// việc agent đang làm, việc trước thành xong và ở lại dưới mục; --checked đóng mục sau khi kiểm đầy đủ. Bước chuẩn bị
// chưa xong thì --doing, --done báo lỗi.
// --delivered đánh dấu bước giao (deliver: agent chính kiểm lại và giao) xong; agent chính chạy ngay trước tin giao, khi
// mọi bước dựng và mục góp ý đã xong (--delivered --all: mọi page trong pages.js). --done, --insert, --checked, và --doing
// khi nó đóng một việc của mục góp ý, tăng rev một: shell của page đang mở thấy rev đổi thì tải lại; --prepared,
// --delivered, --comment, --chat và --doing của bước dựng không đổi page nên giữ rev, shell chỉ vẽ lại nhãn. Ngoài bước
// chuẩn bị và bước giao, chỉ agent dựng page đó chạy progress trên file đó.
// File tiến độ ghi theo kiểu cũ (bước góp ý xếp theo vòng, round ≥ 2) được đọc thành mục góp ý (normalizeProgress).
//
// Mọi thư mục design trong .design-uiux/ dùng chung một shell ở .design-uiux/_shell/, page nạp ../_shell/. shell chỉ bọc quanh
// page (toolbar, panel), không đụng vào bản thiết kế, nên cập nhật nó không đổi hình design cũ. init và lệnh shell chép
// bản mới nhất của skill đè lên; lệnh shell còn chuyển thư mục design kiểu cũ (có _shell/ riêng) sang dùng shell chung.
//
// Không có design system thì người dùng chọn một bộ của getdesign: designs in các bộ tokens.mjs đọc được (stdout
// `tên - mô tả`), init --getdesign tải bộ đã chọn vào thư mục design. Exit 1 là lỗi chọn (tên lạ, bộ chỉ có chữ);
// exit 2 là không chạy được getdesign (gói đổi cấu trúc, registry lỗi), agent dừng và báo lỗi.
//
// open mở page đầu tiên của pages.js (phương án A, màn 1) trong một cửa sổ Chrome mới, một tab; người xem sang page khác
// bằng option-switcher. Lệnh không chọn profile, nên Chrome dùng profile dùng gần nhất. macOS: open -na "Google Chrome"
// --args --new-window (tên ứng dụng đổi được bằng DESIGN_UIUX_CHROME_APP, chỉ để test nhánh thiếu Chrome); Linux:
// google-chrome --new-window; thiếu Chrome thì mở bằng trình duyệt mặc định (open, xdg-open); hệ khác không mở gì.
// stdout một dòng `chrome | default | none <url>`; --dry-run in thêm `$ <lệnh>` và không chạy. Exit 2: không mở được.
//
// comment-bridge bật cầu nối comment cho thư mục design rồi thoát. Cầu nối là một tiến trình chạy riêng cạnh session
// (cha là tiến trình 1), sống tới khi tiến trình CLAUDE_PID mất; không có CLAUDE_PID thì tới khi 8 giờ không có comment.
// Cầu nối nghe 127.0.0.1 ở một cổng trống với token mới, ghi <thư mục design>/_comment-bridge.js (cổng, token, mã và
// nơi chạy của session, có hộp thư hay không) để shell biết gửi tới đâu và biết session đã đóng; lúc tắt thêm endedAt,
// không xoá file. Mỗi comment đúng token: đánh số, status `sent`, thêm vào comments.json (và comments.js cho shell đọc),
// rồi gửi một tin vào hộp thư của session (CLAUDE_CODE_MESSAGING_SOCKET, CLAUDE_CODE_MESSAGING_TOKEN) để đánh thức nó.
// stdout `comment-bridge <cổng> inbox|none` (none: session không có hộp thư, comment chỉ được lưu). Cầu nối của chính
// session này đang chạy thì in cổng cũ. --stop tắt cầu nối đang chạy. Exit 1: cầu nối của session khác đang chạy trên
// thư mục đó. Exit 2: thư mục sai hay cầu nối không lên.
// comment --pending in mỗi comment chưa sửa (sent, doing) một dòng JSON; --status đổi trạng thái một comment; --add ghi
// comment từ dòng comment-json của prompt chép từ page, in #<id>.
//
// spec: F1.2 F1.17 F4 F3.6 F3.8 F6.2 F6.6 F6.10 F6.14 F6.15 F7.3 F7.5 F7.7 F7.8 F7.11 F7.12 F7.13

import { spawn, spawnSync } from "node:child_process";
import { randomBytes } from "node:crypto";
import { createServer } from "node:http";
import { createConnection } from "node:net";
import { cpSync, existsSync, lstatSync, mkdirSync, mkdtempSync, readdirSync, readFileSync, realpathSync, renameSync, rmSync, unlinkSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { appendRun } from "./run-log.mjs";
import { buildTokens, weakPairs } from "./tokens.mjs";

const skillDir = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const today = new Date().toISOString().slice(0, 10);
const GETDESIGN = "getdesign@latest";

function parseArgs(argv) {
  const positional = [];
  const flags = {};
  for (let index = 0; index < argv.length; index += 1) {
    if (!argv[index].startsWith("--")) {
      positional.push(argv[index]);
      continue;
    }
    // Cờ đứng ngay trước một cờ khác là cờ không có giá trị: --prepared --all.
    if (argv[index + 1]?.startsWith("--")) {
      flags[argv[index].slice(2)] = true;
      continue;
    }
    flags[argv[index].slice(2)] = argv[index + 1];
    index += 1;
  }
  return { positional, flags };
}

function fail(message, code = 1) {
  console.error(`new-design: ${message}`);
  process.exit(code);
}

function firstLine(text) {
  return text.split("\n").map((line) => line.trim()).find(Boolean) ?? "không rõ lỗi";
}

// ---------- getdesign ----------

// CLI getdesign không cho biết bộ nào có YAML đầu file, nên đọc thẳng templates/ của gói trong cache npx.
function getdesignManifest() {
  const locate = 'const fs=require("fs"),p=require("path");console.log(p.join(p.dirname(fs.realpathSync(process.argv[1])),"..","templates"))';
  const run = spawnSync("npx", ["-y", "-p", GETDESIGN, "-c", `node -e '${locate}' "$(command -v getdesign)"`], { encoding: "utf8" });
  if (run.error || run.status !== 0) fail(`không lấy được danh sách getdesign: ${firstLine(run.stderr || run.error?.message || "")}`, 2);
  const dir = run.stdout.trim().split("\n").at(-1);
  try {
    return { dir, entries: JSON.parse(readFileSync(join(dir, "manifest.json"), "utf8")) };
  } catch (error) {
    fail(`không lấy được danh sách getdesign: không đọc được ${join(dir, "manifest.json")} (${firstLine(error.message)})`, 2);
  }
}

function designs() {
  const { dir, entries } = getdesignManifest();
  const textOnly = [];
  const broken = [];
  for (const entry of entries) {
    try {
      buildTokens(join(dir, entry.file));
      console.log(`${entry.brand} - ${entry.description}`);
    } catch (error) {
      (/không có YAML/.test(error.message) ? textOnly : broken).push(entry.brand);
    }
  }
  const kept = entries.length - textOnly.length - broken.length;
  const notes = [textOnly.length && `bỏ (chỉ có chữ, không có token): ${textOnly.join(", ")}`, broken.length && `bỏ (tokens.mjs báo lỗi): ${broken.join(", ")}`].filter(Boolean);
  console.error([`${kept}/${entries.length} bộ có token`, ...notes].join("; "));
}

// Tải vào thư mục tạm: thư mục design chỉ có số sau khi init đặt, và tải hỏng thì không để lại thư mục dở.
function downloadGetdesign(name) {
  const file = join(mkdtempSync(join(tmpdir(), "getdesign-")), "DESIGN.md");
  const run = spawnSync("npx", ["-y", GETDESIGN, "add", name, "--out", file], { encoding: "utf8" });
  if (run.error || run.status !== 0) {
    rmSync(dirname(file), { recursive: true });
    const message = run.stderr || run.error?.message || "";
    if (/Unknown brand/.test(message)) fail(`getdesign không có ${name}`);
    fail(`không tải được ${name} từ getdesign: ${firstLine(message)}`, 2);
  }
  return file;
}

function nextNumber(names, width) {
  const numbers = names.map((name) => Number(name.match(new RegExp(`^(\\d{${width}})-`))?.[1])).filter(Number.isFinite);
  return String((numbers.length ? Math.max(...numbers) : 0) + 1).padStart(width, "0");
}

export function readPages(designDir) {
  const file = join(designDir, "pages.js");
  if (!existsSync(file)) return [];
  const json = readFileSync(file, "utf8").match(/window\.DESIGN_PAGES\s*=\s*(\[[\s\S]*\]);/)?.[1];
  if (!json) fail(`${file} không đúng dạng window.DESIGN_PAGES = [...];`);
  return JSON.parse(json);
}

function writePages(designDir, pages) {
  const header = "// Danh sách page của thư mục design. option-switcher trên toolbar đọc file này; new-design.mjs page tự thêm dòng.";
  writeFileSync(join(designDir, "pages.js"), `${header}\nwindow.DESIGN_PAGES = ${JSON.stringify(pages, null, 2)};\n`);
}

function slugify(value) {
  return value.normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/đ/gi, "d").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

// Nguồn token hỏng hay --page-width sai dạng thì báo một dòng, không in stack.
function tokensOrFail(source, flags) {
  try {
    return buildTokens(source, { pageWidth: flags["page-width"] });
  } catch (error) {
    fail(error.message);
  }
}

// Chép shell của skill vào <root>/_shell/. <root>/_shell là link về chính shell của skill (lúc sửa shell) thì để nguyên.
// Thư mục design kiểu cũ có _shell/ riêng: page đổi sang ../_shell/, _shell/ riêng bị xoá.
function refreshShell(root) {
  const source = join(skillDir, "shell");
  const target = join(root, "_shell");
  const linked = existsSync(target) && realpathSync(target) === realpathSync(source);
  if (!linked) cpSync(source, target, { recursive: true, filter: (path) => !path.endsWith(".md") });
  const moved = [];
  for (const name of readdirSync(root)) {
    const dir = join(root, name);
    if (name === "_shell" || !lstatSync(dir).isDirectory() || !existsSync(join(dir, "_shell"))) continue;
    for (const file of readdirSync(dir).filter((item) => item.endsWith(".html"))) {
      const html = readFileSync(join(dir, file), "utf8");
      writeFileSync(join(dir, file), html.replace(/(["'])_shell\//g, "$1../_shell/"));
    }
    // _shell riêng là link (về shell của skill) thì chỉ gỡ link, không xoá thứ nó trỏ tới.
    if (lstatSync(join(dir, "_shell")).isSymbolicLink()) unlinkSync(join(dir, "_shell"));
    else rmSync(join(dir, "_shell"), { recursive: true });
    moved.push(name);
  }
  return { target, linked, moved };
}

function shell(flags) {
  const root = resolve(flags.root ?? ".design-uiux");
  if (!existsSync(root)) fail(`không thấy ${root}`);
  const { target, linked, moved } = refreshShell(root);
  console.log(linked ? `${target} là link về shell của skill, giữ nguyên` : `${target} đã là bản mới nhất`);
  if (moved.length) console.log(`chuyển sang shell chung: ${moved.join(", ")}`);
}

function init(slug, flags) {
  if (!slug) fail("thiếu <slug>");
  if ("getdesign" in flags && !flags.getdesign) fail("thiếu <tên> sau --getdesign");
  if (flags.tokens && flags.getdesign) fail("chỉ dùng một trong --tokens, --getdesign");
  if (flags.tokens && !existsSync(resolve(flags.tokens))) fail(`không thấy ${flags.tokens}`);
  // Sinh token trước: nguồn hỏng thì dừng khi chưa tạo thư mục nào, không để lại thư mục dở dang.
  const source = flags.getdesign ? downloadGetdesign(flags.getdesign) : resolve(flags.tokens ?? join(skillDir, "shell/default-design.md"));
  let tokens;
  try {
    tokens = buildTokens(source, { pageWidth: flags["page-width"], ...(flags.getdesign && { source: `getdesign ${flags.getdesign}` }) });
  } catch (error) {
    if (flags.getdesign) rmSync(dirname(source), { recursive: true });
    if (flags.getdesign && /không có YAML/.test(error.message)) fail(`${flags.getdesign} chỉ có phần chữ, không có token`);
    fail(error.message);
  }
  const root = resolve(flags.root ?? ".design-uiux");
  mkdirSync(root, { recursive: true });
  const designDir = join(root, `${nextNumber(readdirSync(root), 3)}-${slugify(slug)}`);
  mkdirSync(designDir);
  refreshShell(root);
  writeFileSync(join(designDir, "tokens.js"), tokens);
  if (flags.getdesign) {
    cpSync(source, join(designDir, "DESIGN.md"));
    rmSync(dirname(source), { recursive: true });
  }
  cpSync(join(skillDir, "templates/brief.md"), join(designDir, "brief.md"));
  writePages(designDir, []);
  printWeakPairs(flags.getdesign ? join(designDir, "DESIGN.md") : source);
  appendRun(designDir, "new-design", "init", "-", process.uptime(), `${flags.getdesign ? `getdesign ${flags.getdesign}` : flags.tokens ? `tokens ${flags.tokens}` : "token mặc định"}${flags["page-width"] ? ` · page-width ${flags["page-width"]}` : ""}`);
  console.log(designDir);
}

// In ra stderr, để `D=$(new-design.mjs init …)` vẫn chỉ nhận đường dẫn thư mục.
function printWeakPairs(source) {
  const pairs = weakPairs(source);
  if (!pairs.length) return;
  const label = { light: "sáng", dark: "tối" };
  console.error('Cặp màu dưới 4.5 : 1 (UX10) — chốt cách dùng vào "Cặp màu không đủ đọc" của brief.md:');
  for (const pair of pairs) {
    console.error(`  ${label[pair.theme].padEnd(4)}  ${`${pair.fg} trên ${pair.bg}`.padEnd(34)} ${pair.ratio.toFixed(2)} : 1${pair.derived ? " (suy ra)" : ""}`);
  }
}

function addPage(designDir, slug, flags) {
  if (!designDir || !slug) fail("cần <thư mục design> <slug>");
  if (!flags.title) fail("thiếu --title");
  const dir = resolve(designDir);
  if (!existsSync(join(dir, "pages.js"))) fail(`${dir} chưa phải thư mục design (thiếu pages.js), chạy init trước`);
  if (!existsSync(join(dir, "../_shell"))) fail(`thiếu ${join(dirname(dir), "_shell")}, chạy: node new-design.mjs shell --root ${dirname(dir)}`);
  const pages = readPages(dir);
  if (flags.screen && flags.option) fail("một page là phương án (--option) hay màn của luồng (--screen), không cả hai");
  if (flags.screen && pages.some((page) => page.option)) fail(`${dir} là thư mục phương án (có page --option), không thêm màn --screen`);
  if (flags.option && pages.some((page) => page.screen)) fail(`${dir} là thư mục luồng (có page --screen), không thêm phương án --option`);
  if (flags.screen && !/^\s*\d+\s*·\s*\S/.test(flags.screen)) fail(`--screen phải dạng "<n> · <tên màn>", nhận "${flags.screen}"`);
  const file = `${nextNumber(readdirSync(dir), 2)}-${slugify(slug)}.html`;
  // Khối chờ: dòng trên là tên màn (phần trước " · " của --title), tiêu đề là tên page, phụ đề là bố cục page
  // (phương án) hay việc của màn (luồng), dòng nhỏ là các việc page tiện cho. Cờ nào không có thì bỏ cả dòng của nó.
  // Khung mô tả của nút phương án trên shell hiện cùng các dòng này, đọc từ pages.js.
  const waiting = {
    screenName: flags.title.includes(" · ") ? flags.title.split(" · ")[0].trim() : "",
    name: flags.option ?? flags.screen ?? flags.title,
    subtitle: flags.layout ?? flags.purpose ?? "",
    meta: flags["good-for"] ? `Tiện cho: ${flags["good-for"]}` : "",
  };
  const template = Object.entries(waiting).reduce(
    (html, [key, value]) => (value ? html.replaceAll(`{{${key}}}`, escapeHtml(value)) : html.replace(new RegExp(`\\n[^\\n]*\\{\\{${key}\\}\\}[^\\n]*`, "g"), "")),
    readFileSync(join(skillDir, "templates/page.html"), "utf8").replace(/<title>[^<]*<\/title>/, `<title>${escapeHtml(flags.title)}</title>`),
  );
  writeFileSync(join(dir, file), template);
  writeProgress(dir, file, { rev: 0, prep: { task: PREP_STEP, done: false }, deliver: { task: DELIVER_STEP, done: false }, build: BUILD_STEPS.map((task, index) => ({ task, done: false, ...(index === BUILD_STEPS.length - 1 ? { final: true } : {}) })), feedback: [] });
  const extra = Object.fromEntries([["option"], ["layout"], ["good-for", "goodFor"], ["screen"], ["purpose"], ["note"]].filter(([flag]) => flags[flag]).map(([flag, key = flag]) => [key, flags[flag]]));
  pages.push({ file, title: flags.title, ...extra, updated: today });
  writePages(dir, pages);
  appendRun(dir, "new-design", "page", file, process.uptime(), flags.option ?? flags.screen ?? flags.title ?? "");
  console.log(join(dir, file));
}

// Sáu bước dựng cố định cho mọi page; bước cuối là kiểm đầy đủ (final). Agent chèn thêm bước bằng --insert, không bớt.
// Bước chuẩn bị nằm ngoài sáu bước dựng, để số bước dựng khớp bảng sáu bước trong references/build-page.md. File không có prep (page tạo
// trước khi có bước này) coi như đã chuẩn bị xong. Bước giao nằm sau mọi vòng, của agent chính: kiểm lại cả thư mục rồi
// giao. Nhãn chỉ báo xong khi bước này xong. File không có deliver (page tạo trước khi có bước này) coi như đã giao.
const PREP_STEP = "Viết brief chung";
const DELIVER_STEP = "Kiểm lại và giao";
const FIRST_DOING = "Đọc brief và luật UX, UI";
const BUILD_STEPS = ["Khung các khối, dữ liệu mặc định", "Đang tải · rỗng · lỗi", "Trạng thái riêng của đề", "Tương tác: bấm, gõ, mở, đóng", "Preset và ca biên", "Kiểm đầy đủ và tự kiểm"];
const escapeHtml = (value) => String(value).replace(/[&<>"']/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[char]);
const progressPath = (dir, file) => join(dir, `${file.replace(/\.html?$/, "")}.progress.js`);

export function readProgress(dir, file) {
  const path = progressPath(dir, file);
  if (!existsSync(path)) return null;
  const json = readFileSync(path, "utf8").match(/\]\s*=\s*(\{[\s\S]*\});\s*$/)?.[1];
  if (!json) fail(`${path} không đúng dạng (window.DESIGN_PROGRESS ||= {})["<file>"] = {...};`);
  return normalizeProgress(JSON.parse(json));
}

// File kiểu cũ xếp góp ý theo vòng: bước round ≥ 2 nằm chung build. Tách thành mục góp ý: "Góp ý: Comment #<n>: …" (hay
// "Comment #<n>: …" chèn bằng --insert) là mục comment, bước khác là mục chat; bước kiểm đầy đủ của vòng thành việc cuối của mọi mục trong vòng đó. shell.js có
// cùng phép chuyển (normalizeProgress) để page cũ mở bằng shell mới vẫn đúng.
export function normalizeProgress(data) {
  const feedback = [...(data.feedback ?? [])];
  const later = data.build.filter((item) => Number(item.round) > 1);
  for (const round of [...new Set(later.map((item) => Number(item.round)))]) {
    const steps = later.filter((item) => Number(item.round) === round);
    const check = steps.find((item) => item.final);
    for (const step of steps.filter((item) => !item.final)) {
      const [, id, rest] = step.task.match(/^(?:Góp ý: )?Comment #(\d+): (.*)$/) ?? [];
      const actions = [...(step.doing ? [{ task: step.doing, done: false }] : []), { task: check?.task ?? "Kiểm đầy đủ", done: Boolean(check?.done), final: true }];
      feedback.push({ source: id ? "comment" : "chat", ...(id ? { id: Number(id) } : {}), task: id ? rest : step.task.replace(/^Góp ý: /, ""), done: Boolean(step.done && check?.done), actions });
    }
  }
  const build = data.build.filter((item) => !(Number(item.round) > 1)).map(({ round, ...item }) => item);
  return { ...data, build, feedback };
}

// Ghi ra file tạm rồi rename: shell đọc lại file mỗi 2 giây, ghi thẳng thì có lượt đọc trúng file ghi dở.
function writeProgress(dir, file, data) {
  const path = progressPath(dir, file);
  const header = `// Danh sách bước dựng của ${file}. Shell đọc file này để hiện tiến độ; chỉ ghi bằng: node new-design.mjs progress`;
  const feedback = data.feedback?.length ? `,\n  "feedback": [\n${data.feedback.map((item) => `    ${JSON.stringify(item)}`).join(",\n")}\n  ]` : `,\n  "feedback": []`;
  const body = `{\n  "rev": ${data.rev},\n${data.prep ? `  "prep": ${JSON.stringify(data.prep)},\n` : ""}${data.deliver ? `  "deliver": ${JSON.stringify(data.deliver)},\n` : ""}  "build": [\n${data.build.map((item) => `    ${JSON.stringify(item)}`).join(",\n")}\n  ]${feedback}\n}`;
  writeFileSync(`${path}.tmp`, `${header}\n(window.DESIGN_PROGRESS ||= {})[${JSON.stringify(file)}] = ${body};\n`);
  renameSync(`${path}.tmp`, path);
}

const feedbackLabel = (item) => (item.source === "comment" ? `#${item.id} ${item.task}` : item.task);
const openFeedback = (data) => data.feedback.find((item) => !item.done);

function printProgress(file, data) {
  const open = data.build.findIndex((item) => !item.done);
  const preparing = data.prep && !data.prep.done;
  if (data.prep) console.log(`Chuẩn bị\n  ${preparing ? "●" : "✓"} ${data.prep.task}`);
  if (preparing) {
    data.build.forEach((item, index) => console.log(`${index ? "" : "Dựng\n"}  ○ ${index + 1}. ${item.task}`));
    console.log(`${file}: đang chuẩn bị (${data.prep.task}); agent chính chạy --prepared khi brief đã điền xong`);
    return;
  }
  console.log("Dựng");
  data.build.forEach((item, index) => {
    console.log(`  ${item.done ? "✓" : index === open ? "●" : "○"} ${index + 1}. ${item.task}`);
    if (index === open && item.doing) console.log(`       ↳ ${item.doing}`);
  });
  for (const [source, title] of [["comment", "Comment"], ["chat", "Góp ý trong chat"]]) {
    const items = data.feedback.filter((item) => item.source === source);
    if (!items.length) continue;
    console.log(title);
    for (const item of items) {
      console.log(`  ${item.done ? "✓" : "●"} ${feedbackLabel(item)}`);
      const current = item.actions.findIndex((action) => !action.done);
      item.actions.forEach((action, index) => console.log(`       ${action.done ? "✓" : index === current ? "●" : "○"} ${action.task}`));
    }
  }
  if (data.deliver) console.log(`Giao\n  ${data.deliver.done ? "✓" : "○"} ${data.deliver.task}`);
  const item = openFeedback(data);
  if (open >= 0) console.log(`${file}: bước dựng tiếp theo là ${open + 1} · ${data.build[open].task}`);
  else if (item) console.log(`${file}: đang sửa góp ý ${feedbackLabel(item)}; --doing "<việc>" cho từng việc, kiểm đầy đủ rồi --checked`);
  else if (data.deliver && !data.deliver.done) console.log(`${file}: mọi bước dựng và góp ý đã xong, chưa giao; agent chính chạy --delivered ngay trước tin giao`);
  else console.log(`${file}: mọi bước dựng và góp ý đã xong, đã giao`);
}

// Bước đầu tiên chưa xong trước bước giao: bước chuẩn bị, rồi các bước dựng. null là sẵn sàng giao.
function blockingStep(data) {
  if (data.prep && !data.prep.done) return data.prep.task;
  const open = data.build.findIndex((item) => !item.done);
  if (open >= 0) return `${open + 1} · ${data.build[open].task}`;
  const item = openFeedback(data);
  return item ? `góp ý ${feedbackLabel(item)}` : null;
}

// Bước chuẩn bị không đổi page: ghi mà không tăng rev, page đang mở chỉ đổi nhãn.
function markPrepared(dir, file, data) {
  const open = data.build.findIndex((item) => !item.done);
  data.prep.done = true;
  if (open >= 0 && !data.build[open].doing) data.build[open].doing = FIRST_DOING;
  writeProgress(dir, file, data);
  appendRun(dir, "new-design", "prepared", file, process.uptime(), data.prep.task);
  printProgress(file, data);
}

// Bước giao không đổi page: ghi mà không tăng rev, page đang mở chỉ đổi nhãn.
function markDelivered(dir, file, data) {
  data.deliver.done = true;
  writeProgress(dir, file, data);
  appendRun(dir, "new-design", "delivered", file, process.uptime(), data.deliver.task);
  printProgress(file, data);
}

// --prepared --all: agent chính đánh dấu bước chuẩn bị của mọi page một lần, sau khi điền brief. --delivered --all: đánh
// dấu bước giao của mọi page ngay trước tin giao; page nào còn bước chưa xong thì không ghi page nào.
function markAll(designDir, file, flags) {
  const mark = ["prepared", "delivered"].filter((flag) => flag in flags);
  const others = Object.keys(flags).filter((flag) => flag !== "all" && !mark.includes(flag));
  if (mark.length !== 1 || others.length || file) fail("--all chỉ đi với --prepared hay --delivered, không kèm <file>: progress <thư mục design> (--prepared | --delivered) --all");
  if (!designDir) fail("cần <thư mục design>");
  const dir = resolve(designDir);
  const files = readPages(dir).map((page) => page.file).filter((name) => readProgress(dir, name));
  if (!files.length) fail("pages.js không có page nào có danh sách bước dựng");
  if (mark[0] === "prepared") {
    // Brief sai thì mọi agent dựng page cùng dựng theo chỗ sai, và agent dựng page không được sửa brief: soát brief.md,
    // pages.js trước khi đánh dấu page nào.
    const brief = spawnSync(process.execPath, [join(skillDir, "scripts/check.mjs"), dir, "--brief"], { encoding: "utf8" });
    if (brief.status !== 0) fail(`brief.md chưa xong, chưa đánh dấu page nào. Sửa brief rồi chạy lại:\n${brief.stdout.trim()}`);
    for (const name of files) {
      const data = readProgress(dir, name);
      if (!data.prep || data.prep.done) console.log(`${name}: bước chuẩn bị đã xong, bỏ qua`);
      else markPrepared(dir, name, data);
    }
    appendRun(dir, "new-design", "prepared-all", "-", process.uptime(), `${files.length} page, đã soát brief`);
    return;
  }
  const blocked = files.map((name) => [name, blockingStep(readProgress(dir, name))]).filter(([, step]) => step);
  if (blocked.length) fail(`chưa giao được, còn bước chưa xong:\n${blocked.map(([name, step]) => `  ${name}: ${step}`).join("\n")}`);
  for (const name of files) {
    const data = readProgress(dir, name);
    if (!data.deliver || data.deliver.done) console.log(`${name}: đã giao, bỏ qua`);
    else markDelivered(dir, name, data);
  }
  appendRun(dir, "new-design", "delivered-all", "-", process.uptime(), `${files.length} page`);
}

function progress(designDir, file, flags, rest) {
  if ("all" in flags) return markAll(designDir, file, flags);
  if (!designDir || !file) fail("cần <thư mục design> <file>");
  const dir = resolve(designDir);
  if (!existsSync(join(dir, file))) fail(`không thấy ${join(dir, file)}`);
  const data = readProgress(dir, file);
  if (!data) fail(`${file} không có danh sách bước dựng (page dựng trước khi có danh sách)`);
  const open = data.build.findIndex((item) => !item.done);
  const preparing = data.prep && !data.prep.done;
  if ("prepared" in flags) {
    if (!data.prep) fail(`${file} không có bước chuẩn bị (page tạo trước khi có bước này)`);
    if (data.prep.done) fail("bước chuẩn bị đã xong");
    markPrepared(dir, file, data);
    return;
  }
  if ("delivered" in flags) {
    if (!data.deliver) fail(`${file} không có bước giao (page tạo trước khi có bước này)`);
    if (data.deliver.done) fail("bước giao đã xong; góp ý mới thì mở mục bằng --comment <id> hay --chat");
    const step = blockingStep(data);
    if (step) fail(`chưa giao được, bước đầu tiên chưa xong là ${step}`);
    markDelivered(dir, file, data);
    return;
  }
  if (preparing && (flags.doing !== undefined || flags.done !== undefined)) fail(`bước chuẩn bị (${data.prep.task}) chưa xong; agent chính chạy --prepared trước khi dựng`);
  const item = openFeedback(data);
  if ("round" in flags) fail("không còn vòng góp ý: mỗi comment mở mục bằng --comment <id> \"<tóm tắt>\", mỗi ý trong chat bằng --chat \"<ý>\"");
  if ("comment" in flags || "chat" in flags) {
    if (preparing || open >= 0) fail(`còn bước dựng chưa xong: ${blockingStep(data)}; góp ý mở sau khi dựng xong`);
    if (item) fail(`còn góp ý ${feedbackLabel(item)} chưa xong; làm xong (--checked) rồi mới mở mục mới`);
    let entry;
    if ("comment" in flags) {
      const id = Number(flags.comment);
      const task = rest.join(" ").trim();
      if (!Number.isInteger(id) || id < 1 || !task) fail('--comment <id> "<tóm tắt>"');
      if (data.feedback.some((other) => other.source === "comment" && other.id === id)) fail(`comment #${id} đã có mục`);
      entry = { source: "comment", id, task };
    } else {
      const task = [flags.chat, ...rest].filter((part) => typeof part === "string").join(" ").trim();
      if (!task) fail('--chat "<ý>"');
      entry = { source: "chat", task };
    }
    data.feedback.push({ ...entry, done: false, actions: [{ task: "Kiểm đầy đủ", done: false, final: true }] });
    if (data.deliver) data.deliver.done = false;
    writeProgress(dir, file, data);
    appendRun(dir, "new-design", entry.source, file, process.uptime(), feedbackLabel(entry));
    printProgress(file, data);
    return;
  }
  if (flags.doing !== undefined && open < 0) {
    // Việc của mục góp ý: việc trước thành xong và ở lại dưới mục, page đã đổi theo việc đó nên tăng rev để page tải lại.
    if (!item) fail('không có bước dựng hay góp ý nào đang mở; góp ý mới thì mở mục bằng --comment <id> hay --chat');
    if (typeof flags.doing !== "string" || !flags.doing.trim()) fail("--doing cần tên việc");
    const final = item.actions.findIndex((action) => action.final);
    const current = item.actions.findIndex((action) => !action.done && !action.final);
    if (current >= 0) item.actions[current].done = true;
    // Việc cuối (kiểm đầy đủ) đã có sẵn dưới mục: --doing đúng tên đó chỉ đóng việc đang làm, không thêm dòng thứ hai.
    if (flags.doing.trim() !== item.actions[final].task) item.actions.splice(final, 0, { task: flags.doing.trim(), done: false });
    if (current >= 0) data.rev += 1;
    writeProgress(dir, file, data);
    appendRun(dir, "new-design", "doing", file, process.uptime(), `${feedbackLabel(item)} · ${flags.doing.trim()}`);
    printProgress(file, data);
    return;
  }
  if ("checked" in flags) {
    if (!item) fail("không có góp ý nào đang mở");
    for (const action of item.actions) action.done = true;
    item.done = true;
    data.rev += 1;
    writeProgress(dir, file, data);
    appendRun(dir, "new-design", "checked", file, process.uptime(), feedbackLabel(item));
    printProgress(file, data);
    return;
  }
  if (flags.doing !== undefined) {
    // Việc con của bước dựng không đổi page: ghi mà không tăng rev, để page đang mở chỉ vẽ lại danh sách, không tải lại.
    if (typeof flags.doing !== "string" || !flags.doing.trim()) fail("--doing cần tên việc con");
    data.build[open].doing = flags.doing.trim();
    writeProgress(dir, file, data);
    appendRun(dir, "new-design", "doing", file, process.uptime(), `${open + 1} · ${flags.doing.trim()}`);
    printProgress(file, data);
    return;
  }
  if (flags.done !== undefined) {
    if (open < 0) fail("mọi bước dựng đã xong; góp ý dùng --comment <id> hay --chat, đóng mục bằng --checked");
    if (Number(flags.done) !== open + 1) fail(`bước dựng đầu tiên chưa xong là ${open + 1} · ${data.build[open].task}, không phải ${flags.done}`);
    data.build[open].done = true;
    delete data.build[open].doing;
  } else if (flags.insert !== undefined) {
    if (open < 0) fail("mọi bước dựng đã xong; góp ý dùng --comment <id> hay --chat");
    const final = data.build.findIndex((step, index) => index >= open && step.final);
    data.build.splice(final < 0 ? data.build.length : final, 0, { task: flags.insert, done: false });
  } else {
    printProgress(file, data);
    return;
  }
  data.rev += 1;
  writeProgress(dir, file, data);
  const action = flags.done !== undefined ? "done" : "insert";
  appendRun(dir, "new-design", action, file, process.uptime(), action === "done" ? `${open + 1} · ${data.build[open].task}` : flags.insert);
  printProgress(file, data);
}

function touch(designDir, file, flags) {
  if (!designDir || !file) fail("cần <thư mục design> <file>");
  const dir = resolve(designDir);
  const pages = readPages(dir);
  const page = pages.find((item) => item.file === file);
  if (!page) fail(`${file} không có trong pages.js`);
  page.updated = today;
  if (flags.note) page.note = flags.note;
  writePages(dir, pages);
  appendRun(dir, "new-design", "touch", file, process.uptime(), flags.note ?? "");
  console.log(join(dir, file));
}

function tokens(source, flags) {
  if (!source) fail("thiếu <DESIGN.md | tokens.css>");
  const output = tokensOrFail(resolve(source), flags);
  if (flags.out) writeFileSync(flags.out, output);
  else process.stdout.write(output);
}

function openPage(designDir, flags) {
  if (!designDir) fail("cần <thư mục design>");
  const dir = resolve(designDir);
  const first = readPages(dir)[0];
  if (!first) fail(`${join(dir, "pages.js")} không có page nào`);
  const url = pathToFileURL(join(dir, first.file)).href;
  const dryRun = "dry-run" in flags;
  const quote = (arg) => (/^[\w./:%-]+$/.test(arg) ? arg : `"${arg}"`);
  const done = (how, command) => {
    if (dryRun && command) console.log(`$ ${command.map(quote).join(" ")}`);
    if (!dryRun) appendRun(dir, "new-design", "open", first.file, process.uptime(), how);
    console.log(`${how} ${url}`);
  };
  // Chrome và xdg-open trên Linux chạy tới khi đóng cửa sổ: tách khỏi lệnh này để lệnh trả về ngay.
  const detach = ([bin, ...args]) => spawn(bin, args, { detached: true, stdio: "ignore" }).unref();
  const onPath = (bin) => spawnSync("sh", ["-c", `command -v ${bin}`], { stdio: "ignore" }).status === 0;
  const fallback = () => console.error("new-design: không có Google Chrome, mở bằng trình duyệt mặc định");

  if (process.platform === "darwin") {
    const chrome = ["open", "-na", process.env.DESIGN_UIUX_CHROME_APP || "Google Chrome", "--args", "--new-window", url];
    if (dryRun) return done("chrome", chrome);
    if (spawnSync(chrome[0], chrome.slice(1)).status === 0) return done("chrome");
    fallback();
    if (spawnSync("open", [url]).status === 0) return done("default");
    fail(`không mở được ${url}`, 2);
  }
  if (process.platform === "linux") {
    const chrome = ["google-chrome", "--new-window", url];
    if (dryRun) return done("chrome", chrome);
    if (onPath(chrome[0])) return detach(chrome), done("chrome");
    fallback();
    if (onPath("xdg-open")) return detach(["xdg-open", url]), done("default");
    fail(`không mở được ${url}: không có google-chrome lẫn xdg-open`, 2);
  }
  done("none");
}

// Comment trên page. comments.json là nơi lưu chính; comments.js là bản sao shell đọc lại mỗi 2 giây bằng thẻ <script>
// (file:// không đọc được file bằng fetch). Ghi file tạm rồi rename như .progress.js.
const COMMENT_STATUS = ["sent", "doing", "done"];
const commentsPath = (dir) => join(dir, "comments.json");
export function readComments(dir) {
  return existsSync(commentsPath(dir)) ? JSON.parse(readFileSync(commentsPath(dir), "utf8")) : [];
}
function writeComments(dir, comments) {
  const json = JSON.stringify(comments, null, 2);
  for (const [path, text] of [
    [commentsPath(dir), `${json}\n`],
    [join(dir, "comments.js"), `// Comment người xem gửi từ page. Chỉ ghi bằng: node new-design.mjs comment-bridge · comment\nwindow.DS_COMMENTS = ${json};\n`],
  ]) {
    writeFileSync(`${path}.tmp`, text);
    renameSync(`${path}.tmp`, path);
  }
}

// Chỉ giữ field shell gửi, cắt chữ dài: comment là dữ liệu người xem gõ, không để nó phình comments.json.
function cleanComment(raw) {
  const text = (value, max) => (typeof value === "string" ? value.slice(0, max) : "");
  const rect = raw.target?.rect ?? {};
  return {
    page: text(raw.page, 200),
    url: text(raw.url, 2000),
    viewport: text(raw.viewport, 20),
    theme: text(raw.theme, 20),
    target: {
      kind: raw.target?.kind === "area" ? "area" : "element",
      selector: text(raw.target?.selector, 500),
      block: text(raw.target?.block, 40),
      text: text(raw.target?.text, 200),
      rect: Object.fromEntries(["x", "y", "w", "h"].map((key) => [key, Math.round(Number(rect[key]) || 0)])),
    },
    body: text(raw.body, 4000),
  };
}

// Cầu nối comment: tiến trình chạy riêng cạnh session, cha là tiến trình 1 nên không tool nào của Claude Code đếm giờ nó.
// Lệnh không có --serve bật một bản sao --serve tách riêng, chờ nó trả lời /health, in `comment-bridge <cổng>` rồi thoát.
const BRIDGE_FILE = "_comment-bridge.js";
const BRIDGE_IDLE_MS = 8 * 3600 * 1000;
function readBridge(dir) {
  try {
    return JSON.parse(readFileSync(join(dir, BRIDGE_FILE), "utf8").match(/DS_COMMENT_BRIDGE = (\{.*\});/)[1]);
  } catch {
    return null;
  }
}
function writeBridge(dir, bridge) {
  const path = join(dir, BRIDGE_FILE);
  writeFileSync(`${path}.tmp`, `// Cầu nối comment. new-design.mjs comment-bridge ghi lúc bật, thêm endedAt lúc tắt.\nwindow.DS_COMMENT_BRIDGE = ${JSON.stringify(bridge)};\n`);
  renameSync(`${path}.tmp`, path);
}
const bridgeHealth = (port) =>
  fetch(`http://127.0.0.1:${port}/health`, { signal: AbortSignal.timeout(1500) }).then((res) => (res.ok ? res.json() : null), () => null);

async function commentBridge(designDir, flags) {
  if (!designDir) fail("cần <thư mục design>");
  const dir = resolve(designDir);
  if (!existsSync(join(dir, "pages.js"))) fail(`${dir} không phải thư mục design (thiếu pages.js)`, 2);
  const env = process.env;
  const session = { id: env.CLAUDE_CODE_SESSION_ID ?? null, entry: env.CLAUDE_CODE_ENTRYPOINT ?? null, pid: Number(env.CLAUDE_PID) || null, cwd: process.cwd() };
  if ("serve" in flags) return serveBridge(dir, session);
  const old = readBridge(dir);
  const running = old?.port && !old.endedAt ? await bridgeHealth(old.port) : null;
  if ("stop" in flags) {
    if (running) process.kill(old.pid, "SIGTERM");
    console.log(running ? `comment-bridge stopped ${old.port}` : "comment-bridge not running");
    return;
  }
  if (running) {
    const same = running.session?.id && session.id ? running.session.id === session.id : (running.session?.pid ?? null) === session.pid;
    if (!same) fail(`cầu nối comment của session ${running.session?.id ?? "?"} (${running.session?.entry ?? "?"}) đang chạy ở cổng ${old.port} cho ${dir}`);
    console.log(`comment-bridge ${old.port} ${running.wake}`);
    return;
  }
  const child = spawn(process.execPath, [fileURLToPath(import.meta.url), "comment-bridge", dir, "--serve"], { detached: true, stdio: "ignore" });
  child.unref();
  for (let i = 0; i < 50; i += 1) {
    await new Promise((done) => setTimeout(done, 100));
    const bridge = readBridge(dir);
    if (bridge?.pid === child.pid && (await bridgeHealth(bridge.port))) {
      console.log(`comment-bridge ${bridge.port} ${bridge.wake}`);
      return;
    }
  }
  fail("cầu nối comment không lên trong 5 giây", 2);
}

function serveBridge(dir, session) {
  const env = process.env;
  const inbox = env.CLAUDE_CODE_MESSAGING_SOCKET && env.CLAUDE_CODE_MESSAGING_TOKEN ? env.CLAUDE_CODE_MESSAGING_SOCKET : null;
  const wake = inbox ? "inbox" : "none";
  const token = randomBytes(16).toString("hex");
  let bridge;
  let lastComment = Date.now();
  const cors = { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Headers": "*", "Access-Control-Allow-Private-Network": "true" };
  const reply = (res, code, body) => {
    res.writeHead(code, { ...cors, "Content-Type": "application/json" });
    res.end(JSON.stringify(body));
  };
  // Gửi vào hộp thư của session: một dòng auth, một dòng tin người dùng. Hộp thư không trả lời; lỗi thì chỉ ghi run.log,
  // comment vẫn nằm trong comments.json.
  const wakeSession = (entry) => {
    if (!inbox) return;
    const text = `design-uiux: comment #${entry.id} trên ${entry.page} vừa tới từ cầu nối comment của ${dir}. Chạy \`node ${fileURLToPath(import.meta.url)} comment ${dir} --pending\` rồi sửa theo mục "Comment trên page" của SKILL.md.`;
    const sock = createConnection(inbox);
    sock.on("connect", () => {
      sock.write(`${JSON.stringify({ type: "auth", token: env.CLAUDE_CODE_MESSAGING_TOKEN })}\n`);
      sock.write(`${JSON.stringify({ type: "user", message: { role: "user", content: text } })}\n`);
      setTimeout(() => sock.end(), 500);
    });
    sock.on("error", (error) => appendRun(dir, "new-design", "comment-bridge", entry.page, process.uptime(), `#${entry.id} lỗi hộp thư: ${error.message}`));
  };
  const server = createServer((req, res) => {
    if (req.method === "OPTIONS") return reply(res, 204, {});
    if (req.method === "GET" && req.url === "/health") return reply(res, 200, { ok: true, wake, session });
    if (req.method !== "POST" || req.url !== "/comment") return reply(res, 404, { error: "not found" });
    let body = "";
    req.on("data", (chunk) => {
      body += chunk;
      if (body.length > 64 * 1024) req.destroy();
    });
    req.on("end", () => {
      let raw;
      try {
        raw = JSON.parse(body);
      } catch {
        return reply(res, 400, { error: "body không phải JSON" });
      }
      if (raw?.token !== token) return reply(res, 403, { error: "token sai" });
      const entry = addComment(dir, raw);
      if (!entry) return reply(res, 400, { error: "thiếu page hay body" });
      lastComment = Date.now();
      wakeSession(entry);
      reply(res, 201, { id: entry.id });
    });
  });
  server.listen(0, "127.0.0.1", () => {
    bridge = { port: server.address().port, token, pid: process.pid, session, wake, startedAt: new Date().toISOString() };
    writeBridge(dir, bridge);
    if (!existsSync(commentsPath(dir))) writeComments(dir, []);
    appendRun(dir, "new-design", "comment-bridge", "", process.uptime(), `cổng ${bridge.port}, hộp thư ${wake}, session ${session.id ?? "-"}`);
  });
  const stop = (reason) => {
    if (bridge && readBridge(dir)?.token === token) writeBridge(dir, { ...bridge, endedAt: new Date().toISOString() });
    appendRun(dir, "new-design", "comment-bridge", "", process.uptime(), `tắt: ${reason}`);
    process.exit(0);
  };
  const alive = (pid) => {
    try {
      process.kill(pid, 0);
      return true;
    } catch (error) {
      return error.code === "EPERM";
    }
  };
  setInterval(() => {
    if (session.pid && !alive(session.pid)) stop(`session ${session.pid} đã đóng`);
    if (!session.pid && Date.now() - lastComment > BRIDGE_IDLE_MS) stop("8 giờ không có comment");
  }, 1000);
  for (const signal of ["SIGTERM", "SIGINT", "SIGHUP"]) process.on(signal, () => stop(signal));
}

// Ghi một comment mới, status sent, id kế tiếp. Cầu nối gọi khi page gửi; comment --add gọi khi agent nhận prompt chép
// từ page. Trả null khi thiếu page hay body.
function addComment(dir, raw) {
  const comment = cleanComment(raw);
  if (!comment.page || !comment.body.trim()) return null;
  const comments = readComments(dir);
  const entry = { id: comments.reduce((max, item) => Math.max(max, item.id), 0) + 1, ...comment, status: "sent", at: new Date().toISOString() };
  writeComments(dir, [...comments, entry]);
  appendRun(dir, "new-design", "comment", entry.page, process.uptime(), `#${entry.id} ${entry.body}`);
  return entry;
}

function comment(designDir, flags, rest) {
  if (!designDir) fail("cần <thư mục design>");
  const dir = resolve(designDir);
  const comments = readComments(dir);
  if ("pending" in flags) {
    for (const item of comments.filter((item) => item.status !== "done")) console.log(JSON.stringify(item));
    return;
  }
  if (flags.status) {
    const [id, status] = [Number(flags.status), rest[0]];
    const item = comments.find((entry) => entry.id === id);
    if (!item) fail(`không có comment #${flags.status}`);
    if (!COMMENT_STATUS.includes(status) || status === "sent") fail("--status <id> doing|done");
    item.status = status;
    writeComments(dir, comments);
    appendRun(dir, "new-design", "comment", item.page, process.uptime(), `#${id} ${status}`);
    console.log(`#${id} ${status}`);
    return;
  }
  if ("add" in flags) {
    let raw;
    try {
      raw = JSON.parse(flags.add);
    } catch {
      fail("--add cần JSON của dòng comment-json trong prompt chép từ page");
    }
    const entry = addComment(dir, raw);
    if (!entry) fail("--add: JSON thiếu page hay body");
    console.log(`#${entry.id}`);
    return;
  }
  fail("comment cần --pending, --status <id> doing|done hay --add '<json>'");
}

// So đường dẫn thật: gọi qua symlink (.claude/skills → skills/) thì argv[1] là đường symlink, import.meta.url là đường thật.
if (process.argv[1] && realpathSync(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const [command, ...rest] = process.argv.slice(2);
  const { positional, flags } = parseArgs(rest);
  if (command === "init") init(positional[0], flags);
  else if (command === "page") addPage(positional[0], positional[1], flags);
  else if (command === "progress") progress(positional[0], positional[1], flags, positional.slice(2));
  else if (command === "touch") touch(positional[0], positional[1], flags);
  else if (command === "tokens") tokens(positional[0], flags);
  else if (command === "shell") shell(flags);
  else if (command === "designs") designs();
  else if (command === "open") openPage(positional[0], flags);
  else if (command === "comment-bridge") commentBridge(positional[0], flags);
  else if (command === "comment") comment(positional[0], flags, positional.slice(1));
  else fail("lệnh: init | designs | page | progress | touch | tokens | shell | open | comment-bridge | comment (xem đầu file)");
}
