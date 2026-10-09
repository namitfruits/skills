# Dựng một page

File này là luật dựng page của skill design-uiux, cho agent dựng page: agent con mà agent chính gọi, hay agent chính
khi thư mục design chỉ có một page. Đọc hết file này, `references/ux-principles.md`, `references/ui-principles.md` và
`brief.md` của thư mục design trước khi viết page.

`$SKILL` là thư mục chứa `SKILL.md` (cha của `references/`). `$D` là thư mục design. `<file>` là `NN-slug.html` của
page đang dựng.

## Phạm vi của agent dựng page

<!-- spec: F1.3 F1.5 F6.6 -->

- Chỉ sửa đúng file `$D/<file>`. Danh sách bước dựng `<file>.progress.js` chỉ ghi qua `new-design.mjs progress`: lệnh
  ghi file tạm rồi rename, sửa tay thì shell đọc trúng file ghi dở. Không đụng `brief.md`, `pages.js`, `tokens.js`,
  `../_shell/` hay page khác.
- Không chạy `progress --delivered`. Bước giao là của agent chính, chạy ngay trước tin giao; đánh dấu sớm thì nhãn
  ghi "✓ Xong" trong lúc agent chính còn kiểm cả thư mục.
- Mọi page của thư mục đọc chung `brief.md`, nên page theo đúng các bảng chung của brief:
  - `variables` khai đúng bảng "Nút dữ liệu chung"; dữ liệu giả theo "Dữ liệu chung"; `tweaks` tự chọn cho page này.
  - `data-block` lấy đúng số trong bảng "Khối". Khối chưa có trong bảng thì báo lại, không tự đặt số.
  - Cặp màu có trong bảng "Cặp màu không đủ đọc" thì dùng đúng cột "Dùng thay". Cặp khác trượt `UX10` thì báo lại,
    không tự chọn.

  Agent con dựng song song không thấy page của nhau; mỗi agent tự đặt số khối hay tự chọn màu thì các page lệch nhau.
  Agent chính tự dựng một page thì tự thêm dòng vào bảng đó của `brief.md` thay cho báo lại.
- Bị gọi lại giữa chừng: chạy `progress` không cờ, đọc page đang có (bước dở có thể đã viết một phần), làm tiếp từ
  bước nó in ra. Không chép lại khuôn, không dựng lại từ đầu.

## Sáu bước dựng

<!-- spec: F2.1 F2.2 F3.2 F3.3 F5.6 F6.2 F6.6 F6.8 -->

Page mới chỉ có khối chờ (tên màn, tên page, bố cục hay việc của màn, các việc page tiện cho). Dựng nó qua **sáu
bước** trong `<file>.progress.js`, từng bước một:

1. `node $SKILL/scripts/new-design.mjs progress "$D" <file>` in bước dựng đầu tiên chưa xong.
2. Dựng đúng phần của bước đó (bảng dưới). Ghi page sau mỗi bước, không gom nhiều bước rồi ghi một lần. Mỗi khi bắt
   đầu một phần của bước, ghi việc con: `node $SKILL/scripts/new-design.mjs progress "$D" <file> --doing "<việc>"`.
3. Chạy lệnh kiểm của bước đó tới khi sạch.
4. `node $SKILL/scripts/new-design.mjs progress "$D" <file> --done <n>`. Page đang mở trên trình duyệt tự tải lại.

| Bước | Dựng gì, xong khi | Kiểm trước khi `--done` |
| ---- | ----------------- | ----------------------- |
| 1 · Khung các khối, dữ liệu mặc định | khai đủ `variables` theo "Nút dữ liệu chung" (có `state` đủ bốn giá trị) và `tweaks`; khối chờ thay bằng mọi khối thật, mỗi khối một `data-block` theo bảng "Khối", hiện đúng ở giá trị mặc định | `check.mjs <page> --quick` |
| 2 · Đang tải · rỗng · lỗi | `state` `loading`, `empty`, `error` đã dựng | `--quick --state loading`, rồi `empty`, rồi `error` |
| 3 · Trạng thái riêng của đề | các `state` riêng trong brief đã dựng | `--quick --state <từng giá trị>` |
| 4 · Tương tác: bấm, gõ, mở, đóng | mọi nút làm gì đó, hay khoá kèm `title`; tab, lọc, modal, thêm, xoá chạy trên dữ liệu giả. Màn của luồng: có nút gọi `$store.design.next()` (trừ màn cuối) và `prev()` (trừ màn đầu), ô gõ dùng `$store.design.form.<key>` | `--quick` |
| 5 · Preset và ca biên | `presets` khai xong, ca biên (tên dài, số 0, số rất lớn) dựng xong | `--quick --preset "<từng nhãn>"` |
| 6 · Kiểm đầy đủ và tự kiểm | `check.mjs` đầy đủ exit 0, đã đi danh sách tự kiểm trên ảnh | `check.mjs <page>` (mục "Kiểm") |

- Bước 1 phải ra **bản xem được** ngay: đúng các khối, đúng số liệu mặc định. Các bước sau thêm dần thứ người xem vặn
  ra được.
- Đề cần một phần lớn không vừa các bước trên (bảng so sánh gói, biểu đồ riêng) thì chèn thêm bước:
  `progress … --insert "<việc>"`. Bước chèn nằm trước bước kiểm đầy đủ. Không bớt bước nào.
- Chỉ `--done` sau khi `--quick` sạch: page lỗi JS thì trắng đúng lúc người dùng đang xem.
- `--done` chỉ nhận đúng bước đầu tiên chưa xong; số khác thì lệnh báo lỗi kèm tên bước đúng.
- Việc con (`--doing`) hiện thành một dòng dưới bước dở khi người xem bấm nhãn tiến độ. Ghi 2–4 việc con một bước,
  mỗi việc vài chữ nói việc đang làm: "Chuẩn bị dữ liệu", "Viết bảng đơn hàng", "Sửa lỗi --quick báo". Không ghi tên
  file, không ghi câu dài. `--doing` không làm page tải lại; `--done` xoá việc con của bước vừa xong.
- Cách khai nút, viết khối, dựng `state`: đọc `$SKILL/templates/example.html` (màn Thành viên đã dựng xong), không
  chép nó đè lên page: page sẽ có màn Thành viên thay cho đề. Giữ nguyên thứ tự nạp script ở `<head>` của page.
- **Màu dùng vào đâu, cỡ chữ, khoảng cách, bóng, nút chính**: theo hai file luật. `references/ux-principles.md` là
  luật UX: thứ người dùng cảm nhận (hiểu đúng, làm được). `references/ui-principles.md` là luật UI: thứ người dùng
  thấy (màu, chữ, khoảng cách, hình khối). Luật không chép lại ở đây.

## Đánh dấu trong page

<!-- spec: F5.2 -->

Máy kiểm chỉ đo được khi page nói phần tử nào là gì:

| Thứ | Đánh dấu | Kiểm dựa vào |
| --- | -------- | ------------ |
| tên trang | đúng một `h1` | `UI3` |
| tiêu đề khối | `h2` | `UI3` |
| tên trong khối lặp (card, mục) | `h3` | `UI3` · `UI13` |
| thứ đang chọn (tab, chip, mục menu, trang) | `aria-selected` · `aria-pressed` · `aria-current` | `UX3` |
| khối biểu đồ, kể cả chú thích của nó | `data-chart` trên khối bọc | `UI1` · `UX5` |
| modal, sheet, panel trượt | `role="dialog"`; nút đóng có `aria-label="Đóng"` | `UX1` |
| trường bắt buộc | `required` trên ô | `UX1` |

## Khai nút: `window.DESIGN`

<!-- spec: F1.9 F2.1 F2.2 -->

```js
window.DESIGN = {
  lang: "vi",                                   // "en" khi đề tiếng Anh: chữ trên toolbar và panel đổi theo
  variables: [ /* đổi DỮ LIỆU UI hiển thị: đúng bảng "Nút dữ liệu chung" của brief.md */ ],
  tweaks:    [ /* đổi CẤU HÌNH UI: role, bố cục, độ dày */ ],
  presets:   [{ label: "Dữ liệu dày", values: { weeks: 12, warnAt: 20 } }],
  // pageWidth: { value: "90rem", why: "bảng 9 cột" },  // chỉ khi phương án cần rộng khác bề rộng chung
};
```

| `type` | field | panel vẽ |
| ------ | ----- | -------- |
| `number` | `min` · `max` · `step` · `unit` · `default` | có cả `min` và `max` thì thanh kéo kèm số đang chọn; thiếu một trong hai thì ô số có đơn vị |
| `select` | `options`: chuỗi hoặc `{ value, label }` · `default` | ≤ 4 lựa chọn và tổng chữ ≤ 24 ký tự thì dãy nút bấm (thấy hết lựa chọn mà không phải mở); nhiều hơn thì ô chọn thả xuống. Nhãn ngắn để được dãy nút |
| `toggle` | `default` | công tắc |
| `text` | `maxLength` · `default` | ô chữ |

- `help` (không bắt buộc): một hai câu nói nút là gì và vặn thì page đổi gì, hiện ở icon ⓘ cạnh nhãn. Chỉ khai khi
  nhãn chưa tự nói rõ ("Cảnh báo dưới", "Mức dùng"); nhãn đã rõ ("Trạng thái", "Độ dày") thì bỏ.
- **variables** là thứ dữ liệu thật mang tới: số lượng, phần trăm, ngưỡng, giờ, tên dài, và `state`.
- **tweaks** là thứ quyết định giao diện trông thế nào cho ai: role (đổi quyền thì nút, menu đổi), kiểu bố cục (grid /
  list), độ dày.
- Khổ màn và sáng / tối là nút cố định của view-controller, **không khai**.
- **Vặn nút nào UI cũng phải đổi thấy được**, không thì đừng khai (`check.mjs` bắt). Đọc giá trị bằng
  `$store.design.<key>`.
- Kết quả chỉ hiện ra **sau một cú bấm** (lưu lỗi, gửi thất bại, hết hạn giữa chừng) thì làm thành một giá trị của
  `state` ("Lưu thất bại": page hiện sẵn cảnh đã sửa mà lưu không được), đừng làm variable kiểu "khi bấm Lưu thì lỗi":
  vặn nó không thấy gì, người xem không biết nó có tác dụng.
- `presets` cho ca biên và dữ liệu dày, để người xem bấm một lần ra cả bộ.

## Trạng thái và dữ liệu giả

<!-- spec: F1.3 F3.2 F3.3 -->

- Variable `state` bắt buộc, `options` có ít nhất `data` · `loading` · `empty` · `error`, cộng trạng thái riêng của đề
  (vượt ngưỡng, quá hạn, sắp reset). Đang tải là khung chờ đúng hình dòng thật; rỗng có câu nói vì sao và nút làm
  tiếp; lỗi có câu nói chuyện gì và nút thử lại.
- Dữ liệu giả sinh từ variables (đổi số là đổi dữ liệu), theo `## Dữ liệu chung`, có ca biên: tên dài tràn hai dòng,
  số `0`, số rất lớn, thiếu ảnh hay mô tả, một phần tử. Số giữa các khối phải khớp nhau (tổng ở đầu trang bằng tổng
  các dòng).
- **Bấm được như thật** bằng state Alpine trong page: tab, lọc, tìm, sắp xếp, mở modal, thêm, xoá, đổi trên dữ liệu
  giả. Không gọi API. Nút nào thấy được cũng phải làm gì đó; không làm được (role thiếu quyền) thì `disabled` kèm
  `title` nói vì sao.
- Mỗi khối chính có `data-block="<số>"`, số lấy từ bảng `## Khối` của `brief.md`.

## Page của một màn trong luồng

<!-- spec: F2.6 F2.7 -->

- Nút đi tiếp ("Tiếp tục", "Xác nhận", "Bắt đầu") gọi `$store.design.next()`; nút quay lại gọi `$store.design.prev()`.
  Màn đầu không cần nút quay lại, màn cuối không cần nút đi tiếp. Shell sang page của màn kề, giữ mọi giá trị trên URL.
- Ô người xem gõ hay chọn mà màn sau cần thì `x-model="$store.design.form.<key>"`, key đúng cột "Đưa cho màn sau" của
  `## Luồng`. Thứ màn trước đưa sang thì đọc `$store.design.form.<key>`, kèm chữ thay khi rỗng
  (`$store.design.form.email || 'ban@vidu.vn'`), vì người xem có thể mở thẳng màn giữa.
- Kiểm hợp lệ (email sai, mật khẩu yếu) chặn nút đi tiếp như app thật, nhưng chữ mẫu hợp lệ phải qua được: máy kiểm
  điền `an@vidu.vn`, `MatKhau#2026`, `0901234567`, `Chữ mẫu` rồi bấm đi tiếp.
- Không giữ chữ người xem gõ trong state Alpine riêng của page (`x-data="{ email: '' }"`): sang màn khác là mất.

## Viết HTML

<!-- spec: F1.9 F3.1 -->

- Class Tailwind theo tên token: `bg-canvas`, `bg-surface-card`, `text-ink`, `text-body`, `text-muted`,
  `border-hairline`, `bg-primary text-on-primary`, `text-title-md`, `font-display`, `rounded-md`, `gap-sm`. Tên có
  trong `tokens.js` (`--color-<k>` → `bg-<k>`, `--text-<k>` → `text-<k>`, `--spacing-<k>` → `p-<k>`, `--radius-<k>` →
  `rounded-<k>`).
- **Không mã màu nào trong page** (`#hex`, `rgb()`, `text-[#…]`): màu chỉ ở `tokens.js`, đổi giao diện sáng tối mới
  đổi theo. Thiếu màu thì dùng `bg-primary/10` hay token gần nhất.
- Mọi thứ nằm trong `<main id="design" x-data>`: thẻ đọc `$store` nằm ngoài khối `x-data` thì Alpine không vẽ, chữ
  trống. Icon `<i data-lucide="tên">`; shell tự vẽ lại khi Alpine thêm icon mới.
- Biểu thức Alpine trong attribute nháy kép thì dùng nháy đơn hay template literal bên trong; nháy kép lồng nhau là
  lỗi cú pháp, toolbar và panel chết theo.
- Thẻ có `x-show` thì `:style` viết dạng object thẳng trong thuộc tính (`` :style="{ bottom: `${…}%` }" ``) hay dùng
  `:class` `hidden`, không viết dạng chuỗi: `:style` chuỗi tính lại thì ghi đè cả `style`, mất `display: none`.
  `:style="biến"` mà biến chứa chuỗi cũng hỏng, và lượt đọc file của `check.mjs` không bắt được.
- Khối ngoài cùng trong `#design` giữ `mx-auto max-w-page` của khuôn, **không đổi sang `max-w-4xl`, `max-w-6xl`** vì
  thấy hợp phương án: bề rộng là của app, không phải của phương án. Phương án thật sự cần rộng khác (bảng nhiều cột)
  thì khai `pageWidth: { value, why }` trong `window.DESIGN`, dùng `max-w-[<value>]`, và báo lại lý do để
  `## Design system` của brief ghi.
- Media query chạy thật trong khung mobile / tablet: dựng responsive bằng `sm:` `md:` `lg:`, không bằng JS đo bề rộng.
- Khung nổi (modal, panel, toast, lớp phủ) đặt `z-[1100]`.
- Dòng có nút hành động bên phải (Nhắc, Đổi hạn, Xoá): ở 375px cho nút xuống hàng riêng (`w-full justify-end
  sm:w-auto`), không thì nút ép chữ của dòng thành một cột hẹp mà `check.mjs` không bắt được.

## Kiểm

<!-- spec: F1.13 F3.4 F3.5 F3.9 F5.1 F5.2 F5.4 F5.5 F5.6 F5.7 F5.8 -->

```bash
node $SKILL/scripts/check.mjs "$D/<file>" --quick [--state <giá trị>] [--preset "<nhãn>"]   # trước mỗi progress --done
node $SKILL/scripts/check.mjs "$D/<file>" [--pw <thư mục có playwright>]                    # bước 6: kiểm đầy đủ
```

- **Kiểm nhanh** (`--quick`, 1–2 giây): lượt đọc file, lỗi console, lỗi JS, bố cục và luật UX, UI ở **một** tổ hợp
  (1280px, sáng, tweak mặc định, `state` theo `--state` hay preset theo `--preset`). Không vặn từng nút, không bấm,
  không khổ tablet / mobile. Ảnh: `shots/<page>--quick.png`. `--quick` chỉ nhận một page.
- **Kiểm đầy đủ** là bước dựng cuối của page: mọi tổ hợp tweak × sáng tối × `state` cộng từng preset ở 375 và 1280px,
  cộng một lượt bấm từng loại thứ bấm được, cộng lượt đi luồng với thư mục luồng. Thứ chỉ hiện ở một giá trị khác mặc
  định được bấm ở đúng giá trị đó. Kiểm đầy đủ báo `còn bước chưa xong` khi danh sách bước dựng của page còn bước chưa
  xong ngoài bước kiểm đầy đủ của vòng đang mở.
- Chưa có Playwright thì lệnh in câu cài vào thư mục tạm (`npm i --prefix "$TMPDIR/design-uiux-pw" playwright`), chạy
  lại kèm `--pw`. **Không cài vào dự án.**
- Lệnh của các agent con chạy song song được: mỗi page một bộ ảnh tên riêng trong cùng `shots/`.
- Mỗi lỗi nói chỗ sai và cách sửa. Lỗi mở đầu bằng ID luật (`[UX10]`, `[UI4]`) thì mở đúng mục trong
  `references/ux-principles.md` hay `references/ui-principles.md` để sửa. Luật UI có trong bảng "Luật UI theo design
  system" của `brief.md` thì lệnh không kiểm. Lỗi ở `brief.md` hay `pages.js` thì agent con không sửa, ghi vào chỗ còn
  lấn cấn khi trả về.
- Lệnh thoát mã 2 với dòng `skill lệch` là lỗi của skill (luật trong hai file chưa có kiểm), không phải lỗi page: ghi
  vào chỗ còn lấn cấn, không sửa page để lách.
- Sửa tới khi **exit 0**, tối đa ba vòng. Còn lỗi sau ba vòng thì ghi từng dòng lỗi và vì sao chưa sửa; không trả về
  như thể đã sạch.
- Exit 0 xong vẫn **mở ảnh trong `shots/` ra**: 1280 và 375, sáng và tối, `state` rỗng và lỗi, preset ca biên, ảnh
  `--bam-*` của modal và panel. Máy chỉ kiểm thứ nó vặn và bấm được: modal, sheet, hàng mở rộng vỡ mà máy vẫn báo
  sạch. Trên các ảnh đó đi hết dòng **Tự kiểm** của `references/ux-principles.md` và `references/ui-principles.md`.
  Bỏ dòng của luật UI có trong bảng "Luật UI theo design system". Xong thì `progress … --done <n>` cho bước
  kiểm đầy đủ.

## Trả về

<!-- spec: F1.3 F5.3 F5.5 -->

Agent con trả về cho agent chính, theo thứ tự:

1. dòng cuối của `check.mjs` đầy đủ;
2. khối **Tự kiểm**: mỗi dòng **Tự kiểm** là một dòng. Dòng trượt mà sửa được thì sửa rồi tick; còn trượt thì để
   `[ ]` kèm chỗ và lý do chưa sửa;
3. `variables`, `tweaks`, `presets` đã khai; trạng thái riêng đã thêm; `pageWidth` kèm lý do nếu có khai;
4. các số trong `## Số kiểm chéo ở mặc định` của brief, đọc trên page ở giá trị mặc định;
5. chỗ còn lấn cấn: khối, cặp màu phải báo lại, lỗi chưa sửa, lỗi ở `brief.md`.

```text
Tự kiểm 01-blockers.html
- [x] UX1 không chỗ nào phải hỏi nghĩa
- [ ] UX5 khối 3 tô xanh khi số cảnh báo tăng — chưa sửa: brief chưa nói tăng là tốt hay xấu
```

Agent chính tự dựng một page thì không trả về cho ai: các dòng `[ ]` và lỗi chưa sửa đi thẳng vào tin giao.
