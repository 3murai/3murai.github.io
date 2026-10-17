// Renders the works lists from works-data.js: stats, featured video, and two
// filterable lists (依頼 / 自主制作) with "もっと見る" paging.
// Thumbnails load straight from YouTube where the host allows it; where it
// doesn't (some hosts block outside images), the
// drawn poster underneath simply stays visible.
(function () {
  var PAGE = 12;
  var own = (window.WORKS_OWN || []).map(function (r, i) { return work(r, i, 'own'); });
  var client = (window.WORKS_CLIENT || []).map(function (r, i) { return work(r, i, 'client'); });

  function work(r, i, src) {
    return {
      id: r[0], views: r[1], when: r[2], dur: r[3], kind: r[4],
      title: cleanTitle(r[5]), who: r[6] || '', order: i, src: src
    };
  }
  // Drop trailing hashtag runs ("… #vtuber #切り抜き") and 【 #… 】 blocks — the title reads cleaner.
  function cleanTitle(t) {
    return t.replace(/\s*【[^【】]*#[^【】]*】\s*$/, '').replace(/(\s*#[^\s#]+)+\s*$/, '').trim();
  }

  // 42万 / 1.9万 / 6,053 — the way YouTube itself shows counts
  function fmt(n) {
    if (n >= 1e8) return trim(n / 1e8) + '億';
    if (n >= 1e4) return trim(n / 1e4) + '万';
    return n.toLocaleString('ja-JP');
  }
  function trim(x) { return (x >= 100 ? Math.round(x) : Math.round(x * 10) / 10).toString(); }
  function when(w) { return /^\d{4}-\d\d-\d\d$/.test(w.when) ? w.when.replace(/-/g, '/') : w.when; }
  function url(w) { return w.kind === 's' ? 'https://youtube.com/shorts/' + w.id : 'https://youtu.be/' + w.id; }
  // bundled copy first (thumbs.js); YouTube's image is the fallback
  function thumb(w) { return (window.WORKS_THUMBS || {})[w.id] ? 'thumbs/' + w.id + '.jpg' : 'https://i.ytimg.com/vi/' + w.id + '/mqdefault.jpg'; }

  // Stable per-video tint in the lavender range, so tiles differ even without thumbnails
  function hue(id) {
    var h = 0;
    for (var i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) >>> 0;
    return 248 + (h % 40);
  }
  function esc(s) {
    return s.replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; });
  }

  function tile(w, rank) {
    return '<a class="vtile" href="' + url(w) + '" target="_blank" rel="noopener" style="--h:' + hue(w.id) + '">' +
      '<div class="poster">' +
        '<img class="thumb" src="' + thumb(w) + '" alt="" loading="lazy" decoding="async">' +
        '<span class="play" aria-hidden="true"></span>' +
        (w.kind === 's' ? '<span class="kind">ショート</span>' : '') +
        (rank ? '<span class="rank" aria-hidden="true">' + rank + '</span>' : '') +
        (w.dur ? '<span class="dur">' + w.dur + '</span>' : '') +
      '</div>' +
      '<div class="vbody">' +
        (w.who ? '<p class="who">' + esc(w.who) + ' 様</p>' : '') +
        '<p class="vtitle">' + esc(w.title) + '</p>' +
        '<p class="vmeta"><span class="views">' + fmt(w.views) + '回再生</span>' + (w.when ? '<span>' + when(w) + '</span>' : '') + '</p>' +
      '</div></a>';
  }

  // A blocked or missing thumbnail removes itself; the drawn poster shows instead.
  document.addEventListener('error', function (e) {
    var t = e.target;
    if (t && t.classList && t.classList.contains('thumb')) t.remove();
  }, true);

  // ---- Stats + featured ----
  var all = own.concat(client);
  var total = all.reduce(function (s, w) { return s + w.views; }, 0);
  var top = all.slice().sort(function (a, b) { return b.views - a.views; })[0];
  setHTML('stat-count', all.length + '<small>本</small>');
  setHTML('stat-client', client.length + '<small>本</small>');
  setHTML('stat-total', fmt(total) + '<small>回以上</small>');
  if (top) {
    setHTML('stat-top', fmt(top.views) + '<small>回</small>');
    document.querySelectorAll('[data-top-link]').forEach(function (a) { a.href = url(top); });
    document.querySelectorAll('[data-top-title]').forEach(function (el) { el.textContent = top.title; });
    document.querySelectorAll('[data-top-views]').forEach(function (el) { el.textContent = fmt(top.views) + '回再生'; });
    document.querySelectorAll('[data-top-thumb]').forEach(function (el) {
      var img = new Image();
      img.className = 'thumb';
      img.alt = '';
      img.src = (window.WORKS_THUMBS || {})[top.id] ? 'thumbs/' + top.id + '.jpg' : 'https://i.ytimg.com/vi/' + top.id + '/hqdefault.jpg';
      el.prepend(img);
    });
  }
  setText('works-note', '再生回数は ' + (window.WORKS_FETCHED || '') + ' 時点です（自主制作は YouTube の丸めた表示、依頼作品は正確な回数）。');

  function setHTML(id, html) { var el = document.getElementById(id); if (el) el.innerHTML = html; }
  function setText(id, t) { var el = document.getElementById(id); if (el) el.textContent = t; }

  // ---- A filterable list ----
  function mount(root, works, defaults) {
    if (!root) return;
    var grid = root.querySelector('.tiles');
    var moreBtn = root.querySelector('.more button');
    var shownEl = root.querySelector('.more span');
    var state = { kind: 'all', sort: defaults.sort, q: '', shown: PAGE };

    function rows() {
      var q = state.q.trim().toLowerCase();
      var r = works.filter(function (w) {
        return (state.kind === 'all' || w.kind === state.kind) &&
          (!q || (w.title + ' ' + w.who).toLowerCase().indexOf(q) !== -1);
      });
      r.sort(state.sort === 'views'
        ? function (a, b) { return b.views - a.views; }
        : function (a, b) { return a.order - b.order; });
      return r;
    }
    function render() {
      var r = rows();
      var ranked = state.sort === 'views' && !state.q && state.kind === 'all';
      grid.innerHTML = r.slice(0, state.shown).map(function (w, i) { return tile(w, ranked && i < 3 ? i + 1 : 0); }).join('') ||
        '<div class="empty"><strong>見つかりませんでした</strong><p>別のことばで検索してみてください。</p></div>';
      var n = Math.min(state.shown, r.length);
      shownEl.textContent = r.length ? n + ' / ' + r.length + ' 本を表示中' : '';
      moreBtn.hidden = n >= r.length;
    }

    var segBtns = root.querySelectorAll('.seg button');
    var counts = { all: works.length };
    works.forEach(function (w) { counts[w.kind] = (counts[w.kind] || 0) + 1; });
    segBtns.forEach(function (b) {
      b.insertAdjacentHTML('beforeend', ' <span class="n">' + (counts[b.dataset.kind] || 0) + '</span>');
      b.addEventListener('click', function () {
        segBtns.forEach(function (x) { x.setAttribute('aria-pressed', String(x === b)); });
        state.kind = b.dataset.kind; state.shown = PAGE; render();
      });
    });
    var sort = root.querySelector('select');
    sort.value = state.sort;
    sort.addEventListener('change', function () { state.sort = sort.value; state.shown = PAGE; render(); });
    root.querySelector('input[type=search]').addEventListener('input', function (e) { state.q = e.target.value; state.shown = PAGE; render(); });
    moreBtn.addEventListener('click', function () { state.shown += PAGE; render(); });
    render();
  }

  mount(document.getElementById('client'), client, { sort: 'new' });
  mount(document.getElementById('own'), own, { sort: 'views' });

  // Top page: the most-viewed works across everything
  var topGrid = document.getElementById('top-works');
  if (topGrid) {
    topGrid.innerHTML = all.slice().sort(function (a, b) { return b.views - a.views; })
      .slice(0, 6).map(function (w, i) { return tile(w, i < 3 ? i + 1 : 0); }).join('');
  }
})();
