#!/usr/bin/env node
// Soát SKILL.md có theo đúng thiết kế trong SPEC.md không, và PLANS.md (khi skill có file này) có ghi mỗi yêu cầu do
// plan nào chạm tới không.
//
//   node scripts/spec-check.mjs [skills/<tên> …] [--list | --matrix]
//
// Không đưa skill nào thì soát mọi skill có SPEC.md. --list in mỗi sub-scope đang được gắn ở đâu. --matrix in bảng
// markdown: mỗi yêu cầu cạnh các mục SKILL.md thực thi nó và việc đưa nó vào, để người duyệt đọc nội dung có khớp.
//
// SPEC khai trong mục "## N. Feature requirement" những gì skill đang làm:
//   - **`F1` Tên scope**
//     - `F1.1` Mô tả sub-scope.
// Chỗ thực thi gắn mã bằng chữ `spec:` trong comment:
//   SKILL.md, file .md khác:  <!-- spec: F1.1 F1.2 -->   ngay dưới tiêu đề mục; mục không thực thi yêu cầu nào: <!-- spec: — -->
//   code:                     // spec: F3.1
// Gắn mã scope (F2) là thực thi mọi sub-scope của nó.
// PLANS.md cạnh SPEC.md, optional, có hai mục: ## Plan (việc đã viết plan) và ## Plan Queue (chưa viết plan); mỗi việc một mục
//   ### 005 · Tên việc        (ở Plan Queue: ### PQ-01 · Tên việc)
//   - **Plan:** [005-x.md](../../.plan/005-x.md)        (chỉ ở Plan)
//   - **Status:** draft · approved · done (Plan) · new (Plan Queue)
//   - **Mục tiêu:** vì sao làm, xong thì thấy gì
//   | Mã | Thay đổi | Tóm tắt |   thay đổi là new · update · remove · fix
//
// SKILL.md theo đúng SPEC:
//   - sub-scope nào cũng có mục SKILL.md gắn mã; gắn trong code không thay được, vì agent chạy skill chỉ đọc SKILL.md
//   - mục ## / ### nào của SKILL.md cũng có dòng spec: ngay dưới tiêu đề
//   - mã gắn ở đâu cũng phải có trong SPEC; mã SPEC nhắc ngoài mục Feature requirement cũng vậy
// PLANS.md khớp SPEC:
//   - sub-scope nào cũng nằm trong một việc done hay approved
//   - ở mục Plan bảng ghi mã sub-scope, không ghi mã scope
//   - mã trong bảng phải có trong SPEC, trừ dòng new của việc chưa done (yêu cầu ghi trước); việc done mà remove thì
//     SPEC không còn mã đó
//   - việc nào cũng có Mục tiêu; có số plan thì có dòng Plan trỏ tới file có thật
// Lệnh không kiểm SKILL.md làm đúng hay không: phần đó là việc của lượt chạy thử trong gate của plan.
//
// Chỉ đọc. Exit 0 khi khớp, 1 khi lệch, 2 khi không chạy được. SPEC chưa có mục Feature requirement thì bỏ qua skill
// đó, không tính là lỗi.

import { readFileSync, readdirSync, existsSync, statSync } from "node:fs";
import { join, relative, resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const args = process.argv.slice(2);
const list = args.includes("--list");
const matrix = args.includes("--matrix");
const targets = args.filter((arg) => !arg.startsWith("--"));

const textFile = /\.(md|mjs|js|cjs|py|sh|html|css)$/;
const skipDir = new Set(["node_modules", ".git"]);
const idPattern = String.raw`F\d+(?:\.\d+)?`;
const tagPattern = new RegExp(String.raw`spec:\s*(${idPattern}(?:[\s,]+${idPattern})*)`, "g");
const noneTag = /spec:\s*[—-](?:\s|-->|$)/;
const codeIds = (text) => [...text.matchAll(new RegExp("`(" + idPattern + ")`", "g"))].map((match) => match[1]);
const cells = (line) => line.split("|").slice(1, -1).map((cell) => cell.trim());
const statuses = { plan: ["draft", "approved", "done"], queue: ["new"] };
const changes = ["new", "update", "remove", "fix"];

function skillDirs() {
  if (targets.length) return targets.map((target) => resolve(target));
  const base = join(root, "skills");
  return readdirSync(base)
    .map((name) => join(base, name))
    .filter((dir) => existsSync(join(dir, "SPEC.md")));
}

function* walk(dir) {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    if (entry.isDirectory()) {
      if (!skipDir.has(entry.name)) yield* walk(join(dir, entry.name));
    } else if (textFile.test(entry.name)) {
      yield join(dir, entry.name);
    }
  }
}

// ---------- đọc SPEC ----------

function readSpec(specPath) {
  const lines = readFileSync(specPath, "utf8").split("\n");
  const start = lines.findIndex((line) => /^## \d+\.\s*Feature requirement/i.test(line));
  if (start < 0) return null;
  let end = lines.findIndex((line, index) => index > start && /^## /.test(line));
  if (end < 0) end = lines.length;

  const scopes = new Map(); // F1 → [F1.1, F1.2]
  const subScopes = new Map(); // F1.1 → mô tả
  for (let index = start + 1; index < end; index++) {
    const line = lines[index];
    if (/^### /.test(line)) break;
    const scope = line.match(/^-\s+\*\*`(F\d+)`/);
    if (scope) scopes.set(scope[1], []);
    const sub = line.match(/^\s+-\s+`(F\d+\.\d+)`\s*(.*)$/);
    if (sub) {
      const parent = sub[1].split(".")[0];
      if (!scopes.has(parent)) scopes.set(parent, []);
      scopes.get(parent).push(sub[1]);
      subScopes.set(sub[1], sub[2]);
    }
  }

  // Mã nhắc tới ở các mục khác của SPEC (technical design, lý do) cũng phải có thật.
  const mentions = [];
  lines.forEach((line, index) => {
    if (index > start && index < end) return;
    for (const id of codeIds(line)) mentions.push({ id, line: index + 1 });
  });
  return { scopes, subScopes, mentions };
}

// ---------- đọc PLANS.md ----------

function readPlans(plansPath) {
  // Mỗi việc một mục: ### 005 · Tên (ở Plan) hay ### PQ-01 · Tên (ở Plan Queue), dưới là **Plan:** · **Status:** ·
  // **Mục tiêu:** và bảng | Mã | Thay đổi | Tóm tắt |.
  const lines = readFileSync(plansPath, "utf8").split("\n");
  const items = []; // { part, id, title, plan, status, goal, changes: [{ id, change, line }], line }
  let part = null;
  let fence = false;
  lines.forEach((line, index) => {
    if (/^\s*```/.test(line)) fence = !fence;
    if (fence) return;
    if (/^## /.test(line)) {
      part = /^## Plan Queue\s*$/i.test(line) ? "queue" : /^## Plans?\s*$/i.test(line) ? "plan" : null;
      return;
    }
    if (!part) return;
    const heading = line.match(/^### (.+?)(?:\s+·\s+(.*))?$/);
    if (heading) {
      items.push({ part, id: heading[1].trim(), title: heading[2] ?? "", plan: "", status: "", goal: "", changes: [], line: index + 1 });
      return;
    }
    const item = items.at(-1);
    if (!item) return;
    const field = line.match(/^-\s+\*\*(Plan|Status|Mục tiêu):\*\*\s*(.*)$/);
    if (field) item[{ Plan: "plan", Status: "status", "Mục tiêu": "goal" }[field[1]]] = field[2].trim();
    const row = line.startsWith("|") ? cells(line) : null;
    const id = row?.[0].match(/^`(F\d+(?:\.\d+)?)`$/)?.[1];
    if (id) item.changes.push({ id, change: row[1] ?? "", line: index + 1 });
  });
  return items;
}

// ---------- đọc SKILL.md: tiêu đề mục và dòng spec: ngay dưới ----------

function readSkillSections(skillPath) {
  const lines = readFileSync(skillPath, "utf8").split("\n");
  const sections = []; // { title, line, tagged, firstLine }
  let fence = false;
  lines.forEach((line, index) => {
    if (/^\s*(```|~~~)/.test(line)) fence = !fence;
    if (fence) return;
    const heading = line.match(/^(##|###) (.+)$/);
    if (heading) sections.push({ title: heading[2].trim(), line: index + 1, tagged: false });
  });
  for (const section of sections) {
    const next = lines.slice(section.line).find((line) => line.trim() !== "");
    section.tagged = Boolean(next && /<!--\s*spec:/.test(next));
  }
  const sectionAt = (lineNumber) => [...sections].reverse().find((section) => section.line <= lineNumber);
  return { sections, sectionAt };
}

// ---------- soát một skill ----------

function checkSkill(dir) {
  const name = relative(root, dir);
  const specPath = join(dir, "SPEC.md");
  const skillPath = join(dir, "SKILL.md");
  if (!existsSync(specPath)) return { name, errors: [`không có SPEC.md`] };
  const spec = readSpec(specPath);
  if (!spec || spec.subScopes.size === 0) return { name, skipped: "SPEC chưa có mục Feature requirement" };
  if (!existsSync(skillPath)) return { name, errors: [`không có SKILL.md`] };

  const known = (id) => spec.scopes.has(id) || spec.subScopes.has(id);
  const expand = (id) => (spec.scopes.has(id) ? spec.scopes.get(id) : [id]);
  const errors = [];
  for (const { id, line } of spec.mentions) {
    if (!known(id)) errors.push(`SPEC.md:${line} nhắc ${id}, mà mục Feature requirement không có`);
  }

  // Việc 1: mọi mục SKILL.md có dòng spec:, mọi sub-scope có mục SKILL.md gắn.
  const skill = readSkillSections(skillPath);
  for (const section of skill.sections) {
    if (!section.tagged) errors.push(`SKILL.md:${section.line} mục "${section.title}" chưa có dòng spec: ngay dưới tiêu đề`);
  }

  const covered = new Map([...spec.subScopes.keys()].map((id) => [id, []])); // id → [{ at, file, section }]
  for (const file of walk(dir)) {
    if (file === specPath) continue;
    const where = relative(dir, file);
    readFileSync(file, "utf8").split("\n").forEach((line, index) => {
      if (where !== "SKILL.md" && noneTag.test(line)) errors.push(`${where}:${index + 1} ghi spec: —, mà chỉ mục SKILL.md mới được ghi`);
      for (const match of line.matchAll(tagPattern)) {
        for (const id of match[1].split(/[\s,]+/).filter(Boolean)) {
          const at = `${where}:${index + 1}`;
          if (!known(id)) {
            errors.push(`${at} gắn ${id}, mà SPEC không có`);
            continue;
          }
          const section = where === "SKILL.md" ? skill.sectionAt(index + 1)?.title : undefined;
          for (const sub of expand(id)) covered.get(sub).push({ at, file: where, section });
        }
      }
    });
  }
  for (const [id, places] of covered) {
    if (places.some((place) => place.file === "SKILL.md")) continue;
    errors.push(`${id} chưa có trong SKILL.md` + (places.length ? ` (chỉ có ở ${places.map((place) => place.at).join(" · ")})` : ""));
  }

  // PLANS.md: mỗi sub-scope do một việc đã hoàn thành hay đang làm đưa vào.
  const plansPath = join(dir, "PLANS.md");
  if (!existsSync(plansPath)) return { name, errors, covered, spec, from: new Map(), counts: null }; // PLANS.md là optional
  const plans = readPlans(plansPath);
  const from = new Map([...spec.subScopes.keys()].map((id) => [id, []])); // F1.1 → [việc]
  for (const item of plans) {
    const at = `PLANS.md:${item.line} ${item.id}`;
    const section = item.part === "plan" ? "Plan" : "Plan Queue";
    if (item.part === "plan" && !/^\d{3}$/.test(item.id)) errors.push(`${at}: ở mục Plan tiêu đề phải dạng "### NNN · tên", NNN là số plan`);
    if (item.part === "queue" && !/^PQ-\d+$/.test(item.id)) errors.push(`${at}: ở mục Plan Queue tiêu đề phải dạng "### PQ-NN · tên"`);
    if (!statuses[item.part].includes(item.status)) errors.push(`${at} status "${item.status}", ở mục ${section} cần ${statuses[item.part].join(" · ")}`);
    if (item.part === "plan" && !item.plan) errors.push(`${at} chưa có dòng **Plan:**`);
    const link = item.plan.match(/\]\(([^)]+)\)/)?.[1];
    if (link && !existsSync(join(dir, link))) errors.push(`${at} trỏ tới ${link}, mà không có file đó`);
    if (!item.goal) errors.push(`${at} chưa có dòng **Mục tiêu:** — việc phải nói rõ vì sao làm, xong thì thấy gì`);
    const live = item.status === "done" || item.status === "approved";
    for (const change of item.changes) {
      const row = `PLANS.md:${change.line} ${change.id}`;
      // Ở mục Plan, mã scope (F1) sẽ tính luôn sub-scope thêm sau này, mà plan đó không làm.
      if (item.part === "plan" && !change.id.includes(".")) errors.push(`${row} là mã scope — ở mục Plan ghi từng sub-scope plan đó chạm tới`);
      if (!changes.includes(change.change)) errors.push(`${row} thay đổi "${change.change}", cần ${changes.join(" · ")}`);
      if (!known(change.id)) {
        // Việc chưa xong được ghi trước yêu cầu mới, chưa có trong SPEC.
        if (!(change.change === "new" && item.status !== "done")) errors.push(`${row} có trong ${item.id} mà SPEC không có`);
        continue;
      }
      if (change.change === "remove" && item.status === "done") errors.push(`${row} ${item.id} đã bỏ yêu cầu này mà SPEC vẫn còn`);
      if (live) for (const sub of expand(change.id)) from.get(sub).push(item);
    }
  }
  for (const [id, items] of from) {
    if (items.length === 0) errors.push(`${id} chưa có trong PLANS.md: chưa việc done hay approved nào chạm tới nó`);
  }

  const counts = Object.fromEntries([...statuses.plan, ...statuses.queue].map((status) => [status, 0]));
  for (const item of plans) if (item.status in counts) counts[item.status]++;
  return { name, errors, covered, spec, from, counts };
}

// ---------- in ----------

function printMatrix(result) {
  console.log(`\n### ${result.name}\n`);
  console.log("| Mã | Yêu cầu | Mục SKILL.md thực thi | Việc đưa vào |");
  console.log("| --- | --- | --- | --- |");
  for (const [id, text] of result.spec.subScopes) {
    const sections = [...new Set(result.covered.get(id).filter((place) => place.file === "SKILL.md").map((place) => place.section))];
    const rows = (result.from.get(id) ?? []).map((item) => (item.status === "done" ? `plan ${item.id}` : `plan ${item.id} (${item.status})`));
    console.log(`| \`${id}\` | ${text} | ${sections.join(" · ") || "—"} | ${rows.join(" · ") || "—"} |`);
  }
  console.log("");
}

const dirs = skillDirs();
if (dirs.length === 0) {
  console.error("Không có skill nào có SPEC.md.");
  process.exit(2);
}
for (const dir of dirs) {
  if (!existsSync(dir) || !statSync(dir).isDirectory()) {
    console.error(`Không thấy thư mục skill: ${dir}`);
    process.exit(2);
  }
}

let failed = false;
for (const dir of dirs) {
  const result = checkSkill(dir);
  if (result.skipped) {
    console.log(`– ${result.name} · bỏ qua: ${result.skipped}`);
    continue;
  }
  if (list && result.covered) {
    for (const [id, places] of result.covered) console.log(`  ${id}  ${places.map((place) => place.at).join(" · ") || "—"}`);
  }
  if (matrix && result.covered) printMatrix(result);
  if (result.errors.length) {
    failed = true;
    console.log(`✗ ${result.name} · ${result.errors.length} lỗi`);
    for (const error of result.errors) console.log(`  ${error}`);
  } else {
    const counts = result.counts ? Object.entries(result.counts).map(([state, count]) => `${count} ${state}`).join(" · ") : "không có";
    console.log(`✓ ${result.name} · ${result.covered.size} sub-scope · PLANS.md: ${counts}`);
  }
}
process.exit(failed ? 1 : 0);
