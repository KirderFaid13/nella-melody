/* Nella Melody · fase 0 · prueba 3D.
   My Melody modelada por código: formas redondeadas con contorno de tinta
   y sombreado suave de dos tonos. Sirve para decidir el estilo y medir
   fluidez, respuesta al toque y tipo de puntero. */
import * as THREE from 'three';
import { construirCuartos, CUARTOS, ANCHO_CUARTO } from './cuartos.js?v=9';
import { crearCocina, COMIDAS } from './cocina.js?v=3';
import { crearTienda } from './tienda.js?v=3';
import { crearPatio } from './patio.js?v=11';
import { crearEncargos } from './encargos.js?v=3';

const TINTA = 0x3d2229;
const ROSA = 0xf589b8;
const BLANCO = 0xfffaf6;
const AMARILLO = 0xffd43b;
const GROSOR = 0.045;

const marco = document.getElementById('marco');
const lienzo = document.getElementById('lienzo');

const renderer = new THREE.WebGLRenderer({ canvas: lienzo, antialias: true, powerPreference: 'high-performance' });
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;

const escena = new THREE.Scene();
escena.background = new THREE.Color(0xffeaf2);

const camara = new THREE.PerspectiveCamera(28, 1.6, 0.1, 100);
const CAM = new THREE.Vector3(0, 2.6, 13);
const MIRA = new THREE.Vector3(0, 2.0, 0);
/* La cámara arranca ya ubicada, aunque todavía no se haya dibujado ningún cuadro. */
camara.position.copy(CAM);
camara.lookAt(MIRA);

/* Encuadres de cámara. En el título, My Melody queda a la derecha para dejar lugar
   al logo y a la ficha; al entrar a la casa la cámara se desliza al encuadre normal. */
const ENCUADRE = {
  casa: { pos: CAM, mira: MIRA },
  titulo: { pos: new THREE.Vector3(-1.95, 2.35, 11.3), mira: new THREE.Vector3(-1.95, 2.05, 0) }
};
const camBase = CAM.clone(), miraBase = MIRA.clone();
/* 'titulo': solo saluda y no responde a toques. 'casa': se juega. */
let modo = 'casa';
let proximoSaludoTitulo = 0;

function ajustar() {
  const w = marco.clientWidth, h = marco.clientHeight;
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.setSize(w, h, false);
  camara.aspect = w / h;
  camara.updateProjectionMatrix();
}
window.addEventListener('resize', ajustar);
ajustar();

/* ---------- Materiales ---------- */

function rampa() {
  const c = document.createElement('canvas');
  c.width = 64; c.height = 1;
  const g = c.getContext('2d');
  const d = g.createLinearGradient(0, 0, 64, 0);
  d.addColorStop(0, '#5f5f5f'); d.addColorStop(0.5, '#5f5f5f');
  d.addColorStop(0.6, '#ffffff'); d.addColorStop(1, '#ffffff');
  g.fillStyle = d; g.fillRect(0, 0, 64, 1);
  const t = new THREE.CanvasTexture(c);
  t.minFilter = t.magFilter = THREE.LinearFilter;
  t.generateMipmaps = false;
  return t;
}
const RAMPA = rampa();
const pintura = (color, extra) => new THREE.MeshToonMaterial(Object.assign({ color, gradientMap: RAMPA }, extra || {}));
const tinta = new THREE.MeshBasicMaterial({ color: TINTA, side: THREE.BackSide });
const linea = new THREE.MeshBasicMaterial({ color: TINTA });

const matRosa = pintura(ROSA);
const matBlanco = pintura(BLANCO);
const matAmarillo = pintura(AMARILLO);

/* ---------- Formas ---------- */

/* Elipsoide con normales exactas, para que el contorno tenga grosor parejo. */
function elipsoide(a, b, c, sw = 40, sh = 28) {
  const g = new THREE.SphereGeometry(1, sw, sh);
  const p = g.attributes.position, n = g.attributes.normal, v = new THREE.Vector3();
  for (let i = 0; i < p.count; i++) {
    v.fromBufferAttribute(p, i);
    p.setXYZ(i, v.x * a, v.y * b, v.z * c);
    v.set(v.x / a, v.y / b, v.z / c).normalize();
    n.setXYZ(i, v.x, v.y, v.z);
  }
  return g;
}

/* Copia de la forma, empujada hacia afuera. Dibujada por dentro, es la línea de tinta. */
function inflar(geo, e) {
  const g = geo.clone();
  const p = g.attributes.position, n = g.attributes.normal;
  for (let i = 0; i < p.count; i++) {
    p.setXYZ(i, p.getX(i) + n.getX(i) * e, p.getY(i) + n.getY(i) * e, p.getZ(i) + n.getZ(i) * e);
  }
  return g;
}

function parte(geo, material, grosor = GROSOR) {
  const grupo = new THREE.Group();
  const malla = new THREE.Mesh(geo, material);
  malla.castShadow = true;
  grupo.add(malla);
  if (grosor) grupo.add(new THREE.Mesh(inflar(geo, grosor), tinta));
  grupo.userData.malla = malla;
  return grupo;
}

/* Forma alargada que sigue una curva, ancha de lado y delgada de frente. Para las orejas. */
function barrido(puntos, radio, plano = 0.6, N = 34, M = 20) {
  const curva = new THREE.CatmullRomCurve3(puntos.map((p) => new THREE.Vector3(p[0], p[1], p[2])));
  const ANCHO = new THREE.Vector3(1, 0, 0);
  const pos = [], idx = [];
  const c = new THREE.Vector3(), tg = new THREE.Vector3(), lado = new THREE.Vector3(), fondo = new THREE.Vector3();
  curva.getPointAt(0, c); pos.push(c.x, c.y, c.z);
  for (let i = 1; i < N; i++) {
    const u = i / N, r = radio(u);
    curva.getPointAt(u, c); curva.getTangentAt(u, tg);
    lado.copy(ANCHO).addScaledVector(tg, -ANCHO.dot(tg)).normalize();
    fondo.crossVectors(tg, lado).normalize();
    for (let j = 0; j < M; j++) {
      const a = (j / M) * Math.PI * 2, x = Math.cos(a) * r, y = Math.sin(a) * r * plano;
      pos.push(c.x + lado.x * x + fondo.x * y, c.y + lado.y * x + fondo.y * y, c.z + lado.z * x + fondo.z * y);
    }
  }
  curva.getPointAt(1, c); pos.push(c.x, c.y, c.z);
  const punta = 1 + (N - 1) * M;
  const anillo = (i, j) => 1 + (i - 1) * M + (j % M);
  for (let j = 0; j < M; j++) {
    idx.push(0, anillo(1, j + 1), anillo(1, j));
    idx.push(punta, anillo(N - 1, j), anillo(N - 1, j + 1));
  }
  for (let i = 1; i < N - 1; i++) {
    for (let j = 0; j < M; j++) {
      const a = anillo(i, j), b = anillo(i, j + 1), d = anillo(i + 1, j), e = anillo(i + 1, j + 1);
      idx.push(a, b, d, b, e, d);
    }
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setIndex(idx);
  g.computeVertexNormals();
  /* Si las caras quedaron mirando hacia adentro, se dan vuelta. */
  const medio = anillo(Math.floor(N / 2), 0);
  curva.getPointAt(Math.floor(N / 2) / N, c);
  const fuera = new THREE.Vector3().fromBufferAttribute(g.attributes.position, medio).sub(c);
  if (fuera.dot(new THREE.Vector3().fromBufferAttribute(g.attributes.normal, medio)) < 0) {
    for (let k = 0; k < idx.length; k += 3) { const tmp = idx[k + 1]; idx[k + 1] = idx[k + 2]; idx[k + 2] = tmp; }
    g.setIndex(idx);
    g.computeVertexNormals();
  }
  return g;
}

const suave = (a, b, x) => { const k = Math.max(0, Math.min(1, (x - a) / (b - a))); return k * k * (3 - 2 * k); };
const perfilOreja = (R) => (u) => {
  const base = 0.7 + 0.3 * suave(0, 0.4, u);
  const punta = u > 0.7 ? Math.sqrt(Math.max(0, 1 - Math.pow((u - 0.7) / 0.3, 2))) : 1;
  return R * base * punta;
};

/* ---------- My Melody ---------- */

const CAPUCHA = { a: 1.22, b: 1.0, c: 1.06, y: 0.92 };
/* Óvalo de la cara, en coordenadas de la textura de la cabeza (0 a 1). */
const CARA = { cx: 0.25, cy: 0.6, rx: 0.185, ry: 0.215, n: 3.1 };
const EJE_Z = new THREE.Vector3(0, 0, 1);

/* Punto sobre la capucha según hacia dónde mira (grados), y su normal. */
function enCara(giro, alza, afuera = 0) {
  const g = THREE.MathUtils.degToRad(giro), al = THREE.MathUtils.degToRad(alza);
  const d = new THREE.Vector3(Math.sin(g) * Math.cos(al), Math.sin(al), Math.cos(g) * Math.cos(al));
  const s = 1 / Math.sqrt((d.x / CAPUCHA.a) ** 2 + (d.y / CAPUCHA.b) ** 2 + (d.z / CAPUCHA.c) ** 2);
  const p = d.multiplyScalar(s);
  const n = new THREE.Vector3(p.x / CAPUCHA.a ** 2, p.y / CAPUCHA.b ** 2, p.z / CAPUCHA.c ** 2).normalize();
  p.addScaledVector(n, afuera);
  p.y += CAPUCHA.y;
  return { p, n };
}

function apoyar(objeto, giro, alza, afuera) {
  const lugar = enCara(giro, alza, afuera);
  objeto.position.copy(lugar.p);
  objeto.quaternion.setFromUnitVectors(EJE_Z, lugar.n);
  return objeto;
}

function texturaCabeza() {
  const W = 1024, H = 512;
  const c = document.createElement('canvas');
  c.width = W; c.height = H;
  const g = c.getContext('2d');
  g.fillStyle = '#f589b8'; g.fillRect(0, 0, W, H);
  /* La cara: un óvalo ancho, pintado donde la esfera mira al frente. */
  const cx = CARA.cx * W, cy = CARA.cy * H, rx = CARA.rx * W, ry = CARA.ry * H, n = CARA.n;
  g.beginPath();
  for (let i = 0; i <= 140; i++) {
    const a = (i / 140) * Math.PI * 2, co = Math.cos(a), si = Math.sin(a);
    const x = cx + rx * Math.sign(co) * Math.pow(Math.abs(co), 2 / n);
    const y = cy + ry * Math.sign(si) * Math.pow(Math.abs(si), 2 / n);
    if (i) g.lineTo(x, y); else g.moveTo(x, y);
  }
  g.closePath();
  g.fillStyle = '#fffaf6'; g.fill();
  g.lineWidth = 9; g.strokeStyle = '#3d2229'; g.stroke();
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 4;
  return t;
}

const raiz = new THREE.Group();          /* se desplaza y gira por la habitación */
const cuerpo = new THREE.Group();        /* se aplasta y estira desde los pies */
const cabeza = new THREE.Group();        /* gira desde el cuello */
raiz.add(cuerpo);
cuerpo.add(cabeza);
cabeza.position.set(0, 1.12, 0);
escena.add(raiz);

/* Tronco, pies, cola y brazos */
const tronco = parte(elipsoide(0.62, 0.66, 0.52), matBlanco);
tronco.position.set(0, 0.72, 0);
cuerpo.add(tronco);

const pies = [-1, 1].map((s) => {
  const pie = parte(elipsoide(0.27, 0.2, 0.36, 28, 18), matBlanco);
  pie.position.set(0.27 * s, 0.2, 0.14);
  cuerpo.add(pie);
  return { pie, lado: s };
});

const cola = parte(elipsoide(0.2, 0.2, 0.2, 20, 14), matBlanco);
cola.position.set(0, 0.55, -0.52);
cuerpo.add(cola);

const brazos = [-1, 1].map((s) => {
  const hombro = new THREE.Group();
  hombro.position.set(0.5 * s, 1.04, 0.1);
  const brazo = parte(elipsoide(0.14, 0.3, 0.14, 24, 18), matBlanco);
  brazo.position.set(0, -0.24, 0);
  hombro.add(brazo);
  const mano = parte(elipsoide(0.18, 0.17, 0.18, 20, 14), matBlanco);
  mano.position.set(0, -0.5, 0.02);
  hombro.add(mano);
  cuerpo.add(hombro);
  return { hombro, lado: s };
});

/* Capucha con la cara pintada */
const capucha = parte(elipsoide(CAPUCHA.a, CAPUCHA.b, CAPUCHA.c, 72, 48),
  pintura(0xffffff, { map: texturaCabeza() }));
capucha.position.set(0, CAPUCHA.y, 0);
cabeza.add(capucha);

/* Borde de la capucha: un rollo que rodea la cara y la deja hundida, con profundidad. */
{
  const puntos = [];
  for (let i = 0; i < 96; i++) {
    const a = (i / 96) * Math.PI * 2, co = Math.cos(a), si = Math.sin(a);
    const u = CARA.cx + CARA.rx * Math.sign(co) * Math.pow(Math.abs(co), 2 / CARA.n);
    const v = CARA.cy + CARA.ry * Math.sign(si) * Math.pow(Math.abs(si), 2 / CARA.n);
    const phi = u * Math.PI * 2, theta = v * Math.PI;
    puntos.push(new THREE.Vector3(
      -Math.cos(phi) * Math.sin(theta) * CAPUCHA.a,
      Math.cos(theta) * CAPUCHA.b + CAPUCHA.y,
      Math.sin(phi) * Math.sin(theta) * CAPUCHA.c));
  }
  const rollo = new THREE.TubeGeometry(new THREE.CatmullRomCurve3(puntos, true), 192, 0.08, 12, true);
  cabeza.add(parte(rollo, matRosa, 0.03));
}

/* Orejas: una parada y una doblada hacia adelante */
const orejaParada = new THREE.Group();
orejaParada.position.set(-0.46, 1.66, -0.05);
orejaParada.add(parte(barrido(
  [[0, -0.2, 0], [-0.05, 0.55, 0], [-0.1, 1.3, 0.02], [-0.13, 1.75, 0.03]], perfilOreja(0.36)), matRosa));
cabeza.add(orejaParada);

const orejaDoblada = new THREE.Group();
orejaDoblada.position.set(0.46, 1.66, -0.05);
orejaDoblada.add(parte(barrido(
  [[0, -0.2, 0], [0.16, 0.42, 0], [0.3, 0.8, 0.14], [0.3, 0.9, 0.5], [0.24, 0.62, 0.82], [0.2, 0.22, 0.98]],
  perfilOreja(0.36)), matRosa));
cabeza.add(orejaDoblada);

/* Flor de cuatro pétalos en la base de la oreja parada */
const florGrupo = new THREE.Group();
[[0, 1], [1, 0], [0, -1], [-1, 0]].forEach((d) => {
  const petalo = parte(elipsoide(0.17, 0.17, 0.07, 20, 14), matBlanco, 0.03);
  petalo.position.set(d[0] * 0.19, d[1] * 0.19, 0);
  florGrupo.add(petalo);
});
const centroFlor = parte(elipsoide(0.1, 0.1, 0.07, 18, 12), matAmarillo, 0.022);
centroFlor.position.set(0, 0, 0.06);
florGrupo.add(centroFlor);
apoyar(florGrupo, -44, 50, 0.06);
florGrupo.rotateZ(0.78);
cabeza.add(florGrupo);

/* Rasgos */
const matOjo = new THREE.MeshPhongMaterial({ color: 0x241418, shininess: 140, specular: 0xffffff });
const ojos = [-1, 1].map((s) => {
  const ojo = new THREE.Mesh(elipsoide(0.13, 0.2, 0.05, 24, 16), matOjo);
  apoyar(ojo, 41 * s, -6, 0.012);
  cabeza.add(ojo);
  return ojo;
});

const nariz = parte(elipsoide(0.085, 0.06, 0.045, 20, 14), matAmarillo, 0.022);
apoyar(nariz, 0, -15, 0.02);
cabeza.add(nariz);

function trazoEnCara(puntos, radio) {
  const curva = new THREE.CatmullRomCurve3(puntos.map((q) => enCara(q[0], q[1], 0.012).p));
  return new THREE.Mesh(new THREE.TubeGeometry(curva, 20, radio, 8, false), linea);
}

const caraNeutral = new THREE.Group();
caraNeutral.add(trazoEnCara([[-6, -22.5], [-3, -24.6], [0, -25.3], [3, -24.6], [6, -22.5]], 0.018));
cabeza.add(caraNeutral);

const caraFeliz = new THREE.Group();
[-1, 1].forEach((s) => {
  caraFeliz.add(trazoEnCara([[41 * s - 7, -9], [41 * s - 3.5, -4], [41 * s, -2.5], [41 * s + 3.5, -4], [41 * s + 7, -9]], 0.026));
  const rubor = new THREE.Mesh(elipsoide(0.16, 0.095, 0.02, 20, 12),
    new THREE.MeshBasicMaterial({ color: 0xffa9c6, transparent: true, opacity: 0.8 }));
  apoyar(rubor, 50 * s, -20, 0.006);
  caraFeliz.add(rubor);
});
const bocaFeliz = parte(elipsoide(0.1, 0.08, 0.03, 20, 14), new THREE.MeshBasicMaterial({ color: 0xe8607a }), 0.02);
apoyar(bocaFeliz, 0, -25.5, 0.01);
caraFeliz.add(bocaFeliz);
caraFeliz.visible = false;
cabeza.add(caraFeliz);

/* Dibujitos planos que flotan: marca de enojo, estrellas, lágrimas. */
function dibujo(pintar) {
  const c = document.createElement('canvas');
  c.width = c.height = 96;
  const g = c.getContext('2d');
  g.lineJoin = 'round'; g.lineCap = 'round';
  pintar(g);
  const tx = new THREE.CanvasTexture(c);
  tx.colorSpace = THREE.SRGBColorSpace;
  return tx;
}

/* Caras de enojo, pena, llanto y sorpresa */
const caraEnojo = new THREE.Group();
const caraTriste = new THREE.Group();
const caraLlanto = new THREE.Group();
const caraSorpresa = new THREE.Group();
[-1, 1].forEach((s) => {
  /* Cejas: bajas hacia el centro es enojo; altas hacia el centro es pena. */
  caraEnojo.add(trazoEnCara([[32 * s, 7], [41 * s, 10.5], [50 * s, 13]], 0.028));
  caraTriste.add(trazoEnCara([[32 * s, 13], [41 * s, 10.5], [50 * s, 6]], 0.024));
  caraLlanto.add(trazoEnCara([[32 * s, 13], [41 * s, 10.5], [50 * s, 6]], 0.024));
  caraLlanto.add(trazoEnCara([[41 * s - 7, -4], [41 * s - 3.5, -7.5], [41 * s, -8.5], [41 * s + 3.5, -7.5], [41 * s + 7, -4]], 0.026));
  const colorado = new THREE.Mesh(elipsoide(0.17, 0.1, 0.02, 20, 12),
    new THREE.MeshBasicMaterial({ color: 0xff7d8f, transparent: true, opacity: 0.85 }));
  apoyar(colorado, 50 * s, -20, 0.006);
  caraEnojo.add(colorado);
});
const bocaAbajo = [[-6, -26.2], [-3, -24.3], [0, -23.7], [3, -24.3], [6, -26.2]];
caraEnojo.add(trazoEnCara(bocaAbajo, 0.02));
caraTriste.add(trazoEnCara(bocaAbajo, 0.018));
const bocaLlanto = parte(elipsoide(0.085, 0.07, 0.03, 18, 12), new THREE.MeshBasicMaterial({ color: 0xe8607a }), 0.02);
apoyar(bocaLlanto, 0, -26, 0.01);
caraLlanto.add(bocaLlanto);
const bocaO = new THREE.Mesh(elipsoide(0.05, 0.06, 0.02, 16, 10), linea);
apoyar(bocaO, 0, -25, 0.012);
caraSorpresa.add(bocaO);
[caraEnojo, caraTriste, caraLlanto, caraSorpresa].forEach((c) => { c.visible = false; cabeza.add(c); });
const caras = { neutral: caraNeutral, feliz: caraFeliz, enojo: caraEnojo, triste: caraTriste, llanto: caraLlanto, sorpresa: caraSorpresa };

/* Cara dormida: ojos cerrados y boca chiquita. */
const caraDormida = new THREE.Group();
[-1, 1].forEach((s) => {
  caraDormida.add(trazoEnCara([[41 * s - 7, -5], [41 * s - 3.5, -8], [41 * s, -9], [41 * s + 3.5, -8], [41 * s + 7, -5]], 0.024));
});
caraDormida.add(trazoEnCara([[-3, -24], [0, -24.8], [3, -24]], 0.016));
caraDormida.visible = false;
cabeza.add(caraDormida);
caras.dormida = caraDormida;

/* Boca abierta (llega la comida), masticando, ojos de estrella (su favorita) y cara agria (rakkyo). */
const caraAbierta = new THREE.Group();
const bocaGrande = parte(elipsoide(0.13, 0.12, 0.03, 20, 14), new THREE.MeshBasicMaterial({ color: 0x5c2233 }), 0.02);
apoyar(bocaGrande, 0, -26, 0.012);
caraAbierta.add(bocaGrande);
const lengua = new THREE.Mesh(elipsoide(0.08, 0.045, 0.02, 16, 10), new THREE.MeshBasicMaterial({ color: 0xff8fa8 }));
apoyar(lengua, 0, -28.6, 0.03);
caraAbierta.add(lengua);

const caraMastica = new THREE.Group();
caraMastica.add(trazoEnCara([[-5, -24.5], [-2.5, -26], [0, -24.8], [2.5, -26], [5, -24.5]], 0.018));
[-1, 1].forEach((s) => {
  const cachete = new THREE.Mesh(elipsoide(0.2, 0.13, 0.025, 20, 12),
    new THREE.MeshBasicMaterial({ color: 0xffa9c6, transparent: true, opacity: 0.85 }));
  apoyar(cachete, 48 * s, -20, 0.008);
  caraMastica.add(cachete);
});

const formaEstrella = new THREE.Shape();
for (let i = 0; i < 10; i++) {
  const a = Math.PI / 2 + (i * Math.PI) / 5, radio = i % 2 ? 0.075 : 0.17;
  if (i) formaEstrella.lineTo(Math.cos(a) * radio, Math.sin(a) * radio);
  else formaEstrella.moveTo(Math.cos(a) * radio, Math.sin(a) * radio);
}
formaEstrella.closePath();
const caraEstrellas = new THREE.Group();
[-1, 1].forEach((s) => {
  const fondo = new THREE.Mesh(new THREE.ShapeGeometry(formaEstrella), linea);
  fondo.scale.setScalar(1.28);
  apoyar(fondo, 41 * s, -6, 0.012);
  caraEstrellas.add(fondo);
  const estrella = new THREE.Mesh(new THREE.ShapeGeometry(formaEstrella), new THREE.MeshBasicMaterial({ color: 0xffd43b }));
  apoyar(estrella, 41 * s, -6, 0.02);
  caraEstrellas.add(estrella);
});
const bocaEstrellas = parte(elipsoide(0.1, 0.08, 0.03, 20, 14), new THREE.MeshBasicMaterial({ color: 0xe8607a }), 0.02);
apoyar(bocaEstrellas, 0, -25.5, 0.01);
caraEstrellas.add(bocaEstrellas);

const caraAgria = new THREE.Group();
[-1, 1].forEach((s) => caraAgria.add(trazoEnCara([[47 * s, -1], [37 * s, -6], [47 * s, -11]], 0.026)));
caraAgria.add(trazoEnCara([[-7, -25], [-3.5, -23.5], [0, -25.5], [3.5, -23.5], [7, -25]], 0.018));

[caraAbierta, caraMastica, caraEstrellas, caraAgria].forEach((c) => { c.visible = false; cabeza.add(c); });
Object.assign(caras, { abierta: caraAbierta, mastica: caraMastica, estrellas: caraEstrellas, agria: caraAgria });
/* Punto de la boca y lugar donde sostiene la comida, en coordenadas de la cabeza. */
const PUNTO_BOCA = enCara(0, -26, 0.05).p.clone();
const COMIDA_EN_BOCA = enCara(0, -27, 0.3).p.clone();

const marcaEnojo = new THREE.Sprite(new THREE.SpriteMaterial({
  map: dibujo((g) => {
    g.strokeStyle = '#ff4b6a'; g.lineWidth = 11;
    [[30, 14, 30, 34, 12, 34], [66, 14, 66, 34, 84, 34], [30, 82, 30, 62, 12, 62], [66, 82, 66, 62, 84, 62]].forEach((q) => {
      g.beginPath(); g.moveTo(q[0], q[1]); g.quadraticCurveTo(q[2], q[3], q[4], q[5]); g.stroke();
    });
  }),
  transparent: true, depthWrite: false
}));
marcaEnojo.position.set(0.95, 1.9, 0.75);
marcaEnojo.visible = false;
cabeza.add(marcaEnojo);

/* Manchas de suciedad: aparecen cuando pasa mucho tiempo sin cuidarla. */
const manchas = [];
const matMancha = new THREE.MeshBasicMaterial({ color: 0x8b6b52, transparent: true, opacity: 0.6, depthWrite: false });
[[58, 20, 0.2], [-22, -36, 0.15], [20, 56, 0.17]].forEach((q) => {
  const m = new THREE.Mesh(elipsoide(q[2], q[2] * 0.72, 0.02, 16, 10), matMancha);
  apoyar(m, q[0], q[1], 0.014);
  cabeza.add(m);
  manchas.push(m);
});
[[0.26, 0.86, 0.47], [-0.3, 0.5, 0.43]].forEach((q) => {
  const m = new THREE.Mesh(elipsoide(0.16, 0.12, 0.02, 16, 10), matMancha);
  m.position.set(q[0], q[1], q[2]);
  cuerpo.add(m);
  manchas.push(m);
});
manchas.forEach((m) => { m.visible = false; });

/* Zonas invisibles para saber si el dedo la toca */
const zonas = [
  new THREE.Mesh(new THREE.SphereGeometry(1.4, 12, 8), new THREE.MeshBasicMaterial({ visible: false })),
  new THREE.Mesh(new THREE.SphereGeometry(0.85, 12, 8), new THREE.MeshBasicMaterial({ visible: false }))
];
zonas[0].position.set(0, 2.1, 0);
zonas[1].position.set(0, 0.7, 0);
zonas.forEach((z) => raiz.add(z));

/* ---------- Habitación ---------- */

function texturaDe(ancho, alto, dibujar, repX, repY) {
  const c = document.createElement('canvas');
  c.width = ancho; c.height = alto;
  dibujar(c.getContext('2d'), ancho, alto);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.repeat.set(repX, repY);
  return t;
}

/* La sala vive en su propio grupo, para poder apagarla cuando ella está en otro ambiente.
   caja() y cilindro() agregan a 'padre', que apunta a la sala mientras se arma. */
const grupoSala = new THREE.Group();
escena.add(grupoSala);
let padre = grupoSala;

const suelo = new THREE.Mesh(new THREE.PlaneGeometry(ANCHO_CUARTO, 30), pintura(0xffffff, {
  map: texturaDe(256, 256, (g, w, h) => {
    g.fillStyle = '#f7dcc6'; g.fillRect(0, 0, w, h);
    g.fillStyle = '#eccdb3'; g.fillRect(0, h - 6, w, 6);
  }, 1, 9)
}));
suelo.rotation.x = -Math.PI / 2;
suelo.receiveShadow = true;
grupoSala.add(suelo);

const pared = new THREE.Mesh(new THREE.PlaneGeometry(ANCHO_CUARTO, 18), new THREE.MeshBasicMaterial({
  map: texturaDe(128, 128, (g, w, h) => {
    g.fillStyle = '#ffeaf2'; g.fillRect(0, 0, w, h);
    g.fillStyle = '#ffd9e6';
    g.beginPath(); g.arc(32, 32, 9, 0, 7); g.arc(96, 96, 9, 0, 7); g.fill();
  }, 6.6, 6.6)
}));
pared.position.set(0, 9, -5.2);
grupoSala.add(pared);

function caja(w, h, d, color, x, y, z, basico) {
  const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d),
    basico ? new THREE.MeshBasicMaterial({ color }) : pintura(color));
  m.position.set(x, y, z);
  m.castShadow = !basico;
  padre.add(m);
  return m;
}
function cilindro(r1, r2, h, color, x, y, z) {
  const m = new THREE.Mesh(new THREE.CylinderGeometry(r1, r2, h, 40), pintura(color));
  m.position.set(x, y, z);
  m.castShadow = true;
  m.receiveShadow = true;
  padre.add(m);
  return m;
}

caja(ANCHO_CUARTO, 0.5, 0.2, 0xfffaf6, 0, 0.25, -5.1);

const alfombra = new THREE.Mesh(new THREE.CircleGeometry(3.9, 72), pintura(0xffc4d8));
alfombra.rotation.x = -Math.PI / 2; alfombra.position.y = 0.012; alfombra.receiveShadow = true;
grupoSala.add(alfombra);
const ribete = new THREE.Mesh(new THREE.RingGeometry(3.25, 3.4, 72), new THREE.MeshBasicMaterial({ color: 0xfff3f7 }));
ribete.rotation.x = -Math.PI / 2; ribete.position.y = 0.02;
grupoSala.add(ribete);

/* Ventana */
caja(3.9, 3.9, 0.2, 0xfffaf6, -5.6, 4.4, -5.1);
caja(3.4, 3.4, 0.22, 0xbfe6ff, -5.6, 4.4, -5.08, true);
caja(0.16, 3.4, 0.26, 0xfffaf6, -5.6, 4.4, -5.06);
caja(3.4, 0.16, 0.26, 0xfffaf6, -5.6, 4.4, -5.06);
[[-6.4, 5.2, 0.55], [-5.9, 5.35, 0.42], [-4.9, 3.7, 0.5]].forEach((n) => {
  const nube = new THREE.Mesh(new THREE.CircleGeometry(n[2], 24), new THREE.MeshBasicMaterial({ color: 0xffffff }));
  nube.scale.set(1.7, 0.75, 1); nube.position.set(n[0], n[1], -4.96);
  grupoSala.add(nube);
});

/* Repisa con libros */
caja(3.2, 0.14, 0.7, 0xfffaf6, 5.4, 4.5, -4.8);
[[4.3, 0xffb3cd, 0.95], [4.62, 0xbfe0ff, 1.15], [4.94, 0xfff0a8, 0.85], [6.2, 0xf589b8, 0.6]].forEach((l) => {
  caja(l[0] > 6 ? 0.8 : 0.26, l[2], 0.5, l[1], l[0], 4.57 + l[2] / 2, -4.8);
});

/* Cuadro en la pared */
caja(1.5, 1.8, 0.12, 0xfffaf6, 1.6, 4.3, -5.1);
caja(1.2, 1.5, 0.14, 0xffd9e6, 1.6, 4.3, -5.1, true);

/* Banderines colgando de la pared */
const triangulo = new THREE.Shape();
triangulo.moveTo(-0.34, 0); triangulo.lineTo(0.34, 0); triangulo.lineTo(0, -0.66); triangulo.closePath();
const geoBanderin = new THREE.ShapeGeometry(triangulo);
[0xf589b8, 0xfff0a8, 0xbfe0ff, 0xfffaf6, 0xffb3cd].forEach((color, c, lista) => {
  const material = new THREE.MeshBasicMaterial({ color });
  for (let i = c; i < 21; i += lista.length) {
    const k = i / 20;
    const banderin = new THREE.Mesh(geoBanderin, material);
    banderin.position.set(-8.6 + k * 17.2, 6.2 - 0.5 * Math.sin(k * Math.PI), -4.5);
    banderin.rotation.z = -0.09 * Math.cos(k * Math.PI);
    grupoSala.add(banderin);
  }
});

/* Planta */
cilindro(0.5, 0.38, 0.75, 0xfffaf6, -5.3, 0.38, -3.3);
[[-0.28, 1.25, 0.3], [0.3, 1.35, -0.25], [0, 1.6, 0]].forEach((h) => {
  const hoja = new THREE.Mesh(elipsoide(0.3, 0.62, 0.18, 20, 14), pintura(0x9fdcab));
  hoja.position.set(-5.3 + h[0], h[1], -3.3);
  hoja.rotation.z = h[2] * 1.4;
  hoja.castShadow = true;
  grupoSala.add(hoja);
});

/* Mancha de sol que entra por la ventana */
const rayoDeSol = new THREE.Mesh(new THREE.PlaneGeometry(3.6, 5.2),
  new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.2, depthWrite: false }));
rayoDeSol.rotation.x = -Math.PI / 2;
rayoDeSol.rotation.z = 0.3;
rayoDeSol.position.set(-3.6, 0.03, -1.8);
grupoSala.add(rayoDeSol);

/* Brillos que flotan en el aire */
const texturaBrillo = (() => {
  const c = document.createElement('canvas');
  c.width = c.height = 64;
  const g = c.getContext('2d'), d = g.createRadialGradient(32, 32, 0, 32, 32, 32);
  d.addColorStop(0, 'rgba(255,255,255,1)');
  d.addColorStop(0.25, 'rgba(255,250,220,.7)');
  d.addColorStop(1, 'rgba(255,250,220,0)');
  g.fillStyle = d; g.fillRect(0, 0, 64, 64);
  return new THREE.CanvasTexture(c);
})();
const grupoBrillos = new THREE.Group();
escena.add(grupoBrillos);
const brillos = [];
for (let i = 0; i < 16; i++) {
  const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: texturaBrillo, transparent: true, depthWrite: false }));
  s.position.set((Math.random() * 2 - 1) * 7, 0.6 + Math.random() * 5.2, -4.2 + Math.random() * 5);
  const tam = 0.14 + Math.random() * 0.2;
  s.scale.set(tam, tam, 1);
  grupoBrillos.add(s);
  brillos.push({ s, fase: Math.random() * 6.28, vel: 0.08 + Math.random() * 0.12 });
}
function moverBrillos(dt) {
  brillos.forEach((b) => {
    b.s.position.y += b.vel * dt;
    if (b.s.position.y > 6.2) b.s.position.y = 0.5;
    b.s.material.opacity = 0.35 + 0.35 * Math.sin(t * 1.6 + b.fase);
  });
}

/* Polvito al caer de cada salto */
const polvos = [];
function soltarPolvo() {
  if (polvos.length > 8) return;
  [-1, 1].forEach((lado) => {
    const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: texturaBrillo, transparent: true, depthWrite: false }));
    const x0 = raiz.position.x + lado * 0.4;
    s.position.set(x0, 0.16, raiz.position.z + 0.3);
    escena.add(s);
    polvos.push({ s, nace: t, lado, x0 });
  });
}
function moverPolvo() {
  for (let i = polvos.length - 1; i >= 0; i--) {
    const p = polvos[i], edad = (t - p.nace) / 0.45;
    if (edad >= 1) { escena.remove(p.s); p.s.material.dispose(); polvos.splice(i, 1); continue; }
    const tam = 0.3 + 0.7 * edad;
    p.s.scale.set(tam, tam * 0.6, 1);
    p.s.position.x = p.x0 + p.lado * 0.4 * edad;
    p.s.material.opacity = 0.75 * (1 - edad);
  }
}

/* Mesita con torta */
cilindro(0.16, 0.26, 1.25, 0xfffaf6, 5.1, 0.62, -3.2);
cilindro(1.25, 1.25, 0.12, 0xffd9e6, 5.1, 1.3, -3.2);
cilindro(0.82, 0.82, 0.05, 0xfffaf6, 5.1, 1.39, -3.2);
cilindro(0.62, 0.62, 0.5, 0xfff3de, 5.1, 1.66, -3.2);
cilindro(0.65, 0.65, 0.16, 0xf589b8, 5.1, 1.95, -3.2);
const fresa = new THREE.Mesh(new THREE.SphereGeometry(0.15, 20, 14), pintura(0xff4f6d));
fresa.position.set(5.1, 2.15, -3.2); fresa.castShadow = true;
grupoSala.add(fresa);
padre = escena;

/* Los otros ambientes, en cuartos.js. */
const cuartos = construirCuartos(escena, { pintura, parte, elipsoide, texturaDe });
const gruposCuarto = [grupoSala, ...cuartos.grupos];
escena.updateMatrixWorld(true);
const CUARTO_COCINA = 1;
/* Dónde queda su raíz cuando está sentada en la silla de la cocina. */
const ASIENTO = cuartos.silla.getWorldPosition(new THREE.Vector3());
ASIENTO.y = 1.35;
ASIENTO.z += 0.15;
const CUARTO_BANO = 2;
/* Dentro de la bañera: sentadita en el agua, con la cara entera por encima del borde
   (más abajo, el borde le tapaba la boca). */
const EN_BANERA = cuartos.banera.getWorldPosition(new THREE.Vector3());
EN_BANERA.y = 0.9;
const CUARTO_PATIO = 3;

/* Luces */
escena.add(new THREE.HemisphereLight(0xfff6fa, 0xf5cdb8, 2.2));
const sol = new THREE.DirectionalLight(0xffffff, 1.7);
sol.position.set(-5, 10, 8);
sol.castShadow = true;
sol.shadow.mapSize.set(1024, 1024);
sol.shadow.camera.left = -9; sol.shadow.camera.right = 9;
sol.shadow.camera.top = 9; sol.shadow.camera.bottom = -9;
sol.shadow.camera.near = 1; sol.shadow.camera.far = 40;
sol.shadow.bias = -0.0006; sol.shadow.normalBias = 0.03;
escena.add(sol);
escena.add(sol.target);

/* ---------- Movimiento ----------
   Los resortes avanzan en pasos fijos de 1/240 s: el movimiento es el mismo
   a 30, 60, 90 o 120 cuadros por segundo. */

class Resorte {
  constructor(k, c) { this.x = 0; this.v = 0; this.meta = 0; this.k = k; this.c = c; }
  paso(h) { this.v += (-this.k * (this.x - this.meta) - this.c * this.v) * h; this.x += this.v * h; }
}

const r = {
  aplastar: new Resorte(260, 14),
  salto: new Resorte(150, 13),
  giro: new Resorte(55, 13),
  vuelta: new Resorte(40, 9),
  cabezaLado: new Resorte(110, 17),
  cabezaAlto: new Resorte(110, 17),
  orejaLado: new Resorte(80, 6),
  orejaFondo: new Resorte(60, 5),
  brazos: new Resorte(120, 13),
  camX: new Resorte(26, 10),
  camY: new Resorte(26, 10),
  camAlza: new Resorte(20, 9),
  /* Tentetieso: al recibir un golpe se ladea y vuelve sola, bamboleándose. */
  ladeoX: new Resorte(75, 4.5),
  ladeoZ: new Resorte(75, 4.5),
  empuje: new Resorte(60, 9),
  caida: new Resorte(40, 9),
  asiento: new Resorte(60, 12)
};

const PASO = 1 / 240, MAX_PASOS = 60;
/* Zona donde puede andar: no llega hasta la mesita del fondo. */
const LIMITE = { x: 3.4, zMin: -1.2, zMax: 1.2 };
let t = 0, acumulado = 0, ultimo = 0;
let viaje = null;
let proximoPaseo = 5;
let ultimoToque = -10;

/* ---------- Ambientes y estados ----------
   Un solo dueño de lo que hace My Melody:
     'libre'       pasea, juega y responde a los gestos.
     'cargada'     la llevas con el dedo.
     'cayendo'     la soltaste y va al piso.
     'transicion'  cambio de ambiente: se ignoran los toques.
   Cada estado que no es 'libre' tiene un tiempo máximo: si algo falla, vuelve sola. */
let cuarto = 0;
let estado = 'libre', estadoDesde = 0;
const MAX_ESTADO = { cargada: 30, cayendo: 2, transicion: 2.5, sentada: 90, comiendo: 4, banera: 150, columpio: 120 };
let cambio = null;
let mareoHasta = 0;
const GRAVEDAD = 30;
const carga = { offset: new THREE.Vector3(), z: 0, meta: new THREE.Vector3(), previa: new THREE.Vector3(), vel: new THREE.Vector3() };
const planoCarga = new THREE.Plane(new THREE.Vector3(0, 0, 1), 0);
const caida = { h0: 0, x0: 0, z0: 0, x1: 0, z1: 0, y1: 0, dur: 0, inicio: 0, alTerminar: 'libre', luego: null, despues: null, arco: 0 };
const centro = () => CUARTOS[cuarto].x;
function cambiarEstado(nuevo) { estado = nuevo; estadoDesde = t; }
/* La cocina (cocina.js) se crea al final del archivo; hasta entonces vale null. */
let cocina = null;
/* Los corazones y la tiendita (tienda.js), también se crean al final. */
let tienda = null;
/* El patio (patio.js): flores, regadera y Kuromi. */
let patio = null;
/* Los encargos del día y las Notas Rosas (encargos.js). */
let encargos = null;
const hambrienta = () => !!cocina && cocina.hambre() > 0.8;
/* Lo que está comiendo y en qué momento va. */
const comida = { modelo: null, inicio: 0, mordidas: 0, enSilla: false, reaccion: 'normal', frase: '', reaccionado: false };
const enSilla = () => estado === 'sentada' || (estado === 'comiendo' && comida.enSilla);
/* Acomodada en un mueble: en la silla, en la bañera o en el columpio. Ahí también responde a los gestos. */
const acomodada = () => estado === 'sentada' || estado === 'banera' || estado === 'columpio';
const enMueble = () => enSilla() || estado === 'banera' || estado === 'columpio';
const alturaMueble = () => (estado === 'banera' ? EN_BANERA.y : ASIENTO.y);
const responde = () => estado === 'libre' || acomodada();
let anticipando = false, negarHasta = 0, estremecerHasta = 0, proximoRugido = 0, panzaHasta = 0, proximaBarra = 0;
let proximoAvisoHambre = 0, ultimaFrase = '';
/* Durante la prueba del mono loco no habla ni suena: si no, quedan frases y sonidos acumulados. */
let silencio = false;
/* Muebles que se pueden tocar (por ahora el refri): { objeto, cuarto, alTocar }. */
const tocables = [];
let saludoHasta = 0;
let felizHasta = 0;
const parpadeo = { proximo: 2.2, inicio: -1 };

/* ---------- Ánimo ----------
   enojo: sube con cada golpe y baja solo con el tiempo.
   pena: sube si le siguen pegando o si la olvidan.
   suciedad: aparece con el olvido y solo se quita cuidándola. */
let enojo = 0, pena = 0, suciedad = 0;
let gesto = null, gestoHasta = 0;
let baileHasta = 0, proximaLagrima = 0;

/* Sentarse y dormir. Se duerme sola si nadie la toca durante este tiempo. */
const SEGUNDOS_PARA_DORMIRSE = 45;
let dormida = false, sentadaHasta = 0, proximoZ = 0;
const texturaZ = dibujo((g) => {
  g.font = '800 70px "Segoe UI", sans-serif';
  g.textAlign = 'center'; g.textBaseline = 'middle';
  g.lineWidth = 9; g.strokeStyle = '#3d2229'; g.strokeText('Z', 48, 50);
  g.fillStyle = '#bfe0ff'; g.fillText('Z', 48, 50);
});

function gestoPasajero(nombre, segundos) { gesto = nombre; gestoHasta = t + segundos; }
function mostrarFeliz(segundos) { felizHasta = t + segundos; gestoPasajero('feliz', segundos); }
const estaTriste = () => pena > 0.25 || suciedad > 0;
const estaEnojada = () => enojo > 0.55 && !estaTriste();

function caraDeFondo() {
  if (dormida) return 'dormida';
  if (pena > 0.6) return 'llanto';
  if (estaTriste()) return 'triste';
  if (hambrienta()) return 'triste';
  if (enojo > 0.55) return 'enojo';
  return 'neutral';
}

function aplicarCara() {
  if (gesto && t > gestoHasta) gesto = null;
  const actual = gesto || caraDeFondo();
  for (const nombre in caras) caras[nombre].visible = nombre === actual;
  const abiertos = !['feliz', 'llanto', 'dormida', 'estrellas', 'agria'].includes(actual);
  ojos.forEach((o) => { o.visible = abiertos; });
  marcaEnojo.visible = actual === 'enojo';
  return actual;
}

function verManchas() {
  const n = Math.ceil(suciedad * manchas.length - 0.001);
  manchas.forEach((m, i) => { m.visible = i < n; });
}

/* Regla del olvido. El primer día sin visita no pasa nada.
   A los 2 días aparecen dos manchas y está triste. A los 4, toda sucia y llorando. */
const DIAS_PARA_ENSUCIARSE = 2;
const DIAS_PARA_LLORAR = 4;
let diasSinVisita = 0;

function estadoPorOlvido(dias) {
  if (dias < DIAS_PARA_ENSUCIARSE) return { suciedad: 0, pena: 0 };
  if (dias >= DIAS_PARA_LLORAR) return { suciedad: 1, pena: 1 };
  const avance = (dias - DIAS_PARA_ENSUCIARSE) / (DIAS_PARA_LLORAR - DIAS_PARA_ENSUCIARSE);
  return { suciedad: 0.4 + 0.4 * avance, pena: 0.4 + 0.3 * avance };
}

function rotularOlvido() {
  document.getElementById('btn-olvido').textContent = diasSinVisita
    ? 'Pasar otro día (van ' + diasSinVisita + ')'
    : 'Pasar un día';
}

/* Para probar: simula que pasó un día más sin visitarla. */
function pasarUnDia() {
  diasSinVisita++;
  const e = estadoPorOlvido(diasSinVisita);
  suciedad = Math.round(e.suciedad * 100) / 100;
  pena = Math.max(pena, e.pena);
  if (suciedad > 0) { enojo = 0; nota = 0; gesto = null; }
  if (cocina) cocina.sumarHoras(24);
  if (patio) patio.pasarUnDia();
  if (encargos) encargos.pasarUnDia();
  verManchas();
  rotularOlvido();
}

function aperturaDeOjos() {
  if (parpadeo.inicio < 0) {
    if (t >= parpadeo.proximo) parpadeo.inicio = t;
    return 1;
  }
  const f = t - parpadeo.inicio;
  if (f < 0.06) return 1 - 0.9 * (f / 0.06);
  if (f < 0.11) return 0.1;
  if (f < 0.2) return 0.1 + 0.9 * ((f - 0.11) / 0.09);
  parpadeo.inicio = -1;
  parpadeo.proximo = t + (Math.random() < 0.2 ? 0.25 : 2.4 + Math.random() * 3.6);
  return 1;
}

function aterrizar(fuerza) {
  r.aplastar.v -= 1.7 * fuerza;
  r.orejaFondo.v += 2.4 * fuerza;
  r.orejaLado.v += (Math.random() - 0.5) * 1.6;
  soltarPolvo();
}

function irA(x, z) {
  dormida = false; sentadaHasta = 0;
  const cx = centro();
  x = Math.max(cx - LIMITE.x, Math.min(cx + LIMITE.x, x));
  z = Math.max(LIMITE.zMin, Math.min(LIMITE.zMax, z));
  const dx = x - raiz.position.x, dz = z - raiz.position.z, d = Math.hypot(dx, dz);
  if (d < 0.25) return;
  const saltos = Math.max(1, Math.round(d / 0.95));
  viaje = { x0: raiz.position.x, z0: raiz.position.z, x1: x, z1: z, inicio: t, dur: saltos * 0.34, saltos, hecho: 0 };
  /* Gira por el camino más corto hacia donde va. */
  const destino = Math.atan2(dx, dz);
  r.giro.meta = r.giro.x + Math.atan2(Math.sin(destino - r.giro.x), Math.cos(destino - r.giro.x));
  r.aplastar.v -= 1.0;
}

function pasear() {
  const azar = Math.random();
  if (hambrienta()) {
    /* Con hambre no baila ni saluda: se sienta un rato o camina buscando comida. */
    if (azar < 0.45) { sentadaHasta = t + 5; proximoPaseo = t + 7 + Math.random() * 4; return; }
    irA(centro() + (Math.random() * 2 - 1) * LIMITE.x, LIMITE.zMin + Math.random() * (LIMITE.zMax - LIMITE.zMin));
    return;
  }
  if (azar < 0.25) { saludoHasta = t + 1.3; proximoPaseo = t + 4 + Math.random() * 4; return; }
  if (azar < 0.45) { baileHasta = t + 2.4; mostrarFeliz(2.4); proximoPaseo = t + 5 + Math.random() * 4; return; }
  if (azar < 0.6) { sentadaHasta = t + 5; proximoPaseo = t + 7 + Math.random() * 4; return; }
  irA(centro() + (Math.random() * 2 - 1) * LIMITE.x, LIMITE.zMin + Math.random() * (LIMITE.zMax - LIMITE.zMin));
}

/* ---------- Corazones ---------- */

const texturaCorazon = (() => {
  const c = document.createElement('canvas');
  c.width = c.height = 128;
  const g = c.getContext('2d');
  g.translate(64, 60); g.scale(1.5, 1.5);
  g.beginPath();
  g.moveTo(0, -10); g.bezierCurveTo(-12, -30, -40, -12, -24, 12); g.lineTo(0, 36); g.lineTo(24, 12);
  g.bezierCurveTo(40, -12, 12, -30, 0, -10); g.closePath();
  g.fillStyle = '#ff6f9f'; g.fill();
  g.lineWidth = 5; g.lineJoin = 'round'; g.strokeStyle = '#3d2229'; g.stroke();
  const tx = new THREE.CanvasTexture(c);
  tx.colorSpace = THREE.SRGBColorSpace;
  return tx;
})();
const corazones = [];

function soltarCorazon(desvio) {
  if (corazones.length >= 14) return;
  const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: texturaCorazon, transparent: true, depthWrite: false }));
  s.position.set(raiz.position.x + (desvio || (Math.random() - 0.5) * 1.6), raiz.position.y + 3.0, raiz.position.z + 1.3);
  escena.add(s);
  corazones.push({ s, nace: t, x: s.position.x, y: s.position.y, deriva: (Math.random() - 0.5) * 1.2 });
}

function moverCorazones() {
  for (let i = corazones.length - 1; i >= 0; i--) {
    const c = corazones[i], edad = (t - c.nace) / 1.3;
    if (edad >= 1) { escena.remove(c.s); c.s.material.dispose(); corazones.splice(i, 1); continue; }
    const sube = 1 - (1 - edad) * (1 - edad), tam = 0.35 + 0.45 * Math.min(1, edad * 4);
    c.s.position.x = c.x + c.deriva * edad;
    c.s.position.y = c.y + 1.7 * sube;
    c.s.scale.set(tam, tam, 1);
    c.s.material.opacity = edad < 0.7 ? 1 : (1 - edad) / 0.3;
  }
}

/* ---------- Sonido ----------
   Solo para esta prueba el sonido se genera al vuelo. En el juego serán archivos. */

const ESCALA = [523.25, 587.33, 659.25, 698.46, 783.99, 880.0, 987.77, 1046.5];
let audio = null, busEfectos = null, busMusica = null;
let nota = 0;
/* Volúmenes de Opciones, guardados en este navegador. */
const volumen = { musica: 0.6, efectos: 0.9 };
try { Object.assign(volumen, JSON.parse(localStorage.getItem('nella-volumen') || '{}')); } catch (err) { /* sin almacenamiento */ }

/* En iPhone el modo silencio apaga el audio de las páginas web. Pedir el modo
   "reproducción" lo deja sonar, como en un juego. Existe desde iOS 17. */
try { if (navigator.audioSession) navigator.audioSession.type = 'playback'; } catch (err) { /* sin soporte */ }

function contextoDeAudio() {
  if (silencio) return null;
  if (!audio) {
    const Clase = window.AudioContext || window.webkitAudioContext;
    if (!Clase) return null;
    audio = new Clase();
    busEfectos = audio.createGain();
    busEfectos.gain.value = volumen.efectos;
    busEfectos.connect(audio.destination);
    busMusica = audio.createGain();
    busMusica.gain.value = volumen.musica;
    busMusica.connect(audio.destination);
  }
  if (audio.state !== 'running') {
    const pedido = audio.resume();
    if (pedido && pedido.catch) pedido.catch(() => {});
  }
  return audio;
}

/* Con el dedo, los navegadores solo dejan arrancar el audio al terminar el toque,
   no al apoyarlo (con el mouse sí vale al apretar; por eso en la laptop sonaba).
   Este oyente lo despierta en el primer gesto válido y después se quita solo. */
const GESTOS_QUE_DESPIERTAN = ['touchend', 'pointerup', 'click', 'keydown'];
function despertarAudio() {
  const ctx = contextoDeAudio();
  if (!ctx) return;
  if (ctx.state === 'running') {
    GESTOS_QUE_DESPIERTAN.forEach((tipo) => document.removeEventListener(tipo, despertarAudio, true));
    return;
  }
  /* Un sonido vacío de un instante termina de despertarlo en iOS. */
  const vacio = ctx.createBufferSource();
  vacio.buffer = ctx.createBuffer(1, 1, 22050);
  vacio.connect(ctx.destination);
  vacio.start(0);
}
GESTOS_QUE_DESPIERTAN.forEach((tipo) => document.addEventListener(tipo, despertarAudio, true));

/* Una nota con timbre de campanita, que se apaga sola. */
function campanita(ctx, destino, frecuencia, t0, fuerza, largo) {
  const salida = ctx.createGain();
  salida.gain.setValueAtTime(0.0001, t0);
  salida.gain.exponentialRampToValueAtTime(fuerza, t0 + 0.004);
  salida.gain.exponentialRampToValueAtTime(0.0001, t0 + largo);
  salida.connect(destino);
  [[1, 1], [2, 0.35], [3.01, 0.12], [4.2, 0.05]].forEach((parcial) => {
    const osc = ctx.createOscillator(), g = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.value = frecuencia * parcial[0];
    g.gain.value = parcial[1];
    osc.connect(g); g.connect(salida);
    osc.start(t0); osc.stop(t0 + largo + 0.1);
  });
}

function tocar(frecuencia, espera, fuerza) {
  const ctx = contextoDeAudio();
  if (!ctx) return;
  campanita(ctx, busEfectos, frecuencia, ctx.currentTime + (espera || 0), fuerza || 0.2, 1.4);
}

/* ---------- Chispas: estrellas, lágrimas y destellos ---------- */

const texturaEstrella = dibujo((g) => {
  g.translate(48, 50);
  g.beginPath();
  for (let i = 0; i < 10; i++) {
    const a = -Math.PI / 2 + (i * Math.PI) / 5, radio = i % 2 ? 17 : 38;
    g.lineTo(Math.cos(a) * radio, Math.sin(a) * radio);
  }
  g.closePath();
  g.fillStyle = '#ffd43b'; g.fill();
  g.lineWidth = 6; g.strokeStyle = '#3d2229'; g.stroke();
});
const texturaLagrima = dibujo((g) => {
  g.beginPath();
  g.moveTo(48, 12); g.bezierCurveTo(78, 52, 72, 84, 48, 84); g.bezierCurveTo(24, 84, 18, 52, 48, 12);
  g.closePath();
  g.fillStyle = '#8fd3ff'; g.fill();
  g.lineWidth = 6; g.strokeStyle = '#3d2229'; g.stroke();
});

const chispas = [];
function chispa(textura, x, y, z, vx, vy, vida, tam, gravedad) {
  if (chispas.length > 60) return;
  const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: textura, transparent: true, depthWrite: false }));
  s.position.set(x, y, z);
  s.scale.set(tam, tam, 1);
  escena.add(s);
  chispas.push({ s, nace: t, x, y, vx, vy, vida, g: gravedad || 0 });
}
function moverChispas() {
  for (let i = chispas.length - 1; i >= 0; i--) {
    const c = chispas[i], e = t - c.nace;
    if (e >= c.vida) { escena.remove(c.s); c.s.material.dispose(); chispas.splice(i, 1); continue; }
    c.s.position.x = c.x + c.vx * e;
    c.s.position.y = c.y + c.vy * e - 0.5 * c.g * e * e;
    c.s.material.opacity = Math.min(1, (c.vida - e) / (c.vida * 0.35));
  }
}

function sonarGolpe() {
  const ctx = contextoDeAudio();
  if (!ctx) return;
  const t0 = ctx.currentTime, osc = ctx.createOscillator(), g = ctx.createGain();
  osc.type = 'sine';
  osc.frequency.setValueAtTime(280, t0);
  osc.frequency.exponentialRampToValueAtTime(85, t0 + 0.13);
  g.gain.setValueAtTime(0.28, t0);
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.2);
  osc.connect(g); g.connect(busEfectos);
  osc.start(t0); osc.stop(t0 + 0.22);
}

/* Un golpe o toque brusco. dx: hacia qué lado va el empujón. suave: un toque seco, no un manotazo. */
function golpear(dx, suave) {
  ultimoToque = t;
  dormida = false; sentadaHasta = 0;   /* un golpe la despierta de mala manera */
  if (viaje) viaje.detener = true;
  const lado = Math.sign(dx) || (Math.random() < 0.5 ? -1 : 1), fuerza = suave ? 0.6 : 1;
  r.ladeoZ.v -= lado * 5 * fuerza;
  r.ladeoX.v -= 2.2 * fuerza;
  r.empuje.v += lado * 3 * fuerza;
  r.aplastar.v -= 1.2 * fuerza;
  r.orejaLado.v -= lado * 3 * fuerza;
  r.orejaFondo.v += 2.5 * fuerza;
  for (let i = 0; i < 4; i++) {
    const a = -0.4 + i * 0.5;
    chispa(texturaEstrella, raiz.position.x - lado * 0.8, raiz.position.y + 2.5, raiz.position.z + 1.3,
      -lado * Math.cos(a) * 2.4, Math.sin(a) * 2.4 + 1, 0.55, 0.42, 5);
  }
  sonarGolpe();
  nota = 0;
  if (enojo >= 0.85) pena = Math.min(1, pena + 0.4);   /* si ya está enojada y le siguen pegando, llora */
  enojo = Math.min(1, enojo + (suave ? 0.3 : 0.45));
  baileHasta = 0;
  gestoPasajero('sorpresa', 0.45);
}

/* Cada caricia quita una mancha. Al quedar limpia, se le pasa la pena. */
/* Una caricia. */
function reaccionar() {
  ultimoToque = t;
  if (viaje) viaje.detener = true;
  if (dormida) {
    /* Una caricia la despierta contenta. */
    dormida = false;
    r.aplastar.v -= 1.2;
    mostrarFeliz(1.2);
    soltarCorazon();
    tocar(ESCALA[0], 0, 0.14);
    return;
  }
  if (suciedad > 0 && estado !== 'banera') {
    /* Sucia, las caricias no la limpian: necesita el baño. */
    r.aplastar.v -= 0.6;
    tocar(392, 0, 0.1);
    if (t > proximoPedidoBano) { proximoPedidoBano = t + 12; decir('Necesito un bañito…'); }
    return;
  }
  if (enojo > 0.3 || pena > 0.25) {
    /* Primero hay que contentarla: cada caricia le baja el enojo y la pena. */
    enojo = Math.max(0, enojo - 0.3);
    pena = Math.max(0, pena - 0.3);
    r.aplastar.v -= 0.9;
    tocar(392, 0, 0.12);
    if (enojo <= 0.3 && pena <= 0.25) { soltarCorazon(); mostrarFeliz(0.9); }
    return;
  }
  r.aplastar.v -= 2.4;
  r.orejaLado.v += 2.2;
  r.orejaFondo.v += 1.6;
  mostrarFeliz(0.9);
  soltarCorazon();
  ganarCorazones(1);
  tocar(ESCALA[nota]);
  nota++;
  if (nota === ESCALA.length) {
    nota = 0;
    r.salto.v += 9;
    r.vuelta.meta += Math.PI * 2;
    mostrarFeliz(1.9);
    [0, 2, 4, 7].forEach((grado, i) => tocar(ESCALA[grado], 0.25 + i * 0.11, 0.16));
    for (let i = 0; i < 6; i++) soltarCorazon((i - 2.5) * 0.5);
    ganarCorazones(3);   /* premio por completar la escala */
    if (encargos) encargos.registrar('escala');
  }
}

/* Los corazones del cariño se juntan como moneda (hasta un tope por día). */
function ganarCorazones(n) {
  if (tienda) tienda.ganar('caricias', n, cabezaEnPantallaCliente());
}
function cabezaEnPantallaCliente() {
  const p = cabezaEnPantalla(), caja = marco.getBoundingClientRect();
  return { x: caja.left + p.x, y: caja.top + p.y + caja.height * 0.08 };
}

/* ---------- Puntero ---------- */

const rayo = new THREE.Raycaster();
const ndc = new THREE.Vector2();
const PISO = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
const puntero = { abajo: false, x: 0, y: 0, visto: -10, recorrido: 0, cx: 0, cy: 0 };
const diag = { tipo: '—', presion: 0, tipos: {}, muestras: 1, inclinacion: '' };

function aNdc(e) {
  const caja = lienzo.getBoundingClientRect();
  ndc.set(((e.clientX - caja.left) / caja.width) * 2 - 1, -((e.clientY - caja.top) / caja.height) * 2 + 1);
  puntero.x = ndc.x; puntero.y = ndc.y;
  rayo.setFromCamera(ndc, camara);
}
const laToca = () => rayo.intersectObjects(zonas, false).length > 0;
/* Botones, paneles y la barra de ambientes no cuentan como tocar la escena. */
const esInterfaz = (e) => !!(e.target.closest && e.target.closest('button, #hud, #ambientes, .capa, #bandeja, #necesidades, #kit-bano'));

function anotar(e) {
  diag.tipo = e.pointerType || 'desconocido';
  diag.tipos[diag.tipo] = true;
  diag.presion = e.pressure;
  diag.inclinacion = (e.tiltX || e.tiltY) ? e.tiltX + '°, ' + e.tiltY + '°' : '';
  if (e.getCoalescedEvents) diag.muestras = Math.max(diag.muestras, e.getCoalescedEvents().length);
}

marco.addEventListener('pointerdown', (e) => {
  if (esInterfaz(e)) return;
  anotar(e);
  if (modo !== 'casa' || !responde() || puntero.abajo) return;   /* un dedo a la vez */
  contextoDeAudio();
  document.getElementById('pista').style.opacity = '0';
  aNdc(e);
  /* Si el dedo sale del marco mientras la lleva, igual se entera de cuándo lo suelta. */
  try { marco.setPointerCapture(e.pointerId); } catch (err) { /* puntero simulado */ }
  const ahora = performance.now();
  puntero.abajo = true; puntero.id = e.pointerId; puntero.visto = t; puntero.recorrido = 0; puntero.total = 0;
  puntero.cx = e.clientX; puntero.cy = e.clientY;
  puntero.inicio = ahora;
  puntero.golpeo = false;
  puntero.sobreElla = laToca();
  muestras.length = 0;
  muestras.push({ x: e.clientX, y: e.clientY, t: ahora });
  /* Al apoyar el dedo no se decide nada: al moverlo, mantenerlo o soltarlo se sabe qué gesto fue. */
});

/* ---------- Gestos ----------
   Tocarla:                    cariño (una palmadita).
   Arrastrar despacio encima:  caricia.
   Arrastrar rápido encima:    manotazo.
   Mantener y arrastrar:       levantarla y llevarla.
   Tocar el piso:              que vaya hasta ahí. */

/* Tiempo con el dedo quieto sobre ella para levantarla, en milisegundos. */
const ESPERA_PARA_LEVANTAR = 500;

/* Un manotazo va más rápido que esto, en anchos de pantalla por segundo.
   Se mide sobre los últimos 90 ms, no entre dos eventos sueltos, que dan picos falsos. */
const RAPIDEZ_DE_GOLPE = 2.4;
const VENTANA_MS = 90;
const muestras = [];

function rapidezReciente(ahora) {
  while (muestras.length > 2 && ahora - muestras[0].t > VENTANA_MS) muestras.shift();
  const a = muestras[0], b = muestras[muestras.length - 1];
  const lapso = Math.max(30, b.t - a.t);
  return (Math.hypot(b.x - a.x, b.y - a.y) / marco.clientWidth) / (lapso / 1000);
}

marco.addEventListener('pointermove', (e) => {
  anotar(e);
  if (modo !== 'casa') return;
  if (puntero.abajo && e.pointerId !== puntero.id) return;
  aNdc(e);
  puntero.visto = t;
  const dx = e.clientX - puntero.cx, dy = e.clientY - puntero.cy, paso = Math.hypot(dx, dy);
  puntero.cx = e.clientX; puntero.cy = e.clientY;
  if (!puntero.abajo) return;
  if (estado === 'cargada') { moverCarga(); return; }
  if (!responde()) return;
  const ahora = performance.now();
  muestras.push({ x: e.clientX, y: e.clientY, t: ahora });
  puntero.total += paso;
  if (estado === 'columpio') {
    if (!puntero.golpeo && puntero.total > 24 && rapidezReciente(ahora) > RAPIDEZ_DE_EMPUJE) {
      puntero.golpeo = true;
      empujarColumpio(muestras[muestras.length - 1].y - muestras[0].y);
    }
    return;
  }
  if (puntero.golpeo || !laToca()) return;
  if (puntero.total > 24 && rapidezReciente(ahora) > RAPIDEZ_DE_GOLPE) {
    puntero.golpeo = true;
    golpear(dx, false);
    return;
  }
  puntero.recorrido += paso;
  if (puntero.recorrido > 110) { puntero.recorrido = 0; reaccionar(); }
});

function soltar(e) {
  if (!puntero.abajo || (e && e.pointerId !== puntero.id)) return;
  puntero.abajo = false;
  if (estado === 'cargada') { dejarCaer(); return; }
  if (!responde()) return;
  const fueToque = !puntero.golpeo && puntero.total < 14 && performance.now() - puntero.inicio < 450;
  if (!fueToque) return;
  aNdc(e);
  if (laToca()) { reaccionar(); return; }   /* tocarla es cariño */
  if (tocarObjeto()) return;               /* un mueble que se puede tocar, como el refri */
  const punto = new THREE.Vector3();
  if (!rayo.ray.intersectPlane(PISO, punto)) return;
  if (acomodada()) { bajarDeMueble(punto.x, punto.z); return; }
  if (!estaTriste()) { ultimoToque = t; irA(punto.x, punto.z); }
}
marco.addEventListener('pointerup', soltar);
marco.addEventListener('pointercancel', (e) => {
  if (!puntero.abajo || e.pointerId !== puntero.id) return;
  puntero.abajo = false;
  if (estado === 'cargada') dejarCaer();
});
marco.addEventListener('contextmenu', (e) => e.preventDefault());

/* ---------- Medición ---------- */

const tiempos = new Float32Array(240);
let cuantos = 0, indice = 0;

function medir(ms) {
  tiempos[indice] = ms;
  indice = (indice + 1) % tiempos.length;
  if (cuantos < tiempos.length) cuantos++;
}

function resumen() {
  if (!cuantos) return null;
  const copia = Array.from(tiempos.subarray(0, cuantos)).sort((a, b) => a - b);
  const suma = copia.reduce((a, b) => a + b, 0);
  const mediana = copia[Math.floor(copia.length / 2)];
  const hz = [30, 48, 60, 72, 90, 120, 144].reduce((mejor, h) =>
    Math.abs(1000 / mediana - h) < Math.abs(1000 / mediana - mejor) ? h : mejor, 60);
  return { fps: 1000 / (suma / copia.length), mediana, p95: copia[Math.floor(copia.length * 0.95)], max: copia[copia.length - 1], hz };
}

function textoDeDiagnostico() {
  const s = resumen(), dpr = window.devicePixelRatio || 1;
  const tam = renderer.getDrawingBufferSize(new THREE.Vector2());
  const latencia = audio ? Math.round(((audio.baseLatency || 0) + (audio.outputLatency || 0)) * 1000) : null;
  return [
    'Nella Melody · fase 0 (web, 3D)',
    s ? 'cuadros por segundo: ' + s.fps.toFixed(1) : 'cuadros por segundo: midiendo',
    s ? 'ms por cuadro: mediana ' + s.mediana.toFixed(1) + ' · p95 ' + s.p95.toFixed(1) + ' · máx ' + s.max.toFixed(1) : '',
    s ? 'pantalla estimada: ' + s.hz + ' Hz' : '',
    'ventana: ' + window.innerWidth + ' x ' + window.innerHeight + ' · densidad ' + dpr.toFixed(2),
    'dibujo 3D: ' + tam.x + ' x ' + tam.y + ' px · ' + renderer.info.render.triangles + ' triángulos · ' +
      renderer.info.render.calls + ' llamadas',
    'puntero: ' + diag.tipo + ' · presión ' + Number(diag.presion).toFixed(2) +
      (diag.inclinacion ? ' · inclinación ' + diag.inclinacion : ''),
    'tipos de puntero vistos: ' + (Object.keys(diag.tipos).join(', ') || 'ninguno'),
    'muestras por evento (máx): ' + diag.muestras,
    'audio: ' + (audio ? audio.state + (latencia !== null ? ' · latencia ' + latencia + ' ms' : '') : 'sin iniciar'),
    'navegador: ' + navigator.userAgent
  ].filter(Boolean).join('\n');
}

const hud = document.getElementById('hud');
const hudTexto = document.getElementById('hud-texto');
document.getElementById('btn-diag').addEventListener('click', () => {
  hud.style.display = hud.style.display === 'block' ? 'none' : 'block';
  hudTexto.textContent = textoDeDiagnostico();
});
setInterval(() => { if (hud.style.display === 'block') hudTexto.textContent = textoDeDiagnostico(); }, 500);

document.getElementById('btn-copiar').addEventListener('click', function () {
  const texto = textoDeDiagnostico(), boton = this;
  const listo = () => { boton.textContent = 'Copiado'; setTimeout(() => { boton.textContent = 'Copiar diagnóstico'; }, 1500); };
  const respaldo = () => {
    const area = document.createElement('textarea');
    area.value = texto;
    document.body.appendChild(area);
    area.select();
    try { document.execCommand('copy'); listo(); } catch (err) { boton.textContent = 'No se pudo copiar'; }
    document.body.removeChild(area);
  };
  if (navigator.clipboard && window.isSecureContext) navigator.clipboard.writeText(texto).then(listo, respaldo);
  else respaldo();
});

document.getElementById('btn-completa').addEventListener('click', () => {
  if (document.fullscreenElement) { document.exitFullscreen(); return; }
  const pedido = document.documentElement.requestFullscreen && document.documentElement.requestFullscreen();
  if (pedido && pedido.then) {
    pedido.then(() => {
      if (screen.orientation && screen.orientation.lock) screen.orientation.lock('landscape').catch(() => {});
    }).catch(() => {});
  }
});

/* ---------- Bucle ---------- */

const limitar = (v, tope) => Math.max(-tope, Math.min(tope, v));
const enPantalla = new THREE.Vector3();
const destinoCam = new THREE.Vector3(), destinoMira = new THREE.Vector3(), miraAlzada = new THREE.Vector3();

function actualizar(dt) {
  t += dt;

  /* Salida segura: ningún estado dura más de su máximo. */
  if (estado !== 'libre' && t - estadoDesde > (MAX_ESTADO[estado] || 5)) {
    if (estado === 'cargada') { puntero.abajo = false; dejarCaer(); }
    else if (estado === 'cayendo') aterrizarCaida();
    else if (estado === 'transicion') terminarCambio();
    else if (acomodada()) bajarDeMueble();
    else if (estado === 'comiendo') terminarComida();
  }
  /* Mantener el dedo quieto sobre ella la levanta. */
  if (responde() && modo === 'casa' && puntero.abajo && puntero.sobreElla && !puntero.golpeo &&
      puntero.total < 12 && performance.now() - puntero.inicio > ESPERA_PARA_LEVANTAR) levantar();

  /* Desplazamiento: cambio de ambiente, en brazos, cayendo o a saltitos */
  let alto = 0;
  let camCentro = centro();
  if (estado === 'transicion' && cambio) {
    const k = Math.min(1, (t - cambio.inicio) / cambio.dur);
    const e = k * k * (3 - 2 * k);
    camCentro = cambio.desde + (cambio.hasta - cambio.desde) * e;
    /* Ella acompaña a la cámara a saltitos y entra por la puerta del nuevo ambiente. */
    const xRel = cambio.xRel0 + (-cambio.dir * 1.6 - cambio.xRel0) * e;
    raiz.position.x = camCentro + xRel;
    raiz.position.z = cambio.z0 + (0.4 - cambio.z0) * e;
    const s = k * cambio.saltos, entero = Math.floor(s);
    if (entero !== cambio.hecho && entero < cambio.saltos) { cambio.hecho = entero; aterrizar(0.5); }
    alto = Math.sin(Math.PI * (s - entero)) * 0.5;
    if (k >= 1) { alto = 0; terminarCambio(); }
  } else if (estado === 'cargada') {
    carga.previa.copy(raiz.position);
    raiz.position.lerp(carga.meta, 1 - Math.exp(-dt * 16));
    if (dt > 0) carga.vel.subVectors(raiz.position, carga.previa).divideScalar(dt);
    r.ladeoZ.meta = limitar(-carga.vel.x * 0.05, 0.45);
    r.ladeoX.meta = limitar(carga.vel.y * 0.02, 0.25);
    r.orejaFondo.v -= limitar(carga.vel.y * 0.04, 2) * dt * 60;
    if (t - estadoDesde > 0.6) gestoPasajero(carga.vel.length() > 5 ? 'sorpresa' : 'feliz', 0.25);
  } else if (estado === 'cayendo') {
    const e = Math.min(1, (t - caida.inicio) / caida.dur);
    /* Cae con gravedad; si va más arriba (silla) o tiene que saltar un borde (bañera), hace un arco. */
    const y = caida.arco
      ? caida.h0 + (caida.y1 - caida.h0) * e + caida.arco * Math.sin(Math.PI * e)
      : caida.y1 > caida.h0
      ? caida.h0 + (caida.y1 - caida.h0) * e + 0.6 * Math.sin(Math.PI * e)
      : caida.h0 + (caida.y1 - caida.h0) * e * e;
    raiz.position.set(caida.x0 + (caida.x1 - caida.x0) * e, y, caida.z0 + (caida.z1 - caida.z0) * e);
    if (e >= 1) aterrizarCaida();
  } else if (viaje) {
    let k = (t - viaje.inicio) / viaje.dur;
    /* Si la tocaron mientras caminaba, se queda donde cae el saltito que estaba dando. */
    const saltoActual = Math.floor(k * viaje.saltos);
    if (viaje.detener && saltoActual !== viaje.hecho) {
      const avance = Math.min(saltoActual, viaje.saltos) / viaje.saltos;
      viaje.x1 = viaje.x0 + (viaje.x1 - viaje.x0) * avance;
      viaje.z1 = viaje.z0 + (viaje.z1 - viaje.z0) * avance;
      k = 1;
    }
    if (k >= 1) {
      raiz.position.x = viaje.x1; raiz.position.z = viaje.z1;
      const alLlegar = viaje.detener ? null : viaje.alLlegar;
      viaje = null;
      aterrizar(1);
      r.giro.meta = Math.round(r.giro.x / (Math.PI * 2)) * Math.PI * 2;
      proximoPaseo = t + 3.5 + Math.random() * 5;
      if (alLlegar) alLlegar();
    } else {
      const s = k * viaje.saltos, entero = Math.floor(s), fase = s - entero;
      if (entero !== viaje.hecho) { viaje.hecho = entero; aterrizar(0.7); }
      const avance = (entero + suave(0.05, 0.95, fase)) / viaje.saltos;
      raiz.position.x = viaje.x0 + (viaje.x1 - viaje.x0) * avance;
      raiz.position.z = viaje.z0 + (viaje.z1 - viaje.z0) * avance;
      alto = Math.sin(Math.PI * fase) * 0.55;
    }
  } else if (modo === 'casa' && estado === 'libre' && t > mareoHasta && t > proximoPaseo && t - ultimoToque > 3 && t > saludoHasta && t > baileHasta && !estaTriste() && enojo < 0.3 && !dormida && t > sentadaHasta) {
    pasear();
  }

  if (estado === 'comiendo') avanzarComida();
  /* Con la comida cerca abre la boca. */
  if (anticipando && (estado === 'libre' || estado === 'sentada')) gestoPasajero('abierta', 0.15);
  /* Con hambre le suena la panza cada tanto. */
  if (hambrienta() && (estado === 'libre' || estado === 'sentada') && t > proximoRugido) {
    proximoRugido = t + 9 + Math.random() * 6;
    rugirPanza();
  }
  if (hambrienta() && modo === 'casa' && (estado === 'libre' || estado === 'sentada') && t > proximoAvisoHambre) {
    proximoAvisoHambre = t + 45;
    decir('Tengo hambre…');
  }
  if (!hambrienta()) proximoAvisoHambre = Math.max(proximoAvisoHambre, t + 4);
  if (ultimaFrase === '¡Estoy llena!' && cocina && cocina.hambre() > 0.3) callar();

  /* En el título saluda cada tanto. */
  if (modo === 'titulo' && estado === 'libre' && !viaje && t > proximoSaludoTitulo) {
    saludoHasta = t + 1.4;
    proximoSaludoTitulo = t + 4.5 + Math.random() * 2;
  }

  /* Hacia dónde mira la cabeza */
  cabeza.getWorldPosition(enPantalla);
  enPantalla.y += 0.9;
  enPantalla.project(camara);
  const atenta = t - puntero.visto < 2.5;
  r.cabezaLado.meta = atenta ? limitar(limitar((puntero.x - enPantalla.x) * 1.5, 0.75) - r.giro.x, 0.85) : Math.sin(t * 0.5) * 0.16;
  r.cabezaAlto.meta = atenta ? limitar(-(puntero.y - enPantalla.y) * 0.8, 0.32) : 0;
  /* Si nadie la toca por un rato, se sienta y se duerme. */
  if (modo === 'casa' && estado === 'libre' && !dormida && !viaje && t - ultimoToque > SEGUNDOS_PARA_DORMIRSE && !estaTriste() && !hambrienta() && enojo < 0.3) {
    dormida = true;
    if (encargos) encargos.registrar('siesta');
  }
  r.asiento.meta = dormida || t < sentadaHasta || enMueble() ? 1 : 0;
  if (dormida && t > proximoZ) {
    proximoZ = t + 1.3;
    chispa(texturaZ, raiz.position.x + 0.9, raiz.position.y + 3.0, raiz.position.z + 1, 0.25, 0.55, 1.6, 0.42, 0);
  }

  /* El enojo y la pena bajan solos con el tiempo; la suciedad no. */
  enojo = Math.max(0, enojo - 0.06 * dt);
  if (suciedad === 0) pena = Math.max(0, pena - 0.02 * dt);
  const cara = aplicarCara();
  if (estaEnojada()) r.cabezaLado.meta = -0.55 * (Math.sign(r.cabezaLado.meta) || 1);   /* mira para otro lado */
  if (estaTriste()) { r.cabezaLado.meta *= 0.3; r.cabezaAlto.meta = 0.3; }             /* cabeza gacha */
  r.caida.meta = estaTriste() ? 1 : (dormida ? 0.35 : 0);
  if (dormida) { r.cabezaLado.meta = 0.12; r.cabezaAlto.meta = 0.24; }                 /* cabecea */
  r.brazos.meta = cara === 'feliz' ? 1 : 0;
  r.camX.meta = atenta ? puntero.x * 0.55 : 0;
  r.camY.meta = atenta ? puntero.y * 0.2 : 0;

  if (cara === 'llanto' && t > proximaLagrima) {
    proximaLagrima = t + 0.28;
    const ojo = ojos[Math.floor(Math.random() * 2)].getWorldPosition(new THREE.Vector3());
    chispa(texturaLagrima, ojo.x, ojo.y - 0.12, ojo.z + 0.25, (Math.random() - 0.5) * 0.5, 0.2, 0.75, 0.3, 7);
  }

  acumulado += dt;
  let pasos = 0;
  while (acumulado >= PASO && pasos < MAX_PASOS) {
    for (const nombre in r) r[nombre].paso(PASO);
    acumulado -= PASO;
    pasos++;
  }
  if (pasos === MAX_PASOS) acumulado = 0;

  /* Tope del bamboleo: varios golpes seguidos no la dejan acostada. */
  [r.ladeoX, r.ladeoZ].forEach((s) => {
    if (Math.abs(s.x) > 0.5) { s.x = 0.5 * Math.sign(s.x); s.v *= -0.3; }
  });

  actualizarColumpio(dt);

  /* Pose */
  /* Dormida respira más lento y más hondo. */
  const resp = Math.sin(t * 2 * Math.PI / (dormida ? 5 : 3.4)) * (dormida ? 1.8 : 1);
  const a = r.aplastar.x;
  const bailando = t < baileHasta;
  const mareada = t < mareoHasta;
  const colgando = estado === 'cargada' || estado === 'cayendo';
  if (estado === 'columpio') sobreHamaca(raiz.position, columpio.angulo);
  else if (enMueble()) raiz.position.y = alturaMueble() + Math.max(0, r.salto.x);
  else if (!colgando) raiz.position.y = alto + Math.max(0, r.salto.x) + (bailando ? Math.abs(Math.sin(t * 8)) * 0.14 : 0);
  raiz.rotation.y = r.giro.x + r.vuelta.x + (t < sacudirHasta ? 0.5 * Math.sin(t * 40) : 0);   /* se sacude como perrito */
  /* En el columpio se inclina con la hamaca; al bajar vuelve derechita. */
  columpio.giroX = estado === 'columpio' ? columpio.angulo
    : Math.atan2(Math.sin(columpio.giroX), Math.cos(columpio.giroX)) * Math.exp(-dt * 10);
  raiz.rotation.x = columpio.giroX;
  cuerpo.scale.set(1 - a * 0.55, 1 + a, 1 - a * 0.55);
  /* Sentada: el cuerpo baja y los pies quedan estirados hacia adelante, sobre el piso. */
  const sentada = Math.max(0, Math.min(1, r.asiento.x));
  cuerpo.rotation.set(r.ladeoX.x - 0.08 * sentada, 0, r.ladeoZ.x + (bailando ? 0.13 * Math.sin(t * 8) : 0));
  cuerpo.position.set(r.empuje.x + (t < estremecerHasta ? 0.035 * Math.sin(t * 45) : 0), -0.16 * sentada, 0);
  pies.forEach((p) => {
    p.pie.position.set((0.27 + 0.06 * sentada) * p.lado, 0.2 + 0.16 * sentada - (colgando ? 0.1 : 0), 0.14 + 0.4 * sentada);
    /* Patalea en el aire; en la silla balancea los pies. */
    p.pie.rotation.x = colgando ? 0.35 * Math.sin(t * 9 + p.lado)
      : estado === 'columpio' ? limitar(-columpio.vel * 0.3, 0.8) + 0.15 * Math.sin(t * 5 + p.lado)   /* patalea para tomar vuelo */
      : enSilla() ? 0.4 * Math.sin(t * 4 + p.lado * 1.6) : 0;
  });
  const panza = t < panzaHasta ? 0.04 * Math.sin(t * 40) : 0;   /* la panza tiembla al rugir */
  tronco.scale.set(1 - 0.006 * resp + panza, 1 + 0.016 * resp, 1 + 0.012 * resp + panza);
  cabeza.position.y = 1.12 + 0.012 * resp;
  cabeza.rotation.set(r.cabezaAlto.x, r.cabezaLado.x + (t < negarHasta ? 0.35 * Math.sin(t * 16) : 0),
    0.03 * Math.sin(t * 0.8) + r.orejaLado.x * 0.12 + (cara === 'llanto' ? 0.035 * Math.sin(t * 19) : 0) +
    (mareada ? 0.12 * Math.sin(t * 7) : 0));

  /* Con pena, la oreja parada se cae hacia el costado. */
  orejaParada.rotation.set(-r.orejaFondo.x * 0.5 + 0.45 * r.caida.x, 0,
    0.035 * Math.sin(t * 1.3) + r.orejaLado.x + 0.85 * r.caida.x);
  orejaDoblada.rotation.set(-r.orejaFondo.x * 0.35 + 0.02 * Math.sin(t * 1.1), 0, r.orejaLado.x * 0.6);

  const saludando = t < saludoHasta;
  brazos.forEach((b) => {
    let angulo = 0.55 + 0.05 * resp + 1.55 * r.brazos.x + alto * 0.9, alFrente = 0;
    if (saludando && b.lado === 1) angulo = 2.3 + Math.sin(t * 15) * 0.28;
    if (bailando) angulo = 1.5 + 0.7 * Math.sin(t * 8) * b.lado;
    if (cara === 'enojo') { angulo = 1.05; alFrente = -0.5; }                                     /* manos a la cintura */
    if (cara === 'llanto' || cara === 'triste') { angulo = 0.32; alFrente = -0.3; }               /* brazos caídos */
    if (cara === 'triste' && hambrienta() && !estaTriste()) { angulo = 0.25; alFrente = -1.05; }  /* manos en la panza */
    if (estado === 'cargada') { angulo = 2.2 + 0.15 * Math.sin(t * 8 + b.lado); alFrente = 0; }   /* brazos arriba: ¡wiii! */
    if (estado === 'columpio') { angulo = 2.6; alFrente = 0.1; }                                   /* agarrada de las cuerdas */
    b.hombro.rotation.set(alFrente, 0, angulo * b.lado);
  });
  marcaEnojo.scale.setScalar(0.5 + 0.08 * Math.sin(t * 10));

  /* Estrellitas girando si cayó de muy alto. */
  estrellasMareo.forEach((s, i) => {
    s.visible = mareada;
    if (!mareada) return;
    const ang = t * 5 + i * 2.094;
    cabeza.getWorldPosition(s.position);
    s.position.x += Math.cos(ang) * 0.95;
    s.position.y += 1.7;
    s.position.z += Math.sin(ang) * 0.55 + 0.3;
  });

  const abiertos = aperturaDeOjos();
  ojos.forEach((o) => { o.scale.y = abiertos; });

  const encuadre = ENCUADRE[modo] || ENCUADRE.casa;
  /* En el cambio de ambiente la cámara sigue de cerca el paneo; si no, se acomoda suave. */
  const suavizado = 1 - Math.exp(-dt * (estado === 'transicion' ? 14 : 2.4));
  destinoCam.copy(encuadre.pos); destinoCam.x += camCentro;
  destinoMira.copy(encuadre.mira); destinoMira.x += camCentro;
  camBase.lerp(destinoCam, suavizado);
  miraBase.lerp(destinoMira, suavizado);
  camara.position.set(camBase.x + r.camX.x, camBase.y + r.camY.x + r.camAlza.x, camBase.z);
  miraAlzada.copy(miraBase).y += r.camAlza.x;
  camara.lookAt(miraAlzada);
  /* El sol y los brillos acompañan al ambiente que se ve. */
  sol.position.set(camBase.x - 5, 10, 8);
  sol.target.position.set(camBase.x, 0, 0);
  grupoBrillos.position.x = camBase.x;
  moverCorazones();
  moverBrillos(dt);
  moverPolvo();
  moverChispas();
  if (cocina) cocina.actualizar(dt);
  actualizarBano(dt);
  actualizarPatio(dt);
  if (t > proximaBarra) { proximaBarra = t + 0.2; pintarNecesidades(); }
}

function cuadro(ahora) {
  if (!ultimo) ultimo = ahora;
  const ms = ahora - ultimo;
  ultimo = ahora;
  if (ms > 0 && ms < 1000) medir(ms);
  actualizar(Math.min(ms / 1000, 0.25));
  renderer.render(escena, camara);
  requestAnimationFrame(cuadro);
}

document.addEventListener('visibilitychange', () => { ultimo = 0; });
requestAnimationFrame(cuadro);

/* Para inspeccionar desde la consola. */
document.getElementById('btn-olvido').addEventListener('click', pasarUnDia);

/* ---------- Cambio de ambiente ---------- */

/* Solo se dibujan los ambientes entre 'desde' y 'hasta': el actual y, durante el paneo, los que cruza. */
function mostrarCuartos(desde, hasta) {
  const a = Math.min(desde, hasta), b = Math.max(desde, hasta);
  gruposCuarto.forEach((g, i) => { g.visible = i >= a && i <= b; });
}

function irAlCuarto(indice) {
  if (modo !== 'casa' || !responde()) return false;
  indice = Math.max(0, Math.min(CUARTOS.length - 1, indice));
  if (indice === cuarto) return false;
  const dir = Math.sign(indice - cuarto);
  viaje = null; dormida = false; sentadaHasta = 0; baileHasta = 0;
  puntero.abajo = false;
  if (cocina) cocina.cerrarRefri(false);
  if (tienda) tienda.cerrar(false);
  cortarBano();
  if (patio) patio.cortar();
  cambio = {
    desde: CUARTOS[cuarto].x, hasta: CUARTOS[indice].x, dir,
    inicio: t, dur: 0.55 + 0.25 * Math.abs(indice - cuarto),
    xRel0: raiz.position.x - CUARTOS[cuarto].x, z0: raiz.position.z, hecho: 0
  };
  cambio.saltos = Math.max(2, Math.round(cambio.dur / 0.3));
  mostrarCuartos(cuarto, indice);
  cuarto = indice;
  cambiarEstado('transicion');
  /* Mira hacia donde va. */
  const destino = dir * Math.PI / 2;
  r.giro.meta = r.giro.x + Math.atan2(Math.sin(destino - r.giro.x), Math.cos(destino - r.giro.x));
  marcarBarra();
  return true;
}

function terminarCambio() {
  if (cambio) {
    raiz.position.x = CUARTOS[cuarto].x - cambio.dir * 1.6;
    raiz.position.z = 0.4;
  }
  cambio = null;
  cambiarEstado('libre');
  mostrarCuartos(cuarto, cuarto);
  if (encargos) encargos.registrar('cuarto', { cuarto });
  aterrizar(0.8);
  r.giro.meta = Math.round(r.giro.x / (Math.PI * 2)) * Math.PI * 2;   /* vuelve a mirar al frente */
  ultimoToque = t;
  proximoPaseo = t + 4;
}

const botonesCuarto = Array.from(document.querySelectorAll('#ambientes .amb'));
const flechaAnterior = document.getElementById('amb-anterior');
const flechaSiguiente = document.getElementById('amb-siguiente');
function marcarBarra() {
  botonesCuarto.forEach((b) => b.classList.toggle('activo', +b.dataset.cuarto === cuarto));
  flechaAnterior.disabled = cuarto === 0;
  flechaSiguiente.disabled = cuarto === CUARTOS.length - 1;
}
function sonidoDeCambio() { tocar(1318.5, 0, 0.1); tocar(1760, 0.06, 0.09); }
botonesCuarto.forEach((b) => b.addEventListener('click', () => { if (irAlCuarto(+b.dataset.cuarto)) sonidoDeCambio(); }));
flechaAnterior.addEventListener('click', () => { if (irAlCuarto(cuarto - 1)) sonidoDeCambio(); });
flechaSiguiente.addEventListener('click', () => { if (irAlCuarto(cuarto + 1)) sonidoDeCambio(); });
mostrarCuartos(0, 0);
marcarBarra();

/* ---------- Levantarla y soltarla ----------
   No hay motor de física: mientras la llevas sigue al dedo con un resorte, y al
   soltarla cae en línea recta con gravedad hasta el piso permitido más cercano. */

const estrellasMareo = [0, 1, 2].map(() => {
  const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: texturaEstrella, transparent: true, depthWrite: false }));
  s.scale.set(0.32, 0.32, 1);
  s.visible = false;
  escena.add(s);
  return s;
});

function levantar() {
  if (!responde() || modo !== 'casa') return;
  viaje = null; dormida = false; sentadaHasta = 0; baileHasta = 0;
  cambiarEstado('cargada');
  carga.z = raiz.position.z;
  planoCarga.constant = -carga.z;
  const punto = new THREE.Vector3();
  if (!rayo.ray.intersectPlane(planoCarga, punto)) punto.copy(raiz.position).add(new THREE.Vector3(0, 1.8, 0));
  carga.offset.subVectors(punto, raiz.position);
  carga.meta.copy(raiz.position);
  carga.meta.y += 0.45;
  carga.vel.set(0, 0, 0);
  r.aplastar.v += 1.6;   /* se estira al subir */
  gestoPasajero('sorpresa', 0.6);
  tocar(880, 0, 0.12);
  tocar(1318.5, 0.07, 0.12);
}

function moverCarga() {
  const punto = new THREE.Vector3();
  if (!rayo.ray.intersectPlane(planoCarga, punto)) return;
  const cx = centro();
  carga.meta.set(
    Math.max(cx - 4.6, Math.min(cx + 4.6, punto.x - carga.offset.x)),
    Math.max(0.35, Math.min(4.2, punto.y - carga.offset.y + 0.45)),
    carga.z);
}

function dejarCaer() {
  if (estado !== 'cargada') return;
  const cx = centro();
  caida.h0 = Math.max(0, raiz.position.y);
  caida.x0 = raiz.position.x;
  caida.z0 = raiz.position.z;
  caida.luego = null;
  caida.despues = null;
  caida.arco = 0;
  if (cuarto === CUARTO_COCINA && cercaDe('silla', IMAN_SILLA)) {
    /* Soltada cerca de la silla: el imán la lleva al asiento y se sienta. */
    caida.x1 = ASIENTO.x; caida.z1 = ASIENTO.z; caida.y1 = ASIENTO.y; caida.alTerminar = 'sentada';
  } else if (cuarto === CUARTO_BANO && cercaDe('banera', IMAN_BANERA)) {
    /* Soltada sobre la bañera: cae al agua y se queda sentadita. */
    caida.x1 = EN_BANERA.x; caida.z1 = EN_BANERA.z; caida.y1 = EN_BANERA.y; caida.alTerminar = 'banera';
  } else if (cuarto === CUARTO_PATIO && cercaDe('columpio', IMAN_COLUMPIO)) {
    /* Soltada cerca del columpio: la hamaca se frena y ella se sienta. */
    const destino = sobreHamaca(new THREE.Vector3(), 0);
    caida.x1 = destino.x; caida.z1 = destino.z; caida.y1 = destino.y; caida.alTerminar = 'columpio';
  } else {
    /* Cae siempre dentro del piso permitido: si la soltaste afuera, va al punto más cercano. */
    caida.x1 = Math.max(cx - LIMITE.x, Math.min(cx + LIMITE.x, caida.x0));
    caida.z1 = Math.max(LIMITE.zMin, Math.min(LIMITE.zMax, caida.z0));
    caida.y1 = 0; caida.alTerminar = 'libre';
  }
  caida.dur = caida.y1 > caida.h0 ? 0.4 : Math.max(0.12, Math.sqrt(2 * (caida.h0 - caida.y1) / GRAVEDAD));
  caida.inicio = t;
  r.ladeoZ.meta = 0;
  r.ladeoX.meta = 0;
  cambiarEstado('cayendo');
}

function aterrizarCaida() {
  raiz.position.set(caida.x1, caida.y1, caida.z1);
  cambiarEstado(caida.alTerminar);
  const altura = Math.abs(caida.h0 - caida.y1);
  aterrizar(Math.min(2, 0.7 + altura * 0.45));
  tocar(caida.alTerminar === 'libre' ? 392 : 523.25, 0, 0.1);
  if (caida.alTerminar === 'banera') entrarAlBano();
  if (caida.alTerminar === 'columpio') entrarAlColumpio();
  if (caida.alTerminar === 'libre' && altura > 2.2) { mareoHasta = t + 1.6; gestoPasajero('sorpresa', 1.6); }   /* de muy alto queda mareada */
  if (caida.alTerminar === 'sentada') mostrarFeliz(0.8);
  r.giro.meta = Math.round(r.giro.x / (Math.PI * 2)) * Math.PI * 2;
  ultimoToque = t;
  proximoPaseo = t + 3;
  if (caida.luego) {
    const [x, z] = caida.luego;
    caida.luego = null;
    if (!estaTriste()) irA(x, z);
  }
  if (caida.despues) {
    const despues = caida.despues;
    caida.despues = null;
    despues();
  }
}

/* Los muebles "atraen" si el dedo o el cuerpo de ella quedan cerca en la pantalla.
   Se mide en pantalla y no en 3D: así funciona igual aunque el mueble esté más al fondo. */
const IMAN_SILLA = 0.13;    /* en anchos de pantalla */
const IMAN_BANERA = 0.16;
function cercaDe(nombre, radio) {
  const mueble = puntoDeObjeto(nombre), ella = puntoDeElla(), ancho = marco.clientWidth;
  const delDedo = Math.hypot(puntero.cx - mueble.x, puntero.cy - mueble.y) / ancho;
  const delCuerpo = Math.hypot(ella.x - mueble.x, ella.y - mueble.y) / ancho;
  return Math.min(delDedo, delCuerpo) < radio;
}

/* Baja del mueble (silla o bañera) con un saltito al piso de enfrente. Si le indicaste un lugar,
   después va hasta ahí; 'despues' es algo que hace al aterrizar (por ejemplo, sacudirse). */
function bajarDeMueble(x, z, despues) {
  if (!acomodada()) return;
  const cx = centro();
  caida.h0 = raiz.position.y; caida.x0 = raiz.position.x; caida.z0 = raiz.position.z;
  if (estado === 'banera') {
    caida.x1 = Math.max(cx - LIMITE.x, Math.min(cx + LIMITE.x, EN_BANERA.x));
    caida.z1 = LIMITE.zMin;
    caida.arco = 1.7;   /* salta por encima del borde */
    caida.dur = 0.6;
  } else if (estado === 'columpio') {
    caida.x1 = Math.max(cx - LIMITE.x, Math.min(cx + LIMITE.x, caida.x0));
    caida.z1 = LIMITE.zMin + 0.3;
    caida.arco = 0.9;   /* salta de la hamaca hacia adelante */
    caida.dur = 0.55;
  } else {
    caida.x1 = cx + LIMITE.x;
    caida.z1 = Math.max(LIMITE.zMin, Math.min(LIMITE.zMax, caida.z0));
    caida.arco = 0;
    caida.dur = Math.max(0.2, Math.sqrt(2 * caida.h0 / GRAVEDAD));
  }
  caida.y1 = 0; caida.alTerminar = 'libre';
  caida.luego = x === undefined ? null : [x, z];
  caida.despues = despues || null;
  caida.inicio = t;
  cambiarEstado('cayendo');
}

/* ---------- Comer ----------
   La cocina le acerca la comida; aquí está lo que ella hace: abre la boca,
   da tres mordidas con migas y reacciona según lo que comió. */

function puedeComer() { return modo === 'casa' && (estado === 'libre' || estado === 'sentada'); }
function anticipar(cerca) { anticipando = !!cerca; }
function decir(texto) {
  if (silencio) return;
  ultimaFrase = texto;
  window.dispatchEvent(new CustomEvent('nella-globo', { detail: texto }));
}
/* Borra el globo de diálogo que esté a la vista. */
function callar() {
  ultimaFrase = '';
  window.dispatchEvent(new Event('nella-callar'));
}

function bocaEnPantalla() {
  prepararProyeccion();
  const v = cabeza.localToWorld(PUNTO_BOCA.clone());
  v.project(camara);
  const caja = lienzo.getBoundingClientRect();
  return { x: caja.left + (v.x + 1) / 2 * caja.width, y: caja.top + (1 - v.y) / 2 * caja.height };
}

/* Devuelve 'come', 'llena' (no tiene hambre y no la gasta) o 'no' (está ocupada). */
function comer(datosComida, crearModelo) {
  if (!puedeComer()) return 'no';
  if (cocina && cocina.hambre() < 0.08) { negar('¡Estoy llena!'); return 'llena'; }
  comida.enSilla = estado === 'sentada';
  comida.reaccion = datosComida.reaccion;
  comida.frase = datosComida.frase || '';
  comida.inicio = t;
  comida.mordidas = 0;
  comida.reaccionado = false;
  viaje = null; dormida = false; sentadaHasta = 0; baileHasta = 0;
  quitarComidaDeLaBoca();
  comida.modelo = crearModelo();
  comida.modelo.position.copy(COMIDA_EN_BOCA);
  comida.modelo.scale.setScalar(0.9);
  cabeza.add(comida.modelo);
  anticipando = false;
  cambiarEstado('comiendo');
  proximaBarra = 0;
  if (encargos) encargos.registrar('comer', { comida: datosComida.id, sentada: comida.enSilla });
  return 'come';
}

const MORDIDAS = [0.35, 0.8, 1.25];
function avanzarComida() {
  const e = t - comida.inicio;
  if (comida.mordidas < MORDIDAS.length && e >= MORDIDAS[comida.mordidas]) {
    comida.mordidas++;
    if (comida.modelo) comida.modelo.scale.multiplyScalar(0.6);
    r.aplastar.v -= 0.7;
    r.cabezaAlto.v += 1.5;
    soltarMigas();
    tocar(587.33 - comida.mordidas * 40, 0, 0.08);
    if (comida.mordidas === MORDIDAS.length) quitarComidaDeLaBoca();
  }
  /* Abre la boca justo antes de cada mordida y mastica en el medio. */
  if (comida.mordidas < MORDIDAS.length) {
    const falta = MORDIDAS[comida.mordidas] - e;
    gestoPasajero(e < 0.35 || falta < 0.15 ? 'abierta' : 'mastica', 0.05);
  } else if (e < 1.55) {
    gestoPasajero('mastica', 0.05);
  }
  if (!comida.reaccionado && e >= 1.55) { comida.reaccionado = true; reaccionarAComida(); }
  if (e >= 3.0) terminarComida();
}

function reaccionarAComida() {
  if (comida.reaccion === 'favorita') {
    gestoPasajero('estrellas', 1.4);
    r.salto.v += 6;
    for (let i = 0; i < 4; i++) soltarCorazon((i - 1.5) * 0.5);
    [1046.5, 1318.5, 1568, 2093].forEach((f, i) => tocar(f, i * 0.09, 0.12));
    decir('¡Mi favorito!');
  } else if (comida.reaccion === 'agria') {
    gestoPasajero('agria', 1.4);
    estremecerHasta = t + 1.1;
    tocar(311.13, 0, 0.12);
    tocar(293.66, 0.12, 0.12);
    decir('¡Uy, qué ácido!');
  } else {
    mostrarFeliz(1.2);
    soltarCorazon();
    tocar(1318.5, 0, 0.11);
    tocar(1568, 0.08, 0.1);
    decir(comida.frase || '¡Gracias!');
  }
}

function quitarComidaDeLaBoca() {
  if (!comida.modelo) return;
  cabeza.remove(comida.modelo);
  comida.modelo.traverse((n) => {
    if (n.geometry) n.geometry.dispose();
    if (n.material && n.material !== tinta) n.material.dispose();
  });
  comida.modelo = null;
}

function terminarComida() {
  quitarComidaDeLaBoca();
  if (estado === 'comiendo') cambiarEstado(comida.enSilla ? 'sentada' : 'libre');
  ultimoToque = t;
  proximoPaseo = t + 3;
}

/* Cuando está llena: niega con la cabeza y la comida no se gasta. */
function negar(texto) {
  const medidor = document.getElementById('med-comida');
  if (medidor) { medidor.classList.remove('pulso'); void medidor.offsetWidth; medidor.classList.add('pulso'); }
  negarHasta = t + 0.9;
  tocar(659.25, 0, 0.09);
  tocar(523.25, 0.1, 0.09);
  decir(texto);
}

const texturaMiga = dibujo((g) => {
  g.beginPath(); g.arc(48, 48, 26, 0, 7);
  g.fillStyle = '#f2c38b'; g.fill();
  g.lineWidth = 7; g.strokeStyle = '#3d2229'; g.stroke();
});
function soltarMigas() {
  const p = cabeza.localToWorld(PUNTO_BOCA.clone());
  for (let i = 0; i < 4; i++) {
    chispa(texturaMiga, p.x + (Math.random() - 0.5) * 0.3, p.y - 0.1, p.z + 0.3,
      (Math.random() - 0.5) * 1.6, 0.8 + Math.random(), 0.6, 0.1, 9);
  }
}

/* La panza le ruge cuando tiene mucha hambre. */
const texturaGrr = dibujo((g) => {
  g.font = '700 34px "Fredoka", "Segoe UI", sans-serif';
  g.textAlign = 'center'; g.textBaseline = 'middle';
  g.lineWidth = 7; g.strokeStyle = '#ffffff'; g.strokeText('grrr', 48, 50);
  g.fillStyle = '#b5651d'; g.fillText('grrr', 48, 50);
});
function rugirPanza() {
  panzaHasta = t + 0.6;
  chispa(texturaGrr, raiz.position.x + 0.9, raiz.position.y + 1.3, raiz.position.z + 1, 0.3, 0.4, 1.0, 0.55, 0);
  const ctx = contextoDeAudio();
  if (!ctx) return;
  const t0 = ctx.currentTime;
  const osc = ctx.createOscillator(), vibrato = ctx.createOscillator(), cuantoVibra = ctx.createGain();
  const filtro = ctx.createBiquadFilter(), g = ctx.createGain();
  osc.type = 'sawtooth';
  osc.frequency.setValueAtTime(72, t0);
  osc.frequency.linearRampToValueAtTime(55, t0 + 0.5);
  vibrato.frequency.value = 18;
  cuantoVibra.gain.value = 12;
  vibrato.connect(cuantoVibra);
  cuantoVibra.connect(osc.frequency);
  filtro.type = 'lowpass';
  filtro.frequency.value = 260;
  g.gain.setValueAtTime(0.0001, t0);
  g.gain.exponentialRampToValueAtTime(0.2, t0 + 0.05);
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.6);
  osc.connect(filtro); filtro.connect(g); g.connect(busEfectos);
  osc.start(t0); vibrato.start(t0);
  osc.stop(t0 + 0.65); vibrato.stop(t0 + 0.65);
}

/* ---------- Muebles que se tocan ---------- */

function registrarTocable(objeto, cuartoDelObjeto, alTocar) {
  tocables.push({ objeto, cuarto: cuartoDelObjeto, alTocar });
}

function tocarObjeto() {
  const activos = tocables.filter((o) => o.cuarto === cuarto);
  if (!activos.length) return false;
  const golpe = rayo.intersectObjects(activos.map((o) => o.objeto), true)[0];
  if (!golpe) return false;
  for (const o of activos) {
    let n = golpe.object;
    while (n && n !== o.objeto) n = n.parent;
    if (n) return o.alTocar() !== false;
  }
  return false;
}

/* Punto en pantalla de un mueble, para las pruebas. */
function puntoDeObjeto(nombre) {
  prepararProyeccion();
  let v;
  if (nombre === 'refri') v = cuartos.refri.localToWorld(new THREE.Vector3(0.3, 1.6, 0.95));
  else if (nombre === 'banera') v = EN_BANERA.clone().add(new THREE.Vector3(0, 1.5, 0.6));
  else if (nombre === 'cabeza') v = cabeza.localToWorld(new THREE.Vector3(0, CAPUCHA.y + 0.1, 0.6));
  else if (nombre === 'columpio') v = sobreHamaca(new THREE.Vector3(), 0).add(new THREE.Vector3(0, 0.6, 0));
  else if (nombre === 'cantero') return patio.puntoCantero();
  else if (nombre === 'florero') v = patio.tocables.florero.localToWorld(new THREE.Vector3(0, 1.45, 0.2));
  else if (nombre === 'termas') v = patio.tocables.termas.localToWorld(new THREE.Vector3(0, 0.3, 0));
  else if (nombre === 'kuromi') return patio.puntoKuromi();
  else v = ASIENTO.clone().add(new THREE.Vector3(0, 0.3, 0));
  v.project(camara);
  const caja = lienzo.getBoundingClientRect();
  return { x: caja.left + (v.x + 1) / 2 * caja.width, y: caja.top + (1 - v.y) / 2 * caja.height };
}

/* ---------- Barras de necesidades ---------- */

const medidores = ['comida', 'limpieza', 'animo'].map((id) => document.getElementById('med-' + id));
function pintarNecesidades() {
  const valores = [cocina ? 1 - cocina.hambre() : 1, 1 - suciedad, 1 - Math.max(pena, enojo * 0.8)];
  medidores.forEach((el, i) => {
    if (!el) return;
    const v = Math.max(0, Math.min(1, valores[i]));
    el.style.setProperty('--nivel', Math.round(v * 100) + '%');
    el.classList.toggle('bajo', v < 0.3);
  });
}

/* ---------- La cocina ---------- */

cocina = crearCocina({
  pintura, parte, elipsoide, tinta, marco, tocar,
  puertaRefri: cuartos.puertaRefri,
  personaje: { bocaEnPantalla, anticipar, comer },
  abrirTienda: (id) => { if (tienda) tienda.abrir(id); },
  alAbrirRefri: () => { if (tienda) tienda.revisarCanasta(); }
});
registrarTocable(cuartos.refri, CUARTO_COCINA, () => cocina.abrirRefri());
tienda = crearTienda({ marco, tocar, cocina, decir, comidas: COMIDAS, puntoDeElla, silencioso: () => silencio });

/* ---------- Baño ----------
   En la bañera aparece un kit con jabón, regadera y salir. El jabón se arrastra
   sobre su cabeza: deja espuma, le da cosquillas y le quita las manchas. La regadera
   enjuaga la espuma; si quedó limpia, salta afuera y se sacude como un perrito.
   La suciedad solo se quita aquí: las caricias ya no la limpian. */

const espumas = [];
const MAXIMO_ESPUMA = 40;
let jabon = null, espumaPuesta = 0, frotes = 0, sucioAlEntrar = false;
let duchaHasta = 0, salirTrasDucha = 0, sacudirHasta = 0, proximoPedidoBano = 0, kitVisible = false;
const rayoJabon = new THREE.Raycaster();
const ndcJabon = new THREE.Vector2();

const texturaEspuma = dibujo((g) => {
  const d = g.createRadialGradient(40, 38, 4, 48, 48, 40);
  d.addColorStop(0, '#ffffff'); d.addColorStop(0.75, '#f3fbff'); d.addColorStop(1, '#cfe9fb');
  g.beginPath(); g.arc(48, 48, 40, 0, 7); g.fillStyle = d; g.fill();
  g.lineWidth = 3; g.strokeStyle = '#b9dcf2'; g.stroke();
  g.beginPath(); g.arc(35, 33, 8, 0, 7); g.fillStyle = 'rgba(255,255,255,.95)'; g.fill();
});

const ICONO_JABON = 'data:image/svg+xml,' + encodeURIComponent(
  '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">' +
  '<circle cx="72" cy="22" r="10" fill="#eef8ff" stroke="#9fd0f0" stroke-width="3"/>' +
  '<circle cx="86" cy="38" r="6" fill="#eef8ff" stroke="#9fd0f0" stroke-width="3"/>' +
  '<rect x="10" y="38" width="72" height="46" rx="18" fill="#ffb3cd" stroke="#3d2229" stroke-width="5"/>' +
  '<rect x="21" y="47" width="34" height="10" rx="5" fill="#ffdbe8"/></svg>');

/* Al caer en la bañera: salpica y avisa. */
function entrarAlBano() {
  espumaPuesta = 0;
  frotes = 0;
  sucioAlEntrar = suciedad > 0;
  mostrarFeliz(0.8);
  for (let i = 0; i < 10; i++) {
    chispa(texturaLagrima, EN_BANERA.x + (Math.random() - 0.5) * 2.4, 1.9, EN_BANERA.z + 1,
      (Math.random() - 0.5) * 3, 2.5 + Math.random() * 2, 0.6, 0.22, 12);
  }
  decir(sucioAlEntrar ? '¡Hora del baño!' : '¡Al agua!');
}

/* Corta todo lo del baño a medias (al cambiar de ambiente o volver al título). */
function cortarBano() {
  soltarJabon();
  duchaHasta = 0;
  salirTrasDucha = 0;
}

/* ----- Jabón ----- */

const botonJabon = document.getElementById('btn-jabon');
if (botonJabon) {
  botonJabon.querySelector('img').src = ICONO_JABON;
  botonJabon.addEventListener('pointerdown', (e) => {
    if (estado !== 'banera' || jabon) return;
    e.preventDefault();
    try { botonJabon.setPointerCapture(e.pointerId); } catch (err) { /* puntero simulado */ }
    const fantasma = document.createElement('img');
    fantasma.className = 'fantasma jabon';
    fantasma.alt = '';
    fantasma.src = ICONO_JABON;
    marco.appendChild(fantasma);
    jabon = { id: e.pointerId, fantasma, x: e.clientX, y: e.clientY, recorrido: 0, limpieza: 0, total: 0 };
    moverJabon(e.clientX, e.clientY);
  });
}
const botonRegadera = document.getElementById('btn-regadera');
if (botonRegadera) botonRegadera.addEventListener('click', enjuagar);
const botonSalir = document.getElementById('btn-salir-banera');
if (botonSalir) botonSalir.addEventListener('click', () => { if (estado === 'banera') bajarDeMueble(); });
window.addEventListener('pointermove', (e) => { if (jabon && e.pointerId === jabon.id) moverJabon(e.clientX, e.clientY); });
window.addEventListener('pointerup', (e) => { if (jabon && e.pointerId === jabon.id) soltarJabon(); });
window.addEventListener('pointercancel', (e) => { if (jabon && e.pointerId === jabon.id) soltarJabon(); });

function moverJabon(x, y) {
  const caja = marco.getBoundingClientRect();
  jabon.fantasma.style.left = (x - caja.left) + 'px';
  jabon.fantasma.style.top = (y - caja.top) + 'px';
  const paso = Math.hypot(x - jabon.x, y - jabon.y);
  jabon.x = x; jabon.y = y;
  jabon.total += paso;
  if (estado !== 'banera') return;
  /* Solo frota si el jabón pasa sobre su cabeza (en la bañera es lo que asoma). */
  const cabezaEn = puntoDeObjeto('cabeza');
  if (Math.hypot(x - cabezaEn.x, y - cabezaEn.y) / caja.width > 0.13) return;
  jabon.recorrido += paso;
  jabon.limpieza += paso;
  /* Medido en anchos de pantalla, para que se sienta igual en la tablet y en el celular. */
  if (jabon.recorrido > caja.width * 0.05) { jabon.recorrido = 0; ponerEspuma(x, y); }
  if (jabon.limpieza > caja.width * 0.22) { jabon.limpieza = 0; frotar(); }
}

function soltarJabon() {
  if (!jabon) return;
  const j = jabon;
  jabon = null;
  const caja = marco.getBoundingClientRect();
  const b = botonJabon ? botonJabon.getBoundingClientRect() : caja;
  j.fantasma.classList.add('volviendo');
  j.fantasma.style.left = (b.left + b.width / 2 - caja.left) + 'px';
  j.fantasma.style.top = (b.top + b.height / 2 - caja.top) + 'px';
  setTimeout(() => j.fantasma.remove(), 320);
  if (j.total < 10 && estado === 'banera') decir('Pasa el jabón sobre mí');
}

/* Una burbuja de espuma donde pasa el jabón, pegada a su cabeza. */
function ponerEspuma(x, y) {
  if (espumas.length >= MAXIMO_ESPUMA) return;
  const caja = lienzo.getBoundingClientRect();
  ndcJabon.set(((x - caja.left) / caja.width) * 2 - 1, -((y - caja.top) / caja.height) * 2 + 1);
  prepararProyeccion();
  rayoJabon.setFromCamera(ndcJabon, camara);
  const golpe = rayoJabon.intersectObject(zonas[0], false)[0];
  const punto = golpe
    ? golpe.point.clone()
    : cabeza.localToWorld(new THREE.Vector3((Math.random() - 0.5) * 1.6, CAPUCHA.y + Math.random() * 0.6, 0.9));
  const burbuja = new THREE.Sprite(new THREE.SpriteMaterial({ map: texturaEspuma, transparent: true, depthWrite: false }));
  cabeza.add(burbuja);
  burbuja.position.copy(cabeza.worldToLocal(punto));
  const tam = 0.3 + Math.random() * 0.25;
  burbuja.scale.set(tam, tam, 1);
  espumas.push({ s: burbuja, tam, vida: 1, fase: Math.random() * 6 });
  espumaPuesta++;
  if (encargos) encargos.registrar('espuma');
}

/* Cosquillas: se ríe, se mueve y se le van las manchas. */
function frotar() {
  frotes++;
  const lado = frotes % 2 ? 1 : -1;
  gestoPasajero('feliz', 0.6);
  r.ladeoZ.v += lado * 1.6;
  r.orejaLado.v += lado * 1.2;
  tocar(1568, 0, 0.1);
  tocar(1760, 0.06, 0.1);
  if (suciedad > 0) {
    suciedad = Math.max(0, Math.round((suciedad - 0.1) * 100) / 100);
    verManchas();
  }
}

/* ----- Regadera ----- */

function enjuagar() {
  if (estado !== 'banera' || duchaHasta) return;
  duchaHasta = t + 1.6;
  sonarDucha(1.6);
  gestoPasajero('sorpresa', 0.4);
}

function terminarDucha() {
  espumas.forEach((e) => { e.vida = 0; });
  if (estado !== 'banera') return;
  if (suciedad > 0 && espumaPuesta < 8) { decir('Todavía tengo manchitas…'); return; }
  const estabaSucia = sucioAlEntrar || suciedad > 0;
  suciedad = 0;
  pena = 0;
  diasSinVisita = 0;
  verManchas();
  rotularOlvido();
  mostrarFeliz(1.6);
  r.salto.v += 5;
  for (let i = 0; i < 3; i++) soltarCorazon((i - 1) * 0.6);
  for (let i = 0; i < 8; i++) {
    chispa(texturaBrillo, raiz.position.x + (Math.random() - 0.5) * 2.4, 1.8 + Math.random() * 2, raiz.position.z + 1.2,
      (Math.random() - 0.5), 0.8, 0.7, 0.5, 0);
  }
  [0, 2, 4, 7].forEach((grado, i) => tocar(ESCALA[grado], i * 0.09, 0.14));
  decir(estabaSucia ? '¡Quedé limpiecita!' : '¡Qué fresquito!');
  salirTrasDucha = t + 1.4;
  /* Para el encargo cuenta el baño de verdad: con jabón, no solo un chorrito de agua. */
  if (encargos && espumaPuesta >= 8) encargos.registrar('bano');
}

let ruidoBlanco = null;
function sonarDucha(duracion) {
  const ctx = contextoDeAudio();
  if (!ctx) return;
  if (!ruidoBlanco) {
    ruidoBlanco = ctx.createBuffer(1, ctx.sampleRate, ctx.sampleRate);
    const datos = ruidoBlanco.getChannelData(0);
    for (let i = 0; i < datos.length; i++) datos[i] = Math.random() * 2 - 1;
  }
  const fuente = ctx.createBufferSource();
  fuente.buffer = ruidoBlanco;
  fuente.loop = true;
  const filtro = ctx.createBiquadFilter();
  filtro.type = 'bandpass';
  filtro.frequency.value = 2400;
  filtro.Q.value = 0.6;
  const g = ctx.createGain(), t0 = ctx.currentTime;
  g.gain.setValueAtTime(0.0001, t0);
  g.gain.exponentialRampToValueAtTime(0.12, t0 + 0.15);
  g.gain.setValueAtTime(0.12, t0 + duracion - 0.3);
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + duracion);
  fuente.connect(filtro); filtro.connect(g); g.connect(busEfectos);
  fuente.start(t0);
  fuente.stop(t0 + duracion + 0.05);
}

/* ----- Secado: se sacude como un perrito y salpica gotas ----- */

function sacudirse() {
  sacudirHasta = t + 0.9;
  gestoPasajero('feliz', 1.1);
  [880, 988, 880, 988].forEach((f, i) => tocar(f, i * 0.08, 0.06));
}

/* ----- Cada cuadro ----- */

function actualizarBano(dt) {
  if (duchaHasta && t < duchaHasta) {
    for (let i = 0; i < 3; i++) {
      /* Caen desde la regadera (arriba a la izquierda) sobre su cabeza. */
      chispa(texturaLagrima, EN_BANERA.x - 1.8 + (Math.random() - 0.5) * 0.5, 5.0, EN_BANERA.z + 0.6 + (Math.random() - 0.5) * 0.6,
        2.2 + Math.random() * 1.2, -1.5, 0.75, 0.22, 9);
    }
    espumas.forEach((e) => { e.vida = Math.max(0, e.vida - dt / 1.2); });
  } else if (duchaHasta) {
    duchaHasta = 0;
    terminarDucha();
  }

  if (salirTrasDucha && t > salirTrasDucha) {
    salirTrasDucha = 0;
    if (estado === 'banera') bajarDeMueble(undefined, undefined, sacudirse);
  }

  if (t < sacudirHasta) {
    for (let i = 0; i < 2; i++) {
      chispa(texturaLagrima, raiz.position.x, raiz.position.y + 1.6 + Math.random(), raiz.position.z + 0.8,
        (Math.random() - 0.5) * 7, 2 + Math.random() * 2, 0.6, 0.18, 10);
    }
  }

  /* Fuera de la bañera, la espuma que quedó se va sola en unos segundos. */
  const fueraDelAgua = estado !== 'banera';
  for (let i = espumas.length - 1; i >= 0; i--) {
    const e = espumas[i];
    if (fueraDelAgua && !duchaHasta) e.vida = Math.max(0, e.vida - dt / 4);
    if (e.vida <= 0) {
      cabeza.remove(e.s);
      e.s.material.dispose();
      espumas.splice(i, 1);
      continue;
    }
    const tam = e.tam * (0.6 + 0.4 * e.vida) * (1 + 0.05 * Math.sin(t * 3 + e.fase));
    e.s.scale.set(tam, tam, 1);
    e.s.material.opacity = Math.min(1, e.vida * 1.5);
  }

  /* El kit aparece solo con ella en la bañera, y tapa la barra de ambientes.
     Va al final: arriba ella pudo haber saltado afuera en este mismo cuadro. */
  const verKit = estado === 'banera' && modo === 'casa';
  if (verKit !== kitVisible) {
    kitVisible = verKit;
    marco.classList.toggle('en-banera', verKit);
  }
}

/* ---------- Columpio ----------
   Un péndulo de verdad, sin motor de física: una sola ecuación con un paso fijo pequeño.
   Cada deslizamiento del dedo lo empuja un poco más alto. Si lo empujas demasiado da una
   vuelta completa: está calculada para pasar justo por arriba (sin roce durante la vuelta y
   con un tope de energía), y después frena fuerte. Ella baja mareada, con estrellitas. */

const IMAN_COLUMPIO = 0.15;            /* en anchos de pantalla */
const W2_COLUMPIO = 5.8;               /* gravedad / largo: un vaivén de unos 2,6 s */
const ROCE_CON_ELLA = 0.16, ROCE_VACIO = 0.7, ROCE_FRENO = 2.4;
const ENERGIA_VUELTA = 2 * W2_COLUMPIO;
const TOPE_DE_ENERGIA = ENERGIA_VUELTA * 1.08;   /* pasa por arriba despacito: el chiste se ve */
const IMPULSO_COLUMPIO = 1.35;
const RAPIDEZ_DE_EMPUJE = 1.2;         /* un deslizamiento más rápido que esto la empuja */
const SOBRE_HAMACA = new THREE.Vector3(0, -3.07, 0.05);
const pivoteColumpio = cuartos.hamaca.getWorldPosition(new THREE.Vector3());
const columpio = {
  angulo: 0, vel: 0, frenar: false, enVuelta: false, vueltas: 0, empujones: 0,
  giroX: 0, proximaFrase: 0, avisos: 0, fraseMama: 0
};
let patioVisible = false;

/* Dónde queda su raíz sentada en la hamaca, con la hamaca en ese ángulo. */
function sobreHamaca(v, angulo) {
  const c = Math.cos(angulo), s = Math.sin(angulo);
  return v.set(pivoteColumpio.x + SOBRE_HAMACA.x,
    pivoteColumpio.y + SOBRE_HAMACA.y * c - SOBRE_HAMACA.z * s,
    pivoteColumpio.z + SOBRE_HAMACA.y * s + SOBRE_HAMACA.z * c);
}
const energiaColumpio = () => 0.5 * columpio.vel * columpio.vel + W2_COLUMPIO * (1 - Math.cos(columpio.angulo));
function amplitudColumpio() {
  const e = energiaColumpio();
  return e >= ENERGIA_VUELTA ? Math.PI : Math.acos(Math.max(-1, 1 - e / W2_COLUMPIO));
}

/* Al aterrizar en la hamaca. */
function entrarAlColumpio() {
  columpio.angulo = 0; columpio.vel = 0; columpio.frenar = false; columpio.enVuelta = false;
  mostrarFeliz(0.8);
  if (columpio.avisos < 2) { columpio.avisos++; decir('¡Desliza el dedo para empujarme!'); }
}

/* Tocar el columpio con ella libre: va saltando hasta él y se sube sola. */
function irAlColumpio() {
  if (estado !== 'libre' || modo !== 'casa' || estaTriste()) return false;
  const destino = sobreHamaca(new THREE.Vector3(), 0);
  irA(Math.max(centro() - LIMITE.x, Math.min(centro() + LIMITE.x, destino.x)), LIMITE.zMin);
  ultimoToque = t;
  if (viaje) viaje.alLlegar = subirAlColumpio;
  else subirAlColumpio();
  return true;
}
function subirAlColumpio() {
  if (estado !== 'libre' || modo !== 'casa' || cuarto !== CUARTO_PATIO) return;
  const destino = sobreHamaca(new THREE.Vector3(), 0);
  caida.h0 = raiz.position.y; caida.x0 = raiz.position.x; caida.z0 = raiz.position.z;
  caida.x1 = destino.x; caida.y1 = destino.y; caida.z1 = destino.z;
  caida.arco = 1.1; caida.dur = 0.55;
  caida.alTerminar = 'columpio'; caida.luego = null; caida.despues = null;
  caida.inicio = t;
  r.giro.meta = Math.round(r.giro.x / (Math.PI * 2)) * Math.PI * 2;
  r.aplastar.v -= 1.2;
  cambiarEstado('cayendo');
}

/* Un deslizamiento del dedo: empuja en el sentido en que va (o según el dedo, si está quieta). */
function empujarColumpio(dy) {
  if (estado !== 'columpio' || columpio.frenar) return false;
  ultimoToque = t;
  const dir = Math.abs(columpio.vel) > 0.4 ? Math.sign(columpio.vel) : (dy < 0 ? 1 : -1);
  columpio.vel += dir * IMPULSO_COLUMPIO;
  if (energiaColumpio() > TOPE_DE_ENERGIA) {
    const potencial = W2_COLUMPIO * (1 - Math.cos(columpio.angulo));
    columpio.vel = Math.sign(columpio.vel) * Math.sqrt(Math.max(0, 2 * (TOPE_DE_ENERGIA - potencial)));
  }
  columpio.empujones++;
  r.aplastar.v -= 0.5;
  r.orejaLado.v += dir * 1.2;
  const amp = amplitudColumpio();
  tocar(ESCALA[Math.min(7, Math.round(amp / Math.PI * 7))], 0, 0.12);
  if (tienda && columpio.empujones % 5 === 0) tienda.ganar('columpio', 1, cabezaEnPantallaCliente());   /* 1 ♥ cada 5 empujones */
  if (encargos) encargos.registrar('empujon');
  if (t > columpio.proximaFrase) {
    if (amp > 2.0) { decir('¡Muy alto! ¡Ay, ay!'); columpio.proximaFrase = t + 5; }
    else if (amp > 0.8) { decir(['¡Wiii!', '¡Más alto, más alto!', '¡Qué divertido!'][columpio.empujones % 3]); columpio.proximaFrase = t + 7; }
  }
  return true;
}

/* Después de la vuelta completa: baja, se tambalea y recuerda un consejo de mamá. */
function marearse() {
  mareoHasta = t + 3.5;
  gestoPasajero('sorpresa', 0.8);
  decir('Todo me da vueltas…');
  columpio.fraseMama = t + 4.2;
}

/* Ruido filtrado: el viento al pasar por abajo. */
function soplar(fuerza) {
  const ctx = contextoDeAudio();
  if (!ctx) return;
  if (!ruidoBlanco) {
    ruidoBlanco = ctx.createBuffer(1, ctx.sampleRate, ctx.sampleRate);
    const datos = ruidoBlanco.getChannelData(0);
    for (let i = 0; i < datos.length; i++) datos[i] = Math.random() * 2 - 1;
  }
  const fuente = ctx.createBufferSource();
  fuente.buffer = ruidoBlanco;
  const filtro = ctx.createBiquadFilter();
  filtro.type = 'bandpass';
  filtro.frequency.value = 700 + 500 * fuerza;
  filtro.Q.value = 0.8;
  const g = ctx.createGain(), t0 = ctx.currentTime;
  g.gain.setValueAtTime(0.0001, t0);
  g.gain.exponentialRampToValueAtTime(0.02 + 0.07 * fuerza, t0 + 0.12);
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.45);
  fuente.connect(filtro); filtro.connect(g); g.connect(busEfectos);
  fuente.start(t0);
  fuente.stop(t0 + 0.5);
}

function actualizarColumpio(dt) {
  /* Mientras ella cae hacia la hamaca, la hamaca se frena para recibirla. */
  const atajando = estado === 'cayendo' && caida.alTerminar === 'columpio';
  const previo = columpio.angulo;
  let resto = Math.min(dt, 0.25);
  while (resto > 1e-6) {
    const h = Math.min(resto, 1 / 240);
    resto -= h;
    let roce = columpio.frenar ? ROCE_FRENO : atajando ? 12 : estado === 'columpio' ? ROCE_CON_ELLA : ROCE_VACIO;
    if (!columpio.frenar && !atajando && estado === 'columpio' && energiaColumpio() >= ENERGIA_VUELTA * 0.97) roce = 0;
    const tiro = atajando ? 30 * Math.sin(columpio.angulo) : 0;
    columpio.vel += (-W2_COLUMPIO * Math.sin(columpio.angulo) - roce * columpio.vel - tiro) * h;
    columpio.angulo += columpio.vel * h;
  }
  /* La vuelta completa: al pasar por arriba se asusta; al completarla, frena. */
  if (!columpio.enVuelta && Math.abs(columpio.angulo) > Math.PI) {
    columpio.enVuelta = true;
    if (estado === 'columpio') {
      gestoPasajero('sorpresa', 1.4);
      decir('¡Ay, ay, ay!');
      [7, 5, 3, 0].forEach((grado, i) => tocar(ESCALA[grado], i * 0.08, 0.14));
    }
  }
  if (Math.abs(columpio.angulo) >= Math.PI * 2) {
    columpio.angulo -= Math.sign(columpio.angulo) * Math.PI * 2;
    columpio.enVuelta = false;
    columpio.vueltas++;
    columpio.frenar = true;
    if (encargos && estado === 'columpio') encargos.registrar('vuelta');
  }
  if (columpio.enVuelta && Math.abs(columpio.angulo) < Math.PI * 0.5) columpio.enVuelta = false;   /* no llegó: volvió */
  cuartos.hamaca.rotation.x = columpio.angulo;

  /* El viento al pasar por abajo. */
  if (estado === 'columpio' && Math.sign(previo) !== Math.sign(columpio.angulo) && Math.abs(columpio.vel) > 1.4) {
    soplar(Math.min(1, Math.abs(columpio.vel) / 5));
  }

  if (estado === 'columpio') {
    const amp = amplitudColumpio();
    if (!estaTriste() && !estaEnojada()) {
      if (columpio.enVuelta || amp > 2.0) gestoPasajero('sorpresa', 0.2);
      else if (amp > 0.25) gestoPasajero('feliz', 0.2);
    }
    /* Las orejas flotan con el viento. */
    r.orejaFondo.meta = limitar(-columpio.vel * 0.2, 1);
    /* Si sube mucho, la cámara la acompaña para que se vea la vuelta. */
    r.camAlza.meta = Math.max(0, sobreHamaca(enPantalla, columpio.angulo).y - 3.4) * 0.85;
    if (columpio.frenar && energiaColumpio() < 0.35) {
      columpio.frenar = false;
      bajarDeMueble(undefined, undefined, marearse);
    }
  } else {
    r.orejaFondo.meta = 0;
    r.camAlza.meta = 0;
    if (columpio.frenar && energiaColumpio() < 0.35) columpio.frenar = false;
  }
  if (columpio.fraseMama && t > columpio.fraseMama) {
    columpio.fraseMama = 0;
    if (modo === 'casa' && cuarto === CUARTO_PATIO) decir('Mi mamá dice que en el columpio hay que ir despacito');
  }
}

/* ---------- Patio: flores, regadera y Kuromi (patio.js) ---------- */

/* Hace que mire hacia un punto de la pantalla, como si alguien lo señalara. */
function mirarA(x, y) {
  if (puntero.abajo) return;
  puntero.x = x; puntero.y = y; puntero.visto = t;
}

patio = crearPatio({
  pintura, parte, elipsoide, marco, lienzo, camara, prepararProyeccion,
  grupo: cuartos.grupos[2],
  grupoSala,
  puntoDeElla: cabezaEnPantallaCliente,
  xDeElla: () => raiz.position.x,
  tocar, decir, chispa, mirarA,
  feliz: mostrarFeliz,
  texturaGota: texturaLagrima, texturaBrillo,
  sonarAgua: (segundos) => sonarDucha(segundos),
  ganar: (origen, n, desde) => (tienda ? tienda.ganar(origen, n, desde) : 0),
  avisar: (evento) => { if (encargos) encargos.registrar(evento); }
});

encargos = crearEncargos({
  marco, tocar, decir,
  feliz: mostrarFeliz,
  puntoDeElla: cabezaEnPantallaCliente,
  ganar: (origen, n, desde) => (tienda ? tienda.ganar(origen, n, desde) : 0),
  /* Un deseo no se abre en medio de algo: con el dedo apoyado, cargándola, comiendo o en la tiendita. */
  puedeInterrumpir: () => modo === 'casa' && !puntero.abajo && !['cargada', 'cayendo', 'comiendo', 'transicion'].includes(estado) &&
    !(tienda && tienda.abierta()) && !(cocina && cocina.arrastrando && cocina.arrastrando()),
  silencioso: () => silencio,
  empezarFinal: (prueba) => empezarFinal(prueba),
  /* Un encargo solo sale si hoy se puede cumplir. El ramo pide flores grandes (o a un riego de serlo). */
  disponible: (id) => {
    if (id !== 'ramo') return true;
    const p = patio.interno();
    return !p.secas && (p.etapa === 4 || (p.etapa === 3 && !p.regadoHoy));
  }
});
patio.tocables.cantero.forEach((o) => registrarTocable(o, CUARTO_PATIO, () => patio.hablarDeLasFlores()));
registrarTocable(patio.tocables.kuromi, CUARTO_PATIO, () => patio.tocarKuromi());
registrarTocable(patio.tocables.florero, 0, () => patio.hablarDelFlorero());
registrarTocable(cuartos.columpio, CUARTO_PATIO, irAlColumpio);

/* ---------- El final de la Nota 100 ----------
   Como en los finales de temporada, My Melody pide ayuda: se toca la escala con ella
   (8 toques), tiembla el piso, brotan las aguas termales y se abre la sorpresa de Nico.
   Las termas quedan en el patio para siempre. 'prueba' (botón de Opciones) no guarda nada. */

const fin = { activo: false, paso: '', desde: 0, toques: 0, prueba: false, centrada: false, destello: false };
const capaFinal = document.createElement('div');
capaFinal.id = 'final';
capaFinal.className = 'capa';
/* El texto y el botón van en una columna a la derecha: así no le tapan los pies a ella. */
capaFinal.innerHTML = '<div class="final-columna"><div class="final-texto"></div>' +
  '<button class="final-boton" type="button" aria-label="Tocar una nota" hidden><span>♪</span></button></div>' +
  '<div class="final-destello"></div>';
marco.appendChild(capaFinal);
const textoFinal = capaFinal.querySelector('.final-texto');
const botonFinal = capaFinal.querySelector('.final-boton');
const NOMBRES_ESCALA = ['do', 're', 'mi', 'fa', 'sol', 'la', 'si', 'do'];

function empezarFinal(prueba) {
  if (fin.activo || modo !== 'casa') return false;
  if (estado === 'cargada') { puntero.abajo = false; dejarCaer(); }
  if (estado === 'comiendo') terminarComida();
  if (acomodada()) bajarDeMueble();
  if (cocina) cocina.cerrarRefri(false);
  if (tienda) tienda.cerrar(false);
  cortarBano();
  patio.cortar();
  encargos.cerrarPanel(false);
  Object.assign(fin, { activo: true, paso: 'llamado', desde: t, toques: 0, prueba: !!prueba, centrada: false, destello: false });
  dormida = false; enojo = 0;
  capaFinal.classList.remove('destello');
  capaFinal.classList.add('visible');
  marco.classList.add('en-final');
  botonFinal.hidden = true;
  textoFinal.textContent = '';
  decir('¡Juntamos 100 Notas Rosas!');
  mostrarFeliz(2.5);
  r.salto.v += 6;
  [0, 4, 7].forEach((grado, i) => tocar(ESCALA[grado], i * 0.12, 0.14));
  return true;
}

function actualizarFinal(dt) {
  if (!fin.activo) return;
  /* Mientras dura, ella no pasea, no se duerme y no pide comida. */
  ultimoToque = t; proximoPaseo = t + 5; proximoAvisoHambre = Math.max(proximoAvisoHambre, t + 10);
  const e = t - fin.desde;
  if (fin.paso === 'llamado') {
    if (!fin.centrada && estado === 'libre' && !viaje) { fin.centrada = true; irA(centro(), 0.4); }
    if (e > 3.2) {
      fin.paso = 'pedido'; fin.desde = t;
      gestoPasajero('sorpresa', 1.2);
      decir('Para cumplir el gran deseo… ¡necesito tu ayuda!');
    }
  } else if (fin.paso === 'pedido') {
    if (e > 3.4) {
      fin.paso = 'escala'; fin.desde = t;
      botonFinal.hidden = false;
      textoFinal.textContent = 'Toca el botón 8 veces para tocar la escala con ella';
    }
  } else if (fin.paso === 'brote') {
    /* Tiembla el piso, sube vapor y saltan gotas. */
    if (e < 2.2) r.camX.v += (Math.random() - 0.5) * 40 * dt;
    if (Math.random() < dt * 30) {
      chispa(texturaBrillo, centro() + (Math.random() - 0.5) * 9, 0.2, -1.2 + Math.random() * 2.4,
        (Math.random() - 0.5) * 0.3, 1 + Math.random(), 1.6, 0.6 + Math.random() * 0.6, 0);
    }
    if (e > 0.6 && Math.random() < dt * 25) {
      chispa(texturaLagrima, centro() + (Math.random() - 0.5) * 6, 0.3, -0.5 + Math.random(),
        (Math.random() - 0.5) * 2, 5 + Math.random() * 2, 1.0, 0.25, 9);
    }
    if (!fin.destello && e > 1.2) {
      fin.destello = true;
      capaFinal.classList.add('destello');
      [523.25, 659.25, 783.99, 1046.5, 1318.5, 1568, 2093].forEach((f, i) => tocar(f, i * 0.05, 0.12));
      decir('¡Brotaron las aguas termales!');
    }
    /* Corazones que van saliendo de a uno, desparramados (todos juntos quedaban en fila). */
    if (e > 1.2 && e < 2.6 && Math.random() < dt * 7) soltarCorazon((Math.random() - 0.5) * 3.4);
    if (e > 4.2) {
      fin.paso = 'carta'; fin.desde = t;
      capaFinal.classList.remove('destello');
      textoFinal.textContent = '';
      encargos.mostrarSorpresa(fin.prueba, terminarFinal);
    }
  }
}

botonFinal.addEventListener('click', () => {
  if (fin.paso !== 'escala') return;
  tocar(ESCALA[fin.toques], 0, 0.2);
  lanzarNotaFinal();
  r.aplastar.v -= 1.4; r.salto.v += 3; r.orejaFondo.v += 2;
  mostrarFeliz(0.8);
  soltarCorazon();
  fin.toques++;
  textoFinal.textContent = NOMBRES_ESCALA.slice(0, fin.toques).join(' · ');
  if (fin.toques >= NOMBRES_ESCALA.length) {
    fin.paso = 'brote'; fin.desde = t;
    botonFinal.hidden = true;
    r.vuelta.meta += Math.PI * 2;
    mostrarFeliz(3);
    decir('¡Lo logramos!');
  }
});

/* Una nota rosa vuela del botón a My Melody. */
function lanzarNotaFinal() {
  const caja = marco.getBoundingClientRect(), b = botonFinal.getBoundingClientRect(), c = cabezaEnPantalla();
  const x0 = b.left + b.width / 2 - caja.left, y0 = b.top + b.height / 2 - caja.top;
  const el = document.createElement('div');
  el.className = 'nota-voladora';
  el.innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9 17.5V5.5l10-2v11.5" fill="none" stroke-width="2.2"/><circle cx="6.5" cy="17.5" r="2.6"/><circle cx="16.5" cy="15" r="2.6"/></svg>';
  el.style.left = x0 + 'px';
  el.style.top = y0 + 'px';
  marco.appendChild(el);
  requestAnimationFrame(() => requestAnimationFrame(() => {
    el.style.transform = 'translate(' + (c.x - x0) + 'px,' + (c.y + caja.height * 0.12 - y0) + 'px) scale(.7)';
  }));
  setTimeout(() => el.remove(), 900);
}

function terminarFinal() {
  fin.activo = false;
  fin.paso = '';
  capaFinal.classList.remove('visible', 'destello');
  marco.classList.remove('en-final');
  botonFinal.hidden = true;
  patio.mostrarTermas(true);
  mostrarFeliz(2);
  decir(cuarto === CUARTO_PATIO ? '¡Mira, aguas termales en el patio!' : '¡Vamos al patio a ver las aguas termales!');
}

/* Botón para que Nico vea el final sin tener 100 Notas (en la fila de pruebas de Opciones). */
const botonVerFinal = document.getElementById('btn-final');
if (botonVerFinal) botonVerFinal.addEventListener('click', () => {
  document.getElementById('opciones').classList.remove('visible');
  if (!empezarFinal(true)) decir('Entra a la casa para ver el final');
});

/* Las termas ya brotaron en una partida anterior. */
patio.mostrarTermas(encargos.finalVisto());
registrarTocable(patio.tocables.termas, CUARTO_PATIO, () => patio.hablarDeLasTermas());

function actualizarPatio(dt) {
  const verPatio = modo === 'casa' && cuarto === CUARTO_PATIO;
  patio.actualizar(dt, t, verPatio && estado !== 'transicion');
  if (encargos) encargos.actualizar(t);
  actualizarFinal(dt);
  if (verPatio !== patioVisible) {
    patioVisible = verPatio;
    marco.classList.toggle('en-patio', verPatio);
  }
}

/* ---------- Para las pruebas (pruebas.js) ---------- */

function interno() {
  return {
    estado, estadoDesde, t, cuarto, centro: centro(), modo,
    x: raiz.position.x, y: raiz.position.y, z: raiz.position.z,
    viaje: !!viaje, limite: LIMITE, maxEstado: MAX_ESTADO,
    resortesOk: Object.values(r).every((s) => Number.isFinite(s.x) && Number.isFinite(s.v)),
    sentadaOk: (estado !== 'sentada' || (Math.abs(raiz.position.x - ASIENTO.x) < 0.05 && Math.abs(raiz.position.z - ASIENTO.z) < 0.05)) &&
      (estado !== 'banera' || (Math.abs(raiz.position.x - EN_BANERA.x) < 0.05 && Math.abs(raiz.position.z - EN_BANERA.z) < 0.05)),
    espuma: espumas.length,
    columpio: { angulo: columpio.angulo, vel: columpio.vel, frenar: columpio.frenar, vueltas: columpio.vueltas, empujones: columpio.empujones },
    columpioOk: estado !== 'columpio' || raiz.position.distanceTo(sobreHamaca(new THREE.Vector3(), columpio.angulo)) < 0.05,
    mareada: t < mareoHasta,
    patio: patio ? patio.interno() : null,
    encargos: encargos ? encargos.interno() : null,
    final: fin.activo ? fin.paso : '',
    suciedad,
    hambre: cocina ? cocina.hambre() : 0,
    inventario: cocina ? cocina.inventario() : {},
    refriAbierto: cocina ? cocina.refriAbierto() : false,
    corazones: tienda ? tienda.corazones() : 0,
    ganadosHoy: tienda ? tienda.ganadosHoy() : {},
    topes: tienda ? tienda.topes : {}
  };
}

function puntoDeElla() {
  prepararProyeccion();
  const v = raiz.position.clone();
  v.y += 1.4;
  v.project(camara);
  const caja = lienzo.getBoundingClientRect();
  return { x: caja.left + (v.x + 1) / 2 * caja.width, y: caja.top + (1 - v.y) / 2 * caja.height };
}

/* ---------- Lo que usa la pantalla de título (titulo.js) ---------- */

function cambiarModo(nuevo, inmediato) {
  if (nuevo === undefined) return modo;
  /* Cualquier acción a medias se termina antes de cambiar de modo. */
  if (estado === 'cargada') { puntero.abajo = false; dejarCaer(); }
  if (estado === 'cayendo') aterrizarCaida();
  if (estado === 'transicion') terminarCambio();
  if (estado === 'comiendo') terminarComida();
  if (acomodada()) {
    const enLaBanera = estado === 'banera';
    cambiarEstado('libre');
    raiz.position.set(centro() + (enLaBanera ? -LIMITE.x : LIMITE.x), 0, Math.max(LIMITE.zMin, Math.min(LIMITE.zMax, raiz.position.z)));
  }
  if (cocina) cocina.cerrarRefri(false);
  if (tienda) tienda.cerrar(false);
  cortarBano();
  if (patio) patio.cortar();
  modo = nuevo;
  puntero.abajo = false;
  if (modo === 'titulo') {
    dormida = false; sentadaHasta = 0; baileHasta = 0;
    proximoSaludoTitulo = t + 1.2;
    if (Math.hypot(raiz.position.x - centro(), raiz.position.z) > 0.3) irA(centro(), 0);   /* vuelve al centro a saltitos */
  } else {
    ultimoToque = t;
    proximoPaseo = t + 4;
    proximoAvisoHambre = t + 6;
    if (encargos) encargos.registrar('cuarto', { cuarto });
  }
  if (inmediato) {
    const e = ENCUADRE[modo] || ENCUADRE.casa;
    camBase.copy(e.pos); camBase.x += centro();
    miraBase.copy(e.mira); miraBase.x += centro();
    camara.position.copy(camBase);
    camara.lookAt(miraBase);
  }
  marco.classList.toggle('en-casa', modo === 'casa');
  return modo;
}

/* Saludo al entrar a la casa: salta, saluda con la mano y sonríe. */
function saludar() {
  saludoHasta = t + 1.6;
  mostrarFeliz(1.6);
  r.salto.v += 5;
  if (tienda) tienda.regaloDelDia();
  if (encargos) encargos.anunciar();
}

/* Punto encima de su cabeza, en píxeles dentro del marco. Para el globo de diálogo. */
/* Pasar de 3D a pantalla necesita la cámara y los objetos al día, aunque todavía no se
   haya dibujado ningún cuadro (por ejemplo, con la pestaña en segundo plano). */
function prepararProyeccion() {
  escena.updateMatrixWorld();
  camara.updateMatrixWorld();
}

function cabezaEnPantalla() {
  prepararProyeccion();
  const v = new THREE.Vector3();
  cabeza.getWorldPosition(v);
  v.y += 2.15;
  v.project(camara);
  return { x: (v.x + 1) / 2 * marco.clientWidth, y: (1 - v.y) / 2 * marco.clientHeight };
}

const sonido = {
  contexto: contextoDeAudio,
  efecto: tocar,
  /* Nota de música a una hora exacta del reloj de audio. */
  nota(frecuencia, cuando, fuerza, largo) {
    const ctx = contextoDeAudio();
    if (ctx) campanita(ctx, busMusica, frecuencia, cuando, fuerza, largo);
  },
  ahora: () => (audio ? audio.currentTime : 0),
  listo: () => !!audio && audio.state === 'running',
  volumen(nombre, valor) {
    if (valor !== undefined) {
      volumen[nombre] = valor;
      const bus = nombre === 'musica' ? busMusica : busEfectos;
      if (bus) bus.gain.setTargetAtTime(valor, audio.currentTime, 0.03);
      try { localStorage.setItem('nella-volumen', JSON.stringify(volumen)); } catch (err) { /* sin almacenamiento */ }
    }
    return volumen[nombre];
  }
};

window.NellaFase0 = {
  diagnostico: textoDeDiagnostico, reaccionar, irA, golpear, pasarUnDia,
  dormir: () => { ultimoToque = t - SEGUNDOS_PARA_DORMIRSE - 1; },
  /* Avanza la escena a mano, para pruebas que no dependen de que la pantalla esté visible. */
  avanzar: (segundos, sinDibujar) => {
    actualizar(segundos);
    if (sinDibujar) { escena.updateMatrixWorld(); camara.updateMatrixWorld(); }
    else renderer.render(escena, camara);
  },
  animo: () => ({
    enojo: +enojo.toFixed(2), pena: +pena.toFixed(2), suciedad, dias: diasSinVisita,
    manchas: manchas.filter((m) => m.visible).length, cara: gesto || caraDeFondo()
  }),
  estado: () => ({ x: +raiz.position.x.toFixed(2), z: +raiz.position.z.toFixed(2), enViaje: !!viaje, t: +t.toFixed(2) })
};

Object.assign(window.NellaFase0, { modo: cambiarModo, saludar, cabezaEnPantalla, sonido, irAlCuarto, interno, puntoDeElla,
  bocaEnPantalla, puntoDeObjeto, cocina, tienda, patio, encargos,
  verFinal: () => empezarFinal(true),
  /* Foto de My Melody sola, con fondo transparente (para el ícono de la app). */
  retrato: (tam = 1024) => {
    const lienzoFoto = document.createElement('canvas');
    lienzoFoto.width = lienzoFoto.height = tam;
    const r2 = new THREE.WebGLRenderer({ canvas: lienzoFoto, alpha: true, antialias: true, preserveDrawingBuffer: true });
    r2.setClearColor(0x000000, 0);
    const foto = new THREE.Scene();
    foto.add(new THREE.HemisphereLight(0xfff6fa, 0xf5cdb8, 2.2));
    const luz = new THREE.DirectionalLight(0xffffff, 1.5);
    luz.position.set(-3, 5, 8);
    foto.add(luz);
    const padreOriginal = raiz.parent, pos = raiz.position.clone(), giro = raiz.rotation.clone();
    saludoHasta = 0; baileHasta = 0;   /* de frente, sin saludar con la mano */
    gestoPasajero('feliz', 5);
    actualizar(1 / 60);
    foto.add(raiz);
    raiz.position.set(0, 0, 0);
    raiz.rotation.set(0, 0, 0);
    const cam = new THREE.PerspectiveCamera(30, 1, 0.1, 50);
    cam.position.set(0, 2.55, 10.5);
    cam.lookAt(0, 2.55, 0);
    r2.render(foto, cam);
    const url = lienzoFoto.toDataURL('image/png');
    padreOriginal.add(raiz);
    raiz.position.copy(pos);
    raiz.rotation.copy(giro);
    r2.dispose();
    return url;
  },
  silenciar: (si) => { silencio = !!si; if (silencio) callar(); },
  callar });
/* Avisa a titulo.js que la escena ya está lista. */
window.dispatchEvent(new Event('nella-lista'));
