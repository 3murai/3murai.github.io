// 見積もり: price calculator from the カラセーヌ 料金表, which writes a ready-to-send request
// message (mail / copy / foriio).
(function () {
  var CONTACT = {
    email: 'uta40344@gmail.com',
    foriio: 'https://www.foriio.com/3murai'
  };

  // ---------- 2) 見積もり ----------
  // price: 通常 / first: 初回 / long: 長期ご利用。null = 要相談
  var PLANS = {
    short: { label: 'ショート動画', price: 3000, first: 2000, long: 2000 },
    long1: { label: '横動画（0:01〜7:59）', price: 8000, first: 6000, long: 6000 },
    long2: { label: '横動画（8:00〜14:59）', price: 15000, first: 10000, long: 12000 },
    long3: { label: '横動画（15:00以上）', price: null },
    plan:  { label: '企画動画', price: null }
  };
  var THUMB = { price: 1000, first: 0, long: 500 };
  var CLIP = 1000;                   // シーン抜粋をおまかせ
  var ARCHIVE = [0, 1000, 2000];     // アーカイブ 2h未満 / 2h以上 / 5h以上（抜粋に上乗せ）
  var CAST = { normal: 1000, long: 500 }; // 出演 2人目から1人ごと
  var MODE_LABEL = { first: 'はじめて（1本目が初回価格）', normal: '通常', long: '長期ご利用' };
  var ARC_LABEL = ['2時間未満', '2時間以上', '5時間以上'];

  var form = document.getElementById('estimate-form');
  if (!form) return;
  var $ = function (id) { return document.getElementById(id); };
  var out = { total: $('est-total'), per: $('est-per'), lines: $('est-lines'), msg: $('est-message'), copy: $('est-copy'), copied: $('est-copied'), mail: $('est-mail'), foriio: $('est-foriio') };
  if (out.foriio) out.foriio.href = CONTACT.foriio;

  function yen(n) { return '¥' + n.toLocaleString('ja-JP'); }
  function radio(name) { var el = form.querySelector('input[name="' + name + '"]:checked'); return el ? el.value : ''; }
  function num(name, min, max) { return Math.max(min, Math.min(max, parseInt(form.elements[name].value, 10) || min)); }
  function text(name) { return (form.elements[name].value || '').trim(); }

  function calc() {
    var plan = PLANS[radio('plan')] || PLANS.short;
    var mode = radio('mode') || 'normal';
    var qty = num('qty', 1, 60);
    var cast = num('cast', 1, 20);
    var clip = form.elements.clip.checked;
    var thumb = form.elements.thumb.checked;
    form.querySelectorAll('input[name="arc"]').forEach(function (r) { r.disabled = !clip; });
    var arc = clip ? +radio('arc') : 0;

    var lines = [];
    var total = 0;
    var consult = plan.price === null;

    if (consult) {
      lines.push([plan.label + ' × ' + qty + '本', '要相談']);
    } else if (mode === 'first') {
      total += plan.first + plan.price * (qty - 1);
      lines.push([plan.label + '（初回）× 1本', yen(plan.first)]);
      if (qty > 1) lines.push([plan.label + ' × ' + (qty - 1) + '本', yen(plan.price * (qty - 1))]);
    } else {
      var unit = mode === 'long' ? plan.long : plan.price;
      total += unit * qty;
      lines.push([plan.label + (mode === 'long' ? '（長期）' : '') + ' × ' + qty + '本', yen(unit * qty)]);
    }
    if (clip) {
      var c = (CLIP + ARCHIVE[arc]) * qty;
      total += c;
      lines.push(['シーン抜粋（アーカイブ' + ARC_LABEL[arc] + '）× ' + qty + '本', yen(c)]);
    }
    if (cast > 1) {
      var per = mode === 'long' ? CAST.long : CAST.normal;
      var k = per * (cast - 1) * qty;
      total += k;
      lines.push(['出演 ' + cast + '人（＋' + (cast - 1) + '人）× ' + qty + '本', yen(k)]);
    }
    if (thumb) {
      var t = mode === 'first' ? THUMB.first + THUMB.price * (qty - 1) : (mode === 'long' ? THUMB.long : THUMB.price) * qty;
      total += t;
      lines.push(['サムネイル × ' + qty + '枚' + (mode === 'first' ? '（1枚目 初回0円）' : ''), yen(t)]);
    }

    var totalText = consult ? (total ? yen(total) + ' ＋ 要相談' : '要相談') : yen(total);
    out.total.textContent = totalText;
    out.per.textContent = (!consult && qty > 1) ? '1本あたり 約' + yen(Math.round(total / qty)) : '';
    out.lines.innerHTML = lines.map(function (l) { return '<li><span>' + l[0] + '</span><span>' + l[1] + '</span></li>'; }).join('');

    var name = text('name') || '（お名前）';
    var msg =
      'カラセーヌ さ村井 様\n\n' +
      (mode === 'first' ? 'はじめまして、' : 'お世話になっております。') + name + 'です。\n' +
      '動画編集のご依頼について相談させてください。\n\n' +
      '■ 内容：' + plan.label + ' × ' + qty + '本\n' +
      '■ 料金プラン：' + MODE_LABEL[mode] + '\n' +
      '■ 出演人数：' + cast + '人\n' +
      '■ シーン抜粋：' + (clip ? 'おまかせ（アーカイブ' + ARC_LABEL[arc] + '）' : 'こちらで指定') + '\n' +
      '■ サムネイル制作：' + (thumb ? 'あり' : 'なし') + '\n' +
      '■ 見積もり目安：' + totalText + '（サイトの料金表より）\n' +
      (text('channel') ? '■ チャンネル：' + text('channel') + '\n' : '') +
      (text('deadline') ? '■ 希望納期：' + text('deadline') + '\n' : '') +
      (text('note') ? '■ 詳細：\n' + text('note') + '\n' : '') +
      '\nよろしくお願いいたします。';
    out.msg.value = msg;
    out.mail.href = 'mailto:' + CONTACT.email + '?subject=' + encodeURIComponent('動画編集のご依頼（' + name + '）') + '&body=' + encodeURIComponent(msg);
  }

  form.addEventListener('input', calc);
  form.addEventListener('change', calc);
  form.addEventListener('submit', function (e) { e.preventDefault(); });
  out.copy.addEventListener('click', function () {
    var done = function () { out.copied.hidden = false; setTimeout(function () { out.copied.hidden = true; }, 2200); };
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(out.msg.value).then(done, function () { out.msg.select(); });
    } else { out.msg.select(); }
  });
  calc();
})();
