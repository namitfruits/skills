#!/usr/bin/env python3
"""Lint mermaid zone-tinted flowchart blocks per SKILL.md. Read-only.

    python3 .claude/skills/mermaid-diagram-design/verify.py {file.md|file.mmd} [--render {outdir}]

Lint bắt được lỗi cú pháp/cấu trúc. Lỗi thị giác (mũi tên đè nhau, chùm dây, hộp
lệch) KHÔNG bắt được bằng lint — phải `--render` rồi xem ảnh.
"""
import argparse
import re
import subprocess
import sys
from pathlib import Path

REQUIRED_INIT = [
    ("'theme':'base'", "theme khác ghi đè fill của classDef → hình xám hết"),
    ("titleColor", "nhãn subgraph mờ nhạt khi host ở dark mode"),
    ("textColor", "chữ ngoài hộp theo màu host"),
    ("edgeLabelBackground", "nhãn edge trong suốt → mũi tên xuyên qua chữ"),
    ("subGraphTitleMargin", "tên vùng dính vào hàng hộp đầu"),
    ("lineColor", "nét mũi tên nhạt, mất trên nền tối"),
]
# Kind nào chịu luật zone-tinted flowchart. Kind khác (sequenceDiagram, erDiagram, gantt...)
# có layout engine riêng, KHÔNG có subgraph/classDef/linkStyle → SPEC.md §4 để ngoài phạm vi.
ZONED_KINDS = ("flowchart", "graph")
KIND = re.compile(
    r"^(flowchart|graph|sequenceDiagram|classDiagram|stateDiagram-v2|stateDiagram|erDiagram|"
    r"gantt|journey|pie|mindmap|timeline|quadrantChart|gitGraph|requirementDiagram|"
    r"C4Context|C4Container|C4Component|C4Dynamic)\b"
)
# Token init còn nghĩa cho kind ngoài phạm vi: chỉ 2 cái chặn "chữ thừa hưởng màu trang".
# 4 token còn lại (edgeLabelBackground/subGraphTitleMargin/lineColor) là của flowchart.
INIT_ANY_KIND = ("'theme':'base'", "textColor")

SHAPES = r"\[\[|\[\(|\(\[|\{\{|\[/|\[|\(\(|\(|\{"
ID = r"[A-Za-z][A-Za-z0-9_-]*"  # id mermaid: ASCII (\w của Python bắt cả chữ Việt trong nhãn)
NODE_DECL = re.compile(r"(?<![A-Za-z0-9_-])(" + ID + r")[ \t]*(" + SHAPES + r")")
EDGE_OP = re.compile(r"<-->|-\.->|-->|~~~|<-\.->|===>|==>")
EDGE_LABEL = re.compile(r"\|\"?(.*?)\"?\|")
SKIP_PREFIX = ("subgraph", "style", "class", "classDef", "linkStyle", "end", "%%", "direction")
EXT_SHAPE = re.compile(r"(?<![\w-])%s\s*\[/")


def blocks(path: Path):
    text = path.read_text(encoding="utf-8")
    if path.suffix == ".mmd":
        return [(1, text.splitlines())]
    out, lines = [], text.splitlines()
    i = 0
    while i < len(lines):
        if lines[i].strip().startswith("```mermaid"):
            j = i + 1
            while j < len(lines) and not lines[j].strip().startswith("```"):
                j += 1
            out.append((i + 2, lines[i + 1 : j]))
            i = j
        i += 1
    return out


def diagram_kind(lines):
    """Kind khai ở dòng lệnh đầu tiên (bỏ qua %%{init}%% và dòng trống)."""
    for line in lines:
        s = line.strip()
        if not s or s.startswith("%%"):
            continue
        m = KIND.match(s)
        return m.group(1) if m else "?"
    return "?"


def lint(lines):
    err, warn, info = [], [], []
    src = "\n".join(lines)
    flat = src.replace(" ", "")
    kind = diagram_kind(lines)
    zoned = kind in ZONED_KINDS

    if re.search(r"C4(Context|Container|Component|Dynamic|Deployment)", src):
        err.append("dùng C4* (Context/Container/Component/Dynamic) — không nhận classDef, chuyển sang flowchart")

    if not zoned:
        info.append(
            f"kind `{kind}` — ngoài phạm vi style zone-tinted flowchart (SPEC §4). "
            "Chỉ check phần màu chữ; bỏ qua subgraph/classDef/linkStyle/edge order."
        )

    needed = REQUIRED_INIT if zoned else [(t, w) for t, w in REQUIRED_INIT if t in INIT_ANY_KIND]
    init = next((l for l in lines if l.strip().startswith("%%{init")), None)
    if not init:
        err.append(
            "thiếu dòng %%{init: ...}%% — copy nguyên khối §1"
            if zoned else
            "thiếu dòng %%{init: ...}%% — kind này vẫn cần `'theme':'base'` + `textColor` "
            "để chữ không thừa hưởng màu trang (§1.1)"
        )
    else:
        for token, why in needed:
            if token.replace(" ", "") not in flat:
                err.append(f"init thiếu `{token}` → {why}")

    if zoned and not re.search(r"linkStyle\s+default[^\n]*color:", src):
        err.append(
            "thiếu `linkStyle default color:#1b2230` → mermaid không set color cho "
            ".edgeLabel, chữ nhãn edge thừa hưởng màu trang → dark mode mờ"
        )

    if not zoned:
        return err, warn, info

    zones, zone_of, depth_stack, bare, decls = {}, {}, [], [], {}
    last_end = 0
    for n, line in enumerate(lines, 1):
        s = line.strip()
        if s.startswith("subgraph"):
            m = re.match(r'subgraph[ \t]+([A-Za-z][A-Za-z0-9_-]*)[ \t]*\[?"?(.*?)"?\]?$', s)
            if m:
                zones[m.group(1)] = m.group(2)
                depth_stack.append(m.group(1))
            continue
        if s == "end":
            if depth_stack:
                depth_stack.pop()
            last_end = n
            continue
        if s.startswith(SKIP_PREFIX) or not s:
            continue
        # bỏ nội dung trong ngoặc kép: chữ trong nhãn ("(dân sự)") không phải khai hộp
        for m in NODE_DECL.finditer(re.sub(r'"[^"]*"', '""', line)):
            nid = m.group(1)
            decls.setdefault(nid, n)
            if depth_stack:
                zone_of[nid] = depth_stack[-1]
            elif nid not in zone_of:
                bare.append((nid, n))

    if not zones:
        err.append("hình không có `subgraph` nào — chưa có vùng ⇒ chưa có ranh giới trách nhiệm (§3)")
    else:
        for nid, n in bare:
            err.append(f"L{n}: hộp trần `{nid}` — mọi hộp phải thuộc 1 subgraph (§3)")

    for zid, label in zones.items():
        if not re.search(r"style\s+" + re.escape(zid) + r"\s", src):
            err.append(f"vùng `{zid}` thiếu `style {zid} fill:...` — nền tint riêng (§3)")
        if "`**" not in label:
            warn.append(f"vùng `{zid}`: nhãn chưa bold `` `**...**` `` (§3)")

    classed, core = set(), set()
    for m in re.finditer(r"^[ \t]*class[ \t]+([\w,\- ]+?)[ \t]+(\w+)[ \t]*$", src, re.M):
        ids = {i.strip() for i in m.group(1).split(",") if i.strip()}
        classed |= ids
        if m.group(2) == "core":
            core |= ids
    classed |= set(re.findall(r"(?<![A-Za-z0-9_-])(" + ID + r"):::", src))
    unclassed = [nid for nid, _ in sorted(decls.items(), key=lambda kv: kv[1])
                 if nid not in classed and nid not in zones]
    if unclassed:
        shown = ", ".join(f"`{i}`" for i in unclassed[:10])
        more = f" (+{len(unclassed) - 10} hộp nữa)" if len(unclassed) > 10 else ""
        warn.append(f"{len(unclassed)} hộp không có `class` → rơi về xám mặc định (§4): {shown}{more}")
    if len(core) > 3:
        warn.append(f"{len(core)} hộp `core` (≤3) — nhấn hết = không nhấn gì (§4)")

    for m in re.finditer(r"^[ \t]*classDef[ \t]+(\w+)[ \t]+(.*)$", src, re.M):
        if "color:" not in m.group(2):
            warn.append(f"`classDef {m.group(1)}` thiếu `color:` → chữ trong hộp thừa hưởng màu trang (§1.1)")

    ext = set()
    for m in re.finditer(r"^[ \t]*class[ \t]+([\w,\- ]+?)[ \t]+ext[ \t]*$", src, re.M):
        ext |= {i.strip() for i in m.group(1).split(",") if i.strip()}
    for nid in sorted(ext):
        if not re.search(re.escape(nid) + r"\s*\[/", src):
            warn.append(f"hộp `{nid}` class `ext` nhưng không phải `[/parallelogram/]` (§2)")

    for n, line in enumerate(lines, 1):
        if not EDGE_OP.search(line) or line.strip().startswith(SKIP_PREFIX):
            continue
        sides = EDGE_OP.split(line)
        # id nguồn = token id CUỐI bên trái; id đích = token id ĐẦU bên phải sau khi bỏ nhãn `|...|`.
        # Không dùng `[^|]*` greedy: với `    ORDER --> RULES` nó backtrack và bắt `R` thay vì `ORDER`,
        # làm mọi edge không có nhãn bên trái bị chấm sai là cross-zone.
        left = re.findall(ID, re.sub(r'"[^"]*"', '""', sides[0]))
        right_part = re.sub(r"^[ \t]*\|[^|]*\|", "", re.sub(r'"[^"]*"', '""', sides[-1]))
        right = re.findall(ID, right_part)
        ids = [x for x in (left[-1] if left else None, right[0] if right else None) if x]
        cross = len(ids) == 2 and zone_of.get(ids[0]) != zone_of.get(ids[1])
        if cross and all(i in zone_of for i in ids) and n < last_end:
            err.append(
                f"L{n}: edge cross-zone `{ids[0]}→{ids[1]}` khai giữa các subgraph — "
                "dagre xếp sai → mũi tên đâm cluster. Khai sau `end` cuối (§6)"
            )
        for lab in EDGE_LABEL.findall(line):
            for seg in lab.split("<br/>"):
                cap = 12 if cross else 22
                if len(seg.strip()) > cap:
                    warn.append(
                        f'L{n}: nhãn edge "{seg.strip()[:28]}…" dài {len(seg.strip())} '
                        f"ký tự (cap {cap}{' vì cross-zone' if cross else ''}) — cắt `<br/>` (§5)"
                    )

    # §6 luật 5 nói về VÙNG NGOÀI bị dạt — swimlane (chỉ có lane vai, không có hộp `ext`)
    # không có vùng ngoài nào để ép xuống ⇒ không warn, tránh nhiễu 7 block user-flow.
    has_ext_zone = bool({zone_of.get(n) for n in ext} - {None})
    if len(zones) >= 3 and has_ext_zone and "~~~" not in src:
        warn.append("≥3 vùng + có vùng ngoài nhưng không có invisible link `~~~` — dagre dễ dạt vùng ngoài sang phải (§6 luật 5)")
    if len(zones) == 1:
        warn.append("chỉ 1 vùng = không cần vùng (§3)")
    if len(zones) > 5:
        warn.append(f"{len(zones)} vùng (>5) — gộp lại hoặc tách 2 hình (§3)")
    if re.search(r"legend", src, re.I):
        warn.append("có chữ `legend` — shape + tên vùng phải tự giải thích (§8)")
    return err, warn, info


def render(lines, outdir: Path, tag: str):
    """Render 2 nền: sáng + tối. Hình phải đọc như nhau ở cả hai (SKILL.md §1.1)."""
    outdir.mkdir(parents=True, exist_ok=True)
    mmd = outdir / f"{tag}.mmd"
    mmd.write_text("\n".join(lines) + "\n", encoding="utf-8")
    msgs = []
    for mode, bg in (("light", "white"), ("dark", "#0b0d10")):
        png = outdir / f"{tag}-{mode}.png"
        cmd = ["npx", "-y", "@mermaid-js/mermaid-cli", "-i", str(mmd), "-o", str(png),
               "-b", bg, "-w", "1400"]
        try:
            proc = subprocess.run(cmd, capture_output=True, text=True, shell=False, timeout=600)
        except (OSError, subprocess.TimeoutExpired) as exc:
            msgs.append(f"render {mode} FAIL ({exc}) — cần Node + npx")
            continue
        if png.exists():
            msgs.append(f"render {mode} OK → {png}")
        else:
            msgs.append(f"render {mode} FAIL:\n" + (proc.stderr or proc.stdout)[-600:])
    msgs.append("← MỞ XEM CẢ 2 ẢNH. Lint không thấy lỗi thị giác (§9 lớp 2)")
    return "\n  ".join(msgs)


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("path")
    ap.add_argument("--render", metavar="OUTDIR", help="render từng block ra 2 PNG (nền sáng + tối) để xem mắt")
    a = ap.parse_args()
    path = Path(a.path)
    if not path.is_file():
        print(f"không thấy file: {path}")
        return 2
    found = blocks(path)
    if not found:
        print("không có block ```mermaid``` nào")
        return 0
    rc = 0
    for idx, (start, lines) in enumerate(found, 1):
        err, warn, info = lint(lines)
        print(f"\n=== block {idx} (từ dòng {start}) — {len(err)} ERROR · {len(warn)} WARN")
        for i in info:
            print(f"  INFO   {i}")
        for e in err:
            print(f"  ERROR  {e}")
        for w in warn:
            print(f"  WARN   {w}")
        if not err and not warn:
            print("  lint sạch")
        if a.render:
            print("  " + render(lines, Path(a.render), f"{path.stem}-block{idx}"))
        rc = rc or (1 if err else 0)
    return rc


if __name__ == "__main__":
    sys.exit(main())
