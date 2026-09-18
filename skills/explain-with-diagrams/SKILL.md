---
name: explain-with-diagrams
description: Giải thích một cơ chế, một bug, một luồng quyết định hay một kiến trúc bằng sơ đồ mermaid nền tối, màu theo ngữ nghĩa, kèm link mermaid.live/edit mở được ngay — mở đầu bằng bối cảnh · hiện tượng · nguyên nhân, rồi mỗi sơ đồ một section gồm link → giải thích (không dán nguồn mermaid vào chat). Dùng khi user nói "vẽ sơ đồ", "diagram hoá", "mermaid", "vẽ cho dễ hiểu", "mô tả bằng sơ đồ", khi user hỏi "tại sao X" mà câu trả lời có nhiều tầng / nhiều nhánh / nhiều trạng thái, hoặc khi đã giải thích bằng chữ mà user vẫn chưa nắm được. Kèm `mermaid-link.mjs` sinh link offline + verify round-trip.
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

Trước hết **dựng bài toán** bằng ba đoạn ngắn, rồi mới tới các sơ đồ. Mỗi sơ đồ là **một section**,
đúng thứ tự này:

````
**Bối cảnh:** …
**Hiện tượng:** …
**Nguyên nhân:** …

# Section 1 — <tên sơ đồ, nói nó trả lời câu gì>

**[▶ Mở trên mermaid.live](https://mermaid.live/edit#pako:…)**

<mô tả / giải thích / cách hiểu — 3 khối, xem dưới>

# Section 2 — …
````

Hai phần, hai việc khác nhau — thiếu phần nào cũng mất một đường dùng:

| Phần | Nó cho cái gì |
| --- | --- |
| **Link `/edit`** | thấy hình, phóng to, pan/zoom, sửa tại chỗ, đổi theme, export PNG/SVG, copy nguồn |
| **Phần chữ** | lời giải — thứ hình không nói được |

### Ba đoạn mở đầu

Sơ đồ không tự nói nó đang giải cái gì. Ba đoạn này viết **một lần** ở đầu câu trả lời — không lặp
lại ở mỗi section — mỗi đoạn 1–3 câu:

| Đoạn | Trả lời | Lấy từ đâu |
| --- | --- | --- |
| **Bối cảnh** | hệ thống nào, ai đang chạy cái gì, chuyện này xuất hiện trong tình huống nào | những gì user kể + code đã đọc |
| **Hiện tượng** | user nhìn thấy cái gì — số thật, dòng log thật, cái trong ảnh chụp | đúng bằng chứng user đưa, chưa diễn giải |
| **Nguyên nhân** | vì sao ra thế — một câu kết luận | kết quả điều tra |

**Nguyên nhân** ở đây là **kết luận**, nói được mà chưa cần nhìn hình. Còn khối *Chỗ đáng nhìn* dưới
mỗi sơ đồ chỉ ra **chỗ trên hình** làm kết luận đó đứng được. Cùng một chuyện, hai loại bằng chứng —
đừng bê nguyên câu từ chỗ này sang chỗ kia.

Giải thích một cơ chế đang chạy đúng (kiến trúc, luồng quyết định) thì không có hiện tượng và nguyên
nhân để nói: giữ **bối cảnh**, thay hai đoạn kia bằng một câu *sơ đồ dưới đây trả lời câu hỏi gì*.

❌ Đừng mở bằng *"Dưới đây là sơ đồ giải thích…"* — đó là mô tả việc mình vừa làm, không phải bối cảnh.

### Không dán nguồn sơ đồ vào câu trả lời

Khối ```mermaid dài hơn cả phần chữ, chiếm hết màn hình, và **không cho thêm gì** — mở link ra là có
hình đầy đủ, phóng to được, export được, copy nguồn được ngay trong editor. Câu trả lời chỉ có link
+ chữ.

User xin nguồn để dán vào doc/PR ⇒ đưa **file `.mmd`** đã sinh sẵn cho `mermaid-link.mjs`, hoặc chỉ
sang tab *Code* trên mermaid.live. Đừng dán lại vào chat.

### Ba khối của phần giải thích

Viết theo đúng thứ tự, mỗi khối 1–3 câu:

| Khối | Trả lời | Ví dụ |
| --- | --- | --- |
| **1· Bảng màu** | mỗi màu nghĩa là gì | *"**đỏ** = điều kiện đang hỏng · **tím nhạt** = câu hỏi · **xám** = kết luận nghỉ"* |
| **2· Cách đọc** | đi từ đâu, dừng ở đâu, thứ tự có ý nghĩa không | *"đi từ trên xuống, dừng ở ô kết luận đầu tiên gặp"* |
| **3· Chỗ đáng nhìn** | cái **không** đọc ra được từ hình | *"ba nhánh đều đúng khi đứng riêng; sai nằm ở hình dạng — ô đỏ nối bằng `\|\|` nên nó có quyền phủ quyết"* |

Khối 3 là khối duy nhất không thể bỏ. Nó là **lý do** section đó tồn tại; hai khối trên chỉ là chú
giải. Viết được khối 3 thành một câu sắc thì sơ đồ mới có giá.

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

- [ ] Mở đầu có bối cảnh · hiện tượng · nguyên nhân (không phải bug ⇒ bối cảnh + câu hỏi sơ đồ trả lời)
- [ ] Mỗi sơ đồ một `# Section`: link → phần chữ, **không** có khối ```mermaid trong câu trả lời
- [ ] `roundtrip_ok=true` cho mọi link
- [ ] Nguồn có `%%{init}%%` dark **và** `subgraph ALL` sơn nền
- [ ] Chuỗi chính quá 7–8 node ⇒ `LR` ở **cả** dòng `flowchart` lẫn `direction` trong `subgraph ALL`
- [ ] Màu khai bằng `classDef`, mỗi vai một màu, có `color:`
- [ ] Phần chữ có đủ 3 khối, **khối 3 nói được một điều không đọc ra từ hình**
- [ ] Không có chú thích/legend nhét trong hình
