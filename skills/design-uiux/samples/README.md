# Bài mẫu

Bốn đề cố định để chạy thử skill sau mỗi lần sửa. Cùng một đề chạy qua nhiều lần sửa thì so được skill khá lên hay kém
đi ở đâu. Mỗi bài thử một khía cạnh:

| Bài | Khía cạnh | Đầu vào |
| --- | --- | --- |
| [01 · Màn Đơn hàng](01-orders-screen/sample.md) | cải thiện một màn có sẵn trong codebase, kèm một vòng góp ý | `project/`: `@theme` chỉ có tối, `DESIGN.md` chỉ có chữ, `AppShell` 1152px, route `orders.tsx` |
| [02 · Onboarding 3 màn](02-onboarding-flow/sample.md) | đề một luồng: mỗi màn một page, đi hết luồng bằng nút trong page, khổ mobile là chính; đề chỉ định design `linear.app` nên không chọn design | không có |
| [03 · Đề mơ hồ](03-vague-prompt/sample.md) | đề một dòng, chưa rõ một màn hay một luồng; skill phải hỏi rồi tự chọn với `--auto` | không có |
| [04 · Một màn mới](04-quick-screen/sample.md) | **bài mặc định**: một màn mới, đề đủ rõ nên không hỏi làm rõ, đề xin một phương án nên ra một page; không có design system nên chọn một bộ của getdesign | không có |

Mỗi `sample.md` có: đề để dán nguyên văn, **Checklist** và **Vòng góp ý** nếu bài có. Checklist là danh sách 4–6
mục, viết bằng chữ thường, nói thứ người dùng thấy được khi skill chạy đúng: skill hỏi gì hay không hỏi gì, ra mấy
page, bấm thử thì page phản hồi gì, `check.log` sạch không. Mỗi mục có thể kiểm được bằng cách mở file hay mở page.
Checklist không ghi mã yêu cầu SPEC: bài mẫu dùng để thử nhanh xem skill còn chạy đúng không. Cách nghiệm thu từng
yêu cầu nằm trong plan đưa yêu cầu đó vào.

```bash
node skills/design-uiux/samples/lint.mjs
```

Lệnh exit 1 khi một bài thiếu khối đề, checklist rỗng hay quá 8 mục, dùng bảng thay danh sách, có mã yêu cầu SPEC, hay
có chữ cảm tính ("giống", "hợp lý", "rõ").

## Bài mặc định

Plan nghiệm thu bằng bài 04: một page, lượt chạy ngắn nhất còn đi đủ sáu bước của skill. Nếu plan chạm một dòng dưới
đây, thì plan chạy thêm hay chạy thay bằng bài ở cột phải, và ghi lý do cạnh lượt chạy trong plan. Bài nhỏ mà thiếu
đầu vào thì lượt chạy không chạm luật vừa sửa.

| Plan chạm | Bài 04 thiếu | Dùng bài |
| --- | --- | --- |
| đọc design system, component, bề rộng trang của dự án (Bước 1); luật UI theo design system | không có `project/` | 01 |
| hỏi khi đề mơ hồ (Bước 2) | đề đủ rõ | 03 |
| A/B: tìm, chọn, đặt tên phương án (Bước 3) | đề xin một phương án | 01 |
| luồng nhiều màn | một màn | 02 |
| đề ghi sẵn design của getdesign | đề không ghi design | 02 |
| vòng góp ý | không có góp ý | 01 |
| luật máy kiểm so giữa các page | một page | 01 |

## Chạy một bài

```bash
SNAP=$TMPDIR/design-uiux-snap && rm -rf $SNAP && mkdir -p $SNAP && cp -R skills/design-uiux $SNAP/   # bản chụp skill
node skills/design-uiux/samples/prepare.mjs 01-orders-screen --skills $SNAP --slug run-1
```

Thử nhanh sau một lần sửa thì chạy bài 04 trên `skills/` của repo, không cần bản chụp:
`node skills/design-uiux/samples/prepare.mjs 04-quick-screen`. Bài 04 và bài 02 cần mạng để tải design của getdesign.

Nếu cần xem tiến độ dựng của từng page, ví dụ khi nghiệm thu plan 009, thì người chạy bật `watch-progress.mjs` chạy nền
trước khi gọi skill: `node skills/design-uiux/samples/watch-progress.mjs <dir> --out <dir>/progress.log`.

`prepare.mjs` chạy từ gốc repo. Lệnh tạo `.test/design-uiux/NNN-sample-<bài>-<slug>/`, chép `project/` của bài vào đó (không
chép `sample.md`: agent chạy mà đọc được checklist thì kết quả không còn khách quan), trỏ `.claude/skills` về
`--skills` (mặc định `skills/` của repo), rồi in JSON `{ dir, prompt, feedback }`. Chạy trên bản chụp thì skill không đổi
giữa các lượt, kể cả khi có người đang sửa repo.

**Người chạy** là một agent đứng ở `dir`, đọc `.claude/skills/design-uiux/SKILL.md` và làm theo như khi skill được gọi
với `prompt`. Nếu có `feedback`, thì sau khi giao người chạy gửi lần lượt từng góp ý và làm theo mục "Vòng sau" của SKILL.md.
Người chạy để lại trong `dir`:

| File | Nội dung |
| --- | --- |
| `chat.md` | mọi chữ skill in ra chat, theo thứ tự; góp ý mở đầu bằng dòng `## Góp ý <n>` |
| `check.log` | output của lần `check.mjs` cả thư mục cuối cùng; có vòng góp ý thì thêm `check-before-feedback.log` |
| `subagent-<x>.md` | báo cáo trả về của từng agent con |

## Chấm

**Người chấm** là một agent khác người chạy, chỉ đọc `sample.md` của bài và thư mục `dir`. Người chấm ghi
`<dir>/result.md`:

```markdown
# Kết quả · 01-orders-screen · 033-sample-01-orders-screen-run-1

Ngày: 2026-10-08 · Bản skill: 3d95ecd + SKILL.md 1a2b3c4d · Lỗi gài: — · Người chấm: agent

| # | Mục | Kết quả | Bằng chứng |
| - | --- | ------- | ---------- |
| C1 | Dòng `Đọc:` đầu chat nhắc `tokens.css`… | đạt | `chat.md` dòng 3: "Đọc: design system từ `src/styles/tokens.css`…" |
| G1 | Sau góp ý 1, vẫn có 2 page… | trượt | `.design/001-don-hang/pages.js` có 3 mục |
```

`#` là `C<n>` theo thứ tự mục của Checklist, `G<n>` của Vòng góp ý. `Kết quả` là `đạt` hay `trượt`. Bằng chứng trỏ
file và dòng.

So hai lượt hay hai người chấm:

```bash
node skills/design-uiux/samples/lint.mjs --compare <dir-a>/result.md <dir-b>/result.md
```

Mỗi lượt chấm xong thêm một dòng vào [history.md](history.md).

## Gài lỗi

`faults/L<n>.patch` là một lỗi đã biết trong `SKILL.md` hay file nó khai ở `spec-files`, nhắm một mục checklist của một bài. Bài tốt thì trượt đúng mục đó
khi chạy trên bản skill đã gài lỗi:

```bash
L=$TMPDIR/design-uiux-L1 && rm -rf $L && cp -R $SNAP $L
patch -d $L/design-uiux -p0 < skills/design-uiux/samples/faults/L1.patch
node skills/design-uiux/samples/prepare.mjs 01-orders-screen --skills $L --slug L1
```

| Lỗi | Sửa gì | Bài | Phải trượt mục |
| --- | --- | --- | --- |
| L1 | SKILL.md Bước 1: bỏ nguồn file CSS `@theme` và câu "File CSS có `@theme` thắng `DESIGN.md`" | 01 | `tokens.js` ghi nguồn `tokens.css`. Không bắt được: `DESIGN.md` không có token, agent tự quay về `tokens.css` |
| L2 | `references/build-page.md`: bỏ "cộng trạng thái riêng của đề" ở luật `state`, dòng bước 3 của bảng sáu bước, và "trạng thái riêng đã thêm" ở mục "Trả về" | 02 | màn Đăng ký có trạng thái riêng. Có thể không bắt được: danh sách bước do `new-design.mjs page` tạo vẫn có bước "Trạng thái riêng của đề" |
| L3 | SKILL.md: bỏ phần đầu mục "Bước 2 — Đề mơ hồ thì hỏi", giữ mục con chọn design | 03 | mỗi câu hỏi có sẵn đáp án. Không bắt được: agent vẫn hỏi đúng cách nhờ dòng "Bước 2" của bảng `--auto` |
| L4 | SKILL.md Vòng sau: bỏ bullet "Góp ý đổi dữ liệu chung" | 01 | sau góp ý 2, mọi page dùng ngưỡng 45 phút. Không bắt được: agent vẫn sửa brief và mọi page |
| L5 | SKILL.md: như L3, bỏ thêm dòng "Bước 2, hỏi khi đề mơ hồ" của bảng `--auto` | 03 | mỗi câu hỏi có sẵn đáp án. Không bắt được: agent vẫn hỏi nhờ sơ đồ mermaid và khuôn `brief.md` |
| L6 | SKILL.md Bước 6: bỏ câu "Chạy `--auto` thì mở đầu bằng 'Chạy `--auto`, đã tự trả lời:'" | 03 | tin giao kể lại lựa chọn `--auto` |
| L7 | SKILL.md Bước 1: bỏ đoạn "Bề rộng trang", bỏ bề rộng trong dòng `Đọc:` mẫu và trong mục `## Design system` của brief | 01 | `brief.md` ghi bề rộng `1152px`. Không bắt được: agent tự tìm `max-w-content` trong `AppShell` |

Nếu patch không áp được vì SKILL.md hay file nó khai đã đổi, thì viết lại patch và giữ mã `L<n>`. Nếu một lỗi không làm bài trượt, thì
mục checklist hay bài đó chưa đủ nhạy: sửa mục hay bài, hoặc thay bằng lỗi khác nhắm cùng bài.
