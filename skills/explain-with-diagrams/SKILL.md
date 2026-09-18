---
name: explain-with-diagrams
description: Giải thích một cơ chế, một bug, một luồng quyết định hay một kiến trúc bằng sơ đồ mermaid nền tối, màu theo ngữ nghĩa, kèm link mermaid.live/edit mở được ngay — dựng vấn đề bằng `Context` · `Problem` · `Root cause` viết bằng ngôn ngữ thường (bớt mã số, không đếm ký hiệu), mặc định một section, rồi link → giải thích (không dán nguồn mermaid vào chat). Dùng khi user nói "vẽ sơ đồ", "diagram hoá", "mermaid", "vẽ cho dễ hiểu", "mô tả bằng sơ đồ", khi user hỏi "tại sao X" mà câu trả lời có nhiều tầng / nhiều nhánh / nhiều trạng thái, hoặc khi đã giải thích bằng chữ mà user vẫn chưa nắm được. Kèm `mermaid-link.mjs` sinh link offline + verify round-trip.
---

# Giải thích bằng sơ đồ

## Mental model

**Hình mang cấu trúc. Câu trả lời mang lời giải.** Hai thứ này không đổi chỗ cho nhau được:

- Hình trả lời *"có những gì, nối với nhau ra sao, đi theo thứ tự nào"*.
- Chữ trả lời *"vì sao lại thế, chỗ nào đáng nhìn, cái gì không đọc ra được từ hình"*.

Nhét lời giải vào trong hình thì hình thành một trang văn bản có viền, và người đọc mất đúng cái mà
sơ đồ sinh ra để cho: **nhìn một phát thấy hình dạng**.

Một sơ đồ đáng vẽ khi câu trả lời có **nhiều tầng**, **nhiều nhánh**, hoặc **thứ tự ưu tiên**. Ba cái
đó viết bằng văn xuôi thì người đọc phải tự dựng hình trong đầu. Còn một danh sách phẳng, một bảng
so sánh, hay ba dòng tuần tự thì **đừng vẽ** — bảng đọc nhanh hơn.

**Phạm vi:** sơ đồ **trả lời trong chat** — nền tối cứng, kèm link mở được ngay. Hình để dán vào
tài liệu là việc khác: ở đó hình phải đọc được trên **cả** nền sáng lẫn nền tối, nên dùng palette
pastel + chữ đậm chứ không phải bộ dưới đây.

## Chọn loại sơ đồ

Chọn theo **câu hỏi người đọc đang hỏi**, không theo cái nào nhìn ngầu hơn.

| Người đọc đang hỏi | Loại |
| --- | --- |
| *"gồm những gì, nối nhau ra sao"* · *"luật nào quyết định"* · *"đi đường nào"* · *"xếp tầng thế nào"* | **`flowchart` — mặc định** |
| *"ai gọi ai, theo thứ tự nào"* — N bên **trao đổi qua lại**, tên từng bên là một phần câu trả lời | `sequenceDiagram` |
| *"đi từ trạng thái nào sang trạng thái nào, do event gì"* — transition có tên, có vòng lặp | `stateDiagram-v2` |
| *"bảng nào khoá vào bảng nào, một-nhiều hay nhiều-nhiều"* | `erDiagram` |
| *"việc nào trước việc nào, dài bao lâu"* — có **ngày thật** | `gantt` |
| nhánh · merge của git | `gitGraph` |
| còn lại (`mindmap` · `journey` · `timeline` · `classDiagram` · `quadrantChart`…) | đừng dùng trừ khi user xin — bảng thường đọc nhanh hơn |
| `C4Context` · `C4Container` | **cấm** — dùng `flowchart` có vùng |

**`flowchart` là mặc định** vì nó cho overview tốt nhất: có shape mang nghĩa, có `subgraph` để phân
vùng, sơn được nền tối, và đọc được cả khi người ta chỉ liếc qua. Ba loại dưới nó là **ngoại lệ có
lý do**, không phải lựa chọn ngang hàng.

Hai câu gỡ khi phân vân:

- **flowchart hay sequence?** Bỏ tên các bên đi — hình còn đúng không? Còn đúng ⇒ `flowchart`.
  Một trục thời gian một chiều mà không ai trả lời ai thì vẫn là `flowchart`.
- **flowchart hay state?** Câu hỏi là *"đang ở ô nào"* (⇒ state) hay *"cái gì quyết định ra ô đó"*
  (⇒ flowchart)? Ví dụ: 8 ô trạng thái agent nhưng câu hỏi là thứ tự ưu tiên của luật suy ra ô ⇒
  `flowchart`, không phải `stateDiagram`.

## Khuôn câu trả lời

Vấn đề dựng bằng bộ ba **`Context` · `Problem` · `Root cause`**, rồi tới link sơ đồ, rồi tới phần
chú giải. Mặc định là **một section duy nhất**:

````
**Context:** …
**Problem:** …

**[▶ Mở trên mermaid.live](https://mermaid.live/edit#pako:…)**

**Colors:** …
**How to read:** …
**Root cause:** …
````

Link và chữ, hai việc khác nhau — thiếu phần nào cũng mất một đường dùng:

| Phần | Nó cho cái gì |
| --- | --- |
| **Link `/edit`** | thấy hình, phóng to, pan/zoom, sửa tại chỗ, đổi theme, export PNG/SVG, copy nguồn |
| **Phần chữ** | lời giải — thứ hình không nói được |

### Bộ ba nói gì

Mỗi nhãn 1–3 câu:

| Nhãn | Trả lời | Lấy từ đâu |
| --- | --- | --- |
| **`Context`** | hệ thống nào, ai đang chạy cái gì, chuyện này xuất hiện trong tình huống nào | user kể + code đã đọc |
| **`Problem`** | nhìn thấy cái gì sai — số thật, dòng log thật, cái trong ảnh chụp | đúng bằng chứng user đưa, chưa diễn giải |
| **`Root cause`** | vì sao ra thế — một câu kết luận | kết quả điều tra |

`Context` + `Problem` đứng **trên** link còn `Root cause` đứng **dưới**, vì hình là **bằng chứng**:
dựng câu hỏi, xem hình, rồi mới kết luận. Đảo lại thì kết luận đứng trước thứ chứng minh nó.

Dùng `Root cause` chứ không `Tracing`: tracing là **việc đi tìm**, còn nhãn này mang **thứ tìm ra**.

Giải thích một cơ chế đang chạy đúng (kiến trúc, luồng quyết định) thì không có gì sai để kể: giữ
`Context`, đổi `Problem` thành **câu hỏi** mà sơ đồ trả lời, `Root cause` thành **câu trả lời**.

❌ Đừng mở bằng *"Dưới đây là sơ đồ giải thích…"* — đó là mô tả việc mình vừa làm, không phải context.

### Nói bằng ngôn ngữ thường, bớt mã số

Mặc định: **không nhắc mã số**. `065`, `P13`, `CP-23.15` chỉ có nghĩa với người đã mở đúng file đó;
với người đọc câu trả lời nó là chữ rỗng, và câu bắt đầu bằng một mã là câu viết cho người đã biết
sẵn. Nói **việc gì xảy ra** bằng chữ đời thường.

❌ *"065 để lại 15 probe đánh số P1…P15; 043 để lại một gate."*

✅ *"Việc tối ưu đường đọc số session đã đo xong và có số thật: đỉnh 41 session bẩn cùng lúc. Nhưng
cơ chế dot đổi màu realtime thì chưa ai nghiệm thu — tới giờ chưa từng được xác nhận kể cả với một
session đang gõ."*

Bản ❌ đếm **số lượng ký hiệu**, phải mở hai file plan mới hiểu. Bản ✅ đọc một lượt là biết việc nào
đã có bằng chứng, việc nào còn hổng — không mở file nào.

Cần dẫn nguồn thì gắn mã ở **cuối** câu, dạng chú thích hoặc link — *"(plan 065)"* — chứ đừng để nó
làm chủ ngữ. Và đừng viết *"15 probe"* khi điều đáng nói là *"đã đo và có số"*, đừng viết *"một
gate"* khi điều đáng nói là *"chưa ai xác nhận"*.

Luật này áp cả cho **nhãn node trên hình**: một ô tên `P13` không nói gì, ô tên *"đo đỉnh session
cùng lúc"* thì đọc ra ngay.

### Khi nào mới tách nhiều section

Một bài toán ⇒ **một section, một sơ đồ**, bộ ba viết một lần. Đó là mặc định, vì người đọc theo
được một mạch và không phải nhớ section nào đang nói chuyện gì.

Tách thành nhiều section chỉ khi **yêu cầu chứa nhiều bài toán khác nhau** — khác hiện tượng, khác
nguyên nhân, sửa ở chỗ khác nhau. Khi đó:

- Đầu câu trả lời giữ **một** bộ ba nói cả bài toán chung.
- Mỗi section có bộ ba **riêng**, hẹp lại đúng mảnh của nó, để vào section là quên được phần còn lại.
- ❌ Đừng bê nguyên văn bộ ba chung xuống section. Trùng chữ nghĩa là section đó không có vấn đề riêng.

Dấu hiệu tách sai: hai section cùng một hiện tượng, hoặc `Root cause` của chúng là một câu nói theo
hai cách ⇒ gộp lại.

### Không dán nguồn sơ đồ vào câu trả lời

Khối ```mermaid dài hơn cả phần chữ, chiếm hết màn hình, và **không cho thêm gì** — mở link ra là có
hình đầy đủ, phóng to được, export được, copy nguồn được ngay trong editor. Câu trả lời chỉ có link
+ chữ.

User xin nguồn để dán vào doc/PR ⇒ đưa **file `.mmd`** đã sinh sẵn cho `mermaid-link.mjs`, hoặc chỉ
sang tab *Code* trên mermaid.live. Đừng dán lại vào chat.

### Ba khối dưới link

Viết theo đúng thứ tự, mỗi khối 1–3 câu:

| Khối | Trả lời | Ví dụ |
| --- | --- | --- |
| **`Colors`** | mỗi màu nghĩa là gì | *"**đỏ** = điều kiện đang hỏng · **tím nhạt** = câu hỏi · **xám** = kết luận nghỉ"* |
| **`How to read`** | đi từ đâu, dừng ở đâu, thứ tự có ý nghĩa không | *"đi từ trên xuống, dừng ở ô kết luận đầu tiên gặp"* |
| **`Root cause`** | chỗ **trên hình** làm kết luận đứng được — cái không đọc thẳng ra từ nhãn | *"ba nhánh đều đúng khi đứng riêng; sai nằm ở hình dạng — ô đỏ nối bằng `\|\|` nên nó có quyền phủ quyết"* |

`Root cause` là khối duy nhất không thể bỏ. Nó là **lý do** section đó tồn tại; hai khối trên chỉ là
chú giải. Viết được nó thành một câu sắc thì sơ đồ mới có giá.

❌ Không diễn lại nhãn đã có trên hình (*"ô A hỏi inflight > 0, nếu đúng thì sang ô B"*) — user đọc
được rồi.

## Nguồn sơ đồ — sáu luật cứng

### 1· Nền phải tối thật

`theme: 'dark'` **một mình không đủ** — nó chỉ đổi màu node, canvas vẫn trắng. Cần cả hai:

```
%%{init: {'theme':'dark', 'themeVariables': {'background':'#0d1117'}}}%%
flowchart TD
    subgraph ALL[" "]
    …toàn bộ node…
    end
    style ALL fill:#0d1117,stroke:#0d1117
```

Khối `subgraph ALL` bọc **tất cả** node mới là thứ thật sự sơn nền. Lề ngoài SVG trên mermaid.live
vẫn theo toggle sáng/tối của chính site đó (localStorage) — **nói ra cho user biết**, đừng im.

### 2· Màu theo **ngữ nghĩa**, khai bằng `classDef`

Không tô vài ô cho có màu. Mỗi *loại* node một màu, khai một lần rồi `class` vào:

```
classDef bug fill:#5a1e1e,stroke:#ff7b72,color:#ffdedb,stroke-width:3px
class A,FAIL bug
```

| Vai trò | fill | stroke | color |
| --- | --- | --- | --- |
| nguồn dữ liệu · điểm vào | `#10324a` | `#58a6ff` | `#cfe8ff` |
| chỗ hỏng · `failed` | `#5a1e1e` | `#ff7b72` | `#ffdedb` |
| suy ra · cảnh báo | `#5a4a1e` | `#e3b341` | `#fff6d5` |
| kết luận "đang chạy" · thành công | `#14532d` | `#4ade80` | `#dcfce7` |
| trung tính · đã nghỉ · `done` | `#2a2f36` | `#8b949e` | `#d6dbe1` |
| câu hỏi · nhánh quyết định | `#1c2431` | `#8b9cff` | `#dfe3ff` |
| chờ người | `#5a3410` | `#ffb454` | `#ffe9cc` |
| biến đổi · nén · xử lý | `#3a2a5a` | `#bc8cff` | `#ece0ff` |
| song song · chờ con | `#14453d` | `#39d3bb` | `#d6fff7` |

Pastel sáng (`#ffdddd`, `#ddffdd`) là màu cho nền trắng — trên nền tối nó thành mảng chói. Luôn khai
cả `color:` (màu chữ), nếu không mermaid để chữ tối trên nền tối ở vài node.

**Nhuộm cạnh** theo màu đích khi sơ đồ có hai kết cục đối nhau — nhìn màu cạnh là biết nhánh đó dẫn
về đâu: `linkStyle 1 stroke:#ff7b72,stroke-width:4px`. Index đếm từ **0**, theo thứ tự cạnh xuất hiện
trong nguồn; `A --> B & C` là **hai** cạnh. Đếm sai chỉ tô nhầm cạnh, không vỡ hình.

### 3· Không chú thích trong hình

Không `subgraph "Ghi chú"`, không node legend. Chú giải sống trong câu trả lời (khối 1–3 ở trên).

### 4· Một chủ đề = **một** loại sơ đồ, giữ nguyên qua các lượt

Vẽ lại cùng một thứ ở lượt sau thì **giữ nguyên loại sơ đồ, thứ tự node, tên section**. Người đọc đã
dựng bản đồ trong đầu từ lượt trước; đổi hình là bắt họ học lại từ đầu, và họ sẽ tưởng nội dung đã
đổi chứ không phải chỉ cái vỏ.

Buộc phải đổi (ràng buộc kỹ thuật, phát hiện hình cũ sai) ⇒ **nói ra một câu ngay dưới hình**: đổi
cái gì, vì sao. Đổi im lặng là lỗi.

⚠️ Bẫy đã dính: `sequenceDiagram` **không có `subgraph`**, nên không sơn được nền tối bằng khối
`ALL` — canvas của nó trong suốt, theo nền site. Đừng vì thế mà lặng lẽ đổi sang `flowchart`: loại
sơ đồ chọn theo **câu hỏi** (xem *Chọn loại sơ đồ*), chọn xong thì giữ, và nếu `sequenceDiagram` là
đúng loại thì **chấp nhận canvas trong suốt + nói ra một câu**.

### 5· Chuỗi dài ⇒ `LR`, không `TD`

mermaid.live và mọi chỗ render inline đều **fit cả hình vào khung**. Một chuỗi 10 bước xếp theo `TD`
thành cột cao và hẹp, fit theo chiều cao ⇒ chữ nhỏ tới mức phải zoom từng đoạn mới đọc được, và mất
đúng cái sơ đồ sinh ra để cho: **nhìn một phát thấy hình dạng**. Màn hình rộng hơn cao — hình nằm
ngang dùng được hết chỗ đó.

Ngưỡng: **chuỗi chính quá 7–8 node ⇒ `LR`**. Ngắn hơn thì `TD` đọc tự nhiên hơn, giữ `TD`.

Đổi hướng phải sửa **hai chỗ** — `subgraph` có `direction` riêng và nó thắng cái khai ở dòng
`flowchart`:

```
flowchart LR
    subgraph ALL[" "]
    direction LR
    …
```

Sửa một chỗ thôi thì hình vẫn dọc như cũ, không báo lỗi gì — bẫy đã dính.

Trong hình `LR`, các nhánh song song xếp theo chiều dọc. Đó là chỗ hình được phép cao lên: một mắt
xích bị N nguồn dồn vào thì N nguồn đó nằm thành cột, đọc ra ngay là phép nhân.

### 6· Nhãn ngắn, `<br/>` để xuống dòng

Một node quá 3 dòng là dấu hiệu nó đang ôm hai ý — tách ra, hoặc đẩy phần thừa xuống phần chữ.

## Sinh link mermaid.live

```bash
node ~/.claude/skills/explain-with-diagrams/mermaid-link.mjs a.mmd b.mmd
```

Script giữ **đúng khuôn state 7 field** và tự verify round-trip. Ba điều phải nhớ:

| Điều | Vì sao |
| --- | --- |
| **`/edit`, không `/view`** | live editor có code + hình cạnh nhau, sửa tại chỗ, đổi theme, export. Cùng payload, chỉ khác path |
| **7 field**: `code` · `mermaid` · `autoSync` · `updateDiagram` · `rough` · `panZoom` · `editorMode` | thiếu 3 field cuối ⇒ site hiện diagram *"Loading URL failed"*, **không** báo lỗi gì rõ |
| **Verify round-trip rồi mới đưa** | giải mã lại payload, so từng byte. Không tự nhận là đã kiểm việc **render** — cái đó chỉ mở link mới biết |

Hỏng link mà chưa rõ vì sao ⇒ đừng đoán tiếp: nhờ user mở [mermaid.live](https://mermaid.live), gõ
đại một sơ đồ, dán URL lại. Giải mã URL đó ra là thấy đúng schema bản họ đang chạy.

⚠️ **Auto-mode classifier chặn** heredoc ghi file `.mjs` **kèm** chạy `node` trong cùng một lệnh
bash. Tách ra: Write tool cho script, Bash cho `node`. Ghi `.mmd` bằng heredoc thì không sao.

## Checklist trước khi gửi

- [ ] Có `Context` · `Problem` trên link và `Root cause` dưới link
- [ ] Không có câu nào dẫn bằng mã số — việc gì xảy ra nói bằng chữ thường, mã để cuối câu nếu cần tra
- [ ] Một bài toán ⇒ **một** section; nhiều section chỉ khi có nhiều bài toán khác nhau, mỗi cái bộ ba riêng
- [ ] Không có khối ```mermaid trong câu trả lời
- [ ] `roundtrip_ok=true` cho mọi link
- [ ] Nguồn có `%%{init}%%` dark **và** `subgraph ALL` sơn nền
- [ ] Chuỗi chính quá 7–8 node ⇒ `LR` ở **cả** dòng `flowchart` lẫn `direction` trong `subgraph ALL`
- [ ] Màu khai bằng `classDef`, mỗi vai một màu, có `color:`
- [ ] Dưới link đủ `Colors` · `How to read` · `Root cause`, và `Root cause` nói được một điều không đọc ra từ hình
- [ ] Không có chú thích/legend nhét trong hình
