// P2 — getdesign add --out có ghi đúng đường dẫn được đưa, và báo lỗi thế nào?
// Chạy: node .probe/010-design-uiux-chon-design-getdesign/P2-add-out/probe.mjs
import { existsSync, mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { sh, writeLog } from "../common.mjs";

const work = mkdtempSync(join(tmpdir(), "probe-010-p2-"));
sh("git", ["init", "-q"], { cwd: work });
const env = { GETDESIGN_DISABLE_TELEMETRY: "1" };
const add = sh("npx", ["-y", "getdesign@latest", "add", "claude", "--out", ".design/x/DESIGN.md"], { cwd: work, env });
const again = sh("npx", ["-y", "getdesign@latest", "add", "claude", "--out", ".design/x/DESIGN.md"], { cwd: work, env });
const unknown = sh("npx", ["-y", "getdesign@latest", "add", "khong-co", "--out", "y.md"], { cwd: work, env });
writeLog(import.meta.url, [
  `add claude --out .design/x/DESIGN.md: exit ${add.code} · file có: ${existsSync(join(work, ".design/x/DESIGN.md"))} · gốc repo có DESIGN.md: ${existsSync(join(work, "DESIGN.md"))}`,
  `chạy lại khi đích đã có, không --force: exit ${again.code} · ${again.err.split("\n")[0]}`,
  `tên lạ: exit ${unknown.code} · ${unknown.err.split("\n")[0]}`,
]);
