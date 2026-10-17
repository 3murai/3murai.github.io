// Top page stage.
// 1) On load (CSS, class "is-on"): the lights come up and the Charascène wordmark is wiped in and cut.
//    Plays once per browser session; a click skips it ("instant" jumps every load animation to its end).
// 2) On scroll: a timeline scrubbed by the scroll position (smoothed per frame, time-based):
//    the wordmark rises, a 16:9 frame draws itself, three scenes play, a cut runs through the frame
//    and the two halves are pushed apart by the white page opening out of the cut.
(function () {
  var section = document.getElementById('cam');
  var st = document.getElementById('stage');
  if (!section || !st) return;
  var reduce = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
  function $(id) { return document.getElementById(id); }

  // ---------- load sequence ----------
  var KEY = 'charascene-intro';
  var seen = false;
  try { seen = sessionStorage.getItem(KEY) === '1'; } catch (e) {}
  function skip() { st.classList.add('instant'); }
  st.addEventListener('click', skip);
  function start() {
    st.classList.add('is-on');
    if (seen || reduce) skip();
    try { sessionStorage.setItem(KEY, '1'); } catch (e) {}
  }
  if (document.fonts && document.fonts.ready) {
    var started = false;
    var go = function () { if (!started) { started = true; start(); } };
    document.fonts.ready.then(go);
    setTimeout(go, 1200);                      // never wait on a slow font for long
  } else start();

  // ---------- scroll timeline ----------
  var logo = $('hero-logo'), copy = $('hero-copy'), cut = $('cutline'), open = $('open'), hint = $('stage-hint');
  var lights = st.querySelector('.lights');
  var frameA = $('frame');
  var frameB = frameA.cloneNode(true);          // bottom half after the cut
  frameB.removeAttribute('id');
  frameB.style.visibility = 'hidden';
  frameA.parentNode.insertBefore(frameB, frameA.nextSibling);
  var frames = [frameA, frameB].map(function (f) {
    return {
      el: f, rect: f.querySelector('rect'), corners: f.querySelectorAll('.corner'), inner: f.querySelector('.frame-in'),
      scenes: [].map.call(f.querySelectorAll('.scene'), function (s) { return s.querySelectorAll('.no > span, .w > span, .en > span'); }),
      ph: f.querySelector('.ph'), bars: f.querySelectorAll('.fr-time i'), tc: f.querySelector('.tc'), time: f.querySelector('.fr-time')
    };
  });

  var ANG = 4 * Math.PI / 180, SIN = Math.sin(ANG), COS = Math.cos(ANG), TAN = Math.tan(ANG);
  var SCENES = [[.36, .48], [.48, .60], [.60, .70]];

  function clamp(v) { return v < 0 ? 0 : v > 1 ? 1 : v; }
  function seg(p, a, b) { return clamp((p - a) / (b - a)); }
  function io(t) { return t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2; }   // ease in-out
  function out(t) { return 1 - Math.pow(1 - t, 4); }                                    // ease out
  function pad(n) { return (n < 10 ? '0' : '') + n; }

  var lastSplit = null;
  function frame(p) {
    var W = st.clientWidth, H = st.clientHeight;

    // copy and hint leave first
    var c = io(seg(p, .03, .14));
    copy.style.opacity = 1 - c;
    copy.style.transform = 'translate3d(0,' + (-30 * c) + 'px,0)';
    hint.classList.toggle('hide', p > .015);

    // the wordmark rises above the frame and shrinks
    var fw = frameA.offsetWidth, fh = frameA.offsetHeight;
    var l = io(seg(p, .06, .26));
    var c0 = logo.offsetTop + logo.offsetHeight / 2;
    var targetY = H / 2 - fh / 2 - Math.max(30, H * .06);
    var ls = 1 - .68 * l;
    logo.style.transform = 'translate3d(0,' + ((targetY - c0) * l).toFixed(2) + 'px,0) scale(' + ls.toFixed(4) + ')';
    logo.style.opacity = 1 - seg(p, .70, .76);

    // house lights dim for the frame, go out when the page opens
    lights.style.opacity = (1 - .55 * seg(p, .15, .3) - .45 * seg(p, .74, .86)).toFixed(3);

    // frame draws itself
    var fo = seg(p, .17, .2);
    var draw = io(seg(p, .18, .32));
    var fs = .96 + .04 * io(seg(p, .18, .36));
    var co = out(seg(p, .30, .35));
    var ino = seg(p, .31, .36);
    var time = seg(p, .36, .70);
    var tcText = '00:00:' + pad(Math.floor(time * 36)) + ':' + pad(Math.floor(time * 36 * 24) % 24);
    var cur = time >= 1 ? 2 : Math.min(2, Math.floor(time * 3));

    // cut, then split
    var k = seg(p, .70, .75);
    cut.style.opacity = k > 0 ? 1 - seg(p, .78, .82) : 0;
    cut.style.transform = 'rotate(-4deg) scaleX(' + out(k).toFixed(4) + ')';
    var g = io(seg(p, .75, .92));
    var dyv = TAN * (W / 2) / H;                     // half the cut's vertical drop, as a fraction of H
    var maxG = .5 + dyv + .03;
    var gg = g * maxG, d = gg * H;
    var split = g > 0;

    for (var i = 0; i < 2; i++) {
      var F = frames[i], dir = i === 0 ? -1 : 1;
      var tx = split ? dir * SIN * d : 0, ty = split ? dir * COS * d : 0;
      F.el.style.opacity = fo;
      F.el.style.transform = 'translate3d(calc(-50% + ' + tx.toFixed(2) + 'px), calc(-50% + ' + ty.toFixed(2) + 'px), 0) scale(' + fs.toFixed(4) + ')';
      F.rect.style.strokeDashoffset = (1 - draw).toFixed(4);
      for (var j = 0; j < F.corners.length; j++) { F.corners[j].style.opacity = co; F.corners[j].style.transform = 'scale(' + (1.6 - .6 * co) + ')'; }
      F.inner.style.opacity = ino;
      for (var s = 0; s < SCENES.length; s++) {
        var a = SCENES[s][0], b = SCENES[s][1], parts = F.scenes[s];
        for (var q = 0; q < parts.length; q++) {
          var inn = out(seg(p, a + q * .008, a + .04 + q * .008));
          var leave = s === SCENES.length - 1 ? 0 : io(seg(p, b - .03 + q * .006, b + q * .006));
          parts[q].style.transform = 'translate3d(0,' + ((1 - inn) * 115 - leave * 115).toFixed(2) + '%,0)';
        }
      }
      F.ph.style.transform = 'translate3d(' + (time * F.time.offsetWidth).toFixed(2) + 'px,0,0)';
      for (var bi = 0; bi < F.bars.length; bi++) F.bars[bi].classList.toggle('on', time > 0 && bi === cur);
      if (F.tc.textContent !== tcText) F.tc.textContent = tcText;
    }

    if (split !== lastSplit) {
      lastSplit = split;
      // the frame's own copy of the cut, in its local box (it is centred on the viewport cut)
      var dyf = TAN * (fw / 2) / fh * 100;
      frameA.style.clipPath = split ? 'polygon(-5% -5%, 105% -5%, 105% ' + (50 - dyf) + '%, -5% ' + (50 + dyf) + '%)' : '';
      frameB.style.clipPath = split ? 'polygon(-5% ' + (50 + dyf) + '%, 105% ' + (50 - dyf) + '%, 105% 105%, -5% 105%)' : '';
      frameB.style.visibility = split ? '' : 'hidden';
    }

    // the white page opens out of the cut
    var y0 = (.5 + dyv) * 100, y1 = (.5 - dyv) * 100, h = gg * 100;
    open.style.clipPath = 'polygon(0 ' + (y0 - h).toFixed(3) + '%, 100% ' + (y1 - h).toFixed(3) + '%, 100% ' + (y1 + h).toFixed(3) + '%, 0 ' + (y0 + h).toFixed(3) + '%)';
    var ot = out(seg(p, .84, .94));
    open.style.setProperty('--o', ot);
    for (var oi = 0; oi < open.children.length; oi++) {
      var ch = open.children[oi], t2 = out(seg(p, .84 + oi * .02, .94 + oi * .02));
      ch.style.opacity = t2;
      ch.style.transform = 'translate3d(0,' + ((1 - t2) * 24).toFixed(2) + 'px,0)';
    }
  }

  function progress() {
    var r = section.getBoundingClientRect();
    var span = section.offsetHeight - st.offsetHeight;
    return span > 0 ? clamp(-r.top / span) : 0;
  }

  var cur = 0, target = 0, raf = 0, lastT = 0;
  function tick(now) {
    raf = 0;
    var dt = lastT ? Math.min((now - lastT) / 1000, .1) : 1 / 60;
    lastT = now;
    cur += (target - cur) * (1 - Math.exp(-dt * 7));
    if (Math.abs(target - cur) < .0001) cur = target;
    frame(cur);
    if (cur !== target) raf = requestAnimationFrame(tick); else lastT = 0;
  }
  function onScroll() { target = progress(); if (!raf) raf = requestAnimationFrame(tick); }
  window.__stage = function (p) { cur = target = p; frame(p); };       // jump to a moment (for checking)
  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', function () { lastSplit = null; frame(cur); });
  frame(0);
  onScroll();

  // the logo in the nav replays the opening from the top
  var logoLink = document.querySelector('.nav .logo');
  if (logoLink) logoLink.addEventListener('click', function (e) {
    e.preventDefault();
    var html = document.documentElement, sb = html.style.scrollBehavior;
    html.style.scrollBehavior = 'auto'; window.scrollTo(0, 0); html.style.scrollBehavior = sb;
    window.__stage(0);
    st.classList.remove('is-on', 'instant');
    void st.offsetWidth;
    st.classList.add('is-on');
  });

  // brand reveal: the large wordmark is cut open when it scrolls into view
  var brand = document.getElementById('brand');
  if (brand) {
    if ('IntersectionObserver' in window) new IntersectionObserver(function (es, o) { if (es[0].isIntersecting) { brand.classList.add('is-in'); o.disconnect(); } }, { threshold: .3 }).observe(brand);
    else brand.classList.add('is-in');
  }
})();
