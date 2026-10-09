# Mẫu 02 · Luồng onboarding 3 màn

**Khía cạnh:** đề một luồng thay vì một màn, đề ghi sẵn design của getdesign. Skill phải xếp đề là một luồng, không
tìm phương án A/B, tách luồng thành 3 màn, mỗi màn một page dựng song song; người xem đi hết luồng bằng nút trong page,
quay lại vẫn còn chữ đã gõ. Skill dùng design ghi trong đề, không in danh sách design và không hỏi chọn design.

**Đầu vào:** không có. Thư mục chạy thử trống: không codebase. Design là `linear.app` ghi trong đề; skill cần mạng để
tải design đó. App chạy trên điện thoại, nên khổ mobile là khổ chính.

## Đề

```text
/design-uiux --auto Thiết kế luồng onboarding 3 màn cho "Tiêu Gọn", app ghi chi tiêu cá nhân trên điện thoại. Design system: npx getdesign@latest add linear.app
1. Welcome: một câu nói app làm gì, nút "Bắt đầu".
2. Đăng ký: email + mật khẩu, hoặc "Tiếp tục với Google".
3. Hồ sơ: tên hiển thị và ngân sách tháng (VND). Nút "Xong" kết thúc luồng (không cần vẽ màn sau đó).
Luôn biết mình đang ở bước mấy, quay lại bước trước được.
```

## Checklist

- Dòng `Đọc:` đầu chat nhắc `linear.app`. Chat không in danh sách design của getdesign. `tokens.js` ghi nguồn
  `getdesign linear.app`.
- Có đúng 3 page theo thứ tự Welcome, Đăng ký, Hồ sơ. Không có phương án A và B.
- Đi hết luồng được bằng nút trong page: "Bắt đầu" sang Đăng ký, rồi sang Hồ sơ.
- Bấm quay lại từ Hồ sơ về Đăng ký thì email đã gõ vẫn còn.
- Màn Đăng ký có ít nhất một trạng thái riêng ngoài có dữ liệu, đang tải, rỗng, lỗi (ví dụ email đã có tài khoản).
- Dòng cuối `check.log` có `0 lỗi`.

