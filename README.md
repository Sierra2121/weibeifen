# 未備份

畝的小說網站。網址：https://sierra2121.github.io/weibeifen/

## 新增一串貼文

在 `_posts/` 新增一個 `.md` 檔，檔名格式是 `年-月-日-英文名稱.md`，例如 `2026-11-20-first-phone.md`。

內容照這個樣子寫：

```
---
layout: thread
title: 第一支手機
character: yu
novel: yu
date: 2026-11-20 22:30:00 +0800
---
第一則貼文的內容。

***

第二則貼文的內容。
```

- `date` 是貼文顯示的發文時間，可以設成故事裡的任何時間。
- 每一則貼文之間，用單獨一行的 `***` 隔開。
- 段落之間空一行。

## 新增角色

在 `_data/characters.yml` 加一段。頭貼圖檔放進 `assets/avatars/`，再把檔名填在 `avatar:`；沒有圖就刪掉那一行，會顯示 `glyph:` 那個字。

## 新增小說

在 `_data/novels.yml` 加一段，首頁上方就會多一個篩選按鈕。
