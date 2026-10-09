# Chọn design của getdesign

File này cho agent chính của skill design-uiux. Đọc khi bước 1 đã chạy `node $SKILL/scripts/new-design.mjs designs`
và lệnh thoát mã 0: đề không chỉ định design system, dự án không có file CSS có `@theme` hay `DESIGN.md`. Việc này
chạy **kể cả khi đề không mơ hồ**.

## Hỏi chọn design

<!-- spec: F1.4 F1.6 F3.6 F3.7 -->

1. In stdout của `designs` vào chat, nguyên văn, trong một khối code `text`, có dòng mở `Design của getdesign dùng
   được (<số dòng> bộ):`. In trước lần gọi AskUserQuestion.
2. Câu chọn design nằm trong **lượt hỏi đầu tiên**, cùng một lần gọi AskUserQuestion với các câu làm rõ đề của bước 2
   (nếu có). Đề không mơ hồ thì lượt đó chỉ có câu này. Câu này không tính vào giới hạn 3 lượt hỏi làm rõ, nhưng tính
   vào giới hạn 4 câu mỗi lần gọi: lượt đầu còn tối đa 3 câu làm rõ.

| Phần | Giá trị |
| ---- | ------- |
| `header` | `Design` |
| `question` | `Dựng page theo design nào? Gõ tên khác trong danh sách nếu muốn.` |
| đáp án 1–4 | `label` là tên design đúng như danh sách; đáp án 1 thêm ` (Khuyên dùng)`. `description` là mô tả của getdesign và một câu vì sao hợp đề |

Không có đáp án "bộ mặc định": agent không dựng page bằng `shell/default-design.md`. Với `--auto`, agent vẫn in danh
sách và soạn câu này, rồi lấy đáp án khuyên dùng (đáp án 1) thay cho gọi AskUserQuestion.

## Chọn bốn design

<!-- spec: F3.7 -->

Chọn bốn design trong danh sách đã in, xét theo thứ tự:

1. cùng ngành với app trong đề: app tài chính → `wise`, `revolut`, `stripe`; app nhắn tin → `discord`, `intercom`;
2. tính chất app: công cụ nhập liệu, bảng số nhiều → bộ nền sáng, ít ảnh; app giải trí → bộ nhiều màu;
3. bỏ bộ mà mô tả nói về ảnh lớn, trang giới thiệu (`photography-driven`, `cinematic`, `monumental`) khi đề là app công
   cụ.

## Sau khi có câu trả lời

<!-- spec: F1.6 F3.8 -->

- Tên là một trong bốn design, hay tên gõ qua "Other" có trong danh sách đã in → bước 4 dùng `init --getdesign <tên>`.
- Tên gõ qua "Other" không có trong danh sách → nói "`<tên>` không có trong danh sách", hỏi lại đúng câu này một lần
  (lượt riêng, không tính vào 3 lượt). Lần hai vẫn không có → lấy đáp án khuyên dùng, ghi `AI đoán`.
- `init --getdesign <tên>` thoát mã 1 (`getdesign không có <tên>`, `<tên> chỉ có phần chữ`) là tên sai: hỏi lại câu
  chọn design như trên.
- Ghi vào `## Quyết định` của `brief.md` một dòng `Design system` · `<tên>` · `người dùng` hay `--auto`.
