# Brief

Bản tóm tắt chung của thư mục design. Bốn mục đầu cho người đọc: đề, quyết định, design system, pages. Các mục sau
cho mọi page, và mọi agent con dựng page song song, cùng theo. Điền hết các chỗ `<…>` trước khi dựng page;
`check.mjs` báo lỗi khi còn chỗ trống, thiếu mục, hay bảng Pages lệch `pages.js`.

## Tóm tắt đề

<2–4 dòng: màn gì, cho ai, để làm gì>

## Quyết định

Ai quyết là `người dùng` (trả lời câu hỏi), `--auto` (tự lấy đáp án khuyên dùng) hay `AI đoán` (không hỏi, tự chọn).

| Câu hỏi | Chọn | Ai quyết |
| ------- | ---- | -------- |
| <câu hỏi làm rõ, hay "Dựng phương án nào?", hay một điều phải đoán> | <đáp án> | <người dùng / --auto / AI đoán> |

## Design system

<nguồn token (file nào, lệnh nào); giao diện gốc và giao diện suy ra; font nào thay; component của dự án vẽ theo>

Bề rộng trang: <giá trị `--page-width`, lấy từ đâu (layout nào của app, hay mặc định); page nào khác thì vì sao>

### Giới hạn nhường cho design system

Giới hạn `G` nào trong `principles.md` mà design system nói khác: tài liệu của nó viết ra, hay component của dự án
đang làm vậy. Chỉ có token thì chưa tính. Có dòng `G<n>` thì `check.mjs` bỏ kiểm của giới hạn đó cho cả thư mục.
Không giới hạn nào nhường thì xoá bảng, ghi `Không có.`

| Giới hạn | Design system nói | Dẫn chứng |
| -------- | ----------------- | --------- |
| <G…> | <design system làm gì khác giới hạn> | <câu trích từ DESIGN.md, hay đường dẫn component> |

## Pages

| File | Phương án | Câu hỏi trung tâm | Đơn vị chính | Hy sinh | Trạng thái |
| ---- | --------- | ----------------- | ------------ | ------- | ---------- |
| `<NN-slug.html>` | <A · tên> | <câu người dùng tự hỏi> | <tuần, người, ngày…> | <câu hỏi nào chậm đi> | <đã dựng / chưa chọn> |

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

## Số kiểm chéo ở mặc định

<3–5 con số agent chính tự tính ở giá trị mặc định của mọi nút (tổng, số của một dòng cụ thể, một mốc thời gian); page nào cũng phải ra đúng các số này>

## Đề gốc

<đề nguyên văn>
