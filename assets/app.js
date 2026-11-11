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
    document.querySelector('.chips').hidden = true;
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
    document.querySelectorAll('.chip').forEach(function (ch) {
      ch.classList.toggle('on', ch.dataset.n === n);
    });
  }
  document.querySelector('.empty').hidden = shown > 0;
})();
