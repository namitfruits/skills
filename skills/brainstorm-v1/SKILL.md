---
name: brainstorm-v1
description: >-
  Trao đổi với người dùng để làm rõ điều họ thực sự mong muốn — chỉ làm rõ, chưa phân tích. Tách đề thành các module
  (vd "app đặt lịch có nhắc lịch và thanh toán" ra Tài khoản · Đặt lịch · Nhắc lịch · Thanh toán), cho người dùng
  **tick chọn feature** của từng module — cái được tick là scope — chốt bức tranh tổng quan, rồi đi từng module:
  người dùng kể trước, agent hỏi mục tiêu và chỗ còn hở (cái gì · ai · khi nào · nhận lại gì · một ví dụ thật) tới khi
  hình dung được, rồi nói lại bằng lời mình cho người dùng xác nhận. Hỏi bằng câu có sẵn đáp án; hỏi mục tiêu, không đào
  nỗi khổ; không chốt con số, không đào trường hợp lỗi, không viết user story — đó là việc của bước phân tích sau. Ra
  một file brief `.brainstorm/NNN-slug.md` theo `templates/brief.md`. Kèm `templates/modules.md` (gợi ý feature cho
  các module hay gặp) và `scripts/verify.py` lint file brief. Dùng khi người dùng nói "brainstorm", "cùng nghĩ xem tôi muốn gì", "làm rõ ý tưởng",
  "phỏng vấn tôi", "làm rõ requirement", hoặc đưa một đề liệt kê tính năng kiểu "tôi muốn làm A, B, C" mà chưa rõ
  từng cái gồm gì.
---

# brainstorm-v1 — trao đổi để làm rõ người dùng thực sự muốn gì

File này đủ để chạy skill. Vì sao skill được thiết kế như vậy thì ở [SPEC.md](SPEC.md), không cần đọc khi chạy.

## Tóm tắt

1. **Tách module & chọn scope**: tách đề thành module, người dùng tick feature. Cái được tick là scope.
2. **Tổng quan**: in bức tranh scope, người dùng nói "đúng" thì tạo file.
3. **Làm rõ từng module**: người dùng kể trước, agent hỏi mục tiêu và chỗ còn hở, rồi nói lại cho người dùng xác nhận.
4. **Chốt**: soát chỗ nói chưa khớp nhau, xác nhận giả định, người dùng nói "đúng" thì dừng.

Chỉ **làm rõ**, không **phân tích**. Câu hỏi kiểu "có … không", "ai", "lúc nào", "nhận lại gì" là làm rõ. Câu hỏi kiểu
"bao lâu", "bao nhiêu", "nếu trùng / thiếu / quá hạn thì sao" là phân tích, để dành cho bước sau. Người dùng tự nói
ra con số hay trường hợp lỗi thì vẫn ghi lại, chỉ là không hỏi tới.

Sản phẩm là **một file brief** `.brainstorm/NNN-slug.md` ở thư mục làm việc, theo khuôn
[`templates/brief.md`](templates/brief.md), **mỗi module một section** `## Module · <tên>`, mỗi feature một
`### <tên feature>`. `NNN` là số kế tiếp trong
`.brainstorm/`, `slug` lowercase-kebab. File được tạo khi người dùng xác nhận bức tranh tổng quan ở cuối Bước 2.

| File của skill | Dùng ở |
| --- | --- |
| [`templates/brief.md`](templates/brief.md) | khuôn file brief, copy ra rồi điền |
| [`templates/modules.md`](templates/modules.md) | khung hỏi chung + thứ tự module + gợi ý feature cho các module hay gặp — gợi ý, không phải danh sách đóng |
| [`scripts/verify.py`](scripts/verify.py) | lint file |

```bash
python3 $SKILL/scripts/verify.py .brainstorm/NNN-slug.md    # $SKILL là thư mục chứa SKILL.md
```

### Input

Hiện tại skill chỉ dùng **đề người dùng đưa trong chat** và các câu trả lời. Đọc code / docs dự án, tài liệu đính
kèm là phần **chưa thiết kế**.

### Cờ `--auto`

Chỉ để chạy thử. Bật khi lời gọi có `--auto`. Mọi câu hỏi vẫn soạn đủ và in ra chat như khi hỏi thật, nhưng
**không gọi AskUserQuestion**: lấy đáp án khuyên dùng (câu chọn nhiều thì lấy các đáp án khuyên dùng), ghi vào
Nhật ký với cột Trả lời bắt đầu bằng `(--auto)`. Chỗ cần "đúng" coi như người dùng đã nói "đúng". Lời mời kể ở
Bước 3 coi như người dùng gõ "hỏi đi"; câu xin ví dụ coi như người dùng không nghĩ ra, lấy ví dụ soạn sẵn khuyên dùng.

## Luật hỏi — dùng cho mọi bước

| Luật | Nội dung |
| ---- | -------- |
| hỏi khi cần làm rõ | không có hạn số câu mỗi lượt. Chưa hình dung được thì hỏi; đã rõ thì không |
| tổng quan trước | chưa chốt scope và bức tranh tổng quan (Bước 1–2) thì chưa hỏi chi tiết module nào |
| hỏi mục tiêu, không hỏi nỗi khổ | "làm xong module này anh/chị muốn được gì?" kèm đáp án gợi ý. Không hỏi "đang khổ vì gì", "vì sao cần cái này". Người dùng tự kể nỗi khổ thì ghi vào **Mục tiêu** của module đó |
| dừng ở mức hình dung được | không hỏi con số, ngưỡng, thời hạn, trường hợp lỗi. "Đơn chưa thanh toán có tự huỷ không?" là làm rõ; "bao lâu thì huỷ?" để bước phân tích |
| một câu một ý | không gộp "ai duyệt và duyệt thế nào" vào một câu |
| chữ nghiệp vụ | "lưu lại để xem sau", không phải "persist vào DB" |
| đoán thì ghi giả định | thứ agent đoán mà không hỏi (vd "chỉ lễ tân dùng màn này") → `A-NN` ở Giả định, trạng thái `chờ xác nhận`, xác nhận một lượt ở Bước 4 |
| ghi ngay | mỗi câu trả lời là một dòng `Q<n>` ở Nhật ký (kèm module), giữ chữ người dùng; ý nào sinh ra từ câu đó có đuôi `(Q<n>)`. Từ Bước 3, cập nhật file sau mỗi lượt hỏi |

## Cách trao đổi

Ba dạng. Chọn theo thứ cần lấy từ người dùng:

| Dạng | Dùng khi | Cách làm |
| --- | --- | --- |
| **Questionnaire** | đoán được vài đáp án hợp lý | gọi AskUserQuestion. Mỗi câu 2–4 đáp án; đáp án tin nhất đứng đầu, `label` có "(Khuyên dùng)", `description` nói chọn thì kết quả khác đi thế nào. Đáp án loại trừ nhau thì chọn một; người dùng có thể muốn vài cái cùng lúc (feature, kênh nhận thông báo) thì `multiSelect`. Tối đa 4 câu mỗi lần gọi, cần hơn thì gọi tiếp |
| **Q&A** | cần chữ của chính người dùng: lời kể, ví dụ thật | một câu thường trong chat, rồi dừng lượt chờ người dùng viết. Không dùng AskUserQuestion |
| **Xác nhận** | đưa cách agent hiểu cho người dùng duyệt | in tóm tắt trong chat, hỏi "đúng chưa?", dừng lượt chờ trả lời bằng chữ. Không dùng AskUserQuestion. Cần chữ "đúng" rõ ràng; "tuỳ", "nghe ổn", "chắc vậy" thì hỏi lại "có chỗ nào muốn sửa không?" |

Dạng theo từng lúc:

| Lúc | Dạng |
| --- | --- |
| Bước 1 — một chữ trong đề chưa rõ nghĩa | Questionnaire, chọn một |
| Bước 1 — chọn feature cho từng module | Questionnaire, `multiSelect`, mỗi module một câu |
| Bước 2 — module chưa hình dung được ở mức tổng quan | Questionnaire, chọn một |
| Bước 2 — bức tranh tổng quan | Xác nhận |
| Bước 3 — mở đầu mỗi module | Q&A: mời kể |
| Bước 3 — mục tiêu, chỗ còn hở | Questionnaire |
| Bước 3 — ví dụ thật | Q&A; người dùng không nghĩ ra thì Questionnaire với 2–3 ví dụ soạn sẵn để chọn rồi sửa |
| Bước 3 — cuối mỗi module | Xác nhận: nói lại bằng lời mình |
| Bước 4 — chỗ nói chưa khớp, lệch mục tiêu | Questionnaire, chọn một |
| Bước 4 — giả định | Questionnaire: "Đúng (Khuyên dùng)" · "Sai — …", gom mọi giả định một lượt |
| Bước 4 — tóm tắt cuối | Xác nhận |

Người dùng đổi dạng lúc nào cũng được:

- Gõ vào Other ⇒ lấy chữ đó làm câu trả lời; chữ đó mở ý mới thì câu kế tiếp hỏi vào ý đó.
- Huỷ một lượt hỏi (bấm Esc / từ chối) hay gõ thẳng vào chat ⇒ **không dừng**: chờ họ viết xong, ghi phần họ viết
  vào file (`Q<n>` với câu hỏi `(tự viết)`), rồi chỉ hỏi chỗ còn hở. Câu đang hỏi dở mà phần họ viết đã trả lời thì bỏ.
- Đang Q&A mà gõ "hỏi đi" ⇒ chuyển sang Questionnaire.

### Khi câu trả lời chưa dùng được

Hỏi lại bằng cách khác — cụ thể hơn, có ví dụ, có đáp án — không lặp y nguyên câu cũ. Một chỗ hỏi lại tối đa hai lần;
vẫn chưa rõ thì ghi vào Câu hỏi còn mở rồi đi tiếp.

| Trường hợp | Ví dụ | Làm gì |
| --- | --- | --- |
| chung chung | "đầy đủ", "đẹp", "như app khác" | Questionnaire, mỗi đáp án là một cách hiểu cụ thể: "đầy đủ là thấy được những gì?" |
| hai nghĩa | "gửi cho quản lý", khi có cả quản lý chi nhánh lẫn quản lý vùng | Questionnaire, mỗi nghĩa một đáp án |
| không biết, chưa nghĩ tới | "chưa nghĩ tới", "tuỳ em" | có cách hợp lý thì đưa nó làm đáp án khuyên dùng, người dùng chọn thì ghi như câu trả lời. Việc do người khác quyết thì ghi Câu hỏi còn mở kèm ai trả lời được |
| lạc câu hỏi | hỏi "ai nhận cảnh báo?", người dùng kể cảnh báo gửi lúc mấy giờ | ghi phần đã nói vào đúng chỗ nó thuộc, nói ngắn đã ghi ở đâu, rồi hỏi lại câu cũ bằng cách khác — thường đổi sang Questionnaire |
| chọi câu trước | ở Tài khoản nói khách chỉ để email, ở Nhắc lịch muốn nhắc qua tin nhắn | hỏi ngay, trích nguyên văn hai câu kèm `Q<n>`; đáp án: giữ câu trước · giữ câu sau · cả hai đúng, mỗi câu cho một trường hợp |
| mở ý ngoài scope | đang ở Đặt lịch, người dùng nói muốn khách tích điểm | ghi lại, hỏi một câu: thêm vào scope (module, feature nào) hay để Ngoài phạm vi |
| đi vào chi tiết | "quá 15 phút thì huỷ" | ghi nguyên văn vào feature, không hỏi sâu thêm |

Ở Nhật ký, mỗi lần hỏi lại là một dòng `Q<n>` mới. Câu trả lời lạc câu hỏi ghi theo module mà nó thực sự nói tới.

## Bước 1 — Tách module & chọn scope

1. Đọc đề, tách thành **module**: mỗi danh từ / tính năng người dùng nêu là một module ứng viên. Hai chữ cùng một thứ
   thì gộp; một chữ quá rộng thì tách (vd "quản lý" thường là vài module). Module ngầm mà module khác cần (vd có "phân
   quyền" thì cần "đăng nhập") thì đề xuất thêm, ghi rõ là đề xuất thêm.
2. Xếp **thứ tự phụ thuộc** theo [`templates/modules.md`](templates/modules.md) "Thứ tự module": nền → nghiệp vụ chính → phản ứng →
   bảo vệ & vận hành.
3. Mỗi module dựng 2–4 **feature** ứng viên: lấy từ gợi ý của module đó trong `modules.md` (hay tự dựng theo khung
   chung nếu module không có ở đó), chọn cái hợp đề nhất. Mỗi feature một tên ngắn và một câu mô tả người dùng làm
   được gì.
4. In bảng trong chat — `Module · feature · dựa vào module nào` — rồi hỏi **checkbox**: mỗi module một câu
   `multiSelect` "**<Module>** — chọn feature muốn làm", đáp án là các feature (`label` = tên, `description` = mô
   tả + chọn thì kéo theo gì). Feature agent tin là cần thì `label` có "(Khuyên dùng)". Nhiều module thì hỏi nhiều
   câu trong một lần gọi, quá 4 câu thì gọi tiếp. Trên câu hỏi nhắc: *"Thiếu module hay feature thì gõ vào Other."*
5. **Cái được tick là scope.** Module không tick feature nào ⇒ cả module vào **Ngoài phạm vi**; feature không tick
   mà dễ bị tưởng là có ⇒ cũng vào **Ngoài phạm vi**. Người dùng thêm feature hay module qua Other ⇒ đưa vào scope.
   Module chỉ có trong scope vì module khác cần (vd Đăng nhập cho Phân quyền) mà người dùng bỏ ⇒ hỏi lại một câu: "Phân
   quyền cần biết ai đang dùng — đăng nhập đã có sẵn ở đâu chưa?"

Chữ nào trong đề chưa rõ nghĩa tới mức không dựng được feature (vd "dữ liệu" là dữ liệu đang có để dùng, hay là
tính năng cho người dùng quản lý dữ liệu?) thì hỏi **trước** lượt checkbox, một câu riêng.

**Ví dụ.** Đề: *"tôi có bigquery có data warehouse các nguồn / tôi muốn làm tính năng sau: báo cáo, cảnh báo,
insight, phân quyền hạn, dữ liệu"*. Bảng in ra chat, mỗi dòng module thành một câu checkbox:

| Module | Feature (checkbox) | Dựa vào |
| --- | --- | --- |
| Dữ liệu | định nghĩa chỉ số chung · theo dõi độ mới · kiểm chất lượng · thêm nguồn mới | — |
| Đăng nhập *(đề xuất thêm)* | đăng nhập tài khoản công ty · quản lý người dùng | — |
| Báo cáo | dashboard dựng sẵn · lọc & xem chi tiết · tự tạo báo cáo · xuất & gửi định kỳ | Dữ liệu |
| Cảnh báo | vượt ngưỡng · bất thường · người dùng tự đặt · nguồn ngừng cập nhật | Dữ liệu · Báo cáo |
| Insight | tóm tắt định kỳ · tự phát hiện điểm đáng chú ý · hỏi bằng lời · giải thích nguyên nhân | Dữ liệu · Báo cáo |
| Phân quyền | vai trò · theo dashboard · theo phạm vi dữ liệu · che cột nhạy cảm | mọi module trên |

- "dữ liệu" trong đề là kho BigQuery **đang có**, nên xếp làm module nền; feature của nó là thứ công cụ làm **trên**
  kho đó. Chưa chắc thì hỏi một câu trước lượt checkbox.
- "Đăng nhập" không có trong đề nhưng Phân quyền cần nó, nên agent đề xuất thêm và ghi rõ.

## Bước 2 — Tổng quan

Scope đã có từ Bước 1. Bước này chỉ hỏi thêm khi một module trong scope **chưa hình dung được ở mức tổng quan** —
vd module Thanh toán: "thanh toán online hay tại quầy?"; module Dữ liệu: "kho đang gom những nguồn nào?". Không có gì
cần hỏi thì sang ngay bức tranh tổng quan.

In **bức tranh tổng quan**:

```
Bức tranh tổng quan:
- <Module 1>:  <các feature đã chọn>
- <Module 2>:  <các feature đã chọn>
- …
- Ngoài phạm vi: <module / feature không chọn>
Đúng chưa, hay sửa module nào?
```

Cần một câu "đúng" rõ ràng. "Tuỳ anh/chị", "nghe ổn" thì hỏi lại: "có module nào muốn thêm / bỏ feature không?".
Được "đúng" ⇒ copy `templates/brief.md` ra `.brainstorm/NNN-slug.md`, điền **Tổng quan** (đề nguyên văn, bảng module, Ngoài
phạm vi), **Ai dùng** (những ai đã lộ ra từ đề), mỗi module một section có heading cho từng feature đã chọn (chưa có
gạch đầu dòng), Nhật ký.

## Bước 3 — Làm rõ từng module

Đi lần lượt từng module theo thứ tự đã chốt. Mỗi module bốn nhịp:

**1. Mời kể.** Mở đầu bằng lời mời, không phải bằng câu hỏi — người dùng thường biết module đó muốn ra sao hơn mọi đáp
án agent đoán. In một tin ngắn rồi **dừng lượt, chờ người dùng viết** (chữ thường trong chat, không dùng
AskUserQuestion):

```
Module Cảnh báo — feature đã chọn: vượt ngưỡng · bất thường · người dùng tự đặt.
Anh/chị kể ngắn module này muốn chạy thế nào (vài dòng là đủ, gạch đầu dòng cũng được).
Muốn hỏi luôn thì gõ "hỏi đi".
```

Người dùng viết xong ⇒ ghi nguyên văn vào Nhật ký (`Q<n>` · câu hỏi `Mô tả module <tên>`), rút ý vào các feature,
rồi chỉ hỏi chỗ còn hở. Gõ "hỏi đi" ⇒ hỏi từ đầu.

**2. Mục tiêu.** Lời kể chưa nói module này để đạt được gì thì hỏi một câu có sẵn đáp án, vd *"Làm xong module Cảnh
báo, anh/chị muốn được gì nhất?"* — "biết sớm khi số xấu, trước khi bị hỏi" · "không phải mở dashboard mỗi sáng" ·
"ai phụ trách thì người đó nhận". Mục tiêu dùng để chọn đáp án khuyên dùng ở các câu sau. Thấy feature không phục vụ
mục tiêu, hay mục tiêu cần một feature chưa tick, thì hỏi.

**3. Hỏi chỗ hở.** Mỗi feature đi qua khung trong `modules.md`: **cái gì · ai · khi nào · nhận lại gì**, cộng cột
"Hỏi để làm rõ" của feature đó nếu có. Khía cạnh nào lời kể đã rõ thì bỏ qua. Cuối cùng cần **một ví dụ thật**: hỏi
mở trong chat "kể một lần cụ thể anh/chị sẽ dùng cái này". Người dùng không nghĩ ra thì hỏi lại bằng AskUserQuestion
với 2–3 ví dụ soạn sẵn để chọn rồi sửa.

**4. Nói lại.** Xong module, agent nói lại 3–5 dòng **bằng lời mình**: mục tiêu, từng feature trông ra sao khi dùng,
kèm ví dụ. In trong chat rồi hỏi *"Đúng ý chưa, hay chỗ nào chưa phải?"* và dừng lượt — không dùng AskUserQuestion,
vì chỗ cần sửa không đoán trước được. Chỗ nào sai thì hỏi lại đúng chỗ đó. Đây là cách chính
để bắt hiểu lầm: người dùng nhận ra "không phải thế" dễ hơn tự nói ra "phải thế này".

Module xong khi người dùng nói "đúng" ở nhịp 4. Khía cạnh nào người dùng chưa trả lời được thì vào **Câu hỏi còn mở**
kèm ai trả lời được, đừng đoán thay.

Đầu mỗi lượt hỏi in tiến độ, vd `Tài khoản ✓ · Đặt lịch ◐ 2/4 feature · Nhắc lịch ○ · Thanh toán ○`. Module sau dùng
lại kết quả module trước — vd Nhắc lịch hỏi nhắc qua đâu thì đáp án lấy từ thông tin liên lạc đã nói ở Tài khoản.

Ghi vào file sau mỗi lượt:

- mục tiêu → dòng `**Mục tiêu:** … (Nguồn: Q<n>)` của module;
- ý đã rõ → gạch đầu dòng dưới `### <feature>`, giữ chữ người dùng, đuôi `(Q<n>)`;
- ví dụ → `- Ví dụ: … (Q<n>)`;
- người mới lộ ra → bảng **Ai dùng**;
- người dùng thêm feature giữa chừng → thêm vào bảng Tổng quan và thêm heading; bỏ feature → chuyển sang Ngoài phạm vi.

Mọi module xong ⇒ sang Bước 4.

## Bước 4 — Chốt

1. Chạy `verify.py`, sửa tới khi hết ERROR.
2. Tự đọc lại file, tìm những chỗ sau — code không bắt được:

   | Soát | Tìm |
   | ---- | --- |
   | nói chưa khớp | hai câu trả lời kéo hai hướng: nhắc lịch qua tin nhắn nhưng ở Tài khoản nói khách chỉ để email |
   | lệch mục tiêu | mục tiêu "không phải mở dashboard" mà mọi feature đều là màn phải mở ra xem |
   | chưa hình dung được | feature chưa có ví dụ, hay còn chữ "đầy đủ", "thông minh", "như app khác" |
   | chưa rõ ai dùng | feature không gắn với ai trong bảng Ai dùng |

   Mỗi chỗ tìm được là **một câu hỏi**, quay lại Bước 3 — không tự sửa thay người dùng.
3. **Xác nhận giả định**: gom mọi `A-NN` đang `chờ xác nhận` (đáp án "Đúng (Khuyên dùng)" · "Sai — …"). Đúng ⇒
   `đã xác nhận`; sai ⇒ sửa ý liên quan, giả định thành `bị bác`.
4. In tóm tắt trong chat: mỗi module một dòng (mục tiêu + feature) · Ngoài phạm vi · câu hỏi còn mở và ai trả lời ·
   đường dẫn file. Hỏi: *"Đây đúng là điều anh/chị muốn chưa?"* rồi dừng lượt chờ trả lời bằng chữ — cần "đúng" rõ
   ràng như Bước 2.
5. Được "đúng" ⇒ đổi `status: confirmed`, chạy lại `verify.py`, rồi **dừng lượt**. Đề xuất bước sau, không tự làm:
   - **phân tích** — viết user story, AC, luật có con số, trường hợp lỗi, ưu tiên từ file này (skill riêng, chưa có);
   - `design-uiux` — dựng prototype để người dùng thấy tận mắt và sửa tiếp.

## Viết file

- Giữ chữ của người dùng. Một gạch đầu dòng một ý, đuôi là nguồn: `(Q<n>)`, `(A-<n>)` hoặc `(đề)`; nhiều nguồn ngăn
  bằng dấu phẩy.
- Dòng mô tả dưới `### <feature>`: một câu ai làm được gì, không có nguồn.
- **ID xuyên suốt file**: Q, A, OQ đánh số liền từ 01 (Q từ 1), không đánh lại theo module.
- **Không viết user story, AC, luật đánh số, ưu tiên** — đó là việc của bước phân tích. `verify.py` báo WARN khi thấy.
- **Không viết giải pháp kỹ thuật** — bảng nào, API nào, framework nào. Hệ thống người dùng **đang có** và phải giữ
  (vd "dữ liệu đang ở BigQuery") là sự thật của đề, ghi được.
- Người dùng nói tiếng gì thì file viết tiếng đó; tên section, `Module ·`, `Mục tiêu`, `Ví dụ` giữ nguyên để
  `verify.py` đọc được.

## Dấu hiệu đang làm sai

- Hỏi "bao lâu", "bao nhiêu", "trùng / thiếu / quá hạn thì sao" khi người dùng chưa nhắc tới — đó là phân tích.
- Viết user story, AC, luật đánh số vào file.
- Hỏi "vì sao cần", "đang khổ vì gì".
- Hỏi chi tiết module khi bức tranh tổng quan chưa được "đúng".
- Vào module mới bằng câu hỏi thay vì mời người dùng kể trước.
- Xong module mà không nói lại cho người dùng xác nhận.
- Coi việc người dùng huỷ một lượt hỏi là dừng, hoặc hỏi lại y nguyên lượt vừa bị huỷ.
- Nhận "tuỳ anh/chị" hay "nghe ổn" là đồng ý.
- Câu trả lời chưa rõ mà hỏi lại y nguyên câu cũ, hoặc hỏi lại quá hai lần cùng một chỗ.
- Bỏ phần người dùng trả lời lạc câu hỏi thay vì ghi vào đúng chỗ nó thuộc.
- Tạo file trước khi bức tranh tổng quan được "đúng".
- Tự sửa chỗ nói chưa khớp thay vì hỏi.
- Viết tên bảng mới, endpoint, thư viện vào file.
- Được "đúng" ở Bước 4 rồi còn gọi tool làm tiếp bước sau.
