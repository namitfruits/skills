# PLANS — `design-uiux`

Việc để làm skill, chia hai phần: **Plan** — việc đã viết plan ở `.plan/`, theo thứ tự viết; **Plan Queue** — việc
dự kiến, chưa viết plan, xếp theo thứ tự định làm. [SPEC.md](SPEC.md) tả skill đang làm được gì; mỗi yêu cầu trong đó
nằm ở ít nhất một plan `done` hay `approved`. Kiểm: `node scripts/spec-check.mjs skills/design-uiux`.

Mỗi việc:

```
### 005 · <tên plan>                       ← ở Plan Queue là `### PQ-NN · <tên>`

- **Plan:** [005-<slug>.md](../../.plan/005-<slug>.md)   ← chỉ ở Plan
- **Status:** approved
- **Mục tiêu:** <vì sao làm, xong thì thấy được gì>

| Mã     | Thay đổi | Tóm tắt   |
| ------ | -------- | --------- |
| `F1.4` | update   | <vài chữ> |
```

**Status:** Plan Queue luôn `new`. Plan `draft` → `approved` → `done` (gate nghiệm thu của plan đã tick). Viết plan
cho một việc trong Plan Queue thì chuyển mục sang Plan với số plan, thêm dòng **Plan:**; ID `PQ-NN` bỏ theo, không
dùng lại.

**Mục tiêu** đủ để người chưa theo dõi đọc là hiểu việc, không phải lật plan hay lịch sử chat.

**Mã** là sub-scope hay scope trong SPEC mà việc đó chạm tới. Việc không đổi yêu cầu nào (chỉ soát, chỉ nghiệm thu)
thì không có bảng, **Mục tiêu** nói rõ điều đó.

| Thay đổi | Nghĩa |
| -------- | ----- |
| `new`    | yêu cầu chưa có, làm lần đầu. Việc chưa `done` được ghi mã SPEC chưa có |
| `update` | chữ của yêu cầu trong SPEC đổi, cái đã làm không còn đúng; sửa cho khớp chữ mới |
| `remove` | yêu cầu bị bỏ khỏi SPEC; gỡ phần đã làm |
| `fix`    | chữ yêu cầu giữ nguyên; SKILL.md hay code làm chưa đúng, sửa cho đúng |

## Plan

### 001 · Prototype HTML nhiều page, vặn được dữ liệu và cấu hình

- **Plan:** [001-design-uiux.md](../../.plan/001-design-uiux.md)
- **Status:** approved
- **Mục tiêu:** từ một đề ra thư mục prototype HTML mở bằng `file://`; mỗi page vặn được dữ liệu và cấu hình trên
  panel, đổi khổ màn và sáng tối, link mở lại đúng giá trị; màu chữ lấy từ design system; máy kiểm mọi tổ hợp nút.
  Commit `670ae63`.

| Mã     | Thay đổi | Tóm tắt |
| ------ | -------- | ------- |
| `F1.2` | new      | chọn phương án ở page Options |
| `F1.8` | new      | mỗi phương án một page |
| `F1.3` | new      | các phương án dựng trên cùng dữ liệu |
| `F2.1` | new      | data-panel: variables, preset |
| `F2.2` | new      | config-panel: tweaks |
| `F2.3` | new      | view-controller: khổ màn, sáng tối |
| `F2.4` | new      | menu chuyển giữa các page |
| `F2.5` | new      | mọi giá trị nằm trên URL |
| `F3.1` | new      | token từ `DESIGN.md` hay CSS `@theme` |
| `F3.5` | new      | giao diện thiếu thì suy ra, ghi "(suy ra)" |
| `F3.2` | new      | bấm được trên dữ liệu giả |
| `F3.3` | new      | `state` đủ data · loading · empty · error |
| `F4.1` | new      | góp ý sửa thẳng page |
| `F4.2` | new      | nút phương án ghi ngày sửa và góp ý cuối |
| `F5.1` | new      | `check.mjs` chạy các tổ hợp tweak × sáng tối × `state` |
| `F5.4` | new      | `check.mjs` bấm từng loại cú bấm |

### 002 · Hỏi khi đề mơ hồ, chọn phương án ngay trong chat, dựng song song

- **Plan:** [002-design-uiux-improve.md](../../.plan/002-design-uiux-improve.md)
- **Status:** approved
- **Mục tiêu:** đề mơ hồ thì hỏi bằng câu có sẵn đáp án; người dùng chọn 2–3 phương án ngay trong chat, mỗi phương án
  một agent con dựng song song trên cùng bộ dữ liệu; `--auto` tự chọn thay. Commit `670ae63`.

| Mã     | Thay đổi | Tóm tắt |
| ------ | -------- | ------- |
| `F1.1` | new      | đề mơ hồ thì hỏi bằng câu có sẵn đáp án |
| `F1.7` | new      | không hỏi thứ đọc được từ dự án |
| `F1.2` | update   | chọn phương án ngay trong chat, thay page Options |
| `F1.3` | update   | thêm cùng nút dữ liệu (bảng "Nút dữ liệu chung" trong `brief.md`) |
| `F1.4` | new      | `--auto` |
| `F1.10` | new     | `--auto` kể lại lựa chọn lúc giao |
| `F1.5` | new      | mỗi phương án một agent con, dựng song song |
| `F1.6` | new      | `brief.md` ghi quyết định kèm ai quyết |
| `F2.4` | update   | nút A B C, rê vào thấy mô tả phương án |
| `F4.2` | update   | khung mô tả nút phương án ghi ngày sửa |

### 003 · Nguyên tắc và giới hạn thiết kế, phần đo được kiểm bằng code

- **Plan:** [003-design-uiux-principles.md](../../.plan/003-design-uiux-principles.md)
- **Status:** approved
- **Mục tiêu:** page theo một bộ nguyên tắc và giới hạn thiết kế; phần đo được do máy kiểm, phần còn lại agent soát
  trên ảnh; lỗi chưa sửa thì kể ra lúc giao. Commit `670ae63`.

| Mã     | Thay đổi | Tóm tắt |
| ------ | -------- | ------- |
| `F5.2` | new      | `principles.md`, `principles-check.mjs` |
| `F5.5` | new      | khối Tự kiểm, agent soát trên ảnh |
| `F3.4` | new      | giới hạn nhường cho design system, kèm dẫn chứng |
| `F5.3` | new      | lỗi chưa sửa kể ra lúc giao |

### 005 · Giữ SKILL.md theo đúng SPEC, nghiệm thu từng yêu cầu

- **Plan:** [005-design-uiux-spec-skill-dong-bo.md](../../.plan/005-design-uiux-spec-skill-dong-bo.md)
- **Status:** done
- **Mục tiêu:** sửa thiết kế mà quên sửa SKILL.md thì agent không làm theo, vì nó chỉ đọc SKILL.md; 25 lần chạy thử
  trước đó không lần nào nói được yêu cầu nào đạt. Xong thì SPEC có yêu cầu đánh mã, mục SKILL.md nào cũng gắn mã nó
  thực thi, một lệnh soát hai chiều; bốn kịch bản chạy thử `--auto` ra bảng đạt / trượt từng yêu cầu. Ghi vào SPEC hai yêu
  cầu đã có trong commit `670ae63` mà chưa plan nào ghi.

| Mã     | Thay đổi | Tóm tắt |
| ------ | -------- | ------- |
| `F1.3` | update   | thêm "cùng bề rộng trang" |
| `F1.9` | new      | khai bề rộng riêng khi cần rộng hơn |
| `F2.5` | fix      | SKILL.md nói mọi giá trị đang xem nằm trên URL |
| `F4.3` | new      | đổi dữ liệu chung thì mọi page đổi theo, tính lại số kiểm chéo |
| `F5.1` | update   | chữ yêu cầu đúng phạm vi `check.mjs` chạy thật |

### 006 · Sửa các lỗi nghiệm thu 005 làm hỏng đầu ra mà máy kiểm báo sạch

- **Plan:** [006-design-uiux-sua-loi-nghiem-thu-005.md](../../.plan/006-design-uiux-sua-loi-nghiem-thu-005.md)
- **Status:** done
- **Mục tiêu:** nghiệm thu 005 đạt mọi yêu cầu, nhưng 5 chỗ làm đầu ra sai mà không ai hay: lệnh `grep` ở Bước 1 hỏng
  trong zsh (3/4 lần chạy) nên agent tưởng dự án không có design system; `check.mjs` báo sạch khi `x-show` đi cùng
  `:style` chuỗi vẽ sai, và không bấm tới nút chỉ hiện ở giá trị khác mặc định; các page dựng song song lệch số `data-block`
  và lệch màu nút chính; không có codebase thì bỏ qua bề rộng `DESIGN.md` ghi. Xong thì mỗi chỗ có một phép thử tái
  hiện được lỗi trước khi sửa và qua sau khi sửa; chạy lại K1–K3 của 005 không còn ghi 5 chỗ đó. Lấy từ `PQ-02`; 7
  chỗ còn lại sang `PQ-03`.

| Mã     | Thay đổi | Tóm tắt |
| ------ | -------- | ------- |
| `F1.3` | update   | thêm bảng số khối và cách xử lý cặp màu không đủ đọc chung; không codebase thì lấy bề rộng từ design system |
| `F3.1` | fix      | lệnh `grep --include` có nháy, chạy được trong zsh |
| `F5.1` | fix      | so page vặn tại chỗ với page mở lại từ link |
| `F5.4` | fix      | lượt bấm tới nút chỉ hiện ở giá trị khác mặc định |

### 007 · Bài mẫu đạt chuẩn để chạy thử skill

- **Plan:** [007-design-uiux-bai-mau-dat-chuan.md](../../.plan/007-design-uiux-bai-mau-dat-chuan.md)
- **Status:** approved
- **Mục tiêu:** skill có ba bài mẫu trong `samples/` để chạy thử sau mỗi lần sửa, nhưng chưa bài nào được chạy và
  không ai biết chúng có bắt được lỗi không; bốn kịch bản của 005 từng báo đạt hết trong khi còn 5 lỗi. Xong thì một
  lệnh soát báo yêu cầu SPEC nào chưa bài nào nhìn tới; mỗi dòng checklist chỉ ra file và điều đếm được; chạy lặp cùng
  bản skill ra cùng kết luận; mỗi bài trượt đúng dòng khi gài một lỗi đã biết vào bản chép của skill; mỗi lượt chạy
  thành một dòng trong `samples/history.md`. Không đổi yêu cầu nào trong SPEC.

### 008 · Đề một màn ra A/B, đề một luồng ra từng màn

- **Plan:** [008-design-uiux-mot-man-luong.md](../../.plan/008-design-uiux-mot-man-luong.md)
- **Status:** approved
- **Mục tiêu:** đề nào skill cũng tìm 2–3 phương án rồi hỏi tick, người dùng phải đọc bảng và chọn trước khi có gì để
  xem; đề là một luồng nhiều màn cũng bị tìm phương án cho cả luồng, không tách thành từng màn, mỗi agent con tự quyết
  gộp màn hay không. Xong thì skill xếp đề là một màn (làm việc trên đúng một màn hình) hay một luồng (đi qua nhiều
  màn hình); một màn ra tối đa hai page A và B dựng cùng lúc, không hỏi; một luồng ra một phương án, bảng các màn in
  trong chat, mỗi màn một page, đi qua được bằng nút trong page, chữ đã nhập còn khi quay lại. Chạy song song với 009.

| Mã      | Thay đổi | Tóm tắt |
| ------- | -------- | ------- |
| `F1.11` | new      | xếp đề là một màn hay một luồng |
| `F1.12` | new      | chưa xếp được thì hỏi |
| `F1.2`  | update   | đề một màn: dựng A và B, không hỏi chọn |
| `F1.13` | new      | đề xin hơn hai phương án thì vẫn A/B, nói lý do |
| `F1.14` | new      | còn một hướng thì một page, nói lý do |
| `F1.15` | new      | đề một luồng: một phương án |
| `F1.16` | new      | in bảng các màn của luồng trước khi dựng |
| `F1.17` | new      | mỗi màn của luồng một page |
| `F1.4`  | update   | `--auto` chỉ còn thay lượt hỏi làm rõ |
| `F1.5`  | update   | từ hai page trở lên thì mỗi page một agent con |
| `F2.4`  | update   | nút A B, bỏ C |
| `F2.6`  | new      | chuyển màn bằng dãy màn và nút trong page |
| `F2.7`  | new      | chữ đã nhập giữ nguyên khi chuyển màn |
| `F5.8`  | new      | máy kiểm đi hết luồng bằng nút trong page |

### 009 · Tiến độ dựng hiện liên tục trên page

- **Plan:** [009-design-uiux-tien-do-dung.md](../../.plan/009-design-uiux-tien-do-dung.md)
- **Status:** approved
- **Mục tiêu:** lần chạy ngày 2026-10-07 (màn đăng nhập, hai phương án) mất 13 phút, và suốt 13 phút đó người dùng
  không có gì để xem. Mỗi agent con đọc và nghĩ 3–5 phút, rồi ghi cả page một lần. Agent chính chỉ đưa link khi mọi
  page đã xong và kiểm sạch. Nếu agent con bị ngắt giữa chừng, thì lần gọi lại phải dựng lại cả page. Xong plan thì
  có ba thứ:
  - **Checklist từng page.** Mỗi page có một danh sách bước dựng riêng: một màn của luồng, hoặc một phương án A/B của
    đề một màn. Agent con đánh dấu từng bước khi xong. Khi agent con bị ngắt rồi được gọi lại, nó đọc danh sách này
    và làm tiếp từ bước đầu tiên chưa xong.
  - **Tiến độ trên page.** Link từng page có trong chat trước khi page có khối đầu tiên. Khi một bước dựng hay một
    bước sửa theo góp ý xong, page đang mở tự tải lại và giữ giá trị đang vặn, vị trí cuộn. Nếu người xem đang gõ
    trong ô nhập, thì page đợi người xem rời ô mới tải lại. Toolbar cho biết page đang dựng (kèm số bước đã xong),
    đang sửa hay đã xong.
  - **Các page dựng song song.** Đề một màn ra hai page A và B, dựng cùng lúc. Đề một luồng ra mỗi màn một page, các
    page dựng cùng lúc. Việc mỗi page một agent con có sẵn từ 008 (`F1.5`). 009 giữ nguyên điều đó: checklist và tiến
    độ là của riêng từng page, không page nào phải chờ page khác.

  Việc lấy từ `PQ-01`. Đầu vào là plan 004 đã huỷ. Plan chạy song song với 008.

| Mã     | Thay đổi | Tóm tắt |
| ------ | -------- | ------- |
| `F4.4` | new      | mỗi ý góp ý thành một bước dựng mới |
| `F5.6` | new      | kiểm nhanh trước khi đánh dấu bước dựng |
| `F5.7` | new      | máy kiểm báo page còn bước dựng dở |
| `F6.1` | new      | link page có trong chat trước khối đầu tiên |
| `F6.2` | new      | dựng theo danh sách bước dựng, đánh dấu từng bước |
| `F6.3` | new      | bước xong thì page đang mở tự tải lại, giữ giá trị và vị trí cuộn |
| `F6.4` | new      | đang gõ trong ô nhập thì đợi rời ô mới tải lại |
| `F6.5` | new      | toolbar nói đang dựng, đang sửa hay đã xong |
| `F6.6` | new      | bị ngắt thì làm tiếp từ bước dựng đầu tiên chưa xong |
| `F6.7` | new      | một agent con bị ngắt thì chỉ gọi lại agent đó |

### 010 · Không có design system thì chọn một bộ từ getdesign

- **Plan:** [010-design-uiux-chon-design-getdesign.md](../../.plan/010-design-uiux-chon-design-getdesign.md)
- **Status:** approved
- **Mục tiêu:** khi đề không chỉ định design system và thư mục làm việc không có file CSS có `@theme` hay `DESIGN.md`,
  skill dựng page bằng `shell/default-design.md`. Bộ này nền trung tính, một màu nhấn xanh, nên mọi prototype không có
  design system trông giống nhau; bốn lần chạy bài mẫu 02 đều ra bộ đó. Khi đề tự ghi lệnh `getdesign`, skill tải
  file ra ngoài `.design/`. Xong thì trong trường hợp không có design system, agent làm bốn việc:
  - In vào chat danh sách design của getdesign mà skill đọc được: 68 trên 76 bộ của gói `getdesign`. 8 bộ còn lại chỉ
    có phần chữ, không có bảng màu đầu file. Các design khác trên site không tải được.
  - Hỏi người dùng chọn một trong bốn design hợp đề nhất. Người dùng gõ được tên khác trong danh sách. Không có đáp
    án bộ mặc định.
  - Tải design đã chọn vào thư mục design và dựng page theo nó. Đề tự ghi lệnh `getdesign` cũng đi đường này.
  - Nếu getdesign báo lỗi, thì dừng và in lỗi vào chat, không lùi về bộ mặc định: máy chạy skill luôn có mạng.

  Với `--auto`, agent lấy đáp án khuyên dùng. Việc lấy từ `PQ-05`.

| Mã     | Thay đổi | Tóm tắt |
| ------ | -------- | ------- |
| `F3.6` | new      | không có design system thì in danh sách design của getdesign |
| `F3.7` | new      | hỏi chọn một trong bốn design hợp đề |
| `F3.8` | new      | page lấy token từ design đã chọn, tải vào thư mục design |
| `F3.1` | fix      | đề ghi lệnh getdesign thì tải vào thư mục design, không ra `./DESIGN.md` |

## Plan Queue

### PQ-03 · Sửa 7 chỗ SKILL.md mơ hồ còn lại, tìm được khi nghiệm thu 005

- **Status:** new
- **Mục tiêu:** nghiệm thu 005 gom 12 chỗ SKILL.md mơ hồ hay sai; plan 006 sửa 5 chỗ làm đầu ra sai mà máy kiểm vẫn
  báo sạch. 7 chỗ còn lại không làm hỏng page nhưng mỗi agent hiểu một kiểu: tin giao và brief khác nhau giữa các lần
  chạy, vòng góp ý thiếu bước. Xong thì chạy lại bốn kịch bản của 005, các agent không còn ghi những chỗ trong bảng
  dưới vào danh sách vấn đề. Đầu vào: `ket-qua.md` và `K*/van-de.md` trong `.test/design-uiux/028-nghiem-thu-005/` và
  `029-nghiem-thu-005-k4/` (chỉ có trên máy đã chạy).

| Mã     | Thay đổi | Tóm tắt |
| ------ | -------- | ------- |
| `F1.1` | fix      | khuôn `brief.md` có chỗ cho `## Màn hiện có` |
| `F1.2` | fix      | cách chọn "phương án thắng tình huống hay gặp nhất" khi không có số liệu tần suất |
| `F1.3` | fix      | lời giao nói tiếng trả về, chỗ để ảnh tự chụp, số kiểm chéo |
| `F1.4` | fix      | `--auto` có in câu hỏi đã soạn ra chat không; "mở đầu bằng" ở Bước 6 chỉ một nghĩa; dòng `Đọc:` in một lần |
| `F1.6` | fix      | cột Trạng thái của `## Pages` có giá trị cho lúc đang dựng (plan 009 thêm trạng thái dựng ở `progress.js`, chưa đụng bảng này) |
| `F4.3` | fix      | giới hạn 3–5 số kiểm chéo khi góp ý thêm số mới |
| `F4`   | fix      | vòng sau nói rõ kiểm page hay cả thư mục, ai sửa page khi đổi dữ liệu chung, có `touch` không, có ghi `## Quyết định` không, giao lại những gì; page không có thứ góp ý dữ liệu chung nhắc tới thì làm sao; `touch` giữ mọi góp ý; xoá ảnh cũ trong `shots/` |
| `F5.1` | fix      | `check.mjs` không đọc "PR #482" thành mã màu |
| `F5.4` | fix      | `check.mjs` có lượt không chụp ảnh `--bam-*` nào cho một page có nút bấm (bài mẫu 02, lượt `036` của plan 007) |

### PQ-04 · Các page cùng thư mục giống nhau ở khối dùng chung

- **Status:** new
- **Mục tiêu:** sau plan 006, các page dựng song song đã cùng số khối và cùng màu nút chính. Nhưng nghiệm thu
  (`.test/design-uiux/032-nghiem-thu-006/ket-qua.md`) cho thấy ba lỗ còn lại:
  - Cùng một số khối mà mỗi page dựng một kiểu (tiêu đề, nút, dòng phụ khác nhau), nên cả ba kịch bản để `[ ] N6`.
  - Cặp màu không có trong danh sách `init` in ra thì agent con vẫn tự chọn, và hai page chọn khác nhau.
  - `check.mjs` chạy lâu gấp đôi (K1 từ 96 giây lên 186 giây), vì mỗi giá trị vặn đều mở thêm một page.

  Xong thì người xem so các phương án chỉ thấy khác ở hướng thiết kế, và máy kiểm không chậm hơn trước plan 006.

| Mã     | Thay đổi | Tóm tắt |
| ------ | -------- | ------- |
| `F1.3` | fix      | khối dùng chung giống nhau giữa các page; cặp màu ngoài danh sách `init` cũng chốt chung |
| `F5.1` | fix      | phép so page vặn tại chỗ với page mở lại không làm `check.mjs` chậm gấp đôi |
