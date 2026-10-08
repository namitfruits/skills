// P3 — Không vào được registry npm thì npx getdesign@latest làm gì?
// Chạy: node .probe/010-design-uiux-chon-design-getdesign/P3-registry-loi/probe.mjs
import { sh, writeLog } from "../common.mjs";

const env = { npm_config_registry: "http://127.0.0.1:9", npm_config_fetch_retries: "0" };
const start = Date.now();
const list = sh("npx", ["-y", "getdesign@latest", "list"], { env });
writeLog(import.meta.url, [
  `registry http://127.0.0.1:9 · getdesign list: exit ${list.code} · ${((Date.now() - start) / 1000).toFixed(1)} giây · stdout ${list.out.trim() ? list.out.trim().split("\n").length : 0} dòng`,
  `stderr dòng đầu: ${list.err.split("\n").find(Boolean) ?? ""}`,
]);
