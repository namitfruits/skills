#!/usr/bin/env node
// Tạo thư mục chạy thử cho một bài mẫu. Chạy từ gốc repo:
//   node skills/design-uiux/samples/prepare.mjs <bài> [--skills <thư mục chứa design-uiux>] [--slug <chữ>]
// Tạo .test/design-uiux/NNN-sample-<bài>[-<slug>]/, chép project/ của bài (không chép sample.md), trỏ .claude/skills về
// --skills (mặc định skills/ của repo), in JSON { dir, prompt, feedback } ra stdout.
import { readFileSync, readdirSync, existsSync, mkdirSync, cpSync, symlinkSync } from "node:fs";
import { join, dirname, resolve, relative } from "node:path";
import { fileURLToPath } from "node:url";

const samplesDir = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(samplesDir, "../../..");
const fail = (message) => {
  console.error(message);
  process.exit(2);
};

const args = process.argv.slice(2);
const flag = (name) => {
  const i = args.indexOf(name);
  return i < 0 ? undefined : args.splice(i, 2)[1];
};
const skills = resolve(flag("--skills") ?? join(repoRoot, "skills"));
const slug = flag("--slug");
const sample = args[0];
if (!sample || !existsSync(join(samplesDir, sample, "sample.md"))) {
  const names = readdirSync(samplesDir).filter((name) => existsSync(join(samplesDir, name, "sample.md")));
  fail(`cách dùng: prepare.mjs <bài> [--skills <dir>] [--slug <chữ>]; bài: ${names.join(", ")}`);
}
if (!existsSync(join(skills, "design-uiux/SKILL.md"))) fail(`không thấy ${join(skills, "design-uiux/SKILL.md")}`);

// Khối ```text dưới một heading `## <title>`, tới heading `##` kế tiếp.
function textBlocks(text, title) {
  const section = text.split(new RegExp(`^## ${title}\\s*$`, "m"))[1]?.split(/^## /m)[0] ?? "";
  return [...section.matchAll(/^```text\n([\s\S]*?)\n```/gm)].map((match) => match[1]);
}
const sampleText = readFileSync(join(samplesDir, sample, "sample.md"), "utf8");
const [prompt] = textBlocks(sampleText, "Đề");
if (!prompt) fail(`${sample}/sample.md: không có khối \`\`\`text dưới "## Đề"`);

const testRoot = join(repoRoot, ".test/design-uiux");
mkdirSync(testRoot, { recursive: true });
const last = Math.max(0, ...readdirSync(testRoot).map((name) => Number(name.match(/^(\d{3})-/)?.[1] ?? 0)));
const dir = join(testRoot, `${String(last + 1).padStart(3, "0")}-sample-${sample}${slug ? `-${slug}` : ""}`);
mkdirSync(join(dir, ".claude"), { recursive: true });
if (existsSync(join(samplesDir, sample, "project"))) cpSync(join(samplesDir, sample, "project"), dir, { recursive: true });
symlinkSync(skills.startsWith(repoRoot + "/") ? relative(join(dir, ".claude"), skills) : skills, join(dir, ".claude/skills"));

console.log(JSON.stringify({ dir, prompt, feedback: textBlocks(sampleText, "Vòng góp ý") }, null, 2));
