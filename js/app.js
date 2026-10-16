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

  var D = window.DANCES, CATS = window.CATEGORIES, REGS = window.REGIONS, MAP = window.FRANCE_MAP;
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

  /* Mapa interactivo de Francia */
  var svg = document.getElementById("franceMap"), panel = document.getElementById("regionPanel");
  var NS = "http://www.w3.org/2000/svg";
  svg.setAttribute("viewBox", MAP.viewBox);
  var shapes = {}, labels = {};
  MAP.regions.forEach(function (r) {
    var has = !!REGS[r.id];
    var p = document.createElementNS(NS, "path");
    p.setAttribute("d", r.d);
    p.setAttribute("class", "region" + (has ? " region--has" : ""));
    if (has) {
      p.setAttribute("tabindex", "0");
      p.setAttribute("role", "button");
      p.setAttribute("aria-label", REGS[r.id].name);
      p.addEventListener("click", function () { showRegion(r.id); });
      p.addEventListener("keydown", function (e) { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); showRegion(r.id); } });
    }
    var t = document.createElementNS(NS, "title"); t.textContent = has ? REGS[r.id].name : r.name; p.appendChild(t);
    svg.appendChild(p);
    shapes[r.id] = p;
  });
  // Etiquetas centradas en cada región con danzas
  Object.keys(REGS).forEach(function (id) {
    if (!shapes[id]) return;
    var b = shapes[id].getBBox();
    var tx = document.createElementNS(NS, "text");
    tx.setAttribute("x", b.x + b.width / 2);
    tx.setAttribute("y", b.y + b.height / 2 + 5);
    tx.setAttribute("text-anchor", "middle");
    tx.setAttribute("class", "region-label");
    tx.textContent = REGS[id].name.split(" ·")[0];
    svg.appendChild(tx);
    labels[id] = tx;
  });

  var listHTML = function (items) {
    return '<ul class="atlas__list">' + items.map(function (d) {
      return '<li><button type="button" data-n="' + esc(d.n) + '"><span>' + esc(d.n) + '</span><span class="cat">' + esc(CATS[d.cat].name) + "</span></button></li>";
    }).join("") + "</ul>";
  };
  var bindList = function () {
    panel.querySelectorAll(".atlas__list button").forEach(function (b) {
      b.addEventListener("click", function () {
        var d = D.filter(function (x) { return x.n === b.dataset.n; })[0];
        if (d) openDance(d);
      });
    });
  };
  var chipsHTML = function (current) {
    var ids = Object.keys(REGS).filter(function (k) { return k !== current; });
    return '<div class="chips">' + ids.map(function (k) { return '<button class="chip" type="button" data-r="' + k + '">' + esc(REGS[k].name) + "</button>"; }).join("") +
      (current !== "all" ? '<button class="chip" type="button" data-r="all">Toda Francia</button>' : "") + "</div>";
  };
  var bindChips = function () {
    panel.querySelectorAll(".chip").forEach(function (c) { c.addEventListener("click", function () { showRegion(c.dataset.r); }); });
  };
  var showRegion = function (id) {
    Object.keys(shapes).forEach(function (k) { shapes[k].classList.toggle("region--active", k === id); });
    Object.keys(labels).forEach(function (k) { labels[k].classList.toggle("region-label--active", k === id); });
    var items, title, note;
    if (id === "all") {
      items = D.filter(function (d) { return !d.reg; });
      title = "Toda Francia";
      note = "Valses, mazurkas, scottishes, branles y mixers: el repertorio común de todos los bals folk.";
    } else {
      items = D.filter(function (d) { return d.reg === id; });
      title = REGS[id].name; note = REGS[id].note;
    }
    panel.innerHTML = "<h3>" + esc(title) + '</h3><p class="note">' + esc(note) + " " + items.length + " danzas.</p>" + listHTML(items) + chipsHTML(id);
    bindList(); bindChips();
  };
  panel.innerHTML = '<h3>Elegí una región</h3><p class="note">Las regiones en celeste tienen danzas en nuestro repertorio. También podés empezar por aquí:</p>' + chipsHTML("none");
  bindChips();
})();
