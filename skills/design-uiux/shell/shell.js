// Khung chung của mọi page design: toolbar (option-switcher, view-controller), panel (data-panel vặn variables,
// config-panel vặn tweaks), đọc ghi URL, khung mobile / tablet. Tên các khối: SKILL.md, mục "Các khối điều khiển".
// Page khai window.DESIGN rồi nạp file này; tokens.js và pages.js nạp trước, Alpine nạp sau bằng defer. toolbar và
// panel ghi giá trị vào Alpine.store("design"); page đọc $store.design.<key>.
//
// spec: F2 F4.2
(() => {
  const design = window.DESIGN ?? {};
  const theme = window.DESIGN_THEME ?? { base: "light", derived: null, fonts: [] };
  const pages = window.DESIGN_PAGES ?? [];
  const params = new URLSearchParams(location.search);
  const isFrame = params.get("frame") === "1";
  const lang = design.lang === "en" ? "en" : "vi";
  const text = {
    vi: { variables: "Dữ liệu", tweaks: "Cấu hình", presets: "Bộ dữ liệu…", reset: "Về mặc định", light: "Sáng", dark: "Tối",
      derived: "suy ra", desktop: "Desktop", tablet: "Tablet", mobile: "Mobile", blocks: "Số khối",
      options: "Phương án", unit: "Đơn vị chính", tradeoff: "hy sinh", updated: "sửa",
      presetsHelp: "Một bộ giá trị dựng sẵn cho ca hay gặp hay ca biên. Chọn là đổi cả bộ; ô nào đổi sẽ nháy lên." },
    en: { variables: "Data", tweaks: "Config", presets: "Presets…", reset: "Reset", light: "Light", dark: "Dark",
      derived: "derived", desktop: "Desktop", tablet: "Tablet", mobile: "Mobile", blocks: "Section numbers",
      options: "Options", unit: "Main unit", tradeoff: "trade-off", updated: "edited",
      presetsHelp: "A ready-made set of values for a common or edge case. Picking one changes them all; changed fields flash." },
  }[lang];

  const controls = [
    ...(design.variables ?? []).map((control) => ({ ...control, group: "variables" })),
    ...(design.tweaks ?? []).map((control) => ({ ...control, group: "tweaks" })),
  ];
  const fixedControls = [
    { key: "viewport", type: "select", options: ["desktop", "tablet", "mobile"], default: "desktop" },
    { key: "theme", type: "select", options: ["light", "dark"], default: theme.base },
    { key: "sections", type: "toggle", default: false },
  ];
  const allControls = [...controls, ...fixedControls];
  const optionValue = (option) => (typeof option === "object" ? option.value : option);
  const optionLabel = (option) => (typeof option === "object" ? option.label : option);
  const defaultOf = (control) => control.default ?? (control.options ? optionValue(control.options[0]) : control.type === "toggle" ? false : control.type === "number" ? 0 : "");

  function parseValue(control, raw) {
    if (raw === null || raw === undefined) return defaultOf(control);
    if (control.type === "number") return Number.isFinite(Number(raw)) ? Number(raw) : defaultOf(control);
    if (control.type === "toggle") return raw === true || raw === "1" || raw === "true";
    if (control.options && !control.options.some((option) => String(optionValue(option)) === String(raw))) return defaultOf(control);
    return String(raw);
  }
  const serialize = (value) => (value === true ? "1" : value === false ? "0" : String(value));

  // Link cũ còn ghi khổ màn là `kho`, số khối là `so`.
  const oldKeys = { viewport: "kho", sections: "so" };
  const state = Object.fromEntries(allControls.map((control) => [control.key, parseValue(control, params.get(control.key) ?? params.get(oldKeys[control.key]))]));
  const root = document.documentElement;
  const applyRootAttributes = (values) => {
    root.dataset.theme = values.theme;
    root.dataset.viewport = values.viewport;
    root.dataset.sections = values.sections ? "1" : "0";
  };
  applyRootAttributes(state);
  if (isFrame) root.dataset.frame = "1";

  function queryFor(values, extra = {}) {
    const query = new URLSearchParams();
    for (const control of allControls) {
      if (serialize(values[control.key]) !== serialize(defaultOf(control))) query.set(control.key, serialize(values[control.key]));
    }
    for (const [key, value] of Object.entries(extra)) query.set(key, value);
    const result = query.toString();
    return result ? `?${result}` : "";
  }

  const escapeHtml = (value) => String(value).replace(/[&<>"']/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[char]);
  // Biểu thức Alpine nằm trong attribute nháy kép, nên tên key viết bằng nháy đơn.
  const store = (key) => `$store.design['${String(key).replace(/[^\w-]/g, "")}']`;
  const icons = {
    desktop: '<svg viewBox="0 0 24 24" aria-hidden="true"><rect width="20" height="14" x="2" y="3" rx="2"/><path d="M8 21h8M12 17v4"/></svg>',
    tablet: '<svg viewBox="0 0 24 24" aria-hidden="true"><rect width="16" height="20" x="4" y="2" rx="2"/><path d="M12 18h.01"/></svg>',
    mobile: '<svg viewBox="0 0 24 24" aria-hidden="true"><rect width="12" height="20" x="6" y="2" rx="2"/><path d="M12 18h.01"/></svg>',
    chevron: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m6 9 6 6 6-6"/></svg>',
    reset: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 12a9 9 0 1 0 3-6.7L3 8"/><path d="M3 3v5h5"/></svg>',
    light: '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2m-7.07-17.07 1.41 1.41m11.32 11.32 1.41 1.41M2 12h2m16 0h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41"/></svg>',
    dark: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"/></svg>',
    info: '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4M12 8h.01"/></svg>',
    hash: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 9h16M4 15h16M10 3 8 21M16 3l-2 18"/></svg>',
  };

  // Icon ⓘ cạnh nhãn, mang lời giải thích ô vặn (help). Khung giải thích là một phần tử chung, vẽ bằng helpTip().
  const helpHtml = (help) => (help ? `<span class="ds-help" tabindex="0" role="button" aria-label="${escapeHtml(help)}" data-help="${escapeHtml(help)}" @click.prevent>${icons.info}</span>` : "");
  function controlHtml(control) {
    const label = `<span class="ds-field-label">${escapeHtml(control.label ?? control.key)}${helpHtml(control.help)}</span>`;
    const attrs = `data-ds-key="${escapeHtml(control.key)}"`;
    if (control.type === "toggle") {
      return `<label class="ds-field ds-field-toggle" ${attrs}>${label}<button type="button" role="switch" class="ds-switch" :aria-checked="String(${store(control.key)})" @click="${store(control.key)} = !${store(control.key)}"><i></i></button></label>`;
    }
    // Ít lựa chọn, chữ ngắn (≤ 4 lựa chọn, tổng ≤ 24 ký tự, vừa một hàng panel): dãy nút bấm như A B C, thấy hết lựa
    // chọn mà không phải mở. Nhiều hơn thì ô chọn thả xuống.
    if (control.type === "select" && control.options.length <= 4 && control.options.reduce((sum, option) => sum + String(optionLabel(option)).length, 0) <= 24) {
      const buttons = control.options
        .map((option) => {
          const value = escapeHtml(JSON.stringify(optionValue(option)));
          return `<button type="button" :aria-pressed="String(${store(control.key)} === ${value})" @click="${store(control.key)} = ${value}">${escapeHtml(optionLabel(option))}</button>`;
        })
        .join("");
      return `<div class="ds-field ds-field-choice" ${attrs}>${label}<div class="ds-choice" role="group">${buttons}</div></div>`;
    }
    if (control.type === "select") {
      const options = control.options.map((option) => `<option value="${escapeHtml(optionValue(option))}">${escapeHtml(optionLabel(option))}</option>`).join("");
      return `<label class="ds-field" ${attrs}>${label}<select x-model="${store(control.key)}">${options}</select></label>`;
    }
    // Số có min và max: thanh kéo kèm số đang chọn, kéo nhanh mà không nhập được giá trị ngoài khoảng.
    if (control.type === "number" && control.min !== undefined && control.max !== undefined) {
      const unit = control.unit ? ` ${escapeHtml(control.unit)}` : "";
      return `<label class="ds-field ds-field-range" ${attrs}>${label}<span class="ds-range"><input type="range" min="${control.min}" max="${control.max}" step="${control.step ?? 1}" x-model.number="${store(control.key)}"><output x-text="${store(control.key)} + '${unit}'"></output></span></label>`;
    }
    if (control.type === "number") {
      const limits = ["min", "max", "step"].filter((name) => control[name] !== undefined).map((name) => `${name}="${control[name]}"`).join(" ");
      const unit = control.unit ? `<em>${escapeHtml(control.unit)}</em>` : "";
      return `<label class="ds-field" ${attrs}>${label}<input type="number" ${limits} x-model.number="${store(control.key)}" style="width:${Math.max(5, String(control.max ?? control.default ?? 0).length + 3)}ch">${unit}</label>`;
    }
    return `<label class="ds-field" ${attrs}>${label}<input type="text" ${control.maxLength ? `maxlength="${control.maxLength}"` : ""} x-model="${store(control.key)}" size="14"></label>`;
  }

  // Chọn bộ dữ liệu: gán cả bộ giá trị, ô nào đổi thì nháy lên một lúc để thấy bộ đó đổi gì.
  const presetValues = (design.presets ?? []).map((preset) => preset.values);
  window.dsPresets = {
    match: (values) => presetValues.findIndex((preset) => Object.entries(preset).every(([key, value]) => values[key] === value)),
    apply(values, index) {
      const preset = presetValues[index];
      if (!preset) return;
      const changed = Object.keys(preset).filter((key) => values[key] !== preset[key]);
      Object.assign(values, preset);
      requestAnimationFrame(() => {
        for (const key of changed) {
          for (const field of document.querySelectorAll(`[data-ds-panel] [data-ds-key="${key}"]`)) {
            field.removeAttribute("data-flash");
            void field.offsetWidth;
            field.setAttribute("data-flash", "");
            setTimeout(() => field.removeAttribute("data-flash"), 1200);
          }
        }
      });
    },
  };

  function segmentedHtml(key, items) {
    return `<div class="ds-segmented" data-ds-key="${key}">${items
      .map(([value, label, title]) => `<button type="button" title="${escapeHtml(title ?? label)}" :aria-pressed="String(${store(key)} === '${value}')" @click="${store(key)} = '${value}'">${label}</button>`)
      .join("")}</div>`;
  }

  // option-switcher: mỗi page một nút chữ (A, B, C lấy từ `option` = "A · tên"). Đưa chuột, Tab tới, hay chạm giữ một nút thì hiện
  // khung mô tả: tên, câu hỏi trung tâm, đơn vị chính, cái hy sinh, lần sửa cuối. Thư mục một page thì không có nút.
  function pagesMenuHtml() {
    const current = decodeURIComponent(location.pathname.split("/").pop());
    if (pages.length < 2) return "";
    const buttons = pages
      .map((page, index) => {
        const letter = page.option?.match(/^\s*([A-Za-z])\s*·/)?.[1]?.toUpperCase() ?? String(index + 1);
        const file = escapeHtml(page.file).replace(/'/g, "");
        const facts = [page.unit && `${text.unit}: ${page.unit}`, page.tradeoff && `${text.tradeoff}: ${page.tradeoff}`].filter(Boolean).join(" · ");
        const edited = [page.updated && `${text.updated} ${page.updated}`, page.note].filter(Boolean).join(" · ");
        const tip = `<span class="ds-option-tip" id="ds-tip-${index}" role="tooltip"><b>${escapeHtml(page.option ?? page.title)}</b>${page.question ? `<span>${escapeHtml(page.question)}</span>` : ""}${facts ? `<small>${escapeHtml(facts)}</small>` : ""}${edited ? `<small>${escapeHtml(edited)}</small>` : ""}</span>`;
        // Chạm giữ 450ms thì mở khung mô tả thay vì chuyển page; chạm nhanh vẫn là bấm.
        return `<span class="ds-option-wrap" :data-tip="tip === ${index} ? '' : null">
          <a class="ds-option" data-ds-option href="${file}" :href="'${file}?' + new URLSearchParams({ viewport: $store.design.viewport, theme: $store.design.theme })" aria-describedby="ds-tip-${index}" ${page.file === current ? 'aria-current="page"' : ""}
            @touchstart.passive="held = false; clearTimeout(hold); hold = setTimeout(() => { tip = ${index}; held = true }, 450)" @touchend="clearTimeout(hold)" @click="if (held) { $event.preventDefault(); held = false }">${letter}</a>${tip}</span>`;
      })
      .join("");
    return `<div class="ds-pages" data-ds-pages x-data="{ tip: null, held: false, hold: null }" @click.outside="tip = null" @keydown.escape.window="tip = null">
      <div class="ds-options" role="group" aria-label="${text.options}">${buttons}</div>
    </div>`;
  }

  // Nút vặn nằm ở panel: data-panel bên trái, config-panel bên phải, đè lên lề trống hai bên bản thiết kế. toolbar
  // xếp theo đúng phía đó: trái là nút mở data-panel và option-switcher, phải là view-controller (khổ, sáng tối, số
  // khối, về mặc định) và nút mở config-panel. Màn đủ rộng thì panel luôn mở, hai nút mở panel ẩn đi.
  function toolbarHtml() {
    // Ô bộ dữ liệu hiện bộ đang khớp với giá trị hiện tại; vặn lệch đi thì về "Bộ dữ liệu…".
    const presets = design.presets?.length
      ? `<label class="ds-field ds-field-presets"><span class="ds-field-label">${text.presets.replace("…", "")}${helpHtml(text.presetsHelp)}</span><select class="ds-presets" data-ds-presets :value="String(dsPresets.match($store.design))" @change="dsPresets.apply($store.design, Number($event.target.value))"><option value="-1">${text.presets}</option>${design.presets.map((preset, index) => `<option value="${index}">${escapeHtml(preset.label)}</option>`).join("")}</select></label>`
      : "";
    const panels = ["variables", "tweaks"].map((name) => {
      const items = controls.filter((control) => control.group === name).map(controlHtml);
      if (name === "variables" && presets) items.unshift(presets);
      return { name, count: controls.filter((control) => control.group === name).length, items };
    }).filter((panel) => panel.items.length);
    const panelHtml = ({ name, items }) => `<aside class="ds-panel" data-ds-panel="${name}" :data-open="panel === '${name}' ? '' : null" @click.outside="if (!$event.target.closest('[data-ds-panel-toggle]')) panel = null">
        <h2 class="ds-panel-title">${text[name]}</h2>${items.join("")}</aside>`;
    const toggleHtml = ({ name, count }) => `<button type="button" class="ds-panel-toggle" data-ds-panel-toggle="${name}" :aria-expanded="String(panel === '${name}')" @click="panel = panel === '${name}' ? null : '${name}'">${text[name]} <small>${count}</small></button>`;
    const left = panels.find((panel) => panel.name === "variables");
    const right = panels.find((panel) => panel.name === "tweaks");
    // Icon thay chữ. Giao diện suy ra mang chấm nhỏ, chữ "(suy ra)" để ẩn trong nút cho trình đọc màn hình và check.mjs.
    const themeLabel = (value) => `${icons[value]}<span class="ds-sr">${text[value]}${theme.derived === value ? ` (${text.derived})` : ""}</span>${theme.derived === value ? '<i class="ds-derived-dot"></i>' : ""}`;
    return `<header class="ds-bar" data-ds-bar x-data="{ panel: null }" @keydown.escape.window="panel = null">
      ${left ? toggleHtml(left) : ""}
      <div class="ds-toolbar" data-ds-toolbar>
        ${pagesMenuHtml()}
        <div class="ds-bar-view">
          ${segmentedHtml("viewport", ["desktop", "tablet", "mobile"].map((value) => [value, icons[value], text[value]]))}
          ${segmentedHtml("theme", ["light", "dark"].map((value) => [value, themeLabel(value), theme.derived === value ? `${text[value]} — ${text.derived}` : text[value]]))}
          <button type="button" class="ds-icon-button" title="${text.blocks}" :aria-pressed="String($store.design.sections)" @click="$store.design.sections = !$store.design.sections">${icons.hash}</button>
          <button type="button" class="ds-icon-button" title="${text.reset}" @click="Object.assign($store.design, ${escapeHtml(JSON.stringify(Object.fromEntries(controls.map((control) => [control.key, defaultOf(control)]))))})">${icons.reset}</button>
        </div>
      </div>
      ${right ? toggleHtml(right) : ""}
      ${panels.map(panelHtml).join("")}
    </header>
    <div class="ds-frame-wrap" x-show="$store.design.viewport !== 'desktop'"></div>`;
  }

  // panel luôn mở khi lề hai bên phần giữa đủ chỗ: phần giữa là bề rộng trang (DESIGN.pageWidth của page,
  // không có thì page.width trong tokens.js), hay khung tablet / mobile kèm viền. Mỗi bên cần panel 240px cộng 12px
  // cách mép và 12px cách nội dung, khớp .ds-panel trong shell.css.
  const toPx = (value) => (value === "full" ? Infinity : String(value).endsWith("rem") ? parseFloat(value) * 16 : parseFloat(value));
  const pageWidth = toPx(design.pageWidth?.value ?? theme.page?.width ?? "64rem");
  function dockPanels(viewport) {
    const center = viewport === "tablet" ? 770 : viewport === "mobile" ? 377 : pageWidth;
    root.dataset.panels = window.innerWidth >= center + 2 * (240 + 24) ? "docked" : "";
  }

  // Thanh trên cùng thẳng mép chữ của trang, không phải mép màn hình. Khổ desktop đo mép trong (trừ padding) của
  // khối ngoài cùng trong #design; khổ tablet / mobile thì khối đó nằm trong iframe, lấy bề rộng trang chia đều hai bên.
  // Toolbar và hai nút mở panel không vừa một dòng thì xếp hai dòng (data-stack): nút mở panel ở dòng trên, toolbar
  // nguyên khối ở dòng dưới. Đo bằng bề rộng thật của từng nút, không đoán bằng breakpoint.
  function alignBar(viewport) {
    const bar = document.querySelector("[data-ds-bar]");
    const view = root.clientWidth;
    const main = document.querySelector("#design");
    // Khối ngoài cùng: lấy cả khi đang ẩn (khổ tablet / mobile), vì padding của nó vẫn đọc được.
    const outer = [...(main?.children ?? [])].find((element) => !["fixed", "absolute", "sticky"].includes(getComputedStyle(element).position) && element.tagName !== "SCRIPT");
    const style = outer && getComputedStyle(outer);
    const padLeft = style ? parseFloat(style.paddingLeft) || 0 : 0;
    const padRight = style ? parseFloat(style.paddingRight) || 0 : 0;
    // Hai khổ cùng một phép tính: mép khối trang cộng padding. desktop đo mép khối thật; tablet / mobile lấy bề rộng
    // trang chia đều hai bên, để đổi khổ không làm thanh xê dịch.
    let left = (view - Math.min(view, pageWidth)) / 2;
    let right = left;
    if (viewport === "desktop" && outer?.getClientRects().length) {
      const box = outer.getBoundingClientRect();
      left = box.left;
      right = view - box.right;
    }
    left += padLeft;
    right += padRight;
    if (!bar) return;
    bar.style.setProperty("--ds-edge-left", `${Math.round(left)}px`);
    bar.style.setProperty("--ds-edge-right", `${Math.round(right)}px`);
    // Hai nút mở panel đứng ở lề ngoài trang khi lề đủ chỗ (data-toggles="margin"): toolbar luôn rộng đúng bằng trang,
    // nút ẩn đi khi panel mở sẵn cũng không làm toolbar xê dịch. Lề không đủ thì nút vào trong thanh; thanh không vừa
    // một dòng thì xếp hai dòng (data-stack).
    const gap = 12;
    const shown = (element) => element.getClientRects().length > 0;
    const width = (element) => element.getBoundingClientRect().width;
    const toolbar = bar.querySelector("[data-ds-toolbar]");
    const toggles = [...bar.querySelectorAll(":scope > .ds-panel-toggle")].filter(shown);
    const inMargin = toggles.length > 0 && toggles.every((toggle) => (toggle.dataset.dsPanelToggle === "variables" ? left : right) >= width(toggle) + 2 * gap);
    bar.dataset.toggles = inMargin ? "margin" : "";
    const parts = [...(inMargin ? [] : toggles), ...[...toolbar.children].filter(shown)];
    const needed = parts.reduce((sum, element) => sum + width(element), 0) + gap * (parts.length - 1);
    const barStyle = getComputedStyle(bar);
    const room = bar.clientWidth - parseFloat(barStyle.paddingLeft) - parseFloat(barStyle.paddingRight);
    bar.toggleAttribute("data-stack", needed > room);
  }

  // Khung mobile / tablet: iframe của chính page kèm frame=1, để media query chạy thật. Giá trị vặn ở toolbar và panel gửi
  // vào bằng postMessage (mở bằng file:// thì trang cha không đọc thẳng được vào iframe).
  let frame = null;
  function syncFrame(values) {
    const wrap = document.querySelector(".ds-frame-wrap");
    if (!wrap) return;
    if (values.viewport === "desktop") return;
    const size = values.viewport === "tablet" ? { width: 768, height: 1024 } : { width: 375, height: 812 };
    if (!frame) {
      frame = document.createElement("iframe");
      frame.title = values.viewport;
      frame.src = `${location.pathname.split("/").pop()}${queryFor({ ...values, viewport: "desktop" }, { frame: "1" })}`;
      frame.addEventListener("load", () => frame.contentWindow.postMessage({ type: "design:set", values: JSON.parse(JSON.stringify(Alpine.store("design"))) }, "*"));
      wrap.append(frame);
    }
    Object.assign(frame.style, { width: `${size.width}px`, height: `${size.height}px` });
    frame.contentWindow?.postMessage({ type: "design:set", values: { ...values, viewport: "desktop" } }, "*");
  }

  window.addEventListener("message", (event) => {
    if (!isFrame || event.data?.type !== "design:set" || !window.Alpine) return;
    const target = Alpine.store("design");
    for (const control of allControls) {
      if (control.key in event.data.values && control.key !== "viewport") target[control.key] = event.data.values[control.key];
    }
  });

  // Nút chép câu góp ý: <button data-copy="câu">…</button>, chép xong gắn data-copied 1,5 giây.
  document.addEventListener("click", async (event) => {
    const button = event.target.closest("[data-copy]");
    if (!button) return;
    try {
      await navigator.clipboard.writeText(button.dataset.copy);
    } catch {
      const area = Object.assign(document.createElement("textarea"), { value: button.dataset.copy });
      document.body.append(area);
      area.select();
      document.execCommand("copy");
      area.remove();
    }
    button.setAttribute("data-copied", "");
    setTimeout(() => button.removeAttribute("data-copied"), 1500);
  });

  // Icon lucide: mỗi lần Alpine vẽ thêm <i data-lucide> thì vẽ lại. Có điều kiện i[data-lucide]: svg đã vẽ vẫn mang
  // data-lucide, gọi createIcons() vô điều kiện trong observer thì nó tự kích mãi.
  // Khung giải thích của icon ⓘ: một phần tử position: fixed chung, đặt ngay dưới icon và kẹp trong màn hình. Không
  // đặt trong panel vì panel có thanh cuộn, khung sẽ bị cắt. Đưa chuột, Tab tới, hay chạm vào icon thì hiện.
  function helpTip() {
    const tip = document.createElement("div");
    tip.className = "ds-help-tip";
    tip.setAttribute("role", "tooltip");
    document.body.append(tip);
    let current = null;
    const show = (icon) => {
      current = icon;
      tip.textContent = icon.dataset.help;
      tip.dataset.open = "";
      const box = icon.getBoundingClientRect();
      const width = tip.offsetWidth;
      tip.style.left = `${Math.max(8, Math.min(box.left + box.width / 2 - width / 2, root.clientWidth - width - 8))}px`;
      const below = box.bottom + 6;
      tip.style.top = `${below + tip.offsetHeight > window.innerHeight - 8 ? box.top - 6 - tip.offsetHeight : below}px`;
    };
    const hide = () => {
      current = null;
      delete tip.dataset.open;
    };
    document.addEventListener("mouseover", (event) => {
      const icon = event.target.closest?.(".ds-help");
      if (icon) show(icon);
      else if (current && !event.target.closest?.(".ds-help-tip")) hide();
    });
    document.addEventListener("focusin", (event) => (event.target.matches?.(".ds-help") ? show(event.target) : hide()));
    document.addEventListener("click", (event) => {
      const icon = event.target.closest?.(".ds-help");
      if (icon) (current === icon && event.pointerType !== "mouse" ? hide() : show(icon));
      else hide();
    });
    document.addEventListener("scroll", hide, true);
  }

  function watchIcons() {
    if (!window.lucide) return;
    const draw = () => document.querySelector("i[data-lucide]") && window.lucide.createIcons();
    draw();
    new MutationObserver(draw).observe(document.body, { childList: true, subtree: true });
  }

  document.addEventListener("alpine:init", () => {
    Alpine.store("design", state);
    if (!document.body.hasAttribute("x-data")) document.body.setAttribute("x-data", "");
    if (!isFrame) {
      document.body.insertAdjacentHTML("afterbegin", toolbarHtml());
      helpTip();
    }
    Alpine.effect(() => {
      const values = JSON.parse(JSON.stringify(Alpine.store("design")));
      applyRootAttributes(values);
      if (isFrame) return;
      history.replaceState(null, "", queryFor(values) || location.pathname.split("/").pop());
      syncFrame(values);
      dockPanels(values.viewport);
      requestAnimationFrame(() => alignBar(values.viewport));
    });
    if (!isFrame) {
      const relayout = () => {
        dockPanels(Alpine.store("design").viewport);
        alignBar(Alpine.store("design").viewport);
      };
      window.addEventListener("resize", relayout);
      new ResizeObserver(() => alignBar(Alpine.store("design").viewport)).observe(document.body);
    }
  });
  document.addEventListener("alpine:initialized", watchIcons);
})();
