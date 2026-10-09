#!/usr/bin/env node
// Dựng và cập nhật thư mục design: tạo thư mục .design/NNN-slug, thêm page từ mẫu, sinh tokens.js.
//
//   node new-design.mjs init <slug> [--root .design] [--tokens <DESIGN.md | tokens.css> | --getdesign <tên>] [--page-width <1280px | 80rem | full>]
//   node new-design.mjs designs
//   node new-design.mjs page <thư mục design> <slug> --title "<tên>" [--option "A · <tên phương án>"] [--layout "<bố cục page>"]
//                       [--good-for "<việc 1> · <việc 2>"] [--note "<một dòng>"]
//   node new-design.mjs page <thư mục design> <slug> --title "<luồng> · <tên màn>" --screen "<n> · <tên màn>" --purpose "<để làm gì>"
//   node new-design.mjs progress <thư mục design> <file> [--prepared | --doing "<việc con>" | --done <n> | --insert "<việc>" | --round "<ý 1>" ["<ý 2>" …] | --delivered]
//   node new-design.mjs progress <thư mục design> (--prepared | --delivered) --all
//   node new-design.mjs touch <thư mục design> <file> --note "<góp ý vừa sửa>"
//   node new-design.mjs tokens <DESIGN.md | tokens.css> [--page-width <…>] [--out <tokens.js>]
//   node new-design.mjs shell [--root .design]
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
// --done đánh dấu bước dựng đó xong và xoá việc con; --insert chèn một bước trước bước kiểm đầy đủ của vòng đang mở;
// --round mở vòng góp ý mới, mỗi ý một bước, và mở lại bước giao. Bước chuẩn bị chưa xong thì --doing, --done báo lỗi.
// --delivered đánh dấu bước giao (deliver: agent chính kiểm lại và giao) xong; agent chính chạy ngay trước tin giao, khi
// mọi bước dựng đã xong (--delivered --all: mọi page trong pages.js). --done, --insert, --round tăng rev một: shell của
// page đang mở thấy rev đổi thì tải lại; --prepared, --doing, --delivered không đổi page nên giữ rev, shell chỉ vẽ lại
// nhãn. Ngoài bước chuẩn bị và bước giao, chỉ agent dựng page đó chạy progress trên file đó.
//
// Mọi thư mục design trong .design/ dùng chung một shell ở .design/_shell/, page nạp ../_shell/. shell chỉ bọc quanh
// page (toolbar, panel), không đụng vào bản thiết kế, nên cập nhật nó không đổi hình design cũ. init và lệnh shell chép
// bản mới nhất của skill đè lên; lệnh shell còn chuyển thư mục design kiểu cũ (có _shell/ riêng) sang dùng shell chung.
//
// Không có design system thì người dùng chọn một bộ của getdesign: designs in các bộ tokens.mjs đọc được (stdout
// `tên - mô tả`), init --getdesign tải bộ đã chọn vào thư mục design. Exit 1 là lỗi chọn (tên lạ, bộ chỉ có chữ);
// exit 2 là không chạy được getdesign (gói đổi cấu trúc, registry lỗi), agent dừng và báo lỗi.
//
// spec: F1.2 F1.17 F4 F3.6 F3.8 F6.2 F6.6 F6.10

import { spawnSync } from "node:child_process";
import { cpSync, existsSync, lstatSync, mkdirSync, mkdtempSync, readdirSync, readFileSync, realpathSync, renameSync, rmSync, unlinkSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
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
  const root = resolve(flags.root ?? ".design");
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
  const root = resolve(flags.root ?? ".design");
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
  writeProgress(dir, file, { rev: 0, prep: { task: PREP_STEP, done: false }, deliver: { task: DELIVER_STEP, done: false }, build: BUILD_STEPS.map((task, index) => ({ task, done: false, round: 1, ...(index === BUILD_STEPS.length - 1 ? { final: true } : {}) })) });
  const extra = Object.fromEntries([["option"], ["layout"], ["good-for", "goodFor"], ["screen"], ["purpose"], ["note"]].filter(([flag]) => flags[flag]).map(([flag, key = flag]) => [key, flags[flag]]));
  pages.push({ file, title: flags.title, ...extra, updated: today });
  writePages(dir, pages);
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
  return JSON.parse(json);
}

// Ghi ra file tạm rồi rename: shell đọc lại file mỗi 2 giây, ghi thẳng thì có lượt đọc trúng file ghi dở.
function writeProgress(dir, file, data) {
  const path = progressPath(dir, file);
  const header = `// Danh sách bước dựng của ${file}. Shell đọc file này để hiện tiến độ; chỉ ghi bằng: node new-design.mjs progress`;
  const body = `{\n  "rev": ${data.rev},\n${data.prep ? `  "prep": ${JSON.stringify(data.prep)},\n` : ""}${data.deliver ? `  "deliver": ${JSON.stringify(data.deliver)},\n` : ""}  "build": [\n${data.build.map((item) => `    ${JSON.stringify(item)}`).join(",\n")}\n  ]\n}`;
  writeFileSync(`${path}.tmp`, `${header}\n(window.DESIGN_PROGRESS ||= {})[${JSON.stringify(file)}] = ${body};\n`);
  renameSync(`${path}.tmp`, path);
}

function printProgress(file, data) {
  const open = data.build.findIndex((item) => !item.done);
  const preparing = data.prep && !data.prep.done;
  if (data.prep) console.log(`Chuẩn bị\n  ${preparing ? "●" : "✓"} ${data.prep.task}`);
  if (preparing) {
    data.build.forEach((item, index) => console.log(`${index ? "" : "Dựng\n"}  ○ ${index + 1}. ${item.task}`));
    console.log(`${file}: đang chuẩn bị (${data.prep.task}); agent chính chạy --prepared khi brief đã điền xong`);
    return;
  }
  let round = 0;
  data.build.forEach((item, index) => {
    if (item.round !== round) console.log((round = item.round) === 1 ? "Dựng" : `Góp ý vòng ${round}`);
    console.log(`  ${item.done ? "✓" : index === open ? "●" : "○"} ${index + 1}. ${item.task}`);
    if (index === open && item.doing) console.log(`       ↳ ${item.doing}`);
  });
  if (data.deliver) console.log(`Giao\n  ${data.deliver.done ? "✓" : "○"} ${data.deliver.task}`);
  if (open >= 0) console.log(`${file}: bước dựng tiếp theo là ${open + 1} · ${data.build[open].task}`);
  else if (data.deliver && !data.deliver.done) console.log(`${file}: mọi bước dựng đã xong, chưa giao; agent chính chạy --delivered ngay trước tin giao`);
  else console.log(`${file}: mọi bước dựng đã xong, đã giao`);
}

// Bước đầu tiên chưa xong trước bước giao: bước chuẩn bị, rồi các bước dựng. null là sẵn sàng giao.
function blockingStep(data) {
  if (data.prep && !data.prep.done) return data.prep.task;
  const open = data.build.findIndex((item) => !item.done);
  return open < 0 ? null : `${open + 1} · ${data.build[open].task}`;
}

// Bước chuẩn bị không đổi page: ghi mà không tăng rev, page đang mở chỉ đổi nhãn.
function markPrepared(dir, file, data) {
  const open = data.build.findIndex((item) => !item.done);
  data.prep.done = true;
  if (open >= 0 && !data.build[open].doing) data.build[open].doing = FIRST_DOING;
  writeProgress(dir, file, data);
  printProgress(file, data);
}

// Bước giao không đổi page: ghi mà không tăng rev, page đang mở chỉ đổi nhãn.
function markDelivered(dir, file, data) {
  data.deliver.done = true;
  writeProgress(dir, file, data);
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
    for (const name of files) {
      const data = readProgress(dir, name);
      if (!data.prep || data.prep.done) console.log(`${name}: bước chuẩn bị đã xong, bỏ qua`);
      else markPrepared(dir, name, data);
    }
    return;
  }
  const blocked = files.map((name) => [name, blockingStep(readProgress(dir, name))]).filter(([, step]) => step);
  if (blocked.length) fail(`chưa giao được, còn bước chưa xong:\n${blocked.map(([name, step]) => `  ${name}: ${step}`).join("\n")}`);
  for (const name of files) {
    const data = readProgress(dir, name);
    if (!data.deliver || data.deliver.done) console.log(`${name}: đã giao, bỏ qua`);
    else markDelivered(dir, name, data);
  }
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
    if (data.deliver.done) fail("bước giao đã xong; góp ý mới thì mở vòng bằng --round");
    const step = blockingStep(data);
    if (step) fail(`chưa giao được, bước đầu tiên chưa xong là ${step}`);
    markDelivered(dir, file, data);
    return;
  }
  if (preparing && (flags.doing !== undefined || flags.done !== undefined)) fail(`bước chuẩn bị (${data.prep.task}) chưa xong; agent chính chạy --prepared trước khi dựng`);
  if (flags.doing !== undefined) {
    // Việc con không đổi page: ghi mà không tăng rev, để page đang mở chỉ vẽ lại danh sách, không tải lại.
    if (open < 0) fail("mọi bước dựng đã xong; góp ý mới thì mở vòng bằng --round");
    if (typeof flags.doing !== "string" || !flags.doing.trim()) fail("--doing cần tên việc con");
    data.build[open].doing = flags.doing.trim();
    writeProgress(dir, file, data);
    printProgress(file, data);
    return;
  }
  if (flags.done !== undefined) {
    if (open < 0) fail("mọi bước dựng đã xong; góp ý mới thì mở vòng bằng --round");
    if (Number(flags.done) !== open + 1) fail(`bước dựng đầu tiên chưa xong là ${open + 1} · ${data.build[open].task}, không phải ${flags.done}`);
    data.build[open].done = true;
    delete data.build[open].doing;
  } else if (flags.insert !== undefined) {
    if (open < 0) fail("không có vòng nào đang mở để chèn bước");
    const final = data.build.findIndex((item, index) => index >= open && item.final && item.round === data.build[open].round);
    data.build.splice(final < 0 ? data.build.length : final, 0, { task: flags.insert, done: false, round: data.build[open].round });
  } else if (flags.round !== undefined) {
    if (open >= 0) fail(`vòng trước còn bước dựng chưa xong: ${open + 1} · ${data.build[open].task}`);
    const notes = [flags.round, ...rest].filter((note) => note?.trim());
    if (!notes.length) fail("--round cần ít nhất một ý góp ý");
    const round = Math.max(...data.build.map((item) => item.round)) + 1;
    data.build.push(...notes.map((note) => ({ task: `Góp ý: ${note}`, done: false, round })), { task: "Kiểm đầy đủ", done: false, round, final: true });
    if (data.deliver) data.deliver.done = false;
  } else {
    printProgress(file, data);
    return;
  }
  data.rev += 1;
  writeProgress(dir, file, data);
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
  console.log(join(dir, file));
}

function tokens(source, flags) {
  if (!source) fail("thiếu <DESIGN.md | tokens.css>");
  const output = tokensOrFail(resolve(source), flags);
  if (flags.out) writeFileSync(flags.out, output);
  else process.stdout.write(output);
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
  else fail("lệnh: init | designs | page | progress | touch | tokens | shell (xem đầu file)");
}
