---
name: write-plan
description: Viết doc kế hoạch triển khai (plan doc) cho một feature — trình bày trong chat trước, chốt ID công việc, dựng file theo skeleton "Vấn đề" → "Sau plan này có gì" → phase (Goal · Actions · Gate) với ký hiệu 🤖/👤, rồi tick tới đâu làm tới đó. Dùng khi user nói "lập kế hoạch", "viết plan cho X", "lưu lại plan", "tạo doc plan", "thiết kế X trước khi code", hoặc khi một yêu cầu đủ lớn để cần plan trước khi sửa code. Tự đọc convention của project (CLAUDE.md / AGENTS.md / thư mục docs) rồi viết theo convention đó.
---

# Viết doc plan

## Mental model

Plan doc là **nơi quyết định thiết kế sống trong lúc còn có thể đổi**. Spec đã chốt của project (gọi
chung là **doc nguồn**: PRD, kiến trúc, backlog…) chỉ nhận thay đổi **sau khi plan được duyệt** — ghi
sớm thì mỗi lần đổi hướng là viết lại doc nguồn một lượt, và doc nguồn biến thành nơi lưu quá trình
tranh luận.

```
bàn trong chat → plan doc (draft) → 👤 duyệt → phase 0 ghi doc nguồn → implement, tick tới đâu xong tới đó
```

Ngoại lệ **duy nhất** được chạm doc nguồn trước khi duyệt: **thêm ID công việc mới** vào backlog — không
có ID thì plan mồ côi, không ai biết nó thuộc việc gì.

## Bước 0 — đọc đấu nối của project (làm trước mọi thứ)

Skill này **không giả định** cấu trúc doc của project. Lấy các giá trị dưới theo thứ tự ưu tiên:

1. **`CLAUDE.md` / `AGENTS.md`** của project — mục nói về doc/plan. Đây là nguồn ưu tiên nhất.
2. **Thư mục docs sẵn có** — `ls` ra, mở **plan gần nhất** làm mẫu, copy convention của nó (front
   matter, cách đánh số, cách chia phase).
3. **Hỏi user** nếu hai đường trên không trả lời được, hoặc dùng default ở cột phải.

| Cần biết                                            | Default nếu project không quy định                                           |
| --------------------------------------------------- | ---------------------------------------------------------------------------- |
| Thư mục + cách đặt tên doc plan                     | `docs/plans/NNN-slug.md`, slug lowercase-kebab, `NNN` = số kế tiếp           |
| Front matter bắt buộc                               | `title` · `status` · `updated` · `implements`                                |
| **Doc nguồn** nào phải ghi ở phase 0                | không có ⇒ phase 0 rút còn "chốt scope + gate duyệt"                         |
| **Hệ ID công việc** (backlog/issue/ticket)          | không có ⇒ bỏ bước ID, plan tự mô tả scope                                   |
| Lệnh kiểm để đưa vào checklist                      | `npm test` · `npm run build`; đọc `package.json`/`Makefile` để lấy đúng lệnh |
| Doc design/UI phải tuân theo                        | không có ⇒ bỏ                                                                |
| Việc kèm theo khi deploy (bump version, migration…) | không có ⇒ bỏ                                                                |

Ghi lại các giá trị này trong đầu rồi mới viết — **không** copy nguyên skeleton dưới nếu project đã có
convention khác.

## Quy trình — 10 luật

> Đánh số ổn định: doc cũ trích `luật 2`, `luật 10`… là trỏ tới danh sách này.

1. **Không tự lưu plan khi chưa được yêu cầu** — trình bày plan trong chat để review; user nói "lưu lại
   plan" mới ghi file.
2. **Plan phải được duyệt trước khi ghi vào doc nguồn.** Đang thiết kế thì quyết định nằm **trong plan
   doc**. Plan có **phase 0 = "ghi doc nguồn"**, gate của nó là `👤 plan được duyệt`. Ngoại lệ duy
   nhất: thêm **ID công việc mới** (luật 3).
3. Chốt các **ID công việc** plan này phủ. Chưa có ID ⇒ dừng, thêm vào backlog trước.
4. Tạo file theo convention đã đọc ở bước 0, front matter `type: plan` + `implements: [...]`.
5. Hai section mở đầu body, **đúng thứ tự này**:
   - **"Vấn đề"** (bắt buộc, đứng trước): 2–4 dòng — ai đang đau vì cái gì, hiện tại phải xoay xở thế
     nào, hỏng ở đâu. Kể **hiện trạng**, chưa nói giải pháp. Có số đo/ví dụ thật thì đưa vào ("build
     40′", "mỗi tuần 3 lần phải sửa tay") — người đọc phải thấy _vì sao đáng làm_ trước khi thấy _làm
     gì_.
   - **"Sau plan này có gì"** (bắt buộc): 3–5 bullet mô tả **kết quả dùng được**, góc nhìn người
     dùng/dev: chạy được lệnh nào, mở được trang nào, gọi được endpoint nào, thấy gì trên UI. Viết cái
     _có_, không viết cái _làm_ — "chạy `npx foo` lên được server ở :4000" thay vì "implement HTTP
     server". Kèm 1 dòng **ngoài scope** nếu dễ bị hiểu lầm là có.
6. Ngay trên phần Phase: dòng **ký hiệu** `🤖` = agent tự kiểm được (chạy lệnh, test, grep) · `👤` = cần
   người kiểm (số đo thật, hạ tầng, UI, quyết định) — đặt sát checklist mà nó chú giải, không để ở đầu doc.
7. Chia **phase**, mỗi phase gồm đúng 3 phần:
   - **Goal** — 1 dòng: sau phase này _dùng được_ cái gì (cùng giọng với "Sau plan này có gì").
   - **Actions** — checklist việc phải làm: file/hàm cụ thể, test, doc.
   - **Gate** — checklist **bằng chứng** phase xong: lệnh xanh, số đo, người xác nhận. Chưa tick đủ Gate
     thì không sang phase sau.

   Mọi item ở Actions và Gate đều gắn `🤖` hoặc `👤`.

8. Item phải **kiểm được** (`npm pack` → tarball < 2MB), không phải "đã làm xong X".
9. Backlog: thêm link tới plan mới ở nhóm ID tương ứng — plan và backlog trỏ được về nhau hai chiều.
10. **Khi thực thi: làm tới đâu tick checklist tới đó** — xong item nào sửa `[ ]` → `[x]` **ngay trong
    cùng lần làm việc**, không dồn tick cuối phase, không báo "xong" khi file plan còn `[ ]`. Item `👤`
    chưa có người xác nhận thì để nguyên `[ ]` và nói rõ đang chờ ai kiểm cái gì.

## Skeleton

Thay `<…>` bằng giá trị lấy ở bước 0. Bỏ hẳn phần nào project không có (doc nguồn, ID, design doc).
Heading `##` **không đánh số** — thêm/bớt section không phải sửa số. `---` chia phần người duyệt cần đọc
(Vấn đề + Sau plan này có gì) với phần chi tiết cho người làm.

````markdown
---
doc: NNN # doc · version · sources: chỉ khi project dùng
type: plan
title: <tiêu đề> (<ID1>, <ID2>)
status: draft
version: 0.1
updated: YYYY-MM-DD
implements: [ID1, ID2]
sources: [<doc nguồn>]
---

# <Tiêu đề>

## Vấn đề

2–4 dòng hiện trạng đang đau (luật 5): ai đau, đau vì gì, số đo thật nếu có. Chưa nói giải pháp.

## Sau plan này có gì

3–5 bullet **kết quả dùng được** (luật 5).

**Ngoài scope:** <1 dòng, nếu dễ bị hiểu lầm là có>

---

## Mental model

Hệ thống chạy thế nào sau khi có, nối lại với "Vấn đề" ở trên. Sơ đồ = ```mermaid, không ASCII art.

## Cơ chế / Contract / Quyết định

Bảng · bullet · schema · endpoint. Quyết định + lý do = 1 dòng. Hai phương án ⇒ bảng 2 cột.
Số đo thật ghi kèm điều kiện đo (version, ngày, cách đo).

## Phase

**Ký hiệu:** 🤖 = agent tự kiểm được (chạy lệnh, test, grep) · 👤 = cần người kiểm (số đo thật, UI, hạ tầng).

### Phase 0 — ghi doc nguồn

**Goal:** doc nguồn khớp thiết kế đã duyệt; backlog trỏ về plan này.

**Actions** — chỉ làm sau khi item đầu được tick (luật 2):

- [ ] 👤 plan này được duyệt
- [ ] 🤖 <doc yêu cầu §x>: <câu cụ thể thêm vào>
- [ ] 🤖 <doc kiến trúc §y>: <contract/entity/service cụ thể>
- [ ] 🤖 <backlog>: row `ID1` · `ID2` + link doc này

**Gate:**

- [ ] 🤖 grep `<câu/contract vừa thêm>` ra trong <doc nguồn> · backlog có link doc này

### Phase 1 — <cái dùng được trước> (ID1)

**Goal:** <1 dòng — cái dùng được sau phase này, vd "chạy `npx foo` lên server ở :4000">

**Actions:**

- [ ] 🤖 <file/hàm cụ thể>: <hành vi>
- [ ] 🤖 Test <tên file>: <ca số một — ca mà nếu sai thì cả feature vô nghĩa>

**Gate:**

- [ ] 🤖 `<lệnh test>` xanh · `<lệnh typecheck/build>` xanh
- [ ] 👤 <số đo thật / xem trên UI / deploy>

### Phase 2 — … (ID2)

## Rủi ro / Bẫy

| Bẫy              | Chặn bằng          |
| ---------------- | ------------------ |
| <sai lầm dễ mắc> | <gate/test cụ thể> |
````

## Luật viết

**Chia phase theo _cái gì dùng được trước_, không theo tầng** (không "phase 1 = toàn bộ backend"). Phase
trước không được phụ thuộc phase sau.

**Item phải kiểm được**, không phải "đã làm xong X":

| ✅                                                                       | ❌                    |
| ------------------------------------------------------------------------ | --------------------- |
| `npm pack` → tarball < 2MB                                               | đóng gói xong         |
| Test dedupe: 3 lượt trong 5′ ⇒ **1 row**; lượt thứ 4 sau 16′ ⇒ **2 row** | có test cho dedupe    |
| `git diff --stat` chứng minh `lease.ts` không đổi dòng nào               | không ảnh hưởng lease |

**Văn phong** — plan được dài hơn spec, nhưng cùng luật:

- **Không narrative**: câu khẳng định trạng thái, không kể quá trình ("endpoint trả 409 khi trùng key",
  không "đầu tiên ta kiểm tra key, sau đó nếu trùng thì...").
- **Ngắn gọn nhưng đọc là hiểu ngay** — cắt chữ đệm, không cắt thông tin. Viết đủ tên thật: tên file,
  tên hàm, tên field, tên lệnh. Không viết tắt tự nghĩ ra, không rút gọn tới mức người đọc phải đoán
  ("`POST /orders` trả 409" thay vì "trả lỗi", thay vì "409" trơ trọi).
- Ưu tiên bảng · bullet · mermaid hơn đoạn văn. Một ý một dòng.
- Đổi quyết định giữa chừng: **một dòng** `**Đổi (YYYY-MM-DD):** <cái mới> — <lý do ngắn>` ngay tại chỗ,
  không viết lại lịch sử tranh luận.
- Không section changelog — git history là changelog. Chỉ bump `version` + `updated`.

**Chạm UI / deploy / migration** ⇒ đưa vào checklist đúng ràng buộc project đã khai ở bước 0 (doc design,
bump version, chạy migration…). Không có ràng buộc nào thì thôi, đừng bịa.

## Bẫy hay gặp

| Bẫy                                                                          | Chặn bằng                                                   |
| ---------------------------------------------------------------------------- | ----------------------------------------------------------- |
| Viết plan theo convention của skill trong khi project đã có convention riêng | bước 0 — đọc mẫu plan gần nhất trước                        |
| Ghi vào doc nguồn ngay khi có ý tưởng                                        | gate 👤 của phase 0                                         |
| Tự tạo file plan khi user mới chỉ hỏi ý kiến                                 | luật 1 — trình bày trong chat trước                         |
| Vào thẳng giải pháp, người đọc không biết đang chữa cái đau nào              | luật 5 — section **Vấn đề** đứng trước "Sau plan này có gì" |
| Plan mồ côi (không map về ID công việc nào)                                  | luật 3 — thêm ID vào backlog trước                          |
| Xoá dòng cũ trong backlog khi bỏ scope                                       | đánh dấu bỏ, ID không tái sử dụng                           |
| Dồn tick checklist cuối phase, hoặc tick `👤` hộ người                       | luật 10                                                     |
| Phase chỉ có danh sách việc, không có Gate ⇒ không biết lúc nào xong         | luật 7 — mỗi phase đủ Goal · Actions · Gate                 |
| Đánh "xong" khi mới viết xong chưa chạy                                      | chỉ đánh xong khi **chạy được và có bằng chứng**            |
| Doc plan lỗi thời bị xoá                                                     | đánh `superseded` + trỏ tới doc thay thế, không xoá         |
