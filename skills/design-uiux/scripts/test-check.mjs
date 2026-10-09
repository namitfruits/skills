#!/usr/bin/env node
// Kiểm check.mjs trên các page hỏng có chủ đích: mỗi ca một page trong fixtures/check/, dựng vào .design/ ở thư mục
// tạm, chạy check.mjs, rồi so dòng lỗi với mong đợi. Chạy sau mỗi lần sửa check.mjs hay principles-check.mjs.
//
//   node test-check.mjs [--pw <thư mục có node_modules/playwright>] [--only C1,C3] [--out <thư mục log>]
//
// Mỗi ca in ✓ / ✗ kèm dòng mong đợi thiếu hay dòng cấm có mặt; log đủ của check.mjs nằm ở thư mục log.
//
// spec: F1.3 F1.13 F3.4 F3.9 F5.1 F5.2 F5.4 F5.6 F5.7 F5.8

import { execFileSync, spawnSync } from "node:child_process";
import { copyFileSync, mkdirSync, mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { basename, dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const args = process.argv.slice(2);
const flag = (name) => (args.includes(`--${name}`) ? args[args.indexOf(`--${name}`) + 1] : undefined);
const pwDir = flag("pw") ?? process.env.PW_DIR;
const only = flag("only")?.split(",");

const work = mkdtempSync(join(tmpdir(), "design-uiux-check-"));
const root = join(work, ".design");
const out = resolve(flag("out") ?? join(work, "logs"));
mkdirSync(out, { recursive: true });
const run = (...params) => execFileSync(process.execPath, [join(here, "new-design.mjs"), ...params], { cwd: work, encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] }).trim();

// Page fixture là page đã dựng: đánh dấu xong bước chuẩn bị và mọi bước dựng trừ bước kiểm đầy đủ, như lúc agent chạy
// kiểm đầy đủ. last = 0: chỉ còn bước chuẩn bị chưa xong.
const builtUpTo = (file, last = 5, prepared = true) => {
  if (prepared) run("progress", dirname(file), basename(file), "--prepared");
  for (let step = 1; step <= last; step += 1) run("progress", dirname(file), basename(file), "--done", String(step));
};

// Một thư mục design một page: page trống của new-design.mjs bị thay bằng fixture.
function singlePage(slug, fixture, prepared = true) {
  const dir = run("init", slug, "--root", root);
  const file = run("page", dir, slug, "--title", slug);
  copyFileSync(join(here, "fixtures/check", fixture), file);
  builtUpTo(file, prepared ? 5 : 0, prepared);
  return file;
}

// Thư mục hai page có brief điền đủ: page A đúng bảng Khối, nút chính bg-primary; page B chép từ A rồi đổi số khối
// sang 9 (ngoài bảng) và nút chính sang bg-primary-active. Dựng một lần, C4 và C5 cùng đọc log.
let twoPages;
function twoPageFolder() {
  if (twoPages) return twoPages;
  const dir = run("init", "hai-page", "--root", root);
  const a = run("page", dir, "a", "--title", "Còn bao xa", "--option", "A · Còn bao xa", "--layout", "Trên cùng là thanh tiến độ tới mục tiêu tháng.");
  const b = run("page", dir, "b", "--title", "Từng ngày", "--option", "B · Từng ngày", "--layout", "Trên cùng là số hôm nay, dưới là biểu đồ từng ngày.");
  copyFileSync(join(here, "fixtures/check/hai-page-brief.md"), join(dir, "brief.md"));
  const page = readFileSync(join(here, "fixtures/check/hai-page-a.html"), "utf8");
  writeFileSync(a, page);
  writeFileSync(b, page.replace('data-block="1"', 'data-block="9"').replace("bg-primary px-md", "bg-primary-active px-md"));
  builtUpTo(a);
  builtUpTo(b);
  twoPages = dir;
  return dir;
}

// Thư mục luồng ba màn: khuôn luong-man.html, mỗi màn một thân. broken = màn 2 thiếu nút "Tiếp tục".
const flows = new Map();
function flowFolder(broken = false) {
  if (flows.has(broken)) return flows.get(broken);
  const dir = run("init", broken ? "luong-hong" : "luong", "--root", root);
  const button = (call, label) => `<button type="button" class="h-9 w-fit rounded-md bg-primary px-md text-button text-on-primary" @click="$store.design.${call}()">${label}</button>`;
  const back = (label) => `<button type="button" class="h-9 w-fit rounded-md border border-hairline px-md text-button text-ink" @click="$store.design.prev()">${label}</button>`;
  const screens = [
    ["chao", "1 · Chào", "Biết app làm gì, bắt đầu", button("next", "Bắt đầu")],
    ["email", "2 · Email", "Nhập email", `<input type="email" aria-label="Email" class="h-9 rounded-md border border-hairline px-sm text-ink" x-model="$store.design.form.email">${back("Quay lại")}${broken ? "" : button("next", "Tiếp tục")}`],
    ["xac-nhan", "3 · Xác nhận", "Xem lại email", `<p class="text-body text-ink" x-text="$store.design.form.email || 'Chưa có email'"></p>${back("Sửa email")}`],
  ];
  const template = readFileSync(join(here, "fixtures/check/luong-man.html"), "utf8");
  for (const [slug, screen, purpose, body] of screens) {
    const file = run("page", dir, slug, "--title", screen.slice(4), "--screen", screen, "--purpose", purpose);
    writeFileSync(file, template.replace("<!--NOI-DUNG-->", body));
    builtUpTo(file);
  }
  copyFileSync(join(here, "fixtures/check/luong-brief.md"), join(dir, "brief.md"));
  flows.set(broken, dir);
  return dir;
}

// Thư mục phương án ba page A B C: quá hai phương án.
function threeOptions() {
  const dir = run("init", "ba-phuong-an", "--root", root);
  for (const letter of ["A", "B", "C"]) run("page", dir, letter.toLowerCase(), "--title", letter, "--option", `${letter} · ${letter}`, "--layout", `Bố cục ${letter}.`);
  return dir;
}

// Thư mục đang dựng, brief điền đủ: page A mới xong bước dựng 1 (fixture buoc-1.html, chưa dựng loading, empty,
// error); page B đủ mọi trạng thái, chỉ còn bước kiểm đầy đủ.
let building;
function buildingFolder() {
  if (building) return building;
  const dir = run("init", "dang-dung", "--root", root);
  const a = run("page", dir, "a", "--title", "Còn bao xa", "--option", "A · Còn bao xa", "--layout", "Trên cùng là thanh tiến độ tới mục tiêu tháng.");
  const b = run("page", dir, "b", "--title", "Từng ngày", "--option", "B · Từng ngày", "--layout", "Trên cùng là số hôm nay, dưới là biểu đồ từng ngày.");
  copyFileSync(join(here, "fixtures/check/hai-page-brief.md"), join(dir, "brief.md"));
  copyFileSync(join(here, "fixtures/check/buoc-1.html"), a);
  copyFileSync(join(here, "fixtures/check/hai-page-a.html"), b);
  builtUpTo(a, 1);
  builtUpTo(b);
  building = { dir, a, b };
  return building;
}

// Thư mục một page có bảng "Luật UI theo design system" ghi các dòng rows. shadow: khối 1 thành card có bóng, để luật
// UI6 có chỗ phạm khi không nhường.
const yieldFolders = new Map();
function yieldFolder(slug, rows, shadow = false) {
  if (yieldFolders.has(slug)) return yieldFolders.get(slug);
  const dir = run("init", slug, "--root", root);
  const file = run("page", dir, "a", "--title", "Còn bao xa", "--option", "A · Còn bao xa", "--layout", "Trên cùng là thanh tiến độ tới mục tiêu tháng.");
  const table = ["| Luật | Design system nói | Dẫn chứng | Giữ luật UX bằng |", "| --- | --- | --- | --- |", ...rows.map((cells) => `| ${cells.join(" | ")} |`)].join("\n");
  const brief = readFileSync(join(here, "fixtures/check/hai-page-brief.md"), "utf8").replace(/(### Luật UI theo design system\n\n)Không có\./, `$1${table}`);
  writeFileSync(join(dir, "brief.md"), brief.replace(/\| `02-b\.html`[^\n]*\n/, ""));
  const page = readFileSync(join(here, "fixtures/check/hai-page-a.html"), "utf8");
  writeFileSync(file, shadow ? page.replace('data-block="1" class="mt-lg grid gap-sm"', 'data-block="1" class="mt-lg grid gap-sm rounded-md border border-hairline p-md shadow-md"') : page);
  builtUpTo(file);
  yieldFolders.set(slug, dir);
  return dir;
}

// Thư mục một page, brief điền đủ (brief hai page bỏ dòng B). edit đổi brief, extra chèn HTML vào đầu khối 1.
function onePage(slug, { brief = (text) => text, extra = "" } = {}) {
  const dir = run("init", slug, "--root", root);
  const file = run("page", dir, "a", "--title", "Còn bao xa", "--option", "A · Còn bao xa", "--layout", "Trên cùng là thanh tiến độ tới mục tiêu tháng.");
  writeFileSync(join(dir, "brief.md"), brief(readFileSync(join(here, "fixtures/check/hai-page-brief.md"), "utf8").replace(/\| `02-b\.html`[^\n]*\n/, "")));
  const page = readFileSync(join(here, "fixtures/check/hai-page-a.html"), "utf8");
  writeFileSync(file, page.replace('<section data-block="1" class="mt-lg grid gap-sm">', `<section data-block="1" class="mt-lg grid gap-sm">${extra}`));
  builtUpTo(file);
  return file;
}
// Khối rộng 600px chỉ ở khổ mobile; nút mở khung nổi lệch trái ra ngoài màn hình, có hiệu ứng 300ms.
const mobileOnlyWide = '<div class="w-[600px] sm:w-auto">Khung rộng 600px ở khổ mobile</div>';
const offscreenPanel = '<div x-data="{ open: false }"><button type="button" class="h-9 rounded-md border border-hairline px-md text-button text-ink" @click="open = true">Mở khung</button><div x-show="open" x-transition.duration.300ms role="dialog" class="fixed top-24 -left-24 z-[1100] w-64 bg-surface p-md">Khung lệch trái <button type="button" aria-label="Đóng" @click="open = false">×</button></div></div>';

const cases = [
  {
    id: "C1",
    what: "x-show cùng :style chuỗi: báo ở lượt tĩnh và ở phép so với page mở lại",
    target: () => singlePage("xshow-style", "xshow-style.html"),
    expect: [/x-show cùng :style chuỗi/, /tại chỗ hiện khác khi mở lại link/],
  },
  {
    id: "C2",
    what: "x-show cùng :style object: không báo lỗi vẽ lại",
    target: () => singlePage("xshow-style-ok", "xshow-style-ok.html"),
    forbid: [/x-show cùng :style chuỗi/, /tại chỗ hiện khác khi mở lại link/],
  },
  {
    id: "C3",
    what: "nút chỉ hiện khi target = 0: lượt bấm bấm tới và báo khung nổi dưới toolbar",
    target: () => singlePage("hidden-dialog", "hidden-dialog.html"),
    expect: [/bấm "Đặt mục tiêu".*\]: khung nổi nằm dưới toolbar|\[[^\]]*bấm "Đặt mục tiêu"[^\]]*\]: khung nổi nằm dưới toolbar/],
  },
  {
    id: "C4",
    what: "page dùng data-block ngoài bảng Khối của brief.md",
    target: twoPageFolder,
    expect: [/02-b\.html: data-block "9" không có trong bảng "Khối"/],
    forbid: [/01-a\.html: data-block/],
  },
  {
    id: "C5",
    what: "nút chính hai page khác màu",
    target: twoPageFolder,
    expect: [/nút chính các page khác màu: .*01-a\.html .*02-b\.html/],
  },
  {
    id: "C6",
    what: "thư mục luồng đủ nút: đi hết luồng, dãy màn đủ, không báo lỗi luồng",
    target: () => flowFolder(false),
    forbid: [/không sang được màn/, /mất chữ đã gõ/, /dãy màn có/, /option-switcher có/, /bảng ## Luồng/, /không có trong pages\.js/, /screen phải có dạng/, /thư mục phương án có/],
  },
  {
    id: "C7",
    what: "màn 2 thiếu nút gọi next(): lượt tĩnh và lượt đi luồng đều báo",
    target: () => flowFolder(true),
    expect: [/02-email\.html: màn 2 không có nút gọi \$store\.design\.next\(\)/, /không sang được màn 3: không có nút nào đang hiện gọi/],
  },
  {
    id: "C9",
    what: "kiểm riêng màn 1 của thư mục luồng hỏng: không báo lỗi của màn 2 (agent con khác còn đang dựng)",
    target: () => join(flowFolder(true), "01-chao.html"),
    forbid: [/02-email\.html: màn 2 không có nút/],
  },
  {
    id: "C8",
    what: "thư mục phương án ba page: quá hai phương án",
    target: threeOptions,
    expect: [/thư mục phương án có 3 page; mỗi màn tối đa hai phương án/],
  },
  {
    id: "C10",
    what: "page mới xong bước dựng 1, state error chưa dựng: --quick ở mặc định sạch",
    target: () => buildingFolder().a,
    args: ["--quick"],
    status: 0,
    expect: [/✓ quick · 01-a\.html · 0 lỗi · [\d.]+s/],
  },
  {
    id: "C11",
    what: "cùng page đó, kiểm đầy đủ: báo nút state vặn mà UI không đổi, và còn bước dựng chưa xong",
    target: () => buildingFolder().a,
    status: 1,
    expect: [/vặn nút "state" mà UI không đổi/, /01-a\.html \[01-a\.progress\.js\]: còn bước chưa xong: Đang tải · rỗng · lỗi · Trạng thái riêng/],
  },
  {
    id: "C12",
    what: "page chỉ còn bước kiểm đầy đủ: không báo còn bước chưa xong",
    target: () => buildingFolder().b,
    forbid: [/còn bước chưa xong/],
  },
  {
    id: "C14",
    what: "bước chuẩn bị chưa xong: kiểm đầy đủ báo còn bước chưa xong, kể bước chuẩn bị",
    target: () => singlePage("chua-chuan-bi", "xshow-style-ok.html", false),
    status: 1,
    expect: [/chua-chuan-bi\.progress\.js\]: còn bước chưa xong: Viết brief chung · Khung các khối/],
  },
  {
    id: "C13",
    what: "--quick đưa thư mục: exit 2 kèm câu hướng dẫn",
    target: () => buildingFolder().dir,
    args: ["--quick"],
    status: 2,
    expect: [/--quick kiểm đúng một page/],
  },
  {
    id: "C15",
    what: "bảng Luật UI theo design system ghi UI6, UI11 đủ cột Giữ luật UX bằng: tắt kiểm UI6, không lỗi bảng",
    target: () => yieldFolder("nhuong-du", [["UI6", "card có bóng", "DESIGN.md: cards use shadow-md", "UX4: modal có lớp phủ tối"], ["UI11", "component viết tiền kiểu khác", "src/Money.tsx", "UX4: một khối chỉ một cách viết"]], true),
    forbid: [/\[UI6\]/, /mã cũ|không nhường được|chưa ghi cách giữ|không phải một luật|thiếu "Design system nói"/],
  },
  {
    id: "C16",
    what: "bảng ghi mã cũ G6: báo đổi thành UI6",
    target: () => yieldFolder("nhuong-sai", [["G6", "card có bóng", "DESIGN.md", "UX4: lớp phủ"], ["UX4", "ba nút chính", "DESIGN.md", ""], ["UI2", "hai họ chữ", "DESIGN.md", ""]]),
    expect: [/G6 là mã cũ, đổi thành UI6/],
  },
  {
    id: "C17",
    what: "bảng ghi luật UX4: báo luật UX không nhường được",
    target: () => yieldFolder("nhuong-sai", []),
    expect: [/UX4 là luật UX, không nhường được/],
  },
  {
    id: "C18",
    what: "bảng ghi UI6 mà cột Giữ luật UX bằng trống: báo lỗi bảng, UI6 vẫn kiểm",
    target: () => yieldFolder("nhuong-thieu", [["UI6", "card có bóng", "DESIGN.md: cards use shadow-md", ""]], true),
    expect: [/luật UI6 nhường mà chưa ghi cách giữ UX4/, /\[UI6\]/],
  },
  {
    id: "C19",
    what: "bảng ghi UI2 (Phục vụ —) mà cột Giữ luật UX bằng trống: không lỗi bảng",
    target: () => yieldFolder("nhuong-sai", []),
    forbid: [/UI2[^\n]*(chưa ghi cách giữ|thiếu|không phải)/],
  },
  {
    id: "C20",
    what: "bảng preset ngay dưới bảng Nút dữ liệu chung: chỉ đọc bảng đầu, không báo variables lệch",
    target: () => onePage("preset-duoi-bang", { brief: (text) => text.replace(/(## Nút dữ liệu chung\n\n(?:\|[^\n]*\n)+)/, "$1\nPreset chung:\n\n| Preset | target |\n| ------ | ------ |\n| Ca đông | 4000 |\n") }),
    args: ["--quick"],
    forbid: [/variables khác bảng "Nút dữ liệu chung"/],
  },
  {
    id: "C21",
    what: "kiểm đầy đủ hai lần liền, page không đổi: lần hai dùng lại kết quả, cùng dòng lỗi, không mở trình duyệt",
    target: () => onePage("nho-ket-qua", { extra: mobileOnlyWide }),
    twice: true,
    expect: [/1 page không đổi, dùng lại kết quả lần trước/, /375px[^\n]*\]: cuộn ngang/],
  },
  {
    id: "C22",
    what: "--quick đo cả 375px: khối chỉ rộng ở khổ mobile báo cuộn ngang",
    target: () => onePage("quick-375", { extra: mobileOnlyWide }),
    args: ["--quick"],
    status: 1,
    expect: [/\[375px theme=light&state=data\]: cuộn ngang/],
    forbid: [/\[1280px[^\n]*\]: cuộn ngang/],
  },
  {
    id: "C23",
    what: "--quick --click: bấm nút mở khung nổi, chờ hiệu ứng xong, báo khung lọt ra ngoài màn hình",
    target: () => onePage("quick-click", { extra: offscreenPanel }),
    args: ["--quick", "--click", "Mở khung"],
    status: 1,
    expect: [/bấm "Mở khung"[^\n]*\]: khung nổi lọt ra ngoài màn hình|\[1280px bấm "Mở khung"[^\]]*\]: khung nổi lọt ra ngoài màn hình/],
  },
  {
    id: "C24",
    what: "--quick --click tên không có: báo kèm tên các nút đang hiện",
    target: () => onePage("quick-click-sai", { extra: offscreenPanel }),
    args: ["--quick", "--click", "Không có nút này"],
    status: 1,
    expect: [/không có nút đang hiện tên "Không có nút này" \(có [^\n]*"Mở khung"/],
  },
  {
    id: "C25",
    what: "--brief trên brief còn khuôn trống: exit 1, báo chỗ trống, không mở trình duyệt",
    target: () => { const dir = run("init", "brief-trong", "--root", root); run("page", dir, "a", "--title", "A"); return dir; },
    args: ["--brief"],
    status: 1,
    expect: [/còn chỗ trống chưa điền/, /✗ brief · 0\d\d-brief-trong · \d+ lỗi/],
  },
];

let failed = 0;
const logs = new Map();
for (const testCase of cases.filter((item) => !only || only.includes(item.id))) {
  const target = testCase.target();
  const params = [target, ...(testCase.args ?? []), "--no-shots", ...(pwDir ? ["--pw", pwDir] : [])];
  // twice: chạy hai lần liền, so dòng lỗi hai lần, kiểm trên log lần hai.
  const check = () => spawnSync(process.execPath, [join(here, "check.mjs"), ...params], { encoding: "utf8" });
  let sameAsFirst = true;
  if (testCase.twice) {
    const first = check();
    const second = check();
    const lines = (result) => result.stdout.split("\n").filter((line) => line.startsWith("✗ ") && !/\d+ page ·/.test(line)).join("\n");
    sameAsFirst = lines(first) === lines(second);
    logs.set(params.join(" "), second);
  } else if (!logs.has(params.join(" "))) logs.set(params.join(" "), check());
  const result = logs.get(params.join(" "));
  const log = `${result.stdout}${result.stderr}`;
  writeFileSync(join(out, `${testCase.id}.log`), log);
  const missing = (testCase.expect ?? []).filter((pattern) => !pattern.test(log));
  const present = (testCase.forbid ?? []).filter((pattern) => pattern.test(log));
  // Ca không ghi status thì chỉ cần check.mjs chạy được (exit 0 hay 1); ca có status thì mã thoát phải đúng.
  const statusOk = testCase.status === undefined ? result.status !== 2 : result.status === testCase.status;
  const ok = statusOk && sameAsFirst && !missing.length && !present.length;
  if (!ok) failed += 1;
  console.log(`${ok ? "✓" : "✗"} ${testCase.id} ${testCase.what}`);
  if (!statusOk) console.log(`    check.mjs exit ${result.status}${testCase.status === undefined ? "" : `, cần ${testCase.status}`}: ${log.trim().split("\n").at(-1)}`);
  if (!sameAsFirst) console.log("    lần hai báo dòng lỗi khác lần một");
  for (const pattern of missing) console.log(`    thiếu dòng khớp ${pattern}`);
  for (const pattern of present) console.log(`    có dòng cấm ${pattern}: ${log.split("\n").find((line) => pattern.test(line))?.slice(0, 160)}`);
}
console.log(`${failed ? "✗" : "✓"} ${failed} ca trượt · log ở ${out}`);
process.exit(failed ? 1 : 0);
