---
version: alpha
name: design-uiux-default
description: Bộ token mặc định khi đề không đưa design system. Nền sáng trung tính, một màu nhấn xanh, chữ Inter. Cùng tên vai màu với DESIGN.md của getdesign, nên page mẫu chạy được với cả hai. Giao diện tối do scripts/tokens.mjs suy ra.

colors:
  primary: "#3b5bdb"
  primary-active: "#2f4bc0"
  primary-disabled: "#e3e5ea"
  ink: "#16181d"
  body: "#3a3f4a"
  body-strong: "#23262d"
  muted: "#6b7180"
  muted-soft: "#8d93a1"
  hairline: "#e3e5ea"
  hairline-soft: "#eceef2"
  canvas: "#f6f7f9"
  surface-soft: "#eef0f4"
  surface-card: "#ffffff"
  on-primary: "#ffffff"
  accent-teal: "#0f9b8e"
  accent-amber: "#c27c0e"
  success: "#18794e"
  warning: "#a16207"
  error: "#c53a3a"

typography:
  display-md:
    fontFamily: "Inter, sans-serif"
    fontSize: 32px
    fontWeight: 600
    lineHeight: 1.2
    letterSpacing: -0.5px
  display-sm:
    fontFamily: "Inter, sans-serif"
    fontSize: 24px
    fontWeight: 600
    lineHeight: 1.25
    letterSpacing: -0.3px
  title-lg:
    fontFamily: "Inter, sans-serif"
    fontSize: 20px
    fontWeight: 600
    lineHeight: 1.3
  title-md:
    fontFamily: "Inter, sans-serif"
    fontSize: 16px
    fontWeight: 600
    lineHeight: 1.4
  title-sm:
    fontFamily: "Inter, sans-serif"
    fontSize: 14px
    fontWeight: 600
    lineHeight: 1.4
  body-md:
    fontFamily: "Inter, sans-serif"
    fontSize: 15px
    fontWeight: 400
    lineHeight: 1.55
  body-sm:
    fontFamily: "Inter, sans-serif"
    fontSize: 14px
    fontWeight: 400
    lineHeight: 1.5
  caption:
    fontFamily: "Inter, sans-serif"
    fontSize: 12px
    fontWeight: 500
    lineHeight: 1.4
  button:
    fontFamily: "Inter, sans-serif"
    fontSize: 14px
    fontWeight: 500
    lineHeight: 1
  code:
    fontFamily: "JetBrains Mono, monospace"
    fontSize: 13px
    fontWeight: 400
    lineHeight: 1.5

rounded:
  xs: 4px
  sm: 6px
  md: 8px
  lg: 12px
  xl: 16px
  pill: 9999px

spacing:
  xxs: 4px
  xs: 8px
  sm: 12px
  md: 16px
  lg: 24px
  xl: 32px
  xxl: 48px
---

# design-uiux-default

Bộ token dự phòng của skill `design-uiux`. Chỉ phần YAML ở trên được dùng.
