# Luật UI khi dựng page

<!-- spec: F5.2 F3.4 F3.9 -->

Luật UI là luật về thứ người dùng thấy: màu, chữ, khoảng cách, hình khối. File này cho agent dựng page: agent con, hay
agent chính khi chỉ có một phương án. Đọc hết file này và `references/ux-principles.md` trước khi viết page.

Mỗi luật có hai phần:

- **Máy kiểm**: phần đo được. `check.mjs` đo ở mọi tổ hợp nó đã chạy, phạm thì báo lỗi, đầu dòng là ID luật
  (`[UI4]`) để mở đúng mục ở đây. Lỗi nào cũng sửa trong page; page không có cách tắt kiểm.
- **Tự kiểm**: phần máy không đo được. Dựng xong, mở ảnh trong `shots/`, trả lời từng dòng là đạt hay trượt, trả
  về theo mục "Trả về" của `references/build-page.md`.

Mỗi luật còn có dòng **Phục vụ:** ghi luật UX mà luật UI đó là cách mặc định để đạt, kèm điều phải còn đúng. Luật chỉ
thuần gu ghi `—`.

Thêm luật vào file này thì viết kiểm cho phần đo được trong `scripts/principles-check.mjs` cùng lúc: `check.mjs` so
ID hai bên, lệch thì dừng.

## Khi design system làm khác

Design system được đưa (`DESIGN.md`, file token, component của dự án) quyết phần UI. Luật UI ở đây chỉ là gu mặc định
của skill cho phần design system không nói tới.

- Design system **làm khác** một luật UI khi tài liệu của nó viết ra, hoặc component của dự án đang làm vậy. Chỉ có
  token thì chưa đủ: design system nào cũng khai token bóng, màu phụ; có token không có nghĩa là dùng cho card hay
  cho trạng thái.
- Khi design system làm khác, agent chính ghi luật đó vào bảng "Luật UI theo design system" trong `brief.md`, kèm dẫn
  chứng. Kiểm của luật đó tắt cho cả thư mục.
- Nếu luật UI đó có dòng **Phục vụ** khác `—`, thì dòng trong bảng ghi thêm cách page vẫn giữ luật UX đó. Ví dụ:
  design system đổ bóng cho card (`UI6`), thì modal tách khỏi trang bằng lớp phủ tối (`UX4`).
- Lựa chọn UI nào làm hỏng một luật UX thì luật UX thắng. Theo design system là theo **cách dùng** của nó, không theo
  lỗi của nó: design system tô ba nút ba màu cùng nặng thì page vẫn chỉ có một nút chính (`UX4`).

## Luật

**UI1. Một màu nhấn.**

**Phục vụ:** `UX4` · `UX5` — màu nhấn chỉ cho một chỗ mỗi khối; màu trạng thái không lẫn màu trang trí.

Màu nhấn (`primary`) cho nút chính, thứ đang chọn, link. Màu phụ của design system (`accent-*`…) chỉ cho chuỗi biểu
đồ và chú thích của nó, trong khối `[data-chart]`. Màu chỉ lấy từ token, không dùng bảng màu có sẵn của Tailwind.

**Máy kiểm:** class màu của bảng Tailwind (`bg-blue-500`, `text-rose-700`…); chữ, nền, viền dùng màu phụ ngoài
`[data-chart]`.
**Tự kiểm:** design system đặt tên màu lạ thì vai màu ở mục "Vai màu" có đoán đúng không; sai thì báo agent chính để
ghi `UI1` vào bảng "Luật UI theo design system".

**UI2. Một họ chữ cho nội dung.**

**Phục vụ:** —

Font thứ hai chỉ khi design system khai vai cho nó (`--font-display` cho tiêu đề, `--font-mono` cho mã).

**Máy kiểm:** `font-family` của chữ bắt đầu bằng một font khai trong `--font-*` của `tokens.js`.

**UI3. Cỡ chữ chỉ trong thang, có thứ bậc.**

**Phục vụ:** `UX4` — thứ nặng nhất trên màn trả lời "đang xem cái gì".

Cỡ chữ lấy từ thang `--text-*` của `tokens.js` (design system không có thang thì thang Tailwind). Tên trang (`h1`) >
tiêu đề khối (`h2`) > tên trong khối lặp (`h3`), mỗi bậc cách nhau một nấc. Không cỡ chữ tự đặt.

**Máy kiểm:** class `text-[…]`, `leading-[…]`, `tracking-[…]`, `style` có `font-size`; cỡ chữ ngoài thang; đúng một
`h1`; cỡ `h1` > `h2` > `h3`.
**Tự kiểm:** có phần nào trông như tiêu đề mà không dùng thẻ tiêu đề không.

**UI4. Khoảng cách chỉ trong thang.**

**Phục vụ:** —

Thang `--spacing-*` của `tokens.js`, cộng lưới 4px của Tailwind (`p-4`, `gap-3`); nửa bậc 2 · 6 · 10px (`py-0.5`,
`gap-1.5`, `py-2.5`) chỉ dùng bên trong control. Muốn thẳng hàng thì căn bằng `items-*`, `leading`, không nhích 1–3px.

**Máy kiểm:** class `p*-[…]`, `m*-[…]`, `gap*-[…]`, `space-*-[…]`; `style` có `padding`, `margin`, `gap`.

**UI5. Bo góc chỉ trong thang; bo trong không lớn hơn bo ngoài.**

**Phục vụ:** —

Bo góc lấy từ thang `--radius-*` của `tokens.js`. Khối nằm trong một khối bo góc thì bo bằng hoặc nhỏ hơn khối ngoài.

**Máy kiểm:** class `rounded*-[…]`, `style` có `border-radius`; bo góc ngoài thang `--radius-*`, `0` và tròn hẳn;
khối con có nền hay viền bo lớn hơn khối cha chứa nó.

**UI6. Bóng chỉ cho lớp nổi.**

**Phục vụ:** `UX4` — lớp nổi tách khỏi trang bằng một dấu chỉ lớp nổi có.

Modal, menu, panel trượt, toast có bóng; khối trong trang (card, khung) tách bằng viền hay chênh nền. Ngoại lệ: núm
nhỏ của control (núm công tắc, tab đang chọn trong nhóm nút) được bóng nhỏ.

**Máy kiểm:** class `shadow-[…]`, `style` có `box-shadow`; phần tử từ 64px mỗi chiều, không nằm trong khối `fixed`
hay `absolute`, có bóng nhoè (viền sáng `ring-*` không tính).

**UI7. Viền: một token đường tóc, tối đa một bậc đậm hơn.**

**Phục vụ:** —

Viền card, đường chia dùng token đường tóc của design system; cần nhấn hơn thì thêm đúng một bậc.

**Máy kiểm:** tối đa 2 màu viền trung tính khác nhau trên page; viền màu nhấn, màu trạng thái, màu phụ không tính.

**UI8. Lồng khối tối đa 2 tầng.**

**Phục vụ:** —

Card trong card trong card là quá. Muốn chia bên trong card thì dùng đường chia hay khoảng trắng, không thêm khung.

**Máy kiểm:** tối đa 2 tầng khung lồng nhau (phần tử từ 64px mỗi chiều, có viền hay nền khác cha) trong trang; lớp
nổi đếm lại từ 0.
**Tự kiểm:** có khối nào lồng nhau mà không có viền hay nền (máy không đếm được) không.

**UI9. Dòng chữ đọc dài tối đa 75 ký tự.**

**Phục vụ:** —

Đoạn mô tả, câu giải thích thì chặn bề rộng (`max-w-prose`, hay token bề rộng chữ của design system).

**Máy kiểm:** khối chữ từ 2 dòng có trung bình tối đa 75 ký tự mỗi dòng.

**UI10. Tối đa 4 dạng nút trong một thư mục design.**

**Phục vụ:** `UX4` — nút chính vẫn là nút nặng nhất.

Nút chính (nền đặc), nút viền, nút nền nhạt, nút trơn. Nút nguy hiểm là một trong bốn dạng đó tô màu `error`, không
thành dạng thứ năm. Cỡ nút đổi theo chỗ đứng (trong form, trong dòng bảng) không tính là dạng mới. Design system có bộ nút
riêng thì dùng bộ đó. Nút chỉ có icon không tính.

**Máy kiểm:** đếm dạng nút (loại nền: đặc, nhạt, không nền × có viền × độ đậm chữ) trên mọi page của thư mục.

**UI11. Cùng vai thì cùng khuôn, cùng class.**

**Phục vụ:** `UX4` — cùng một ý thì cùng một dấu.

Thứ đã có hình trong page, trong page khác cùng thư mục design, hay trong component của dự án thì chép đúng class,
không nặn biến thể: cùng một badge mà bảng một kiểu, panel một kiểu là hai app ghép lại. Mượn khuôn là mượn cả class
(cỡ chữ, bo góc, độ dày đường), không chỉ mượn dáng. Một giá trị có cách viết riêng thì ở đâu cũng viết vậy: chọn một
trong `₫` và `đ`, `12,4 / 20` và `12,4/20`, `2,8%` và `2,8 %`.

**Máy kiểm:** trong một nhóm khối lặp, số tiền ở cùng vị trí dùng cùng một cách viết (không lẫn `4,5 triệu` với
`850.000 đ`, `$` với `đ`); số dạng nút cả thư mục theo `UI10`.
**Tự kiểm:** có hai thứ cùng vai mà khác khuôn (khác cỡ, khác bo góc, khác cách viết) không, kể cả giữa các page cùng
thư mục.

**UI12. Không dùng số âm cho khoảng cách và vị trí, trừ khi không còn cách nào khác.**

**Phục vụ:** —

Margin âm, `-space-*`, `-translate-*`, `-inset-*` kéo phần tử ra khỏi chỗ của nó, khung bao không còn nói thật kích
thước bên trong; sửa padding một chỗ là chỗ khác lệch theo. Làm theo thứ tự:

1. Đặt padding ở đúng phần tử cần nó: đường chia muốn tràn mép thì khung không có padding ngang, từng hàng tự có `px`.
2. Chấp nhận khoảng cách mà padding cho ra, thay vì kéo cho sát hơn.
3. Căn bằng `gap`, `items-*`, `leading`. Căn giữa quanh một điểm (chấm trên biểu đồ, toast giữa màn) thì đặt khối
   `absolute w-0 flex justify-center` đúng tại điểm đó, phần tử nằm trong, không `-translate-x-1/2`.
4. Không cách nào ở trên được thì dùng số âm và ghi `<!-- lý do -->` ngay dòng trên.

Điểm bắt đầu của hiệu ứng trượt vào (`x-transition:enter-start="-translate-y-1"`) không tính: phần tử đứng yên vẫn ở
chỗ của nó.

**Máy kiểm:** class số âm mà dòng đó và dòng ngay trên không có `<!--`; trừ class trong thuộc tính `x-transition*`.

**UI13. Chữ trong một khối có thứ bậc, có nhịp, và tên không bị cắt cụt.**

**Phục vụ:** `UX4` — thứ bậc trong khối.

Áp cho mọi khối lặp: card, dòng danh sách, ô lưới. Tối đa ba cỡ chữ trong một khối; thứ to nhất chỉ hơn tên mục một
bậc của thang chữ (ngoại lệ: card số liệu, nơi con số là cả khối). Gom chữ thành nhóm theo nghĩa: dòng trong một nhóm
cách 4px, giữa các nhóm 8–12px, mép khối không sát hơn khoảng giữa nhóm. Tên để nhận ra mục trong card dùng
`line-clamp-2`; cắt còn một dòng chỉ cho danh sách dày (dòng bảng, sidebar).

**Máy kiểm:** trong nhóm từ 3 khối anh em cùng thẻ và class, mỗi khối tối đa 3 cỡ chữ; `h3` đầu khối không cắt còn
một dòng khi khối hẹp hơn nửa khung chứa; không tính dòng bảng.
**Tự kiểm:** chữ trong khối có gom theo nghĩa không: trong nhóm gần, giữa nhóm xa.

## Vai màu

Máy và agent cùng đọc vai màu từ tên token trong `tokens.js`:

| Vai | Token nào | Dùng ở |
| --- | --------- | ------ |
| nhấn | tên bắt đầu `primary` | nút chính, thứ đang chọn, link |
| trạng thái | tên có `success` · `warning` · `error` · `danger` · `info` | báo trạng thái, kèm chữ hay icon (`UX5`) |
| trung tính | màu gần xám (độ đậm màu oklch dưới 0.04) ở cả hai giao diện | nền, chữ, viền |
| phụ | mọi màu còn lại (`accent-*`, `brand-*`…) | chỉ trong `[data-chart]` (`UI1`) |

Màu trong suốt một phần (`bg-primary/10`) tính theo màu gốc.
