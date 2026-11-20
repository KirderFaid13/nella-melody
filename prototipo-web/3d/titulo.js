/* Nella Melody · fase 0 · arranque, título y opciones.
   Va encima de la escena 3D: escena3d.js dibuja a My Melody detrás, y este archivo
   maneja las pantallas de antes de entrar a la casa.

   Recorrido: aviso (dedicatoria la primera vez, consejo de mamá después)
              → logo → título con la ficha → casa.
   Son dos toques hasta la casa: uno en el aviso y otro en la ficha. */
(function () {
  'use strict';

  /* ---------- Datos que el autor puede cambiar ---------- */

  const PERFIL = { nombre: 'Antonella' };

  /* Versión del juego (mayor.menor.parche). Cambiarla junto con versionName en apk/android/app/build.gradle. */
  const VERSION = '1.0.0';

  /* Primera línea de los créditos, arriba de la foto. */
  const DEDICATORIA_CREDITOS = 'Un regalo de tu Nico para ti, mi querida princesa y amorcito de mi vida.';

  /* Se muestra solo la primera vez que se abre el juego. Escribe aquí tus palabras. */
  const DEDICATORIA = {
    titulo: 'Para ti',
    texto: 'Hice este pequeño mundo pensando en ti. Cuida mucho a My Melody, que ella también te va a cuidar.'
  };

  /* Las demás veces, como en la serie, My Melody repite un consejo de su mamá.
     Cambia uno por día. Son textos originales: edítalos o agrega más. */
  const CONSEJOS = [
    'Si no sabes qué hacer, come un pastelito. Si sigues sin saber, por lo menos ya comiste.',
    'Al que madruga… le toca esperar a que abran.',
    'Las cosas que se te olvidan no eran importantes. Menos los cumpleaños: esos sí eran importantes.',
    'Si te caes siete veces, levántate ocho. Y la próxima vez mira por dónde caminas.',
    'No hay mal que dure cien años, pero hay algunos que lo intentan con muchas ganas.',
    'Una sonrisa abre todas las puertas. Las que tienen llave, no.'
  ];

  /* ---------- Utilidades ---------- */

  const $ = (sel) => document.querySelector(sel);

  function leer(clave, porDefecto) {
    try {
      const v = localStorage.getItem(clave);
      return v === null ? porDefecto : JSON.parse(v);
    } catch (err) { return porDefecto; }
  }
  function guardar(clave, valor) {
    try { localStorage.setItem(clave, JSON.stringify(valor)); } catch (err) { /* sin almacenamiento */ }
  }

  function claveDeFecha(d) {
    return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
  }
  /* Días de calendario entre dos fechas 'AAAA-MM-DD'. Redondea para no fallar con el horario de verano. */
  function diasEntre(a, b) {
    return Math.round((new Date(b + 'T00:00:00') - new Date(a + 'T00:00:00')) / 86400000);
  }

  /* Contorno de logo: anillos de sombra alrededor del texto, de adentro hacia afuera. */
  function contorno(el, anillos) {
    const sombras = [];
    anillos.forEach(([grosor, color]) => {
      for (let i = 0; i < 16; i++) {
        const a = (i / 16) * Math.PI * 2;
        sombras.push((Math.cos(a) * grosor).toFixed(3) + 'em ' + (Math.sin(a) * grosor).toFixed(3) + 'em 0 ' + color);
      }
    });
    const ultimo = anillos[anillos.length - 1][0];
    sombras.push('0 ' + (ultimo + 0.06).toFixed(3) + 'em 0 rgba(150, 60, 95, .35)');
    el.style.textShadow = sombras.join(', ');
  }

  /* Parte el texto en letras para que caigan una por una. */
  function enLetras(el) {
    const texto = el.textContent;
    el.textContent = '';
    Array.from(texto).forEach((letra, i) => {
      const s = document.createElement('span');
      s.className = 'letra';
      s.style.setProperty('--i', i);
      s.textContent = letra;
      el.appendChild(s);
    });
  }

  /* ---------- Arranque ---------- */

  let N = null, S = null;
  let etapa = 'aviso';
  let temporizadorLogo = 0;

  function iniciar() {
    if (N) return;
    N = window.NellaFase0;
    S = N.sonido;
    N.modo('titulo', true);

    document.querySelectorAll('.logotipo .l1').forEach((el) => contorno(el, [[0.075, '#e2588f']]));
    document.querySelectorAll('.logotipo .l2').forEach((el) => contorno(el, [[0.05, '#ffffff'], [0.085, '#e2588f']]));
    document.querySelectorAll('#logo-grande .l1, #logo-grande .l2').forEach(enLetras);

    rellenarAviso();
    rellenarFicha();
    $('#creditos-dedicatoria').textContent = DEDICATORIA_CREDITOS;
    $('#creditos-version').textContent = 'Versión ' + VERSION;
    prepararOpciones();

    $('#tarjeta-aviso').classList.add('entra');
    $('#arranque').addEventListener('click', alTocarArranque);
    $('#ficha').addEventListener('click', entrarALaCasa);
    $('#btn-menu').addEventListener('click', volverAlTitulo);
    /* La escena pide decir algo (por ejemplo, "¡Gracias!" al comer). */
    window.addEventListener('nella-globo', (e) => { if (etapa === 'casa') mostrarGlobo(e.detail); });
    window.addEventListener('nella-callar', ocultarGlobo);
  }

  function rellenarAviso() {
    const primeraVez = !leer('nella-dedicatoria-vista', false) || /[?&]primera=1/.test(location.search);
    if (primeraVez) {
      $('#aviso-titulo').textContent = DEDICATORIA.titulo;
      $('#aviso-texto').textContent = DEDICATORIA.texto;
    } else {
      const dia = Math.floor(Date.now() / 86400000);
      $('#aviso-titulo').textContent = 'Mamá dice…';
      $('#aviso-texto').textContent = '«' + CONSEJOS[dia % CONSEJOS.length] + '»';
    }
  }

  function alTocarArranque() {
    if (etapa === 'aviso') {
      etapa = 'logo';
      confirmar();
      guardar('nella-dedicatoria-vista', true);
      $('#tarjeta-aviso').classList.remove('entra');
      setTimeout(() => {
        if (etapa !== 'logo') return;
        $('#logo-grande').classList.add('entra');
        jingle();
        temporizadorLogo = setTimeout(irAlTitulo, 2700);
      }, 450);
    } else if (etapa === 'logo') {
      irAlTitulo();
    }
  }

  function irAlTitulo() {
    if (etapa !== 'logo') return;
    etapa = 'titulo';
    clearTimeout(temporizadorLogo);
    $('#arranque').classList.remove('visible');
    $('#titulo').classList.add('visible');
    iniciarMusica();
  }

  /* ---------- Ficha (como la selección de archivo de los juegos de DS) ---------- */

  function rellenarFicha() {
    const hoy = claveDeFecha(new Date());
    let primera = leer('nella-primera-visita', null);
    if (!primera) { primera = hoy; guardar('nella-primera-visita', hoy); }
    const ultima = leer('nella-ultima-visita', null);
    guardar('nella-ultima-visita', hoy);

    const dias = diasEntre(primera, hoy) + 1;
    const notas = leer('nella-notas', 0);

    $('#ficha-nombre').textContent = PERFIL.nombre;
    $('#ficha-dias').textContent = 'Día ' + dias + ' con My Melody';
    let texto = 'Primera visita';
    if (ultima) {
      const d = diasEntre(ultima, hoy);
      texto = d <= 0 ? 'Última visita: hoy' : d === 1 ? 'Última visita: ayer' : 'Última visita: hace ' + d + ' días';
    }
    $('#ficha-ultima').textContent = texto;
    $('#ficha-notas').textContent = notas + ' / 100';
    $('#ficha-barra').style.width = Math.min(100, notas) + '%';
  }

  function entrarALaCasa() {
    if (etapa !== 'titulo') return;
    etapa = 'casa';
    confirmar();
    detenerMusica();
    $('#titulo').classList.remove('visible');
    N.modo('casa');
    setTimeout(() => {
      if (etapa !== 'casa') return;
      N.saludar();
      mostrarGlobo(saludoSegunHora());
    }, 1100);
  }

  function volverAlTitulo() {
    if (etapa !== 'casa') return;
    etapa = 'titulo';
    confirmar();
    ocultarGlobo();
    rellenarFicha();
    N.modo('titulo');
    $('#titulo').classList.add('visible');
    iniciarMusica();
  }

  function saludoSegunHora() {
    const h = new Date().getHours();
    if (h >= 5 && h < 12) return '¡Buenos días, ' + PERFIL.nombre + '!';
    if (h >= 12 && h < 19) return '¡Buenas tardes, ' + PERFIL.nombre + '!';
    return '¡Buenas noches, ' + PERFIL.nombre + '!';
  }

  /* ---------- Globo de diálogo ---------- */

  let globoHasta = 0;
  function mostrarGlobo(texto) {
    const globo = $('#globo');
    globo.textContent = texto;
    globo.classList.add('visible');
    /* Date.now y no performance.now: la prueba del mono loco adelanta performance.now. */
    globoHasta = Date.now() + 2800;
    requestAnimationFrame(seguirGlobo);
  }
  function seguirGlobo() {
    const globo = $('#globo');
    if (Date.now() > globoHasta || etapa !== 'casa') { ocultarGlobo(); return; }
    const p = N.cabezaEnPantalla();
    ubicarGlobo(globo, p.x, p.y);
    requestAnimationFrame(seguirGlobo);
  }
  /* El globo va sobre su cabeza, pero sin salirse del marco ni tapar los botones de arriba
     (Encargos a la izquierda, Opciones y Menú a la derecha): si choca, se corre de costado
     y la colita sigue apuntando a ella. */
  function ubicarGlobo(globo, x, y) {
    const marco = $('#marco').getBoundingClientRect();
    const ancho = globo.offsetWidth, alto = globo.offsetHeight, margen = marco.width * 0.012;
    const arriba = y - alto;
    const caja = (sel) => {
      const el = $(sel);
      if (!el) return null;
      const r = el.getBoundingClientRect();
      return { izq: r.left - marco.left, der: r.right - marco.left, aba: r.bottom - marco.top };
    };
    let minimo = margen, maximo = marco.width - margen;
    const encargos = caja('#btn-encargos'), esquina = caja('.esquina');
    if (encargos && arriba < encargos.aba + margen) minimo = Math.max(minimo, encargos.der + margen);
    if (esquina && arriba < esquina.aba + margen) maximo = Math.min(maximo, esquina.izq - margen);
    let izquierda = x - ancho / 2;
    izquierda = Math.max(minimo, Math.min(maximo - ancho, izquierda));
    globo.style.left = (izquierda + ancho / 2) + 'px';
    globo.style.top = y + 'px';
    const cola = Math.max(marco.width * 0.02, Math.min(ancho - marco.width * 0.02, x - izquierda));
    globo.style.setProperty('--cola', cola + 'px');
  }
  function ocultarGlobo() { $('#globo').classList.remove('visible'); globoHasta = 0; }

  /* ---------- Opciones y créditos ---------- */

  function prepararOpciones() {
    $('#btn-opciones').addEventListener('click', () => { confirmar(); $('#opciones').classList.add('visible'); });
    $('#btn-opciones-casa').addEventListener('click', () => { confirmar(); $('#opciones').classList.add('visible'); });
    $('#btn-mono').addEventListener('click', correrMonoLoco);
    $('#btn-cerrar-resultado').addEventListener('click', () => { cancelar(); $('#resultado').classList.remove('visible'); });
    $('#btn-listo').addEventListener('click', () => { confirmar(); $('#opciones').classList.remove('visible'); });
    $('#btn-creditos').addEventListener('click', () => { confirmar(); $('#creditos').classList.add('visible'); });
    $('#btn-cerrar-creditos').addEventListener('click', () => { cancelar(); $('#creditos').classList.remove('visible'); });
    $('#btn-diag-opciones').addEventListener('click', () => { confirmar(); $('#btn-diag').click(); });

    /* Los botones de prueba no son para Antonella: se ven con ?pruebas en la dirección
       o tocando 7 veces seguidas el título "Opciones". */
    if (/[?&]pruebas/.test(location.search)) $('#opciones').classList.add('con-pruebas');
    let toquesTitulo = 0, ultimoToqueTitulo = 0;
    $('#opciones h2').addEventListener('click', () => {
      const ahora = Date.now();
      toquesTitulo = ahora - ultimoToqueTitulo < 600 ? toquesTitulo + 1 : 1;
      ultimoToqueTitulo = ahora;
      if (toquesTitulo >= 7) { toquesTitulo = 0; $('#opciones').classList.toggle('con-pruebas'); confirmar(); }
    });

    /* Tocar fuera del panel lo cierra. */
    document.querySelectorAll('.modal').forEach((m) => {
      if (m.dataset.propio) return;   /* encargos y deseos se cierran con su propia lógica */
      m.addEventListener('click', (e) => {
        if (e.target !== m) return;
        cancelar();
        m.classList.remove('visible');
      });
    });

    prepararDeslizador('#vol-musica', 'musica');
    prepararDeslizador('#vol-efectos', 'efectos');
  }

  /* Prueba del mono loco: corre unos minutos simulados en pocos segundos y muestra el resultado. */
  function correrMonoLoco() {
    confirmar();
    const texto = $('#resultado-texto');
    $('#opciones').classList.remove('visible');
    $('#resultado').classList.add('visible');
    if (etapa !== 'casa') { texto.textContent = 'Entra a la casa antes de correr la prueba.'; return; }
    if (!window.NellaPruebas) { texto.textContent = 'No se cargó pruebas.js.'; return; }
    texto.textContent = 'Corriendo 5 minutos simulados… (unos segundos)';
    setTimeout(() => {
      const informe = window.NellaPruebas.monoLoco(300, Math.floor(Math.random() * 100000));
      texto.textContent = informe.texto;
    }, 80);
  }

  function prepararDeslizador(selector, nombre) {
    const el = $(selector);
    const pintar = () => el.style.setProperty('--lleno', el.value + '%');
    el.value = Math.round(S.volumen(nombre) * 100);
    pintar();
    let ultimoTic = 0;
    el.addEventListener('input', () => {
      S.volumen(nombre, el.value / 100);
      pintar();
      const ahora = performance.now();
      if (ahora - ultimoTic > 70) { ultimoTic = ahora; mover(); }
    });
  }

  /* ---------- Sonidos de interfaz ----------
     Uno para moverse, uno para confirmar y uno para cancelar, como en las consolas. */

  const mover = () => S.efecto(2093, 0, 0.045);
  const confirmar = () => { S.efecto(1318.5, 0, 0.12); S.efecto(1975.5, 0.07, 0.11); };
  const cancelar = () => { S.efecto(1318.5, 0, 0.1); S.efecto(987.77, 0.07, 0.1); };

  function jingle() {
    [1046.5, 1318.5, 1568, 2093].forEach((f, i) => S.efecto(f, 0.12 * i, 0.13));
    [1046.5, 1318.5, 1568].forEach((f) => S.efecto(f, 0.62, 0.07));
  }

  /* ---------- Música del título ----------
     «Estrellita, ¿dónde estás?», canción popular de dominio público, en cajita musical.
     Las notas se programan con un poco de anticipación sobre el reloj de audio,
     así el ritmo no depende de que la pantalla vaya fluida. */

  const DO = 523.25, RE = 587.33, MI = 659.25, FA = 698.46, SOL = 783.99, LA = 880.0;
  /* Cada frase son 8 pulsos. null: la nota anterior se sostiene. */
  const FRASES = {
    A: [DO, DO, SOL, SOL, LA, LA, SOL, null],
    B: [FA, FA, MI, MI, RE, RE, DO, null],
    C: [SOL, SOL, FA, FA, MI, MI, RE, null]
  };
  /* Bajo, una nota cada 2 pulsos, dos octavas abajo. */
  const BAJOS = { A: [DO, DO, FA, DO], B: [FA, DO, SOL, DO], C: [DO, SOL, DO, SOL] };
  const ORDEN = ['A', 'B', 'C', 'C', 'A', 'B'];
  const PULSO = 60 / 100;
  const PULSOS_POR_VUELTA = ORDEN.length * 8;

  const EVENTOS = [];
  ORDEN.forEach((frase, i) => {
    FRASES[frase].forEach((f, j) => {
      if (f) EVENTOS.push({ pulso: i * 8 + j, f, fuerza: 0.13, largo: j === 6 ? 1.8 : 1.1 });
    });
    BAJOS[frase].forEach((f, j) => EVENTOS.push({ pulso: i * 8 + j * 2, f: f / 4, fuerza: 0.08, largo: 1.4 }));
  });
  EVENTOS.sort((a, b) => a.pulso - b.pulso);

  let musicaSonando = false, temporizadorMusica = 0, inicioVuelta = 0, siguiente = 0;

  function iniciarMusica() {
    if (musicaSonando) return;
    musicaSonando = true;
    inicioVuelta = 0;
    siguiente = 0;
    programarMusica();
  }

  function detenerMusica() {
    /* Las notas ya programadas se apagan solas, así que el corte es suave. */
    musicaSonando = false;
    clearTimeout(temporizadorMusica);
  }

  function programarMusica() {
    if (!musicaSonando) return;
    if (S.listo()) {
      const ahora = S.ahora();
      if (!inicioVuelta) inicioVuelta = ahora + 0.15;
      for (;;) {
        const ev = EVENTOS[siguiente];
        const cuando = inicioVuelta + ev.pulso * PULSO;
        if (cuando > ahora + 0.3) break;
        if (cuando >= ahora - 0.05) S.nota(ev.f, cuando, ev.fuerza, ev.largo);
        siguiente++;
        if (siguiente >= EVENTOS.length) { siguiente = 0; inicioVuelta += PULSOS_POR_VUELTA * PULSO; }
      }
    }
    temporizadorMusica = setTimeout(programarMusica, 100);
  }

  /* ---------- Esperar a la escena ---------- */

  if (window.NellaFase0 && window.NellaFase0.modo) iniciar();
  else window.addEventListener('nella-lista', iniciar);
})();
