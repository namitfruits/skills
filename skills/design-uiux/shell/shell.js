// Khung chung của mọi page design: toolbar (option-switcher, view-controller), panel (data-panel vặn variables,
// layout-panel vặn tweaks), đọc ghi URL, khung mobile / tablet. Tên các khối: SKILL.md, mục "Các khối điều khiển".
// Page khai window.DESIGN rồi nạp file này; tokens.js và pages.js nạp trước, Alpine nạp sau bằng defer. toolbar và
// panel ghi giá trị vào Alpine.store("design"); page đọc $store.design.<key>.
// Thư mục luồng (pages.js có `screen`): option-switcher thành dãy màn; page gọi $store.design.next() · prev() để sang
// màn kề, chữ người xem gõ nằm ở $store.design.form, lưu trong sessionStorage của thư mục design.
// Tiến độ dựng: nhãn trạng thái ở cột trái toolbar đọc danh sách bước dựng `<file>.progress.js`; có bước mới xong thì
// tự tải lại, giữ vị trí cuộn, đợi người xem gõ xong. Việc con agent đang làm hiện thành một dòng dưới bước dở.
// Chế độ comment: nút trên view-controller; người xem bấm một khối hay kéo một vùng, viết, gửi tới cầu nối comment trên
// máy (new-design.mjs comment-bridge) hay chép prompt để dán vào chat; ghim đánh số hiện trạng thái từng comment.
// Ẩn shell: nút cuối view-controller cất toolbar, panel, ghim; nút nhỏ ở góc hay phím \ hiện lại.
//
// spec: F2 F2.9 F4.2 F6.3 F6.4 F6.5 F6.8 F6.10 F6.11 F7.1 F7.2 F7.3 F7.4 F7.6
(() => {
  const design = window.DESIGN ?? {};
  const theme = window.DESIGN_THEME ?? { base: "light", derived: null, fonts: [] };
  const pages = window.DESIGN_PAGES ?? [];
  const params = new URLSearchParams(location.search);
  const isFrame = params.get("frame") === "1";
  const lang = design.lang === "en" ? "en" : "vi";
  const text = {
    vi: { variables: "Data Config", tweaks: "Layout Config", toggle: { variables: "Data", tweaks: "Layout" }, presets: "Bộ dữ liệu", defaultPreset: "Mặc định", defaultMark: "mặc định", reset: "Về mặc định", light: "Sáng", dark: "Tối",
      derived: "suy ra", desktop: "Desktop", tablet: "Tablet", mobile: "Mobile",
      options: "Phương án", screens: "Các màn", goodFor: "Tiện cho", updated: "sửa",
      status: "Tiến độ dựng page", preparing: "Đang chuẩn bị", building: "Đang dựng", revising: "Đang sửa", checking: "Đang kiểm lại", done: "Activity log",
      roundPrep: "Chuẩn bị", roundBuild: "Dựng", groupComments: "Comment", groupChat: "Góp ý trong chat", revisingChat: "Đang sửa góp ý", roundDeliver: "Giao", noBuild: "Page dựng trước khi có danh sách bước",
      lastEdited: (day, month) => `Sửa lần cuối ${day} thg ${month}`,
      presetsHelp: "Một bộ giá trị dựng sẵn cho ca hay gặp hay ca biên. Chọn là đổi cả bộ; ô nào đổi sẽ nháy lên.",
      comment: "Comment", commentHint: "Bấm một khối hay kéo chọn một vùng · C hay Esc để thoát", commentPlaceholder: "Cần sửa gì ở đây?", commentKeyTip: "Comment (phím C)",
      send: "Gửi", copy: "Chép", copyPrompt: "Chép prompt", cancel: "Huỷ", copied: "Đã chép", sending: "Đang gửi…", sendFailed: "Gửi không được",
      bridgeInbox: "Claude đang nhận comment: gửi xong là agent sửa",
      bridgeSaved: 'Comment được lưu. Gõ "xem comment" vào session Claude đang chạy page này để agent sửa.',
      bridgeClosed: "Session Claude chạy page này đã đóng", bridgeAt: "lúc", bridgeCode: "mã",
      bridgeReopen: "Mở lại", bridgeVscode: "danh sách hội thoại cũ của Claude trong VS Code, hay", bridgeTerminal: "trong terminal",
      bridgeNew: "Hoặc mở session Claude Code mới ở", bridgePaste: "Bấm Chép prompt rồi dán vào chat.",
      bridgeNone: "Chưa có session Claude nào nhận comment của page này.", bridgeOpen: "Mở session Claude Code ở", bridgeOpenPaste: "bấm Chép prompt rồi dán vào chat.",
      area: "vùng", block: "khối", commentStatus: { sent: "đã gửi", doing: "đang sửa", done: "đã sửa" },
      hideShell: "Xem trọn page (phím \\)", showShell: "Hiện toolbar và panel (phím \\)" },
    en: { variables: "Data Config", tweaks: "Layout Config", toggle: { variables: "Data", tweaks: "Layout" }, presets: "Presets", defaultPreset: "Default", defaultMark: "default", reset: "Reset", light: "Light", dark: "Dark",
      derived: "derived", desktop: "Desktop", tablet: "Tablet", mobile: "Mobile",
      options: "Options", screens: "Screens", goodFor: "Good for", updated: "edited",
      status: "Page build progress", preparing: "Preparing", building: "Building", revising: "Revising", checking: "Checking", done: "Activity log",
      roundPrep: "Prepare", roundBuild: "Build", groupComments: "Comments", groupChat: "Chat feedback", revisingChat: "Revising feedback", roundDeliver: "Deliver", noBuild: "Built before step lists existed",
      lastEdited: (day, month) => `Last edited ${new Date(2000, month - 1, day).toLocaleDateString("en-US", { month: "short", day: "numeric" })}`,
      presetsHelp: "A ready-made set of values for a common or edge case. Picking one changes them all; changed fields flash.",
      comment: "Comment", commentHint: "Click a block or drag an area · C or Esc to exit", commentPlaceholder: "What should change here?", commentKeyTip: "Comment (C)",
      send: "Send", copy: "Copy", copyPrompt: "Copy prompt", cancel: "Cancel", copied: "Copied", sending: "Sending…", sendFailed: "Could not send",
      bridgeInbox: "Claude is taking comments: the agent fixes it after you send",
      bridgeSaved: 'Comment saved. Type "check comments" in the Claude session running this page so the agent fixes it.',
      bridgeClosed: "The Claude session running this page has closed", bridgeAt: "at", bridgeCode: "id",
      bridgeReopen: "Reopen it", bridgeVscode: "Claude's past conversations in VS Code, or", bridgeTerminal: "in a terminal",
      bridgeNew: "Or start a new Claude Code session in", bridgePaste: "Click Copy prompt and paste it into the chat.",
      bridgeNone: "No Claude session takes comments for this page yet.", bridgeOpen: "Start a Claude Code session in", bridgeOpenPaste: "click Copy prompt and paste it into the chat.",
      area: "area", block: "block", commentStatus: { sent: "sent", doing: "fixing", done: "fixed" },
      hideShell: "Full page view (\\)", showShell: "Show toolbar and panels (\\)" },
  }[lang];

  const controls = [
    ...(design.variables ?? []).map((control) => ({ ...control, group: "variables" })),
    ...(design.tweaks ?? []).map((control) => ({ ...control, group: "tweaks" })),
  ];
  const fixedControls = [
    { key: "viewport", type: "select", options: ["desktop", "tablet", "mobile"], default: "desktop" },
    { key: "theme", type: "select", options: ["light", "dark"], default: theme.base },
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

  // Link cũ còn ghi khổ màn là `kho`.
  const oldKeys = { viewport: "kho" };
  const state = Object.fromEntries(allControls.map((control) => [control.key, parseValue(control, params.get(control.key) ?? params.get(oldKeys[control.key]))]));
  const root = document.documentElement;
  const applyRootAttributes = (values) => {
    root.dataset.theme = values.theme;
    root.dataset.viewport = values.viewport;
  };
  applyRootAttributes(state);
  if (isFrame) root.dataset.frame = "1";

  // Luồng: next() · prev() sang page của màn kề theo thứ tự pages.js, giữ mọi giá trị trên URL. Trong khung mobile /
  // tablet thì nhờ trang cha chuyển, để toolbar đổi theo. Chữ người xem gõ (`form`) không lên URL: link chép không mang
  // theo mật khẩu mẫu. sessionStorage dùng chung giữa các file và iframe cùng tab khi mở bằng file://.
  const currentFile = decodeURIComponent(location.pathname.split("/").pop());
  const isFlow = pages.some((page) => page.screen);
  const formKey = `ds-form:${decodeURIComponent(location.pathname.split("/").slice(0, -1).join("/"))}`;
  // Ẩn shell: nhớ theo tab và thư mục design, không lên URL, để link chép gửi đi luôn mở có shell. Đặt thuộc tính ngay
  // khi nạp, trước khi Alpine vẽ, để page tự tải lại không loé toolbar.
  const shellKey = `ds-shell:${decodeURIComponent(location.pathname.split("/").slice(0, -1).join("/"))}`;
  let shellWasHidden = false;
  try {
    shellWasHidden = !isFrame && sessionStorage.getItem(shellKey) === "1";
  } catch {}
  root.toggleAttribute("data-shell-hidden", shellWasHidden);
  const readForm = () => {
    try {
      return JSON.parse(sessionStorage.getItem(formKey) ?? "{}") ?? {};
    } catch {
      return {};
    }
  };
  function go(offset) {
    const target = pages[pages.findIndex((page) => page.file === currentFile) + offset];
    if (!target) return;
    if (isFrame) parent.postMessage({ type: "design:go", file: target.file }, "*");
    else location.href = `${target.file}${location.search}`;
  }
  state.form = readForm();
  state.next = () => go(1);
  state.prev = () => go(-1);

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
    history: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/><path d="M12 7v5l4 2"/></svg>',
    comment: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/><path d="M12 7v6M9 10h6"/></svg>',
    expand: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7"/></svg>',
    shrink: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 14h6v6M20 10h-6V4M14 10l7-7M3 21l7-7"/></svg>',
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

  // Gán một bộ giá trị vào store, ô nào đổi thì nháy lên một lúc để thấy bộ đó đổi gì.
  function assignAndFlash(values, next) {
    const changed = Object.keys(next).filter((key) => values[key] !== next[key]);
    Object.assign(values, next);
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
  }

  const panelDefaults = Object.fromEntries(["variables", "tweaks"].map((name) => [name, Object.fromEntries(controls.filter((control) => control.group === name).map((control) => [control.key, defaultOf(control)]))]));

  // Chọn bộ dữ liệu: gán cả bộ giá trị. Bộ có values trùng default của variables là bộ mặc định: đứng đầu ô chọn, nhãn
  // thêm "· mặc định". Page không khai bộ đó thì đầu ô chọn là một dòng "Mặc định" mang default của mọi variables. Ô
  // chọn hiện bộ đang khớp với giá trị hiện tại, xét bộ mặc định trước; không khớp bộ nào thì ô để trống. Ô gán
  // select.value thẳng, không qua :value: :value bỏ chọn từng dòng, select một dòng không có dòng nào chọn thì trình
  // duyệt tự chọn dòng đầu.
  const presetMatches = (values, preset) => Object.entries(preset).every(([key, value]) => values[key] === value);
  const presetList = (design.presets ?? []).map((preset, index) => ({ id: String(index), label: preset.label, values: preset.values }));
  const defaultPreset = presetList.find((preset) => presetMatches(panelDefaults.variables, preset.values));
  const presetOptions = defaultPreset
    ? [{ ...defaultPreset, label: `${defaultPreset.label} · ${text.defaultMark}` }, ...presetList.filter((preset) => preset !== defaultPreset)]
    : [{ id: "default", label: text.defaultPreset, values: panelDefaults.variables }, ...presetList];
  window.dsPresets = {
    match: (values) => presetOptions.find((preset) => presetMatches(values, preset.values))?.id ?? "",
    apply(values, id) {
      const preset = presetOptions.find((item) => item.id === id);
      if (preset) assignAndFlash(values, preset.values);
    },
  };

  // Nút về mặc định của từng panel: chỉ trả ô của panel đó về default. Nút của data-panel xoá luôn chữ người xem đã gõ
  // (form), vì chữ đó là dữ liệu page đang hiện. Panel đã ở mặc định thì nút tắt.
  window.dsReset = {
    isDefault: (values, name) => Object.entries(panelDefaults[name]).every(([key, value]) => values[key] === value) && (name !== "variables" || !Object.keys(values.form ?? {}).length),
    apply(values, name) {
      assignAndFlash(values, panelDefaults[name]);
      if (name === "variables") values.form = {};
    },
  };

  function segmentedHtml(key, items) {
    return `<div class="ds-segmented" data-ds-key="${key}">${items
      .map(([value, label, title]) => `<button type="button" title="${escapeHtml(title ?? label)}" :aria-pressed="String(${store(key)} === '${value}')" @click="${store(key)} = '${value}'">${label}</button>`)
      .join("")}</div>`;
  }

  // option-switcher: mỗi page một nút chữ (A, B, C lấy từ `option` = "A · tên"). Đưa chuột, Tab tới, hay chạm giữ một nút thì hiện
  // khung mô tả: tên, bố cục, các việc page tiện cho (cùng chữ với khối chờ của page), lần sửa cuối. Thư mục một page thì không có nút.
  function pagesMenuHtml() {
    const current = currentFile;
    if (pages.length < 2) return "";
    if (isFlow) return screensMenuHtml(current);
    const buttons = pages
      .map((page, index) => {
        const letter = page.option?.match(/^\s*([A-Za-z])\s*·/)?.[1]?.toUpperCase() ?? String(index + 1);
        const file = escapeHtml(page.file).replace(/'/g, "");
        const goodFor = page.goodFor ? `${text.goodFor}: ${page.goodFor}` : "";
        const edited = [page.updated && `${text.updated} ${page.updated}`, page.note].filter(Boolean).join(" · ");
        const tip = `<span class="ds-option-tip" id="ds-tip-${index}" role="tooltip"><b>${escapeHtml(page.option ?? page.title)}</b>${page.layout ? `<span>${escapeHtml(page.layout)}</span>` : ""}${goodFor ? `<small>${escapeHtml(goodFor)}</small>` : ""}${edited ? `<small>${escapeHtml(edited)}</small>` : ""}</span>`;
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

  // Dãy màn của thư mục luồng: "1 · Welcome → 2 · Đăng ký"; bấm thì sang page đó, giữ mọi giá trị trên URL. Rê vào
  // thấy việc của màn (`purpose`). Màn hẹp chỉ còn số.
  function screensMenuHtml(current) {
    const items = pages
      .map((page, index) => {
        const [, number, name] = page.screen?.match(/^\s*(\d+)\s*·\s*(.*)$/) ?? [null, String(index + 1), page.screen ?? page.title];
        const file = escapeHtml(page.file).replace(/'/g, "");
        const edited = [page.updated && `${text.updated} ${page.updated}`, page.note].filter(Boolean).join(" · ");
        const tip = `<span class="ds-option-tip" id="ds-tip-${index}" role="tooltip"><b>${escapeHtml(page.screen ?? page.title)}</b>${page.purpose ? `<span>${escapeHtml(page.purpose)}</span>` : ""}${edited ? `<small>${escapeHtml(edited)}</small>` : ""}</span>`;
        const arrow = index ? '<span class="ds-screen-arrow" aria-hidden="true">→</span>' : "";
        return `${arrow}<span class="ds-option-wrap" :data-tip="tip === ${index} ? '' : null">
          <a class="ds-option ds-screen" data-ds-screen aria-label="${escapeHtml(page.screen ?? page.title)}" href="${file}" @click.prevent="location.href = '${file}' + location.search" aria-describedby="ds-tip-${index}" ${page.file === current ? 'aria-current="page"' : ""}
            @touchstart.passive="held = false; clearTimeout(hold); hold = setTimeout(() => { tip = ${index}; held = true }, 450)" @touchend="clearTimeout(hold)"><b>${escapeHtml(number)}</b><span class="ds-screen-name">· ${escapeHtml(name)}</span></a>${tip}</span>`;
      })
      .join("");
    return `<div class="ds-pages" data-ds-pages x-data="{ tip: null, held: false, hold: null }" @click.outside="tip = null" @keydown.escape.window="tip = null">
      <nav class="ds-options ds-screens" aria-label="${text.screens}">${items}</nav>
    </div>`;
  }

  // Tiến độ dựng. Danh sách bước dựng của page nằm ở `<file>.progress.js` cạnh page, chỉ agent dựng page đó ghi (qua
  // new-design.mjs progress: ghi file tạm rồi rename). Trang cha đọc lại file mỗi 2 giây bằng một thẻ <script> mới: trên
  // file:// đây là cách duy nhất đọc lại một file mà không tải page. `rev` đổi là có bước mới được đánh dấu xong: tải
  // lại, trừ khi người xem đang gõ thì đợi rời ô. `rev` giữ nguyên thì chỉ vẽ lại nhãn: việc con (`doing`) đổi mà không
  // tăng `rev`. Lần đọc đầu mà thẻ script báo lỗi nạp là page không có danh sách
  // (dựng trước khi có danh sách bước): coi như xong, thôi đọc. Nạp được mà thiếu dữ liệu là đọc trúng lúc file đang
  // ghi: bỏ lượt đó, đọc lại lượt sau.
  const progressFile = `${currentFile.replace(/\.html?$/, "")}.progress.js`;
  let progress = null; // null: chưa đọc được lần nào · false: page không có danh sách · object: lần đọc gần nhất
  let progressTimer = null;
  let pendingReload = false;
  let frameTyping = false;
  // Chỉ ô gõ chữ: select, thanh kéo, ô tick giữ con trỏ sau khi chọn, tính chúng vào thì page đợi mãi không tải lại.
  // Ô comment đang mở cũng tính là đang gõ, kể cả lúc con trỏ ở nút Gửi: tải lại giữa chừng thì mất comment.
  const typingSelector = ["textarea", "[contenteditable]:not([contenteditable='false'])", "input:not([type])", ...["text", "search", "email", "password", "tel", "url", "number"].map((type) => `input[type=${type}]`)].join(", ");
  let commentOpen = false;
  const typingHere = () => commentOpen || Boolean(document.activeElement?.matches?.(typingSelector));
  const isTyping = () => frameTyping || typingHere();
  function reloadWhenIdle() {
    if (isTyping()) pendingReload = true;
    else location.reload();
  }
  // focusout chạy trước khi con trỏ sang ô kế: đợi một nhịp rồi mới xem còn gõ không.
  const reloadIfDoneTyping = () => setTimeout(() => pendingReload && !isTyping() && location.reload(), 0);

  function readProgress() {
    const slot = (window.DESIGN_PROGRESS ||= {});
    delete slot[currentFile];
    const tag = document.createElement("script");
    tag.src = `${encodeURIComponent(progressFile)}?t=${Date.now()}`;
    tag.onload = () => {
      tag.remove();
      const entry = slot[currentFile];
      if (!entry || typeof entry.rev !== "number" || !Array.isArray(entry.build)) return;
      if (progress && entry.rev !== progress.rev) return reloadWhenIdle();
      progress = normalizeProgress(entry);
      renderStatus();
    };
    tag.onerror = () => {
      tag.remove();
      if (progress !== null) return;
      progress = false;
      clearInterval(progressTimer);
      renderStatus();
    };
    document.head.append(tag);
  }
  function watchProgress() {
    // Lỗi cú pháp của lượt đọc trúng file đang ghi là chuyện đã tính: không để nó thành lỗi JS của page.
    window.addEventListener("error", (event) => event.filename?.includes(".progress.js") && event.preventDefault(), true);
    readProgress();
    progressTimer = setInterval(() => document.visibilityState === "visible" && readProgress(), 2000);
    document.addEventListener("visibilitychange", () => document.visibilityState === "visible" && progress !== false && readProgress());
    document.addEventListener("focusout", reloadIfDoneTyping);
  }

  // File kiểu cũ xếp góp ý theo vòng (bước round ≥ 2 trong build): đọc thành mục góp ý, cùng phép chuyển với
  // normalizeProgress của new-design.mjs. "Góp ý: Comment #<n>: …" hay "Comment #<n>: …" là mục comment, bước khác là mục
  // chat; bước kiểm đầy đủ của vòng thành việc cuối của mọi mục trong vòng đó.
  function normalizeProgress(data) {
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
    return { ...data, build: data.build.filter((item) => !(Number(item.round) > 1)), feedback };
  }
  const currentAction = (item) => item.actions.find((action) => !action.done) ?? null;

  // Nhãn trạng thái: bước chuẩn bị (agent chính viết brief) chưa xong là đang chuẩn bị, còn bước dựng chưa xong là đang
  // dựng, còn mục góp ý chưa xong là đang sửa ("Đang sửa #3" với comment, "Đang sửa góp ý" với ý trong chat), hết bước
  // và mục mà bước giao (agent chính kiểm lại cả thư mục rồi giao) chưa xong là đang kiểm lại, không còn gì (hay page
  // không có danh sách) là xong. Nhãn xong không có con số: ngày dạng "09/10" đọc thành 9 trên 10 bước, nên ngày sửa
  // cuối trong pages.js nằm ở dòng cuối danh sách. Bấm mở danh sách theo nhóm: Chuẩn bị, Dựng, Comment, Góp ý trong
  // chat, Giao; nhóm trống thì ẩn. Bước dựng dở có `doing` thì thêm một dòng việc con thụt vào ngay dưới nó; mục góp ý
  // có các việc agent đã làm thụt dưới mục.
  function progressStatus() {
    const steps = progress ? progress.build : null;
    if (progress?.prep && !progress.prep.done) return { state: "preparing", label: text.preparing, count: "", share: 0, doing: progress.prep.task, steps, open: null };
    const open = steps?.find((item) => !item.done);
    if (open) {
      const done = steps.filter((item) => item.done).length;
      return { state: "building", label: text.building, count: `${done}/${steps.length}`, share: done / steps.length, steps, open };
    }
    const item = progress?.feedback?.find((entry) => !entry.done);
    if (item) {
      const done = item.actions.filter((action) => action.done).length;
      return { state: "revising", label: item.source === "comment" ? text.revising : text.revisingChat, count: item.source === "comment" ? `#${item.id}` : "", share: done / item.actions.length, doing: currentAction(item)?.task ?? "", steps, open: null, item };
    }
    if (progress?.deliver && !progress.deliver.done) return { state: "checking", label: text.checking, count: "", share: 1, doing: progress.deliver.task, steps, open: null };
    return { state: "done", label: text.done, count: "", steps, open: null };
  }
  const statusHtml = () => `<div class="ds-status-wrap" data-ds-status-wrap hidden x-data="{ open: false }" @click.outside="open = false" @keydown.escape.window="open = false">
      <button type="button" class="ds-status" data-ds-status title="${text.status}" :aria-expanded="String(open)" aria-controls="ds-status-list" @click="open = !open"></button>
      <ul class="ds-status-list" id="ds-status-list" data-ds-status-list x-show="open"></ul>
    </div>`;
  function renderStatus() {
    const wrap = document.querySelector("[data-ds-status-wrap]");
    if (!wrap) return;
    const status = progressStatus();
    const button = wrap.querySelector("[data-ds-status]");
    // Nhãn lúc page chưa xong: chấm có vòng lan, việc con ngay trên nhãn, thanh tiến độ ở đáy (phần đã xong tô đặc, vệt
    // sáng chạy trên phần còn lại). Shell đọc tiến độ mỗi 2 giây: chỉ vẽ lại nhãn khi nội dung đổi, để chuyển động không
    // bị giật về đầu; việc con mới thì trượt lên.
    const working = status.state !== "done";
    const doing = status.doing ?? status.open?.doing ?? "";
    const html = `${working ? '<i class="ds-status-dot"></i>' : icons.history}<span class="ds-status-label">${status.label}</span>${status.count ? ` <span class="ds-status-count">${status.count}</span>` : ""}${doing ? `<span class="ds-status-doing" data-ds-status-doing>· ${escapeHtml(doing)}</span>` : ""}${working ? `<span class="ds-status-track" style="--ds-done:${(status.share * 100).toFixed(1)}%" aria-hidden="true"><span></span></span>` : ""}`;
    if (button.dataset.html !== html) {
      const freshDoing = Boolean(doing) && button.dataset.doing !== undefined && button.dataset.doing !== doing;
      button.dataset.state = status.state;
      button.dataset.html = html;
      button.dataset.doing = doing;
      button.innerHTML = html;
      if (doing) button.title = `${text.status}: ${doing}`;
      else button.title = text.status;
      if (freshDoing) button.querySelector("[data-ds-status-doing]").dataset.fresh = "";
    }
    document.querySelector("[data-ds-shell-show]")?.setAttribute("data-state", status.state);
    const prep = progress?.prep;
    const prepHtml = prep ? `<li class="ds-status-round">${text.roundPrep}</li><li data-step="${prep.done ? "done" : "current"}"><span aria-hidden="true">${prep.done ? "✓" : "●"}</span>${escapeHtml(prep.task)}</li>` : "";
    const deliver = progress?.deliver;
    const deliverStep = deliver?.done ? "done" : status.state === "checking" ? "current" : "todo";
    const deliverHtml = deliver ? `<li class="ds-status-round">${text.roundDeliver}</li><li data-step="${deliverStep}"><span aria-hidden="true">${{ done: "✓", current: "●", todo: "○" }[deliverStep]}</span>${escapeHtml(deliver.task)}</li>` : "";
    const [, month, day] = String(pages.find((page) => page.file === currentFile)?.updated ?? "").match(/^\d{4}-(\d{2})-(\d{2})/) ?? [];
    const editedHtml = status.state === "done" && day ? `<li class="ds-status-edited">${text.lastEdited(Number(day), Number(month))}</li>` : "";
    const mark = { done: "✓", current: "●", todo: "○" };
    const row = (step, label, extra = "") => `<li data-step="${step}"${extra}><span aria-hidden="true">${mark[step]}</span>${escapeHtml(label)}</li>`;
    const buildHtml = status.steps?.length
      ? `<li class="ds-status-round">${text.roundBuild}</li>${status.steps
          .map((item) => `${row(item.done ? "done" : item === status.open ? "current" : "todo", item.task)}${item === status.open && item.doing ? `<li data-step="doing">${escapeHtml(item.doing)}</li>` : ""}`)
          .join("")}`
      : "";
    // Mục góp ý: dòng mục (✓ xong, ● đang sửa), rồi các việc agent đã làm thụt dưới, việc đang làm có chấm. Việc kiểm
    // đầy đủ ở cuối mọi mục không hiện trong danh sách: dòng nào cũng giống nhau, chỉ lặp. Lúc nó đang chạy thì nhãn ghi.
    const feedbackHtml = (source, title) => {
      const items = (progress?.feedback ?? []).filter((item) => item.source === source);
      if (!items.length) return "";
      return `<li class="ds-status-round">${title}</li>${items
        .map((item) => {
          const current = item.done ? null : currentAction(item);
          const actions = item.actions.filter((action) => !action.final).map((action) => row(action.done ? "done" : action === current ? "current" : "todo", action.task, ' class="ds-status-action"')).join("");
          return row(item.done ? "done" : "current", source === "comment" ? `#${item.id} ${item.task}` : item.task, ' class="ds-status-item"') + actions;
        })
        .join("")}`;
    };
    wrap.querySelector("[data-ds-status-list]").innerHTML = (status.steps
      ? prepHtml + buildHtml + feedbackHtml("comment", text.groupComments) + feedbackHtml("chat", text.groupChat) + deliverHtml
      : `<li>${text.noBuild}</li>`) + editedHtml;
    wrap.hidden = false;
    alignBar(Alpine.store("design").viewport);
  }

  // Vị trí cuộn qua một lần tải lại. Trang cha ghi vào sessionStorage mỗi lần rời trang và chỉ cuộn lại khi lần mở này
  // là tải lại (tự tải lại, F5, Cmd+R). Ở khổ tablet / mobile chỗ cuộn nằm trong iframe: iframe ghi của nó kèm giờ, lần
  // mở iframe trong 10 giây sau thì cuộn lại. Tailwind và Alpine vẽ xong sau một lúc, trang chưa đủ cao thì cuộn chưa
  // tới: thử lại tới khi tới, tối đa 2 giây.
  const scrollKey = `ds-scroll${isFrame ? "-frame" : ""}:${currentFile}`;
  window.addEventListener("pagehide", () => {
    try {
      sessionStorage.setItem(scrollKey, JSON.stringify({ y: window.scrollY, at: Date.now() }));
    } catch {}
  });
  function restoreScroll() {
    let saved = null;
    try {
      saved = JSON.parse(sessionStorage.getItem(scrollKey) ?? "null");
      sessionStorage.removeItem(scrollKey);
    } catch {}
    const reloaded = isFrame ? Date.now() - (saved?.at ?? 0) < 10000 : performance.getEntriesByType("navigation")[0]?.type === "reload";
    if (!reloaded || !Number.isFinite(saved?.y)) return;
    const started = performance.now();
    const step = () => {
      window.scrollTo(0, saved.y);
      if (Math.abs(window.scrollY - saved.y) > 1 && performance.now() - started < 2000) requestAnimationFrame(step);
    };
    step();
  }

  // Nút vặn nằm ở panel: data-panel bên trái, layout-panel bên phải, đè lên lề trống hai bên bản thiết kế. toolbar
  // xếp theo đúng phía đó: trái là nút mở data-panel và nhãn tiến độ, giữa là option-switcher, phải là view-controller
  // (comment, khổ, sáng tối) và nút mở layout-panel. Nút về mặc định nằm trên đầu mỗi panel. Màn đủ rộng thì panel luôn mở, hai nút mở panel ẩn đi.
  // Nút mở panel ghi tên ngắn (Data, Layout), tên đủ ở tiêu đề panel: ghi "Layout Config" thì cột phải rộng tới mức
  // option-switcher lệch khỏi giữa trang ở 1280px.
  function toolbarHtml() {
    const presets = design.presets?.length
      ? `<label class="ds-field ds-field-presets"><span class="ds-field-label">${text.presets}${helpHtml(text.presetsHelp)}</span><select class="ds-presets" data-ds-presets x-effect="$el.value = dsPresets.match($store.design)" @change="dsPresets.apply($store.design, $event.target.value)">${presetOptions.map((preset) => `<option value="${preset.id}">${escapeHtml(preset.label)}</option>`).join("")}</select></label>`
      : "";
    const panels = ["variables", "tweaks"].map((name) => {
      const items = controls.filter((control) => control.group === name).map(controlHtml);
      if (name === "variables" && presets) items.unshift(presets);
      return { name, count: controls.filter((control) => control.group === name).length, items };
    }).filter((panel) => panel.items.length);
    const panelHtml = ({ name, items }) => `<aside class="ds-panel" data-ds-panel="${name}" :data-open="panel === '${name}' ? '' : null" @click.outside="if (!$event.target.closest('[data-ds-panel-toggle]')) panel = null">
        <div class="ds-panel-head"><h2 class="ds-panel-title">${text[name]}</h2><button type="button" class="ds-panel-reset" data-ds-reset="${name}" title="${text.reset}" aria-label="${text.reset}: ${text[name]}" :disabled="dsReset.isDefault($store.design, '${name}')" @click="dsReset.apply($store.design, '${name}')">${icons.reset}</button></div>${items.join("")}</aside>`;
    const toggleHtml = ({ name, count }) => `<button type="button" class="ds-panel-toggle" data-ds-panel-toggle="${name}" :aria-expanded="String(panel === '${name}')" title="${text[name]}" @click="panel = panel === '${name}' ? null : '${name}'">${text.toggle[name]} <small>${count}</small></button>`;
    const left = panels.find((panel) => panel.name === "variables");
    const right = panels.find((panel) => panel.name === "tweaks");
    // Icon thay chữ. Giao diện suy ra mang chấm nhỏ, chữ "(suy ra)" để ẩn trong nút cho trình đọc màn hình và check.mjs.
    const themeLabel = (value) => `${icons[value]}<span class="ds-sr">${text[value]}${theme.derived === value ? ` (${text.derived})` : ""}</span>${theme.derived === value ? '<i class="ds-derived-dot"></i>' : ""}`;
    return `<header class="ds-bar" data-ds-bar x-data="{ panel: null }" @keydown.escape.window="panel = null">
      ${left ? toggleHtml(left) : ""}
      <div class="ds-toolbar" data-ds-toolbar>
        ${statusHtml()}
        ${pagesMenuHtml()}
        <div class="ds-bar-view">
          <button type="button" class="ds-comment-toggle" data-ds-comment-toggle title="${text.commentKeyTip}" :aria-pressed="String($store.comment.on)" @click="$store.comment.on = !$store.comment.on">${icons.comment}<span class="ds-comment-toggle-label">${text.comment}</span></button>
          ${segmentedHtml("viewport", ["desktop", "tablet", "mobile"].map((value) => [value, icons[value], text[value]]))}
          ${segmentedHtml("theme", ["light", "dark"].map((value) => [value, themeLabel(value), theme.derived === value ? `${text[value]} — ${text.derived}` : text[value]]))}
          <button type="button" class="ds-shell-hide" data-ds-shell-hide title="${text.hideShell}" aria-label="${text.hideShell}" @click="$store.shell.hidden = true">${icons.expand}</button>
        </div>
      </div>
      ${right ? toggleHtml(right) : ""}
      ${panels.map(panelHtml).join("")}
    </header>
    <div class="ds-frame-wrap" x-show="$store.design.viewport !== 'desktop'"></div>
    <button type="button" class="ds-shell-show" data-ds-shell-show title="${text.showShell}" aria-label="${text.showShell}" @click="$store.shell.hidden = false">${icons.shrink}<i class="ds-shell-show-dot"></i></button>`;
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
      frame.addEventListener("load", () => {
        frame.contentWindow.postMessage({ type: "design:set", values: JSON.parse(JSON.stringify(Alpine.store("design"))) }, "*");
        syncComment();
        syncShell();
      });
      wrap.append(frame);
    }
    Object.assign(frame.style, { width: `${size.width}px`, height: `${size.height}px` });
    frame.contentWindow?.postMessage({ type: "design:set", values: { ...values, viewport: "desktop" } }, "*");
  }

  // Trang cha nhận từ khung mobile / tablet: sang màn khác, chữ vừa gõ, người xem vào hay rời ô gõ (để tự tải lại đợi).
  window.addEventListener("message", (event) => {
    if (isFrame || !window.Alpine) return;
    if (event.data?.type === "design:go" && pages.some((page) => page.file === event.data.file)) location.href = `${event.data.file}${location.search}`;
    if (event.data?.type === "design:form") Alpine.store("design").form = event.data.form;
    if (event.data?.type === "design:typing") {
      frameTyping = Boolean(event.data.typing);
      reloadIfDoneTyping();
    }
    if (event.data?.type === "design:comment-off") Alpine.store("comment").on = false;
    if (event.data?.type === "design:comment-toggle") Alpine.store("comment").on = !Alpine.store("comment").on;
    if (event.data?.type === "design:shell-toggle") Alpine.store("shell").hidden = !Alpine.store("shell").hidden;
  });
  // Trang cha không đọc được vào iframe trên file://, nên khung mobile / tablet tự báo khi con trỏ vào hay rời ô gõ.
  const reportTyping = () => isFrame && setTimeout(() => parent.postMessage({ type: "design:typing", typing: typingHere() }, "*"), 0);
  if (isFrame) {
    document.addEventListener("focusin", reportTyping);
    document.addEventListener("focusout", reportTyping);
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

  // Chế độ comment. Chạy ở nơi vẽ bản thiết kế: khổ desktop là trang cha, khổ tablet / mobile là iframe (trang cha gửi
  // lệnh bật tắt bằng postMessage kèm khổ thật). Bật thì cú bấm vào #design không tới page: bấm chọn khối dưới con trỏ,
  // kéo quá 6px chọn hình chữ nhật (khối của vùng là khối nhỏ nhất chứa trọn nó), rồi mở ô viết ngay dưới chỗ chọn.
  // Gửi: đọc _comment-bridge.js (new-design.mjs comment-bridge ghi), hỏi GET /health, POST /comment body text/plain
  // (Chrome không gửi request kiểm trước). Cầu nối tắt theo session, nên /health lỗi nghĩa là session đã đóng: ô comment
  // chỉ cách mở lại session cũ hay mở session mới, nút Chép prompt đưa vào bộ nhớ tạm một prompt mang comment kèm chỗ
  // chọn. Ghim: đọc comments.js mỗi 2 giây như .progress.js; ghim đã sửa chỉ hiện khi đang bật chế độ comment.
  const comments = { active: false, viewport: "desktop", bridge: { state: "none", info: null }, list: [], timer: null, polling: false };
  const commentKey = `ds-comment:${currentFile}`;
  const commentUi = (className, html = "") => {
    const element = document.createElement("div");
    element.className = `ds-comment-ui ${className}`;
    element.innerHTML = html;
    document.body.append(element);
    return element;
  };
  const designRoot = () => document.querySelector("#design") ?? document.body;
  const inDesign = (target) => target instanceof Element && !target.closest(".ds-comment-ui") && designRoot().contains(target);

  // Đọc lại một file .js cạnh page bằng thẻ <script> mới: trên file:// không có cách khác. Trả về false khi không có file.
  const loadScript = (name) =>
    new Promise((resolve) => {
      const tag = document.createElement("script");
      tag.src = `${name}?t=${Date.now()}`;
      tag.onload = () => (tag.remove(), resolve(true));
      tag.onerror = () => (tag.remove(), resolve(false));
      document.head.append(tag);
    });
  // Bốn trạng thái: inbox (cầu nối sống, đánh thức được session), saved (cầu nối sống, không có hộp thư), closed (có file
  // mà cầu nối không trả lời: session đã đóng), none (chưa từng có cầu nối).
  async function checkBridge() {
    window.DS_COMMENT_BRIDGE = null;
    const info = (await loadScript("_comment-bridge.js")) ? window.DS_COMMENT_BRIDGE : null;
    if (!info?.port) return (comments.bridge = { state: "none", info: null });
    const health = await fetch(`http://127.0.0.1:${info.port}/health`, { signal: AbortSignal.timeout(1500) }).then((res) => (res.ok ? res.json() : null), () => null);
    return (comments.bridge = { state: health ? (health.wake === "inbox" ? "inbox" : "saved") : "closed", info });
  }
  // Thư mục design là thư mục của page; thư mục dự án là chỗ session đã chạy, hay chỗ chứa .design/ khi chưa có session.
  const designDir = () => decodeURIComponent(location.pathname).replace(/\/[^/]*$/, "");
  const projectDir = () => comments.bridge.info?.session?.cwd ?? designDir().replace(/\/\.design\/.*$/, "");
  function bridgeMessage() {
    const { state, info } = comments.bridge;
    if (state === "inbox") return escapeHtml(text.bridgeInbox);
    if (state === "saved") return escapeHtml(text.bridgeSaved);
    const code = (value) => `<code>${escapeHtml(value)}</code>`;
    const lines = (...items) => items.filter(Boolean).map((item) => `<div>${item}</div>`).join("");
    if (state === "none") return lines(`<b>${escapeHtml(text.bridgeNone)}</b>`, `${escapeHtml(text.bridgeOpen)} ${code(projectDir())}, ${escapeHtml(text.bridgeOpenPaste)}`);
    const session = info.session ?? {};
    const at = info.endedAt ? ` ${text.bridgeAt} ${new Date(info.endedAt).toLocaleTimeString(lang === "en" ? "en-GB" : "vi-VN", { hour: "2-digit", minute: "2-digit" })}` : "";
    const where = [session.entry === "claude-vscode" ? "VS Code" : session.entry === "cli" ? "terminal" : session.entry, session.id && `${text.bridgeCode} ${session.id.slice(0, 8)}`].filter(Boolean).join(" · ");
    const resume = session.id ? `${code(`claude --resume ${session.id}`)} ${text.bridgeTerminal}` : "";
    const reopen = session.id ? `${text.bridgeReopen}: ${session.entry === "claude-vscode" ? `${text.bridgeVscode} ` : ""}${resume}.` : "";
    return lines(`<b>${escapeHtml(text.bridgeClosed + at)}${where ? ` (${escapeHtml(where)})` : ""}.</b>`, reopen, `${escapeHtml(text.bridgeNew)} ${code(projectDir())}.`, escapeHtml(text.bridgePaste));
  }

  function cssPath(element) {
    const parts = [];
    for (let node = element; node && node !== designRoot() && node !== document.body; node = node.parentElement) {
      if (node.id) {
        parts.unshift(`#${CSS.escape(node.id)}`);
        return parts.join(" > ");
      }
      const same = [...(node.parentElement?.children ?? [])].filter((child) => child.tagName === node.tagName);
      parts.unshift(`${node.tagName.toLowerCase()}${same.length > 1 ? `:nth-of-type(${same.indexOf(node) + 1})` : ""}`);
    }
    return [designRoot().id ? `#${designRoot().id}` : "body", ...parts].join(" > ");
  }
  const docRect = (rect) => ({ x: rect.left + scrollX, y: rect.top + scrollY, w: rect.width, h: rect.height });
  function areaElement(rect) {
    let node = document.elementFromPoint(rect.left + rect.width / 2, rect.top + rect.height / 2);
    while (node && node !== designRoot()) {
      const box = node.getBoundingClientRect();
      if (box.left <= rect.left + 2 && box.top <= rect.top + 2 && box.right >= rect.right - 2 && box.bottom >= rect.bottom - 2) return node;
      node = node.parentElement;
    }
    return designRoot();
  }
  function targetOf(element, kind, rect) {
    return {
      kind,
      selector: cssPath(element),
      block: element.closest("[data-block]")?.dataset.block ?? "",
      text: (element.innerText ?? "").replace(/\s+/g, " ").trim().slice(0, 200),
      rect: docRect(rect),
    };
  }
  function currentValues() {
    const values = JSON.parse(JSON.stringify(Alpine.store("design")));
    if (isFrame) values.viewport = comments.viewport;
    return values;
  }

  // shell.js nạp trong <head>: các lớp phủ tạo lúc alpine:init, khi đã có <body>.
  let hoverBox, dragBox, pinLayer, commentHint;
  function initCommentUi() {
    hoverBox = commentUi("ds-comment-hover");
    dragBox = commentUi("ds-comment-drag");
    pinLayer = commentUi("ds-comment-pins");
    if (!isFrame) commentHint = commentUi("ds-comment-hint", escapeHtml(text.commentHint));
  }
  // Khung chọn, khung rê và ô viết đặt theo toạ độ trang (position: absolute), không theo màn hình: page cuộn thì chúng
  // trôi theo khối đã chọn. rect nhận vào là toạ độ màn hình (getBoundingClientRect).
  const placeBox = (box, rect) => Object.assign(box.style, { left: `${rect.left + scrollX}px`, top: `${rect.top + scrollY}px`, width: `${rect.width}px`, height: `${rect.height}px`, display: "block" });

  let popover = null;
  function closePopover() {
    popover?.remove();
    popover = null;
    commentOpen = false;
    dragBox.style.display = "none";
    reportTyping();
    reloadIfDoneTyping();
  }
  async function openPopover(target, rect) {
    closePopover();
    commentOpen = true;
    reportTyping();
    placeBox(dragBox, rect);
    const where = target.kind === "area" ? text.area : target.block ? `${text.block} ${target.block}` : target.selector.split(" > ").pop();
    popover = commentUi("ds-comment-popover", `<div class="ds-comment-where">${text.comment} · ${escapeHtml(where)}</div>
      <textarea rows="3" placeholder="${text.commentPlaceholder}"></textarea>
      <div class="ds-comment-state" data-ds-comment-state></div>
      <div class="ds-comment-actions"><button type="button" data-act="cancel">${text.cancel}</button><button type="button" data-act="copy">${text.copy}</button><button type="button" data-act="send" class="ds-comment-send" disabled>${text.send}</button><button type="button" data-act="prompt" class="ds-comment-send" disabled>${text.copyPrompt}</button></div>`);
    // Ô rộng 320px khi gửi được; không có cầu nối thì rộng 400px cho phần chỉ đường. Đặt dưới chỗ chọn, thiếu chỗ thì lên trên.
    // Toạ độ trang lấy lúc mở: lần đặt lại sau khi hỏi cầu nối không lệch dù page đã cuộn trong lúc chờ.
    const at = { left: rect.left + scrollX, top: rect.top + scrollY, bottom: rect.bottom + scrollY, viewTop: rect.top, viewBottom: rect.bottom, scrollY };
    const place = (wide) => {
      const width = Math.min(wide ? 400 : 320, root.clientWidth - 16);
      popover.style.width = `${width}px`;
      popover.style.left = `${Math.max(8, Math.min(at.left - scrollX, root.clientWidth - width - 8)) + scrollX}px`;
      const height = popover.offsetHeight;
      const above = at.viewBottom + 8 + height > innerHeight;
      popover.style.top = `${above ? Math.max(at.scrollY + 8, at.top - height - 8) : at.bottom + 8}px`;
    };
    const area = popover.querySelector("textarea");
    const state = popover.querySelector("[data-ds-comment-state]");
    const sendButton = popover.querySelector('[data-act="send"]');
    const promptButton = popover.querySelector('[data-act="prompt"]');
    const copyButton = popover.querySelector('[data-act="copy"]');
    place(!["inbox", "saved"].includes(comments.bridge.state));
    area.focus({ preventScroll: true });
    const payload = () => ({ page: currentFile, url: queryFor(currentValues()), viewport: currentValues().viewport, theme: currentValues().theme, target, body: area.value.trim() });
    // Cầu nối sống: Huỷ · Chép · Gửi. Không có cầu nối: Huỷ · Chép prompt.
    const showListen = () => {
      const live = ["inbox", "saved"].includes(comments.bridge.state);
      state.innerHTML = bridgeMessage();
      state.dataset.bridge = comments.bridge.state;
      sendButton.hidden = copyButton.hidden = !live;
      promptButton.hidden = live;
      sendButton.disabled = promptButton.disabled = !area.value.trim();
      place(!live);
    };
    area.addEventListener("input", showListen);
    showListen();
    checkBridge().then(() => popover && showListen());
    const send = async () => {
      if (sendButton.disabled || sendButton.hidden) return;
      sendButton.disabled = true;
      state.textContent = text.sending;
      const body = payload();
      const { info } = comments.bridge;
      const res = await fetch(`http://127.0.0.1:${info.port}/comment`, { method: "POST", headers: { "Content-Type": "text/plain" }, body: JSON.stringify({ ...body, token: info.token }) }).catch(() => null);
      if (res?.status !== 201) {
        await checkBridge();
        showListen();
        state.textContent = `${text.sendFailed}${res ? ` (${res.status})` : ""} · ${state.textContent}`;
        return;
      }
      const { id } = await res.json();
      comments.list = [...comments.list.filter((item) => item.id !== id), { id, ...body, status: "sent" }];
      closePopover();
      renderPins();
      watchComments();
    };
    popover.addEventListener("click", async (event) => {
      const act = event.target.closest("[data-act]")?.dataset.act;
      if (act === "cancel") closePopover();
      if (act === "send") send();
      if (act === "copy" || (act === "prompt" && !promptButton.disabled)) {
        const body = payload();
        const place = `${where} \`${target.selector}\`${target.text ? ` "${target.text}"` : ""}`;
        // Prompt dán được vào session cũ lẫn session mới: dòng đầu gọi skill, dòng comment-json để agent ghi bằng comment --add.
        const line =
          act === "copy"
            ? `Comment trên ${body.page}${body.url} · ${place}: ${body.body}`
            : [
                "/design-uiux Sửa page theo comment chép từ page, rồi bật lại cầu nối comment.",
                `Thư mục design: ${designDir()}`,
                `Page: ${body.page}${body.url}`,
                `Chỗ chọn: ${place}`,
                `Comment: ${body.body}`,
                `comment-json: ${JSON.stringify(body)}`,
              ].join("\n");
        try {
          await navigator.clipboard.writeText(line);
        } catch {
          const copy = Object.assign(document.createElement("textarea"), { value: line });
          popover.append(copy);
          copy.select();
          document.execCommand("copy");
          copy.remove();
        }
        state.textContent = text.copied;
      }
    });
    area.addEventListener("keydown", (event) => {
      if (event.key === "Enter" && (event.metaKey || event.ctrlKey)) send();
    });
  }

  // Ghim: số comment, màu theo trạng thái, ở góc trên phải của khối (theo selector) hay của vùng đã lưu.
  function renderPins() {
    const shown = comments.list.filter((item) => item.page === currentFile && (item.status !== "done" || comments.active));
    pinLayer.innerHTML = shown
      .map((item) => {
        let rect = item.target?.rect ?? { x: 0, y: 0, w: 0, h: 0 };
        if (item.target?.kind === "element") {
          try {
            const element = document.querySelector(item.target.selector);
            if (element?.getClientRects().length) rect = docRect(element.getBoundingClientRect());
          } catch {}
        }
        const label = `#${item.id} · ${text.commentStatus[item.status] ?? item.status}: ${item.body}`;
        // Kẹp trong bề rộng trang: rect lưu từ màn rộng hơn (khối đã bị xoá) không được đẩy trang cuộn ngang.
        const left = Math.max(0, Math.min(Math.round(rect.x + rect.w - 11), root.clientWidth - 32));
        return `<span class="ds-comment-pin" data-status="${escapeHtml(item.status)}" style="left:${left}px;top:${Math.max(0, Math.round(rect.y - 11))}px" title="${escapeHtml(label)}">${item.id}</span>`;
      })
      .join("");
  }
  async function readComments() {
    window.DS_COMMENTS = null;
    if (!(await loadScript("comments.js"))) return false;
    if (Array.isArray(window.DS_COMMENTS)) comments.list = window.DS_COMMENTS;
    renderPins();
    return true;
  }
  // Đọc comments.js lần đầu lúc mở page; có file, hay đang bật chế độ comment, thì đọc lại mỗi 2 giây.
  function watchComments() {
    if (comments.polling) return;
    comments.polling = true;
    comments.timer = setInterval(() => document.visibilityState === "visible" && readComments(), 2000);
  }

  let drag = null;
  const block = (event) => {
    if (!comments.active || !inDesign(event.target)) return;
    event.preventDefault();
    event.stopPropagation();
  };
  function setCommentActive(on) {
    comments.active = on;
    root.toggleAttribute("data-commenting", on);
    hoverBox.style.display = "none";
    if (!on) closePopover();
    if (on) watchComments();
    renderPins();
  }
  const dragRect = () => new DOMRect(drag.page.x - scrollX, drag.page.y - scrollY, drag.page.w, drag.page.h);
  // Cuộn thì khối dưới con trỏ đổi mà chưa có pointermove: ẩn khung rê, rê chuột lại thì hiện.
  window.addEventListener("scroll", () => !drag && hoverBox && (hoverBox.style.display = "none"), true);
  window.addEventListener("pointermove", (event) => {
    if (!comments.active || popover || !hoverBox) return;
    // Kéo: điểm đầu và điểm cuối theo toạ độ trang, nên cuộn giữa lúc kéo vẫn ra đúng vùng.
    if (drag) {
      drag.page = { x: Math.min(drag.x, event.pageX), y: Math.min(drag.y, event.pageY), w: Math.abs(event.pageX - drag.x), h: Math.abs(event.pageY - drag.y) };
      if (drag.page.w > 6 || drag.page.h > 6) placeBox(dragBox, dragRect()), (hoverBox.style.display = "none");
      return;
    }
    if (inDesign(event.target)) placeBox(hoverBox, event.target.getBoundingClientRect());
    else hoverBox.style.display = "none";
  }, true);
  window.addEventListener("pointerdown", (event) => {
    if (!comments.active || !inDesign(event.target) || event.button !== 0) return;
    block(event);
    if (popover) return closePopover();
    drag = { x: event.pageX, y: event.pageY, target: event.target, page: null };
  }, true);
  window.addEventListener("pointerup", (event) => {
    if (!drag) return;
    block(event);
    const { target, page } = drag;
    const rect = page && dragRect();
    drag = null;
    hoverBox.style.display = "none";
    if (page && (page.w > 6 || page.h > 6)) openPopover(targetOf(areaElement(rect), "area", rect), rect);
    else openPopover(targetOf(target, "element", target.getBoundingClientRect()), target.getBoundingClientRect());
  }, true);
  for (const type of ["click", "mousedown", "mouseup", "dblclick", "submit", "contextmenu"]) window.addEventListener(type, block, true);
  // Phím C bật tắt chế độ comment, như công cụ comment của Figma. Không dùng Ctrl+C: đó là chép. Đang gõ trong ô nhập
  // hay ô viết comment thì C là chữ c. Trong khung mobile / tablet, phím nhấn trong iframe nhờ trang cha bật tắt.
  window.addEventListener("keydown", (event) => {
    if (event.key.toLowerCase() !== "c" || event.ctrlKey || event.metaKey || event.altKey || event.repeat || event.defaultPrevented) return;
    if (popover || document.activeElement?.matches?.(typingSelector)) return;
    event.preventDefault();
    if (isFrame) parent.postMessage({ type: "design:comment-toggle" }, "*");
    else Alpine.store("comment").on = !Alpine.store("comment").on;
  });
  // Esc: ô viết đang mở thì đóng ô (con trỏ ở ô viết hay ở nút), không thì thoát chế độ comment.
  window.addEventListener("keydown", (event) => {
    if (!comments.active || event.key !== "Escape") return;
    if (popover) return closePopover();
    if (isFrame) parent.postMessage({ type: "design:comment-off" }, "*");
    else Alpine.store("comment").on = false;
  });
  window.addEventListener("resize", () => pinLayer && renderPins());

  // Ẩn shell: phím \ bật tắt, như Cmd+\ của Figma; nhận cả khi có Ctrl, Cmd, Alt vì vài bàn phím gõ \ bằng Alt. Esc
  // không hiện lại shell: người xem ẩn shell để xem modal của page, Esc đóng modal thì shell bật lại ngoài ý muốn. Đang
  // gõ hay đang viết comment thì \ là chữ. Trong khung mobile / tablet, phím nhấn trong iframe nhờ trang cha bật tắt.
  window.addEventListener("keydown", (event) => {
    if (event.key !== "\\" || event.repeat || event.defaultPrevented) return;
    if (popover || document.activeElement?.matches?.(typingSelector)) return;
    event.preventDefault();
    if (isFrame) parent.postMessage({ type: "design:shell-toggle" }, "*");
    else Alpine.store("shell").hidden = !Alpine.store("shell").hidden;
  });
  // Trang cha: ẩn shell thì tắt chế độ comment (nó chặn cú bấm vào page), báo khung mobile / tablet để ẩn ghim trong
  // khung, hiện lại thì đo lại mép thanh vì lúc ẩn thanh không có bề rộng.
  function syncShell() {
    if (isFrame || !window.Alpine) return;
    const hidden = Alpine.store("shell").hidden;
    root.toggleAttribute("data-shell-hidden", hidden);
    try {
      sessionStorage.setItem(shellKey, hidden ? "1" : "0");
    } catch {}
    if (hidden) Alpine.store("comment").on = false;
    else requestAnimationFrame(() => alignBar(Alpine.store("design").viewport));
    frame?.contentWindow?.postMessage({ type: "design:shell", hidden }, "*");
  }
  window.addEventListener("message", (event) => {
    if (isFrame && event.data?.type === "design:shell") root.toggleAttribute("data-shell-hidden", Boolean(event.data.hidden));
  });

  // Trang cha: chế độ comment chạy ở đây khi khổ desktop, trong iframe khi khổ tablet / mobile; nhắc cách dùng ở đáy màn.
  function syncComment() {
    if (isFrame || !window.Alpine) return;
    const on = Alpine.store("comment").on;
    const viewport = Alpine.store("design").viewport;
    try {
      sessionStorage.setItem(commentKey, on ? "1" : "0");
    } catch {}
    commentHint.style.display = on ? "block" : "none";
    setCommentActive(on && viewport === "desktop");
    frame?.contentWindow?.postMessage({ type: "design:comment", on: on && viewport !== "desktop", viewport }, "*");
  }
  window.addEventListener("message", (event) => {
    if (!isFrame || event.data?.type !== "design:comment") return;
    comments.viewport = event.data.viewport;
    setCommentActive(Boolean(event.data.on));
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
    initCommentUi();
    Alpine.store("design", state);
    let commentWasOn = false;
    try {
      commentWasOn = !isFrame && sessionStorage.getItem(commentKey) === "1";
    } catch {}
    Alpine.store("comment", { on: commentWasOn });
    Alpine.store("shell", { hidden: shellWasHidden });
    if (!document.body.hasAttribute("x-data")) document.body.setAttribute("x-data", "");
    if (!isFrame) {
      document.body.insertAdjacentHTML("afterbegin", toolbarHtml());
      helpTip();
    }
    Alpine.effect(() => {
      const form = JSON.stringify(Alpine.store("design").form ?? {});
      try {
        sessionStorage.setItem(formKey, form);
      } catch {}
      if (isFrame) parent.postMessage({ type: "design:form", form: JSON.parse(form) }, "*");
    });
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
      Alpine.effect(() => {
        Alpine.store("comment").on;
        Alpine.store("design").viewport;
        syncComment();
      });
      Alpine.effect(() => {
        Alpine.store("shell").hidden;
        syncShell();
      });
    }
  });
  document.addEventListener("alpine:initialized", () => {
    watchIcons();
    restoreScroll();
    if (!isFrame) watchProgress();
    readComments().then((found) => found && watchComments());
  });
})();
