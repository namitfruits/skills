#!/usr/bin/env node
// Kiểm hai lệnh lấy design của getdesign trong new-design.mjs: designs và init --getdesign. Mỗi ca chạy lệnh trong một
// thư mục tạm là git repo, rồi so mã thoát, stdout, stderr và thư mục .design/ với mong đợi. Cần mạng để npx tải gói
// getdesign; ca npx hỏng (exit 2) trỏ npm vào một cổng không có gì nghe. Chạy sau mỗi lần sửa phần getdesign của new-design.mjs.
//
//   node test-new-design.mjs
//
// spec: F3.6 F3.8

import { spawnSync } from "node:child_process";
import { existsSync, mkdtempSync, readdirSync, readFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const script = join(dirname(fileURLToPath(import.meta.url)), "new-design.mjs");
const offline = { npm_config_registry: "http://127.0.0.1:9", npm_config_fetch_retries: "0" };

function workDir() {
  const dir = mkdtempSync(join(tmpdir(), "design-uiux-getdesign-"));
  spawnSync("git", ["init", "-q"], { cwd: dir });
  return dir;
}

function run(cwd, params, env = {}) {
  const result = spawnSync(process.execPath, [script, ...params], { cwd, encoding: "utf8", env: { ...process.env, ...env } });
  return { code: result.status, out: result.stdout, err: result.stderr };
}

const designDirs = (cwd) => (existsSync(join(cwd, ".design")) ? readdirSync(join(cwd, ".design")).filter((name) => /^\d{3}-/.test(name)) : []);

const cases = [
  ["G1 designs in các bộ có token, bỏ bộ chỉ có chữ", () => {
    const { code, out, err } = run(workDir(), ["designs"]);
    const lines = out.trim().split("\n");
    return [
      [code === 0, `exit ${code}, mong 0`],
      [lines.length >= 60, `${lines.length} dòng, mong ≥ 60`],
      [lines.every((line) => /^\S+ - \S/.test(line)), "có dòng không đúng dạng `tên - mô tả`"],
      [lines.some((line) => line.startsWith("claude - ")), "thiếu dòng claude"],
      [!lines.some((line) => line.startsWith("kraken")), "còn dòng kraken (chỉ có chữ)"],
      [/bỏ \(chỉ có chữ, không có token\): .*kraken/.test(err), "stderr không kể kraken bị bỏ"],
    ];
  }],
  ["G2 init --getdesign claude chép DESIGN.md vào thư mục design, không ghi ra ngoài .design/", () => {
    const cwd = workDir();
    const { code, out } = run(cwd, ["init", "thu", "--getdesign", "claude"]);
    const dir = out.trim();
    const tokens = existsSync(join(dir, "tokens.js")) ? readFileSync(join(dir, "tokens.js"), "utf8") : "";
    const status = spawnSync("git", ["status", "--porcelain"], { cwd, encoding: "utf8" }).stdout.trim();
    return [
      [code === 0, `exit ${code}, mong 0`],
      [existsSync(join(dir, "DESIGN.md")), "thư mục design thiếu DESIGN.md"],
      [tokens.includes('"source":"getdesign claude"'), 'tokens.js thiếu "source":"getdesign claude"'],
      [status === "?? .design/", `git status ngoài .design/: ${JSON.stringify(status)}`],
    ];
  }],
  ["G3 init --getdesign tên lạ: exit 1, không tạo thư mục", () => {
    const cwd = workDir();
    const { code, err } = run(cwd, ["init", "thu", "--getdesign", "khong-co"]);
    return [[code === 1, `exit ${code}, mong 1`], [/getdesign không có khong-co/.test(err), `stderr: ${err.trim()}`], [designDirs(cwd).length === 0, "có thư mục design"]];
  }],
  ["G4 init --getdesign bộ chỉ có chữ: exit 1, không tạo thư mục", () => {
    const cwd = workDir();
    const { code, err } = run(cwd, ["init", "thu", "--getdesign", "kraken"]);
    return [[code === 1, `exit ${code}, mong 1`], [/kraken chỉ có phần chữ/.test(err), `stderr: ${err.trim()}`], [designDirs(cwd).length === 0, "có thư mục design"]];
  }],
  ["G5 npx hỏng: designs và init --getdesign exit 2, không tạo thư mục", () => {
    const cwd = workDir();
    const list = run(cwd, ["designs"], offline);
    const init = run(cwd, ["init", "thu", "--getdesign", "claude"], offline);
    return [
      [list.code === 2, `designs exit ${list.code}, mong 2`],
      [/không lấy được danh sách getdesign/.test(list.err), `designs stderr: ${list.err.trim()}`],
      [init.code === 2, `init exit ${init.code}, mong 2`],
      [/không tải được claude từ getdesign/.test(init.err), `init stderr: ${init.err.trim()}`],
      [designDirs(cwd).length === 0, "có thư mục design"],
    ];
  }],
  ["G6 --tokens cùng --getdesign: exit 1", () => {
    const { code, err } = run(workDir(), ["init", "thu", "--tokens", "x.md", "--getdesign", "claude"]);
    return [[code === 1, `exit ${code}, mong 1`], [/chỉ dùng một trong --tokens, --getdesign/.test(err), `stderr: ${err.trim()}`]];
  }],
];

let failed = 0;
for (const [name, check] of cases) {
  const misses = check().filter(([ok]) => !ok).map(([, message]) => message);
  console.log(`${misses.length ? "✗" : "✓"} ${name}`);
  for (const message of misses) console.log(`    ${message}`);
  if (misses.length) failed += 1;
}
console.log(failed ? `${failed}/${cases.length} ca trượt` : `${cases.length}/${cases.length} ca ✓`);
process.exit(failed ? 1 : 0);
