---
name: fetch-page
description: Lấy nội dung chính của một trang web — mặc định ra markdown sạch kèm frontmatter (title, author, published, source…), hoặc HTML đã làm sạch, hoặc JSON đủ metadata — mở trang bằng Chrome headless qua Chrome DevTools Protocol (CDP), chạy defuddle ngay trong tab để bỏ menu, quảng cáo, sidebar. Dùng khi user đưa một URL và muốn đọc, tóm tắt, trích nội dung, lưu bài thành markdown/HTML/JSON, hoặc khi WebFetch/curl bị chặn (Cloudflare "Just a moment...") hay trả về trang thiếu nội dung vì phải chạy JS mới hiện.
---

# Trang web → nội dung chính

## Chạy thế nào

```
URL ──► Chrome headless ──CDP──► tab đã chạy JS xong ──► defuddle chạy trong tab ──► md | html | json
```

Script mở Chrome với cổng debug, nối websocket vào một tab và ra lệnh CDP: đổi User-Agent, đặt khung
màn hình desktop, `Page.navigate`, chờ trang ổn định. Sau đó nó inject bundle defuddle vào trang và
gọi `parseAsync()` trên DOM thật. Defuddle luôn lọc trang trước; `--format` chỉ quyết định kết quả
lọc được in ra dưới dạng nào.

Defuddle chạy **trong Chrome** chứ không qua JSDOM: CSS thật, không phải parse lại HTML 1–2 MB, nên
phần defuddle chỉ mất dưới 1 giây.

## Dùng

Thư mục skill: `${CLAUDE_SKILL_DIR}`. Lần đầu (hoặc khi chưa có `node_modules/` trong thư mục skill):

```bash
npm install --prefix ${CLAUDE_SKILL_DIR}
```

Mỗi lần lấy trang:

```bash
node ${CLAUDE_SKILL_DIR}/fetch-page.mjs <url> -o /tmp/page.md
```

| Flag | Tác dụng |
|---|---|
| `--format md\|html\|json` | Dạng đầu ra, mặc định `md` (xem bảng dưới) |
| `-o <file>` | Ghi kết quả ra file. Không có thì in ra stdout |
| `--raw-html <file>` | Lưu thêm HTML thô của trang (sau khi JS chạy, trước khi defuddle lọc) để soi khi kết quả lạ |

| `--format` | Ra gì | Khi nào dùng |
|---|---|---|
| `md` | Frontmatter YAML + markdown, giống `defuddle parse --markdown --frontmatter` | Đọc, tóm tắt, lưu bài |
| `html` | HTML đã làm sạch, không kèm metadata | Cần giữ cấu trúc HTML (bảng phức tạp, render lại) |
| `json` | Cả object defuddle trả về: `content` là HTML, `contentMarkdown` là markdown, cùng `title`, `author`, `published`, `schemaOrgData`, `metaTags`… | Cần metadata để xử lý tiếp bằng code |

Cần Node ≥ 22 (dùng `WebSocket` có sẵn) và Chrome. Chrome không nằm ở chỗ quen thuộc thì đặt
`CHROME_PATH`.

stderr in `title`, `url` (sau redirect), `wordCount` và thời gian. Một bài báo thường mất 2–6 giây.

## Đọc kết quả trước khi dùng

`wordCount` là chỗ nhìn đầu tiên. Bài báo mà chỉ vài chục từ, hay markdown dừng giữa chừng, thì
defuddle đã bỏ mất một phần. Soi bằng cách chạy lại với `--raw-html`, rồi so các đoạn `<p>` trong thân
bài của HTML với markdown.

Lỗi thì script thoát với mã 1 và in lý do ra stderr: domain sai (`net::ERR_NAME_NOT_RESOLVED`), vẫn
kẹt ở trang chặn bot, hoặc trang bắt giải captcha. Gặp captcha thì đừng chạy lại, kết quả sẽ y hệt.

## Vì sao script đặt những thứ này

Mỗi dòng dưới đây là một lỗi đã gặp thật. Bỏ cái nào thì lỗi đó quay lại.

| Trong script | Nếu không có |
|---|---|
| `Network.setUserAgentOverride` bỏ chữ `HeadlessChrome` | Cloudflare trả trang "Just a moment..." thay cho bài (machinelearningmastery.com) |
| `Emulation.setDeviceMetricsOverride` rộng 1440 | Khung headless mặc định ~756px, AP News coi là mobile, gập nửa sau bài bằng `display: none`, defuddle xoá phần bị ẩn → mất nửa bài |
| Không chờ `Page.loadEventFired`, chỉ chờ DOMContentLoaded rồi chờ chữ trên trang thôi đổi (tối đa 10s) | Trang báo nhiều quảng cáo không bao giờ bắn `load`, script treo hoặc chờ không 15s |
| `FIX_CODE_HIGHLIGHTERS` thay khối Urvanov/Crayon bằng `<pre><code>` | Plugin WordPress này vẽ code thành bảng số dòng + code, defuddle ra bảng markdown với code dồn một dòng |
| `CAPTCHA_PAGE` nhận ra trang captcha AWS WAF (`window.gokuProps`, script `captcha.awswaf.com`) | Script thoát mã 0 và in trang "Let's confirm you are human" ra như một bài 29 từ (arstechnica.com) |
| `Page.setBypassCSP` | Trang có CSP chặt chặn việc inject bundle defuddle |
| Chờ Chrome thoát hẳn rồi mới xoá profile tạm | `rmSync` gặp `ENOTEMPTY` vì Chrome còn đang ghi file |

## Khi gặp site mới lỗi

- **Khối code ra thành bảng** ⇒ site dùng một plugin highlight khác. Tìm trong HTML thô (`--raw-html`) chỗ
  chứa code thô (thường là `textarea` ẩn hoặc thuộc tính `data-*`), thêm selector vào
  `FIX_CODE_HIGHLIGHTERS`.
- **Mất một đoạn giữa bài** ⇒ tìm trong HTML xem đoạn đó có bị ẩn (`display: none`, class `hidden`)
  không. Thường là JS của site gập bài lại; tìm điều kiện khiến nó gập (khung màn hình, cookie) thay vì
  tắt `removeHiddenElements` — tắt đi thì menu mobile, popup ẩn cũng lọt vào markdown.

## Giới hạn

- Chỉ qua được kiểu chặn bot nhìn User-Agent. Captcha, kiểm tra dấu vân tay trình duyệt, paywall thì
  không qua. Captcha chỉ nhận ra được loại của AWS WAF; loại khác (reCAPTCHA, hCaptcha toàn trang…) vẫn
  lọt qua thành kết quả, nên `wordCount` thấp bất thường thì mở markdown ra xem.
- Ngôn ngữ trong fence code là defuddle đoán; HTML không ghi thì có thể đoán sai (Python ra ` ```js `).
- `buildFrontmatter` được import theo đường dẫn file trong `node_modules/defuddle/dist/` vì package
  không export nó. Version defuddle ghim ở `0.19.4` trong `package.json`; nâng version thì kiểm tra
  lại đường dẫn này.
