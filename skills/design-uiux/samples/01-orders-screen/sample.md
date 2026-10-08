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

`*` là thư mục design duy nhất trong `.design/`.

| Mã | Mở file | Đạt khi |
| --- | --- | --- |
| `F1.7` `F3.1` | `chat.md` | dòng đầu tiên bắt đầu bằng `Đọc:` hay `**Đọc:**` có đủ bốn chuỗi: `tokens.css`, `app-shell.tsx`, `orders.tsx`, và `DataTable` hay `StatusBadge` |
| `F1.7` | `chat.md` | không câu hỏi đã soạn (câu có các đáp án để chọn) nào nhắc design system, màu, font, bề rộng trang hay màn đã có trong dự án; dòng kể lựa chọn đã tự trả lời hay `AI đoán` không tính là câu hỏi |
| `F1.7` | `.design/*/brief.md` | có mục `## Màn hiện có`, nhắc bảng 9 cột và các tab trạng thái |
| `F3.1` | `.design/*/tokens.js` | có `"source":"tokens.css"` |
| `F3.6` | `chat.md` | không có chuỗi `getdesign` |
| `F3.5` | `.design/*/tokens.js` | có `"base":"dark"` và `"derived":"light"` |
| `F1.3` | `.design/*/brief.md` | `## Design system` có `1152px` và `app-shell.tsx` |
| `F1.9` | `.design/*/*.html`, `.design/*/brief.md` | page nào khai `pageWidth` thì `## Design system` có một dòng lý do nhắc tên file page đó. Không page nào khai `pageWidth` thì kết quả là `không chạm` |
| `F3.4` | `.design/*/brief.md` | bảng "Giới hạn nhường cho design system" có dòng `G6` nhắc `DESIGN.md` |
| `F1.11` | `chat.md`, `.design/*/brief.md` | `chat.md` có chuỗi `Một màn`; `## Quyết định` có dòng `Loại đề` ghi `một màn` |
| `F1.2` | `chat.md`, `.design/*/pages.js` | có bảng tình huống × phương án với ≥ 2 cột phương án; không có câu hỏi đã soạn nào để chọn phương án; `pages.js` có đúng 2 mục, `option` bắt đầu bằng `A ·` và `B ·`. Có 1 mục thì xem dòng `F1.14` |
| `F1.14` | `chat.md`, `.design/*/pages.js` | `pages.js` có 1 mục thì `chat.md` có dòng bắt đầu bằng `Chỉ một hướng:`. `pages.js` có 2 mục thì kết quả là `không chạm` |
| `F1.8` | `.design/*/brief.md`, `.design/*/pages.js` | số dòng `## Pages` có `File` khác `—` = số mục trong `pages.js` = số file `NN-*.html` |
| `F1.5` | `subagent-*.md` | số file `subagent-*.md` = số file `NN-*.html` |
| `F3.2` `F5.4` | `.design/*/shots/` | mỗi page có ≥ 1 ảnh tên chứa `--bam-` |
| `F3.3` | `.design/*/NN-*.html` | mỗi page khai `state` có `data`, `loading`, `empty`, `error` và ≥ 1 giá trị khác bốn giá trị đó |
| `F5.1` | `check.log` | dòng cuối có `✓`, số page bằng số file `NN-*.html`, và `0 lỗi` |
| `F5.2` | `check.log` | không có dòng chứa `skill lệch` |
| `F5.5` | `subagent-*.md` | mỗi file có khối `Tự kiểm` với ≥ 1 dòng bắt đầu bằng `- [` |
| `F5.3` | `chat.md`, `check.log` | `check.log` có `0 lỗi` thì tin giao ghi `0 lỗi`; còn lỗi thì tin giao có một dòng cho mỗi lỗi |
| `F6.1` | `chat.md` | có dòng chứa `Đang dựng, mở ngay được`; ngay dưới nó có `file://` của mọi file `NN-*.html`; dòng đó đứng trước dòng có `tổ hợp` của tin giao |
| `F6.2` | `.design/*/NN-*.progress.js`, `progress.log` | mỗi file `NN-*.html` có một file `NN-*.progress.js`; trước góp ý, mọi bước `"round":1` có `"done":true`; mỗi page có ≥ 4 dòng `progress.log` với giờ khác nhau, `rev` lớn nhất trước góp ý ≥ 6 |
| `F5.6` | `.design/*/shots/` | mỗi page có ảnh tên `<NN-slug>--quick.png` |
| `F1.5` `F6.7` | `progress.log` | dòng `rev 1` của page B có giờ sớm hơn dòng mang bước `Kiểm đầy đủ và tự kiểm` của page A, và ngược lại: hai page dựng chồng thời gian |

## Vòng góp ý

Sau khi lượt đầu giao xong, người chạy gửi lần lượt hai góp ý. `A` là chữ cái của phương án đầu tiên trong `pages.js`.

```text
Page A: gom đơn hoả tốc thành một khối riêng ở đầu trang, bảng đơn thường để dưới.
```

```text
"Sắp lỡ giờ" là còn dưới 45 phút tới handoffDeadline, không phải trong ngày. Đổi cho mọi page.
```

| Mã | Mở file | Đạt khi |
| --- | --- | --- |
| `F4.1` | `.design/*/pages.js`, `chat.md` | số mục `pages.js` không đổi sau góp ý 1; phần góp ý 1 trong `chat.md` chỉ nhắc sửa một file `NN-*.html` |
| `F4.2` | `.design/*/pages.js` | mục của page A có `updated` là ngày chạy và `note` chứa `hoả tốc` hay `45` (chữ của góp ý cuối cùng chạm page A) |
| `F4.4` | `.design/*/NN-*.progress.js` | file của page A có ≥ 1 bước `"round":2` bắt đầu bằng `Góp ý:` và một bước `"round":2` có `"final":true`; mọi bước `"round":1` vẫn `"done":true` |
| `F4.3` | `.design/*/brief.md`, `.design/*/NN-*.html`, `check.log` | một trong ba mục `## Dữ liệu chung`, `## Nút dữ liệu chung`, `## Số kiểm chéo ở mặc định` của `brief.md` có số `45` gắn với ngưỡng sắp lỡ giờ; mỗi file `NN-*.html` có số `45` không nằm trong giờ dạng `hh:45`; dòng cuối `check.log` sau góp ý 2 có `0 lỗi` |
