#!/usr/bin/env python3
# spec: F4
"""Mở .metrics/index.html qua một server local, đọc thẳng .metrics/sessions/*.json.

Chạy: python3 .metrics/serve_metrics.py [--port 8765] [--no-open]

Trang mở bằng file:// không đọc được file khác bằng fetch, nên viewer cần server này.
  GET /              .metrics/index.html
  GET /api/metrics   mọi file trong .metrics/sessions/ gộp lại, kèm trạng thái sống của từng session trên máy này.
                     Header ETag đổi khi có file session đổi hay session đổi trạng thái; trang gửi If-None-Match
                     mỗi 3 giây và nhận 304 khi không có gì mới.

Lúc khởi động, server chạy sync_metrics.py một lượt ở nền, để session chạy khi chưa có hook cũng có file.
"""
import hashlib
import json
import platform
import socket
import subprocess
import sys
import threading
import webbrowser
from datetime import datetime, timezone
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
METRICS_DIR = ROOT / ".metrics"
SESSION_DIR = METRICS_DIR / "sessions"
SESSION_REGISTRY = Path.home() / ".claude" / "sessions"  # mỗi tiến trình Claude Code ghi một file <pid>.json
MACHINE = platform.node()

# status trong ~/.claude/sessions/<pid>.json -> trạng thái hiện trên trang
LIVE_STATES = {"busy": "running", "waiting": "waiting", "idle": "idle"}


def live_sessions():
    """sessionId -> {pid, status} của các session còn tiến trình Claude Code sống.

    File <pid>.json ở lại sau khi tiến trình tắt, nên phải hỏi `ps`. Tên tiến trình phải chứa
    "claude", để pid cũ bị chương trình khác dùng lại không bị tính là session còn sống."""
    entries = []
    for f in SESSION_REGISTRY.glob("*.json"):
        try:
            d = json.loads(f.read_text(encoding="utf-8"))
        except (OSError, json.JSONDecodeError):
            continue
        if d.get("sessionId") and isinstance(d.get("pid"), int):
            entries.append(d)
    if not entries:
        return {}

    out = subprocess.run(
        ["ps", "-o", "pid=,comm=", "-p", ",".join(str(d["pid"]) for d in entries)],
        capture_output=True, text=True,
    ).stdout
    alive = set()
    for line in out.splitlines():
        parts = line.split(None, 1)
        if len(parts) == 2 and "claude" in parts[1]:
            alive.add(int(parts[0]))

    result = {}
    for d in sorted(entries, key=lambda d: d.get("statusUpdatedAt") or 0):
        if d["pid"] in alive:
            result[d["sessionId"]] = {"pid": d["pid"], "status": d.get("status")}
    return result


def session_files():
    return sorted(SESSION_DIR.glob("*.json")) if SESSION_DIR.is_dir() else []


def state_of(sid, live):
    proc = live.get(sid)
    return (LIVE_STATES.get(proc["status"], "idle"), proc["pid"]) if proc else ("stopped", None)


def etag(files, live):
    """Dấu vân tay của dữ liệu: tên, giờ sửa, cỡ mỗi file session, cộng trạng thái sống. Không đọc nội dung file."""
    h = hashlib.sha1()
    for f in files:
        st = f.stat()
        h.update(f"{f.name}:{st.st_mtime_ns}:{st.st_size}:{state_of(f.stem, live)}\n".encode())
    return '"' + h.hexdigest() + '"'


def metrics(files, live):
    sessions = []
    for f in files:
        try:
            s = json.loads(f.read_text(encoding="utf-8"))
        except (OSError, json.JSONDecodeError):
            continue
        # live chỉ biết tiến trình trên máy này. Session của máy khác luôn hiện stopped.
        s["state"], s["pid"] = state_of(s["sessionId"], live)
        sessions.append(s)
    sessions.sort(key=lambda s: s["start"])
    return {
        "project": ROOT.name,
        "machine": MACHINE,
        "sessionDir": str(SESSION_DIR),
        "generatedAt": datetime.now(timezone.utc).isoformat(timespec="milliseconds").replace("+00:00", "Z"),
        "sessions": sessions,
    }


class Handler(BaseHTTPRequestHandler):
    def do_GET(self):
        path = self.path.split("?", 1)[0]
        if path in ("/", "/index.html"):
            self.send(200, (METRICS_DIR / "index.html").read_bytes(), "text/html; charset=utf-8")
        elif path == "/api/metrics":
            files, live = session_files(), live_sessions()
            tag = etag(files, live)
            if self.headers.get("If-None-Match") == tag:
                self.send(304, b"", None, tag)
            else:
                body = json.dumps(metrics(files, live), ensure_ascii=False, separators=(",", ":")).encode()
                self.send(200, body, "application/json; charset=utf-8", tag)
        elif path == "/favicon.ico":
            self.send(204, b"", None)
        else:
            self.send(404, b"not found", "text/plain")

    def send(self, code, body, ctype, tag=None):
        self.send_response(code)
        if ctype:
            self.send_header("Content-Type", ctype)
        if tag:
            self.send_header("ETag", tag)
        self.send_header("Cache-Control", "no-store")
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    def log_message(self, *args):
        pass


def taken(port):
    """Có tiến trình nào đang nghe cổng này ở 127.0.0.1 hay ::1 không.
    macOS cho mở 127.0.0.1:port dù một server khác đã nghe ::1:port, và trình duyệt gõ localhost thì vào ::1 trước.
    Chỉ thử bind thì không thấy server kia, nên phải thử kết nối."""
    for family, host in ((socket.AF_INET, "127.0.0.1"), (socket.AF_INET6, "::1")):
        with socket.socket(family, socket.SOCK_STREAM) as s:
            s.settimeout(0.3)
            if s.connect_ex((host, port)) == 0:
                return True
    return False


def bind(port):
    """Cổng đang bận thì thử 20 cổng kế tiếp, để hai project mở viewer cùng lúc được."""
    for p in range(port, port + 20):
        if taken(p):
            continue
        try:
            return ThreadingHTTPServer(("127.0.0.1", p), Handler)
        except OSError:
            continue
    sys.exit(f"Không mở được cổng nào từ {port} tới {port + 19}.")


def main():
    port = int(sys.argv[sys.argv.index("--port") + 1]) if "--port" in sys.argv else 8765
    server = bind(port)
    # Ghi 127.0.0.1, không ghi localhost: server chỉ nghe IPv4, còn localhost có thể ra ::1.
    url = f"http://127.0.0.1:{server.server_address[1]}/"
    threading.Thread(target=subprocess.run, args=([sys.executable, str(METRICS_DIR / "sync_metrics.py")],),
                     daemon=True).start()
    print(f"Metrics của {ROOT.name}: {url}  (Ctrl+C để dừng)", flush=True)
    if "--no-open" not in sys.argv:
        webbrowser.open(url)
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        pass
    return 0


if __name__ == "__main__":
    sys.exit(main())
