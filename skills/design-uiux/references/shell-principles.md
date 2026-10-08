# Nguyên tắc thiết kế shell

shell là thứ người xem dùng để vặn và so bản thiết kế. Nó phải **dễ thấy là đang vặn gì, mà không lấn vào bản thiết
kế**. Tên các khối (toolbar, option-switcher, view-controller, panel, data-panel, config-panel) theo mục "Các khối
điều khiển" của `SKILL.md`.

Sửa shell thì giữ đúng các nguyên tắc dưới đây, rồi chạy `scripts/test-shell.mjs`. Nguyên tắc nào có phép kiểm thì
phép kiểm đó nằm trong script; thêm nguyên tắc mới thì thêm phép kiểm cùng lúc.

## Màu: tách khỏi page mà không chói

- shell dùng màu trung tính riêng, không dùng token của design system: đổi design system không đổi shell.
- Cùng sáng tối với page, khác tông: page sáng thì shell nền xám, page tối thì shell xám sáng hơn nền page một bậc.
  Đảo màu (page sáng, shell đen) thì chói; cùng màu page thì shell chìm vào bản thiết kế.
- Viền ngoài của toolbar và panel rõ vừa phải (`--ds-bar-edge`), đường kẻ bên trong nhạt (`--ds-bar-line`). Viền
  ngoài là thứ tách shell khỏi page, không phải nền.
- Ô nhập nổi trên nền shell (trắng trên xám ở chế độ sáng).

## Bố cục: theo trang, không theo màn hình

- Hai mép thanh trên cùng thẳng mép chữ của trang, không sát mép màn hình.
- toolbar là một khối liền: nhãn tiến độ bên trái, option-switcher ở giữa trang, view-controller bên phải, luôn cùng
  một dòng. Thiếu chỗ thì A B C lệch về phía cột hẹp hơn, không chồng lên hai cột ngoài.
- Đủ chỗ thì panel luôn mở ở lề hai bên, không đè và không bóp khối trang (breakpoint của page vẫn đúng). Thiếu chỗ
  thì panel gập thành hai nút "Dữ liệu", "Cấu hình", hai nút rộng bằng nhau để toolbar cân giữa.
- Hai nút mở panel đứng ở lề ngoài trang, ngay trên chỗ panel mở ra, khi lề đủ chỗ; lề hẹp mới vào trong thanh.
  Nhờ vậy toolbar luôn rộng đúng bằng trang: đổi khổ desktop / tablet / mobile, panel mở sẵn hay gập, toolbar không
  xê dịch. Mép thanh ở mọi khổ cùng một phép tính: mép khối trang trừ padding.
- Thanh không vừa một dòng thì hai nút mở panel lên dòng trên, toolbar nguyên khối ở dòng dưới. Vừa hay không đo
  bằng bề rộng thật của từng nút, không đoán bằng breakpoint.
- Khung nổi của shell (mô tả phương án, panel gập) luôn nằm trong màn hình, kể cả ở 375px.

## Dãy màn: thấy mình đang ở đâu trong luồng

- Thư mục luồng thay nút A B bằng dãy màn "1 · Welcome → 2 · Đăng ký → 3 · Hồ sơ", cùng chỗ với option-switcher.
  Người xem đọc được cả luồng có mấy màn và đang ở màn nào mà không phải rê chuột.
- Màn đang xem được tô như nút phương án đang chọn; mũi tên giữa hai màn mờ, chỉ để nói thứ tự.
- Rê vào một màn thì thấy màn đó để làm gì, như khung mô tả của nút phương án.
- Màn ≤ 480px chỉ còn số: tên màn làm dãy tràn khỏi toolbar ở 375px. Nhãn đủ chữ vẫn nằm ở `aria-label`.
- Bấm một màn, hay nút "Tiếp tục", "Quay lại" trong page, thì sang page đó với mọi giá trị đang xem trên URL. Ở khung
  mobile / tablet, trang cha chuyển theo, để dãy màn luôn tô đúng màn đang xem.
- Nút về mặc định xoá cả chữ đã gõ ở các màn, để đi lại luồng từ đầu.

## Nhãn tiến độ và tự tải lại: biết page đang tới đâu

- **Nhãn tiến độ luôn có**, ở cột trái của toolbar, đối xứng với view-controller bên phải: "● Đang dựng 3/6",
  "● Đang sửa 1/3" (chấm và chữ màu accent) hay "✓ Xong · 07/10" (chữ nhạt, ngày sửa cuối trong `pages.js`). Số đếm
  bước của vòng đang mở, không đếm cả danh sách.
- Bấm nhãn mở danh sách bước dựng, nhóm theo vòng ("Dựng", "Góp ý vòng 2"): ✓ xong, ● bước đang làm, ○ còn lại. Esc hay
  bấm ngoài thì đóng. Page không có danh sách bước là page đã xong, danh sách ghi một dòng nói vậy.
- **Không có nút tải lại.** Có bước mới được đánh dấu xong thì page tự tải lại: người xem để page mở là thấy page lớn
  dần. Giá trị đang vặn nằm trên URL nên còn nguyên; vị trí cuộn cũng giữ, ở cả trang cha lẫn khung mobile / tablet.
- **Không tải lại khi người xem đang gõ.** Con trỏ đang ở ô gõ chữ (kể cả trong khung mobile / tablet) thì đợi rời ô
  mới tải. Ô chọn, thanh kéo không tính: chúng giữ con trỏ sau khi chọn, tính vào thì page đợi mãi.
- Màn hẹp (≤ 720px) nhãn chỉ giữ dấu và số bước, bỏ chữ và ngày, để toolbar vẫn vừa một dòng.

## data-panel và config-panel: thấy ngay, khó nhập sai

- **data-panel bên trái vặn dữ liệu** (variables, bộ dữ liệu); **config-panel bên phải vặn cấu hình** (tweaks:
  role, bố cục, độ dày). Không trộn hai loại vào một panel.
- **Thấy hết giá trị đang chọn mà không phải mở gì.** Ô chọn ít lựa chọn, chữ ngắn (≤ 4 lựa chọn, tổng ≤ 24 ký tự)
  là dãy nút bấm như A B C; nhiều hơn mới là ô chọn thả xuống.
- **Không cho nhập giá trị ngoài khoảng.** Số có cả min và max là thanh kéo kèm số đang chọn; chỉ số không có
  khoảng mới là ô nhập.
- **Thay đổi nào cũng phải nhìn ra.** Chọn bộ dữ liệu thì ô bộ dữ liệu giữ tên bộ đang khớp, các ô bị bộ đó đổi
  nháy lên một lúc; vặn lệch khỏi bộ thì ô bộ dữ liệu về "Bộ dữ liệu…".
- Cách tô "đang chọn" giống nhau khắp shell: nền accent nhạt, chữ accent, đậm.
- Nhãn ngắn, một dòng; ô rộng hết panel, nhãn trên ô dưới.
- **Giải thích khi nhãn chưa đủ nói.** Ô có `help` thì có icon ⓘ cạnh nhãn; đưa chuột, Tab tới hay chạm vào thì hiện
  lời giải thích, khung nằm trong màn hình. Nhãn đã rõ thì không có icon: icon ở mọi ô thành nhiễu.
