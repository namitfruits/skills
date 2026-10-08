# Bài mẫu

Bốn đề cố định để chạy thử skill sau mỗi lần sửa. Cùng một đề chạy qua nhiều lần sửa thì so được skill khá lên hay kém
đi ở đâu. Mỗi bài thử một khía cạnh:

| Bài | Khía cạnh | Đầu vào |
| --- | --- | --- |
| [01 · Màn Đơn hàng](01-orders-screen/sample.md) | cải thiện một màn có sẵn trong codebase, kèm một vòng góp ý | `project/`: `@theme` chỉ có tối, `DESIGN.md` chỉ có chữ, `AppShell` 1152px, route `orders.tsx` |
| [02 · Onboarding 3 màn](02-onboarding-flow/sample.md) | đề một luồng: mỗi màn một page, đi hết luồng bằng nút trong page, khổ mobile là chính; không có design system nên chọn một bộ của getdesign | không có |
| [03 · Đề mơ hồ](03-vague-prompt/sample.md) | đề một dòng, chưa rõ một màn hay một luồng; skill phải hỏi rồi tự chọn với `--auto` | không có |
| [04 · Một màn mới](04-quick-screen/sample.md) | thử nhanh: một màn mới, đề đủ rõ nên không hỏi, đề chỉ định design `linear.app` nên không chọn design | không có |

Mỗi `sample.md` có: đề để dán nguyên văn, bảng **Checklist** ba cột `Mã` · `Mở file` · `Đạt khi`, và **Vòng góp ý** nếu
bài có. Cột `Mã` ghi sub-scope của [SPEC.md](../SPEC.md), hay `—` cho mục ngoài SPEC. Cột `Đạt khi` là điều đếm
được, có hay không có một chuỗi, hay so hai chỗ; không dùng chữ cảm tính ("giống", "hợp lý", "rõ").

## Soát bài mẫu

```bash
node skills/design-uiux/samples/lint.mjs
```

Lệnh in bảng mỗi sub-scope kèm bài nhìn tới nó, và exit 1 khi: sub-scope không bài nào nhìn tới mà cũng không nằm ở
bảng dưới; dòng ghi mã SPEC không có hay mã scope; bảng sai ba cột; ô `Đạt khi` có chữ cảm tính. SPEC thêm yêu cầu
mới thì lệnh báo ngay, cho tới khi có bài nhìn tới nó.

## Phủ ở chỗ khác

Sub-scope được kiểm bằng phép kiểm khác, không cần bài mẫu:

| Mã | Phép kiểm | Vì sao |
| --- | --- | --- |
| `F2.1` | `scripts/test-shell.mjs` | data-panel là phần của shell, như nhau ở mọi page |
| `F2.2` | `scripts/test-shell.mjs` | config-panel là phần của shell |
| `F2.3` | `scripts/test-shell.mjs` | khổ màn, sáng tối là phần của shell |
| `F2.4` | `scripts/test-shell.mjs` | nút A B là phần của shell |
| `F1.13` | `scripts/test-check.mjs` C8 | `check.mjs` báo thư mục phương án có từ ba page; dòng lý do trong chat thử ở nghiệm thu plan 008 (bài 01 với đề xin 3 phương án) |
| `F2.5` | `scripts/test-shell.mjs` · `check.mjs` | `check.mjs` mở lại từng tổ hợp từ link trên mọi page |
| `F5.7` | `scripts/test-check.mjs` C11 · C12 | kiểm đầy đủ báo page còn bước dựng chưa xong; agent chạy đúng thì không bao giờ để lại bước dở cho bài mẫu thấy |
| `F6.3` | `scripts/test-shell.mjs` | page đang mở tự tải lại, giữ URL và vị trí cuộn: phần của shell, cần trình duyệt mở suốt lúc dựng |
| `F6.4` | `scripts/test-shell.mjs` | đang gõ thì đợi, ở cả khổ desktop và trong iframe mobile |
| `F6.5` | `scripts/test-shell.mjs` | nhãn tiến độ đang dựng, đang sửa, xong là phần của shell |
| `F6.6` | `scripts/test-progress.mjs` · nghiệm thu plan 009 | lệnh `progress` in bước đầu tiên chưa xong; ngắt agent con giữa chừng rồi gọi lại thử ở nghiệm thu plan 009 (bài 01) |
| `F3.9` | `scripts/test-new-design.mjs` G5 | `designs` và `init --getdesign` thoát mã 2 khi mất mạng; dòng `Không lấy được design của getdesign` trong chat thử ở nghiệm thu plan 010 (bài 03 với registry npm không tới được) |

## Chạy một bài

```bash
SNAP=$TMPDIR/design-uiux-snap && rm -rf $SNAP && mkdir -p $SNAP && cp -R skills/design-uiux $SNAP/   # bản chụp skill
node skills/design-uiux/samples/prepare.mjs 01-orders-screen --skills $SNAP --slug run-1
```

Thử nhanh sau một lần sửa thì chạy bài 04 trên `skills/` của repo, không cần bản chụp:
`node skills/design-uiux/samples/prepare.mjs 04-quick-screen`.

Trước khi gọi skill, người chạy bật `watch-progress.mjs` chạy nền để ghi tiến độ dựng:
`node skills/design-uiux/samples/watch-progress.mjs <dir> --out <dir>/progress.log`. Tắt nó sau tin giao cuối (hay sau góp ý cuối).

`prepare.mjs` chạy từ gốc repo. Lệnh tạo `.test/design-uiux/NNN-sample-<bài>-<slug>/`, chép `project/` của bài vào đó (không
chép `sample.md`: agent chạy mà đọc được bảng Checklist thì kết quả không còn khách quan), trỏ `.claude/skills` về
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
| `progress.log` | output của `watch-progress.mjs`: mỗi lần danh sách bước dựng của một page đổi là một dòng có giờ |

## Chấm

**Người chấm** là một agent khác người chạy, chỉ đọc `sample.md` của bài và thư mục `dir`. Người chấm ghi
`<dir>/result.md`:

```markdown
# Kết quả · 01-orders-screen · 033-sample-01-orders-screen-run-1

Ngày: 2026-10-08 · Bản skill: 3d95ecd + SKILL.md 1a2b3c4d · Lỗi gài: — · Người chấm: agent

| # | Mã | Kết quả | Bằng chứng |
| - | -- | ------- | ---------- |
| Q1 | `F1.7` `F3.1` | đạt | `chat.md` dòng 3: "Đọc: design system từ `src/styles/tokens.css`…" |
| G1 | `F4.1` | trượt | `.design/001-don-hang/pages.js` có 4 mục, trước góp ý có 3 |
```

`#` là `Q<n>` theo thứ tự dòng của bảng Checklist, `G<n>` của bảng Vòng góp ý. `Kết quả` là `đạt`, `trượt` hay
`không chạm` (chỉ cho dòng có điều kiện, vd `F1.9`). Bằng chứng trỏ file và dòng.

So hai lượt hay hai người chấm:

```bash
node skills/design-uiux/samples/lint.mjs --compare <dir-a>/result.md <dir-b>/result.md
```

Mỗi lượt chấm xong thêm một dòng vào [history.md](history.md).

## Gài lỗi

`faults/L<n>.patch` là một lỗi đã biết trong `SKILL.md`, nhắm một dòng của một bài. Bài tốt thì trượt đúng dòng đó
khi chạy trên bản skill đã gài lỗi:

```bash
L=$TMPDIR/design-uiux-L1 && rm -rf $L && cp -R $SNAP $L
patch $L/design-uiux/SKILL.md < skills/design-uiux/samples/faults/L1.patch
node skills/design-uiux/samples/prepare.mjs 01-orders-screen --skills $L --slug L1
```

| Lỗi | Sửa gì trong SKILL.md | Bài | Phải trượt dòng |
| --- | --- | --- | --- |
| L1 | Bước 1: bỏ nguồn file CSS `@theme` và câu "File CSS có `@theme` thắng `DESIGN.md`" | 01 | `F3.1`: `tokens.js` lấy từ `tokens.css`. Không bắt được: `DESIGN.md` không có token, agent tự quay về `tokens.css` |
| L2 | "Dựng một page theo bước": bỏ "cộng trạng thái riêng của đề" ở luật `state` và dòng bước 3 của bảng sáu bước; lời giao bỏ "trạng thái riêng đã thêm" | 02 | `F3.3`: trạng thái riêng. Có thể không bắt được: danh sách bước do `new-design.mjs page` tạo vẫn có bước "Trạng thái riêng của đề" |
| L3 | bỏ cả mục "Bước 2 — Đề mơ hồ thì hỏi" | 03 | `F1.1`: câu hỏi đã soạn. Không bắt được: agent vẫn hỏi đúng cách nhờ dòng "Bước 2" của bảng `--auto` |
| L4 | Vòng sau: bỏ bullet "Góp ý đổi dữ liệu chung" | 01 | `F4.3`: `## Dữ liệu chung` đổi, mọi page đổi. Không bắt được: agent vẫn sửa brief và mọi page |
| L5 | bỏ mục "Bước 2 — Đề mơ hồ thì hỏi" và dòng "Bước 2" của bảng `--auto` | 03 | `F1.1`: câu hỏi đã soạn. Không bắt được: agent vẫn hỏi nhờ sơ đồ mermaid và khuôn `brief.md` |
| L6 | Bước 6: bỏ câu "Chạy `--auto` thì mở đầu bằng 'Chạy `--auto`, đã tự trả lời:'" | 03 | `F1.10`: tin giao kể lại lựa chọn `--auto` |
| L7 | Bước 1: bỏ đoạn "Bề rộng trang", bỏ bề rộng trong dòng `Đọc:` mẫu và trong mục `## Design system` của brief | 01 | `F1.3`: `## Design system` có `1152px` và `app-shell.tsx`. Không bắt được: agent tự tìm `max-w-content` trong `AppShell` |

Nếu patch không áp được vì SKILL.md đã đổi, thì viết lại patch và giữ mã `L<n>`. Nếu một lỗi không làm bài trượt, thì
dòng checklist hay bài đó chưa đủ nhạy: sửa dòng hay bài, hoặc thay bằng lỗi khác nhắm cùng bài.
