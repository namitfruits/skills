#!/usr/bin/env node
// Kiểm lệnh open của new-design.mjs: mở đúng page đầu của thư mục design, một URL, đường dẫn có dấu cách và dấu được mã
// hoá, thiếu Chrome thì đổi sang trình duyệt mặc định. Mỗi ca dựng .design/ mẫu trong thư mục tạm bằng init, page rồi
// chạy open --dry-run, nên không cửa sổ nào hiện ra.
//
//   node test-open.mjs           # mọi ca trừ C4
//   node test-open.mjs --real    # thêm C4 (macOS): chạy open thật với tên ứng dụng không có, mở một tab ở trình duyệt mặc định
//   node test-open.mjs --keep    # giữ thư mục tạm, in đường dẫn thư mục A/B để mở thử bằng tay
//
// spec: F6.14 F6.15

import { spawnSync } from "node:child_process";
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const script = join(dirname(fileURLToPath(import.meta.url)), "new-design.mjs");
const real = process.argv.includes("--real");
const keep = process.argv.includes("--keep");
const work = join(mkdtempSync(join(tmpdir(), "design-uiux-open-")), "thư mục có dấu cách");
mkdirSync(work);
const run = (params, env = {}) => {
  const result = spawnSync(process.execPath, [script, ...params], { cwd: work, encoding: "utf8", env: { ...process.env, ...env } });
  return { code: result.status, out: result.stdout.trim(), err: result.stderr.trim() };
};
const results = [];
const expect = (name, ok, detail) => results.push(`${ok ? "✓" : "✗"} ${name}${detail ? ` — ${detail}` : ""}`);
const root = join(work, ".design");
const urlOf = (dir, file) => pathToFileURL(join(dir, file)).href;
const command = (url) =>
  process.platform === "darwin" ? `$ open -na "Google Chrome" --args --new-window ${url}`
  : process.platform === "linux" ? `$ google-chrome --new-window ${url}`
  : null;

const options = run(["init", "open-ab", "--root", root]).out.split("\n").pop();
const optionFiles = [
  ["bang", "A · Bảng gọn", "Một bảng dài, lọc ở trên."],
  ["the", "B · Thẻ lớn", "Mỗi lịch hẹn một thẻ."],
].map(([slug, option, layout]) => run(["page", options, slug, "--title", `Lịch hẹn · ${option}`, "--option", option, "--layout", layout]).out.split("/").pop());

{
  const result = run(["open", options, "--dry-run"]);
  const url = urlOf(options, optionFiles[0]);
  const lines = result.out.split("\n");
  const expected = command(url) ? [command(url), `chrome ${url}`] : [`none ${url}`];
  expect("C1 thư mục A/B: một lệnh, một URL, là phương án A", result.code === 0 && lines.join("\n") === expected.join("\n") && !result.out.includes(optionFiles[1]), result.out);
}

{
  const flow = run(["init", "open-luong", "--root", root]).out.split("\n").pop();
  const screens = ["Chào", "Đăng ký", "Xác nhận"].map((name, index) => run(["page", flow, `man-${index + 1}`, "--title", `Mở tài khoản · ${name}`, "--screen", `${index + 1} · ${name}`, "--purpose", name]).out.split("/").pop());
  const result = run(["open", flow, "--dry-run"]);
  expect("C2 thư mục luồng: URL là màn 1", result.code === 0 && result.out.endsWith(urlOf(flow, screens[0])) && !screens.slice(1).some((file) => result.out.includes(file)), result.out);
}

{
  const url = run(["open", options, "--dry-run"]).out.split(" ").pop();
  expect("C3 đường dẫn có dấu cách và dấu được mã hoá", url.includes("th%C6%B0%20m%E1%BB%A5c%20c%C3%B3%20d%E1%BA%A5u%20c%C3%A1ch") && !url.includes(" "), url);
}

if (real && process.platform === "darwin") {
  const result = run(["open", options], { DESIGN_UIUX_CHROME_APP: "Không Có Ứng Dụng Này" });
  const log = existsSync(join(options, "run.log")) ? readFileSync(join(options, "run.log"), "utf8") : "";
  expect("C4 thiếu Chrome: mở bằng trình duyệt mặc định, stderr báo, run.log ghi default", result.code === 0 && result.out === `default ${urlOf(options, optionFiles[0])}` && result.err.includes("không có Google Chrome") && /new-design\topen\t.*\tdefault/.test(log), `${result.out} · ${result.err}`);
}

{
  const empty = join(root, "khong-co-page");
  mkdirSync(empty);
  const result = run(["open", empty, "--dry-run"]);
  expect("C5 thư mục không có page: exit 1", result.code === 1 && /không có page nào/.test(result.err), result.err);
}

{
  const log = existsSync(join(options, "run.log")) ? readFileSync(join(options, "run.log"), "utf8") : "";
  expect("C6 --dry-run không ghi run.log", !/new-design\topen\t.*\tchrome/.test(log), log.split("\n").filter((line) => line.includes("\topen\t")).join(" / "));
}

console.log(results.join("\n"));
if (keep) console.log(`giữ thư mục A/B: ${options}`);
else rmSync(dirname(work), { recursive: true, force: true });
process.exit(results.some((line) => line.startsWith("✗")) ? 1 : 0);
