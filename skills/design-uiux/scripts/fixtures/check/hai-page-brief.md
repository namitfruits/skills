# Brief

Brief của ca C4 · C5 trong test-check.mjs: thư mục hai page, điền đủ để check.mjs so các page với nhau.

## Tóm tắt đề

Màn mục tiêu doanh thu tháng cho trưởng nhóm bán hàng: còn bao xa tới mục tiêu.

## Quyết định

| Câu hỏi | Chọn | Ai quyết |
| ------- | ---- | -------- |
| Dựng phương án nào? | A và B | --auto |

## Design system

Token mặc định của skill (`shell/default-design.md`), chỉ có sáng, tối suy ra.

Bề rộng trang: `64rem`, mặc định.

### Cặp màu không đủ đọc

Không có.

### Giới hạn nhường cho design system

Không có.

## Pages

| File | Phương án | Câu hỏi trung tâm | Đơn vị chính | Hy sinh | Trạng thái |
| ---- | --------- | ----------------- | ------------ | ------- | ---------- |
| `01-a.html` | A · Còn bao xa | Còn bao xa tới mục tiêu? | tháng | từng ngày | đã dựng |
| `02-b.html` | B · Từng ngày | Hôm nay bán được bao nhiêu? | ngày | tổng tháng | đã dựng |

## Tình huống

| Tình huống | Câu hỏi chính | A · Còn bao xa | B · Từng ngày |
| ---------- | ------------- | -------------- | ------------- |
| Trưởng nhóm, đầu ngày, xem tiến độ | Còn bao xa tới mục tiêu? | nhanh | được |

## Dữ liệu chung

Mục tiêu tháng `target` triệu ₫, đã bán 1.200 triệu ₫.

## Nút dữ liệu chung

| key | type | khoảng / giá trị | default |
| --- | ---- | ---------------- | ------- |
| `target` | number | 0–4000 | 2000 |
| `state` | select | `data` · `loading` · `empty` · `error` | `data` |

## Khối

| Số | Khối | Có ở page |
| -- | ---- | --------- |
| 1 | tiến độ mục tiêu | A · B |

## Số kiểm chéo ở mặc định

Còn thiếu 800 triệu ₫ (2.000 − 1.200).

## Đề gốc

Làm màn mục tiêu doanh thu tháng.
