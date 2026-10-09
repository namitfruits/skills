---
name: design-uiux
description: >-
  Thiết kế UI thành prototype HTML bấm được, theo design system của dự án hay một bộ của getdesign: đề một màn ra hai
  phương án A/B, đề một luồng ra mỗi màn một page, có panel vặn dữ liệu và cấu hình, kiểm bằng code trước khi giao.
  Chỉ ra HTML trong `.design/`, không sửa code dự án; `--auto` để không dừng hỏi. Dùng khi user nói "thiết kế màn X", "thiết kế luồng X", "nghĩ phương án hiển thị", "làm prototype", "mockup bấm được",
  "cải thiện giao diện trang Y", "design this screen", "design this flow", "prototype", "show me options", hoặc đưa
  một requirement UI và một design system.
---

# design-uiux

<!-- spec-files: references/build-page.md references/getdesign.md -->

## Mental model

<!-- spec: — -->

Agent chính đi sáu bước; người dùng chỉ dừng lại ở bước 2 để trả lời:

1. **Đọc** design system và màn hiện có.
2. **Hỏi** có mở page trong Chrome không, kể cả khi đề rõ. Đề mơ hồ thì hỏi thêm, bằng câu có sẵn đáp án, tối đa 3
   lượt. Dự án không có design system thì hỏi chọn một bộ của getdesign.
3. **Xếp đề**: một màn thì tìm phương án, lấy A và B, không hỏi chọn; một luồng thì tách thành các màn.
4. **Dựng**: tạo page trống, in link ngay, mở page trong Chrome nếu người dùng chọn mở, viết `brief.md`, rồi mỗi page một agent con dựng song song theo
   `references/build-page.md`. Thư mục một page thì agent chính tự dựng theo file đó.
5. **Kiểm** cả thư mục bằng `check.mjs`.
6. **Giao** tin cuối, ngay sau khi đánh dấu bước giao của mọi page. Người dùng góp ý thì sửa thẳng page đó, mỗi ý
   một bước.

`--auto` bỏ qua chỗ người dùng trả lời ở bước 2, tự chọn thay.

Mỗi page có một **danh sách bước dựng** riêng (`NN-slug.progress.js`): sáu bước cố định, góp ý thêm bước theo vòng.
Danh sách là chỗ duy nhất nói page đã tới đâu: agent dựng lấy bước tiếp theo từ đó, shell đọc nó để hiện tiến độ và
tự tải lại page, agent bị ngắt rồi gọi lại đọc nó để làm tiếp, `check.mjs` đọc nó để chặn page dựng dở. Mỗi page một
danh sách, một agent con, nên các page vẫn dựng cùng lúc, không page nào chờ page khác.

Một **thư mục design** `.design/NNN-slug/` cho mỗi đề, ở thư mục làm việc lúc gọi skill. Mọi thư mục design trong
`.design/` dùng chung một shell ở `.design/_shell/`:

| File | Ai viết | Vai |
| ---- | ------- | --- |
| `.design/_shell/` | `new-design.mjs init` chép bản mới nhất từ skill | shell: toolbar và panel (mục "Các khối điều khiển"), khung mobile / tablet, ghi URL. Chỉ bọc quanh page nên cập nhật không đổi hình design cũ |
| `tokens.js` | `new-design.mjs init --tokens --page-width` | mọi màu, chữ, bo góc, khoảng cách, bề rộng trang; giao diện còn thiếu do suy ra |
| `brief.md` | agent chính, từ khuôn `templates/brief.md` | bốn mục đầu cho người đọc: tóm tắt đề, quyết định kèm ai quyết, design system, pages (đề một màn) hay luồng (đề một luồng); các mục sau cho agent dựng page: tình huống, dữ liệu chung, nút dữ liệu chung, khối, số kiểm chéo |
| `pages.js` | `new-design.mjs page` | danh sách page theo thứ tự. Đề một màn: chữ và tên phương án, bố cục, các việc page tiện cho; option-switcher hiện thành nút A B. Đề một luồng: số và tên màn, màn để làm gì; option-switcher hiện thành dãy màn |
| `NN-slug.html` | `new-design.mjs page` chép khuôn trống `templates/page.html` (chỉ có khối chờ); agent con (hay agent chính khi thư mục chỉ một page) dựng tiếp | mỗi phương án, hay mỗi màn của luồng, đúng một page |
| `NN-slug.progress.js` | `new-design.mjs page` tạo; ghi qua `new-design.mjs progress` | danh sách bước dựng của page; shell đọc lại mỗi 2 giây |
| `shots/` | `check.mjs` | ảnh từng tổ hợp và từng cú bấm để soi bằng mắt |
| `run.log` | mọi lệnh `new-design.mjs`, `check.mjs` tự ghi thêm | mỗi lệnh một dòng: giờ, lệnh, page, số giây; `run-log.mjs` đọc thành bảng từng bước |

Sản phẩm là **HTML prototype**, không nối gì với code dự án. Đọc code dự án chỉ để lấy design system và biết màn hiện
có trông ra sao. **Không ghi vào repo dự án** ngoài `.design/` ở thư mục làm việc.

Lệnh, `$SKILL` là thư mục chứa `SKILL.md`:

```bash
node $SKILL/scripts/new-design.mjs init <slug> [--root .design] [--tokens <DESIGN.md | file CSS có @theme> | --getdesign <tên>] [--page-width <1280px | 80rem | full>]
node $SKILL/scripts/new-design.mjs designs   # design của getdesign dùng được, mỗi dòng `tên - mô tả`
node $SKILL/scripts/new-design.mjs page <thư mục design> <slug> --title "<tên>" --option "<A · tên phương án>" --layout "<bố cục>" [--good-for "<việc 1> · <việc 2>"]
node $SKILL/scripts/new-design.mjs page <thư mục design> <slug> --title "<luồng> · <tên màn>" --screen "<n> · <tên màn>" --purpose "<màn để làm gì>"   # đề một luồng
node $SKILL/scripts/new-design.mjs progress <thư mục design> --prepared --all              # agent chính: soát brief, đúng thì mọi page sang "Đang dựng 0/6"
node $SKILL/scripts/new-design.mjs progress <thư mục design> <file> [--doing | --done | --insert | --round …]   # agent dựng page, xem references/build-page.md
node $SKILL/scripts/new-design.mjs progress <thư mục design> --delivered --all             # agent chính: ngay trước tin giao, mọi page sang "✓ Xong"
node $SKILL/scripts/new-design.mjs touch <thư mục design> <file> --note "<góp ý vừa sửa>"
node $SKILL/scripts/new-design.mjs open <thư mục design>   # agent chính: page đầu trong một cửa sổ Chrome mới, chỉ khi người dùng chọn mở
node $SKILL/scripts/check.mjs <thư mục design | page.html> [--pw <thư mục có playwright>]   # kiểm đầy đủ
node $SKILL/scripts/check.mjs <page.html> --quick [--state <giá trị>] [--preset "<nhãn>"] [--click "<nhãn nút>"]   # agent dựng page, trước mỗi --done
node $SKILL/scripts/check.mjs <thư mục design> --brief   # chỉ soát brief.md và pages.js
```

### Các khối điều khiển

<!-- spec: F2 F2.6 F2.7 F6.3 F6.4 F6.5 F6.8 F6.10 F6.11 -->

**shell** là mọi thứ `_shell/` vẽ quanh page, nằm ngoài bản thiết kế: **toolbar** và **panel**. Gọi đúng các tên
này trong SKILL.md, code, comment, plan và lúc nói chuyện với người dùng.

| Nhóm | Khối | Ở đâu | Làm gì | Trong code |
| ---- | ---- | ----- | ------ | ---------- |
| **toolbar** | **nhãn tiến độ** | trái toolbar | "● Đang chuẩn bị", "● Đang dựng 3/6 · <việc con>", "● Đang sửa 1/3", "● Đang kiểm lại" hay "✓ Xong", đọc từ danh sách bước dựng của page. Hết bước dựng mà agent chính chưa chạy `--delivered` thì nhãn ghi "Đang kiểm lại", chưa ghi "Xong". Bấm vào thấy các bước, dưới bước đang làm là việc con; page xong thì dòng cuối là "Sửa lần cuối 9 thg 10". Page không có danh sách là page đã xong | `[data-ds-status]`, `[data-ds-status-list]` |
| | **option-switcher** | giữa toolbar | đề một màn: nút A B chuyển giữa hai phương án; đề một luồng: dãy màn "1 · Welcome → 2 · Đăng ký". Đưa chuột hay chạm giữ thấy mô tả; thư mục một page thì không có | `.ds-pages`, `[data-ds-option]`, `[data-ds-screen]` |
| | **view-controller** | phải toolbar | đổi cách nhìn, page không đổi: khổ desktop / tablet / mobile, sáng / tối, số khối. Ngoại lệ: nút về mặc định trả panel về `default` | `.ds-bar-view` |
| **panel** | **data-panel** | thẻ bên trái | vặn `variables` và chọn preset: dữ liệu page hiển thị | `[data-ds-panel="variables"]` |
| | **config-panel** | thẻ bên phải | vặn `tweaks`: role, bố cục, độ dày | `[data-ds-panel="tweaks"]` |

- Mọi giá trị đang xem (phương án, khổ màn, sáng tối, variables, tweaks) nằm trên URL: chép link gửi đi hay tải lại
  trang thì mở ra đúng giá trị đó. Page đọc giá trị qua `$store.design`, không tự ghi URL.
- **Tự tải lại khi có bước mới xong.** Khi một bước được đánh dấu xong, page đang mở tự tải lại, giữ mọi giá trị trên
  URL và vị trí cuộn. Nếu người xem đang gõ trong ô nhập, thì page đợi con trỏ rời ô mới tải. Không có nút tải lại;
  người dùng để page mở là thấy page lớn dần.
- Thư mục luồng: page gọi `$store.design.next()` · `prev()` để sang màn kề, giữ mọi giá trị trên URL. Chữ người xem gõ
  nằm ở `$store.design.form`, còn nguyên khi sang màn khác hay quay lại. Nút về mặc định xoá `form`.
- Cách các khối hiện ở từng khổ màn, màu shell, lệnh và bẫy khi sửa skill: `references/shell-principles.md`. Đọc
  file đó trước khi sửa shell hay lệnh `progress`, và khi gặp thư mục design cũ có `_shell/` riêng (lệnh
  `new-design.mjs shell` chuyển nó sang shell chung).

### Cờ `--auto`

<!-- spec: F1.4 F1.6 -->

Bật khi lời gọi có `--auto` (`/design-uiux --auto <đề>`), hay người dùng nói rõ "tự chọn hết, đừng hỏi". Dùng để chạy thử.

| Chỗ thường dừng hỏi | Có `--auto` |
| ------------------- | ----------- |
| Bước 2, hỏi khi đề mơ hồ hay chưa rõ một màn hay một luồng | vẫn soạn đủ câu hỏi và đáp án như khi hỏi thật, nhưng **không gọi AskUserQuestion**: lấy đáp án khuyên dùng của từng câu, coi như một lượt trả lời |
| Bước 2, chọn design của getdesign | vẫn in danh sách và soạn câu chọn design; lấy design khuyên dùng (đáp án đầu) |
| Bước 2, hỏi mở page trong Chrome | vẫn soạn câu như khi hỏi thật, nhưng chọn **"Không mở"**, không lấy đáp án khuyên dùng. Bước 4 không chạy `open` |

Bước 3 không hỏi người dùng chọn phương án, nên không có gì để `--auto` thay.

Mỗi câu đã tự trả lời là một dòng trong bảng `## Quyết định` của `brief.md`, cột "Ai quyết" ghi `--auto`. Mọi bước khác giữ nguyên.

## Bước 1 — Đọc đề và dự án

<!-- spec: F1.1 F1.3 F1.7 F3.1 F3.4 F3.9 F3.5 F3.6 -->

Không hỏi những gì tự tìm được.

- **Design system**, lấy theo thứ tự:
  1. đề chỉ định. Đề ghi lệnh `npx getdesign@latest add <tên>` thì **không chạy lệnh đó**: ghi lại `<tên>`, bước 4
     dùng `init --getdesign <tên>`. Chạy thẳng `getdesign add` thì file nằm ở gốc git repo hay thư mục làm việc, ngoài
     `.design/`;
  2. file CSS có `@theme` của dự án (`grep -rl "@theme" --include='*.css' . | grep -v node_modules`).
     Mẫu `*.css` phải có nháy: zsh tự mở `*` trước khi tới `grep`, không khớp file nào thì báo `no matches found` và
     `grep` không chạy. Lệnh báo lỗi là chưa tìm được gì, không có nghĩa dự án không có file `@theme`;
  3. `DESIGN.md` ở gốc dự án;
  4. không có gì thì chạy `node $SKILL/scripts/new-design.mjs designs`, giữ stdout cho bước 2. Lệnh thoát mã 2
     (getdesign hỏng) thì **dừng**: in vào chat dòng lỗi stderr, không dựng page. Không dùng `shell/default-design.md`
     thay: mọi prototype không có design system sẽ trông như nhau, người dùng không biết có thể chọn.

  File CSS có `@theme` thắng `DESIGN.md` khi cả hai cùng có, vì đó là giá trị app đang chạy.
- **Màn liên quan** (đề cải thiện một màn): tìm route (`grep -rn "<đường dẫn>" --include='*.tsx' .`), đọc file màn và component nó dùng. Ghi lại các khối đang có, chữ, trạng thái, số liệu thật, chỗ đang vướng. Không tự chạy app; người dùng đưa ảnh hay URL đang chạy thì dùng cái đó.
- **Component của dự án** (`ls` thư mục component dùng chung): page vẽ cho **trông giống** chúng (dáng, cỡ, trạng thái), không cần trùng code.
- **Bề rộng trang**: có codebase thì lấy theo app, không tự chọn. Tìm layout bọc màn (route cha, `Layout`, `AppShell`)
  và `max-w-*` / `max-width` của khung chứa nội dung (`grep -rn "max-w-\|max-width" <thư mục layout>`). Khung tràn
  hết phần còn lại thì `full`. Không có codebase mà tài liệu design system ghi bề rộng nội dung (`max-width`, "content
  width", "Max content width: ~1200px") thì dùng số đó, bỏ dấu `~`. Không nguồn nào ghi thì bỏ cờ, mặc định `64rem`
  (1024px). Giá trị này đi vào `init --page-width`; mọi page cùng dùng nên đặt cạnh nhau so được. `## Design system`
  của `brief.md` ghi bề rộng lấy từ đâu.
- **Luật UI theo design system**: đọc xong design system thì so với các luật UI `UI1`–`UI13` trong
  `references/ui-principles.md`. Luật nào tài liệu design system viết khác, hay component dự án đang làm khác, thì ghi
  vào brief ở bước 4, kèm câu trích hay đường dẫn component. Chỉ có token thì chưa tính là làm khác. Luật UI có dòng
  **Phục vụ** khác `—` thì nghĩ luôn cách page vẫn giữ luật UX đó: design system đổ bóng cho card (`UI6`) thì modal
  tách khỏi trang bằng lớp phủ tối (`UX4`). Luật UX (`UX1`–`UX10`) không theo design system: component của dự án
  làm khác mà phạm một luật UX (tô trạng thái "Đã gói" bằng `text-primary` thay token trạng thái, phạm `UX5`) thì page
  không theo component ở chỗ đó, và bảng không ghi dòng nào cho nó.

Ra một dòng `Đọc:`, in ở đầu tin của bước 3 (hay bước 2 nếu phải hỏi):

> Đọc: design system từ `packages/ui/src/tokens.css` (chỉ có tối, sáng sẽ suy ra); bề rộng trang `80rem` theo `AppLayout.tsx`; màn `/insights` ở `routes/insights.tsx`, 6 khối; vẽ theo `StatTile`, `DataTable`, `BarChart` của dự án.

Không có design system:

> Đọc: không có design system (đề không chỉ định, không có file `@theme` hay `DESIGN.md`); sẽ hỏi chọn một bộ của getdesign; bề rộng trang mặc định `64rem`.

## Bước 2 — Đề mơ hồ thì hỏi

<!-- spec: F1.1 F1.6 F1.7 F1.12 -->

Đề **mơ hồ** khi một trong ba điều còn chưa trả lời được từ đề hay từ dự án:

- **tình huống dùng**: chưa viết được 3 tình huống (ai dùng, lúc nào, để biết hay làm gì);
- **dữ liệu**: chưa biết có gì (thực thể, trường, đơn vị, khoảng giá trị);
- **loại đề**: chưa xếp được là một màn hay một luồng (bảng ở bước 3). Câu hỏi: "Một màn hay cả luồng?", hai đáp án.
  Đáp án khuyên dùng là **một màn** khi đề nhắc đúng một màn có sẵn trong dự án, ngược lại là **một luồng**.

Không mơ hồ thì vẫn hỏi một lượt có câu mở page trong Chrome (mục dưới), cùng câu chọn design nếu có, rồi sang bước 3.
Mơ hồ thì hỏi bằng AskUserQuestion:

| Luật | Giá trị |
| ---- | ------- |
| số câu mỗi lượt | ≤ 4, một lần gọi |
| đáp án mỗi câu | 2–4, đáp án khuyên dùng đứng đầu, `label` có "(Khuyên dùng)"; `description` nói chọn thì page khác đi thế nào |
| không hỏi | thứ đọc được từ dự án; thứ có mặc định hợp lý (một dòng `AI đoán` trong `## Quyết định`, báo lúc giao) |
| hỏi gì trước | câu đổi bộ tình huống (ai dùng, để làm gì), rồi câu đổi dữ liệu, cuối cùng mới tới chi tiết |
| điểm dừng | viết được 3 tình huống và biết dữ liệu có gì, hoặc hết **3 lượt**; hết lượt mà còn mơ hồ thì đoán, ghi dòng `AI đoán` vào `## Quyết định` |

Người dùng chọn "Other" kèm chữ thì lấy chữ đó làm câu trả lời. Câu hỏi nào cũng thành một dòng trong `## Quyết định` của `brief.md`, cột "Ai quyết" ghi `người dùng`.

### Hỏi mở page trong Chrome

<!-- spec: F6.13 -->

Lượt hỏi đầu tiên luôn có câu này, cùng lần gọi AskUserQuestion với câu làm rõ và câu chọn design. Đề rõ và không phải
chọn design thì lượt đó chỉ có câu này. AskUserQuestion nhận tối đa 4 câu mỗi lần gọi, nên câu này chiếm một chỗ
trong 4 chỗ của lượt đầu: còn lại tối đa 3 câu cho làm rõ và chọn design (có câu chọn design thì còn 2 câu làm rõ).

| Trường | Giá trị |
| --- | --- |
| `question` | "Mở page trong một cửa sổ Chrome riêng để xem page lớn dần không?" |
| `header` | "Mở Chrome" |
| đáp án 1 | "Mở (Khuyên dùng)" — một cửa sổ Chrome mới, một tab ở page đầu; sang page khác bằng nút trên toolbar |
| đáp án 2 | "Không mở" — chỉ in link vào chat |

Câu trả lời thành một dòng trong `## Quyết định` của `brief.md`: "Mở page trong Chrome", đáp án, ai quyết. Ghi nhớ đáp
án tới bước 4.

### Chọn design của getdesign

<!-- spec: F3.6 F3.7 -->

Nếu bước 1 đã chạy `designs` và lệnh thoát mã 0, thì đọc `references/getdesign.md` và làm theo, kể cả khi đề không mơ
hồ. File đó nói cách in danh sách design, câu hỏi chọn design (nằm trong lượt hỏi đầu tiên, cùng lần gọi
AskUserQuestion với câu làm rõ), cách chọn bốn design hợp đề và cách xử lý tên gõ sai.

## Bước 3 — Xếp đề: một màn hay một luồng

<!-- spec: F1.11 F1.6 -->

Trước khi tìm phương án, xếp đề vào một trong hai loại. Hai loại đi hai nhánh khác nhau từ đây.

| Loại | Người dùng làm việc trên | Nhận ra khi | Ví dụ |
| ---- | ------------------------ | ----------- | ----- |
| **một màn** | đúng một màn hình | đề nói tới một màn: sửa màn có sẵn, tạo một màn mới, một modal, một trang cài đặt | "thiết kế lại màn đăng nhập", "màn Đơn hàng nhìn rối" |
| **một luồng** | nhiều màn hình nối nhau | đề liệt kê ≥ 2 màn nối nhau, hay gọi tên một luồng: onboarding, đăng ký, thanh toán, "luồng", "các bước", "wizard", "flow" | "luồng onboarding 3 màn", "flow đặt lịch từ chọn dịch vụ tới thanh toán" |

Không xếp được (đề gọi tên một phần của app mà không nói một màn hay nhiều, như "làm phần đăng ký cho app") thì đó
là câu hỏi của bước 2. Kết quả là một dòng `Loại đề` · `một màn` hay `một luồng` trong `## Quyết định` của
`brief.md`; tự xếp từ chữ trong đề thì "Ai quyết" ghi `AI đoán`.

Chữ "màn" là màn hình người dùng thấy trong app; "page" là file HTML của skill. Đề một màn ra hai page A, B; đề một
luồng ra mỗi màn một page. Gộp cả luồng vào một page, đổi màn bằng một nút vặn, thì một agent dựng tuần tự và người
xem không đi qua luồng bằng nút trong page.

### Một màn: hai phương án A và B

<!-- spec: F1.2 F1.13 F1.14 F1.19 F1.18 -->

Phương án là **một câu trả lời khác nhau cho "màn này phục vụ ai trước, lúc nào, để biết gì"**, không phải một kiểu
bày khác (timeline, lưới, biểu đồ): chọn theo kiểu bày thì hai phương án trả lời cùng một câu.

1. Liệt kê 3–5 **tình huống dùng** thật trong đề: ai, lúc nào, muốn biết hay làm gì.
2. Rút **câu hỏi chính** của từng tình huống.
3. Mỗi phương án chọn một câu hỏi làm trung tâm và khai ba thứ:
   - **câu hỏi trung tâm**: lên đầu trang, chiếm chỗ lớn nhất;
   - **đơn vị chính** người dùng nhìn vào: tuần, session, ngày, người…;
   - **cái hy sinh**: câu hỏi nào trả lời chậm đi.
4. Bảng **tình huống × phương án**, mỗi ô `nhanh` / `được` / `chậm`.
5. Ba phép thử, trượt phép nào thì xử lý ngay:

| Phép thử | Trượt khi | Xử lý |
| -------- | --------- | ----- |
| tweak | B dựng được từ A bằng một nút ở config-panel (bố cục, độ dày, grid/list, đổi loại biểu đồ trên cùng dữ liệu) | B thành tweak của A |
| thắng | phương án không `nhanh` ở tình huống nào | bỏ |
| trùng | hai phương án `nhanh` ở cùng nhóm tình huống, hay cùng hy sinh một thứ | gộp |

6. Lấy **hai** phương án `nhanh` ở hai nhóm tình huống hay gặp nhất: A là phương án thắng tình huống hay gặp nhất, B
   là phương án thắng nhóm tình huống hay gặp thứ hai. **Không hỏi người dùng chọn**, không gọi AskUserQuestion: dựng
   luôn cả hai, song song.

| Sau ba phép thử | Dựng | Chat ghi thêm |
| --------------- | ---- | ------------- |
| còn ≥ 2 phương án | A và B | còn phương án thứ ba thì một dòng `Hướng khác: C · <tên> — tiện cho <việc>. Muốn xem thì nói, sẽ dựng thay A hay B.` |
| đề xin ≥ 3 phương án | vẫn chỉ A và B | một dòng `Đề xin <n> phương án; mỗi màn tối đa hai phương án A/B để so từng cặp.` |
| đề xin một phương án | một page A: phương án thắng tình huống hay gặp nhất | một dòng `Đề xin một phương án.` |
| còn đúng 1 | một page A | một dòng `Chỉ một hướng: <lý do>`, vd "hướng kia chỉ khác bố cục, đã là nút Bố cục ở config-panel" |

Mỗi phương án được dựng có ba thứ cho người xem đọc: tên, bố cục, tiện cho. Ba thứ này hiện ở khối chờ của page, ở
khung mô tả khi đưa chuột vào nút A B trên toolbar, ở bảng `## Pages` của brief và ở khối phương án trong chat. Ở bước
4 chúng là ba cờ `--option` · `--layout` · `--good-for` của `new-design.mjs page`, chép đúng chữ đã in ra chat. Câu
hỏi trung tâm, đơn vị chính, cái hy sinh và bảng tình huống là cách agent chọn A, B; chúng nằm ở `## Tình huống` của
brief, không vào ba thứ này. Không viết "nhanh", "chậm", "hy sinh", "đơn vị chính", "câu hỏi trung tâm" vào tên, bố
cục hay tiện cho.

- **Tên** (`--option`, dạng `A · <tên>`): cụm danh từ tả cách cả page được bày: khối chiếm phần lớn trang và chỗ của
  các khối khác. Tên đủ đối tượng, để người chưa đọc brief đọc tên là biết page có gì. Tên không là chuỗi động từ,
  không viết tắt, không chỉ tả một widget.
- **Bố cục** (`--layout`): 2–3 câu tả page từ trên xuống: thứ gì trên cùng, thứ gì chiếm phần lớn trang, thứ gì nằm
  cạnh hay hiện khi bấm. Gọi khối bằng tên người xem thấy trên page ("bảng lịch hẹn", "ô tìm"), không bằng tên kiểu
  bày ("master-detail").
- **Tiện cho** (`--good-for`): 2–4 việc người dùng làm thuận tay trên page này, cách nhau ` · `. Mỗi việc là động từ
  kèm đối tượng ("lọc người không đến để gọi lại"). Lấy từ các tình huống phương án này `nhanh` trong bảng.

| Viết sai | Lỗi | Viết đúng |
| -------- | --- | --------- |
| Tìm nhanh để đánh dấu đến | chuỗi động từ; không nói tìm cái gì, "đến" là gì | Bảng lịch hẹn theo giờ, tìm và lọc ở trên |
| Ô tìm bệnh nhân ở đầu trang | chỉ tả một widget; page còn dải tổng, tải bác sĩ, bảng lịch hẹn | Bảng lịch hẹn theo giờ, tìm và lọc ở trên |
| Tập trung vào xu hướng | không nói thứ gì nằm trên page | Biểu đồ doanh thu 12 tuần, bảng tuần bên dưới |
| Lịch theo bác sĩ | chưa nói lịch bày thế nào, chi tiết ca nằm đâu | Lưới giờ × bác sĩ, chi tiết ca ở cột phải |

| Phương án | Bố cục | Tiện cho |
| --------- | ------ | -------- |
| A · Bảng lịch hẹn theo giờ, tìm và lọc ở trên | Trên cùng là dải tổng ca trong ngày và tải ba bác sĩ. Ngay dưới là ô tìm tên hay số điện thoại và nút lọc trạng thái. Phần lớn trang là bảng lịch hẹn xếp theo giờ, mỗi dòng có nút "Đã đến". | tìm lịch hẹn của bệnh nhân vừa bước vào · lọc người không đến để gọi lại · tra giờ hẹn khi khách gọi điện |
| B · Lưới giờ × bác sĩ, chi tiết ca ở cột phải | Trên cùng là dải tổng ca trong ngày. Phần lớn trang là lưới, mỗi bác sĩ một cột, mỗi 30 phút một hàng, ô trống ghi "Trống". Bấm một ca thì chi tiết hiện ở cột phải. | xem bác sĩ nào kín lịch · tìm ô trống để chen lịch |

Bố cục viết theo bản phác: bản phác đổi thì bố cục đổi theo.

**Mỗi màn tối đa hai page.** So A/B là so từng cặp; `check.mjs` báo lỗi thư mục phương án có từ ba page.

In vào chat, theo thứ tự, rồi sang bước 4 ngay:

1. dòng `Đọc:`;
2. dòng `Một màn: dựng A và B song song.` (hay `Một màn: dựng một page.`);
3. đề cải thiện một màn thì thêm khối **Đang có gì**: hiện trạng tóm tắt, chỗ đang vướng;
4. bảng tình huống × phương án;
5. mỗi phương án được dựng một khối: tên, bố cục, "Tiện cho: …", bản phác bằng chữ ≤ 10 dòng (ô, cột, thứ gì nằm trên cùng);
6. các dòng thêm của bảng trên.

Bản phác cho người dùng biết sắp thấy gì; sai hướng thì họ ngắt hay góp ý, không cần một lượt hỏi chọn.

### Một luồng: tách thành các màn

<!-- spec: F1.15 F1.16 F1.17 -->

Một luồng chỉ **một phương án**: không đi bảng tình huống × phương án, không A/B. Việc của bước này là tách luồng
thành các màn để mỗi màn thành một page, dựng song song.

1. Liệt kê các màn theo thứ tự người dùng đi. Màn nào đề đã kể tên thì giữ đúng tên và thứ tự đó.
2. Mỗi màn một dòng: tên, để làm gì, nhận gì từ màn trước, đưa gì cho màn sau, trạng thái riêng.
   - "Đưa cho màn sau" là thứ người xem gõ hay chọn ở màn này mà màn sau cần (email, gói đã chọn), viết thành key
     `form.<key>`: `form.email`, `form.plan`. Màn sau đọc đúng key đó.
   - Nhánh lỗi (email trùng, mã sai) là **trạng thái riêng** của màn đó, không là màn riêng. Luồng có nhánh rẽ thật
     (hai đường đi khác nhau) thì đi đường chính, ghi đường kia vào `## Quyết định` dòng `AI đoán`.
3. Ghi bảng này vào `## Luồng` của `brief.md` ở bước 4, cột `File` theo `NN-slug.html` mà `new-design.mjs page` in ra.

In vào chat, theo thứ tự, rồi sang bước 4 ngay, không hỏi xác nhận:

1. dòng `Đọc:`;
2. dòng `Một luồng: một phương án, <n> màn, mỗi màn một page, dựng song song.`;
3. bảng các màn (như `## Luồng`, chưa cần cột `File`).

Sai màn thì người dùng góp ý ở vòng sau.

## Bước 4 — Dựng: brief chung, mỗi page một agent con

<!-- spec: — -->

### Agent chính chuẩn bị (tuần tự)

<!-- spec: F1.2 F1.3 F1.5 F1.6 F1.8 F1.16 F1.17 F3.1 F3.4 F3.9 F3.5 F3.8 F5.11 F6.1 F6.5 F6.9 F6.14 F6.15 -->

Đề một màn: mỗi phương án một page.

```bash
D=$(node $SKILL/scripts/new-design.mjs init <slug> [--tokens <nguồn> | --getdesign <tên>] [--page-width <bề rộng ở bước 1>])
node $SKILL/scripts/new-design.mjs page "$D" <slug-a> --title "<Tên màn> · <tên A>" --option "A · <tên A>" \
  --layout "<bố cục A>" --good-for "<việc 1> · <việc 2>"
node $SKILL/scripts/new-design.mjs page "$D" <slug-b> --title "<Tên màn> · <tên B>" --option "B · <tên B>" \
  --layout "<bố cục B>" --good-for "<việc 1> · <việc 2>"
```

Đề một luồng: mỗi màn một page, tạo theo đúng thứ tự màn (thứ tự trong `pages.js` là thứ tự đi).

```bash
D=$(node $SKILL/scripts/new-design.mjs init <slug> [--tokens <nguồn> | --getdesign <tên>] [--page-width <bề rộng ở bước 1>])
node $SKILL/scripts/new-design.mjs page "$D" <slug-1> --title "<Tên luồng> · <tên màn 1>" --screen "1 · <tên màn 1>" --purpose "<để làm gì>"
node $SKILL/scripts/new-design.mjs page "$D" <slug-2> --title "<Tên luồng> · <tên màn 2>" --screen "2 · <tên màn 2>" --purpose "<để làm gì>"
```

- Một thư mục là thư mục phương án (`--option`) hay thư mục luồng (`--screen`); `new-design.mjs` từ chối trộn.
- `--title` luôn là `<tên màn> · <tên phương án>` (luồng: `<tên luồng> · <tên màn>`).
- `page` chép khuôn trống `templates/page.html` và điền khối chờ từ cờ: tên màn là phần trước ` · ` của `--title`,
  tiêu đề là `--option` hay `--screen`, phụ đề là `--layout` hay `--purpose`, dòng nhỏ là `Tiện cho: <--good-for>`.
  Khung mô tả khi đưa chuột vào nút A B hiện đúng các dòng này. Cờ nào thiếu thì dòng đó không có, nên truyền đủ cờ để
  người mở link sớm biết page này dựng gì.
- Ba cờ của phương án chép từ dòng của phương án đó trong `## Pages`, đúng chữ đã in ra chat ở bước 3. Thư mục từ 2
  page trở lên mà thiếu `--option` đúng dạng hay `--layout` thì `check.mjs` báo lỗi. Một phương án duy nhất thì bỏ được
  ba cờ này. Thư mục luồng: `--screen` là `<n> · <tên màn>` với `n` đúng thứ tự màn, `--purpose` chép từ cột "Để làm
  gì" của `## Luồng`.
- `page` tạo luôn `NN-slug.progress.js` với bước chuẩn bị, sáu bước dựng và bước giao, đều chưa xong. Không chạy lại `page` cho
  page đã có: mỗi lần chạy là một page mới.
- File trong `templates/` chỉ dùng qua `new-design.mjs page`: mở thẳng thì page vỡ vì thiếu `tokens.js`, `_shell/`.

**In link ngay sau các lệnh `page`, trước khi viết brief.** Page mở ra có khối chờ và nhãn "Đang chuẩn bị". In vào chat:

```
Mở ngay được — page tự hiện bản mới mỗi khi một bước xong, để mở là thấy:
- A · <tên>: file://<đường dẫn tuyệt đối tới page A>
- B · <tên>: file://<…>
```

Luồng thì mỗi màn một dòng `<n> · <tên màn>: file://…`. Tin giao cuối (bước 6) vẫn đợi kiểm cả thư mục sạch.

**Mở page ngay sau khi in link, nếu người dùng chọn "Mở" ở bước 2.** Chọn "Không mở", hay chạy `--auto`, thì bỏ qua.

```bash
node $SKILL/scripts/new-design.mjs open "$D"
```

Lệnh mở page đầu tiên của `pages.js` (phương án A, màn 1) trong một cửa sổ Chrome mới, một tab, bằng profile Chrome
dùng gần nhất. Không mở từng page: người xem sang page khác bằng option-switcher. Chạy lệnh đúng một lần cho cả thư
mục. Đọc chữ đầu của stdout:

| stdout | Làm gì |
| --- | --- |
| `chrome <url>` | không nói gì thêm |
| `default <url>` | nói trong chat một câu: máy không có Google Chrome, page mở bằng trình duyệt mặc định |
| `none <url>` | không nói gì thêm; link đã in là đủ |
| exit 2 | nói trong chat là không mở được trình duyệt, người dùng bấm link đã in; dựng tiếp |

`init` in đường dẫn thư mục ra stdout, in danh sách cặp màu dưới 4.5 : 1 ra stderr. Đọc danh sách đó trước khi điền
bảng "Cặp màu không đủ đọc" của brief.

`--getdesign <tên>` (tên từ đề, hay người dùng chọn ở bước 2) tải design đó vào `$D/DESIGN.md`; `tokens.js` ghi nguồn
`getdesign <tên>`. Không dùng cùng `--tokens`. Nếu `init` lỗi, thì nó không tạo thư mục nào. Exit 1 là tên design
sai: hỏi lại theo `references/getdesign.md`. Exit 2 là getdesign hỏng: dừng, in dòng lỗi vào chat, không dựng page.

`## Design system` của brief ghi `getdesign <tên> (DESIGN.md trong thư mục này)`; đọc `$D/DESIGN.md` như mọi
`DESIGN.md` khác (bề rộng trang, luật UI theo design system).

Điền `$D/brief.md` **trước khi** gọi agent con: hết mọi chỗ `<…>` (thẻ HTML thì viết trong backtick). Bốn mục đầu để người
dùng mở ra là biết đã chốt gì:

- **`## Tóm tắt đề`**: 2–4 dòng, màn gì, cho ai, để làm gì. Đề nguyên văn để ở `## Đề gốc` cuối file.
- **`## Quyết định`**: bảng `Câu hỏi` · `Chọn` · `Ai quyết`. Dòng đầu là `Loại đề` (bước 3); mỗi câu hỏi làm rõ, phương
  án được dựng và mỗi điều phải đoán là một dòng. "Ai quyết" chỉ là `người dùng`, `--auto` hay `AI đoán`.
- **`## Design system`**: nguồn token, giao diện gốc và suy ra, font thay, component vẽ theo, bề rộng trang lấy từ đâu.
  Bảng **"Cặp màu không đủ đọc"**: `init` in ra stderr các cặp màu dưới 4.5 : 1 ở cả giao diện gốc và giao diện suy ra.
  Cặp nào page sẽ dùng làm chữ (nút chính, chữ phụ, link) thì ghi một dòng, chốt một cách dùng thay lấy từ token của
  chính design system (chữ `ink` trên nền `primary`, nút chính dạng viền). Cặp chỉ dùng làm nền (cột biểu đồ, chấm
  trạng thái) thì bỏ qua. Không chốt ở đây thì mỗi agent con tự lách, nút chính mỗi page một màu, `check.mjs` báo lỗi
  cả thư mục. Đề cải thiện một màn thì thêm mục `## Màn hiện có`: khối "Đang có gì" đã in ra chat. Bảng **"Luật UI
  theo design system"** ghi luật UI nào design system làm khác (bước 1), mỗi dòng kèm dẫn chứng. Luật có dòng
  **Phục vụ** khác `—` thì cột "Giữ luật UX bằng" ghi cách page vẫn giữ luật UX đó. Không có thì ghi `Không có.`
  `check.mjs` bỏ kiểm của luật có trong bảng, và báo lỗi khi bảng ghi sai.
- **`## Pages`** (đề một màn): mỗi phương án một dòng, cả hướng không dựng (`File` là `—`, trạng thái `chưa chọn`). Bảng
  phải khớp `pages.js`; `check.mjs` bắt dòng thiếu hay thừa. Xoá mục `## Luồng`.
- **`## Luồng`** (đề một luồng): bảng các màn ở bước 3, thêm cột `File`, theo đúng thứ tự `pages.js`; `check.mjs` bắt
  dòng thiếu, thừa hay sai thứ tự. Xoá `## Pages` và `## Tình huống`. Agent con của màn nào cũng đọc cả bảng, nên
  nút sang màn kề và key `form.*` của các màn khớp nhau dù chúng dựng song song, không thấy page của nhau.

Bốn mục quyết việc so được giữa các page:

- **`## Dữ liệu chung`**: thực thể, số lượng, giá trị mẫu, quan hệ giữa các con số, ca biên. Mọi page sinh dữ liệu giả theo đúng mục này, nên đặt cạnh nhau là cùng con số.
- **`## Nút dữ liệu chung`**: bảng `key` · `type` · khoảng · `default` của mọi variable, có `state`. Mọi page khai **đúng** bộ key này trong `variables`; `check.mjs` bắt page thiếu hay thừa. Tweaks thì mỗi phương án tự khai.
  Vì mọi page khai đủ bộ key, và vặn nút nào UI cũng phải đổi, nên mỗi variable chung phải đổi thấy được ở **mọi**
  page, kể cả page của phương án đã hy sinh thứ nó điều khiển. Variable chỉ có nghĩa ở một phương án thì làm thành
  tweak của page đó.
- **`## Khối`**: bảng `Số` · `Khối` · `Có ở page`, mỗi khối chính một số. Khối giống nhau ở các page (dải tổng,
  bảng session, thanh tiến độ của luồng) mang cùng số; khối riêng của một page lấy số riêng. Agent dựng page đánh
  `data-block` đúng bảng; `check.mjs` báo page dùng số ngoài bảng.
- **`## Số kiểm chéo ở mặc định`**: 3–5 con số agent chính **tự tính** từ công thức ở giá trị mặc định. Công thức viết bằng chữ
  luôn có chỗ hai người hiểu khác nhau (session đang chạy tính cả cost hay phần đã ăn); con số cụ thể chốt cách hiểu. Agent
  con trả về các số này, agent chính so với brief trước khi giao.

**Brief điền xong thì đánh dấu bước chuẩn bị của mọi page**, trước khi gọi agent con (thư mục một page: trước bước
dựng 1):

```bash
node $SKILL/scripts/new-design.mjs progress "$D" --prepared --all
```

Lệnh soát `brief.md` và `pages.js` trước (`check.mjs --brief`). Brief còn chỗ trống hay bảng sai thì lệnh exit 1, in
từng lỗi, không đánh dấu page nào: sửa brief rồi chạy lại. Agent dựng page không được sửa brief, nên lỗi brief lọt qua
bước này thì mọi lần kiểm đầy đủ của mọi page đều báo lại nó.

Nhãn của page đang mở đổi từ "Đang chuẩn bị" sang "Đang dựng 0/6", page không tải lại. Quên lệnh này thì page đứng ở
"Đang chuẩn bị" dù đang dựng, và `progress --done`, `--doing` của agent dựng page báo lỗi. Đây là lần duy nhất agent
chính ghi vào danh sách bước của page.

### Gọi agent con

<!-- spec: F1.3 F1.5 F5.1 F5.2 F5.5 F6.6 F6.7 F6.8 -->

Mục tiêu là dựng nhanh nhất: mọi page dựng **song song**. Thư mục từ 2 page trở lên (A và B, hay các màn của luồng):
gọi **mọi agent con trong cùng một lượt** (Agent tool, `subagent_type: "general-purpose"`, chạy nền, mỗi page một lần
gọi, cùng một tin). Luồng 5 màn là 5 agent con chạy cùng lúc, không dựng màn này xong mới tới màn kia.

Thư mục một page thì agent chính tự dựng: nó đã đọc dự án, agent con mới thì phải đọc lại. Agent chính đọc hết
`references/build-page.md`, `references/ux-principles.md`, `references/ui-principles.md`, rồi dựng theo
`build-page.md` như một agent con.

Link mọi page đã in ngay sau các lệnh `page`; lúc gọi agent con không in lại.

Lời giao cho mỗi agent con chỉ có chỗ phải đọc và phần riêng của page. Mọi luật dựng page nằm ở `build-page.md`, không
chép vào lời giao:

```
Dựng page <NN-slug.html> trong thư mục design <$D>: phương án <A · tên> (hay màn <n · tên> của luồng).
Đọc hết, trước khi viết: <$SKILL>/references/build-page.md, <$SKILL>/references/ux-principles.md,
<$SKILL>/references/ui-principles.md, <$D>/brief.md.
Bố cục: <…>. Tiện cho: <…>.          (luồng: Để làm gì: <…>, theo dòng của màn trong "## Luồng")
Bản phác:
<bản phác đã in cho người dùng>
```

`<$SKILL>` và `<$D>` viết thành đường dẫn tuyệt đối.

**Agent con bị ngắt.** Nếu một agent con trả về lỗi, bị dừng, hay trả về mà `progress` của page nó còn bước chưa
xong, thì agent chính **chỉ gọi lại agent đó**, cùng lời giao như lần đầu. Các agent con khác đang chạy thì để chạy
tiếp, không dừng, không gọi lại: gọi lại cả lượt thì page đang dựng tốt bị dựng lại. Agent được gọi lại đọc danh sách
bước dựng và làm tiếp từ bước đầu tiên chưa xong. Thư mục một page mà agent chính bị ngắt thì lần sau cũng chạy
`progress` không cờ trước rồi làm tiếp.

## Bước 5 — Kiểm cả thư mục, bắt buộc

<!-- spec: F1.3 F1.13 F5.1 F5.3 F5.7 F5.8 F5.9 F6.12 -->

Mỗi page đã qua kiểm đầy đủ ở bước dựng cuối của nó (`references/build-page.md`, mục "Kiểm"). Sau khi mọi agent con
trả về, agent chính kiểm **cả thư mục** một lần nữa:

```bash
node $SKILL/scripts/check.mjs "$D" [--pw <thư mục có playwright>]
```

- Lần kiểm này thêm các phép so giữa các page: `data-block` ngoài bảng `## Khối` của `brief.md`; nút chính các page
  khác màu; thư mục phương án có từ ba page; thư mục luồng thì bảng `## Luồng` khớp `pages.js` và lượt đi luồng từ màn
  đầu tới màn cuối. Lệnh cũng báo `còn bước chưa xong` cho page dựng dở.
- Page nào không đổi từ lần kiểm đầy đủ của agent dựng nó thì lệnh dùng lại kết quả đã nhớ, không mở lại trình duyệt;
  dòng cuối ghi số page dùng lại. Sửa chữ trong brief ngoài bảng "Nút dữ liệu chung" cũng không làm page kiểm lại.
- Chưa có Playwright thì lệnh in câu cài vào thư mục tạm, chạy lại kèm `--pw`. **Không cài vào dự án.**
- So `## Số kiểm chéo ở mặc định` của brief với các số agent con trả về.
- Agent con khai `pageWidth` thì ghi bề rộng và lý do nó trả về vào `## Design system` của brief.
- Sửa tới khi **exit 0**, tối đa ba vòng. Còn lỗi sau ba vòng thì lúc giao ghi từng dòng lỗi và vì sao chưa sửa; không
  giao như thể đã sạch.
- Chép các dòng tự kiểm còn `[ ]` agent con trả về vào tin giao.
- Mọi lệnh `new-design.mjs` và `check.mjs` tự ghi một dòng vào `$D/run.log`. Khi người dùng hỏi lượt chạy chậm ở đâu,
  chạy `node $SKILL/scripts/run-log.mjs "$D"`: bảng từng page ghi mỗi bước dựng dài bao lâu, máy kiểm chiếm bao nhiêu.

## Bước 6 — Giao

<!-- spec: F1.2 F1.4 F1.6 F1.10 F1.13 F1.14 F1.19 F1.16 F3.1 F3.4 F3.9 F3.5 F3.8 F5.3 F6.10 -->

**Đánh dấu bước giao của mọi page, ngay trước tin giao**, sau khi Bước 5 đã xong:

```bash
node $SKILL/scripts/new-design.mjs progress "$D" --delivered --all
```

Từ lúc agent con xong bước kiểm đầy đủ tới lúc chạy lệnh này, nhãn của page ghi "Đang kiểm lại", vì agent chính còn
kiểm cả thư mục và sửa. Lệnh này đổi nhãn sang "✓ Xong", page không tải lại. Lệnh báo lỗi khi một page còn bước dựng
chưa xong: gọi lại agent con của page đó ("Agent con bị ngắt"), đừng giao. Quên lệnh này thì page đứng ở "Đang kiểm
lại" mãi dù đã giao.

Tin giao theo tiếng người dùng đang viết, ngắn:

1. Link `file://` của từng page vừa dựng hay vừa sửa (đường dẫn tuyệt đối), page nào là phương án nào. Đề một luồng:
   link màn 1 trước (người xem đi tiếp bằng nút trong page hay dãy màn), rồi bảng các màn kèm link từng màn.
2. `Đọc:` lấy design system ở đâu (design của getdesign thì ghi `getdesign <tên>` và ai chọn); giao diện nào suy ra; font nào thay (`window.DESIGN_THEME.fonts`
   trong `tokens.js`).
3. Nút vặn: data-panel (variables chung, preset), config-panel (tweaks của từng page).
4. Các dòng `AI đoán` và `--auto` trong `## Quyết định` của `brief.md`, mỗi dòng kèm "muốn khác thì nói". Chạy `--auto` thì mở đầu bằng "Chạy `--auto`, đã tự trả lời:" rồi liệt kê. Kèm link `brief.md`.
5. Kết quả `check.mjs` cả thư mục: số page, số tổ hợp, số lỗi.
6. Luật UI theo design system (bảng trong `## Design system` của `brief.md`), mỗi dòng kèm dẫn chứng và cách giữ luật
   UX; không có thì bỏ mục này.
7. Dòng tự kiểm còn `[ ]` agent con trả về, mỗi dòng kèm page và lý do chưa sửa.
8. Đề một màn còn hướng không dựng thì nhắc một dòng: "Còn <C · tên>, muốn xem thì nói, sẽ dựng thay A hay B." Chỉ dựng
   một page thì nhắc lại dòng `Chỉ một hướng: <lý do>` hay `Đề xin một phương án.`. Đề xin ≥ 3 phương án thì nhắc dòng "mỗi màn tối đa hai".

## Vòng sau

<!-- spec: F1.2 F1.5 F1.6 F1.8 F1.13 F1.17 F4 F4.4 F6.10 F6.14 -->

**Mỗi phương án, hay mỗi màn của luồng, đúng một page. Góp ý thì sửa thẳng page đó** tới khi người dùng thấy xong.
Agent sửa page theo `references/build-page.md` như lúc dựng; agent chính chưa đọc file đó thì đọc trước khi sửa.

Vòng góp ý không hỏi lại câu mở page trong Chrome và không chạy `new-design.mjs open`. Cửa sổ còn mở thì page tự tải
lại sau mỗi ý. Người dùng đã đóng cửa sổ thì bấm link trong tin giao.

- Góp ý đổi bố cục, khối, nút, dữ liệu, chữ → **mỗi ý một bước** trong danh sách bước dựng của page đó, rồi sửa như
  lúc dựng:
  1. `new-design.mjs progress "$D" <file> --round "<ý 1>" "<ý 2>" …`: mở vòng mới, mỗi ý thành bước `Góp ý: <ý>`, thêm
     bước `Kiểm đầy đủ` cuối vòng. Nhãn tiến độ chuyển sang "Đang sửa 0/<n>". Bước của vòng cũ giữ nguyên.
  2. Mỗi ý: sửa page, `check.mjs --quick` sạch, `progress --done <n>`. Page đang mở tự hiện bản mới sau mỗi ý.
  3. Bước `Kiểm đầy đủ`: `check.mjs` đầy đủ, rồi `--done`.
  4. `new-design.mjs touch "$D" <file> --note "<góp ý>"` để khung mô tả của nút phương án và dòng "Sửa lần cuối" ghi
     ngày sửa.
  5. Ngay trước tin giao: `new-design.mjs progress "$D" <file> --delivered` cho từng page vừa sửa (nhiều page thì
     `--delivered --all`). `--round` mở lại bước giao, nên từ lúc xong bước `Kiểm đầy đủ` tới lệnh này nhãn ghi "Đang
     kiểm lại".
  Góp ý chạm nhiều page thì mỗi page một vòng riêng trong danh sách của nó; từ hai page trở lên thì mỗi page một agent
  con, chạy song song như lúc dựng. Agent chính mở vòng (`--round`) trước khi gọi. Lời giao theo khuôn ở "Gọi agent
  con", thay hai dòng bố cục và bản phác bằng một dòng `Góp ý vòng <n>: <ý 1> · <ý 2>. Chạy progress không cờ để
  thấy bước tiếp theo.`
- Góp ý đổi dữ liệu chung hay nút dữ liệu chung → sửa `brief.md` trước, tính lại `## Số kiểm chéo ở mặc định`,
  rồi sửa **mọi** page cho khớp và chạy `check.mjs` cả thư mục: các page vẫn cùng bộ key, cùng con số.
- Muốn xem một hướng không dựng (dòng `chưa chọn` trong `## Pages`) → hỏi thay A hay B nếu người dùng chưa nói, rồi
  dựng hướng đó **đè lên page bị thay**: giữ tên file, sửa `option` · `layout` · `goodFor` của page đó
  trong `pages.js`, đổi hai dòng trong `## Pages` (hướng mới `đã dựng`, hướng bị thay `chưa chọn`), thêm một dòng vào
  `## Quyết định`. Thư mục vẫn tối đa hai page; không thêm page thứ ba.
- Luồng thêm hay bớt màn → sửa `## Luồng` trước. Màn mới: `new-design.mjs page … --screen --purpose`, rồi đặt lại thứ
  tự trong `pages.js` và số `n` của `screen` cho khớp `## Luồng`. Sửa nút `next()` · `prev()` và key `form.*` của hai
  màn kề. Chạy `check.mjs` cả thư mục để lượt đi luồng đi lại từ đầu.
- Muốn xem bản tối, khổ mobile (view-controller), bản cho role khác (config-panel): đó là nút sẵn có, không cần sửa page.
- Đừng đẻ page `-v2`, `-final` cho mỗi vòng góp ý: option-switcher thành một dãy nút bản nháp, người dùng không biết
  page nào là bản đang làm.
