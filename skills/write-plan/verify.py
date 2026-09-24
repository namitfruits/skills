#!/usr/bin/env python3
"""Lint một plan doc viết theo SKILL.md. Read-only, không sửa file.

    python3 .claude/skills/write-plan/verify.py <plan.md>

Bắt được: khung 7 section, sợi dây `P → D → DS → phase`, phủ `DS`, tick/status,
ô duyệt đứng ngoài phase, phase cuối là nghiệm thu, `D` ghi ai quyết,
§1–§3 không mang tên code / không trỏ ID, §3 có hình.
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
]
STATUS_OK = ("draft", "approved", "done")
ACCEPT = "nghiệm thu"  # tên mốc của phase cuối — luật 21
FENCE = re.compile(r"^```\s*mermaid\s*$")
DIR = re.compile(r"^\s*(?:flowchart|graph)\s+(TB|TD|LR|RL|BT)\b")
NODE = re.compile(r"([A-Za-z_][A-Za-z0-9_]*)\s*[\[\(\{]")

H2 = re.compile(r"^## (\d)\.\s+(.+?)\s*$")
H3 = re.compile(r"^### (~~)?(DS|Phase|D|P)\s*(\d+)(~~)?\b(.*)$")
D_REF = re.compile(r"\(D(\d+)\)")
DS_REF = re.compile(r"\bDS(\d+)\b")
P_REF = re.compile(r"\bP(\d+)\b")
BH_REF = re.compile(r"\bBH(\d+)\b")
BH_ROW = re.compile(r"^\|\s*`?BH(\d+)`?\s*\|")
ITEM = re.compile(r"^\s*-\s*\[( |x)\]\s*(.*)$")
COVER = re.compile(r"^\*\*Cover:\*\*\s*(.*)$")

# §1–§3 viết cho người chưa mở repo — luật 23. Lệnh / URL có dấu cách (`npx foo`, `POST /orders`) cho
# qua; chỉ bắt dấu hiệu chắc là tên trong code: gọi hàm, camelCase, snake_case, `a.b`, `key: value`, `{…}`
CODE_SPAN = re.compile(r"`([^`\n]+)`")
CODE_ALWAYS = re.compile(r"\w\(|\b[a-z]+[A-Z]|^\w+:\s|[{}]")
CODE_TOKEN = re.compile(r"[A-Za-z0-9]_[A-Za-z0-9]|[A-Za-z]\.[A-Za-z]")
ID_REF = re.compile(r"\b(?:DS|D|P)\d+\b")
NODE_OPEN = re.compile(r"\b[A-Za-z_]\w*(\[\[|\[\(|\(\(|\(\[|\{\{|\[|\(|\{|>)")
NODE_CLOSE = {"[[": "]]", "[(": ")]", "((": "))", "([": "])", "{{": "}}",
              "[": "]", "(": ")", "{": "}", ">": "]"}
EDGE_LABEL = re.compile(r"\|([^|]+)\|")
MERMAID_STYLE = re.compile(r"^\s*(classDef|class|style|linkStyle)\b")


def mermaid_labels(ln):
    """Chữ trong nhãn node + nhãn cạnh của một dòng mermaid."""
    out, pos = [], 0
    while True:
        m = NODE_OPEN.search(ln, pos)
        if not m:
            break
        close = ln.find(NODE_CLOSE[m.group(1)], m.end())
        if close < 0:
            break
        out.append(ln[m.end():close].strip().strip('"'))
        pos = close + len(NODE_CLOSE[m.group(1)])
    return out + EDGE_LABEL.findall(ln)


def code_names(body):
    """Tên trông như trong code ở phần lời + nhãn node mermaid của một section."""
    found, fence = [], None
    for ln in body:
        if ln.strip().startswith("```"):
            fence = None if fence is not None else ("mermaid" if FENCE.match(ln) else "other")
            continue
        if fence == "other":
            continue
        if fence == "mermaid":
            if MERMAID_STYLE.match(ln):
                continue
            for text in mermaid_labels(ln):
                if re.search(r"\w\(|\b[a-z]+[A-Z]", text) or CODE_TOKEN.search(text):
                    found.append(text)
            continue
        for span in CODE_SPAN.findall(ln):
            if "://" in span:
                continue
            if CODE_ALWAYS.search(span) or (" " not in span.strip() and CODE_TOKEN.search(span)):
                found.append(f"`{span}`")
    return found


def mermaid_blocks(body):
    """[(dòng trong khối, …)] cho từng ```mermaid trong một section."""
    out, cur = [], None
    for ln in body:
        if FENCE.match(ln):
            cur = []
            continue
        if cur is not None and ln.strip().startswith("```"):
            out.append(cur)
            cur = None
            continue
        if cur is not None:
            cur.append(ln)
    return out


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
    """Cắt §4/§5/§6/§7 thành từng `### P<n>` / `### D<n>` / `### DS<n>` / `### Phase <n>`."""
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


def lint(text, path=None):
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
            err.append(f"`## {num}.` ngoài khung 1–7 (luật 11)")

    # --- §3 hai hình trước/sau (proxy cơ học, không kiểm được ngữ nghĩa)
    figs = mermaid_blocks(sec.get(3, ("", []))[1])
    if len(figs) == 2:
        a, b = figs
        norm = lambda f: "\n".join(l.strip() for l in f if l.strip())
        if norm(a) == norm(b):
            warn.append("§3: hai hình giống hệt nhau — luồng không đổi hình dạng thì vẽ **một** hình")
        da = DIR.search("\n".join(a))
        db = DIR.search("\n".join(b))
        if da and db and da.group(1) != db.group(1):
            warn.append(f"§3: hình `Bây giờ` hướng {da.group(1)}, hình `Sau plan` hướng {db.group(1)} "
                        f"— cùng hướng thì mắt mới so được")
        na, nb = set(NODE.findall("\n".join(a))), set(NODE.findall("\n".join(b)))
        if na and nb and not (na & nb):
            warn.append("§3: hai hình không chung node nào — đang vẽ hai hệ thống khác nhau, "
                        "không phải trước/sau của cùng một đường")
        if nb - na and ":::" not in "\n".join(b) and "classDef" not in "\n".join(b):
            warn.append(f"§3: hình `Sau plan` thêm node ({' · '.join(sorted(nb - na))}) nhưng không tô "
                        f"màu chỗ đổi — người đọc phải tự dò")
    elif len(figs) > 2:
        warn.append(f"§3 có {len(figs)} hình — khuôn là `Bây giờ` + `Sau plan`, nhiều hơn thì "
                    f"chia nhỏ luồng trước")
    elif not figs and 3 in sec:
        warn.append("§3 không có hình — mặc định có hình, chỉ bỏ khi luồng thẳng một mạch ≤3 bước "
                    "(luật 23)")

    # --- §1–§3 cho người chưa mở repo (luật 23)
    for num in (1, 2, 3):
        body = sec.get(num, ("", []))[1]
        names = code_names(body)
        if names:
            more = f" … (+{len(names) - 5})" if len(names) > 5 else ""
            warn.append(f"§{num} có tên trông như trong code: {' · '.join(names[:5])}{more} — kể bằng "
                        f"chuyện xảy ra, tên hàm/field/file để dành cho §6–§7 (luật 23)")
        text = "\n".join(l for l in body if not l.strip().startswith("```"))
        ids = sorted(set(ID_REF.findall(text)))
        if ids:
            warn.append(f"§{num} trỏ {' · '.join(ids)} — kể luôn nội dung, người đọc §1–§3 không phải "
                        f"lật xuống dưới (luật 23)")

    # --- §3 bảng hành vi: `H<n>` để Gate §7 trỏ về
    hrows = {int(BH_ROW.match(ln).group(1)) for ln in sec.get(3, ("", []))[1] if BH_ROW.match(ln)}

    # --- §5 Decisions (parse trước: §4 kiểm phủ `P` từ phía `D` nhắc nó)
    decisions = {d["id"]: d for d in blocks(sec.get(5, ("", []))[1], "D")}
    cited_p = {}
    designs = {d["id"]: d for d in blocks(sec.get(6, ("", []))[1], "DS")}
    _decisions_ids = set(decisions)

    # --- §4 Probe (mỗi `P` một block, cùng hình dạng `D`/`DS`)
    probes, probe_pending = {}, []
    for pb in blocks(sec.get(4, ("", []))[1], "P"):
        pid, body = pb["id"], "\n".join(pb["lines"])
        probes[pid] = body
        for lab in ("**Biết để làm gì:**", "**Cách chạy lại:**", "**Kết quả:**"):
            if lab not in body:
                warn.append(f"P{pid} thiếu dòng `{lab}` (luật 16)")
        back = sorted({int(d) for d in re.findall(r"\bD(\d+)\b", pb["title"] + body)})
        if back:
            warn.append(f"P{pid} trỏ ngược về {' · '.join('D%d' % d for d in back)} — dây nối `P`↔`D` "
                        f"viết một chiều ở phía `D` (`**Lý do:** dựa vào P{pid}`), luật 16")
        if "chưa chạy" in body:
            probe_pending.append(pid)
    if probe_pending and status in ("approved", "done"):
        err.append(f"status `{status}` nhưng còn probe chưa chạy: "
                   f"{' · '.join('P%d' % i for i in probe_pending)} — duyệt trên giả định (luật 16)")

    # --- §5 Decisions
    for did, d in decisions.items():
        title = d["title"]
        if re.search(r"\d{4}-\d{2}-\d{2}", title):
            warn.append(f"D{did} có ngày tháng ở heading — heading chỉ mang ID · dấu · câu quyết định; "
                        f"ngày xuống dòng `**Đổi (YYYY-MM-DD):**` (luật 22)")
        if d["dropped"]:
            continue
        if "🤖" not in title and "👤" not in title:
            warn.append(f"D{did} thiếu 🤖/👤 ở heading — không biết ai quyết (luật 22)")
        body = [l for l in d["lines"] if l.strip()]
        if len(body) > 5:
            warn.append(f"D{did} dài {len(body)} dòng (>5) — chi tiết xuống một `DS` (luật 13)")
        for ds in DS_REF.findall("\n".join(d["lines"])):
            if int(ds) not in designs:
                err.append(f"D{did} trỏ `DS{ds}` không có trong §6 (luật 13)")
        for pid in P_REF.findall("\n".join(d["lines"])):
            cited_p.setdefault(int(pid), []).append(f"D{did}")
            if int(pid) not in probes:
                err.append(f"D{did} trỏ `P{pid}` không có trong §4 (luật 16)")

    for pid in sorted(probes):
        if pid not in cited_p:
            err.append(f"P{pid} không `D` nào nhắc tới — probe không đổi được quyết định nào là probe "
                       f"thừa, cắt (luật 16)")
        elif pid in probe_pending:
            info.append(f"P{pid} chưa chạy — {' · '.join(cited_p[pid])} chưa có nền")

    # --- §6 Design
    for dsid, d in designs.items():
        if not d["dropped"] and not d["title"].lstrip("—- ").strip():
            warn.append(f"DS{dsid} không có tên hạng mục — heading phải nói loại contract (§6 luật 1)")

    # --- §7 Phases
    body7 = sec.get(7, ("", []))[1]
    phases = blocks(body7, "Phase")
    if not phases:
        err.append("§7 không có `### Phase <n>` nào (luật 7)")

    head = []
    for ln in body7:
        if H3.match(ln):
            break
        head.append(ln)
    if not any(ITEM.match(ln) and "duyệt" in ln for ln in head):
        err.append("§7 thiếu ô `- [ ] 👤 plan này được duyệt` ngay dưới Legend, ngoài mọi phase "
                   "— ô đó chặn cả §7 (luật 2)")
    if phases:
        for ph in phases[:-1]:
            if ACCEPT in ph["title"].lower():
                err.append(f"Phase {ph['id']} là nghiệm thu nhưng không đứng cuối §7 (luật 21)")
        if ACCEPT not in phases[-1]["title"].lower():
            err.append(f"phase cuối (Phase {phases[-1]['id']}) không phải nghiệm thu — thêm "
                       f"`### Phase <n> — nghiệm thu` chạy lại từng bullet §2 (luật 21)")

    full, partial, cited_d, cited_h, acc_gate = {}, {}, set(), set(), None
    for ph in phases:
        tag = f"Phase {ph['id']}"
        is_acc = ACCEPT in ph["title"].lower()
        cover, actions, gate = phase_parts(ph["lines"])
        if is_acc:
            acc_gate = gate
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
        for h in BH_REF.findall("\n".join(actions + gate)):
            cited_h.add(int(h))
            if int(h) not in hrows:
                err.append(f"{tag} trích `BH{h}` không có trong bảng hành vi §3")
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
            if ph["id"] != 0 and not is_acc:
                err.append(f"{tag} không cover `DS` nào — chỉ phase 0 và phase nghiệm thu "
                           f"được phép (luật 17)")
            continue
        if is_acc:
            err.append(f"{tag} là nghiệm thu nhưng khai `Cover:` — để trống, nó chạy lại §2 "
                       f"chứ không hiện thực `DS` nào (luật 21)")
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

    for h in sorted(hrows - cited_h):
        warn.append(f"BH{h} không Gate nào nhắc — khai một hành vi đổi mà không ai chứng minh (§3)")

    if acc_gate is not None:
        goals = [l for l in sec.get(2, ("", []))[1]
                 if re.match(r"^\s*[-*]\s+\S", l) and "ngoài scope" not in l.lower()]
        if goals and len(acc_gate) < len(goals):
            warn.append(f"phase nghiệm thu có {len(acc_gate)} item Gate < {len(goals)} bullet §2 "
                        f"— mỗi bullet §2 một dòng bằng chứng (luật 21)")

    # --- dòng bê nguyên từ template mà chưa điền (luật 4)
    tpl = Path(__file__).with_name("template.md")
    same = path and Path(path).resolve() == tpl.resolve()  # chính template thì bỏ qua
    if tpl.is_file() and not same:
        blank = {l.strip() for l in tpl.read_text(encoding="utf-8").splitlines()
                 if l.strip() and (("<" in l and ">" in l) or "_(" in l)}
        left = sorted({l.strip() for l in lines if l.strip() in blank})
        if left:
            where = "ERROR" if status in ("approved", "done") else "WARN"
            msg = (f"{len(left)} dòng còn nguyên chỗ trống của `template.md`, chưa điền: "
                   f"{left[0][:60]}…" if len(left) > 1 else
                   f"còn nguyên chỗ trống của `template.md`: {left[0][:60]}")
            (err if where == "ERROR" else warn).append(msg + " (luật 4)")

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
        err, warn, info = lint(path.read_text(encoding="utf-8"), path)
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
