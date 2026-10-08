# Mẫu 03 · Đề mơ hồ một dòng

**Khía cạnh:** đề thiếu gần hết thông tin, kể cả là một màn hay một luồng. Skill phải hỏi bằng câu có sẵn đáp án;
với `--auto` thì tự chọn đáp án khuyên dùng, ghi lại, rồi vẫn ra được page.

**Đầu vào:** không có. Thư mục chạy thử trống.

## Đề

```text
/design-uiux --auto làm phần báo cáo
```

## Checklist

`*` là thư mục design duy nhất trong `.design/`.

| Mã | Mở file | Đạt khi |
| --- | --- | --- |
| `F1.1` | `chat.md` | có ≥ 1 câu hỏi về đề đã soạn (không tính câu chọn phương án ở bước tìm phương án, không tính câu chọn design tiêu đề `Design`); mỗi câu có 2–4 đáp án; đáp án đầu mỗi câu có chữ `Khuyên dùng` |
| `F1.1` | `chat.md` | số khối câu hỏi về đề ≤ 3; một khối là các câu in liền nhau trước một lần tự trả lời hay chờ trả lời; không tính câu chọn phương án, không tính câu chọn design tiêu đề `Design` |
| `F1.7` | `chat.md` | không câu hỏi đã soạn (câu có các đáp án để chọn) nào nhắc bề rộng trang hay màn đã có trong dự án; ngoài câu chọn design tiêu đề `Design`, không câu nào nhắc design system, màu, font; dòng kể lựa chọn đã tự trả lời hay `AI đoán` không tính là câu hỏi |
| `F1.4` | `chat.md` | không có lượt nào dừng chờ người dùng trả lời |
| `F1.6` | `.design/*/brief.md` | `## Quyết định` có một dòng cho mỗi câu hỏi đã soạn, cột "Ai quyết" là `--auto`; điều phải đoán ghi `AI đoán` |
| `F1.10` | `chat.md` | tin giao có chuỗi "Chạy `--auto`, đã tự trả lời:" và sau đó một dòng cho mỗi câu hỏi đã soạn |
| `F1.12` | `chat.md`, `.design/*/brief.md` | có một câu hỏi đã soạn có chuỗi `một màn` và `luồng`; `## Quyết định` có dòng `Loại đề`, cột "Ai quyết" là `--auto` |
| `F1.2` | `chat.md`, `.design/*/pages.js` | `Loại đề` là `một màn` thì có bảng tình huống × phương án với ≥ 2 cột phương án và không có câu hỏi đã soạn để chọn phương án. `Loại đề` là `một luồng` thì kết quả là `không chạm` |
| `F1.3` | `.design/*/brief.md`, `subagent-*.md`, `check.log` | mỗi `subagent-*.md` chép lại ≥ 1 con số lấy từ mục `## Số kiểm chéo ở mặc định` của `brief.md`; dòng cuối `check.log` có `0 lỗi` |
| `F1.6` | `.design/*/brief.md`, `chat.md` | chat tả nhiều phương án hơn số file `NN-*.html` thì `## Pages` có một dòng cho mỗi phương án chưa chọn. Số phương án tả bằng số file `NN-*.html` thì kết quả là `không chạm` |
