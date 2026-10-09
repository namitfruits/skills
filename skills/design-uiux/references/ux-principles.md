# Luật UX khi dựng page

<!-- spec: F5.2 -->

Luật UX là luật về thứ người dùng cảm nhận: hiểu đúng, làm được, không bị bất ngờ. File này cho agent dựng page:
agent con, hay agent chính khi chỉ có một phương án. Đọc hết file này và `references/ui-principles.md` trước khi viết
page.

Không design system nào đè được luật UX. Nếu một lựa chọn UI làm hỏng một luật UX, thì luật UX thắng: design system
tô ba nút ba màu cùng nặng thì page vẫn chỉ có một nút chính (`UX4`).

Mỗi luật có hai phần:

- **Máy kiểm**: phần đo được. `check.mjs` đo ở mọi tổ hợp nó đã chạy, phạm thì báo lỗi, đầu dòng là ID luật
  (`[UX10]`) để mở đúng mục ở đây. Lỗi nào cũng sửa trong page; page không có cách tắt kiểm.
- **Tự kiểm**: phần máy không đo được. Dựng xong, mở ảnh trong `shots/`, trả lời từng dòng là đạt hay trượt, trả
  về theo mục "Trả về" của `references/build-page.md`.

Thêm luật vào file này thì viết kiểm cho phần đo được trong `scripts/principles-check.mjs` cùng lúc: `check.mjs` so
ID hai bên, lệch thì dừng.

## Luật

**UX1. Theo quy ước số đông.**

Chỗ nào hầu hết app đã làm một cách và người dùng đã quen thì làm đúng như thế, kể cả khi cách khác trông gọn hơn:
✕ ở góc trên phải để đóng, nút chính đứng phải nhất hàng nút, Huỷ bên trái nó, dấu `*` đỏ cho trường bắt buộc, logo
góc trái về trang chủ. Gu của skill chỉ quyết chỗ chưa có quy ước.

**Máy kiểm:** hộp thoại (`role="dialog"`) có nút đóng `aria-label="Đóng"` (hay `"Close"`) ở góc trên phải; từ
640px, nút chính đứng phải nhất hàng nút cuối hộp thoại và form; ô `required` có nhãn chứa `*` màu `error`.
**Tự kiểm:** người dùng lần đầu mở page có chỗ nào phải hỏi "cái này nghĩa là gì" hay "bấm đâu để…" không.

**UX2. Đổi trạng thái thì giao diện không nhảy chỗ.**

Rê chuột, bấm, dữ liệu về: mọi thứ xung quanh chỗ vừa đổi đứng yên. Chừa sẵn chỗ cho trạng thái lớn nhất, hoặc đổi
bằng màu và độ mờ thay vì thêm bớt phần tử. Tab luôn có viền (trong suốt khi chưa chọn) thay vì thêm viền lúc chọn;
spinner thay chỗ icon trong nút, không chèn thêm; số tự đổi dùng `tabular-nums`; tăng độ đậm chữ lúc chọn làm chữ
rộng ra. Giữ chỗ là để khớp phần tử bên cạnh; không có gì bên cạnh thì bỏ chỗ giữ. Sang hẳn màn khác thì không tính.
Khối mở đóng có chủ ý (accordion) đẩy phần dưới thì trượt (`grid-rows` 0fr ↔ 1fr), không giật.

**Máy kiểm:** rê vào từng loại thứ bấm được, không phần tử nào khác trong `#design` dịch quá 0.5px; bấm một phần tử
trong một hàng (tab, chip, nhóm nút), anh em cùng hàng không dịch.
**Tự kiểm:** có khoảng trống giữ chỗ nào không làm thứ quan trọng thẳng hàng với phần tử bên cạnh không.

**UX3. Mỗi trạng thái đều được dựng, và liếc là phân biệt được.**

Liệt kê trước khi dựng: thường, rê chuột, đang chọn, khoá, đang tải, rỗng, lỗi, xong, và ca biên (không có gì, một
cái, rất dài, rất nhiều). Trạng thái dữ liệu đi qua variable `state`, ca biên qua preset. Hai trạng thái khác nghĩa
thì khác hình rõ, không chỉ khác chữ. Một trang hay 0 dòng thì giấu control không dùng được (phân trang, chọn tất cả).

**Máy kiểm:** phần tử có `aria-selected` / `aria-pressed` / `aria-current` bằng `true` khác anh em bằng `false` ở
nền, màu chữ, viền hay độ đậm.
**Tự kiểm:** che chữ đi, hai trạng thái khác nghĩa (xong và đang chạy, lỗi và đang chờ) còn phân biệt được không; ca
biên có trông cố ý không: "0 ảnh" thì ẩn hay nói bằng chữ ("Chưa có ảnh"), thiếu mô tả thì khối co lại, không để
dòng trống.

**UX4. Một tín hiệu cho một ý; tín hiệu mạnh nhất để dành cho một chỗ.**

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

**UX5. Màu nói trạng thái, theo một bảng cho cả app, và luôn có chữ đi kèm.**

Màu không để trang trí, không để phân loại. Trạng thái lấy màu từ token trạng thái của design system (mục "Vai màu"
của `references/ui-principles.md`): xám là chờ, xanh lá là xong, vàng cam là cần chú ý, đỏ là hỏng; "xong" ở đâu cũng
một màu. Màu theo **tốt hay xấu**, không theo lên hay xuống. Đỏ chỉ cho lỗi và việc không lấy lại được. Màu không bao
giờ đứng một mình: luôn có chữ, số hay icon nói cùng ý.

**Máy kiểm:** phần tử không chữ có nền màu không trung tính (chấm, vạch, ô màu) có `aria-label` hay `title`, hoặc cha
của nó có chữ; trừ trong `[data-chart]`.
**Tự kiểm:** màu có theo tốt hay xấu không (chi phí tăng thì không tô xanh); trạng thái có dùng token trạng thái,
không mượn màu phụ không.

**UX6. Chữ nói được việc: chuyện gì, vì sao, làm gì tiếp.**

Câu dài thì tách hai tầng: tầng trên chuyện gì xảy ra, tầng dưới vì sao hay hệ quả, có số và mốc cụ thể. Câu lỗi nói
cách sửa, không lặp lời nhãn. Khoá thì nói vì sao khoá. Chỉ sang chỗ khác thì là nút hay link, không phải chữ trơn.
Mỗi bước có lối lùi khi người dùng đi nhầm. Câu lỗi không bịa ra luật mà page không kiểm. Rỗng mà người dùng là
người mở đầu (danh sách họ tự tạo) thì trạng thái rỗng có việc bấm được ngay.

**Máy kiểm:** ở `state` bằng `empty` và `error`, trong các khối `data-block` có chữ đổi theo `state`, ít nhất một khối
có nút hay link bấm được, hoặc nút khoá kèm `title` nói vì sao; nút khoá có `title`.
**Tự kiểm:** câu lỗi, câu rỗng có nói chuyện gì, vì sao, làm gì tiếp không; có câu nào bịa ra luật mà page không kiểm
không.

**UX7. Không làm hộ, không đoán hộ người dùng.**

Chưa chọn thì để trống, hiện placeholder. Gợi ý hiện ở chỗ gợi ý, không ghi sẵn vào ô. Không tick sẵn đồng ý. Form
tạo mới mở ra trống; form sửa thì có giá trị cũ. Ngoại lệ: nhóm radio luôn có sẵn một lựa chọn.

**Máy kiểm:** form mở từ nút có nhãn bắt đầu bằng Thêm, Tạo, Mời, Mới, Add, New, Create, Invite thì ô chữ trống,
checkbox chưa tick.
**Tự kiểm:** có số đếm hay giá trị nào bịa cho có, không khớp dữ liệu giả không (số trên tab, tổng ở đầu trang).

**UX8. Không che, không cắt mất thứ người dùng cần để quyết định.**

Trang không cuộn ngang. Lớp nổi không che chính thứ mở ra nó. Thứ dùng để xác nhận (tên đối tượng sắp xoá) không
cắt. Mô tả xuống dòng (`text-pretty`); chỉ tiêu đề một dòng mới cắt, cắt thì có `title`. Phải cắt thì cắt phần
giống nhau, giữ phần phân biệt: email giữ tên miền, tên tệp giữ đuôi. Link ngắn nằm trong câu thì
`whitespace-nowrap`. Số ghi đè lên biểu đồ đặt về phía còn trống.

**Máy kiểm:** chữ bị cắt (`…` hay `line-clamp`) có `title`, phần còn đọc được từ 8 ký tự, phần bị giấu không có
số kèm đơn vị (`210m²`, `12 triệu`, `82%`), ô chỉ có một con số thì không bị cắt; lớp nổi vừa mở (menu, popover: có thứ
bấm được) không che nút mở nó.
**Tự kiểm:** ở 375px với dữ liệu dài nhất, thứ bị cắt có phải thứ người dùng cần để quyết định không (tên, giá, tên
đối tượng sắp xoá).

**UX9. Mọi thao tác đi được bằng chuột, bằng phím, bằng tay trên điện thoại.**

Bấm được thì có `cursor-pointer` và đổi hình khi rê, vùng bấm rộng hết hàng. Thứ bấm được là `button`, `a` hay control
thật để Tab tới được; khối có `@click` thì thêm `tabindex="0"` và `role`. Màn chạm không có rê, nên thứ chỉ hiện khi
rê phải luôn hiện ở màn hẹp. Thứ bấm được nhỏ hơn 32px giữ hình, nới vùng bấm bằng
`relative before:absolute before:-inset-*` (số âm có ghi chú, `UI12`). Thứ chỉ nói bằng hình có `aria-*`
(`aria-pressed`, `aria-current`, `role="progressbar"`).

**Máy kiểm:** phần tử có `@click` mà không phải `button` / `a` / `input` / `label` / `summary` thì có `tabindex`;
thứ bấm được có `cursor: pointer`; ở 375px vùng bấm từ 32px.

**UX10. Chữ đọc được: tương phản đủ ở mọi giao diện.**

Chữ thường từ 4.5 : 1 so với nền ngay sau nó; chữ lớn (từ 24px, hay từ 18.66px đậm) và icon mang nghĩa từ 3 : 1.
Giao diện do skill suy ra (sáng từ design system chỉ có tối, hay ngược lại) hay trượt nhất. Token của design system
trượt trên một nền thì dùng token chữ đậm hơn của chính design system, không tự đặt màu. Chữ phụ, placeholder cũng
tính.

Logo và ký hiệu trang trí (✳ cạnh tên sản phẩm) thì đánh dấu `aria-hidden="true"`: WCAG không đòi tương phản cho chúng.

**Máy kiểm:** chữ đang hiện, màu chữ trộn lên lớp nền đặc phía sau, đạt mức trên ở mọi tổ hợp sáng tối; trừ control
đang khoá, chữ trên ảnh, chữ đang chạy hiệu ứng và chữ trong `aria-hidden="true"`.
