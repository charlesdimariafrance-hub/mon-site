/**
 * Che, on danse ! – Carte des danses (module autonome, sans quiz)
 * Rendu et navigation repris de TradMap (creactiviste.fr) :
 *   Leaflet 1.9.4, tuiles OpenStreetMap, centre [46.5, 2.2], zoom 4.
 * Dépendance : Leaflet chargé avant ce fichier (window.L).
 *
 * Usage :
 *   CheOnDanseCarte.init({
 *     map: 'cod-map',              // id du div carte
 *     panel: 'cod-panel',          // id du panneau de détail (optionnel)
 *     search: 'cod-search',        // id du champ de recherche (optionnel)
 *     geojsonUrl: 'data/danses.geojson',
 *     cluster: true                // regroupe les lieux proches (nécessite Leaflet.markercluster)
 *   });
 *
 * Format GeoJSON attendu (identique à TradMap) :
 *   Feature Point, coordinates [lng, lat]
 *   properties.name        = nom du lieu
 *   properties.description = texte libre ; une ligne "danse:Nom" par danse ;
 *                            une ligne "Source : ..." optionnelle.
 */
(function (global) {
  'use strict';

  var DEFAULTS = {
    map: 'cod-map',
    panel: 'cod-panel',
    search: 'cod-search',
    geojsonUrl: 'data/danses.geojson',
    center: [46.5, 2.2],
    zoom: 4,
    focusZoom: 6,
    tileUrl: 'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
    referrerPolicy: 'strict-origin-when-cross-origin',
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">contributeurs OpenStreetMap</a>'
  };

  function esc(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  }

  function norm(s) {
    return String(s || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  }

  // Découpe la description : danses / source / texte
  function parseFeature(feat, idx) {
    var p = feat.properties || {};
    var g = feat.geometry || {};
    if (g.type !== 'Point' || !Array.isArray(g.coordinates)) return null;
    var dances = [], source = '', text = [];
    String(p.description || '').split('\n').forEach(function (line) {
      var t = line.trim();
      var m = t.match(/^danse\s*:\s*(.+)$/i);
      var s = t.match(/^source\s*:\s*(.+)$/i);
      if (m) dances.push(m[1].trim());
      else if (s) source = s[1].trim();
      else if (t) text.push(t);
    });
    if (!dances.length && p.danse) dances.push(String(p.danse));
    if (!dances.length) return null;
    return {
      id: idx,
      name: p.name || ('Lieu ' + (idx + 1)),
      country: p.country || '',
      lat: g.coordinates[1],
      lng: g.coordinates[0],
      dances: dances,
      text: text,
      source: source
    };
  }

  function icon(count, active) {
    return L.divIcon({
      html: '<div class="cod-marker' + (active ? ' is-active' : '') + '">' +
            (count > 1 ? '<span class="cod-marker-count">' + count + '</span>' : '') + '</div>',
      className: '',
      iconSize: [16, 16],
      iconAnchor: [8, 8],
      popupAnchor: [0, -8]
    });
  }

  function init(userOpts) {
    var o = Object.assign({}, DEFAULTS);
    Object.keys(userOpts || {}).forEach(function (k) { if (userOpts[k] !== undefined) o[k] = userOpts[k]; });
    var mapEl = document.getElementById(o.map);
    if (!mapEl || !global.L) { console.error('Carte : conteneur ou Leaflet absent'); return; }
    var panel = o.panel ? document.getElementById(o.panel) : null;
    var search = o.search ? document.getElementById(o.search) : null;

    var map = L.map(mapEl).setView(o.center, o.zoom);
    // referrerPolicy : OpenStreetMap refuse les tuiles demandées sans en-tête Referer
    L.tileLayer(o.tileUrl, { attribution: o.attribution, maxZoom: 19, referrerPolicy: o.referrerPolicy }).addTo(map);

    var places = [], markers = {}, activeId = null;
    // Regroupement des lieux proches (Leaflet.markercluster si chargé, sinon couche simple)
    var useCluster = o.cluster !== false && typeof L.markerClusterGroup === 'function';
    var layer = useCluster ? L.markerClusterGroup({
      maxClusterRadius: 34,
      disableClusteringAtZoom: 7,
      spiderfyOnMaxZoom: true,
      showCoverageOnHover: false,
      iconCreateFunction: function (c) {
        return L.divIcon({ html: '<div class="cod-cluster">' + c.getChildCount() + '</div>', className: '', iconSize: [36, 36] });
      }
    }) : L.layerGroup();
    layer.addTo(map);

    function renderIntro() {
      if (!panel) return;
      var total = places.reduce(function (n, p) { return n + p.dances.length; }, 0);
      panel.innerHTML =
        '<p class="cod-kicker">Explorar</p>' +
        '<h2 class="cod-panel-title">Tocá un lugar</h2>' +
        '<p class="cod-muted">' + places.length + ' lugares, ' + total +
        ' danzas. Cada punto abre la ficha de las danzas de su región.</p>' +
        '<ul class="cod-index">' +
        places.slice().sort(function (a, b) { return a.dances[0].localeCompare(b.dances[0], 'fr'); })
          .map(function (p) {
            return p.dances.map(function (d) {
              return '<li><button type="button" data-id="' + p.id + '">' + esc(d) +
                     '<span>' + esc(p.name) + '</span></button></li>';
            }).join('');
          }).join('') +
        '</ul>';
    }

    function renderPlace(p) {
      var html =
        '<button type="button" class="cod-back" data-back="1">\u2190 Todas las danzas</button>' +
        '<p class="cod-kicker">' + esc(p.country || 'Lugar') + '</p>' +
        '<h2 class="cod-panel-title">' + esc(p.name) + '</h2>' +
        '<p class="cod-label">' + (p.dances.length > 1 ? 'Danzas' : 'Danza') + '</p>' +
        '<ul class="cod-dances">' + p.dances.map(function (d) { return '<li>' + esc(d) + '</li>'; }).join('') + '</ul>' +
        (p.text.length ? '<div class="cod-story"><p class="cod-label">Historia</p>' +
          p.text.map(function (t) { return '<p>' + esc(t) + '</p>'; }).join('') + '</div>' : '') +
        (p.source ? '<p class="cod-source">Fuente: ' + esc(p.source) + '</p>' : '');
      if (panel) { panel.innerHTML = html; panel.scrollTop = 0; }
      return html;
    }

    function select(id, fly) {
      var p = places[id];
      if (!p) return;
      if (activeId !== null && markers[activeId]) markers[activeId].setIcon(icon(places[activeId].dances.length, false));
      activeId = id;
      markers[id].setIcon(icon(p.dances.length, true));
      if (fly) map.flyTo([p.lat, p.lng], Math.max(map.getZoom(), useCluster ? 7 : o.focusZoom), { duration: 0.6 });
      if (panel) {
        renderPlace(p);
        // Sur mobile, le panneau est sous la carte : on le fait apparaître
        if (window.matchMedia('(max-width: 760px)').matches) panel.scrollIntoView({ behavior: 'smooth', block: 'start' });
      } else {
        markers[id].bindPopup(renderPlace(p), { maxWidth: 320 }).openPopup();
      }
    }

    function clearSelection() {
      if (activeId !== null && markers[activeId]) markers[activeId].setIcon(icon(places[activeId].dances.length, false));
      activeId = null;
      renderIntro();
      applyFilter();
    }

    function applyFilter() {
      var q = search ? norm(search.value.trim()) : '';
      places.forEach(function (p) {
        var hit = !q || norm(p.name).indexOf(q) > -1 || p.dances.some(function (d) { return norm(d).indexOf(q) > -1; });
        var m = markers[p.id];
        if (hit && !layer.hasLayer(m)) layer.addLayer(m);
        if (!hit && layer.hasLayer(m)) layer.removeLayer(m);
      });
      if (panel && activeId === null) {
        panel.querySelectorAll('.cod-index li').forEach(function (li) {
          var b = li.querySelector('button');
          li.hidden = q && norm(b.textContent).indexOf(q) === -1;
        });
      }
    }

    if (panel) {
      panel.addEventListener('click', function (e) {
        var b = e.target.closest('button');
        if (!b) return;
        if (b.dataset.back) return clearSelection();
        if (b.dataset.id != null) select(parseInt(b.dataset.id, 10), true);
      });
    }
    if (search) search.addEventListener('input', applyFilter);

    if (panel) panel.innerHTML = '<p class="cod-muted">Cargando las danzas\u2026</p>';

    fetch(o.geojsonUrl)
      .then(function (r) { if (!r.ok) throw new Error('HTTP ' + r.status); return r.json(); })
      .then(function (geo) {
        (geo.features || []).forEach(function (f, i) {
          var p = parseFeature(f, i);
          if (p) { p.id = places.length; places.push(p); }
        });
        places.forEach(function (p) {
          var m = L.marker([p.lat, p.lng], { icon: icon(p.dances.length, false), title: p.name + ' – ' + p.dances.join(', '), keyboard: true });
          m.on('click', function () { select(p.id, false); });
          layer.addLayer(m);
          markers[p.id] = m;
        });
        renderIntro();
      })
      .catch(function (err) {
        console.error(err);
        if (panel) panel.innerHTML = '<p class="cod-error">No se pudieron cargar las danzas (' + esc(err.message) + ').</p>';
      });

    return { map: map, select: select, places: places };
  }

  global.CheOnDanseCarte = { init: init };
})(window);
