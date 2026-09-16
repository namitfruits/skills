# skills

Agent skills tôi hay dùng. Cài được cho Claude Code, Codex, Cursor, OpenCode và ~70 agent khác.

[![skills.sh](https://skills.sh/b/namitfruits/skills)](https://skills.sh/namitfruits/skills)

## Cài đặt

```bash
# Cài toàn bộ
npx skills add namitfruits/skills

# Cài một skill cụ thể
npx skills add namitfruits/skills --skill write-plan

# Xem có gì mà không cài
npx skills add namitfruits/skills --list

# Cài global cho Claude Code, không hỏi gì
npx skills add namitfruits/skills --skill '*' -g -a claude-code -y
```

## Skills

| Skill | Mô tả |
| --- | --- |
| [`write-plan`](skills/write-plan/SKILL.md) | Viết plan doc cho một feature — trình bày trong chat trước, chốt ID công việc, rồi dựng file theo khung cố định 7 section (Problem · Goal · Mental model · Probe · Decisions · Design · Phases — Probe optional), phase có Goal · Actions · Gate với ký hiệu 🤖/👤, tick tới đâu làm tới đó. Đọc convention của project để lấy binding (thư mục, hệ ID, doc nguồn, lệnh kiểm). Kèm `verify.py` lint khung + sợi dây ID + phủ thiết kế. |
| [`estimate-effort`](skills/estimate-effort/SKILL.md) | Ước lượng effort dự án bằng man-day từ functional requirements + techstack. Quy trình 3 bước: Sizing FE/BE → Manday Build → Full SDLC. |
| [`explain-with-diagrams`](skills/explain-with-diagrams/SKILL.md) | Giải thích một cơ chế, một bug hay một kiến trúc bằng sơ đồ mermaid nền tối — mỗi sơ đồ một section, link [mermaid.live](https://mermaid.live) mở được ngay, hình mang cấu trúc còn chữ mang lời giải. Kèm [`mermaid-link.mjs`](skills/explain-with-diagrams/mermaid-link.mjs) sinh link offline + verify round-trip. |
| [`mermaid-diagram-design`](skills/mermaid-diagram-design/SKILL.md) | Style spec cho mermaid diagram — "zone-tinted flowchart": subgraph tô nền per vùng, classDef palette, shape có nghĩa. Kèm [`verify.py`](skills/mermaid-diagram-design/verify.py) lint + render 2 nền sáng/tối. |

## Dùng thử không cài

```bash
npx skills use namitfruits/skills@write-plan | claude
```

## License

MIT — xem [LICENSE](LICENSE).
