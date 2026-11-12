(function () {
  var feed = document.querySelector('.feed');
  if (!feed) return;
  var q = new URLSearchParams(location.search);
  var n = q.get('n') || '', c = q.get('c') || '';
  var chars = JSON.parse(document.getElementById('chars').textContent || '{}');
  var who = chars[c];
  var shown = 0;

  if (who) {
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
    feed.querySelectorAll('.teaser').forEach(function (t) {
      var key = t.querySelector('.actions').dataset.key;
      var ok = (!n || t.dataset.novel === n) && (!liked || has('like:' + key)) && (!rp || has('rp:' + key));
      t.hidden = !ok; if (ok) shown++;
    });
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
