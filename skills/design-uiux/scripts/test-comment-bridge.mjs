#!/usr/bin/env node
// Kiểm lệnh comment-bridge và comment của new-design.mjs trên một thư mục design tạm: cầu nối chạy riêng (cha là tiến
// trình 1), nhận comment, bỏ comment sai token, gửi tin vào hộp thư của session (một socket giả), không bật cầu nối thứ
// hai, tắt khi tiến trình session mất mà giữ _comment-bridge.js, không có hộp thư thì vẫn lưu comment, đổi trạng thái,
// in comment chưa sửa, ghi comment từ prompt chép (--add). Mọi cầu nối test bật đều bị tắt, kể cả khi test hỏng.
//
//   node test-comment-bridge.mjs [--keep]
//
// spec: F7.3 F7.5 F7.7 F7.8 F7.11 F7.12 F7.13

import { execFileSync, spawn } from "node:child_process";
import { existsSync, mkdtempSync, readFileSync, rmSync } from "node:fs";
import { createServer } from "node:net";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const work = mkdtempSync(join(tmpdir(), "design-uiux-bridge-"));
// Bỏ biến của session đang chạy test: cầu nối của test không được gửi vào hộp thư thật, không được canh session thật.
const baseEnv = Object.fromEntries(Object.entries(process.env).filter(([key]) => !key.startsWith("CLAUDE") && key !== "CLAUDECODE"));
const run = (params, env = baseEnv) => execFileSync(process.execPath, [join(here, "new-design.mjs"), ...params], { cwd: work, env, encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] }).trim();
const tryRun = (params, env) => {
  try {
    return { code: 0, out: run(params, env) };
  } catch (error) {
    return { code: error.status, out: `${error.stdout}${error.stderr}` };
  }
};
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const results = [];
const expect = (name, ok, detail) => results.push(`${ok ? "✓" : "✗"} ${name}${detail ? ` — ${detail}` : ""}`);
const readBridge = (dir) => JSON.parse(readFileSync(join(dir, "_comment-bridge.js"), "utf8").match(/DS_COMMENT_BRIDGE = (\{.*\});/)[1]);
const alive = (pid) => {
  try {
    process.kill(pid, 0);
    return true;
  } catch {
    return false;
  }
};
const health = (port) => fetch(`http://127.0.0.1:${port}/health`).then((res) => res, () => null);
const bridges = new Set();
const sleeper = spawn("sleep", ["600"], { stdio: "ignore" });
const inbox = { path: join(work, "inbox.sock"), lines: [] };
const inboxServer = createServer((sock) => sock.on("data", (chunk) => inbox.lines.push(...chunk.toString().trim().split("\n"))));
await new Promise((resolve) => inboxServer.listen(inbox.path, resolve));

try {
  const dir = run(["init", "cau-noi", "--root", join(work, ".design")]);
  const file = join(run(["page", dir, "bang", "--title", "Bảng", "--option", "A · Bảng"])).split("/").pop();
  const env = { ...baseEnv, CLAUDE_PID: String(sleeper.pid), CLAUDE_CODE_SESSION_ID: "s-1", CLAUDE_CODE_ENTRYPOINT: "cli", CLAUDE_CODE_MESSAGING_SOCKET: inbox.path, CLAUDE_CODE_MESSAGING_TOKEN: "hop-thu" };

  const started = Date.now();
  const out = run(["comment-bridge", dir], env);
  const bridge = readBridge(dir);
  bridges.add(bridge.pid);
  const ppid = Number(execFileSync("ps", ["-o", "ppid=", "-p", String(bridge.pid)], { encoding: "utf8" }).trim());
  expect("B1: lệnh thoát trong 5 giây, in `comment-bridge <cổng> inbox`", out === `comment-bridge ${bridge.port} inbox` && Date.now() - started < 5000, `${out} · ${Date.now() - started}ms`);
  expect("B1: cầu nối còn chạy sau khi lệnh thoát, cha là tiến trình 1", alive(bridge.pid) && ppid === 1, `pid ${bridge.pid}, cha ${ppid}`);
  const h = await health(bridge.port);
  const body = await h.json();
  expect("B1: GET /health 200, có Access-Control-Allow-Origin, wake inbox, mã session", h.status === 200 && h.headers.get("access-control-allow-origin") === "*" && body.wake === "inbox" && body.session.id === "s-1" && body.session.entry === "cli", JSON.stringify(body));
  expect("B1: _comment-bridge.js có cổng, token, session, chưa có endedAt", bridge.token.length === 32 && bridge.session.pid === sleeper.pid && !bridge.endedAt);

  const post = (payload) => fetch(`http://127.0.0.1:${bridge.port}/comment`, { method: "POST", headers: { "Content-Type": "text/plain" }, body: JSON.stringify(payload) });
  const comment = { page: file, url: "?theme=dark", viewport: "mobile", theme: "dark", target: { kind: "element", selector: "#design h1", block: "1", text: "Lịch hẹn", rect: { x: 10, y: 20, w: 300, h: 40 } }, body: "tiêu đề to hơn" };
  let res = await post({ ...comment, token: bridge.token });
  await sleep(800);
  const saved = JSON.parse(readFileSync(join(dir, "comments.json"), "utf8"));
  expect("B1: đúng token → 201, comments.json thêm một mục sent", res.status === 201 && saved.length === 1 && saved[0].status === "sent" && saved[0].id === 1 && saved[0].target.selector === "#design h1", `${res.status} · ${saved.length} mục`);
  expect("B1: comments.js là bản sao cho shell đọc", readFileSync(join(dir, "comments.js"), "utf8").includes('"body": "tiêu đề to hơn"'));
  const [auth, user] = inbox.lines.map((line) => JSON.parse(line));
  expect("B4: hộp thư nhận dòng auth có token hộp thư, rồi dòng user nói comment #1 và --pending", auth?.type === "auth" && auth.token === "hop-thu" && user?.type === "user" && /comment #1 trên/.test(user.message.content) && user.message.content.includes("--pending"), user?.message.content);

  res = await post({ ...comment, token: "sai" });
  const missing = await post(comment);
  await sleep(200);
  expect("B1: sai hay thiếu token → 403, comments.json không đổi, hộp thư không nhận thêm", res.status === 403 && missing.status === 403 && JSON.parse(readFileSync(join(dir, "comments.json"), "utf8")).length === 1 && inbox.lines.length === 2, `${res.status} · ${missing.status}`);

  const again = run(["comment-bridge", dir], env);
  expect("B2: bật lại trong cùng session → in cổng cũ, không bật cầu nối thứ hai", again === `comment-bridge ${bridge.port} inbox` && readBridge(dir).pid === bridge.pid, again);
  const other = tryRun(["comment-bridge", dir], { ...env, CLAUDE_CODE_SESSION_ID: "s-2" });
  expect("B2: session khác bật trên cùng thư mục → exit 1, báo mã session đang giữ", other.code === 1 && other.out.includes("s-1"), other.out.trim());

  const pending = run(["comment", dir, "--pending"]);
  run(["comment", dir, "--status", "1", "doing"]);
  const doing = JSON.parse(readFileSync(join(dir, "comments.json"), "utf8"))[0].status;
  run(["comment", dir, "--status", "1", "done"]);
  expect("--status 1 doing rồi done → comments.js có status done", doing === "doing" && readFileSync(join(dir, "comments.js"), "utf8").includes('"status": "done"'), doing);
  expect("--pending in một dòng khi sent, không dòng nào khi done", pending.split("\n").length === 1 && JSON.parse(pending).id === 1 && run(["comment", dir, "--pending"]) === "");
  expect("--status id lạ → exit 1", tryRun(["comment", dir, "--status", "9", "done"]).code === 1);

  const added = run(["comment", dir, "--add", JSON.stringify({ ...comment, body: "nút to hơn" })]);
  const afterAdd = JSON.parse(readFileSync(join(dir, "comments.json"), "utf8"));
  expect("B6: --add '<json>' → in #2, comments.json thêm mục sent", added === "#2" && afterAdd[1]?.status === "sent" && afterAdd[1].body === "nút to hơn", added);
  expect("B6: --add JSON hỏng hay thiếu body → exit 1", tryRun(["comment", dir, "--add", "{hỏng"]).code === 1 && tryRun(["comment", dir, "--add", JSON.stringify({ page: file })]).code === 1);

  sleeper.kill("SIGKILL");
  let closedAfter = null;
  for (let i = 0; i < 30 && closedAfter === null; i += 1) {
    await sleep(100);
    if (!alive(bridge.pid)) closedAfter = (i + 1) * 100;
  }
  const ended = readBridge(dir);
  expect("B3: tiến trình session mất → cầu nối tắt trong 3 giây", closedAfter !== null, closedAfter === null ? "còn chạy" : `${closedAfter}ms`);
  expect("B3: _comment-bridge.js còn, có endedAt, giữ mã session; /health lỗi", Boolean(ended.endedAt) && ended.session.id === "s-1" && (await health(bridge.port)) === null);
  const log = readFileSync(join(dir, "run.log"), "utf8");
  expect("run.log có dòng comment-bridge (bật, tắt) và comment", /\tcomment-bridge\t.*hộp thư inbox/.test(log) && /\tcomment-bridge\t.*tắt: session/.test(log) && /\tcomment\t/.test(log));

  const quiet = run(["init", "khong-hop-thu", "--root", join(work, ".design")]);
  run(["page", quiet, "bang", "--title", "Bảng", "--option", "A · Bảng"]);
  const quietOut = run(["comment-bridge", quiet]);
  const noInbox = readBridge(quiet);
  bridges.add(noInbox.pid);
  const quietHealth = await (await health(noInbox.port)).json();
  const quietRes = await fetch(`http://127.0.0.1:${noInbox.port}/comment`, { method: "POST", headers: { "Content-Type": "text/plain" }, body: JSON.stringify({ ...comment, token: noInbox.token }) });
  await sleep(200);
  expect("B5: không có biến hộp thư → in `none`, wake none, comment vẫn lưu", quietOut.endsWith(" none") && quietHealth.wake === "none" && quietRes.status === 201 && JSON.parse(readFileSync(join(quiet, "comments.json"), "utf8")).length === 1 && inbox.lines.length === 2, quietHealth.wake);
  const stopped = run(["comment-bridge", quiet, "--stop"]);
  await sleep(300);
  expect("B7: --stop → cầu nối tắt, ghi endedAt; chạy lại --stop báo không chạy", stopped === `comment-bridge stopped ${noInbox.port}` && !alive(noInbox.pid) && Boolean(readBridge(quiet).endedAt) && run(["comment-bridge", quiet, "--stop"]) === "comment-bridge not running", stopped);
} catch (error) {
  expect("test chạy hết", false, error.stack);
} finally {
  for (const pid of bridges) if (alive(pid)) process.kill(pid, "SIGTERM");
  if (alive(sleeper.pid)) sleeper.kill("SIGKILL");
  inboxServer.close();
}

console.log(results.join("\n"));
if (process.argv.includes("--keep")) console.log(`\nthư mục: ${work}`);
else rmSync(work, { recursive: true, force: true });
process.exit(results.some((line) => line.startsWith("✗")) ? 1 : 0);
