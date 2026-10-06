// Kiểm bằng code phần đo được của nguyên tắc (N) và giới hạn (G) trong ../principles.md. check.mjs gọi file này;
// mỗi lỗi mang ID luật để agent mở đúng mục trong principles.md. Phần máy không đo được là dòng "Tự kiểm" ở đó.
//
// Bốn lượt:
//   - tĩnh: đọc từng dòng page (staticIssues)
//   - trang: chạy trong trang ở mọi tổ hợp check.mjs đo (pageProbe, truyền vào page.evaluate nên phải tự đủ, không
//     gọi hàm ngoài)
//   - bấm: rê và bấm từng loại thứ bấm được (hoverShift, rowRects, afterClick)
//   - thư mục: gom kết quả mọi page (folderIssues)
//
// Luật nào trong principles.md cũng phải có ít nhất một dòng trong `checks`; check.mjs so hai bên, lệch thì dừng.

export const checks = [
  { rule: "G1", pass: "tĩnh", what: "class màu của bảng Tailwind" },
  { rule: "G3", pass: "tĩnh", what: "text-[…] · leading-[…] · tracking-[…] · style font-size" },
  { rule: "G4", pass: "tĩnh", what: "p-[…] · m-[…] · gap-[…] · space-[…] · style padding/margin/gap" },
  { rule: "G5", pass: "tĩnh", what: "rounded-[…] · style border-radius" },
  { rule: "G6", pass: "tĩnh", what: "shadow-[…] · style box-shadow" },
  { rule: "N11", pass: "tĩnh", what: "số âm không có ghi chú" },
  { rule: "N13", pass: "trang", what: "tương phản chữ và placeholder" },
  { rule: "N5", pass: "trang", what: "khối màu không chữ" },
  { rule: "G1", pass: "trang", what: "màu phụ hay màu ngoài design system ngoài [data-chart]" },
  { rule: "G7", pass: "trang", what: "số màu viền" },
  { rule: "G2", pass: "trang", what: "font ngoài --font-*" },
  { rule: "G3", pass: "trang", what: "cỡ chữ ngoài thang · một h1 · h1 > h2 > h3" },
  { rule: "G9", pass: "trang", what: "ký tự mỗi dòng" },
  { rule: "N12", pass: "trang", what: "cỡ chữ trong khối lặp · h3 cắt một dòng" },
  { rule: "N9", pass: "trang", what: "chữ cắt: title, phần còn lại, số bị giấu" },
  { rule: "N4", pass: "trang", what: "một nút chính mỗi khối · absolute chồng · câu lặp" },
  { rule: "G5", pass: "trang", what: "bo góc ngoài thang · bo con lớn hơn cha" },
  { rule: "G6", pass: "trang", what: "bóng trên khối trong trang" },
  { rule: "G8", pass: "trang", what: "tầng khung lồng nhau" },
  { rule: "N6", pass: "trang", what: "đơn vị số trong khối lặp" },
  { rule: "N1", pass: "trang", what: "hộp thoại: role, nút đóng, nút chính phải nhất · ô required có * đỏ" },
  { rule: "N3", pass: "trang", what: "thứ đang chọn khác thứ chưa chọn" },
  { rule: "N7", pass: "trang", what: "state empty / error có nút làm tiếp" },
  { rule: "N10", pass: "trang", what: "@click tới được bằng phím · cursor · vùng bấm 32px" },
  { rule: "N2", pass: "bấm", what: "rê và bấm không làm xô phần tử khác" },
  { rule: "N8", pass: "bấm", what: "form tạo mới mở ra trống" },
  { rule: "N9", pass: "bấm", what: "lớp nổi không che nút mở nó" },
  { rule: "G10", pass: "thư mục", what: "số dạng nút" },
];

// ---------- design system ----------

const tailwindText = [12, 14, 16, 18, 20, 24, 30, 36, 48, 60, 72, 96, 128];
const tailwindRadius = [2, 4, 6, 8, 12, 16, 24, 32];
const toPx = (value) => {
  const number = parseFloat(value);
  if (Number.isNaN(number)) return null;
  return /rem\s*$/.test(value) ? number * 16 : number;
};

// Tên token và thang lấy từ tokens.js (khối @theme do tokens.mjs sinh). Không có thang chữ, bo góc thì dùng thang Tailwind.
export function readTokens(source) {
  const names = (group) => [...new Set([...source.matchAll(new RegExp(`--${group}-([a-z0-9-]+):\\s*([^;\\\\]+);`, "g"))]
    .filter((match) => !match[1].includes("--"))
    .map((match) => [match[1], match[2].trim()]))];
  const unique = (pairs) => [...new Map(pairs).entries()];
  const text = unique(names("text")).map(([, value]) => toPx(value)).filter((px) => px !== null);
  const radius = unique(names("radius")).map(([, value]) => toPx(value)).filter((px) => px !== null && px < 1000);
  return {
    colors: unique(names("color")).map(([name]) => name),
    fonts: unique(names("font")).map(([name]) => name),
    textScale: text.length ? [...new Set(text)].sort((a, b) => a - b) : tailwindText,
    radiusScale: radius.length ? [...new Set(radius)].sort((a, b) => a - b) : tailwindRadius,
  };
}

// Bảng "Giới hạn nhường cho design system" trong mục ## Design system của brief.md.
export function readYielded(brief, knownRules) {
  const problems = [];
  const part = brief.split(/^### Giới hạn nhường cho design system\s*$/m)[1];
  if (part === undefined) return { yielded: [], problems: ['thiếu "### Giới hạn nhường cho design system" trong ## Design system (principles.md, "Thứ tự ưu tiên")'] };
  const section = part.split(/^##+ /m)[0];
  const rows = section.split("\n").filter((line) => line.trim().startsWith("|")).slice(2)
    .map((line) => line.trim().replace(/^\||\|$/g, "").split("|").map((cell) => cell.trim().replace(/`/g, "")));
  if (!rows.length && !/Không có\./.test(section)) problems.push('bảng "Giới hạn nhường cho design system" trống mà không ghi "Không có."');
  const yielded = [];
  for (const [rule = "", says = "", proof = ""] of rows) {
    if (!/^G\d+$/.test(rule) || !knownRules.includes(rule)) problems.push(`giới hạn nhường "${rule}" không phải một G trong principles.md (nguyên tắc N không nhường được)`);
    else if (!proof || !says) problems.push(`giới hạn nhường ${rule} thiếu "Design system nói" hay "Dẫn chứng"`);
    else yielded.push(rule);
  }
  return { yielded, problems };
}

// ---------- lượt tĩnh ----------

const variantPrefix = "(?:[a-z0-9@\\[\\]&_:-]+:)*";
const arbitraryPattern = new RegExp(`(?<![\\w\\[-])${variantPrefix}(-?)(text|leading|tracking|p[trblxyse]?|m[trblxyse]?|gap(?:-[xy])?|space-[xy]|rounded(?:-[a-z]+)?|shadow)-\\[([^\\]\\s"']+)\\]`, "g");
const paletteNames = "slate|gray|zinc|neutral|stone|red|orange|amber|yellow|lime|green|emerald|teal|cyan|sky|blue|indigo|violet|purple|fuchsia|pink|rose";
const palettePattern = new RegExp(`(?<![\\w-])${variantPrefix}(?:bg|text|border(?:-[trblxy])?|ring|fill|stroke|from|via|to|outline|divide|decoration|accent|caret|shadow|placeholder)-(?:${paletteNames})-\\d{2,3}(?:\\/\\d+)?(?![\\w-])`, "g");
const negativePattern = new RegExp(`(?<![\\w-])${variantPrefix}-(?:m[trblxyse]?|space-[xy]|translate-[xy]|inset(?:-[xy])?|top|left|right|bottom|start|end)-[\\w./\\[\\]]+`, "g");
const styleProperty = [
  [/font-size|fontSize|line-height|lineHeight|letter-spacing|letterSpacing/, "G3"],
  [/padding|margin|(?<![-\w])gap/, "G4"],
  [/border-radius|borderRadius/, "G5"],
  [/box-shadow|boxShadow/, "G6"],
];
const arbitraryRule = (utility) => (/^(text|leading|tracking)$/.test(utility) ? "G3" : /^rounded/.test(utility) ? "G5" : utility === "shadow" ? "G6" : "G4");

export function staticIssues(html) {
  const issues = [];
  const lines = html.split("\n");
  // Dòng nằm trong <script>: style trong chuỗi JS (câu báo của khuôn) không phải style của page.
  let inScript = false;
  const scriptLines = lines.map((line) => {
    const opens = /<script\b(?![^>]*\bsrc=)[^>]*>/.test(line) && !/<\/script>/.test(line.split(/<script\b[^>]*>/)[1] ?? "");
    const was = inScript;
    if (opens) inScript = true;
    if (/<\/script>/.test(line)) inScript = false;
    return was || opens;
  });
  lines.forEach((line, index) => {
    const lineNo = index + 1;
    for (const match of line.matchAll(arbitraryPattern)) {
      // text-[#…] là mã màu, check.mjs đã báo riêng.
      if (match[2] === "text" && /^(#|rgb|hsl|oklch|color)/.test(match[3])) continue;
      const rule = arbitraryRule(match[2]);
      const hint = rule === "G3" ? "dùng token chữ của design system" : rule === "G5" ? "dùng bo góc trong thang --radius-*" : rule === "G6" ? "bóng lấy từ token --shadow-*, chỉ cho lớp nổi" : "dùng class trong thang; căn chữ với icon bằng items-* hay leading";
      issues.push({ rule, line: lineNo, message: `giá trị tự đặt ngoài thang \`${match[0].trim()}\` — ${hint}` });
    }
    for (const match of line.matchAll(palettePattern)) {
      issues.push({ rule: "G1", line: lineNo, message: `màu của bảng Tailwind \`${match[0]}\` — màu chỉ lấy từ token trong tokens.js` });
    }
    for (const attribute of scriptLines[index] ? [] : line.matchAll(/(?:^|\s)(?::style|x-bind:style|style)="([^"]*)"/g)) {
      for (const [pattern, rule] of styleProperty) {
        if (new RegExp(`(?:^|[\\s{;,'"])(?:${pattern.source})\\s*:`).test(attribute[1])) {
          issues.push({ rule, line: lineNo, message: `thuộc tính style đặt ${attribute[1].match(new RegExp(pattern.source))[0]} — dùng class trong thang` });
        }
      }
    }
    const noted = /<!--|\/\/|\/\*/.test(line) || /<!--|\/\/|\/\*/.test(lines.slice(0, index).reverse().find((previous) => previous.trim()) ?? "");
    if (!noted) {
      // Class nằm trong x-transition* là điểm bắt đầu trượt vào, không tính.
      const transitionSpans = [...line.matchAll(/x-transition[\w:.-]*="[^"]*"/g)].map((match) => [match.index, match.index + match[0].length]);
      for (const match of line.matchAll(negativePattern)) {
        if (transitionSpans.some(([start, end]) => match.index >= start && match.index < end)) continue;
        issues.push({ rule: "N11", line: lineNo, message: `số âm \`${match[0].trim()}\` không có ghi chú — ghi <!-- lý do --> ngay dòng trên, hay căn bằng gap / items-* / khối w-0 flex justify-center` });
      }
    }
  });
  return issues;
}

// ---------- lượt trang ----------

// Chạy trong trang, sau khi check.mjs chờ hiệu ứng chuyển (transition) chạy xong: màu đo giữa chừng không khớp token.
// ctx: { colors, fonts, textScale, radiusScale, skip, width, state }.
// Trả { issues: [{ rule, message }], buttons: [{ sig, label }], blocks: { id: { text, actionable } } }.
export function pageProbe(ctx) {
  const issues = [];
  const seen = new Set();
  const perRule = {};
  const add = (rule, message) => {
    if (ctx.skip.includes(rule) || seen.has(message)) return;
    perRule[rule] = (perRule[rule] ?? 0) + 1;
    if (perRule[rule] > 8) return;
    seen.add(message);
    issues.push({ rule, message });
  };
  const main = document.querySelector("#design");
  if (!main) return { issues, buttons: [], blocks: {} };

  // ----- màu -----
  const clamp = (value) => Math.max(0, Math.min(255, value));
  const fromOklab = (L, A, B, alpha) => {
    const l = (L + 0.3963377774 * A + 0.2158037573 * B) ** 3;
    const m = (L - 0.1055613458 * A - 0.0638541728 * B) ** 3;
    const s = (L - 0.0894841775 * A - 1.291485548 * B) ** 3;
    const gamma = (x) => (x <= 0.0031308 ? 12.92 * x : 1.055 * Math.sign(x) * Math.abs(x) ** (1 / 2.4) - 0.055);
    return {
      r: clamp(gamma(4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s) * 255),
      g: clamp(gamma(-1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s) * 255),
      b: clamp(gamma(-0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s) * 255),
      a: alpha,
    };
  };
  const toOklab = ({ r, g, b }) => {
    const linear = (x) => { x /= 255; return x <= 0.04045 ? x / 12.92 : ((x + 0.055) / 1.055) ** 2.4; };
    const [R, G, B] = [linear(r), linear(g), linear(b)];
    const l = Math.cbrt(0.4122214708 * R + 0.5363015719 * G + 0.0514459929 * B);
    const m = Math.cbrt(0.2119034982 * R + 0.6806995451 * G + 0.1073969566 * B);
    const s = Math.cbrt(0.0883024619 * R + 0.2817188376 * G + 0.6299787005 * B);
    return { L: 0.2104542553 * l + 0.793617785 * m - 0.0040720468 * s, A: 1.9779984951 * l - 2.428592205 * m + 0.4505937099 * s, B: 0.0259040371 * l + 0.7827717662 * m - 0.808675766 * s };
  };
  const chroma = (color) => { const { A, B } = toOklab(color); return Math.hypot(A, B); };
  const number = (value, scale = 1) => (value === "none" ? 0 : value.endsWith("%") ? (parseFloat(value) / 100) * scale : parseFloat(value));
  const canvas = document.createElement("canvas").getContext("2d", { willReadFrequently: true });
  const cache = new Map();
  const parse = (raw) => {
    const value = (raw ?? "").trim();
    if (!value || value === "transparent" || value === "none") return null;
    if (cache.has(value)) return cache.get(value);
    let color = null;
    const parts = (inner) => inner.replace(/\//g, " ").split(/[\s,]+/).filter(Boolean);
    let match;
    if ((match = value.match(/^#([0-9a-f]{3,8})$/i))) {
      let hex = match[1];
      if (hex.length <= 4) hex = [...hex].map((digit) => digit + digit).join("");
      color = { r: parseInt(hex.slice(0, 2), 16), g: parseInt(hex.slice(2, 4), 16), b: parseInt(hex.slice(4, 6), 16), a: hex.length === 8 ? parseInt(hex.slice(6, 8), 16) / 255 : 1 };
    } else if ((match = value.match(/^rgba?\(([^)]*)\)$/))) {
      const [r, g, b, a = "1"] = parts(match[1]);
      color = { r: number(r, 255), g: number(g, 255), b: number(b, 255), a: number(a) };
    } else if ((match = value.match(/^color\(srgb ([^)]*)\)$/))) {
      const [r, g, b, a = "1"] = parts(match[1]);
      color = { r: number(r) * 255, g: number(g) * 255, b: number(b) * 255, a: number(a) };
    } else if ((match = value.match(/^oklab\(([^)]*)\)$/))) {
      const [L, A, B, a = "1"] = parts(match[1]);
      color = fromOklab(number(L), number(A, 0.4), number(B, 0.4), number(a));
    } else if ((match = value.match(/^oklch\(([^)]*)\)$/))) {
      const [L, C, H, a = "1"] = parts(match[1]);
      const hue = (number(H) * Math.PI) / 180;
      const c = number(C, 0.4);
      color = fromOklab(number(L), c * Math.cos(hue), c * Math.sin(hue), number(a));
    } else {
      canvas.clearRect(0, 0, 1, 1);
      canvas.fillStyle = "#000";
      canvas.fillStyle = value;
      canvas.fillRect(0, 0, 1, 1);
      const [r, g, b, a] = canvas.getImageData(0, 0, 1, 1).data;
      color = { r, g, b, a: a / 255 };
    }
    if (color && Number.isNaN(color.a)) color.a = 1;
    cache.set(value, color);
    return color;
  };
  const distance = (first, second) => Math.hypot(first.r - second.r, first.g - second.g, first.b - second.b);
  const over = (top, bottom) => ({ r: top.r * top.a + bottom.r * (1 - top.a), g: top.g * top.a + bottom.g * (1 - top.a), b: top.b * top.a + bottom.b * (1 - top.a), a: 1 });
  const hex = (color) => `#${[color.r, color.g, color.b].map((x) => Math.round(x).toString(16).padStart(2, "0")).join("")}${color.a < 1 ? `/${Math.round(color.a * 100)}` : ""}`;

  const rootStyle = getComputedStyle(document.documentElement);
  const roleOf = (name, color) => (/^primary/.test(name) ? "nhấn" : /(success|warning|error|danger|info)/.test(name) ? "trạng thái" : chroma(color) < 0.04 ? "trung tính" : "phụ");
  const tokens = ctx.colors
    .map((name) => ({ name, color: parse(rootStyle.getPropertyValue(`--color-${name}`)) }))
    .filter((token) => token.color)
    .map((token) => ({ ...token, role: roleOf(token.name, token.color) }));
  const roleOrder = ["trung tính", "nhấn", "trạng thái", "phụ"];
  // Token gần nhất (bỏ qua độ trong suốt). Cùng khoảng cách thì lấy vai dễ dãi nhất. Không token nào gần mà màu xám thì
  // tính trung tính (trắng, đen); màu có sắc mà không khớp token là màu ngoài design system.
  const tokenOf = (color) => {
    let best = null;
    for (const token of tokens) {
      const gap = distance(color, token.color);
      if (gap > 8) continue;
      if (!best || gap < best.gap - 0.5 || (Math.abs(gap - best.gap) <= 0.5 && roleOrder.indexOf(token.role) < roleOrder.indexOf(best.role))) best = { ...token, gap };
    }
    if (best) return best;
    return chroma(color) < 0.04 ? { name: hex(color), role: "trung tính" } : null;
  };

  // ----- phần tử -----
  const styles = new Map();
  const style = (element) => {
    if (!styles.has(element)) styles.set(element, getComputedStyle(element));
    return styles.get(element);
  };
  const opacityCache = new Map();
  const opacityOf = (element) => {
    if (!element || element === document.documentElement) return 1;
    if (!opacityCache.has(element)) opacityCache.set(element, parseFloat(style(element).opacity) * opacityOf(element.parentElement));
    return opacityCache.get(element);
  };
  const rects = new Map();
  const rectOf = (element) => {
    if (!rects.has(element)) rects.set(element, element.getBoundingClientRect());
    return rects.get(element);
  };
  const isVisible = (element) => {
    const rect = rectOf(element);
    if (rect.width <= 1 || rect.height <= 1) return false;
    const s = style(element);
    return s.visibility !== "hidden" && opacityOf(element) > 0.05;
  };
  const elements = [...main.querySelectorAll("*")].filter(isVisible);
  const ownText = (element) => [...element.childNodes].some((node) => node.nodeType === 3 && node.textContent.trim());
  const textOf = (element) => (element.textContent ?? "").trim().replace(/\s+/g, " ");
  const describe = (element) => {
    const block = element.closest("[data-block]")?.dataset.block;
    const text = (element.getAttribute("aria-label") || textOf(element)).slice(0, 28);
    return `<${element.tagName.toLowerCase()}${block ? ` khối ${block}` : ""}>${text ? ` "${text}"` : ""}`;
  };
  const layerOf = (element) => {
    for (let node = element; node && node !== main; node = node.parentElement) {
      const position = style(node).position;
      if (position === "fixed" || position === "absolute") return node;
    }
    return null;
  };
  const fixedOf = (element) => {
    let found = null;
    for (let node = element; node && node !== main; node = node.parentElement) if (style(node).position === "fixed") found = node;
    return found;
  };
  const inChart = (element) => !!element.closest("[data-chart]");
  const backgrounds = new Map();
  const canvasColor = parse(rootStyle.getPropertyValue("--color-canvas")) ?? { r: 255, g: 255, b: 255, a: 1 };
  // Nền thật phía sau phần tử: trộn các lớp nền từ nó lên tới lớp đặc đầu tiên. Gặp ảnh hay gradient thì null.
  const backdrop = (element) => {
    if (backgrounds.has(element)) return backgrounds.get(element);
    const layers = [];
    let blocked = false;
    for (let node = element; node; node = node.parentElement) {
      const s = style(node);
      if (s.backgroundImage && s.backgroundImage !== "none") { blocked = true; break; }
      const color = parse(s.backgroundColor);
      if (color && color.a > 0) {
        layers.push(color);
        if (color.a >= 0.999) break;
      }
    }
    let result = null;
    if (!blocked) {
      result = layers.at(-1)?.a >= 0.999 ? { ...layers.at(-1) } : canvasColor;
      for (let index = layers.length - (layers.at(-1)?.a >= 0.999 ? 2 : 1); index >= 0; index -= 1) result = over(layers[index], result);
    }
    backgrounds.set(element, result);
    return result;
  };
  const luminance = ({ r, g, b }) => {
    const channel = (x) => { x /= 255; return x <= 0.03928 ? x / 12.92 : ((x + 0.055) / 1.055) ** 2.4; };
    return 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b);
  };
  const contrast = (first, second) => {
    const [high, low] = [luminance(first), luminance(second)].sort((a, b) => b - a);
    return (high + 0.05) / (low + 0.05);
  };
  const disabled = (element) => !!element.closest("button:disabled, input:disabled, select:disabled, textarea:disabled, fieldset:disabled, [aria-disabled='true']");
  const srOnly = (element) => style(element).position === "absolute" && /rect\(0/.test(style(element).clip || "") ;
  const textElements = elements.filter((element) => ownText(element) && !srOnly(element) && element.tagName !== "OPTION");

  // N13 tương phản. Bỏ chữ đang chạy hiệu ứng (animate-pulse: đo lúc mờ lúc rõ) và chữ aria-hidden (logo, ký hiệu
  // trang trí: WCAG không đòi tương phản).
  const animated = new Set(document.getAnimations().map((animation) => animation.effect?.target).filter(Boolean));
  const isAnimated = (element) => { for (let node = element; node && node !== main; node = node.parentElement) if (animated.has(node)) return true; return false; };
  for (const element of textElements) {
    if (disabled(element) || isAnimated(element) || element.closest("[aria-hidden='true']")) continue;
    const s = style(element);
    const back = backdrop(element);
    const color = parse(s.color);
    if (!back || !color) continue;
    const text = over({ ...color, a: color.a * opacityOf(element) }, back);
    const size = parseFloat(s.fontSize);
    const large = size >= 24 || (size >= 18.66 && parseInt(s.fontWeight, 10) >= 700);
    const need = large ? 3 : 4.5;
    const ratio = contrast(text, back);
    if (ratio < need - 0.01) add("N13", `${describe(element)} tương phản ${ratio.toFixed(2)} : 1, cần ${need} : 1`);
  }
  for (const field of elements.filter((element) => /^(INPUT|TEXTAREA)$/.test(element.tagName) && element.placeholder && !element.value && !element.disabled)) {
    const color = parse(getComputedStyle(field, "::placeholder").color);
    const back = backdrop(field);
    if (!color || !back) continue;
    const ratio = contrast(over(color, back), back);
    if (ratio < 4.49) add("N13", `placeholder "${field.placeholder.slice(0, 24)}" tương phản ${ratio.toFixed(2)} : 1, cần 4.5 : 1`);
  }

  // N5 khối màu không chữ · G1 màu phụ
  for (const element of elements) {
    if (inChart(element)) continue;
    const s = style(element);
    const tag = element.tagName.toLowerCase();
    const background = parse(s.backgroundColor);
    const backgroundToken = background && background.a > 0.05 ? tokenOf(background) : undefined;
    if (background && background.a > 0.05 && !textOf(element) && !["img", "svg", "input", "textarea", "select", "video", "canvas"].includes(tag) && !element.querySelector("img, svg")) {
      const meaningful = !backgroundToken || backgroundToken.role !== "trung tính";
      const named = element.getAttribute("aria-label") || element.getAttribute("title") || element.closest("[role=progressbar][aria-valuenow], [aria-label], [title]");
      let near = false;
      for (let node = element.parentElement, level = 0; node && level < 3 && node !== main; node = node.parentElement, level += 1) if (textOf(node)) near = true;
      if (meaningful && !named && !near) add("N5", `${describe(element)} tô màu ${backgroundToken?.name ?? hex(background)} mà không có chữ, aria-label hay title đi kèm`);
    }
    const uses = [];
    if (ownText(element) || tag === "svg") uses.push(["chữ", s.color]);
    uses.push(["nền", s.backgroundColor]);
    const side = ["Top", "Right", "Bottom", "Left"].find((name) => parseFloat(s[`border${name}Width`]) > 0 && !/none|hidden/.test(s[`border${name}Style`]));
    if (side) uses.push(["viền", s[`border${side}Color`]]);
    for (const [property, value] of uses) {
      const color = parse(value);
      if (!color || color.a <= 0.05) continue;
      const token = tokenOf(color);
      if (!token) add("G1", `${describe(element)} dùng màu ${hex(color)} làm ${property}, không có trong design system`);
      else if (token.role === "phụ") add("G1", `${describe(element)} dùng màu phụ ${token.name} làm ${property} ngoài khối [data-chart]`);
    }
  }

  // G7 số màu viền
  const borderColors = [];
  for (const element of elements) {
    if (inChart(element)) continue;
    const s = style(element);
    for (const name of ["Top", "Right", "Bottom", "Left"]) {
      if (!(parseFloat(s[`border${name}Width`]) > 0) || /none|hidden/.test(s[`border${name}Style`])) continue;
      const color = parse(s[`border${name}Color`]);
      if (!color || color.a <= 0.05) continue;
      // Chỉ đếm viền trung tính (đường tóc). Viền màu nhấn, trạng thái, màu phụ (badge) là chuyện của G1, N5.
      const token = tokenOf(color);
      if (token && token.role !== "trung tính") continue;
      if (!borderColors.some((known) => distance(known.color, color) <= 4 && Math.abs(known.color.a - color.a) < 0.05)) borderColors.push({ color, name: token?.name ?? hex(color), example: describe(element) });
    }
  }
  if (borderColors.length > 2) add("G7", `${borderColors.length} màu viền: ${borderColors.map((entry) => `${entry.name}${entry.color.a < 1 ? `/${Math.round(entry.color.a * 100)}` : ""} (${entry.example})`).join(" · ")}`);

  // G2 font
  const allowedFonts = ctx.fonts.map((name) => rootStyle.getPropertyValue(`--font-${name}`).split(",")[0].trim().replace(/['"]/g, "").toLowerCase()).filter(Boolean);
  for (const element of textElements) {
    const family = style(element).fontFamily.split(",")[0].trim().replace(/['"]/g, "").toLowerCase();
    if (allowedFonts.length && !allowedFonts.includes(family)) add("G2", `${describe(element)} dùng font "${family}", không khai trong --font-* của tokens.js`);
  }

  // G3 cỡ chữ, thứ bậc tiêu đề
  const inScale = (px, scale) => scale.some((step) => Math.abs(step - px) <= 0.5);
  for (const element of textElements) {
    const px = parseFloat(style(element).fontSize);
    if (!inScale(px, ctx.textScale)) add("G3", `${describe(element)} cỡ chữ ${px}px ngoài thang (${ctx.textScale.join(", ")})`);
  }
  const headings = (level) => elements.filter((element) => element.tagName === `H${level}` && !layerOf(element));
  const [h1s, h2s, h3s] = [headings(1), headings(2), headings(3)];
  if (h1s.length !== 1) add("G3", `trang có ${h1s.length} h1, cần đúng một h1 cho tên trang`);
  const size = (element) => parseFloat(style(element).fontSize);
  const minOf = (list) => Math.min(...list.map(size));
  const maxOf = (list) => Math.max(...list.map(size));
  if (h1s.length && h2s.length && maxOf(h2s) >= minOf(h1s)) add("G3", `h2 cỡ ${maxOf(h2s)}px không nhỏ hơn h1 ${minOf(h1s)}px`);
  if (h2s.length && h3s.length && maxOf(h3s) >= minOf(h2s)) add("G3", `h3 cỡ ${maxOf(h3s)}px không nhỏ hơn h2 ${minOf(h2s)}px`);

  // G9 ký tự mỗi dòng
  const lineCount = (element) => {
    const range = document.createRange();
    range.selectNodeContents(element);
    return new Set([...range.getClientRects()].filter((rect) => rect.width > 1).map((rect) => Math.round(rect.top))).size;
  };
  for (const element of textElements) {
    if (style(element).display === "inline") continue;
    const lines = lineCount(element);
    const characters = textOf(element).length;
    if (lines >= 2 && characters / lines > 75) add("G9", `${describe(element)} dài ${Math.round(characters / lines)} ký tự mỗi dòng, tối đa 75`);
  }

  // Khối lặp: ≥ 3 anh em cùng thẻ, cùng class
  const groups = [];
  for (const parent of new Set(elements.map((element) => element.parentElement))) {
    if (!parent || inChart(parent)) continue;
    const buckets = new Map();
    for (const child of parent.children) {
      if (!isVisible(child) || /^(TR|TD|TH|TEMPLATE|OPTION|SVG|PATH|I|BR)$/i.test(child.tagName)) continue;
      const key = `${child.tagName}|${child.getAttribute("class") ?? ""}`;
      if (!buckets.has(key)) buckets.set(key, []);
      buckets.get(key).push(child);
    }
    for (const members of buckets.values()) if (members.length >= 3 && members.some((member) => member.children.length)) groups.push({ parent, members });
  }

  // N12
  for (const { parent, members } of groups) {
    for (const member of members.slice(0, 6)) {
      const sizes = new Set([member, ...member.querySelectorAll("*")].filter((node) => isVisible(node) && ownText(node)).map((node) => parseFloat(style(node).fontSize)));
      if (sizes.size > 3) add("N12", `khối lặp ${describe(member)} có ${sizes.size} cỡ chữ (${[...sizes].sort((a, b) => a - b).join(", ")}px), tối đa 3`);
      const title = member.querySelector("h3");
      if (title && isVisible(title) && style(title).whiteSpace === "nowrap" && style(title).textOverflow === "ellipsis" && rectOf(member).width < rectOf(parent).width / 2) {
        add("N12", `tên ${describe(title)} trong card bị cắt còn một dòng — dùng line-clamp-2`);
      }
    }
  }

  // N9 chữ bị cắt
  const unitNumber = /\d[\d.,]*\s*(%|đ|₫|triệu|tr\b|tỷ|nghìn|k\b|K\b|m²|USD|VND|\$)/;
  for (const element of textElements) {
    const s = style(element);
    const ellipsis = s.textOverflow === "ellipsis" && element.scrollWidth > element.clientWidth + 1;
    const clamped = s.webkitLineClamp && s.webkitLineClamp !== "none" && element.scrollHeight > element.clientHeight + 1;
    if (!ellipsis && !clamped) continue;
    const text = textOf(element);
    if (!element.getAttribute("title") && !element.parentElement?.getAttribute("title")) add("N9", `${describe(element)} bị cắt mà không có title để đọc đủ`);
    if (ellipsis) {
      const shown = Math.floor((text.length * element.clientWidth) / element.scrollWidth);
      if (shown < 8) add("N9", `${describe(element)} bị cắt còn khoảng ${shown} ký tự`);
      if (unitNumber.test(text.slice(Math.max(0, shown - 3))) || /^[\d.,\s%₫đ$+−-]+$/.test(text)) add("N9", `${describe(element)} bị cắt mất số: "${text.slice(0, 40)}"`);
    }
  }

  // N4 một nút chính mỗi khối · absolute chồng · câu lặp
  const clickableSelector = "button, a[href], [role=button], [role=tab], summary, input[type=checkbox], input[type=radio], select, [\\@click], [x-on\\:click]";
  const clickables = elements.filter((element) => element.matches(clickableSelector));
  // Nút chính là nút có chữ, nền nhấn đặc. Chấm bấm được trên timeline, biểu đồ không phải nút chính.
  const solidPrimary = (element) => {
    if (!textOf(element)) return false;
    const color = parse(style(element).backgroundColor);
    return color && color.a >= 0.9 && tokenOf(color)?.role === "nhấn";
  };
  const primaryByPlace = new Map();
  // Công tắc, nút bật tắt tô nền nhấn khi bật là trạng thái, không phải nút chính.
  for (const element of clickables.filter((node) => (/^(BUTTON|A)$/.test(node.tagName) || node.getAttribute("role") === "button") && !node.matches("[role=switch], [role=checkbox], [role=radio], [aria-checked], [aria-pressed], [role=tab]") && !inChart(node))) {
    if (!solidPrimary(element)) continue;
    const layer = fixedOf(element);
    const key = layer ? `lớp nổi ${describe(layer)}` : `khối ${element.closest("[data-block]")?.dataset.block ?? "?"}`;
    if (!primaryByPlace.has(key)) primaryByPlace.set(key, []);
    primaryByPlace.get(key).push(textOf(element) || element.getAttribute("aria-label") || "?");
  }
  for (const [place, labels] of primaryByPlace) if (labels.length > 1) add("N4", `${labels.length} nút nền màu nhấn trong ${place}: ${labels.map((label) => `"${label.slice(0, 20)}"`).join(", ")} — mỗi khối một nút chính`);
  const stacked = new Map();
  for (const element of elements) {
    if (style(element).position !== "absolute" || inChart(element)) continue;
    const parent = element.offsetParent;
    if (!parent || !main.contains(parent)) continue;
    const a = rectOf(element);
    const b = rectOf(parent);
    if (a.right <= b.left || a.left >= b.right || a.bottom <= b.top || a.top >= b.bottom) continue;
    if (!stacked.has(parent)) stacked.set(parent, []);
    stacked.get(parent).push(element);
  }
  for (const [parent, list] of stacked) if (list.length > 3) add("N4", `${list.length} phần tử đè lên ${describe(parent)} — tối đa ba thứ chồng lên một khung`);
  for (const { members } of groups) {
    if (members.length < 5) continue;
    const counts = new Map();
    for (const member of members) {
      const phrases = new Set([member, ...member.querySelectorAll("*")]
        .filter((node) => ownText(node) && isVisible(node) && !/^(BUTTON|A|H1|H2|H3|H4)$/.test(node.tagName) && !node.closest("button, a"))
        .map(textOf).filter((text) => text.split(" ").length >= 2 && !/\d/.test(text)));
      for (const phrase of phrases) counts.set(phrase, (counts.get(phrase) ?? 0) + 1);
    }
    for (const [phrase, count] of counts) if (count >= members.length * 0.8) add("N4", `câu "${phrase.slice(0, 40)}" lặp ở ${count}/${members.length} khối lặp — ghi một lần ở đầu nhóm`);
  }

  // G5 bo góc
  const radii = (element) => ["TopLeft", "TopRight", "BottomRight", "BottomLeft"].map((corner) => parseFloat(style(element)[`border${corner}Radius`]) || 0);
  const pill = (element, radius) => radius >= Math.min(rectOf(element).width, rectOf(element).height) / 2 - 0.5;
  const painted = (element) => {
    const s = style(element);
    const background = parse(s.backgroundColor);
    return (background && background.a > 0.05) || ["Top", "Right", "Bottom", "Left"].some((name) => parseFloat(s[`border${name}Width`]) > 0 && !/none|hidden/.test(s[`border${name}Style`]));
  };
  for (const element of elements) {
    const list = radii(element);
    const radius = Math.max(...list);
    if (radius <= 0) continue;
    for (const value of list) {
      if (value > 0 && !pill(element, value) && !inScale(value, ctx.radiusScale)) {
        add("G5", `${describe(element)} bo góc ${value}px ngoài thang (${ctx.radiusScale.join(", ")})`);
        break;
      }
    }
    if (pill(element, radius) || !painted(element)) continue;
    for (let node = element.parentElement; node && node !== main; node = node.parentElement) {
      if (["fixed", "absolute"].includes(style(node).position) && node !== element.parentElement) break;
      const outer = Math.max(...radii(node));
      if (outer > 0 && painted(node) && !pill(node, outer)) {
        if (radius > outer + 0.5) add("G5", `${describe(element)} bo ${radius}px lớn hơn khối cha ${describe(node)} bo ${outer}px`);
        break;
      }
    }
  }

  // G6 bóng trong trang
  const blurred = (shadow) => shadow.split(/,(?![^(]*\))/).some((part) => {
    if (/inset/.test(part)) return false;
    const lengths = part.replace(/(rgba?|oklab|oklch|color|hsla?)\([^)]*\)/g, "").match(/-?[\d.]+px/g) ?? [];
    return lengths.length >= 3 && parseFloat(lengths[2]) > 0;
  });
  for (const element of elements) {
    const shadow = style(element).boxShadow;
    if (!shadow || shadow === "none" || !blurred(shadow)) continue;
    const rect = rectOf(element);
    if (rect.width < 64 || rect.height < 64 || layerOf(element)) continue;
    add("G6", `${describe(element)} có bóng mà nằm trong trang — bóng chỉ cho lớp nổi`);
  }

  // G8 tầng khung
  const frameCache = new Map();
  const isFrame = (element) => {
    if (frameCache.has(element)) return frameCache.get(element);
    const rect = rectOf(element);
    let frame = false;
    // Lớp phủ mờ toàn màn sau modal không phải khung.
    const scrim = style(element).position === "fixed" && rect.width >= innerWidth * 0.9 && rect.height >= innerHeight * 0.9;
    if (element !== main && !scrim && rect.width >= 64 && rect.height >= 64) {
      const s = style(element);
      const bordered = ["Top", "Right", "Bottom", "Left"].every((name) => parseFloat(s[`border${name}Width`]) > 0 && !/none|hidden/.test(s[`border${name}Style`]) && (parse(s[`border${name}Color`])?.a ?? 0) > 0.05);
      const background = parse(s.backgroundColor);
      const parentBack = element.parentElement ? backdrop(element.parentElement) : null;
      const filled = background && background.a > 0.05 && parentBack && distance(over(background, parentBack), parentBack) > 3;
      frame = bordered || !!filled;
    }
    frameCache.set(element, frame);
    return frame;
  };
  for (const element of elements) {
    if (!isFrame(element) || inChart(element)) continue;
    let depth = 0;
    const chain = [];
    for (let node = element; node && node !== main; node = node.parentElement) {
      if (isFrame(node)) { depth += 1; chain.push(node); }
      if (["fixed", "absolute"].includes(style(node).position)) break;
    }
    if (depth === 3) add("G8", `${depth} tầng khung lồng nhau: ${chain.reverse().map(describe).join(" › ")} — tối đa 2`);
  }

  // N6 đơn vị số trong khối lặp
  // Chỉ so đơn vị cùng loại: ô số liệu của các chỉ số khác nhau ($ cạnh M token, % cạnh $) khác đơn vị là đúng.
  const unitPattern = /(\$)\s*\d|\d[\d.,]*\s*(triệu|tr|tỷ|nghìn|k|đ|₫|VND|USD)(?![\p{L}])/u;
  for (const { members } of groups) {
    const slots = new Map();
    for (const member of members) {
      for (const node of [member, ...member.querySelectorAll("*")].filter((child) => ownText(child) && isVisible(child))) {
        const match = textOf(node).match(unitPattern);
        if (!match) continue;
        const key = `${node.tagName}|${node.getAttribute("class") ?? ""}`;
        if (!slots.has(key)) slots.set(key, new Map());
        const unit = match[1] ?? (match[2] === "₫" ? "₫" : match[2]);
        slots.get(key).set(unit, textOf(node).slice(0, 20));
      }
    }
    for (const units of slots.values()) if (units.size > 1) add("N6", `khối lặp viết số khác đơn vị ở cùng chỗ: ${[...units.values()].map((text) => `"${text}"`).join(" · ")}`);
  }

  // N1 quy ước: hộp thoại, nút chính phải nhất, * đỏ
  for (const layer of elements.filter((element) => style(element).position === "fixed" && !fixedOf(element.parentElement ?? main))) {
    const rect = rectOf(layer);
    const looksLikeDialog = rect.height >= 120 && rect.width >= 200 && (layer.querySelector("h2, form") || layer.querySelectorAll("button").length >= 2);
    if (looksLikeDialog && !layer.matches("[role=dialog]") && !layer.querySelector("[role=dialog]")) add("N1", `lớp nổi ${describe(layer)} chưa đánh dấu role="dialog"`);
  }
  for (const dialog of elements.filter((element) => element.matches("[role=dialog]"))) {
    const close = [...dialog.querySelectorAll("button, [role=button]")].find((button) => /^(đóng|close)$/i.test((button.getAttribute("aria-label") ?? "").trim()) && isVisible(button));
    const box = rectOf(dialog);
    if (!close) add("N1", `hộp thoại ${describe(dialog)} thiếu nút đóng aria-label="Đóng" ở góc trên phải`);
    else if (rectOf(close).right < box.right - 72 || rectOf(close).top > box.top + 72) add("N1", `nút đóng của hộp thoại ${describe(dialog)} không ở góc trên phải`);
  }
  if (ctx.width >= 640) {
    for (const row of elements.filter((element) => element.closest("[role=dialog], form"))) {
      const buttons = [...row.children].filter((child) => child.tagName === "BUTTON" && isVisible(child));
      if (buttons.length < 2 || buttons.some((button) => Math.abs(rectOf(button).top - rectOf(buttons[0]).top) > 4)) continue;
      const primary = buttons.find(solidPrimary);
      const rightmost = buttons.reduce((best, button) => (rectOf(button).right > rectOf(best).right ? button : best));
      if (primary && primary !== rightmost) add("N1", `nút chính "${textOf(primary).slice(0, 20)}" không đứng phải nhất hàng nút`);
    }
  }
  for (const field of elements.filter((element) => element.matches("input[required], select[required], textarea[required]"))) {
    const label = field.closest("label") ?? (field.id ? document.querySelector(`label[for="${CSS.escape(field.id)}"]`) : null);
    if (!label) {
      add("N1", `ô bắt buộc ${describe(field)} không có nhãn`);
      continue;
    }
    const star = [label, ...label.querySelectorAll("*")].find((node) => [...node.childNodes].some((child) => child.nodeType === 3 && child.textContent.includes("*")));
    const token = star ? tokenOf(parse(style(star).color) ?? { r: 0, g: 0, b: 0, a: 1 }) : null;
    if (!star || !token || !/error|danger/.test(token.name)) add("N1", `nhãn "${textOf(label).slice(0, 24)}" của ô bắt buộc thiếu dấu * màu error`);
  }

  // N3 thứ đang chọn khác thứ chưa chọn
  const look = (element) => {
    const s = style(element);
    return [s.backgroundColor, s.color, s.borderTopColor, s.borderTopWidth, s.borderBottomColor, s.borderBottomWidth, s.fontWeight, s.boxShadow, s.textDecorationLine].join("|");
  };
  for (const attribute of ["aria-selected", "aria-pressed", "aria-current"]) {
    for (const element of elements.filter((node) => node.hasAttribute(attribute) && node.getAttribute(attribute) !== "false")) {
      const others = [...(element.parentElement?.parentElement ?? element.parentElement).querySelectorAll(element.tagName)]
        .filter((node) => node !== element && isVisible(node) && (!node.hasAttribute(attribute) || node.getAttribute(attribute) === "false") && (attribute === "aria-current" || node.hasAttribute(attribute)));
      if (others.some((other) => look(other) === look(element))) add("N3", `${describe(element)} đang chọn (${attribute}) mà trông giống hệt mục chưa chọn`);
    }
  }

  // N10 tới được bằng phím · cursor · vùng bấm
  for (const element of elements) {
    const handler = [...element.attributes].some((attribute) => /^(@click|x-on:click)(?![\w.]*\.(self|outside))/.test(attribute.name));
    if (handler && !/^(BUTTON|A|INPUT|LABEL|SUMMARY|SELECT|TEXTAREA|OPTION)$/.test(element.tagName) && !element.hasAttribute("tabindex")) {
      add("N10", `${describe(element)} có @click mà không phải button và không có tabindex — Tab không tới được`);
    }
  }
  const pointerTargets = clickables.filter((element) => !disabled(element) && !/^(SELECT|INPUT)$/.test(element.tagName));
  for (const element of pointerTargets) if (style(element).cursor !== "pointer") add("N10", `${describe(element)} bấm được mà con trỏ không phải pointer`);
  if (ctx.width <= 400) {
    const topDialog = elements.filter((element) => element.matches("[role=dialog]")).at(-1);
    const scrollX = window.scrollX;
    const scrollY = window.scrollY;
    for (const element of pointerTargets.concat(clickables.filter((node) => /^(SELECT|INPUT)$/.test(node.tagName) && !disabled(node)))) {
      if (topDialog && !topDialog.contains(element)) continue;
      if (inChart(element)) continue;
      const rect = rectOf(element);
      if (rect.width >= 32 && rect.height >= 32) continue;
      const bigger = element.parentElement?.closest(clickableSelector + ", label");
      if (bigger && main.contains(bigger) && rectOf(bigger).width >= 32 && rectOf(bigger).height >= 32) continue;
      element.scrollIntoView({ block: "center", inline: "center" });
      const live = element.getBoundingClientRect();
      const cx = live.left + live.width / 2;
      const cy = live.top + live.height / 2;
      const points = [[cx - 15.5, cy], [cx + 15.5, cy], [cx, cy - 15.5], [cx, cy + 15.5]];
      const covered = points.every(([x, y]) => {
        const hit = document.elementFromPoint(Math.max(0, Math.min(innerWidth - 1, x)), Math.max(0, Math.min(innerHeight - 1, y)));
        return hit && (hit === element || element.contains(hit));
      });
      if (!covered) add("N10", `${describe(element)} vùng bấm ${Math.round(rect.width)}×${Math.round(rect.height)}px, cần từ 32px — nới bằng before:absolute`);
    }
    window.scrollTo(scrollX, scrollY);
  }

  // G10 dạng nút
  const buttons = [];
  for (const element of elements.filter((node) => (node.tagName === "BUTTON" || node.matches("a[role=button], [role=button]")) && !node.matches("[role=tab], [role=menuitem], [role=option], [role=switch], [role=checkbox], [aria-pressed], [aria-checked]") && !inChart(node))) {
    const label = textOf(element);
    if (!label || rectOf(element).height > 56) continue;
    const s = style(element);
    const background = parse(s.backgroundColor);
    let fill = "không nền";
    if (background && background.a >= 0.05) {
      const token = tokenOf(background);
      const parentBack = element.parentElement ? backdrop(element.parentElement) : null;
      if (background.a >= 0.9 && token && token.role !== "trung tính") fill = "nền đặc";
      else if (background.a >= 0.9 && parentBack && distance(background, parentBack) <= 3) fill = "không nền";
      else fill = "nền nhạt";
    }
    const bordered = ["Top", "Right", "Bottom", "Left"].every((name) => parseFloat(s[`border${name}Width`]) > 0 && (parse(s[`border${name}Color`])?.a ?? 0) > 0.05);
    buttons.push({ sig: `${fill} · ${bordered ? "có viền" : "không viền"} · chữ ${s.fontWeight}`, label: label.slice(0, 20) });
  }

  // N7: chữ và nút của từng khối, và nhãn mọi thứ bấm được ngoài lớp nổi; check.mjs so giữa các state.
  const actions = [...main.querySelectorAll("button, a[href], [role=button]")]
    .filter((node) => isVisible(node) && !layerOf(node) && (!disabled(node) || node.getAttribute("title")))
    .map((node) => node.getAttribute("aria-label") || textOf(node))
    .filter(Boolean);
  const blocks = {};
  for (const block of main.querySelectorAll("[data-block]")) {
    if (layerOf(block)) continue;
    const id = block.dataset.block;
    // Nút khoá kèm title nói vì sao cũng là lối ra: người xem biết vì sao không làm được (role thiếu quyền).
    const actionable = [...block.querySelectorAll("button, a[href], [role=button], [\\@click]")].some((node) => isVisible(node) && (!disabled(node) || node.getAttribute("title")));
    // innerText chỉ lấy chữ đang hiện: khối rỗng / lỗi ẩn bằng x-show vẫn nằm trong textContent.
    blocks[id] = { text: isVisible(block) ? block.innerText.trim().replace(/\s+/g, " ").slice(0, 400) : "", actionable };
  }

  return { issues, buttons, blocks, actions };
}

// Chờ mọi hiệu ứng có hồi kết (transition, animation chạy một lần) xong, tối đa 1,5 giây. Hiệu ứng lặp mãi
// (animate-pulse, spin) thì pageProbe bỏ qua phần tử đó.
export function animationsDone() {
  const finite = document.getAnimations().filter((animation) => animation.effect?.getComputedTiming().iterations !== Infinity);
  return Promise.race([Promise.all(finite.map((animation) => animation.finished.catch(() => null))), new Promise((done) => setTimeout(done, 1500))]).then(() => true);
}

// ---------- lượt bấm ----------

// Vị trí mọi phần tử trong #design trừ thứ được rê và cha con của nó; so trước và sau khi rê.
export function positionsAround(index) {
  const all = [...document.querySelectorAll("#design *")];
  const target = all[index];
  return all.map((element, position) => {
    if (!target || element === target || target.contains(element) || element.contains(target)) return null;
    for (let node = element; node; node = node.parentElement) if (getComputedStyle(node).position === "fixed") return null;
    const rect = element.getBoundingClientRect();
    if (!rect.width && !rect.height) return null;
    return [position, Math.round(rect.left * 2) / 2, Math.round(rect.top * 2) / 2, Math.round(rect.width * 2) / 2, Math.round(rect.height * 2) / 2];
  }).filter(Boolean);
}

export function shifted(before, after) {
  const map = new Map(after.map((entry) => [entry[0], entry]));
  const moved = [];
  for (const entry of before) {
    const next = map.get(entry[0]);
    if (!next) continue;
    if ([1, 2, 3, 4].some((index) => Math.abs(entry[index] - next[index]) > 0.5)) moved.push({ index: entry[0], dx: next[1] - entry[1], dy: next[2] - entry[2], dw: next[3] - entry[3], dh: next[4] - entry[4] });
  }
  return moved;
}

// Anh em cùng hàng với thứ được bấm (tab, chip, nhóm nút): vị trí trước và sau cú bấm.
export function rowRects(index) {
  const target = document.querySelectorAll("#design *")[index];
  const parent = target?.parentElement;
  if (!parent) return null;
  const siblings = [...parent.children].filter((child) => child.tagName === target.tagName && child.getClientRects().length);
  if (siblings.length < 2) return null;
  const rects = siblings.map((child) => child.getBoundingClientRect());
  if (rects.some((rect) => Math.abs(rect.top - rects[0].top) > 4)) return null;
  return rects.map((rect) => [Math.round(rect.left * 2) / 2, Math.round(rect.width * 2) / 2]);
}

export function describeAt(index) {
  const element = document.querySelectorAll("#design *")[index];
  if (!element) return "?";
  const block = element.closest("[data-block]")?.dataset.block;
  const text = (element.getAttribute("aria-label") || element.textContent || "").trim().replace(/\s+/g, " ").slice(0, 28);
  return `<${element.tagName.toLowerCase()}${block ? ` khối ${block}` : ""}>${text ? ` "${text}"` : ""}`;
}

// Trước cú bấm: điểm giữa thứ sắp bấm có trúng chính nó không (để biết sau đó có bị che).
export function hitsItself(index) {
  const element = document.querySelectorAll("#design *")[index];
  if (!element) return false;
  const rect = element.getBoundingClientRect();
  if (rect.bottom < 0 || rect.top > innerHeight) return false;
  const hit = document.elementFromPoint(rect.left + rect.width / 2, rect.top + rect.height / 2);
  return !!hit && (hit === element || element.contains(hit));
}

// Sau cú bấm: N8 form tạo mới có sẵn giá trị · N9 lớp nổi che thứ vừa bấm.
export function afterClick({ index, createLike, wasHittable }) {
  const issues = [];
  const element = document.querySelectorAll("#design *")[index];
  const visible = (node) => node.getClientRects().length > 0 && getComputedStyle(node).visibility !== "hidden";
  const fixedOf = (node) => {
    for (let current = node; current && current.id !== "design"; current = current.parentElement) {
      const position = getComputedStyle(current).position;
      if (position === "fixed" || position === "absolute") return current;
    }
    return null;
  };
  if (createLike) {
    const forms = [...document.querySelectorAll("#design [role=dialog], #design form")].filter((node) => visible(node) && fixedOf(node));
    for (const form of forms) {
      for (const field of form.querySelectorAll("input, textarea")) {
        if (!visible(field) || field.disabled) continue;
        if (field.type === "checkbox" && field.checked) issues.push({ rule: "N8", message: `form tạo mới mở ra đã tick sẵn "${(field.closest("label")?.textContent ?? field.name ?? "").trim().slice(0, 24)}"` });
        if (/^(text|email|search|tel|url|number|password|date|time|)$/.test(field.type) && field.tagName !== "SELECT" && field.value) issues.push({ rule: "N8", message: `form tạo mới mở ra ô "${field.name || field.placeholder || field.type}" đã có giá trị "${field.value.slice(0, 20)}"` });
        if (field.tagName === "TEXTAREA" && field.value) issues.push({ rule: "N8", message: "form tạo mới mở ra ô chữ dài đã có giá trị" });
      }
    }
  }
  if (wasHittable && element && visible(element)) {
    const rect = element.getBoundingClientRect();
    const hit = document.elementFromPoint(rect.left + rect.width / 2, rect.top + rect.height / 2);
    if (hit && hit !== element && !element.contains(hit)) {
      const layer = fixedOf(hit);
      const box = layer?.getBoundingClientRect();
      const dialog = layer && (layer.matches("[role=dialog]") || layer.querySelector("[role=dialog]") || layer.closest("[role=dialog]"));
      // Lớp cao từ 60% màn là sheet hay ngăn kéo, không phải popover; thiếu role="dialog" thì N1 báo.
      const fullScreen = box && ((box.width >= innerWidth * 0.9 && box.height >= innerHeight * 0.9) || box.height >= innerHeight * 0.6);
      // Toast chỉ có chữ là thông báo thoáng qua, không phải lớp được mở ra như menu, popover.
      const interactive = layer?.querySelector("button, a[href], input, select, textarea, [role=menuitem], [role=option], [tabindex]");
      if (layer && interactive && !dialog && !fullScreen && !layer.contains(element)) issues.push({ rule: "N9", message: "lớp nổi vừa mở che mất thứ mở ra nó" });
    }
  }
  return issues;
}

// ---------- lượt thư mục ----------

export function folderIssues(buttonsByPage, skip) {
  const issues = [];
  const kinds = new Map();
  for (const [file, list] of buttonsByPage) {
    for (const { sig, label } of list) if (!kinds.has(sig)) kinds.set(sig, `${file} "${label}"`);
  }
  if (!skip.includes("G10") && kinds.size > 4) {
    issues.push({ rule: "G10", message: `${kinds.size} dạng nút trong thư mục, tối đa 4: ${[...kinds].map(([sig, example]) => `${sig} (${example})`).join(" · ")}` });
  }
  return issues;
}
