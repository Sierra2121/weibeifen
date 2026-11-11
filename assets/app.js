(function () {
  // 展開串文
  document.querySelectorAll('.expand').forEach(function (btn) {
    btn.addEventListener('click', function () {
      btn.closest('.thread').querySelectorAll('.post.more').forEach(function (p) { p.hidden = false; });
      btn.remove();
    });
  });

  var feed = document.querySelector('.feed');
  if (!feed) return;
  var q = new URLSearchParams(location.search);
  var n = q.get('n') || '', c = q.get('c') || '';
  var chars = JSON.parse(document.getElementById('chars').textContent || '{}');

  // 篩選：?n=小說 或 ?c=角色
  var shown = 0;
  feed.querySelectorAll('.thread').forEach(function (t) {
    var ok = (!n || t.dataset.novel === n) && (!c || t.dataset.char === c);
    t.hidden = !ok; if (ok) shown++;
  });
  document.querySelector('.empty').hidden = shown > 0;
  document.querySelectorAll('.chip').forEach(function (ch) {
    ch.classList.toggle('on', !c && ch.dataset.n === n);
  });

  // 角色個人頁
  var who = chars[c];
  if (who) {
    var box = document.getElementById('profile');
    var av = document.createElement('div');
    av.className = 'avatar'; av.style.setProperty('--c', who.color || '#999');
    if (who.avatar) { var im = new Image(); im.src = BASE + '/assets/avatars/' + who.avatar; im.alt = ''; av.appendChild(im); }
    else av.textContent = who.glyph || who.name.charAt(0);
    var info = document.createElement('div');
    var h = document.createElement('h1'); h.textContent = who.name;
    var hd = document.createElement('span'); hd.className = 'handle'; hd.textContent = '@' + who.handle;
    var bio = document.createElement('p'); bio.textContent = who.bio || '';
    info.append(h, hd, bio);
    box.append(av, info); box.hidden = false;
    document.title = who.name + '｜未備份';
  }
})();
