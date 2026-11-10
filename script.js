(function(){
  var root = document.documentElement;
  var reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  var fine = matchMedia('(pointer: fine)').matches && !reduced;
  var PHOTOS = ['images/photo1.jpg','images/stage2.jpg','images/photo2.jpg','images/stage1.jpg','images/photo3.jpg','images/hero_bw.jpg','images/photo4.jpg'];
  function clamp(v, a, b){ return Math.max(a, Math.min(b, v)); }
  function $(s, c){ return (c || document).querySelector(s); }
  function $$(s, c){ return Array.prototype.slice.call((c || document).querySelectorAll(s)); }

  /* ---------- entrance ---------- */
  var pending = [], onReady = [];
  function ready(){
    if (root.classList.contains('ready')) return;
    root.classList.add('ready');
    pending.forEach(function(e){ e.classList.add('in'); }); pending = [];
    onReady.forEach(function(f){ f(); });
  }
  var loader = $('.loader'), seen = false;
  try { seen = sessionStorage.getItem('ds_seen') === '1'; } catch(e){}
  if (!loader || reduced || seen) {
    if (loader) loader.remove();
    setTimeout(ready, 0);
  } else {
    var cnt = $('.count', loader), t0 = Date.now(), DUR = 1000;
    var iv = setInterval(function(){
      var p = Math.min(1, (Date.now() - t0) / DUR);
      cnt.textContent = Math.round(p * 100);
      if (p >= 1) {
        clearInterval(iv);
        loader.classList.add('done');
        try { sessionStorage.setItem('ds_seen','1'); } catch(e){}
        setTimeout(function(){ ready(); loader.remove(); }, 600);
      }
    }, 40);
    setTimeout(function(){ ready(); if (loader.parentNode) loader.remove(); }, 4000); // failsafe
  }

  /* ---------- phone menu ---------- */
  var mbtn = $('.menu-btn'), menu = $('#menu');
  function setMenu(open){
    if (!mbtn || !menu) return;
    mbtn.setAttribute('aria-expanded', String(open));
    $('.mb-label', mbtn).textContent = open ? '닫기' : '메뉴';
    menu.classList.toggle('open', open);
    root.classList.toggle('menu-open', open);
    if (open) { var a = $('a', menu); if (a) a.focus({preventScroll:true}); }
  }
  if (mbtn) mbtn.addEventListener('click', function(){ setMenu(mbtn.getAttribute('aria-expanded') !== 'true'); });
  if (menu) $$('a', menu).forEach(function(a){ a.addEventListener('click', function(){ setMenu(false); }); });
  addEventListener('keydown', function(e){
    if (e.key === 'Escape' && menu && menu.classList.contains('open')) { setMenu(false); mbtn.focus(); }
  });

  /* ---------- hero: story-style slides ---------- */
  var hero = $('.hero');
  var slides = $$('.slide', hero), bars = $$('.bars i', hero), cur = 0;
  var hpBtn = $('.hp', hero);
  function go(n){
    cur = (n + slides.length) % slides.length;
    slides.forEach(function(s, i){ s.classList.toggle('is-on', i === cur); });
    bars.forEach(function(b, i){ b.classList.remove('run'); b.classList.toggle('done', i < cur); });
    if (!reduced) { void bars[cur].offsetWidth; bars[cur].classList.add('run'); }
  }
  bars.forEach(function(b){ b.addEventListener('animationend', function(){ if (b.classList.contains('run')) go(cur + 1); }); });
  var prev = $('.tap.prev', hero), next = $('.tap.next', hero);
  if (prev) prev.addEventListener('click', function(){ go(cur - 1); });
  if (next) next.addEventListener('click', function(){ go(cur + 1); });
  if (hpBtn) hpBtn.addEventListener('click', function(){
    var p = hero.classList.toggle('paused');
    hpBtn.setAttribute('aria-pressed', String(p));
    hpBtn.setAttribute('aria-label', p ? '사진 자동 넘김 다시 시작' : '사진 자동 넘김 멈춤');
  });
  if (hpBtn && reduced) hpBtn.hidden = true;
  onReady.push(function(){ if (slides.length) go(0); });
  if ('IntersectionObserver' in window && hero) {
    new IntersectionObserver(function(es){ hero.classList.toggle('offscreen', !es[0].isIntersecting); }, {threshold:.05}).observe(hero);
  }

  /* ---------- headings rise letter by letter ---------- */
  $$('.sec-head h2, .block .head h2, .rail-head h2, .contact h2, .cred-head h2').forEach(function(h){
    if (reduced) return;
    var txt = h.textContent; h.setAttribute('aria-label', txt); h.textContent = '';
    Array.from(txt).forEach(function(c, i){
      if (c === ' ') { h.appendChild(document.createTextNode(' ')); return; }
      var s = document.createElement('span');
      s.className = 'ch'; s.setAttribute('aria-hidden','true'); s.textContent = c;
      s.style.transitionDelay = (i * 45) + 'ms'; h.appendChild(s);
    });
    h.classList.add('rvh');
  });
  var heads = $$('.rvh');
  function show(el){ if (root.classList.contains('ready')) el.classList.add('in'); else pending.push(el); }
  if (reduced || !('IntersectionObserver' in window)) heads.forEach(function(e){ e.classList.add('in'); });
  else {
    var io = new IntersectionObserver(function(es){
      es.forEach(function(e){ if (e.isIntersecting){ show(e.target); io.unobserve(e.target); } });
    }, {threshold:.2});
    heads.forEach(function(e){ io.observe(e); });
    setTimeout(function(){ heads.forEach(function(e){ e.classList.add('in'); }); }, 9000); // failsafe
  }

  /* ---------- intro sentence: split into words ---------- */
  var xpText = $('.xp-text'), words = [];
  if (xpText) {
    var parts = xpText.textContent.trim().split(/\s+/);
    xpText.setAttribute('aria-label', xpText.textContent.trim());
    xpText.textContent = '';
    parts.forEach(function(t, i){
      var s = document.createElement('span');
      s.className = 'w'; s.setAttribute('aria-hidden','true'); s.textContent = t; xpText.appendChild(s);
      if (i < parts.length - 1) xpText.appendChild(document.createTextNode(' '));
      words.push(s);
    });
  }

  /* ---------- scroll-driven pieces ---------- */
  var top = $('.top'), bar = $('.progress'), fab = $('.fab'), contact = $('#contact');
  var heroMedia = $('.hero-media'), heroCopy = $('.hero-copy');
  var kin = $('.kin'), r1 = $('.r1'), r2 = $('.r2');
  var xp = $('.xp'), xpPhoto = $('.xp-photo'), xpImg = xpPhoto && $('img', xpPhoto);
  var cards = $$('.stack .card');
  var hs = $('.hs'), rail = hs && $('.rail', hs), hsTotal = 0;
  var band = $('.band'), bandImg = band && $('img', band);
  var cred = $('.cred'), cPanels = cred ? $$('.panel', cred) : [], cTabs = cred ? $$('.tabs button', cred) : [], cSeg = 0;
  if (cred && reduced) cred.classList.add('static');
  cTabs.forEach(function(t, k){
    t.addEventListener('click', function(){
      var top0 = cred.getBoundingClientRect().top + window.scrollY;
      var rng = cred.offsetHeight - window.innerHeight;
      window.scrollTo({top: top0 + rng * (k / cPanels.length + 0.04) + 1, behavior: reduced ? 'auto' : 'smooth'});
    });
  });

  function sizeHS(){
    if (!hs || !rail) return;
    if (reduced) { hs.classList.add('no-pin'); hs.style.height = ''; return; }
    hsTotal = Math.max(0, rail.scrollWidth - window.innerWidth);
    hs.style.height = (hsTotal + window.innerHeight) + 'px';
  }

  var ticking = false;
  function update(){
    ticking = false;
    var y = window.scrollY, vw = window.innerWidth, vh = window.innerHeight;
    var max = root.scrollHeight - vh;
    if (bar) bar.style.transform = 'scaleX(' + (max > 0 ? y / max : 0) + ')';

    var heroH = hero ? hero.offsetHeight : vh;
    if (top) top.classList.toggle('over', y <= heroH - 60);

    // hero drifts and fades as you leave it
    if (!reduced && y < heroH) {
      if (heroCopy) { heroCopy.style.transform = 'translate3d(0,' + (y * -0.18) + 'px,0)'; heroCopy.style.opacity = String(clamp(1 - y / (heroH * .7), 0, 1)); }
      if (heroMedia) heroMedia.style.transform = 'translate3d(0,' + (y * 0.25) + 'px,0)';
    }

    // kinetic rows move in opposite directions
    if (kin && !reduced) {
      var kr = kin.getBoundingClientRect();
      if (kr.bottom > 0 && kr.top < vh) {
        var kp = clamp((vh - kr.top) / (vh + kr.height), 0, 1);
        if (r1) r1.style.transform = 'translate3d(' + (-kp * Math.max(0, r1.scrollWidth - vw * .8)) + 'px,0,0)';
        if (r2) r2.style.transform = 'translate3d(' + (-(1 - kp) * Math.max(0, r2.scrollWidth - vw)) + 'px,0,0)';
      }
    }

    // intro: framed photo grows to full screen, words light up
    if (xp && xpPhoto) {
      var xr = xp.getBoundingClientRect();
      var range = xp.offsetHeight - vh;
      var xpr = clamp(-xr.top / Math.max(1, range), 0, 1);
      var e = xpr < .5 ? 2 * xpr * xpr : 1 - Math.pow(-2 * xpr + 2, 2) / 2;
      var wide = vw > 820;
      var s0 = wide ? vw * .32 : vw * .12, s1 = wide ? Math.max(0, (vw - vh * .8) / 2) : 0;
      var t0 = vh * (wide ? .14 : .15), b0 = vh * (wide ? .30 : .36);
      var side = s0 + (s1 - s0) * e;
      if (!reduced) {
        xpPhoto.style.clipPath = 'inset(' + (t0 * (1 - e)) + 'px ' + side + 'px ' + (b0 * (1 - e)) + 'px ' + side + 'px)';
        if (xpImg) xpImg.style.transform = 'scale(' + (1.25 - .25 * e) + ')';
      } else xpPhoto.style.clipPath = 'none';
      xpPhoto.style.setProperty('--veil', String(clamp((xpr - .3) / .4, 0, 1)));
      if (words.length) {
        var n = reduced ? words.length : Math.round(clamp((xpr - .35) / .55, 0, 1) * words.length);
        words.forEach(function(w, i){ w.classList.toggle('on', i < n); });
      }
    }

    // education / certificates / awards: one screen each while pinned
    if (cred && !reduced && cPanels.length) {
      var crr = cred.getBoundingClientRect();
      var crng = cred.offsetHeight - vh;
      var cp0 = clamp(-crr.top / Math.max(1, crng), 0, 0.9999);
      var seg = Math.floor(cp0 * cPanels.length), local = cp0 * cPanels.length - seg;
      if (seg !== cSeg) {
        cPanels.forEach(function(pn, k){ pn.classList.toggle('on', k === seg); });
        cTabs.forEach(function(t, k){ t.setAttribute('aria-current', String(k === seg)); });
        cSeg = seg;
      }
      cTabs.forEach(function(t, k){ t.style.setProperty('--tp', k < seg ? '1' : k === seg ? local.toFixed(3) : '0'); });
      var gh = $('.ghost', cPanels[seg]);
      if (gh) gh.style.transform = 'translate(calc(-50% + ' + ((0.5 - local) * 18).toFixed(2) + 'vw),-50%)';
    }

    // stacked cards: the one being covered shrinks and dims
    if (!reduced) {
      for (var i = 0; i < cards.length; i++) {
        var c = cards[i], nx = cards[i + 1];
        if (!nx || nx.parentNode !== c.parentNode) { c.style.transform = ''; c.style.setProperty('--veil', '0'); continue; }
        var cr = c.getBoundingClientRect(), nr = nx.getBoundingClientRect();
        var cp = clamp(1 - (nr.top - cr.top) / Math.max(1, cr.height), 0, 1);
        c.style.transform = 'scale(' + (1 - cp * .06) + ')';
        c.style.setProperty('--veil', String(cp * .28));
      }
    }

    // photos: vertical scroll moves the rail sideways
    if (hs && rail && !reduced) {
      var hr = hs.getBoundingClientRect();
      if (hr.bottom > 0 && hr.top < vh) {
        var hp2 = clamp(-hr.top / Math.max(1, hr.height - vh), 0, 1);
        rail.style.transform = 'translate3d(' + (-hp2 * hsTotal) + 'px,0,0)';
      }
    }

    // band: slow parallax
    if (bandImg && !reduced) {
      var br = band.getBoundingClientRect();
      if (br.bottom > 0 && br.top < vh) {
        var bp = clamp((vh - br.top) / (vh + br.height), 0, 1);
        bandImg.style.transform = 'translate3d(0,' + ((0.5 - bp) * br.height * 0.22) + 'px,0)';
      }
    }

    // floating contact button: after the hero, hidden near the contact section
    if (fab) {
      var cTop = contact ? contact.getBoundingClientRect().top : 1e9;
      var inXp = false;
      if (xp) { var xr2 = xp.getBoundingClientRect(); inXp = xr2.top <= 0 && xr2.bottom >= vh; }
      fab.classList.toggle('show', y > heroH * .8 && cTop > vh * .9 && !inXp);
    }
  }
  function onScroll(){ if (!ticking){ ticking = true; requestAnimationFrame(update); } }
  addEventListener('scroll', onScroll, {passive:true});
  addEventListener('resize', function(){ sizeHS(); onScroll(); });
  addEventListener('load', function(){ sizeHS(); update(); });
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(function(){ sizeHS(); update(); });
  sizeHS(); update();

  /* ---------- instagram carousel (phones) ---------- */
  var reels = $('#reels'), items = reels ? $$('.reel', reels) : [], dots = $$('.dots button'), rp = $('.rp');
  var ri = 0, rPaused = reduced, rHold = 0, rVisible = false;
  function isCarousel(){ return reels && getComputedStyle(reels).overflowX === 'auto'; }
  function markDot(i){ dots.forEach(function(d, k){ d.setAttribute('aria-current', String(k === i)); }); }
  // scroll-snap fights smooth scrollTo in some browsers, so tween scrollLeft with snap switched off
  var tweening = false;
  function toReel(i, smooth){
    if (!isCarousel() || !items[i]) return;
    ri = i; markDot(i);
    var it = items[i], from = reels.scrollLeft;
    var to = Math.max(0, Math.min(it.offsetLeft - (reels.clientWidth - it.clientWidth) / 2, reels.scrollWidth - reels.clientWidth));
    if (!smooth || reduced) { reels.scrollLeft = to; return; }
    tweening = true; reels.style.scrollSnapType = 'none';
    var t0 = Date.now(), D = 520;
    var tw = setInterval(function(){ // time-based so it finishes even when frames are throttled
      var p = Math.min(1, (Date.now() - t0) / D), e = 1 - Math.pow(1 - p, 3);
      reels.scrollLeft = from + (to - from) * e;
      if (p >= 1) { clearInterval(tw); reels.style.scrollSnapType = ''; tweening = false; }
    }, 16);
  }
  if (reels && items.length) {
    markDot(0);
    var st;
    reels.addEventListener('scroll', function(){
      if (tweening) return;
      clearTimeout(st);
      st = setTimeout(function(){
        var mid = reels.scrollLeft + reels.clientWidth / 2, best = 0, bd = 1e9;
        items.forEach(function(it, k){ var d = Math.abs(it.offsetLeft + it.clientWidth / 2 - mid); if (d < bd){ bd = d; best = k; } });
        ri = best; markDot(best);
      }, 90);
    }, {passive:true});
    ['touchstart','pointerdown','wheel'].forEach(function(ev){ reels.addEventListener(ev, function(){ rHold = Date.now() + 7000; }, {passive:true}); });
    dots.forEach(function(d, k){ d.addEventListener('click', function(){ rHold = Date.now() + 7000; toReel(k, true); }); });
    if (rp) {
      if (reduced) rp.hidden = true;
      rp.addEventListener('click', function(){
        rPaused = !rPaused;
        rp.setAttribute('aria-pressed', String(rPaused));
        rp.setAttribute('aria-label', rPaused ? '카드 자동 넘김 다시 시작' : '카드 자동 넘김 멈춤');
      });
    }
    setInterval(function(){
      var rr = reels.getBoundingClientRect();
      rVisible = rr.top < innerHeight * .8 && rr.bottom > innerHeight * .2;
      if (rPaused || !rVisible || Date.now() < rHold || document.hidden || !isCarousel()) return;
      toReel((ri + 1) % items.length, true);
    }, 3500);
  }

  /* ---------- copy Kakao ID ---------- */
  var status = $('.copy-status');
  $$('[data-copy]').forEach(function(b){
    b.addEventListener('click', function(){
      var v = b.getAttribute('data-copy');
      function done(ok){
        if (status) status.textContent = ok
          ? '카카오톡 ID를 복사했습니다. 카카오톡 친구 추가에서 ID로 검색해 붙여 넣으세요.'
          : '복사가 안 되는 환경입니다. 카카오톡 ID: ' + v;
      }
      function legacy(){
        var t = document.createElement('textarea'); t.value = v; t.setAttribute('readonly',''); t.style.position = 'fixed'; t.style.top = '0'; t.style.opacity = '0';
        document.body.appendChild(t); t.select(); t.setSelectionRange(0, v.length);
        var ok = false; try { ok = document.execCommand('copy'); } catch(e){}
        t.remove(); return ok;
      }
      if (navigator.clipboard && window.isSecureContext) navigator.clipboard.writeText(v).then(function(){ done(true); }, function(){ done(legacy()); });
      else done(legacy());
    });
  });

  if (!fine) return;

  /* ---------- mouse only: follower dot + list preview ---------- */
  var cursor = $('.cursor'), peek = $('.peek');
  var mx = innerWidth / 2, my = innerHeight / 2, cx = mx, cy = my, px = mx, py = my, moved = false;
  addEventListener('pointermove', function(e){
    if (e.pointerType !== 'mouse') return;
    mx = e.clientX; my = e.clientY; moved = true;
    var el = e.target.closest ? e.target.closest('a, button, .rail img, .reel') : null;
    var big = !!(el && el.matches('.rail img, .reel'));
    cursor.classList.toggle('big', big);
    cursor.classList.toggle('mid', !!el && !big);
  });
  (function loop(){
    cx += (mx - cx) * .2; cy += (my - cy) * .2;
    px += (mx - px) * .14; py += (my - py) * .14;
    if (moved) {
      cursor.style.transform = 'translate3d(' + cx + 'px,' + cy + 'px,0)';
      peek.style.transform = 'translate3d(' + (px + 28) + 'px,' + (py - 130) + 'px,0)';
    }
    requestAnimationFrame(loop);
  })();
  $$('#stage .list li, #direction .list li').forEach(function(li, i){
    li.addEventListener('mouseenter', function(){ peek.src = PHOTOS[i % PHOTOS.length]; peek.classList.add('on'); });
    li.addEventListener('mouseleave', function(){ peek.classList.remove('on'); });
  });
})();
