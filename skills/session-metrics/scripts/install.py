#!/usr/bin/env python3
# spec: F1
"""Cài tracking session Claude Code vào một project.

Chạy: python3 <skill>/scripts/install.py [thư mục project]     mặc định thư mục đang đứng

- Chép sync_metrics.py, serve_metrics.py, index.html vào <project>/.metrics/, ghi đè bản cũ.
- Tạo .metrics/config.json và .metrics/sessions/ nếu chưa có. Không sửa bản đã có.
- Thêm hook vào <project>/.claude/settings.json. Hook nào có lệnh chứa sync_metrics.py thì được thay tại chỗ, nên cài
  lại hay nâng cấp từ bản cũ trỏ scripts/sync_metrics.py không sinh hook trùng. Hook khác giữ nguyên.

Exit 0 khi xong. Exit 1 khi thư mục không có, hoặc settings.json không đọc được thành JSON; khi đó không file nào bị ghi.
"""
import json
import shutil
import sys
from pathlib import Path

SKILL_DIR = Path(__file__).resolve().parent.parent
FILES = ("sync_metrics.py", "serve_metrics.py", "index.html")
MARK = "sync_metrics.py"

SYNC = 'python3 "$CLAUDE_PROJECT_DIR/.metrics/sync_metrics.py" --hook 2>/dev/null || true'
# Claude Code thoát ngay sau SessionEnd, nên script chạy tách bằng nohup. Lệnh chạy nền bằng & không còn stdin của
# hook, nên đọc payload trước rồi đưa vào script qua pipe.
SESSION_END = ('p=$(cat); printf \'%s\' "$p" | nohup python3 "$CLAUDE_PROJECT_DIR/.metrics/sync_metrics.py" --hook '
               '>/dev/null 2>&1 &')
HOOKS = {
    "UserPromptSubmit": ({"type": "command", "command": SYNC, "timeout": 30, "async": True}, None),
    "PostToolUse": ({"type": "command", "command": SYNC, "timeout": 30, "async": True}, "*"),
    "Notification": ({"type": "command", "command": SYNC, "timeout": 30, "async": True}, None),
    "Stop": ({"type": "command", "command": SYNC, "timeout": 30, "async": True}, None),
    "SessionEnd": ({"type": "command", "command": SESSION_END, "timeout": 10}, None),
}
DEFAULT_CONFIG = {"content": "full", "stageSkills": []}


def merge_hooks(settings):
    """Ghép HOOKS vào settings. Trả về danh sách dòng mô tả việc đã làm."""
    done = []
    hooks = settings.setdefault("hooks", {})
    for event, (hook, matcher) in HOOKS.items():
        groups = hooks.setdefault(event, [])
        found = False
        for group in groups:
            kept = []
            for h in group.get("hooks", []):
                if MARK not in str(h.get("command", "")):
                    kept.append(h)
                elif not found:
                    # Giữ chỗ của hook đầu tiên, thay nội dung.
                    if h != hook:
                        done.append(f"thay hook {event}")
                    kept.append(dict(hook))
                    found = True
                else:
                    done.append(f"bỏ hook trùng {event}")
            group["hooks"] = kept
        # Nhóm chỉ còn rỗng vì vừa bỏ hook trùng thì bỏ luôn nhóm.
        hooks[event] = [g for g in groups if g.get("hooks")]
        if not found:
            group = {"hooks": [dict(hook)]}
            if matcher:
                group = {"matcher": matcher, **group}
            hooks[event].append(group)
            done.append(f"thêm hook {event}")
    return done


def main():
    project = Path(sys.argv[1] if len(sys.argv) > 1 else ".").resolve()
    if not project.is_dir():
        print(f"Không có thư mục {project}", file=sys.stderr)
        return 1

    settings_path = project / ".claude" / "settings.json"
    settings = {}
    if settings_path.exists():
        try:
            settings = json.loads(settings_path.read_text(encoding="utf-8"))
        except ValueError as e:
            print(f"{settings_path} không đọc được thành JSON: {e}. Sửa file rồi chạy lại; chưa file nào bị ghi.",
                  file=sys.stderr)
            return 1
    before = json.dumps(settings, ensure_ascii=False, indent=2) + "\n"
    done = merge_hooks(settings)

    out = project / ".metrics"
    (out / "sessions").mkdir(parents=True, exist_ok=True)
    for name in FILES:
        shutil.copyfile(SKILL_DIR / "metrics" / name, out / name)
        print(f"chép .metrics/{name}")
    config = out / "config.json"
    if not config.exists():
        config.write_text(json.dumps(DEFAULT_CONFIG, indent=2) + "\n", encoding="utf-8")
        print("tạo .metrics/config.json")

    after = json.dumps(settings, ensure_ascii=False, indent=2) + "\n"
    if after != before or not settings_path.exists():
        settings_path.parent.mkdir(exist_ok=True)
        settings_path.write_text(after, encoding="utf-8")
    for line in done or ["hook đã đủ, .claude/settings.json không đổi"]:
        print(line)
    print(f"Xong. Xem metric: python3 .metrics/serve_metrics.py (ở {project})")
    return 0


if __name__ == "__main__":
    sys.exit(main())
