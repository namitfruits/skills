# Mẫu 01 · Cải thiện màn Đơn hàng

**Khía cạnh:** cải thiện một màn đang có trong codebase. Skill phải tự đọc được từ `project/`: design system, bề rộng
trang, màn hiện có, component; rồi tìm phương án theo tình huống dùng. Kèm một vòng góp ý.

**Đầu vào:** `project/`, app quản lý kho "Kho Nhanh" (React + Tailwind v4), chép vào thư mục chạy thử.

| Skill cần tìm | Nằm ở |
| --- | --- |
| design system | `src/styles/tokens.css`: khối `@theme`, chỉ có giao diện tối, chữ IBM Plex |
| cách dùng design system | `DESIGN.md`: chỉ có chữ; đơn hoả tốc nằm trong card có bóng, khác giới hạn `G6` |
| bề rộng trang | `src/components/app-shell.tsx`: `max-w-content` → `--container-content: 1152px` |
| màn hiện có | `src/routes/orders.tsx`: bảng 9 cột, 5 tab trạng thái, ô tìm, phân trang 20 dòng |
| dữ liệu | `src/contract/orders.ts`: `Order` có `express`, `handoffDeadline` |
| component | `DataTable`, `StatusBadge` trong `src/components/` |

## Đề

```text
/design-uiux --auto Cải thiện màn Đơn hàng (/orders). Nhân viên kho mở màn này đầu ca để biết đơn nào phải gói trước, và mở lại giữa ca khi có đơn hoả tốc. Bảng 9 cột đang nặng như nhau, đơn sắp lỡ giờ bàn giao cho hãng vận chuyển nằm lẫn giữa đơn thường, phải đọc từng dòng mới biết. Mỗi ca có khoảng 80–150 đơn chờ gói. Trưởng ca cuối ca vẫn cần xem đủ 9 cột để đối soát với hãng vận chuyển.
```

## Checklist

- Dòng `Đọc:` đầu chat nhắc `tokens.css`, `app-shell.tsx` và `orders.tsx`. Skill không hỏi gì về design system, màu, bề
  rộng trang hay màn đang có.
- `brief.md` ghi bề rộng trang `1152px`, lấy từ `app-shell.tsx`.
- `tokens.js` ghi nguồn `tokens.css`.
- Có 2 page A và B, mở được bằng link trong chat.
- Ở cả hai page, đơn sắp lỡ giờ bàn giao nằm ở khối riêng hay có dấu riêng, không lẫn giữa đơn thường.
- Dòng cuối `check.log` có `0 lỗi`.

## Vòng góp ý

Sau khi lượt đầu giao xong, người chạy gửi lần lượt hai góp ý. `A` là chữ cái của phương án đầu tiên trong `pages.js`.

```text
Page A: gom đơn hoả tốc thành một khối riêng ở đầu trang, bảng đơn thường để dưới.
```

```text
"Sắp lỡ giờ" là còn dưới 45 phút tới handoffDeadline, không phải trong ngày. Đổi cho mọi page.
```

- Sau góp ý 1, vẫn có 2 page, và chỉ page A đổi.
- Sau góp ý 2, mọi page dùng ngưỡng 45 phút. Dòng cuối `check.log` vẫn có `0 lỗi`.
