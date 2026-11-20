# Nella Melody · Diseño de ambientes, comida y tiendita

Fecha: 2026-11-16. Propuesta para revisar antes de construir. Los números son un punto de partida y se ajustan jugando.

## 1. La casa y cómo moverse

La casa tiene cuatro ambientes, uno al lado del otro, como una casa de muñecas abierta:

| Sala | Cocina | Baño | Patio |
|---|---|---|---|

- **Barra de ambientes:** abajo al centro, cuatro botones redondos con un ícono cada uno. El ambiente actual se ve resaltado. A los costados, flechas ‹ › para ir al vecino.
- **Cambio de ambiente:** la cámara se desliza hacia el lado en unos 0,7 segundos, y My Melody llega saltando por la puerta del nuevo ambiente. Va siempre contigo.
- **Durante el cambio se ignoran los toques.** Así no hay acciones a medias entre dos ambientes.
- **Arriba:** barras pequeñas de hambre, limpieza y ánimo, más los contadores de corazones ♥ y Notas Rosas ♪.
- **Rendimiento:** solo se dibujan el ambiente actual y, durante el cambio, el siguiente. Los demás quedan apagados.

Los botones de prueba que hoy están abajo (Diagnóstico, Pasar un día, Pantalla completa) se mueven a Opciones.

## 2. Cómo evitar los problemas de física

Las "físicas con bugs" de muchos juegos vienen de simular choques: el personaje atraviesa una pared, queda trabado en una silla o sale disparado. Aquí no se simula nada de eso. Cada movimiento está calculado de antemano y tiene un final garantizado.

1. **Sin motor de física.** Los saltos, caídas, bamboleos y el columpio son curvas y resortes calculados, como los que ya usa la prueba. No hay choques entre objetos.
2. **Piso permitido por ambiente.** Cada ambiente tiene un área donde ella puede estar, sin los muebles. Si la sueltas fuera, cae en el punto permitido más cercano.
3. **Imanes en los muebles.** La silla, la bañera y el columpio tienen un punto de enganche. Si la sueltas cerca, se acomoda con una animación fija. No queda "medio sentada".
4. **Una sola cosa a la vez.** Una máquina de estados decide qué está haciendo: libre, cargada, sentada, comiendo, en la bañera, en el columpio, durmiendo o cambiando de ambiente. Cada estado acepta solo ciertos toques. Por ejemplo, no se le puede dar comida mientras está cargada.
5. **Siempre hay salida.** Cada estado tiene un tiempo máximo y una salida segura a "libre". Ella nunca se queda congelada.
6. **Igual a cualquier velocidad de pantalla.** Todo se calcula por tiempo, como ya se probó a 30, 60, 90 y 120 cuadros por segundo.
7. **Prueba del "mono loco".** Una prueba automática hace miles de toques, arrastres y cambios de ambiente al azar durante varios minutos simulados. Comprueba que ella nunca salga del piso permitido, nunca tenga una posición inválida y nunca quede trabada en un estado. Se corre antes de cada entrega.

## 3. Gestos

| Gesto | Qué hace |
|---|---|
| Tocarla | Cariño |
| Arrastrar despacio encima | Caricia |
| Arrastrar rápido encima | Manotazo |
| **Mantener presionado sobre ella y arrastrar** | **Levantarla y llevarla** (nuevo) |
| Tocar el piso | Va caminando hasta ahí |
| Arrastrar un objeto (comida, jabón) | Llevar el objeto hasta ella |

Levantarla pide mantener presionado medio segundo para no confundirlo con una caricia. Mientras la llevas, cuelga del dedo y patalea un poco. Al soltarla cae con un aplastón suave, o se engancha si está cerca de un mueble.

## 4. Sala

Es el ambiente que ya existe: cariño, caricias, manotazos, paseos, baile y sueño. Allí también aparece el saludo al entrar.

**Cambio:** las caricias dejan de limpiar la suciedad. Para eso está el baño.

## 5. Cocina

- **Silla:** si la llevas cerca de la silla y la sueltas, se sienta. Si tocas la mesa con ella sentada, balancea los pies.
- **Refrigerador:** al tocarlo se abre con una animación y aparece un panel con la comida. Cada comida muestra cuántas quedan (×3). Las agotadas se ven en gris, con un botón para ir a la tiendita.
- **Dar de comer:** arrastras la comida desde el panel hasta su boca. Ella abre la boca cuando la comida se acerca, mastica tres veces, salen migas y la barra de hambre baja. Si sueltas la comida lejos, vuelve al panel sin gastarse.
- **Reacción por comida:**
  - Su favorita (pastel de almendras): ojos de estrella, corazones y un saltito.
  - Comida común: sonrisa y "¡Gracias!".
  - Rakkyo (cebollitas encurtidas, la comida favorita de Kuromi): cara agria y escalofrío. Es un chiste para fans.
  - Si ya está llena: niega con la cabeza y no gasta la comida.
- **Hambre:** sube con el tiempo real y llega al máximo en unas 8 horas. Con hambre se le ve triste y le suena la panza. Por la regla de "solo triste", no se enferma.

### Comidas iniciales (propuesta)

| Comida | Cuánto llena | Precio |
|---|---|---|
| Fresas | 15 % | 6 ♥ (paquete de 3) |
| Galletas de corazón | 20 % | 4 ♥ |
| Leche | 10 % | 3 ♥ |
| Pudín | 30 % | 8 ♥ |
| Pastel de almendras (favorita) | 45 % | 12 ♥ |
| Rakkyo | 5 % | 2 ♥ |

La comida se modela en 3D con el mismo estilo que My Melody. Los íconos del refrigerador y de la tiendita se sacan fotografiando esos modelos dentro del juego, así todo combina.

## 6. Corazones y tiendita

**Moneda: corazones ♥.** Son los mismos corazones que ya salen al darle cariño: ahora se juntan. Las Notas Rosas ♪ siguen siendo otra cosa: el progreso hacia la sorpresa de la nota 100. Nunca se gastan.

**Cómo se ganan corazones (con tope diario, para que no haga falta jugar horas):**

| Cómo | Cuánto |
|---|---|
| Regalo al abrir el juego cada día | +15 ♥, y 3 más por cada día seguido, hasta 30 (racha; si falta un día vuelve a 15) |
| Cariño y caricias | +1 ♥ por corazón, hasta 25 por día |
| Columpio en el patio | +1 ♥ cada 5 empujones, hasta 15 por día |
| Encargo del día cumplido | +10 ♥ (además de su Nota Rosa), 3 por día |
| Regar las flores (una vez por día) | +2 ♥ |
| Hacer un ramo para el florero | +5 ♥ |
| Descubrir a Kuromi (la primera vez del día) | +3 ♥ |

Con 5 minutos al día se juntan unos 40 ♥, suficiente para comer bien y darse un gusto de vez en cuando.

**Tiendita:**

- Se entra desde el refrigerador ("Ir a la tiendita") y desde un botón en la cocina.
- Es un panel con tarjetas: la comida, su precio y un botón "Comprar". Si no alcanzan los corazones, el botón se ve apagado y dice cuántos faltan.
- Al comprar, los corazones vuelan del contador a la tarjeta, suena una campanita y aparece "+1 en el refri". **La compra llega al instante**, porque en sesiones de 5 minutos esperar se siente como castigo.
- **Se empieza con** 30 ♥ y algo de comida: 3 fresas, 3 galletas, 2 leches y 1 pastel.
- **Nunca se queda trabada:** si tiene hambre, no hay comida y no alcanzan los corazones, llega "la canasta de mamá" gratis, una vez por día. Así ella nunca queda sin forma de alimentarla.

## 7. Baño

- **Bañera:** la llevas a la bañera y, al soltarla cerca, se mete y se sienta. Asoma la cabeza y las orejas.
- **Jabón:** arrastras el jabón sobre ella. Donde frotas aparece espuma, y ella se ríe con cosquillas y se mueve un poco. Cuanto más frotas, más espuma y menos manchas.
- **Enjuagar:** al tocar la regadera cae agua, la espuma se va y salen brillos. Si estaba sucia, queda limpia, salta feliz y se le pasa la pena.
- **Secado:** se sacude como un perrito y salpica gotas. Es la reacción graciosa del baño.
- **Suciedad:** solo se quita aquí. Sigue la regla ya acordada: se ensucia a los 2 días sin visita y llora a los 4. También puede bañarse estando limpia, solo por diversión.

## 8. Patio

- **Columpio:** la llevas al columpio y se sienta. Cada deslizamiento del dedo la empuja más alto. Se ríe y las orejas flotan con el viento.
  - Si la empujas demasiado fuerte, da una vuelta completa (un chiste, calculado y sin riesgo) y baja mareada, con estrellitas girando.
- **Flores:** con una regadera riegas un cantero. Las flores crecen con los días reales.
- **Visitas:** en el patio aparecen los visitantes del diseño original (Flat, Piano). Kuromi a veces espía por encima de la cerca con su Kuromi Note: si la tocas se esconde refunfuñando.
- **Pelota (opcional):** la lanzas con un deslizamiento y My Melody corre a buscarla saltando.

## 9. Encargos del día y Notas Rosas

Los ambientes alimentan los encargos del día, que dan las Notas Rosas. Ejemplos, con la fórmula de deseo de los episodios:

- "Ojalá pudiera comer pastel de almendras" (dale su favorita)
- "Ojalá oliera a flores" (báñala)
- "Ojalá volara alto" (columpiala 10 veces)
- "Ojalá las flores crecieran" (riega el cantero)

## 10. Orden de construcción

Cada paso se puede probar en el iPhone y en el Android antes de seguir.

1. **Casa y navegación:** los cuatro ambientes vacíos, la barra para moverse, la máquina de estados, levantarla y soltarla, y la prueba del "mono loco". *Hecho el 2026-11-16 en `prototipo-web/3d/` (`cuartos.js`, `escena3d.js`, `pruebas.js`). Los ambientes tienen sus muebles, pero todavía sin interacción. La prueba del mono loco pasó cinco corridas sin fallas (unos 65 minutos simulados y más de 3.500 acciones al azar), y detectó un error metido a propósito.*
2. **Cocina:** silla, refrigerador, comida en 3D, dar de comer y hambre. *Hecho el 2026-11-16 (`cocina.js` y cambios en `escena3d.js` y `cuartos.js`). Incluye las barras de comida, limpieza y ánimo. Mientras no exista la tiendita (paso 3), la comida agotada solo dice "Agotado" y Opciones tiene "Llenar el refri" y "Darle hambre" para probar. El imán de la silla mide la distancia en la pantalla, no en 3D: medido en 3D no funcionaba por la perspectiva. La prueba del mono loco ampliada pasó cinco corridas de 10 minutos simulados sin fallas, con entre 19 y 32 comidas en cada una.*
3. **Corazones y tiendita:** contador, ganancias con tope, panel de compras y canasta de mamá. *Hecho el 2026-11-16 (`tienda.js` y conexiones en `cocina.js` y `escena3d.js`). Se aplicaron las dos recomendaciones: la moneda son los corazones del cariño y la compra llega al instante. El cariño da 1 ♥ por toque y 3 ♥ extra al completar la escala, con tope de 25 por día. Hay regalo diario de 15 ♥ y se empieza con 30 ♥. Las fresas vienen en paquete de 3. Comprobado paso a paso: precio exacto, sin saldo no se compra, tope diario y canasta de mamá una vez por día. El mono loco con compras pasó cinco corridas de 10 minutos simulados sin fallas, con entre 27 y 49 compras en cada una. La prueba revisa que cada compra cobre y entregue.*
4. **Baño:** bañera, jabón, espuma, regadera y secado. *Hecho el 2026-11-16 (sección "Baño" en `escena3d.js`, kit en `index.html`, regadera sobre la bañera en `cuartos.js`). Al soltarla cerca de la bañera se mete y asoma la cabeza; entonces aparece un kit con Jabón, Regadera y Salir en lugar de la barra de ambientes. El frotado se mide en anchos de pantalla para que se sienta igual en la tablet: cada 5 % de ancho deja una burbuja (máximo 40) y cada 22 % le da cosquillas y le quita 0.1 de suciedad. Si enjuagas con muy poca espuma, dice "Todavía tengo manchitas…". Las caricias ya no la limpian: sucia, pide "Necesito un bañito…". La silla y la bañera comparten el mismo código de "acomodarse en un mueble" y de bajarse (`bajarDeMueble`). El mono loco pasó cinco corridas de 10 minutos simulados sin fallas, con entre 7 y 11 baños completos verificados en cada una: tiene que quedar limpia y salir sola.*
   *Arreglo previo, del mismo día: My Melody decía "¡Estoy llena!" con la barra de comida vacía. El globo de la prueba del mono loco usaba el reloj que la prueba adelanta, así que quedaba en pantalla unos 5 minutos después. Ahora el globo usa el reloj real, la prueba corre en silencio y lo borra al terminar, y con hambre ya no baila, no saluda ni se duerme: se toca la pancita y cada 45 s dice "Tengo hambre…".*
5. **Patio:** columpio, flores y Kuromi espiando. *Hecho el 2026-11-16 (`patio.js` nuevo, sección "Columpio" en `escena3d.js`, botón Regar en `index.html`, columpio más al centro y zona de toque en `cuartos.js`).*
   - *Columpio:* un péndulo de verdad con paso fijo. Se sube soltándola cerca o tocando el columpio: va saltando y se sube sola. Cada deslizamiento del dedo, en cualquier parte de la pantalla, lo empuja; cada 5 empujones da 1 ♥ (tope de 15 por día, como en la tabla de la sección 6; al principio daba 1 ♥ por empujón y se corrigió en el paso 6). En el columpio, deslizar el dedo es empujar, nunca un manotazo. Las orejas flotan con el viento, patalea y se agarra de las cuerdas. Hay un silbido de viento al pasar por abajo y una nota que sube con la altura. Con unos 10 empujones da la vuelta completa: está calculada (sin roce durante la vuelta y con tope de energía, así que pasa por arriba despacito), y la cámara sube para que se vea. Después frena fuerte, baja mareada con estrellitas, dice "Todo me da vueltas…" y luego "Mi mamá dice que en el columpio hay que ir despacito". Para bajarla se toca el piso, como en la silla.
   - *Flores:* cinco plantas en el cantero, en etapas brote → hojitas → capullo → flor → flor grande con brillos. Se arrastra la regadera desde el botón "Regar" (solo aparece en el patio) hasta el cantero; con 1,2 s de riego crecen una etapa, una vez por día real, y dan 2 ♥. Con dos días sin riego se ponen mustias, pero nunca se mueren ni se achican. Tocar el cantero hace que My Melody comente cómo van. Se guarda en 'nella-patio'.
   - *Kuromi:* a los 18–38 s de estar en el patio se asoma por la cerca con las manitos apoyadas, la calavera rosa y a veces su Kuromi Note. My Melody la mira y a veces pregunta "¿Eh? ¿Quién anda ahí?". Si la tocas, da un respingo, refunfuña y se esconde; My Melody la saluda, y la primera vez de cada día da 3 ♥. Si no la tocas, a los 5,5 s se va sola.
   - *Pendiente:* las visitas de Flat y Piano, y la pelota (opcional).
   - *Pruebas:* el mono loco suma subir al columpio, empujar, tocarlo, regar y tocar a Kuromi. Además hace un "columpio completo" que exige la vuelta y el mareo, y revisa que las flores nunca crezcan dos veces el mismo día ni se achiquen. Pasó cinco corridas de 10 minutos simulados sin fallas, con entre 3 y 6 vueltas completas verificadas en cada una. En otra corrida las flores crecieron de la etapa 1 a la 4 con días simulados. También se revisaron en pantalla el columpio, Kuromi y la regadera.*
6. **Encargos del día** conectados a todo. *Hecho el 2026-11-16 (`encargos.js` y `cartas.js` nuevos; avisos desde `escena3d.js` y `patio.js`; botón, contador y estilos en `index.html`).*
   - *Encargos:* tres por día, de ambientes distintos, elegidos al azar sin repetir los de ayer. El primer día siempre son "Ojalá paseáramos por toda la casa", "Ojalá tuviera la pancita llena" y "Ojalá las flores crecieran", para aprender a moverse. Son 13 en total: escala completa, recorrer la casa y siesta (sala); comer tres veces, pastel de almendras, comer sentada a la mesa y rakkyo (cocina); baño con jabón y sombrero de 20 burbujas (baño); 10 empujones, vuelta completa, regar y encontrar a Kuromi (patio). El baño solo cuenta si hubo jabón de verdad (8 burbujas o más).
   - *Premio:* cada encargo da 1 Nota Rosa ♪ y 10 ♥. Aparece un aviso a la derecha, la nota vuela al contador ♪ (junto a los corazones) y My Melody dice "¡Se cumplió mi deseo! ¡Gracias!". Las Notas solo suben y se guardan en 'nella-encargos', con una copia en 'nella-notas' que lee la ficha del título.
   - *Interfaz:* botón "Encargos" debajo del logo, con una insignia de cuántos faltan (✓ verde si no falta ninguno). El panel muestra los tres "Ojalá…" con cómo cumplirlos y su avance (por ejemplo 4/10), la escala do-re-mi-fa-sol-la-si-do que se llena con las Notas, cuántas faltan para el próximo deseo y los deseos ya recibidos para releerlos. El primer ingreso de cada día, My Melody avisa cuántos deseos tiene y el botón se mueve.
   - *Deseos:* cada 8 Notas suena la escala completa y se abre el deseo. Se turnan una carta del autor y una página de la Kuromi Note (12 páginas originales en `cartas.js`). Si la carta que toca está vacía, sale una página de Kuromi: así nunca aparece un texto a medio escribir. Un deseo nunca se abre en medio de algo (con el dedo apoyado, cargándola, comiendo, cambiando de ambiente o con la tiendita abierta).
   - *Pendiente del autor:* escribir las cartas en `cartas.js` (6 cubren las 100 Notas; la primera llega con la Nota 8).
   - *Pendiente:* el final de la Nota 100 (My Melody pide ayuda, las aguas termales y la sorpresa del autor).
   - *Pruebas:* la prueba del mono loco no guarda Notas ni encargos, ni abre deseos: al terminar vuelve a leer lo guardado y comprueba que no cambió. Revisa que las Notas nunca bajen, que no haya más de 3 Notas por lista y que cada encargo esté bien marcado. Además hace "encargos completos": recorre la casa, riega y columpia de verdad, y exige 3 Notas, 30 ♥ y que se prepare el deseo. Pasó cinco corridas de 10 minutos simulados sin fallas, con entre 6 y 12 encargos cumplidos y entre 2 y 4 deseos preparados por corrida. También se comprobó que cada uno de los 13 encargos se cumple con su evento exacto, y que no se cumple dos veces.

## 11. Versión 1 (2026-11-16)

Con estos cambios el juego queda completo para una primera versión oficial.

- **Corazones.** Todo tiene tope diario: como mucho unos 100 ♥ por día aunque juegue horas, así que no sirve juntar todo en un día. Lo que premia es volver: la **racha** sube el regalo diario de 15 a 30 ♥ en seis días seguidos, y si falta un día vuelve a 15 sin quitarle nada. Además, la comida baja con el tiempo real y las flores, el florero, los encargos y las cartas piden visitas diarias. Comprobado: la racha sube, se reinicia si falta un día y no se puede cobrar dos veces el mismo día.
- **Bañera.** El borde le tapaba la boca: ahora se sienta más alto (con la cara entera sobre el agua) y la regadera va por la pared de la izquierda, con la cabeza en diagonal; el caño ya no le atraviesa la cabeza ni roza sus orejas, y el agua le cae desde un costado.
- **Flores.** Ciclo completo: brote → hojitas → capullo → flor → flor grande. Florecidas, aparece el botón **Ramo**: el ramo va al **florero de la sala** (mesita junto a la planta), el cantero vuelve a hojitas y empieza otra vuelta (+5 ♥). El ramo está fresco 5 días, mustio hasta el 7 y después seco (tocar el florero hace que My Melody lo comente). Sin riego: a los 2 días las plantas se ponen mustias (ahora todas se inclinan parejo; antes se cruzaban en X) y a los 5 se secan (color paja). Secas no crecen ese día: el riego las revive. Nunca se mueren ni pierden etapas.
- **Kuromi.** Rehecha siguiendo la referencia: capucha negra más ancha, orejas de bufón planas con bolita en la punta, moño lila, calavera rosa en relieve, el pico de la capucha sobre la frente, ojos traviesos con pestañas, naricita rosa y sonrisa abierta con lengüita. Se asoma más alto para que se le vea la boca sobre la cerca.
- **Encargos.** Pasan de 13 a 16: se suman "Ojalá hubiera flores en la sala" (ramo; solo sale si hoy se puede), "Ojalá comiera algo dulcecito" (dos postres) y "Ojalá tomara un matcha latte". Cada día salen 3 de ambientes distintos, sin repetir los de ayer: hay más de 150 combinaciones posibles.
- **Comidas nuevas** (modelos 3D con el mismo estilo; el refri ahora tiene 2 páginas con flechas ‹ ›, y la tiendita 4 columnas):

  | Comida | Llena | Precio | Al empezar |
  |---|---|---|---|
  | Matcha latte (vaso transparente, pajita rosa) | 10 % | 5 ♥ | 1 |
  | Dona glaseada con chispitas | 20 % | 5 ♥ | 1 |
  | Pastel de chocolate | 35 % | 9 ♥ | 0 |
  | Cheesecake de pistacho | 35 % | 10 ♥ | 0 |
  | Tiramisú | 35 % | 10 ♥ | 0 |

  Cada una tiene su frase al comerla ("¡Mmm, matcha!", "¡Qué cremoso!"…).
- **Créditos.** Primera línea: "Un regalo de tu Nico para ti, mi querida princesa y amorcito de mi vida.", y debajo la foto de los dos como polaroid (`prototipo-web/3d/img/nosotros.jpg`, 720 × 540, va dentro del juego para que funcione sin internet). Medido a 1280 × 800: el cuadro entra con margen arriba y abajo, sin desbordar.
- **Cartas.** `cartas.js` tiene 6 cartas escritas con la voz de Nico (borrador para que él las ajuste) y la carta sorpresa de la Nota 100. Llegan con las Notas 8, 24, 40, 56, 72 y 88.
- **Final de la Nota 100.** Tres segundos después de cumplir el encargo que da la Nota 100: My Melody dice "¡Juntamos 100 Notas Rosas!" y pide ayuda; aparece un botón para tocar la escala con ella (8 toques: do, re, mi… do); tiembla el piso, sube vapor, un destello, "¡Brotaron las aguas termales!" y se abre la carta sorpresa. Al cerrarla quedan para siempre **aguas termales** en el patio (pozo con piedras, vapor y cartel ♨), y la carta se puede releer desde Encargos (★). El juego sigue después. Comprobado de punta a punta, también que se guarda y que no se repite al recargar.
- **Botones de prueba ocultos.** La fila de pruebas de Opciones ya no la ve Antonella: aparece con `?pruebas` en la dirección o tocando 7 veces seguidas el título "Opciones". Ahí está "Ver el final (100 Notas)", que lo muestra sin guardar nada.
- **Arreglo:** tocar fuera de un deseo lo cerraba sin avisarle a `encargos.js`, que quedaba trabado esperando. Ahora los encargos y los deseos se cierran con su propia lógica.
- **Arreglo:** en una PC con pantalla ancha, el logo "Nella Melody" se cruzaba con la barra de comida, limpieza y ánimo, porque el logo y los botones de arriba se medían con la ventana y no con el marco del juego. Ahora todo se mide con el marco y la barra es un poco más compacta. Medido: entre el logo y la barra quedan 113 px en una PC de 1920 × 915, 98 px en la tablet y 49 px en un celular horizontal.
- **Pruebas:** el mono loco suma el refri por páginas, el ramo y el florero, y revisa que el final nunca empiece durante la prueba. Pasó cinco corridas de 10 minutos simulados sin fallas, y las Notas guardadas quedaron intactas.
- **Revisión con capturas (tamaño tablet):** se recorrieron título, casa, cocina (refri en dos páginas, comer pastel de chocolate, tiendita), baño (jabón, regadera, salida), patio (Kuromi, Ramo), sala (florero), Encargos, créditos con la foto y el final. Arreglos que salieron de ahí:
  - El florero asomaba por el borde de la ficha del título: se corrió junto a la planta.
  - El globo de diálogo tapaba el botón Encargos cuando ella estaba a la izquierda (en la bañera): ahora se corre de costado, sin salirse del marco ni tapar Opciones y Menú, y la colita sigue apuntando a ella.
  - Kuromi a veces se asomaba justo detrás de My Melody y quedaba tapada (el toque le llegaba a ella): ahora elige un lugar de la cerca lejos de My Melody.
  - En el final, los 8 corazones salían todos en una fila recta: ahora salen de a uno, desparramados.
  - El texto y el botón del final tapaban los pies de My Melody: ahora van en una columna a la derecha.
  Después de los arreglos, el mono loco pasó dos corridas más sin fallas.

### Entrega (2026-11-16)

- **APK:** `entrega/Nella Melody 1.0.apk` (4,8 MB), hecho con Capacitor 7 sobre el mismo juego web, sin internet (three.js y la letra Fredoka van dentro). Guía de instalación y de cómo compilar versiones nuevas: `entrega/COMO-INSTALAR.md`.
- **Probado en un emulador de Android 17:** se instala, abre en horizontal y a pantalla completa, el 3D funciona, la partida empieza de cero y se guarda al cerrar y volver a abrir. Esto confirma que la ruta web + Capacitor sirve: no hace falta pasar a Godot.
- **Firma:** la clave de depuración de la laptop, respaldada en `apk/firma/`. Hay que guardarla fuera de la laptop: sin ella, una versión nueva no se instala encima y desinstalar borra la partida.

## 12. Decisiones para el autor

1. ¿La moneda son los corazones ♥ que salen al darle cariño?
2. ¿Levantarla con "mantener presionado y arrastrar"? *Aplicado así en el paso 1, con medio segundo de espera; se puede cambiar.*
3. ¿La compra llega al instante?
4. ¿La suciedad se quita solo en el baño?
5. ¿Qué juegos quieres en el patio además del columpio?

## 13. Riesgo conocido

Todo esto se construye en la versión web. Si la prueba en Android sale mal y hay que pasar a Godot, este código se rehace; el diseño se mantiene. Conviene armar el APK de prueba durante el paso 1 para saberlo cuanto antes.
