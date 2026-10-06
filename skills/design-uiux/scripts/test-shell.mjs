#!/usr/bin/env node
// Kiểm shell (toolbar, panel) trên một .design/ mẫu tự dựng trong thư mục tạm, không dính tới page nào của người dùng.
// Chạy sau mỗi lần sửa shell/: vài giây, in ✓ / ✗ từng phép, lưu ảnh để xem bằng mắt.
//
//   node test-shell.mjs [--pw <thư mục có node_modules/playwright>] [--out <thư mục ảnh>]
//
// .design/ mẫu: 001-shell-test có 3 page A B C, 002-one-page có 1 page; cả hai dùng chung .design/_shell/.

import { execFileSync } from "node:child_process";
import { mkdirSync, mkdtempSync } from "node:fs";
import { createRequire } from "node:module";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
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
const multi = run("init", "shell-test", "--root", root);
for (const [slug, option, question, unit, tradeoff] of options) {
  run("page", multi, slug, "--title", option.slice(4), "--option", option, "--question", question, "--unit", unit, "--tradeoff", tradeoff);
}
const single = run("init", "one-page", "--root", root);
run("page", single, "settings", "--title", "Cài đặt");
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

// Thư mục một page: không có option-switcher, view-controller vẫn thẳng mép phải của trang.
{
  const page = await open(pageUrl(single, "01-settings.html"), 1280);
  const count = await page.$$eval("[data-ds-option]", (items) => items.length);
  const bar = await measureBar(page);
  expect("thư mục một page: không có nút chữ, thanh vẫn thẳng mép phải của trang", count === 0 && Math.abs(bar.pageRight - bar.barRight) <= 1, `${count} nút, trang ${bar.pageRight}, thanh ${bar.barRight}`);
  await page.screenshot({ path: join(out, "one-page-1280.png") });
  await page.close();
}

expect("không có lỗi JS", errors.length === 0, errors.join(" · "));
await browser.close();
console.log(results.join("\n"));
console.log(`\n.design/ mẫu: ${root}\nảnh: ${out}`);
process.exit(results.some((line) => line.startsWith("✗")) ? 1 : 0);
