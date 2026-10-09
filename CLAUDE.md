# CLAUDE.md

## SPEC.md, SKILL.md, PLANS.md

Mỗi skill bắt buộc có **SPEC.md** và **SKILL.md**; **PLANS.md** là optional. Khuôn mẫu đủ ba file:
`skills/design-uiux/`. Skill chưa có SPEC.md thì viết SPEC lúc sửa skill đó lần tới, trước khi sửa SKILL.md.

Mỗi file trả lời một câu:

- **SPEC.md** — skill **là gì**, viết cho người sửa skill: yêu cầu và thiết kế (như PRD gộp với tài liệu kiến trúc),
  mental model, lý do của từng quyết định, thứ không thuộc phạm vi. Chỉ tả những gì skill đang làm; không ghi trạng
  thái, không ghi cách nghiệm thu. Agent không cần đọc khi chạy.
- **SKILL.md** — agent **làm thế nào**, viết cho agent đang chạy skill: từng bước, luật, bảng tra, ví dụ, dấu hiệu làm
  sai. File phải đủ để chạy, không trỏ sang SPEC để lấy luật — khi chạy agent chỉ load SKILL.md và các file SKILL.md
  khai ở dòng `spec-files` (mục dưới). Code thực thi cùng nó.
- **PLANS.md** (optional) — skill **đã đổi gì, sắp đổi gì**: các plan đã viết, mỗi plan ghi các yêu cầu SPEC
  nó chạm tới; và hàng chờ các việc chưa viết plan. Dùng khi skill đổi qua nhiều plan, cần thấy plan nào chạm yêu cầu
  nào và còn việc gì đang chờ.

Phân vân một đoạn nên để ở SPEC hay SKILL.md thì hỏi: agent đang chạy có cần đoạn này để làm đúng không? Cần thì để ở
SKILL.md; chỉ để hiểu vì sao thì để ở SPEC. Hai file được nhắc cùng một khái niệm, nhưng luật chi tiết chỉ nằm ở
SKILL.md — viết hai nơi thì sửa một bên sẽ quên bên kia.

### SPEC.md

Mục **Feature requirement** chia scope và sub-scope có mã; sau đó là mục **Technical design**, mỗi phần mở đầu bằng
dòng **Scope:** ghi mã nó phục vụ. Mã không đưa vào tiêu đề.

```markdown
- **`F1` Tên scope**
  - `F1.1` Mô tả sub-scope.

### 3.2 Design system thành token

**Scope:** `F3.1`
```

Tên scope là cụm danh từ ngắn chỉ một vùng của skill: "Giao diện page", "Shell". Mỗi sub-scope là đúng một yêu cầu,
viết theo một trong năm mẫu câu của EARS (*Easy Approach to Requirements Syntax*):

| Mẫu | Dùng khi | Câu |
| --- | --- | --- |
| Luôn đúng | không có điều kiện | `<chủ thể>` `<làm gì>`. |
| Sự kiện | có việc gì đó xảy ra | **Khi** `<sự kiện>`, `<chủ thể>` `<làm gì>`. |
| Trạng thái | đúng suốt một trạng thái | **Trong lúc** `<trạng thái>`, `<chủ thể>` `<làm gì>`. |
| Sự cố | có chỗ sai hay thiếu | **Nếu** `<sự cố>`, **thì** `<chủ thể>` `<làm gì>`. |
| Tuỳ chọn | chỉ khi bật tuỳ chọn | **Với** `<tuỳ chọn>`, `<chủ thể>` `<làm gì>`. |

```markdown
- **`F3` Giao diện page**
  - `F3.1` Page lấy màu, chữ, khoảng cách từ design system được đưa: `DESIGN.md`, file token, component của dự án.
  - `F3.2` Nếu design system không có giao diện sáng hoặc tối, thì agent suy ra giao diện đó và ghi rõ là suy ra.
  - `F3.3` Khi người xem bấm tab, lọc, modal, thêm hoặc xoá, page phản hồi trên dữ liệu giả.
```

Một sub-scope không vừa một mẫu nào thì nó đang gộp nhiều yêu cầu: tách ra.

### SKILL.md theo đúng SPEC — hai chiều

- Mọi sub-scope phải có mục SKILL.md gắn mã của nó. Agent chạy skill chỉ đọc SKILL.md, nên yêu cầu chỉ nằm trong code
  là yêu cầu agent không biết. Code được gắn `// spec: F3.1` ở đầu file để tra cứu, nhưng không thay được SKILL.md.
- Mọi mục `##` / `###` của SKILL.md có dòng `<!-- spec: F1.1 F1.2 -->` ngay dưới tiêu đề. Mục cố ý không thực thi
  yêu cầu nào ghi `<!-- spec: — -->`: mục im lặng thì không phân biệt được quên gắn với cố ý.
- Gắn mã scope (`F2`) là thực thi mọi sub-scope của nó.
- Nếu một phần luật chỉ một người đọc cần, vd agent con dựng page, thì phần đó được tách ra file riêng trong skill.
  SKILL.md khai file đó ở dòng `<!-- spec-files: references/build-page.md -->` dưới tiêu đề `#`, và chỉ rõ bước nào
  agent đọc nó. File được khai theo cùng luật với SKILL.md: mục nào cũng có dòng `spec:`, gắn mã ở đó là có mục thực
  thi. File không được khai, vd luật UX trong `references/`, thì không tính.

### PLANS.md

Hai mục, **Plan** (việc đã viết plan, theo thứ tự viết) và **Plan Queue** (việc chưa viết plan, xếp theo thứ tự định
làm); mỗi việc một mục cùng dạng:

```markdown
### 005 · Tên việc                    ← ở Plan Queue là `### PQ-NN · Tên việc`

- **Plan:** [005-slug.md](../../.plan/005-slug.md)   ← chỉ ở Plan
- **Status:** approved
- **Mục tiêu:** vì sao làm (ai đau, số đo thật), xong thì thấy gì, đầu vào nếu có

| Mã     | Thay đổi | Tóm tắt   |
| ------ | -------- | --------- |
| `F1.4` | update   | vài chữ   |
```

- **Status:** Plan Queue luôn `new`; Plan `draft` → `approved` → `done`. Viết plan cho `PQ-NN` thì chuyển mục sang
  Plan với số plan; `PQ-NN` bỏ, không dùng lại.
- **Mục tiêu** đủ để người chưa theo dõi đọc là hiểu việc, không phải lật plan hay lịch sử chat.
- **Thay đổi:** `new` yêu cầu làm lần đầu (việc chưa `done` được ghi mã SPEC chưa có) · `update` chữ yêu cầu đổi ·
  `remove` yêu cầu bị bỏ · `fix` chữ yêu cầu giữ nguyên, SKILL.md hay code làm chưa đúng. Việc không đổi yêu cầu nào
  thì không có bảng.

Một việc đi từ Plan Queue tới `done`: ghi mục `PQ-NN` → viết plan ở `.plan/`, chuyển mục sang Plan, `draft` → duyệt,
`approved` → sửa SPEC (yêu cầu, technical design) → SKILL.md, code và gắn mã → chạy lệnh soát → chạy thử theo gate
nghiệm thu của plan → đạt thì `done`. Cách nghiệm thu từng yêu cầu ("đạt khi thấy gì") và kịch bản chạy thử nằm trong
plan; kết quả nằm trong thư mục chạy thử `.test/<tên-skill>/NNN-nghiem-thu-<slug>/`.

### Lệnh soát

```bash
node scripts/spec-check.mjs [skills/<tên>] [--list | --matrix]
```

Lệnh báo:

- SKILL.md và file nó khai: sub-scope chưa có mục gắn mã, mục chưa có dòng `spec:`, mã gắn mà SPEC không có, file khai
  mà không có.
- PLANS.md, khi skill có file này: sub-scope chưa có plan `done` hay `approved` nào chạm tới; mã trong bảng mà SPEC không có (trừ dòng `new`
  của việc chưa `done`); việc thiếu **Mục tiêu**; status hay tiêu đề không hợp mục nó nằm; thay đổi lạ; dòng
  **Plan** trỏ file không có.

Dòng kết đếm việc theo status. `--matrix` in bảng mỗi yêu cầu cạnh mục SKILL.md thực thi nó và các plan chạm tới nó,
để đọc nội dung có khớp — lệnh chỉ soát cấu trúc, còn chạy đúng hay không là việc của lượt chạy thử. SPEC chưa có mục
Feature requirement thì lệnh bỏ qua skill đó.

## Plan

Plan để ở `.plan/NNN-<tên-skill>-<slug>.md`. `NNN` đếm chung cho cả thư mục; tên skill đứng ngay sau số để lướt
`ls .plan` là biết plan thuộc skill nào, vd `004-design-uiux-dung-theo-buoc.md`. Plan đụng nhiều skill thì lấy tên
skill chính của plan.

## Probe

Probe là script thăm dò một câu hỏi kỹ thuật trước khi plan chốt quyết định, ứng với một mục `### P<n>` trong §4
Probe của plan. Mỗi plan có một thư mục probe; mỗi `P<n>` là một thư mục con:

```text
.probe/009-design-uiux-tien-do-dung/
  P1-quick-check/
    probe.mjs
    probe.log
  P2-poll-file/
    probe.mjs
    probe.log
    page.html
```

- Tên thư mục plan là tên file plan bỏ đuôi `.md`. Nhờ vậy `ls .probe` khớp từng dòng với `ls .plan`.
- Tên thư mục con là mã `P<n>` trong plan, thêm vài chữ tả câu hỏi.
- Khi probe chạy trước lúc có file plan, agent lấy số kế tiếp trong `.plan/` và slug định đặt cho plan. File plan
  viết sau dùng đúng tên đó. Nếu đổi tên plan, thì đổi tên thư mục probe theo.

Luật cho từng probe:

- Thư mục probe chứa mọi thứ script cần: script, page thử, file đầu vào chép từ chỗ khác. Probe không ghi ra `.test/`
  hay `.design/`. Nhờ vậy khi skill đổi, probe vẫn chạy lại được trên đúng đầu vào lúc đo.
- Script tìm file theo thư mục của chính nó (`import.meta.url`), nên chạy từ đâu cũng được.
- Dòng **Cách chạy lại:** trong plan ghi lệnh chạy từ gốc repo, vd
  `node .probe/009-design-uiux-tien-do-dung/P2-poll-file/probe.mjs`.
- Nếu script cần thứ nằm ngoài repo (Playwright, Chrome), thì script nhận đường dẫn qua biến môi trường hoặc tham
  số. Dòng **Cách chạy lại:** ghi luôn biến đó, vd `PW_DIR=<thư mục có node_modules/playwright>`.
- Script ghi kết quả ra file cùng tên, đuôi `.log` (`probe.mjs` ra `probe.log`). Dòng đầu log ghi ngày chạy và version
  của thứ được đo: Node, Chrome, Alpine…
- Dòng **Kết quả:** trong plan nêu số đo và tên file log chứa số đó.
- Khi cần đo thêm một biến thể, agent viết script và log mới (`probe2.mjs`, `probe2.log`). Log mà plan đã trích không
  bị ghi đè.
- Khi plan sau dùng lại probe của plan trước, dòng **Cách chạy lại:** của plan sau trỏ vào thư mục của plan trước.
  Agent không chép probe sang thư mục plan mới.
- `.probe/` được commit cùng plan. Plan trong git trỏ tới lệnh nào thì lệnh đó phải có trong git.

Probe khác chạy thử skill: probe hỏi thiết kế có đứng được không, chạy trước khi chốt plan. Chạy thử gọi skill thật để
nghiệm thu, kết quả để ở `.test/`.

## Chạy thử skill

Chạy skill qua `.claude/skills`, symlink trỏ về `skills/` của repo. Như vậy thứ được chạy là bản
đang sửa trong repo, không phải bản đã cài ở `~/.claude/skills/`. Chưa có symlink thì tạo:

```bash
mkdir -p .claude && ln -sfn ../skills .claude/skills
```

**Chạy thử luôn ở chế độ tự chạy, không dừng hỏi người dùng** (`--auto` với skill có cờ này). Kịch bản chạy thử và
cách nghiệm thu trong SPEC cũng viết cho chế độ đó: kiểm câu hỏi skill đã soạn và câu trả lời nó tự chọn, không đợi
người thật trả lời.

Nếu skill có bài mẫu, thì plan nghiệm thu bằng bài nhỏ nhất có đầu vào chạm phần plan đổi. Nếu plan dùng bài khác bài
mặc định, thì plan ghi lý do. Bài mặc định và bảng chọn bài nằm trong `samples/README.md` của skill.

Kết quả mỗi lần chạy thử để ở `.test/<tên-skill>/NNN-<slug>/`. `.test/` đã được gitignore.

- `NNN` là số thứ tự ba chữ số, đếm riêng cho từng skill: xem số lớn nhất đang có trong
  `.test/<tên-skill>/` rồi cộng 1. Không ghi đè thư mục của lần chạy cũ, để còn so được giữa các lần.
- `slug` là vài chữ tả lần chạy đó, vd `001-apnews-bessent-ai`, `003-apnews-after-rename`.
- Trong thư mục, file đặt tên chung một tiền tố và phân biệt bằng đuôi: `page.md`, `page.json`…
  Phần skill in ra stderr ghi thành file cùng tên thêm `.log` (`page.md.log`).
- Chạy thử `fetch-page` thì luôn kèm `--raw-html page.raw.html`. Nhờ vậy mỗi thư mục trong
  `.test/fetch-page/` là một trang đã lưu để `replay.mjs` chạy lại (bước "Kiểm tra" trong "Vòng lặp cải
  tiến" của SKILL.md). Sửa script xong thì replay cả bộ: `node skills/fetch-page/replay.mjs .test/fetch-page/*/`.

## Sơ đồ

Sơ đồ trong SKILL.md, doc, README luôn vẽ bằng mermaid (theo skill `mermaid-diagram-design`), không vẽ bằng ký tự
ASCII (`─►`, `│`, `└──`).
