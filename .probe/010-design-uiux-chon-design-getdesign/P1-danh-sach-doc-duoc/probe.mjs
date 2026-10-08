// P1 — Bao nhiêu design của getdesign tải được và tokens.mjs đọc được?
// tokens.mjs cạnh file này là bản chép lúc đo. Chạy: node .probe/010-design-uiux-chon-design-getdesign/P1-danh-sach-doc-duoc/probe.mjs
import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { buildTokens } from "./tokens.mjs";
import { sh, writeLog } from "../common.mjs";

const locate = 'const fs=require("fs"),p=require("path");console.log(p.join(p.dirname(fs.realpathSync(process.argv[1])),"..","templates"))';
const templates = sh("npx", ["-y", "-p", "getdesign@latest", "-c", `node -e '${locate}' "$(command -v getdesign)"`]).out.trim().split("\n").at(-1);
const listLines = sh("npx", ["-y", "getdesign@latest", "list"]).out.trim().split("\n").length;
const index = await (await fetch("https://getdesign.md/.well-known/agent-skills/index.json")).json();
const aerotime = (await fetch("https://getdesign.md/design-md/aerotime/DESIGN.md")).status;
const krakenSite = (await (await fetch("https://getdesign.md/design-md/kraken/DESIGN.md")).text()).split("\n")[0];

const manifest = JSON.parse(readFileSync(join(templates, "manifest.json"), "utf8"));
const failed = [];
for (const entry of manifest) {
  try { buildTokens(join(templates, entry.file)); } catch (error) { failed.push(`${entry.brand}: ${error.message.split("\n")[0]}`); }
}
writeLog(import.meta.url, [
  `getdesign list: ${listLines} dòng · manifest.json: ${manifest.length} mục · file .md trong templates/: ${readdirSync(templates).filter((f) => f.endsWith(".md")).length}`,
  `site agent-skills index: ${index.skills.length} mục`,
  `site design ngoài gói (aerotime): HTTP ${aerotime}`,
  `site bản kraken, dòng đầu: ${krakenSite}`,
  `tokens.mjs đọc được: ${manifest.length - failed.length}/${manifest.length}`,
  ...failed.map((line) => `  ✗ ${line}`),
]);
