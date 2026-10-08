# Kho Nhanh — cách dùng giao diện

Màu, chữ, khoảng cách nằm ở `src/styles/tokens.css`. File này chỉ ghi cách dùng mà token không nói được.

## Màn kho

Màn kho mở suốt ca trên màn hình treo tường, nhân viên đứng cách 1–2 mét. Chữ số (mã đơn, giờ, tiền) dùng
`font-mono` để cột thẳng hàng.

## Đơn hoả tốc

Dòng đơn hoả tốc nằm trong card nổi có bóng `shadow-lg`, tách khỏi bảng đơn thường. Bóng là để nhân viên thấy đơn
hoả tốc từ xa; các khối khác trong trang không có bóng.

## Trạng thái đơn

Trạng thái đơn hiện bằng `StatusBadge` (`src/components/status-badge.tsx`), không tô nền cả dòng.
