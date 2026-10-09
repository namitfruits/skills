#!/usr/bin/env node
// Kiểm bằng code đầu ra của skill design-uiux: một thư mục .design/NNN-slug (hoặc một page trong đó).
// Skill chỉ được giao link khi lệnh này ra exit 0. Chỉ đọc, không sửa page.
//
//   node check.mjs <thư mục design | page.html> [--pw <thư mục có node_modules/playwright>] [--no-shots]
//   node check.mjs <page.html> --quick [--state <giá trị>] [--preset "<nhãn>"] [--pw <dir>]
//
// --quick: kiểm nhanh một page ở một tổ hợp, chạy trước mỗi lần đánh dấu một bước dựng xong (1–2 giây). Gồm lượt tĩnh,
// lỗi console, lỗi JS, request hỏng, và bố cục cùng luật UX, UI ở 1280px, sáng, tweak mặc định, state theo --state hay
// preset theo --preset. Không vặn từng nút, không bấm, không mở lại URL, không khổ tablet / mobile, không đo 1920px, không
// soát cả thư mục. Ảnh: shots/<page>--quick.png.
// Kiểm đầy đủ còn báo page có danh sách bước dựng (<page>.progress.js) mà còn bước chưa xong, gồm bước chuẩn bị, trừ
// bước kiểm đầy đủ của vòng đang mở. Page không có danh sách thì bỏ qua.
//
// Lượt tĩnh (đọc file): đủ file khung, pages.js hợp lệ và liệt kê mọi page, thứ tự nạp script, không mã màu
// ngoài tokens.js; brief.md đủ mục, hết chỗ trống <…>, cột "Ai quyết" hợp lệ, bảng Pages khớp pages.js. Thư mục
// phương án (pages.js có `option`) tối đa hai page A, B. Thư mục luồng (pages.js có `screen`): bảng Luồng khớp
// pages.js cùng thứ tự; page màn 1..n−1 gọi $store.design.next(), màn 2..n gọi $store.design.prev().
// Lượt trình duyệt (Chrome headless, mở bằng file://), từng page:
//   - không lỗi console, lỗi JS, request hỏng; có toolbar, có <main id="design">, có khối data-block
//   - mỗi nút khai trong window.DESIGN có ở panel, và vặn thì UI đổi (nút vặn mà UI không đổi là khai thừa)
//   - khối ngoài cùng của #design rộng đúng bề rộng trang trong tokens.js (hay DESIGN.pageWidth kèm why), đo ở 1920px
//   - variable state đủ data · loading · empty · error; variables đúng bộ key trong bảng "Nút dữ liệu chung"
//     của brief.md, nên mọi page cùng thư mục so được trên cùng dữ liệu
//   - mọi tổ hợp tweak × sáng tối × state, cộng từng preset, ở 375 và 1280px: không lỗi, không cuộn ngang,
//     không chữ đè chữ, không chữ bị ép mỗi dòng một chữ, khung nổi không lọt ra ngoài màn hình hay nằm dưới
//     toolbar, nút trong
//     page hoặc làm gì đó hoặc bị khoá kèm title
//   - lượt bấm: bấm từng loại thứ bấm được trong page (modal, sheet, hàng mở rộng), đo lại như trên; thứ chỉ hiện ở
//     một giá trị khác mặc định thì bấm ở đúng giá trị đó
//   - đổi giá trị không tải lại trang; URL ghi lại mở ở tab mới ra đúng giá trị; page vặn tại chỗ hiện như page mở
//     mới từ URL đó (x-show cùng :style chuỗi làm Alpine vẽ sai; lượt tĩnh cũng bắt mẫu này)
//   - khổ tablet / mobile: iframe đúng bề rộng, không toolbar bên trong, vặn nút ở panel thì iframe đổi
//   - giao diện suy ra có ghi "(suy ra)" ở view-controller; option-switcher đủ số page
//   - lượt bấm: cú bấm làm page sang một file trong pages.js là hợp lệ (nút "Tiếp tục" của luồng)
// Lượt đi luồng (cả thư mục luồng): mở màn 1, điền các ô form.* bằng chữ mẫu, bấm thứ gọi next() tới màn cuối, rồi
// prev() một lần và kiểm ô của màn trước còn chữ.
// Luật UX (../references/ux-principles.md) và luật UI (../references/ui-principles.md): kiểm trong principles-check.mjs, chạy
// ở lượt tĩnh, mỗi tổ hợp, lượt bấm (rê, bấm) và cả thư mục; lỗi mang ID luật ([UX10], [UI4]). Luật UI ghi trong bảng
// "Luật UI theo design system" của brief.md thì bỏ qua. Luật trong hai file không có kiểm thì dừng ngay (exit 2).
// Exit 0 khi sạch, 1 khi có lỗi, 2 khi không chạy được (thiếu Playwright, không mở được page).
//
// spec: F1.3 F1.2 F1.13 F1.17 F5.1 F5.4 F5.6 F5.7 F5.8

import { existsSync, mkdirSync, readdirSync, readFileSync, statSync } from "node:fs";
import { createRequire } from "node:module";
import { tmpdir } from "node:os";
import { basename, dirname, join, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { afterClick, animationsDone, checks, describeAt, folderIssues, hitsItself, pageProbe, positionsAround, readServes, readTokens, readYielded, rowRects, shifted, staticIssues } from "./principles-check.mjs";

const widths = [375, 1280];
const requiredStates = ["data", "loading", "empty", "error"];
const longText = "Một chuỗi rất dài để thử chữ tràn: Công ty Trách nhiệm hữu hạn Thương mại và Dịch vụ Kỹ thuật Số Toàn Cầu";

const args = process.argv.slice(2);
const valueFlags = ["--pw", "--state", "--preset"];
const flagValue = (name) => (args.includes(name) ? args[args.indexOf(name) + 1] : undefined);
const target = args.find((arg, index) => !arg.startsWith("--") && !valueFlags.includes(args[index - 1]));
const pwFlag = flagValue("--pw") ?? process.env.PW_DIR;
const takeShots = !args.includes("--no-shots");
const quick = args.includes("--quick");
const quickState = flagValue("--state");
const quickPreset = flagValue("--preset");
const started = performance.now();
if (!target) {
  console.error("cách dùng: node check.mjs <thư mục design | page.html> [--pw <dir>] [--no-shots]\n          node check.mjs <page.html> --quick [--state <giá trị>] [--preset \"<nhãn>\"] [--pw <dir>]");
  process.exit(2);
}
if (quick && statSync(resolve(target)).isDirectory()) {
  console.error("--quick kiểm đúng một page: đưa đường dẫn tới <NN-slug>.html. Kiểm cả thư mục thì bỏ --quick.");
  process.exit(2);
}

// Gom theo page + lỗi: một lỗi dính 100 tổ hợp in một dòng kèm số tổ hợp và vài ví dụ.
const errors = new Map();
const report = (file, where, message) => {
  const key = `${file}\u0000${message}`;
  if (!errors.has(key)) errors.set(key, { file, message, places: [] });
  if (where) errors.get(key).places.push(where);
};

const targetPath = resolve(target);
const designDir = statSync(targetPath).isDirectory() ? targetPath : dirname(targetPath);
const onlyFile = statSync(targetPath).isDirectory() ? null : basename(targetPath);

// Luật trong hai file luật và kiểm trong principles-check.mjs phải khớp nhau: luật không có kiểm thì chỉ nằm trên giấy.
const rulesFiles = ["ux-principles.md", "ui-principles.md"].map((name) => ({ name: `references/${name}`, text: readFileSync(join(dirname(fileURLToPath(import.meta.url)), "../references", name), "utf8") }));
const ruleIds = rulesFiles.flatMap((file) => [...file.text.matchAll(/^\*\*(UX\d+|UI\d+)\./gm)].map((match) => match[1]));
const checkedRules = [...new Set(checks.map((check) => check.rule))];
const unchecked = ruleIds.filter((rule) => !checkedRules.includes(rule));
const orphan = checkedRules.filter((rule) => !ruleIds.includes(rule));
if (unchecked.length || orphan.length) {
  for (const file of rulesFiles) {
    const missing = unchecked.filter((rule) => file.text.includes(`**${rule}.`));
    if (missing.length) console.error(`skill lệch: ${missing.join(", ")} trong ${file.name} chưa có kiểm trong scripts/principles-check.mjs`);
  }
  if (orphan.length) console.error(`skill lệch: kiểm trỏ luật không có trong references/ux-principles.md hay references/ui-principles.md: ${orphan.join(", ")}`);
  process.exit(2);
}
const ruleTag = (rule, message) => `[${rule}] ${message}`;
let yielded = [];

// ---------- lượt tĩnh ----------

const shellDir = existsSync(join(designDir, "_shell")) ? "_shell" : "../_shell";
for (const required of [`${shellDir}/shell.js`, `${shellDir}/shell.css`, "tokens.js", "pages.js", "brief.md"]) {
  if (!existsSync(join(designDir, required))) report(basename(designDir), "", `thiếu ${required}`);
}
// shell dùng chung ở .design/_shell/. Thư mục design kiểu cũ có _shell/ riêng, hay shell chung cũ hơn skill: nhắc lệnh
// cập nhật, không tính lỗi (shell chỉ bọc quanh page, design vẫn đúng).
const skillShell = join(dirname(fileURLToPath(import.meta.url)), "../shell");
const updateShell = `node ${join(dirname(fileURLToPath(import.meta.url)), "new-design.mjs")} shell --root ${dirname(designDir)}`;
if (shellDir === "_shell") console.log(`· ${basename(designDir)} còn _shell/ riêng (kiểu cũ). Chuyển sang shell chung: ${updateShell}`);
else if (["shell.js", "shell.css"].some((name) => existsSync(join(designDir, "../_shell", name)) && readFileSync(join(designDir, "../_shell", name), "utf8") !== readFileSync(join(skillShell, name), "utf8"))) {
  console.log(`· shell ở ${join(dirname(designDir), "_shell")} cũ hơn skill. Cập nhật: ${updateShell}`);
}

let pages = [];
try {
  const source = readFileSync(join(designDir, "pages.js"), "utf8");
  pages = JSON.parse(source.match(/window\.DESIGN_PAGES\s*=\s*(\[[\s\S]*\]);/)?.[1] ?? "null") ?? [];
} catch (error) {
  report("pages.js", "", `không đọc được danh sách page: ${error.message}`);
}
const htmlFiles = readdirSync(designDir).filter((name) => name.endsWith(".html")).sort();
// Thư mục luồng: mỗi page một màn (`screen` = "<n> · tên"), theo thứ tự đi. Thư mục phương án: mỗi page một phương án.
const isFlow = pages.some((page) => page.screen);
if (isFlow && pages.some((page) => page.option)) report("pages.js", "", "trộn page phương án (option) với page màn (screen); một thư mục là một trong hai");
if (!isFlow && pages.length > 2) report("pages.js", "", `thư mục phương án có ${pages.length} page; mỗi màn tối đa hai phương án A, B — muốn xem hướng khác thì dựng thay A hay B`);
for (const [index, page] of pages.entries()) {
  for (const field of ["file", "title", "updated"]) if (!page[field]) report("pages.js", page.file ?? "?", `thiếu field ${field}`);
  if (isFlow) {
    const number = Number(page.screen?.match(/^\s*(\d+)\s*·\s*\S/)?.[1]);
    if (number !== index + 1) report("pages.js", page.file ?? "?", `screen phải có dạng "${index + 1} · tên màn" (màn thứ ${index + 1} trong pages.js), đang là "${page.screen ?? ""}"`);
    if (!page.purpose) report("pages.js", page.file ?? "?", "thiếu purpose (màn để làm gì, hiện khi đưa chuột vào dãy màn)");
  }
  // Thư mục phương án ≥ 2 page: nút chữ riêng ở option-switcher, khung mô tả có bố cục page.
  else if (pages.length >= 2) {
    const letter = page.option?.match(/^\s*([A-Za-z])\s*·/)?.[1]?.toUpperCase();
    if (!letter) report("pages.js", page.file ?? "?", `option phải có dạng "A · tên phương án", đang là "${page.option ?? ""}"`);
    else if (pages.filter((other) => other.option?.match(/^\s*([A-Za-z])\s*·/)?.[1]?.toUpperCase() === letter).length > 1) report("pages.js", page.file, `chữ ${letter} trùng với page khác`);
    if (!page.layout) report("pages.js", page.file ?? "?", "thiếu layout (bố cục page, hiện khi đưa chuột vào nút phương án)");
  }
  if (page.file && !htmlFiles.includes(page.file)) report("pages.js", page.file, "file không tồn tại");
}

// brief.md: bản tóm tắt chung các page cùng đọc. Chỗ trống <…> ngoài backtick là chưa điền (thẻ HTML thì viết
// trong backtick). Bảng "Nút dữ liệu chung" là bộ key variables mà mọi page phải khai đúng.
// Thư mục luồng thay "Pages" và "Tình huống" bằng "Luồng".
const briefSections = ["Tóm tắt đề", "Quyết định", "Design system", ...(isFlow ? ["Luồng"] : ["Pages", "Tình huống"]), "Dữ liệu chung", "Nút dữ liệu chung", "Khối", "Số kiểm chéo ở mặc định", "Đề gốc"];
const deciders = ["người dùng", "--auto", "AI đoán"];
// Các dòng dữ liệu của bảng đầu tiên trong một mục (bỏ dòng tiêu đề và dòng gạch), mỗi dòng là mảng ô đã bỏ backtick.
const sectionRows = (text, name) => (text.split(new RegExp(`^## ${name}\\s*$`, "m"))[1]?.split(/^## /m)[0] ?? "")
  .split("\n").filter((line) => line.trim().startsWith("|")).slice(2)
  .map((line) => line.trim().replace(/^\||\|$/g, "").split("|").map((cell) => cell.trim().replace(/`/g, "")));
let sharedKeys = null;
let blockNumbers = null;
if (existsSync(join(designDir, "brief.md"))) {
  const brief = readFileSync(join(designDir, "brief.md"), "utf8");
  const headings = [...brief.matchAll(/^## (.+)$/gm)].map((match) => match[1].trim());
  const missing = briefSections.filter((name) => !headings.includes(name));
  if (missing.length) report("brief.md", "", `thiếu mục: ${missing.map((name) => `## ${name}`).join(", ")}`);
  const blanks = brief.replace(/```[\s\S]*?```/g, "").replace(/`[^`\n]*`/g, "").split("\n")
    .map((line, index) => [index + 1, line.match(/<[^<>\n]+>/)?.[0]]).filter(([, blank]) => blank);
  if (blanks.length) report("brief.md", blanks.slice(0, 3).map(([line]) => `dòng ${line}`).join(", "), `còn chỗ trống chưa điền: ${blanks.slice(0, 3).map(([, blank]) => (blank.length > 40 ? `${blank.slice(0, 38)}…>` : blank)).join(" · ")}${blanks.length > 3 ? ` (+${blanks.length - 3})` : ""}`);
  sharedKeys = sectionRows(brief, "Nút dữ liệu chung").map((cells) => cells[0]).filter((key) => /^[A-Za-z_]\w*$/.test(key));
  if (headings.includes("Nút dữ liệu chung") && !sharedKeys.length) report("brief.md", "", 'bảng "Nút dữ liệu chung" không có key nào');
  // Brief chưa điền xong thì bảng nút chưa đáng tin: báo chỗ trống thôi, chưa so với các page.
  if (blanks.length) sharedKeys = null;
  if (!blanks.length) {
    const wrongDecider = sectionRows(brief, "Quyết định").filter((cells) => !deciders.includes(cells[2] ?? ""));
    if (wrongDecider.length) report("brief.md", "", `cột "Ai quyết" của ## Quyết định phải là ${deciders.join(" / ")}: ${wrongDecider.slice(0, 2).map((cells) => `"${cells[0].slice(0, 30)}" ghi "${cells[2] ?? ""}"`).join(" · ")}`);
    // Bảng ## Pages (hay ## Luồng) khớp pages.js: thêm page ở vòng sau thì brief phải ghi theo. Luồng còn phải cùng thứ tự.
    const pagesTable = isFlow ? "Luồng" : "Pages";
    const listed = sectionRows(brief, pagesTable).map((cells) => cells.find((cell) => cell.endsWith(".html")) ?? "").filter(Boolean);
    const notListed = pages.map((page) => page.file).filter((file) => file && !listed.includes(file));
    const unknown = listed.filter((file) => !pages.some((page) => page.file === file));
    if (notListed.length) report("brief.md", "", `bảng ## ${pagesTable} thiếu page có trong pages.js: ${notListed.join(", ")}`);
    if (unknown.length) report("brief.md", "", `bảng ## ${pagesTable} có file mà pages.js không có: ${unknown.join(", ")}`);
    if (isFlow && !notListed.length && !unknown.length && listed.join() !== pages.map((page) => page.file).join()) {
      report("brief.md", "", `bảng ## Luồng khác thứ tự pages.js: ${listed.join(" → ")} / ${pages.map((page) => page.file).join(" → ")}`);
    }
    // Luật UI nào design system làm khác thì kiểm của nó tắt cho cả thư mục (references/ui-principles.md, "Khi design system làm khác").
    // Bảng ## Khối: số data-block chung của các page, để cùng khối ở các phương án mang cùng số.
    if (headings.includes("Khối")) blockNumbers = sectionRows(brief, "Khối").map((cells) => cells[0]).filter((number) => /^\d+$/.test(number));
    const table = readYielded(brief, readServes(rulesFiles[1].text));
    yielded = table.yielded;
    for (const problem of table.problems) report("brief.md", "", problem);
  }
}
for (const file of htmlFiles) if (!pages.some((page) => page.file === file)) report(file, "", "page không có trong pages.js");
// Luồng: màn nào cũng có đường sang màn sau và về màn trước bằng nút trong page. Kiểm một page thì chỉ soát page đó:
// các page khác có thể còn đang được agent con khác dựng.
if (isFlow) {
  for (const [index, page] of pages.entries()) {
    if (!page.file || !htmlFiles.includes(page.file) || (onlyFile && page.file !== onlyFile)) continue;
    // Bỏ comment HTML: câu chú thích nhắc next() không phải nút.
    const html = readFileSync(join(designDir, page.file), "utf8").replace(/<!--[\s\S]*?-->/g, "");
    if (index < pages.length - 1 && !html.includes("$store.design.next(")) report(page.file, "", `màn ${index + 1} không có nút gọi $store.design.next() để sang màn ${index + 2}`);
    if (index > 0 && !html.includes("$store.design.prev(")) report(page.file, "", `màn ${index + 1} không có nút gọi $store.design.prev() để về màn ${index}`);
  }
}

const checkedFiles = onlyFile ? [onlyFile] : htmlFiles;
const colorLiteral = /(?<![&\w-])#(?:[0-9a-fA-F]{8}|[0-9a-fA-F]{6}|[0-9a-fA-F]{3,4})\b(?![\w-])|\b(?:rgba?|hsla?|oklch)\(/;
for (const file of checkedFiles) {
  const html = readFileSync(join(designDir, file), "utf8");
  const order = ["tokens.js", "pages.js", "_shell/shell.js", "@tailwindcss/browser", "alpinejs"].map((name) => html.indexOf(name));
  if (order.some((index) => index < 0)) report(file, "", `thiếu script: cần tokens.js, pages.js, ${shellDir}/shell.js, @tailwindcss/browser, alpinejs`);
  else if (order.some((index, position) => position > 0 && index < order[position - 1])) report(file, "", `sai thứ tự nạp: tokens.js → pages.js → ${shellDir}/shell.js → Tailwind → Alpine`);
  if (!/<script[^>]*defer[^>]*alpinejs|<script[^>]*alpinejs[^>]*defer/.test(html)) report(file, "", "Alpine phải nạp bằng defer");
  if (!html.includes(`"${shellDir}/shell.css"`)) report(file, "", `thiếu ${shellDir}/shell.css`);
  if (!/<main[^>]*id="design"/.test(html)) report(file, "", 'thiếu <main id="design">');
  html.split("\n").forEach((line, index) => {
    if (colorLiteral.test(line)) report(file, `dòng ${index + 1}`, `mã màu ngoài tokens.js: ${line.trim().slice(0, 90)}`);
  });
  for (const issue of staticIssues(html)) if (!yielded.includes(issue.rule)) report(file, `dòng ${issue.line}`, ruleTag(issue.rule, issue.message));
  if (blockNumbers) {
    const outside = [...new Set([...html.matchAll(/\sdata-block="([^"]*)"/g)].map((match) => match[1]))].filter((number) => !blockNumbers.includes(number));
    if (outside.length) report(file, "", `data-block ${outside.map((number) => `"${number}"`).join(", ")} không có trong bảng "Khối" của brief.md (có ${blockNumbers.join(", ") || "—"})`);
  }
  // x-show cùng :style chuỗi trên một thẻ: :style tính lại thì Alpine ghi đè cả thuộc tính style, mất display:none
  // của x-show, phần tử đang ẩn hiện ra. :style dạng object chỉ đổi đúng thuộc tính nên không bị.
  for (const match of html.matchAll(/<[a-zA-Z][^\s>/]*(?:\s+[^\s=>]+(?:=(?:"[^"]*"|'[^']*'|[^\s>]+))?)*\s*\/?>/g)) {
    const tag = match[0];
    // Chỉ bắt chuỗi viết thẳng (có ` hay '). :style="biến" thì không biết biến là chuỗi hay object: để phép so lúc vặn lo.
    const style = tag.match(/\s(?::|x-bind:)style=(?:"([^"]*)"|'([^']*)')/);
    const value = style ? (style[1] ?? style[2]).trim() : "";
    if (/\sx-show=/.test(tag) && value && !value.startsWith("{") && /[`']/.test(value)) {
      report(file, `dòng ${html.slice(0, match.index).split("\n").length}`, "x-show cùng :style chuỗi: :style tính lại sẽ xoá display:none của x-show, phần tử đang ẩn hiện ra; viết :style dạng object { bottom: `…` }");
    }
  }
}
// Danh sách bước dựng: kiểm đầy đủ chạy ở bước cuối của vòng, nên mọi bước khác của danh sách phải xong rồi.
if (!quick) {
  for (const file of checkedFiles) {
    const progressFile = join(designDir, `${file.replace(/\.html?$/, "")}.progress.js`);
    if (!existsSync(progressFile)) continue;
    const json = readFileSync(progressFile, "utf8").match(/\]\s*=\s*(\{[\s\S]*\});\s*$/)?.[1];
    let build = null;
    let prep = null;
    try {
      ({ build, prep } = JSON.parse(json ?? "null") ?? {});
    } catch {}
    if (!Array.isArray(build)) {
      report(file, basename(progressFile), "danh sách bước dựng không đọc được; chỉ ghi bằng new-design.mjs progress");
      continue;
    }
    const openRound = build.find((step) => !step.done)?.round;
    const unfinished = [...(prep && !prep.done ? [prep] : []), ...build.filter((step) => !step.done && !(step.final && step.round === openRound))];
    if (unfinished.length) report(file, basename(progressFile), `còn bước chưa xong: ${unfinished.map((step) => step.task).join(" · ")}`);
  }
}

const tokens = existsSync(join(designDir, "tokens.js")) ? readTokens(readFileSync(join(designDir, "tokens.js"), "utf8")) : readTokens("");
const buttonsByPage = new Map();
// Nút chính gặp ở mọi tổ hợp 1280px giao diện sáng: nút chính hay chỉ có ở state rỗng, lỗi.
const primariesByPage = new Map();

// ---------- lượt trình duyệt ----------

function loadPlaywright() {
  for (const dir of [pwFlag, process.cwd(), dirname(fileURLToPath(import.meta.url))].filter(Boolean)) {
    try {
      return createRequire(join(resolve(dir), "package.json"))("playwright");
    } catch {}
  }
  const tempDir = join(tmpdir(), "design-uiux-pw");
  console.error(`Chưa có Playwright. Cài vào thư mục tạm, đừng cài vào dự án:\n  npm i --prefix "${tempDir}" playwright && node ${process.argv[1]} ${target} --pw "${tempDir}"`);
  process.exit(2);
}

const { chromium } = loadPlaywright();
let browser;
try {
  browser = await chromium.launch({ channel: "chrome" });
} catch {
  try {
    browser = await chromium.launch();
  } catch (error) {
    console.error(`Không mở được Chrome: ${error.message.split("\n")[0]}\nCài Chrome, hoặc chạy: npx playwright install chromium`);
    process.exit(2);
  }
}

const shotsDir = join(designDir, "shots");
if (takeShots) mkdirSync(shotsDir, { recursive: true });
let comboCount = 0;

async function openPage(url, width, issues) {
  const page = await browser.newPage({ viewport: { width, height: 900 } });
  page.on("pageerror", (error) => issues.push(`lỗi JS: ${error.message}`));
  // Shell đọc <page>.progress.js mỗi 2 giây; page dựng trước khi có danh sách bước không có file đó, nạp hỏng là bình thường.
  const ofProgress = (url) => /\.progress\.js(\?|$)/.test(url ?? "");
  page.on("console", (message) => {
    if (ofProgress(message.location()?.url)) return;
    if (message.type() === "error" || /Alpine Expression Error/.test(message.text())) issues.push(`console: ${message.text().split("\n")[0].slice(0, 160)}`);
  });
  page.on("requestfailed", (request) => !ofProgress(request.url()) && issues.push(`request hỏng: ${request.url()} (${request.failure()?.errorText})`));
  await page.goto(url);
  await page.waitForFunction(() => window.Alpine && (document.querySelector("[data-ds-bar]") || document.documentElement.dataset.frame), null, { timeout: 20000 });
  await page.waitForFunction(() => getComputedStyle(document.documentElement).getPropertyValue("--color-canvas") !== "" || !document.querySelector("#design"), null, { timeout: 20000 }).catch(() => {});
  await settle(page);
  return page;
}

const settle = (page) => page.evaluate(() => new Promise((done) => requestAnimationFrame(() => requestAnimationFrame(() => setTimeout(done, 60)))));
const setStore = async (page, values) => {
  await page.evaluate((next) => Object.assign(Alpine.store("design"), next), values);
  await settle(page);
};
const snapshot = (page) => page.evaluate(() => document.querySelector("#design")?.innerHTML ?? "");
const comboLabel = (values) => Object.entries(values).map(([key, value]) => `${key}=${value}`).join("&") || "mặc định";

async function inspect(page) {
  return page.evaluate(() => {
    const root = document.documentElement;
    const visible = (element) => element.getClientRects().length > 0 && getComputedStyle(element).visibility !== "hidden";
    const silentButtons = [...document.querySelectorAll("#design button")]
      .filter(visible)
      .filter((button) => {
        const attributes = [...button.attributes].map((attribute) => attribute.name);
        const hasHandler = attributes.some((name) => /^(@click|x-on:click)/.test(name)) || button.hasAttribute("data-copy");
        const submits = (button.type === "submit" || !button.hasAttribute("type")) && button.closest("form");
        const lockedWithReason = button.disabled && button.title.trim() !== "";
        return !(hasHandler || submits || lockedWithReason);
      })
      .map((button) => (button.textContent.trim() || button.getAttribute("aria-label") || button.outerHTML.slice(0, 60)).slice(0, 40));
    // Chữ đè chữ: hai phần tử lá có chữ, cùng đang hiện, khung chữ chồng lên nhau quá 2px mỗi chiều.
    const leaves = [...document.querySelectorAll("#design *")].filter((element) => element.childElementCount === 0 && element.textContent.trim() && visible(element));
    // So từng dòng chữ (getClientRects), không so khung bao: chữ inline xuống dòng có khung bao phủ cả hai dòng.
    // Mỗi dòng cắt theo các khối cha có overflow khác visible (truncate, line-clamp, khung cuộn): chữ đã ẩn không tính.
    const clipsOf = (element) => {
      const clips = [];
      for (let node = element; node && node !== document.body; node = node.parentElement) {
        if (getComputedStyle(node).overflow !== "visible") clips.push(node.getBoundingClientRect());
      }
      return clips;
    };
    // Modal, sheet, toast nằm đè lên trang là cố ý: chỉ so chữ cùng lớp (cùng khung fixed gần nhất, hoặc cùng trang).
    const layerOf = (element) => {
      for (let node = element; node && node !== document.body; node = node.parentElement) {
        if (getComputedStyle(node).position === "fixed") return node;
      }
      return null;
    };
    const boxes = leaves.flatMap((element) => {
      const range = document.createRange();
      range.selectNodeContents(element);
      const clips = clipsOf(element);
      return [...range.getClientRects()].map((line) => {
        let { left, top, right, bottom } = line;
        for (const clip of clips) {
          left = Math.max(left, clip.left); top = Math.max(top, clip.top); right = Math.min(right, clip.right); bottom = Math.min(bottom, clip.bottom);
        }
        return { element, layer: layerOf(element), rect: { left, top, right, bottom } };
      });
    }).filter(({ rect }) => rect.right - rect.left > 0 && rect.bottom - rect.top > 0).sort((first, second) => first.rect.top - second.rect.top);
    const overlaps = [];
    for (let first = 0; first < boxes.length; first += 1) {
      for (let second = first + 1; second < boxes.length && boxes[second].rect.top < boxes[first].rect.bottom - 2; second += 1) {
        if (boxes[first].element === boxes[second].element || boxes[first].layer !== boxes[second].layer) continue;
        const a = boxes[first].rect, b = boxes[second].rect;
        const overlapX = Math.min(a.right, b.right) - Math.max(a.left, b.left);
        const overlapY = Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top);
        if (overlapX > 2 && overlapY > 2) overlaps.push(`"${boxes[first].element.textContent.trim().slice(0, 20)}" × "${boxes[second].element.textContent.trim().slice(0, 20)}"`);
      }
    }
    // Chữ bị ép: đoạn từ 4 chữ trở lên mà gần như mỗi dòng một chữ (khung quá hẹp, vd max-w nhầm khoảng cách).
    const squeezed = leaves.filter((element) => {
      const words = element.textContent.trim().split(/\s+/).length;
      const range = document.createRange();
      range.selectNodeContents(element);
      const lines = new Set([...range.getClientRects()].map((line) => Math.round(line.top))).size;
      return words >= 4 && lines >= words * 0.8;
    }).map((element) => `"${element.textContent.trim().slice(0, 30)}"`);
    // Khung nổi (modal, sheet, toast) không làm trang cuộn ngang, nên đo riêng xem có lọt ra ngoài màn hình không.
    const offscreen = [...document.querySelectorAll("#design *")]
      .filter((element) => getComputedStyle(element).position === "fixed" && visible(element))
      .filter((element) => {
        const rect = element.getBoundingClientRect();
        return rect.left < -1 || rect.right > root.clientWidth + 1;
      })
      .map((element) => `<${element.tagName.toLowerCase()} data-block=${element.closest("[data-block]")?.dataset.block ?? "?"}>`);
    // Khung nổi nằm dưới toolbar: tiêu đề, nút đóng ở mép trên bị toolbar che, bấm không được.
    const bar = document.querySelector("[data-ds-bar]");
    const barRect = bar?.getBoundingClientRect();
    const underBar = !barRect ? [] : [...document.querySelectorAll("#design *")]
      .filter((element) => getComputedStyle(element).position === "fixed" && visible(element))
      .flatMap((layer) => [...layer.querySelectorAll("button, a, input, select, h1, h2, h3, [role=button]")].filter(visible))
      .filter((node) => {
        const rect = node.getBoundingClientRect();
        if (rect.bottom <= barRect.top || rect.top >= barRect.bottom) return false;
        const x = Math.min(Math.max(rect.left + rect.width / 2, 0), innerWidth - 1);
        const y = Math.min(Math.max(rect.top + rect.height / 2, 0), innerHeight - 1);
        const hit = document.elementFromPoint(x, y);
        return hit && bar.contains(hit);
      })
      .map((node) => `"${(node.getAttribute("aria-label") || node.textContent.trim()).slice(0, 24)}"`);
    return { overflow: root.scrollWidth - root.clientWidth, silentButtons, overlaps, squeezed, offscreen, underBar };
  });
}

// Lỗi layout của một lần đo, dùng chung cho lượt tổ hợp và lượt bấm.
function reportLayout(file, where, result) {
  const some = (list) => `${[...new Set(list)].slice(0, 3).join(" · ")}${list.length > 3 ? ` (+${list.length - 3})` : ""}`;
  if (result.overflow > 0) report(file, where, `cuộn ngang ${result.overflow}px`);
  if (result.overlaps.length) report(file, where, `chữ đè nhau: ${some(result.overlaps)}`);
  if (result.squeezed.length) report(file, where, `chữ bị ép mỗi dòng một chữ, khung quá hẹp: ${some(result.squeezed)}`);
  if (result.offscreen.length) report(file, where, `khung nổi lọt ra ngoài màn hình: ${some(result.offscreen)}`);
  if (result.underBar.length) report(file, where, `khung nổi nằm dưới toolbar, bị che: ${some(result.underBar)} (toolbar ở z-index 1000, khung nổi dùng z-[1100])`);
  if (result.silentButtons.length) report(file, where, `nút không làm gì, cũng không khoá kèm title: ${[...new Set(result.silentButtons)].join(" · ")}`);
}

// Thứ bấm được trong page, mỗi loại lấy một cái: các dòng cùng bảng, các nút cùng hàng giống nhau chỉ bấm một.
// Trả vị trí trong danh sách "#design *" để mở lại page vẫn tìm đúng phần tử.
const clickTargets = (page) => page.evaluate(() => {
  const all = [...document.querySelectorAll("#design *")];
  const visible = (element) => element.getClientRects().length > 0 && getComputedStyle(element).visibility !== "hidden";
  const seen = new Set();
  const targets = [];
  all.forEach((element, index) => {
    const names = [...element.attributes].map((attribute) => attribute.name);
    const handler = names.some((name) => /^(@click|x-on:click)/.test(name) && !/\.(self|outside)/.test(name));
    if (!(handler || element.tagName === "BUTTON") || element.disabled || element.getAttribute("aria-disabled") === "true" || element.hasAttribute("data-copy") || !visible(element)) return;
    // Nhãn ngắn (Nhắc, Đổi hạn, Gỡ chặn) là hành động khác nhau dù cùng class; nhãn dài (tên việc, dòng bảng) là dữ liệu lặp lại.
    const text = element.textContent.trim().replace(/\s+/g, " ");
    const signature = [element.closest("[data-block]")?.dataset.block, element.tagName, element.getAttribute("class"), names.filter((name) => /^[@:]|^x-/.test(name)).join(), text.length <= 16 ? text : ""].join("|");
    if (seen.has(signature)) return;
    seen.add(signature);
    targets.push({ index, signature, label: (element.getAttribute("aria-label") || element.textContent.trim().replace(/\s+/g, " ") || element.tagName).slice(0, 30) });
  });
  return targets;
});
const maxClicks = 60;
// Thứ bấm được chỉ hiện ở một giá trị khác mặc định (nút "Đặt mục tiêu" khi mục tiêu bằng 0): gom ở lượt vặn và lượt
// quét, nhớ giá trị lúc nó hiện ra lần đầu để lượt bấm mở page đúng giá trị đó rồi mới bấm.
const collectTargets = async (page, values, into) => {
  for (const target of await clickTargets(page)) if (!into.has(target.signature)) into.set(target.signature, { ...target, values });
};

// Phần tử đang hiện trong #design, đếm theo thẻ và 3 class đầu. So page vặn tại chỗ với page mở mới từ cùng URL:
// lệch là Alpine không vẽ lại đúng. Không so chữ, để page sinh số ngẫu nhiên không bị báo nhầm.
const visibleCounts = (page) => page.evaluate(() => {
  const counts = {};
  for (const element of document.querySelectorAll("#design *")) {
    if (!element.getClientRects().length || getComputedStyle(element).visibility === "hidden") continue;
    const key = `${element.tagName.toLowerCase()}.${(element.getAttribute("class") ?? "").split(/\s+/).filter(Boolean).slice(0, 3).join(".")}`;
    counts[key] = (counts[key] ?? 0) + 1;
  }
  return counts;
});
const countDiff = (inPlace, fresh) => {
  const extra = [];
  const missing = [];
  for (const key of new Set([...Object.keys(inPlace), ...Object.keys(fresh)])) {
    const gap = (inPlace[key] ?? 0) - (fresh[key] ?? 0);
    if (gap > 0) extra.push([key, gap]);
    if (gap < 0) missing.push([key, -gap]);
  }
  const describe = (list) => `${list.reduce((sum, [, count]) => sum + count, 0)}${list.length ? ` (${list.slice(0, 2).map(([key, count]) => `${count} ${key}`).join(", ")})` : ""}`;
  return extra.length || missing.length ? `thừa ${describe(extra)}, thiếu ${describe(missing)}` : null;
};

function alternatives(control) {
  if (control.type === "toggle") return [!control.default];
  if (control.type === "select") return control.options.map((option) => (typeof option === "object" ? option.value : option)).filter((value) => value !== control.default);
  if (control.type === "number") return [control.max, control.min, (control.default ?? 0) + (control.step ?? 1)].filter((value) => value !== undefined && value !== control.default);
  return [longText];
}

function cartesian(lists) {
  return lists.reduce((rows, list) => rows.flatMap((row) => list.map((item) => [...row, item])), [[]]);
}

for (const file of checkedFiles) {
  const fileUrl = pathToFileURL(join(designDir, file)).href;
  const loadIssues = [];
  let page;
  try {
    page = await openPage(fileUrl, 1280, loadIssues);
  } catch (error) {
    report(file, "", `không mở được page: ${error.message.split("\n")[0]}`);
    continue;
  }
  for (const issue of loadIssues) report(file, "mở page", issue);

  const info = await page.evaluate(() => ({
    design: window.DESIGN ?? {},
    theme: window.DESIGN_THEME ?? {},
    pagesInMenu: document.querySelectorAll("[data-ds-pages] [data-ds-option]").length,
    screensInMenu: document.querySelectorAll("[data-ds-pages] [data-ds-screen]").length,
    toolbarKeys: [...document.querySelectorAll("[data-ds-bar] [data-ds-key]")].map((element) => element.dataset.dsKey),
    blocks: document.querySelectorAll("#design [data-block]").length,
    themeLabels: Object.fromEntries([...document.querySelectorAll('[data-ds-key="theme"] button')].map((button, index) => [["light", "dark"][index], button.textContent])),
    navigations: performance.getEntriesByType("navigation").length,
  }));
  const variables = info.design.variables ?? [];
  const tweaks = info.design.tweaks ?? [];
  const controls = [...variables, ...tweaks];

  if (info.blocks === 0) report(file, "", "không có khối data-block nào (số khối để góp ý)");
  // Thư mục một page thì option-switcher không có nút chữ nào. Thư mục luồng thì là dãy màn, không có nút chữ.
  const expectedOptions = pages.length >= 2 && !isFlow ? pages.length : 0;
  const expectedScreens = pages.length >= 2 && isFlow ? pages.length : 0;
  if (info.pagesInMenu !== expectedOptions) report(file, "", `option-switcher có ${info.pagesInMenu} nút phương án, cần ${expectedOptions} (pages.js có ${pages.length} page)`);
  if (info.screensInMenu !== expectedScreens) report(file, "", `dãy màn có ${info.screensInMenu} màn, cần ${expectedScreens} (pages.js có ${pages.length} page)`);
  for (const control of controls) {
    if (!control.key || !control.type) report(file, "", `nút khai thiếu key hay type: ${JSON.stringify(control).slice(0, 80)}`);
    if (!info.toolbarKeys.includes(control.key)) report(file, "", `nút "${control.key}" khai trong DESIGN mà không có ở panel`);
  }
  if (info.theme.derived) {
    const label = info.themeLabels[info.theme.derived] ?? "";
    if (!/suy ra|derived/.test(label)) report(file, "", `giao diện ${info.theme.derived} là suy ra mà nút không ghi "(suy ra)"`);
  }

  // Bề rộng trang: khối ngoài cùng của #design rộng đúng bề rộng trang trong tokens.js, để các page cùng thư mục
  // so được với nhau và khớp layout của app. Đo ở 1920px, rộng hơn mọi bề rộng trang hay gặp.
  const pageWidth = info.design.pageWidth;
  if (pageWidth && !pageWidth.why) report(file, "", "DESIGN.pageWidth khác bề rộng chung mà thiếu why (vì sao phương án này cần rộng khác)");
  const expectedWidth = pageWidth?.value ?? info.theme.page?.width ?? "64rem";
  if (!quick) await page.setViewportSize({ width: 1920, height: 900 });
  await settle(page);
  const measured = quick ? null : await page.evaluate((expected) => {
    const main = document.querySelector("#design");
    const outer = [...(main?.children ?? [])].find((element) => element.getClientRects().length && !["fixed", "absolute"].includes(getComputedStyle(element).position));
    if (!outer) return null;
    const px = expected === "full" ? main.clientWidth : Math.min(main.clientWidth, parseFloat(expected) * (expected.endsWith("rem") ? 16 : 1));
    return { actual: Math.round(outer.getBoundingClientRect().width), px: Math.round(px), className: (outer.getAttribute("class") ?? "").match(/max-w-\S+/)?.[0] ?? "" };
  }, expectedWidth);
  if (measured && Math.abs(measured.actual - measured.px) > 1) {
    report(file, "1920px", `khối ngoài cùng của #design rộng ${measured.actual}px${measured.className ? ` (${measured.className})` : ""}, bề rộng trang là ${expectedWidth} = ${measured.px}px: dùng class max-w-page${pageWidth ? `, hay max-w-[${pageWidth.value}] như DESIGN.pageWidth` : ""}`);
  }
  await page.setViewportSize({ width: 1280, height: 900 });
  await settle(page);

  const state = variables.find((control) => control.key === "state");
  const declaredStates = state?.options?.map((option) => (typeof option === "object" ? option.value : option)) ?? [];
  const missingStates = requiredStates.filter((value) => !declaredStates.includes(value));
  if (!state) report(file, "", "thiếu variable state");
  else if (missingStates.length) report(file, "", `variable state thiếu: ${missingStates.join(", ")}`);
  if (sharedKeys?.length) {
    const keys = variables.map((control) => control.key);
    const lacking = sharedKeys.filter((key) => !keys.includes(key));
    const extra = keys.filter((key) => !sharedKeys.includes(key));
    if (lacking.length || extra.length) report(file, "", `variables khác bảng "Nút dữ liệu chung" của brief.md:${lacking.length ? ` thiếu ${lacking.join(", ")}` : ""}${extra.length ? ` thừa ${extra.join(", ")}` : ""}`);
  }

  // --quick: đúng một tổ hợp ở 1280px, sáng, tweak mặc định, state theo --state hay preset theo --preset; rồi sang page sau.
  if (quick) {
    const preset = quickPreset === undefined ? null : (info.design.presets ?? []).find((item) => item.label === quickPreset);
    if (quickPreset !== undefined && !preset) report(file, "--quick", `không có preset "${quickPreset}" (có ${(info.design.presets ?? []).map((item) => `"${item.label}"`).join(", ") || "—"})`);
    if (quickState !== undefined && !declaredStates.includes(quickState)) report(file, "--quick", `state "${quickState}" không có trong variable state (có ${declaredStates.join(", ") || "—"})`);
    const values = { ...Object.fromEntries(controls.map((control) => [control.key, control.default])), theme: "light", ...(quickState !== undefined && { state: quickState }), ...(preset?.values ?? {}) };
    loadIssues.length = 0;
    await setStore(page, values);
    const where = `1280px ${preset ? `preset "${preset.label}"` : `theme=light${values.state !== undefined ? `&state=${values.state}` : ""}`}`;
    for (const issue of loadIssues) report(file, where, issue);
    reportLayout(file, where, await inspect(page));
    await page.evaluate(animationsDone);
    const probe = await page.evaluate(pageProbe, { ...tokens, skip: yielded, width: 1280, state: values.state });
    for (const issue of probe.issues) report(file, where, ruleTag(issue.rule, issue.message));
    comboCount += 1;
    if (takeShots) await page.screenshot({ path: join(shotsDir, `${file.replace(/\.html$/, "")}--quick.png`), fullPage: true });
    await page.close();
    continue;
  }

  // Vặn từng nút: UI phải đổi. Ở mỗi giá trị, page vặn tại chỗ phải hiện như page mở mới từ URL đó, và thứ bấm
  // được chỉ hiện ở giá trị này được gom cho lượt bấm.
  const defaults = Object.fromEntries(controls.map((control) => [control.key, control.default]));
  const baseline = await snapshot(page);
  const tunedTargets = new Map();
  for (const control of controls) {
    let changed = false;
    for (const value of alternatives(control)) {
      await setStore(page, { [control.key]: value });
      if ((await snapshot(page)) !== baseline) changed = true;
      await page.evaluate(animationsDone);
      const reopenIssues = [];
      const fresh = await openPage(page.url(), 1280, reopenIssues);
      await fresh.evaluate(animationsDone);
      const drift = countDiff(await visibleCounts(page), await visibleCounts(fresh));
      await fresh.close();
      if (drift) report(file, "", `vặn "${control.key}"=${value} tại chỗ hiện khác khi mở lại link: ${drift} — Alpine không vẽ lại đúng, hay gặp khi x-show đi cùng :style chuỗi; dùng :style dạng object hay :class 'hidden'`);
      await collectTargets(page, { [control.key]: value }, tunedTargets);
      // Ô số, ô chữ trong panel phải hiện đủ giá trị đang vặn, không bị cắt.
      const clipped = await page.evaluate((key) => {
        const input = document.querySelector(`[data-ds-bar] [data-ds-key="${key}"] input`);
        // Ô nằm trong panel đang gập thì không đo được; trong panel ô rộng hết panel nên không bị cắt.
        if (!input || !input.getClientRects().length) return null;
        const style = getComputedStyle(input);
        const context = document.createElement("canvas").getContext("2d");
        context.font = `${style.fontWeight} ${style.fontSize} ${style.fontFamily}`;
        const needed = context.measureText(String(input.value)).width + parseFloat(style.paddingLeft) + parseFloat(style.paddingRight);
        return needed > input.clientWidth + 0.5 && input.type === "number" ? `${input.value} cần ${Math.ceil(needed)}px, ô rộng ${input.clientWidth}px` : null;
      }, control.key);
      if (clipped) report(file, "", `ô "${control.key}" trong panel bị cắt chữ số: ${clipped}`);
      await setStore(page, defaults);
    }
    if (!changed) report(file, "", `vặn nút "${control.key}" mà UI không đổi — nút khai thừa, hoặc page không đọc $store.design.${control.key}`);
  }

  // URL ghi lại và mở lại; không tải lại trang.
  const probeValues = Object.fromEntries(controls.map((control) => [control.key, alternatives(control)[0]]).filter(([, value]) => value !== undefined));
  await setStore(page, probeValues);
  const written = page.url();
  const afterNavigations = await page.evaluate(() => performance.getEntriesByType("navigation").length);
  if (afterNavigations !== info.navigations) report(file, "", "đổi giá trị làm trang tải lại");
  const reopenIssues = [];
  const reopened = await openPage(written, 1280, reopenIssues);
  const reopenedValues = await reopened.evaluate((keys) => Object.fromEntries(keys.map((key) => [key, Alpine.store("design")[key]])), Object.keys(probeValues));
  for (const [key, value] of Object.entries(probeValues)) {
    if (String(reopenedValues[key]) !== String(value)) report(file, "mở lại URL", `"${key}" ra ${reopenedValues[key]}, cần ${value}`);
  }
  for (const issue of reopenIssues) report(file, "mở lại URL", issue);
  await reopened.close();
  await setStore(page, defaults);

  // Khổ tablet / mobile.
  for (const [viewport, frameWidth] of [["tablet", 768], ["mobile", 375]]) {
    await setStore(page, { viewport });
    await page.waitForFunction(() => document.querySelector(".ds-frame-wrap iframe"), null, { timeout: 10000 }).catch(() => {});
    const frameElement = await page.$(".ds-frame-wrap iframe");
    if (!frameElement) {
      report(file, `viewport=${viewport}`, "không có iframe");
      continue;
    }
    const frame = await frameElement.contentFrame();
    await frame.waitForFunction(() => window.Alpine && document.querySelector("#design"), null, { timeout: 20000 }).catch(() => report(file, `viewport=${viewport}`, "page trong iframe không lên"));
    // Đo bề rộng bên trong iframe (media query của page chạy theo số này), không đo khung ngoài có viền.
    const innerWidth = await frame.evaluate(() => window.innerWidth);
    if (innerWidth !== frameWidth) report(file, `viewport=${viewport}`, `page trong iframe rộng ${innerWidth}px, cần đúng ${frameWidth}px`);
    if (await frame.$("[data-ds-bar]")) report(file, `viewport=${viewport}`, "trong iframe vẫn có toolbar");
    const firstControl = controls.find((control) => alternatives(control).length);
    if (firstControl) {
      const before = await frame.evaluate(() => document.querySelector("#design")?.innerHTML ?? "");
      await setStore(page, { [firstControl.key]: alternatives(firstControl)[0] });
      await frame.waitForTimeout(150);
      const after = await frame.evaluate(() => document.querySelector("#design")?.innerHTML ?? "");
      if (before === after) report(file, `viewport=${viewport}`, `vặn "${firstControl.key}" ở panel mà page trong iframe không đổi`);
      await setStore(page, { [firstControl.key]: firstControl.default });
    }
    if (takeShots) await page.screenshot({ path: join(shotsDir, `${file.replace(/\.html$/, "")}--viewport-${viewport}.png`) });
  }
  await setStore(page, { ...defaults, viewport: "desktop" });
  await page.close();

  // Mọi tổ hợp tweak × sáng tối × state, cộng từng preset, ở hai khổ.
  const tweakLists = tweaks.map((control) => [control.default, ...alternatives(control)].map((value) => [control.key, value]));
  const stateControl = variables.find((control) => control.key === "state");
  const stateValues = stateControl ? [stateControl.default, ...alternatives(stateControl)] : [undefined];
  const combos = [];
  for (const tweakRow of cartesian(tweakLists)) {
    for (const theme of ["light", "dark"]) {
      for (const state of stateValues) combos.push({ ...Object.fromEntries(tweakRow), theme, ...(state !== undefined && { state }) });
    }
  }
  for (const preset of info.design.presets ?? []) for (const theme of ["light", "dark"]) combos.push({ ...preset.values, theme, preset: preset.label });

  // UX6 so chữ của từng khối ở state empty / error với state mặc định cùng tổ hợp.
  const baselines = new Map();
  for (const width of widths) {
    const issues = [];
    const sweep = await openPage(fileUrl, width, issues);
    const sweepTargets = new Map();
    for (const combo of combos) {
      issues.length = 0;
      const { preset, ...values } = combo;
      await setStore(sweep, { ...defaults, ...values });
      await collectTargets(sweep, values, sweepTargets);
      const result = await inspect(sweep);
      const where = `${width}px ${preset ? `preset "${preset}" theme=${values.theme}` : comboLabel(values)}`;
      for (const issue of issues) report(file, where, issue);
      reportLayout(file, where, result);
      await sweep.evaluate(animationsDone);
      const probe = await sweep.evaluate(pageProbe, { ...tokens, skip: yielded, width, state: values.state });
      for (const issue of probe.issues) report(file, where, ruleTag(issue.rule, issue.message));
      const { state: comboState, ...others } = values;
      if (!preset && stateControl) {
        const key = `${width}|${comboLabel(others)}`;
        if (comboState === stateControl.default) baselines.set(key, probe);
        else if (["empty", "error"].includes(comboState)) {
          // Lối làm tiếp: một khối đổi chữ theo state có nút (hay nút khoá kèm title), hoặc có nút chỉ hiện ở state này.
          const base = baselines.get(key) ?? { blocks: {}, actions: [] };
          const changed = Object.entries(probe.blocks).filter(([id, block]) => block.text && block.text !== base.blocks[id]?.text);
          const fresh = probe.actions.filter((label) => !base.actions.includes(label));
          if (changed.length && !changed.some(([, block]) => block.actionable) && !fresh.length) report(file, where, ruleTag("UX6", `state=${comboState}: khối ${changed.map(([id]) => id).join(", ")} đổi chữ mà không có nút hay link làm tiếp`));
        }
      }
      comboCount += 1;
      const isMainShot = !preset && tweaks.every((control) => values[control.key] === control.default);
      if (isMainShot && width === 1280 && values.theme === "light" && (!stateControl || comboState === stateControl.default)) buttonsByPage.set(file, probe.buttons);
      if (width === 1280 && values.theme === "light") for (const button of probe.buttons) if (button.primary) primariesByPage.set(file, new Set([...(primariesByPage.get(file) ?? []), button.primary]));
      if (takeShots && (isMainShot || preset)) {
        const name = `${file.replace(/\.html$/, "")}--${width}--${(preset ? `preset-${preset}-${values.theme}` : comboLabel(values)).replace(/[^\w=-]+/g, "_")}.png`;
        await sweep.screenshot({ path: join(shotsDir, name), fullPage: true });
      }
    }
    await sweep.close();

    // Lượt bấm: modal, sheet, hàng mở rộng chỉ hiện sau cú bấm, panel không vặn ra được. Mỗi lần bấm mở
    // page mới từ giá trị mặc định, bấm một thứ, chờ hiệu ứng xong rồi đo như lượt tổ hợp.
    // Thứ thấy ở giá trị mặc định bấm trước, rồi tới thứ chỉ hiện ở giá trị khác (lượt vặn, lượt quét).
    const clicker = await openPage(fileUrl, width, issues);
    const merged = new Map();
    await collectTargets(clicker, {}, merged);
    for (const source of [tunedTargets, sweepTargets]) for (const [signature, target] of source) if (!merged.has(signature)) merged.set(signature, target);
    const targets = [...merged.values()].slice(0, maxClicks);
    for (const target of targets) {
      issues.length = 0;
      await clicker.goto(fileUrl);
      await clicker.waitForFunction(() => window.Alpine && document.querySelector("[data-ds-bar]") && getComputedStyle(document.documentElement).getPropertyValue("--color-canvas"), null, { timeout: 20000 });
      await settle(clicker);
      const tuned = Object.keys(target.values).length > 0;
      if (tuned) await setStore(clicker, { ...defaults, ...target.values });
      const where = `${width}px bấm "${target.label}"${tuned ? ` (${comboLabel(target.values)})` : ""}`;
      const element = await clicker.evaluateHandle((index) => document.querySelectorAll("#design *")[index], target.index);
      // Gom ở 1280px mà khổ này ẩn (sm:inline…) thì bỏ qua: không phải nút câm.
      if (!(await element.evaluate((node) => Boolean(node && node.getClientRects().length && getComputedStyle(node).visibility !== "hidden")))) continue;
      const fixedBefore = await clicker.evaluate(() => [...document.querySelectorAll("#design *")].filter((node) => getComputedStyle(node).position === "fixed" && node.getClientRects().length).length);
      await element.asElement().scrollIntoViewIfNeeded({ timeout: 2000 }).catch(() => {});
      // UX2: rê vào thì không phần tử nào khác xô đi (chỉ đo ở khổ có chuột).
      if (width >= 1024) {
        const before = await clicker.evaluate(positionsAround, target.index);
        await element.asElement().hover({ timeout: 2000 }).catch(() => {});
        await clicker.waitForTimeout(250);
        const moved = shifted(before, await clicker.evaluate(positionsAround, target.index));
        if (moved.length) {
          const names = await Promise.all(moved.slice(0, 2).map((entry) => clicker.evaluate(describeAt, entry.index)));
          report(file, `${width}px rê "${target.label}"`, ruleTag("UX2", `rê vào "${target.label}" làm ${moved.length} phần tử khác xô đi, vd ${names.join(", ")}`));
        }
      }
      const rowBefore = await clicker.evaluate(rowRects, target.index);
      const wasHittable = await clicker.evaluate(hitsItself, target.index);
      try {
        await element.asElement().click({ timeout: 2000 });
      } catch (error) {
        report(file, where, `không bấm được: ${error.message.split("\n")[0].slice(0, 100)}`);
        continue;
      }
      await clicker.waitForTimeout(350);
      // Bấm làm page sang file khác: hợp lệ khi file đó có trong pages.js (nút "Tiếp tục" của luồng).
      if (clicker.url().split("?")[0] !== fileUrl.split("?")[0]) {
        const landed = decodeURIComponent(new URL(clicker.url()).pathname.split("/").pop());
        if (!pages.some((page) => page.file === landed)) report(file, where, `bấm "${target.label}" sang ${landed}, file không có trong pages.js`);
        continue;
      }
      for (const issue of issues) report(file, where, issue);
      reportLayout(file, where, await inspect(clicker));
      const rowAfter = await clicker.evaluate(rowRects, target.index);
      if (rowBefore && rowAfter && rowBefore.length === rowAfter.length && rowBefore.some((rect, index) => Math.abs(rect[0] - rowAfter[index][0]) > 0.5 || Math.abs(rect[1] - rowAfter[index][1]) > 0.5)) {
        report(file, where, ruleTag("UX2", `bấm "${target.label}" làm các nút cùng hàng xô đi`));
      }
      const createLike = /^(thêm|tạo|mời|mới|add|new|create|invite)/i.test(target.label.trim());
      for (const issue of await clicker.evaluate(afterClick, { index: target.index, createLike, wasHittable })) report(file, where, ruleTag(issue.rule, issue.message));
      await clicker.evaluate(animationsDone);
      const clickProbe = await clicker.evaluate(pageProbe, { ...tokens, skip: yielded, width });
      for (const issue of clickProbe.issues) report(file, where, ruleTag(issue.rule, issue.message));
      comboCount += 1;
      const fixedAfter = await clicker.evaluate(() => [...document.querySelectorAll("#design *")].filter((node) => getComputedStyle(node).position === "fixed" && node.getClientRects().length).length);
      if (takeShots && fixedAfter > fixedBefore) {
        await clicker.screenshot({ path: join(shotsDir, `${file.replace(/\.html$/, "")}--${width}--bam-${target.label.replace(/[^\p{L}\p{N}]+/gu, "_")}.png`) });
      }
    }
    await clicker.close();
  }
}

// Lượt đi luồng: như người xem thật, mở màn 1, điền các ô form.* bằng chữ mẫu, bấm thứ gọi next() tới màn cuối, rồi
// prev() một lần: ô của màn trước phải còn chữ. Page mới (context mới) nên sessionStorage sạch.
if (isFlow && !onlyFile && pages.length >= 2) {
  const sample = { email: "an@vidu.vn", password: "MatKhau#2026", tel: "0901234567", number: "1", date: "2026-10-08", url: "https://vidu.vn" };
  const fillForm = (page) => page.evaluate((sample) => {
    const filled = [];
    for (const field of document.querySelectorAll("#design input, #design textarea, #design select")) {
      const model = field.getAttribute("x-model") ?? field.getAttribute("x-model.number") ?? field.getAttribute("x-model.trim") ?? "";
      if (!model.includes("$store.design.form.") || !field.getClientRects().length) continue;
      if (field.type === "checkbox" || field.type === "radio") field.checked = true;
      else if (field.tagName === "SELECT") field.selectedIndex = Math.min(1, field.options.length - 1);
      else field.value = field.min && field.type === "number" ? field.min || sample.number : sample[field.type] ?? "Chữ mẫu";
      field.dispatchEvent(new Event(field.tagName === "SELECT" || field.type === "checkbox" || field.type === "radio" ? "change" : "input", { bubbles: true }));
      filled.push(model.split("$store.design.form.")[1].split(/\W/)[0]);
    }
    return filled;
  }, sample);
  // Phần tử đang hiện mà cú bấm gọi $store.design.<name>(); trả vị trí trong "#design *".
  const caller = (page, name) => page.evaluate((name) => [...document.querySelectorAll("#design *")].findIndex((element) =>
    [...element.attributes].some((attribute) => /^(@click|x-on:click)/.test(attribute.name) && attribute.value.includes(`$store.design.${name}(`)) && element.getClientRects().length), name);
  const urlOf = (file) => pathToFileURL(join(designDir, file)).href;
  const walkIssues = [];
  const walker = await openPage(urlOf(pages[0].file), 1280, walkIssues);
  let typed = [];
  for (let index = 0; index < pages.length; index += 1) {
    const at = `lượt đi luồng, màn ${index + 1}`;
    if (index === pages.length - 1) {
      const back = await caller(walker, "prev");
      if (back < 0) break;
      await walker.evaluate((index) => document.querySelectorAll("#design *")[index].click(), back);
      await walker.waitForURL((url) => url.pathname.endsWith(`/${pages[index - 1].file}`), { timeout: 5000 }).catch(() => {});
      if (!walker.url().split("?")[0].endsWith(`/${pages[index - 1].file}`)) {
        report(pages[index].file, at, `bấm nút gọi prev() mà không về màn ${index}`);
        break;
      }
      await walker.waitForFunction(() => window.Alpine && document.querySelector("[data-ds-bar]"), null, { timeout: 20000 });
      await settle(walker);
      const lost = await walker.evaluate((keys) => keys.filter((key) => [...document.querySelectorAll("#design [x-model]")].some((field) => field.getAttribute("x-model") === `$store.design.form.${key}` && field.getClientRects().length && field.type !== "checkbox" && !field.value)), typed);
      if (lost.length) report(pages[index - 1].file, at, `quay lại màn ${index} thì ô ${lost.map((key) => `form.${key}`).join(", ")} mất chữ đã gõ`);
      break;
    }
    typed = await fillForm(walker);
    await settle(walker);
    const next = await caller(walker, "next");
    if (next < 0) {
      report(pages[index].file, at, `không sang được màn ${index + 2}: không có nút nào đang hiện gọi $store.design.next()`);
      break;
    }
    await walker.evaluate((index) => document.querySelectorAll("#design *")[index].click(), next);
    await walker.waitForURL((url) => url.pathname.endsWith(`/${pages[index + 1].file}`), { timeout: 5000 }).catch(() => {});
    if (!walker.url().split("?")[0].endsWith(`/${pages[index + 1].file}`)) {
      report(pages[index].file, at, `không sang được màn ${index + 2}: bấm nút gọi next() mà vẫn ở ${decodeURIComponent(new URL(walker.url()).pathname.split("/").pop())}`);
      break;
    }
    await walker.waitForFunction(() => window.Alpine && document.querySelector("[data-ds-bar]"), null, { timeout: 20000 });
    await settle(walker);
  }
  for (const issue of walkIssues) report(basename(designDir), "lượt đi luồng", issue);
  await walker.close();
}

await browser.close();

for (const issue of folderIssues(buttonsByPage, yielded)) report(onlyFile ?? basename(designDir), "", ruleTag(issue.rule, issue.message));
// Nút chính các page cùng màu nền và màu chữ (1280px, giao diện sáng, mọi tổ hợp): cặp của design system không đủ đọc
// thì brief.md chốt một cách dùng thay, page nào tự lách kiểu khác thì lệch ở đây.
const primaries = [...primariesByPage].map(([file, pairs]) => [file, [...pairs].sort().join(" + ")]);
if (new Set(primaries.map(([, pairs]) => pairs)).size > 1) {
  report(basename(designDir), "", `nút chính các page khác màu: ${primaries.map(([file, pairs]) => `${file} ${pairs}`).join(" · ")} — theo "Cặp màu không đủ đọc" của brief.md`);
}

for (const { file, message, places } of errors.values()) {
  const unique = [...new Set(places)];
  const where = unique.length === 0 ? "" : unique.length <= 2 ? ` [${unique.join("; ")}]` : ` [${unique.length} chỗ, vd ${unique.slice(0, 2).join("; ")}]`;
  console.log(`✗ ${file}${where}: ${message}`);
}
if (quick) console.log(`${errors.size ? "✗" : "✓"} quick · ${onlyFile} · ${errors.size} lỗi · ${((performance.now() - started) / 1000).toFixed(1)}s`);
else console.log(`${errors.size ? "✗" : "✓"} ${checkedFiles.length} page · ${comboCount} tổ hợp · ${errors.size} lỗi${takeShots ? ` · ảnh ở ${shotsDir}` : ""}`);
process.exit(errors.size ? 1 : 0);
