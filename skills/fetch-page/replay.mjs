#!/usr/bin/env node
// Chạy lại fetch-page trên các trang đã lưu, để biết một thay đổi trong script (thêm fix, nâng defuddle)
// có làm lệch kết quả cũ không.
//
//   node replay.mjs <thư mục>...
//
// Mỗi thư mục cần page.raw.html (lưu bằng --raw-html) và page.md (kết quả đã chấp nhận); thiếu thì bỏ
// qua. Kết quả mới ghi ra page.replay.md (+ .log) cạnh page.md, bảng so sánh in ra stdout.

import { spawnSync } from 'node:child_process';
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { basename, dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const fetchPage = join(dirname(fileURLToPath(import.meta.url)), 'fetch-page.mjs');
const wordCount = markdown => markdown.match(/^word_count: (\d+)$/m)?.[1] ?? '?';

const directories = process.argv.slice(2);
if (!directories.length) {
  console.error('Cách dùng: node replay.mjs <thư mục>...');
  process.exit(2);
}

let changed = 0;
for (const directory of directories) {
  const name = basename(directory.replace(/\/$/, ''));
  const rawHtml = join(directory, 'page.raw.html');
  const accepted = join(directory, 'page.md');
  if (!existsSync(rawHtml) || !existsSync(accepted)) {
    console.log(`${name}: bỏ qua, thiếu page.raw.html hoặc page.md`);
    continue;
  }
  const before = readFileSync(accepted, 'utf8');
  const url = before.match(/^source: "(.*)"$/m)?.[1];
  const output = join(directory, 'page.replay.md');
  const run = spawnSync(process.execPath, [fetchPage, url, '--html', rawHtml, '-o', output], { encoding: 'utf8' });
  writeFileSync(`${output}.log`, run.stderr);
  if (run.status !== 0) {
    changed++;
    console.log(`${name}: LỖI — ${run.stderr.trim().split('\n').pop()}`);
    continue;
  }
  const after = readFileSync(output, 'utf8');
  const same = after === before;
  if (!same) changed++;
  // Dòng log về sửa chữa và cảnh báo cho biết vì sao kết quả đổi.
  const notes = run.stderr.split('\n').filter(line => /^(vòng|cảnh báo)/.test(line));
  console.log(`${name}: ${same ? 'giống' : 'KHÁC'}, word_count ${wordCount(before)} → ${wordCount(after)}`);
  notes.forEach(line => console.log(`    ${line}`));
}
console.log(changed ? `\n${changed} trang khác kết quả đã chấp nhận: diff page.md với page.replay.md rồi quyết định.` : '\nMọi trang giống kết quả đã chấp nhận.');
