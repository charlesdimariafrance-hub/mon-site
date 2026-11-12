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
    document.querySelectorAll(".split__media.rot, .tile.rot").forEach(function (box, k) {
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
      {"dia": "13", "mes": "Nov", "sem": "Viernes", "corto": "La Paz Arriba", "titulo": "Propuesta de danzas francesas y swing", "hora": "19:00", "lugar": "La Paz Arriba, Av. Callao 1082, 1.er piso, Recoleta", "estado": "incierto", "nota": "Participación muy incierta.", "links": [["Ver en Google Maps", "https://www.google.com/maps/search/?api=1&query=La+Paz+Arriba%2C+Av.+Callao+1082%2C+Recoleta%2C+Buenos+Aires"]]},
      {"dia": "14", "mes": "Nov", "sem": "Sábado", "corto": "Clase regular · 14:30", "titulo": "Clase regular de danzas francesas", "hora": "14:30", "lugar": "Lycée Jean-Mermoz, Ramsay 2131, Núñez", "estado": "incierto", "nota": "Su realización dependerá del horario de la actividad en La Paternal.", "links": [["Ver en Google Maps", "https://www.google.com/maps/search/?api=1&query=Ramsay+2131%2C+N%C3%BA%C3%B1ez%2C+Buenos+Aires"]]},
      {"dia": "14", "mes": "Nov", "sem": "Sábado", "corto": "Escuela en La Paternal", "titulo": "Intervención en una escuela primaria", "hora": "Posiblemente a las 16:00 (por confirmar)", "lugar": "Escuela primaria, Caracas 2372, La Paternal", "estado": "incierto", "links": [["Ver en Google Maps", "https://www.google.com/maps/search/?api=1&query=Caracas+2372%2C+La+Paternal%2C+Buenos+Aires"]]},
      {"dia": "14", "mes": "Nov", "sem": "Sábado", "corto": "Evropski večer", "titulo": "XVI Evropski večer (Noche Europea) del Slovenski Dom Carapachay", "hora": "20:00", "lugar": "Slovenski Dom Carapachay, Cecilia Grierson 3867, Carapachay (Vicente López)", "estado": "incierto", "nota": "Presentación de Che, on danse! con grupos folclóricos europeos y Albert Daisen, y cena compartida. Si llueve, se pasa al sábado 12 de diciembre. Confirmar asistencia.", "links": [["Ver en Google Maps", "https://www.google.com/maps/search/?api=1&query=Cecilia+Grierson+3867%2C+Carapachay%2C+Buenos+Aires"]]},
      {"dia": "14", "mes": "Nov", "sem": "Sábado", "corto": "Noche de los Museos", "titulo": "La Noche de los Museos", "hora": "Por definir", "lugar": "Vicente López (posible)", "estado": "incierto", "nota": "La opción de Parque Patricios quedó descartada. Esperamos respuesta sobre una posible actividad posterior en Vicente López.", "links": [["Dossier del grupo (PDF)", "docs/dossier-che-on-danse.pdf"]]},
      {"dia": "15", "mes": "Nov", "sem": "Domingo", "corto": "Rosario", "titulo": "Viaje a Rosario — Feria de las Colectividades", "hora": "Todo el día", "lugar": "Rosario", "estado": "seguro", "nota": "Viaje con Charles, Géraldine y Trixie para conocer la feria y explorar proyectos futuros. Sin presentación programada.", "links": [["Ver en Google Maps", "https://www.google.com/maps/search/?api=1&query=Feria+de+las+Colectividades%2C+Rosario"]]},
      {"dia": "20", "mes": "Nov", "sem": "Viernes", "corto": "Noche con Isabel", "titulo": "Noche con Isabel", "hora": "Por definir", "lugar": "San Telmo o Villa Crespo (por definir)", "estado": "incierto"},
      {"dia": "21", "mes": "Nov", "sem": "Sábado", "corto": "Asado en lo de Laura", "titulo": "Asado en casa de Laura", "hora": "19:00 a 24:00", "lugar": "Vicente López", "estado": "seguro", "nota": "Encuentro privado para los participantes habituales de Che, on danse!"},
      {"dia": "22", "mes": "Nov", "sem": "Domingo", "corto": "Le Grand Bal", "titulo": "Proyecto «Le Grand Bal»: danzas francesas, circulares y griegas", "hora": "17:00", "lugar": "San Telmo", "estado": "incierto", "nota": "Con Che, on danse!, Trixie Danse y Nico Danse. Proyecto todavía por organizar y confirmar.", "links": [["Fotos del Grand Bal de l’Europe (Gennetines)", "gennetines.html"], ["Ver el tráiler de «Le Grand Bal»", "https://www.youtube.com/watch?v=BDH4AlHehls"]]},
      {"dia": "6", "mes": "Dic", "sem": "Domingo", "corto": "Brunch & Bal", "titulo": "Brunch & Bal", "hora": "10:00 a 14:00", "lugar": "Área Mística, Nueva York 4677, Villa Devoto", "estado": "seguro", "nota": "Entrada $25.000. Menú: pomelo, granola con yogur y frutas, tostada con huevo, café, té o chocolatada. Sorteo: 2 clases de francés y 1 clase de danza francesa.", "links": [["Ver en Google Maps", "https://www.google.com/maps/search/?api=1&query=Nueva+York+4677%2C+Villa+Devoto%2C+Buenos+Aires"], ["Reservar mi lugar", "#brunch"]]},
      {"dia": "13", "mes": "Dic", "sem": "Domingo", "corto": "Noche blanca del Forum", "titulo": "Noche blanca de fin de año del Forum, en «La Passerie»", "hora": "19:00–20:00 aprox.", "lugar": "Por confirmar", "estado": "incierto", "nota": "Nombre, dirección y participación por confirmar."},
      {"dia": "19", "mes": "Dic", "sem": "Sábado", "corto": "Charles viaja a Francia", "titulo": "Charles viaja a Francia · vacaciones", "hora": "—", "lugar": "—", "estado": "seguro", "nota": "No habrá clases regulares desde el 19 de diciembre de 2026 hasta el 8 de febrero de 2027."}
    ];
    var EST = { seguro: "Confirmado", incierto: "Por confirmar" }, MES = { Oct: "Octubre", Nov: "Noviembre", Dic: "Diciembre" };
    var nCols = function () { return window.innerWidth < 700 ? 2 : 4; }, cur = -1;
    var showDm = function (i, el) {
      var e = EV[i]; cur = i;
      damero.querySelectorAll(".casilla.is-on").forEach(function (c) { c.classList.remove("is-on"); });
      el.classList.add("is-on");
      var col = Array.prototype.indexOf.call(damero.children, el) % nCols();
      dmPop.className = "dm__pop " + e.estado + " " + (col < nCols() / 2 ? "right" : "left");
      dmPop.innerHTML = '<button type="button" class="dm__x" aria-label="Cerrar">✕</button><span class="est">' + EST[e.estado] + '</span><div class="fecha">' + esc(e.dia) + " " + MES[e.mes] + "<small>" + esc(e.sem) + "</small></div><h3>" + esc(e.titulo) + "</h3><dl><dt>Hora</dt><dd>" + esc(e.hora) + "</dd><dt>Lugar</dt><dd>" + esc(e.lugar) + "</dd></dl>" + (e.nota ? '<p class="nota">' + esc(e.nota) + "</p>" : "") + (e.links ? e.links.map(function (l) { return '<p class="nota"><a href="' + esc(l[1]) + '"' + (/^http/.test(l[1]) ? ' target="_blank" rel="noopener"' : "") + ">" + esc(l[0]) + " →</a></p>"; }).join("") : "");
      dmPop.hidden = false;
      dmPop.querySelector(".dm__x").onclick = function (ev) { ev.stopPropagation(); hide(); };
    };
    var pinned = false, hovT = null;
    var hide = function () { pinned = false; dmPop.classList.remove("pinned"); dmPop.hidden = true; cur = -1; damero.querySelectorAll(".casilla.is-on").forEach(function (c) { c.classList.remove("is-on"); }); };
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
            el.addEventListener("mouseenter", function () { clearTimeout(hovT); if (pinned) return; if (dmPop.hidden) showDm(i, el); else hovT = setTimeout(function () { if (!pinned) showDm(i, el); }, 450); });
            el.addEventListener("mouseleave", function () { clearTimeout(hovT); });
            el.addEventListener("focus", function () { showDm(i, el); });
            el.addEventListener("click", function (ev) { ev.stopPropagation(); pinned = true; showDm(i, el); dmPop.classList.add("pinned"); });
          })(i, el);
        } else { el.className = "casilla vacia " + color; el.innerHTML = "<span>On danse!</span>"; }
        damero.appendChild(el);
      }
    };
    var wrapDm = damero.parentNode;
    wrapDm.addEventListener("mouseleave", function () { if (!pinned && window.matchMedia("(hover: hover)").matches) hide(); });
    dmPop.addEventListener("mouseenter", function () { clearTimeout(hovT); pinned = true; dmPop.classList.add("pinned"); });
    document.addEventListener("click", function (ev) { if (!wrapDm.contains(ev.target)) hide(); });
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
