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
| [`write-plan`](skills/write-plan/SKILL.md) | Viết plan doc cho một feature — chốt ID công việc trong chat trước, rồi dựng file theo skeleton Vấn đề → Sau plan này có gì → phase (Goal · Actions · Gate), tick tới đâu làm tới đó. Tự đọc convention của project. |
| [`estimate-effort`](skills/estimate-effort/SKILL.md) | Ước lượng effort dự án bằng man-day từ functional requirements + techstack. Quy trình 3 bước: Sizing FE/BE → Manday Build → Full SDLC. |
| [`mermaid-diagram-design`](skills/mermaid-diagram-design/SKILL.md) | Style spec cho mermaid diagram — "zone-tinted flowchart": subgraph tô nền per vùng, classDef palette, shape có nghĩa. Kèm [`verify.py`](skills/mermaid-diagram-design/verify.py) lint + render 2 nền sáng/tối. |

## Dùng thử không cài

```bash
npx skills use namitfruits/skills@write-plan | claude
```

## License

MIT — xem [LICENSE](LICENSE).
