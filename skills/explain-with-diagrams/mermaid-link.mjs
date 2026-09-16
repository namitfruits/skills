#!/usr/bin/env node
/**
 * Sinh link mermaid.live từ file `.mmd` — **offline**, không gọi mạng.
 *
 *   node mermaid-link.mjs a.mmd b.mmd …
 *
 * In ra link `/edit` (live editor: code + hình cạnh nhau) kèm cờ `roundtrip_ok`.
 */
import { readFileSync } from 'node:fs';
import { deflateSync, inflateSync } from 'node:zlib';

/**
 * **BẢY field — không phải bốn.** Thiếu `rough` / `panZoom` / `editorMode` thì mermaid.live không
 * dựng lại được state và hiện diagram *"Loading URL failed"*, chứ không báo lỗi gì rõ ràng.
 * Đo 2026-09-16: bản 4 field hỏng cả 3 link; bản này mở được.
 */
const encode = (code, theme = 'dark') => {
  const state = {
    code,
    mermaid: `{\n  "theme": "${theme}"\n}`,
    autoSync: true,
    updateDiagram: true,
    rough: false,
    panZoom: true,
    editorMode: 'code',
  };
  /** `deflateSync` = zlib wrapper, y hệt `pako.deflate` mà mermaid.live dùng (payload bắt đầu `eNp`). */
  return deflateSync(Buffer.from(JSON.stringify(state), 'utf8'), { level: 9 }).toString('base64url');
};

const files = process.argv.slice(2);
if (files.length === 0) {
  console.error('dùng: node mermaid-link.mjs <file.mmd> [file2.mmd …]');
  process.exit(1);
}

let failed = false;
for (const file of files) {
  const code = readFileSync(file, 'utf8');
  const payload = encode(code);

  /** Round-trip: giải mã lại **chính payload vừa sinh**, so từng byte với nguồn. */
  const state = JSON.parse(inflateSync(Buffer.from(payload, 'base64url')).toString('utf8'));
  const ok = state.code === code;
  if (!ok) failed = true;

  console.log(`${file}  roundtrip_ok=${ok}  payload=${payload.length} chars`);
  console.log(`  https://mermaid.live/edit#pako:${payload}`);
  console.log('');
}

/** Round-trip hỏng ⇒ exit khác 0: đừng đưa cho user một link chưa biết có mở được không. */
process.exit(failed ? 1 : 0);
