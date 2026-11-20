/* Nella Melody · fase 0 · corazones y tiendita.
   Los corazones son la moneda: salen al darle cariño (con tope diario) y con el
   regalo de cada día. Se gastan en la tiendita, y lo comprado llega al instante
   al refri. Si se queda sin comida y sin corazones, llega gratis la canasta de mamá. */

const CLAVE = 'nella-corazones';
const INICIALES = 30;
/* Regalo diario con racha: 15 ♥ el primer día y 3 más por cada día seguido, hasta 30.
   Si un día no entra, la racha vuelve a empezar (sin quitarle nada). Premia volver cada
   día; los topes diarios evitan juntar todo en un solo día. */
const REGALO_DIARIO = 15;
const REGALO_POR_RACHA = 3;
const REGALO_MAXIMO = 30;
/* Cuántos corazones se pueden juntar por día de cada forma. */
const TOPES = { caricias: 25, columpio: 15 };
const MAXIMO = 9999;
/* La canasta llega si tiene hambre, no hay nada en el refri y no alcanza para lo más barato que llena. */
const PRECIO_MINIMO_UTIL = 3;

function claveDeFecha(d) {
  return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
}
/* Fecha del día anterior (por calendario, sin problemas con el horario de verano). */
function claveDeAyer() {
  const d = new Date();
  return claveDeFecha(new Date(d.getFullYear(), d.getMonth(), d.getDate() - 1));
}

export function crearTienda(ctx) {
  const { marco, tocar, cocina, decir, comidas, puntoDeElla } = ctx;
  const hoy = () => claveDeFecha(new Date());

  /* ---------- Datos guardados ---------- */

  function cargar() {
    const base = { version: 1, corazones: INICIALES, dia: hoy(), ganadosHoy: {}, regaloDe: '', canastaDe: '', racha: 0 };
    let d = null;
    try { d = JSON.parse(localStorage.getItem(CLAVE) || 'null'); } catch (err) { d = null; }
    if (!d || typeof d !== 'object' || d.version !== 1) return base;
    const c = Math.floor(Number(d.corazones));
    if (Number.isFinite(c) && c >= 0) base.corazones = Math.min(MAXIMO, c);
    if (typeof d.dia === 'string') base.dia = d.dia;
    if (d.ganadosHoy && typeof d.ganadosHoy === 'object') {
      Object.keys(TOPES).forEach((k) => {
        const n = Math.floor(Number(d.ganadosHoy[k]));
        if (Number.isFinite(n) && n >= 0) base.ganadosHoy[k] = Math.min(TOPES[k], n);
      });
    }
    if (typeof d.regaloDe === 'string') base.regaloDe = d.regaloDe;
    if (typeof d.canastaDe === 'string') base.canastaDe = d.canastaDe;
    const racha = Math.floor(Number(d.racha));
    if (Number.isFinite(racha) && racha >= 0) base.racha = Math.min(1000, racha);
    return base;
  }
  const datos = cargar();
  function guardar() {
    try { localStorage.setItem(CLAVE, JSON.stringify(datos)); } catch (err) { /* sin almacenamiento */ }
  }
  /* Los topes diarios se reinician cuando cambia la fecha del calendario. */
  function ponerAlDia() {
    if (datos.dia !== hoy()) { datos.dia = hoy(); datos.ganadosHoy = {}; guardar(); }
  }
  ponerAlDia();
  guardar();

  /* ---------- Contador de arriba y corazones voladores ---------- */

  const contador = document.getElementById('contador-corazones');
  const numero = contador ? contador.querySelector('span') : null;
  /* Corazones ya sumados que todavía van volando hacia el contador. */
  let enVuelo = 0;

  function pintarContador() {
    if (numero) numero.textContent = String(Math.max(0, datos.corazones - enVuelo));
    pintarTienda();
  }
  function saltito(el, clase) {
    if (!el) return;
    el.classList.remove(clase);
    void el.offsetWidth;   /* reinicia la animación */
    el.classList.add(clase);
  }

  /* Hace volar hasta 6 corazones desde 'desde' (puntos de pantalla) al contador. */
  function volar(total, desde, retraso) {
    if (!contador || total <= 0 || (ctx.silencioso && ctx.silencioso())) { pintarContador(); return; }
    enVuelo += total;
    pintarContador();
    const piezas = Math.min(6, total);
    let restan = total;
    for (let i = 0; i < piezas; i++) {
      const valor = i === piezas - 1 ? restan : Math.floor(total / piezas);
      restan -= valor;
      setTimeout(() => lanzarCorazon(valor, desde), (retraso || 0) + i * 90);
    }
  }

  function lanzarCorazon(valor, desde) {
    const caja = marco.getBoundingClientRect();
    const destino = contador.getBoundingClientRect();
    const x0 = (desde ? desde.x : caja.left + caja.width / 2) - caja.left + (Math.random() - 0.5) * 30;
    const y0 = (desde ? desde.y : caja.top + caja.height / 2) - caja.top + (Math.random() - 0.5) * 20;
    const x1 = destino.left + destino.width * 0.2 - caja.left;
    const y1 = destino.top + destino.height / 2 - caja.top;
    const el = document.createElement('div');
    el.className = 'corazon-volador';
    el.style.left = x0 + 'px';
    el.style.top = y0 + 'px';
    marco.appendChild(el);
    requestAnimationFrame(() => requestAnimationFrame(() => {
      el.style.transform = 'translate(' + (x1 - x0) + 'px,' + (y1 - y0) + 'px) scale(.55)';
    }));
    /* Llega siempre, aunque la animación no corra (pestaña en segundo plano). */
    setTimeout(() => {
      el.remove();
      enVuelo = Math.max(0, enVuelo - valor);
      pintarContador();
      saltito(contador, 'suma');
      tocar(1975.5, 0, 0.04);
    }, 680);
  }

  /* ---------- Ganar y gastar ---------- */

  /* Suma corazones respetando el tope diario de cada origen. Devuelve cuántos sumó. */
  function ganar(origen, n, desde) {
    ponerAlDia();
    let cuantos = Math.max(0, Math.floor(n));
    if (TOPES[origen] !== undefined) cuantos = Math.min(cuantos, TOPES[origen] - (datos.ganadosHoy[origen] || 0));
    cuantos = Math.min(cuantos, MAXIMO - datos.corazones);
    if (cuantos <= 0) return 0;
    if (TOPES[origen] !== undefined) datos.ganadosHoy[origen] = (datos.ganadosHoy[origen] || 0) + cuantos;
    datos.corazones += cuantos;
    guardar();
    volar(cuantos, desde, 250);
    return cuantos;
  }

  function gastar(n) {
    if (!(n > 0) || datos.corazones < n) return false;
    datos.corazones -= n;
    guardar();
    pintarContador();
    saltito(contador, 'resta');
    return true;
  }

  /* El regalo de cada día, al entrar a la casa por primera vez en el día. */
  function regaloDelDia() {
    ponerAlDia();
    if (datos.regaloDe === hoy()) return false;
    datos.racha = datos.regaloDe === claveDeAyer() ? datos.racha + 1 : 1;
    datos.regaloDe = hoy();
    const regalo = Math.min(REGALO_MAXIMO, REGALO_DIARIO + REGALO_POR_RACHA * (datos.racha - 1));
    datos.corazones = Math.min(MAXIMO, datos.corazones + regalo);
    guardar();
    const frase = datos.racha >= 2 ? '¡' + datos.racha + ' días seguidos! Un regalito más grande' : '¡Un regalito para hoy!';
    setTimeout(() => decir(frase), 2600);
    volar(regalo, puntoDeElla(), 2700);
    return true;
  }

  /* La canasta de mamá: para que nunca quede sin forma de darle de comer. */
  function revisarCanasta() {
    ponerAlDia();
    if (cocina.hayComida() || datos.corazones >= PRECIO_MINIMO_UTIL || cocina.hambre() < 0.5) return false;
    if (datos.canastaDe === hoy()) return false;
    datos.canastaDe = hoy();
    guardar();
    cocina.agregar('fresas', 3);
    cocina.agregar('galletas', 2);
    cocina.agregar('leche', 1);
    decir('¡Llegó la canasta de mamá!');
    [1046.5, 1318.5, 1568, 2093].forEach((f, i) => tocar(f, i * 0.1, 0.1));
    return true;
  }

  /* ---------- Panel de la tiendita ---------- */

  const capa = document.createElement('div');
  capa.id = 'tienda';
  capa.className = 'capa modal';
  capa.innerHTML =
    '<div class="panel panel-tienda">' +
      '<div class="tienda-cabeza"><h2>La tiendita</h2>' +
        '<div class="tienda-saldo"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 20s-7.5-4.6-7.5-10A4.3 4.3 0 0 1 12 7.4 4.3 4.3 0 0 1 19.5 10c0 5.4-7.5 10-7.5 10z"/></svg><span></span></div>' +
      '</div>' +
      '<div class="tienda-lista"></div>' +
      '<div class="botones"><button class="boton-ui secundario" type="button" data-cerrar>Volver</button></div>' +
    '</div>';
  marco.appendChild(capa);
  const lista = capa.querySelector('.tienda-lista');
  const saldo = capa.querySelector('.tienda-saldo span');
  const productos = {};

  comidas.forEach((c) => {
    const el = document.createElement('div');
    el.className = 'producto';
    el.dataset.id = c.id;
    el.innerHTML = '<img alt="" draggable="false"><span class="nombre"></span><span class="tiene"></span>' +
      '<button class="boton-ui comprar" type="button"></button><span class="llego"></span>';
    el.querySelector('img').src = cocina.icono(c.id);
    el.querySelector('.nombre').textContent = c.nombre + ((c.paquete || 1) > 1 ? ' ×' + c.paquete : '');
    el.querySelector('.comprar').addEventListener('click', () => comprar(c.id));
    lista.appendChild(el);
    productos[c.id] = el;
  });

  function pintarTienda() {
    if (!saldo) return;
    saldo.textContent = String(datos.corazones);
    const inventario = cocina.inventario();
    comidas.forEach((c) => {
      const el = productos[c.id], boton = el.querySelector('.comprar');
      const tiene = inventario[c.id] || 0, lleno = tiene + (c.paquete || 1) > 99;
      el.querySelector('.tiene').textContent = 'Tienes ' + tiene;
      if (lleno) { boton.disabled = true; boton.textContent = 'Lleno'; }
      else if (datos.corazones < c.precio) { boton.disabled = true; boton.textContent = 'Faltan ' + (c.precio - datos.corazones) + ' ♥'; }
      else { boton.disabled = false; boton.textContent = c.precio + ' ♥'; }
    });
  }

  /* Compra una comida: cobra, la manda al refri y lo celebra. Devuelve si se pudo. */
  function comprar(id) {
    const c = comidas.find((x) => x.id === id);
    if (!c) return false;
    const paquete = c.paquete || 1;
    if ((cocina.inventario()[id] || 0) + paquete > 99) return false;
    if (!gastar(c.precio)) { tocar(330, 0, 0.08); return false; }
    cocina.agregar(id, paquete);
    const el = productos[id], aviso = el.querySelector('.llego');
    aviso.textContent = '+' + paquete + ' al refri';
    saltito(el, 'comprado');
    saltito(aviso, 'visible');
    tocar(1318.5, 0, 0.1);
    tocar(1760, 0.07, 0.1);
    tocar(2093, 0.14, 0.09);
    pintarTienda();
    return true;
  }

  function abrir(resaltar) {
    ponerAlDia();
    pintarTienda();
    capa.classList.add('visible');
    tocar(1318.5, 0, 0.1);
    tocar(1975.5, 0.07, 0.09);
    if (resaltar && productos[resaltar]) {
      productos[resaltar].scrollIntoView({ block: 'nearest', inline: 'center' });
      saltito(productos[resaltar], 'resaltado');
    }
  }
  function cerrar(conSonido) {
    if (!capa.classList.contains('visible')) return;
    capa.classList.remove('visible');
    if (conSonido) { tocar(1318.5, 0, 0.09); tocar(987.77, 0.07, 0.09); }
  }
  capa.querySelector('[data-cerrar]').addEventListener('click', () => cerrar(true));
  capa.addEventListener('click', (e) => { if (e.target === capa) cerrar(true); });

  pintarContador();

  return {
    ganar, gastar, comprar, abrir, cerrar, regaloDelDia, revisarCanasta,
    abierta: () => capa.classList.contains('visible'),
    corazones: () => datos.corazones,
    ganadosHoy: () => Object.assign({}, datos.ganadosHoy),
    racha: () => datos.racha,
    topes: TOPES
  };
}
