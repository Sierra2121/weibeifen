(function () {
  var feed = document.querySelector('.feed');
  if (!feed) return;
  var q = new URLSearchParams(location.search);
  var n = q.get('n') || '', c = q.get('c') || '';
  var chars = JSON.parse(document.getElementById('chars').textContent || '{}');
  var who = chars[c];
  var novels = JSON.parse(document.getElementById('novels').textContent || '{}');
  var nv = !who && n && !q.get('liked') && !q.get('reposted') ? novels[n] : null;
  var shown = 0;
  function mk(tag, cls, txt) { var e = document.createElement(tag); if (cls) e.className = cls; if (txt != null) e.textContent = txt; return e; }

  if (nv) {
    // 小說介紹頁：簡介、標籤、角色、章節目錄
    feed.hidden = true;
    var cbox = document.querySelector('.chapters');
    cbox.hidden = false;
    var order = Object.keys(chars);
    var mine = Array.prototype.slice.call(cbox.querySelectorAll('.chapter')).filter(function (ch) { return ch.dataset.novel === n; });
    var seen = {}, clash = false;
    mine.forEach(function (ch) { if (seen[ch.dataset.no]) clash = true; seen[ch.dataset.no] = 1; });
    // 章節編號有重複（例如看天的芋跟陽的番外），就按角色分開排
    mine.sort(function (a, b) {
      if (clash && a.dataset.char !== b.dataset.char) return order.indexOf(a.dataset.char) - order.indexOf(b.dataset.char);
      return (+a.dataset.no || 0) - (+b.dataset.no || 0);
    });
    cbox.querySelectorAll('.chapter').forEach(function (ch) { ch.hidden = true; });
    var who2 = {}; mine.forEach(function (ch) { who2[ch.dataset.char] = 1; });
    var many = Object.keys(who2).length > 1, last = null;
    mine.forEach(function (ch) {
      if (clash && ch.dataset.char !== last) cbox.appendChild(mk('p', 'grp', (chars[ch.dataset.char] || {}).name + '的貼文'));
      last = ch.dataset.char;
      ch.hidden = false; shown++;
      ch.querySelector('.ch-no').textContent = '第 ' + ch.dataset.no + ' 章';
      if (many && !clash) { var t = ch.querySelector('.ch-title'); if (!t.querySelector('small')) t.appendChild(mk('small', 'ch-who', (chars[ch.dataset.char] || {}).name)); }
      cbox.appendChild(ch);
    });
    var box2 = document.getElementById('novel');
    var bk = mk('a', 'nv-back', '← 所有小說'); bk.href = BASE + '/novels/'; box2.appendChild(bk);
    box2.append(mk('h1', null, nv.title));
    if (nv.era) box2.appendChild(mk('p', 'nv-era', nv.era));
    if (nv.tags && nv.tags.length) { var tg = mk('ul', 'nv-tags'); nv.tags.forEach(function (t) { tg.appendChild(mk('li', null, t)); }); box2.appendChild(tg); }
    if (nv.intro) box2.appendChild(mk('p', 'nv-intro', nv.intro));
    var cl = mk('div', 'nv-chars');
    order.forEach(function (id) {
      var ch = chars[id]; if (ch.novel !== n) return;
      var a = mk('a', 'nv-char'); a.href = BASE + '/?c=' + id;
      var av = mk('span', 'avatar'); av.style.setProperty('--c', ch.color || '#999');
      if (ch.avatar) { var im = new Image(); im.src = BASE + '/assets/avatars/' + ch.avatar + '?v=' + (window.VER || ''); im.alt = ''; av.appendChild(im); } else av.textContent = ch.glyph || ch.name;
      a.append(av, mk('span', null, ch.name)); cl.appendChild(a);
    });
    box2.appendChild(cl);
    var btns = mk('div', 'nv-btns');
    function rd(k) { try { var r = JSON.parse(localStorage.getItem(k) || 'null'); return r && r.url ? r : null; } catch (e) { return null; } }
    var lr = rd('wb:last:' + n);
    if (clash) {
      // 兩個角色各自一條線：每個角色一個按鈕
      if (lr && !lr.char) { // 舊紀錄沒有記角色，用章節網址找出是誰的，順便補存
        mine.forEach(function (ch) { if (ch.pathname === lr.url) lr.char = ch.dataset.char; });
        if (lr.char && !rd('wb:last:' + n + ':' + lr.char)) { try { localStorage.setItem('wb:last:' + n + ':' + lr.char, JSON.stringify(lr)); localStorage.setItem('wb:last:' + n, JSON.stringify(lr)); } catch (e) {} }
      }
      order.forEach(function (cid) {
        if (!who2[cid]) return;
        var nm = chars[cid].name, r = rd('wb:last:' + n + ':' + cid), b;
        if (r) { b = mk('a', 'nv-btn sm go', '讀' + nm + '的第 ' + r.no + ' 章'); b.href = r.url; btns.appendChild(b); }
      });
    } else {
      if (lr) {
        if (!lr.char) mine.forEach(function (ch) { if (ch.pathname === lr.url) lr.char = ch.dataset.char; });
        var nm2 = lr.char && chars[lr.char] ? chars[lr.char].name : '';
        var k = mk('a', 'nv-btn sm go', '讀' + (nm2 ? nm2 + '的' : '') + '第 ' + lr.no + ' 章'); k.href = lr.url; btns.appendChild(k);
      }
    }
    // 還沒讀過這部，才放「從第 1 章開始」
    if (!btns.children.length && mine[0]) { var f0 = mk('a', 'nv-btn sm', '從第 ' + mine[0].dataset.no + ' 章開始'); f0.href = mine[0].href; btns.appendChild(f0); }
    box2.appendChild(btns);
    cbox.parentNode.insertBefore(mk('h2', 'nv-h', '章節'), cbox);
    box2.hidden = false;
    document.title = nv.title + '｜未備份';
  } else if (who) {
    // 個人頁：顯示這個角色的完整章節，從第一章排起
    feed.hidden = true;
    var box = document.querySelector('.chapters');
    box.hidden = false;
    // 照 front matter 的 chapter 編號排，不照發文日期
    Array.prototype.slice.call(box.querySelectorAll('.chapter'))
      .sort(function (a, b) { return (+a.dataset.no || 0) - (+b.dataset.no || 0); })
      .forEach(function (ch) { box.appendChild(ch); });
    box.querySelectorAll('.chapter').forEach(function (ch) {
      var ok = ch.dataset.char === c && (!n || ch.dataset.novel === n);
      ch.hidden = !ok;
      if (ok) { shown++; ch.querySelector('.ch-no').textContent = '第 ' + shown + ' 章'; }
    });

    var prof = document.getElementById('profile');
    var av = document.createElement('div');
    av.className = 'avatar'; av.style.setProperty('--c', who.color || '#999');
    if (who.avatar) { var im = new Image(); im.src = BASE + '/assets/avatars/' + who.avatar + '?v=' + (window.VER || ''); im.alt = ''; av.appendChild(im); }
    else av.textContent = who.glyph || who.name.charAt(0);
    var info = document.createElement('div');
    var h = document.createElement('h1'); h.textContent = who.name;
    var hd = document.createElement('span'); hd.className = 'handle'; hd.textContent = '@' + who.handle;
    var bio = document.createElement('p'); bio.textContent = who.bio || '';
    info.append(h, hd, bio);
    prof.append(av, info); prof.hidden = false;
    prof.style.setProperty('--c', who.color || '#999');
    function el(tag, cls, txt) { var e = document.createElement(tag); if (cls) e.className = cls; if (txt != null) e.textContent = txt; return e; }
    function chLink(no) { return no ? box.querySelector('a.toc[data-novel="' + who.novel + '"][data-no="' + no + '"]') : null; }
    // 置頂一句話
    if (who.pin) {
      var pin = el('blockquote', 'pin', who.pin);
      var src = chLink(who.pin_ch);
      if (src) { var sm = el('small', null, '—— '); var sa = el('a', null, '〈' + src.querySelector('.ch-title').textContent + '〉'); sa.href = src.href; sm.appendChild(sa); pin.appendChild(sm); }
      prof.appendChild(pin);
    }
    var after = prof;
    function addBox(title, list) { var s = el('section', 'pbox'); s.style.setProperty('--c', who.color || '#999'); s.append(el('h3', null, title), list); after.after(s); after = s; }
    // 那些年
    if (who.eras && who.eras.length) {
      var ul = el('ul', 'eras');
      who.eras.forEach(function (e) { var li = el('li'); li.append(el('b', null, e.year), el('span', null, e.bio)); ul.appendChild(li); });
      addBox('那些年的' + who.name, ul);
    }
    // 她的東西
    if (who.items && who.items.length) {
      var il = el('ul', 'items');
      who.items.forEach(function (it) {
        var li = el('li'), src = chLink(it.ch), w = src ? el('a') : el('div');
        if (src) w.href = src.href;
        w.append(el('b', null, it.name), el('span', null, it.note));
        if (src) w.appendChild(el('em', null, '第一次出現：〈' + src.querySelector('.ch-title').textContent + '〉 ›'));
        li.appendChild(w); il.appendChild(li);
      });
      addBox('她的東西', il);
    }
    document.title = who.name + '｜未備份';

    if (location.hash) {
      var t = document.getElementById(decodeURIComponent(location.hash.slice(1)));
      if (t) setTimeout(function () { t.scrollIntoView(); }, 50);
    }
  } else {
    // 動態牆：每章一則重點（也可篩選小說、已說讚、已轉發）
    var liked = q.get('liked'), rp = q.get('reposted');
    function has(k) { try { return JSON.parse(localStorage.getItem('wb:' + k)) === true; } catch (e) { return false; } }
    var hits = [];
    feed.querySelectorAll('.teaser').forEach(function (t) {
      var key = t.querySelector('.actions').dataset.key;
      var ok = (!n || t.dataset.novel === n) && (!liked || has('like:' + key)) && (!rp || has('rp:' + key));
      t.hidden = true; if (ok) { shown++; hits.push(t); }
    });
    // 首頁動態：每次打開都隨機排，盡量讓相鄰兩則不是同一部小說
    if (!liked && !rp && !n) {
      for (var i = hits.length - 1; i > 0; i--) { var j = Math.floor(Math.random() * (i + 1)), tmp = hits[i]; hits[i] = hits[j]; hits[j] = tmp; }
      var out = [], prev = null;
      while (hits.length) {
        var k = 0; while (k < hits.length && hits[k].dataset.novel === prev) k++;
        if (k === hits.length) k = 0;
        prev = hits[k].dataset.novel; out.push(hits.splice(k, 1)[0]);
      }
      hits = out; hits.forEach(function (t) { feed.appendChild(t); });
    }
    // 一次先放 15 則，按「載入更多」再放 15 則
    var PAGE = 15, upto = 0, more = document.querySelector('.more-btn');
    function step() { hits.slice(upto, upto + PAGE).forEach(function (t) { t.hidden = false; }); upto += PAGE; more.hidden = upto >= hits.length; }
    more.onclick = step; step();
  }
  document.querySelector('.empty').hidden = shown > 0;
})();

// 互動按鈕（目前只存在這個瀏覽器）
(function () {
  function get(k, d) { try { var v = localStorage.getItem('wb:' + k); return v ? JSON.parse(v) : d; } catch (e) { return d; } }
  function set(k, v) { try { localStorage.setItem('wb:' + k, JSON.stringify(v)); } catch (e) {} }
  document.querySelectorAll('.actions').forEach(function (a) {
    var key = a.dataset.key;
    var like = a.querySelector('.like'), talk = a.querySelector('.talk'), rep = a.querySelector('.repost');
    var box = a.querySelector('.comments'), list = a.querySelector('.clist'), form = a.querySelector('.cform');
    function draw() {
      var liked = get('like:' + key, false), cs = get('c:' + key, []);
      like.classList.toggle('on', liked); like.querySelector('.n').textContent = liked ? '1' : '';
      rep.classList.toggle('on', get('rp:' + key, false));
      talk.querySelector('.n').textContent = cs.length || '';
      list.innerHTML = '';
      cs.forEach(function (t) { var li = document.createElement('li'); var b = document.createElement('b'); b.textContent = '你'; li.append(b, document.createTextNode(t)); list.appendChild(li); });
    }
    like.onclick = function () { set('like:' + key, !get('like:' + key, false)); like.classList.add('pop'); setTimeout(function () { like.classList.remove('pop'); }, 300); draw(); };
    rep.onclick = function () { set('rp:' + key, !get('rp:' + key, false)); draw(); };
    talk.onclick = function () { box.hidden = !box.hidden; if (!box.hidden) form.querySelector('input').focus(); };
    form.onsubmit = function (e) { e.preventDefault(); var i = form.querySelector('input'); var t = i.value.trim(); if (!t) return; var cs = get('c:' + key, []); cs.push(t); set('c:' + key, cs); i.value = ''; draw(); };
    a.querySelector('.share').onclick = function () {
      var url = new URL(a.dataset.url, location.origin).href;
      if (navigator.share) { navigator.share({ title: document.title, url: url }).catch(function () {}); return; }
      var toast = a.querySelector('.toast');
      (navigator.clipboard ? navigator.clipboard.writeText(url) : Promise.reject()).then(function () { toast.hidden = false; setTimeout(function () { toast.hidden = true; }, 1500); }).catch(function () { prompt('複製這個連結：', url); });
    };
    draw();
  });
})();

// 側邊選單
(function () {
  var btn = document.querySelector('.menu-btn'), d = document.querySelector('.drawer'), sc = document.querySelector('.scrim');
  if (!btn) return;
  function toggle(open) {
    d.classList.toggle('open', open); sc.hidden = !open; document.body.classList.toggle('lock', open);
    btn.setAttribute('aria-expanded', open); d.setAttribute('aria-hidden', !open);
  }
  btn.onclick = function () { toggle(!d.classList.contains('open')); };
  sc.onclick = function () { toggle(false); };
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape') toggle(false); });
})();

// 章節頁：正文裡第一次出現的同一本小說的其他角色，變成可以點的名字
(function () {
  var sec = document.querySelector('.chapter.read');
  if (!sec) return;
  var chars = JSON.parse(document.getElementById('chars').textContent || '{}');
  var text = sec.querySelector('.ch-text'); if (!text) return;
  Object.keys(chars).forEach(function (id) {
    var c = chars[id];
    if (id === sec.dataset.char || c.novel !== sec.dataset.novel || !c.name) return;
    var skip = c.skip || [];
    var tw = document.createTreeWalker(text, NodeFilter.SHOW_TEXT), node;
    while ((node = tw.nextNode())) {
      if (node.parentNode.closest('a')) continue;
      var s = node.nodeValue, i = -1;
      while ((i = s.indexOf(c.name, i + 1)) !== -1) {
        var bad = skip.some(function (w) { var k = w.indexOf(c.name); return k >= 0 && s.substr(i - k, w.length) === w; });
        if (bad) continue;
        var rest = node.splitText(i); rest.nodeValue = rest.nodeValue.slice(c.name.length);
        var a = document.createElement('a'); a.className = 'mention'; a.textContent = c.name;
        a.href = (window.BASE || '') + '/?c=' + id; a.style.setProperty('--c', c.color || '#999');
        rest.parentNode.insertBefore(a, rest);
        return;
      }
    }
  });
})();

// 閱讀頁：字級、夜間模式、記住讀到哪
(function () {
  var sec = document.querySelector('.chapter.read');
  var d = document.documentElement;
  function save(k, v) { try { localStorage.setItem(k, v); } catch (e) {} }
  var bs = document.querySelectorAll('.fs button');
  bs.forEach(function (b) {
    b.setAttribute('aria-pressed', d.dataset.fs === b.dataset.fs);
    b.onclick = function () { d.dataset.fs = b.dataset.fs; save('wb:fs', b.dataset.fs); bs.forEach(function (x) { x.setAttribute('aria-pressed', x === b); }); };
  });
  var tb = document.querySelector('.theme-btn');
  function lab() { tb.setAttribute('aria-label', d.dataset.theme === 'night' ? '切換白天模式' : '切換夜間模式'); }
  if (tb) { tb.onclick = function () { d.dataset.theme = d.dataset.theme === 'night' ? 'day' : 'night'; save('wb:theme', d.dataset.theme); lab(); }; lab(); }
  if (sec && sec.dataset.novel) {
    var rec = JSON.stringify({ url: location.pathname, no: sec.dataset.no, title: sec.dataset.title, char: sec.dataset.char, t: Date.now() });
    save('wb:last:' + sec.dataset.novel, rec);
    save('wb:last:' + sec.dataset.novel + ':' + sec.dataset.char, rec);
  }
})();

// 選單：碰到「小說」滑出看過的小說，手機點箭頭展開
(function () {
  var g = document.querySelector('.d-group'); if (!g) return;
  var sub = g.querySelector('.d-sub'), arrow = g.querySelector('.d-arrow');
  var novels = JSON.parse(document.getElementById('novels').textContent || '{}'), list = [];
  var chars = JSON.parse(document.getElementById('chars').textContent || '{}');
  var split = window.SPLIT || [];
  function rd(k) { try { var r = JSON.parse(localStorage.getItem(k) || 'null'); return r && r.url ? r : null; } catch (e) { return null; } }
  function row(href, label, no, cls) {
    var a = document.createElement('a'); a.href = href; a.textContent = label; if (cls) a.className = cls;
    var sm = document.createElement('small'); sm.textContent = '第 ' + no + ' 章'; a.appendChild(sm); return a;
  }
  Object.keys(novels).forEach(function (id) {
    if (split.indexOf(id) >= 0 || novels[id].split) {
      // 兩個角色各自一條線：每個角色各記一行
      var rows = [];
      Object.keys(chars).forEach(function (cid) { if (chars[cid].novel !== id) return; var r = rd('wb:last:' + id + ':' + cid); if (r) rows.push([cid, r]); });
      if (!rows.length) { var old = rd('wb:last:' + id); if (old) { if (old.char) rows.push([old.char, old]); else { list.push({ id: id, r: old, t: old.t || 0 }); return; } } }
      if (rows.length) list.push({ id: id, rows: rows, t: Math.max.apply(null, rows.map(function (x) { return x[1].t || 0; })) });
    } else {
      var r = rd('wb:last:' + id); if (r) list.push({ id: id, r: r, t: r.t || 0 });
    }
  });
  list.sort(function (a, b) { return b.t - a.t; });
  if (!list.length) { var p = document.createElement('p'); p.textContent = '還沒有看過的小說'; sub.appendChild(p); }
  list.forEach(function (x) {
    if (x.r) { sub.appendChild(row(x.r.url, novels[x.id].title, x.r.no)); return; }
    var h = document.createElement('a'); h.href = BASE + '/?n=' + x.id; h.className = 'd-nv'; h.textContent = novels[x.id].title; sub.appendChild(h);
    x.rows.forEach(function (y) { sub.appendChild(row(y[1].url, (chars[y[0]] || {}).name || '', y[1].no, 'd-ch')); });
  });
  arrow.onclick = function () { var o = g.classList.toggle('open'); arrow.setAttribute('aria-expanded', o); };
})();

// 小說總覽的台灣地圖：滑到（手機點）一個地形區，旁邊列出那區的小說
(function () {
  var wrap = document.querySelector('.tw-wrap'); if (!wrap) return;
  var panel = wrap.querySelector('.tw-panel'), hint = panel.innerHTML;
  var novels = JSON.parse(document.getElementById('novels').textContent || '{}');
  var chars = JSON.parse(document.getElementById('chars').textContent || '{}');
  var regions = JSON.parse(document.getElementById('regions').textContent || '[]'), names = {};
  regions.forEach(function (s) { (s.areas || []).forEach(function (a) { names[a.key] = a.name; }); });
  function color(id) { for (var k in chars) if (chars[k].novel === id) return chars[k].color; return '#6b665c'; }
  function list(key) { return Object.keys(novels).filter(function (id) { return novels[id].region === key; }); }
  var cur = null, pinned = null;
  function show(key) {
    if (key === cur) return; cur = key;
    wrap.querySelectorAll('.tw-rg').forEach(function (r) { r.classList.toggle('on', r.dataset.rg === key); });
    panel.innerHTML = '';
    var h = document.createElement('h3'); h.textContent = names[key] || ''; panel.appendChild(h);
    var ids = list(key);
    if (!ids.length) { var p = document.createElement('p'); p.className = 'tw-empty'; p.textContent = '這裡還沒有小說。'; panel.appendChild(p); return; }
    ids.forEach(function (id) {
      var a = document.createElement('a'); a.className = 'tw-item'; a.href = BASE + '/?n=' + id; a.style.color = color(id);
      var b = document.createElement('b'); b.textContent = novels[id].title; a.appendChild(b);
      if (novels[id].era) { var s = document.createElement('small'); s.textContent = novels[id].era; a.appendChild(s); }
      panel.appendChild(a);
    });
  }
  wrap.querySelectorAll('.tw-rg').forEach(function (r) {
    if (list(r.dataset.rg).length) r.classList.add('has');
    // 還沒點選時，滑過去先預覽；點了就固定，滑到別區也不會換
    r.addEventListener('mouseenter', function () { if (!pinned) show(r.dataset.rg); });
    r.addEventListener('click', function () {
      pinned = r.dataset.rg; cur = null; show(pinned);
      wrap.querySelectorAll('.tw-rg').forEach(function (x) { x.classList.toggle('pin', x.dataset.rg === pinned); });
    });
  });
})();
