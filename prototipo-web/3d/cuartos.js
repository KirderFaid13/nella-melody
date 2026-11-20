/* Nella Melody · fase 0 · los ambientes de la casa.
   Cada ambiente es un grupo propio, puestos uno al lado del otro sobre el eje X,
   como una casa de muñecas abierta. Aquí solo está el decorado: lo que My Melody
   hace en cada uno vive en escena3d.js. La sala se arma en escena3d.js. */
import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';

export const ANCHO_CUARTO = 18;

export const CUARTOS = [
  { id: 'sala', nombre: 'Sala', x: 0 },
  { id: 'cocina', nombre: 'Cocina', x: ANCHO_CUARTO },
  { id: 'bano', nombre: 'Baño', x: ANCHO_CUARTO * 2 },
  { id: 'patio', nombre: 'Patio', x: ANCHO_CUARTO * 3 }
];

/* h trae las herramientas de dibujo de escena3d.js: pintura, parte, elipsoide y texturaDe. */
export function construirCuartos(escena, h) {
  const { pintura, parte, elipsoide, texturaDe } = h;

  /* ---------- Piezas ---------- */

  function nuevoGrupo(x) {
    const g = new THREE.Group();
    g.position.x = x;
    escena.add(g);
    return g;
  }

  /* Mueble con esquinas redondeadas y contorno de tinta, como un juguete. */
  function mueble(padre, w, alto, d, color, x, y, z, radio = 0.16, borde = 0.035) {
    const r = Math.max(0.01, Math.min(radio, w / 2 - 0.01, alto / 2 - 0.01, d / 2 - 0.01));
    const obj = parte(new RoundedBoxGeometry(w, alto, d, 3, r), pintura(color), borde);
    obj.position.set(x, y, z);
    padre.add(obj);
    return obj;
  }
  function cilindro(padre, r1, r2, alto, color, x, y, z, borde = 0.03) {
    const obj = parte(new THREE.CylinderGeometry(r1, r2, alto, 32), pintura(color), borde);
    obj.position.set(x, y, z);
    padre.add(obj);
    return obj;
  }
  function bola(padre, rx, ry, rz, color, x, y, z, borde = 0.03) {
    const obj = parte(elipsoide(rx, ry, rz, 24, 16), pintura(color), borde);
    obj.position.set(x, y, z);
    padre.add(obj);
    return obj;
  }
  function disco(padre, radio, material, x, y, z, acostado) {
    const m = new THREE.Mesh(new THREE.CircleGeometry(radio, 40), material);
    if (acostado) { m.rotation.x = -Math.PI / 2; m.receiveShadow = true; }
    m.position.set(x, y, z);
    padre.add(m);
    return m;
  }
  const plano = (color) => new THREE.MeshBasicMaterial({ color });

  /* Piso, pared del fondo y zócalo de un ambiente. */
  function cascaron(g, texturaPiso, texturaPared, colorZocalo) {
    const piso = new THREE.Mesh(new THREE.PlaneGeometry(ANCHO_CUARTO, 30), pintura(0xffffff, { map: texturaPiso }));
    piso.rotation.x = -Math.PI / 2;
    piso.receiveShadow = true;
    g.add(piso);
    if (texturaPared) {
      const pared = new THREE.Mesh(new THREE.PlaneGeometry(ANCHO_CUARTO, 18), new THREE.MeshBasicMaterial({ map: texturaPared }));
      pared.position.set(0, 9, -5.2);
      g.add(pared);
    }
    if (colorZocalo !== undefined) {
      const zocalo = new THREE.Mesh(new THREE.BoxGeometry(ANCHO_CUARTO, 0.5, 0.2), pintura(colorZocalo));
      zocalo.position.set(0, 0.25, -5.1);
      g.add(zocalo);
    }
  }

  function flor(padre, x, y, z, color, escala = 1) {
    const f = new THREE.Group();
    f.position.set(x, y, z);
    f.scale.setScalar(escala);
    for (let k = 0; k < 5; k++) {
      const a = (k / 5) * Math.PI * 2;
      bola(f, 0.13, 0.13, 0.06, color, Math.cos(a) * 0.14, Math.sin(a) * 0.14, 0, 0.018);
    }
    bola(f, 0.09, 0.09, 0.07, 0xffd43b, 0, 0, 0.04, 0.018);
    padre.add(f);
    return f;
  }

  /* ---------- Cocina ---------- */

  const cocina = nuevoGrupo(CUARTOS[1].x);
  cascaron(cocina,
    texturaDe(64, 64, (g) => {
      g.fillStyle = '#fff4e8'; g.fillRect(0, 0, 64, 64);
      g.fillStyle = '#ffdbe6'; g.fillRect(0, 0, 32, 32); g.fillRect(32, 32, 32, 32);
    }, 6, 10),
    texturaDe(64, 64, (g) => {
      g.fillStyle = '#e2f6ea'; g.fillRect(0, 0, 64, 64);
      g.fillStyle = '#f4fcf7'; g.fillRect(0, 0, 14, 64);
    }, 9, 9),
    0xfffaf6);

  /* Refrigerador: en el paso 2, al tocarlo se abre el panel de comida. */
  const refri = new THREE.Group();
  refri.position.set(-5.4, 0, -3.9);
  cocina.add(refri);
  mueble(refri, 2.0, 4.1, 1.6, 0xfff1f6, 0, 2.05, 0, 0.3);
  /* Interior iluminado: se ve cuando la puerta de abajo se abre. */
  mueble(refri, 1.7, 2.4, 0.04, 0xeaf6ff, 0, 1.55, 0.79, 0.02, 0);
  [1.0, 1.85].forEach((y) => mueble(refri, 1.6, 0.05, 0.1, 0xffffff, 0, y, 0.82, 0.02, 0));
  bola(refri, 0.12, 0.14, 0.1, 0xff4f6d, -0.45, 1.16, 0.86, 0.015);
  bola(refri, 0.12, 0.14, 0.1, 0xff4f6d, -0.2, 1.16, 0.86, 0.015);
  cilindro(refri, 0.12, 0.12, 0.42, 0xffffff, 0.45, 1.26, 0.86, 0.015);
  mueble(refri, 0.5, 0.22, 0.2, 0xffd36b, 0.2, 1.98, 0.86, 0.06, 0.015);
  /* Puerta de arriba (fija) y puerta de abajo, con bisagra a la izquierda. */
  mueble(refri, 2.0, 1.05, 0.12, 0xfff1f6, 0, 3.47, 0.86, 0.1);
  mueble(refri, 0.14, 0.6, 0.16, 0xf589b8, 0.78, 3.4, 0.95, 0.06, 0.02);
  const puertaRefri = new THREE.Group();
  puertaRefri.position.set(-1.0, 0, 0.86);
  refri.add(puertaRefri);
  mueble(puertaRefri, 2.0, 2.6, 0.12, 0xfff1f6, 1.0, 1.55, 0, 0.1);
  mueble(puertaRefri, 0.14, 0.9, 0.16, 0xf589b8, 1.78, 2.2, 0.09, 0.06, 0.02);
  [[0.5, 2.5, 0xffd43b], [0.9, 2.1, 0x9fdcab], [0.45, 1.5, 0xbfe0ff]].forEach(([x, y, c]) => {
    const iman = cilindro(puertaRefri, 0.13, 0.13, 0.06, c, x, y, 0.08, 0.02);
    iman.rotation.x = Math.PI / 2;
  });

  /* Mesada con hornallas, tetera y alacena */
  mueble(cocina, 4.6, 1.9, 1.5, 0xffffff, 0.4, 0.95, -4.3, 0.12);
  mueble(cocina, 4.85, 0.2, 1.75, 0xf589b8, 0.4, 1.98, -4.2, 0.07);
  mueble(cocina, 0.05, 1.5, 0.04, 0xead7df, 0.4, 0.95, -3.53, 0.02, 0);
  [-0.1, 0.9].forEach((x) => bola(cocina, 0.09, 0.09, 0.07, 0xf589b8, x, 1.3, -3.52, 0.02));
  [1.4, 2.3].forEach((x) => cilindro(cocina, 0.32, 0.32, 0.04, 0x5c3d42, x, 2.1, -4.3, 0));
  bola(cocina, 0.42, 0.36, 0.42, 0xf589b8, 1.4, 2.46, -4.3);
  bola(cocina, 0.1, 0.08, 0.1, 0xfffaf6, 1.4, 2.86, -4.3, 0.02);
  const pico = cilindro(cocina, 0.06, 0.1, 0.45, 0xf589b8, 1.85, 2.55, -4.3, 0.02);
  pico.rotation.z = -0.9;
  mueble(cocina, 4.2, 1.4, 0.9, 0xffffff, 0.4, 5.1, -4.7, 0.12);
  [-0.6, 1.4].forEach((x) => bola(cocina, 0.08, 0.08, 0.06, 0xf589b8, x, 4.7, -4.23, 0.02));

  /* Ventanita redonda */
  const marcoVentana = cilindro(cocina, 1.0, 1.0, 0.16, 0xfffaf6, -3.15, 4.3, -5.08);
  marcoVentana.rotation.x = Math.PI / 2;
  disco(cocina, 0.82, plano(0xbfe6ff), -3.15, 4.3, -4.98);
  mueble(cocina, 0.08, 1.64, 0.05, 0xfffaf6, -3.15, 4.3, -4.95, 0.03, 0);
  mueble(cocina, 1.64, 0.08, 0.05, 0xfffaf6, -3.15, 4.3, -4.95, 0.03, 0);

  /* Mesa con frutero y silla. En el paso 2, si la sueltas cerca de la silla, se sienta. */
  cilindro(cocina, 0.14, 0.24, 1.5, 0xfffaf6, 6.1, 0.75, -2.6);
  cilindro(cocina, 1.05, 1.05, 0.12, 0xffd9e6, 6.1, 1.56, -2.6);
  bola(cocina, 0.5, 0.2, 0.5, 0xfffaf6, 6.1, 1.72, -2.6);
  [[5.9, -2.5], [6.25, -2.7], [6.15, -2.4]].forEach(([x, z]) => bola(cocina, 0.13, 0.15, 0.13, 0xff4f6d, x, 1.95, z, 0.02));
  const silla = new THREE.Group();
  silla.position.set(4.6, 0, -1.9);
  cocina.add(silla);
  [[-0.38, -0.38], [0.38, -0.38], [-0.38, 0.38], [0.38, 0.38]].forEach(([x, z]) => cilindro(silla, 0.06, 0.06, 1.0, 0xfffaf6, x, 0.5, z, 0.02));
  mueble(silla, 1.0, 0.18, 1.0, 0xfffaf6, 0, 1.05, 0, 0.08);
  mueble(silla, 0.9, 0.14, 0.9, 0xf589b8, 0, 1.18, 0, 0.07, 0.025);
  mueble(silla, 1.0, 1.3, 0.16, 0xfffaf6, 0, 1.75, -0.45, 0.08);

  /* Tapete frente a la mesada */
  const tapeteCocina = disco(cocina, 1, pintura(0xc9ecd6), 0.4, 0.012, -2.6, true);
  tapeteCocina.scale.set(2.2, 0.8, 1);

  /* ---------- Baño ---------- */

  const bano = nuevoGrupo(CUARTOS[2].x);
  cascaron(bano,
    texturaDe(64, 64, (g) => {
      g.fillStyle = '#ffffff'; g.fillRect(0, 0, 64, 64);
      g.fillStyle = '#d8ecff'; g.fillRect(0, 0, 32, 32); g.fillRect(32, 32, 32, 32);
    }, 9, 15),
    texturaDe(64, 64, (g) => {
      g.fillStyle = '#e6f3ff'; g.fillRect(0, 0, 64, 64);
      g.strokeStyle = '#ffffff'; g.lineWidth = 4; g.strokeRect(0, 0, 64, 64);
    }, 18, 18),
    0xffffff);

  /* Bañera con patitas, agua y espuma. En el paso 4 ella se mete aquí. */
  const banera = new THREE.Group();
  banera.position.set(-3.5, 0, -2.8);
  bano.add(banera);
  mueble(banera, 4.4, 1.5, 2.3, 0xffffff, 0, 1.0, 0, 0.55);
  mueble(banera, 3.9, 0.1, 1.8, 0xbfe6ff, 0, 1.72, 0, 0.05, 0);
  [[-1.8, -0.9], [1.8, -0.9], [-1.8, 0.9], [1.8, 0.9]].forEach(([x, z]) => bola(banera, 0.18, 0.2, 0.18, 0xffd43b, x, 0.2, z, 0.02));
  [[-1.2, 0.3, 0.32], [-0.7, 0.5, 0.25], [1.0, -0.2, 0.3], [1.4, 0.4, 0.22], [0.3, 0.55, 0.2]].forEach(([x, z, s]) => {
    bola(banera, s, s * 0.8, s, 0xffffff, x, 1.84, z, 0.02);
  });
  mueble(banera, 0.18, 0.7, 0.18, 0xffd43b, -2.0, 2.05, -0.8, 0.07, 0.02);
  const cano = cilindro(banera, 0.07, 0.07, 0.5, 0xffd43b, -1.8, 2.35, -0.8, 0.02);
  cano.rotation.z = Math.PI / 2;
  /* Patito de goma */
  bola(banera, 0.26, 0.2, 0.22, 0xffd43b, 1.4, 1.98, 0.95);
  bola(banera, 0.15, 0.15, 0.15, 0xffd43b, 1.6, 2.25, 0.95);
  bola(banera, 0.08, 0.04, 0.06, 0xff9a3c, 1.78, 2.22, 0.95, 0.015);

  /* Regadera: el caño sube por la pared a un costado de la bañera (así no queda detrás de
     su cabeza) y un brazo la lleva por encima de ella, más alto que sus orejas. */
  cilindro(bano, 0.06, 0.06, 3.5, 0xd9dde3, -5.6, 3.65, -4.95, 0.02);
  const brazoDucha = cilindro(bano, 0.05, 0.05, 1.3, 0xd9dde3, -5.6, 5.4, -4.35, 0.02);
  brazoDucha.rotation.x = Math.PI / 2;
  /* La regadera mira en diagonal hacia la bañera: el agua le cae en la cabeza desde un costado. */
  const ducha = cilindro(bano, 0.16, 0.4, 0.26, 0xd9dde3, -5.45, 5.25, -3.7);
  ducha.rotation.set(0.25, 0, -0.75);

  /* Lavamanos y espejo */
  cilindro(bano, 0.22, 0.34, 1.6, 0xffffff, 4.4, 0.8, -4.3);
  bola(bano, 0.95, 0.32, 0.7, 0xffffff, 4.4, 1.75, -4.3);
  const marcoEspejo = cilindro(bano, 1.15, 1.15, 0.12, 0xf589b8, 4.4, 4.0, -5.08);
  marcoEspejo.rotation.x = Math.PI / 2;
  disco(bano, 0.95, plano(0xdff2ff), 4.4, 4.0, -5.0);
  const reflejo = disco(bano, 0.3, plano(0xffffff), 4.05, 4.35, -4.99);
  reflejo.scale.set(0.5, 1, 1);

  /* Toallero con toalla y repisa con frascos */
  const barraToalla = cilindro(bano, 0.05, 0.05, 1.6, 0xd9dde3, 1.4, 3.3, -5.0, 0.015);
  barraToalla.rotation.z = Math.PI / 2;
  mueble(bano, 1.2, 1.4, 0.12, 0xffb3cd, 1.4, 2.65, -4.96, 0.08);
  mueble(bano, 1.2, 0.12, 0.05, 0xffffff, 1.4, 2.35, -4.89, 0.03, 0);
  mueble(bano, 1.8, 0.12, 0.55, 0xffffff, 1.4, 4.7, -4.9, 0.05);
  [[0.9, 0xbfe0ff, 0.5], [1.35, 0xffd9e6, 0.65], [1.8, 0xfff0a8, 0.45]].forEach(([x, c, a]) => cilindro(bano, 0.16, 0.16, a, c, x, 4.76 + a / 2, -4.9, 0.02));

  /* Tapete frente a la bañera */
  const tapeteBano = disco(bano, 1, pintura(0xffc4d8), -3.5, 0.012, -0.9, true);
  tapeteBano.scale.set(1.9, 0.75, 1);

  /* ---------- Patio ---------- */

  const patio = nuevoGrupo(CUARTOS[3].x);
  cascaron(patio,
    texturaDe(128, 128, (g) => {
      g.fillStyle = '#aee3a4'; g.fillRect(0, 0, 128, 128);
      g.strokeStyle = '#c6eebb'; g.lineWidth = 3; g.lineCap = 'round';
      for (let i = 0; i < 46; i++) {
        const x = (i * 37) % 128, y = (i * 71) % 128;
        g.beginPath(); g.moveTo(x, y); g.lineTo(x + 2, y - 9); g.stroke();
      }
    }, 8, 12),
    null);

  /* Cielo, sol, nubes y lomas */
  const cielo = new THREE.Mesh(new THREE.PlaneGeometry(ANCHO_CUARTO + 2, 16), new THREE.MeshBasicMaterial({
    map: texturaDe(4, 128, (g) => {
      const d = g.createLinearGradient(0, 0, 0, 128);
      d.addColorStop(0, '#9fd4ff'); d.addColorStop(0.7, '#d9efff'); d.addColorStop(1, '#fff2f7');
      g.fillStyle = d; g.fillRect(0, 0, 4, 128);
    }, 1, 1)
  }));
  cielo.position.set(0, 8, -6.8);
  patio.add(cielo);
  disco(patio, 0.95, plano(0xfff1a8), 5.6, 5.6, -6.7);
  disco(patio, 0.7, plano(0xffe066), 5.6, 5.6, -6.68);
  [[-4.5, 5.3, 0.7], [-3.6, 5.5, 0.55], [1.5, 6.1, 0.6], [2.4, 6.0, 0.45]].forEach(([x, y, r]) => {
    const nube = disco(patio, r, plano(0xffffff), x, y, -6.7);
    nube.scale.set(1.8, 0.8, 1);
  });
  bola(patio, 6.5, 2.2, 1, 0x9bd69a, -5, 0, -6.3, 0);
  bola(patio, 7.5, 1.7, 1, 0xa8dda0, 6, 0, -6.4, 0);

  /* Cerca blanca */
  mueble(patio, ANCHO_CUARTO, 0.18, 0.1, 0xffffff, 0, 0.75, -4.2, 0.05, 0.02);
  mueble(patio, ANCHO_CUARTO, 0.18, 0.1, 0xffffff, 0, 1.45, -4.2, 0.05, 0.02);
  for (let x = -8.5; x <= 8.5; x += 0.85) mueble(patio, 0.42, 1.9, 0.12, 0xffffff, x, 0.95, -4.12, 0.2, 0.02);

  /* Árbol con flores */
  cilindro(patio, 0.3, 0.42, 3.2, 0xc99a7a, -6.6, 1.6, -3.4);
  bola(patio, 1.5, 1.3, 1.2, 0x9fdcab, -6.6, 3.9, -3.4);
  bola(patio, 1.1, 1.0, 1.0, 0xa8e3b3, -7.4, 3.4, -3.0);
  bola(patio, 1.0, 0.95, 0.9, 0x9fdcab, -5.7, 3.5, -3.1);
  [[-6.2, 4.6, -2.5], [-7.2, 3.9, -2.2], [-5.5, 3.9, -2.4], [-6.9, 4.4, -2.6]].forEach(([x, y, z]) => flor(patio, x, y, z, 0xffb3cd, 0.8));

  /* Cantero de flores: las plantas las pone patio.js, que las hace crecer con los días. */
  mueble(patio, 3.6, 0.4, 1.3, 0xc99a7a, -3.2, 0.2, -3.0, 0.15);

  /* Columpio. En el paso 5 ella se sube y se empuja deslizando el dedo. */
  const columpio = new THREE.Group();
  columpio.position.set(4.3, 0, -2.8);
  patio.add(columpio);
  [-1.3, 1.3].forEach((x) => [-0.6, 0.6].forEach((z) => {
    const pata = cilindro(columpio, 0.09, 0.09, 4.5, 0xff9cc4, x, 2.1, z, 0.025);
    pata.rotation.x = z > 0 ? -0.28 : 0.28;
  }));
  const travesano = cilindro(columpio, 0.1, 0.1, 2.9, 0xff9cc4, 0, 4.25, 0, 0.025);
  travesano.rotation.z = Math.PI / 2;
  const hamaca = new THREE.Group();
  hamaca.position.set(0, 4.25, 0);
  columpio.add(hamaca);
  [-0.6, 0.6].forEach((x) => cilindro(hamaca, 0.03, 0.03, 3.2, 0xfff3de, x, -1.6, 0, 0.012));
  mueble(hamaca, 1.5, 0.16, 0.7, 0xf589b8, 0, -3.25, 0, 0.07);
  /* Zona de toque invisible: las cuerdas y las patas son muy finas para acertarles con el dedo. */
  const zonaColumpio = new THREE.Mesh(new THREE.BoxGeometry(3.0, 4.4, 1.8), new THREE.MeshBasicMaterial({ visible: false }));
  zonaColumpio.position.set(0, 2.2, 0);
  columpio.add(zonaColumpio);

  /* Caminito de piedras */
  [[-1.6, 1.6], [-0.4, 2.1], [0.9, 1.7], [2.0, 2.3]].forEach(([x, z]) => disco(patio, 0.42, pintura(0xf3e6ec), x, 0.015, z, true));

  /* ---------- Columnas entre ambientes (siempre visibles) ---------- */

  const divisiones = new THREE.Group();
  escena.add(divisiones);
  for (let i = 1; i < CUARTOS.length; i++) {
    const x = (CUARTOS[i - 1].x + CUARTOS[i].x) / 2;
    mueble(divisiones, 0.8, 8, 1.4, 0xfff6fa, x, 4, -4.6, 0.25);
    const umbral = new THREE.Mesh(new THREE.PlaneGeometry(0.4, 30), pintura(0xf0dde5));
    umbral.rotation.x = -Math.PI / 2;
    umbral.position.set(x, 0.008, 0);
    umbral.receiveShadow = true;
    divisiones.add(umbral);
  }

  return { grupos: [cocina, bano, patio], divisiones, refri, puertaRefri, silla, banera, columpio, hamaca };
}
