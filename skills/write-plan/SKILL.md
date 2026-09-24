---
name: write-plan
description: Viết doc kế hoạch triển khai (plan doc) cho một feature — trình bày trong chat trước, chốt ID công việc, dựng file theo khung cố định 7 section (Problem · Goal · Mental model · Probe · Decisions · Design · Phases — Probe optional) — §1–§3 viết bằng chữ thường cho người chưa mở repo, §3 có sơ đồ — với ký hiệu 🤖/👤, rồi tick tới đâu làm tới đó, phase cuối nghiệm thu lại từng bullet §2. Dùng khi user nói "lập kế hoạch", "viết plan cho X", "lưu lại plan", "tạo doc plan", "thiết kế X trước khi code", hoặc khi một yêu cầu đủ lớn để cần plan trước khi sửa code. Đọc convention của project (CLAUDE.md / AGENTS.md / thư mục docs) để lấy **binding** — thư mục, hệ ID, doc nguồn, lệnh kiểm — còn **hình dạng doc thì theo skill này**. Kèm `template.md` (copy ra rồi điền) và `verify.py` — lint khung section, sợi dây `P → D → DS → phase`, phủ `DS`, tick/status, ô duyệt, phase nghiệm thu.
---

# Viết doc plan

## Mental model

Plan doc là **nơi quyết định thiết kế sống trong lúc còn có thể đổi**. **Doc nguồn** (PRD, kiến trúc,
backlog…) chỉ nhận thay đổi **sau khi plan được duyệt** — ghi sớm thì mỗi lần đổi hướng là viết lại doc
nguồn một lượt, và doc nguồn biến thành nơi lưu tranh luận.

```
bàn trong chat → plan doc (draft) → 👤 duyệt → implement, tick tới đâu xong tới đó → phase cuối: nghiệm thu lại §2
                                            └─ project có doc nguồn ⇒ chen phase 0 "ghi doc nguồn" vào trước implement
```

Ngoại lệ **duy nhất** được chạm doc nguồn trước khi duyệt: **thêm ID công việc mới** vào backlog — không
có ID thì plan mồ côi.

Doc chia hai nửa, ngăn bằng `---` sau §3: **§1–§3 cho người đọc**, **§4–§7 cho người làm**. §1–§3 là
phần được người đọc nhiều nhất — người duyệt, người mới vào, người mở lại plan cũ thường dừng ở đó — nên
có luật viết riêng (luật 23): người chưa mở repo đọc là hiểu.

## Bước 0 — đọc **binding** của project (làm trước mọi thứ)

Skill quy định **hình dạng doc**; project quy định **chỗ cắm**. Thứ tự ưu tiên: `CLAUDE.md` / `AGENTS.md`
→ thư mục doc sẵn có (`ls -d .docs .plans docs`, mở plan gần nhất) → hỏi user → default.

| Binding cần biết                                    | Default nếu project không quy định                                           |
| --------------------------------------------------- | ---------------------------------------------------------------------------- |
| Thư mục + cách đặt tên doc plan                     | `.docs/NNN-slug.md` — không có thì `.plans/NNN-slug.md`; slug lowercase-kebab, `NNN` = số kế tiếp |
| Front matter thêm ngoài bộ chuẩn                    | không có ⇒ dùng đúng bộ ở `template.md`                                      |
| **Doc nguồn** nào phải ghi ở phase 0                | không có ⇒ bỏ hẳn phase 0, để trống số 0, mở màn bằng Phase 1 (luật 2)       |
| **Hệ ID công việc** (backlog/issue/ticket)          | không có ⇒ bỏ bước ID, plan tự mô tả scope                                   |
| Lệnh kiểm để đưa vào checklist                      | `npm test` · `npm run build`; đọc `package.json`/`Makefile` để lấy đúng lệnh |
| Doc design/UI phải tuân theo                        | không có ⇒ bỏ                                                                |
| Việc kèm theo khi deploy (bump version, migration…) | không có ⇒ bỏ                                                                |

⚠️ Plan cũ chỉ cho **binding** (thư mục, cách đánh số, hệ ID, doc nguồn). **Không** lấy hình dạng — thứ
tự section, tên section, cách đánh số heading: plan cũ thường là fork của skill này ở version trước,
copy nó là nhân bản drift.

Project có `CLAUDE.md`/`AGENTS.md` **chép lại luật viết plan** ⇒ nói user rút nó về binding + trỏ tới
skill này, đừng giữ hai bản luật.

## Quy trình — 23 luật

> Đánh số ổn định: doc cũ trích `luật 2`, `luật 10`… là trỏ tới danh sách này.

1. **Chưa được yêu cầu thì không lưu file** — trình bày plan trong chat để review; user nói "lưu lại
   plan" mới ghi. Chỗ nào nhiều nhánh / nhiều tầng thì **dùng skill `explain-with-diagrams`** để bàn —
   link `mermaid.live` mở được ngay, user nhìn hình gật nhanh hơn đọc 20 dòng mô tả. **Để nguyên mode
   mặc định `easy`**: việc lúc này là làm người duyệt nắm vấn đề nhanh, chưa phải đi vào tên file — và
   `D`/`DS` cũng chưa tồn tại, doc còn chưa viết. Sang `--tech` chỉ khi user hỏi sâu vào code. Hai mục
   của nó bê thẳng vào doc được: `Một câu` → **§1**, `Chuyện thật` → **`Bây giờ chạy thế nào`** ở §3.
2. **Duyệt xong mới ghi doc nguồn.** Tới lúc đó quyết định nằm **trong plan doc**. Ngoại lệ duy nhất:
   luật 3. Hai thứ tách riêng, đừng gộp:
   - Ô `- [ ] 👤 plan này được duyệt` đứng **ngay dưới Legend §7, ngoài mọi phase** — nó chặn **cả §7**:
     chưa tick thì không phase nào được bắt đầu.
   - **Phase 0 = "ghi doc nguồn"**, chỉ có khi bước 0 tìm ra doc nguồn. Không có ⇒ **bỏ hẳn phase 0**,
     để trống số 0 (như §4 vắng thì bỏ hẳn số 4), plan mở màn bằng Phase 1.
3. **Chốt ID công việc** plan này phủ. Chưa có ID ⇒ dừng, thêm vào backlog trước.
4. **Tạo file bằng cách copy [`template.md`](template.md)** ra đường dẫn theo binding bước 0, rồi điền
   — front matter `type: plan` + `implements: [...]`.
5. **`## 1. Problem` đứng trước `## 2. Goal`**, cả hai bắt buộc, viết theo luật 23:
   - **Problem** — 2–4 dòng **hiện trạng**: ai đau, đau vì gì, hỏng ở đâu, số đo thật nếu có ("build
     40′", "71 lượt load skill trên 347 transcript"). Chưa nói giải pháp.
   - **Goal** — 3–5 bullet **trạng thái quan sát được** sau khi xong: mở được trang nào, chạy được lệnh
     nào, endpoint trả gì. Viết cái **có**, không viết cái **muốn** — "chạy `npx foo` lên được server ở
     :4000", **không** "cải thiện observability". Thêm `**Ngoài scope:**` nếu dễ bị hiểu lầm là có.
6. **Legend** `🤖` = agent tự kiểm được (lệnh, test, grep) · `👤` = cần người kiểm (số đo thật, hạ tầng,
   UI, quyết định) — đặt **ngay dưới heading `## 7. Phases`**, không để đầu doc, không thành section riêng.
   Ngay dưới Legend là ô `👤 plan này được duyệt` (luật 2), rồi mới tới `### Phase`.
7. **Mỗi phase đúng 4 phần, đủ nhãn:**
   - **Goal** — 1 dòng: sau phase này _dùng được_ cái gì (cùng giọng với §2).
   - **Cover** — 1 dòng `6.x` phase này hiện thực (luật 17).
   - **Actions** — checklist file/hàm/test/doc cụ thể. Action thực thi một quyết định ⇒ ghi `(D<n>)` cuối
     dòng — **chú giải "vì sao dòng này viết thế"**, không phải sổ phủ: `D` không sinh action thì thôi,
     không cần đánh dấu gì (luật 17).
   - **Gate** — checklist **bằng chứng** phase xong: lệnh xanh, số đo, người xác nhận. Chưa đủ Gate thì
     không sang phase sau.

   Mọi item ở Actions và Gate gắn `🤖` hoặc `👤`.

8. **Item phải kiểm được** (`npm pack` → tarball < 2MB), không phải "đã làm xong X".
9. **Backlog trỏ ngược lại**: thêm link tới plan mới ở nhóm ID tương ứng.
10. **Làm tới đâu tick tới đó** — `[ ]` → `[x]` **ngay trong cùng lần làm việc**, không dồn cuối phase,
    không báo "xong" khi plan còn `[ ]`.
    - **Bằng chứng ghi cạnh ô tick**: `- [x] 🤖 pnpm test xanh — 1311 passed / 463 skipped`,
      `- [x] 👤 plan này được duyệt — 2026-09-03`. `[x]` trơ không số/ngày chỉ là lời khai.
    - Item `👤` chưa ai xác nhận ⇒ để `[ ]`, nói rõ đang chờ ai kiểm cái gì.
    - Item không làm được ⇒ để `[ ]` + một dòng lý do ngay dưới (chặn ở đâu, phase sau có bị chặn theo
      không). **Không xoá** — xoá là mất dấu vết phần chưa đạt.
11. **Heading `##` đánh số cứng 1–7** ⇒ `§5` luôn là Decisions, `§7` luôn là Phases, trích chéo liên doc
    không trượt. Bắt buộc đủ 6 section; **`§4 Probe` là section duy nhất được vắng** — vắng thì bỏ hẳn
    heading, không section nào được dồn lên chiếm số 4.
12. **Lead-in chỉ viết khi có quan hệ với plan khác**, dùng đúng 3 nhãn đóng (§Lead-in).
13. **Mỗi quyết định có ID `D0`…`Dn` và ≤5 dòng.** Dài hơn ⇒ chi tiết xuống §6, và `D` **trỏ bằng ID**:
    `→ DS4`, không viết "xem phần thiết kế bên dưới".
14. **`D-ID` · `P-ID` · `DS-ID` · `BH-ID` đều append-only** — không đánh số lại, không tái dùng. Bỏ đi ⇒ giữ
    heading/dòng: gạch ID thành `### ~~D4~~ — <câu quyết định cũ>`, **giữ nguyên câu cũ**, rồi thêm một
    dòng `**Đổi (YYYY-MM-DD):** bỏ — <lý do>` trong thân block (`DS` cũng vậy). Gạch đã nói nó chết; giữ
    câu cũ để sau này đọc §5 còn biết từng chốt cái gì. ID **không phải số
    thứ tự**: §6 sắp xếp lại thoải mái cho dễ đọc, `DS3` vẫn là `DS3`.
15. **`status` đi một chiều, đúng 3 giá trị**, đổi tới đâu bump `updated`: `draft` → `approved` (ô
    `👤 plan được duyệt` được tick) → `done` (mọi Gate đã tick). Plan bị plan khác lật thì **không** đổi
    status — dấu vết nằm ở `supersedes` + lead-in `**Lật:**` của plan mới.
16. **Khả thi kỹ thuật còn là câu hỏi ⇒ probe trước, quyết sau.** Kết quả thăm dò có thể lật một `D` ⇒
    chạy **trước khi viết plan**, ghi vào `§4` với ID `P1`…`Pn`. Duyệt plan mà nền của nó chưa biết đúng
    sai là duyệt giả định. Không có câu hỏi kiểu đó ⇒ **bỏ hẳn §4** (luật 11). Hình dạng block và dây nối
    `P`↔`D`: xem §"§4 Probe".
17. **Phase phải phủ hết §6** (chỉ §6 — xem vế cuối). Mỗi phase khai dòng `Cover:` ngay dưới Goal, liệt kê
    `DS` mà phase **hoàn thành**; làm dở ghi `DS3 (một phần)`. Ba phép kiểm chéo:
    - **Mỗi `DS` phải có đúng một phase cover trọn.** Không phase nào ⇒ thiết kế chết: cắt `DS` đó hoặc
      thêm phase. Nhiều phase cùng nhận trọn ⇒ contract chưa cắt xong, tách `DS` ra.
    - **Phase không cover `DS` nào** chỉ hợp lệ với phase 0 và phase nghiệm thu (luật 21) — hai phase đó
      không hiện thực contract nào. Còn lại ⇒ đang implement thứ §6 chưa chốt, quay về viết §6 trước.
    - **Gate phải có ít nhất một item chứng minh đúng contract vừa cover** — "gửi trùng key → 409, DB còn
      1 row — DS2", không phải "test xanh" trơn.

    **`D` không có nghĩa vụ phủ — bất đối xứng này là cố ý.** `DS` là **vật giao được**: có trạng thái
    xong/dở, nên "phase nào nhận trọn" có nghĩa. `D` là **ràng buộc**: không có trạng thái xong, được tuân
    ở nhiều phase hoặc chẳng ở đâu cả — `D0 — chọn Postgres`, `D3 — không hỗ trợ multi-tenant v1` là
    quyết định thật mà không action nào "thực thi". Ép `D` phủ như `DS` là ép một nửa số `D` bịa ra việc.
    Sợi dây §5 → §7 vẫn còn, nhưng **một chiều**: action nào có `(D<n>)` thì `D` đó phải tồn tại và chưa
    bị gạch bỏ; chiều ngược lại không bắt buộc.

18. **Trước khi chốt §7: rà bẫy, nhưng không ghi bẫy vào doc.** Liệt kê ra ngoài doc những chỗ dễ hỏng
    (làm sai thứ tự, quên migrate dữ liệu cũ, đụng module không được đụng…). Mỗi cái phải chỉ được **một
    Gate cụ thể** bắt được nó; chỉ không được ⇒ §7 thiếu gate, thêm gate rồi rà lại. Rà xong **vứt danh
    sách** — cái đọng lại là Gate, không phải bảng rủi ro. Rủi ro đã quyết định chấp nhận thì thuộc `D`
    (`D3 — không hỗ trợ multi-tenant v1`), không phải chỗ này.

19. **Chạm plan doc ⇒ chạy `verify.py` rồi mới báo xong.** Sửa file, tick ô, đổi `status` — lần nào cũng
    chạy. ERROR là lỗi **ngữ nghĩa**: sửa **doc**, không sửa linter, không bỏ qua check. Hướng sửa thường
    là một quyết định (cắt `DS` hay thêm phase?) ⇒ nói cho user chọn, đừng tự chọn im lặng.

20. **Chọn cách nhỏ nhất giải được §1, và viết sao cho người khác đọc một lượt là hiểu.**
    - **Không dựng thứ chưa có người dùng thứ hai**: interface một implement, config không ai đổi, lớp
      bọc chỉ gọi xuyên qua, hàng đợi cho hai hàm gọi nhau, cache khi chưa đo được chậm. Cần thật ⇒ phải
      có `P` đo được hoặc một dòng trong `D` chỉ ra ca thứ hai đang nằm trong §2.
    - **Tổng quát hoá khi đã có ≥2 ca thật trong scope.** Một ca thì viết thẳng ca đó; ca thứ hai tới thì
      lúc đó mới tách.
    - `D` nào thêm một tầng · một dependency · một bảng ⇒ dòng **Phương án đã loại** phải nói vì sao cách
      thẳng tay không đủ ("ghi thẳng vào bảng `order` không đủ vì cần đọc chéo 3 service"). **"để sau này
      dễ mở rộng" không phải lý do** — sau này chưa có trong §2.
    - **§1–§3 viết cho người chưa mở repo** — luật 23.
    - Dấu hiệu quá tay, thấy thì cắt: `DS` không phase nào cần (luật 17) · phase "dựng nền" mà xong chẳng
      ai dùng được gì (luật 7 Goal) · plan sinh ra thứ §2 không đòi.

21. **Phase cuối là nghiệm thu: chạy lại §2 trên bản đã ghép đủ.** Gate từng phase chứng minh đúng
    **contract** vừa cover (luật 17) — không chỗ nào chứng minh cái **người dùng thấy** ở §2 đã đứng được.
    Plan xanh hết mà chưa ai mở thử là chuyện có thật. Phase cuối tên `### Phase <n> — nghiệm thu` lấp
    chỗ đó:
    - **Cover để trống** — nó không hiện thực `DS` nào (luật 17).
    - **Gate: một dòng ứng một bullet §2**, ghi cách kiểm + kết quả thật, không phải "test xanh" trơn:
      `- [x] 👤 §2 bullet 2: gửi trùng key → 409, DB còn 1 row — 2026-09-18, Andy xác nhận`.
    - **Bắt buộc kể cả plan chỉ có một phase làm việc** — plan nhỏ mới hay bị tuyên bố xong lúc vừa viết
      xong, chưa chạy.
    - Tick đủ rồi **dán nguyên khối Gate này vào chat**, đó mới là lúc được báo xong (luật 10). Khối Gate
      **là** biên bản nghiệm thu — doc không giữ thêm bảng kết quả thứ hai, hai chỗ thì sớm muộn lệch.

22. **Mỗi `D` ghi ai quyết** — dấu đặt trong heading ngay sau ID: `### D0 🤖 — <câu quyết định>` ·
    `### D3 👤 — <câu quyết định>`. Một dòng `**Ai quyết:**` giải nghĩa hai dấu đặt **ngay dưới heading
    `## 5. Decisions`**, trước `D` đầu tiên — cùng cách Legend đứng dưới §7 (luật 6).
    - **Heading `D` chỉ mang ID · dấu · câu quyết định.** Cấm ngày tháng, tên người, lý do — xuống thân
      block hết, **không trừ `D` đã bỏ** (luật 14). Heading là dòng để lướt; nhét metadata vào là đẩy nội
      dung ra sau.
    - 🤖 = agent tự quyết, chưa hỏi ai. Đây là **danh sách phải soi khi duyệt**: người duyệt lướt §5,
      mắt dừng đúng mấy dòng đó thay vì đọc lại từ đầu.
    - 👤 = user chốt trong lúc bàn.
    - Dấu ghi **xuất xứ lúc viết**, không đổi sau khi duyệt — duyệt cả plan là gật cả hai loại, nhưng đọc
      lại plan cũ vẫn trả lời được "cái này ai quyết". User lật một `D` giữa chừng ⇒ đổi sang 👤, kèm dòng
      `**Đổi (YYYY-MM-DD):**` — **ngày nằm ở đó**, không lên heading.
    - Trùng ký hiệu với Legend §7 nhưng **khác trục**: §7 hỏi *ai kiểm được*, §5 hỏi *ai quyết* — phân
      biệt bằng vị trí, ô tick hay heading `D`.

23. **§1–§3 viết cho người chưa mở repo.** Ba section này được đọc nhiều nhất, và phần lớn người đọc
    dừng ở đó — nên dễ hiểu đứng trước đầy đủ. Người implement cần tên hàm để đối chiếu thì đã có §6–§7.
    - **Cụ thể bằng chuyện xảy ra, không bằng tên trong code**: ai làm gì, lúc nào, hệ thống làm gì,
      cuối cùng người ta thấy gì. "Khách bấm Đặt hàng, server kiểm đơn này gửi rồi chưa" — không phải
      "`POST /orders` → `checkIdem(idem_key)`".
    - **Chỉ gọi tên thứ người đọc thấy hoặc gõ**: nút, trang, lệnh, URL, thông báo lỗi hiện ra. Tên
      hàm · field · biến · file · event · payload · mã trạng thái nội bộ ⇒ §6–§7.
    - **Không trỏ `P` · `D` · `DS`** — đọc §1–§3 không phải lật xuống dưới. Cần kết quả của `P1` thì kể
      luôn kết quả đó bằng một câu ("app tự gửi lại khi chờ quá 5 giây").
    - **Không tự đúc thuật ngữ lai ghép** — gọi tên bằng câu nói việc gì xảy ra.
    - **§3 được kể theo trình tự** ("mỗi phút… rồi… xong thì…") — luật "không narrative" ở §"Luật viết"
      chỉ áp cho §4–§7. Kể một đường là đúng việc của §3.
    - **§3 có hình nếu vẽ được** — chỉ bỏ khi luồng thẳng một mạch ≤3 bước. Nhãn node cũng theo luật
      này: "kiểm đơn trùng", không phải `checkIdem()`. Quy ước hai hình: §"§3 Mental model".
    - **Phép thử**: người chưa mở repo đọc xong kể lại được §1 đau gì, §2 xong thì thấy gì, §3 luồng chạy
      ra sao — mỗi cái một câu. Không kể được ⇒ viết lại bằng chữ thường, đừng thêm tên code cho "cụ thể",
      đừng thêm sơ đồ để bù chữ tối.
    - `verify.py` WARN khi §1–§3 có tên trông như trong code (`foo()`, `camelCase`, `snake_case`, `a.b`,
      `key: value`, `{…}`) hoặc trỏ `P`/`D`/`DS`, và khi §3 không có hình. Lint chỉ bắt được tên code —
      câu tối nghĩa vẫn phải tự đọc.

## Khung cố định — 7 section (§4 optional), không thêm không bớt

| §   | Tên              | Vai                                                                    |
| --- | ---------------- | ---------------------------------------------------------------------- |
| 1   | **Problem**      | đau gì, số đo thật, chưa nói giải pháp                                 |
| 2   | **Goal**         | trạng thái quan sát được sau khi xong + Ngoài scope                    |
| 3   | **Mental model** | **bây giờ chạy thế nào** · **sau plan chạy thế nào** (cùng đường, chỉ chỗ đổi) · hình · hành vi đổi ra sao (`BH1`…`BHn`) · không đụng |
| —   | `---`            | ngăn phần người đọc (1–3, luật 23) với phần người làm (4–7)            |
| 4   | **Probe** _(optional)_ | `### P1`…`Pn` — heading = câu hỏi; `**Biết để làm gì:**` · `**Cách chạy lại:**` · `**Kết quả:**`. Dây nối ID nằm ở `D` (§5) |
| 5   | **Decisions**    | `D0`…`Dn`, mỗi D ≤5 dòng, heading ghi 🤖/👤 ai quyết — **cái được duyệt, cái plan sau lật** |
| 6   | **Design**       | `DS1`…`DSn` append-only — contract đối chiếu được; **số & tên tùy bài toán**  |
| 7   | **Phases**       | Legend → ô duyệt → `### Phase 0…n` (Goal · **Cover** · Actions · Gate); phase 0 optional, phase cuối là nghiệm thu |

**Probe → Decisions → Design** là thứ tự bằng chứng → quyết định → khai triển: §4 là **cái đo được**,
§5 là **mục lục lựa chọn** (thứ người duyệt gật, thứ lead-in plan sau trỏ vào), §6 là **chỗ khai triển**
cho người implement.

**Ranh giới cần plan doc:** không có §5 lẫn §6 ⇒ việc không đủ lớn để cần plan doc, làm thẳng. Ngược lại,
chưa viết được §5 vì thiếu dữ kiện ⇒ chưa tới lúc viết plan, đi probe đã (luật 16).

## §3 Mental model — kể một đường hai lần

§3 trả đúng một câu: **người chưa mở repo đọc xong có kể lại được luồng bằng một câu không?** Viết theo
luật 23 — bằng chữ thường, tên code để dành cho §6–§7. Bốn phần, đúng thứ tự, mỗi phần có một ranh giới
dễ vượt:

| Phần | Nội dung | Đừng lấn sang |
| --- | --- | --- |
| **Bây giờ chạy thế nào** | một đường thật (một request · một job · một lần đồng bộ) từ lúc bắt đầu tới khi xong, kể bằng chuyện xảy ra — kèm hình | **cơ chế**, không phải nỗi đau — ai đau và số đo là §1. Tên hàm, chuỗi gọi hàm, điều kiện chặn từng cái một, payload là §6 |
| **Sau plan chạy thế nào** | cùng đường đó, chỉ nói chỗ khác đi và vì sao chỗ đó giải được §1 — kèm hình | không tả lại đoạn không đổi |
| **Hành vi đổi ra sao** | bảng `BH1`…`BHn` — tình huống · bây giờ · sau plan, tả cái **người dùng thấy** ("app báo đơn đã gửi, lịch sử vẫn một đơn") | khoá theo **hành vi**, không theo file; file nào sửa là §7 Actions; payload, mã lỗi là §6 |
| **Không đụng** | một dòng rào scope, gọi bằng tên người đọc hiểu ("phần thanh toán") | trỏ được về Gate `git diff --stat` thì càng tốt |

Ví dụ phần lời — cùng một luồng, viết hai kiểu:

> ❌ `POST /orders` → `OrderController.create()` → `orderService.insert(payload)` ghi thẳng bảng `order`;
> client `retryOnTimeout()` gửi lại cùng `payload` sau 5s ⇒ 2 row `state: 'new'`.
>
> ✅ Khách bấm Đặt hàng, app gửi đơn lên server, server ghi luôn một đơn mới. Mạng chậm quá 5 giây thì
> app tưởng lỗi và tự gửi lại — server không biết đó là cùng một đơn, nên ghi thêm đơn thứ hai. Khách
> thấy hai đơn giống hệt nhau trong lịch sử.

Bản ❌ đúng từng chữ nhưng chỉ người đã mở repo đọc ra; những tên đó thuộc §6.

**Vì sao kể hai lần.** Một lượt mô tả "hệ thống sau khi xong" đọc thì mượt nhưng người duyệt không thấy
được **cái gì đổi** — họ phải tự nhớ hiện trạng rồi trừ trong đầu. Hai nhãn tách ra thì phép trừ nằm sẵn
trên giấy. Và nhãn cũng chữa một lỗi cũ: bản trước viết "Chạy thế nào" mà không nói đang tả trạng thái
nào, người đọc phải đoán.

**Bảng đi hết nhánh, phần lời chỉ đi một đường.** Đó là lý do bảng không bỏ được: nhánh lỗi và ca biên
không nhét vào một đường kể được. Khác §2 ở chỗ §2 không có cột *bây giờ* và chỉ nói cái người dùng thấy.

**Hình — vẽ nếu vẽ được, và có quy ước** (chi tiết nằm sẵn trong `template.md`):

- **Mặc định có hình.** Người đọc nắm luồng bằng mắt nhanh hơn đọc chữ. Chỉ bỏ khi luồng thẳng một mạch
  ≤3 bước — lúc đó hình không nói thêm gì. Phần lời vẫn phải tự đứng được: mermaid không render ở
  terminal, diff và một số viewer.
- **Nhãn node bằng chữ thường** (luật 23): "khách bấm Đặt hàng", "kiểm đơn trùng", "ghi đơn" —
  không phải tên hàm. Hình ở §3 cho người chưa mở repo, cùng người đọc với phần lời.
- Hình dạng luồng **không** đổi (chỉ đổi field, đổi giá trị) ⇒ vẽ **một** hình. Hai hình y hệt nhau thì
  không so được gì — `verify.py` bắt ca này.
- Vẽ thì **cùng node, cùng hướng**, chỉ tô màu chỗ đổi. Bố cục khác nhau là mắt phải so lại từ đầu, mất
  luôn cái lợi của việc đặt cạnh nhau.
- Màu set thẳng trên node kèm `color:` cho chữ, **không dựa theme** — plan doc bị đọc cả trên GitHub nền
  sáng lẫn IDE nền tối. Đừng bê palette của `explain-with-diagrams` vào file: nó là bộ nền tối cứng cho
  chat, chính skill đó đã tự loại mình khỏi ca dán vào tài liệu.

**Bảng có `BH` mà hình không có ID — cố ý.** `BH2` để Gate ở §7 trỏ ngược (`— BH2`), hai đầu cách nhau
200 dòng nên cần sợi dây, đúng lý do `DS` có số. Hình thì nằm ngay trên bảng, mắt so trong vài giây —
thêm `node D` vào ô chỉ làm bảng khó đọc mà không mua được gì.

**Cái linter không kiểm được:** hành vi trong bảng có khớp logic trên hình không. Nó so được node và
hướng của hai hình, không biết `409` trên hình với "chặn tạo trùng" trong bảng là một chuyện.

## §4 Probe — optional, chỉ khi khả thi kỹ thuật còn là câu hỏi

Probe = **thăm dò để biết thiết kế có đứng được không**, chạy trước khi chốt `D` (luật 16). Câu trả lời
đã có sẵn từ doc/kinh nghiệm ⇒ không probe, **bỏ hẳn §4**.

Mỗi thăm dò một block `### P<n>`, cùng hình dạng với `D` và `DS`: **hỏi gì · biết để làm gì · chạy lại
thế nào · ra số gì**.

```markdown
### P1 — Pooler có giữ được `LISTEN/NOTIFY` 30′ không?

**Biết để làm gì:** rớt thì cả hướng realtime sập, phải quay về polling — thêm một job định kỳ
**Cách chạy lại:** `scripts/probe-notify.mjs`, 200 event
**Kết quả:** rớt 3/200 sau 6′ — 2026-09-04, pg15.4
```

### Dây nối `P`↔`D` — viết một chiều, ở phía `D`

`P` có trước (bằng chứng), `D` có sau (dựng trên bằng chứng), nên dây nối nằm ở §5:
`D2 — **Lý do:** dựa vào `P1``. Bắt `P` khai ngược lại là vẽ cùng một quan hệ hai lần, và đặt `D2` vào
chỗ người đọc gặp nó trước khi §5 định nghĩa.

- **`P` không bao giờ trỏ `D`** — trong `P` mà xuất hiện `D<n>` ⇒ WARN.
- **Không phải `D` nào cũng cần `P`** — bất đối xứng cố ý, cùng kiểu `D`/`DS` ở luật 17. Chọn Postgres
  vì team đang chạy Postgres thì chẳng có gì để đo.
- **Nhiều–nhiều, và cả hai chiều đều viết ở `D`:** `D` đứng trên nhiều `P` ⇒ `**Lý do:**` của nó liệt kê
  hết. Một `P` làm nền cho nhiều `D` ⇒ mấy `D` đó **mỗi cái tự nhắc** `P` ấy. `P` không liệt kê gì.
- **`P` chưa chạy chặn duyệt** — để nguyên block + `**Kết quả:** chưa chạy`; `verify.py` báo ERROR nếu
  `status` lên `approved`/`done`. `D` nào nhắc nó là `D` đó chưa có nền, linter in ra cho người duyệt.

### Luật viết từng `P`

- **Câu hỏi phải trả được bằng có/không hoặc bằng số.** "Tìm hiểu về queue" không phải câu hỏi.
- **`**Biết để làm gì:**` tả *ngã ba đường*, không nhắc `D` nào** — `P` ghi lúc **chưa biết**, `D` ghi
  **đã chọn nhánh nào**. Viết không nổi câu "kết quả đổi cái gì" ⇒ probe thừa, cắt.
- **Mỗi `P` phải có ít nhất một `D` nhắc tới** — không ai dùng thì là probe thừa, cắt. Kiểm từ phía
  người tiêu thụ, cùng cách `DS` phải có phase cover và `BH` phải có Gate nhắc.
- **`**Cách chạy lại:**` ghi đủ để người khác chạy lại** (script · lệnh · commit), không phải "đã thử
  tay thấy được". Probe không chạy lại được thì kết quả của nó không phải bằng chứng.
- `P-ID` append-only như `D` (luật 14).

**Khác `DS Test Strategy`:** `P` hỏi *có làm được không* — trước khi quyết. Test Strategy đo *đã làm tới
đâu* — sau khi quyết, dùng lại ở Gate §7. Cùng một script phục vụ cả hai thì `DS` đó **trỏ về `P1`**, không chép lại.

## §6 Design — hình dạng tùy bài toán

§6 trả đúng một câu: **người implement cần chốt sẵn cái gì để không phải đoán?** Cái đó khác nhau theo
bài toán, nên §6 **không có bộ subsection cố định** — chỉ có 4 luật chung:

1. **Một hạng mục cần chốt = một `### DS<n> — <tên hạng mục>`** — `DS1 — Database Schema`,
   `DS2 — API Design`, `DS3 — Test Strategy`. Heading nói **loại contract** để skim được; instance cụ thể
   (`order`, `POST /orders`) nằm trong thân section. Cấm nhãn rỗng không nói loại gì: "Cơ chế", "Chi tiết".
2. **Viết ở dạng đối chiếu được**: bảng field/kiểu/bắt buộc, chữ ký hàm, mẫu request–response, bảng
   state → transition, cây thư mục, bảng ánh xạ cũ → mới. Đoạn văn kể cách hoạt động là §3, không phải §6.
3. **Chỉ giữ `DS` có phase cover.** `DS` không xuất hiện ở dòng `Cover:` nào ⇒ không ai build theo, cắt
   (luật 17 — đây là chỗ grep ra được, không phải lời khuyên suông).
4. **Số đo thật ghi kèm điều kiện đo** (version, ngày, cách đo).
5. **`DS-ID` append-only** (luật 14): hạng mục mới lấy số kế tiếp, bỏ thì gạch
   `### ~~DS2~~ — <tên hạng mục cũ>` + dòng `**Đổi (ngày):** bỏ — <lý do>`. ID rời khỏi vị trí nên
   **sắp xếp lại §6 không phá `Cover:`**.

[`template.md`](template.md) điền sẵn §6 bằng ví dụ của **một** bài (bảng field + endpoint + test
strategy) — đọc để lấy **dạng trình bày**, không copy tên section.

Gợi ý thứ thường phải chốt — chọn đúng bài, **không điền cho đủ bảng**:

| Bài toán              | Hạng mục `DS` thường có — dùng thẳng làm tên heading                               |
| --------------------- | ---------------------------------------------------------------------------------- |
| API / service         | `API Design` (endpoint · payload · mã lỗi) · `Idempotency & Retry`                 |
| Dữ liệu / storage     | `Database Schema` (bảng · index) · `Migration` (cách backfill)                     |
| UI / màn hình         | `State Machine` (state + transition) · `Empty–Loading–Error` (dữ liệu mỗi state)   |
| CLI / tool            | `CLI Surface` (lệnh + flag · exit code) · `Output Format` (stdout/stderr)          |
| Pipeline / job        | `Trigger` · `Đơn vị xử lý & trạng thái` · `Chạy lại` (retry, dedupe)               |
| Thư viện / SDK        | `Public API` (chữ ký) · `Compatibility` (cái gì tính là breaking)                  |
| Doc / skill / prompt  | `Cấu trúc file` · `Trigger` · `Ví dụ vào–ra`                                       |
| Refactor / migration  | `Ánh xạ cũ → mới` · `Kế hoạch tương thích` (giữ gì, xoá khi nào)                   |
| Bài nào có baseline   | `Test Strategy` (fixture · script chấm · lệnh chạy lại · baseline + ngày)          |

## Lead-in — optional, 3 nhãn đóng

Blockquote 2–4 dòng ngay dưới front matter. **Chỉ viết khi** `sources:` chứa một **doc plan khác** (không
tính PRD/SAD/backlog), hoặc plan này đổi hành vi mà một plan cũ đã định nghĩa. Không có quan hệ ⇒ vào
thẳng `## 1. Problem`.

| Nhãn                       | Nội dung                                                    |
| -------------------------- | ----------------------------------------------------------- |
| `**Nối tiếp:**`            | plan cũ làm xong phần nào, plan này giải cái nó để hở       |
| `**Lật:**` + `**Giữ:**`    | D nào của plan cũ bị bác, D nào còn hiệu lực                |
| `**Phụ thuộc:**`           | plan nào phải chạy trước, và vì sao                         |

- Nhãn không có quan hệ ⇒ **bỏ dòng đó**, không viết "không có". Mỗi nhãn ≤1 ý; dài hơn ⇒ nó thuộc §1 hoặc §5.
- **Không** nhét `status` (đã ở front matter) hay phạm vi/ngoài scope (đã ở §2).
- `supersedes: [024]` là **mức doc** cho máy; `**Lật:** D3 · D6 của 024. **Giữ:** D1 · D2` là **mức quyết
  định** cho người — chỉ có field YAML thì người đọc tưởng 024 chết hẳn.

## Doc mẫu — `template.md`

Khung doc nằm ở file riêng cạnh skill này: **[`template.md`](template.md)**. **Copy ra rồi điền**, đừng
gõ lại khung từ trí nhớ — gõ lại là thiếu section (luật 11) và lạc tên nhãn.

```bash
cp .claude/skills/write-plan/template.md .docs/042-slug.md
```

Thay `<…>` bằng giá trị lấy ở bước 0. Bỏ hẳn thứ project không có (doc nguồn, ID, design doc) — nhưng
**không bỏ section nào trong 7 section**. §6 trong template là ví dụ của **một** bài (bảng field +
endpoint + test strategy): giữ **dạng trình bày**, thay sạch nội dung.

Hai loại chỗ trống, xử lý khác nhau: **`<…>` thay bằng nội dung**, **`_(…)_` xoá đi** — nó là ghi chú
cho người điền, không thuộc plan. `verify.py` đối chiếu từng dòng với `template.md`: dòng nào còn nguyên
là chưa điền — `draft` thì WARN, `approved`/`done` thì ERROR.

`template.md` nguyên bản lint ra **0 ERROR**, nên ERROR đầu tiên sau khi copy là thứ vừa làm hỏng lúc
điền — chạy `verify.py` sớm, đừng đợi viết xong.

## Luật viết

**Chia phase theo _cái gì dùng được trước_, không theo tầng** (không "phase 1 = toàn bộ backend"). Phase
trước không được phụ thuộc phase sau.

**Item phải kiểm được**, không phải "đã làm xong X":

| ✅                                                                       | ❌                    |
| ------------------------------------------------------------------------ | --------------------- |
| `npm pack` → tarball < 2MB                                               | đóng gói xong         |
| Test dedupe: 3 lượt trong 5′ ⇒ **1 row**; lượt thứ 4 sau 16′ ⇒ **2 row** | có test cho dedupe    |
| `git diff --stat` chứng minh `lease.ts` không đổi dòng nào               | không ảnh hưởng lease |

**Văn phong** — áp cho §4–§7. §1–§3 theo luật 23: chữ thường, được kể theo trình tự, không tên code.

- **Không narrative**: câu khẳng định trạng thái ("endpoint trả 409 khi trùng key"), không kể quá trình
  ("đầu tiên ta kiểm tra key, sau đó…").
- **Ngắn nhưng đọc là hiểu ngay** — cắt chữ đệm, không cắt thông tin. Tên file/hàm/field/lệnh viết đủ,
  không viết tắt tự nghĩ ("`POST /orders` trả 409", không "trả lỗi", không "409" trơ trọi).
- Ưu tiên bảng · bullet · mermaid hơn đoạn văn. Một ý một dòng. Sơ đồ dùng ```mermaid, không ASCII art.
- **Sơ đồ trong file: dán code** ```mermaid, không dán link `mermaid.live` — link chỉ dùng lúc bàn
  trong chat (luật 1). Màu set thẳng trên node kèm `color:` cho chữ, **không dựa theme**: plan doc bị
  đọc cả trên GitHub nền sáng lẫn IDE nền tối. Quy ước hai hình trước/sau: xem §"§3 Mental model".
- Đổi quyết định giữa chừng: **một dòng** `**Đổi (YYYY-MM-DD):** <cái mới> — <lý do ngắn>` ngay trong `D`
  tương ứng, không viết lại lịch sử tranh luận. **Bỏ hẳn cũng là một kiểu đổi** — `**Đổi (ngày):** bỏ —
  <lý do>`, cộng gạch ID ở heading (luật 14). Đây là chỗ duy nhất trong `D`/`DS` được mang ngày tháng.
- Không section changelog — git history là changelog. Chỉ bump `version` + `updated`.

**Chạm UI / deploy / migration** ⇒ đưa vào checklist đúng ràng buộc project đã khai ở bước 0 (doc design,
bump version, chạy migration…). Không có ràng buộc nào thì thôi, đừng bịa.

## Kiểm doc — `verify.py`

```bash
python3 .claude/skills/write-plan/verify.py .docs/042-slug.md   # exit 1 nếu có ERROR
```

| Mức       | Bắt gì                                                                                                                                                                                                                                                                                                  |
| --------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **ERROR** | khung section thiếu · sai tên · sai thứ tự · `Cover:` / `(D<n>)` / `→ DS<n>` / `dựa vào P<n>` trỏ vào ID không tồn tại hoặc đã gạch · `DS` không phase nào nhận trọn (hoặc ≥2 phase cùng nhận) · phase không cover `DS` nào (trừ phase 0 và phase nghiệm thu) · phase thiếu Actions/Gate · §7 thiếu ô `👤 plan này được duyệt` ngoài mọi phase · phase cuối không phải nghiệm thu · `status: approved`/`done` mà còn dòng bê nguyên chỗ trống của `template.md` · Gate trích `BH<n>` không có trong bảng §3 · `P` không `D` nào nhắc tới · `status: done` mà còn `[ ]` · `status: approved` mà ô duyệt chưa tick · duyệt khi còn `P` **chưa chạy** |
| **WARN**  | `D` dài >5 dòng · `[x]` không có số/ngày làm bằng chứng · item thiếu 🤖/👤 · phase nhận trọn `DSn` mà Gate không nhắc `DSn` · phase nghiệm thu ít item Gate hơn số bullet §2 · `D` thiếu 🤖/👤 ở heading · `D` có ngày tháng ở heading (kể cả `D` đã bỏ) · §1–§3 có tên trông như trong code, cả trong nhãn node · §1–§3 trỏ `P`/`D`/`DS` · §3 không có hình (luật 23) · §3 hai hình giống hệt nhau · khác hướng · không chung node nào · hình `Sau plan` thêm node mà không tô màu · còn chỗ trống chưa điền (khi `draft`) · `BH` không Gate nào nhắc · `P` thiếu `**Biết để làm gì:**` / `**Cách chạy lại:**` / `**Kết quả:**` · `P` trỏ ngược về `D<n>`                                                                                                                                                                              |
| **INFO**  | bảng phủ `DS → phase` · `P` chưa chạy thì `D` nào chưa có nền · `D` không action nào trích — **không phải lỗi** (luật 17)                                                                                                                                                                                     |

**Có ERROR thì làm gì** — `verify.py` không tự sửa doc (`--fix` sẽ luôn đoán sai, vì mỗi ERROR có ít nhất
hai hướng sửa lệch nhau về scope):

| ERROR                                       | Hai hướng sửa                                              | Ai quyết                          |
| ------------------------------------------- | ---------------------------------------------------------- | --------------------------------- |
| `DS4` không phase nào cover trọn            | cắt `DS4` (thiết kế thừa) · thêm/đổi phase để nhận nó      | **user** — đây là đổi scope       |
| `Cover:` / `(D<n>)` trỏ ID không tồn tại    | sửa số cho đúng · viết nốt mục còn thiếu                   | agent, nếu rõ ràng là gõ nhầm     |
| phase ≠ 0 không cover `DS` nào              | viết `DS` còn thiếu ở §6 · gộp vào phase khác              | **user** — nội dung §6 phải gật   |
| `status: done` mà còn `[ ]`                 | hạ `status` · làm nốt rồi tick                             | agent hạ status; làm nốt thì hỏi  |
| duyệt khi còn `P` **chưa chạy**             | chạy probe rồi điền kết quả · hạ `status` về `draft`       | **user** (luật 16)                |
| §7 thiếu ô duyệt ngoài phase                | chuyển dòng đó từ phase 0 ra dưới Legend · viết mới        | agent — chỉ là chuyển chỗ (luật 2) |
| phase cuối không phải nghiệm thu            | thêm phase nghiệm thu · đổi tên phase cuối nếu nó vốn là   | agent dựng khung; Gate ứng bullet §2 thì hỏi (luật 21) |

**Không bắt được, phải tự đọc:** hành vi trong bảng §3 có khớp logic trên hình không
(§"§3 Mental model") · item có kiểm được thật không · Gate có đúng bằng chứng cho contract không ·
phase chia theo "cái dùng được trước" hay theo tầng · `DS` có phải contract đối chiếu được hay chỉ là văn xuôi ·
giải pháp có phải cách nhỏ nhất giải được §1 · §1–§3 người chưa mở repo đọc có hiểu không (luật 23 —
linter chỉ bắt tên code, không bắt câu tối nghĩa).
Lint sạch ≠ plan tốt.

## Bẫy hành vi — thứ `verify.py` không bắt

Lỗi **hình dạng doc** đã có luật + linter lo. Bảng này chỉ giữ lỗi **hành vi**: thứ agent làm _quanh_ cái
doc, không nằm trong doc, nên không grep ra được.

| Bẫy                                                             | Chặn bằng                                                        |
| --------------------------------------------------------------- | ---------------------------------------------------------------- |
| Tự tạo file plan khi user mới chỉ hỏi ý kiến                    | luật 1 — trình bày trong chat trước, user nói "lưu" mới ghi      |
| Copy hình dạng doc từ plan cũ của project                       | bước 0 — plan cũ chỉ cho **binding**; nó thường là fork cũ của skill này |
| Ghi vào doc nguồn ngay khi vừa có ý tưởng                       | luật 2 — gate `👤 plan được duyệt` của phase 0                    |
| Probe chạy rồi nhưng chỉ kể trong chat, doc không có số         | luật 16 — mỗi `P` một dòng §4: cách chạy lại + kết quả + ngày · version |
| Đánh "xong" khi mới viết xong, chưa chạy                        | luật 10 — chỉ tick khi **chạy được và có bằng chứng** cạnh ô tick |
| Xoá dòng cũ trong backlog khi bỏ scope                          | luật 9 + 14 — backlog trỏ ngược lại; ID append-only, đánh dấu bỏ chứ không xoá |
| Thêm tầng trừu tượng / config / chỗ cắm "cho sau này" mà §2 không đòi | luật 20 — `D` phải nói vì sao cách thẳng tay không đủ; ≥2 ca thật mới tổng quát hoá |
| §1–§3 viết bằng chữ nghe kêu, người chưa mở repo đọc không ra luồng | luật 23 — một đường thật, kể bằng chuyện xảy ra; kể lại được bằng một câu |
| Sửa §3 mơ hồ bằng cách nhồi tên hàm/field cho "cụ thể"          | luật 23 — cụ thể bằng chuyện xảy ra; tên code để dành cho §6–§7   |
| Mọi phase xanh là báo xong, chưa ai chạy thử cái §2 hứa          | luật 21 — phase nghiệm thu, Gate một dòng ứng một bullet §2, dán khối đó vào chat |
