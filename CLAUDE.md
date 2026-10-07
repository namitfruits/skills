# CLAUDE.md

## SKILL.md và SPEC.md

Skill có SPEC.md thì hai file chia việc như sau:

- **SPEC.md là tư tưởng thiết kế**, viết cho người sửa skill: vấn đề skill giải quyết, mental model, lý do của từng
  quyết định, thứ không thuộc phạm vi. Agent không cần đọc khi chạy.
- **SKILL.md là phần vận hành**, viết cho agent đang chạy skill: từng bước, luật, bảng tra, ví dụ, dấu hiệu làm sai.
  File phải đủ để chạy, không trỏ sang SPEC để lấy luật — khi chạy agent chỉ load SKILL.md.

Phân vân một đoạn nên để đâu thì hỏi: agent đang chạy có cần đoạn này để làm đúng không? Cần thì để ở SKILL.md; chỉ
để hiểu vì sao thì để ở SPEC.md. Hai file được nhắc cùng một khái niệm, nhưng luật chi tiết chỉ nằm ở SKILL.md — viết
hai nơi thì sửa một bên sẽ quên bên kia.

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

## Sơ đồ

Sơ đồ trong SKILL.md, doc, README luôn vẽ bằng mermaid (theo skill `mermaid-diagram-design`), không vẽ bằng ký tự
ASCII (`─►`, `│`, `└──`).
