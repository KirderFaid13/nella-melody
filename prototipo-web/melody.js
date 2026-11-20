/* Nella Melody · fase 0
   Generador de My Melody por piezas. Es la única fuente del dibujo:
   la hoja de modelo y la escena animada lo usan sin copiar coordenadas.

   Todas las formas se escriben en la caja de 600 x 900 del personaje.
   Cada pieza se mueve alrededor de su pivote: quien anima solo pone
   rotate(), scale() o translate() sobre el grupo [data-pieza]. */
(function (global) {
  'use strict';

  var ESTILO = {
    contorno: '#5c3d42',
    grosor: 9,
    grosorFino: 6,
    capucha: '#f9a8c4',
    blanco: '#fffdfa',
    nariz: '#ffd84f',
    ojos: '#3b2a2d',
    rubor: '#ffbfd2',
    boca: '#ea6a86',
    flor: '#fffdfa',
    florCentro: '#ffd84f'
  };

  var CAJA = { ancho: 600, alto: 900 };

  /* Pivotes en coordenadas de la caja. El orden es de padre a hijo. */
  var PIVOTES = {
    'raiz': [300, 870],
    'tronco': [300, 850],
    'brazo-izq': [230, 678],
    'brazo-der': [370, 678],
    'cabeza': [300, 640],
    'oreja-izq': [226, 352],
    'oreja-der': [374, 352],
    'rasgos': [300, 500],
    'ojo-izq': [232, 492],
    'ojo-der': [368, 492]
  };

  var EXPRESIONES = ['neutral', 'feliz', 'sorpresa', 'sueno'];

  var E = ESTILO;

  function trazo(grosor) {
    return ' stroke="' + E.contorno + '" stroke-width="' + (grosor || E.grosor) +
      '" stroke-linejoin="round" stroke-linecap="round"';
  }

  function elipse(cx, cy, rx, ry, relleno, grosor) {
    return '<ellipse cx="' + cx + '" cy="' + cy + '" rx="' + rx + '" ry="' + ry +
      '" fill="' + relleno + '"' + trazo(grosor) + '/>';
  }

  function mancha(cx, cy, rx, ry, relleno) {
    return '<ellipse cx="' + cx + '" cy="' + cy + '" rx="' + rx + '" ry="' + ry +
      '" fill="' + relleno + '"/>';
  }

  function camino(d, relleno, grosor) {
    return '<path d="' + d + '" fill="' + (relleno || 'none') + '"' + trazo(grosor) + '/>';
  }

  /* Envuelve formas escritas en coordenadas de la caja para que el grupo
     [data-pieza] tenga su origen en el pivote. */
  function pieza(nombre, contenido, giroFijo) {
    var p = PIVOTES[nombre];
    return '<g transform="translate(' + p[0] + ' ' + p[1] + ')' +
      (giroFijo ? ' rotate(' + giroFijo + ')' : '') + '">' +
      '<g data-pieza="' + nombre + '">' +
      '<g transform="translate(' + (-p[0]) + ' ' + (-p[1]) + ')">' + contenido + '</g></g></g>';
  }

  function flor(cx, cy) {
    var s = '';
    for (var k = 0; k < 5; k++) {
      var a = (-90 + k * 72) * Math.PI / 180;
      s += '<circle cx="' + (cx + 25 * Math.cos(a)).toFixed(1) + '" cy="' +
        (cy + 25 * Math.sin(a)).toFixed(1) + '" r="21" fill="' + E.flor + '"' +
        trazo(E.grosorFino) + '/>';
    }
    /* Tapa las líneas donde los pétalos se cruzan por dentro. */
    s += '<circle cx="' + cx + '" cy="' + cy + '" r="25" fill="' + E.flor + '"/>';
    s += '<circle cx="' + cx + '" cy="' + cy + '" r="13" fill="' + E.florCentro + '"' +
      trazo(E.grosorFino) + '/>';
    return s;
  }

  function rasgosDe(expresion) {
    var nariz = elipse(300, 516, 17, 12, E.nariz, E.grosorFino);

    if (expresion === 'feliz') {
      return mancha(196, 530, 24, 14, E.rubor) + mancha(404, 530, 24, 14, E.rubor) +
        camino('M218,498 Q232,476 246,498', 'none', 7) +
        camino('M354,498 Q368,476 382,498', 'none', 7) +
        nariz + camino('M284,540 Q300,572 316,540 Z', E.boca, E.grosorFino);
    }
    if (expresion === 'sorpresa') {
      return mancha(232, 490, 15, 22, E.ojos) + mancha(368, 490, 15, 22, E.ojos) +
        mancha(237, 482, 5, 6, '#ffffff') + mancha(373, 482, 5, 6, '#ffffff') +
        nariz + elipse(300, 549, 8, 10, E.boca, E.grosorFino);
    }
    if (expresion === 'sueno') {
      return camino('M218,490 Q232,504 246,490', 'none', 7) +
        camino('M354,490 Q368,504 382,490', 'none', 7) +
        nariz + camino('M292,540 Q300,547 308,540', 'none', E.grosorFino);
    }
    return pieza('ojo-izq', mancha(232, 492, 13, 19, E.ojos)) +
      pieza('ojo-der', mancha(368, 492, 13, 19, E.ojos)) +
      nariz + camino('M287,540 Q300,553 313,540', 'none', E.grosorFino);
  }

  /* opciones.expresion: cuál se ve.
     opciones.todas: incluye las cuatro, ocultas salvo la activa, para alternarlas al animar. */
  function construir(opciones) {
    opciones = opciones || {};
    var activa = opciones.expresion || 'neutral';
    var rasgos = '';

    if (opciones.todas) {
      EXPRESIONES.forEach(function (nombre) {
        rasgos += '<g data-expresion="' + nombre + '"' +
          (nombre === activa ? '' : ' display="none"') + '>' + rasgosDe(nombre) + '</g>';
      });
    } else {
      rasgos = '<g data-expresion="' + activa + '">' + rasgosDe(activa) + '</g>';
    }

    var tronco =
      elipse(300, 738, 106, 112, E.blanco) +
      elipse(250, 844, 56, 29, E.blanco) +
      elipse(350, 844, 56, 29, E.blanco) +
      pieza('brazo-izq', elipse(230, 716, 27, 45, E.blanco), 30) +
      pieza('brazo-der', elipse(370, 716, 27, 45, E.blanco), -30);

    var cabeza =
      pieza('oreja-izq', elipse(226, 206, 60, 152, E.capucha), -8) +
      pieza('oreja-der', elipse(374, 206, 60, 152, E.capucha), 8) +
      elipse(300, 470, 218, 182, E.capucha) +
      camino('M150,490 C150,405 230,378 300,378 C370,378 450,405 450,490 ' +
        'C450,560 385,600 300,600 C215,600 150,560 150,490 Z', E.blanco) +
      flor(424, 338) +
      pieza('rasgos', rasgos);

    return pieza('raiz', pieza('tronco', tronco) + pieza('cabeza', cabeza));
  }

  global.NellaMelody = {
    ESTILO: ESTILO,
    CAJA: CAJA,
    PIVOTES: PIVOTES,
    EXPRESIONES: EXPRESIONES,
    construir: construir
  };
})(window);
