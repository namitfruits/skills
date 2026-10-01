# /// script
# requires-python = ">=3.9"
# dependencies = ["curl_cffi==0.16.3"]
# ///
"""Tải một URL bằng curl_cffi giả Chrome, in JSON ra stdout: status, url (sau redirect), contentType, html.

fetch-page.mjs gọi file này bằng `uv run --script`, uv tự cài curl_cffi theo khai báo ở đầu file.
curl_cffi là curl build với BoringSSL và bộ cấu hình bắt tay TLS/HTTP2 của Chrome, nên Cloudflare
coi nó là Chrome thật. curl thường hay fetch của Node thì bị chặn, dù gửi đúng header của Chrome.
"""

import json
import sys

from curl_cffi import requests

response = requests.get(sys.argv[1], impersonate="chrome", timeout=20, allow_redirects=True)
content_type = response.headers.get("content-type", "")
json.dump(
    {
        "status": response.status_code,
        "url": response.url,
        "contentType": content_type,
        # PDF, ảnh... thì không giải mã thành chữ: fetch-page.mjs sẽ chuyển sang Chrome.
        "html": response.text if "html" in content_type else "",
    },
    sys.stdout,
)
