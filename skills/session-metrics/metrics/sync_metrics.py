#!/usr/bin/env python3
# spec: F2 F3
"""Đọc transcript Claude Code của project này, ghi mỗi session ra .metrics/sessions/<sessionId>.json.

Chạy tay:     python3 .metrics/sync_metrics.py          đọc lại mọi transcript của project trên máy này
Chạy từ hook: python3 .metrics/sync_metrics.py --hook   đọc payload hook từ stdin, chỉ đọc lại transcript
              của session gọi hook. Hook trong .claude/settings.json gọi script khi người dùng gửi prompt, sau mỗi
              tool, khi agent chờ người dùng, cuối mỗi lượt, và khi session đóng.

File session được commit vào git, nên session chạy ở máy nào cũng về chung project. Script không xoá file session nào,
kể cả khi transcript của nó không còn. Xem metric: python3 .metrics/serve_metrics.py.

Cấu hình trong .metrics/config.json, thiếu key nào thì dùng mặc định key đó:
  "content": "full" | "numbers"   numbers: bỏ mọi chữ, chỉ giữ số liệu, tên tool, tên skill
  "stageSkills": [tên skill]      skill mở chặng mới, không phải bước con của skill điều phối đứng trước

File này do skill session-metrics chép vào. Sửa ở đây thì lần cài lại sau sẽ ghi đè.
"""
import json
import os
import platform
import re
import sys
from datetime import datetime
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
TRANSCRIPT_DIR = Path.home() / ".claude" / "projects" / re.sub(r"[^A-Za-z0-9]", "-", str(ROOT))
SESSION_DIR = ROOT / ".metrics" / "sessions"
MACHINE = platform.node()


def load_config():
    config = {"content": "full", "stageSkills": []}
    try:
        user = json.loads((ROOT / ".metrics" / "config.json").read_text(encoding="utf-8"))
    except (OSError, ValueError):
        return config
    if user.get("content") in ("full", "numbers"):
        config["content"] = user["content"]
    if isinstance(user.get("stageSkills"), list):
        config["stageSkills"] = [s for s in user["stageSkills"] if isinstance(s, str)]
    return config


CONFIG = load_config()

PREVIEW_CHARS = 1500

# Chuỗi trông giống secret bị thay bằng REDACTED trước khi ghi, vì file session được commit.
# Mẫu KEY=value chỉ bắt tên viết hoa kiểu biến môi trường và header HTTP, và bỏ qua giá trị là kiểu dữ liệu hay tham
# chiếu biến (PROXY_SECRET: string, X_TOKEN=${X_TOKEN}), để code TypeScript, shell không bị che nhầm. Mật khẩu viết
# trong câu văn ("mật khẩu `abc`") thì mẫu không bắt được.
REDACTED = "«redacted»"
SECRET_TOKENS = re.compile("|".join([
    r"sk-(?:ant-)?[A-Za-z0-9_-]{20,}",
    r"gh[pousr]_[A-Za-z0-9]{30,}",
    r"AKIA[0-9A-Z]{16}",
    r"eyJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}",
    r"-----BEGIN [A-Z ]*PRIVATE KEY-----[\s\S]*?(?:-----END [A-Z ]*PRIVATE KEY-----|$)",
]))
SECRET_ASSIGN = re.compile(
    r"((?:\b[A-Z0-9_]*(?:TOKEN|SECRET|PASSWORD|PASSWD|API_KEY|APIKEY|PRIVATE_KEY)[A-Z0-9_]*\s*(?:=|:\s)"
    # Header HTTP: X-Proxy-Secret: …, Authorization: Bearer …
    r"|(?i:\b(?:x-[a-z-]*(?:secret|token|key)|authorization)\s*:(?:\s*bearer)?))\s*['\"]?)"
    r"(?!string\b|number\b|boolean\b|process\.env|\$\{|\$[A-Z_]|os\.environ|\*\*\*|<)[^\s'\";,)]{6,}"
)
# Tool đọc file có tên thế này thì bỏ cả output, vì mẫu ở trên không bắt hết mọi kiểu secret trong file.
SECRET_FILE = re.compile(r"(^|/)(\.env[^/]*|[^/]*\.pem|[^/]*\.key|id_rsa[^/]*|id_ed25519[^/]*)$")
SKILL_BODY = re.compile(r"^Base directory for this skill: (\S+)")


def parse_ts(ts):
    return datetime.fromisoformat(ts.replace("Z", "+00:00")) if ts else None


def ms_between(a, b):
    if not a or not b:
        return None
    return int((parse_ts(b) - parse_ts(a)).total_seconds() * 1000)


def redact(text):
    text = SECRET_TOKENS.sub(REDACTED, text)
    return SECRET_ASSIGN.sub(lambda m: m.group(1) + REDACTED, text)


def clip(value, limit=PREVIEW_CHARS):
    """Che secret rồi cắt chuỗi dài, kể cả chuỗi nằm sâu trong dict/list, để file metric không phình theo nội dung
    file được ghi. Che trước khi cắt, để secret nằm vắt qua chỗ cắt không lộ nửa đầu."""
    if isinstance(value, str):
        value = redact(value)
        return value if len(value) <= limit else value[:limit] + f"… (+{len(value) - limit} ký tự)"
    if isinstance(value, dict):
        return {k: clip(v, limit) for k, v in value.items()}
    if isinstance(value, list):
        return [clip(v, limit) for v in value]
    return value


def block_text(content):
    """Lấy phần chữ của content. Ảnh chỉ còn một dòng mô tả, vì base64 của ảnh không đọc được và rất nặng."""
    if isinstance(content, str):
        return content
    if isinstance(content, list):
        parts = []
        for b in content:
            if isinstance(b, dict) and b.get("type") == "text":
                parts.append(b.get("text", ""))
            elif isinstance(b, dict) and b.get("type") == "image":
                src = b.get("source") or {}
                kb = len(src.get("data") or "") * 3 // 4 // 1000
                parts.append(f"[ảnh {src.get('media_type') or '?'}, {kb} KB]")
            elif isinstance(b, str):
                parts.append(b)
        return "\n".join(parts)
    return ""


IDE_TAG = re.compile(r"<(ide_[a-z_]+)>([\s\S]*?)</\1>")
IDE_OPENED = re.compile(r"opened the file (.+?) in the IDE")
IDE_SELECTED = re.compile(r"selected the lines (\d+) to (\d+) from (.+?):\n([\s\S]*?)(?:\n+This may or may not be related to the current task\.)?\s*$")


def rel_path(path):
    path = path.strip()
    root = str(ROOT) + "/"
    return path[len(root):] if path.startswith(root) else path


def split_prompt(text):
    """Tách ngữ cảnh IDE tự chèn (<ide_opened_file>, <ide_selection>) ra khỏi chữ người dùng gõ.
    Trả về (chữ người dùng gõ, danh sách attachment). @mention giữ nguyên trong chữ vì nó là một phần câu."""
    attachments = []

    def take(m):
        tag, body = m.group(1), m.group(2)
        opened = IDE_OPENED.search(body) if tag == "ide_opened_file" else None
        selected = IDE_SELECTED.search(body) if tag == "ide_selection" else None
        if opened:
            attachments.append({"kind": "opened", "path": rel_path(opened.group(1))})
        elif selected:
            attachments.append({
                "kind": "selection",
                "path": rel_path(selected.group(3)),
                "lines": f"{selected.group(1)}-{selected.group(2)}",
                "content": clip(selected.group(4).strip(), 2000),
            })
        else:
            attachments.append({"kind": tag[len("ide_"):], "content": clip(body.strip(), 2000)})
        return ""

    return IDE_TAG.sub(take, text).strip(), attachments


def tool_label(name, inp):
    """Một dòng ngắn nói tool làm gì, lấy từ field quan trọng nhất của input."""
    inp = inp or {}
    for key in ("description", "command", "file_path", "skill", "pattern", "url", "query", "prompt"):
        if inp.get(key):
            first_line = str(inp[key]).strip().splitlines()[0]
            return first_line[:160]
    questions = inp.get("questions")
    if isinstance(questions, list) and questions and isinstance(questions[0], dict):
        return str(questions[0].get("question", ""))[:160]
    return ""


def usage_of(msg):
    u = msg.get("usage") or {}
    return {
        "input": u.get("input_tokens", 0),
        "output": u.get("output_tokens", 0),
        "cacheCreate": u.get("cache_creation_input_tokens", 0),
        "cacheRead": u.get("cache_read_input_tokens", 0),
        "thinking": (u.get("output_tokens_details") or {}).get("thinking_tokens", 0),
    }


def parse_transcript(path, agent=None):
    """Trả về (title, events). Mỗi event là prompt, một lượt gọi model, hoặc một lần chạy tool."""
    title = None
    events = []
    calls = {}  # message.id -> event model
    tools = {}  # tool_use_id -> event tool
    last_input_ts = None  # lúc model có đủ đầu vào: prompt hoặc tool_result gần nhất
    seq = 0

    for line in path.open(encoding="utf-8"):
        try:
            r = json.loads(line)
        except json.JSONDecodeError:
            continue
        kind = r.get("type")
        if kind == "ai-title":
            title = r.get("aiTitle") or title
        att = r.get("attachment") or {}
        if kind == "attachment" and att.get("type") == "queued_command":
            # Người dùng gõ thêm khi agent đang chạy: chen vào lượt hiện tại, không mở lượt mới.
            seq += 1
            text, attachments = split_prompt(block_text(att.get("prompt")))
            events.append({
                "kind": "prompt",
                "seq": seq,
                "start": r.get("timestamp"),
                "end": r.get("timestamp"),
                "meta": False,
                "queued": True,
                "text": clip(text, 4000),
                "attachments": attachments,
                "agent": agent,
            })
            continue
        if kind not in ("user", "assistant"):
            continue

        ts = r.get("timestamp")
        msg = r.get("message") or {}
        content = msg.get("content")
        seq += 1

        if kind == "user":
            results = [b for b in content if isinstance(b, dict) and b.get("type") == "tool_result"] if isinstance(content, list) else []
            for b in results:
                ev = tools.get(b.get("tool_use_id"))
                if ev:
                    ev["end"] = ts
                    ev["durationMs"] = ms_between(ev["start"], ts)
                    ev["isError"] = bool(b.get("is_error"))
                    read_path = str((ev["input"] or {}).get("file_path") or "") if ev["name"] == "Read" else ""
                    if SECRET_FILE.search(read_path):
                        ev["result"] = "[bỏ output: file có thể chứa secret]"
                    else:
                        ev["result"] = clip(block_text(b.get("content")))
            if not results:
                raw = block_text(content)
                if raw.strip():
                    text, attachments = split_prompt(raw)
                    # Mỗi lần gọi skill, Claude Code nạp nguyên SKILL.md vào transcript. Đó là chữ của skill, không phải
                    # việc session làm, nên chỉ giữ tên skill.
                    skill_body = SKILL_BODY.match(text)
                    if skill_body:
                        text = f"[nội dung skill {Path(skill_body.group(1)).name}]"
                    # origin.kind = "human" khi người dùng gõ; "task-notification"… khi hệ thống đẩy vào.
                    # Transcript cũ không có field origin thì coi là người dùng gõ.
                    origin = r["origin"] if "origin" in r else {"kind": "human"}
                    events.append({
                        "kind": "prompt",
                        "seq": seq,
                        "start": ts,
                        "end": ts,
                        "meta": bool(r.get("isMeta")),
                        "fromUser": isinstance(origin, dict) and origin.get("kind") == "human",
                        "text": clip(text, 4000),
                        "attachments": attachments,
                        "agent": agent,
                    })
            last_input_ts = ts
            continue

        # assistant: một lượt gọi model ghi thành nhiều record cùng message.id, usage lặp lại ở mỗi record.
        mid = msg.get("id") or r.get("uuid")
        call = calls.get(mid)
        if call is None:
            call = {
                "kind": "model",
                "seq": seq,
                "id": mid,
                "model": msg.get("model"),
                "start": last_input_ts or ts,
                "end": ts,
                "durationMs": None,
                "usage": usage_of(msg),
                "text": "",
                "thinking": False,
                "toolCount": 0,
                "agent": agent,
            }
            calls[mid] = call
            events.append(call)
        call["end"] = ts
        call["durationMs"] = ms_between(call["start"], ts)
        call["usage"] = usage_of(msg)  # record sau cùng mang usage cuối

        for b in content if isinstance(content, list) else []:
            if not isinstance(b, dict):
                continue
            if b.get("type") == "text" and b.get("text"):
                call["text"] = clip((call["text"] + "\n" + b["text"]).strip(), 4000)
            elif b.get("type") == "thinking":
                call["thinking"] = True
            elif b.get("type") == "tool_use":
                seq += 1
                call["toolCount"] += 1
                ev = {
                    "kind": "tool",
                    "seq": seq,
                    "id": b.get("id"),
                    "callId": mid,
                    "name": b.get("name"),
                    "label": tool_label(b.get("name"), b.get("input")),
                    "input": clip(b.get("input")),
                    "start": ts,
                    "end": None,
                    "durationMs": None,
                    "isError": False,
                    "result": None,
                    "agent": agent,
                }
                tools[b.get("id")] = ev
                events.append(ev)

    return title, events


USAGE_KEYS = ("input", "output", "cacheCreate", "cacheRead", "thinking")


def sum_usage(events):
    total = dict.fromkeys(USAGE_KEYS, 0)
    for e in events:
        if e["kind"] == "model":
            for k in USAGE_KEYS:
                total[k] += e["usage"].get(k, 0)
    total["all"] = total["input"] + total["output"] + total["cacheCreate"] + total["cacheRead"]
    return total


def add_usage(*usages):
    total = {k: sum(u.get(k, 0) for u in usages) for k in USAGE_KEYS}
    total["all"] = total["input"] + total["output"] + total["cacheCreate"] + total["cacheRead"]
    return total


def own_counts(events):
    return sum(1 for e in events if e["kind"] == "model"), sum(1 for e in events if e["kind"] == "tool")


def child_subagents(events):
    return [e["subagent"] for e in events if e.get("subagent")]


def split_stats(events, extra_subs=()):
    """Số liệu của một chuỗi event agent chính, tách hai phần: agent chính tự làm, và các subagent nó sinh ra."""
    subs = child_subagents(events) + list(extra_subs)
    model, tool = own_counts(events)
    main = {"usage": sum_usage(events), "modelCalls": model, "toolCalls": tool}
    sub = {
        "usage": add_usage(*[s["usage"] for s in subs]) if subs else add_usage(),
        "modelCalls": sum(s["modelCalls"] for s in subs),
        "toolCalls": sum(s["toolCalls"] for s in subs),
        "count": sum(1 + s["subagentCount"] for s in subs),
    }
    return {
        "usage": add_usage(main["usage"], sub["usage"]),
        "modelCalls": main["modelCalls"] + sub["modelCalls"],
        "toolCalls": main["toolCalls"] + sub["toolCalls"],
        "main": main,
        "sub": sub,
    }


def load_subagents(session_path):
    """Đọc transcript của các subagent trong <sessionId>/subagents/.

    Mỗi subagent có file agent-<agentId>.jsonl, kèm agent-<agentId>.meta.json ghi agentType,
    description, và toolUseId: id của block tool_use "Agent" đã sinh ra nó."""
    sub_dir = session_path.with_suffix("") / "subagents"
    subs = []
    for f in sorted(sub_dir.glob("*.jsonl")) if sub_dir.is_dir() else []:
        agent_id = f.stem[len("agent-"):] if f.stem.startswith("agent-") else f.stem
        try:
            meta = json.loads(f.with_name(f.stem + ".meta.json").read_text(encoding="utf-8"))
        except (OSError, json.JSONDecodeError):
            meta = {}
        _, events = parse_transcript(f, agent=agent_id)
        if not events:
            continue
        events.sort(key=lambda e: (e["start"] or "", e["seq"]))
        subs.append({
            "agentId": agent_id,
            "agentType": meta.get("agentType"),
            "description": meta.get("description"),
            "toolUseId": meta.get("toolUseId"),
            "background": meta.get("requestShape") == "background",
            "events": events,
        })
    return subs


def link_subagents(main_events, subs):
    """Gắn mỗi subagent vào đúng event tool đã sinh ra nó (event["subagent"]).
    Subagent cũng có thể sinh subagent, nên tìm trong event của cả agent chính lẫn mọi subagent.
    Trả về các subagent không tìm được event cha."""
    by_tool = {s["toolUseId"]: s for s in subs if s["toolUseId"]}
    for events in [main_events] + [s["events"] for s in subs]:
        for e in events:
            if e["kind"] == "tool" and e["id"] in by_tool:
                e["subagent"] = by_tool.pop(e["id"])
    linked = {id(e["subagent"]) for events in [main_events] + [s["events"] for s in subs] for e in events if e.get("subagent")}
    return [s for s in subs if id(s) not in linked]


def finalize_subagent(sub):
    """Tính số liệu của subagent, gồm cả các subagent lồng bên dưới nó."""
    for child in child_subagents(sub["events"]):
        finalize_subagent(child)
    stats = split_stats(sub["events"])
    sub["start"] = min(e["start"] for e in sub["events"] if e["start"])
    sub["end"] = max((e["end"] or e["start"]) for e in sub["events"] if e["start"])
    sub["durationMs"] = ms_between(sub["start"], sub["end"])
    sub["usage"] = stats["usage"]
    sub["modelCalls"] = stats["modelCalls"]
    sub["toolCalls"] = stats["toolCalls"]
    sub["subagentCount"] = stats["sub"]["count"]


def number_subagents(subs):
    """Đánh số Sub 1, Sub 2… theo thứ tự bắt đầu trong session, để phân biệt các subagent với nhau."""
    for i, s in enumerate(sorted(subs, key=lambda s: s["start"]), 1):
        s["index"] = i


def group_turns(events, loose_subs):
    """Mỗi prompt người dùng gõ (không phải prompt meta) mở một turn mới; event sau nó thuộc turn đó.
    `events` chỉ gồm event của agent chính. Subagent đã nằm trong event["subagent"] của dòng Agent sinh ra nó.
    Subagent không tìm được dòng cha thì xếp vào turn đang chạy lúc nó bắt đầu."""
    turns = []
    current = None
    for e in events:
        if e["kind"] == "prompt" and not e["meta"] and not e.get("queued") and e.get("fromUser", True):
            current = {"prompt": e["text"], "attachments": e["attachments"], "start": e["start"], "events": []}
            turns.append(current)
            continue
        if current is None:
            current = {"prompt": None, "attachments": [], "start": e["start"], "events": []}
            turns.append(current)
        current["events"].append(e)

    for t in turns:
        t["looseSubagents"] = []
    for s in loose_subs:
        owner = [t for t in turns if t["start"] <= s["start"]] or turns
        if owner:
            owner[-1]["looseSubagents"].append(s)

    for t in turns:
        # Prompt kết thúc ở lần gọi model hoặc tool cuối cùng. Không tính tin "nạp vào" đến muộn
        # (vd dòng <local-command-caveat> khi người dùng gõ /compact sau một giờ ngồi yên).
        ends = [e["end"] or e["start"] for e in t["events"] if e["kind"] != "prompt"] or [t["start"]]
        t["end"] = max(ends)
        t["durationMs"] = ms_between(t["start"], t["end"])
        t.update(split_stats(t["events"], t["looseSubagents"]))
    return turns


ORCHESTRATOR_MAX_MS = 60_000

# Skill mở một chặng mới của quy trình, khai trong config.json. Không skill điều phối nào gọi các skill này làm bước
# con. Nếu một skill trong nhóm này chạy sau skill điều phối trong cùng prompt, thì agent đã làm xong việc điều phối và
# tự sang chặng mới.
STAGE_SKILLS = set(CONFIG["stageSkills"])


def model_tokens(events, start, end):
    total = 0
    for e in events:
        if e["kind"] == "model" and start <= e["start"] < end:
            u = e["usage"]
            total += u["input"] + u["output"] + u["cacheCreate"] + u["cacheRead"]
    return total


def first_skill(events):
    return next((e["input"].get("skill") for e in events if e["kind"] == "tool" and e["name"] == "Skill"), None)


def flat_runs(events, cap_of, where):
    """Mỗi lần gọi Skill hoặc Agent là một run.

    Run của Skill kéo dài tới lần gọi Skill/Agent kế tiếp của cùng agent, nhưng không quá cap_of(start):
    cuối prompt nếu ở agent chính, cuối subagent nếu ở trong subagent.
    Run của Agent dài bằng subagent nó sinh ra, và mang các skill subagent đó chạy làm run con."""
    marks = [e for e in events if e["kind"] == "tool" and e["name"] in ("Skill", "Agent")]
    runs = []
    for i, e in enumerate(marks):
        cap = cap_of(e["start"])
        flat_end = min(marks[i + 1]["start"], cap) if i + 1 < len(marks) else cap
        run = {"start": e["start"], "end": flat_end, "flatEnd": flat_end, "boundary": cap, "where": where, "children": []}
        if e["name"] == "Skill":
            run.update(kind="skill", name=e["input"].get("skill") or "?", args=e["input"].get("args") or "",
                       tokens=model_tokens(events, e["start"], flat_end))
        else:
            sa = e.get("subagent")
            run.update(kind="agent", args=e["input"].get("description") or "", tokens=0,
                       name=(first_skill(sa["events"]) if sa else None) or e["input"].get("subagent_type") or "agent")
            if sa:
                sub_where = f"Sub {sa.get('index', '?')}"
                kids = skill_tree(sa["events"], lambda ts, sa=sa: sa["end"], sub_where)
                # Subagent chỉ chạy đúng một skill trùng tên với run thì bỏ tầng con cho gọn.
                if len(kids) == 1 and kids[0]["name"] == run["name"] and not kids[0]["children"]:
                    kids = []
                run.update(where=sub_where, subIndex=sa.get("index"), start=sa["start"], end=sa["end"],
                           tokens=sa["usage"]["all"], children=kids)
        runs.append(run)
    return runs


def is_orchestrator(run):
    """Skill gọi bước kế tiếp gần như ngay lập tức (dưới 60 giây, cùng prompt) là skill điều phối,
    vd một skill /implement gọi /plan rồi /review."""
    return (run["kind"] == "skill" and run["flatEnd"] < run["boundary"]
            and ms_between(run["start"], run["flatEnd"]) < ORCHESTRATOR_MAX_MS)


def skill_tree(events, cap_of, where):
    """Xếp các run thành cây: run đứng sau một skill điều phối, trong cùng prompt, là bước con của nó.
    Skill điều phối mới, hoặc skill trong STAGE_SKILLS, đóng skill điều phối đang mở."""
    top, orch = [], None
    for r in flat_runs(events, cap_of, where):
        opens_stage = r["kind"] == "skill" and r["name"] in STAGE_SKILLS
        if orch and r["boundary"] == orch["boundary"] and not is_orchestrator(r) and not opens_stage:
            orch["children"].append(r)
            continue
        orch = r if is_orchestrator(r) else None
        top.append(r)
    for r in top:
        if r["kind"] == "skill" and r["children"]:
            r["end"] = max([r["flatEnd"]] + [max(c["end"], c["flatEnd"]) for c in r["children"]])
            r["tokens"] = model_tokens(events, r["start"], r["end"]) + sum(c["tokens"] for c in r["children"] if c["kind"] == "agent")
    finish_runs(top)
    return top


def finish_runs(runs):
    for r in runs:
        r["durationMs"] = ms_between(r["start"], r["end"])
        r.pop("flatEnd", None)
        r.pop("boundary", None)
        finish_runs(r["children"])


def session_skill_runs(events, turns):
    turn_bounds = [(t["start"], t["end"]) for t in turns]

    def turn_end(ts):
        ends = [end for start, end in turn_bounds if start <= ts]
        return ends[-1] if ends else turn_bounds[0][1]

    return skill_tree(events, turn_end, "main")


def build_session(path):
    title, events = parse_transcript(path)
    if not events:
        return None
    events.sort(key=lambda e: (e["start"] or "", e["seq"]))

    subs = load_subagents(path)
    loose = link_subagents(events, subs)
    for s in child_subagents(events) + loose:
        finalize_subagent(s)
    number_subagents(subs)

    turns = group_turns(events, loose)
    start = min([e["start"] for e in events if e["start"]] + [s["start"] for s in subs])
    end = max([(e["end"] or e["start"]) for e in events if e["start"]] + [s["end"] for s in subs])
    main = {k: sum(t["main"][k] for t in turns) for k in ("modelCalls", "toolCalls")}
    main["usage"] = add_usage(*[t["main"]["usage"] for t in turns])
    sub = {k: sum(t["sub"][k] for t in turns) for k in ("modelCalls", "toolCalls", "count")}
    sub["usage"] = add_usage(*[t["sub"]["usage"] for t in turns])
    return {
        "sessionId": path.stem,
        "machine": MACHINE,
        "title": clip(title, 300),
        "start": start,
        "end": end,
        "durationMs": ms_between(start, end),
        "activeMs": sum(t["durationMs"] or 0 for t in turns),
        "usage": add_usage(main["usage"], sub["usage"]),
        "modelCalls": main["modelCalls"] + sub["modelCalls"],
        "toolCalls": main["toolCalls"] + sub["toolCalls"],
        "main": main,
        "sub": sub,
        "skillRuns": session_skill_runs(events, turns),
        "turns": turns,
    }


def hook_transcript():
    """Transcript của session gọi hook, lấy từ field transcript_path trong payload ở stdin.
    Trả None nếu payload không đọc được, khi đó main() đọc lại mọi transcript."""
    try:
        path = Path(json.load(sys.stdin)["transcript_path"])
    except (ValueError, KeyError, TypeError):
        return None
    # Hook bắn trong subagent có thể đưa transcript của subagent: <sessionId>/subagents/agent-<id>.jsonl.
    if path.parent.name == "subagents":
        path = path.parent.parent.with_suffix(".jsonl")
    return path if path.suffix == ".jsonl" and path.is_file() else None


# Field mang chữ, xoá khi "content": "numbers". Chuỗi thành "", không thành null, vì trang xem coi prompt null là turn
# không có prompt. input thành {} vì trang xem in input bằng JSON.
TEXT_FIELDS = {"text", "prompt", "result", "label", "title", "args", "description", "content"}


def strip_text(value):
    if isinstance(value, dict):
        out = {}
        for k, v in value.items():
            if k in TEXT_FIELDS and isinstance(v, str):
                out[k] = ""
            elif k == "input" and isinstance(v, dict):
                out[k] = {}
            elif k == "attachments" and isinstance(v, list):
                out[k] = []
            else:
                out[k] = strip_text(v)
        return out
    if isinstance(value, list):
        return [strip_text(v) for v in value]
    return value


def sync(path):
    s = build_session(path)
    if s and CONFIG["content"] == "numbers":
        s = strip_text(s)
    if s:
        # indent=0: mỗi giá trị một dòng, không thụt lề. Nhẹ hơn indent=1, mà git vẫn so được từng dòng.
        write_if_changed(SESSION_DIR / f"{s['sessionId']}.json",
                         json.dumps(s, ensure_ascii=False, indent=0, separators=(",", ":")))


def main():
    SESSION_DIR.mkdir(parents=True, exist_ok=True)
    # Hook chạy sau mỗi tool, nên chỉ đọc lại transcript của session gọi nó. Project có transcript hàng trăm MB thì
    # đọc lại cả project mất vài giây mỗi lần.
    path = hook_transcript() if "--hook" in sys.argv else None
    if path:
        sync(path)
        return 0
    for p in TRANSCRIPT_DIR.glob("*.jsonl") if TRANSCRIPT_DIR.is_dir() else []:
        sync(p)
    return 0


def write_atomic(path, text):
    """Nhiều session chạy song song thì Stop hook của chúng có thể ghi cùng lúc.
    Ghi ra file tạm rồi rename, để người đọc không bao giờ thấy file ghi dở."""
    tmp = path.with_name(f".{path.name}.{os.getpid()}.tmp")
    tmp.write_text(text, encoding="utf-8")
    os.replace(tmp, path)


def write_if_changed(path, text):
    """Session đã dừng thì nội dung không đổi. Không ghi lại thì git không thấy file đó bị sửa."""
    try:
        if path.read_text(encoding="utf-8") == text:
            return
    except OSError:
        pass
    write_atomic(path, text)


if __name__ == "__main__":
    sys.exit(main())
