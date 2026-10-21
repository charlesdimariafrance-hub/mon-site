/* Hero "película": fotos, instrumentos y diagramas cinéticos animados que se encadenan. */
(function () {
  "use strict";
  var film = document.getElementById('film');
  if (!film) return;
  var slides = [].slice.call(film.querySelectorAll('.film__slide'));
  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var COLOR = { '1': '#4f9be8', '2': '#f6a31a', '3': '#3cbf86', '4': '#a979ff', '5': '#ef6b7c', '6': '#2ec4d3' };
  var DATA = null, idx = 0, HOLD = 5200;

  /* ---------- diagramas ---------- */
  function Diagram(slide) {
    this.slide = slide; this.cv = slide.querySelector('canvas'); this.ctx = this.cv.getContext('2d');
    this.fig = +slide.getAttribute('data-fig'); this.t = 0; this.trail = [];
  }
  Diagram.prototype.size = function () {
    var r = window.devicePixelRatio || 1, w = this.cv.clientWidth, h = this.cv.clientHeight;
    if (this.cv.width !== Math.round(w * r)) { this.cv.width = Math.round(w * r); this.cv.height = Math.round(h * r); }
    this.ctx.setTransform(r, 0, 0, r, 0, 0); return [w, h];
  };
  Diagram.prototype.draw = function (dt) {
    if (!DATA) return;
    var f = null; DATA.figs.forEach(function (x) { if (x.id === this.fig) f = x; }, this);
    if (!f) return;
    var wh = this.size(), w = wh[0], h = wh[1], c = this.ctx, mob = w < 760;
    var S = mob ? Math.min(w * .66, h * .32) : Math.min(h * .5, w * .3);
    var X = mob ? (w - S) / 2 : w - S - Math.max(24, w * .06), Y = mob ? h * .1 : Math.max(58, h * .1);
    var cap = this.slide.querySelector('.film__cap');
    if (cap) { if (mob) { cap.style.top = Math.max(16, Y - 30) + 'px'; cap.style.right = ''; } else { cap.style.top = Math.max(12, Y - 30) + 'px'; cap.style.right = Math.max(24, w * .06) + 'px'; } }
    this.t = (this.t + dt * 1.6) % (f.frames.length / DATA.fps);
    var fr = f.frames[Math.floor(this.t * DATA.fps) % f.frames.length];
    this.trail.push(fr); if (this.trail.length > 26) this.trail.shift();
    c.clearRect(0, 0, w, h);
    // tablero
    c.save(); c.strokeStyle = 'rgba(216,183,122,.45)'; c.lineWidth = 1.2;
    c.beginPath(); c.roundRect ? c.roundRect(X, Y, S, S, 14) : c.rect(X, Y, S, S); c.stroke();
    c.strokeStyle = 'rgba(216,183,122,.12)'; c.lineWidth = 1;
    for (var g = 1; g < 4; g++) { c.beginPath(); c.moveTo(X + S * g / 4, Y + 8); c.lineTo(X + S * g / 4, Y + S - 8); c.moveTo(X + 8, Y + S * g / 4); c.lineTo(X + S - 8, Y + S * g / 4); c.stroke(); }
    c.restore();
    var P = function (p) { return [X + S * (.06 + .88 * p[0] / 100), Y + S * (.06 + .88 * p[1] / 100)]; };
    var ids = DATA.dancers, tr = this.trail, r = Math.max(5, S * .026);
    // estelas
    ids.forEach(function (id, k) {
      c.strokeStyle = COLOR[id.charAt(0)]; c.lineWidth = Math.max(1.5, r * .35); c.lineCap = 'round';
      for (var i = 1; i < tr.length; i++) {
        var a = P(tr[i - 1][k]), b = P(tr[i][k]); c.globalAlpha = .55 * i / tr.length;
        c.beginPath(); c.moveTo(a[0], a[1]); c.lineTo(b[0], b[1]); c.stroke();
      }
    });
    c.globalAlpha = 1;
    // bailarines: lleno = hombre, hueco = mujer, nariz = hacia dónde mira
    ids.forEach(function (id, k) {
      var p = fr[k], q = P(p), col = COLOR[id.charAt(0)], man = id.slice(-1) === 'H', a = p[2] * Math.PI / 180;
      c.beginPath(); c.arc(q[0], q[1], r, 0, Math.PI * 2);
      if (man) { c.fillStyle = col; c.fill(); } else { c.fillStyle = 'rgba(13,20,36,.9)'; c.fill(); c.lineWidth = r * .38; c.strokeStyle = col; c.stroke(); }
      c.beginPath(); c.moveTo(q[0] + Math.sin(a) * r * .6, q[1] - Math.cos(a) * r * .6); c.lineTo(q[0] + Math.sin(a) * r * 1.65, q[1] - Math.cos(a) * r * 1.65);
      c.lineWidth = Math.max(2, r * .32); c.strokeStyle = col; c.stroke();
    });
  };
  var diagrams = slides.filter(function (s) { return s.classList.contains('film__slide--diag'); }).map(function (s) { return new Diagram(s); });

  /* ---------- encadenado ---------- */
  function show(i) {
    slides.forEach(function (s, k) {
      var on = k === i; s.classList.toggle('on', on);
      var v = s.querySelector('video');
      if (v) { if (on) { try { v.currentTime = 0; v.play().catch(function () {}); } catch (e) {} } else v.pause(); }
      if (on) { var im = s.querySelector('img,video'); if (im) { im.style.animation = 'none'; void im.offsetWidth; im.style.animation = ''; } }
    });
  }
  show(0);
  if (reduce) return;
  setInterval(function () { idx = (idx + 1) % slides.length; show(idx); }, HOLD);

  var last = null;
  function loop(ts) {
    var dt = last == null ? 0 : Math.min(.1, (ts - last) / 1000); last = ts;
    diagrams.forEach(function (d) { if (d.slide.classList.contains('on') || d.slide.classList.contains('was')) d.draw(dt); else d.draw(0); });
    requestAnimationFrame(loop);
  }
  fetch('img/film-diagramas.json').then(function (r) { return r.json(); }).then(function (d) { DATA = d; }).catch(function () {});
  requestAnimationFrame(loop);
})();
