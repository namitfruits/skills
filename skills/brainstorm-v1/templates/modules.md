# Module — khung hỏi và gợi ý feature

Dùng ở Bước 2 (tách module, tick feature) và Bước 4 (làm rõ từng module) của `SKILL.md`. Gợi ý ở đây là **đáp án để
người dùng tick**, không phải danh sách phải làm hết, và không phải danh sách đóng: module nào trong đề không có ở đây
thì dựng feature từ **khung chung**. Đề thật thì chữ của người dùng thắng chữ ở đây — họ gọi "đơn hàng" thì đừng đổi
thành "đối tượng".

## Khung chung — dùng cho mọi module, mọi feature

**Tìm feature của một module** (Bước 2) — một module thường gồm feature thuộc các loại sau, dùng để đoán đáp án khi module
không có trong danh sách gợi ý:

| Loại feature | Câu hỏi gợi ra feature |
| --- | --- |
| tạo / nhập | thứ gì được tạo ra, nhập tay hay lấy từ đâu |
| xem / tìm | ai cần xem gì, xem danh sách hay từng cái |
| sửa / huỷ / xoá | sau khi tạo thì có đổi được không |
| xử lý / duyệt | có bước chuyển trạng thái nào, ai bấm |
| báo cho người khác | ai cần biết khi có chuyện gì |
| xuất / nối ra ngoài | đưa đi đâu: file, email, hệ thống khác |
| cấu hình | thứ gì admin / người dùng tự chỉnh, không cần dev |

**Làm rõ một module** (Bước 4) — mục tiêu hỏi một lần cho cả module, bốn khía cạnh và ví dụ hỏi cho từng feature.
Khía cạnh nào lời kể đã rõ thì không hỏi.

| Khía cạnh | Hỏi gì | Ghi vào |
| --- | --- | --- |
| mục tiêu | làm xong module này muốn được gì, nhìn vào thấy gì | `**Mục tiêu:**` |
| cái gì | thứ gì, gồm những thông tin chính nào | gạch đầu dòng của feature |
| ai | ai làm, ai xem, ai nhận | gạch đầu dòng, bảng Ai dùng |
| khi nào | lúc nào dùng, việc gì làm nó xảy ra | gạch đầu dòng |
| nhận lại gì | người dùng thấy / nhận gì, ở đâu (màn, email, file, tin nhắn) | gạch đầu dòng |
| ví dụ | một lần dùng cụ thể, có tên người, có số | `- Ví dụ: …` |

**Không hỏi** con số, ngưỡng, thời hạn, trường hợp lỗi (thiếu, trùng, quá hạn, không có quyền). Câu "có … không" là
làm rõ; câu "bao lâu / bao nhiêu / sai thì sao" để bước phân tích.

## Thứ tự module

1. **Nền** — thứ module khác cần để có cái mà dùng: tài khoản & đăng nhập, dữ liệu / danh mục gốc (sản phẩm, khách
   hàng, nguồn dữ liệu).
2. **Nghiệp vụ chính** — thứ người dùng mở app ra để làm: đặt lịch, tạo đơn, duyệt, báo cáo…
3. **Phản ứng** — thứ chạy theo nghiệp vụ chính: thông báo, cảnh báo, insight, tích hợp ra ngoài.
4. **Bảo vệ & vận hành** — phân quyền, nhật ký, cấu hình quản trị: phải biết có những gì rồi mới hỏi ai được làm
   gì với cái nào.

## Gợi ý theo module hay gặp

Mỗi bảng: cột **Feature** là đáp án cho câu checkbox ở Bước 2; cột **Hỏi để làm rõ** dùng ở Bước 4. Bảng ở đây chỉ dùng cho
module đã có trong scope — có bảng cho một module không phải lý do để thêm module đó.

### Tài khoản & đăng nhập

| Feature | Hỏi để làm rõ |
| --- | --- |
| đăng ký / được mời | ai tự đăng ký được, ai phải được mời |
| đăng nhập | đăng nhập bằng gì: mật khẩu · tài khoản công ty (Google, Microsoft) · mã OTP |
| quên mật khẩu | người dùng tự lấy lại, hay nhờ admin cấp lại |
| khoá / xoá tài khoản | ai được khoá người khác |
| hồ sơ cá nhân | người dùng tự xem / sửa những thông tin nào |

### Phân quyền

| Feature | Hỏi để làm rõ |
| --- | --- |
| vai trò | có những vai trò nào, mỗi vai trò là ai ngoài đời |
| theo feature / màn | vai trò nào cần mở những màn nào |
| theo phạm vi dữ liệu | có chuyện người này không được thấy dữ liệu của người kia không — chia theo gì (chi nhánh, phòng ban, khách hàng…) |
| che thông tin nhạy cảm | có thông tin nào (giá vốn, lương, số điện thoại khách) phải ẩn với một số người không |
| ai cấp quyền | ai trao quyền cho người mới |
| nhật ký truy cập | có cần biết ai đã xem / sửa / xuất gì không |

### Quản lý một loại đối tượng (sản phẩm, khách hàng, hồ sơ, tài liệu…)

| Feature | Hỏi để làm rõ |
| --- | --- |
| tạo / nhập | thứ này từ đâu ra: nhập tay, nhập file, lấy từ hệ thống khác; một cái gồm những thông tin chính nào |
| danh sách & tìm | ai mở danh sách, thường tìm cái gì |
| xem chi tiết | mở một cái ra thì muốn thấy gì |
| sửa / xoá | ai được sửa, ai được xoá |
| trùng lặp | có hay bị trùng không, trùng thì muốn gộp hay chặn |

### Quy trình duyệt / xử lý

| Feature | Hỏi để làm rõ |
| --- | --- |
| gửi yêu cầu | ai gửi, gửi cái gì |
| các bước duyệt | ai duyệt, một người hay nhiều cấp |
| trả lại / từ chối | bị từ chối thì người gửi làm gì tiếp |
| quá hạn | để lâu không ai duyệt thì có cần nhắc không |
| theo dõi | người gửi có cần xem đang ở bước nào không |

### Đặt lịch / đặt chỗ

| Feature | Hỏi để làm rõ |
| --- | --- |
| xem chỗ trống | đặt cái gì: người, phòng, thiết bị; ai xem chỗ trống |
| đặt | ai đặt: khách tự đặt hay nhân viên đặt hộ |
| đổi / huỷ | khách tự đổi / huỷ được không, hay phải liên hệ |
| nhắc | nhắc ai, nhắc qua đâu |
| vắng mặt | có cần ghi lại người không đến không |

### Bán hàng & thanh toán

| Feature | Hỏi để làm rõ |
| --- | --- |
| giỏ / đơn hàng | đơn tạo ở đâu: khách tự đặt, nhân viên tạo, hay từ kênh khác |
| giá & khuyến mãi | có mã giảm giá / khuyến mãi không, ai tạo |
| thanh toán | trả bằng cách nào: online, tại quầy, chuyển khoản |
| hoàn / huỷ | có hoàn tiền không, ai quyết |
| hoá đơn | có cần xuất hoá đơn không |

### Dữ liệu & nguồn dữ liệu

| Feature | Hỏi để làm rõ |
| --- | --- |
| nguồn đang có | những nguồn nào, mỗi nguồn có gì, ai sở hữu |
| nơi lưu | đang ở đâu, đã gom chung một chỗ chưa |
| độ mới | cần số mới tới mức nào: gần như ngay · trong ngày · hôm qua là đủ |
| chiều phân chia | dữ liệu chia theo gì (đơn vị, khu vực, kênh, sản phẩm) — dùng lại ở Phân quyền, Báo cáo |
| định nghĩa chung | chỉ số nào đang bị mỗi người tính một kiểu |
| chất lượng | có hay gặp số thiếu, số lệch giữa các nguồn không |

### Báo cáo & dashboard

| Feature | Hỏi để làm rõ |
| --- | --- |
| báo cáo dựng sẵn | cần những báo cáo nào, mỗi cái trả lời câu hỏi gì |
| lọc & xem chi tiết | hay lọc theo gì, bấm vào số thì muốn thấy gì |
| tự tạo báo cáo | người dùng muốn tự tạo, hay chỉ xem cái dựng sẵn |
| so sánh | so với gì: kỳ trước, cùng kỳ năm trước, chỉ tiêu |
| xuất & gửi định kỳ | cần file gì, gửi cho ai |

### Thông báo & cảnh báo

| Feature | Hỏi để làm rõ |
| --- | --- |
| sự kiện báo | chuyện gì thì cần biết: có việc mới · trạng thái đổi · số vượt ngưỡng · lệch bất thường · không có dữ liệu mới |
| ai đặt | người dùng tự đặt hay admin đặt sẵn |
| kênh | nhận ở đâu: trong app · email · tin nhắn · Slack / Teams / Zalo |
| người nhận | ai nhận |
| tần suất | báo từng cái ngay, hay gom lại |
| sau khi báo | nhận rồi thì muốn làm gì tiếp |

### Tìm kiếm

| Feature | Hỏi để làm rõ |
| --- | --- |
| tìm theo chữ | hay tìm bằng gì: tên, mã, số điện thoại… |
| bộ lọc | hay lọc theo gì |
| kết quả | muốn thấy gì ở mỗi dòng kết quả |

### Trợ lý / insight tự động

| Feature | Hỏi để làm rõ |
| --- | --- |
| tóm tắt định kỳ | tóm tắt cái gì, gửi cho ai |
| tự phát hiện | muốn được báo điều gì: bất thường, xu hướng, việc sắp trễ |
| hỏi bằng lời | hay muốn hỏi những câu gì — xin vài câu thật |
| độ tin | có cần thấy nguồn để tự kiểm không |

### Tích hợp hệ thống khác

| Feature | Hỏi để làm rõ |
| --- | --- |
| lấy vào | lấy gì từ hệ thống nào |
| đẩy ra | đẩy gì sang đâu |
| bên nào là gốc | hai bên cùng có một thứ thì tin bên nào |

### Quản trị & cấu hình

| Feature | Hỏi để làm rõ |
| --- | --- |
| danh mục | danh mục nào admin muốn tự thêm / sửa (loại, trạng thái, chi nhánh) |
| tham số | thứ gì muốn tự chỉnh, không cần nhờ dev |
| nhật ký hệ thống | có cần biết ai đổi cấu hình gì không |
