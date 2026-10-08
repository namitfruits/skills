# Mẫu 02 · Luồng onboarding 3 màn

**Khía cạnh:** đề một luồng thay vì một màn, trong thư mục không có design system. Skill phải xếp đề là một luồng, không tìm phương án A/B, tách luồng thành
3 màn, mỗi màn một page dựng song song; người xem đi hết luồng bằng nút trong page, quay lại vẫn còn chữ đã gõ.

**Đầu vào:** không có. Thư mục chạy thử trống: không codebase, không design system, nên skill in danh sách design của
getdesign, tự chọn bộ khuyên dùng (`--auto`) và dùng bề rộng `64rem`. App chạy trên điện thoại, nên khổ mobile là khổ chính.

## Đề

```text
/design-uiux --auto Thiết kế luồng onboarding 3 màn cho "Tiêu Gọn", app ghi chi tiêu cá nhân trên điện thoại:
1. Welcome: một câu nói app làm gì, nút "Bắt đầu".
2. Đăng ký: email + mật khẩu, hoặc "Tiếp tục với Google".
3. Hồ sơ: tên hiển thị và ngân sách tháng (VND). Nút "Xong" kết thúc luồng (không cần vẽ màn sau đó).
Luôn biết mình đang ở bước mấy, quay lại bước trước được.
```

## Checklist

- Chat in danh sách design của getdesign, rồi tự chọn một bộ. `tokens.js` ghi nguồn `getdesign <tên bộ đã chọn>`.
- Có đúng 3 page theo thứ tự Welcome, Đăng ký, Hồ sơ. Không có phương án A và B.
- Đi hết luồng được bằng nút trong page: "Bắt đầu" sang Đăng ký, rồi sang Hồ sơ.
- Bấm quay lại từ Hồ sơ về Đăng ký thì email đã gõ vẫn còn.
- Màn Đăng ký có ít nhất một trạng thái riêng ngoài có dữ liệu, đang tải, rỗng, lỗi (ví dụ email đã có tài khoản).
- Dòng cuối `check.log` có `0 lỗi`.

