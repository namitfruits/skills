# PLANS — `session-metrics`

Việc để làm skill, chia hai phần: **Plan** — việc đã viết plan ở `.plans/`, theo thứ tự viết; **Plan Queue** — việc
dự kiến, chưa viết plan. [SPEC.md](SPEC.md) tả skill đang làm được gì. Kiểm:
`node scripts/spec-check.mjs skills/session-metrics`.

## Plan

### 022 · Đóng gói tool tracking session thành skill

- **Plan:** [022-session-metrics.md](../../.plans/022-session-metrics.md)
- **Status:** approved
- **Mục tiêu:** tool ghi session Claude Code chỉ sống trong spec-kit-todo-metrics; đo project khác phải chép tay ba
  file và sửa tay hook. Xong thì agent cài tracking vào project bất kỳ bằng một lệnh, cài lại không nhân đôi hook, số
  liệu đi giữa các máy qua git, file số liệu không chứa secret.

| Mã     | Thay đổi | Tóm tắt |
| ------ | -------- | ------- |
| `F1.1` | new      | chép file vào `.metrics/` |
| `F1.2` | new      | thêm hook, giữ hook khác |
| `F1.3` | new      | thay hook cũ tại chỗ |
| `F1.4` | new      | tạo `config.json` |
| `F1.5` | new      | không sửa config, sessions đã có |
| `F1.6` | new      | `settings.json` hỏng thì thoát 1 |
| `F2.1` | new      | hook ghi file mỗi session |
| `F2.2` | new      | hook chỉ đọc session gọi nó |
| `F2.3` | new      | chạy tay đọc cả project |
| `F2.4` | new      | chỉ ghi session máy này, không xoá |
| `F2.5` | new      | hook lỗi không chặn session |
| `F3.1` | new      | file giữ đủ prompt, tool, subagent |
| `F3.2` | new      | che secret |
| `F3.3` | new      | bỏ output file secret |
| `F3.4` | new      | ảnh thành dòng mô tả |
| `F3.5` | new      | SKILL.md thành tên skill |
| `F3.6` | new      | chế độ `numbers` |
| `F3.7` | new      | `stageSkills` trong config |
| `F4.1` | new      | server mở trang |
| `F4.2` | new      | hiện session máy khác |
| `F4.3` | new      | trạng thái sống |
| `F4.4` | new      | tự vẽ lại 3 giây |
| `F4.5` | new      | bỏ qua cổng bận |
| `F4.6` | new      | không gọi được server thì hiện lệnh |
| `F4.7` | new      | sync một lượt lúc khởi động |

## Plan Queue
