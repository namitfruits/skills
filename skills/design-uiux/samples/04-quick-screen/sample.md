# Mẫu 04 · Một màn mới, bài mặc định

**Khía cạnh:** đường ngắn nhất của skill, dùng làm bài mặc định khi nghiệm thu plan. Đề là một màn mới, không có
codebase. Đề đủ rõ để skill không phải hỏi làm rõ: có ba tình huống dùng và đủ trường dữ liệu. Đề xin một phương án,
nên skill dựng một page. Đề không nói design, nên skill in danh sách design của getdesign, tự chọn bộ khuyên dùng
(`--auto`), dựng, kiểm rồi giao.

**Đầu vào:** không có. Thư mục chạy thử trống. Skill cần mạng để lấy danh sách và tải design của getdesign.

## Đề

```text
/design-uiux --auto Thiết kế màn "Lịch hẹn hôm nay" cho lễ tân phòng khám nha khoa, xem trên máy tính ở quầy. Chỉ cần một phương án.
Lễ tân mở màn này đầu ngày để biết hôm nay có bao nhiêu ca và bác sĩ nào kín lịch. Trong ngày, mỗi khi có bệnh nhân bước vào, lễ tân tìm đúng lịch hẹn và bấm "Đã đến". Cuối ngày, lễ tân lọc ra những người không đến để gọi hẹn lại.
Mỗi lịch hẹn có: giờ, tên bệnh nhân, số điện thoại, dịch vụ (khám, cạo vôi, nhổ răng, niềng), bác sĩ, trạng thái (chưa đến, đã đến, đang khám, xong, không đến). Mỗi ngày có 20–40 lịch hẹn, chia cho 3 bác sĩ.
```

## Checklist

- Skill không hỏi câu nào ngoài câu chọn design. Skill tự chọn đáp án khuyên dùng của câu đó.
- Chat in danh sách design của getdesign. `tokens.js` ghi nguồn `getdesign <tên bộ đã chọn>`.
- Có đúng 1 page, mở được bằng link trong chat. Chat có dòng `Đề xin một phương án.`
- Bấm "Đã đến" ở một lịch hẹn thì trạng thái của lịch hẹn đó đổi.
- Dòng cuối `check.log` có `0 lỗi`.
