// Chuyển design system thành tokens.js cho page design: đọc DESIGN.md (YAML ở đầu file) hoặc một file CSS có
// khối @theme, ra một file JS chèn <style type="text/tailwindcss"> vào page. Không dùng file CSS vì mở page bằng
// file:// thì Tailwind bản trình duyệt không đọc được stylesheet ngoài.
//
// Design system chỉ có một giao diện thì giao diện còn lại suy ra theo vai màu: nền, chữ, viền đảo độ sáng;
// màu nhấn giữ sắc, chỉnh độ sáng tới khi đủ tương phản với nền mới; primary giữ nguyên.

import { readFileSync } from "node:fs";
import { basename } from "node:path";

// ---------- đọc nguồn ----------

function readFrontMatter(text) {
  const match = text.match(/^---\n([\s\S]*?)\n---/);
  if (!match) throw new Error("DESIGN.md không có YAML ở đầu file (khối giữa hai dòng ---)");
  return parseYamlSubset(match[1]);
}

// Đủ cho YAML của DESIGN.md: map lồng nhau bằng thụt lề, giá trị một dòng, chuỗi có hoặc không có nháy.
function parseYamlSubset(source) {
  const root = {};
  const stack = [{ indent: -1, node: root }];
  for (const rawLine of source.split("\n")) {
    if (!rawLine.trim() || rawLine.trim().startsWith("#")) continue;
    const indent = rawLine.length - rawLine.trimStart().length;
    const line = rawLine.trim();
    const colon = line.indexOf(":");
    if (colon < 0) continue;
    const key = line.slice(0, colon).trim();
    let value = line.slice(colon + 1).trim();
    while (stack.at(-1).indent >= indent) stack.pop();
    const parent = stack.at(-1).node;
    if (value === "") {
      parent[key] = {};
      stack.push({ indent, node: parent[key] });
      continue;
    }
    if (value.startsWith('"') || value.startsWith("'")) value = value.slice(1, value.indexOf(value[0], 1));
    else value = value.replace(/\s+#.*$/, "");
    parent[key] = value;
  }
  return root;
}

function declarationsFromDesignMd(text) {
  const yaml = readFrontMatter(text);
  const declarations = new Map();
  for (const [key, value] of Object.entries(yaml.colors ?? {})) {
    if (typeof value === "string" && parseColor(value)) declarations.set(`--color-${key}`, value);
  }
  const fonts = {};
  for (const [key, style] of Object.entries(yaml.typography ?? {})) {
    if (typeof style !== "object") continue;
    const family = style.fontFamily;
    if (family) {
      const role = key.startsWith("display") ? "display" : key === "code" || /mono/i.test(family) ? "mono" : "sans";
      fonts[role] ??= family;
    }
    if (style.fontSize) declarations.set(`--text-${key}`, style.fontSize);
    if (style.lineHeight) declarations.set(`--text-${key}--line-height`, style.lineHeight);
    if (style.letterSpacing !== undefined) declarations.set(`--text-${key}--letter-spacing`, style.letterSpacing);
    if (style.fontWeight) declarations.set(`--text-${key}--font-weight`, style.fontWeight);
  }
  for (const [role, family] of Object.entries(fonts)) declarations.set(`--font-${role}`, family);
  for (const [key, value] of Object.entries(yaml.rounded ?? {})) declarations.set(`--radius-${key}`, value);
  for (const [key, value] of Object.entries(yaml.spacing ?? {})) declarations.set(`--spacing-${key}`, value);
  return declarations;
}

function declarationsFromCss(text) {
  const withoutComments = text.replace(/\/\*[\s\S]*?\*\//g, "");
  const declarations = new Map();
  for (const start of [...withoutComments.matchAll(/@theme[^{]*\{/g)].map((match) => match.index + match[0].length)) {
    let depth = 1;
    let end = start;
    while (depth > 0 && end < withoutComments.length) {
      if (withoutComments[end] === "{") depth += 1;
      if (withoutComments[end] === "}") depth -= 1;
      end += 1;
    }
    for (const match of withoutComments.slice(start, end - 1).matchAll(/(--[\w-]+)\s*:\s*([^;]+);/g)) {
      declarations.set(match[1], match[2].replace(/\s+/g, " ").trim());
    }
  }
  if (declarations.size === 0) throw new Error("file CSS không có khối @theme nào");
  return declarations;
}

// ---------- màu ----------

function parseColor(value) {
  const hex = value.trim().match(/^#([0-9a-f]{3,8})$/i);
  if (hex) {
    let digits = hex[1];
    if (digits.length === 3 || digits.length === 4) digits = [...digits].map((digit) => digit + digit).join("");
    if (digits.length !== 6 && digits.length !== 8) return null;
    const channels = digits.match(/../g).map((pair) => parseInt(pair, 16));
    return { r: channels[0] / 255, g: channels[1] / 255, b: channels[2] / 255, alpha: channels.length === 4 ? channels[3] / 255 : 1 };
  }
  const rgb = value.trim().match(/^rgba?\(\s*([\d.]+)[\s,]+([\d.]+)[\s,]+([\d.]+)(?:[\s,/]+([\d.]+%?))?\s*\)$/i);
  if (rgb) {
    const alpha = rgb[4] === undefined ? 1 : rgb[4].endsWith("%") ? parseFloat(rgb[4]) / 100 : parseFloat(rgb[4]);
    return { r: rgb[1] / 255, g: rgb[2] / 255, b: rgb[3] / 255, alpha };
  }
  return null;
}

const toLinear = (channel) => (channel <= 0.04045 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4);
const fromLinear = (channel) => (channel <= 0.0031308 ? 12.92 * channel : 1.055 * channel ** (1 / 2.4) - 0.055);

function toOklch({ r, g, b }) {
  const [lr, lg, lb] = [r, g, b].map(toLinear);
  const l = Math.cbrt(0.4122214708 * lr + 0.5363325363 * lg + 0.0514459929 * lb);
  const m = Math.cbrt(0.2119034982 * lr + 0.6806995451 * lg + 0.1073969566 * lb);
  const s = Math.cbrt(0.0883024619 * lr + 0.2817188376 * lg + 0.6299787005 * lb);
  const lightness = 0.2104542553 * l + 0.793617785 * m - 0.0040720468 * s;
  const a = 1.9779984951 * l - 2.428592205 * m + 0.4505937099 * s;
  const bAxis = 0.0259040371 * l + 0.7827717662 * m - 0.808675766 * s;
  return { l: lightness, c: Math.hypot(a, bAxis), h: Math.atan2(bAxis, a) };
}

function fromOklchRaw({ l, c, h }) {
  const a = c * Math.cos(h);
  const bAxis = c * Math.sin(h);
  const lCone = (l + 0.3963377774 * a + 0.2158037573 * bAxis) ** 3;
  const mCone = (l - 0.1055613458 * a - 0.0638541728 * bAxis) ** 3;
  const sCone = (l - 0.0894841775 * a - 1.291485548 * bAxis) ** 3;
  return [
    4.0767416621 * lCone - 3.3077115913 * mCone + 0.2309699292 * sCone,
    -1.2684380046 * lCone + 2.6097574011 * mCone - 0.3413193965 * sCone,
    -0.0041960863 * lCone - 0.7034186147 * mCone + 1.707614701 * sCone,
  ];
}

// Ra ngoài dải sRGB thì giảm độ đậm màu tới khi vừa, giữ độ sáng và sắc.
function fromOklch(color) {
  let chroma = color.c;
  for (let step = 0; step < 40; step += 1) {
    const linear = fromOklchRaw({ ...color, c: chroma });
    if (linear.every((channel) => channel >= -0.0005 && channel <= 1.0005)) {
      const [r, g, b] = linear.map((channel) => Math.min(1, Math.max(0, fromLinear(Math.min(1, Math.max(0, channel))))));
      return { r, g, b };
    }
    chroma *= 0.92;
  }
  const [r, g, b] = fromOklchRaw({ ...color, c: 0 }).map((channel) => Math.min(1, Math.max(0, fromLinear(Math.min(1, Math.max(0, channel))))));
  return { r, g, b };
}

function formatColor({ r, g, b }, alpha = 1) {
  const channels = [r, g, b].map((channel) => Math.round(channel * 255));
  if (alpha < 1) return `rgba(${channels.join(", ")}, ${Number(alpha.toFixed(3))})`;
  return `#${channels.map((channel) => channel.toString(16).padStart(2, "0")).join("")}`;
}

const luminance = ({ r, g, b }) => 0.2126 * toLinear(r) + 0.7152 * toLinear(g) + 0.0722 * toLinear(b);
const contrast = (first, second) => {
  const [light, dark] = [luminance(first), luminance(second)].sort((x, y) => y - x);
  return (light + 0.05) / (dark + 0.05);
};

// ---------- suy ra giao diện còn thiếu ----------

const neutralChroma = 0.05;
// Màu luôn tối hay luôn giữ (bề mặt sản phẩm tối, lớp phủ, bóng) không đảo theo giao diện.
const keepAcrossThemes = /^--color-(on-primary|surface-dark.*|on-dark.*|scrim.*|shadow.*)$/;

// Bề mặt xếp chồng lên nền (card, panel): ở giao diện tối bề mặt sáng hơn nền, ở giao diện sáng bề mặt gần trắng.
const backgroundRole = /^--color-(canvas|surface-.+)$/;
const clampLightness = (lightness) => Math.min(0.99, Math.max(0.1, lightness));

function deriveTheme(declarations) {
  const colors = [...declarations].filter(([name, value]) => name.startsWith("--color-") && parseColor(value));
  const canvasValue = declarations.get("--color-canvas") ?? colors[0]?.[1];
  if (!canvasValue) return { base: "light", derived: null, overrides: new Map() };
  const canvas = parseColor(canvasValue);
  const canvasLightness = toOklch(canvas).l;
  const base = luminance(canvas) > 0.4 ? "light" : "dark";
  const newCanvasLightness = Math.min(0.965, Math.max(0.16, 1.16 - canvasLightness));
  const newCanvas = fromOklch({ ...toOklch(canvas), l: newCanvasLightness });
  // Mỗi màu trung tính giữ khoảng cách độ sáng tới nền. Chữ, viền đi ra xa nền mới; bề mặt luôn sáng hơn nền mới.
  const awayFromCanvas = base === "light" ? 1 : -1;
  const overrides = new Map();

  for (const [name, value] of colors) {
    if (keepAcrossThemes.test(name) || name === "--color-primary") continue;
    if (/-(active|hover)$/.test(name)) continue;
    const color = parseColor(value);
    const lch = toOklch(color);
    let next;
    if (name === "--color-canvas") {
      next = newCanvas;
    } else if (lch.c < neutralChroma) {
      const distance = Math.abs(lch.l - canvasLightness);
      const direction = backgroundRole.test(name) ? 1 : awayFromCanvas;
      next = fromOklch({ ...lch, l: clampLightness(newCanvasLightness + direction * distance) });
    } else {
      // Màu nhấn: giữ sắc; lệch độ sáng ra xa nền mới tới khi tương phản ≥ 4.5:1, vì màu trạng thái hay làm chữ.
      next = fromOklch(lch);
      const direction = toOklch(newCanvas).l > 0.5 ? -1 : 1;
      for (let step = 0; step < 40 && color.alpha === 1 && contrast(next, newCanvas) < 4.5; step += 1) {
        lch.l = Math.min(0.97, Math.max(0.05, lch.l + direction * 0.02));
        next = fromOklch(lch);
      }
    }
    overrides.set(name, formatColor(next, color.alpha));
  }

  // Biến thể -active / -hover: giữ khoảng chênh độ sáng với màu gốc nhưng đổi chiều, như khi đổi nền.
  for (const [name, value] of colors) {
    const baseName = name.replace(/-(active|hover)$/, "");
    if (baseName === name || !declarations.has(baseName) || keepAcrossThemes.test(name)) continue;
    const baseNow = toOklch(parseColor(declarations.get(baseName)));
    const baseNext = toOklch(parseColor(overrides.get(baseName) ?? declarations.get(baseName)));
    const variant = toOklch(parseColor(value));
    overrides.set(name, formatColor(fromOklch({ ...variant, l: baseNext.l - (variant.l - baseNow.l) }), parseColor(value).alpha));
  }

  return { base, derived: base === "light" ? "dark" : "light", overrides };
}

// ---------- font ----------

const googleFonts = new Set([
  "Inter", "Roboto", "Open Sans", "Lato", "Montserrat", "Poppins", "Source Sans 3", "Source Serif 4", "Merriweather",
  "Playfair Display", "Cormorant Garamond", "EB Garamond", "Lora", "Newsreader", "Fraunces", "JetBrains Mono",
  "IBM Plex Sans", "IBM Plex Serif", "IBM Plex Mono", "Geist", "Geist Mono", "DM Sans", "DM Serif Display", "Manrope",
  "Nunito", "Work Sans", "Space Grotesk", "Space Mono", "Fira Code", "Noto Sans", "Noto Serif", "Be Vietnam Pro",
]);
// Font thương mại hay gặp trong design system → font gần giọng nhất có trên Google Fonts.
const substitutes = [
  [/copernicus|tiempos|galaxie/i, "Source Serif 4"],
  [/styrene|söhne|sohne|sf pro|circular|graphik/i, "Inter"],
  [/berkeley mono|sf mono|söhne mono/i, "JetBrains Mono"],
];
const fallbackByRole = { display: "Source Serif 4", sans: "Inter", mono: "JetBrains Mono" };

function planFonts(declarations) {
  const load = new Set();
  const notes = [];
  for (const role of ["display", "sans", "mono"]) {
    const name = `--font-${role}`;
    const stack = declarations.get(name);
    if (!stack) continue;
    const families = stack.split(",").map((family) => family.trim().replace(/^['"]|['"]$/g, "")).filter(Boolean);
    const available = families.find((family) => googleFonts.has(family));
    if (available && available === families[0]) {
      load.add(available);
      continue;
    }
    const substitute = available ?? substitutes.find(([pattern]) => pattern.test(families[0]))?.[1] ?? fallbackByRole[role];
    load.add(substitute);
    notes.push(`${families[0]} không có trên Google Fonts, dùng ${substitute}`);
    if (!available) {
      families.splice(1, 0, substitute);
      declarations.set(name, families.map((family) => (/\s/.test(family) && !/^(serif|sans-serif|monospace)$/.test(family) ? `'${family}'` : family)).join(", "));
    }
  }
  const query = [...load].map((family) => `family=${family.replace(/ /g, "+")}:wght@400;500;600;700`).join("&");
  return { href: load.size ? `https://fonts.googleapis.com/css2?${query}&display=swap` : "", notes };
}

// ---------- xuất ----------

// Bề rộng khung mặc định của Tailwind v4. Design system có khoảng cách tên `sm`, `md`… thì Tailwind đọc
// `max-w-sm` thành khoảng cách 12px thay vì khung 24rem, modal và đoạn chữ bị ép còn một chữ mỗi dòng.
const CONTAINERS = { "3xs": "16rem", "2xs": "18rem", xs: "20rem", sm: "24rem", md: "28rem", lg: "32rem", xl: "36rem",
  "2xl": "42rem", "3xl": "48rem", "4xl": "56rem", "5xl": "64rem", "6xl": "72rem", "7xl": "80rem" };

// Khai bề rộng theo đúng nhóm biến của từng lớp; Tailwind đọc nhóm này trước nhóm khoảng cách.
function containerDeclarations(declarations) {
  for (const key of Object.keys(CONTAINERS).filter((key) => declarations.has(`--spacing-${key}`))) {
    for (const group of ["max-width", "min-width", "width"]) declarations.set(`--${group}-${key}`, CONTAINERS[key]);
  }
}

// Bề rộng khung nội dung của trang: lấy theo layout của app (cờ --page-width), không có thì 64rem như max-w-5xl.
// Mọi page trong thư mục dùng class max-w-page nên cùng bề rộng; shell đọc số px để biết panel có đủ
// chỗ ở lề không; check.mjs đo khối ngoài cùng của page theo số này. "full" là app tràn hết bề ngang.
export function parsePageWidth(value = "64rem") {
  const text = String(value).trim();
  if (text === "full") return { width: "full", css: "100%", px: null };
  const match = text.match(/^(\d+(?:\.\d+)?)(px|rem)$/);
  if (!match) throw new Error(`--page-width "${value}" không hợp lệ: cần dạng 1280px, 80rem hay full`);
  return { width: text, css: text, px: Math.round(Number(match[1]) * (match[2] === "rem" ? 16 : 1)) };
}

export function buildTokens(sourcePath, { pageWidth } = {}) {
  const text = readFileSync(sourcePath, "utf8");
  const declarations = sourcePath.endsWith(".css") ? declarationsFromCss(text) : declarationsFromDesignMd(text);
  const fonts = planFonts(declarations);
  const theme = deriveTheme(declarations);
  containerDeclarations(declarations);
  const page = parsePageWidth(pageWidth);
  declarations.set("--max-width-page", page.css);
  const block = (entries) => [...entries].map(([name, value]) => `  ${name}: ${value};`).join("\n");
  const css = [
    `@custom-variant dark (&:where([data-theme="dark"], [data-theme="dark"] *));`,
    `@theme static {\n${block(declarations)}\n}`,
    `:root { color-scheme: ${theme.base}; }`,
    theme.derived ? `:root[data-theme="${theme.derived}"] {\n  color-scheme: ${theme.derived};\n${block(theme.overrides)}\n}` : "",
  ].join("\n\n");
  const meta = { base: theme.base, derived: theme.derived, source: basename(sourcePath), fonts: fonts.notes, page: { width: page.width, px: page.px, from: pageWidth ? "--page-width" : "mặc định" } };
  return [
    `// Token của design system, sinh từ ${basename(sourcePath)} bằng scripts/tokens.mjs. Mọi mã màu của page nằm ở đây.`,
    `// Giao diện ${theme.derived ?? "—"} là suy ra (DESIGN_THEME.derived), không có trong design system gốc.`,
    `window.DESIGN_THEME = ${JSON.stringify(meta)};`,
    fonts.href ? `document.write('<link rel="stylesheet" href="${fonts.href}">');` : "",
    `document.write(${JSON.stringify(`<style type="text/tailwindcss">\n${css}\n</style>`)});`,
    "",
  ].join("\n");
}

export { contrast, parseColor };
