/* Nella Melody · fase 0 · escena de prueba.
   Sirve para medir lo que hay que decidir: fluidez, respuesta al toque,
   sonido y cómo llega cada tipo de puntero (mouse, dedo, lápiz). */
(function () {
  'use strict';

  var NM = window.NellaMelody;
  var marco = document.getElementById('marco');
  var svg = document.getElementById('actores');
  var personaje = document.getElementById('personaje');
  var capaCorazones = document.getElementById('corazones');
  var sombra = document.getElementById('sombra');

  personaje.innerHTML = NM.construir({ todas: true });

  var piezas = {};
  Array.prototype.forEach.call(personaje.querySelectorAll('[data-pieza]'), function (n) {
    piezas[n.getAttribute('data-pieza')] = n;
  });
  var expresiones = {};
  Array.prototype.forEach.call(personaje.querySelectorAll('[data-expresion]'), function (n) {
    expresiones[n.getAttribute('data-expresion')] = n;
  });

  function poner(nombre, transformacion) {
    piezas[nombre].setAttribute('transform', transformacion);
  }

  /* ---------- Movimiento ----------
     Los resortes avanzan en pasos fijos de 1/240 s. Así el movimiento es el
     mismo a 30, 60, 90 o 120 cuadros por segundo. */

  function Resorte(rigidez, freno) {
    this.x = 0; this.v = 0; this.meta = 0; this.k = rigidez; this.c = freno;
  }
  Resorte.prototype.paso = function (h) {
    this.v += (-this.k * (this.x - this.meta) - this.c * this.v) * h;
    this.x += this.v * h;
  };

  var r = {
    aplastar: new Resorte(260, 14),
    salto: new Resorte(170, 15),
    orejaIzq: new Resorte(90, 7),
    orejaDer: new Resorte(90, 7),
    cabeza: new Resorte(120, 12),
    miraX: new Resorte(140, 22),
    miraY: new Resorte(140, 22)
  };

  var PASO = 1 / 240;
  var MAX_PASOS = 60;
  var t = 0;
  var acumulado = 0;
  var ultimo = 0;

  var parpadeo = { proximo: 2.2, inicio: -1 };
  var expresionActual = 'neutral';
  var expresionHasta = 0;

  function mostrar(nombre, segundos) {
    if (nombre !== expresionActual) {
      expresiones[expresionActual].setAttribute('display', 'none');
      expresiones[nombre].removeAttribute('display');
      expresionActual = nombre;
    }
    expresionHasta = segundos ? t + segundos : 0;
  }

  function aperturaDeOjos() {
    if (parpadeo.inicio < 0) {
      if (t >= parpadeo.proximo) parpadeo.inicio = t;
      return 1;
    }
    var f = t - parpadeo.inicio;
    if (f < 0.06) return 1 - 0.9 * (f / 0.06);
    if (f < 0.11) return 0.1;
    if (f < 0.2) return 0.1 + 0.9 * ((f - 0.11) / 0.09);
    parpadeo.inicio = -1;
    parpadeo.proximo = t + (Math.random() < 0.2 ? 0.25 : 2.4 + Math.random() * 3.6);
    return 1;
  }

  function dibujar() {
    var resp = Math.sin(t * 2 * Math.PI / 3.4);
    var a = r.aplastar.x;
    var alto = Math.max(0, r.salto.x);

    poner('raiz', 'translate(0 ' + (-alto).toFixed(2) + ') scale(' +
      (1 - a * 0.6).toFixed(4) + ' ' + (1 + a).toFixed(4) + ')');
    poner('tronco', 'scale(' + (1 - 0.006 * resp).toFixed(4) + ' ' + (1 + 0.014 * resp).toFixed(4) + ')');
    poner('cabeza', 'translate(0 ' + (-3.5 * resp).toFixed(2) + ') rotate(' +
      (1.2 * Math.sin(t * 0.8) + r.cabeza.x).toFixed(3) + ')');
    poner('oreja-izq', 'rotate(' + (1.8 * Math.sin(t * 1.1) + r.orejaIzq.x).toFixed(3) + ')');
    poner('oreja-der', 'rotate(' + (1.8 * Math.sin(t * 1.1 + 1.3) + r.orejaDer.x).toFixed(3) + ')');

    var brazos = 3 * resp + (expresionActual === 'feliz' ? 26 : 0) + alto * 0.5;
    poner('brazo-izq', 'rotate(' + brazos.toFixed(3) + ')');
    poner('brazo-der', 'rotate(' + (-brazos).toFixed(3) + ')');

    poner('rasgos', 'translate(' + r.miraX.x.toFixed(2) + ' ' + r.miraY.x.toFixed(2) + ')');

    var ojos = aperturaDeOjos();
    poner('ojo-izq', 'scale(1 ' + ojos.toFixed(3) + ')');
    poner('ojo-der', 'scale(1 ' + ojos.toFixed(3) + ')');

    var encogida = 1 / (1 + alto / 160);
    sombra.setAttribute('rx', (230 * encogida).toFixed(1));
    sombra.setAttribute('opacity', (0.16 * encogida).toFixed(3));

    dibujarCorazones();
  }

  /* ---------- Corazones ---------- */

  var corazones = [];
  var NS = 'http://www.w3.org/2000/svg';

  function soltarCorazon(x, y) {
    if (corazones.length >= 14) return;
    var el = document.createElementNS(NS, 'path');
    el.setAttribute('d', 'M0,-10 C-12,-30 -40,-12 -24,12 L0,36 L24,12 C40,-12 12,-30 0,-10 Z');
    el.setAttribute('fill', '#ff7fa8');
    el.setAttribute('stroke', NM.ESTILO.contorno);
    el.setAttribute('stroke-width', '6');
    el.setAttribute('stroke-linejoin', 'round');
    capaCorazones.appendChild(el);
    corazones.push({ el: el, x: x, y: y, deriva: (Math.random() - 0.5) * 160, nace: t, giro: (Math.random() - 0.5) * 30 });
  }

  function dibujarCorazones() {
    for (var i = corazones.length - 1; i >= 0; i--) {
      var c = corazones[i];
      var edad = (t - c.nace) / 1.3;
      if (edad >= 1) {
        capaCorazones.removeChild(c.el);
        corazones.splice(i, 1);
        continue;
      }
      var sube = 1 - (1 - edad) * (1 - edad);
      var tam = 0.6 + 0.9 * Math.min(1, edad * 4);
      c.el.setAttribute('transform', 'translate(' + (c.x + c.deriva * edad).toFixed(1) + ' ' +
        (c.y - 260 * sube).toFixed(1) + ') rotate(' + (c.giro * edad).toFixed(1) + ') scale(' + tam.toFixed(3) + ')');
      c.el.setAttribute('opacity', (edad < 0.7 ? 1 : (1 - edad) / 0.3).toFixed(3));
    }
  }

  /* ---------- Sonido ----------
     Solo para esta prueba el sonido se genera al vuelo. En el juego serán archivos. */

  var ESCALA = [523.25, 587.33, 659.25, 698.46, 783.99, 880.0, 987.77, 1046.5];
  var audio = null;
  var nota = 0;

  function contextoDeAudio() {
    if (!audio) {
      var Clase = window.AudioContext || window.webkitAudioContext;
      if (!Clase) return null;
      audio = new Clase();
    }
    if (audio.state === 'suspended') audio.resume();
    return audio;
  }

  function tocar(frecuencia, espera, volumen) {
    var ctx = contextoDeAudio();
    if (!ctx) return;
    var t0 = ctx.currentTime + (espera || 0);
    var salida = ctx.createGain();
    salida.gain.setValueAtTime(0.0001, t0);
    salida.gain.exponentialRampToValueAtTime(volumen || 0.2, t0 + 0.004);
    salida.gain.exponentialRampToValueAtTime(0.0001, t0 + 1.4);
    salida.connect(ctx.destination);
    [[1, 1], [2, 0.35], [3.01, 0.12], [4.2, 0.05]].forEach(function (parcial) {
      var osc = ctx.createOscillator();
      var g = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.value = frecuencia * parcial[0];
      g.gain.value = parcial[1];
      osc.connect(g);
      g.connect(salida);
      osc.start(t0);
      osc.stop(t0 + 1.5);
    });
  }

  /* ---------- Reacciones ---------- */

  var CABEZA = { x: 1280, y: 956 };

  function reaccionar(x, y) {
    r.aplastar.v -= 2.6;
    r.orejaIzq.v -= 110;
    r.orejaDer.v += 110;
    r.cabeza.v += (x < CABEZA.x ? -1 : 1) * 30;
    mostrar('feliz', 0.9);
    soltarCorazon(x, y - 60);
    tocar(ESCALA[nota]);
    nota++;
    if (nota === ESCALA.length) {
      nota = 0;
      r.salto.v += 900;
      mostrar('feliz', 1.8);
      [0, 2, 4, 7].forEach(function (grado, i) { tocar(ESCALA[grado], 0.25 + i * 0.11, 0.16); });
      for (var i = 0; i < 6; i++) soltarCorazon(CABEZA.x + (i - 2.5) * 110, CABEZA.y - 260);
    }
  }

  /* ---------- Puntero ---------- */

  var puntero = { abajo: false, x: 0, y: 0, visto: -10, recorrido: 0 };
  var diag = { tipo: '—', presion: 0, tipos: {}, muestras: 1, inclinacion: '' };

  function aEscena(e) {
    var m = svg.getScreenCTM();
    if (!m) return { x: 0, y: 0 };
    return new DOMPoint(e.clientX, e.clientY).matrixTransform(m.inverse());
  }

  function sobrePersonaje(e) {
    var el = document.elementFromPoint(e.clientX, e.clientY);
    return !!(el && el.closest && el.closest('#personaje'));
  }

  function esInterfaz(e) {
    return !!(e.target.closest && e.target.closest('button, #hud'));
  }

  function anotar(e) {
    diag.tipo = e.pointerType || 'desconocido';
    diag.tipos[diag.tipo] = true;
    diag.presion = e.pressure;
    diag.inclinacion = (e.tiltX || e.tiltY) ? e.tiltX + '°, ' + e.tiltY + '°' : '';
    if (e.getCoalescedEvents) diag.muestras = Math.max(diag.muestras, e.getCoalescedEvents().length);
  }

  marco.addEventListener('pointerdown', function (e) {
    if (esInterfaz(e)) return;
    contextoDeAudio();
    anotar(e);
    document.getElementById('pista').style.opacity = '0';
    var p = aEscena(e);
    puntero.abajo = true; puntero.x = p.x; puntero.y = p.y; puntero.visto = t; puntero.recorrido = 0;
    if (sobrePersonaje(e)) reaccionar(p.x, p.y);
  });

  marco.addEventListener('pointermove', function (e) {
    anotar(e);
    var p = aEscena(e);
    if (puntero.abajo && sobrePersonaje(e)) {
      puntero.recorrido += Math.abs(p.x - puntero.x) + Math.abs(p.y - puntero.y);
      if (puntero.recorrido > 260) { puntero.recorrido = 0; reaccionar(p.x, p.y); }
    }
    puntero.x = p.x; puntero.y = p.y; puntero.visto = t;
  });

  function soltar() { puntero.abajo = false; }
  marco.addEventListener('pointerup', soltar);
  marco.addEventListener('pointercancel', soltar);
  marco.addEventListener('contextmenu', function (e) { e.preventDefault(); });

  function limitar(v, tope) { return Math.max(-tope, Math.min(tope, v)); }

  /* ---------- Medición ---------- */

  var tiempos = new Float32Array(240);
  var cuantos = 0;
  var indice = 0;

  function medir(ms) {
    tiempos[indice] = ms;
    indice = (indice + 1) % tiempos.length;
    if (cuantos < tiempos.length) cuantos++;
  }

  function resumen() {
    if (!cuantos) return null;
    var copia = Array.prototype.slice.call(tiempos, 0, cuantos).sort(function (x, y) { return x - y; });
    var suma = 0;
    for (var i = 0; i < copia.length; i++) suma += copia[i];
    var mediana = copia[Math.floor(copia.length / 2)];
    var cercano = [30, 48, 60, 72, 90, 120, 144].reduce(function (mejor, hz) {
      return Math.abs(1000 / mediana - hz) < Math.abs(1000 / mediana - mejor) ? hz : mejor;
    }, 60);
    return {
      fps: 1000 / (suma / copia.length),
      mediana: mediana,
      p95: copia[Math.floor(copia.length * 0.95)],
      max: copia[copia.length - 1],
      hz: cercano
    };
  }

  function textoDeDiagnostico() {
    var s = resumen();
    var dpr = window.devicePixelRatio || 1;
    var latencia = audio ? Math.round(((audio.baseLatency || 0) + (audio.outputLatency || 0)) * 1000) : null;
    return [
      'Nella Melody · fase 0 (web)',
      s ? 'cuadros por segundo: ' + s.fps.toFixed(1) : 'cuadros por segundo: midiendo',
      s ? 'ms por cuadro: mediana ' + s.mediana.toFixed(1) + ' · p95 ' + s.p95.toFixed(1) + ' · máx ' + s.max.toFixed(1) : '',
      s ? 'pantalla estimada: ' + s.hz + ' Hz' : '',
      'ventana: ' + window.innerWidth + ' x ' + window.innerHeight + ' · densidad ' + dpr +
        ' · ' + Math.round(window.innerWidth * dpr) + ' x ' + Math.round(window.innerHeight * dpr) + ' px reales',
      'puntero: ' + diag.tipo + ' · presión ' + Number(diag.presion).toFixed(2) +
        (diag.inclinacion ? ' · inclinación ' + diag.inclinacion : ''),
      'tipos de puntero vistos: ' + (Object.keys(diag.tipos).join(', ') || 'ninguno'),
      'muestras por evento (máx): ' + diag.muestras,
      'audio: ' + (audio ? audio.state + (latencia !== null ? ' · latencia ' + latencia + ' ms' : '') : 'sin iniciar'),
      'navegador: ' + navigator.userAgent
    ].filter(Boolean).join('\n');
  }

  var hud = document.getElementById('hud');
  var hudTexto = document.getElementById('hud-texto');

  document.getElementById('btn-diag').addEventListener('click', function () {
    hud.style.display = hud.style.display === 'block' ? 'none' : 'block';
    hudTexto.textContent = textoDeDiagnostico();
  });
  setInterval(function () {
    if (hud.style.display === 'block') hudTexto.textContent = textoDeDiagnostico();
  }, 500);

  document.getElementById('btn-copiar').addEventListener('click', function () {
    var texto = textoDeDiagnostico();
    var boton = this;
    function listo() { boton.textContent = 'Copiado'; setTimeout(function () { boton.textContent = 'Copiar diagnóstico'; }, 1500); }
    function respaldo() {
      var area = document.createElement('textarea');
      area.value = texto;
      document.body.appendChild(area);
      area.select();
      try { document.execCommand('copy'); listo(); } catch (err) { boton.textContent = 'No se pudo copiar'; }
      document.body.removeChild(area);
    }
    if (navigator.clipboard && window.isSecureContext) navigator.clipboard.writeText(texto).then(listo, respaldo);
    else respaldo();
  });

  document.getElementById('btn-completa').addEventListener('click', function () {
    if (document.fullscreenElement) { document.exitFullscreen(); return; }
    var pedido = document.documentElement.requestFullscreen && document.documentElement.requestFullscreen();
    if (pedido && pedido.then) {
      pedido.then(function () {
        if (screen.orientation && screen.orientation.lock) screen.orientation.lock('landscape').catch(function () {});
      }).catch(function () {});
    }
  });

  /* ---------- Bucle ---------- */

  function cuadro(ahora) {
    if (!ultimo) ultimo = ahora;
    var ms = ahora - ultimo;
    ultimo = ahora;
    if (ms > 0 && ms < 1000) medir(ms);

    var dt = Math.min(ms / 1000, 0.25);
    t += dt;

    var quieto = t - puntero.visto > 2.5;
    r.miraX.meta = quieto ? 0 : limitar((puntero.x - CABEZA.x) * 0.02, 12);
    r.miraY.meta = quieto ? 0 : limitar((puntero.y - CABEZA.y) * 0.02, 8);
    if (expresionHasta && t > expresionHasta) mostrar('neutral');

    acumulado += dt;
    var pasos = 0;
    while (acumulado >= PASO && pasos < MAX_PASOS) {
      for (var nombre in r) r[nombre].paso(PASO);
      acumulado -= PASO;
      pasos++;
    }
    if (pasos === MAX_PASOS) acumulado = 0;

    dibujar();
    requestAnimationFrame(cuadro);
  }

  document.addEventListener('visibilitychange', function () { ultimo = 0; });
  requestAnimationFrame(cuadro);

  /* Para inspeccionar desde la consola. */
  window.NellaFase0 = { diagnostico: textoDeDiagnostico, reaccionar: reaccionar };
})();
