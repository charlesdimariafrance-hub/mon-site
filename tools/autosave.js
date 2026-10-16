/* Che, on danse!: guardado automático del editor en este navegador (IndexedDB). */
(function () {
  var PUBLISHED = window.CHE_PUBLISHED || null; // 'coreo.json' en el sitio, null en Netlify
  var DB = 'che-coreo', ST = 'kv', db = null, last = '', audioSaved = {};
  function open() { return new Promise(function (ok, ko) { var r = indexedDB.open(DB, 1); r.onupgradeneeded = function () { r.result.createObjectStore(ST); }; r.onsuccess = function () { ok(r.result); }; r.onerror = function () { ko(r.error); }; }); }
  function put(k, v) { return new Promise(function (ok) { var t = db.transaction(ST, 'readwrite'); t.objectStore(ST).put(v, k); t.oncomplete = ok; t.onerror = ok; }); }
  function get(k) { return new Promise(function (ok) { var t = db.transaction(ST).objectStore(ST).get(k); t.onsuccess = function () { ok(t.result); }; t.onerror = function () { ok(null); }; }); }
  function clear() { return new Promise(function (ok) { var t = db.transaction(ST, 'readwrite'); t.objectStore(ST).clear(); t.oncomplete = ok; }); }
  var bar = document.createElement('div');
  bar.style.cssText = 'position:fixed;left:12px;bottom:12px;z-index:99999;background:#18233A;color:#fff;font:13px/1.3 system-ui,sans-serif;padding:8px 12px;border-radius:6px;display:flex;gap:10px;align-items:center;box-shadow:0 4px 14px rgba(0,0,0,.25)';
  var msg = document.createElement('span'); msg.textContent = 'Sauvegarde automatique…';
  var btn = document.createElement('button');
  btn.textContent = PUBLISHED ? 'Revenir à la version publiée' : 'Effacer la sauvegarde';
  btn.style.cssText = 'background:#fff;color:#18233A;border:0;border-radius:4px;padding:4px 8px;font:inherit;cursor:pointer';
  btn.onclick = function () { if (confirm(PUBLISHED ? 'Oublier vos modifications et recharger la version publiée ?' : 'Effacer la sauvegarde de ce navigateur ?')) clear().then(function () { location.reload(); }); };
  bar.appendChild(msg); bar.appendChild(btn);
  function hhmm() { var d = new Date(); return ('0' + d.getHours()).slice(-2) + ':' + ('0' + d.getMinutes()).slice(-2); }
  async function save() {
    try {
      var o = exportObject();
      for (var idx in (figureAudioURLs || {})) {
        var u = figureAudioURLs[idx];
        if (u && /^(blob:|data:)/.test(u) && audioSaved[idx] !== u) { var b = await (await fetch(u)).blob(); await put('audio-' + idx, b); audioSaved[idx] = u; }
        if (u && !/^(blob:|data:|https?:)/i.test(u)) { o.mediaRefs = o.mediaRefs || { audio: {}, videos: {} }; o.mediaRefs.audio = o.mediaRefs.audio || {}; o.mediaRefs.audio[idx] = u; }
        if (u && /^(blob:|data:)/.test(u)) { o.mediaRefs = o.mediaRefs || { audio: {}, videos: {} }; o.mediaRefs.audio = o.mediaRefs.audio || {}; o.mediaRefs.audio[idx] = 'idb:audio-' + idx; }
      }
      var s = JSON.stringify(o);
      if (s !== last) { await put('state', s); last = s; msg.textContent = 'Sauvegardé dans ce navigateur · ' + hhmm(); }
    } catch (e) { msg.textContent = 'Sauvegarde impossible : ' + e.message; }
  }
  async function start() {
    document.body.appendChild(bar);
    try { db = await open(); } catch (e) { msg.textContent = 'Sauvegarde indisponible dans ce navigateur'; return; }
    var s = await get('state'), data = null;
    if (s) {
      data = JSON.parse(s);
      var refs = (data.mediaRefs && data.mediaRefs.audio) || {};
      for (var k in refs) if (/^idb:/.test(refs[k])) { var b = await get(refs[k].slice(4)); if (b) { refs[k] = URL.createObjectURL(b); audioSaved[k] = refs[k]; } else delete refs[k]; }
      msg.textContent = 'Votre dernière version a été restaurée';
    } else if (PUBLISHED) {
      try { data = await (await fetch(PUBLISHED, { cache: 'no-cache' })).json(); } catch (e) { data = null; }
      msg.textContent = 'Version publiée · vos changements seront gardés ici';
    } else { msg.textContent = 'Sauvegarde automatique activée'; }
    if (data && data.figures && data.figures.length) { restoreExportData(data); last = JSON.stringify(exportObject()); }
    setInterval(save, 8000);
    document.addEventListener('visibilitychange', function () { if (document.visibilityState === 'hidden') save(); });
    window.addEventListener('pagehide', save);
  }
  window.addEventListener('load', function () { setTimeout(start, 300); });
})();
