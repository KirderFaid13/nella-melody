/* Nella Melody · fase 0 · la cocina: comida, refrigerador y hambre.
   Aquí vive la comida: sus modelos 3D, cuánta queda, la bandeja del refri y el
   arrastre hasta la boca. Lo que hace My Melody al comer vive en escena3d.js. */
import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';

/* llena: cuánto le baja el hambre (de 0 a 1). precio: en corazones. paquete: cuántas trae cada compra. */
/* frase: lo que dice al comerla (si no tiene, "¡Gracias!"). postre: cuenta para "algo dulcecito".
   El orden es el del refri: seis por página. */
export const COMIDAS = [
  { id: 'fresas', nombre: 'Fresas', llena: 0.15, precio: 6, paquete: 3, inicial: 3, reaccion: 'normal' },
  { id: 'galletas', nombre: 'Galletas', llena: 0.2, precio: 4, inicial: 3, reaccion: 'normal' },
  { id: 'leche', nombre: 'Leche', llena: 0.1, precio: 3, inicial: 2, reaccion: 'normal' },
  { id: 'matcha', nombre: 'Matcha latte', llena: 0.1, precio: 5, inicial: 1, reaccion: 'normal', frase: '¡Mmm, matcha!' },
  { id: 'pudin', nombre: 'Pudín', llena: 0.3, precio: 8, inicial: 0, reaccion: 'normal', postre: true },
  { id: 'dona', nombre: 'Dona', llena: 0.2, precio: 5, inicial: 1, reaccion: 'normal', frase: '¡Una dona! ¡Qué rica!', postre: true },
  { id: 'pastel', nombre: 'Pastel de almendras', llena: 0.45, precio: 12, inicial: 1, reaccion: 'favorita', postre: true },
  { id: 'chocolate', nombre: 'Pastel de chocolate', llena: 0.35, precio: 9, inicial: 0, reaccion: 'normal', frase: '¡Chocolate! ¡Qué delicia!', postre: true },
  { id: 'cheesecake', nombre: 'Cheesecake de pistacho', llena: 0.35, precio: 10, inicial: 0, reaccion: 'normal', frase: '¡Qué cremoso!', postre: true },
  { id: 'tiramisu', nombre: 'Tiramisú', llena: 0.35, precio: 10, inicial: 0, reaccion: 'normal', frase: '¡Mmm, tiramisú!', postre: true },
  { id: 'rakkyo', nombre: 'Rakkyo', llena: 0.05, precio: 2, inicial: 0, reaccion: 'agria' }
];
const POR_PAGINA = 6;

/* En este tiempo real pasa de llena a muerta de hambre. */
const HORAS_PARA_HAMBRE = 8;
const CLAVE = 'nella-cocina';
const MAXIMO_POR_COMIDA = 99;
/* Distancia a la boca, en anchos de pantalla: para abrir la boca y para comer. */
const DISTANCIA_PARA_ABRIR = 0.16;
const DISTANCIA_PARA_COMER = 0.09;

export function crearCocina(ctx) {
  const { pintura, parte, elipsoide, tinta, marco, personaje, tocar, puertaRefri } = ctx;
  const T = THREE;

  /* ---------- Datos guardados ---------- */

  function datosNuevos() {
    const d = { version: 1, inventario: {}, hambre: 0.35, actualizado: Date.now() };
    COMIDAS.forEach((c) => { d.inventario[c.id] = c.inicial; });
    return d;
  }

  /* Lee lo guardado y descarta todo valor raro: nunca confía en lo que hay en disco. */
  function cargar() {
    const base = datosNuevos();
    let d = null;
    try { d = JSON.parse(localStorage.getItem(CLAVE) || 'null'); } catch (err) { d = null; }
    if (!d || typeof d !== 'object' || d.version !== 1) return base;
    const h = Number(d.hambre);
    if (Number.isFinite(h)) base.hambre = Math.min(1, Math.max(0, h));
    const a = Number(d.actualizado);
    if (Number.isFinite(a)) base.actualizado = a;
    COMIDAS.forEach((c) => {
      const n = Math.floor(Number(d.inventario && d.inventario[c.id]));
      if (Number.isFinite(n) && n >= 0) base.inventario[c.id] = Math.min(MAXIMO_POR_COMIDA, n);
    });
    return base;
  }

  const datos = cargar();
  function guardar() {
    try { localStorage.setItem(CLAVE, JSON.stringify(datos)); } catch (err) { /* sin almacenamiento */ }
  }

  /* El hambre sube con el tiempo real. Si el reloj del aparato va para atrás no pasa
     nada, y nunca se suman más de tres días de golpe. */
  function ponerAlDia() {
    const ahora = Date.now();
    const pasado = Math.min(3 * 86400000, Math.max(0, ahora - datos.actualizado));
    datos.hambre = Math.min(1, datos.hambre + pasado / (HORAS_PARA_HAMBRE * 3600000));
    datos.actualizado = ahora;
  }
  ponerAlDia();
  guardar();

  function sumarHoras(horas) {
    ponerAlDia();
    datos.hambre = Math.min(1, datos.hambre + horas / HORAS_PARA_HAMBRE);
    guardar();
  }
  function llenar() {
    COMIDAS.forEach((c) => { datos.inventario[c.id] = 3; });
    guardar();
    pintarBandeja();
  }
  /* Lo que llega de la tiendita o de la canasta de mamá. */
  function agregar(id, n) {
    if (datos.inventario[id] === undefined || !(n > 0)) return;
    datos.inventario[id] = Math.min(MAXIMO_POR_COMIDA, datos.inventario[id] + Math.floor(n));
    guardar();
    pintarBandeja();
  }
  const hayComida = () => COMIDAS.some((c) => datos.inventario[c.id] > 0);

  /* ---------- Modelos 3D de la comida ---------- */

  /* Para formas con relieve (la galleta): copia oscura un poco más grande, por detrás. */
  function conContorno(geo, material, factor) {
    const g = new T.Group();
    const m = new T.Mesh(geo, material);
    m.castShadow = true;
    g.add(m);
    const borde = new T.Mesh(geo, tinta);
    borde.scale.setScalar(factor);
    g.add(borde);
    return g;
  }
  function corazon(s) {
    const f = new T.Shape();
    f.moveTo(0, 0.25 * s);
    f.bezierCurveTo(0, 0.5 * s, -0.5 * s, 0.5 * s, -0.5 * s, 0.12 * s);
    f.bezierCurveTo(-0.5 * s, -0.18 * s, -0.12 * s, -0.36 * s, 0, -0.55 * s);
    f.bezierCurveTo(0.12 * s, -0.36 * s, 0.5 * s, -0.18 * s, 0.5 * s, 0.12 * s);
    f.bezierCurveTo(0.5 * s, 0.5 * s, 0, 0.5 * s, 0, 0.25 * s);
    return f;
  }
  /* Angosta la forma hacia abajo (fresa) o hacia arriba (cebollita). */
  function afinar(geo, alto, cuanto, haciaArriba) {
    const p = geo.attributes.position;
    for (let i = 0; i < p.count; i++) {
      const y = p.getY(i);
      if (haciaArriba ? y > 0 : y < 0) {
        const k = 1 - (Math.abs(y) / alto) * cuanto;
        p.setX(i, p.getX(i) * k);
        p.setZ(i, p.getZ(i) * k);
      }
    }
    geo.computeVertexNormals();
    return geo;
  }

  /* Rebanada triangular sobre un plato: capas = [[color, alto], ...] de abajo hacia arriba. */
  function rebanada(capas, adornar) {
    const g = new T.Group();
    const plato = parte(new T.CylinderGeometry(0.3, 0.28, 0.04, 28), pintura(0xffffff), 0.015);
    plato.position.y = -0.15;
    g.add(plato);
    const cuna = new T.Shape();
    cuna.moveTo(-0.22, 0);
    cuna.lineTo(0.22, -0.15);
    cuna.quadraticCurveTo(0.26, 0, 0.22, 0.15);
    cuna.closePath();
    capas.reduce((y, [color, alto]) => {
      const geo = new T.ExtrudeGeometry(cuna, { depth: alto, bevelEnabled: true, bevelThickness: 0.008, bevelSize: 0.008, bevelSegments: 2 });
      geo.rotateX(-Math.PI / 2);
      const capa = conContorno(geo, pintura(color), 1.04);
      capa.position.y = y;
      g.add(capa);
      return y + alto;
    }, -0.13);
    if (adornar) adornar(g);
    g.rotation.y = -0.5;
    return g;
  }

  const MODELOS = {
    fresas() {
      const g = new T.Group();
      [[-0.14, 0, 0.04, 0.25], [0.14, 0.02, 0.02, -0.25], [0, 0.06, -0.1, 0]].forEach(([x, y, z, giro]) => {
        const f = new T.Group();
        f.position.set(x, y, z);
        f.rotation.z = giro;
        f.add(parte(afinar(elipsoide(0.13, 0.16, 0.13, 20, 14), 0.16, 0.5), pintura(0xff4f6d), 0.02));
        const hojas = parte(elipsoide(0.1, 0.035, 0.1, 14, 8), pintura(0x7cc47a), 0.015);
        hojas.position.y = 0.15;
        f.add(hojas);
        g.add(f);
      });
      return g;
    },
    galletas() {
      const g = new T.Group();
      const geo = new T.ExtrudeGeometry(corazon(0.5), { depth: 0.07, bevelEnabled: true, bevelThickness: 0.025, bevelSize: 0.025, bevelSegments: 3 });
      geo.center();
      g.add(conContorno(geo, pintura(0xf2c38b), 1.07));
      const glaseado = new T.ExtrudeGeometry(corazon(0.36), { depth: 0.02, bevelEnabled: true, bevelThickness: 0.01, bevelSize: 0.01, bevelSegments: 2 });
      glaseado.center();
      const capa = new T.Mesh(glaseado, pintura(0xff9cc4));
      capa.position.z = 0.065;
      g.add(capa);
      g.rotation.x = -0.35;
      return g;
    },
    leche() {
      const g = new T.Group();
      g.add(parte(new T.CylinderGeometry(0.12, 0.13, 0.32, 24), pintura(0xffffff), 0.02));
      const cuello = parte(new T.CylinderGeometry(0.07, 0.11, 0.1, 20), pintura(0xffffff), 0.02);
      cuello.position.y = 0.2;
      g.add(cuello);
      const tapa = parte(new T.CylinderGeometry(0.075, 0.075, 0.06, 20), pintura(0xff86b6), 0.015);
      tapa.position.y = 0.28;
      g.add(tapa);
      const etiqueta = new T.Mesh(new T.CylinderGeometry(0.134, 0.134, 0.12, 24, 1, true), pintura(0xffc4d8));
      etiqueta.position.y = -0.02;
      g.add(etiqueta);
      return g;
    },
    pudin() {
      const g = new T.Group();
      const plato = parte(new T.CylinderGeometry(0.26, 0.24, 0.04, 28), pintura(0xffffff), 0.015);
      plato.position.y = -0.14;
      g.add(plato);
      g.add(parte(new T.CylinderGeometry(0.15, 0.19, 0.22, 28), pintura(0xffd36b), 0.02));
      const caramelo = new T.Mesh(new T.CylinderGeometry(0.152, 0.152, 0.04, 28), pintura(0xc8742e));
      caramelo.position.y = 0.11;
      g.add(caramelo);
      const crema = parte(elipsoide(0.1, 0.07, 0.1, 16, 10), pintura(0xffffff), 0.015);
      crema.position.y = 0.16;
      g.add(crema);
      const cereza = parte(elipsoide(0.05, 0.05, 0.05, 12, 8), pintura(0xff4f6d), 0.012);
      cereza.position.y = 0.24;
      g.add(cereza);
      return g;
    },
    pastel() {
      const g = new T.Group();
      const plato = parte(new T.CylinderGeometry(0.3, 0.28, 0.04, 28), pintura(0xffffff), 0.015);
      plato.position.y = -0.15;
      g.add(plato);
      g.add(parte(new RoundedBoxGeometry(0.42, 0.24, 0.26, 3, 0.05), pintura(0xf6d58e), 0.02));
      const costra = parte(new RoundedBoxGeometry(0.44, 0.06, 0.28, 2, 0.025), pintura(0xd8963f), 0.015);
      costra.position.y = 0.14;
      g.add(costra);
      [[-0.12, 0.02], [0.02, -0.05], [0.14, 0.04]].forEach(([x, z], i) => {
        const almendra = parte(elipsoide(0.06, 0.02, 0.035, 12, 8), pintura(0xf3d9b1), 0.01);
        almendra.position.set(x, 0.18, z);
        almendra.rotation.y = i;
        g.add(almendra);
      });
      return g;
    },
    /* Vaso transparente con matcha verde, leche arriba y pajita rosa. El vaso no lleva
       contorno de tinta (se vería negro por dentro): lo dibujan dos aros finos. */
    matcha() {
      const g = new T.Group();
      const verdeMatcha = parte(new T.CylinderGeometry(0.118, 0.1, 0.24, 28), pintura(0x8cc06a), 0);
      verdeMatcha.position.y = -0.05;
      g.add(verdeMatcha);
      const leche = new T.Mesh(new T.CylinderGeometry(0.12, 0.118, 0.07, 28), pintura(0xf2f6e4));
      leche.position.y = 0.105;
      g.add(leche);
      [[-0.04, 0.02], [0.05, -0.03]].forEach(([x, z], i) => {
        const hielo = new T.Mesh(new RoundedBoxGeometry(0.07, 0.07, 0.07, 2, 0.015), pintura(0xf4fbff, { transparent: true, opacity: 0.85 }));
        hielo.position.set(x, 0.13, z);
        hielo.rotation.set(0.4 * i, 0.6, 0.2);
        g.add(hielo);
      });
      const pajita = parte(new T.CylinderGeometry(0.018, 0.018, 0.5, 12), pintura(0xff86b6), 0.01);
      pajita.position.set(0.04, 0.16, 0);
      pajita.rotation.z = -0.25;
      g.add(pajita);
      const vaso = new T.Mesh(new T.CylinderGeometry(0.14, 0.12, 0.38, 32, 1, true),
        pintura(0xeaf6ff, { transparent: true, opacity: 0.35, depthWrite: false, side: T.DoubleSide }));
      g.add(vaso);
      const fondo = new T.Mesh(new T.CylinderGeometry(0.12, 0.12, 0.03, 28), pintura(0xeaf6ff, { transparent: true, opacity: 0.5 }));
      fondo.position.y = -0.18;
      g.add(fondo);
      [[0.14, 0.19], [0.12, -0.19]].forEach(([radio, y]) => {
        const aro = new T.Mesh(new T.TorusGeometry(radio, 0.008, 6, 40), tinta);
        aro.rotation.x = Math.PI / 2;
        aro.position.y = y;
        g.add(aro);
      });
      return g;
    },
    /* Rebanada triangular de torta: capas de abajo hacia arriba. */
    cheesecake() {
      return rebanada([[0xd8a05a, 0.05], [0xfff1c9, 0.15], [0xb9d98b, 0.045]], (g) => {
        [[0.12, 0.02], [0.2, -0.03], [0.27, 0.02]].forEach(([x, z]) => {
          const pistacho = parte(elipsoide(0.03, 0.02, 0.022, 10, 6), pintura(0x7fb35a), 0.008);
          pistacho.position.set(x - 0.2, 0.135, z);
          g.add(pistacho);
        });
      });
    },
    chocolate() {
      return rebanada([[0x7a4a35, 0.08], [0xf6d3b8, 0.035], [0x7a4a35, 0.08], [0x5a3226, 0.03]], (g) => {
        const crema = parte(elipsoide(0.06, 0.045, 0.06, 12, 8), pintura(0xfff6ee), 0.012);
        crema.position.set(0.08, 0.17, 0);
        g.add(crema);
        const cereza = parte(elipsoide(0.04, 0.04, 0.04, 12, 8), pintura(0xff4f6d), 0.01);
        cereza.position.set(0.08, 0.23, 0);
        g.add(cereza);
      });
    },
    tiramisu() {
      const g = new T.Group();
      const plato = parte(new T.CylinderGeometry(0.3, 0.28, 0.04, 28), pintura(0xffffff), 0.015);
      plato.position.y = -0.15;
      g.add(plato);
      [[0xe9c48f, 0.06], [0xfff3df, 0.055], [0xe9c48f, 0.06], [0xfff3df, 0.055]].reduce((y, [color, alto]) => {
        const capa = parte(new RoundedBoxGeometry(0.38, alto, 0.28, 2, Math.min(0.02, alto / 2 - 0.002)), pintura(color), 0.012);
        capa.position.y = y + alto / 2;
        g.add(capa);
        return y + alto;
      }, -0.13);
      const cacao = parte(new RoundedBoxGeometry(0.39, 0.02, 0.29, 2, 0.008), pintura(0x8a5a3c), 0.01);
      cacao.position.y = 0.11;
      g.add(cacao);
      const corazonCacao = new T.Mesh(new T.ShapeGeometry(corazon(0.12)), new T.MeshBasicMaterial({ color: 0xfff3df }));
      corazonCacao.rotation.x = -Math.PI / 2;
      corazonCacao.position.y = 0.122;
      g.add(corazonCacao);
      return g;
    },
    dona() {
      const g = new T.Group();
      const masa = parte(new T.TorusGeometry(0.17, 0.085, 18, 36), pintura(0xe8b06a), 0.018);
      masa.rotation.x = -Math.PI / 2;
      g.add(masa);
      const glaseado = new T.Mesh(new T.TorusGeometry(0.17, 0.08, 18, 36, Math.PI * 2), pintura(0xff9cc4));
      glaseado.rotation.x = -Math.PI / 2;
      glaseado.scale.set(1.02, 1.02, 0.75);
      glaseado.position.y = 0.025;
      g.add(glaseado);
      [0xffffff, 0xffd43b, 0x9fd8ff, 0xc9a7ff, 0x7cc47a, 0xffffff, 0xffd43b, 0x9fd8ff].forEach((color, i) => {
        const a = i * 0.785 + 0.3, radio = 0.17 + (i % 2 ? 0.035 : -0.035);
        const chispita = new T.Mesh(new T.CapsuleGeometry(0.009, 0.035, 3, 6), pintura(color));
        chispita.position.set(Math.cos(a) * radio, 0.09, Math.sin(a) * radio);
        chispita.rotation.set(Math.PI / 2, 0, a * 2);
        g.add(chispita);
      });
      g.rotation.x = 0.35;
      return g;
    },
    rakkyo() {
      const g = new T.Group();
      const tazon = parte(elipsoide(0.24, 0.12, 0.24, 24, 12), pintura(0xbfe0ff), 0.02);
      tazon.position.y = -0.06;
      g.add(tazon);
      [[-0.08, 0.02], [0.08, 0.03], [0, -0.06]].forEach(([x, z]) => {
        const cebollita = parte(afinar(elipsoide(0.07, 0.09, 0.07, 14, 10), 0.09, 0.6, true), pintura(0xf7f1d6), 0.012);
        cebollita.position.set(x, 0.07, z);
        g.add(cebollita);
      });
      return g;
    }
  };

  function liberar(objeto) {
    objeto.traverse((n) => {
      if (n.geometry) n.geometry.dispose();
      if (n.material && n.material !== tinta) n.material.dispose();
    });
  }

  /* Los íconos de la bandeja son fotos de los mismos modelos, así todo combina. */
  function fotografiar() {
    const tam = 160;
    const lienzo = document.createElement('canvas');
    lienzo.width = lienzo.height = tam;
    let r;
    try { r = new T.WebGLRenderer({ canvas: lienzo, alpha: true, antialias: true, preserveDrawingBuffer: true }); } catch (err) { return {}; }
    r.setPixelRatio(1);
    r.setSize(tam, tam, false);
    const esc = new T.Scene();
    esc.add(new T.HemisphereLight(0xffffff, 0xf5cdb8, 2.4));
    const luz = new T.DirectionalLight(0xffffff, 1.4);
    luz.position.set(-2, 3, 4);
    esc.add(luz);
    const cam = new T.PerspectiveCamera(30, 1, 0.01, 50);
    const fotos = {};
    COMIDAS.forEach((c) => {
      const m = MODELOS[c.id]();
      esc.add(m);
      const esfera = new T.Box3().setFromObject(m).getBoundingSphere(new T.Sphere());
      const dist = (esfera.radius / Math.sin(T.MathUtils.degToRad(15))) * 1.02;
      cam.position.copy(esfera.center).add(new T.Vector3(0, 0.35, 1).setLength(dist));
      cam.lookAt(esfera.center);
      r.render(esc, cam);
      fotos[c.id] = lienzo.toDataURL('image/png');
      esc.remove(m);
      liberar(m);
    });
    r.dispose();
    r.forceContextLoss();
    return fotos;
  }
  const iconos = fotografiar();

  /* ---------- Bandeja del refri ---------- */

  const bandeja = document.createElement('div');
  bandeja.id = 'bandeja';
  bandeja.innerHTML = '<div class="bandeja-cabeza"><span>El refri</span>' +
    '<span class="bandeja-acciones"><button type="button" class="bandeja-tienda">Tiendita</button>' +
    '<button type="button" class="bandeja-cerrar" aria-label="Cerrar el refri">✕</button></span></div>' +
    '<div class="bandeja-cuerpo"><button type="button" class="bandeja-flecha" data-paso="-1" aria-label="Página anterior">‹</button>' +
    '<div class="bandeja-lista"></div>' +
    '<button type="button" class="bandeja-flecha" data-paso="1" aria-label="Página siguiente">›</button></div>' +
    '<div class="bandeja-pista">Arrastra la comida hasta su boca</div>';
  marco.appendChild(bandeja);
  const lista = bandeja.querySelector('.bandeja-lista');
  const tarjetas = {};
  COMIDAS.forEach((c) => {
    const el = document.createElement('div');
    el.className = 'tarjeta-comida';
    el.dataset.id = c.id;
    el.innerHTML = '<img alt="" draggable="false"><span class="cuenta"></span><span class="nombre"></span>';
    el.querySelector('img').src = iconos[c.id] || '';
    el.querySelector('.nombre').textContent = c.nombre;
    el.addEventListener('pointerdown', (e) => empezarArrastre(e, c, el));
    lista.appendChild(el);
    tarjetas[c.id] = el;
  });
  bandeja.querySelector('.bandeja-cerrar').addEventListener('click', () => cerrarRefri(true));
  /* Páginas del refri: seis comidas por página, con flechas a los costados. */
  const paginas = Math.ceil(COMIDAS.length / POR_PAGINA);
  let pagina = 0;
  const flechas = Array.from(bandeja.querySelectorAll('.bandeja-flecha'));
  function mostrarPagina(n) {
    pagina = Math.max(0, Math.min(paginas - 1, n));
    COMIDAS.forEach((c, i) => { tarjetas[c.id].hidden = Math.floor(i / POR_PAGINA) !== pagina; });
    flechas.forEach((f) => { f.disabled = (+f.dataset.paso < 0 && pagina === 0) || (+f.dataset.paso > 0 && pagina === paginas - 1); });
  }
  flechas.forEach((f) => f.addEventListener('click', () => {
    if (f.disabled) return;
    mostrarPagina(pagina + Number(f.dataset.paso));
    tocar(1318.5, 0, 0.07);
  }));
  mostrarPagina(0);
  bandeja.querySelector('.bandeja-tienda').addEventListener('click', () => { if (ctx.abrirTienda) ctx.abrirTienda(); });

  function pintarBandeja() {
    COMIDAS.forEach((c) => {
      const n = datos.inventario[c.id], el = tarjetas[c.id];
      el.querySelector('.cuenta').textContent = n > 0 ? '×' + n : 'Agotado';
      el.classList.toggle('agotada', n <= 0);
    });
  }
  pintarBandeja();

  /* ---------- Refrigerador ---------- */

  let abierto = false, anguloPuerta = 0, relojGuardado = 0;

  function abrirRefri() {
    if (abierto) return;
    abierto = true;
    ponerAlDia();
    pintarBandeja();
    marco.classList.add('refri-abierto');
    tocar(1046.5, 0, 0.1);
    tocar(1568, 0.08, 0.08);
    if (ctx.alAbrirRefri) ctx.alAbrirRefri();
  }

  function cerrarRefri(conSonido) {
    if (!abierto) return;
    abierto = false;
    cancelarArrastre();
    marco.classList.remove('refri-abierto');
    if (conSonido) { tocar(1318.5, 0, 0.09); tocar(987.77, 0.07, 0.09); }
  }

  function actualizar(dt) {
    /* La puerta gira sobre su bisagra hacia el frente. */
    anguloPuerta += ((abierto ? -1.9 : 0) - anguloPuerta) * (1 - Math.exp(-dt * 10));
    puertaRefri.rotation.y = anguloPuerta;
    relojGuardado += dt;
    if (relojGuardado > 10) { relojGuardado = 0; ponerAlDia(); guardar(); }
  }

  /* ---------- Arrastrar comida hasta la boca ---------- */

  let arrastre = null;

  function empezarArrastre(e, comida, tarjeta) {
    if (!abierto || arrastre) return;
    /* Si está agotada, tocarla lleva a la tiendita con esa comida a la vista. */
    if (datos.inventario[comida.id] <= 0) { if (ctx.abrirTienda) ctx.abrirTienda(comida.id); return; }
    e.preventDefault();
    try { tarjeta.setPointerCapture(e.pointerId); } catch (err) { /* puntero simulado */ }
    const fantasma = document.createElement('img');
    fantasma.className = 'fantasma';
    fantasma.alt = '';
    fantasma.src = iconos[comida.id] || '';
    marco.appendChild(fantasma);
    arrastre = { comida, fantasma, tarjeta, id: e.pointerId, distancia: 1 };
    moverFantasma(e.clientX, e.clientY);
    tocar(1318.5, 0, 0.07);
  }

  function moverFantasma(x, y) {
    const caja = marco.getBoundingClientRect();
    arrastre.fantasma.style.left = (x - caja.left) + 'px';
    arrastre.fantasma.style.top = (y - caja.top) + 'px';
    const boca = personaje.bocaEnPantalla();
    arrastre.distancia = Math.hypot(x - boca.x, y - boca.y) / caja.width;
    personaje.anticipar(arrastre.distancia < DISTANCIA_PARA_ABRIR);
  }

  function soltarComida(x, y) {
    const a = arrastre;
    moverFantasma(x, y);
    arrastre = null;
    personaje.anticipar(false);
    let resultado = 'lejos';
    if (a.distancia < DISTANCIA_PARA_COMER) {
      ponerAlDia();
      resultado = personaje.comer(a.comida, () => MODELOS[a.comida.id]());
      if (resultado === 'come') {
        datos.inventario[a.comida.id] = Math.max(0, datos.inventario[a.comida.id] - 1);
        datos.hambre = Math.max(0, datos.hambre - a.comida.llena);
        guardar();
        pintarBandeja();
      }
    }
    if (resultado === 'come') { a.fantasma.remove(); return; }
    /* Si no la comió, la comida vuelve a su tarjeta sin gastarse. */
    const caja = marco.getBoundingClientRect(), t = a.tarjeta.getBoundingClientRect();
    a.fantasma.classList.add('volviendo');
    a.fantasma.style.left = (t.left + t.width / 2 - caja.left) + 'px';
    a.fantasma.style.top = (t.top + t.height / 2 - caja.top) + 'px';
    setTimeout(() => a.fantasma.remove(), 320);
  }

  function cancelarArrastre() {
    if (!arrastre) return;
    personaje.anticipar(false);
    arrastre.fantasma.remove();
    arrastre = null;
  }

  window.addEventListener('pointermove', (e) => { if (arrastre && e.pointerId === arrastre.id) moverFantasma(e.clientX, e.clientY); });
  window.addEventListener('pointerup', (e) => { if (arrastre && e.pointerId === arrastre.id) soltarComida(e.clientX, e.clientY); });
  window.addEventListener('pointercancel', (e) => { if (arrastre && e.pointerId === arrastre.id) cancelarArrastre(); });

  /* Guarda al salir o al pasar a segundo plano. */
  window.addEventListener('pagehide', () => { ponerAlDia(); guardar(); });
  document.addEventListener('visibilitychange', () => { if (document.hidden) { ponerAlDia(); guardar(); } });

  /* Botones de prueba en Opciones. */
  const botonLlenar = document.getElementById('btn-llenar');
  if (botonLlenar) botonLlenar.addEventListener('click', llenar);
  const botonHambre = document.getElementById('btn-hambre');
  if (botonHambre) botonHambre.addEventListener('click', () => sumarHoras(4));

  return {
    actualizar, abrirRefri, cerrarRefri, llenar, sumarHoras, agregar, hayComida,
    icono: (id) => iconos[id] || '',
    refriAbierto: () => abierto,
    pagina: () => pagina,
    mostrarPagina,
    arrastrando: () => !!arrastre,
    hambre: () => datos.hambre,
    inventario: () => Object.assign({}, datos.inventario)
  };
}
