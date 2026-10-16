(function () {
  "use strict";

  /* Videos de la portada: se alternan cada 5 segundos (id de YouTube y segundo de inicio) */
  var HERO_VIDEOS = [
    { id: "_xuatd1_CVQ", start: 0, img: "hqdefault" },   // bal en el Berry
    { id: "6uVbDwjf-AI", start: 60, img: "hq1" },        // parejas al aire libre, Le Son Continu 2022
    { id: "I2II5rx77Xg", start: 393, img: "hq2" },       // danza en grupo al sol, Le Son Continu 2025
    { id: "bihxTG0Pyhk", start: 40, img: "hq1" }         // jóvenes y no tan jóvenes, Le Son Continu 2018
  ];
  var HERO_SECONDS = 5;

  var D = window.DANCES, CATS = window.CATEGORIES, REGS = window.REGIONS;
  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var thumb = function (id) { return "https://i.ytimg.com/vi/" + id + "/hqdefault.jpg"; };
  var el = function (tag, attrs, html) {
    var n = document.createElement(tag);
    if (attrs) Object.keys(attrs).forEach(function (k) { n.setAttribute(k, attrs[k]); });
    if (html != null) n.innerHTML = html;
    return n;
  };
  var esc = function (s) { return String(s).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }); };

  /* Menú móvil */
  var menuBtn = document.querySelector(".menu-btn"), nav = document.getElementById("nav");
  menuBtn.addEventListener("click", function () {
    var open = nav.classList.toggle("is-open");
    menuBtn.setAttribute("aria-expanded", open);
  });
  nav.addEventListener("click", function (e) {
    if (e.target.tagName === "A") { nav.classList.remove("is-open"); menuBtn.setAttribute("aria-expanded", "false"); }
  });

  /* Hero: imágenes que se alternan; en pantallas grandes, videos que se alternan */
  var heroMedia = document.getElementById("heroMedia"), heroToggle = document.getElementById("heroToggle");
  var layers = HERO_VIDEOS.map(function (v, i) {
    var layer = el("div", { class: "hero__layer" + (i === 0 ? " is-on" : "") });
    layer.appendChild(el("img", { src: "https://i.ytimg.com/vi/" + v.id + "/" + v.img + ".jpg", alt: "" }));
    heroMedia.appendChild(layer);
    return layer;
  });
  var current = 0, playing = true, timer = null, frames = [];
  var show = function (i) {
    layers[current].classList.remove("is-on");
    current = i;
    layers[current].classList.add("is-on");
  };
  var start = function () {
    if (!reduceMotion) timer = setInterval(function () { show((current + 1) % layers.length); }, HERO_SECONDS * 1000);
  };
  start();
  var send = function (f, func) {
    try { f.contentWindow.postMessage(JSON.stringify({ event: "command", func: func, args: [] }), "*"); } catch (e) {}
  };
  var saveData = navigator.connection && navigator.connection.saveData;
  if (!reduceMotion && !saveData && window.innerWidth >= 900) {
    window.addEventListener("load", function () {
      setTimeout(function () {
        HERO_VIDEOS.forEach(function (v, i) {
          var src = "https://www.youtube-nocookie.com/embed/" + v.id +
            "?autoplay=1&mute=1&controls=0&loop=1&playlist=" + v.id + "&start=" + v.start +
            "&playsinline=1&rel=0&disablekb=1&modestbranding=1&iv_load_policy=3&enablejsapi=1";
          var f = el("iframe", { src: src, title: "Video de baile", allow: "autoplay; encrypted-media", tabindex: "-1", "aria-hidden": "true" });
          layers[i].appendChild(f);
          frames.push(f);
        });
      }, 600);
    });
  }
  heroToggle.hidden = reduceMotion;
  heroToggle.addEventListener("click", function () {
    playing = !playing;
    if (playing) { start(); frames.forEach(function (f) { send(f, "playVideo"); }); }
    else { clearInterval(timer); frames.forEach(function (f) { send(f, "pauseVideo"); }); }
    heroToggle.textContent = playing ? "Pausar video" : "Reproducir video";
  });

  /* Cargar formularios y mapa del lugar solo cuando se acercan a la pantalla */
  var lazyFrames = document.querySelectorAll("iframe[data-map-src]");
  var loadFrame = function (f) { f.src = f.getAttribute("data-map-src"); };
  if ("IntersectionObserver" in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) { if (en.isIntersecting) { loadFrame(en.target); io.unobserve(en.target); } });
    }, { rootMargin: "400px" });
    lazyFrames.forEach(function (f) { io.observe(f); });
  } else { lazyFrames.forEach(loadFrame); }
  /* Ventana de video */
  var modal = document.getElementById("modal"), player = document.getElementById("modalPlayer"),
      mTitle = document.getElementById("modalTitle"), mLists = document.getElementById("modalLists");
  var playVideo = function (id) {
    player.innerHTML = "";
    player.appendChild(el("iframe", {
      src: "https://www.youtube-nocookie.com/embed/" + id + "?autoplay=1&rel=0&modestbranding=1&playsinline=1",
      title: "Video", allow: "autoplay; encrypted-media; fullscreen", allowfullscreen: ""
    }));
    mLists.querySelectorAll(".vbtn").forEach(function (b) { b.setAttribute("aria-current", b.dataset.id === id ? "true" : "false"); });
  };
  window.cheOpenDance = function (n) { var d = D.filter(function (x) { return x.n === n; })[0]; if (d) openDance(d); };
  var openDance = function (d) {
    mTitle.textContent = d.n;
    mLists.innerHTML = "";
    var group = function (label, ids, prefix) {
      if (!ids.length) return;
      var box = el("div"); box.appendChild(el("h4", null, label));
      ids.forEach(function (id, i) {
        var b = el("button", { class: "vbtn", "data-id": id, type: "button" }, prefix + (ids.length > 1 ? " " + (i + 1) : ""));
        b.addEventListener("click", function () { playVideo(id); });
        box.appendChild(b);
      });
      mLists.appendChild(box);
    };
    group("Tutorial", d.t, "Ver tutorial");
    group("Música", d.m, "Escuchar música");
    if (d.s.length) {
      var box = el("div"); box.appendChild(el("h4", null, "Partituras"));
      d.s.forEach(function (id, i) {
        box.appendChild(el("a", { href: "https://drive.google.com/file/d/" + id + "/view", target: "_blank", rel: "noopener" },
          "Abrir partitura" + (d.s.length > 1 ? " " + (i + 1) : "")));
      });
      mLists.appendChild(box);
    }
    playVideo(d.t[0] || d.m[0]);
    if (typeof modal.showModal === "function") modal.showModal(); else modal.setAttribute("open", "");
  };
  var closeModal = function () { player.innerHTML = ""; if (modal.open) modal.close(); };
  document.getElementById("modalClose").addEventListener("click", closeModal);
  modal.addEventListener("close", function () { player.innerHTML = ""; });
  modal.addEventListener("click", function (e) { if (e.target === modal) closeModal(); });

  /* Fichas de danzas con filtro */
  var filtersBox = document.getElementById("filters"), cardsBox = document.getElementById("cards");
  var regionName = function (d) { return d.reg ? REGS[d.reg].name : "Toda Francia"; };
  var renderCards = function (cat) {
    cardsBox.innerHTML = "";
    D.filter(function (d) { return cat === "all" || d.cat === cat; }).forEach(function (d) {
      var b = el("button", { class: "card", type: "button" },
        '<span class="card__img"><img src="' + thumb(d.t[0] || d.m[0]) + '" alt="" loading="lazy"><span class="card__play">Ver video</span></span>' +
        '<span class="card__name">' + esc(d.n) + '</span>' +
        '<span class="card__meta">' + esc(CATS[d.cat].name) + ", " + esc(regionName(d)) + "</span>");
      b.addEventListener("click", function () { openDance(d); });
      cardsBox.appendChild(b);
    });
  };
  var tabs = [["all", "Todas", D.length]].concat(Object.keys(CATS).map(function (k) {
    return [k, CATS[k].name, D.filter(function (d) { return d.cat === k; }).length];
  }));
  tabs.forEach(function (t, i) {
    var b = el("button", { class: "filter", role: "tab", type: "button", "aria-selected": i === 0 ? "true" : "false" },
      esc(t[1]) + " <small>" + t[2] + "</small>");
    b.addEventListener("click", function () {
      filtersBox.querySelectorAll(".filter").forEach(function (x) { x.setAttribute("aria-selected", "false"); });
      b.setAttribute("aria-selected", "true");
      renderCards(t[0]);
    });
    filtersBox.appendChild(b);
  });
  renderCards("all");

  /* Rotación de fotos (cada 5 s); un video se muestra entero, sin sonido */
  if (!(window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches)) {
    document.querySelectorAll(".split__media.rot").forEach(function (box, k) {
      var items = box.querySelectorAll("img, video"); if (items.length < 2) return;
      var i = 0, timer = null;
      var schedule = function () {
        clearTimeout(timer);
        var el = items[i];
        if (el.tagName === "VIDEO") {
          el.currentTime = 0; el.onended = function () { show(i + 1); };
          var p = el.play(); if (p && p.catch) p.catch(function () { timer = setTimeout(function () { show(i + 1); }, 5000); });
        } else timer = setTimeout(function () { show(i + 1); }, 5000);
      };
      var show = function (n) {
        items[i].classList.remove("is-on"); i = n % items.length;
        if (items[i].loading === "lazy") items[i].loading = "eager";
        items[i].classList.add("is-on"); schedule();
      };
      var started = false, start = function () { if (!started) { started = true; setTimeout(schedule, k * 1200); } };
      if ("IntersectionObserver" in window) new IntersectionObserver(function (en, ob) { if (en[0].isIntersecting) { start(); ob.disconnect(); } }, { threshold: .3 }).observe(box);
      else start();
    });
  }
  /* Agenda en damero: ventana grande al pasar el mouse o tocar */
  var damero = document.getElementById("damero"), dmPop = document.getElementById("dmPop");
  if (damero && dmPop) {
    var EV = [
      { dia: "25", mes: "Oct", sem: "Domingo", corto: "Brunch & Bal", titulo: "Brunch & Bal — Presentación", hora: "10:00 a 14:00", lugar: "Área Mística, Nueva York 4677, Villa Devoto", estado: "seguro" },
      { dia: "1", mes: "Nov", sem: "Domingo", corto: "Feria de las Naciones", titulo: "Feria de las Naciones — Stand y espectáculo de 15 min", hora: "Desde las 12:00", lugar: "Villa Adelina · Alianza Francesa de Martínez", estado: "seguro" },
      { dia: "7–9", mes: "Nov", sem: "Sábado a lunes", corto: "Feria de las Colectividades", titulo: "Feria de las Colectividades", hora: "Por definir", lugar: "Rosario", estado: "incierto", nota: "Muy incierto." },
      { dia: "12", mes: "Nov", sem: "Jueves", corto: "Llega Isabelle", titulo: "Llegada de Isabelle, acordeonista", hora: "Por definir", lugar: "Buenos Aires", estado: "seguro" },
      { dia: "13", mes: "Nov", sem: "Viernes", corto: "Vinos y Quesos", titulo: "Noche de Vinos y Quesos", hora: "Desde las 18:00", lugar: "Liceo Jean Mermoz, Ramsay 2131", estado: "seguro" },
      { dia: "14", mes: "Nov", sem: "Sábado", corto: "Show para niños", titulo: "Espectáculo para niños", hora: "Por la tarde", lugar: "Escuela de Géraldine", estado: "incierto" },
      { dia: "14", mes: "Nov", sem: "Sábado", corto: "Comunidad eslovena", titulo: "Encuentro con la comunidad eslovena", hora: "Desde las 20:00", lugar: "Vicente López", estado: "seguro", nota: "Invitación recibida." },
      { dia: "14", mes: "Nov", sem: "Sábado", corto: "Noche de los Museos", titulo: "La Noche de los Museos", hora: "Por la noche", lugar: "Museo por definir", estado: "incierto", nota: "Hipotético." },
      { dia: "15", mes: "Nov", sem: "Domingo", corto: "Música con Isabelle", titulo: "Encuentro musical con Isabelle", hora: "Por definir", lugar: "Lugar por definir", estado: "incierto", nota: "Posible." },
      { dia: "4–6", mes: "Dic", sem: "Viernes a domingo", corto: "Viaje a Pigüé", titulo: "Viaje y presentaciones en Pigüé", hora: "Salida el viernes por la noche", lugar: "Pigüé", estado: "incierto" }
    ];
    var EST = { seguro: "Confirmado", incierto: "Por confirmar" }, MES = { Oct: "Octubre", Nov: "Noviembre", Dic: "Diciembre" };
    var nCols = function () { return window.innerWidth < 700 ? 2 : 4; }, cur = -1;
    var show = function (i, el) {
      var e = EV[i]; cur = i;
      damero.querySelectorAll(".casilla.is-on").forEach(function (c) { c.classList.remove("is-on"); });
      el.classList.add("is-on");
      var col = Array.prototype.indexOf.call(damero.children, el) % nCols();
      dmPop.className = "dm__pop " + e.estado + " " + (col < nCols() / 2 ? "right" : "left");
      dmPop.innerHTML = '<span class="est">' + EST[e.estado] + '</span><div class="fecha">' + esc(e.dia) + " " + MES[e.mes] + "<small>" + esc(e.sem) + "</small></div><h3>" + esc(e.titulo) + "</h3><dl><dt>Hora</dt><dd>" + esc(e.hora) + "</dd><dt>Lugar</dt><dd>" + esc(e.lugar) + "</dd></dl>" + (e.nota ? '<p class="nota">' + esc(e.nota) + "</p>" : "");
      dmPop.hidden = false;
    };
    var hide = function () { dmPop.hidden = true; cur = -1; damero.querySelectorAll(".casilla.is-on").forEach(function (c) { c.classList.remove("is-on"); }); };
    var paint = function () {
      var c = nCols(); damero.style.setProperty("--cols", c); damero.innerHTML = "";
      var total = Math.ceil(EV.length / c) * c;
      for (var i = 0; i < total; i++) {
        var color = (Math.floor(i / c) + i % c) % 2 === 0 ? "n" : "b", e = EV[i];
        var el = document.createElement(e ? "button" : "div");
        if (e) {
          el.type = "button";
          el.className = "casilla " + color + " " + e.estado;
          el.setAttribute("aria-label", e.dia + " de " + MES[e.mes] + ": " + e.titulo + ". " + EST[e.estado] + ". Hora: " + e.hora + ". Lugar: " + e.lugar);
          el.innerHTML = '<span class="punto"></span><div><div class="mes">' + e.mes + '</div><div class="dia">' + esc(e.dia) + '</div><div class="dsem">' + esc(e.sem) + '</div></div><div class="titulo">' + esc(e.corto) + "</div>";
          (function (i, el) {
            el.addEventListener("mouseenter", function () { show(i, el); });
            el.addEventListener("focus", function () { show(i, el); });
            el.addEventListener("click", function (ev) { ev.stopPropagation(); show(i, el); });
          })(i, el);
        } else { el.className = "casilla vacia " + color; el.innerHTML = "<span>On danse!</span>"; }
        damero.appendChild(el);
      }
    };
    damero.addEventListener("mouseleave", function () { if (window.matchMedia("(hover: hover)").matches) hide(); });
    document.addEventListener("click", function (ev) { if (!damero.contains(ev.target)) hide(); });
    document.addEventListener("keydown", function (ev) { if (ev.key === "Escape") hide(); });
    var lastC = 0; var re = function () { if (nCols() !== lastC) { lastC = nCols(); paint(); hide(); } };
    window.addEventListener("resize", re); re();
  }
  /* Copiar en un clic */
  document.querySelectorAll(".copybtn").forEach(function (b) {
    b.addEventListener("click", function () {
      var t = b.dataset.copy, done = function () { b.textContent = "¡Copiado!"; b.classList.add("is-ok"); setTimeout(function () { b.textContent = "Copiar"; b.classList.remove("is-ok"); }, 2000); };
      if (navigator.clipboard) navigator.clipboard.writeText(t).then(done, function () { prompt("Copiá el enlace:", t); });
      else prompt("Copiá el enlace:", t);
    });
  });
})();
