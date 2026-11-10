(function(){
  var reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;

  // photos open once when first seen
  var rv = document.querySelectorAll('.rv');
  if (reduced || !('IntersectionObserver' in window)) {
    rv.forEach(function(e){ e.classList.add('in'); });
  } else {
    var io = new IntersectionObserver(function(es){
      es.forEach(function(e){ if (e.isIntersecting){ e.target.classList.add('in'); io.unobserve(e.target); } });
    }, {threshold:.15});
    rv.forEach(function(e){ io.observe(e); });
    setTimeout(function(){ rv.forEach(function(e){ e.classList.add('in'); }); }, 6000); // failsafe
  }

  // intro sentence: split into words
  var p = document.querySelector('.statement p');
  var words = [];
  if (p) {
    var parts = p.textContent.trim().split(/\s+/);
    p.textContent = '';
    parts.forEach(function(t, i){
      var s = document.createElement('span');
      s.className = 'w'; s.textContent = t;
      p.appendChild(s);
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

  // drag the photo rail with a mouse
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
})();
