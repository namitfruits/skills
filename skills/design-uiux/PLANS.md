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

## Plan Queue

### PQ-01 · Xem được page trong lúc dựng

- **Status:** new
- **Mục tiêu:** lần chạy ngày 2026-10-07 (thiết kế lại màn đăng nhập, hai phương án) mất 13 phút; mỗi agent con dựng
  một page ~9,5 phút, 3–5 phút đầu chỉ đọc và nghĩ, rồi ghi cả page một lần. Suốt lúc đó người dùng không có gì để
  xem, thấy sai hướng cũng không ngắt sớm được. Xong thì link từng page có ngay khi agent con bắt đầu, bản xem được
  đầu tiên hiện trong vài phút, toolbar nói page đang dựng, đang sửa theo góp ý hay đã xong, agent con bị ngắt thì
  làm tiếp từ bước dở. Đầu vào: plan 004 đã huỷ (§1–§3) và bản diff Phase 1 của nó ở
  `.test/design-uiux/027-huy-004/` (chỉ có trên máy đã chạy).

| Mã   | Thay đổi | Tóm tắt |
| ---- | -------- | ------- |
| `F6` | new      | xem page trong lúc dựng: link sớm, toolbar nói tiến độ, làm tiếp khi bị ngắt |
| `F4` | update   | vòng góp ý cũng hiện tiến độ sửa trên toolbar |

### PQ-02 · Sửa 12 chỗ SKILL.md mơ hồ hay sai, tìm được khi nghiệm thu 005

- **Status:** new
- **Mục tiêu:** mọi yêu cầu đạt, nhưng ở cùng một chỗ SKILL.md mỗi agent chạy lách một kiểu: các page trong cùng thư
  mục lệch nhau (nút chính, số khối), một lệnh hỏng trong zsh làm agent tưởng dự án không có design system. Xong thì
  chạy lại bốn kịch bản của 005, các agent không còn ghi những chỗ trong bảng dưới vào danh sách vấn đề. Đầu vào:
  `ket-qua.md` và `K*/van-de.md` trong `.test/design-uiux/028-nghiem-thu-005/` và `029-nghiem-thu-005-k4/` (chỉ có
  trên máy đã chạy).

| Mã     | Thay đổi | Tóm tắt |
| ------ | -------- | ------- |
| `F1.1` | fix      | khuôn `brief.md` có chỗ cho `## Màn hiện có` |
| `F1.2` | fix      | cách chọn "phương án thắng tình huống hay gặp nhất" khi không có số liệu tần suất |
| `F1.3` | fix      | chốt số `data-block` chung trước khi dựng song song; variable chung phải đổi thấy được ở mọi page; không có codebase thì lấy bề rộng từ `DESIGN.md`; lời giao nói tiếng trả về, chỗ để ảnh tự chụp, số kiểm chéo |
| `F1.4` | fix      | `--auto` có in câu hỏi đã soạn ra chat không; "mở đầu bằng" ở Bước 6 chỉ một nghĩa; dòng `Đọc:` in một lần |
| `F3.1` | fix      | lệnh `grep --include` có nháy, chạy được trong zsh; cặp màu trượt `N13` do agent chính chốt một cách cho cả thư mục |
| `F1.6` | fix      | cột Trạng thái của `## Pages` có giá trị cho lúc đang dựng |
| `F4.3` | fix      | giới hạn 3–5 số kiểm chéo khi góp ý thêm số mới |
| `F4`   | fix      | vòng sau nói rõ kiểm page hay cả thư mục, ai sửa page khi đổi dữ liệu chung, có `touch` không, có ghi `## Quyết định` không, giao lại những gì; page không có thứ góp ý dữ liệu chung nhắc tới thì làm sao; `touch` giữ mọi góp ý; xoá ảnh cũ trong `shots/` |
| `F5.1` | fix      | `check.mjs` không đọc "PR #482" thành mã màu; lượt bấm phủ khung chỉ hiện ở giá trị khác mặc định; bắt `x-show` trong `x-for` hỏng |
