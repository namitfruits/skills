#!/usr/bin/env python3
"""Lint file brief của skill brainstorm-v1.

Kiểm phần cấu trúc kiểm được bằng code: khung section (Tổng quan · Hiện trạng · Ai dùng · Module · … · Nhật ký), bảng module
ở Tổng quan khớp các section `## Module · …` và các feature `### …` trong đó, mỗi module có mục tiêu, mỗi ý ghi lại có
nguồn trỏ về câu hỏi có thật, ID không trùng, cột Module trỏ đúng tên module, không còn chỗ trống của template, và
file không trượt sang phân tích (user story, AC, luật đánh số). Chỗ người dùng nói chưa khớp nhau thì agent tự đọc ở
Bước 5 của SKILL.md.

Kèm theo là `checklist.md` cùng thư mục với `brief.md`: đủ 5 section bước, item đúng dạng `[ ]` / `[x]` / `[-]`,
item đã đóng có nguồn trỏ về câu hỏi có thật, mỗi module và feature của brief có khối item ở Bước 4, file `confirmed`
thì không còn item mở. Brief `draft` thì in item mở đầu tiên — chỗ chạy tiếp khi bị ngắt.

    python3 verify.py <.brainstorm/NNN-slug/> [...]    # đưa thư mục, brief.md hay checklist.md đều được

Thoát 0 khi không có ERROR, 1 khi có, 2 khi không thấy file.
"""
import argparse
import re
import sys
from pathlib import Path

HEAD = ["Tổng quan", "Hiện trạng", "Ai dùng"]
TAIL = ["Giả định", "Câu hỏi còn mở", "Nhật ký trao đổi"]
MODULE = "Module · "
STATUS_OK = ("draft", "confirmed")
A_STATUS = ("chờ xác nhận", "đã xác nhận", "bị bác")
SHARED = "chung"
NONE = ("", "—", "-")
BONUS = re.compile(r"\s*\(bổ sung\)\s*$")  # đuôi tên module bổ sung ở bảng Tổng quan
EXISTING = re.compile(r"^đã có\b", re.I)  # `đã có: <thứ>` ở cột Dựa vào trỏ về Hiện trạng

H2 = re.compile(r"^## (.+?)\s*$")
H3 = re.compile(r"^### (.+?)\s*$")
GOAL = re.compile(r"^\*\*Mục tiêu:\*\*\s*(.*)$")
OUT = re.compile(r"^\*\*Ngoài phạm vi:\*\*\s*(.*)$")
ROW = re.compile(r"^\|(.+)\|\s*$")
SEP = re.compile(r"^\|[\s:|-]+\|\s*$")
SRC = re.compile(r"^(Q\d+|A-\d+|đề)$")
SRC_INLINE = re.compile(r"\(Nguồn:\s*([^)]*)\)")
SRC_TAIL = re.compile(r"\(([^()]*)\)\s*$")
EXAMPLE = re.compile(r"^Ví dụ:")
# dấu hiệu file đang làm việc của bước phân tích
ANALYSIS = re.compile(r"^#{2,4} US-\d+|\bAC-\d+\.\d+|\bBR-\d+|\bNFR-\d+|^Ưu tiên:\s*(Must|Should|Could)")
PLACEHOLDER = re.compile(r"<(?!/?br\b)[^<>`\n]{2,}>|YYYY-MM-DD")

# checklist
BRIEF = "brief.md"
CHECKLIST = "checklist.md"
STEP = re.compile(r"^Bước (\d)\b")
ITEM = re.compile(r"^- \[(.)\] (.+)$")
OQ_REF = re.compile(r"^→\s*(OQ-\d+)$")
MODULE_ITEMS = ("Người dùng kể", "Mục tiêu", 'Nói lại được "đúng"')


def front_matter(lines):
    if not lines or lines[0].strip() != "---":
        return {}, 0
    fm = {}
    for i, ln in enumerate(lines[1:], 1):
        if ln.strip() == "---":
            return fm, i + 1
        if ":" in ln:
            k, v = ln.split(":", 1)
            fm[k.strip()] = v.split("#", 1)[0].strip()
    return fm, 0


def split(lines, start, pattern):
    """Cắt theo heading `pattern`, bỏ qua heading nằm trong code fence. Trả về [(tên, [dòng])]."""
    out, fence = [], False
    for ln in lines[start:]:
        if ln.strip().startswith("```"):
            fence = not fence
        m = None if fence else pattern.match(ln)
        if m:
            out.append((m.group(1).strip(), []))
        elif out:
            out[-1][1].append(ln)
    return out


def table(body):
    """Các hàng dữ liệu (bỏ hàng tiêu đề và hàng `---`) của mọi bảng trong body."""
    rows, header_seen = [], False
    for ln in body:
        s = ln.strip()
        if not ROW.match(s):
            header_seen = False
            continue
        if SEP.match(s):
            continue
        if not header_seen:
            header_seen = True
            continue
        rows.append([c.strip() for c in ROW.match(s).group(1).split("|")])
    return rows


def bullets(body):
    """Gạch đầu dòng cấp một, gộp cả dòng nối thụt vào bên dưới."""
    out = []
    for ln in body:
        if ln.startswith("- "):
            out.append(ln[2:].strip())
        elif out and ln.startswith((" ", "\t")) and ln.strip():
            out[-1] += " " + ln.strip()
        elif not ln.strip() or not ln.startswith((" ", "\t")):
            if out and out[-1] is not None:
                out.append(None)  # hết danh sách
    return [b for b in out if b]


def plain(s):
    return re.sub(r"[*`_]", "", s).strip()


def refs(raw, sep=r"[,·]"):
    return [s.strip() for s in re.split(sep, raw) if s.strip()]


def lint(text):
    err, warn, info = [], [], []
    lines = text.splitlines()
    fm, start = front_matter(lines)

    if fm.get("type") != "brainstorm":
        err.append("front matter thiếu `type: brainstorm`")
    status = fm.get("status", "")
    if status not in STATUS_OK:
        err.append(f"`status: {status or '(trống)'}`: phải là draft hoặc confirmed")
    final = status == "confirmed"

    # --- khung section: Tổng quan · Hiện trạng · Ai dùng · Module · … (≥ 1) · 3 section cuối
    secs = split(lines, start, H2)
    names = [n for n, _ in secs]
    modules = [n[len(MODULE):].strip() for n in names if n.startswith(MODULE)]
    real_modules = [m for m in modules if not PLACEHOLDER.search(m)]
    expect = HEAD + [MODULE + m for m in modules] + TAIL
    if names != expect:
        missing = [n for n in HEAD + TAIL if n not in names]
        stray = [n for n in names if n not in HEAD + TAIL and not n.startswith(MODULE)]
        if missing:
            err.append("thiếu section: " + " · ".join(f"`## {n}`" for n in missing))
        if stray:
            err.append("section lạ: " + " · ".join(f"`## {n}`" for n in stray) +
                       f" — section module phải bắt đầu bằng `## {MODULE}`")
        if not missing and not stray:
            err.append("sai thứ tự section: " + " · ".join(HEAD) + " · các `Module · …` · " + " · ".join(TAIL))
    if not modules:
        err.append(f"chưa có section `## {MODULE}<tên>` nào")
    sec = {n: b for n, b in secs}
    body = lambda n: sec.get(n, [])
    known_mod = {m.lower() for m in modules} | {SHARED}

    def check_mod(where, raw, allow_none=False):
        if PLACEHOLDER.search(raw) or PLACEHOLDER.search(where):
            return  # ô còn chỗ trống của template: đã báo ở cuối
        if allow_none and plain(raw) in NONE:
            return
        for m in refs(plain(raw)):
            if EXISTING.match(m):
                continue
            if m.lower() not in known_mod:
                err.append(f"{where}: module `{m}` không có section `## {MODULE}{m}` (hay ghi `{SHARED}`)")

    # --- Tổng quan: bảng module khớp section, Ngoài phạm vi
    overview = body("Tổng quan")
    listed = {}  # module → [feature]
    for r in table(overview):
        if not plain(r[0]) or PLACEHOLDER.search(r[0]):
            continue
        m = BONUS.sub("", plain(r[0]))
        feats = r[1] if len(r) > 1 else ""
        listed[m] = [] if PLACEHOLDER.search(feats) else refs(plain(feats), r"·")
        if len(r) > 2:
            check_mod(f"Tổng quan · {m} · Dựa vào", re.sub(r"(?i)mọi module( trên)?", "", r[2]) or "—",
                      allow_none=True)
    for m in real_modules:
        if m not in listed:
            err.append(f"module `{m}` có section nhưng không có trong bảng ở Tổng quan")
    for m in listed:
        if m not in modules:
            err.append(f"bảng Tổng quan có module `{m}` nhưng không có section `## {MODULE}{m}`")
    out = next((OUT.match(ln.strip()) for ln in overview if OUT.match(ln.strip())), None)
    if not out or not plain(out.group(1)):
        err.append("Tổng quan thiếu dòng `**Ngoài phạm vi:** …` — không có nó là bất đồng ngầm về thứ không làm")
    if not any(ln.startswith(">") for ln in overview):
        warn.append("Tổng quan chưa chép đề nguyên văn (dòng `> …`)")

    # --- ID và nguồn
    log = table(body("Nhật ký trao đổi"))
    q_ids = [plain(r[0]) for r in log]
    a_rows = table(body("Giả định"))
    a_ids = [plain(r[0]) for r in a_rows]
    known_src = set(q_ids) | set(a_ids)
    cited = set()
    if not log:
        err.append("Nhật ký trao đổi trống: mọi câu đã hỏi phải có một dòng")

    def check_src(where, raw):
        rs = refs(raw)
        if not rs:
            err.append(f"{where}: thiếu nguồn (Q<n>, A-<n> hoặc `đề`)")
        for s in rs:
            if not SRC.match(s):
                err.append(f"{where}: nguồn `{s}` không phải Q<n> / A-<n> / `đề`")
            elif s != "đề" and s not in known_src:
                err.append(f"{where}: nguồn `{s}` không có ở Nhật ký hay Giả định")
            cited.add(s)

    for r in log:
        if len(r) > 2:
            check_mod(plain(r[0]), r[2])
    for r in a_rows:
        if len(r) > 1:
            check_mod(plain(r[0]), r[1])
        st = plain(r[3]) if len(r) > 3 else ""
        if not PLACEHOLDER.search(st) and st not in A_STATUS:
            err.append(f"{plain(r[0])}: trạng thái `{st}` phải là " + " · ".join(A_STATUS))

    # --- Hiện trạng: Đã có · Chưa có, mỗi ý có nguồn
    now = [b for b in bullets(body("Hiện trạng")) if not PLACEHOLDER.search(b)]
    if "Hiện trạng" in sec and not bullets(body("Hiện trạng")):
        err.append("mục Hiện trạng trống: ghi hệ thống đang có gì, chưa có gì cho những việc trong đề")
    for b in now:
        t = SRC_TAIL.search(b)
        if not t:
            err.append(f"Hiện trạng: ý `{b[:50]}` thiếu nguồn ở cuối, vd `(đề)`")
        else:
            check_src("Hiện trạng", t.group(1))

    # --- Ai dùng
    who = table(body("Ai dùng"))
    if not who:
        err.append("mục Ai dùng chưa có ai")
    for r in who:
        if len(r) > 2:
            check_mod(plain(r[0]), r[2])

    # --- từng module: mục tiêu, feature khớp bảng Tổng quan, ý có nguồn, có ví dụ
    n_feat = n_example = 0
    for m in modules:
        mb = body(MODULE + m)
        tag_m = f"Module {m}"
        subs = split(mb, 0, H3)
        intro = mb[:next((i for i, ln in enumerate(mb) if H3.match(ln)), len(mb))]
        # Mục tiêu là cả đoạn văn (có thể xuống dòng) bắt đầu bằng `**Mục tiêu:**`
        idx = next((i for i, ln in enumerate(intro) if GOAL.match(ln.strip())), None)
        goal = None
        if idx is not None:
            para = []
            for ln in intro[idx:]:
                if not ln.strip():
                    break
                para.append(ln.strip())
            goal = GOAL.match(" ".join(para))
        if not goal or not plain(goal.group(1)):
            err.append(f"{tag_m}: thiếu dòng `**Mục tiêu:** …`")
        elif not PLACEHOLDER.search(goal.group(1)):
            src = SRC_INLINE.search(goal.group(1))
            if src:
                check_src(f"{tag_m} · Mục tiêu", src.group(1))
            else:
                err.append(f"{tag_m}: Mục tiêu chưa có `(Nguồn: …)`")

        feats = [n for n, _ in subs]
        if not feats:
            err.append(f"{tag_m}: chưa có feature nào (`### <tên feature>`)")
        if m in listed:
            for f in feats:
                if not PLACEHOLDER.search(f) and f not in listed[m]:
                    err.append(f"{tag_m}: feature `{f}` không có trong bảng Tổng quan")
            for f in listed[m]:
                if f not in feats:
                    err.append(f"{tag_m}: bảng Tổng quan có feature `{f}` nhưng không có `### {f}`")
        for f, fb in subs:
            tag_f = f"{m} · {f}"
            n_feat += 1
            items = bullets(fb)
            if not items:
                # lúc mới chốt tổng quan (Bước 3) feature chưa có ý nào là bình thường
                (err if final else warn).append(f"{tag_f}: chưa có ý nào — chưa qua Bước 4?")
                continue
            for b in items:
                if PLACEHOLDER.search(b):
                    continue
                t = SRC_TAIL.search(b)
                if not t:
                    err.append(f"{tag_f}: ý `{b[:50]}` thiếu nguồn ở cuối, vd `(Q3)`")
                else:
                    check_src(tag_f, t.group(1))
            if any(EXAMPLE.match(b) for b in items):
                n_example += 1
            else:
                warn.append(f"{tag_f}: chưa có `- Ví dụ: …` — chưa chắc hai bên hình dung cùng một thứ")

    # --- câu hỏi còn mở, ID trùng
    oq = table(body("Câu hỏi còn mở"))
    for r in oq:
        if len(r) > 1:
            check_mod(plain(r[0]), r[1])
    for name, ids_ in (("Q", q_ids), ("A", a_ids), ("OQ", [plain(r[0]) for r in oq])):
        dup = sorted({i for i in ids_ if ids_.count(i) > 1})
        if dup:
            err.append(f"ID {name} trùng: {', '.join(dup)}")

    # --- trượt sang phân tích
    fence, drift = False, []
    for ln in lines[start:]:
        if ln.strip().startswith("```"):
            fence = not fence
        elif not fence and ANALYSIS.search(ln.strip()):
            drift.append(ln.strip())
    if drift:
        warn.append(f"{len(drift)} dòng có user story / AC / luật đánh số / ưu tiên, vd `{drift[0][:60]}` — "
                    "đó là việc của bước phân tích")

    # câu hỏi `chung` (chốt tổng quan, nói lại) thường không sinh ý nào để trích
    loose = [plain(r[0]) for r in log if plain(r[0]) not in cited
             and (len(r) < 3 or plain(r[2]).lower() != SHARED) and not PLACEHOLDER.search(r[0])]
    if loose and n_example:
        warn.append("câu hỏi không ý nào trích làm nguồn: " + ", ".join(loose) + " — trả lời đó đã vào file chưa?")

    pending = [plain(r[0]) for r in a_rows if len(r) > 3 and "chờ" in r[3].lower()]
    if pending:
        (err if final else warn).append(f"{len(pending)} giả định chờ xác nhận: {', '.join(pending)}")

    left = [ln.strip() for ln in lines if PLACEHOLDER.search(re.sub(r"`[^`]*`", "", ln))]
    if left:
        msg = f"còn {len(left)} dòng chưa điền chỗ trống của template, vd: {left[0][:70]}"
        (err if final else warn).append(msg)

    info.append(f"{len(modules)} module · {n_feat} feature ({n_example} có ví dụ) · {len(log)} câu hỏi · "
                f"{len(oq)} câu hỏi còn mở")
    ctx = {
        "final": final,
        "src": known_src,
        "oq": {plain(r[0]) for r in oq},
        "features": {m: [f for f, _ in split(body(MODULE + m), 0, H3) if not PLACEHOLDER.search(f)]
                     for m in real_modules},
    }
    return err, warn, info, ctx


def lint_checklist(text, ctx):
    """Kiểm checklist đi kèm brief. `ctx` lấy từ lint() của brief."""
    err, warn, info = [], [], []
    lines = text.splitlines()
    fm, start = front_matter(lines)
    final = ctx["final"]
    if fm.get("type") != "brainstorm-checklist":
        err.append("checklist: front matter thiếu `type: brainstorm-checklist`")

    secs = split(lines, start, H2)
    steps = [int(STEP.match(n).group(1)) for n, _ in secs if STEP.match(n)]
    if steps != [1, 2, 3, 4, 5]:
        err.append("checklist: phải có đúng 5 section `## Bước 1` … `## Bước 5`, theo thứ tự")

    def name_of(raw):
        """Tên item: bỏ đuôi nguồn và phần `— lý do`."""
        t = SRC_TAIL.search(raw)
        core = raw[:t.start()] if t else raw
        return core.split(" — ")[0].strip()

    first_open, n_open, n_done = None, 0, 0
    by_module = {}  # module trong Bước 4 → [tên item]
    for n, b in secs:
        m_step = STEP.match(n)
        if not m_step:
            continue
        step = m_step.group(1)
        current = None
        for ln in b:
            h3 = H3.match(ln)
            if h3:
                title = h3.group(1).strip()
                current = title[len(MODULE):].strip() if title.startswith(MODULE) else None
                if step != "4" or current is None:
                    err.append(f"checklist Bước {step}: heading `### {title}` — chỉ Bước 4 có `### {MODULE}<tên>`")
                elif not PLACEHOLDER.search(current):
                    by_module[current] = []
                continue
            if not ln.startswith("- "):
                continue
            it = ITEM.match(ln.strip())
            if not it or it.group(1) not in " x-":
                err.append(f"checklist Bước {step}: dòng `{ln.strip()[:50]}` không phải `- [ ]` / `- [x]` / `- [-]`")
                continue
            mark, raw = it.groups()
            where = f"checklist Bước {step} · {name_of(raw)[:40]}"
            if current in by_module:
                by_module[current].append(name_of(raw))
            if mark == " ":
                n_open += 1
                if first_open is None:
                    first_open = f"Bước {step}" + (f" · {current}" if current else "") + f" · {raw}"
                continue
            n_done += 1
            if mark == "-" and " — " not in raw:
                err.append(f"{where}: `[-]` phải ghi lý do sau ` — `")
            t = SRC_TAIL.search(raw)
            if not t:
                err.append(f"{where}: item đã đóng thiếu nguồn ở cuối, vd `(Q3)`")
                continue
            for r in refs(t.group(1), r","):
                oq = OQ_REF.match(r)
                if oq:
                    if oq.group(1) not in ctx["oq"]:
                        err.append(f"{where}: `{oq.group(1)}` không có ở Câu hỏi còn mở")
                elif not SRC.match(r):
                    err.append(f"{where}: nguồn `{r}` không phải Q<n> / A-<n> / `đề` / `→ OQ-<n>`")
                elif r != "đề" and r not in ctx["src"]:
                    err.append(f"{where}: nguồn `{r}` không có ở Nhật ký hay Giả định")

    # Bước 4 khớp module và feature của brief
    for m, feats in ctx["features"].items():
        if m not in by_module:
            err.append(f"checklist Bước 4: thiếu khối `### {MODULE}{m}`")
            continue
        names = by_module[m]
        for need in MODULE_ITEMS + tuple(feats):
            if need not in names:
                err.append(f"checklist Bước 4 · {m}: thiếu item `{need}`")
    for m in by_module:
        if m not in ctx["features"]:
            err.append(f"checklist Bước 4: khối `### {MODULE}{m}` không có section `## {MODULE}{m}` ở brief")

    if n_open and final:
        err.append(f"brief đã `confirmed` mà checklist còn {n_open} item mở, đầu tiên: {first_open}")
    left = [ln.strip() for ln in lines if PLACEHOLDER.search(re.sub(r"`[^`]*`", "", ln))]
    if left:
        (err if final else warn).append(f"checklist còn {len(left)} dòng chưa điền chỗ trống của khuôn, vd: {left[0][:70]}")
    info.append(f"checklist: {n_done} item đã đóng · {n_open} item mở"
                + (f" · kế tiếp: {first_open}" if first_open else ""))
    return err, warn, info


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("path", nargs="+")
    a = ap.parse_args()
    rc = 0
    for raw in a.path:
        path = Path(raw)
        if path.is_dir():
            path = path / BRIEF
        elif path.name == CHECKLIST:  # đưa checklist thì kiểm brief đi kèm
            path = path.with_name(BRIEF)
        if not path.is_file():
            print(f"không thấy file: {path}")
            rc = 2
            continue
        err, warn, info, ctx = lint(path.read_text(encoding="utf-8"))
        cpath = path.with_name(CHECKLIST)
        if cpath.is_file():
            e2, w2, i2 = lint_checklist(cpath.read_text(encoding="utf-8"), ctx)
            err, warn, info = err + e2, warn + w2, info + i2
        else:
            err.append(f"không thấy `{CHECKLIST}` cạnh brief")
        print(f"\n=== {path} — {len(err)} ERROR · {len(warn)} WARN")
        for i in info:
            print(f"  INFO   {i}")
        for e in err:
            print(f"  ERROR  {e}")
        for w in warn:
            print(f"  WARN   {w}")
        if not err and not warn:
            print("  sạch")
        rc = rc or (1 if err else 0)
    return rc


if __name__ == "__main__":
    sys.exit(main())
