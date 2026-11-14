"""推新章節時，自動把章節裡的 threads: 貼文發到脆。

只處理這次 push「新增」的 _posts 檔案，且 front matter 裡有 threads: 才會發。
章節日期還沒到（網站上看不到）的，不發。
"""
import json
import os
import sys
import time
import urllib.parse
import urllib.request
from datetime import datetime, timezone

import yaml

API = "https://graph.threads.net/v1.0"
SITE = "https://sierra2121.github.io/weibeifen/t/{slug}/"


def call(method, path, params):
    data = urllib.parse.urlencode(params).encode()
    url = f"{API}/{path}"
    if method == "GET":
        req = urllib.request.Request(f"{url}?{data.decode()}")
    else:
        req = urllib.request.Request(url, data=data, method="POST")
    try:
        with urllib.request.urlopen(req, timeout=30) as r:
            return json.load(r)
    except urllib.error.HTTPError as e:
        print("Threads API 錯誤：", e.read().decode(), file=sys.stderr)
        raise


def front_matter(path):
    text = open(path, encoding="utf-8").read()
    if not text.startswith("---"):
        return {}
    return yaml.safe_load(text.split("---", 2)[1]) or {}


def main(files):
    token = os.environ.get("THREADS_TOKEN")
    if not token:
        print("沒有設定 THREADS_TOKEN，跳過發脆。")
        return
    now = datetime.now(timezone.utc)
    failed = False
    for path in files:
        fm = front_matter(path)
        text = (fm.get("threads") or "").strip()
        if not text:
            print(f"{path}：沒有 threads: 貼文，跳過。")
            continue
        date = fm.get("date")
        if isinstance(date, str):
            try:
                date = datetime.strptime(date.strip(), "%Y-%m-%d %H:%M:%S %z")
            except ValueError:
                date = None
        if isinstance(date, datetime) and date.tzinfo and date > now:
            print(f"{path}：章節日期 {date} 還沒到，網站上看不到，先不發。")
            continue
        slug = os.path.basename(path)[11:].rsplit(".", 1)[0]
        params = {
            "media_type": "TEXT",
            "text": text,
            "link_attachment": SITE.format(slug=slug),
            "access_token": token,
        }
        tag = fm.get("threads_tag")
        if tag:
            params["topic_tag"] = tag
        try:
            container = call("POST", "me/threads", params)["id"]
            for _ in range(10):
                time.sleep(3)
                st = call("GET", container, {"fields": "status,error_message", "access_token": token})
                if st.get("status") in ("FINISHED", "ERROR"):
                    break
            if st.get("status") == "ERROR":
                raise RuntimeError(st.get("error_message"))
            post = call("POST", "me/threads_publish", {"creation_id": container, "access_token": token})
            print(f"{path}：已發到脆，貼文 ID {post['id']}")
        except Exception as e:
            print(f"{path}：發脆失敗 {e}", file=sys.stderr)
            failed = True
    if failed:
        sys.exit(1)


if __name__ == "__main__":
    main([f for f in sys.argv[1:] if f])
