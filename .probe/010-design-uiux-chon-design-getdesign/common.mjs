// Dùng chung cho ba probe của plan 010: chạy lệnh, ghi log cùng tên với script, dòng đầu là ngày và version.
import { spawnSync } from "node:child_process";
import { writeFileSync } from "node:fs";

export function sh(command, args, options = {}) {
  const run = spawnSync(command, args, { encoding: "utf8", ...options, env: { ...process.env, ...options.env } });
  return { code: run.status, out: run.stdout ?? "", err: run.stderr ?? "" };
}

export function getdesignVersion() {
  return sh("npx", ["-y", "getdesign@latest", "--version"]).out.trim();
}

export function writeLog(scriptUrl, lines) {
  const path = new URL(scriptUrl).pathname.replace(/\.mjs$/, ".log");
  const head = `${new Date().toISOString().slice(0, 10)} · node ${process.version} · getdesign ${getdesignVersion()}`;
  writeFileSync(path, [head, ...lines, ""].join("\n"));
  console.log([head, ...lines].join("\n"));
}
