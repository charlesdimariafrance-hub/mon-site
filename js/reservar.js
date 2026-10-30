/* Reservar: formulario propio de la sección #reservar.
   Los datos van a Supabase (ver supabase/). El sitio nunca lee DNI ni contactos:
   solo llama a las funciones buscar_personas, inscribir y reservar. */
(function () {
  "use strict";

  var SUPABASE_URL = "https://bizuvwzgtmoosadxouqk.supabase.co";
  var API_KEY = "sb_publishable_jksOvhfLGclbESfh1GSmLg_SupXXqXH";
  var WHATSAPP = "https://wa.me/5491127723816";
  var ALIAS_CLASES = "CHEONDANSE", ALIAS_BRUNCH = "LEPETITBAL";
  var HORA_CIERRE = 13;   // el sábado, después de esta hora se reserva por WhatsApp
  var SEMANAS = 8;        // cantidad de sábados / domingos en la lista

  var root = document.getElementById("elegir");
  if (!root) return;

  var DIAS = ["domingo", "lunes", "martes", "miércoles", "jueves", "viernes", "sábado"];
  var MESES = ["enero", "febrero", "marzo", "abril", "mayo", "junio", "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"];
  var esc = function (s) { return String(s).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }); };

  /* Fechas: siempre en hora de Buenos Aires, sea cual sea el huso del teléfono */
  var ahoraBA = function () {
    var p = {};
    new Intl.DateTimeFormat("en-CA", { timeZone: "America/Argentina/Buenos_Aires", year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", hourCycle: "h23" })
      .formatToParts(new Date()).forEach(function (x) { p[x.type] = x.value; });
    return { iso: p.year + "-" + p.month + "-" + p.day, hora: +p.hour };
  };
  var aFecha = function (iso) { var d = iso.split("-"); return new Date(Date.UTC(+d[0], d[1] - 1, +d[2])); };
  var aIso = function (d) { return d.toISOString().slice(0, 10); };
  var legible = function (iso) { var d = aFecha(iso); return DIAS[d.getUTCDay()] + " " + d.getUTCDate() + " de " + MESES[d.getUTCMonth()]; };
  var proximos = function (diaSemana) {
    var d = aFecha(ahoraBA().iso), out = [];
    while (d.getUTCDay() !== diaSemana) d.setUTCDate(d.getUTCDate() + 1);
    for (var i = 0; i < SEMANAS; i++) { out.push(aIso(d)); d.setUTCDate(d.getUTCDate() + 7); }
    return out;
  };
  var cerradoHoy = function (iso) { var a = ahoraBA(); return iso === a.iso && a.hora >= HORA_CIERRE; };

  /* Supabase */
  var rpc = function (fn, args) {
    return fetch(SUPABASE_URL + "/rest/v1/rpc/" + fn, {
      method: "POST",
      headers: { "Content-Type": "application/json", apikey: API_KEY },
      body: JSON.stringify(args)
    }).then(function (r) {
      return r.json().catch(function () { return null; }).then(function (data) {
        if (!r.ok) throw new Error((data && data.message) || "No pudimos guardar tu reserva. Probá de nuevo.");
        return data;
      });
    });
  };

  /* Piezas de los formularios */
  var campo = function (id, label, attrs, full) {
    return '<div' + (full ? ' class="rsv-full"' : "") + '><label for="' + id + '">' + label + '</label><input id="' + id + '" ' + attrs + "></div>";
  };
  var datosCompletos = function (p) {
    return campo(p + "-nombre", "Nombre", 'name="nombre" autocomplete="given-name" required') +
      campo(p + "-apellido", "Apellido", 'name="apellido" autocomplete="family-name" required') +
      campo(p + "-dni", 'DNI <span class="rsv-hint">· para el seguro</span>', 'name="dni" inputmode="numeric" placeholder="30123456" required') +
      campo(p + "-nac", 'Fecha de nacimiento <span class="rsv-hint">· dd/mm/aaaa</span>', 'name="nacimiento" inputmode="numeric" placeholder="25/03/1990" maxlength="10" required') +
      campo(p + "-contacto", "WhatsApp o email", 'name="contacto" autocomplete="email" placeholder="11 2345 6789 o nombre@mail.com" required', true);
  };
  var datosBrunch = function (p) {
    return campo(p + "-nombre", "Nombre", 'name="nombre" autocomplete="given-name" required') +
      campo(p + "-apellido", "Apellido", 'name="apellido" autocomplete="family-name" required') +
      campo(p + "-contacto", "WhatsApp o email", 'name="contacto" placeholder="11 2345 6789 o nombre@mail.com" required', true);
  };
  var cantidad = function (p) {
    var o = ""; for (var i = 1; i <= 10; i++) o += "<option>" + i + "</option>";
    return '<div><label for="' + p + '-cant">Cantidad de personas</label><select id="' + p + '-cant" name="cantidad">' + o + "</select></div>";
  };
  var buscador = function (p, sinResultado) {
    return '<div class="rsv-full"><label for="' + p + '-q">Tu nombre</label>' +
      '<input id="' + p + '-q" data-buscar placeholder="Empezá a escribir tu nombre…" autocomplete="off">' +
      '<ul class="rsv-results" hidden data-sin="' + esc(sinResultado) + '"></ul></div>';
  };
  var nivel = function (p, principiantes, intermedios) {
    return '<div class="rsv-full"><label for="' + p + '-nivel">Nivel</label><select id="' + p + '-nivel" name="nivel" required>' +
      '<option value="">Elegí tu nivel</option><option value="principiantes">Principiantes · ' + principiantes + '</option>' +
      '<option value="intermedios">Intermedios · ' + intermedios + '</option></select></div>';
  };
  var sabados = function (p) {
    var a = ahoraBA(), lista = proximos(6), elegido = lista.filter(function (s) { return !cerradoHoy(s); })[0];
    return '<div class="rsv-full"><label for="' + p + '-fecha">Sábado</label><select id="' + p + '-fecha" name="fecha" data-sabado>' +
      lista.map(function (s) {
        return '<option value="' + s + '"' + (s === elegido ? " selected" : "") + ">" + legible(s) + (cerradoHoy(s) ? " (hoy: WhatsApp)" : s === a.iso ? " (hoy)" : "") + "</option>";
      }).join("") + "</select></div>";
  };
  var domingos = function (p) {
    return '<div class="rsv-full"><label for="' + p + '-fecha">Domingo <span class="rsv-hint">· fecha a confirmar, elegí la que te gustaría</span></label><select id="' + p + '-fecha" name="fecha">' +
      proximos(0).map(function (s) { return '<option value="' + s + '">' + legible(s) + "</option>"; }).join("") + "</select></div>";
  };
  var alias = function (a, texto) {
    return '<div class="rsv-pay"><p>' + texto + '</p><div class="rsv-alias"><code>' + a + '</code><button type="button" data-copiar="' + a + '">Copiar alias</button>' +
      "<small>Pegalo en tu app bancaria (Mercado Pago, home banking…) en «Transferir a alias».</small></div></div>";
  };
  var modos = function (a, b) {
    return '<div class="rsv-seg" role="group"><button type="button" aria-pressed="true" data-modo="nuevo">' + a + '</button><button type="button" aria-pressed="false" data-modo="ya">' + b + "</button></div>";
  };
  var final = function (boton) {
    return '<div class="rsv-wa" data-wa hidden>Ya cerramos la lista de hoy para el seguro. Para venir hoy, avisanos por WhatsApp:<br><a href="' + WHATSAPP + '" target="_blank" rel="noopener">Escribir por WhatsApp</a></div>' +
      '<input class="rsv-trap" name="web" tabindex="-1" autocomplete="off" aria-hidden="true">' +
      '<div class="rsv-actions"><button class="btn btn--red" type="submit">' + boton + '</button></div><p class="rsv-error" role="alert" hidden></p>';
  };
  var privacidad = '<p class="rsv-privacy">Tu DNI, tu fecha de nacimiento y tu contacto solo se usan para el seguro del Liceo y para avisarte si hay cambios. No se muestran en el sitio.</p>';
  var liceo = 'Liceo Franco Argentino Jean Mermoz · Ramsay 2131, Núñez · <a href="https://www.google.com/maps/search/?api=1&amp;query=Ramsay+2131%2C+Nu%C3%B1ez%2C+CABA" target="_blank" rel="noopener">Cómo llegar</a>';
  var noEncontrado = "No te encontramos. Si nunca nos diste tu DNI, usá «Primera clase gratis» (una sola vez).";

  var PANELES = {
    prueba: function () {
      return "<h3>Primera clase gratis</h3><p class=\"rsv-where\">Sábado 14:30 (principiantes) o 16:00 (intermedios) · " + liceo + "</p>" +
        '<form novalidate data-tipo="prueba"><div class="rsv-fields">' + datosCompletos("p") + nivel("p", "14:30", "16:00") + sabados("p") + "</div>" + final("Reservar mi clase gratis") + "</form>" + privacidad;
    },
    clase: function () {
      return "<h3>Reservar mi clase</h3><p class=\"rsv-where\">Sábado · Principiantes 14:30 a 16:00 · Intermedios 14:30 a 18:00 · " + liceo + "</p>" +
        '<form novalidate data-tipo="clase"><div class="rsv-fields">' + buscador("c", noEncontrado) + nivel("c", "14:30 a 16:00", "14:30 a 18:00") + sabados("c") + "</div>" + final("Reservar") + "</form>" +
        alias(ALIAS_CLASES, "Podés pagar la clase por transferencia:");
    },
    brunch: function () {
      return "<h3>Brunch &amp; Bal</h3><p class=\"rsv-where\">Domingo 10:00 a 14:00 · fecha a confirmar · Área Mística · Nueva York 4677, Villa Devoto</p>" +
        '<form novalidate data-tipo="brunch">' + modos("Es mi primera vez", "Ya tienen mis datos") +
        '<div class="rsv-fields" data-si="nuevo">' + datosBrunch("b") + "</div>" +
        '<div class="rsv-fields" data-si="ya" hidden>' + buscador("b", "No te encontramos. Elegí «Es mi primera vez».") + "</div>" +
        '<div class="rsv-fields">' + domingos("b") + cantidad("b") + "</div>" + final("Reservar mi lugar") + "</form>" +
        alias(ALIAS_BRUNCH, "Para el Brunch &amp; Bal, transferí a este alias (es distinto del de las clases):");
    },
    session: function () {
      return "<h3>SessionTradBA</h3><p class=\"rsv-where\">Sábado 14:30 a 18:00 · " + liceo + "</p>" +
        '<form novalidate data-tipo="session">' + modos("Es mi primera session", "Ya tienen mis datos") +
        '<div class="rsv-fields" data-si="nuevo">' + datosCompletos("s") + "</div>" +
        '<div class="rsv-fields" data-si="ya" hidden>' + buscador("s", noEncontrado.replace("«Primera clase gratis»", "«Es mi primera session»")) + "</div>" +
        '<div class="rsv-fields">' + sabados("s") + "</div>" + final("Reservar mi lugar") + "</form>" +
        alias(ALIAS_CLASES, "Podés pagar por transferencia:") + privacidad;
    }
  };

  /* dd/mm/aaaa → aaaa-mm-dd (o null si no es una fecha) */
  var leerNacimiento = function (v) {
    var m = String(v).trim().match(/^(\d{1,2})[\/.\- ](\d{1,2})[\/.\- ](\d{4})$/);
    if (!m) return null;
    var iso = m[3] + "-" + ("0" + m[2]).slice(-2) + "-" + ("0" + m[1]).slice(-2), d = aFecha(iso);
    return d.getUTCDate() === +m[1] && d.getUTCMonth() === m[2] - 1 ? iso : null;
  };

  var activar = function (panel) {
    var form = panel.querySelector("form"), tipo = form.dataset.tipo, elegida = null;
    var error = form.querySelector(".rsv-error"), enviar = form.querySelector("[type=submit]");
    var modo = function () { var b = form.querySelector("[data-modo][aria-pressed=true]"); return b ? b.dataset.modo : (tipo === "clase" ? "ya" : "nuevo"); };
    var mostrarError = function (msg) { error.textContent = msg; error.hidden = !msg; };

    form.querySelectorAll("[data-modo]").forEach(function (b) {
      b.addEventListener("click", function () {
        form.querySelectorAll("[data-modo]").forEach(function (x) { x.setAttribute("aria-pressed", x === b); });
        form.querySelectorAll("[data-si]").forEach(function (x) { x.hidden = x.dataset.si !== b.dataset.modo; });
        mostrarError("");
      });
    });

    /* Sábado de hoy después de las 13 h: WhatsApp en lugar del botón */
    var sab = form.querySelector("[data-sabado]");
    var revisarHora = function () {
      var tarde = sab && cerradoHoy(sab.value);
      form.querySelector("[data-wa]").hidden = !tarde;
      enviar.parentNode.hidden = !!tarde;
    };
    if (sab) { sab.addEventListener("change", revisarHora); revisarHora(); }

    /* Búsqueda por nombre */
    var q = form.querySelector("[data-buscar]"), ul = q && q.nextElementSibling, espera, pedido = 0;
    if (q) q.addEventListener("input", function () {
      elegida = null; clearTimeout(espera);
      var texto = q.value.trim();
      if (texto.length < 2) { ul.hidden = true; return; }
      espera = setTimeout(function () {
        var n = ++pedido;
        rpc("buscar_personas", { p_texto: texto, p_para: tipo === "brunch" ? "brunch" : "clase" }).then(function (lista) {
          if (n !== pedido) return;
          ul.innerHTML = lista.length
            ? lista.map(function (p) { return '<li><button type="button" data-id="' + esc(p.id) + '">' + esc(p.etiqueta) + "</button></li>"; }).join("")
            : '<li class="rsv-none">' + esc(ul.dataset.sin) + "</li>";
          ul.hidden = false;
          ul.querySelectorAll("button").forEach(function (b) {
            b.addEventListener("click", function () {
              ul.querySelectorAll("button").forEach(function (x) { x.setAttribute("aria-pressed", x === b); });
              elegida = { id: b.dataset.id, nombre: b.textContent };
              mostrarError("");
            });
          });
        }).catch(function () { if (n === pedido) { ul.innerHTML = '<li class="rsv-none">No pudimos buscar. Revisá tu conexión.</li>'; ul.hidden = false; } });
      }, 250);
    });

    /* dd/mm/aaaa: las barras se agregan solas */
    var nac = form.querySelector("[name=nacimiento]");
    if (nac) nac.addEventListener("input", function (e) {
      if (e.inputType && e.inputType.indexOf("delete") === 0) return;
      var d = nac.value.replace(/\D/g, "").slice(0, 8);
      nac.value = d.length > 4 ? d.slice(0, 2) + "/" + d.slice(2, 4) + "/" + d.slice(4) : d.length > 2 ? d.slice(0, 2) + "/" + d.slice(2) : d;
    });

    form.addEventListener("submit", function (e) {
      e.preventDefault();
      mostrarError("");
      var visibles = function (sel) { return Array.prototype.filter.call(form.querySelectorAll(sel), function (x) { return !x.closest("[hidden]"); }); };
      var valor = function (name) { var x = visibles("[name=" + name + "]")[0]; return x ? x.value.trim() : ""; };
      var fecha = valor("fecha");
      if (sab && cerradoHoy(fecha)) { revisarHora(); return; }

      var faltan = visibles("input[required], select[required]").filter(function (x) { return !x.value.trim(); });
      visibles("input[required]").forEach(function (x) { x.setAttribute("aria-invalid", !x.value.trim()); });
      var envio, nombreOk;
      if (modo() === "ya") {
        if (!elegida) return mostrarError("Escribí tu nombre y tocá tu nombre en la lista.");
        if (faltan.length) return mostrarError("Elegí tu nivel.");
        nombreOk = elegida.nombre.split(" ")[0];
        envio = rpc("reservar", { p_persona: elegida.id, p_tipo: tipo, p_fecha: fecha, p_nivel: valor("nivel") || null, p_cantidad: +valor("cantidad") || 1 });
      } else {
        if (faltan.length) { faltan[0].focus(); return mostrarError(faltan[0].name === "nivel" ? "Elegí tu nivel." : "Completá todos los datos."); }
        var nacimiento = null;
        if (tipo !== "brunch") {
          nacimiento = leerNacimiento(valor("nacimiento"));
          if (!nacimiento) { nac.setAttribute("aria-invalid", "true"); nac.focus(); return mostrarError("Escribí tu fecha de nacimiento así: 25/03/1990."); }
        }
        nombreOk = valor("nombre").split(" ")[0];
        envio = valor("web") ? Promise.resolve() : rpc("inscribir", {
          p_nombre: valor("nombre"), p_apellido: valor("apellido"), p_dni: valor("dni") || null,
          p_fecha_nacimiento: nacimiento, p_contacto: valor("contacto"), p_tipo: tipo, p_fecha: fecha,
          p_nivel: valor("nivel") || null, p_cantidad: +valor("cantidad") || 1
        });
      }

      enviar.disabled = true; enviar.textContent = "Enviando…";
      envio.then(function () {
        var cuando = tipo === "brunch"
          ? "el " + legible(fecha) + ". Te confirmamos la fecha por WhatsApp o email."
          : "el " + legible(fecha) + (tipo === "prueba" && valor("nivel") === "intermedios" ? " a las 16:00." : " a las 14:30.");
        form.outerHTML = '<div class="rsv-ok" role="status"><strong>¡Listo, ' + esc(nombreOk) + "!</strong> Quedaste en la lista. Te esperamos " + cuando + "</div>";
      }).catch(function (err) {
        enviar.disabled = false; enviar.textContent = enviar.dataset.texto;
        if (err.message === "CERRADO_HOY") { form.querySelector("[data-wa]").hidden = false; enviar.parentNode.hidden = true; return; }
        mostrarError(err.message);
      });
    });
    enviar.dataset.texto = enviar.textContent;
  };

  /* Copiar alias (funciona también en teléfonos sin permiso de portapapeles) */
  root.addEventListener("click", function (e) {
    var b = e.target.closest("[data-copiar]");
    if (!b) return;
    var listo = function () { b.textContent = "¡Copiado!"; setTimeout(function () { b.textContent = "Copiar alias"; }, 2000); };
    var aMano = function () {
      var t = document.createElement("textarea"); t.value = b.dataset.copiar; t.setAttribute("readonly", ""); t.style.position = "fixed"; t.style.opacity = "0";
      document.body.appendChild(t); t.select(); try { document.execCommand("copy"); } catch (x) {} t.remove(); listo();
    };
    if (navigator.clipboard && window.isSecureContext) navigator.clipboard.writeText(b.dataset.copiar).then(listo, aMano); else aMano();
  });

  /* Los cuatro botones: se abre uno a la vez */
  var botones = root.querySelectorAll(".rsv-choice");
  botones.forEach(function (btn) {
    btn.addEventListener("click", function () {
      var abierto = btn.getAttribute("aria-expanded") === "true";
      botones.forEach(function (b) {
        b.setAttribute("aria-expanded", "false");
        var p = document.getElementById(b.getAttribute("aria-controls"));
        p.hidden = true; p.innerHTML = "";
      });
      if (abierto) return;
      var panel = document.getElementById(btn.getAttribute("aria-controls"));
      btn.setAttribute("aria-expanded", "true");
      panel.innerHTML = PANELES[btn.dataset.panel]();
      panel.hidden = false;
      activar(panel);
      if (panel.getBoundingClientRect().top > window.innerHeight * .7) panel.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  });

  /* Enlace directo al Brunch & Bal (el que se comparte en Instagram): …/#brunch */
  var abrirDesdeEnlace = function () {
    if (location.hash !== "#brunch") return;
    var btn = root.querySelector('[data-panel="brunch"]');
    if (btn.getAttribute("aria-expanded") !== "true") btn.click();
    var ir = function () { btn.scrollIntoView({ block: "start" }); };
    ir();
    // La página sigue cargando (video, mapa) y mueve el contenido: se repite al final
    if (document.readyState !== "complete") window.addEventListener("load", function () { setTimeout(ir, 50); }, { once: true });
  };
  window.addEventListener("hashchange", abrirDesdeEnlace);
  abrirDesdeEnlace();
})();
