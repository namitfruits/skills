---
name: fetch-page
description: Lấy nội dung chính của một trang web — mặc định ra markdown sạch kèm frontmatter (title, author, published, source…), hoặc HTML đã làm sạch, hoặc JSON đủ metadata — tải trước bằng curl_cffi giả Chrome (dưới 1 giây, qua được Cloudflare), kết quả đáng ngờ thì mở Chrome headless qua Chrome DevTools Protocol (CDP), chạy defuddle để bỏ menu, quảng cáo, sidebar. Dùng khi user đưa một URL và muốn đọc, tóm tắt, trích nội dung, lưu bài thành markdown/HTML/JSON, hoặc khi WebFetch/curl bị chặn (Cloudflare "Just a moment...") hay trả về trang thiếu nội dung vì phải chạy JS mới hiện.
---

# Trang web → nội dung chính

## Chạy thế nào

```
URL ──► curl_cffi ──► defuddle (Node) ──► mọi kiểm tra sạch? ──có──────────────────────────────────────► md | html | json
                                                │không
                                                ▼
        Chrome headless ──CDP──► tab đã chạy JS xong ──► defuddle ──► detect mọi problem ──hết lỗi──► md | html | json
                                                            ▲                │có lỗi
                                                            └── chạy fix ◄───┘
```

**Đường nhanh: curl_cffi.** `curl-fetch.py` tải trang bằng curl_cffi với `impersonate="chrome"`. Đây là
curl build với BoringSSL, bắt tay TLS và HTTP/2 giống hệt Chrome, nên Cloudflare coi là Chrome thật.
curl thường hay `fetch` của Node thì bị chặn, dù gửi đúng header của Chrome. Script chạy file này bằng
`uv run --script`, rồi bóc HTML bằng defuddle trong Node. Tải dưới 1 giây, không mở trình duyệt.

Đường này không chạy JS, không có CSS, không có vòng sửa lỗi. Vì vậy kết quả chỉ được nhận khi mọi
kiểm tra đều sạch: HTTP 200, là HTML, không phải trang chặn bot hay captcha, từ 150 chữ trở lên, và
không `detect` nào trong `PROBLEMS` báo lỗi (chạy trên DOM linkedom). Một kiểm tra không qua là mở
Chrome. Trang nào curl_cffi đọc được thì Chrome cũng đọc được, nên chuyển sang Chrome không làm kết quả
tệ đi, chỉ chậm hơn vài giây.

**Đường chắc: Chrome.** Script mở Chrome với cổng debug, nối websocket vào một tab và ra lệnh CDP: đổi
User-Agent, đặt khung màn hình desktop, `Page.navigate`, chờ trang ổn định. Sau đó nó inject bundle
defuddle vào trang và gọi `parseAsync()` trên DOM thật. Defuddle luôn lọc trang trước; `--format` chỉ
quyết định kết quả lọc được in ra dưới dạng nào.

Sau defuddle là vòng lặp sửa lỗi, dùng danh sách `PROBLEMS` trong `page-fixes.mjs`:

- Mỗi problem có một hàm `detect` đọc kết quả defuddle và báo lỗi nếu có, ví dụ `code bị vẽ thành bảng`
  hay `thiếu chữ`. Mỗi problem cũng có một danh sách `fixes`, mỗi fix là một nguyên nhân đã gặp.
- Phát hiện lỗi thì chạy các fix chưa thử của lỗi đó. Fix sửa DOM của trang (gỡ thuộc tính, thay khối),
  không thêm chữ. Sau đó defuddle đọc lại, rồi detect lại.
- Vòng lặp dừng khi hết lỗi, khi không fix nào sửa được gì, hoặc sau 5 vòng. Mỗi fix chỉ thử một lần.
  Kết quả in ra là kết quả ít lỗi nhất. Lỗi nào còn lại thì stderr có dòng `cảnh báo:`.

Trang bình thường chỉ chạy defuddle một lần. Mỗi vòng thêm tốn khoảng 0,2s.

Trên đường Chrome, defuddle chạy **trong tab** chứ không qua JSDOM: CSS thật, không phải parse lại HTML
1–2 MB, nên phần defuddle chỉ mất dưới 1 giây.

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
| `--html <file>` | Không tải trang thật mà mở lại file đã lưu bằng `--raw-html` (vẫn phải đưa URL gốc). Luôn mở bằng Chrome. JS tắt, CSS và ảnh vẫn tải từ mạng |
| `--chrome` | Bỏ qua curl_cffi, mở Chrome luôn. Dùng để so với kết quả của curl_cffi |
| `--debug` | In ra stderr các khối có chữ mà defuddle xoá, xoá ở bước nào. Chỉ để dò lỗi: bật lên thì defuddle giữ lại vài thứ, `wordCount` lệch vài từ |

| `--format` | Ra gì | Khi nào dùng |
|---|---|---|
| `md` | Frontmatter YAML + markdown, giống `defuddle parse --markdown --frontmatter` | Đọc, tóm tắt, lưu bài |
| `html` | HTML đã làm sạch, không kèm metadata | Cần giữ cấu trúc HTML (bảng phức tạp, render lại) |
| `json` | Cả object defuddle trả về: `content` là HTML, `contentMarkdown` là markdown, cùng `title`, `author`, `published`, `schemaOrgData`, `metaTags`…, thêm `fetchedWith` (`"curl_cffi"` hoặc `"chrome"`) | Cần metadata để xử lý tiếp bằng code |

Cần Node ≥ 22 (dùng `WebSocket` có sẵn), Chrome, và [uv](https://docs.astral.sh/uv/) cho đường
curl_cffi. Lần đầu uv tự cài curl_cffi theo khai báo ở đầu `curl-fetch.py`, mất vài giây. Không có
uv thì mọi trang đi thẳng Chrome, stderr ghi `curl_cffi không dùng được (không có uv)`. Chrome không
nằm ở chỗ quen thuộc thì đặt `CHROME_PATH`.

stderr in `mở: <url>` lúc bắt đầu. curl_cffi không dùng được thì in thêm
`curl_cffi không dùng được (<lý do>), mở Chrome`. Sau đó là `đường tải`, `title`, `url` (sau
redirect), `wordCount` và thời gian. Một bài báo đi đường curl_cffi mất 1–2 giây, đi đường Chrome
mất 4–10 giây.
Trang có lỗi thì stderr kể lại từng vòng: `vòng 1: <lỗi> — <chi tiết>`, `vòng 1: đã sửa: <fix> (<số chỗ>)`,
`vòng 2: hết lỗi`.

## Đọc kết quả trước khi dùng

Có dòng `cảnh báo:` ở stderr nghĩa là phát hiện được lỗi nhưng chưa có fix nào sửa được. Kết quả vẫn
được in ra, nhưng thiếu chữ hoặc sai định dạng. Báo cho user, và nếu đang ở repo của skill thì đi theo
[vòng lặp cải tiến](#vòng-lặp-cải-tiến).

Mọi lỗi đều được ghi lại trong `logs/` của thư mục skill. Mỗi dòng là một object phẳng, chỉ append thêm.
Chạy bằng `--html` thì không ghi gì.

| File | Ghi khi nào | Các field |
|---|---|---|
| `logs/log.jsonl` | Lỗi chưa sửa được: có `cảnh báo:`, hoặc gặp trang chặn bot, captcha. Mỗi dòng là một việc cần dò | `time`, `url` (URL lúc gọi), `finalUrl` (chỉ khi redirect), `error`, `html` |
| `logs/page-raw/<thời gian>-<domain>.html` | Cùng lúc với `log.jsonl`: HTML của trang trước mọi fix, mở lại được bằng `--html` | |
| `logs/fix.jsonl` | Fix đã sửa được một lỗi và lỗi đó không còn trong kết quả cuối. Để tổng hợp site nào cần fix nào | `time`, `url`, `finalUrl`, `error`, `fix`, `changes` (số chỗ đã sửa) |

Một lần fetch còn nhiều lỗi thì mỗi lỗi một dòng, các dòng dùng chung một `html`. Tổng hợp site nào cần
fix nào:

```bash
jq -r '[(.finalUrl // .url | split("/")[2] | sub("^www\\.";"")), .fix] | @tsv' ${CLAUDE_SKILL_DIR}/logs/fix.jsonl | sort | uniq -c
```

Không có cảnh báo cũng chưa chắc đúng: `detect` chỉ bắt được những kiểu lỗi đã có trong `PROBLEMS`.
Bài báo mà chỉ vài chục từ, hay markdown dừng giữa chừng, thì vẫn nên soi lại.

Lỗi thì script thoát với mã 1 và in lý do ra stderr: domain sai (`net::ERR_NAME_NOT_RESOLVED`), vẫn
kẹt ở trang chặn bot, hoặc trang bắt giải captcha. Gặp captcha thì đừng chạy lại, kết quả sẽ y hệt.

## Vì sao script đặt những thứ này

Mỗi dòng dưới đây là một lỗi đã gặp thật. Bỏ cái nào thì lỗi đó quay lại.

| Trong script | Nếu không có |
|---|---|
| curl_cffi với `impersonate="chrome"`, không phải curl hay `fetch` | Cloudflare nhận ra client không phải trình duyệt qua gói bắt tay TLS, trả 403 dù header y hệt Chrome (apnews.com) |
| Đường curl_cffi chỉ nhận kết quả từ 150 chữ trở lên | reddit có lúc trả HTTP 200 kèm một đoạn JS bắt trình duyệt giải phép tính (39 chữ). Paywall Kiosq chỉ trả phần đầu bài (tomshardware.com: 98 chữ, Chrome ra 709 chữ nhờ fix `thiếu chữ`) |
| Đường curl_cffi chạy mọi `detect` của `PROBLEMS` trên DOM linkedom, báo lỗi là mở Chrome | Đường curl không có vòng sửa lỗi, trang có code vẽ thành bảng sẽ ra bảng markdown hỏng (machinelearningmastery.com, 29 bảng) |
| linkedom được gắn `getClientRects` luôn trả một khung | linkedom không dựng layout, `detect` của `thiếu chữ` gọi `getClientRects` thì ném lỗi |
| `detect` trên đường curl_cffi nhận `DOMParser` bọc HTML vào `<html><body>` trước khi parse | `DOMParser` của linkedom gặp HTML không có `<body>` thì ra body rỗng, `thiếu chữ` không bao giờ báo: tomshardware.com qua đường curl với 216/628 chữ |
| `curl-fetch.py` không giải mã body khi `content-type` không phải HTML | PDF bị đọc thành chữ rác, tới bước đếm chữ mới bị chặn |
| `Network.setUserAgentOverride` bỏ chữ `HeadlessChrome` | Cloudflare trả trang "Just a moment..." thay cho bài (machinelearningmastery.com) |
| `Emulation.setDeviceMetricsOverride` rộng 1440 | Khung headless mặc định ~756px, AP News coi là mobile, gập nửa sau bài bằng `display: none`, defuddle xoá phần bị ẩn → mất nửa bài |
| Không chờ `Page.loadEventFired`, chỉ chờ DOMContentLoaded rồi chờ chữ trên trang thôi đổi (tối đa 10s) | Trang báo nhiều quảng cáo không bao giờ bắn `load`, script treo hoặc chờ không 15s |
| Problem `code bị vẽ thành bảng`, fix `thay khối code Urvanov/Crayon bằng <pre><code>…` | Plugin WordPress này vẽ code thành bảng số dòng + code, defuddle ra bảng markdown với code dồn một dòng (machinelearningmastery.com) |
| Problem `thiếu chữ`, fix `gỡ aria-hidden khỏi các khối có chữ đang hiện…` | Paywall Kiosq gắn `aria-hidden="true"` lên cả nửa sau bài dù chữ vẫn hiện, defuddle xoá mọi `[aria-hidden]` → còn 98/709 từ, không báo lỗi gì (tomshardware.com) |
| `CAPTCHA_PAGE` nhận ra trang captcha AWS WAF (`window.gokuProps`, script `captcha.awswaf.com`) | Script thoát mã 0 và in trang "Let's confirm you are human" ra như một bài 29 từ (arstechnica.com) |
| `Page.setBypassCSP` | Trang có CSP chặt chặn việc inject bundle defuddle |
| Chờ Chrome thoát hẳn rồi mới xoá profile tạm | `rmSync` gặp `ENOTEMPTY` vì Chrome còn đang ghi file |
| `--raw-html` lưu cả doctype | Mở lại bằng `--html` chạy ở quirks mode, bố cục khác nên chỗ ẩn/hiện khác |

## Vòng lặp cải tiến

Skill tự tốt lên qua ba việc lặp lại: **lưu log** mỗi lần gặp lỗi chưa sửa được, **thêm fix** cho lỗi
đó, rồi **update skill**. Lần sau site đó, cùng mọi site mắc cùng lỗi, tự được sửa.

```
lỗi chưa sửa được ──► lưu log (tự động) ──► dò nguyên nhân ──► thêm fix ──► kiểm tra ──► update skill
       ▲                                                                                    │
       └────────────────────── lần fetch sau site đó tự được sửa ◄─────────────────────────┘
```

1. **Lưu log.** Skill tự làm việc này: mỗi lỗi chưa sửa được thành một dòng trong `logs/log.jsonl`, HTML
   của trang nằm trong `logs/page-raw/`. Mỗi dòng trong `log.jsonl` là một việc cần làm.
2. **Dò nguyên nhân.** Mở lại HTML đã lưu bằng `--html` (không cần fetch lại, trang thật có đổi cũng
   không sao), thêm `--debug`. Tìm một câu của đoạn bị mất trong danh sách khối bị xoá là biết defuddle
   xoá nó ở bước nào, vì selector nào. Rồi xem trong HTML phần tử đó mang dấu hiệu gì (`aria-hidden`,
   class, `display: none`).
3. **Thêm fix** trong `page-fixes.mjs`:
   - Lỗi đã có problem nhưng nguyên nhân mới (vd plugin highlight khác) → thêm một fix vào `fixes` của
     problem đó.
   - Kiểu lỗi mới → thêm một problem. `detect` viết theo hiện tượng nhìn thấy trong kết quả, không theo
     site, để lần sau gặp biến thể lạ thì ít nhất cũng có cảnh báo.
   - `name` của fix nói cụ thể nó làm gì với phần tử nào ("gỡ X khỏi Y", "thay X bằng Y"), vì tên này
     được in ra log.
   - Lỗi phải chặn từ trước khi tải trang (User-Agent, khung màn hình) không vào vòng lặp được, sửa trong
     `main()` của `fetch-page.mjs`.
4. **Kiểm tra.** Chạy lại bằng `--html` trên HTML đó: log phải ra `đã sửa: …` rồi `hết lỗi`. Rồi chạy
   `replay.mjs` trên các trang đã lưu trước đây (mỗi trang một thư mục có `page.raw.html` và `page.md`)
   để chắc fix mới không làm lệch trang cũ:
   ```bash
   node ${CLAUDE_SKILL_DIR}/replay.mjs <thư mục>...
   ```
   Chỉ trang vừa sửa được phép ra `KHÁC`. Trang khác mà lệch thì `diff page.md page.replay.md` xem vì sao.
5. **Update skill.** Ghi một dòng vào bảng "Vì sao script đặt những thứ này" (fix là gì, bỏ đi thì lỗi gì
   quay lại, site gặp lần đầu), và vào bảng problem trong SPEC.md.

Mẹo dò cho những lỗi đã gặp:

- **`cảnh báo: chưa sửa được code bị vẽ thành bảng`** ⇒ site dùng một plugin highlight khác. Tìm trong
  HTML thô chỗ chứa code thô (thường là `textarea` ẩn hoặc thuộc tính `data-*`), thêm một fix cho plugin đó.
- **Mất một đoạn giữa bài vì `display: none`** ⇒ thường là JS của site gập bài lại. Tìm điều kiện khiến
  nó gập (khung màn hình, cookie) thay vì tắt `removeHiddenElements`; tắt đi thì menu mobile, popup ẩn
  cũng lọt vào markdown.

## Giới hạn

- Trên đường Chrome, widget do JS chèn vào giữa thân bài lọt vào kết quả. Ví dụ techradar.com: script
  quiz của kwizly.com chèn 7 câu trắc nghiệm, form đăng nhập, bảng xếp hạng, tổng 544 chữ. Chrome ra
  1538 chữ, curl_cffi ra 1088 chữ đúng bằng phần bài, vì không chạy JS. Nên curl_cffi ra ít chữ hơn
  Chrome chưa chắc là curl thiếu: so bằng `--chrome` thì phải xem phần dư là gì.
- Trên đường curl_cffi, `detect` coi mọi phần tử là đang hiện, vì linkedom không có CSS. Nó có thể
  báo nhầm, nhưng báo nhầm chỉ tốn một lần mở Chrome, kết quả không sai đi.
- Qua được kiểu chặn bot nhìn User-Agent (Chrome đã bỏ `HeadlessChrome`) và kiểu nhìn gói bắt tay TLS
  (curl_cffi). Captcha, paywall thì không qua. Captcha chỉ nhận ra được loại của AWS WAF; loại khác (reCAPTCHA, hCaptcha toàn trang…) vẫn
  lọt qua thành kết quả, nên `wordCount` thấp bất thường thì mở markdown ra xem.
- `detect` của `thiếu chữ` chỉ xét `<p>` nằm chung container với đoạn được giữ. Site bọc mỗi đoạn trong
  một `div` riêng, hay defuddle chọn nhầm hẳn container khác, thì chữ mất mà không có cảnh báo.
- `detect` của `code bị vẽ thành bảng` cần một ô chứa dãy số dòng từ 2 trở lên. Khối code một dòng không
  bị bắt, nhưng thường vẫn được sửa theo, vì fix sửa mọi khối của plugin đó trên trang.
- Ngôn ngữ trong fence code là defuddle đoán; HTML không ghi thì có thể đoán sai (Python ra ` ```js `).
- `buildFrontmatter` được import theo đường dẫn file trong `node_modules/defuddle/dist/` vì package
  không export nó. Version defuddle ghim ở `0.19.4` trong `package.json`; nâng version thì kiểm tra
  lại đường dẫn này.
