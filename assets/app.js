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
    box.querySelectorAll('.chapter').forEach(function (ch) {
      var ok = ch.dataset.char === c && (!n || ch.dataset.novel === n);
      ch.hidden = !ok;
      if (ok) { shown++; ch.querySelector('.ch-no').textContent = '第 ' + shown + ' 章'; }
    });

    var prof = document.getElementById('profile');
    var av = document.createElement('div');
    av.className = 'avatar'; av.style.setProperty('--c', who.color || '#999');
    if (who.avatar) { var im = new Image(); im.src = BASE + '/assets/avatars/' + who.avatar; im.alt = ''; av.appendChild(im); }
    else av.textContent = who.glyph || who.name.charAt(0);
    var info = document.createElement('div');
    var h = document.createElement('h1'); h.textContent = who.name;
    var hd = document.createElement('span'); hd.className = 'handle'; hd.textContent = '@' + who.handle;
    var bio = document.createElement('p'); bio.textContent = who.bio || '';
    info.append(h, hd, bio);
    prof.append(av, info); prof.hidden = false;
    document.title = who.name + '｜未備份';

    if (location.hash) {
      var t = document.getElementById(decodeURIComponent(location.hash.slice(1)));
      if (t) setTimeout(function () { t.scrollIntoView(); }, 50);
    }
  } else {
    // 動態牆：每章一則重點
    feed.querySelectorAll('.teaser').forEach(function (t) {
      var ok = !n || t.dataset.novel === n;
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
