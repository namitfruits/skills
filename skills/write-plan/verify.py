#!/usr/bin/env python3
"""Lint một plan doc viết theo SKILL.md. Read-only, không sửa file.

    python3 .claude/skills/write-plan/verify.py <plan.md>

Bắt được: khung 8 section, sợi dây `P → D → DS → phase`, phủ `DS`, tick/status.
KHÔNG bắt được: item có kiểm được thật không, Gate có đúng bằng chứng không,
phase chia theo "cái dùng được trước" hay theo tầng — mấy cái đó phải đọc.

Exit 1 nếu có ERROR.
"""
import argparse
import re
import sys
from pathlib import Path

# Khung cố định — luật 11. §4 Probe là section duy nhất được vắng (luật 16).
SECTIONS = [
    (1, "Problem", True),
    (2, "Goal", True),
    (3, "Mental model", True),
    (4, "Probe", False),
    (5, "Decisions", True),
    (6, "Design", True),
    (7, "Phases", True),
    (8, "Risks", True),
]
STATUS_OK = ("draft", "approved", "done")

H2 = re.compile(r"^## (\d)\.\s+(.+?)\s*$")
H3 = re.compile(r"^### (~~)?(D|DS|Phase)\s*(\d+)(~~)?\b(.*)$")
D_REF = re.compile(r"\(D(\d+)\)")
DS_REF = re.compile(r"\bDS(\d+)\b")
P_REF = re.compile(r"\bP(\d+)\b")
ITEM = re.compile(r"^\s*-\s*\[( |x)\]\s*(.*)$")
COVER = re.compile(r"^\*\*Cover:\*\*\s*(.*)$")


def front_matter(lines):
    if not lines or lines[0].strip() != "---":
        return {}, 0
    for i in range(1, len(lines)):
        if lines[i].strip() == "---":
            fm = {}
            for ln in lines[1:i]:
                if ":" in ln and not ln.startswith(" "):
                    k, v = ln.split(":", 1)
                    fm[k.strip()] = v.split("#")[0].strip()
            return fm, i + 1
    return {}, 0


def split_sections(lines, start):
    """→ {num: (name, [dòng])} theo thứ tự xuất hiện + danh sách (num, name) để kiểm thứ tự."""
    out, order, cur = {}, [], None
    for ln in lines[start:]:
        m = H2.match(ln)
        if m:
            cur = int(m.group(1))
            out[cur] = (m.group(2), [])
            order.append((cur, m.group(2)))
            continue
        if cur is not None:
            out[cur][1].append(ln)
    return out, order


def blocks(body, kind):
    """Cắt §5/§6/§7 thành từng `### D<n>` / `### DS<n>` / `### Phase <n>`."""
    found, cur = [], None
    for ln in body:
        m = H3.match(ln)
        if m and m.group(2) == kind:
            cur = {"id": int(m.group(3)), "dropped": bool(m.group(1)),
                   "title": m.group(5).strip(), "lines": []}
            found.append(cur)
        elif m or ln.startswith("## "):
            cur = None
        elif cur is not None:
            cur["lines"].append(ln)
    return found


def phase_parts(lines):
    """Phase → (dòng Cover, [item Actions], [item Gate])."""
    cover, part, actions, gate = None, None, [], []
    for ln in lines:
        m = COVER.match(ln)
        if m:
            cover = m.group(1)
            continue
        low = ln.lower()
        if low.startswith("**actions"):
            part = "a"
            continue
        if low.startswith("**gate"):
            part = "g"
            continue
        if ITEM.match(ln):
            (actions if part == "a" else gate if part == "g" else []).append(ln)
    return cover, actions, gate


def lint(text):
    err, warn, info = [], [], []
    lines = text.splitlines()
    fm, start = front_matter(lines)

    if fm.get("type") != "plan":
        err.append("front matter thiếu `type: plan` (luật 4)")
    status = fm.get("status", "")
    if status not in STATUS_OK:
        err.append(f"`status: {status or '(trống)'}` — phải là draft · approved · done (luật 15)")

    sec, order = split_sections(lines, start)
    nums = [n for n, _ in order]
    if nums != sorted(nums):
        err.append(f"section không tăng dần: {nums} (luật 11)")
    for num, name, required in SECTIONS:
        if num not in sec:
            if required:
                err.append(f"thiếu `## {num}. {name}` (luật 11)")
            continue
        got = sec[num][0]
        if name.lower() not in got.lower():
            err.append(f"`## {num}. {got}` — số {num} phải là **{name}** (luật 11)")
    for num in sec:
        if num not in [s[0] for s in SECTIONS]:
            err.append(f"`## {num}.` ngoài khung 1–8 (luật 11)")

    # --- §5 Decisions (parse trước để §4 kiểm được `chặn D<n>`)
    decisions = {d["id"]: d for d in blocks(sec.get(5, ("", []))[1], "D")}
    designs = {d["id"]: d for d in blocks(sec.get(6, ("", []))[1], "DS")}
    _decisions_ids = set(decisions)

    # --- §4 Probe
    probes, probe_pending = {}, []
    if 4 in sec:
        for ln in sec[4][1]:
            if not ln.startswith("|") or "---" in ln:
                continue
            m = P_REF.search(ln)
            if not m:
                continue
            pid = int(m.group(1))
            probes[pid] = ln
            if "chưa chạy" in ln:
                probe_pending.append(pid)
                blocked = [f"D{d}" for d in D_REF.findall(ln)] or \
                          [f"D{d}" for d in re.findall(r"chặn `?D(\d+)", ln)]
                info.append(f"P{pid} chưa chạy" + (f" — chặn {' · '.join(blocked)}" if blocked else ""))
    for pid, row in probes.items():
        for d in set(D_REF.findall(row)) | set(re.findall(r"chặn `?D(\d+)", row)):
            if int(d) not in _decisions_ids:
                err.append(f"P{pid} trỏ `D{d}` không có trong §5 (luật 16)")
    if probe_pending and status in ("approved", "done"):
        err.append(f"status `{status}` nhưng còn probe chưa chạy: "
                   f"{' · '.join('P%d' % i for i in probe_pending)} — duyệt trên giả định (luật 16)")

    # --- §5 Decisions
    for did, d in decisions.items():
        if d["dropped"]:
            continue
        body = [l for l in d["lines"] if l.strip()]
        if len(body) > 5:
            warn.append(f"D{did} dài {len(body)} dòng (>5) — chi tiết xuống một `DS` (luật 13)")
        for ds in DS_REF.findall("\n".join(d["lines"])):
            if int(ds) not in designs:
                err.append(f"D{did} trỏ `DS{ds}` không có trong §6 (luật 13)")
        for pid in P_REF.findall("\n".join(d["lines"])):
            if int(pid) not in probes:
                err.append(f"D{did} trỏ `P{pid}` không có trong §4 (luật 16)")

    # --- §6 Design
    for dsid, d in designs.items():
        if not d["dropped"] and not d["title"].lstrip("—- ").strip():
            warn.append(f"DS{dsid} không có tên hạng mục — heading phải nói loại contract (§6 luật 1)")

    # --- §7 Phases
    phases = blocks(sec.get(7, ("", []))[1], "Phase")
    if not phases:
        err.append("§7 không có `### Phase <n>` nào (luật 7)")
    full, partial, cited_d = {}, {}, set()
    for ph in phases:
        tag = f"Phase {ph['id']}"
        cover, actions, gate = phase_parts(ph["lines"])
        if not actions:
            err.append(f"{tag} không có **Actions** (luật 7)")
        if not gate:
            err.append(f"{tag} không có **Gate** (luật 7)")
        for it in actions + gate:
            if "🤖" not in it and "👤" not in it:
                warn.append(f"{tag}: item thiếu 🤖/👤 — {ITEM.match(it).group(2)[:60]} (luật 7)")
            m = ITEM.match(it)
            if m.group(1) == "x":
                tail = m.group(2).split("—")[-1] if "—" in m.group(2) else ""
                if not re.search(r"\d", tail):
                    warn.append(f"{tag}: `[x]` không có bằng chứng (số/ngày sau `—`) — "
                                f"{m.group(2)[:60]} (luật 10)")
        for d in D_REF.findall("\n".join(actions + gate)):
            cited_d.add(int(d))
            if int(d) not in decisions:
                err.append(f"{tag} trích `(D{d})` không có trong §5 (luật 17)")
            elif decisions[int(d)]["dropped"]:
                err.append(f"{tag} trích `(D{d})` đã bị gạch bỏ (luật 14)")

        if cover is None:
            err.append(f"{tag} thiếu dòng `**Cover:**` (luật 17)")
            continue
        cover = re.sub(r"_\(.*?\)_", "", cover)  # chú thích _(…)_ hay chứa chữ "một phần"
        items = [c.strip() for c in cover.split("·") if DS_REF.search(c)]
        if not items:
            if ph["id"] != 0:
                err.append(f"{tag} không cover `DS` nào — chỉ phase 0 được phép (luật 17)")
            continue
        for part in items:
            dsid = int(DS_REF.search(part).group(1))
            if dsid not in designs:
                err.append(f"{tag} cover `DS{dsid}` không có trong §6 (luật 17)")
                continue
            if designs[dsid]["dropped"]:
                err.append(f"{tag} cover `DS{dsid}` đã bị gạch bỏ (luật 14)")
                continue
            if "một phần" in part:
                partial.setdefault(dsid, []).append(tag)
            else:
                full.setdefault(dsid, []).append(tag)
                if not DS_REF.search("\n".join(gate)) or \
                        f"DS{dsid}" not in "\n".join(gate):
                    warn.append(f"{tag} nhận trọn DS{dsid} nhưng Gate không có item nào "
                                f"chứng minh contract đó (luật 17)")

    for dsid, d in designs.items():
        if d["dropped"]:
            continue
        if dsid not in full:
            where = f" (mới có {' · '.join(partial[dsid])})" if dsid in partial else ""
            err.append(f"DS{dsid} không phase nào cover trọn{where} — thiết kế chết, "
                       f"cắt `DS{dsid}` hoặc thêm phase (luật 17)")
        elif len(full[dsid]) > 1:
            err.append(f"DS{dsid} được {len(full[dsid])} phase cùng nhận trọn "
                       f"({' · '.join(full[dsid])}) — tách `DS` ra (luật 17)")

    # --- tick vs status (luật 15)
    open_boxes = sum(1 for ln in lines if ITEM.match(ln) and ITEM.match(ln).group(1) == " ")
    approved = any(ITEM.match(ln) and ITEM.match(ln).group(1) == "x" and "duyệt" in ln
                   for ln in lines)
    if status == "done" and open_boxes:
        err.append(f"status `done` nhưng còn {open_boxes} ô `[ ]` (luật 15)")
    if status in ("approved", "done") and not approved:
        err.append("status `approved`/`done` nhưng ô `👤 plan này được duyệt` chưa tick (luật 15)")

    # --- bảng phủ (INFO — không phải lỗi)
    if designs:
        info.append("phủ thiết kế:")
        for dsid in sorted(designs):
            d = designs[dsid]
            if d["dropped"]:
                info.append(f"  DS{dsid}  ~~bỏ~~")
                continue
            got = [f"{p} (một phần)" for p in partial.get(dsid, [])] + full.get(dsid, [])
            name = d["title"].lstrip("—- ").split("_(")[0].strip()
            info.append(f"  DS{dsid}  {name[:28]:<28} {' · '.join(got) or '—'}")
    loose = sorted(i for i in decisions if not decisions[i]["dropped"] and i not in cited_d)
    if loose:
        info.append("D không action nào trích: " + " · ".join(f"D{i}" for i in loose) +
                    " — không phải lỗi, `D` là ràng buộc chứ không phải vật giao được (luật 17)")
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
