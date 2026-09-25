# CLAUDE.md

## Chạy thử skill

Chạy skill qua `.claude/skills`, symlink trỏ về `skills/` của repo. Như vậy thứ được chạy là bản
đang sửa trong repo, không phải bản đã cài ở `~/.claude/skills/`. Chưa có symlink thì tạo:

```bash
mkdir -p .claude && ln -sfn ../skills .claude/skills
```

Kết quả mỗi lần chạy thử để ở `.test/<tên-skill>/NNN-<slug>/`. `.test/` đã được gitignore.

- `NNN` là số thứ tự ba chữ số, đếm riêng cho từng skill: xem số lớn nhất đang có trong
  `.test/<tên-skill>/` rồi cộng 1. Không ghi đè thư mục của lần chạy cũ, để còn so được giữa các lần.
- `slug` là vài chữ tả lần chạy đó, vd `001-apnews-bessent-ai`, `003-apnews-after-rename`.
- Trong thư mục, file đặt tên chung một tiền tố và phân biệt bằng đuôi: `page.md`, `page.json`…
  Phần skill in ra stderr ghi thành file cùng tên thêm `.log` (`page.md.log`).
- Chạy thử `fetch-page` thì luôn kèm `--raw-html page.raw.html`. Nhờ vậy mỗi thư mục trong
  `.test/fetch-page/` là một trang đã lưu để `replay.mjs` chạy lại (bước "Kiểm tra" trong "Vòng lặp cải
  tiến" của SKILL.md). Sửa script xong thì replay cả bộ: `node skills/fetch-page/replay.mjs .test/fetch-page/*/`.
