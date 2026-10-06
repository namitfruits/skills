#!/usr/bin/env node
// Kiểm bằng code đầu ra của skill design-uiux: một thư mục .design/NNN-slug (hoặc một page trong đó).
// Skill chỉ được giao link khi lệnh này ra exit 0. Chỉ đọc, không sửa page.
//
//   node check.mjs <thư mục design | page.html> [--pw <thư mục có node_modules/playwright>] [--no-shots]
//
// Lượt tĩnh (đọc file): đủ file khung, pages.js hợp lệ và liệt kê mọi page, thứ tự nạp script, không mã màu
// ngoài tokens.js; brief.md đủ mục, hết chỗ trống <…>, cột "Ai quyết" hợp lệ, bảng Pages khớp pages.js.
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
//   - lượt bấm: bấm từng loại thứ bấm được trong page (modal, sheet, hàng mở rộng), đo lại như trên
//   - đổi giá trị không tải lại trang; URL ghi lại mở ở tab mới ra đúng giá trị
//   - khổ tablet / mobile: iframe đúng bề rộng, không toolbar bên trong, vặn nút ở panel thì iframe đổi
//   - giao diện suy ra có ghi "(suy ra)" ở view-controller; option-switcher đủ số page
// Nguyên tắc và giới hạn của ../principles.md: kiểm trong principles-check.mjs, chạy ở lượt tĩnh, mỗi tổ hợp, lượt bấm
// (rê, bấm) và cả thư mục; lỗi mang ID luật ([N13], [G4]). Giới hạn G ghi trong bảng "Giới hạn nhường cho design system"
// của brief.md thì bỏ qua. Luật trong principles.md không có kiểm thì dừng ngay (exit 2).
// Exit 0 khi sạch, 1 khi có lỗi, 2 khi không chạy được (thiếu Playwright, không mở được page).

import { existsSync, mkdirSync, readdirSync, readFileSync, statSync } from "node:fs";
import { createRequire } from "node:module";
import { tmpdir } from "node:os";
import { basename, dirname, join, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { afterClick, animationsDone, checks, describeAt, folderIssues, hitsItself, pageProbe, positionsAround, readTokens, readYielded, rowRects, shifted, staticIssues } from "./principles-check.mjs";

const widths = [375, 1280];
const requiredStates = ["data", "loading", "empty", "error"];
const longText = "Một chuỗi rất dài để thử chữ tràn: Công ty Trách nhiệm hữu hạn Thương mại và Dịch vụ Kỹ thuật Số Toàn Cầu";

const args = process.argv.slice(2);
const target = args.find((arg) => !arg.startsWith("--") && args[args.indexOf(arg) - 1] !== "--pw");
const pwFlag = args.includes("--pw") ? args[args.indexOf("--pw") + 1] : process.env.PW_DIR;
const takeShots = !args.includes("--no-shots");
if (!target) {
  console.error("cách dùng: node check.mjs <thư mục design | page.html> [--pw <dir>] [--no-shots]");
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

// Luật trong principles.md và kiểm trong principles-check.mjs phải khớp nhau: luật không có kiểm thì chỉ nằm trên giấy.
const principlesPath = join(dirname(fileURLToPath(import.meta.url)), "../principles.md");
const ruleIds = [...readFileSync(principlesPath, "utf8").matchAll(/^\*\*([NG]\d+)\./gm)].map((match) => match[1]);
const checkedRules = [...new Set(checks.map((check) => check.rule))];
const unchecked = ruleIds.filter((rule) => !checkedRules.includes(rule));
const orphan = checkedRules.filter((rule) => !ruleIds.includes(rule));
if (unchecked.length || orphan.length) {
  if (unchecked.length) console.error(`skill lệch: ${unchecked.join(", ")} chưa có kiểm trong scripts/principles-check.mjs`);
  if (orphan.length) console.error(`skill lệch: kiểm trỏ luật không có trong principles.md: ${orphan.join(", ")}`);
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
for (const page of pages) {
  for (const field of ["file", "title", "updated"]) if (!page[field]) report("pages.js", page.file ?? "?", `thiếu field ${field}`);
  // ≥ 2 page thì mỗi page là một phương án: nút chữ riêng ở option-switcher, khung mô tả có câu hỏi trung tâm.
  if (pages.length >= 2) {
    const letter = page.option?.match(/^\s*([A-Za-z])\s*·/)?.[1]?.toUpperCase();
    if (!letter) report("pages.js", page.file ?? "?", `option phải có dạng "A · tên phương án", đang là "${page.option ?? ""}"`);
    else if (pages.filter((other) => other.option?.match(/^\s*([A-Za-z])\s*·/)?.[1]?.toUpperCase() === letter).length > 1) report("pages.js", page.file, `chữ ${letter} trùng với page khác`);
    if (!page.question) report("pages.js", page.file ?? "?", "thiếu question (câu hỏi trung tâm, hiện khi đưa chuột vào nút phương án)");
  }
  if (page.file && !htmlFiles.includes(page.file)) report("pages.js", page.file, "file không tồn tại");
}

// brief.md: bản tóm tắt chung các page cùng đọc. Chỗ trống <…> ngoài backtick là chưa điền (thẻ HTML thì viết
// trong backtick). Bảng "Nút dữ liệu chung" là bộ key variables mà mọi page phải khai đúng.
const briefSections = ["Tóm tắt đề", "Quyết định", "Design system", "Pages", "Tình huống", "Dữ liệu chung", "Nút dữ liệu chung", "Số kiểm chéo ở mặc định", "Đề gốc"];
const deciders = ["người dùng", "--auto", "AI đoán"];
// Các dòng dữ liệu của bảng đầu tiên trong một mục (bỏ dòng tiêu đề và dòng gạch), mỗi dòng là mảng ô đã bỏ backtick.
const sectionRows = (text, name) => (text.split(new RegExp(`^## ${name}\\s*$`, "m"))[1]?.split(/^## /m)[0] ?? "")
  .split("\n").filter((line) => line.trim().startsWith("|")).slice(2)
  .map((line) => line.trim().replace(/^\||\|$/g, "").split("|").map((cell) => cell.trim().replace(/`/g, "")));
let sharedKeys = null;
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
    // Bảng ## Pages khớp pages.js: thêm page ở vòng sau thì brief phải ghi theo.
    const listed = sectionRows(brief, "Pages").map((cells) => cells[0]).filter((file) => file.endsWith(".html"));
    const notListed = pages.map((page) => page.file).filter((file) => file && !listed.includes(file));
    const unknown = listed.filter((file) => !pages.some((page) => page.file === file));
    if (notListed.length) report("brief.md", "", `bảng ## Pages thiếu page có trong pages.js: ${notListed.join(", ")}`);
    if (unknown.length) report("brief.md", "", `bảng ## Pages có file mà pages.js không có: ${unknown.join(", ")}`);
    // Giới hạn G nào design system nói khác thì kiểm của nó tắt cho cả thư mục (principles.md, "Thứ tự ưu tiên").
    const table = readYielded(brief, ruleIds.filter((rule) => rule.startsWith("G")));
    yielded = table.yielded;
    for (const problem of table.problems) report("brief.md", "", problem);
  }
}
for (const file of htmlFiles) if (!pages.some((page) => page.file === file)) report(file, "", "page không có trong pages.js");

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
}
const tokens = existsSync(join(designDir, "tokens.js")) ? readTokens(readFileSync(join(designDir, "tokens.js"), "utf8")) : readTokens("");
const buttonsByPage = new Map();

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
  page.on("console", (message) => {
    if (message.type() === "error" || /Alpine Expression Error/.test(message.text())) issues.push(`console: ${message.text().split("\n")[0].slice(0, 160)}`);
  });
  page.on("requestfailed", (request) => issues.push(`request hỏng: ${request.url()} (${request.failure()?.errorText})`));
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
    if (!(handler || element.tagName === "BUTTON") || element.disabled || element.hasAttribute("data-copy") || !visible(element)) return;
    // Nhãn ngắn (Nhắc, Đổi hạn, Gỡ chặn) là hành động khác nhau dù cùng class; nhãn dài (tên việc, dòng bảng) là dữ liệu lặp lại.
    const text = element.textContent.trim().replace(/\s+/g, " ");
    const signature = [element.closest("[data-block]")?.dataset.block, element.tagName, element.getAttribute("class"), names.filter((name) => /^[@:]|^x-/.test(name)).join(), text.length <= 16 ? text : ""].join("|");
    if (seen.has(signature)) return;
    seen.add(signature);
    targets.push({ index, label: (element.getAttribute("aria-label") || element.textContent.trim().replace(/\s+/g, " ") || element.tagName).slice(0, 30) });
  });
  return targets;
});
const maxClicks = 60;

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
    toolbarKeys: [...document.querySelectorAll("[data-ds-bar] [data-ds-key]")].map((element) => element.dataset.dsKey),
    blocks: document.querySelectorAll("#design [data-block]").length,
    themeLabels: Object.fromEntries([...document.querySelectorAll('[data-ds-key="theme"] button')].map((button, index) => [["light", "dark"][index], button.textContent])),
    navigations: performance.getEntriesByType("navigation").length,
  }));
  const variables = info.design.variables ?? [];
  const tweaks = info.design.tweaks ?? [];
  const controls = [...variables, ...tweaks];

  if (info.blocks === 0) report(file, "", "không có khối data-block nào (số khối để góp ý)");
  // Thư mục một page thì option-switcher không có nút chữ nào.
  const expectedOptions = pages.length >= 2 ? pages.length : 0;
  if (info.pagesInMenu !== expectedOptions) report(file, "", `option-switcher có ${info.pagesInMenu} nút phương án, cần ${expectedOptions} (pages.js có ${pages.length} page)`);
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
  await page.setViewportSize({ width: 1920, height: 900 });
  await settle(page);
  const measured = await page.evaluate((expected) => {
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

  // Vặn từng nút: UI phải đổi.
  const defaults = Object.fromEntries(controls.map((control) => [control.key, control.default]));
  const baseline = await snapshot(page);
  for (const control of controls) {
    let changed = false;
    for (const value of alternatives(control)) {
      await setStore(page, { [control.key]: value });
      if ((await snapshot(page)) !== baseline) changed = true;
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
      if (changed) break;
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

  // N7 so chữ của từng khối ở state empty / error với state mặc định cùng tổ hợp.
  const baselines = new Map();
  for (const width of widths) {
    const issues = [];
    const sweep = await openPage(fileUrl, width, issues);
    for (const combo of combos) {
      issues.length = 0;
      const { preset, ...values } = combo;
      await setStore(sweep, { ...defaults, ...values });
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
          if (changed.length && !changed.some(([, block]) => block.actionable) && !fresh.length) report(file, where, ruleTag("N7", `state=${comboState}: khối ${changed.map(([id]) => id).join(", ")} đổi chữ mà không có nút hay link làm tiếp`));
        }
      }
      comboCount += 1;
      const isMainShot = !preset && tweaks.every((control) => values[control.key] === control.default);
      if (isMainShot && width === 1280 && values.theme === "light" && (!stateControl || comboState === stateControl.default)) buttonsByPage.set(file, probe.buttons);
      if (takeShots && (isMainShot || preset)) {
        const name = `${file.replace(/\.html$/, "")}--${width}--${(preset ? `preset-${preset}-${values.theme}` : comboLabel(values)).replace(/[^\w=-]+/g, "_")}.png`;
        await sweep.screenshot({ path: join(shotsDir, name), fullPage: true });
      }
    }
    await sweep.close();

    // Lượt bấm: modal, sheet, hàng mở rộng chỉ hiện sau cú bấm, panel không vặn ra được. Mỗi lần bấm mở
    // page mới từ giá trị mặc định, bấm một thứ, chờ hiệu ứng xong rồi đo như lượt tổ hợp.
    const clicker = await openPage(fileUrl, width, issues);
    const targets = (await clickTargets(clicker)).slice(0, maxClicks);
    for (const target of targets) {
      issues.length = 0;
      await clicker.goto(fileUrl);
      await clicker.waitForFunction(() => window.Alpine && document.querySelector("[data-ds-bar]") && getComputedStyle(document.documentElement).getPropertyValue("--color-canvas"), null, { timeout: 20000 });
      await settle(clicker);
      const where = `${width}px bấm "${target.label}"`;
      const element = await clicker.evaluateHandle((index) => document.querySelectorAll("#design *")[index], target.index);
      const fixedBefore = await clicker.evaluate(() => [...document.querySelectorAll("#design *")].filter((node) => getComputedStyle(node).position === "fixed" && node.getClientRects().length).length);
      await element.asElement().scrollIntoViewIfNeeded({ timeout: 2000 }).catch(() => {});
      // N2: rê vào thì không phần tử nào khác xô đi (chỉ đo ở khổ có chuột).
      if (width >= 1024) {
        const before = await clicker.evaluate(positionsAround, target.index);
        await element.asElement().hover({ timeout: 2000 }).catch(() => {});
        await clicker.waitForTimeout(250);
        const moved = shifted(before, await clicker.evaluate(positionsAround, target.index));
        if (moved.length) {
          const names = await Promise.all(moved.slice(0, 2).map((entry) => clicker.evaluate(describeAt, entry.index)));
          report(file, `${width}px rê "${target.label}"`, ruleTag("N2", `rê vào "${target.label}" làm ${moved.length} phần tử khác xô đi, vd ${names.join(", ")}`));
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
      if (clicker.url().split("?")[0] !== fileUrl.split("?")[0]) continue;
      for (const issue of issues) report(file, where, issue);
      reportLayout(file, where, await inspect(clicker));
      const rowAfter = await clicker.evaluate(rowRects, target.index);
      if (rowBefore && rowAfter && rowBefore.length === rowAfter.length && rowBefore.some((rect, index) => Math.abs(rect[0] - rowAfter[index][0]) > 0.5 || Math.abs(rect[1] - rowAfter[index][1]) > 0.5)) {
        report(file, where, ruleTag("N2", `bấm "${target.label}" làm các nút cùng hàng xô đi`));
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

await browser.close();

for (const issue of folderIssues(buttonsByPage, yielded)) report(onlyFile ?? basename(designDir), "", ruleTag(issue.rule, issue.message));

for (const { file, message, places } of errors.values()) {
  const unique = [...new Set(places)];
  const where = unique.length === 0 ? "" : unique.length <= 2 ? ` [${unique.join("; ")}]` : ` [${unique.length} chỗ, vd ${unique.slice(0, 2).join("; ")}]`;
  console.log(`✗ ${file}${where}: ${message}`);
}
console.log(`${errors.size ? "✗" : "✓"} ${checkedFiles.length} page · ${comboCount} tổ hợp · ${errors.size} lỗi${takeShots ? ` · ảnh ở ${shotsDir}` : ""}`);
process.exit(errors.size ? 1 : 0);
