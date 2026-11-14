"""未備份 → 脆 自動發文。

兩種模式：
  python post_threads.py outbox    發 .github/threads/outbox/ 裡等著發的貼文（蔡說「發」時，Claude 放進去並推上來）
  python post_threads.py backfill  每天從舊章節挑一章，用章節的 teaser 發（各本小說輪流，從第一章開始）

發過的章節記在 .github/threads/done.txt（每行：檔名 小說id），不會重發。
"""
import json
import os
import sys
import time
import urllib.error
import urllib.parse
import urllib.request
from datetime import datetime, timezone
from pathlib import Path

import yaml

ROOT = Path(__file__).resolve().parents[2]
POSTS = ROOT / "_posts"
BASE = ROOT / ".github" / "threads"
OUTBOX = BASE / "outbox"
SENT = BASE / "sent"
DONE = BASE / "done.txt"
API = "https://graph.threads.net/v1.0"
SITE = "https://sierra2121.github.io/weibeifen/t/{slug}/"
LIMIT = 500  # 脆一篇最多 500 字


def call(method, path, params):
    data = urllib.parse.urlencode(params).encode()
    url = f"{API}/{path}"
    req = urllib.request.Request(f"{url}?{data.decode()}") if method == "GET" else urllib.request.Request(url, data=data, method="POST")
    try:
        with urllib.request.urlopen(req, timeout=30) as r:
            return json.load(r)
    except urllib.error.HTTPError as e:
        raise RuntimeError(f"Threads API 錯誤：{e.read().decode()}")


def publish(text, link, tag=None):
    token = os.environ["THREADS_TOKEN"]
    params = {"media_type": "TEXT", "text": text[:LIMIT], "link_attachment": link, "access_token": token}
    if tag:
        params["topic_tag"] = tag
    cid = call("POST", "me/threads", params)["id"]
    for _ in range(10):
        time.sleep(3)
        st = call("GET", cid, {"fields": "status,error_message", "access_token": token})
        if st.get("status") in ("FINISHED", "ERROR"):
            break
    if st.get("status") == "ERROR":
        raise RuntimeError(st.get("error_message"))
    return call("POST", "me/threads_publish", {"creation_id": cid, "access_token": token})["id"]


def front_matter(path):
    text = path.read_text(encoding="utf-8")
    if not text.startswith("---"):
        return {}, text
    _, fm, body = text.split("---", 2)
    return yaml.safe_load(fm) or {}, body


def post_date(fm, path):
    d = fm.get("date")
    if isinstance(d, str):
        try:
            return datetime.strptime(d.strip(), "%Y-%m-%d %H:%M:%S %z")
        except ValueError:
            d = None
    if isinstance(d, datetime) and d.tzinfo:
        return d
    return datetime.strptime(path.name[:10], "%Y-%m-%d").replace(tzinfo=timezone.utc)


def slug_of(name):
    return name[11:].rsplit(".", 1)[0]


def load_done():
    if not DONE.exists():
        return []
    return [line.split() for line in DONE.read_text(encoding="utf-8").splitlines() if line.strip()]


def mark_done(filename, novel):
    with DONE.open("a", encoding="utf-8") as f:
        f.write(f"{filename} {novel}\n")


def find_post(slug):
    for p in POSTS.glob(f"*-{slug}.md"):
        if slug_of(p.name) == slug:
            return p
    return None


def run_outbox():
    """outbox 裡每個檔：檔名＝章節 slug（例如 exam40.txt），內容＝脆貼文。第一行若是「#標籤」就當主題標籤。"""
    now = datetime.now(timezone.utc)
    failed = False
    for f in sorted(OUTBOX.glob("*.txt")):
        slug = f.stem
        text = f.read_text(encoding="utf-8").strip()
        tag = None
        if text.startswith("#"):
            first, _, text = text.partition("\n")
            tag, text = first[1:].strip(), text.strip()
        post = find_post(slug)
        if post is None:
            print(f"{f.name}：找不到章節 {slug}，先不發。")
            continue
        fm, _ = front_matter(post)
        if post_date(fm, post) > now:
            print(f"{f.name}：章節日期還沒到，網站上看不到，先不發。")
            continue
        try:
            pid = publish(text, SITE.format(slug=slug), tag)
            print(f"{f.name}：已發到脆（{pid}）")
            SENT.mkdir(parents=True, exist_ok=True)
            f.rename(SENT / f.name)
            mark_done(post.name, fm.get("novel", "?"))
        except Exception as e:
            print(f"{f.name}：發脆失敗 {e}", file=sys.stderr)
            failed = True
    return failed


def run_backfill():
    novels = yaml.safe_load((ROOT / "_data" / "novels.yml").read_text(encoding="utf-8"))
    order = list(novels.keys())
    done = load_done()
    done_files = {d[0] for d in done}
    now = datetime.now(timezone.utc)

    queue = {n: [] for n in order}
    for p in POSTS.glob("*.md"):
        if p.name in done_files:
            continue
        fm, _ = front_matter(p)
        n = fm.get("novel")
        if n in queue and fm.get("teaser") and post_date(fm, p) <= now:
            queue[n].append((post_date(fm, p), fm.get("chapter") or 0, p, fm))
    for n in queue:
        queue[n].sort(key=lambda x: (x[1], x[0]))

    last = done[-1][1] if done else None
    start = (order.index(last) + 1) if last in order else 0
    for i in range(len(order)):
        n = order[(start + i) % len(order)]
        if queue[n]:
            _, _, p, fm = queue[n][0]
            title = novels[n].get("title", "")
            text = f"{fm['teaser'].strip()}\n\n——《{title}》"
            if len(text) > LIMIT:
                text = fm["teaser"].strip()[: LIMIT - len(title) - 8] + "…" + f"\n\n——《{title}》"
            pid = publish(text, SITE.format(slug=slug_of(p.name)))
            mark_done(p.name, n)
            print(f"已發 {p.name}（《{title}》）到脆：{pid}")
            return False
    print("舊章節都發完了。")
    return False


if __name__ == "__main__":
    if not os.environ.get("THREADS_TOKEN"):
        print("沒有設定 THREADS_TOKEN，跳過。")
        sys.exit(0)
    mode = sys.argv[1] if len(sys.argv) > 1 else "outbox"
    sys.exit(1 if (run_backfill() if mode == "backfill" else run_outbox()) else 0)
