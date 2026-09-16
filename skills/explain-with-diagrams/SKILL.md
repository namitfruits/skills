---
name: explain-with-diagrams
description: Giải thích một cơ chế, một bug, một luồng quyết định hay một kiến trúc bằng sơ đồ mermaid nền tối, màu theo ngữ nghĩa, kèm link mermaid.live/edit mở được ngay — mỗi sơ đồ một section, link trước, giải thích sau. Dùng khi user nói "vẽ sơ đồ", "diagram hoá", "mermaid", "vẽ cho dễ hiểu", "mô tả bằng sơ đồ", khi user hỏi "tại sao X" mà câu trả lời có nhiều tầng / nhiều nhánh / nhiều trạng thái, hoặc khi đã giải thích bằng chữ mà user vẫn chưa nắm được. Kèm `mermaid-link.mjs` sinh link offline + verify round-trip.
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

## Khuôn câu trả lời

Mỗi sơ đồ là **một section**, đúng thứ tự này:

```
# Section 1 — <tên sơ đồ, nói nó trả lời câu gì>

**[▶ Mở sơ đồ](https://mermaid.live/edit#pako:…)**

<mô tả / giải thích / cách hiểu — 3 khối, xem dưới>

# Section 2 — …
```

⚠️ **Đã có link thì KHÔNG dán khối ```mermaid nữa.** Dán cả hai là bắt user cuộn qua 40 dòng code để
tới câu tiếp theo. Chỉ dán code khi user xin code, hoặc khi đang sửa sơ đồ trong repo.

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

## Nguồn sơ đồ — bốn luật cứng

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

### 4· Nhãn ngắn, `<br/>` để xuống dòng

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

- [ ] Mỗi sơ đồ một `# Section`, link đứng **trước** phần chữ
- [ ] `roundtrip_ok=true` cho mọi link
- [ ] Nguồn có `%%{init}%%` dark **và** `subgraph ALL` sơn nền
- [ ] Màu khai bằng `classDef`, mỗi vai một màu, có `color:`
- [ ] Không còn khối ```mermaid nào trong câu trả lời
- [ ] Mỗi section có đủ 3 khối, **khối 3 nói được một điều không đọc ra từ hình**
- [ ] Không có chú thích/legend nhét trong hình
