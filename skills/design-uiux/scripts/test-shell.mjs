#!/usr/bin/env node
// Kiểm shell (toolbar, panel) trên một .design/ mẫu tự dựng trong thư mục tạm, không dính tới page nào của người dùng.
// Chạy sau mỗi lần sửa shell/: vài giây, in ✓ / ✗ từng phép, lưu ảnh để xem bằng mắt.
//
//   node test-shell.mjs [--pw <thư mục có node_modules/playwright>] [--out <thư mục ảnh>]
//
// .design/ mẫu: 001-shell-test có 3 page A B C, 002-one-page có 1 page, 003-luong là thư mục luồng 3 màn, 004-tien-do
// có 1 page đang dựng dở; cả bốn dùng chung .design/_shell/. Page của 001, 002 lấy thân từ templates/example.html và
// đánh dấu xong mọi bước dựng, như page đã giao.
//
// spec: F2 F6.3 F6.4 F6.5

import { execFileSync } from "node:child_process";
import { mkdirSync, mkdtempSync, readFileSync, renameSync, writeFileSync } from "node:fs";
import { createRequire } from "node:module";
import { tmpdir } from "node:os";
import { basename, dirname, join, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const args = process.argv.slice(2);
const flag = (name) => (args.includes(`--${name}`) ? args[args.indexOf(`--${name}`) + 1] : undefined);
const pwDir = flag("pw") ?? process.env.PW_DIR;

const work = mkdtempSync(join(tmpdir(), "design-uiux-shell-"));
const root = join(work, ".design");
const out = resolve(flag("out") ?? join(work, "shots"));
mkdirSync(out, { recursive: true });

// ---------- .design/ mẫu ----------

const run = (...params) => execFileSync(process.execPath, [join(here, "new-design.mjs"), ...params], { cwd: work, encoding: "utf8" }).trim();
const options = [
  ["forecast", "A · Dự báo tuần", "Tuần này có đủ quota tới reset không?", "tuần", "lịch sử từng ngày"],
  ["timeline", "B · Timeline tuần", "Quota đã dùng vào những lúc nào?", "session", "dự báo"],
  ["habit", "C · Lưới thói quen", "Ngày nào trong tuần dùng nặng?", "ngày", "giờ và từng session"],
];
const example = readFileSync(join(here, "../templates/example.html"), "utf8");
const progress = (dir, file, ...params) => run("progress", dir, file, ...params);
function builtPage(dir, ...params) {
  const file = run("page", dir, ...params);
  writeFileSync(file, example);
  for (let step = 1; step <= 6; step += 1) progress(dir, basename(file), "--done", String(step));
}
const multi = run("init", "shell-test", "--root", root);
for (const [slug, option, question, unit, tradeoff] of options) {
  builtPage(multi, slug, "--title", option.slice(4), "--option", option, "--question", question, "--unit", unit, "--tradeoff", tradeoff);
}
const single = run("init", "one-page", "--root", root);
builtPage(single, "settings", "--title", "Cài đặt");

// Thư mục luồng 3 màn: thân page thay bằng khối tối giản có nút "Tiếp tục", "Quay lại" và ô email ở màn 2.
const flow = run("init", "luong", "--root", root);
const screens = [
  ["welcome", "1 · Welcome", "Biết app làm gì, bắt đầu", '<button data-next @click="$store.design.next()">Tiếp tục</button>'],
  ["dang-ky", "2 · Đăng ký", "Tạo tài khoản", '<input data-email x-model="$store.design.form.email"><button data-prev @click="$store.design.prev()">Quay lại</button><button data-next @click="$store.design.next()">Tiếp tục</button>'],
  ["ho-so", "3 · Hồ sơ", "Đặt tên, ngân sách", '<p data-echo x-text="$store.design.form.email"></p><button data-prev @click="$store.design.prev()">Quay lại</button>'],
];
for (const [slug, screen, purpose, body] of screens) {
  const file = run("page", flow, slug, "--title", `Onboarding · ${screen.slice(4)}`, "--screen", screen, "--purpose", purpose);
  const html = readFileSync(file, "utf8").replace(/<main id="design"[\s\S]*<\/main>/, `<main id="design" class="min-h-screen bg-canvas text-body"><div class="mx-auto max-w-page p-6"><h1>${screen}</h1>${body}</div></main>`);
  writeFileSync(file, html);
  for (let step = 1; step <= 6; step += 1) progress(flow, basename(file), "--done", String(step));
}
const refused = (...params) => {
  try {
    run(...params);
    return false;
  } catch {
    return true;
  }
};
const pageUrl = (dir, file, query = "") => pathToFileURL(join(dir, file)).href + query;

// ---------- trình duyệt ----------

function loadPlaywright() {
  for (const dir of [pwDir, process.cwd(), here].filter(Boolean)) {
    try {
      return createRequire(join(resolve(dir), "package.json"))("playwright");
    } catch {}
  }
  const tempDir = join(tmpdir(), "design-uiux-pw");
  console.error(`Chưa có Playwright. Cài vào thư mục tạm, đừng cài vào dự án:\n  npm i --prefix "${tempDir}" playwright && node ${process.argv[1]} --pw "${tempDir}"`);
  process.exit(2);
}
const { chromium } = loadPlaywright();
const browser = await chromium.launch({ channel: "chrome" }).catch(() => chromium.launch());

const results = [];
const expect = (name, ok, detail) => results.push(`${ok ? "✓" : "✗"} ${name}${detail ? ` — ${detail}` : ""}`);
const errors = [];
async function open(url, width, touch = false) {
  const page = await browser.newPage({ viewport: { width, height: 760 }, hasTouch: touch });
  page.on("pageerror", (error) => errors.push(`${width}px: ${error.message}`));
  await page.goto(url);
  await page.waitForFunction(() => window.Alpine && document.querySelector("[data-ds-bar]"));
  await page.waitForTimeout(250);
  return page;
}

// Mép chữ của trang (khối ngoài cùng của #design trừ padding) và mép thanh trên cùng (nút mở panel và khối toolbar).
const measureBar = (page) =>
  page.evaluate(() => {
    const outer = document.querySelector("#design").firstElementChild;
    const box = outer.getBoundingClientRect();
    const style = getComputedStyle(outer);
    // Nút mở panel đứng ở lề (position absolute) thì không tính vào mép thanh: thanh là toolbar, nút nằm ngoài trang.
    const shown = [...document.querySelectorAll("[data-ds-bar] > :not(.ds-panel)")].filter((element) => element.getClientRects().length && getComputedStyle(element).position !== "absolute");
    const marginToggles = [...document.querySelectorAll("[data-ds-bar] > .ds-panel-toggle")].filter((element) => element.getClientRects().length && getComputedStyle(element).position === "absolute").map((element) => element.getBoundingClientRect());
    const rects = shown.map((element) => element.getBoundingClientRect());
    const middle = (selector) => {
      const element = document.querySelector(selector);
      if (!element?.getClientRects().length) return null;
      const rect = element.getBoundingClientRect();
      return Math.round(rect.top + rect.height / 2);
    };
    return {
      pageLeft: Math.round(box.left + parseFloat(style.paddingLeft)),
      pageRight: Math.round(box.right - parseFloat(style.paddingRight)),
      boxLeft: Math.round(box.left),
      boxRight: Math.round(box.right),
      barLeft: Math.round(Math.min(...rects.map((rect) => rect.left))),
      barRight: Math.round(Math.max(...rects.map((rect) => rect.right))),
      // Số dòng: tâm dọc lệch nhau quá 4px mới tính là dòng khác (khối toolbar cao hơn nút một chút).
      rows: rects.map((rect) => rect.top + rect.height / 2).sort((a, b) => a - b).filter((center, index, all) => index === 0 || center - all[index - 1] > 4).length,
      options: middle(".ds-options"),
      ...(() => {
        const options = document.querySelector(".ds-options")?.getBoundingClientRect();
        const view = document.querySelector(".ds-bar-view").getBoundingClientRect();
        return { optionsLeft: Math.round(options?.left), optionsRight: Math.round(options?.right), optionsCenter: Math.round(options ? options.left + options.width / 2 : 0), viewLeft: Math.round(view.left) };
      })(),
      view: middle(".ds-bar-view"),
      toggle: middle("[data-ds-panel-toggle]"),
      stacked: document.querySelector("[data-ds-bar]").hasAttribute("data-stack"),
      togglesOutside: marginToggles.every((rect) => rect.right <= box.left || rect.left >= box.right) && marginToggles.every((rect) => rect.left >= 0 && rect.right <= document.documentElement.clientWidth),
      marginToggles: marginToggles.length,
      docked: document.documentElement.dataset.panels === "docked",
    };
  });

// Nền thanh và nền page: shell cùng phía sáng tối với page (không đảo màu) nhưng khác màu nhìn ra được.
const backgrounds = (page) =>
  page.evaluate(() => {
    const rgb = (element) => getComputedStyle(element).backgroundColor.match(/\d+(\.\d+)?/g).slice(0, 3).map(Number);
    return { bar: rgb(document.querySelector("[data-ds-bar]")), page: rgb(document.querySelector("#design")) };
  });
const lightness = ([r, g, b]) => Math.round((0.2126 * r + 0.7152 * g + 0.0722 * b) / 2.55);
const distance = (a, b) => Math.round(Math.hypot(...a.map((value, index) => value - b[index])));

for (const width of [1600, 1280, 700, 375]) {
  const touch = width === 375;
  for (const theme of ["light", "dark"]) {
    const page = await open(pageUrl(multi, "01-forecast.html", `?theme=${theme}`), width, touch);
    await page.screenshot({ path: join(out, `${width}-${theme}.png`) });
    const colors = await backgrounds(page);
    const [barLight, pageLight] = [lightness(colors.bar), lightness(colors.page)];
    const sameSide = theme === "light" ? barLight > 70 && pageLight > 70 : barLight < 30 && pageLight < 30;
    expect(`${width}px ${theme}: shell cùng sáng tối với page mà khác màu`, sameSide && distance(colors.bar, colors.page) >= 12, `độ sáng thanh ${barLight}, page ${pageLight}, khác nhau ${distance(colors.bar, colors.page)}`);
    if (theme === "dark") {
      await page.close();
      continue;
    }

    const buttons = await page.$$eval("[data-ds-option]", (items) => items.map((item) => item.textContent.trim() + (item.getAttribute("aria-current") ? "*" : "")).join(" "));
    expect(`${width}px: option-switcher có A B C, A (page đang mở) được tô`, buttons === "A* B C", buttons);

    const bar = await measureBar(page);
    expect(`${width}px: thanh trên cùng thẳng mép chữ của trang`, Math.abs(bar.pageLeft - bar.barLeft) <= 1 && Math.abs(bar.pageRight - bar.barRight) <= 1, `trang ${bar.pageLeft}–${bar.pageRight}, thanh ${bar.barLeft}–${bar.barRight}`);
    const centered = Math.abs(bar.optionsCenter - (bar.pageLeft + bar.pageRight) / 2) <= 2;
    if (width >= 1280) expect(`${width}px: đủ chỗ, option-switcher nằm giữa trang`, centered, `giữa nút ${bar.optionsCenter}, giữa trang ${(bar.pageLeft + bar.pageRight) / 2}`);
    else expect(`${width}px: option-switcher nằm trong toolbar, không chồng view-controller`, bar.optionsRight + 12 <= bar.viewLeft && bar.optionsLeft >= bar.barLeft, `A B C ${bar.optionsLeft}–${bar.optionsRight}, view-controller từ ${bar.viewLeft}`);
    expect(`${width}px: option-switcher và view-controller cùng một dòng`, bar.options !== null && Math.abs(bar.options - bar.view) <= 2, `${bar.options} / ${bar.view}`);
    if (bar.marginToggles) expect(`${width}px: nút mở panel đứng ở lề ngoài trang, trong màn hình`, bar.togglesOutside, `${bar.marginToggles} nút ở lề`);
    if (width === 375) expect("375px: không vừa một dòng thì nút mở panel ở dòng trên, toolbar nguyên khối ở dòng dưới", bar.stacked && bar.toggle < bar.options, `xếp ${bar.stacked ? "hai dòng" : "một dòng"}, nút panel ${bar.toggle}, toolbar ${bar.options}`);
    else expect(`${width}px: cả thanh một dòng`, bar.rows === 1 && !bar.stacked, `${bar.rows} dòng`);

    // panel: đủ chỗ thì luôn mở ở lề, ngoài khối trang; không đủ thì bấm nút mở, thẻ nằm trong màn hình.
    if (bar.docked) {
      const panels = await page.$$eval("[data-ds-panel]", (items) => items.map((item) => item.getBoundingClientRect()).map((rect) => ({ left: Math.round(rect.left), right: Math.round(rect.right), shown: rect.width > 0 })));
      const [data, config] = panels;
      expect(`${width}px: đủ chỗ, data-panel và config-panel luôn mở ở lề, không đè khối trang`, data.shown && config.shown && data.right <= bar.boxLeft && config.left >= bar.boxRight, JSON.stringify(panels));
    } else {
      for (const name of ["variables", "tweaks"]) {
        await page.click(`[data-ds-panel-toggle="${name}"]`);
        const rect = await page.$eval(`[data-ds-panel="${name}"]`, (element) => element.getBoundingClientRect().toJSON());
        expect(`${width}px: bấm nút mở ${name === "variables" ? "data-panel" : "config-panel"} → thẻ hiện trong màn hình`, rect.width > 0 && rect.left >= 0 && rect.right <= width, `${Math.round(rect.left)}–${Math.round(rect.right)}`);
        await page.keyboard.press("Escape");
      }
    }

    // Khung mô tả của nút C: đưa chuột (desktop) hay chạm giữ (375), nằm trong màn hình, không chuyển page.
    const tip = page.locator(".ds-option-wrap").nth(2).locator(".ds-option-tip");
    if (!touch) await page.hover("[data-ds-option] >> nth=2");
    else {
      const box = await page.locator("[data-ds-option]").nth(2).boundingBox();
      const cdp = await page.context().newCDPSession(page);
      const point = [{ x: box.x + box.width / 2, y: box.y + box.height / 2 }];
      await cdp.send("Input.dispatchTouchEvent", { type: "touchStart", touchPoints: point });
      await page.waitForTimeout(600);
      await cdp.send("Input.dispatchTouchEvent", { type: "touchEnd", touchPoints: [] });
      await page.waitForTimeout(150);
    }
    const tipBox = (await tip.isVisible()) ? await tip.boundingBox() : null;
    const tipText = tipBox ? (await tip.innerText()).replace(/\n/g, " | ") : "";
    expect(`${width}px: ${touch ? "chạm giữ" : "đưa chuột vào"} nút C → khung mô tả có câu hỏi của C, trong màn hình, vẫn ở page A`, tipText.includes(options[2][2]) && tipBox.x >= 0 && tipBox.x + tipBox.width <= width && page.url().includes("01-forecast.html"), tipText);
    await page.screenshot({ path: join(out, `${width}-tip.png`) });
    await page.close();
  }
}

// Đổi khổ desktop → tablet → mobile: toolbar đứng yên, khoảng cách option-switcher và view-controller không đổi.
{
  const page = await open(pageUrl(multi, "01-forecast.html"), 1280);
  const spots = [];
  for (const viewport of ["desktop", "tablet", "mobile"]) {
    await page.evaluate((value) => (Alpine.store("design").viewport = value), viewport);
    await page.waitForTimeout(250);
    spots.push(await page.evaluate(() => [".ds-options", ".ds-bar-view"].map((selector) => Math.round(document.querySelector(selector).getBoundingClientRect().left)).join("/")));
  }
  expect("đổi khổ desktop / tablet / mobile → toolbar không xê dịch", new Set(spots).size === 1, spots.join(" · "));
  await page.close();
}

// Bấm C: sang page C, giữ sáng tối đang xem, C được tô.
{
  const page = await open(pageUrl(multi, "01-forecast.html", "?theme=dark"), 1280);
  await page.click("[data-ds-option] >> nth=2");
  await page.waitForURL(/03-habit\.html/);
  await page.waitForFunction(() => window.Alpine && document.querySelector("[data-ds-bar]"));
  const url = new URL(page.url());
  const current = await page.$eval("[data-ds-option][aria-current]", (element) => element.textContent.trim());
  expect("bấm C → mở page C, giữ theme=dark, C được tô", url.searchParams.get("theme") === "dark" && current === "C", `${url.pathname.split("/").pop()}${url.search} · tô ${current}`);
  await page.close();
}

// data-panel: số có khoảng là thanh kéo; chọn bộ dữ liệu thì ô bộ dữ liệu giữ tên bộ đó, các ô đổi theo và nháy lên;
// kéo lệch đi thì ô bộ dữ liệu về "Bộ dữ liệu…".
{
  const page = await open(pageUrl(multi, "01-forecast.html"), 1600);
  const sliders = await page.$$eval("[data-ds-panel='variables'] input[type='range']", (items) => items.map((item) => item.closest("[data-ds-key]").dataset.dsKey));
  expect("data-panel: số có min và max là thanh kéo", sliders.length > 0, sliders.join(", "));
  await page.selectOption("[data-ds-presets]", "0");
  await page.waitForTimeout(100);
  const after = await page.evaluate(() => ({
    select: document.querySelector("[data-ds-presets]").value,
    store: JSON.parse(JSON.stringify(Alpine.store("design"))),
    sliders: Object.fromEntries([...document.querySelectorAll("[data-ds-panel='variables'] input[type='range']")].map((item) => [item.closest("[data-ds-key]").dataset.dsKey, item.value])),
    flashed: [...document.querySelectorAll("[data-ds-panel] [data-flash]")].map((item) => item.dataset.dsKey),
  }));
  const preset = await page.evaluate(() => window.DESIGN.presets[0].values);
  const applied = Object.entries(preset).every(([key, value]) => after.store[key] === value) && Object.entries(after.sliders).every(([key, value]) => !(key in preset) || String(preset[key]) === value);
  expect("chọn bộ dữ liệu 1 → ô bộ dữ liệu giữ bộ 1, các ô đổi theo, ô đổi nháy lên", after.select === "0" && applied && after.flashed.length > 0, `ô chọn ${after.select}, nháy ${after.flashed.join(", ")}`);
  const key = sliders[0];
  await page.$eval(`[data-ds-key="${key}"] input[type='range']`, (input) => { input.value = input.max; input.dispatchEvent(new Event("input", { bubbles: true })); });
  await page.waitForTimeout(100);
  expect("kéo lệch khỏi bộ dữ liệu → ô bộ dữ liệu về \"Bộ dữ liệu…\"", (await page.$eval("[data-ds-presets]", (element) => element.value)) === "-1");
  // Select ít lựa chọn chữ ngắn là dãy nút; nhiều lựa chọn (state) vẫn là ô chọn.
  const kinds = await page.evaluate(() => Object.fromEntries(window.DESIGN.variables.concat(window.DESIGN.tweaks).filter((control) => control.type === "select").map((control) => [control.key, document.querySelector(`[data-ds-panel] [data-ds-key="${control.key}"] .ds-choice`) ? "nút" : "ô chọn"])));
  const choiceKey = Object.keys(kinds).find((key) => kinds[key] === "nút");
  expect("select ít lựa chọn là dãy nút, state vẫn là ô chọn", choiceKey && kinds.state === "ô chọn", JSON.stringify(kinds));
  if (choiceKey) {
    await page.click(`[data-ds-key="${choiceKey}"] .ds-choice button >> nth=-1`);
    const picked = await page.evaluate((key) => ({ store: String(Alpine.store("design")[key]), pressed: document.querySelector(`[data-ds-key="${key}"] [aria-pressed="true"]`)?.textContent, last: [...document.querySelectorAll(`[data-ds-key="${key}"] .ds-choice button`)].pop().textContent }), choiceKey);
    expect(`bấm nút cuối của "${choiceKey}" → giá trị đổi, nút đó được tô`, picked.pressed === picked.last, `${choiceKey}=${picked.store}, tô ${picked.pressed}`);
  }
  // Icon ⓘ: chỉ ô có help mới có; đưa chuột vào thì khung giải thích hiện, nằm trong màn hình.
  const helpKeys = await page.evaluate(() => window.DESIGN.variables.concat(window.DESIGN.tweaks).map((control) => [control.key, Boolean(control.help), Boolean(document.querySelector(`[data-ds-panel] [data-ds-key="${control.key}"] .ds-help`))]));
  expect("icon ⓘ chỉ ở ô có help", helpKeys.every(([, has, icon]) => has === icon) && helpKeys.some(([, has]) => has) && helpKeys.some(([, has]) => !has), helpKeys.map(([key, , icon]) => `${key}${icon ? " ⓘ" : ""}`).join(", "));
  const withHelp = helpKeys.find(([, has]) => has)[0];
  await page.hover(`[data-ds-key="${withHelp}"] .ds-help`);
  const tip = await page.evaluate(() => { const element = document.querySelector(".ds-help-tip[data-open]"); return element && { text: element.textContent, ...element.getBoundingClientRect().toJSON() }; });
  const expected = await page.evaluate((key) => window.DESIGN.variables.concat(window.DESIGN.tweaks).find((control) => control.key === key).help, withHelp);
  expect(`đưa chuột vào ⓘ của "${withHelp}" → khung giải thích hiện đúng chữ, trong màn hình`, tip && tip.text === expected && tip.left >= 0 && tip.right <= 1600 && tip.bottom <= 760, tip ? `${Math.round(tip.left)}–${Math.round(tip.right)}` : "không hiện");
  await page.screenshot({ path: join(out, "help-tip.png"), clip: { x: 0, y: 52, width: 360, height: 420 } });
  await page.mouse.move(800, 600);
  await page.screenshot({ path: join(out, "data-panel.png"), clip: { x: 0, y: 52, width: 270, height: 420 } });
  await page.close();
}

// Thư mục luồng: dãy màn thay nút A B; next() · prev() sang màn kề giữ query; chữ đã gõ còn khi quay lại; khung mobile
// bấm "Tiếp tục" thì cả trang cha sang màn sau; nút về mặc định xoá chữ đã gõ.
{
  expect("new-design: thêm --screen vào thư mục phương án, hay --option vào thư mục luồng → từ chối",
    refused("page", multi, "x", "--title", "x", "--screen", "1 · X") && refused("page", flow, "y", "--title", "y", "--option", "D · Y") && refused("page", flow, "z", "--title", "z", "--screen", "Z"));
  const page = await open(pageUrl(flow, "01-welcome.html", "?theme=dark"), 1280);
  const menu = await page.$$eval("[data-ds-screen]", (items) => items.map((item) => item.getAttribute("aria-label")).join(" → "));
  const current = await page.$eval("[data-ds-screen][aria-current]", (element) => element.getAttribute("aria-label"));
  const letters = await page.$$eval("[data-ds-option]", (items) => items.length);
  expect("thư mục luồng: dãy màn \"1 · Welcome → 2 · Đăng ký → 3 · Hồ sơ\", màn 1 được tô, không có nút A B", menu.startsWith("1 · Welcome → 2 · Đăng ký → 3 · Hồ sơ") && current === "1 · Welcome" && letters === 0, `${menu} · tô ${current} · ${letters} nút chữ`);
  await page.screenshot({ path: join(out, "flow-1280.png") });
  await page.click("[data-next]");
  await page.waitForURL(/02-dang-ky\.html/);
  await page.waitForFunction(() => window.Alpine && document.querySelector("[data-ds-bar]"));
  expect("bấm \"Tiếp tục\" ở màn 1 → sang màn 2, giữ theme=dark", new URL(page.url()).searchParams.get("theme") === "dark", page.url().split("/").pop());
  await page.fill("[data-email]", "an@vidu.vn");
  await page.click("[data-next]");
  await page.waitForURL(/03-ho-so\.html/);
  await page.waitForFunction(() => window.Alpine && document.querySelector("[data-echo]"));
  await page.waitForTimeout(100);
  const echo = await page.$eval("[data-echo]", (element) => element.textContent);
  await page.click("[data-prev]");
  await page.waitForURL(/02-dang-ky\.html/);
  await page.waitForFunction(() => window.Alpine && document.querySelector("[data-email]"));
  await page.waitForTimeout(100);
  const kept = await page.inputValue("[data-email]");
  expect("gõ email ở màn 2, sang màn 3 thấy email, quay lại màn 2 ô vẫn còn chữ", echo === "an@vidu.vn" && kept === "an@vidu.vn", `màn 3 "${echo}", màn 2 "${kept}"`);
  const linkHasEmail = page.url().includes("vidu");
  expect("chữ đã gõ không lên URL", !linkHasEmail, page.url().split("/").pop());
  await page.click(".ds-bar-view .ds-icon-button >> nth=-1");
  await page.waitForTimeout(100);
  const cleared = await page.evaluate(() => ({ value: document.querySelector("[data-email]").value, stored: Object.values(sessionStorage).some((item) => item.includes("vidu")) }));
  expect("nút về mặc định xoá chữ đã gõ ở mọi màn", cleared.value === "" && !cleared.stored, JSON.stringify(cleared));
  await page.close();

  const narrow = await open(pageUrl(flow, "02-dang-ky.html", "?viewport=mobile"), 375, true);
  const names = await narrow.$$eval(".ds-screen-name", (items) => items.filter((item) => item.getClientRects().length).length);
  const fits = await narrow.$eval("[data-ds-pages]", (element) => element.getBoundingClientRect().right <= 375);
  expect("375px: dãy màn chỉ còn số, nằm trong màn hình", names === 0 && fits, `${names} tên còn hiện`);
  await narrow.screenshot({ path: join(out, "flow-375.png") });
  const frame = await narrow.waitForSelector(".ds-frame-wrap iframe").then((element) => element.contentFrame());
  await frame.waitForFunction(() => window.Alpine && document.querySelector("[data-next]"));
  await frame.click("[data-next]");
  await narrow.waitForURL(/03-ho-so\.html/);
  expect("khung mobile: bấm \"Tiếp tục\" trong page → trang cha sang màn 3, giữ viewport=mobile", new URL(narrow.url()).searchParams.get("viewport") === "mobile", narrow.url().split("/").pop());
  await narrow.close();
}

// Thư mục một page: không có option-switcher, view-controller vẫn thẳng mép phải của trang.
{
  const page = await open(pageUrl(single, "01-settings.html"), 1280);
  const count = await page.$$eval("[data-ds-option]", (items) => items.length);
  const bar = await measureBar(page);
  expect("thư mục một page: không có nút chữ, thanh vẫn thẳng mép phải của trang", count === 0 && Math.abs(bar.pageRight - bar.barRight) <= 1, `${count} nút, trang ${bar.pageRight}, thanh ${bar.barRight}`);
  await page.screenshot({ path: join(out, "one-page-1280.png") });
  await page.close();
}

// Tiến độ dựng: một page đang dựng dở (thân dài để cuộn, có một ô gõ). Đổi danh sách bước dựng trên đĩa bằng lệnh
// progress như agent làm, rồi xem page đang mở tự tải lại hay đợi.
{
  const building = run("init", "tien-do", "--root", root);
  const file = basename(run("page", building, "dang-nhap", "--title", "Đăng nhập"));
  const body = '<main id="design" class="min-h-screen bg-canvas text-body"><div class="mx-auto max-w-page p-6"><input data-q placeholder="Tìm"><div style="height:3000px"></div></div></main>';
  writeFileSync(join(building, file), readFileSync(join(building, file), "utf8").replace(/<main id="design"[\s\S]*<\/main>/, body));
  const today = new Date().toISOString().slice(5, 10).split("-").reverse().join("/");
  progress(building, file, "--done", "1");
  progress(building, file, "--done", "2");
  const page = await open(pageUrl(building, file, "?theme=dark"), 1280);
  let loads = 0;
  page.on("load", () => (loads += 1));
  const ready = () => page.waitForFunction(() => window.Alpine && document.querySelector("[data-ds-status-wrap]:not([hidden])"));
  const label = () => page.$eval("[data-ds-status]", (element) => element.textContent.replace(/\s+/g, " ").trim()).catch(() => "");
  const quiet = async () => {
    const before = loads;
    await page.waitForTimeout(4500);
    return loads === before;
  };
  await ready();
  expect('tiến độ: page đang dựng hiện nhãn "Đang dựng 2/6"', (await label()) === "Đang dựng 2/6", await label());
  await page.click("[data-ds-status]");
  const marks = await page.$$eval("[data-ds-status-list] li[data-step] span", (items) => items.map((item) => item.textContent).join(""));
  expect("tiến độ: bấm nhãn thấy danh sách ✓ ✓ ● ○ ○ ○", marks === "✓✓●○○○", marks);
  await page.keyboard.press("Escape");
  await page.evaluate(() => window.scrollTo(0, 900));
  await page.waitForTimeout(100);
  const started = Date.now();
  progress(building, file, "--done", "3");
  await page.waitForEvent("load", { timeout: 6000 }).catch(() => null);
  await ready();
  await page.waitForTimeout(400);
  const after = { seconds: (Date.now() - started) / 1000, theme: new URL(page.url()).searchParams.get("theme"), scroll: await page.evaluate(() => window.scrollY), label: await label() };
  expect("tiến độ: bước mới xong → page tự tải lại trong ≤ 4s, giữ giá trị trên URL và vị trí cuộn", loads === 1 && after.seconds <= 4 && after.theme === "dark" && Math.abs(after.scroll - 900) <= 1 && after.label === "Đang dựng 3/6", JSON.stringify(after));

  await page.focus("[data-q]");
  progress(building, file, "--done", "4");
  expect("tiến độ: đang gõ trong ô nhập thì không tải lại", await quiet());
  await page.evaluate(() => document.activeElement.blur());
  await page.waitForEvent("load", { timeout: 3000 }).catch(() => null);
  await ready();
  expect("tiến độ: rời ô nhập thì tải lại", (await label()) === "Đang dựng 4/6", await label());

  const progressFile = join(building, file.replace(/\.html$/, ".progress.js"));
  const full = readFileSync(progressFile, "utf8");
  writeFileSync(progressFile, full.slice(0, Math.floor(full.length / 2)));
  const errorsBefore = errors.length;
  const unchanged = await quiet();
  // File ghi dở chạy ra lỗi cú pháp; Playwright vẫn bắt dù shell đã chặn nó khỏi console. Lỗi này là chính phép thử.
  errors.splice(errorsBefore, errors.length - errorsBefore, ...errors.slice(errorsBefore).filter((message) => !/Unexpected end of input|Invalid or unexpected token/.test(message)));
  expect("tiến độ: đọc trúng file ghi dở thì bỏ lượt đó, nhãn giữ nguyên", unchanged && (await label()) === "Đang dựng 4/6", await label());
  writeFileSync(progressFile, full);
  progress(building, file, "--done", "5");
  await page.waitForEvent("load", { timeout: 6000 }).catch(() => null);
  await ready();
  expect("tiến độ: file đủ lại và có bước mới thì đọc tiếp, tải lại", (await label()) === "Đang dựng 5/6", await label());
  await page.close();

  const narrow = await open(pageUrl(building, file, "?viewport=mobile"), 1280);
  let narrowLoads = 0;
  narrow.on("load", () => (narrowLoads += 1));
  const frame = await narrow.waitForSelector(".ds-frame-wrap iframe").then((element) => element.contentFrame());
  await frame.waitForFunction(() => window.Alpine && document.querySelector("[data-q]"));
  await frame.click("[data-q]");
  await narrow.waitForTimeout(300);
  progress(building, file, "--done", "6");
  await narrow.waitForTimeout(4500);
  expect("tiến độ: khổ mobile, đang gõ trong iframe thì không tải lại", narrowLoads === 0, `${narrowLoads} lần tải`);
  await narrow.click("[data-ds-status]");
  await narrow.waitForEvent("load", { timeout: 3000 }).catch(() => null);
  await narrow.waitForFunction(() => window.Alpine && document.querySelector("[data-ds-status-wrap]:not([hidden])"));
  const done = await narrow.$eval("[data-ds-status]", (element) => element.textContent.replace(/\s+/g, " ").trim());
  expect(`tiến độ: rời ô trong iframe thì tải lại; xong hết → "Xong · ${today}"`, narrowLoads === 1 && done === `Xong · ${today}`, `${narrowLoads} lần tải · ${done}`);

  progress(building, file, "--round", "nút to hơn", "đổi chữ nút");
  await narrow.waitForEvent("load", { timeout: 6000 }).catch(() => null);
  await narrow.waitForFunction(() => window.Alpine && document.querySelector("[data-ds-status-wrap]:not([hidden])"));
  await narrow.click("[data-ds-status]");
  const revising = await narrow.$eval("[data-ds-status]", (element) => element.textContent.replace(/\s+/g, " ").trim());
  const rounds = await narrow.$$eval("[data-ds-status-list] .ds-status-round", (items) => items.map((item) => item.textContent).join(" | "));
  expect('tiến độ: vòng góp ý → "Đang sửa 0/3", danh sách có nhóm "Góp ý vòng 2"', revising === "Đang sửa 0/3" && rounds === "Dựng | Góp ý vòng 2", `${revising} · ${rounds}`);
  await narrow.screenshot({ path: join(out, "progress-revising.png") });
  await narrow.close();

  renameSync(progressFile, `${progressFile}.bak`);
  const old = await browser.newPage({ viewport: { width: 1280, height: 760 } });
  const reads = [];
  old.on("request", (request) => request.url().includes(".progress.js") && reads.push(request.url()));
  await old.goto(pageUrl(building, file));
  await old.waitForFunction(() => window.Alpine && document.querySelector("[data-ds-status-wrap]:not([hidden])"));
  await old.waitForTimeout(4500);
  const oldLabel = await old.$eval("[data-ds-status]", (element) => element.textContent.replace(/\s+/g, " ").trim());
  expect(`tiến độ: page không có danh sách → "Xong · ${today}", đọc một lần rồi thôi`, oldLabel === `Xong · ${today}` && reads.length === 1, `${oldLabel} · ${reads.length} lần đọc`);
  await old.close();
  renameSync(`${progressFile}.bak`, progressFile);
}

expect("không có lỗi JS", errors.length === 0, errors.join(" · "));
await browser.close();
console.log(results.join("\n"));
console.log(`\n.design/ mẫu: ${root}\nảnh: ${out}`);
process.exit(results.some((line) => line.startsWith("✗")) ? 1 : 0);
