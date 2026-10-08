#!/usr/bin/env node
// Dựng và cập nhật thư mục design: tạo thư mục .design/NNN-slug, thêm page từ mẫu, sinh tokens.js.
//
//   node new-design.mjs init <slug> [--root .design] [--tokens <DESIGN.md | tokens.css>] [--page-width <1280px | 80rem | full>]
//   node new-design.mjs page <thư mục design> <slug> --title "<tên>" [--option "A · <tên phương án>"] [--question "<câu hỏi trung tâm>"]
//                       [--unit "<đơn vị chính>"] [--tradeoff "<cái hy sinh>"] [--note "<một dòng>"]
//   node new-design.mjs touch <thư mục design> <file> --note "<góp ý vừa sửa>"
//   node new-design.mjs tokens <DESIGN.md | tokens.css> [--page-width <…>] [--out <tokens.js>]
//   node new-design.mjs shell [--root .design]
//
// Mỗi phương án được chọn đúng một page; góp ý thì sửa thẳng page đó rồi touch để pages.js ghi ngày sửa và góp ý.
// init chép khuôn brief.md: bản tóm tắt chung mà mọi page, và mọi agent con dựng page song song, cùng đọc.
//
// Mọi thư mục design trong .design/ dùng chung một shell ở .design/_shell/, page nạp ../_shell/. shell chỉ bọc quanh
// page (toolbar, panel), không đụng vào bản thiết kế, nên cập nhật nó không đổi hình design cũ. init và lệnh shell chép
// bản mới nhất của skill đè lên; lệnh shell còn chuyển thư mục design kiểu cũ (có _shell/ riêng) sang dùng shell chung.
//
// spec: F1.2 F4

import { cpSync, existsSync, lstatSync, mkdirSync, readdirSync, readFileSync, realpathSync, rmSync, unlinkSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { buildTokens } from "./tokens.mjs";

const skillDir = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const today = new Date().toISOString().slice(0, 10);

function parseArgs(argv) {
  const positional = [];
  const flags = {};
  for (let index = 0; index < argv.length; index += 1) {
    if (!argv[index].startsWith("--")) {
      positional.push(argv[index]);
      continue;
    }
    flags[argv[index].slice(2)] = argv[index + 1];
    index += 1;
  }
  return { positional, flags };
}

function fail(message) {
  console.error(`new-design: ${message}`);
  process.exit(1);
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
  if (flags.tokens && !existsSync(resolve(flags.tokens))) fail(`không thấy ${flags.tokens}`);
  const root = resolve(flags.root ?? ".design");
  mkdirSync(root, { recursive: true });
  // Sinh token trước: nguồn hỏng thì dừng khi chưa tạo thư mục nào, không để lại thư mục dở dang.
  const tokens = tokensOrFail(resolve(flags.tokens ?? join(skillDir, "shell/default-design.md")), flags);
  const designDir = join(root, `${nextNumber(readdirSync(root), 3)}-${slugify(slug)}`);
  mkdirSync(designDir);
  refreshShell(root);
  writeFileSync(join(designDir, "tokens.js"), tokens);
  cpSync(join(skillDir, "templates/brief.md"), join(designDir, "brief.md"));
  writePages(designDir, []);
  console.log(designDir);
}

function addPage(designDir, slug, flags) {
  if (!designDir || !slug) fail("cần <thư mục design> <slug>");
  if (!flags.title) fail("thiếu --title");
  const dir = resolve(designDir);
  if (!existsSync(join(dir, "pages.js"))) fail(`${dir} chưa phải thư mục design (thiếu pages.js), chạy init trước`);
  if (!existsSync(join(dir, "../_shell"))) fail(`thiếu ${join(dirname(dir), "_shell")}, chạy: node new-design.mjs shell --root ${dirname(dir)}`);
  const pages = readPages(dir);
  const file = `${nextNumber(readdirSync(dir), 2)}-${slugify(slug)}.html`;
  const template = readFileSync(join(skillDir, "templates/details.html"), "utf8").replace(/<title>[^<]*<\/title>/, `<title>${flags.title}</title>`);
  writeFileSync(join(dir, file), template);
  const extra = Object.fromEntries(["option", "question", "unit", "tradeoff", "note"].filter((key) => flags[key]).map((key) => [key, flags[key]]));
  pages.push({ file, title: flags.title, ...extra, updated: today });
  writePages(dir, pages);
  console.log(join(dir, file));
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
  else if (command === "touch") touch(positional[0], positional[1], flags);
  else if (command === "tokens") tokens(positional[0], flags);
  else if (command === "shell") shell(flags);
  else fail("lệnh: init | page | touch | tokens | shell (xem đầu file)");
}
