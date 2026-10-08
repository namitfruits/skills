# Brief

Brief của ca C6 · C7 trong test-check.mjs: thư mục luồng ba màn, điền đủ để check.mjs đi hết luồng.

## Tóm tắt đề

Luồng đăng ký ba màn: chào, nhập email, xác nhận.

## Quyết định

| Câu hỏi | Chọn | Ai quyết |
| ------- | ---- | -------- |
| Loại đề | một luồng | --auto |

## Design system

Token mặc định của skill (`shell/default-design.md`), chỉ có sáng, tối suy ra.

Bề rộng trang: `64rem`, mặc định.

### Cặp màu không đủ đọc

Không có.

### Giới hạn nhường cho design system

Không có.

## Luồng

| Màn | Tên | Để làm gì | Nhận từ màn trước | Đưa cho màn sau | Trạng thái riêng | File |
| --- | --- | --------- | ----------------- | --------------- | ---------------- | ---- |
| 1 | Chào | biết app làm gì, bắt đầu | — | — | — | `01-chao.html` |
| 2 | Email | nhập email | — | `form.email` | — | `02-email.html` |
| 3 | Xác nhận | xem lại email | `form.email` | — | — | `03-xac-nhan.html` |

## Dữ liệu chung

Một người đăng ký, chưa có tài khoản.

## Nút dữ liệu chung

| key | type | khoảng / giá trị | default |
| --- | ---- | ---------------- | ------- |
| `state` | select | `data` · `loading` · `empty` · `error` | `data` |

## Khối

| Số | Khối | Có ở page |
| -- | ---- | --------- |
| 1 | nội dung màn | 1 · 2 · 3 |

## Số kiểm chéo ở mặc định

Màn 3 hiện đúng email đã gõ ở màn 2.

## Đề gốc

Làm luồng đăng ký ba màn.
