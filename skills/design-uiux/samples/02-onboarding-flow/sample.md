# Mẫu 02 · Luồng onboarding 3 màn

**Khía cạnh:** đề một luồng thay vì một màn, trong thư mục không có design system. Skill phải xếp đề là một luồng, không tìm phương án A/B, tách luồng thành
3 màn, mỗi màn một page dựng song song; người xem đi hết luồng bằng nút trong page, quay lại vẫn còn chữ đã gõ.

**Đầu vào:** không có. Thư mục chạy thử trống: không codebase, không design system, nên skill in danh sách design của
getdesign, tự chọn bộ khuyên dùng (`--auto`) và dùng bề rộng `64rem`. App chạy trên điện thoại, nên khổ mobile là khổ chính.

## Đề

```text
/design-uiux --auto Thiết kế luồng onboarding 3 màn cho "Tiêu Gọn", app ghi chi tiêu cá nhân trên điện thoại:
1. Welcome: một câu nói app làm gì, nút "Bắt đầu".
2. Đăng ký: email + mật khẩu, hoặc "Tiếp tục với Google".
3. Hồ sơ: tên hiển thị và ngân sách tháng (VND). Nút "Xong" kết thúc luồng (không cần vẽ màn sau đó).
Luôn biết mình đang ở bước mấy, quay lại bước trước được.
```

## Checklist

`*` là thư mục design duy nhất trong `.design/`.

| Mã | Mở file | Đạt khi |
| --- | --- | --- |
| `F1.7` | `chat.md` | dòng đầu tiên bắt đầu bằng `Đọc:` hay `**Đọc:**` có `getdesign`; không câu hỏi đã soạn (câu có các đáp án để chọn) nào nhắc bề rộng trang; dòng kể lựa chọn đã tự trả lời hay `AI đoán` không tính là câu hỏi |
| `F3.6` | `chat.md` | có một khối code ≥ 60 dòng dạng `tên - mô tả`, đứng trước câu hỏi đã soạn đầu tiên; không dòng nào trong khối bắt đầu bằng `kraken` |
| `F3.7` | `chat.md` | có một câu hỏi đã soạn tiêu đề `Design` với đúng 4 đáp án; đáp án 1 có `Khuyên dùng`; tên ở cả 4 đáp án đều có trong khối danh sách của dòng `F3.6` |
| `F3.8` | `.design/*/DESIGN.md`, `.design/*/tokens.js`, `.design/*/brief.md` | `DESIGN.md` có; `tokens.js` có `"source":"getdesign <tên>"`; `<tên>` trùng ô "Chọn" của dòng `Design system` trong `## Quyết định`, ô "Ai quyết" là `--auto` |
| `F3.1` | `.design/*/tokens.js` | có `"source":"getdesign ` |
| `F1.11` | `chat.md`, `.design/*/brief.md` | `chat.md` có chuỗi `Một luồng`; `## Quyết định` có dòng `Loại đề` ghi `một luồng` |
| `F1.15` | `chat.md`, `.design/*/pages.js` | `chat.md` không có bảng tình huống × phương án và không có câu hỏi đã soạn để chọn phương án; không mục nào của `pages.js` có `option` |
| `F1.16` | `chat.md` | có một bảng 3 dòng màn (`Welcome`, `Đăng ký`, `Hồ sơ` theo thứ tự) đứng trước link `file://` đầu tiên |
| `F1.17` | `.design/*/brief.md`, `.design/*/pages.js` | số file `NN-*.html` = 3 = số mục `pages.js` = số dòng có `.html` của `## Luồng`; `screen` của ba mục bắt đầu bằng `1 ·`, `2 ·`, `3 ·` |
| `F1.5` | `subagent-*.md` | số file `subagent-*.md` = số file `NN-*.html` |
| `F1.5` `F6.7` | `progress.log` | dòng `rev 1` của cả ba page có giờ sớm hơn dòng mang bước `Kiểm đầy đủ và tự kiểm` sớm nhất: ba màn dựng chồng thời gian |
| `F6.2` | `.design/*/NN-*.progress.js`, `progress.log` | mỗi file `NN-*.html` có một file `NN-*.progress.js`, mọi bước `"done":true`; mỗi page có ≥ 4 dòng `progress.log` với giờ khác nhau |
| `F2.6` | `.design/*/NN-*.html` | page màn 1 và màn 2 có `$store.design.next(`; page màn 2 và màn 3 có `$store.design.prev(` |
| `F2.7` | `.design/*/NN-*.html`, `.design/*/brief.md` | page màn Đăng ký có `x-model="$store.design.form.` cho ô email; key đó có trong cột "Đưa cho màn sau" của `## Luồng` |
| `F5.8` | `check.log` | không có dòng chứa `lượt đi luồng`; dòng cuối có `✓` và `0 lỗi` |
| `F3.3` | `.design/*/NN-*.html` | mỗi page khai `state` có `data`, `loading`, `empty`, `error`; page màn Đăng ký có ≥ 1 giá trị khác bốn giá trị đó; chỉ đếm giá trị trong `options` của `state` |
| `F5.1` | `check.log` | dòng cuối có `✓` và `0 lỗi` |
