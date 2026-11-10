(function(){
  var root = document.documentElement;
  var reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  var fine = matchMedia('(pointer: fine)').matches && !reduced;
  var PHOTOS = ['images/photo1.jpg','images/stage2.jpg','images/photo2.jpg','images/stage1.jpg','images/photo3.jpg','images/hero_bw.jpg','images/photo4.jpg'];

  /* ---------- entrance ---------- */
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

  /* ---------- reveals: photos open once, headings rise ---------- */
  document.querySelectorAll('.block .head h2, .rail-head h2, .contact h2').forEach(function(h){
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
  var targets = document.querySelectorAll('.rv, .rvh');
  function show(el){ if (root.classList.contains('ready')) el.classList.add('in'); else pending.push(el); }
  if (reduced || !('IntersectionObserver' in window)) {
    targets.forEach(function(e){ e.classList.add('in'); });
  } else {
    var io = new IntersectionObserver(function(es){
      es.forEach(function(e){ if (e.isIntersecting){ show(e.target); io.unobserve(e.target); } });
    }, {threshold:.15});
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

  var bar = document.querySelector('.progress');
  var heroImg = document.querySelector('.hero-photo img');
  var ticking = false;
  function update(){
    ticking = false;
    var y = window.scrollY, vh = window.innerHeight;
    var max = document.documentElement.scrollHeight - vh;
    if (bar) bar.style.transform = 'scaleX(' + (max > 0 ? y / max : 0) + ')';
    if (heroImg && !reduced && y < vh * 1.5) heroImg.style.transform = 'translateY(' + (y * 0.06) + 'px) scale(1.1)';
    if (p && words.length) {
      if (reduced) { words.forEach(function(w){ w.classList.add('on'); }); return; }
      var r = p.getBoundingClientRect();
      var prog = (vh * 0.85 - r.top) / (vh * 0.3 + r.height);
      var n = Math.round(Math.max(0, Math.min(1, prog)) * words.length);
      words.forEach(function(w, i){ w.classList.toggle('on', i < n); });
    }
  }
  function onScroll(){ if (!ticking){ ticking = true; requestAnimationFrame(update); } }
  addEventListener('scroll', onScroll, {passive:true});
  addEventListener('resize', onScroll);
  update();

  /* ---------- drag the photo rail ---------- */
  var rail = document.querySelector('.rail');
  if (rail) {
    var down = false, sx = 0, sl = 0;
    rail.addEventListener('pointerdown', function(e){
      if (e.pointerType !== 'mouse') return;
      down = true; sx = e.clientX; sl = rail.scrollLeft; rail.classList.add('drag');
    });
    addEventListener('pointerup', function(){ down = false; rail.classList.remove('drag'); });
    addEventListener('pointermove', function(e){ if (down) rail.scrollLeft = sl - (e.clientX - sx); });
    rail.addEventListener('dragstart', function(e){ e.preventDefault(); });
  }

  if (!fine) return;

  /* ---------- follower dot + list preview (mouse only) ---------- */
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

  /* ---------- hero: photo trail + tilt ---------- */
  var hero = document.querySelector('.hero'), trail = document.querySelector('.trail');
  var lx = -999, ly = -999, k = 0;
  hero.addEventListener('pointermove', function(e){
    if (e.pointerType !== 'mouse') return;
    var r = hero.getBoundingClientRect(), x = e.clientX - r.left, y = e.clientY - r.top;
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
  var hp = document.querySelector('.hero-photo');
  if (hp) {
    hp.addEventListener('pointermove', function(e){
      if (e.pointerType !== 'mouse') return;
      var r = hp.getBoundingClientRect(), nx = (e.clientX - r.left) / r.width - .5, ny = (e.clientY - r.top) / r.height - .5;
      hp.style.transform = 'perspective(900px) rotateX(' + (-ny * 7).toFixed(2) + 'deg) rotateY(' + (nx * 7).toFixed(2) + 'deg)';
    });
    hp.addEventListener('pointerleave', function(){ hp.style.transform = ''; });
  }
})();
