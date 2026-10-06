# Module — khung hỏi và gợi ý feature

Dùng ở Bước 1 (tách module, tick feature) và Bước 3 (hỏi chi tiết từng feature) của `SKILL.md`. Gợi ý ở đây là **đáp án để người dùng tick**,
không phải danh sách phải làm hết, và không phải danh sách đóng: module nào trong đề không có ở đây thì dựng feature từ
**khung chung**. Đề thật thì chữ của người dùng thắng chữ ở đây — họ gọi "đơn hàng" thì đừng đổi thành "đối tượng".

## Khung chung — dùng cho mọi module, mọi feature

**Tìm feature của một module** (Bước 1) — một module thường gồm feature thuộc các loại sau, dùng để đoán đáp án khi module
không có trong danh sách gợi ý:

| Loại feature | Câu hỏi gợi ra feature |
| --- | --- |
| tạo / nhập | thứ gì được tạo ra, nhập tay hay lấy từ đâu |
| xem / tìm | ai cần xem gì, tìm theo gì, xem danh sách hay từng cái |
| sửa / huỷ / xoá | sau khi tạo thì đổi được gì, đến lúc nào thì khoá |
| xử lý / duyệt | có bước chuyển trạng thái nào, ai bấm |
| báo cho người khác | ai cần biết khi có chuyện gì |
| xuất / nối ra ngoài | đưa đi đâu: file, email, hệ thống khác |
| cấu hình | thứ gì admin / người dùng tự chỉnh, không cần dev |

**Làm rõ một feature** (Bước 3) — sáu khía cạnh. Câu nào đã rõ hay có mặc định hợp lý thì không hỏi, ghi `A-NN`.

| Khía cạnh | Hỏi gì | Ra mục nào |
| --- | --- | --- |
| cái gì | đối tượng nào, gồm những thông tin gì, ví dụ một cái thật | story, Dữ liệu |
| ai | ai tạo, ai xem, ai sửa / xoá | Actor, câu "Là …" |
| khi nào | lúc nào xảy ra, bao lâu một lần, mới tới mức nào | Luật, Phi chức năng |
| vào / ra | người dùng đưa gì vào, nhận lại gì, ở đâu (màn, email, file, tin nhắn) | AC Then |
| luật | điều kiện, ngưỡng, giới hạn, có số cụ thể | Luật |
| sai thì sao | thiếu, trùng, rỗng, quá nhiều, quá hạn, không có quyền | AC [lỗi] [biên] |

## Thứ tự module

1. **Nền** — thứ module khác cần để có cái mà dùng: tài khoản & đăng nhập, dữ liệu / danh mục gốc (sản phẩm, khách
   hàng, nguồn dữ liệu).
2. **Nghiệp vụ chính** — thứ người dùng mở app ra để làm: đặt lịch, tạo đơn, duyệt, báo cáo…
3. **Phản ứng** — thứ chạy theo nghiệp vụ chính: thông báo, cảnh báo, insight, tích hợp ra ngoài.
4. **Bảo vệ & vận hành** — phân quyền, nhật ký, cấu hình quản trị: phải biết có những gì rồi mới hỏi ai được làm
   gì với cái nào.

## Gợi ý theo module hay gặp

Mỗi bảng: cột **Feature** là đáp án cho câu checkbox ở Bước 1; cột **Hỏi để làm rõ** dùng ở Bước 3.

### Tài khoản & đăng nhập

| Feature | Hỏi để làm rõ |
| --- | --- |
| đăng ký / được mời | tự đăng ký hay chỉ admin mời; cần xác minh email / số điện thoại không |
| đăng nhập | mật khẩu · tài khoản công ty (Google, Microsoft) · mã OTP |
| quên mật khẩu | lấy lại qua đâu |
| khoá / xoá tài khoản | ai khoá, dữ liệu của người đó đi đâu |
| hồ sơ cá nhân | người dùng tự sửa được những gì |

### Phân quyền

| Feature | Hỏi để làm rõ |
| --- | --- |
| vai trò | có những vai trò nào, một người có nhiều vai trò được không |
| theo feature / màn | vai trò nào được mở feature / màn nào |
| theo phạm vi dữ liệu | ai thấy phần dữ liệu nào — chia theo chi nhánh, phòng ban, khách hàng, người tạo… |
| che thông tin nhạy cảm | trường nào (giá vốn, lương, số điện thoại khách) bị ẩn với ai |
| ai cấp quyền | admin cấp tay · theo sơ đồ tổ chức · đồng bộ từ hệ thống khác |
| nhật ký truy cập | có cần biết ai đã xem / sửa / xuất gì, lúc nào |

### Quản lý một loại đối tượng (sản phẩm, khách hàng, hồ sơ, tài liệu…)

| Feature | Hỏi để làm rõ |
| --- | --- |
| tạo / nhập | nhập tay, nhập file hàng loạt, hay lấy từ hệ thống khác; trường nào bắt buộc |
| danh sách & tìm | lọc, sắp xếp, tìm theo gì; một trang bao nhiêu dòng |
| xem chi tiết | thấy những gì, có lịch sử thay đổi không |
| sửa / xoá | sửa được tới lúc nào; xoá hẳn hay ẩn; xoá thứ đang được dùng ở chỗ khác thì sao |
| trùng lặp | thế nào là trùng, phát hiện lúc nào, gộp hay chặn |

### Quy trình duyệt / xử lý

| Feature | Hỏi để làm rõ |
| --- | --- |
| gửi yêu cầu | ai gửi, gửi gì, đính kèm gì |
| các bước duyệt | mấy cấp, ai duyệt ở mỗi cấp, theo điều kiện gì (vd số tiền) |
| trả lại / từ chối | có lý do bắt buộc không, sửa rồi gửi lại được không |
| quá hạn | chờ quá bao lâu thì nhắc, chuyển người, hay tự huỷ |
| theo dõi | người gửi xem được đang ở bước nào |

### Đặt lịch / đặt chỗ

| Feature | Hỏi để làm rõ |
| --- | --- |
| xem chỗ trống | trống theo gì: người, phòng, thiết bị; xa nhất đặt trước bao lâu |
| đặt | ai đặt, cần thông tin gì, đặt trùng thì sao |
| đổi / huỷ | đổi, huỷ tới trước bao lâu; huỷ muộn có phạt không |
| nhắc | nhắc trước bao lâu, qua kênh nào |
| vắng mặt | không đến thì đánh dấu thế nào, có hậu quả gì |

### Bán hàng & thanh toán

| Feature | Hỏi để làm rõ |
| --- | --- |
| giỏ / đơn hàng | tạo đơn từ đâu, sửa đơn tới lúc nào |
| giá & khuyến mãi | giá theo gì, mã giảm giá, cộng dồn được không |
| thanh toán | những cách nào; thanh toán lỗi, thanh toán hai lần thì sao |
| hoàn / huỷ | ai được hoàn, hoàn bao nhiêu, mất bao lâu |
| hoá đơn | có xuất hoá đơn không, theo mẫu nào |

### Dữ liệu & nguồn dữ liệu

| Feature | Hỏi để làm rõ |
| --- | --- |
| nguồn đang có | những nguồn nào, mỗi nguồn có gì, ai sở hữu |
| nơi lưu | đang ở đâu, đã gom chung một chỗ chưa |
| độ mới | số mới tới mức nào: thời gian thực · mỗi giờ · mỗi ngày |
| chiều phân chia | dữ liệu chia theo gì (đơn vị, khu vực, kênh, sản phẩm) — dùng lại ở Phân quyền, Báo cáo |
| định nghĩa chung | chỉ số / khái niệm nào cần một cách tính thống nhất |
| chất lượng | thiếu, lệch giữa nguồn thì xử lý thế nào, ai sửa |

### Báo cáo & dashboard

| Feature | Hỏi để làm rõ |
| --- | --- |
| báo cáo dựng sẵn | những báo cáo nào, mỗi cái trả lời câu hỏi gì, gồm chỉ số nào |
| lọc & xem chi tiết | lọc theo thời gian / chiều nào, bấm vào số thì xem tới mức nào |
| tự tạo báo cáo | người dùng tự tạo được không, hay chỉ xem cái dựng sẵn |
| so sánh | với kỳ trước, cùng kỳ năm trước, chỉ tiêu |
| xuất & gửi định kỳ | Excel / PDF, gửi email theo lịch |

### Thông báo & cảnh báo

| Feature | Hỏi để làm rõ |
| --- | --- |
| sự kiện báo | chuyện gì thì báo: có việc mới · trạng thái đổi · số vượt ngưỡng · lệch bất thường · không có dữ liệu mới |
| ai đặt | người dùng tự đặt hay admin đặt sẵn |
| kênh | trong app · email · tin nhắn · Slack / Teams / Zalo |
| người nhận | ai nhận, có theo phạm vi họ được thấy không |
| tần suất | báo ngay hay gom lại; tắt tạm được không |
| sau khi báo | bấm vào thì tới đâu, có đánh dấu "đã xử lý" không |

### Tìm kiếm

| Feature | Hỏi để làm rõ |
| --- | --- |
| tìm theo chữ | tìm trong những trường nào, sai chính tả / không dấu có ra không |
| bộ lọc | lọc theo gì, lưu bộ lọc được không |
| kết quả | sắp theo gì, không có kết quả thì hiện gì |

### Trợ lý / insight tự động

| Feature | Hỏi để làm rõ |
| --- | --- |
| tóm tắt định kỳ | tóm tắt cái gì, bao lâu một lần, gửi cho ai |
| tự phát hiện | phát hiện điều gì (bất thường, xu hướng, việc sắp trễ) |
| hỏi bằng lời | hỏi được về những gì, trả lời kèm gì (số, biểu đồ, link) |
| độ tin | trả lời sai thì sao, có hiện nguồn để người dùng tự kiểm không |

### Tích hợp hệ thống khác

| Feature | Hỏi để làm rõ |
| --- | --- |
| lấy vào | lấy gì từ hệ thống nào, bao lâu một lần |
| đẩy ra | đẩy gì sang đâu, lúc nào |
| lệch / lỗi | hai bên lệch nhau thì bên nào đúng; hệ thống kia lỗi thì sao |

### Quản trị & cấu hình

| Feature | Hỏi để làm rõ |
| --- | --- |
| danh mục | danh mục nào admin tự thêm / sửa (loại, trạng thái, chi nhánh) |
| tham số | ngưỡng, thời hạn, mẫu email nào chỉnh được không cần dev |
| nhật ký hệ thống | ai đổi cấu hình gì, lúc nào |
