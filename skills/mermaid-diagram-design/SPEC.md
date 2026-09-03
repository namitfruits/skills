---
name: mermaid-diagram-design-spec
type: skill-spec
version: v1
status: active
created: 2026-08-27
---

# SPEC — `mermaid-diagram-design`

## 1. Vấn đề

Diagram kiến trúc trong tài liệu là thứ người đọc **nhìn trước khi đọc chữ**. Mermaid mặc định cho ra hình đúng nội dung nhưng khó đọc, vì 3 lỗi lặp đi lặp lại:

1. **Dùng `C4Context` / `C4Container`** — renderer C4 của mermaid không nhận `classDef`, tự quyết layout, mũi tên đi thẳng qua hộp, nhãn quan hệ đè lên nhau.
2. **Dùng `flowchart` nhưng không tô màu** — 20 hộp xám giống nhau, người đọc không thấy đâu là ranh giới trách nhiệm (ai xây gì · ai sở hữu gì · vùng mạng nào).
3. **Để màu chữ thừa hưởng theme của trang** — hình đọc được ở light mode, sang dark mode thì chữ trắng trên nền pastel, nhãn edge mất hẳn.

Sửa tay từng hình thì được, nhưng style nằm trong file instance: hình sau vẽ lại từ đầu, mỗi người một bảng màu.

## 2. Skill này làm gì

**Guidance + 1 verify script**, read-only — không sửa nội dung tài liệu. Load khi agent chuẩn bị viết/sửa một mermaid diagram. Cung cấp:

- Bảng chữ **shape** (hộp gì = nghĩa gì) → hình tự giải thích, không cần legend.
- Bảng **palette** 9 class + block `classDef` copy-paste.
- Luật **zone** (`subgraph` + tint nền) — mỗi khối trách nhiệm một nền riêng.
- Luật **edge** (liền/nét đứt/hai chiều + nhãn) và luật **layout** chống mũi tên đâm hộp.
- **Hợp đồng màu độc lập host theme** (SKILL §1.1) — mọi màu chữ pin inline để hình đọc được ở cả dark mode và light mode.
- Skeleton sẵn cho 3 loại hình hay gặp: C1 System Context · C2 Modules · User flow (swimlane).
- `verify.py` — lint cấu trúc + render 2 nền (sáng/tối) để soát bằng mắt trước khi dán.

**Vì sao có script trong một skill guidance:** checklist chữ không chặn được lỗi lặp lại. Bằng chứng: chính skeleton của skill này từng vi phạm 5 luật do nó tự viết, không ai phát hiện trong 1 tháng vì chưa từng render lại. Lint đưa phần máy kiểm được ra khỏi trí nhớ người viết; phần còn lại (lỗi thị giác) bắt buộc render + xem ảnh, không delegate được cho lint.

## 3. I/O

| | |
|---|---|
| **Input** | Nội dung diagram cần vẽ (actor / module / edge) — skill không tự bịa nội dung |
| **Output** | Block ```mermaid``` viết theo style, dán vào tài liệu đang mở |
| **Verify** | `python3 {SKILL_DIR}/verify.py {file} [--render {outdir}]` — lint mọi block ```mermaid``` trong file; `--render` ghi 2 PNG/block (nền trắng + `#0b0d10`) vào outdir chỉ định (thư mục tạm, không phải tài liệu) |
| **Mutate** | Không. Agent gọi skill để biết cách vẽ; việc ghi file vẫn thuộc agent đang giữ tài liệu |

## 4. Không thuộc phạm vi

- **Không** quyết nội dung diagram (module nào, edge nào) — đó là việc của người/agent sở hữu tài liệu.
- **Không** export ảnh để nhúng. Cần PNG/SVG cố định → dùng công cụ export riêng, hoặc để renderer của Markdown tự vẽ. `--render` chỉ để soát mắt, không phải để nhúng.
- **Không** áp luật vùng/shape/edge cho `sequenceDiagram`, `gantt`, `erDiagram` — layout engine riêng, không có `subgraph`/`classDef`/`linkStyle`. `verify.py` tự detect kind ở dòng đầu và hạ xuống chỉ check phần màu chữ (in ra dòng `INFO`).
- **Nhưng vẫn áp luật màu chữ** — mọi kind đều bị lỗi thừa hưởng màu trang. `sequenceDiagram` có khối init riêng ở SKILL §1.2; chữ message buộc dùng mid-tone `#64748b` vì nhãn message không có nền để bọc.

## 5. Anti-patterns

| Anti-pattern | Vì sao sai |
|---|---|
| `C4Context` / `C4Container` | Không nhận `classDef`, layout không điều khiển được → dùng `flowchart` |
| Thiếu dòng `%%{init: ...}%%` | Theme default ghi đè fill của `classDef` → hình ra xám hết |
| 1 màu cho mọi hộp | Mất thông tin ranh giới — thứ duy nhất người đọc cần thấy ở C1 |
| >3 hộp nhấn (dark fill) | Nhấn hết = không nhấn gì |
| Nhãn edge dài 1 dòng | Đẩy layout giãn ngang, mũi tên bắt đầu bắt chéo. Cắt bằng `<br/>` |
| Edge cross-zone khai xen giữa các `subgraph` | Dagre xếp sai thứ tự → mũi tên đâm qua cluster. Khai **sau** khi đóng hết subgraph |
| Legend box giải thích màu | Shape + tên vùng đã đủ. Legend = dấu hiệu hình chưa tự giải thích |
| Để màu chữ thừa hưởng theme host | Mermaid **không** set `color` cho `.edgeLabel` → dark mode ra chữ trắng trên pill trắng. Pin bằng `linkStyle default color:` |
| Dán diagram mà chưa render | Lỗi thị giác (nét cắt chữ, đâm cluster, chùm dây, vùng dạt sai chỗ) không hiện ở parse-pass. SKILL §9 lớp 2 bắt buộc |
| Render 1 nền rồi kết luận | Lỗi tương phản chỉ lộ ở nền đối nghịch. Luôn 2 ảnh, phải đọc như nhau |

## 6. Verify là precondition

`verify.py` sạch ERROR **và** đã xem 2 ảnh render → mới được dán. Lint fail mà vẫn dán = vi phạm skill.
