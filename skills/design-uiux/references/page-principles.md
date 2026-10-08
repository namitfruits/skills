# Nguyên tắc và giới hạn khi dựng page

<!-- spec: F5.2 -->

File này cho agent dựng page: agent con, hay agent chính khi chỉ có một phương án. Đọc hết trước khi viết page.

Mỗi luật có hai phần:

- **Máy kiểm**: phần đo được. `check.mjs` đo ở mọi tổ hợp nó đã chạy, phạm thì báo lỗi, đầu dòng là ID luật
  (`[N13]`, `[G4]`) để mở đúng mục ở đây. Lỗi nào cũng sửa trong page; page không có cách tắt kiểm.
- **Tự kiểm**: phần máy không đo được. Dựng xong, mở ảnh trong `shots/`, trả lời từng dòng là đạt hay trượt, trả
  về theo mục "Trả về danh sách tự kiểm" cuối file.

Thêm luật vào file này thì viết kiểm cho phần đo được trong `scripts/principles-check.mjs` cùng lúc: `check.mjs` so
ID hai bên, lệch thì dừng.

## Thứ tự ưu tiên

**Nguyên tắc > design system > giới hạn.**

- **Nguyên tắc** (`N`) là đúng sai: đọc được, màu nói đúng trạng thái, không che mất chữ. Không design system nào đè.
- **Design system** được đưa (`DESIGN.md`, file token, component của dự án) thắng **giới hạn** (`G`). Giới hạn chỉ
  là gu mặc định của skill cho phần design system không nói tới.
- Design system **nói khác** một giới hạn khi tài liệu của nó viết ra, hoặc component của dự án đang làm vậy. Chỉ có
  token thì chưa đủ: design system nào cũng khai token bóng, màu phụ; có token không có nghĩa là dùng cho card hay
  cho trạng thái. Agent chính ghi giới hạn nhường vào bảng "Giới hạn nhường cho design system" trong `brief.md`,
  kèm dẫn chứng; kiểm của giới hạn đó tắt cho cả thư mục.
- Theo design system là theo **cách dùng** của nó, không theo lỗi của nó: design system tô ba nút ba màu cùng nặng
  thì page vẫn chỉ có một nút chính (`N4`).

## Nguyên tắc

**N1. Theo quy ước số đông.**

Chỗ nào hầu hết app đã làm một cách và người dùng đã quen thì làm đúng như thế, kể cả khi cách khác trông gọn hơn:
✕ ở góc trên phải để đóng, nút chính đứng phải nhất hàng nút, Huỷ bên trái nó, dấu `*` đỏ cho trường bắt buộc, logo
góc trái về trang chủ. Gu của skill chỉ quyết chỗ chưa có quy ước.

**Máy kiểm:** hộp thoại (`role="dialog"`) có nút đóng `aria-label="Đóng"` (hay `"Close"`) ở góc trên phải; từ
640px, nút chính đứng phải nhất hàng nút cuối hộp thoại và form; ô `required` có nhãn chứa `*` màu `error`.
**Tự kiểm:** người dùng lần đầu mở page có chỗ nào phải hỏi "cái này nghĩa là gì" hay "bấm đâu để…" không.

**N2. Đổi trạng thái thì giao diện không nhảy chỗ.**

Rê chuột, bấm, dữ liệu về: mọi thứ xung quanh chỗ vừa đổi đứng yên. Chừa sẵn chỗ cho trạng thái lớn nhất, hoặc đổi
bằng màu và độ mờ thay vì thêm bớt phần tử. Tab luôn có viền (trong suốt khi chưa chọn) thay vì thêm viền lúc chọn;
spinner thay chỗ icon trong nút, không chèn thêm; số tự đổi dùng `tabular-nums`; tăng độ đậm chữ lúc chọn làm chữ
rộng ra. Giữ chỗ là để khớp phần tử bên cạnh; không có gì bên cạnh thì bỏ chỗ giữ. Sang hẳn màn khác thì không tính.
Khối mở đóng có chủ ý (accordion) đẩy phần dưới thì trượt (`grid-rows` 0fr ↔ 1fr), không giật.

**Máy kiểm:** rê vào từng loại thứ bấm được, không phần tử nào khác trong `#design` dịch quá 0.5px; bấm một phần tử
trong một hàng (tab, chip, nhóm nút), anh em cùng hàng không dịch.
**Tự kiểm:** có khoảng trống giữ chỗ nào không làm thứ quan trọng thẳng hàng với phần tử bên cạnh không.

**N3. Mỗi trạng thái đều được dựng, và liếc là phân biệt được.**

Liệt kê trước khi dựng: thường, rê chuột, đang chọn, khoá, đang tải, rỗng, lỗi, xong, và ca biên (không có gì, một
cái, rất dài, rất nhiều). Trạng thái dữ liệu đi qua variable `state`, ca biên qua preset. Hai trạng thái khác nghĩa
thì khác hình rõ, không chỉ khác chữ. Một trang hay 0 dòng thì giấu control không dùng được (phân trang, chọn tất cả).

**Máy kiểm:** phần tử có `aria-selected` / `aria-pressed` / `aria-current` bằng `true` khác anh em bằng `false` ở
nền, màu chữ, viền hay độ đậm.
**Tự kiểm:** che chữ đi, hai trạng thái khác nghĩa (xong và đang chạy, lỗi và đang chờ) còn phân biệt được không; ca
biên có trông cố ý không: "0 ảnh" thì ẩn hay nói bằng chữ ("Chưa có ảnh"), thiếu mô tả thì khối co lại, không để
dòng trống.

**N4. Một tín hiệu cho một ý; tín hiệu mạnh nhất để dành cho một chỗ.**

Nền màu nhấn, khối tô đặc, màu đỏ, chữ đậm là tín hiệu đắt. Thứ bậc đi bằng cỡ chữ, độ đậm, vị trí trước; màu và bóng
sau cùng. Đã có một dấu hiệu thì không thêm dấu hiệu thứ hai cho cùng ý: icon thùng rác ở cả đầu hộp lẫn trên nút;
tệp tải xong có cả thanh đầy, `100%` và "Đã tải xong". Cùng một câu ở mọi ô, mọi hàng thì ghi một lần ở đầu nhóm
("so với tháng trước" ở cả bốn ô số liệu). Trạng thái thường không cần dấu, chỉ ngoại lệ mới có. Thứ nặng nhất trên
màn trả lời "đang xem cái gì". Thứ vừa bấm để mở không hiện lại to hơn trong thứ nó mở.

**Máy kiểm:** mỗi `data-block` và mỗi lớp nổi có tối đa một nút nền màu nhấn; một khung không bị quá ba phần tử
`absolute` chồng lên; một câu (từ hai từ, không phải nút hay tiêu đề) không lặp ở từ 80% khối của một nhóm khối lặp
từ 5 khối.
**Tự kiểm:** có ý nào nói hai lần bằng hai cách (icon, màu, chữ cùng một ý) không; thứ nặng nhất trên màn có phải
thứ trả lời "đang xem cái gì" không.

**N5. Màu nói trạng thái, theo một bảng cho cả app, và luôn có chữ đi kèm.**

Màu không để trang trí, không để phân loại. Trạng thái lấy màu từ token trạng thái của design system (mục "Vai
màu"): xám là chờ, xanh lá là xong, vàng cam là cần chú ý, đỏ là hỏng; "xong" ở đâu cũng một màu. Màu theo **tốt hay
xấu**, không theo lên hay xuống. Đỏ chỉ cho lỗi và việc không lấy lại được. Màu không bao giờ đứng một mình: luôn có
chữ, số hay icon nói cùng ý.

**Máy kiểm:** phần tử không chữ có nền màu không trung tính (chấm, vạch, ô màu) có `aria-label` hay `title`, hoặc cha
của nó có chữ; trừ trong `[data-chart]`.
**Tự kiểm:** màu có theo tốt hay xấu không (chi phí tăng thì không tô xanh); trạng thái có dùng token trạng thái,
không mượn màu phụ không.

**N6. Cùng vai thì cùng khuôn, cùng class.**

Thứ đã có hình trong page, trong page khác cùng thư mục design, hay trong component của dự án thì chép đúng class,
không nặn biến thể: cùng một badge mà bảng một kiểu, panel một kiểu là hai app ghép lại. Mượn khuôn là mượn cả class
(cỡ chữ, bo góc, độ dày đường), không chỉ mượn dáng. Một giá trị có cách viết riêng thì ở đâu cũng viết vậy: chọn một
trong `₫` và `đ`, `12,4 / 20` và `12,4/20`, `2,8%` và `2,8 %`.

**Máy kiểm:** trong một nhóm khối lặp, số tiền ở cùng vị trí dùng cùng một cách viết (không lẫn `4,5 triệu` với
`850.000 đ`, `$` với `đ`); số dạng nút cả thư mục theo `G10`.
**Tự kiểm:** có hai thứ cùng vai mà khác khuôn (khác cỡ, khác bo góc, khác cách viết) không, kể cả giữa các page cùng
thư mục.

**N7. Chữ nói được việc: chuyện gì, vì sao, làm gì tiếp.**

Câu dài thì tách hai tầng: tầng trên chuyện gì xảy ra, tầng dưới vì sao hay hệ quả, có số và mốc cụ thể. Câu lỗi nói
cách sửa, không lặp lời nhãn. Khoá thì nói vì sao khoá. Chỉ sang chỗ khác thì là nút hay link, không phải chữ trơn.
Mỗi bước có lối lùi khi người dùng đi nhầm. Câu lỗi không bịa ra luật mà page không kiểm. Rỗng mà người dùng là
người mở đầu (danh sách họ tự tạo) thì trạng thái rỗng có việc bấm được ngay.

**Máy kiểm:** ở `state` bằng `empty` và `error`, trong các khối `data-block` có chữ đổi theo `state`, ít nhất một khối
có nút hay link bấm được, hoặc nút khoá kèm `title` nói vì sao; nút khoá có `title`.
**Tự kiểm:** câu lỗi, câu rỗng có nói chuyện gì, vì sao, làm gì tiếp không; có câu nào bịa ra luật mà page không kiểm
không.

**N8. Không làm hộ, không đoán hộ người dùng.**

Chưa chọn thì để trống, hiện placeholder. Gợi ý hiện ở chỗ gợi ý, không ghi sẵn vào ô. Không tick sẵn đồng ý. Form
tạo mới mở ra trống; form sửa thì có giá trị cũ. Ngoại lệ: nhóm radio luôn có sẵn một lựa chọn.

**Máy kiểm:** form mở từ nút có nhãn bắt đầu bằng Thêm, Tạo, Mời, Mới, Add, New, Create, Invite thì ô chữ trống,
checkbox chưa tick.
**Tự kiểm:** có số đếm hay giá trị nào bịa cho có, không khớp dữ liệu giả không (số trên tab, tổng ở đầu trang).

**N9. Không che, không cắt mất thứ người dùng cần để quyết định.**

Trang không cuộn ngang. Lớp nổi không che chính thứ mở ra nó. Thứ dùng để xác nhận (tên đối tượng sắp xoá) không
cắt. Mô tả xuống dòng (`text-pretty`); chỉ tiêu đề một dòng mới cắt, cắt thì có `title`. Phải cắt thì cắt phần
giống nhau, giữ phần phân biệt: email giữ tên miền, tên tệp giữ đuôi. Link ngắn nằm trong câu thì
`whitespace-nowrap`. Số ghi đè lên biểu đồ đặt về phía còn trống.

**Máy kiểm:** chữ bị cắt (`…` hay `line-clamp`) có `title`, phần còn đọc được từ 8 ký tự, phần bị giấu không có
số kèm đơn vị (`210m²`, `12 triệu`, `82%`), ô chỉ có một con số thì không bị cắt; lớp nổi vừa mở (menu, popover: có thứ
bấm được) không che nút mở nó.
**Tự kiểm:** ở 375px với dữ liệu dài nhất, thứ bị cắt có phải thứ người dùng cần để quyết định không (tên, giá, tên
đối tượng sắp xoá).

**N10. Mọi thao tác đi được bằng chuột, bằng phím, bằng tay trên điện thoại.**

Bấm được thì có `cursor-pointer` và đổi hình khi rê, vùng bấm rộng hết hàng. Thứ bấm được là `button`, `a` hay control
thật để Tab tới được; khối có `@click` thì thêm `tabindex="0"` và `role`. Màn chạm không có rê, nên thứ chỉ hiện khi
rê phải luôn hiện ở màn hẹp. Thứ bấm được nhỏ hơn 32px giữ hình, nới vùng bấm bằng
`relative before:absolute before:-inset-*` (số âm có ghi chú, `N11`). Thứ chỉ nói bằng hình có `aria-*`
(`aria-pressed`, `aria-current`, `role="progressbar"`).

**Máy kiểm:** phần tử có `@click` mà không phải `button` / `a` / `input` / `label` / `summary` thì có `tabindex`;
thứ bấm được có `cursor: pointer`; ở 375px vùng bấm từ 32px.

**N11. Không dùng số âm cho khoảng cách và vị trí, trừ khi không còn cách nào khác.**

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

**N12. Chữ trong một khối có thứ bậc, có nhịp, và tên không bị cắt cụt.**

Áp cho mọi khối lặp: card, dòng danh sách, ô lưới. Tối đa ba cỡ chữ trong một khối; thứ to nhất chỉ hơn tên mục một
bậc của thang chữ (ngoại lệ: card số liệu, nơi con số là cả khối). Gom chữ thành nhóm theo nghĩa: dòng trong một nhóm
cách 4px, giữa các nhóm 8–12px, mép khối không sát hơn khoảng giữa nhóm. Tên để nhận ra mục trong card dùng
`line-clamp-2`; cắt còn một dòng chỉ cho danh sách dày (dòng bảng, sidebar).

**Máy kiểm:** trong nhóm từ 3 khối anh em cùng thẻ và class, mỗi khối tối đa 3 cỡ chữ; `h3` đầu khối không cắt còn
một dòng khi khối hẹp hơn nửa khung chứa; không tính dòng bảng.
**Tự kiểm:** chữ trong khối có gom theo nghĩa không: trong nhóm gần, giữa nhóm xa.

**N13. Chữ đọc được: tương phản đủ ở mọi giao diện.**

Chữ thường từ 4.5 : 1 so với nền ngay sau nó; chữ lớn (từ 24px, hay từ 18.66px đậm) và icon mang nghĩa từ 3 : 1.
Giao diện do skill suy ra (sáng từ design system chỉ có tối, hay ngược lại) hay trượt nhất. Token của design system
trượt trên một nền thì dùng token chữ đậm hơn của chính design system, không tự đặt màu. Chữ phụ, placeholder cũng
tính.

Logo và ký hiệu trang trí (✳ cạnh tên sản phẩm) thì đánh dấu `aria-hidden="true"`: WCAG không đòi tương phản cho chúng.

**Máy kiểm:** chữ đang hiện, màu chữ trộn lên lớp nền đặc phía sau, đạt mức trên ở mọi tổ hợp sáng tối; trừ control
đang khoá, chữ trên ảnh, chữ đang chạy hiệu ứng và chữ trong `aria-hidden="true"`.

## Giới hạn

Mỗi giới hạn đọc theo design system đang dùng. Design system nói khác (mục "Thứ tự ưu tiên") thì giới hạn đó nằm
trong bảng nhường của `brief.md`, kiểm của nó tắt.

**G1. Một màu nhấn.**

Màu nhấn (`primary`) cho nút chính, thứ đang chọn, link. Màu phụ của design system (`accent-*`…) chỉ cho chuỗi biểu
đồ và chú thích của nó, trong khối `[data-chart]`. Màu chỉ lấy từ token, không dùng bảng màu có sẵn của Tailwind.

**Máy kiểm:** class màu của bảng Tailwind (`bg-blue-500`, `text-rose-700`…); chữ, nền, viền dùng màu phụ ngoài
`[data-chart]`.
**Tự kiểm:** design system đặt tên màu lạ thì vai màu ở mục "Vai màu" có đoán đúng không; sai thì báo agent chính để
ghi `G1` vào bảng nhường.

**G2. Một họ chữ cho nội dung.**

Font thứ hai chỉ khi design system khai vai cho nó (`--font-display` cho tiêu đề, `--font-mono` cho mã).

**Máy kiểm:** `font-family` của chữ bắt đầu bằng một font khai trong `--font-*` của `tokens.js`.

**G3. Cỡ chữ chỉ trong thang, có thứ bậc.**

Cỡ chữ lấy từ thang `--text-*` của `tokens.js` (design system không có thang thì thang Tailwind). Tên trang (`h1`) >
tiêu đề khối (`h2`) > tên trong khối lặp (`h3`), mỗi bậc cách nhau một nấc. Không cỡ chữ tự đặt.

**Máy kiểm:** class `text-[…]`, `leading-[…]`, `tracking-[…]`, `style` có `font-size`; cỡ chữ ngoài thang; đúng một
`h1`; cỡ `h1` > `h2` > `h3`.
**Tự kiểm:** có phần nào trông như tiêu đề mà không dùng thẻ tiêu đề không.

**G4. Khoảng cách chỉ trong thang.**

Thang `--spacing-*` của `tokens.js`, cộng lưới 4px của Tailwind (`p-4`, `gap-3`); nửa bậc 2 · 6 · 10px (`py-0.5`,
`gap-1.5`, `py-2.5`) chỉ dùng bên trong control. Muốn thẳng hàng thì căn bằng `items-*`, `leading`, không nhích 1–3px.

**Máy kiểm:** class `p*-[…]`, `m*-[…]`, `gap*-[…]`, `space-*-[…]`; `style` có `padding`, `margin`, `gap`.

**G5. Bo góc chỉ trong thang; bo trong không lớn hơn bo ngoài.**

Bo góc lấy từ thang `--radius-*` của `tokens.js`. Khối nằm trong một khối bo góc thì bo bằng hoặc nhỏ hơn khối ngoài.

**Máy kiểm:** class `rounded*-[…]`, `style` có `border-radius`; bo góc ngoài thang `--radius-*`, `0` và tròn hẳn;
khối con có nền hay viền bo lớn hơn khối cha chứa nó.

**G6. Bóng chỉ cho lớp nổi.**

Modal, menu, panel trượt, toast có bóng; khối trong trang (card, khung) tách bằng viền hay chênh nền. Ngoại lệ: núm
nhỏ của control (núm công tắc, tab đang chọn trong nhóm nút) được bóng nhỏ.

**Máy kiểm:** class `shadow-[…]`, `style` có `box-shadow`; phần tử từ 64px mỗi chiều, không nằm trong khối `fixed`
hay `absolute`, có bóng nhoè (viền sáng `ring-*` không tính).

**G7. Viền: một token đường tóc, tối đa một bậc đậm hơn.**

Viền card, đường chia dùng token đường tóc của design system; cần nhấn hơn thì thêm đúng một bậc.

**Máy kiểm:** tối đa 2 màu viền trung tính khác nhau trên page; viền màu nhấn, màu trạng thái, màu phụ không tính.

**G8. Lồng khối tối đa 2 tầng.**

Card trong card trong card là quá. Muốn chia bên trong card thì dùng đường chia hay khoảng trắng, không thêm khung.

**Máy kiểm:** tối đa 2 tầng khung lồng nhau (phần tử từ 64px mỗi chiều, có viền hay nền khác cha) trong trang; lớp
nổi đếm lại từ 0.
**Tự kiểm:** có khối nào lồng nhau mà không có viền hay nền (máy không đếm được) không.

**G9. Dòng chữ đọc dài tối đa 75 ký tự.**

Đoạn mô tả, câu giải thích thì chặn bề rộng (`max-w-prose`, hay token bề rộng chữ của design system).

**Máy kiểm:** khối chữ từ 2 dòng có trung bình tối đa 75 ký tự mỗi dòng.

**G10. Tối đa 4 dạng nút trong một thư mục design.**

Nút chính (nền đặc), nút viền, nút nền nhạt, nút trơn. Nút nguy hiểm là một trong bốn dạng đó tô màu `error`, không
thành dạng thứ năm. Cỡ nút đổi theo chỗ đứng (trong form, trong dòng bảng) không tính là dạng mới. Design system có bộ nút
riêng thì dùng bộ đó. Nút chỉ có icon không tính.

**Máy kiểm:** đếm dạng nút (loại nền: đặc, nhạt, không nền × có viền × độ đậm chữ) trên mọi page của thư mục.

## Vai màu

Máy và agent cùng đọc vai màu từ tên token trong `tokens.js`:

| Vai | Token nào | Dùng ở |
| --- | --------- | ------ |
| nhấn | tên bắt đầu `primary` | nút chính, thứ đang chọn, link |
| trạng thái | tên có `success` · `warning` · `error` · `danger` · `info` | báo trạng thái, kèm chữ hay icon (`N5`) |
| trung tính | màu gần xám (độ đậm màu oklch dưới 0.04) ở cả hai giao diện | nền, chữ, viền |
| phụ | mọi màu còn lại (`accent-*`, `brand-*`…) | chỉ trong `[data-chart]` (`G1`) |

Màu trong suốt một phần (`bg-primary/10`) tính theo màu gốc.

## Đánh dấu trong page

Máy chỉ đo được khi page nói phần tử nào là gì:

| Thứ | Đánh dấu | Kiểm dựa vào |
| --- | -------- | ------------ |
| tên trang | đúng một `h1` | `G3` |
| tiêu đề khối | `h2` | `G3` |
| tên trong khối lặp (card, mục) | `h3` | `G3` · `N12` |
| thứ đang chọn (tab, chip, mục menu, trang) | `aria-selected` · `aria-pressed` · `aria-current` | `N3` |
| khối biểu đồ, kể cả chú thích của nó | `data-chart` trên khối bọc | `G1` · `N5` |
| modal, sheet, panel trượt | `role="dialog"`; nút đóng có `aria-label="Đóng"` | `N1` |
| trường bắt buộc | `required` trên ô | `N1` |

## Trả về danh sách tự kiểm

Mỗi dòng **Tự kiểm** ở trên là một dòng, mỗi page một khối. Dòng trượt mà sửa được thì sửa rồi tick; còn trượt thì
để `[ ]` kèm chỗ và lý do chưa sửa:

```text
Tự kiểm 01-blockers.html
- [x] N1 không chỗ nào phải hỏi nghĩa
- [ ] N5 khối 3 tô xanh khi số cảnh báo tăng — chưa sửa: brief chưa nói tăng là tốt hay xấu
```

Agent chính chép các dòng `[ ]` vào tin giao.
