/* Nella Melody · fase 0 · encargos del día, Notas Rosas y deseos.
   Cada día My Melody tiene tres encargos, titulados con la fórmula de deseo de los
   episodios ("Ojalá…"), uno por ambiente. Cumplir uno da una Nota Rosa y 10 ♥.
   Las Notas solo suben. Cada ocho Notas (una escala: do, re, mi, fa, sol, la, si, do)
   se cumple un deseo: una carta del autor o una página de la Kuromi Note.

   Los ambientes avisan lo que pasa con registrar(evento, info); este archivo decide
   si eso cumple algo. Durante la prueba del mono loco no guarda nada ni abre ventanas:
   así la prueba nunca regala Notas ni gasta las cartas.

   Al llegar a 100 Notas viene el final: My Melody pide ayuda, se toca la escala con ella,
   brotan las aguas termales y se abre la sorpresa del autor. El juego sigue después. */
import { CARTAS, PAGINAS_KUROMI, SORPRESA_FINAL } from './cartas.js?v=2';

const CLAVE = 'nella-encargos';
const CLAVE_NOTAS = 'nella-notas';   /* copia para la ficha del título */
const POR_DIA = 3;
const NOTAS_POR_DESEO = 8;
const PREMIO_CORAZONES = 10;
const NOTAS_DEL_FINAL = 100;
const ESCALA = [523.25, 587.33, 659.25, 698.46, 783.99, 880, 987.77, 1046.5];
const NOMBRES_DE_NOTAS = ['do', 're', 'mi', 'fa', 'sol', 'la', 'si', 'do'];

/* lugar: de qué ambiente es (se elige uno por ambiente). evento: lo que lo hace avanzar. */
export const ENCARGOS = [
  { id: 'escala', lugar: 'sala', meta: 1, evento: 'escala',
    titulo: 'Ojalá sonara la escala completa', como: 'Dale cariño hasta completar do, re, mi, fa, sol, la, si, do.' },
  { id: 'recorrer', lugar: 'sala', meta: 4, evento: 'cuarto',
    titulo: 'Ojalá paseáramos por toda la casa', como: 'Visita con ella la sala, la cocina, el baño y el patio.' },
  { id: 'siesta', lugar: 'sala', meta: 1, evento: 'siesta',
    titulo: 'Ojalá pudiera dormir una siestita', como: 'Déjala tranquila, sin tocarla, hasta que se duerma.' },
  { id: 'ramo', lugar: 'sala', meta: 1, evento: 'ramo',
    titulo: 'Ojalá hubiera flores en la sala', como: 'Cuando florezcan las flores del patio, toca "Ramo" para el florero.' },
  { id: 'comer', lugar: 'cocina', meta: 3, evento: 'comer',
    titulo: 'Ojalá tuviera la pancita llena', como: 'Dale de comer tres veces.' },
  { id: 'pastel', lugar: 'cocina', meta: 1, evento: 'comer', comida: 'pastel',
    titulo: 'Ojalá pudiera comer pastel de almendras', como: 'Dale su favorito. Si no queda, está en la tiendita.' },
  { id: 'mesa', lugar: 'cocina', meta: 1, evento: 'comer', sentada: true,
    titulo: 'Ojalá comiéramos juntas a la mesa', como: 'Siéntala en la silla de la cocina y dale de comer.' },
  { id: 'rakkyo', lugar: 'cocina', meta: 1, evento: 'comer', comida: 'rakkyo',
    titulo: 'Ojalá probara el rakkyo de Kuromi', como: 'Dale rakkyo. Lo venden en la tiendita.' },
  { id: 'postre', lugar: 'cocina', meta: 2, evento: 'comer', comidas: ['pudin', 'dona', 'pastel', 'chocolate', 'cheesecake', 'tiramisu'],
    titulo: 'Ojalá comiera algo dulcecito', como: 'Dale dos postres: pudín, dona, pasteles, cheesecake o tiramisú.' },
  { id: 'matcha', lugar: 'cocina', meta: 1, evento: 'comer', comida: 'matcha',
    titulo: 'Ojalá tomara un matcha latte', como: 'Dale un matcha latte. Lo venden en la tiendita.' },
  { id: 'bano', lugar: 'bano', meta: 1, evento: 'bano',
    titulo: 'Ojalá oliera a flores', como: 'Báñala con jabón y enjuágala con la regadera.' },
  { id: 'burbujas', lugar: 'bano', meta: 20, evento: 'espuma',
    titulo: 'Ojalá tuviera un sombrero de burbujas', como: 'En la bañera, llénale la cabeza de espuma con el jabón.' },
  { id: 'columpio', lugar: 'patio', meta: 10, evento: 'empujon',
    titulo: 'Ojalá volara alto', como: 'Empújala en el columpio diez veces.' },
  { id: 'vuelta', lugar: 'patio', meta: 1, evento: 'vuelta',
    titulo: 'Ojalá diera una vuelta por el cielo', como: 'Empújala en el columpio hasta que dé la vuelta completa.' },
  { id: 'flores', lugar: 'patio', meta: 1, evento: 'regar',
    titulo: 'Ojalá las flores crecieran', como: 'Riega el cantero del patio.' },
  { id: 'kuromi', lugar: 'patio', meta: 1, evento: 'kuromi',
    titulo: 'Ojalá encontrara a Kuromi', como: 'Kuromi espía por la cerca del patio. Tócala cuando se asome.' }
];
const PRIMER_DIA = ['recorrer', 'comer', 'flores'];
const LUGARES = ['sala', 'cocina', 'bano', 'patio'];
const porId = (id) => ENCARGOS.find((e) => e.id === id);

function hoy() {
  const ahora = new Date();
  return Math.floor((ahora.getTime() - ahora.getTimezoneOffset() * 60000) / 86400000);
}

/* Números al azar repetibles: el mismo día da siempre la misma lista. */
function azarConSemilla(semilla) {
  let a = semilla >>> 0;
  return function () {
    a = (a + 0x6D2B79F5) >>> 0;
    let x = Math.imul(a ^ (a >>> 15), 1 | a);
    x = (x + Math.imul(x ^ (x >>> 7), 61 | x)) ^ x;
    return ((x ^ (x >>> 14)) >>> 0) / 4294967296;
  };
}

export function crearEncargos(ctx) {
  const { marco, tocar, decir, ganar, feliz, puntoDeElla, puedeInterrumpir, silencioso } = ctx;

  /* ---------- Datos guardados ---------- */

  function datosNuevos() {
    return { version: 1, dia: null, generadas: 0, lista: [], anteriores: [], notas: 0, deseos: [], cartas: 0, paginas: 0, anunciado: null, final: null };
  }
  function entero(v, minimo, maximo) {
    const n = Math.floor(Number(v));
    return Number.isFinite(n) ? Math.max(minimo, Math.min(maximo, n)) : minimo;
  }
  function cargar() {
    const base = datosNuevos();
    let d = null;
    try { d = JSON.parse(localStorage.getItem(CLAVE) || 'null'); } catch (err) { d = null; }
    if (!d || typeof d !== 'object' || d.version !== 1) {
      /* Notas de antes de que existieran los encargos (la ficha ya las leía). */
      try { base.notas = entero(JSON.parse(localStorage.getItem(CLAVE_NOTAS) || '0'), 0, 9999); } catch (err) { base.notas = 0; }
      return base;
    }
    base.notas = entero(d.notas, 0, 9999);
    base.generadas = entero(d.generadas, 0, 1e9);
    base.cartas = entero(d.cartas, 0, 1000);
    base.paginas = entero(d.paginas, 0, 1000);
    if (Number.isFinite(Number(d.dia)) && d.dia !== null) base.dia = Math.floor(Number(d.dia));
    if (Number.isFinite(Number(d.anunciado)) && d.anunciado !== null) base.anunciado = Math.floor(Number(d.anunciado));
    if (Array.isArray(d.lista)) {
      const vistos = new Set();
      d.lista.forEach((e) => {
        const def = e && porId(e.id);
        if (!def || vistos.has(def.id) || base.lista.length >= POR_DIA) return;
        vistos.add(def.id);
        base.lista.push({ id: def.id, progreso: entero(e.progreso, 0, def.meta), hecho: !!e.hecho, cuartos: entero(e.cuartos, 0, 15) });
      });
    }
    if (Array.isArray(d.anteriores)) base.anteriores = d.anteriores.filter((id) => porId(id)).slice(0, POR_DIA);
    if (Array.isArray(d.deseos)) {
      d.deseos.forEach((x) => {
        if (!x || (x.tipo !== 'carta' && x.tipo !== 'kuromi')) return;
        const indice = entero(x.indice, 0, 1000);
        const lista = x.tipo === 'carta' ? CARTAS : PAGINAS_KUROMI;
        if (indice < lista.length) base.deseos.push({ n: entero(x.n, 1, 1000), tipo: x.tipo, indice });
      });
    }
    if (d.final === 'visto') base.final = 'visto';
    if (base.lista.length !== POR_DIA) base.dia = null;   /* lista rara: se arma de nuevo */
    return base;
  }

  let datos = cargar();
  function guardar() {
    if (silencioso()) return;
    try {
      localStorage.setItem(CLAVE, JSON.stringify(datos));
      localStorage.setItem(CLAVE_NOTAS, JSON.stringify(datos.notas));
    } catch (err) { /* sin almacenamiento */ }
  }

  /* Tres encargos de ambientes distintos, sin repetir los de ayer si se puede. */
  function armarLista() {
    datos.anteriores = datos.lista.map((e) => e.id);
    let ids;
    if (datos.generadas === 0 && datos.notas === 0) ids = PRIMER_DIA.slice();
    else {
      const azar = azarConSemilla(hoy() * 7919 + datos.generadas * 104729);
      const lugares = LUGARES.slice().sort(() => azar() - 0.5).slice(0, POR_DIA);
      ids = lugares.map((lugar) => {
        const todos = ENCARGOS.filter((e) => e.lugar === lugar && (!ctx.disponible || ctx.disponible(e.id)));
        const nuevos = todos.filter((e) => !datos.anteriores.includes(e.id));
        const opciones = nuevos.length ? nuevos : todos;
        return opciones[Math.floor(azar() * opciones.length)].id;
      });
    }
    datos.lista = ids.map((id) => ({ id, progreso: 0, hecho: false, cuartos: 0 }));
    datos.dia = hoy();
    datos.generadas++;
    guardar();
    pintar();
  }

  function ponerAlDia() {
    if (datos.dia !== hoy()) { armarLista(); return true; }
    return false;
  }

  /* ---------- Interfaz ---------- */

  const ICONO_LUGAR = {
    sala: '<path d="M5 11V9a3 3 0 0 1 3-3h8a3 3 0 0 1 3 3v2"/><rect x="2.5" y="11" width="19" height="6.5" rx="2.2"/><path d="M5.5 17.5v2M18.5 17.5v2"/>',
    cocina: '<path d="M6.5 13h11l-1.6 7.5H8.1z"/><path d="M5 13a7 6.5 0 0 1 14 0z"/><path d="M12 4.6v2"/><circle cx="12" cy="3.6" r="1"/>',
    bano: '<path d="M3 12h18v2.2a5 5 0 0 1-5 5H8a5 5 0 0 1-5-5z"/><path d="M6 12V6.5a2 2 0 0 1 4 0"/><circle cx="14.5" cy="8" r="1.4"/><circle cx="18" cy="5.5" r="1"/>',
    patio: '<circle cx="12" cy="6" r="2.4"/><circle cx="15.6" cy="9" r="2.4"/><circle cx="12" cy="12" r="2.4"/><circle cx="8.4" cy="9" r="2.4"/><path d="M12 14.4v7"/>'
  };
  const svgLugar = (lugar) => '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + ICONO_LUGAR[lugar] + '</svg>';
  const NOTA_SVG = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9 17.5V5.5l10-2v11.5" fill="none" stroke-width="2.2"/><circle cx="6.5" cy="17.5" r="2.6"/><circle cx="16.5" cy="15" r="2.6"/></svg>';

  const boton = document.getElementById('btn-encargos');
  const insignia = boton ? boton.querySelector('.insignia') : null;
  const contador = document.getElementById('contador-notas');
  const numero = contador ? contador.querySelector('span') : null;

  const panel = document.createElement('div');
  panel.id = 'panel-encargos';
  panel.className = 'capa modal';
  panel.innerHTML =
    '<div class="panel panel-encargos">' +
      '<h2>Encargos del día</h2>' +
      '<div class="lista-encargos"></div>' +
      '<div class="escala-notas"><div class="pentagrama"></div><p class="escala-texto"></p></div>' +
      '<div class="deseos-recibidos"></div>' +
      '<div class="botones"><button class="boton-ui secundario" type="button" data-cerrar>Volver</button></div>' +
    '</div>';
  marco.appendChild(panel);
  const listaEl = panel.querySelector('.lista-encargos');
  const pentagrama = panel.querySelector('.pentagrama');
  const escalaTexto = panel.querySelector('.escala-texto');
  const recibidos = panel.querySelector('.deseos-recibidos');
  NOMBRES_DE_NOTAS.forEach((nombre) => {
    const n = document.createElement('span');
    n.className = 'nota-escala';
    n.innerHTML = NOTA_SVG + '<small>' + nombre + '</small>';
    pentagrama.appendChild(n);
  });

  const aviso = document.createElement('div');
  aviso.id = 'aviso-encargo';
  aviso.innerHTML = '<strong>¡Encargo cumplido!</strong><span class="aviso-titulo"></span><span class="aviso-premio">♪ +1 · ♥ +' + PREMIO_CORAZONES + '</span>';
  marco.appendChild(aviso);

  const capaDeseo = document.createElement('div');
  capaDeseo.id = 'deseo';
  capaDeseo.className = 'capa modal';
  capaDeseo.innerHTML =
    '<div class="panel panel-deseo">' +
      '<div class="deseo-cabeza"><span class="deseo-estrella">✦</span><span class="deseo-encabezado"></span><span class="deseo-estrella">✦</span></div>' +
      '<div class="deseo-hoja"><h3></h3><p></p></div>' +
      '<div class="botones"><button class="boton-ui" type="button" data-cerrar>¡Gracias!</button></div>' +
    '</div>';
  marco.appendChild(capaDeseo);
  const hoja = capaDeseo.querySelector('.deseo-hoja');

  function pintar() {
    const pendientes = datos.lista.filter((e) => !e.hecho).length;
    if (insignia) {
      insignia.textContent = pendientes ? String(pendientes) : '✓';
      insignia.classList.toggle('listo', !pendientes);
    }
    if (numero) numero.textContent = String(datos.notas);
    listaEl.innerHTML = '';
    datos.lista.forEach((e) => {
      const def = porId(e.id);
      const fila = document.createElement('div');
      fila.className = 'encargo' + (e.hecho ? ' hecho' : '');
      fila.dataset.id = e.id;
      fila.innerHTML = '<span class="encargo-lugar">' + svgLugar(def.lugar) + '</span>' +
        '<span class="encargo-texto"><b></b><small></small></span><span class="encargo-estado"></span>';
      fila.querySelector('b').textContent = def.titulo;
      fila.querySelector('small').textContent = def.como;
      fila.querySelector('.encargo-estado').textContent = e.hecho ? '✓' : def.meta > 1 ? e.progreso + '/' + def.meta : '';
      listaEl.appendChild(fila);
    });
    const enLaEscala = datos.notas % NOTAS_POR_DESEO;
    pentagrama.querySelectorAll('.nota-escala').forEach((n, i) => n.classList.toggle('llena', i < enLaEscala));
    const faltan = NOTAS_POR_DESEO - enLaEscala;
    escalaTexto.textContent = '♪ ' + datos.notas + (datos.notas === 1 ? ' Nota Rosa' : ' Notas Rosas') +
      ' · ' + (faltan === 1 ? 'falta 1 para el próximo deseo' : 'faltan ' + faltan + ' para el próximo deseo');
    recibidos.innerHTML = '';
    if (datos.deseos.length || datos.final === 'visto') {
      const titulo = document.createElement('span');
      titulo.textContent = 'Deseos cumplidos:';
      recibidos.appendChild(titulo);
      datos.deseos.forEach((d, i) => {
        const b = document.createElement('button');
        b.type = 'button';
        b.className = 'deseo-guardado ' + d.tipo;
        b.textContent = d.tipo === 'carta' ? '✉' : '☠';
        b.title = (d.tipo === 'carta' ? 'Carta' : 'Kuromi Note') + ' · Nota ' + d.n;
        b.addEventListener('click', () => mostrarDeseo(i, false));
        recibidos.appendChild(b);
      });
    }
    if (datos.final === 'visto') {
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'deseo-guardado final';
      b.textContent = '★';
      b.title = 'La sorpresa de las 100 Notas';
      b.addEventListener('click', () => mostrarSorpresa(true));
      recibidos.appendChild(b);
    }
  }

  function saltito(el, clase) {
    if (!el) return;
    el.classList.remove(clase);
    void el.offsetWidth;
    el.classList.add(clase);
  }

  function abrirPanel() {
    ponerAlDia();
    pintar();
    panel.classList.add('visible');
    tocar(1318.5, 0, 0.1);
    tocar(1975.5, 0.07, 0.09);
  }
  function cerrarPanel(conSonido) {
    if (!panel.classList.contains('visible')) return;
    panel.classList.remove('visible');
    if (conSonido) { tocar(1318.5, 0, 0.09); tocar(987.77, 0.07, 0.09); }
  }
  if (boton) boton.addEventListener('click', abrirPanel);
  panel.querySelector('[data-cerrar]').addEventListener('click', () => cerrarPanel(true));
  panel.addEventListener('click', (e) => { if (e.target === panel) cerrarPanel(true); });

  /* ---------- Cumplir ---------- */

  let ocultarAviso = 0;
  const deseosPendientes = [];

  /* Lo que pasa en la casa. info: { comida, sentada, cuarto }. Devuelve si cumplió algo. */
  function registrar(evento, info) {
    ponerAlDia();
    info = info || {};
    let cumplio = false;
    datos.lista.forEach((e) => {
      const def = porId(e.id);
      if (e.hecho || def.evento !== evento) return;
      if (def.comida && info.comida !== def.comida) return;
      if (def.comidas && !def.comidas.includes(info.comida)) return;
      if (def.sentada && !info.sentada) return;
      if (evento === 'cuarto') {
        e.cuartos |= 1 << Math.max(0, Math.min(3, info.cuarto | 0));
        let n = 0;
        for (let b = e.cuartos; b; b >>= 1) n += b & 1;
        e.progreso = Math.min(def.meta, n);
      } else {
        e.progreso = Math.min(def.meta, e.progreso + 1);
      }
      if (e.progreso >= def.meta) { e.hecho = true; cumplir(def); cumplio = true; }
    });
    guardar();
    pintar();
    return cumplio;
  }

  function cumplir(def) {
    datos.notas++;
    if (datos.notas % NOTAS_POR_DESEO === 0) prepararDeseo();
    if (datos.notas >= NOTAS_DEL_FINAL && datos.final !== 'visto') finalPendiente = true;
    const desde = puntoDeElla();
    ganar('encargos', PREMIO_CORAZONES, desde);
    if (silencioso()) return;
    feliz(1.6);
    decir('¡Se cumplió mi deseo! ¡Gracias!');
    [0, 2, 4, 7].forEach((grado, i) => tocar(ESCALA[grado], 0.15 + i * 0.1, 0.14));
    aviso.querySelector('.aviso-titulo').textContent = def.titulo;
    saltito(aviso, 'visible');
    clearTimeout(ocultarAviso);
    ocultarAviso = setTimeout(() => aviso.classList.remove('visible'), 3200);
    lanzarNota(desde);
  }

  /* La nota rosa vuela de My Melody al contador ♪. */
  function lanzarNota(desde) {
    if (!contador) return;
    const caja = marco.getBoundingClientRect(), destino = contador.getBoundingClientRect();
    const x0 = desde.x - caja.left, y0 = desde.y - caja.top;
    const x1 = destino.left + destino.width * 0.25 - caja.left, y1 = destino.top + destino.height / 2 - caja.top;
    const el = document.createElement('div');
    el.className = 'nota-voladora';
    el.innerHTML = NOTA_SVG;
    el.style.left = x0 + 'px';
    el.style.top = y0 + 'px';
    marco.appendChild(el);
    requestAnimationFrame(() => requestAnimationFrame(() => {
      el.style.transform = 'translate(' + (x1 - x0) + 'px,' + (y1 - y0) + 'px) scale(.6) rotate(-20deg)';
    }));
    setTimeout(() => { el.remove(); saltito(contador, 'suma'); }, 900);
  }

  /* Decide qué deseo toca: se turnan carta y Kuromi Note; si no hay carta, va una página. */
  function prepararDeseo() {
    const numeroDeDeseo = datos.notas / NOTAS_POR_DESEO;
    let tipo = numeroDeDeseo % 2 === 1 ? 'carta' : 'kuromi';
    if (tipo === 'carta' && !(CARTAS[datos.cartas] && CARTAS[datos.cartas].texto)) tipo = 'kuromi';
    let indice;
    if (tipo === 'carta') indice = datos.cartas++;
    else { indice = datos.paginas % PAGINAS_KUROMI.length; datos.paginas++; }
    datos.deseos.push({ n: datos.notas, tipo, indice });
    deseosPendientes.push(datos.deseos.length - 1);
  }

  let deseoVisible = -1, alCerrarDeseo = null;
  function mostrarDeseo(i, conFanfarria) {
    const d = datos.deseos[i];
    if (!d) return;
    deseoVisible = i;
    capaDeseo.classList.remove('final');
    const titulo = hoja.querySelector('h3'), texto = hoja.querySelector('p');
    hoja.className = 'deseo-hoja ' + d.tipo;
    if (d.tipo === 'carta') {
      const c = CARTAS[d.indice];
      titulo.textContent = c.titulo || 'Una carta para ti';
      texto.textContent = c.texto;
    } else {
      titulo.textContent = 'Kuromi Note · página ' + (d.indice + 1);
      texto.textContent = PAGINAS_KUROMI[d.indice];
    }
    capaDeseo.querySelector('.deseo-encabezado').textContent = conFanfarria
      ? '¡Se cumplió un deseo! · Nota ' + d.n
      : 'Deseo de la Nota ' + d.n;
    capaDeseo.classList.add('visible');
    hoja.scrollTop = 0;
    if (conFanfarria) {
      /* La escala completa, como en la serie: do, re, mi, fa, sol, la, si, do. */
      ESCALA.forEach((f, k) => tocar(f, 0.1 + k * 0.13, 0.13));
      tocar(1318.5, 1.25, 0.12); tocar(1568, 1.25, 0.1); tocar(2093, 1.25, 0.1);
    } else {
      tocar(1318.5, 0, 0.1);
    }
  }
  function cerrarDeseo(conSonido) {
    if (deseoVisible < 0 && !capaDeseo.classList.contains('visible')) return;
    capaDeseo.classList.remove('visible');
    deseoVisible = -1;
    if (conSonido) { tocar(1318.5, 0, 0.09); tocar(987.77, 0.07, 0.09); }
    if (alCerrarDeseo) { const f = alCerrarDeseo; alCerrarDeseo = null; f(); }
  }

  /* La sorpresa del final (la carta de la Nota 100). prueba: no guarda nada. */
  function mostrarSorpresa(prueba, alCerrar) {
    deseoVisible = 999;
    capaDeseo.classList.add('final');
    hoja.className = 'deseo-hoja carta final';
    hoja.querySelector('h3').textContent = SORPRESA_FINAL.titulo;
    hoja.querySelector('p').textContent = SORPRESA_FINAL.texto;
    capaDeseo.querySelector('.deseo-encabezado').textContent = '¡100 Notas Rosas!';
    capaDeseo.classList.add('visible');
    hoja.scrollTop = 0;
    ESCALA.forEach((f, k) => tocar(f, 0.1 + k * 0.12, 0.13));
    [1046.5, 1318.5, 1568, 2093].forEach((f) => tocar(f, 1.15, 0.1));
    if (!prueba && datos.final !== 'visto') { datos.final = 'visto'; guardar(); pintar(); }
    alCerrarDeseo = alCerrar || null;
  }
  capaDeseo.querySelector('[data-cerrar]').addEventListener('click', () => cerrarDeseo(true));
  capaDeseo.addEventListener('click', (e) => { if (e.target === capaDeseo) cerrarDeseo(true); });
  /* Estas ventanas se cierran solas: titulo.js no debe cerrarlas por su cuenta. */
  panel.dataset.propio = '1';
  capaDeseo.dataset.propio = '1';

  /* ---------- Cada cuadro ---------- */

  let proximoRepaso = 0, esperaDeseo = 0, esperaFinal = 0, finalPendiente = false;
  function actualizar(t) {
    if (t > proximoRepaso) {
      proximoRepaso = t + 2;
      if (ponerAlDia() && !silencioso()) decir('¡Un día nuevo, deseos nuevos!');
    }
    /* El deseo se abre cuando nada está a medias, un ratito después del aviso. */
    if (deseosPendientes.length && !silencioso()) {
      if (!esperaDeseo) esperaDeseo = t + 2.2;
      if (t > esperaDeseo && puedeInterrumpir() && !panel.classList.contains('visible') && deseoVisible < 0) {
        esperaDeseo = 0;
        mostrarDeseo(deseosPendientes.shift(), true);
      }
    }
    /* El final, después de los deseos pendientes y cuando nada está a medias. */
    if (finalPendiente && !deseosPendientes.length && deseoVisible < 0 && !silencioso()) {
      if (!esperaFinal) esperaFinal = t + 3;   /* deja ver el aviso del último encargo */
      if (t > esperaFinal && puedeInterrumpir() && !panel.classList.contains('visible') && ctx.empezarFinal) {
        esperaFinal = 0;
        finalPendiente = false;
        ctx.empezarFinal(false);
      }
    }
  }

  /* Al entrar a la casa la primera vez del día, My Melody cuenta sus deseos. */
  function anunciar() {
    ponerAlDia();
    if (datos.anunciado === hoy() || silencioso()) return;
    datos.anunciado = hoy();
    guardar();
    const pendientes = datos.lista.filter((e) => !e.hecho).length;
    if (!pendientes) return;
    setTimeout(() => {
      decir(pendientes === 1 ? 'Hoy me queda un deseo. ¡Míralo en Encargos!' : '¡Hoy tengo ' + pendientes + ' deseos! Están en Encargos.');
      saltito(boton, 'llama');
    }, 5200);
  }

  /* Vuelve a leer lo guardado: después de la prueba del mono loco, descarta lo que la prueba hizo. */
  function recargar() {
    datos = cargar();
    finalPendiente = false;
    esperaFinal = 0;
    deseosPendientes.length = 0;
    esperaDeseo = 0;
    cerrarDeseo(false);
    cerrarPanel(false);
    aviso.classList.remove('visible');
    ponerAlDia();
    pintar();
  }

  /* Para probar: simula que pasó un día (encargos nuevos). */
  function pasarUnDia() {
    if (datos.dia !== null) datos.dia--;
    ponerAlDia();
  }

  /* Solo para la prueba del mono loco (que no guarda): fija la lista y las Notas. */
  function probar(ids, notas) {
    if (!silencioso()) return false;
    datos.lista = ids.filter((id) => porId(id)).slice(0, POR_DIA).map((id) => ({ id, progreso: 0, hecho: false, cuartos: 0 }));
    datos.dia = hoy();
    if (notas !== undefined) datos.notas = notas;
    pintar();
    return true;
  }

  ponerAlDia();
  pintar();
  if (datos.notas >= NOTAS_DEL_FINAL && datos.final !== 'visto') finalPendiente = true;

  return {
    registrar, actualizar, anunciar, abrirPanel, cerrarPanel, cerrarDeseo, recargar, pasarUnDia, probar, mostrarSorpresa,
    finalVisto: () => datos.final === 'visto',
    panelAbierto: () => panel.classList.contains('visible'),
    deseoAbierto: () => deseoVisible >= 0,
    interno: () => ({
      dia: datos.dia, notas: datos.notas,
      lista: datos.lista.map((e) => ({ id: e.id, progreso: e.progreso, meta: porId(e.id).meta, hecho: e.hecho })),
      deseos: datos.deseos.length, pendientes: deseosPendientes.length, final: datos.final, finalPendiente
    })
  };
}
