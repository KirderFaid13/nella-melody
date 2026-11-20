/* Nella Melody · fase 0 · prueba del "mono loco".
   Hace miles de toques, arrastres, levantadas y cambios de ambiente al azar,
   con el reloj simulado, y revisa en cada paso que My Melody:
   - nunca tenga una posición inválida,
   - nunca salga del piso permitido de su ambiente cuando está libre,
   - nunca quede trabada en un estado más tiempo del permitido,
   - termine siempre libre cuando nadie la toca.
   Usa los mismos eventos que un dedo real. Se corre desde Opciones o con
   NellaPruebas.monoLoco(segundos, semilla) en la consola. */
(function () {
  'use strict';

  /* Números al azar repetibles: con la misma semilla, la misma partida. */
  function azarConSemilla(semilla) {
    let a = semilla >>> 0;
    return function () {
      a = (a + 0x6D2B79F5) >>> 0;
      let x = Math.imul(a ^ (a >>> 15), 1 | a);
      x = (x + Math.imul(x ^ (x >>> 7), 61 | x)) ^ x;
      return ((x ^ (x >>> 14)) >>> 0) / 4294967296;
    };
  }

  function monoLoco(segundos, semilla) {
    segundos = segundos || 300;
    semilla = semilla === undefined ? 1 : semilla;
    const N = window.NellaFase0;
    if (!N || !N.interno) return { ok: false, texto: 'La escena todavía no está lista.' };
    if (N.modo() !== 'casa') return { ok: false, texto: 'Entra a la casa antes de correr la prueba.' };

    const marco = document.getElementById('marco');
    const lienzo = document.getElementById('lienzo');
    const azar = azarConSemilla(semilla);
    const PASO = 1 / 60;
    const relojReal = performance.now;
    let reloj = relojReal.call(performance);
    let simulado = 0, acciones = 0;
    const fallas = [], vecesPorEstado = {}, maxPorEstado = {}, conteo = {};
    const inicioReal = relojReal.call(performance);

    function anotarFalla(texto) {
      if (fallas.length < 15) fallas.push('t=' + simulado.toFixed(2) + ' s: ' + texto);
      else if (fallas.length === 15) fallas.push('… y más');
    }

    function revisar() {
      const s = N.interno();
      vecesPorEstado[s.estado] = (vecesPorEstado[s.estado] || 0) + 1;
      const enEstado = s.t - s.estadoDesde;
      maxPorEstado[s.estado] = Math.max(maxPorEstado[s.estado] || 0, enEstado);
      if (![s.x, s.y, s.z].every(Number.isFinite)) anotarFalla('posición inválida');
      if (!s.resortesOk) anotarFalla('un resorte quedó con un valor inválido');
      /* En el columpio, al dar la vuelta completa, sube hasta unos 7,3 m: es parte del chiste. */
      const techo = s.estado === 'columpio' ? 7.5 : 6;
      if (s.y < -0.01 || s.y > techo) anotarFalla('altura fuera de rango (' + s.y.toFixed(2) + ' en "' + s.estado + '")');
      if (s.estado === 'libre') {
        const dx = s.x - s.centro;
        if (Math.abs(dx) > s.limite.x + 0.05) anotarFalla('fuera del piso en x (' + dx.toFixed(2) + ') en el ambiente ' + s.cuarto);
        if (s.z < s.limite.zMin - 0.05 || s.z > s.limite.zMax + 0.05) anotarFalla('fuera del piso en z (' + s.z.toFixed(2) + ')');
      }
      if (s.estado !== 'libre' && enEstado > (s.maxEstado[s.estado] || 5) + 0.2) {
        anotarFalla('trabada en "' + s.estado + '" por ' + enEstado.toFixed(1) + ' s');
      }
      if (!s.sentadaOk) anotarFalla('"sentada" o en la bañera pero fuera de su lugar');
      if (!(s.espuma >= 0 && s.espuma <= 40)) anotarFalla('espuma fuera de rango (' + s.espuma + ')');
      if (!(s.suciedad >= 0 && s.suciedad <= 1)) anotarFalla('suciedad fuera de rango (' + s.suciedad + ')');
      if (s.estado === 'banera' && s.cuarto !== 2) anotarFalla('en la bañera fuera del baño');
      if (!s.columpioOk) anotarFalla('en el columpio pero fuera de la hamaca');
      if (s.estado === 'columpio' && s.cuarto !== 3) anotarFalla('en el columpio fuera del patio');
      if (!(Number.isFinite(s.columpio.angulo) && Math.abs(s.columpio.angulo) < Math.PI * 2 + 0.5)) anotarFalla('ángulo del columpio inválido (' + s.columpio.angulo + ')');
      if (!(Number.isFinite(s.columpio.vel) && Math.abs(s.columpio.vel) < 15)) anotarFalla('velocidad del columpio inválida (' + s.columpio.vel + ')');
      if (!(Number.isInteger(s.patio.etapa) && s.patio.etapa >= 0 && s.patio.etapa <= 4)) anotarFalla('etapa de las flores inválida (' + s.patio.etapa + ')');
      if (!['oculta', 'subiendo', 'espiando', 'bajando', 'asustada'].includes(s.patio.kuromi)) anotarFalla('Kuromi en un estado raro (' + s.patio.kuromi + ')');
      if (s.patio.kuromi !== 'oculta' && (s.cuarto !== 3 || s.modo !== 'casa')) anotarFalla('Kuromi asomada fuera del patio');
      if (marco.classList.contains('en-patio') !== (s.cuarto === 3 && s.modo === 'casa')) anotarFalla('el botón de regar no coincide con el ambiente');
      const en = s.encargos;
      if (!Number.isInteger(en.notas) || en.notas < 0) anotarFalla('Notas Rosas inválidas (' + en.notas + ')');
      if (en.notas < notasVistas) anotarFalla('las Notas Rosas bajaron (' + notasVistas + ' → ' + en.notas + ')');
      const firma = en.dia + ':' + en.lista.map((e) => e.id).join(',');
      if (firma !== firmaLista) { firmaLista = firma; notasDeLaLista = en.notas; }
      else if (en.notas - notasDeLaLista > 3) anotarFalla('más de 3 Notas con la misma lista de encargos');
      notasVistas = en.notas;
      if (en.lista.length !== 3 || new Set(en.lista.map((e) => e.id)).size !== 3) anotarFalla('lista de encargos inválida');
      en.lista.forEach((e) => {
        if (!(e.progreso >= 0 && e.progreso <= e.meta)) anotarFalla('progreso inválido en ' + e.id + ' (' + e.progreso + '/' + e.meta + ')');
        if (e.hecho !== (e.progreso >= e.meta)) anotarFalla('encargo ' + e.id + ' marcado mal');
      });
      if (N.encargos.deseoAbierto()) anotarFalla('se abrió un deseo durante la prueba');
      if (s.final) anotarFalla('empezó el final de la Nota 100 durante la prueba');
      if (!['vacio', 'fresco', 'mustio', 'seco'].includes(s.patio.ramo)) anotarFalla('florero en un estado raro (' + s.patio.ramo + ')');
      if (s.patio.secas && s.patio.regadoHoy) anotarFalla('flores secas aunque se regaron hoy');
      const paginaRefri = N.cocina.pagina();
      if (!(paginaRefri === 0 || paginaRefri === 1)) anotarFalla('página del refri inválida (' + paginaRefri + ')');
      if (marco.classList.contains('en-banera') !== (s.estado === 'banera' && s.modo === 'casa')) {
        anotarFalla('el kit del baño no coincide con el estado (' + s.estado + ')');
      }
      if (!(s.hambre >= 0 && s.hambre <= 1)) anotarFalla('hambre fuera de rango (' + s.hambre + ')');
      for (const id in s.inventario) {
        const n = s.inventario[id];
        if (!Number.isInteger(n) || n < 0) anotarFalla('inventario inválido: ' + id + ' = ' + n);
      }
      if (s.refriAbierto && s.cuarto !== 1) anotarFalla('el refri quedó abierto fuera de la cocina');
      if (!Number.isInteger(s.corazones) || s.corazones < 0) anotarFalla('corazones inválidos (' + s.corazones + ')');
      for (const origen in s.ganadosHoy) {
        if (s.ganadosHoy[origen] > s.topes[origen]) anotarFalla('se pasó el tope diario de ' + origen + ' (' + s.ganadosHoy[origen] + ')');
      }
    }

    function pasa(seg) {
      const pasos = Math.max(1, Math.round(seg / PASO));
      for (let i = 0; i < pasos; i++) {
        reloj += PASO * 1000;
        N.avanzar(PASO, true);
        simulado += PASO;
        revisar();
      }
    }

    function evento(tipo, x, y, id) {
      id = id || 1;
      marco.dispatchEvent(new PointerEvent(tipo, {
        clientX: x, clientY: y, bubbles: true, cancelable: true,
        pointerType: 'touch', pointerId: id, isPrimary: id === 1, pressure: tipo === 'pointerup' ? 0 : 0.5
      }));
    }
    function puntoAlAzar() {
      const c = lienzo.getBoundingClientRect();
      return [c.left + azar() * c.width, c.top + azar() * c.height];
    }
    function sobreElla() {
      const p = N.puntoDeElla();
      return [p.x + (azar() - 0.5) * 30, p.y + (azar() - 0.5) * 40];
    }
    function enElemento(el, tipo, x, y, id) {
      el.dispatchEvent(new PointerEvent(tipo, {
        clientX: x, clientY: y, bubbles: true, cancelable: true,
        pointerType: 'touch', pointerId: id, isPrimary: false, pressure: tipo === 'pointerup' ? 0 : 0.5
      }));
    }
    function irALaCocina() {
      if (N.interno().cuarto === 1) return;
      document.querySelector('#ambientes .amb[data-cuarto="1"]').click();
      pasa(1.6);
    }
    function tocarRefri() {
      const p = N.puntoDeObjeto('refri');
      evento('pointerdown', p.x, p.y); pasa(0.08); evento('pointerup', p.x, p.y);
    }
    let bocados = 0, compras = 0, banos = 0, vueltas = 0, riegos = 0, kuromis = 0, encargosHechos = 0, deseos = 0;
    let notasVistas = 0, firmaLista = '', notasDeLaLista = 0;
    let notasGuardadas = null;
    try { notasGuardadas = localStorage.getItem('nella-notas') + '|' + localStorage.getItem('nella-encargos'); } catch (err) { notasGuardadas = null; }
    function irAlPatio() {
      if (N.interno().cuarto === 3) return;
      document.querySelector('#ambientes .amb[data-cuarto="3"]').click();
      pasa(1.6);
    }
    function subirAlColumpio() {
      irAlPatio();
      if (N.interno().estado === 'columpio') return;
      let [x, y] = sobreElla();
      evento('pointerdown', x, y);
      pasa(0.6);
      const c = N.puntoDeObjeto('columpio');
      const x0 = x, y0 = y;
      for (let i = 1; i <= 12; i++) {
        x = x0 + (c.x - x0) * i / 12; y = y0 + (c.y - y0) * i / 12;
        pasa(PASO); evento('pointermove', x, y);
      }
      evento('pointerup', x, y);
      pasa(0.8);
    }
    /* Un deslizamiento rápido del dedo en cualquier parte. */
    function deslizar() {
      const c = lienzo.getBoundingClientRect();
      const x = c.left + c.width * (0.2 + azar() * 0.6), y = c.top + c.height * (0.3 + azar() * 0.5);
      const dx = (azar() - 0.5) * 0.1 * c.width, dy = (azar() < 0.5 ? -1 : 1) * 0.05 * c.width;
      evento('pointerdown', x, y);
      for (let i = 1; i <= 4; i++) { pasa(PASO); evento('pointermove', x + dx * i, y + dy * i); }
      evento('pointerup', x + dx * 4, y + dy * 4);
    }
    function regar(segundos) {
      irAlPatio();
      const boton = document.getElementById('btn-regar');
      const b = boton.getBoundingClientRect();
      let x = b.left + b.width / 2, y = b.top + b.height / 2;
      enElemento(boton, 'pointerdown', x, y, 5);
      const c = N.puntoDeObjeto('cantero');
      for (let i = 1; i <= 10; i++) { x += (c.x - x) * 0.4; y += (c.y - y) * 0.4; pasa(PASO); enElemento(boton, 'pointermove', x, y, 5); }
      const pasos = Math.round(segundos / PASO);
      for (let i = 0; i < pasos; i++) { pasa(PASO); enElemento(boton, 'pointermove', c.x + Math.sin(i / 5) * 20, c.y, 5); }
      enElemento(boton, azar() < 0.1 ? 'pointercancel' : 'pointerup', x, y, 5);
    }
    function irAlBano() {
      if (N.interno().cuarto === 2) return;
      document.querySelector('#ambientes .amb[data-cuarto="2"]').click();
      pasa(1.6);
    }
    function enjabonar(frotadas, lejos) {
      const jabon = document.getElementById('btn-jabon');
      const c = jabon.getBoundingClientRect();
      let x = c.left + c.width / 2, y = c.top + c.height / 2;
      enElemento(jabon, 'pointerdown', x, y, 4);
      const cabeza = N.puntoDeObjeto('cabeza');
      for (let i = 1; i <= 8; i++) {
        x += ((lejos ? 200 : cabeza.x) - x) * 0.4; y += ((lejos ? 200 : cabeza.y) - y) * 0.4;
        pasa(PASO); enElemento(jabon, 'pointermove', x, y, 4);
      }
      for (let i = 0; i < frotadas; i++) {
        x = cabeza.x + (azar() - 0.5) * 120; y = cabeza.y + (azar() - 0.5) * 60;
        pasa(PASO); enElemento(jabon, 'pointermove', x, y, 4);
      }
      enElemento(jabon, azar() < 0.1 ? 'pointercancel' : 'pointerup', x, y, 4);
    }
    function meterEnLaBanera() {
      irAlBano();
      if (N.interno().estado === 'banera') return;
      let [x, y] = sobreElla();
      evento('pointerdown', x, y);
      pasa(0.6);
      const banera = N.puntoDeObjeto('banera');
      const x0 = x, y0 = y;
      for (let i = 1; i <= 12; i++) {
        x = x0 + (banera.x - x0) * i / 12; y = y0 + (banera.y - y0) * i / 12;
        pasa(PASO); evento('pointermove', x, y);
      }
      evento('pointerup', x, y);
      pasa(0.8);
    }
    function botonDeAmbiente() {
      const b = document.querySelectorAll('#ambientes .amb');
      return b[Math.floor(azar() * b.length)];
    }

    const ACCIONES = [
      ['toque', 3, () => {
        const [x, y] = azar() < 0.6 ? sobreElla() : puntoAlAzar();
        evento('pointerdown', x, y); pasa(0.08); evento('pointerup', x, y);
      }],
      ['caricia', 2, () => {
        let [x, y] = sobreElla();
        evento('pointerdown', x, y);
        for (let i = 0; i < 30; i++) { x += (azar() - 0.5) * 16; y += (azar() - 0.5) * 8; pasa(PASO); evento('pointermove', x, y); }
        evento('pointerup', x, y);
      }],
      ['manotazo', 2, () => {
        const [x0, y] = sobreElla(), d = azar() < 0.5 ? -1 : 1;
        evento('pointerdown', x0 - d * 150, y);
        for (let i = 1; i <= 4; i++) { pasa(PASO); evento('pointermove', x0 - d * 150 + d * 75 * i, y); }
        evento('pointerup', x0 + d * 150, y);
      }],
      ['levantar y soltar', 3, () => {
        let [x, y] = sobreElla();
        evento('pointerdown', x, y);
        pasa(0.6);
        const movidas = 10 + Math.floor(azar() * 40);
        for (let i = 0; i < movidas; i++) { x += (azar() - 0.5) * 90; y += (azar() - 0.5) * 70; pasa(PASO); evento('pointermove', x, y); }
        if (azar() < 0.15) { evento('pointerdown', x + 50, y, 2); evento('pointerup', x + 50, y, 2); }   /* otro dedo */
        if (azar() < 0.1) evento('pointercancel', x, y); else evento('pointerup', x, y);
      }],
      ['levantar sin mover', 1, () => {
        const [x, y] = sobreElla();
        evento('pointerdown', x, y); pasa(0.8); evento('pointerup', x, y);
      }],
      ['cambiar de ambiente', 2, () => botonDeAmbiente().click()],
      ['flecha', 1, () => document.getElementById(azar() < 0.5 ? 'amb-anterior' : 'amb-siguiente').click()],
      ['cambiar de ambiente con ella en brazos', 1, () => {
        const [x, y] = sobreElla();
        evento('pointerdown', x, y); pasa(0.6);
        botonDeAmbiente().click();
        evento('pointermove', x + 40, y - 40); pasa(0.2); evento('pointerup', x + 40, y - 40);
      }],
      ['llevarla a la silla', 2, () => {
        irALaCocina();
        let [x, y] = sobreElla();
        evento('pointerdown', x, y);
        pasa(0.6);
        const silla = N.puntoDeObjeto('silla');
        const x0 = x, y0 = y;
        for (let i = 1; i <= 12; i++) {
          x = x0 + (silla.x - x0) * i / 12; y = y0 + (silla.y - y0) * i / 12;
          pasa(PASO); evento('pointermove', x, y);
        }
        evento('pointerup', x, y);
      }],
      ['llevarla a la bañera', 2, meterEnLaBanera],
      ['enjabonarla', 2.5, () => {
        if (azar() < 0.7) meterEnLaBanera();
        enjabonar(Math.floor(azar() * 40), azar() < 0.2);
      }],
      /* De punta a punta: sucia → bañera → jabón → regadera. Tiene que quedar limpia y salir sola. */
      ['baño completo', 1, () => {
        document.getElementById('btn-olvido').click();
        document.getElementById('btn-olvido').click();
        pasa(2);   /* que termine lo que estaba haciendo (comer, caer, cambiar de ambiente) */
        meterEnLaBanera();
        const s0 = N.interno();
        if (s0.cuarto !== 2) return;   /* no pudo ir al baño en este momento: no es una falla */
        if (s0.estado !== 'banera') { anotarFalla('no entró a la bañera al soltarla encima (quedó en "' + s0.estado + '")'); return; }
        enjabonar(160, false);
        document.getElementById('btn-regadera').click();
        pasa(2.0);
        const s1 = N.interno();
        if (s1.suciedad !== 0) anotarFalla('el baño completo no la dejó limpia (suciedad ' + s1.suciedad + ')');
        else banos++;
        pasa(2.5);
        const s2 = N.interno();
        if (s2.estado !== 'libre') anotarFalla('no salió sola de la bañera después del baño (está en "' + s2.estado + '")');
      }],
      ['regadera', 1.5, () => {
        const antes = N.interno();
        document.getElementById('btn-regadera').click();
        pasa(2.5);
        const despues = N.interno();
        if (antes.estado === 'banera' && antes.suciedad > 0 && despues.suciedad === 0) banos++;
      }],
      ['salir de la bañera', 0.7, () => document.getElementById('btn-salir-banera').click()],
      ['pasar dos días (se ensucia)', 0.4, () => {
        document.getElementById('btn-olvido').click();
        document.getElementById('btn-olvido').click();
      }],
      ['llevarla al columpio', 2, subirAlColumpio],
      ['empujar el columpio', 2.5, () => {
        const veces = 1 + Math.floor(azar() * 6);
        for (let i = 0; i < veces; i++) { deslizar(); pasa(0.15 + azar() * 0.6); }
      }],
      ['tocar el columpio', 1, () => {
        irAlPatio();
        const c = N.puntoDeObjeto('columpio');
        evento('pointerdown', c.x, c.y); pasa(0.08); evento('pointerup', c.x, c.y);
      }],
      /* De punta a punta: al columpio, empujar hasta la vuelta completa y que baje mareada. */
      ['columpio completo', 0.8, () => {
        pasa(2);
        subirAlColumpio();
        const s0 = N.interno();
        if (s0.cuarto !== 3) return;
        if (s0.estado !== 'columpio') { anotarFalla('no se subió al columpio al soltarla encima (quedó en "' + s0.estado + '")'); return; }
        const antes = s0.columpio.vueltas;
        for (let i = 0; i < 30 && N.interno().columpio.vueltas === antes && N.interno().estado === 'columpio'; i++) { deslizar(); pasa(0.45); }
        if (N.interno().columpio.vueltas === antes) { anotarFalla('30 empujones y no dio la vuelta completa'); return; }
        vueltas++;
        let mareada = false;
        for (let i = 0; i < 8 / 0.25; i++) { pasa(0.25); if (N.interno().mareada) mareada = true; }
        const s1 = N.interno();
        if (s1.estado === 'columpio') anotarFalla('después de la vuelta completa no se bajó del columpio');
        if (!mareada) anotarFalla('después de la vuelta completa no quedó mareada');
      }],
      ['regar las flores', 1.5, () => {
        const antes = N.interno().patio;
        regar(azar() < 0.8 ? 1.6 : 0.4);
        const despues = N.interno().patio;
        if (despues.etapa < antes.etapa) anotarFalla('las flores se achicaron al regarlas');
        if (despues.etapa > antes.etapa + 1) anotarFalla('las flores crecieron más de una etapa en un riego');
        if (antes.regadoHoy && despues.etapa !== antes.etapa) anotarFalla('las flores crecieron dos veces el mismo día');
        if (despues.etapa > antes.etapa) riegos++;
      }],
      ['tocar a Kuromi', 1, () => {
        irAlPatio();
        if (N.interno().cuarto !== 3) return;
        N.patio.aparecerKuromi();
        pasa(0.6 + azar() * 1.5);
        const k = N.puntoDeObjeto('kuromi');
        const antes = N.interno().patio.kuromi;
        evento('pointerdown', k.x, k.y); pasa(0.08); evento('pointerup', k.x, k.y);
        if (N.interno().patio.kuromi === 'asustada') kuromis++;
        else if (antes === 'espiando' && N.interno().estado === 'libre') {
          /* Si My Melody estaba delante de Kuromi, el toque fue para ella: no es una falla. */
          const e = N.puntoDeElla();
          if (Math.hypot(e.x - k.x, e.y - k.y) > lienzo.clientWidth * 0.18) anotarFalla('tocaste a Kuromi espiando y no reaccionó');
        }
      }],
      ['mirar los encargos', 0.6, () => {
        document.getElementById('btn-encargos').click();
        pasa(0.2 + azar() * 0.6);
        if (!N.encargos.panelAbierto()) anotarFalla('el botón Encargos no abrió el panel');
        const cerrar = document.querySelector('#panel-encargos [data-cerrar]');
        if (cerrar) cerrar.click();
      }],
      /* De punta a punta: tres encargos conocidos, cumplidos con gestos reales. Las Notas
         quedan a 3 de un múltiplo de 8, así que también tiene que prepararse un deseo. */
      ['encargos completos', 0.8, () => {
        pasa(2);
        const antes = N.interno();
        const notas0 = antes.encargos.notas + ((5 - antes.encargos.notas % 8) + 8) % 8;
        N.encargos.probar(['recorrer', 'columpio', 'flores'], notas0);
        firmaLista = '';   /* lista nueva aunque tenga los mismos encargos */
        N.patio.pasarUnDia();   /* que se pueda regar hoy */
        const corazones0 = N.interno().corazones, deseos0 = N.interno().encargos.deseos;
        /* Recorre los cuatro ambientes llegando a cada uno (el de partida cuenta al volver) y termina en el patio. */
        const actual = N.interno().cuarto;
        const orden = actual === 3 ? [0, 1, 2, 3] : [0, 1, 2].filter((c) => c !== actual).concat([actual, 3]);
        for (const c of orden) {
          document.querySelector('#ambientes .amb[data-cuarto="' + c + '"]').click();
          pasa(1.8);
          if (N.interno().cuarto !== c) return;   /* estaba ocupada y no pudo cambiar: no es una falla */
        }
        /* Primero regar: con el columpio muy alto la cámara sube y el cantero se mueve en la pantalla. */
        regar(1.6);
        for (let i = 0; i < 40 && !N.interno().encargos.lista[1].hecho; i++) {
          if (N.interno().estado !== 'columpio') { subirAlColumpio(); if (N.interno().estado !== 'columpio') pasa(2); }
          deslizar(); pasa(0.5);
        }
        const s = N.interno();
        const hechos = s.encargos.lista.filter((e) => e.hecho).length;
        if (s.cuarto !== 3) return;   /* algo la tuvo ocupada: no es una falla de encargos */
        if (hechos !== 3) { anotarFalla('encargos completos: cumplió ' + hechos + ' de 3 (' + JSON.stringify(s.encargos.lista) + ')'); return; }
        if (s.encargos.notas !== notas0 + 3) anotarFalla('encargos completos: las Notas no subieron 3 (' + notas0 + ' → ' + s.encargos.notas + ')');
        if (s.encargos.deseos !== deseos0 + 1) anotarFalla('encargos completos: al llegar a ' + s.encargos.notas + ' Notas no se preparó el deseo');
        if (corazones0 < 9900 && s.corazones - corazones0 < 30) anotarFalla('encargos completos: no dio los 30 ♥ (' + (s.corazones - corazones0) + ')');
        encargosHechos += 3;
        deseos++;
      }],
      ['abrir el refri', 1.5, () => { irALaCocina(); tocarRefri(); }],
      ['darle de comer', 3, () => {
        irALaCocina();
        if (!N.cocina.refriAbierto()) { tocarRefri(); pasa(0.4); }
        /* Solo se pueden arrastrar las comidas de la página que se ve. */
        const tarjetas = Array.from(document.querySelectorAll('#bandeja .tarjeta-comida')).filter((t) => !t.hidden);
        if (!tarjetas.length) return;
        const tarjeta = tarjetas[Math.floor(azar() * tarjetas.length)];
        const c = tarjeta.getBoundingClientRect();
        const x0 = c.left + c.width / 2, y0 = c.top + c.height / 2;
        const boca = N.bocaEnPantalla();
        const [xd, yd] = azar() < 0.25 ? puntoAlAzar() : [boca.x, boca.y];
        const antes = N.interno().inventario;
        enElemento(tarjeta, 'pointerdown', x0, y0, 3);
        let x = x0, y = y0;
        for (let i = 1; i <= 14; i++) {
          x = x0 + (xd - x0) * i / 14; y = y0 + (yd - y0) * i / 14;
          pasa(PASO); enElemento(tarjeta, 'pointermove', x, y, 3);
        }
        enElemento(tarjeta, 'pointerup', x, y, 3);
        const despues = N.interno().inventario;
        for (const id in antes) if (despues[id] < antes[id]) bocados++;
      }],
      ['cerrar el refri', 1, () => { const b = document.querySelector('#bandeja .bandeja-cerrar'); if (b) b.click(); }],
      ['comprar en la tiendita', 2, () => {
        irALaCocina();
        if (!N.cocina.refriAbierto()) { tocarRefri(); pasa(0.3); }
        const abrir = document.querySelector('#bandeja .bandeja-tienda');
        if (abrir) abrir.click();
        const productos = document.querySelectorAll('#tienda .producto');
        const prod = productos[Math.floor(azar() * productos.length)];
        const id = prod.dataset.id;
        const antes = N.interno();
        prod.querySelector('.comprar').click();
        const despues = N.interno();
        const subio = despues.inventario[id] - antes.inventario[id], pago = antes.corazones - despues.corazones;
        if (subio > 0 && pago <= 0) anotarFalla('compró ' + id + ' sin pagar');
        if (subio <= 0 && pago !== 0) anotarFalla('cobró ' + pago + ' ♥ sin entregar ' + id);
        if (subio > 0) compras++;
        if (azar() < 0.6) document.querySelector('#tienda [data-cerrar]').click();
      }],
      /* Sin tope, para que siempre haya saldo con qué probar las compras. */
      ['recibir corazones de prueba', 1, () => N.tienda.ganar('prueba', 15)],
      ['ganar corazones dándole cariño', 1.5, () => {
        for (let i = 0; i < 4; i++) { const [x, y] = sobreElla(); evento('pointerdown', x, y); pasa(0.08); evento('pointerup', x, y); pasa(0.3); }
      }],
      ['cambiar de página en el refri', 0.8, () => {
        irALaCocina();
        if (!N.cocina.refriAbierto()) { tocarRefri(); pasa(0.3); }
        const flechas = document.querySelectorAll('#bandeja .bandeja-flecha');
        if (flechas.length) flechas[Math.floor(azar() * flechas.length)].click();
      }],
      ['hacer un ramo', 0.8, () => {
        irAlPatio();
        const antes = N.interno().patio;
        document.getElementById('btn-ramo').click();
        const despues = N.interno().patio;
        if (antes.etapa === 4 && !antes.secas && despues.ramo !== 'fresco') anotarFalla('con flores grandes, el ramo no llegó al florero');
        if ((antes.etapa !== 4 || antes.secas) && despues.ramos !== antes.ramos) anotarFalla('se hizo un ramo sin flores listas');
      }],
      ['tocar el florero', 0.5, () => {
        if (N.interno().cuarto !== 0) { document.querySelector('#ambientes .amb[data-cuarto="0"]').click(); pasa(1.6); }
        const f = N.puntoDeObjeto('florero');
        evento('pointerdown', f.x, f.y); pasa(0.08); evento('pointerup', f.x, f.y);
      }],
      ['llenar el refri', 0.4, () => document.getElementById('btn-llenar').click()],
      ['darle hambre', 0.6, () => document.getElementById('btn-hambre').click()],
      ['pasar un día', 0.3, () => document.getElementById('btn-olvido').click()],
      ['esperar', 2, () => pasa(0.5 + azar() * 4)]
    ];
    const pesoTotal = ACCIONES.reduce((s, a) => s + a[1], 0);
    function elegir() {
      let r = azar() * pesoTotal;
      for (const a of ACCIONES) { r -= a[1]; if (r <= 0) return a; }
      return ACCIONES[ACCIONES.length - 1];
    }

    performance.now = () => reloj;
    N.silenciar(true);
    try {
      while (simulado < segundos) {
        const [nombre, , hacer] = elegir();
        conteo[nombre] = (conteo[nombre] || 0) + 1;
        hacer();
        acciones++;
        pasa(0.05 + azar() * 0.8);
      }
      /* Al final, sin tocarla: tiene que quedar libre, sentada en la silla o quieta en la bañera. */
      pasa(4);
      const fin = N.interno();
      if (!['libre', 'sentada', 'banera', 'columpio'].includes(fin.estado)) anotarFalla('después de 4 s sin tocarla sigue en "' + fin.estado + '"');
    } catch (err) {
      anotarFalla('error: ' + (err && err.message ? err.message : err));
    } finally {
      performance.now = relojReal;
      /* Descarta lo que la prueba hizo con los encargos: las Notas guardadas no se tocan. */
      if (N.encargos) N.encargos.recargar();
      try {
        const ahora = localStorage.getItem('nella-notas') + '|' + localStorage.getItem('nella-encargos');
        if (notasGuardadas !== null && ahora !== notasGuardadas) anotarFalla('la prueba cambió las Notas o los encargos guardados');
      } catch (err) { /* sin almacenamiento */ }
      N.silenciar(false);
      N.callar();
      N.tienda.cerrar(false);
      N.cocina.cerrarRefri(false);
    }

    const segundosReales = (relojReal.call(performance) - inicioReal) / 1000;
    const ok = fallas.length === 0;
    const lineas = [
      ok ? '✔ Sin fallas.' : '✘ Se encontraron fallas:',
      ...fallas.map((f) => '  · ' + f),
      '',
      'Tiempo simulado: ' + Math.round(simulado) + ' s (' + segundosReales.toFixed(1) + ' s reales)',
      'Acciones al azar: ' + acciones + ' (semilla ' + semilla + ') · comió ' + bocados + ' veces · compró ' + compras + ' veces · quedó limpia ' + banos + ' veces',
      'Columpio: ' + vueltas + ' vueltas completas · flores regadas ' + riegos + ' veces · Kuromi descubierta ' + kuromis + ' veces',
      'Encargos cumplidos en la prueba completa: ' + encargosHechos + ' · deseos preparados: ' + deseos,
      ...Object.keys(conteo).map((k) => '  · ' + k + ': ' + conteo[k]),
      'Tiempo máximo en cada estado:',
      ...Object.keys(maxPorEstado).map((k) => '  · ' + k + ': ' + maxPorEstado[k].toFixed(2) + ' s'),
      '',
      'La escena quedó en un estado al azar: recarga la página para seguir jugando.'
    ];
    const informe = { ok, fallas, acciones, bocados, compras, banos, vueltas, riegos, kuromis, encargosHechos, deseos, simulado, semilla, conteo, maxPorEstado, vecesPorEstado, texto: lineas.join('\n') };
    console.log('[mono loco]\n' + informe.texto);
    return informe;
  }

  window.NellaPruebas = { monoLoco };
})();
