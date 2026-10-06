#!/usr/bin/env python3
"""Lint doc requirement của skill ba-v1.

Kiểm phần cấu trúc kiểm được bằng code: khung section (Tổng quan · Actor · Module · … · Nhật ký), bảng module ở Tổng
quan khớp các section `## Module · …`, mỗi feature trỏ tới story có thật, mỗi story có actor, ưu tiên MoSCoW, nguồn
trỏ về câu hỏi có thật, AC dạng Given/When/Then có cả nhánh chính lẫn nhánh lỗi, ID không trùng, cột Module trỏ đúng
tên module, không còn chỗ trống của template. Mâu thuẫn về nghĩa thì agent soát ở Bước 4 của SKILL.md.

    python3 verify.py <doc.md> [<doc.md> ...]

Thoát 0 khi không có ERROR, 1 khi có, 2 khi không thấy file.
"""
import argparse
import re
import sys
from pathlib import Path

HEAD = ["Tổng quan", "Actor"]
TAIL = ["Thuật ngữ & dữ liệu", "Phi chức năng", "Giả định", "Câu hỏi còn mở", "Nhật ký phỏng vấn"]
MODULE = "Module · "
STATUS_OK = ("draft", "confirmed")
MOSCOW = ("Must", "Should", "Could", "Won't")
AC_TAGS = ("chính", "lỗi", "biên")
SHARED = "chung"

H2 = re.compile(r"^## (.+?)\s*$")
H3 = re.compile(r"^### (.+?)\s*$")
US_HEAD = re.compile(r"^#### US-(\d+)\s*·\s*(.+?)\s*$")
STORY = re.compile(r"\*\*Là\*\*\s*(.+?),\s*\*\*tôi muốn\*\*\s*(.+?),\s*\*\*để\*\*\s*(.+)")
META = re.compile(r"^Ưu tiên:\s*([^·]+?)\s*·\s*Nguồn:\s*(.+?)\s*$")
AC = re.compile(r"^- AC-(\d+)\.(\d+)\s*\[([^\]]+)\]\s*(.*)$")
GWT = re.compile(r"\bGiven\b.+\bWhen\b.+\bThen\b")
WANT = re.compile(r"^\*\*Mong muốn:\*\*\s*(.*)$")
TASK = re.compile(r"^- (.+?)\s+—\s+(.+?)\s*$")
US_REF = re.compile(r"\bUS-(\d+)\b")
OUT = re.compile(r"^\*\*Ngoài phạm vi:\*\*\s*(.*)$")
ROW = re.compile(r"^\|(.+)\|\s*$")
SEP = re.compile(r"^\|[\s:|-]+\|\s*$")
SRC = re.compile(r"^(Q\d+|A-\d+|đề)$")
SRC_INLINE = re.compile(r"\(Nguồn:\s*([^)]*)\)")
PLACEHOLDER = re.compile(r"<(?!/?br\b)[^<>`\n]{2,}>|YYYY-MM-DD")


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


def plain(s):
    return re.sub(r"[*`_]", "", s).strip()


def refs(raw):
    return [s.strip() for s in re.split(r"[,·]", raw) if s.strip()]


def lint(text):
    err, warn, info = [], [], []
    lines = text.splitlines()
    fm, start = front_matter(lines)

    if fm.get("type") != "requirements":
        err.append("front matter thiếu `type: requirements`")
    status = fm.get("status", "")
    if status not in STATUS_OK:
        err.append(f"`status: {status or '(trống)'}`: phải là draft hoặc confirmed")
    final = status == "confirmed"

    # --- khung section: Tổng quan · Actor · Module · … (≥ 1) · 5 section cuối
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
            err.append("sai thứ tự section: Tổng quan · Actor · các `Module · …` · " + " · ".join(TAIL))
    if not modules:
        err.append(f"chưa có section `## {MODULE}<tên>` nào")
    sec = {n: b for n, b in secs}
    body = lambda n: sec.get(n, [])
    known_mod = {m.lower() for m in modules} | {SHARED}

    def check_mod(where, raw):
        if PLACEHOLDER.search(raw) or PLACEHOLDER.search(where):
            return  # ô còn chỗ trống của template: đã báo ở cuối
        for m in refs(plain(raw)):
            if m.lower() not in known_mod:
                err.append(f"{where}: module `{m}` không có section `## {MODULE}{m}` (hay ghi `{SHARED}`)")

    # --- Tổng quan: bảng module khớp section, Ngoài phạm vi
    overview = body("Tổng quan")
    listed = [plain(r[0]) for r in table(overview) if plain(r[0]) and not PLACEHOLDER.search(r[0])]
    for m in real_modules:
        if m not in listed:
            err.append(f"module `{m}` có section nhưng không có trong bảng ở Tổng quan")
    for m in listed:
        if m not in modules:
            err.append(f"bảng Tổng quan có module `{m}` nhưng không có section `## {MODULE}{m}`")
    out = next((OUT.match(ln.strip()) for ln in overview if OUT.match(ln.strip())), None)
    if not out or not plain(out.group(1)):
        err.append("Tổng quan thiếu dòng `**Ngoài phạm vi:** …` — không có nó là bất đồng ngầm về thứ không làm")
    if not overview or not any(ln.startswith(">") for ln in overview):
        warn.append("Tổng quan chưa chép đề nguyên văn (dòng `> …`)")

    # --- ID và nguồn
    log = table(body("Nhật ký phỏng vấn"))
    q_ids = [plain(r[0]) for r in log]
    a_rows = table(body("Giả định"))
    a_ids = [plain(r[0]) for r in a_rows]
    known_src = set(q_ids) | set(a_ids)
    cited = set()
    if not log:
        err.append("Nhật ký phỏng vấn trống: mọi câu đã hỏi phải có một dòng")

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

    # --- Actor
    actors = [plain(r[0]) for r in table(body("Actor")) if plain(r[0])]
    if not actors:
        err.append("mục Actor chưa có actor nào")
    for r in table(body("Actor")):
        if len(r) > 2:
            check_mod(plain(r[0]), r[2])

    # --- từng module
    all_us, br_ids, used_actor = [], [], set()
    prio_count = {p: 0 for p in MOSCOW}
    for m in modules:
        mb = body(MODULE + m)
        tag_m = f"Module {m}"
        # Mong muốn là cả đoạn văn (có thể xuống dòng) bắt đầu bằng `**Mong muốn:**`
        idx = next((i for i, ln in enumerate(mb) if WANT.match(ln.strip())), None)
        want = None
        if idx is not None:
            para = []
            for ln in mb[idx:]:
                if not ln.strip():
                    break
                para.append(ln.strip())
            want = WANT.match(" ".join(para))
        if not want or not plain(want.group(1)):
            err.append(f"{tag_m}: thiếu dòng `**Mong muốn:** …`")
        else:
            src = SRC_INLINE.search(want.group(1))
            if src:
                check_src(f"{tag_m} · Mong muốn", src.group(1))
            else:
                warn.append(f"{tag_m}: Mong muốn chưa có `(Nguồn: …)`")
        subs = {n: b for n, b in split(mb, 0, H3)}
        if "Feature" not in subs:
            err.append(f"{tag_m}: thiếu `### Feature`")
        tasks = [TASK.match(ln.strip()) for ln in subs.get("Feature", []) if ln.strip().startswith("- ")]
        task_refs = set()
        for t, ln in zip(tasks, [l for l in subs.get("Feature", []) if l.strip().startswith("- ")]):
            if not t:
                # lúc mới chốt tổng quan (Bước 2) feature chưa có story là bình thường
                (err if final else warn).append(
                    f"{tag_m}: feature `{ln.strip()[2:60]}` chưa trỏ tới story (`— US-NN`) hay `— Won't`")
                continue
            target = t.group(2)
            ids = {int(x) for x in US_REF.findall(target)}
            if not ids and plain(target) != "Won't":
                err.append(f"{tag_m}: feature `{t.group(1)[:50]}` trỏ tới `{target}` — phải là US-NN hay Won't")
            task_refs |= ids
        if not tasks:
            err.append(f"{tag_m}: `### Feature` chưa có feature nào")

        us = []
        for name, lines_ in [(n, b) for n, b in split(subs.get("User story", []), 0, re.compile(r"^(#### .+)$"))]:
            h = US_HEAD.match(name)
            if not h:
                err.append(f"{tag_m}: heading `{name}` phải là `#### US-NN · <tên>`")
                continue
            us.append({"id": int(h.group(1)), "lines": lines_, "mod": m})
        if tasks and not us and any(t and plain(t.group(2)) != "Won't" for t in tasks):
            warn.append(f"{tag_m}: có feature nhưng chưa có user story nào — chưa qua Bước 3?")
        for s in us:
            if s["id"] not in task_refs:
                warn.append(f"US-{s['id']:02d} ({m}): không feature nào ở `Feature` trỏ tới")
        for i in task_refs:
            if i not in [s["id"] for s in us]:
                err.append(f"{tag_m}: `Feature` trỏ tới US-{i:02d} nhưng story đó không nằm trong module này")
        all_us += us
        for r in table(subs.get("Luật", [])):
            br_ids.append(plain(r[0]))
            check_src(plain(r[0]), r[2] if len(r) > 2 else "")

    # --- user story
    ids = [s["id"] for s in all_us]
    for d in sorted({i for i in ids if ids.count(i) > 1}):
        err.append(f"US-{d:02d} trùng")
    for s in all_us:
        tag = f"US-{s['id']:02d}"
        joined = " ".join(s["lines"])
        m = STORY.search(joined)
        if not m:
            err.append(f"{tag}: thiếu câu `**Là** …, **tôi muốn** …, **để** …`")
        else:
            who = plain(m.group(1))
            hit = [a for a in actors if a.lower() == who.lower()]
            if not hit and not PLACEHOLDER.search(m.group(1)):
                err.append(f"{tag}: actor `{who}` không có ở mục Actor")
            used_actor.update(hit)
        meta = next((META.match(ln.strip()) for ln in s["lines"] if META.match(ln.strip())), None)
        prio = None
        if not meta:
            err.append(f"{tag}: thiếu dòng `Ưu tiên: <Must|Should|Could|Won't> · Nguồn: …`")
        else:
            prio = meta.group(1).strip()
            if prio not in MOSCOW:
                err.append(f"{tag}: ưu tiên `{prio}` không thuộc Must · Should · Could · Won't")
            else:
                prio_count[prio] += 1
            check_src(tag, meta.group(2))
        tags = []
        for a in (AC.match(ln.strip()) for ln in s["lines"]):
            if not a:
                continue
            aid = f"AC-{a.group(1)}.{a.group(2)}"
            if int(a.group(1)) != s["id"]:
                err.append(f"{tag}: {aid} mang số của story khác")
            t = a.group(3).strip()
            tags.append(t)
            if t not in AC_TAGS:
                err.append(f"{aid}: nhãn `[{t}]` phải là [chính] · [lỗi] · [biên]")
            if not GWT.search(a.group(4)):
                err.append(f"{aid}: không theo dạng `Given … When … Then …`")
        if prio == "Won't":
            continue
        if "chính" not in tags:
            err.append(f"{tag}: chưa có AC [chính]")
        if not any(t in ("lỗi", "biên") for t in tags):
            err.append(f"{tag}: chưa có AC [lỗi] hay [biên] — story chỉ có đường suôn là lỗ hổng")
    if all_us and not prio_count["Must"]:
        err.append("không story nào là Must: MVP rỗng")
    for a in actors:
        if all_us and a not in used_actor:
            warn.append(f"actor `{a}` không có user story nào: thiếu story hay thừa actor?")

    # --- các bảng còn lại
    nfr = table(body("Phi chức năng"))
    oq = table(body("Câu hỏi còn mở"))
    for r in nfr:
        if len(r) > 1:
            check_mod(plain(r[0]), r[1])
        if len(r) > 3 and not plain(r[3]):
            err.append(f"{plain(r[0])}: thiếu cột `Đo bằng` — NFR không đo được thì chưa phải yêu cầu")
        check_src(plain(r[0]), r[4] if len(r) > 4 else "")
    for r in oq:
        if len(r) > 1:
            check_mod(plain(r[0]), r[1])
    for name, ids_ in (("Q", q_ids), ("A", a_ids), ("BR", br_ids), ("NFR", [plain(r[0]) for r in nfr]),
                       ("OQ", [plain(r[0]) for r in oq])):
        dup = sorted({i for i in ids_ if ids_.count(i) > 1})
        if dup:
            err.append(f"ID {name} trùng: {', '.join(dup)}")

    if not any(ln.strip().startswith("```mermaid") for ln in lines):
        warn.append("chưa có sơ đồ mermaid nào (ít nhất sơ đồ module ở Tổng quan)")
    if not any(n.startswith("Dữ liệu") for n, _ in split(body("Thuật ngữ & dữ liệu"), 0, H3)):
        warn.append("Thuật ngữ & dữ liệu chưa có bảng `### Dữ liệu — <thực thể>` nào")

    # câu hỏi `chung` (chốt module, chốt tổng quan) thường không sinh mục nào để trích
    loose = [plain(r[0]) for r in log if plain(r[0]) not in cited
             and (len(r) < 3 or plain(r[2]).lower() != SHARED)]
    if loose and all_us:
        warn.append("câu hỏi không mục nào trích làm nguồn: " + ", ".join(loose) +
                    " — trả lời đó đã vào doc chưa?")

    pending = [plain(r[0]) for r in a_rows if len(r) > 3 and "chờ" in r[3].lower()]
    blocking = [plain(r[0]) for r in oq if len(r) > 4 and plain(r[4]) not in ("", "—", "-")]
    for ids_, what in ((pending, "giả định chờ xác nhận"), (blocking, "câu hỏi mở đang chặn story")):
        if ids_:
            (err if final else warn).append(f"{len(ids_)} {what}: {', '.join(ids_)}")

    left = [ln.strip() for ln in lines if PLACEHOLDER.search(re.sub(r"`[^`]*`", "", ln))]
    if left:
        msg = f"còn {len(left)} dòng chưa điền chỗ trống của template, vd: {left[0][:70]}"
        (err if final else warn).append(msg)

    per_mod = {m: sum(1 for s in all_us if s["mod"] == m) for m in modules}
    info.append("module: " + " · ".join(f"{m} {n}" for m, n in per_mod.items()))
    info.append("ưu tiên: " + " · ".join(f"{p} {n}" for p, n in prio_count.items()) +
                f" · {len(all_us)} story · {len(log)} câu hỏi")
    return err, warn, info


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("path", nargs="+")
    a = ap.parse_args()
    rc = 0
    for raw in a.path:
        path = Path(raw)
        if not path.is_file():
            print(f"không thấy file: {path}")
            rc = 2
            continue
        err, warn, info = lint(path.read_text(encoding="utf-8"))
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
