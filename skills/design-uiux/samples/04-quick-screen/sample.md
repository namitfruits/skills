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

- Skill không hỏi câu nào.
- Dòng `Đọc:` đầu chat nhắc `linear.app`. Chat không in danh sách design của getdesign.
- Có 2 page A và B, mở được bằng link trong chat.
- Bấm "Đã đến" ở một lịch hẹn thì trạng thái của lịch hẹn đó đổi.
- Dòng cuối `check.log` có `0 lỗi`.

