# Mẫu 04 · Một màn mới, chạy nhanh

**Khía cạnh:** đường ngắn nhất của skill, dùng để thử nhanh sau khi sửa. Đề là một màn mới, không có codebase. Đề đủ
rõ để skill không phải hỏi: có ba tình huống dùng và đủ trường dữ liệu. Đề chỉ định sẵn design của getdesign, nên skill
không in danh sách design và không hỏi chọn design. Skill xếp đề là một màn, dựng hai phương án A và B, kiểm rồi giao.

**Đầu vào:** không có. Thư mục chạy thử trống. Skill cần mạng để tải design `linear.app` của getdesign.

## Đề

```text
/design-uiux --auto Thiết kế màn "Lịch hẹn hôm nay" cho lễ tân phòng khám nha khoa, xem trên máy tính ở quầy. Design system: npx getdesign@latest add linear.app
Lễ tân mở màn này đầu ngày để biết hôm nay có bao nhiêu ca và bác sĩ nào kín lịch. Trong ngày, mỗi khi có bệnh nhân bước vào, lễ tân tìm đúng lịch hẹn và bấm "Đã đến". Cuối ngày, lễ tân lọc ra những người không đến để gọi hẹn lại.
Mỗi lịch hẹn có: giờ, tên bệnh nhân, số điện thoại, dịch vụ (khám, cạo vôi, nhổ răng, niềng), bác sĩ, trạng thái (chưa đến, đã đến, đang khám, xong, không đến). Mỗi ngày có 20–40 lịch hẹn, chia cho 3 bác sĩ.
```

## Checklist

`*` là thư mục design duy nhất trong `.design/`.

| Mã | Mở file | Đạt khi |
| --- | --- | --- |
| `F1.7` `F3.1` | `chat.md` | dòng đầu tiên bắt đầu bằng `Đọc:` hay `**Đọc:**` có `linear.app` |
| `F3.6` | `chat.md` | không có khối code ≥ 60 dòng dạng `tên - mô tả`; không có câu hỏi đã soạn tiêu đề `Design` |
| `F3.8` | `.design/*/DESIGN.md`, `.design/*/tokens.js` | `DESIGN.md` có; `tokens.js` có `"source":"getdesign linear.app"` |
| `F1.1` | `chat.md` | không có câu hỏi đã soạn nào (câu có các đáp án để chọn) |
| `F1.4` | `chat.md` | không có lượt nào dừng chờ người dùng trả lời |
| `F1.11` | `chat.md`, `.design/*/brief.md` | `chat.md` có chuỗi `Một màn`; `## Quyết định` có dòng `Loại đề` ghi `một màn` |
| `F1.2` | `chat.md`, `.design/*/pages.js` | có bảng tình huống × phương án với ≥ 2 cột phương án; `pages.js` có đúng 2 mục, `option` bắt đầu bằng `A ·` và `B ·`. Có 1 mục thì xem dòng `F1.14` |
| `F1.14` | `chat.md`, `.design/*/pages.js` | `pages.js` có 1 mục thì `chat.md` có dòng bắt đầu bằng `Chỉ một hướng:`. `pages.js` có 2 mục thì kết quả là `không chạm` |
| `F1.5` | `subagent-*.md` | số file `subagent-*.md` = số file `NN-*.html` |
| `F1.3` | `.design/*/brief.md`, `subagent-*.md` | mỗi `subagent-*.md` chép lại ≥ 1 con số lấy từ mục `## Số kiểm chéo ở mặc định` của `brief.md` |
| `F3.3` | `.design/*/NN-*.html` | mỗi page khai `state` có `data`, `loading`, `empty`, `error`; chỉ đếm giá trị trong `options` của `state` |
| `F3.2` `F5.4` | `.design/*/shots/` | mỗi page có ≥ 1 ảnh tên chứa `--bam-` |
| `F5.1` | `check.log` | dòng cuối có `✓`, số page bằng số file `NN-*.html`, và `0 lỗi` |
