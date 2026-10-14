# Nguyên tắc thiết kế shell

shell là thứ người xem dùng để vặn và so bản thiết kế. Nó phải **dễ thấy là đang vặn gì, mà không lấn vào bản thiết
kế**. Tên các khối (toolbar, option-switcher, view-controller, panel, data-panel, layout-panel) theo mục "Các khối
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
  thì panel gập thành hai nút "Data", "Layout", hai nút rộng bằng nhau để toolbar cân giữa. Tên đủ "Data Config",
  "Layout Config" nằm ở tiêu đề panel; ghi tên đủ trên nút thì cột phải đẩy option-switcher lệch khỏi giữa trang.
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
- Chữ người xem gõ nằm ở `$store.design.form`. Shell lưu nó vào `sessionStorage`, không lên URL: link chép không mang
  theo mật khẩu mẫu.
- Nút về mặc định của data-panel xoá cả chữ đã gõ ở các màn, để đi lại luồng từ đầu.

## Nhãn tiến độ và tự tải lại: biết page đang tới đâu

- **Nhãn tiến độ luôn có**, ở cột trái của toolbar, đối xứng với view-controller bên phải: "● Đang chuẩn bị",
  "● Đang dựng 3/6", "● Đang sửa #3" (comment) hay "● Đang sửa góp ý" (ý trong chat), chấm và chữ màu accent. Page
  đã xong thì nhãn ghi "Activity log" (chữ nhạt, icon đồng hồ): nhãn lúc này là nút mở danh sách việc agent đã làm. Số đếm là số bước dựng; lúc sửa góp ý thì thanh tiến độ đếm việc của mục đang mở.
- **Nhãn chưa xong phải trông đang chạy.** Chấm có vòng lan ra rồi tan. Sau số bước là việc agent đang làm, chữ nhạt,
  cắt ở 22 ký tự; việc mới thì trượt lên. Đáy nhãn là thanh tiến độ: phần đã xong tô đặc, một vệt sáng chạy trên phần
  còn lại. Nhãn chỉ vẽ lại khi nội dung đổi, để chuyển động không giật về đầu mỗi lần shell đọc tiến độ. Người xem tắt
  chuyển động thì nhãn đứng yên. Nhãn "Activity log" không có chuyển động.
- Bấm nhãn mở danh sách theo nhóm "Chuẩn bị", "Dựng", "Comment", "Góp ý trong chat", "Giao"; nhóm trống thì ẩn. Không
  có chữ "vòng": người xem cần biết từng góp ý xong chưa, không cần biết agent gom bước ra sao. ✓ xong, ● đang làm,
  ○ còn lại. Dưới bước dựng ● là một dòng việc con thụt vào. Dưới mỗi mục góp ý là các việc agent đã làm cho nó, thụt
  vào, chữ nhỏ hơn; việc xong ở lại, không mất. Việc "Kiểm đầy đủ" cuối mỗi mục không có dòng: mục nào cũng có, hiện
  ra chỉ lặp. Lúc máy kiểm đang chạy thì nhãn ghi "Đang sửa #3 · Kiểm đầy đủ". Esc hay bấm ngoài thì đóng. Page không có danh sách bước là page đã xong, danh sách ghi một dòng nói vậy.
- Shell đọc lại `NN-slug.progress.js` mỗi 2 giây. `rev` đổi nghĩa là có bước mới được đánh dấu xong.
- **Không có nút tải lại.** Có bước mới được đánh dấu xong thì page tự tải lại: người xem để page mở là thấy page lớn
  dần. Giá trị đang vặn nằm trên URL nên còn nguyên; vị trí cuộn cũng giữ, ở cả trang cha lẫn khung mobile / tablet.
- **Không tải lại khi người xem đang gõ.** Con trỏ đang ở ô gõ chữ (kể cả trong khung mobile / tablet) thì đợi rời ô
  mới tải. Ô chọn, thanh kéo không tính: chúng giữ con trỏ sau khi chọn, tính vào thì page đợi mãi.
- Màn hẹp (≤ 720px) nhãn chỉ giữ dấu, số bước và thanh tiến độ, bỏ chữ, việc con và ngày, để toolbar vẫn vừa một dòng.

## Chế độ comment: chỉ đúng chỗ, không đụng page

- **Nút comment đứng đầu view-controller**, có icon và chữ "Comment": comment là một cách nhìn page, không đổi page.
  Đang bật thì nút nền accent đậm, chữ trắng, có quầng accent: người xem luôn biết cú bấm vào page đang thành comment.
  Màn ≤ 720px chỉ còn icon.
- **Phím C bật tắt chế độ comment**, như Figma. Không dùng Ctrl+C vì đó là chép. Con trỏ đang ở ô nhập hay ô viết comment
  thì C là chữ c. Nhấn C trong khung mobile / tablet cũng bật tắt được.
- **Bật thì cú bấm vào bản thiết kế không tới page.** Nút, link, form của page không chạy; con trỏ thành dấu cộng, khối
  dưới con trỏ có viền accent. Đáy màn có một dòng nhắc "Bấm một khối hay kéo chọn một vùng · Esc để thoát".
- **Bấm là chọn khối, kéo quá 6px là chọn vùng.** Ô viết nổi ngay dưới chỗ chọn, lật lên trên khi sát đáy, luôn nằm
  trong màn hình kể cả ở 375px.
- **Ô viết nói người xem phải làm gì**, theo cầu nối comment:
  - cầu nối chạy, có hộp thư: "Claude đang nhận comment" (xanh lá), nút Chép và Gửi;
  - cầu nối chạy, không có hộp thư: comment được lưu, nhắn "xem comment" vào session; nút Chép và Gửi;
  - cầu nối đã tắt: session đã đóng lúc mấy giờ, ở VS Code hay terminal, mã session, cách mở lại (`claude --resume
    <mã>`), thư mục để mở session mới; chỉ có nút Chép prompt;
  - chưa từng có cầu nối: chưa có session nào nhận comment, thư mục để mở session; chỉ có nút Chép prompt.

  Không có cầu nối thì ô rộng 400px cho phần chỉ đường, mỗi ý một dòng. Cmd/Ctrl+Enter gửi, Esc đóng ô, Esc lần nữa hay
  phím C thoát chế độ comment.
- **Khung chọn và ô viết bám theo khối đã chọn.** Page cuộn thì khung chọn, ô viết và ghim trôi theo khối, không đứng
  yên trên màn hình. Khung rê ẩn khi cuộn, rê chuột lại thì hiện.
- **Ô viết đang mở là đang gõ.** Page có bản mới thì đợi ô đóng mới tải lại, kể cả lúc con trỏ ở nút Gửi.
- **Ghim là con số, màu theo trạng thái**: accent đã gửi, vàng đang sửa, xanh lá đã sửa. Ghim chưa sửa luôn hiện; ghim đã
  sửa chỉ hiện khi đang bật chế độ comment, để page đã sửa xong không đầy ghim cũ.
- Khổ tablet, mobile: chế độ comment chạy trong khung, như bản thiết kế. Trang cha chỉ giữ nút bật tắt và dòng nhắc.
- Màn ≤ 480px không có nút comment: toolbar không đủ chỗ, và bấm, kéo trên màn đó không chính xác. Muốn comment khổ
  mobile thì xem trên màn rộng, trong khung mobile.
- Đang bật chế độ comment thì tải lại page vẫn còn bật (`sessionStorage` của tab).

## Ẩn shell: xem trọn page

- **Nút ẩn shell đứng cuối view-controller, chỉ có icon**, ở mọi bề rộng kể cả 375px. Ẩn shell là một cách nhìn page,
  cùng nhóm với khổ màn và sáng tối.
- **Bấm thì toolbar, hai panel, ghim, dòng nhắc comment, khung giải thích biến mất.** Page giữ khổ màn, sáng tối, mọi
  giá trị đang vặn, bề rộng. Người xem thấy bản thiết kế như người dùng thật, chụp màn hình không phải cắt.
- **Khổ tablet, mobile giữ khung máy.** Chỉ shell quanh khung ẩn, ghim trong khung ẩn theo. Ẩn shell bỏ phần điều
  khiển, không đổi khổ người xem đang chọn.
- **Lúc ẩn chỉ còn một nút nhỏ ở góc trên phải**, mờ để không đè bản thiết kế, rê hay Tab tới thì rõ. Bấm nút hay nhấn
  `\` thì shell hiện lại đúng như trước. Nút là đường quay lại cho người không biết phím và cho màn cảm ứng.
- **Phím `\` bật tắt**, như Cmd+\\ của Figma, kể cả nhấn trong khung mobile / tablet. Con trỏ ở ô nhập hay ô viết
  comment thì `\` là chữ. **Esc không hiện lại shell**: người xem ẩn shell để xem modal của page, Esc đóng modal thì
  shell bật lại ngoài ý muốn.
- **Ẩn shell thì tắt chế độ comment.** Chế độ comment chặn cú bấm vào page; người xem ẩn shell để bấm page như người
  dùng thật.
- **Page chưa xong thì nút góc có chấm accent** với vòng lan như chấm của nhãn tiến độ. Nhãn tiến độ ẩn theo toolbar;
  không có chấm thì người xem không biết agent còn đang dựng. Page vẫn tự tải lại như lúc shell hiện.
- **Trạng thái ẩn nhớ theo tab và thư mục design** (`sessionStorage`), không lên URL. Tự tải lại hay sang màn kế trong
  luồng thì vẫn ẩn. Link chép gửi đi luôn mở có shell, để người nhận thấy nút vặn.

## data-panel và layout-panel: thấy ngay, khó nhập sai

- **data-panel bên trái vặn dữ liệu** (variables, bộ dữ liệu); **layout-panel bên phải vặn cấu hình** (tweaks:
  role, bố cục, độ dày). Không trộn hai loại vào một panel.
- **Thấy hết giá trị đang chọn mà không phải mở gì.** Ô chọn ít lựa chọn, chữ ngắn (≤ 4 lựa chọn, tổng ≤ 24 ký tự)
  là dãy nút bấm như A B C; nhiều hơn mới là ô chọn thả xuống.
- **Không cho nhập giá trị ngoài khoảng.** Số có cả min và max là thanh kéo kèm số đang chọn; chỉ số không có
  khoảng mới là ô nhập.
- **Thay đổi nào cũng phải nhìn ra.** Chọn bộ dữ liệu thì ô bộ dữ liệu giữ tên bộ đang khớp, các ô bị bộ đó đổi
  nháy lên một lúc; vặn lệch khỏi mọi bộ thì ô bộ dữ liệu để trống.
  Lựa chọn đầu của ô là bộ tả dữ liệu mặc định, nhãn thêm "· mặc định"; mọi lựa chọn khác chỉ ghi mô tả bộ. Ô không có
  dòng giữ chỗ bấm vào không làm gì.
- Cách tô "đang chọn" giống nhau khắp shell: nền accent nhạt, chữ accent, đậm.
- Nhãn ngắn, một dòng; ô rộng hết panel, nhãn trên ô dưới.
- **Giải thích khi nhãn chưa đủ nói.** Ô có `help` thì có icon ⓘ cạnh nhãn; đưa chuột, Tab tới hay chạm vào thì hiện
  lời giải thích, khung nằm trong màn hình. Nhãn đã rõ thì không có icon: icon ở mọi ô thành nhiễu.

## Lệnh khi sửa shell

```bash
node $SKILL/scripts/new-design.mjs shell [--root .design-uiux]   # chép shell mới nhất vào .design-uiux/_shell/; chuyển thư mục design cũ (có _shell/ riêng) sang shell chung
node $SKILL/scripts/test-shell.mjs [--pw <thư mục có playwright>] [--out <thư mục ảnh>]
node $SKILL/scripts/test-progress.mjs   # sau khi sửa lệnh progress của new-design.mjs
node $SKILL/scripts/test-comment-bridge.mjs   # sau khi sửa lệnh comment-bridge, comment của new-design.mjs
```

`test-shell.mjs` tự dựng một `.design-uiux/` mẫu trong thư mục tạm, kiểm toolbar và panel ở 1600 / 1280 / 700 / 375px, sáng
và tối, trong vài giây. Sửa shell thì không cần chạy `check.mjs`: lệnh đó kiểm page.

## Bẫy khi sửa shell

| Bẫy | Hậu quả | Cách tránh |
| --- | ------- | ---------- |
| Token để trong file `.css` | Tailwind bản trình duyệt không đọc được qua `file://` | token trong `tokens.js` |
| Rule ngoài `@layer` đặt `position` | đè `sticky` / `absolute` của Tailwind | rule của shell trong `@layer base` |
| `box-sizing: border-box` cho iframe | khung 375 còn 373, media query lệch | shell đặt `content-box` cho iframe |
| Design system có khoảng cách `sm`, `md`… | Tailwind đọc `max-w-sm` thành 12px, modal còn một chữ mỗi dòng | `tokens.mjs` khai sẵn `--max-width-<k>`; sinh lại `tokens.js` cho thư mục design cũ |
| Khung nổi của page `z-40`, `z-50` | toolbar ở `z-index: 1000` che tiêu đề và nút đóng của panel trượt từ mép trên | page đặt khung nổi `z-[1100]`; `check.mjs` bắt lỗi này |
