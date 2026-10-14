#!/usr/bin/env node
// Kiểm shell (toolbar, panel) trên một .design-uiux/ mẫu tự dựng trong thư mục tạm, không dính tới page nào của người dùng.
// Chạy sau mỗi lần sửa shell/: vài giây, in ✓ / ✗ từng phép, lưu ảnh để xem bằng mắt.
//
//   node test-shell.mjs [--pw <thư mục có node_modules/playwright>] [--out <thư mục ảnh>]
//
// .design-uiux/ mẫu: 001-shell-test có 3 page A B C, 002-one-page có 1 page, 003-luong là thư mục luồng 3 màn, 004-tien-do
// có 1 page đang dựng dở; cả bốn dùng chung .design-uiux/_shell/. Page của 001, 002 lấy thân từ templates/example.html và
// đánh dấu xong mọi bước dựng, như page đã giao.
//
// spec: F2 F2.9 F6.3 F6.4 F6.5 F6.8 F6.10 F6.11 F7.1 F7.2 F7.3 F7.4 F7.6

import { execFileSync, spawn } from "node:child_process";
import { existsSync, mkdirSync, mkdtempSync, readFileSync, renameSync, writeFileSync } from "node:fs";
import { createRequire } from "node:module";
import { createServer } from "node:net";
import { tmpdir } from "node:os";
import { basename, dirname, join, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const args = process.argv.slice(2);
const flag = (name) => (args.includes(`--${name}`) ? args[args.indexOf(`--${name}`) + 1] : undefined);
const pwDir = flag("pw") ?? process.env.PW_DIR;

const work = mkdtempSync(join(tmpdir(), "design-uiux-shell-"));
const root = join(work, ".design-uiux");
const out = resolve(flag("out") ?? join(work, "shots"));
mkdirSync(out, { recursive: true });

// ---------- .design-uiux/ mẫu ----------

const run = (...params) => execFileSync(process.execPath, [join(here, "new-design.mjs"), ...params], { cwd: work, encoding: "utf8" }).trim();
const options = [
  ["forecast", "A · Thẻ dự báo tuần, lịch sử bên dưới", "Trên cùng là thẻ dự báo quota tới ngày reset. Dưới là bảng từng ngày.", "xem tuần này có đủ quota không"],
  ["timeline", "B · Timeline các session trong tuần", "Phần lớn trang là timeline 7 ngày, mỗi session một vạch.", "xem quota đã dùng vào lúc nào"],
  ["habit", "C · Lưới ngày × giờ", "Phần lớn trang là lưới 7 ngày × 24 giờ, ô đậm là giờ dùng nặng.", "xem ngày nào dùng nặng · so các tuần"],
];
const example = readFileSync(join(here, "../templates/example.html"), "utf8");
const progress = (dir, file, ...params) => run("progress", dir, file, ...params);
function builtPage(dir, ...params) {
  const file = run("page", dir, ...params);
  writeFileSync(file, example);
  progress(dir, basename(file), "--prepared");
  for (let step = 1; step <= 6; step += 1) progress(dir, basename(file), "--done", String(step));
  progress(dir, basename(file), "--delivered");
}
const multi = run("init", "shell-test", "--root", root);
for (const [slug, option, layout, goodFor] of options) {
  builtPage(multi, slug, "--title", option.slice(4), "--option", option, "--layout", layout, "--good-for", goodFor);
}
const single = run("init", "one-page", "--root", root);
builtPage(single, "settings", "--title", "Cài đặt");

// Thư mục luồng 3 màn: thân page thay bằng khối tối giản có nút "Tiếp tục", "Quay lại" và ô email ở màn 2. Mỗi màn khai
// `state` như page thật, để có data-panel và nút về mặc định của nó.
const flow = run("init", "luong", "--root", root);
const screens = [
  ["welcome", "1 · Welcome", "Biết app làm gì, bắt đầu", '<button data-next @click="$store.design.next()">Tiếp tục</button>'],
  ["dang-ky", "2 · Đăng ký", "Tạo tài khoản", '<input data-email x-model="$store.design.form.email"><button data-prev @click="$store.design.prev()">Quay lại</button><button data-next @click="$store.design.next()">Tiếp tục</button>'],
  ["ho-so", "3 · Hồ sơ", "Đặt tên, ngân sách", '<p data-echo x-text="$store.design.form.email"></p><button data-prev @click="$store.design.prev()">Quay lại</button>'],
];
for (const [slug, screen, purpose, body] of screens) {
  const file = run("page", flow, slug, "--title", `Onboarding · ${screen.slice(4)}`, "--screen", screen, "--purpose", purpose);
  const html = readFileSync(file, "utf8").replace("variables: [],", 'variables: [{ key: "state", label: "Trạng thái", type: "select", default: "data", options: ["data", "loading", "empty", "error"] }],').replace(/<main id="design"[\s\S]*<\/main>/, `<main id="design" class="min-h-screen bg-canvas text-body"><div class="mx-auto max-w-page p-6"><h1>${screen}</h1>${body}</div></main>`);
  writeFileSync(file, html);
  progress(flow, basename(file), "--prepared");
  for (let step = 1; step <= 6; step += 1) progress(flow, basename(file), "--done", String(step));
  progress(flow, basename(file), "--delivered");
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
      expect(`${width}px: đủ chỗ, data-panel và layout-panel luôn mở ở lề, không đè khối trang`, data.shown && config.shown && data.right <= bar.boxLeft && config.left >= bar.boxRight, JSON.stringify(panels));
    } else {
      for (const name of ["variables", "tweaks"]) {
        await page.click(`[data-ds-panel-toggle="${name}"]`);
        const rect = await page.$eval(`[data-ds-panel="${name}"]`, (element) => element.getBoundingClientRect().toJSON());
        expect(`${width}px: bấm nút mở ${name === "variables" ? "data-panel" : "layout-panel"} → thẻ hiện trong màn hình`, rect.width > 0 && rect.left >= 0 && rect.right <= width, `${Math.round(rect.left)}–${Math.round(rect.right)}`);
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
    expect(`${width}px: ${touch ? "chạm giữ" : "đưa chuột vào"} nút C → khung mô tả có tên, bố cục, "Tiện cho:" của C, trong màn hình, vẫn ở page A`, tipText.includes(options[2][1]) && tipText.includes(options[2][2]) && tipText.includes(`Tiện cho: ${options[2][3]}`) && tipBox.x >= 0 && tipBox.x + tipBox.width <= width && page.url().includes("01-forecast.html"), tipText);
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
// kéo lệch đi thì ô bộ dữ liệu để trống; chọn bộ mặc định (dòng đầu) thì dữ liệu về default.
{
  const page = await open(pageUrl(multi, "01-forecast.html"), 1600);
  const sliders = await page.$$eval("[data-ds-panel='variables'] input[type='range']", (items) => items.map((item) => item.closest("[data-ds-key]").dataset.dsKey));
  expect("data-panel: số có min và max là thanh kéo", sliders.length > 0, sliders.join(", "));
  const firstOption = await page.$eval("[data-ds-presets] option", (option) => ({ value: option.value, text: option.textContent, selected: option.selected }));
  expect("ô bộ dữ liệu: dòng đầu là bộ mặc định, nhãn có \"· mặc định\", được chọn sẵn lúc mở", firstOption.value === "0" && firstOption.text === `${await page.evaluate(() => window.DESIGN.presets[0].label)} · mặc định` && firstOption.selected, JSON.stringify(firstOption));
  await page.selectOption("[data-ds-presets]", "1");
  await page.waitForTimeout(100);
  const after = await page.evaluate(() => ({
    select: document.querySelector("[data-ds-presets]").value,
    store: JSON.parse(JSON.stringify(Alpine.store("design"))),
    sliders: Object.fromEntries([...document.querySelectorAll("[data-ds-panel='variables'] input[type='range']")].map((item) => [item.closest("[data-ds-key]").dataset.dsKey, item.value])),
    flashed: [...document.querySelectorAll("[data-ds-panel] [data-flash]")].map((item) => item.dataset.dsKey),
  }));
  const preset = await page.evaluate(() => window.DESIGN.presets[1].values);
  const applied = Object.entries(preset).every(([key, value]) => after.store[key] === value) && Object.entries(after.sliders).every(([key, value]) => !(key in preset) || String(preset[key]) === value);
  expect("chọn bộ dữ liệu 2 → ô bộ dữ liệu giữ bộ 2, các ô đổi theo, ô đổi nháy lên", after.select === "1" && applied && after.flashed.length > 0, `ô chọn ${after.select}, nháy ${after.flashed.join(", ")}`);
  const key = sliders[0];
  await page.$eval(`[data-ds-key="${key}"] input[type='range']`, (input) => { input.value = input.max; input.dispatchEvent(new Event("input", { bubbles: true })); });
  await page.waitForTimeout(100);
  expect("kéo lệch khỏi bộ dữ liệu → ô bộ dữ liệu để trống", (await page.$eval("[data-ds-presets]", (element) => element.value)) === "");
  await page.selectOption("[data-ds-presets]", "0");
  await page.waitForTimeout(100);
  const backToDefault = await page.evaluate(() => ({ select: document.querySelector("[data-ds-presets]").value, atDefault: window.DESIGN.variables.every((control) => control.default === undefined || Alpine.store("design")[control.key] === control.default) }));
  expect("chọn bộ mặc định → dữ liệu về default, ô giữ bộ đó", backToDefault.select === "0" && backToDefault.atDefault, JSON.stringify(backToDefault));
  // Nút về mặc định trên đầu mỗi panel chỉ trả ô của panel đó về default; panel đã ở mặc định thì nút tắt.
  const resetState = () => page.evaluate(() => {
    const values = Alpine.store("design");
    const atDefault = (group) => window.DESIGN[group].every((control) => values[control.key] === (control.default ?? (control.options ? (control.options[0].value ?? control.options[0]) : control.type === "toggle" ? false : control.type === "number" ? 0 : "")));
    return { variables: atDefault("variables"), tweaks: atDefault("tweaks"), offVariables: document.querySelector('[data-ds-reset="variables"]').disabled, offTweaks: document.querySelector('[data-ds-reset="tweaks"]').disabled };
  });
  await page.selectOption("[data-ds-presets]", "1");
  const tweak = await page.evaluate(() => {
    const control = window.DESIGN.tweaks.find((item) => item.options?.length > 1);
    const other = control.options.map((option) => option.value ?? option).find((value) => value !== (control.default ?? control.options[0].value ?? control.options[0]));
    Alpine.store("design")[control.key] = other;
    return `${control.key}=${other}`;
  });
  await page.waitForTimeout(100);
  const beforeReset = await resetState();
  await page.click('[data-ds-reset="variables"]');
  await page.waitForTimeout(100);
  const afterVariables = await resetState();
  expect(`nút về mặc định của data-panel: dữ liệu về mặc định, cấu hình giữ ${tweak}, nút data-panel tắt`, !beforeReset.variables && !beforeReset.offVariables && afterVariables.variables && !afterVariables.tweaks && afterVariables.offVariables && !afterVariables.offTweaks, JSON.stringify(afterVariables));
  await page.click('[data-ds-reset="tweaks"]');
  await page.waitForTimeout(100);
  const afterTweaks = await resetState();
  expect("nút về mặc định của layout-panel: cấu hình về mặc định, nút tắt", afterTweaks.tweaks && afterTweaks.offTweaks, JSON.stringify(afterTweaks));
  await page.screenshot({ path: join(out, "panel-reset.png") });
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
  await page.$eval('[data-ds-reset="variables"]', (button) => button.click());
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
  const [month, day] = new Date().toISOString().slice(5, 10).split("-").map(Number);
  const edited = `Sửa lần cuối ${day} thg ${month}`;
  const page = await open(pageUrl(building, file, "?theme=dark"), 1280);
  let loads = 0;
  page.on("load", () => (loads += 1));
  const ready = () => page.waitForFunction(() => window.Alpine && document.querySelector("[data-ds-status-wrap]:not([hidden])"));
  // Chữ nhãn: trạng thái và số bước; việc con trên nhãn đọc riêng.
  const label = () => page.$eval("[data-ds-status]", (element) => [...element.querySelectorAll(".ds-status-label, .ds-status-count")].map((part) => part.textContent).join(" ").replace(/\s+/g, " ").trim()).catch(() => "");
  const badge = () => page.$eval("[data-ds-status]", (element) => ({
    doing: element.querySelector("[data-ds-status-doing]")?.textContent.trim() ?? "",
    ripple: element.querySelector(".ds-status-dot") ? getComputedStyle(element.querySelector(".ds-status-dot"), "::after").animationName : "",
    done: element.querySelector(".ds-status-track")?.style.getPropertyValue("--ds-done") ?? "",
  })).catch(() => ({}));
  const quiet = async () => {
    const before = loads;
    await page.waitForTimeout(4500);
    return loads === before;
  };
  await ready();
  // Bước chuẩn bị: agent chính đang viết brief. Đánh dấu xong không tăng rev: nhãn đổi mà page không tải lại.
  const prepping = { label: await label(), ...(await badge()) };
  await page.click("[data-ds-status]");
  const prepRows = await page.$$eval("[data-ds-status-list] li", (items) => items.map((item) => `${item.dataset.step ?? "nhóm"}:${item.textContent.trim()}`).slice(0, 3).join(" | "));
  await page.keyboard.press("Escape");
  expect('tiến độ: page mới hiện "Đang chuẩn bị · Viết brief chung", chấm có vòng lan, thanh tiến độ 0%; danh sách mở đầu bằng nhóm Chuẩn bị, ● Viết brief chung', prepping.label === "Đang chuẩn bị" && prepping.doing === "· Viết brief chung" && prepping.ripple === "ds-ripple" && prepping.done === "0.0%" && prepRows.startsWith("nhóm:Chuẩn bị | current:●Viết brief chung | nhóm:Dựng"), `${JSON.stringify(prepping)} · ${prepRows}`);
  progress(building, file, "--prepared");
  await page.waitForFunction(() => document.querySelector("[data-ds-status]")?.textContent.includes("0/6"), null, { timeout: 4000 }).catch(() => null);
  const afterPrep = await badge();
  expect('tiến độ: --prepared → "Đang dựng 0/6 · Đọc brief và luật UX, UI", page không tải lại', (await label()) === "Đang dựng 0/6" && afterPrep.doing === "· Đọc brief và luật UX, UI" && loads === 0, `${await label()} · ${afterPrep.doing} · ${loads} lần tải`);
  progress(building, file, "--done", "1");
  progress(building, file, "--done", "2");
  await page.waitForFunction(() => document.querySelector("[data-ds-status]")?.textContent.includes("2/6"), null, { timeout: 8000 }).catch(() => null);
  await ready();
  loads = 0;
  expect('tiến độ: page đang dựng hiện nhãn "Đang dựng 2/6"', (await label()) === "Đang dựng 2/6", await label());
  await page.click("[data-ds-status]");
  const marks = await page.$$eval("[data-ds-status-list] li[data-step] span", (items) => items.map((item) => item.textContent).join(""));
  expect("tiến độ: bấm nhãn thấy danh sách ✓ (chuẩn bị) rồi ✓ ✓ ● ○ ○ ○, rồi ○ (giao)", marks === "✓✓✓●○○○○", marks);
  expect("tiến độ: thanh tiến độ ở đáy nhãn tô 2/6", (await badge()).done === "33.3%", (await badge()).done);
  // Nội dung không đổi thì shell không vẽ lại nhãn: chấm vẫn là phần tử cũ sau hai lượt đọc, vòng lan không giật về đầu.
  await page.$eval(".ds-status-dot", (dot) => (dot.dataset.mark = "cu"));
  await page.waitForTimeout(4500);
  expect("tiến độ: nội dung không đổi thì nhãn không vẽ lại", (await page.$eval(".ds-status-dot", (dot) => dot.dataset.mark ?? "").catch(() => "")) === "cu");
  // Việc con: ghi không tăng rev, nên page không tải lại, danh sách đang mở vẽ lại dòng thụt dưới bước ●.
  const doingRow = () => page.$eval("[data-ds-status-list]", (list) => {
    const row = list.querySelector('li[data-step="doing"]');
    return row ? { text: row.textContent.trim(), after: row.previousElementSibling?.dataset.step } : null;
  });
  const loadsBeforeDoing = loads;
  progress(building, file, "--doing", "Chuẩn bị dữ liệu");
  await page.waitForFunction(() => document.querySelector('[data-ds-status-list] li[data-step="doing"]'), null, { timeout: 4000 }).catch(() => null);
  const firstDoing = await doingRow();
  progress(building, file, "--doing", "Viết bảng đơn hàng");
  await page.waitForFunction(() => document.querySelector('[data-ds-status-list] li[data-step="doing"]')?.textContent.includes("Viết bảng"), null, { timeout: 4000 }).catch(() => null);
  const secondDoing = await doingRow();
  const onBadge = await badge();
  expect("tiến độ: việc con hiện cả trên nhãn, trượt lên khi đổi", onBadge.doing === "· Viết bảng đơn hàng" && (await page.$eval("[data-ds-status-doing]", (el) => el.hasAttribute("data-fresh")).catch(() => false)), JSON.stringify(onBadge));
  expect("tiến độ: --doing hiện dòng việc con ngay dưới bước ●, đổi việc con thì dòng đổi, page không tải lại", firstDoing?.text === "Chuẩn bị dữ liệu" && firstDoing.after === "current" && secondDoing?.text === "Viết bảng đơn hàng" && loads === loadsBeforeDoing, JSON.stringify({ firstDoing, secondDoing, loads: loads - loadsBeforeDoing }));
  await page.screenshot({ path: join(out, "progress-doing.png"), clip: { x: 0, y: 0, width: 640, height: 320 } });
  await page.keyboard.press("Escape");
  await page.evaluate(() => window.scrollTo(0, 900));
  await page.waitForTimeout(100);
  const started = Date.now();
  progress(building, file, "--done", "3");
  await page.waitForEvent("load", { timeout: 6000 }).catch(() => null);
  await ready();
  await page.waitForTimeout(400);
  const after = { seconds: (Date.now() - started) / 1000, theme: new URL(page.url()).searchParams.get("theme"), scroll: await page.evaluate(() => window.scrollY), label: await label() };
  await page.click("[data-ds-status]");
  const doingAfterDone = await page.$$eval('[data-ds-status-list] li[data-step="doing"]', (rows) => rows.length);
  await page.keyboard.press("Escape");
  expect("tiến độ: --done xoá dòng việc con của bước vừa xong", doingAfterDone === 0, `${doingAfterDone} dòng`);
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
  // Nhãn và việc con là hai span sát nhau: chuẩn hoá khoảng trắng quanh "·" để so chữ.
  const statusText = () => narrow.$eval("[data-ds-status]", (element) => element.textContent.replace(/\s+/g, " ").replace(/\s*·\s*/g, " · ").trim());
  const checking = await statusText();
  const checkingRipple = await narrow.$eval(".ds-status-dot", (dot) => getComputedStyle(dot, "::after").animationName).catch(() => "");
  expect('tiến độ: rời ô trong iframe thì tải lại; hết bước dựng mà chưa giao → "Đang kiểm lại · Kiểm lại và giao", chấm có vòng lan', narrowLoads === 1 && checking === "Đang kiểm lại · Kiểm lại và giao" && checkingRipple === "ds-ripple", `${narrowLoads} lần tải · ${checking} · ${checkingRipple}`);
  progress(building, file, "--delivered");
  await narrow.waitForFunction(() => document.querySelector("[data-ds-status]")?.dataset.state === "done", null, { timeout: 4000 }).catch(() => null);
  const done = await statusText();
  await narrow.click("[data-ds-status]");
  const doneRows = await narrow.$$eval("[data-ds-status-list] li", (items) => items.map((item) => item.textContent.trim()));
  await narrow.keyboard.press("Escape");
  expect(`tiến độ: --delivered → "Activity log", không có số, page không tải lại; danh sách có nhóm Giao, dòng cuối "${edited}"`, done === "Activity log" && narrowLoads === 1 && doneRows.slice(-3).join(" | ") === `Giao | ✓Kiểm lại và giao | ${edited}`, `${done} · ${narrowLoads} lần tải · ${doneRows.slice(-3).join(" | ")}`);

  // Mục góp ý: comment #3 mở mục, mỗi --doing một việc; danh sách có nhóm Comment, việc thụt dưới mục, không chữ vòng.
  const listText = () => narrow.$$eval("[data-ds-status-list] li", (items) => items.map((item) => item.textContent.trim()).join(" | "));
  const labelText = () => narrow.$eval("[data-ds-status]", (element) => element.textContent.replace(/\s+/g, " ").replace(/\s*·\s*/g, " · ").trim());
  progress(building, file, "--comment", "3", "tab lọc đậm hơn");
  progress(building, file, "--doing", "Chữ tab đậm 600");
  progress(building, file, "--doing", "Giữ bề rộng tab");
  await narrow.waitForEvent("load", { timeout: 6000 }).catch(() => null);
  await narrow.waitForFunction(() => window.Alpine && document.querySelector('[data-ds-status][data-state="revising"]'), null, { timeout: 6000 }).catch(() => null);
  await narrow.click("[data-ds-status]");
  const revising = await labelText();
  const groups = await narrow.$$eval("[data-ds-status-list] .ds-status-round", (items) => items.map((item) => item.textContent).join(" | "));
  const list = await listText();
  expect('góp ý: comment #3 → nhãn "Đang sửa #3 · Giữ bề rộng tab"; nhóm Chuẩn bị, Dựng, Comment, Giao; việc thụt dưới mục, không dòng Kiểm đầy đủ, không chữ vòng; bước giao mở lại', revising === "Đang sửa #3 · Giữ bề rộng tab" && groups === "Chuẩn bị | Dựng | Comment | Giao" && list.includes("●#3 tab lọc đậm hơn | ✓Chữ tab đậm 600 | ●Giữ bề rộng tab | Giao") && !list.includes("Kiểm đầy đủ |") && !/vòng/i.test(list) && list.includes("○Kiểm lại và giao"), `${revising} · ${groups} · ${list.split(" | ").slice(-6).join(" | ")}`);
  // Page có thể vừa tự tải lại sau cú bấm mở danh sách: thử lại, mỗi lần mở danh sách nếu nó đã đóng.
  let indent = 0;
  for (let attempt = 0; attempt < 3 && indent <= 10; attempt += 1) {
    if (!(await narrow.$eval("[data-ds-status-list]", (list) => list.getClientRects().length > 0).catch(() => false))) await narrow.click("[data-ds-status]").catch(() => null);
    await narrow.waitForSelector("[data-ds-status-list] li.ds-status-action", { state: "visible", timeout: 3000 }).catch(() => null);
    indent = await narrow.$$eval("[data-ds-status-list] li", (items) => {
      const item = items.find((li) => li.classList.contains("ds-status-item"));
      const action = items.find((li) => li.classList.contains("ds-status-action"));
      return Math.round(action.querySelector("span").getBoundingClientRect().left - item.querySelector("span").getBoundingClientRect().left);
    }).catch(() => 0);
  }
  expect("góp ý: việc của mục thụt vào so với dòng mục", indent > 10, `${indent}px`);
  await narrow.keyboard.press("Escape");
  progress(building, file, "--checked");
  progress(building, file, "--chat", "đổi tiêu đề thành Hôm nay");
  await narrow.waitForEvent("load", { timeout: 6000 }).catch(() => null);
  await narrow.waitForFunction(() => window.Alpine && document.querySelector("[data-ds-status]")?.textContent.includes("góp ý"), null, { timeout: 6000 }).catch(() => null);
  await narrow.click("[data-ds-status]");
  const chatLabel = await labelText();
  const chatGroups = await narrow.$$eval("[data-ds-status-list] .ds-status-round", (items) => items.map((item) => item.textContent).join(" | "));
  expect('góp ý: ý trong chat → nhãn "Đang sửa góp ý · Kiểm đầy đủ"; nhóm Góp ý trong chat riêng, #3 xong', chatLabel === "Đang sửa góp ý · Kiểm đầy đủ" && chatGroups === "Chuẩn bị | Dựng | Comment | Góp ý trong chat | Giao" && (await listText()).includes("✓#3 tab lọc đậm hơn"), `${chatLabel} · ${chatGroups}`);
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
  expect('tiến độ: page không có danh sách → "Activity log", đọc một lần rồi thôi', oldLabel === "Activity log" && reads.length === 1, `${oldLabel} · ${reads.length} lần đọc`);
  await old.close();
  renameSync(`${progressFile}.bak`, progressFile);

  // File kiểu cũ xếp góp ý theo vòng: shell đọc thành mục trong nhóm Comment và Góp ý trong chat.
  const legacy = basename(run("page", building, "vong-cu", "--title", "Vòng cũ", "--option", "B · Vòng cũ"));
  writeFileSync(join(building, legacy), readFileSync(join(building, file), "utf8"));
  const legacyBuild = [
    ...["Khung", "Tải", "Riêng", "Tương tác", "Preset"].map((task) => ({ task, done: true, round: 1 })),
    { task: "Kiểm đầy đủ và tự kiểm", done: true, round: 1, final: true },
    { task: "Góp ý: Comment #1: bỏ dòng Bây giờ", done: true, round: 2 },
    { task: "Comment #2: phân trang", done: true, round: 2 },
    { task: "Kiểm đầy đủ", done: true, round: 2, final: true },
    { task: "Góp ý: nút to hơn", done: true, round: 3 },
    { task: "Kiểm đầy đủ", done: true, round: 3, final: true },
  ];
  writeFileSync(join(building, legacy.replace(/\.html$/, ".progress.js")), `(window.DESIGN_PROGRESS ||= {})[${JSON.stringify(legacy)}] = ${JSON.stringify({ rev: 9, prep: { task: "Viết brief chung", done: true }, deliver: { task: "Kiểm lại và giao", done: true }, build: legacyBuild })};\n`);
  const legacyPage = await open(pageUrl(building, legacy), 1280);
  await legacyPage.click("[data-ds-status]");
  const legacyList = await legacyPage.$$eval("[data-ds-status-list] li", (items) => items.map((item) => item.textContent.trim()).join(" | "));
  expect("file kiểu cũ: nhóm Comment có #1, #2; nhóm Góp ý trong chat có \"nút to hơn\"; không chữ vòng", legacyList.includes("Comment | ✓#1 bỏ dòng Bây giờ | ✓#2 phân trang | Góp ý trong chat | ✓nút to hơn | Giao") && !/vòng/i.test(legacyList), legacyList);
  await legacyPage.screenshot({ path: join(out, "progress-legacy.png") });
  await legacyPage.close();
}

// Chế độ comment: bật, chọn khối; chưa có cầu nối thì ô ghi chưa có session nào và cho chép prompt; bật cầu nối thì gửi
// được, ghim hiện; bấm nút của page không kích hoạt nút; kéo chọn vùng; khổ mobile chạy trong iframe; session đóng thì ô
// chỉ cách mở lại; cầu nối không có hộp thư thì vẫn gửi được. Cầu nối test bật không mang biến của session đang chạy test
// (không gửi vào hộp thư thật, không canh session thật) và bị tắt khi test thoát, kể cả khi test hỏng.
{
  const bridgeEnv = Object.fromEntries(Object.entries(process.env).filter(([key]) => !key.startsWith("CLAUDE") && key !== "CLAUDECODE"));
  const bridgePids = new Set();
  const sleeper = spawn("sleep", ["600"], { stdio: "ignore" });
  process.on("exit", () => {
    for (const pid of bridgePids) try { process.kill(pid, "SIGTERM"); } catch {}
    try { sleeper.kill("SIGKILL"); } catch {}
  });
  const inboxPath = join(work, "inbox.sock");
  const inboxLines = [];
  const inbox = createServer((sock) => sock.on("data", (chunk) => inboxLines.push(...chunk.toString().trim().split("\n"))));
  await new Promise((done) => inbox.listen(inboxPath, done));
  const startBridge = (env) => {
    execFileSync(process.execPath, [join(here, "new-design.mjs"), "comment-bridge", multi], { cwd: work, env: { ...bridgeEnv, ...env }, encoding: "utf8" });
    const info = JSON.parse(readFileSync(join(multi, "_comment-bridge.js"), "utf8").match(/DS_COMMENT_BRIDGE = (\{.*\});/)[1]);
    bridgePids.add(info.pid);
    return info;
  };
  const comments = () => (existsSync(join(multi, "comments.json")) ? JSON.parse(readFileSync(join(multi, "comments.json"), "utf8")) : []);
  const page = await open(pageUrl(multi, "01-forecast.html"), 1280);
  await page.click("[data-ds-comment-toggle]");
  const heading = await (await page.$("#design h1")).boundingBox();
  await page.mouse.click(heading.x + 10, heading.y + 8);
  await page.waitForSelector(".ds-comment-popover");
  await page.waitForTimeout(600);
  const popoverState = () => page.$eval(".ds-comment-popover", (box) => {
    const shown = (act) => !box.querySelector(`[data-act="${act}"]`).hidden;
    return { bridge: box.querySelector("[data-ds-comment-state]").dataset.bridge, message: box.querySelector("[data-ds-comment-state]").textContent, send: shown("send"), copy: shown("copy"), prompt: shown("prompt"), where: box.querySelector(".ds-comment-where").textContent };
  });
  const idle = await popoverState();
  expect("comment S2: chưa có cầu nối thì ô ghi chưa có session nào, chỉ thư mục dự án; chỉ có Huỷ và Chép prompt", idle.bridge === "none" && idle.message.includes("Chưa có session Claude nào") && idle.message.includes(work) && !idle.send && !idle.copy && idle.prompt, `${idle.where} · ${idle.message}`);
  await page.evaluate(() => (navigator.clipboard.writeText = (value) => ((window.copied = value), Promise.resolve())));
  await page.fill(".ds-comment-popover textarea", "tiêu đề ngắn lại");
  await page.click('.ds-comment-popover [data-act="prompt"]');
  const prompt = await page.evaluate(() => window.copied ?? "");
  const promptJson = JSON.parse(prompt.match(/^comment-json: (.*)$/m)?.[1] ?? "null");
  expect("comment S2: Chép prompt mở đầu bằng /design-uiux, có thư mục design, page, chỗ chọn, comment và comment-json đủ để --add", prompt.startsWith("/design-uiux Sửa page theo comment chép từ page") && prompt.includes(`Thư mục design: ${multi}`) && prompt.includes("Page: 01-forecast.html") && prompt.includes("`#design") && promptJson?.body === "tiêu đề ngắn lại" && promptJson.target.selector.startsWith("#design"), prompt.split("\n").slice(0, 3).join(" | "));
  await page.keyboard.press("Escape");

  const bridge = startBridge({ CLAUDE_PID: String(sleeper.pid), CLAUDE_CODE_SESSION_ID: "5e55a0d1-test", CLAUDE_CODE_ENTRYPOINT: "claude-vscode", CLAUDE_CODE_MESSAGING_SOCKET: inboxPath, CLAUDE_CODE_MESSAGING_TOKEN: "hop-thu" });
  const button = await page.$("#design button");
  const before = await page.$eval("#design", (main) => main.innerHTML);
  await button.click();
  await page.waitForSelector(".ds-comment-popover");
  await page.waitForTimeout(600);
  const same = before === (await page.$eval("#design", (main) => main.innerHTML));
  await page.fill(".ds-comment-popover textarea", "nút này to hơn");
  const live = await popoverState();
  await page.click('.ds-comment-popover [data-act="copy"]');
  const copied = await page.evaluate(() => window.copied ?? "");
  expect("comment: cầu nối đang chạy thì ô ghi đang nhận comment, có Chép và Gửi; Chép đưa page, query, selector, góp ý", live.bridge === "inbox" && live.send && live.copy && !live.prompt && copied.startsWith("Comment trên 01-forecast.html") && copied.includes("`#design") && copied.endsWith(": nút này to hơn"), `${live.message} · ${copied}`);
  await page.click('.ds-comment-popover [data-act="send"]');
  await page.waitForSelector(".ds-comment-pin");
  await page.waitForTimeout(700);
  const sent = comments()[0];
  expect("comment: bấm nút của page không kích hoạt nút; gửi được, comments.json có page, selector, chữ; hộp thư nhận comment #1", same && sent?.page === "01-forecast.html" && sent.target.selector.startsWith("#design") && inboxLines.some((line) => line.includes("comment #1")), `${sent?.target.selector} · ${sent?.target.text?.slice(0, 30)}`);
  expect("comment: ghim #1 hiện, trạng thái đã gửi", await page.$eval(".ds-comment-pin", (pin) => pin.textContent === "1" && pin.dataset.status === "sent"));
  run("comment", multi, "--status", "1", "doing");
  await page.waitForFunction(() => document.querySelector(".ds-comment-pin")?.dataset.status === "doing", null, { timeout: 4000 }).catch(() => null);
  expect("comment: --status doing thì ghim đổi sang đang sửa trong 2 giây", (await page.$eval(".ds-comment-pin", (pin) => pin.dataset.status)) === "doing");

  const main = await (await page.$("#design")).boundingBox();
  await page.mouse.move(main.x + 40, main.y + 120);
  await page.mouse.down();
  await page.mouse.move(main.x + 240, main.y + 220, { steps: 4 });
  await page.mouse.up();
  await page.waitForSelector(".ds-comment-popover");
  await page.fill(".ds-comment-popover textarea", "vùng này thưa ra");
  await page.keyboard.press("Meta+Enter");
  await page.waitForFunction(() => document.querySelectorAll(".ds-comment-pin").length === 2, null, { timeout: 3000 }).catch(() => null);
  expect("comment: kéo chọn vùng, Cmd+Enter gửi, target.kind area", comments()[1]?.target.kind === "area", comments()[1]?.target.selector);
  await page.screenshot({ path: join(out, "comment-desktop.png") });
  // Cuộn trong lúc ô viết đang mở: khung chọn và ô viết trôi theo khối đã chọn.
  const row = await page.$("#design h1");
  await row.click();
  await page.waitForSelector(".ds-comment-popover");
  const gap = () => page.evaluate(() => {
    const target = document.querySelector("#design h1").getBoundingClientRect();
    const box = document.querySelector(".ds-comment-drag").getBoundingClientRect();
    const popover = document.querySelector(".ds-comment-popover").getBoundingClientRect();
    return { box: Math.round(box.top - target.top), popover: Math.round(popover.top - target.bottom) };
  });
  const beforeScroll = await gap();
  await page.mouse.wheel(0, 300);
  await page.waitForTimeout(300);
  const afterScroll = await gap();
  const scrolled = await page.evaluate(() => scrollY);
  expect("comment: cuộn khi ô viết đang mở thì khung chọn và ô viết trôi theo khối", scrolled > 0 && beforeScroll.box === afterScroll.box && beforeScroll.popover === afterScroll.popover, `cuộn ${scrolled}px · trước ${JSON.stringify(beforeScroll)} · sau ${JSON.stringify(afterScroll)}`);
  await page.keyboard.press("Escape");
  await page.keyboard.press("Escape");
  expect("comment: Esc thoát chế độ comment", !(await page.evaluate(() => document.documentElement.hasAttribute("data-commenting"))));
  await page.close();

  // Phím C bật tắt; đang gõ trong ô nhập của page thì C là chữ c.
  const keys = await open(pageUrl(multi, "01-forecast.html"), 1280);
  const commenting = () => keys.evaluate(() => document.documentElement.hasAttribute("data-commenting"));
  await keys.keyboard.press("c");
  const onByKey = await commenting();
  await keys.keyboard.press("c");
  const offByKey = !(await commenting());
  const input = await keys.$("#design input[type=search], #design input:not([type]), #design input[type=text]");
  let typed = true;
  if (input) {
    await input.click();
    await keys.keyboard.press("c");
    typed = !(await commenting()) && (await input.inputValue()).endsWith("c");
  }
  expect("comment: phím C bật rồi tắt chế độ comment; đang gõ trong ô nhập thì C là chữ c", onByKey && offByKey && typed, `bật ${onByKey} · tắt ${offByKey} · ô nhập ${input ? typed : "page không có"}`);
  await keys.close();

  const narrow = await open(pageUrl(multi, "01-forecast.html", "?viewport=mobile&theme=dark"), 1280);
  const frame = await narrow.waitForSelector(".ds-frame-wrap iframe").then((element) => element.contentFrame());
  await frame.waitForFunction(() => window.Alpine && document.querySelector("#design h1"));
  await frame.click("#design h1");
  await frame.press("#design h1", "c").catch(() => narrow.keyboard.press("c"));
  await narrow.waitForTimeout(300);
  expect("comment: nhấn C trong khung mobile thì trang cha bật chế độ comment", await narrow.$eval("[data-ds-comment-toggle]", (button) => button.getAttribute("aria-pressed") === "true"));
  await frame.click("#design h1");
  await frame.waitForSelector(".ds-comment-popover");
  const inside = await frame.$eval(".ds-comment-popover", (box) => {
    const rect = box.getBoundingClientRect();
    return rect.left >= 0 && rect.right <= document.documentElement.clientWidth;
  });
  await frame.fill(".ds-comment-popover textarea", "tiêu đề xuống dòng");
  await narrow.waitForTimeout(600);
  await frame.click('.ds-comment-popover [data-act="send"]');
  await narrow.waitForTimeout(500);
  const mobile = comments()[2];
  expect("comment: khổ mobile chạy trong khung, ô viết nằm trong khung, comment ghi viewport mobile, theme dark", inside && mobile?.viewport === "mobile" && mobile?.theme === "dark" && /viewport=mobile/.test(mobile?.url), mobile?.url);
  await narrow.screenshot({ path: join(out, "comment-mobile.png") });
  await narrow.close();
  const phone = await open(pageUrl(multi, "01-forecast.html"), 375, true);
  expect("comment: màn 375px không có nút comment", !(await phone.$eval("[data-ds-comment-toggle]", (button) => button.getClientRects().length)));
  await phone.close();

  // S1: session đóng thì cầu nối tắt, ô comment ghi session cũ, cách mở lại, chỉ còn Chép prompt.
  sleeper.kill("SIGKILL");
  const bridgeEnded = () => Boolean(JSON.parse(readFileSync(join(multi, "_comment-bridge.js"), "utf8").match(/DS_COMMENT_BRIDGE = (\{.*\});/)[1]).endedAt);
  for (let i = 0; i < 30 && !bridgeEnded(); i += 1) await new Promise((done) => setTimeout(done, 100));
  const closed = await open(pageUrl(multi, "01-forecast.html"), 1280);
  await closed.click("[data-ds-comment-toggle]");
  await closed.click("#design h1");
  await closed.waitForSelector(".ds-comment-popover");
  await closed.waitForFunction(() => document.querySelector("[data-ds-comment-state]")?.dataset.bridge === "closed", null, { timeout: 4000 }).catch(() => null);
  const ended = await closed.$eval(".ds-comment-popover", (box) => ({ bridge: box.querySelector("[data-ds-comment-state]").dataset.bridge, message: box.querySelector("[data-ds-comment-state]").textContent, send: !box.querySelector('[data-act="send"]').hidden, prompt: !box.querySelector('[data-act="prompt"]').hidden }));
  expect("comment S1: session đóng thì ô ghi đã đóng, VS Code, mã session, lệnh claude --resume, thư mục dự án; chỉ có Chép prompt", ended.bridge === "closed" && /đã đóng lúc \d\d:\d\d/.test(ended.message) && ended.message.includes("VS Code · mã 5e55a0d1") && ended.message.includes("claude --resume 5e55a0d1-test") && ended.message.includes(work) && !ended.send && ended.prompt, ended.message);
  await closed.screenshot({ path: join(out, "comment-closed.png") });
  await closed.close();

  // S3: cầu nối không có hộp thư: ô ghi comment được lưu, vẫn gửi được.
  const quiet = startBridge({});
  const saved = await open(pageUrl(multi, "01-forecast.html"), 1280);
  await saved.click("[data-ds-comment-toggle]");
  await saved.click("#design h1");
  await saved.waitForSelector(".ds-comment-popover");
  await saved.waitForFunction(() => document.querySelector("[data-ds-comment-state]")?.dataset.bridge === "saved", null, { timeout: 4000 }).catch(() => null);
  await saved.fill(".ds-comment-popover textarea", "lưu mà không đánh thức");
  const savedState = await saved.$eval("[data-ds-comment-state]", (state) => ({ bridge: state.dataset.bridge, message: state.textContent }));
  await saved.click('.ds-comment-popover [data-act="send"]');
  await saved.waitForTimeout(500);
  expect("comment S3: cầu nối không có hộp thư thì ô ghi comment được lưu, gõ xem comment; gửi vẫn ghi comments.json", savedState.bridge === "saved" && savedState.message.includes('"xem comment"') && comments().at(-1)?.body === "lưu mà không đánh thức", savedState.message);
  await saved.close();
  process.kill(quiet.pid, "SIGTERM");
  inbox.close();
}

// Ẩn shell: nút cuối view-controller cất toolbar, panel, ghim; page không xê dịch; nút nhỏ ở góc hay phím \ hiện lại;
// tải lại vẫn ẩn, tab mới thì có shell; ẩn thì tắt chế độ comment; khổ mobile giữ khung; page đang dựng thì nút có chấm.
{
  const shown = (page, selector) => page.evaluate((selector) => [...document.querySelectorAll(selector)].some((element) => element.getClientRects().length > 0), selector);
  const hidden = (page) => page.evaluate(() => document.documentElement.hasAttribute("data-shell-hidden"));
  const place = (page) => page.evaluate(() => {
    const main = document.querySelector("#design").getBoundingClientRect();
    const bar = document.querySelector("[data-ds-toolbar]").getBoundingClientRect();
    return { left: Math.round(main.left), width: Math.round(main.width), barLeft: Math.round(bar.left), barRight: Math.round(bar.right) };
  });
  const wide = await open(pageUrl(multi, "01-forecast.html", "?theme=dark"), 1600);
  const url = wide.url();
  const before = await place(wide);
  const pinsBefore = await shown(wide, ".ds-comment-pin");
  await wide.click("[data-ds-shell-hide]");
  await wide.waitForTimeout(150);
  const after = await place(wide);
  const corner = await wide.$eval("[data-ds-shell-show]", (button) => {
    const rect = button.getBoundingClientRect();
    return rect.width > 0 && rect.left >= 0 && rect.right <= document.documentElement.clientWidth && rect.top >= 0;
  });
  const gone = !(await shown(wide, ".ds-bar")) && !(await shown(wide, ".ds-panel")) && !(await shown(wide, ".ds-comment-pin"));
  expect("ẩn shell (1600): toolbar, panel, ghim biến mất; #design không xê dịch; URL không đổi; nút hiện lại ở góc", gone && pinsBefore && corner && before.left === after.left && before.width === after.width && wide.url() === url, `ghim trước ${pinsBefore} · #design ${before.left}/${before.width} → ${after.left}/${after.width}`);
  await wide.screenshot({ path: join(out, "shell-hidden-1600.png") });
  await wide.keyboard.press("\\");
  const backByKey = !(await hidden(wide)) && (await shown(wide, ".ds-bar"));
  await wide.keyboard.press("\\");
  const hiddenByKey = await hidden(wide);
  await wide.reload();
  await wide.waitForFunction(() => window.Alpine && document.querySelector("[data-ds-bar]"));
  await wide.waitForTimeout(250);
  const keptOnReload = (await hidden(wide)) && !(await shown(wide, ".ds-bar"));
  await wide.click("[data-ds-shell-show]");
  await wide.waitForTimeout(250);
  const back = await place(wide);
  expect("ẩn shell: \\ hiện lại, \\ ẩn; tải lại vẫn ẩn; bấm nút góc hiện lại, toolbar đúng chỗ cũ", backByKey && hiddenByKey && keptOnReload && (await shown(wide, ".ds-bar")) && back.barLeft === before.barLeft && back.barRight === before.barRight, `\\ hiện ${backByKey} · \\ ẩn ${hiddenByKey} · tải lại ${keptOnReload} · toolbar ${before.barLeft}–${before.barRight} → ${back.barLeft}–${back.barRight}`);
  await wide.click("[data-ds-shell-hide]");
  const fresh = await open(url, 1600);
  expect("ẩn shell: mở cùng link ở tab mới thì có toolbar", (await shown(fresh, ".ds-bar")) && !(await hidden(fresh)));
  await fresh.close();
  await wide.close();

  const commenting = await open(pageUrl(multi, "01-forecast.html"), 1280);
  await commenting.click("[data-ds-comment-toggle]");
  const wasOn = await commenting.evaluate(() => document.documentElement.hasAttribute("data-commenting"));
  await commenting.click("[data-ds-shell-hide]");
  await commenting.waitForTimeout(100);
  expect("ẩn shell khi đang bật comment thì tắt chế độ comment", wasOn && !(await commenting.evaluate(() => document.documentElement.hasAttribute("data-commenting"))));
  await commenting.keyboard.press("\\");
  await commenting.close();

  const framed = await open(pageUrl(multi, "01-forecast.html", "?viewport=mobile"), 1280);
  const frame = await framed.waitForSelector(".ds-frame-wrap iframe").then((element) => element.contentFrame());
  await frame.waitForFunction(() => window.Alpine && document.querySelector("#design h1"));
  await framed.click("[data-ds-shell-hide]");
  await framed.waitForTimeout(150);
  const frameBox = await framed.$eval(".ds-frame-wrap iframe", (element) => Math.round(element.getBoundingClientRect().width));
  const frameHidden = await frame.evaluate(() => document.documentElement.hasAttribute("data-shell-hidden"));
  await framed.screenshot({ path: join(out, "shell-hidden-mobile.png") });
  await frame.click("#design h1");
  await framed.keyboard.press("\\");
  await framed.waitForTimeout(200);
  expect("ẩn shell khổ mobile: khung máy giữ nguyên rộng 375, ghim trong khung ẩn theo; nhấn \\ trong khung thì shell hiện lại", frameBox >= 375 && frameBox <= 377 && frameHidden && (await shown(framed, ".ds-bar")), `khung ${frameBox}px · trong khung ẩn ${frameHidden}`);
  await framed.close();

  const phone = await open(pageUrl(multi, "01-forecast.html"), 375, true);
  const fits = await phone.$eval("[data-ds-shell-hide]", (button) => {
    const rect = button.getBoundingClientRect();
    return rect.width > 0 && rect.right <= 375;
  });
  expect("375px: nút ẩn shell có và nằm trong màn hình", fits);
  await phone.close();

  const typing = await open(pageUrl(flow, "02-dang-ky.html"), 1280);
  await typing.click("[data-email]");
  await typing.keyboard.press("\\");
  expect("con trỏ ở ô nhập thì \\ là chữ, shell không ẩn", (await typing.inputValue("[data-email]")).endsWith("\\") && !(await hidden(typing)));
  await typing.close();

  const walk = await open(pageUrl(flow, "01-welcome.html"), 1280);
  await walk.click("[data-ds-shell-hide]");
  await walk.click("[data-next]");
  await walk.waitForURL(/02-dang-ky\.html/);
  await walk.waitForFunction(() => window.Alpine && document.querySelector("[data-ds-bar]"));
  expect("ẩn shell rồi bấm \"Tiếp tục\" trong page: sang màn 2, shell vẫn ẩn", (await hidden(walk)) && !(await shown(walk, ".ds-bar")));
  await walk.keyboard.press("\\");
  await walk.close();

  const building = run("init", "an-shell-dang-dung", "--root", root);
  const file = basename(run("page", building, "dang-dung", "--title", "Đang dựng"));
  progress(building, file, "--prepared");
  const busy = await open(pageUrl(building, file), 1280);
  await busy.waitForFunction(() => document.querySelector("[data-ds-shell-show]")?.dataset.state);
  await busy.click("[data-ds-shell-hide]");
  await busy.waitForTimeout(150);
  const dot = await busy.$eval("[data-ds-shell-show]", (button) => ({ state: button.dataset.state, dot: button.querySelector(".ds-shell-show-dot").getClientRects().length > 0 }));
  expect("ẩn shell khi page đang dựng: nút góc có chấm tiến độ", dot.state === "building" && dot.dot, JSON.stringify(dot));
  await busy.screenshot({ path: join(out, "shell-hidden-building.png") });
  await busy.close();
}

expect("không có lỗi JS", errors.length === 0, errors.join(" · "));
await browser.close();
console.log(results.join("\n"));
console.log(`\n.design-uiux/ mẫu: ${root}\nảnh: ${out}`);
process.exit(results.some((line) => line.startsWith("✗")) ? 1 : 0);
