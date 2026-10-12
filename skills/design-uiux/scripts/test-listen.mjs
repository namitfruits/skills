#!/usr/bin/env node
// Kiểm lệnh listen và comment của new-design.mjs trên một thư mục design tạm: nhận comment, bỏ comment sai token,
// đổi trạng thái, in comment chưa sửa, xoá _listen.js khi tắt, không cho hai lệnh nghe cùng thư mục.
//
//   node test-listen.mjs [--keep]
//
// spec: F7.3 F7.5 F7.7 F7.8

import { execFileSync, spawn } from "node:child_process";
import { existsSync, mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const work = mkdtempSync(join(tmpdir(), "design-uiux-listen-"));
const run = (...params) => execFileSync(process.execPath, [join(here, "new-design.mjs"), ...params], { cwd: work, encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] }).trim();
const tryRun = (...params) => {
  try {
    return { code: 0, out: run(...params) };
  } catch (error) {
    return { code: error.status, out: `${error.stdout}${error.stderr}` };
  }
};
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const results = [];
const expect = (name, ok, detail) => results.push(`${ok ? "✓" : "✗"} ${name}${detail ? ` — ${detail}` : ""}`);

const dir = run("init", "nghe", "--root", join(work, ".design"));
const file = join(run("page", dir, "bang", "--title", "Bảng", "--option", "A · Bảng")).split("/").pop();

const lines = [];
const listener = spawn(process.execPath, [join(here, "new-design.mjs"), "listen", dir], { stdio: ["ignore", "pipe", "pipe"] });
listener.stdout.on("data", (chunk) => lines.push(...chunk.toString().trim().split("\n")));
for (let i = 0; i < 50 && !existsSync(join(dir, "_listen.js")); i += 1) await sleep(100);
const { port, token } = JSON.parse(readFileSync(join(dir, "_listen.js"), "utf8").match(/DS_LISTEN = (\{.*\});/)[1]);
const post = (body) => fetch(`http://127.0.0.1:${port}/comment`, { method: "POST", headers: { "Content-Type": "text/plain" }, body: JSON.stringify(body) });
const comment = { page: file, url: "?theme=dark", viewport: "mobile", theme: "dark", target: { kind: "element", selector: "#design h1", block: "1", text: "Lịch hẹn", rect: { x: 10, y: 20, w: 300, h: 40 } }, body: "tiêu đề to hơn" };

expect("L0: bật thì in `listen <cổng>`, ghi _listen.js có cổng và token", lines[0] === `listen ${port}` && token.length === 32, lines[0]);
const health = await fetch(`http://127.0.0.1:${port}/health`);
expect("L0: GET /health 200, có Access-Control-Allow-Origin", health.status === 200 && health.headers.get("access-control-allow-origin") === "*");

let res = await post({ ...comment, token });
await sleep(200);
const saved = JSON.parse(readFileSync(join(dir, "comments.json"), "utf8"));
expect("L1: đúng token → 201, stdout một dòng `comment`, comments.json thêm một mục sent", res.status === 201 && lines.filter((line) => line.startsWith("comment ")).length === 1 && saved.length === 1 && saved[0].status === "sent" && saved[0].id === 1 && saved[0].target.selector === "#design h1", `${res.status} · ${saved.length} mục`);
expect("L1: comments.js là bản sao cho shell đọc", readFileSync(join(dir, "comments.js"), "utf8").includes('"body": "tiêu đề to hơn"'));
expect("L1: dòng stdout không mang token", !lines.some((line) => line.includes(token)));

res = await post({ ...comment, token: "sai" });
const missing = await post(comment);
await sleep(200);
expect("L2: sai hay thiếu token → 403, comments.json không đổi", res.status === 403 && missing.status === 403 && JSON.parse(readFileSync(join(dir, "comments.json"), "utf8")).length === 1, `${res.status} · ${missing.status}`);

const second = tryRun("listen", dir);
expect("L6: lệnh nghe thứ hai trên cùng thư mục → exit 1", second.code === 1, second.out.trim());

const pending = run("comment", dir, "--pending");
run("comment", dir, "--status", "1", "doing");
const doing = JSON.parse(readFileSync(join(dir, "comments.json"), "utf8"))[0].status;
run("comment", dir, "--status", "1", "done");
expect("L3: --status 1 doing rồi done → comments.js có status done", doing === "doing" && readFileSync(join(dir, "comments.js"), "utf8").includes('"status": "done"'), doing);
expect("L5: --pending in một dòng khi sent, không dòng nào khi done", pending.split("\n").length === 1 && JSON.parse(pending).id === 1 && run("comment", dir, "--pending") === "");
expect("L3: --status id lạ → exit 1", tryRun("comment", dir, "--status", "9", "done").code === 1);

listener.kill("SIGTERM");
await new Promise((resolve) => listener.on("exit", resolve));
expect("L4: tắt lệnh nghe thì _listen.js không còn", !existsSync(join(dir, "_listen.js")));
expect("run.log có dòng listen và comment", /\tlisten\t/.test(readFileSync(join(dir, "run.log"), "utf8")) && /\tcomment\t/.test(readFileSync(join(dir, "run.log"), "utf8")));

console.log(results.join("\n"));
if (process.argv.includes("--keep")) console.log(`\nthư mục: ${dir}`);
else rmSync(work, { recursive: true, force: true });
process.exit(results.some((line) => line.startsWith("✗")) ? 1 : 0);
