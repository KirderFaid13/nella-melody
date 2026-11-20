/* Nella Melody · fase 0 · el patio: flores con regadera, ramo para la sala y Kuromi espiando.
   Aquí viven el cantero (las plantas crecen con los días reales, una etapa por cada día
   que las riegas), la regadera que se arrastra desde su botón, el ramo que se corta cuando
   florecen y va al florero de la sala, y Kuromi, que a veces se asoma por la cerca.
   El columpio vive en escena3d.js porque mueve a My Melody.

   Ciclo de las flores: brote → hojitas → capullo → flor → flor grande (un riego por día).
   Florecidas, se cortan para hacer un ramo: el cantero vuelve a hojitas y empieza otra vuelta.
   El ramo del florero dura unos días y después se marchita, y entonces se hace otro.
   Sin riego: a los 2 días se ponen mustias; a los 5, secas. Secas no crecen ese día: el riego
   las revive. Nunca se mueren ni pierden etapas. */
import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';

const CLAVE = 'nella-patio';
const ETAPA_MAXIMA = 4;           /* 0 brote · 1 hojitas · 2 capullo · 3 flor · 4 flor grande */
const DIAS_PARA_MARCHITARSE = 2;  /* sin riego se ponen mustias, pero nunca se mueren */
const DIAS_PARA_SECARSE = 5;      /* sin riego por mucho tiempo, se secan (el riego las revive) */
const DIAS_DEL_RAMO = 5;          /* el ramo del florero está fresco 5 días… */
const DIAS_DEL_RAMO_SECO = 7;     /* …mustio hasta el 7 y después seco */
const PREMIO_RAMO = 5;
const SEGUNDOS_DE_RIEGO = 1.2;
const PREMIO_FLORES = 2;
const PREMIO_KUROMI = 3;

/* Día local como número entero: cambia a medianoche del aparato. */
function hoy() {
  const ahora = new Date();
  return Math.floor((ahora.getTime() - ahora.getTimezoneOffset() * 60000) / 86400000);
}

export function crearPatio(ctx) {
  const { pintura, parte, elipsoide, marco, lienzo, camara, grupo, grupoSala, tocar, decir, feliz, chispa,
    texturaGota, texturaBrillo, sonarAgua, ganar, mirarA, prepararProyeccion } = ctx;
  const T = THREE;

  /* ---------- Datos guardados ---------- */

  function cargar() {
    const base = { version: 1, etapa: 1, diaRiego: null, diaKuromi: null, diaRamo: null, ramos: 0 };
    let d = null;
    try { d = JSON.parse(localStorage.getItem(CLAVE) || 'null'); } catch (err) { d = null; }
    if (!d || typeof d !== 'object' || d.version !== 1) return base;
    const e = Math.floor(Number(d.etapa));
    if (Number.isFinite(e)) base.etapa = Math.max(0, Math.min(ETAPA_MAXIMA, e));
    const r = Math.floor(Number(d.diaRiego));
    if (d.diaRiego !== null && Number.isFinite(r) && r <= hoy()) base.diaRiego = r;
    const k = Math.floor(Number(d.diaKuromi));
    if (d.diaKuromi !== null && Number.isFinite(k) && k <= hoy()) base.diaKuromi = k;
    const dr = Math.floor(Number(d.diaRamo));
    if (d.diaRamo !== null && d.diaRamo !== undefined && Number.isFinite(dr) && dr <= hoy()) base.diaRamo = dr;
    const n = Math.floor(Number(d.ramos));
    if (Number.isFinite(n) && n >= 0) base.ramos = Math.min(100000, n);
    return base;
  }
  const datos = cargar();
  function guardar() {
    try { localStorage.setItem(CLAVE, JSON.stringify(datos)); } catch (err) { /* sin almacenamiento */ }
  }
  const regadoHoy = () => datos.diaRiego === hoy();
  const sinRiego = () => (datos.diaRiego === null ? 0 : hoy() - datos.diaRiego);
  const marchitas = () => sinRiego() >= DIAS_PARA_MARCHITARSE;
  const secas = () => sinRiego() >= DIAS_PARA_SECARSE;
  const listasParaRamo = () => datos.etapa === ETAPA_MAXIMA && !secas();
  /* Estado del ramo del florero: 'vacio', 'fresco', 'mustio' o 'seco'. */
  function estadoDelRamo() {
    if (datos.diaRamo === null) return 'vacio';
    const dias = hoy() - datos.diaRamo;
    return dias < DIAS_DEL_RAMO ? 'fresco' : dias < DIAS_DEL_RAMO_SECO ? 'mustio' : 'seco';
  }

  /* ---------- Cantero y plantas ---------- */

  const CANTERO = { x: -3.2, y: 0.4, z: -3.0, ancho: 3.6, fondo: 1.3 };
  const tierraMojada = new T.Mesh(new T.PlaneGeometry(CANTERO.ancho - 0.25, CANTERO.fondo - 0.25),
    new T.MeshBasicMaterial({ color: 0x7a4a35, transparent: true, opacity: 0, depthWrite: false }));
  tierraMojada.rotation.x = -Math.PI / 2;
  tierraMojada.position.set(CANTERO.x, CANTERO.y + 0.006, CANTERO.z);
  grupo.add(tierraMojada);
  const tierra = new T.Mesh(new T.PlaneGeometry(CANTERO.ancho - 0.25, CANTERO.fondo - 0.25), pintura(0xa8775e));
  tierra.rotation.x = -Math.PI / 2;
  tierra.position.set(CANTERO.x, CANTERO.y + 0.003, CANTERO.z);
  grupo.add(tierra);

  const verde = pintura(0x7cc47a), verdeHoja = pintura(0x8fd58a), amarillo = pintura(0xffd43b);
  const COLORES = [0xff86b6, 0xffffff, 0xc9a7ff, 0xff86b6, 0xffffff];
  const VERDE = new T.Color(0x7cc47a), VERDE_HOJA = new T.Color(0x8fd58a), SECO = new T.Color(0xb3936b), SECO_HOJA = new T.Color(0xc2a878);
  const materialesFlor = [];
  let sequedad = 0;   /* de 0 (sanas) a 1 (secas), cambia suave */
  const plantas = COLORES.map((color, i) => {
    const p = new T.Group();
    p.position.set(CANTERO.x - 1.4 + i * 0.7, CANTERO.y, CANTERO.z + (i % 2 ? 0.12 : -0.08));
    grupo.add(p);
    const geoTallo = new T.CylinderGeometry(0.035, 0.045, 1, 12);
    geoTallo.translate(0, 0.5, 0);
    const tallo = parte(geoTallo, verde, 0.012);
    p.add(tallo);
    const hojas = [-1, 1].map((lado) => {
      const h = parte(elipsoide(0.17, 0.05, 0.08, 16, 10), verdeHoja, 0.012);
      h.rotation.z = lado * 0.5;
      p.add(h);
      return { h, lado };
    });
    const matFlor = pintura(color);
    materialesFlor.push({ m: matFlor, color: new T.Color(color) });
    const capullo = parte(elipsoide(0.09, 0.15, 0.09, 16, 12), matFlor, 0.014);
    p.add(capullo);
    const flor = new T.Group();
    for (let k = 0; k < 5; k++) {
      const a = (k / 5) * Math.PI * 2;
      const petalo = parte(elipsoide(0.13, 0.13, 0.06, 16, 10), matFlor, 0.018);
      petalo.position.set(Math.cos(a) * 0.14, Math.sin(a) * 0.14, 0);
      flor.add(petalo);
    }
    const centro = parte(elipsoide(0.09, 0.09, 0.07, 16, 10), amarillo, 0.018);
    centro.position.z = 0.04;
    flor.add(centro);
    p.add(flor);
    /* Cada planta guarda su forma actual para crecer suave hacia la de su etapa. */
    return { p, tallo, hojas, capullo, flor, extra: (i % 2) * 0.15, alto: 0.1, hoja: 0.4, boton: 0, abierta: 0, caida: 0 };
  });

  function formaDeEtapa(etapa, extra) {
    return [
      { alto: 0.12, hoja: 0.45, boton: 0, abierta: 0 },
      { alto: 0.38 + extra * 0.4, hoja: 1, boton: 0, abierta: 0 },
      { alto: 0.6 + extra * 0.6, hoja: 1, boton: 1, abierta: 0 },
      { alto: 0.75 + extra, hoja: 1, boton: 0, abierta: 0.85 },
      { alto: 0.85 + extra, hoja: 1.1, boton: 0, abierta: 1.2 }
    ][etapa];
  }

  function formarPlantas(dt) {
    const k = dt === undefined ? 1 : 1 - Math.exp(-dt * 3);
    const caer = marchitas() ? 1 : 0;
    plantas.forEach((pl, i) => {
      const meta = formaDeEtapa(datos.etapa, pl.extra);
      pl.alto += (meta.alto - pl.alto) * k;
      pl.hoja += (meta.hoja - pl.hoja) * k;
      pl.boton += (meta.boton - pl.boton) * k;
      pl.abierta += (meta.abierta - pl.abierta) * k;
      pl.caida += (caer - pl.caida) * k;
      pl.tallo.scale.set(1, pl.alto, 1);
      pl.hojas.forEach(({ h, lado }) => {
        h.position.set(lado * 0.13 * pl.hoja, pl.alto * 0.35, 0);
        h.scale.setScalar(Math.max(0.001, pl.hoja));
        h.rotation.z = lado * (0.5 - 0.45 * pl.caida);
      });
      pl.capullo.position.y = pl.alto + 0.08;
      pl.capullo.scale.setScalar(Math.max(0.001, pl.boton));
      pl.capullo.visible = pl.boton > 0.02;
      pl.flor.position.set(0, pl.alto + 0.02, 0.05);
      pl.flor.scale.setScalar(Math.max(0.001, pl.abierta));
      pl.flor.visible = pl.abierta > 0.02;
      /* Mustias: el tallo se dobla y la flor mira al piso. Con agua se enderezan. */
      /* Todas se inclinan hacia el mismo lado (alternadas se cruzaban en X). */
      pl.p.rotation.z = -(0.22 + 0.05 * (i % 3)) * pl.caida;
      pl.flor.rotation.x = 0.9 * pl.caida;
    });
    /* Secas: se ponen color paja. Con agua recuperan su color. */
    sequedad += ((secas() ? 1 : 0) - sequedad) * k;
    verde.color.copy(VERDE).lerp(SECO, sequedad);
    verdeHoja.color.copy(VERDE_HOJA).lerp(SECO_HOJA, sequedad);
    materialesFlor.forEach(({ m, color }) => m.color.copy(color).lerp(SECO, sequedad * 0.8));
    tierraMojada.material.opacity += ((regadoHoy() ? 0.45 : 0) - tierraMojada.material.opacity) * k;
  }
  formarPlantas();

  /* ---------- Regadera ---------- */

  const ICONO_REGADERA = 'data:image/svg+xml,' + encodeURIComponent(
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">' +
    '<path d="M30 30c0-14 26-14 26 0" fill="none" stroke="#3d2229" stroke-width="6" stroke-linecap="round"/>' +
    '<path d="M24 34h40l-4 40a6 6 0 0 1-6 5H34a6 6 0 0 1-6-5z" fill="#ff9cc4" stroke="#3d2229" stroke-width="5" stroke-linejoin="round"/>' +
    '<path d="M26 50L8 34" stroke="#3d2229" stroke-width="12" stroke-linecap="round"/>' +
    '<path d="M26 50L8 34" stroke="#ff9cc4" stroke-width="5" stroke-linecap="round"/>' +
    '<circle cx="7" cy="32" r="7" fill="#ffd9e6" stroke="#3d2229" stroke-width="4"/>' +
    '<circle cx="44" cy="54" r="7" fill="#fff"/></svg>');

  const boton = document.getElementById('btn-regar');
  let regadera = null, regando = false, tiempoRegando = 0, proximaGota = 0, tAhora = 0;
  if (boton) {
    boton.querySelector('img').src = ICONO_REGADERA;
    boton.addEventListener('pointerdown', (e) => {
      if (regadera) return;
      e.preventDefault();
      try { boton.setPointerCapture(e.pointerId); } catch (err) { /* puntero simulado */ }
      const fantasma = document.createElement('img');
      fantasma.className = 'fantasma regadera';
      fantasma.alt = '';
      fantasma.src = ICONO_REGADERA;
      marco.appendChild(fantasma);
      regadera = { id: e.pointerId, fantasma, x: e.clientX, y: e.clientY, regado: false, total: 0 };
      tiempoRegando = 0;
      moverRegadera(e.clientX, e.clientY);
    });
  }
  window.addEventListener('pointermove', (e) => { if (regadera && e.pointerId === regadera.id) moverRegadera(e.clientX, e.clientY); });
  window.addEventListener('pointerup', (e) => { if (regadera && e.pointerId === regadera.id) soltarRegadera(); });
  window.addEventListener('pointercancel', (e) => { if (regadera && e.pointerId === regadera.id) soltarRegadera(); });

  /* Rectángulo del cantero en la pantalla, con margen hacia arriba: la regadera va por encima. */
  const esquina = new T.Vector3();
  function canteroEnPantalla() {
    prepararProyeccion();
    const caja = lienzo.getBoundingClientRect();
    let x0 = Infinity, x1 = -Infinity, y0 = Infinity, y1 = -Infinity;
    [[-1, -1], [1, -1], [-1, 1], [1, 1]].forEach(([sx, sz]) => {
      esquina.set(CANTERO.x + sx * CANTERO.ancho / 2, CANTERO.y + 1.2, CANTERO.z + sz * CANTERO.fondo / 2);
      grupo.localToWorld(esquina).project(camara);
      const px = caja.left + (esquina.x + 1) / 2 * caja.width, py = caja.top + (1 - esquina.y) / 2 * caja.height;
      x0 = Math.min(x0, px); x1 = Math.max(x1, px); y0 = Math.min(y0, py); y1 = Math.max(y1, py);
    });
    const m = caja.width * 0.03;
    return { x0: x0 - m, x1: x1 + m, y0: y0 - caja.height * 0.12, y1: y1 + m };
  }

  function moverRegadera(x, y) {
    const caja = marco.getBoundingClientRect();
    regadera.fantasma.style.left = (x - caja.left) + 'px';
    regadera.fantasma.style.top = (y - caja.top) + 'px';
    regadera.total += Math.hypot(x - regadera.x, y - regadera.y);
    regadera.x = x; regadera.y = y;
    const c = canteroEnPantalla();
    const encima = x > c.x0 && x < c.x1 && y > c.y0 && y < c.y1;
    if (encima !== regando) {
      regando = encima;
      regadera.fantasma.classList.toggle('regando', encima);
      if (encima) sonarAgua(0.6);
    }
  }

  function soltarRegadera() {
    if (!regadera) return;
    const r = regadera;
    regadera = null;
    regando = false;
    const caja = marco.getBoundingClientRect();
    const b = boton ? boton.getBoundingClientRect() : caja;
    r.fantasma.classList.remove('regando');
    r.fantasma.classList.add('volviendo');
    r.fantasma.style.left = (b.left + b.width / 2 - caja.left) + 'px';
    r.fantasma.style.top = (b.top + b.height / 2 - caja.top) + 'px';
    setTimeout(() => r.fantasma.remove(), 320);
    if (!r.regado && r.total < 10) decir('Lleva la regadera hasta las flores');
  }

  /* Gotas que caen de la regadera sobre la tierra. */
  const rayo = new T.Raycaster(), ndc = new T.Vector2();
  const planoCantero = new T.Plane(new T.Vector3(0, 0, 1), 0);
  const puntoGota = new T.Vector3();
  function soltarGotas() {
    const caja = lienzo.getBoundingClientRect();
    ndc.set(((regadera.x - caja.left) / caja.width) * 2 - 1, -((regadera.y - caja.top) / caja.height) * 2 + 1);
    prepararProyeccion();
    rayo.setFromCamera(ndc, camara);
    planoCantero.constant = -(grupo.position.z + CANTERO.z);
    if (!rayo.ray.intersectPlane(planoCantero, puntoGota)) return;
    const xMin = grupo.position.x + CANTERO.x - CANTERO.ancho / 2 + 0.2, xMax = xMin + CANTERO.ancho - 0.4;
    const x = Math.max(xMin, Math.min(xMax, puntoGota.x - 0.4));
    const y = Math.max(CANTERO.y + 0.9, puntoGota.y - 0.2);
    for (let i = 0; i < 2; i++) {
      chispa(texturaGota, x + (Math.random() - 0.5) * 0.35, y, puntoGota.z + (Math.random() - 0.5) * 0.5,
        -0.4 + (Math.random() - 0.5) * 0.3, -1, 0.5, 0.18, 12);
    }
  }

  function regar() {
    regadera.regado = true;
    const desde = { x: regadera.x, y: regadera.y };
    for (let i = 0; i < 6; i++) {
      chispa(texturaBrillo, grupo.position.x + CANTERO.x + (Math.random() - 0.5) * 3, CANTERO.y + 0.6 + Math.random() * 0.8,
        grupo.position.z + CANTERO.z + 0.5, (Math.random() - 0.5) * 0.6, 0.7, 0.8, 0.4, 0);
    }
    if (regadoHoy()) { decir('¡Ya están regaditas por hoy!'); return 'ya'; }
    const estabanSecas = secas();
    datos.diaRiego = hoy();
    if (!estabanSecas) datos.etapa = Math.min(ETAPA_MAXIMA, datos.etapa + 1);
    guardar();
    [0, 4, 7].forEach((grado, i) => tocar([523.25, 587.33, 659.25, 698.46, 783.99, 880, 987.77, 1046.5][grado], i * 0.1, 0.14));
    feliz(1.4);
    ganar('flores', PREMIO_FLORES, desde);
    if (estabanSecas) decir('¡Reviven! Mañana siguen creciendo');
    else if (datos.etapa === ETAPA_MAXIMA) decir('¡Florecieron! Ya podemos hacer un ramo');
    else decir('¡Crezcan, florcitas!');
    if (ctx.avisar) ctx.avisar('regar');
    return 'regado';
  }

  function hablarDeLasFlores() {
    const frases = [
      'Son brotecitos. Mañana van a estar más grandes',
      'Ya les salieron hojitas',
      '¡Tienen capullos!',
      '¡Qué lindas flores!',
      '¡Las flores más lindas del jardín!'
    ];
    if (secas()) decir('Se secaron… ¡riégalas y van a revivir!');
    else if (marchitas()) decir('Tienen sed… ¿las regamos?');
    else if (listasParaRamo()) decir('¡Están preciosas! Toca "Ramo" para llevarlas a la sala');
    else decir(frases[datos.etapa]);
  }

  /* ---------- Ramo y florero de la sala ---------- */

  const botonRamo = document.getElementById('btn-ramo');
  if (botonRamo) botonRamo.addEventListener('click', hacerRamo);

  /* Corta las flores grandes: hacen un ramo para el florero y el cantero vuelve a hojitas. */
  function hacerRamo() {
    if (!listasParaRamo()) return false;
    plantas.forEach((pl) => {
      const v = pl.flor.getWorldPosition(new T.Vector3());
      for (let i = 0; i < 2; i++) chispa(texturaBrillo, v.x, v.y, v.z + 0.2, (Math.random() - 0.5) * 1.2, 1.2 + Math.random(), 0.8, 0.4, 2);
    });
    datos.etapa = 1;
    datos.diaRamo = hoy();
    datos.ramos++;
    guardar();
    pintarFlorero();
    [523.25, 659.25, 783.99, 1046.5, 1318.5].forEach((f, i) => tocar(f, i * 0.08, 0.13));
    feliz(1.6);
    ganar('flores', PREMIO_RAMO, ctx.puntoDeElla ? ctx.puntoDeElla() : null);
    decir('¡Un ramo para el florero de la sala!');
    if (ctx.avisar) ctx.avisar('ramo');
    return true;
  }

  /* Mesita con florero, junto a la planta de la sala. */
  const florero = new T.Group();
  florero.position.set(-3.75, 0, -3.95);
  if (grupoSala) grupoSala.add(florero);
  const mesita = new T.Group();
  florero.add(mesita);
  const pata = parte(new T.CylinderGeometry(0.1, 0.16, 1.0, 20), pintura(0xfffaf6), 0.025);
  pata.position.y = 0.5;
  mesita.add(pata);
  const tabla = parte(new T.CylinderGeometry(0.62, 0.62, 0.1, 32), pintura(0xffd9e6), 0.025);
  tabla.position.y = 1.05;
  mesita.add(tabla);
  /* El florero: panzón abajo y con cuello, de cerámica rosa. */
  const perfil = [[0.001, 0], [0.2, 0.02], [0.27, 0.18], [0.25, 0.36], [0.14, 0.52], [0.13, 0.62], [0.17, 0.68]].map(([x, y]) => new T.Vector2(x, y));
  const jarron = parte(new T.LatheGeometry(perfil, 32), pintura(0xff9cc4), 0.022);
  jarron.position.y = 1.1;
  florero.add(jarron);
  const corazonJarron = parte(elipsoide(0.07, 0.06, 0.02, 12, 8), pintura(0xffffff), 0.01);
  corazonJarron.position.set(0, 1.35, 0.26);
  florero.add(corazonJarron);
  /* El ramo: cinco flores con los colores del cantero, en abanico. */
  const ramo = new T.Group();
  ramo.position.y = 1.72;
  florero.add(ramo);
  const verdeRamo = pintura(0x7cc47a), verdeRamoHoja = pintura(0x8fd58a);
  const floresRamo = COLORES.map((color, i) => {
    const giro = (i - 2) * 0.32;
    const tallo = new T.Group();
    tallo.rotation.z = -giro;
    ramo.add(tallo);
    const geoTallo = new T.CylinderGeometry(0.025, 0.03, 0.75, 10);
    geoTallo.translate(0, 0.25, 0);
    tallo.add(parte(geoTallo, verdeRamo, 0.01));
    const mat = pintura(color);
    const flor = new T.Group();
    flor.position.y = 0.66 + (i % 2) * 0.12;
    for (let k = 0; k < 5; k++) {
      const a = (k / 5) * Math.PI * 2;
      const petalo = parte(elipsoide(0.11, 0.11, 0.05, 14, 8), mat, 0.015);
      petalo.position.set(Math.cos(a) * 0.12, Math.sin(a) * 0.12, 0);
      flor.add(petalo);
    }
    const centro = parte(elipsoide(0.075, 0.075, 0.06, 12, 8), amarillo, 0.015);
    centro.position.z = 0.035;
    flor.add(centro);
    tallo.add(flor);
    if (i % 2 === 0) {
      const hoja = parte(elipsoide(0.13, 0.04, 0.06, 12, 8), verdeRamoHoja, 0.01);
      hoja.position.set(0.1, 0.32, 0);
      hoja.rotation.z = 0.5;
      tallo.add(hoja);
    }
    return { tallo, flor, mat, color: new T.Color(color), giro };
  });

  function pintarFlorero() {
    const estado = estadoDelRamo();
    ramo.visible = estado !== 'vacio';
    const caida = estado === 'fresco' ? 0 : estado === 'mustio' ? 0.6 : 1;
    const seco = estado === 'seco' ? 1 : 0;
    floresRamo.forEach((f) => {
      f.tallo.rotation.z = -f.giro * (1 + caida * 0.9) - Math.sign(f.giro || 1) * 0.15 * caida;
      f.flor.rotation.x = 0.8 * caida;
      f.mat.color.copy(f.color).lerp(SECO, seco * 0.8);
    });
    verdeRamo.color.copy(VERDE).lerp(SECO, seco);
    verdeRamoHoja.color.copy(VERDE_HOJA).lerp(SECO_HOJA, seco);
  }
  pintarFlorero();

  function hablarDelFlorero() {
    const estado = estadoDelRamo();
    if (estado === 'vacio') decir(datos.etapa === ETAPA_MAXIMA ? '¡Las flores del patio ya están listas para el florero!' : 'Cuando florezcan las flores del patio, las ponemos aquí');
    else if (estado === 'fresco') decir('¡Qué lindo ramo! Huele a primavera');
    else if (estado === 'mustio') decir('Las flores del florero se están poniendo tristes…');
    else decir('Se marchitaron… ¿hacemos otro ramo en el patio?');
    return true;
  }

  /* ---------- Kuromi ---------- */

  const NEGRO = 0x2b2530, BLANCO = 0xffffff, ROSA_K = 0xffa3c4, LILA = 0xc9a3ee;
  const kuromi = new T.Group();
  const cabezaK = new T.Group();
  kuromi.add(cabezaK);
  /* Capucha negra, un poco más ancha que alta. */
  cabezaK.add(parte(elipsoide(0.9, 0.82, 0.78, 36, 24), pintura(NEGRO), 0.03));
  /* Cara blanca: ocupa la parte de abajo de la capucha, como en la serie. */
  const caraK = parte(elipsoide(0.74, 0.52, 0.4, 36, 22), pintura(BLANCO), 0.022);
  caraK.position.set(0, -0.2, 0.42);
  cabezaK.add(caraK);
  /* Orejas de bufón: planas, en punta, abiertas hacia afuera, con una bolita en la punta. */
  const orejasK = [-1, 1].map((lado) => {
    const pivote = new T.Group();
    pivote.position.set(lado * 0.48, 0.5, -0.05);
    pivote.rotation.z = -lado * 0.42;
    const geoOreja = new T.CylinderGeometry(0.02, 0.36, 1.05, 28);
    geoOreja.scale(1, 1, 0.3);
    const oreja = parte(geoOreja, pintura(NEGRO), 0.028);
    oreja.position.y = 0.48;
    pivote.add(oreja);
    const bolita = parte(elipsoide(0.1, 0.1, 0.1, 14, 10), pintura(NEGRO), 0.02);
    bolita.position.y = 1.03;
    pivote.add(bolita);
    cabezaK.add(pivote);
    return { pivote, lado };
  });
  /* Moño lila en la base de la oreja derecha. */
  const mono = new T.Group();
  mono.position.set(0.56, 0.6, 0.42);
  mono.rotation.z = -0.35;
  [-1, 1].forEach((lado) => {
    const lazo = parte(elipsoide(0.2, 0.13, 0.08, 16, 10), pintura(LILA), 0.018);
    lazo.position.x = lado * 0.17;
    lazo.rotation.z = lado * 0.35;
    mono.add(lazo);
  });
  const nudo = parte(elipsoide(0.075, 0.075, 0.07, 12, 8), pintura(LILA), 0.016);
  nudo.position.z = 0.04;
  mono.add(nudo);
  cabezaK.add(mono);
  /* Calavera rosa en relieve sobre la frente. */
  function calaveraRosa() {
    const c = new T.Group();
    c.add(parte(elipsoide(0.2, 0.16, 0.08, 18, 12), pintura(ROSA_K), 0.014));
    const mandibula = parte(elipsoide(0.12, 0.07, 0.065, 14, 8), pintura(ROSA_K), 0.012);
    mandibula.position.set(0, -0.13, 0.01);
    c.add(mandibula);
    const oscuro = new T.MeshBasicMaterial({ color: NEGRO });
    [-1, 1].forEach((lado) => {
      const ojo = new T.Mesh(elipsoide(0.045, 0.052, 0.02, 10, 8), oscuro);
      ojo.position.set(lado * 0.075, 0.0, 0.072);
      c.add(ojo);
    });
    const nariz = new T.Mesh(elipsoide(0.018, 0.022, 0.012, 8, 6), oscuro);
    nariz.position.set(0, -0.07, 0.075);
    c.add(nariz);
    return c;
  }
  const calavera = calaveraRosa();
  calavera.position.set(0, 0.43, 0.62);
  calavera.rotation.x = -0.55;
  cabezaK.add(calavera);

  function texturaCanvas(w, h, pintar) {
    const c = document.createElement('canvas');
    c.width = w; c.height = h;
    const g = c.getContext('2d');
    g.lineCap = 'round'; g.lineJoin = 'round';
    pintar(g);
    const t = new T.CanvasTexture(c);
    t.colorSpace = T.SRGBColorSpace;
    return t;
  }
  /* La cara: pico negro de la capucha bajo la calavera, ojos traviesos con pestañas,
     naricita rosa y sonrisa abierta con lengüita. 512 px = 1,4 unidades. */
  const texturaCaraK = texturaCanvas(512, 512, (g) => {
    [1, -1].forEach((lado) => {
      g.save();
      g.translate(256 - lado * 100, 262);
      g.scale(lado * 1.15, 1.15);
      /* Ojo almendrado: el párpado baja hacia la nariz (cara de traviesa). */
      g.beginPath();
      g.moveTo(30, 18);
      g.bezierCurveTo(26, -8, 4, -30, -22, -40);
      g.bezierCurveTo(-40, -30, -46, 8, -38, 30);
      g.bezierCurveTo(-28, 52, 16, 50, 30, 18);
      g.closePath();
      g.fillStyle = '#2b2530'; g.fill();
      /* Brillito blanco abajo. */
      g.beginPath(); g.ellipse(-10, 30, 13, 6, -0.2, 0, Math.PI * 2); g.fillStyle = '#ffffff'; g.fill();
      /* Pestañas en la esquina de afuera. */
      g.strokeStyle = '#2b2530'; g.lineWidth = 7;
      g.beginPath(); g.moveTo(-30, -36); g.lineTo(-50, -52); g.stroke();
      g.beginPath(); g.moveTo(-40, -22); g.lineTo(-62, -30); g.stroke();
      g.restore();
    });
    g.beginPath(); g.ellipse(256, 322, 16, 11, 0, 0, Math.PI * 2); g.fillStyle = '#ff8fb5'; g.fill();
    g.lineWidth = 4; g.strokeStyle = '#2b2530'; g.stroke();
    /* Boca abierta en sonrisa. */
    g.beginPath();
    g.moveTo(224, 345); g.quadraticCurveTo(256, 354, 288, 345);
    g.quadraticCurveTo(284, 386, 256, 388); g.quadraticCurveTo(228, 386, 224, 345);
    g.closePath(); g.fillStyle = '#8c2f45'; g.fill();
    g.save(); g.clip();
    g.beginPath(); g.ellipse(256, 386, 24, 17, 0, 0, Math.PI * 2); g.fillStyle = '#ff8fb5'; g.fill();
    g.restore();
    g.lineWidth = 6; g.strokeStyle = '#2b2530'; g.stroke();
  });
  const decalCara = new T.Mesh(new T.PlaneGeometry(1.4, 1.4),
    new T.MeshBasicMaterial({ map: texturaCaraK, transparent: true, depthWrite: false }));
  decalCara.position.set(0, -0.2, 0.825);
  cabezaK.add(decalCara);
  /* Pico de la capucha que baja sobre la frente, con el mismo negro de la capucha. */
  const geoPico = new T.CylinderGeometry(0.2, 0.015, 0.3, 24);
  geoPico.scale(1, 1, 0.3);
  const pico = parte(geoPico, pintura(NEGRO), 0.02);
  pico.position.set(0, 0.07, 0.72);
  pico.rotation.x = -0.25;
  cabezaK.add(pico);
  /* Manitos apoyadas en la cerca y la Kuromi Note, su libreta negra. */
  const manosK = [-1, 1].map((lado) => {
    const m = parte(elipsoide(0.16, 0.13, 0.15, 16, 12), pintura(BLANCO), 0.022);
    m.position.set(lado * 0.56, -0.58, 0.5);
    kuromi.add(m);
    return m;
  });
  const libreta = new T.Group();
  libreta.add(parte(new RoundedBoxGeometry(0.38, 0.48, 0.07, 2, 0.03), pintura(NEGRO), 0.02));
  const calaveraLibreta = calaveraRosa();
  calaveraLibreta.scale.setScalar(0.6);
  calaveraLibreta.position.set(0, 0.04, 0.04);
  libreta.add(calaveraLibreta);
  libreta.position.set(1.0, -0.35, 0.45);
  libreta.rotation.z = -0.25;
  kuromi.add(libreta);
  /* Marquita de enojo cuando la descubren. */
  const texturaEnojo = texturaCanvas(96, 96, (g) => {
    g.strokeStyle = '#e8435f'; g.lineWidth = 9;
    [[0, 1], [Math.PI / 2, 1], [Math.PI, 1], [Math.PI * 1.5, 1]].forEach(([a]) => {
      g.save(); g.translate(48, 48); g.rotate(a);
      g.beginPath(); g.moveTo(10, -26); g.quadraticCurveTo(10, -10, 26, -10); g.stroke();
      g.restore();
    });
  });
  const enojoK = new T.Sprite(new T.SpriteMaterial({ map: texturaEnojo, transparent: true, depthWrite: false }));
  enojoK.scale.set(0.45, 0.45, 1);
  enojoK.position.set(0.85, 0.8, 0.5);
  enojoK.visible = false;
  kuromi.add(enojoK);

  kuromi.scale.setScalar(0.8);
  kuromi.visible = false;
  grupo.add(kuromi);

  /* Espiando, la boca queda justo por encima de la cerca (1,9 m). */
  const ALTO_OCULTA = 0.2, ALTO_ESPIA = 2.5, Z_KUROMI = -4.6;
  /* Se asoma donde no la tapan el cantero, el árbol ni el columpio, y lejos de My Melody
     (si se asoma justo detrás de ella, queda tapada y no se puede tocar). */
  const LUGARES = [-2.6, -1.0, 0.6, 2.2];
  const k = { estado: 'oculta', desde: 0, proxima: null, alto: ALTO_OCULTA, vista: false, frases: 0 };

  function aparecerKuromi() {
    if (k.estado !== 'oculta') return false;
    const ella = ctx.xDeElla ? ctx.xDeElla() - grupo.position.x : 99;
    const lejos = LUGARES.filter((l) => Math.abs(l - ella) > 1.9);
    const opciones = lejos.length ? lejos : [LUGARES.reduce((a, b) => (Math.abs(b - ella) > Math.abs(a - ella) ? b : a))];
    const x = opciones[Math.floor(Math.random() * opciones.length)];
    kuromi.position.set(x, ALTO_OCULTA, Z_KUROMI);
    libreta.visible = Math.random() < 0.6;
    k.estado = 'subiendo'; k.desde = tAhora; k.vista = false;
    kuromi.visible = true;
    enojoK.visible = false;
    /* Su risita: "kekeke". */
    [622.25, 587.33, 622.25].forEach((f, i) => tocar(f, 0.5 + i * 0.12, 0.07));
    return true;
  }
  function esconderKuromi(inmediato) {
    if (inmediato) {
      k.estado = 'oculta'; k.alto = ALTO_OCULTA;
      kuromi.visible = false;
      return;
    }
    if (k.estado === 'subiendo' || k.estado === 'espiando') { k.estado = 'bajando'; k.desde = tAhora; }
  }
  /* Tocarla mientras espía: se asusta, refunfuña y se esconde. */
  function tocarKuromi() {
    if (k.estado !== 'subiendo' && k.estado !== 'espiando') return false;
    k.estado = 'asustada'; k.desde = tAhora;
    enojoK.visible = true;
    tocar(330, 0, 0.14); tocar(247, 0.1, 0.14);
    const frases = ['¡Kuromi! ¿Vienes a jugar?', '¡Te encontré, Kuromi!', '¡Hola, Kuromi!'];
    decir(frases[k.frases++ % frases.length]);
    feliz(1.2);
    if (datos.diaKuromi !== hoy()) {
      datos.diaKuromi = hoy();
      guardar();
      ganar('kuromi', PREMIO_KUROMI, puntoKuromi());
    }
    if (ctx.avisar) ctx.avisar('kuromi');
    return true;
  }

  function puntoKuromi() {
    prepararProyeccion();
    const v = new T.Vector3(kuromi.position.x, k.alto, Z_KUROMI + 0.6);
    grupo.localToWorld(v).project(camara);
    const caja = lienzo.getBoundingClientRect();
    return { x: caja.left + (v.x + 1) / 2 * caja.width, y: caja.top + (1 - v.y) / 2 * caja.height };
  }

  function moverKuromi(t) {
    const e = t - k.desde;
    const suave = (u) => 1 - Math.pow(1 - Math.min(1, Math.max(0, u)), 3);
    if (k.estado === 'subiendo') {
      k.alto = ALTO_OCULTA + (ALTO_ESPIA - ALTO_OCULTA) * suave(e / 1.1);
      if (e >= 1.1) { k.estado = 'espiando'; k.desde = t; }
    } else if (k.estado === 'espiando') {
      k.alto = ALTO_ESPIA + 0.04 * Math.sin(t * 3);
      if (!k.vista && e > 0.5) {
        k.vista = true;
        const p = puntoKuromi(), caja = lienzo.getBoundingClientRect();
        mirarA(((p.x - caja.left) / caja.width) * 2 - 1, -((p.y - caja.top) / caja.height) * 2 + 1);
        if (Math.random() < 0.5) decir('¿Eh? ¿Quién anda ahí?');
      }
      if (e > 5.5) { k.estado = 'bajando'; k.desde = t; }
    } else if (k.estado === 'bajando') {
      k.alto = ALTO_ESPIA + (ALTO_OCULTA - ALTO_ESPIA) * suave(e / 0.7);
      if (e >= 0.7) { esconderKuromi(true); k.proxima = t + 35 + Math.random() * 40; }
    } else if (k.estado === 'asustada') {
      /* Da un respingo y se agacha de golpe. */
      k.alto = e < 0.18 ? ALTO_ESPIA + 0.3 * Math.sin(Math.PI * e / 0.18) : ALTO_ESPIA + (ALTO_OCULTA - ALTO_ESPIA) * Math.min(1, (e - 0.18) / 0.3);
      if (e >= 0.48) { esconderKuromi(true); k.proxima = t + 40 + Math.random() * 40; }
    }
    if (!kuromi.visible) return;
    kuromi.position.y = k.alto;
    const espiando = k.estado === 'espiando';
    cabezaK.rotation.y = espiando ? 0.38 * Math.sin(t * 1.5) : 0;
    cabezaK.rotation.z = espiando ? 0.08 * Math.sin(t * 2.3) : k.estado === 'asustada' ? 0.25 : 0;
    orejasK.forEach(({ pivote, lado }) => { pivote.rotation.z = -lado * (0.42 + 0.06 * Math.sin(t * 6 + lado)); });
    libreta.rotation.z = -0.25 + (espiando ? 0.12 * Math.sin(t * 9) : 0);
    /* Las manos se quedan agarradas a la cerca mientras la cabeza sube y baja. */
    manosK.forEach((m) => { m.position.y = (1.9 - k.alto) / kuromi.scale.y + 0.05; });
    libreta.position.y = (1.9 - k.alto) / kuromi.scale.y + 0.25;
  }

  /* ---------- Aguas termales (el premio de las 100 Notas Rosas) ---------- */

  const termas = new T.Group();
  termas.position.set(0.9, 0, -2.75);
  termas.visible = false;
  grupo.add(termas);
  const agua = new T.Mesh(new T.CircleGeometry(1, 48), pintura(0x9fe3e8));
  agua.rotation.x = -Math.PI / 2;
  agua.scale.set(1.55, 1.0, 1);
  agua.position.y = 0.24;
  termas.add(agua);
  const brilloAgua = new T.Mesh(new T.RingGeometry(0.55, 0.62, 40), new T.MeshBasicMaterial({ color: 0xe8fbff, transparent: true, opacity: 0.7 }));
  brilloAgua.rotation.x = -Math.PI / 2;
  brilloAgua.scale.set(1.55, 1.0, 1);
  brilloAgua.position.y = 0.25;
  termas.add(brilloAgua);
  const fondoAgua = new T.Mesh(new T.CylinderGeometry(1, 1, 0.2, 40), pintura(0x7fcfd6));
  fondoAgua.scale.set(1.55, 1.2, 1.0);
  fondoAgua.position.y = 0.12;
  termas.add(fondoAgua);
  const piedras = [0xd9d0c4, 0xc9bfb2, 0xe3dbd0];
  for (let i = 0; i < 20; i++) {
    const a = (i / 20) * Math.PI * 2;
    /* Las de adelante son más bajitas, para que se vea el agua. */
    const alto = Math.sin(a) > 0.3 ? 0.1 : 0.15 + (i % 3) * 0.03;
    const piedra = parte(elipsoide(0.27, alto, 0.2, 16, 10), pintura(piedras[i % 3]), 0.02);
    piedra.position.set(Math.cos(a) * 1.68, alto * 0.7, Math.sin(a) * 1.12);
    piedra.rotation.y = -a;
    termas.add(piedra);
  }
  /* Cartelito con el símbolo de aguas termales. */
  const poste = parte(new T.CylinderGeometry(0.05, 0.06, 1.3, 12), pintura(0xc99a7a), 0.015);
  poste.position.set(2.05, 0.65, -0.7);
  termas.add(poste);
  const texturaCartel = (() => {
    const c = document.createElement('canvas');
    c.width = 128; c.height = 96;
    const g = c.getContext('2d');
    g.fillStyle = '#fff6ea'; g.fillRect(0, 0, 128, 96);
    g.lineWidth = 8; g.strokeStyle = '#c99a7a'; g.strokeRect(4, 4, 120, 88);
    g.fillStyle = '#ff6f9f'; g.font = 'bold 60px sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle';
    g.fillText('♨', 64, 52);
    const t = new T.CanvasTexture(c);
    t.colorSpace = T.SRGBColorSpace;
    return t;
  })();
  const cartel = parte(new RoundedBoxGeometry(0.62, 0.46, 0.06, 2, 0.03), pintura(0xfff6ea), 0.015);
  cartel.position.set(2.05, 1.38, -0.7);
  termas.add(cartel);
  const caraCartel = new T.Mesh(new T.PlaneGeometry(0.56, 0.42), new T.MeshBasicMaterial({ map: texturaCartel }));
  caraCartel.position.set(2.05, 1.38, -0.665);
  termas.add(caraCartel);

  function mostrarTermas(si) { termas.visible = !!si; }
  function hablarDeLasTermas() {
    if (!termas.visible) return false;
    decir('¡Las aguas termales de las 100 Notas Rosas! Qué calientitas');
    feliz(1.2);
    return true;
  }

  /* ---------- Cada cuadro ---------- */

  /* activo: el patio está a la vista y se puede jugar. */
  let ramoVisible = false, proximoRepaso = 0;
  function actualizar(dt, t, activo) {
    tAhora = t;
    formarPlantas(dt);
    const verRamo = activo && listasParaRamo();
    if (verRamo !== ramoVisible) { ramoVisible = verRamo; marco.classList.toggle('ramo-listo', verRamo); }
    if (t > proximoRepaso) { proximoRepaso = t + 5; pintarFlorero(); }   /* el ramo se marchita con los días */
    /* Vapor de las aguas termales. */
    if (termas.visible && activo && Math.random() < dt * 4) {
      chispa(texturaBrillo, grupo.position.x + termas.position.x + (Math.random() - 0.5) * 2.2, 0.35,
        termas.position.z + (Math.random() - 0.5) * 1.0, (Math.random() - 0.5) * 0.2, 0.45 + Math.random() * 0.3, 2.2, 0.7 + Math.random() * 0.5, 0);
    }
    if (regadera && regando) {
      tiempoRegando += dt;
      if (t > proximaGota) { proximaGota = t + 0.04; soltarGotas(); }
      if (!regadera.regado && tiempoRegando >= SEGUNDOS_DE_RIEGO) regar();
    }
    if (!activo) {
      if (k.estado !== 'oculta') esconderKuromi(true);
      k.proxima = null;
    } else {
      if (k.proxima === null) k.proxima = t + 18 + Math.random() * 20;
      if (k.estado === 'oculta' && t > k.proxima) aparecerKuromi();
    }
    moverKuromi(t);
    if (datos.etapa === ETAPA_MAXIMA && !marchitas() && activo && Math.random() < dt * 0.8) {
      const pl = plantas[Math.floor(Math.random() * plantas.length)];
      const v = pl.flor.getWorldPosition(new T.Vector3());
      chispa(texturaBrillo, v.x + (Math.random() - 0.5) * 0.4, v.y + 0.2, v.z + 0.2, 0, 0.4, 0.9, 0.3, 0);
    }
  }

  /* Corta lo que esté a medias (al cambiar de ambiente o volver al título). */
  function cortar() {
    if (regadera) soltarRegadera();
    esconderKuromi(true);
  }

  /* Para probar: simula que pasó un día (se puede volver a regar). */
  function pasarUnDia() {
    if (datos.diaRiego !== null) datos.diaRiego--;
    if (datos.diaKuromi !== null) datos.diaKuromi--;
    if (datos.diaRamo !== null) datos.diaRamo--;
    guardar();
    pintarFlorero();
  }

  function puntoCantero() {
    prepararProyeccion();
    const v = new T.Vector3(CANTERO.x, CANTERO.y + 1.4, CANTERO.z);
    grupo.localToWorld(v).project(camara);
    const caja = lienzo.getBoundingClientRect();
    return { x: caja.left + (v.x + 1) / 2 * caja.width, y: caja.top + (1 - v.y) / 2 * caja.height };
  }

  /* Lo que se puede tocar del patio: el cantero (comenta cómo van) y Kuromi. */
  const tocables = { cantero: [tierra, ...plantas.map((pl) => pl.p)], kuromi, florero, termas };

  return {
    actualizar, cortar, pasarUnDia, aparecerKuromi, tocarKuromi, hablarDeLasFlores, hacerRamo, hablarDelFlorero,
    listasParaRamo, estadoDelRamo, secas, mostrarTermas, hablarDeLasTermas,
    termasVisibles: () => termas.visible,
    puntoCantero, puntoKuromi, tocables,
    etapa: () => datos.etapa,
    regadoHoy, marchitas,
    kuromi: () => k.estado,
    regando: () => !!regadera,
    interno: () => ({ etapa: datos.etapa, diaRiego: datos.diaRiego, regadoHoy: regadoHoy(), kuromi: k.estado, regadera: !!regadera,
      secas: secas(), ramo: estadoDelRamo(), ramos: datos.ramos })
  };
}
