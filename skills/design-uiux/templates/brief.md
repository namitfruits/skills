# Brief

Bản tóm tắt chung của thư mục design. Bốn mục đầu cho người đọc: đề, quyết định, design system, pages (hay luồng).
Các mục sau cho mọi page, và mọi agent con dựng page song song, cùng theo. Đề một màn thì xoá mục `## Luồng`. Đề một
luồng thì xoá `## Pages` và `## Tình huống`, ghi page vào `## Luồng`. Điền hết các chỗ `<…>` trước khi dựng page;
`check.mjs` báo lỗi khi còn chỗ trống, thiếu mục, hay bảng Pages lệch `pages.js`.

## Tóm tắt đề

<2–4 dòng: màn gì, cho ai, để làm gì>

## Quyết định

Ai quyết là `người dùng` (trả lời câu hỏi), `--auto` (tự lấy đáp án khuyên dùng) hay `AI đoán` (không hỏi, tự chọn).

| Câu hỏi | Chọn | Ai quyết |
| ------- | ---- | -------- |
| Loại đề | <một màn / một luồng> | <người dùng / --auto / AI đoán> |
| <câu hỏi làm rõ, hay một điều phải đoán> | <đáp án> | <người dùng / --auto / AI đoán> |

## Design system

<nguồn token: file nào, hay `getdesign <tên> (DESIGN.md trong thư mục này)`; giao diện gốc và giao diện suy ra; font nào thay; component của dự án vẽ theo>

Bề rộng trang: <giá trị `--page-width`, lấy từ đâu (layout nào của app, câu nào trong tài liệu design system, hay mặc định); page nào khác thì vì sao>

### Cặp màu không đủ đọc

Cặp màu dưới 4.5 : 1 mà page có dùng làm chữ, lấy từ danh sách `new-design.mjs init` in ra. Mỗi cặp một cách dùng thay,
mọi page theo đúng cách đó. Không cặp nào page dùng làm chữ thì xoá bảng, ghi `Không có.`

| Cặp | Giao diện | Tương phản | Dùng thay |
| --- | --------- | ---------- | --------- |
| <`on-primary` trên `primary`> | <sáng / tối (suy ra)> | <3.28 : 1> | <cách dùng thay, vd chữ `ink` trên nền `primary`> |

### Giới hạn nhường cho design system

Giới hạn `G` nào trong `references/page-principles.md` mà design system nói khác: tài liệu của nó viết ra, hay component của dự án
đang làm vậy. Chỉ có token thì chưa tính. Có dòng `G<n>` thì `check.mjs` bỏ kiểm của giới hạn đó cho cả thư mục.
Không giới hạn nào nhường thì xoá bảng, ghi `Không có.`

| Giới hạn | Design system nói | Dẫn chứng |
| -------- | ----------------- | --------- |
| <G…> | <design system làm gì khác giới hạn> | <câu trích từ DESIGN.md, hay đường dẫn component> |

## Pages

Đề một màn: phương án A, B được dựng và các hướng không dựng (`chưa chọn`). Mỗi màn tối đa hai page.

| File | Phương án | Câu hỏi trung tâm | Đơn vị chính | Hy sinh | Trạng thái |
| ---- | --------- | ----------------- | ------------ | ------- | ---------- |
| `<NN-slug.html>` | <A · tên> | <câu người dùng tự hỏi> | <tuần, người, ngày…> | <câu hỏi nào chậm đi> | <đã dựng / chưa chọn> |

## Luồng

Đề một luồng: mỗi màn một dòng, theo thứ tự đi, mỗi màn một page. "Đưa cho màn sau" là key `form.<key>` của ô màn
đó cho người xem gõ; màn sau đọc đúng key đó. Nhánh lỗi của một màn là trạng thái riêng của màn đó, không là màn riêng.

| Màn | Tên | Để làm gì | Nhận từ màn trước | Đưa cho màn sau | Trạng thái riêng | File |
| --- | --- | --------- | ----------------- | --------------- | ---------------- | ---- |
| <1> | <tên màn> | <người dùng làm gì ở màn này> | <`form.<key>` hay —> | <`form.<key>` hay —> | <giá trị state riêng hay —> | `<NN-slug.html>` |

## Tình huống

| Tình huống | Câu hỏi chính | <A · tên> | <B · tên> |
| ---------- | ------------- | --------- | --------- |
| <ai, lúc nào, muốn biết hay làm gì> | <câu người dùng tự hỏi> | <nhanh / được / chậm> | <nhanh / được / chậm> |

## Dữ liệu chung

<thực thể, số lượng, giá trị mẫu, công thức, quan hệ giữa các con số, ca biên (tên dài, số 0, số rất lớn, một phần tử)>

## Nút dữ liệu chung

| key | type | khoảng / giá trị | default |
| --- | ---- | ---------------- | ------- |
| `state` | select | `data` · `loading` · `empty` · `error` · <trạng thái riêng của đề> | `data` |
| <key> | <number / select / toggle / text> | <min–max hay danh sách> | <…> |

## Khối

Mỗi khối chính một số, cùng khối ở các page mang cùng số (`data-block="<số>"`). Khối chỉ có ở một phương án vẫn lấy
một số riêng trong bảng.

| Số | Khối | Có ở page |
| -- | ---- | --------- |
| <1> | <tên khối, vd dải hạn mức> | <A · B · C> |

## Số kiểm chéo ở mặc định

<3–5 con số agent chính tự tính ở giá trị mặc định của mọi nút (tổng, số của một dòng cụ thể, một mốc thời gian); page nào cũng phải ra đúng các số này>

## Đề gốc

<đề nguyên văn>
