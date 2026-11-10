(function(){
  var root = document.documentElement;
  var reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  var fine = matchMedia('(pointer: fine)').matches && !reduced;
  var PHOTOS = ['images/photo1.jpg','images/stage2.jpg','images/photo2.jpg','images/stage1.jpg','images/photo3.jpg','images/hero_bw.jpg','images/photo4.jpg'];
  function clamp(v, a, b){ return Math.max(a, Math.min(b, v)); }

  /* ---------- entrance: count up, curtain lifts ---------- */
  var pending = [];
  function ready(){
    if (root.classList.contains('ready')) return;
    root.classList.add('ready');
    pending.forEach(function(e){ e.classList.add('in'); });
    pending = [];
  }
  var loader = document.querySelector('.loader');
  var seen = false;
  try { seen = sessionStorage.getItem('ds_seen') === '1'; } catch(e){}
  if (!loader || reduced || seen) {
    if (loader) loader.remove();
    ready();
  } else {
    var cnt = loader.querySelector('.count'), t0 = Date.now(), DUR = 1300;
    var iv = setInterval(function(){
      var p = Math.min(1, (Date.now() - t0) / DUR);
      cnt.textContent = Math.round(p * 100);
      if (p >= 1) {
        clearInterval(iv);
        loader.classList.add('done');
        try { sessionStorage.setItem('ds_seen','1'); } catch(e){}
        setTimeout(function(){ ready(); loader.remove(); }, 650);
      }
    }, 40);
    setTimeout(function(){ ready(); if (loader.parentNode) loader.remove(); }, 4500); // failsafe
  }

  /* ---------- headings rise letter by letter ---------- */
  document.querySelectorAll('.sec-head h2, .block .head h2, .rail-head h2, .contact h2').forEach(function(h){
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
  var targets = document.querySelectorAll('.rvh');
  function show(el){ if (root.classList.contains('ready')) el.classList.add('in'); else pending.push(el); }
  if (reduced || !('IntersectionObserver' in window)) {
    targets.forEach(function(e){ e.classList.add('in'); });
  } else {
    var io = new IntersectionObserver(function(es){
      es.forEach(function(e){ if (e.isIntersecting){ show(e.target); io.unobserve(e.target); } });
    }, {threshold:.2});
    targets.forEach(function(e){ io.observe(e); });
    setTimeout(function(){ targets.forEach(function(e){ e.classList.add('in'); }); }, 9000); // failsafe
  }

  /* ---------- intro sentence lights up word by word ---------- */
  var p = document.querySelector('.statement p');
  var words = [];
  if (p) {
    var parts = p.textContent.trim().split(/\s+/);
    p.textContent = '';
    parts.forEach(function(t, i){
      var s = document.createElement('span');
      s.className = 'w'; s.textContent = t; p.appendChild(s);
      if (i < parts.length - 1) p.appendChild(document.createTextNode(' '));
      words.push(s);
    });
  }

  /* ---------- scroll-driven pieces ---------- */
  var top = document.querySelector('.top');
  var bar = document.querySelector('.progress');
  var hero = document.querySelector('.hero2');
  var hp = document.querySelector('.h2-photo');
  var him = hp && hp.querySelector('img');
  var hint = document.querySelector('.scrollhint');
  var hs = document.querySelector('.hs');
  var rail = hs && hs.querySelector('.rail');
  var band = document.querySelector('.band');
  var bandImg = band && band.querySelector('img');
  var hsTotal = 0;

  function sizeHS(){
    if (!hs || !rail) return;
    if (reduced) { hs.classList.add('no-pin'); return; }
    hsTotal = Math.max(0, rail.scrollWidth - window.innerWidth);
    hs.style.height = (hsTotal + window.innerHeight) + 'px';
  }

  var ticking = false;
  function update(){
    ticking = false;
    var y = window.scrollY, vw = window.innerWidth, vh = window.innerHeight;
    var max = document.documentElement.scrollHeight - vh;
    if (bar) bar.style.transform = 'scaleX(' + (max > 0 ? y / max : 0) + ')';

    // hero: framed photo grows to full screen
    if (hero && hp) {
      var range = hero.offsetHeight - vh;
      var pr = clamp(y / range, 0, 1);
      var e = pr < .5 ? 2 * pr * pr : 1 - Math.pow(-2 * pr + 2, 2) / 2;
      var wide = vw > 820;
      var s0 = wide ? vw * .30 : vw * .12;
      var s1 = wide ? Math.max(0, (vw - vh * .8) / 2) : 0;
      var side = s0 + (s1 - s0) * e;
      hp.style.clipPath = 'inset(' + (vh * .13 * (1 - e)) + 'px ' + side + 'px ' + (vh * .24 * (1 - e)) + 'px ' + side + 'px)';
      if (him) him.style.transform = 'scale(' + (1.2 - .2 * e) + ')';
      if (hint) hint.style.opacity = String(clamp(1 - pr * 5, 0, 1));
      if (top) top.classList.toggle('solid', y > range - 40);
    }

    // intro sentence
    if (p && words.length) {
      if (reduced) { words.forEach(function(w){ w.classList.add('on'); }); }
      else {
        var r = p.getBoundingClientRect();
        var prog = (vh * 0.85 - r.top) / (vh * 0.3 + r.height);
        var n = Math.round(clamp(prog, 0, 1) * words.length);
        words.forEach(function(w, i){ w.classList.toggle('on', i < n); });
      }
    }

    // photos: vertical scroll moves the rail sideways
    if (hs && rail && !reduced) {
      var hr = hs.getBoundingClientRect();
      var hp2 = clamp(-hr.top / Math.max(1, hr.height - vh), 0, 1);
      rail.style.transform = 'translate3d(' + (-hp2 * hsTotal) + 'px,0,0)';
    }

    // band: slow parallax
    if (bandImg && !reduced) {
      var br = band.getBoundingClientRect();
      var bp = clamp((vh - br.top) / (vh + br.height), 0, 1);
      bandImg.style.transform = 'translate3d(0,' + ((0.5 - bp) * br.height * 0.2) + 'px,0)';
    }
  }
  function onScroll(){ if (!ticking){ ticking = true; requestAnimationFrame(update); } }
  addEventListener('scroll', onScroll, {passive:true});
  addEventListener('resize', function(){ sizeHS(); onScroll(); });
  addEventListener('load', function(){ sizeHS(); update(); });
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(function(){ sizeHS(); update(); });
  sizeHS(); update();

  if (!fine) return;

  /* ---------- mouse only: follower dot + list preview + photo trail ---------- */
  var cur = document.querySelector('.cursor'), peek = document.querySelector('.peek');
  var mx = innerWidth / 2, my = innerHeight / 2, cx = mx, cy = my, px = mx, py = my, moved = false;
  addEventListener('pointermove', function(e){
    if (e.pointerType !== 'mouse') return;
    mx = e.clientX; my = e.clientY; moved = true;
    var el = e.target.closest ? e.target.closest('a, button, .rail img, .reel') : null;
    cur.classList.toggle('big', !!(el && el.matches('.rail img, .reel')));
    cur.classList.toggle('mid', !!(el && !el.matches('.rail img, .reel')));
  });
  (function loop(){
    cx += (mx - cx) * .2; cy += (my - cy) * .2;
    px += (mx - px) * .14; py += (my - py) * .14;
    if (moved) {
      cur.style.transform = 'translate3d(' + cx + 'px,' + cy + 'px,0)';
      peek.style.transform = 'translate3d(' + (px + 28) + 'px,' + (py - 130) + 'px,0)';
    }
    requestAnimationFrame(loop);
  })();
  document.querySelectorAll('#stage .list li, #direction .list li').forEach(function(li, i){
    li.addEventListener('mouseenter', function(){ peek.src = PHOTOS[i % PHOTOS.length]; peek.classList.add('on'); });
    li.addEventListener('mouseleave', function(){ peek.classList.remove('on'); });
  });

  var stick = document.querySelector('.h2-stick'), trail = document.querySelector('.trail');
  var lx = -999, ly = -999, k = 0;
  if (stick && trail) stick.addEventListener('pointermove', function(e){
    if (e.pointerType !== 'mouse') return;
    var r = stick.getBoundingClientRect(), x = e.clientX - r.left, y = e.clientY - r.top;
    if (Math.hypot(x - lx, y - ly) < 110) return;
    lx = x; ly = y;
    var im = document.createElement('img');
    im.className = 'tr'; im.alt = ''; im.src = PHOTOS[k++ % PHOTOS.length];
    im.style.left = x + 'px'; im.style.top = y + 'px';
    im.style.setProperty('--r', (Math.random() * 16 - 8).toFixed(1) + 'deg');
    trail.appendChild(im);
    requestAnimationFrame(function(){ im.classList.add('on'); });
    setTimeout(function(){ im.classList.remove('on'); }, 750);
    setTimeout(function(){ im.remove(); }, 1400);
    while (trail.children.length > 9) trail.firstChild.remove();
  });
})();
