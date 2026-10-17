/* Small finishing touches shared by every page: a scroll-progress hairline under the nav,
   gentle fade-ups as blocks enter, numbers that count up once, and the current section
   underlined in the nav. Everything degrades to the plain page without JS or with reduced motion. */
(function () {
  var reduce = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
  var root = document.documentElement;

  // scroll progress hairline
  var nav = document.querySelector('.nav');
  if (nav) {
    var bar = document.createElement('span');
    bar.className = 'progress';
    bar.setAttribute('aria-hidden', 'true');
    nav.appendChild(bar);
    var ticking = false;
    var update = function () {
      ticking = false;
      var max = document.documentElement.scrollHeight - innerHeight;
      bar.style.transform = 'scaleX(' + (max > 0 ? Math.min(scrollY / max, 1) : 0).toFixed(4) + ')';
    };
    addEventListener('scroll', function () { if (!ticking) { ticking = true; requestAnimationFrame(update); } }, { passive: true });
    addEventListener('resize', update);
    update();
  }

  // "back to top" at the end of the footer
  var foot = document.querySelector('.foot');
  if (foot) {
    var up = document.createElement('a');
    up.className = 'totop';
    up.href = '#';
    up.textContent = 'ページの先頭へ';
    up.addEventListener('click', function (e) { e.preventDefault(); scrollTo({ top: 0, behavior: reduce ? 'auto' : 'smooth' }); });
    foot.insertBefore(up, foot.querySelector('.copy'));
  }

  if (!('IntersectionObserver' in window)) return;

  // fade-ups
  if (!reduce) {
    root.classList.add('js-rise');
    var sel = '.section-head, .mission, .grid3 > .card, .links3, .numbers, .dl-table, .history li, .news li, .cta, .ceo > div, .page-head, .price-table-wrap, .group-head';
    var rise = new IntersectionObserver(function (es) {
      es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add('risen'); rise.unobserve(e.target); } });
    }, { rootMargin: '0px 0px -6% 0px' });
    document.querySelectorAll(sel).forEach(function (el) {
      var sib = el.parentNode ? [].indexOf.call(el.parentNode.children, el) : 0;
      if (el.matches('.grid3 > .card, .history li, .news li, .ceo > div')) el.style.transitionDelay = Math.min(sib, 4) * 70 + 'ms';
      el.classList.add('rise');
      rise.observe(el);
    });
  }

  // numbers count up once, keeping their own format (e.g. "837万")
  var nums = document.querySelectorAll('.num dd');
  if (nums.length) {
    var cnt = new IntersectionObserver(function (es) {
      es.forEach(function (e) {
        if (!e.isIntersecting) return;
        cnt.unobserve(e.target);
        var t = e.target.firstChild;
        if (!t || t.nodeType !== 3 || reduce) return;
        var m = /^([\d.,]+)(.*)$/.exec(t.nodeValue);
        if (!m) return;
        var to = parseFloat(m[1].replace(/,/g, '')), dec = (m[1].split('.')[1] || '').length, rest = m[2], t0 = performance.now();
        (function step(now) {
          var k = Math.min((now - t0) / 1400, 1), v = to * (1 - Math.pow(1 - k, 4));
          t.nodeValue = (dec ? v.toFixed(dec) : Math.round(v).toLocaleString('ja-JP')) + rest;
          if (k < 1) requestAnimationFrame(step); else t.nodeValue = m[1] + rest;
        })(t0);
      });
    }, { threshold: .6 });
    nums.forEach(function (el) { cnt.observe(el); });
  }

  // current section underlined in the nav (top page)
  var links = [].slice.call(document.querySelectorAll('.nav-links a[href^="#"]'));
  if (links.length) {
    var byId = {};
    links.forEach(function (a) { var s = document.getElementById(a.getAttribute('href').slice(1)); if (s) byId[s.id] = a; });
    var spy = new IntersectionObserver(function (es) {
      es.forEach(function (e) {
        var a = byId[e.target.id];
        if (a) a.classList.toggle('here', e.isIntersecting);
      });
    }, { rootMargin: '-45% 0px -50% 0px' });
    Object.keys(byId).forEach(function (id) { spy.observe(document.getElementById(id)); });
  }
})();
