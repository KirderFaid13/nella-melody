# Nella Melody

* **Nombre oficial del juego:** Nella Melody (definido por el autor el 2026-11-14; "My Antonella's Melody" era el nombre de trabajo y sigue siendo el de la carpeta)
* **Autor:** por confirmar (git no tiene `user.name` configurado)
* **Fecha:** 2026-11-14
* **Estado:** borrador tras la primera revisión Goldfish, con las siete miradas completas. Varias propuestas contradicen decisiones que el autor ya había tomado; están listadas en "Decisiones pendientes del autor" y no valen hasta que él las confirme.

## Actualización del 2026-11-14: estilo 3D aprobado

El autor vio las dos rondas de la fase 0 y aprobó la segunda: My Melody como modelo 3D hecho por código, con contorno de tinta y sombreado de dos tonos, que se desplaza a saltos por la habitación y gira la cabeza hacia el dedo. La prueba está en `prototipo-web/3d/`.

Esto cambia partes de este documento, que se reescriben al pasar al diseño detallado:

- Donde dice "2D", "SVG", "hoja de modelo" o "ficha de piezas", ahora es un modelo 3D armado con formas redondeadas. Sigue valiendo que todo se genera por código y que el movimiento es por resortes y tiempo transcurrido.
- La ventaja "el navegador dibuja el SVG tal cual" ya no aplica. La comparación de motor pasa a ser WebGL en el navegador contra Godot en 3D. Siguen en pie las otras tres ventajas de la web: eventos de lápiz, sin APK y actualizar publicando.
- Riesgo nuevo sin medir: el costo de dibujar 3D a 2560x1600 en la tablet. La prueba dibuja unos 54 mil triángulos y corre a 60 cuadros por segundo en la laptop.
- La prueba descarga la biblioteca 3D de internet. En el juego tendría que ir incluida para funcionar sin conexión.

## Actualización del 2026-11-15: ánimo, golpes y olvido

El autor pidió que My Melody reaccione como los personajes de My Talking Angela y los muñecos de la Wii, y revirtió una decisión anterior:

- **Cae la regla de "cero castigo".** Si pasan días sin visitarla, se ensucia, se pone triste y llora. Donde este documento dice "sin castigo por ausencia" o "nunca se entristece", ya no vale.
- **Lo que se conserva de esa regla (confirmado por el autor el 2026-11-15, "solo triste"):** no se enferma ni muere, no se pierde progreso ni Notas, y se recupera por completo en una sola visita.
- **Golpes y caricias.** Tocarla es darle cariño: una palmadita o una caricia lenta la calman y, ya contenta, sueltan corazones y avanzan la escala. Solo un manotazo (arrastrar rápido encima) la hace bambolearse como un tentetieso. Con dos se enoja; si le siguen pegando, llora. Antes un toque seco contaba como golpe, y el autor lo rechazó el 2026-11-15 porque cada clic la hacía llorar. Si la tocan mientras camina, se detiene.
- **Riesgo que el autor acepta:** una mascota que llora cuando se la olvida puede generar culpa y hacer que se abra menos el juego. 
- **Cuándo se ensucia.** El autor decidió el 2026-11-15 que empieza a los 2 días sin visita. El primer día no pasa nada. A los 2 días aparecen dos manchas y está triste, sin llorar. A los 4 días queda toda sucia y llorando; el autor confirmó este segundo umbral el mismo día. Después de los 4 días no empeora más.

La prueba de estos estados está en `prototipo-web/3d/`, con un botón que simula dos días de olvido.

## Actualización del 2026-11-16: arranque y título

La prueba de `prototipo-web/3d/` ya tiene el arranque completo: aviso, logo, título con la ficha, Opciones, Créditos y entrada a la casa con saludo según la hora. Un cambio respecto del diseño original:

- **El aviso aparece en cada arranque, no solo la primera vez.** La primera vez muestra la dedicatoria. Las siguientes, un consejo de la mamá de My Melody que cambia cada día. Los navegadores solo dejan sonar el audio después de un toque, y este primer toque es el que permite que suenen el logo y la música del título. Además retoma un chiste de la serie.
- **Nombre:** el autor confirmó que la destinataria se llama Antonella. Siguen pendientes su dedicatoria y la revisión de los consejos de mamá, al principio de `titulo.js`.

### Requisito confirmado: app instalada y sin internet

El autor confirmó el 2026-11-16 que el juego final tiene que ser una app instalada en la tablet que se juegue sin conexión. La prueba actual es una página web servida desde la laptop, que además descarga de internet la biblioteca 3D y la letra.

- **Si gana la web:** se empaqueta con Capacitor. Es una app Android que lleva adentro todos los archivos (biblioteca 3D, letra, sonidos) y muestra el juego con el navegador interno de Android (WebView). No necesita internet ni servidor. El guardado pasa a la memoria de la app.
- **Si gana Godot:** el APK es nativo y también funciona sin internet, pero hay que rehacer el personaje y las animaciones.
- **La prueba en Android tiene que hacerse con el APK empaquetado, no en Chrome**, porque en la tablet correrá dentro del WebView, que puede rendir distinto.
- **Herramientas que ya hay en la laptop (revisado el 2026-11-16):** Node 24, JDK 21 y el SDK de Android con build-tools 34 a 37 y plataformas 35 y 36.1. Faltan Capacitor (por npm) y las librerías que descarga Gradle al compilar, entre 1 y 1,5 GB.
- **Disco:** a C: le quedan 2,3 GB, así que la caché de Gradle tiene que ir en D:.
- **Música del título:** «Estrellita, ¿dónde estás?», de dominio público, en cajita musical generada al vuelo. En el juego final irá como archivo.

## Resumen

Juego de mascota virtual para Android. Es un regalo privado para una sola persona, fan del anime *Onegai My Melody*, y corre en un solo dispositivo: su Samsung Galaxy Tab S9 FE+ (2560x1600, 16:10, 90 Hz, S Pen). No se publica.

Ella cuida a My Melody en sesiones de unos cinco minutos al día, decora tortas dibujando el glaseado, junta Notas Rosas y recibe cartas escritas por el autor. Kuromi y Baku aparecen a hacer travesuras que no quitan progreso. El tono sigue el humor de la serie, no solo su ternura.

Tres condiciones definen casi todo lo demás:

1. **El autor no puede tocar la tablet antes de la entrega.** Solo prueba en su laptop y en un celular Android.
2. **El autor es programador y no dibuja, anima ni compone.** El arte y el movimiento los produce un asistente de IA por código. El asistente ve imágenes, pero no oye ni ve movimiento.
3. **No se usa material extraído de la serie.** Ni imágenes, ni música, ni voces, ni diálogos.

La investigación de la serie y de lo que valoran sus fans está en [docs/investigacion-serie.md](docs/investigacion-serie.md).

## Análisis

### Estado de los revisores

| Mirada | Persona de EGM | Estado |
| --- | --- | --- |
| Simplicidad y YAGNI | `zoom_out` | completada en el segundo intento (el primero se cortó por límite de uso) |
| Arquitectura, costo y cuotas | `design_critic` | completada |
| Uso y ergonomía | `comprehension` | completada |
| Migración y compatibilidad | `implementation_readiness` | completada |
| Observabilidad | `codebase_details` | completada |
| Deuda técnica | `structural` | completada |
| Catalizador inventivo | `inventive_catalyst` | completada |

Los revisores corrieron como agentes generales que leyeron primero su persona de EGM, porque el plugin no está enlazado a esta carpeta. No heredaron la conversación, pero sí el `CLAUDE.md` global del usuario. Ninguno abrió URLs ni ejecutó código: lo que dicen sobre Godot y Android viene de conocimiento general. Lo que no se comprobó después está en "Sin verificar".

### Bloqueantes

Cinco problemas impiden construir el concepto tal como estaba escrito. A cada uno llegaron varios revisores por separado.

**1. El regalo puede fallar antes de mostrarse.** El primer contacto de ella con el juego es el instalador de Android, con sus avisos de seguridad. El concepto no decía cómo llega el archivo a la tablet, quién toca qué, ni qué pasa si la instalación se rechaza. Es el punto de fallo más probable y está fuera del código. Tampoco se fijaban tres cosas de las que depende poder actualizar sin borrar la partida: el identificador interno de la app, el número de versión que debe subir en cada entrega y que la v1.0 salga firmada con la clave definitiva y no con la de pruebas.

**2. La primera ejecución ocurre en hardware que nadie probó.** El concepto activaba el lápiz, los 90 Hz y el nivel de efectos "si los detecta". Eso significa que el código que corre en la tablet es justo el que nunca corrió antes. La prueba de rendimiento se hacía una sola vez, en el primer arranque, que es el peor momento para medir, y su resultado quedaba fijo.

**3. Si algo falla en la tablet, el autor no tiene cómo saber qué pasó.** La "pantalla de diagnóstico oculta" no tenía contenido, forma de abrirse ni salida. Los archivos internos de una app no se pueden leer desde fuera. Un cierre antes de los menús no deja rastro.

**4. La partida vive en un solo lugar y no hay vuelta atrás.** Los datos se borran si se desinstala la app, si se restablece la tablet o si se pierde la clave de firma. Android no permite instalar una versión anterior encima de una posterior, así que todo arreglo es una versión nueva. La copia de respaldo única se sobrescribe a los pocos segundos.

**5. El supuesto central no está probado y el plan lo probaba tarde.** Que un asistente produzca por código una My Melody que una fan reconozca y sienta viva es la mayor duda del proyecto. El plan la resolvía en la fase 3, después de dos fases de infraestructura y menús sin nada jugable. Eso además choca con la meta del autor de tener un prototipo pronto. Para el movimiento y el sonido no había método de revisión ni tope de piezas a producir.

### La tensión entre los revisores

Seis miradas piden protecciones: modo seguro, ajuste automático de calidad, contratos, registros, copias. La séptima (YAGNI) dice lo contrario: muchas de esas protecciones existen para cuidar funciones que la v1.0 no necesita, y cada protección es código nuevo que también puede fallar en la tablet.

Este documento adopta una regla para resolverlo: **si quitar una función elimina el riesgo, se quita de la v1.0. Solo se protege lo que queda.**

| Función | Riesgo que crea | Qué pasa en la v1.0 |
| --- | --- | --- |
| Grosor del trazo por presión del S Pen | Es la rama de código que nadie puede probar | Se mueve a la primera actualización, con la tablet ya accesible. En la v1.0 el grosor depende de la velocidad del trazo, igual para dedo, mouse y lápiz. |
| Niveles de calidad y prueba de rendimiento | Una medición mala degrada el juego para siempre | Se quitan. Hay un presupuesto fijo que el celular debe cumplir con margen. Sin efectos gráficos programados a medida. |
| Activar 90 Hz por detección | Rama que solo corre en la tablet | Se quita. El movimiento se calcula por tiempo transcurrido, así que se ve bien a la velocidad que entregue la pantalla. |
| Cartas remotas | Internet, un servidor que debe durar años, cartas privadas en una dirección que no lo es | Se mueven a una actualización. La v1.0 lleva dentro un año de cartas con fecha. |
| Escribir el nombre | Teclado en pantalla sobre un dispositivo sin probar | Se quita. El juego ya la conoce: nombre y cumpleaños van incluidos. |
| Borrado de datos, modo zurdos, velocidad del texto | Opciones para un público que no existe | Se quitan. El autor sabe con qué mano dibuja ella. Android ya permite borrar los datos de una app. |
| Gastar Notas al pedir un deseo | Dos contadores que confunden y pueden alejar la meta | Un solo contador que solo sube. Cada ocho Notas hay un deseo. |
| Minijuego de gestos con la Melody Takt | Un segundo sistema de entrada que afinar sin el dispositivo | Pasa a una actualización. Kuromi y Baku entran como visitantes con una escena cómica. |
| Muebles y recetas como recompensa | Doce desbloqueos con arte propio, más colocación y persistencia | Pasan a actualizaciones. Las recompensas son textos del autor y colores o adornos nuevos para el glaseado. |
| Motor de necesidades que decaen | Simula estados malos que el diseño de cero castigo prohíbe | Se quita. El estado son marcas de tiempo y contadores; "tiene hambre" se calcula al abrir. |
| Datos de trazo de cada torta | Un formato más que mantener | Se quitan. El álbum son imágenes en una carpeta, con tope. |

### La elección de motor queda reabierta

El autor aceptó Godot 4 después de la auditoría. Esa recomendación se hizo cuando se daba por hecho que habría una prueba en la tablet, y antes de saber que todo el arte sería SVG escrito por código y que la instalación la haría ella sola. Con esas tres condiciones, el revisor YAGNI señala que una app web instalada desde el navegador resuelve cuatro cosas que en Godot hay que construir o ensayar:

- Dibuja el SVG tal cual. Lo que el asistente revisa es lo que ella ve. Godot convierte el SVG a imagen al importarlo y solo entiende una parte del formato.
- Entrega dedo, mouse y lápiz en un mismo tipo de evento, con presión y con el tipo de puntero. En Godot no está verificado cómo llega el S Pen.
- No hay APK, clave de firma ni bloqueo de instalación. Se abre un enlace y se agrega a la pantalla de inicio.
- Actualizar es publicar de nuevo. Una carta nueva o un arreglo llegan sin reinstalar, y se puede volver a la versión anterior.

La web tiene riesgos propios que nadie midió: el rendimiento de SVG animado a 2560x1600, el guardado en el almacenamiento del navegador (se pierde si ella borra los datos del sitio), que la primera carga pide internet y que las cartas quedarían en una dirección pública.

La comparación cuesta poco, porque la hoja de modelo ya será un SVG visto en un navegador. La fase 0 hace esa prueba antes de instalar nada de Android.

### Problemas mayores que siguen en pie

- **El lápiz como puntero.** Viene con la tablet y ella lo usará para tocar todo, no solo para dibujar. Si llega como evento de mouse y la interfaz solo atiende toques, los botones no responden. Toda la interfaz debe responder igual a mouse, dedo y lápiz, con una sola ruta de entrada.
- **Tiempo.** Saludo, visitas, cartas con fecha y "días juntas" no pueden leer el reloj cada uno por su cuenta. Falta regla para un reloj que retrocede, un cambio de zona horaria o una ausencia de meses.
- **Fidelidad del guardado.** En Godot, los números del JSON vuelven como decimales y las claves como texto, así que un estado puede cambiar al guardarse y cargarse.
- **Orden de lo que pasa al abrir.** Saludo, visitas, carta y Kuromi coinciden. Alguien tiene que decidir el orden y qué pasa si Android cierra la app a mitad de una recompensa.
- **Piezas del personaje.** Hace falta un acuerdo escrito entre las piezas dibujadas y el código que las mueve: nombres, puntos de giro y orden de capas.
- **Sonido.** Es la superficie más grande con el control más débil: lo produce quien no oye y lo revisa quien no compone.
- **Identidad de la versión.** Hay que poder saber qué versión corre en la tablet y qué archivo exacto se entregó.

### Lo que la revisión no puede resolver

- La primera semana de ella con el juego sigue siendo la primera prueba real.
- Los dispositivos sustitutos no reproducen todo junto: lápiz, 90 Hz y pantalla completa a la vez.
- Un gráfico del sonido detecta saturación y silencios. No dice si la música agrada.
- Nada de lo que se produzca va a sonar como la banda sonora de la serie. La fidelidad queda en el tono, los personajes y la estructura.

### Resultado que se busca

La primera sesión en la tablet no ejecuta nada que no haya corrido igual en el celular. Ningún fallo único borra lo que ella creó. Si algo sale mal, ella puede copiar un resumen y mandárselo al autor.

## Objetivos y no objetivos

**Dentro de la v1.0**

- Una habitación y el jardín.
- Cuidado básico: comer, bañar, acariciar, dormir. Sin castigo por ausencia.
- Decorar tortas con el dedo o el lápiz, con deshacer, y álbum de fotos.
- Notas Rosas: un contador hasta 100, con un deseo cada ocho.
- Dos o tres visitantes en el jardín. Kuromi y Baku entre ellos, con escenas cómicas y páginas de la Kuromi Note.
- Un año de cartas del autor, entregadas por fecha.
- Arranque, título con tarjeta de perfil y opciones de volumen al estilo de la era DS y Wii.
- Pantalla de diagnóstico con botón de copiar. Exportar e importar la partida.

**Fuera de la v1.0**

- Presión del S Pen, cartas remotas, minijuego de la Melody Takt, muebles y recetas como recompensa.
- Taller de costura de capuchas, habitación de Kuromi como segunda mascota, cuaderno de dibujo libre, más habitaciones.
- Eventos de temporada con arte propio. La v1.0 solo cambia frases en ciertas fechas (por ejemplo, el cumpleaños de Kuromi el 31 de octubre).
- Mecánicas que dependan de seguir el ritmo de la música.
- Niveles de calidad gráfica, efectos programados a medida, varias partidas.
- Publicación en tiendas.

## Alternativas consideradas

| Alternativa | Resultado |
| --- | --- |
| C# con Godot .NET | Rechazada por el autor tras la auditoría: la exportación de C# a Android sigue marcada como experimental, agrega pausas de memoria y ocupa más disco. |
| Unity, Android nativo, Flutter, Defold | Rechazadas por el autor: no rinden mejor en este juego, y pesan más en la laptop o no traen herramientas de animación y escenas. |
| App web instalada desde el navegador | Rechazada al principio por el asistente por riesgo de micro-pausas. **Reabierta por la revisión**: con arte en SVG, sin acceso a la tablet e instalación por APK, elimina cuatro riesgos. Se decide con la prueba de la fase 0. |
| Resolución base 1920x1200 | Rechazada por el autor: se vería blanda al estirarse a 2560x1600. |
| Casa panorámica con zoom libre | Rechazada por el autor: obliga a texturas enormes o se ve borrosa. |
| Guardado encriptado | Rechazada por el autor: no protege nada en un regalo y agrega una forma de fallar. |
| Mascota que se enferma o entristece si no se juega | Rechazada primero por el autor (diseño de cero castigo). El 2026-11-15 el autor la retomó en parte: se ensucia, se entristece y llora si se la olvida, pero no se enferma ni se pierde progreso. |
| Arte dibujado a mano por el autor | Rechazada por el autor: no sabe dibujar. |
| Generadores de imágenes para el arte final | Rechazada por el asistente: no mantienen igual al personaje entre imágenes ni entregan piezas separadas. |
| Música, voces o imágenes extraídas del anime | Rechazada por el asistente: son obras con derechos de autor. |
| Imitar la voz de una actriz de doblaje | Rechazada por el asistente: es la voz de una persona real. Además no hay evidencia de un doblaje latino de la serie. |
| Personaje plano en SVG, hecho con óvalos | Rechazada por el autor el 2026-11-14 tras ver la primera ronda de la fase 0: se sentía genérica, la mirada no se notaba y el personaje no se desplazaba. La segunda ronda prueba un modelo 3D hecho por código, con contorno de tinta y sombreado de dos tonos (`prototipo-web/3d/`). Si se aprueba, las secciones de arte y animación de este documento se reescriben para 3D. |
| Esqueleto con fotogramas clave | Rechazada por el asistente: no puede juzgar movimiento hecho a mano. Se usa animación por código, que se puede probar. |
| Música y efectos compuestos por el asistente | Reemplazada tras la revisión: nadie en el proyecto puede juzgar una composición nueva. Se usan efectos de bibliotecas libres y melodías de dominio público. |
| Prueba de rendimiento y niveles de calidad | Rechazada tras la revisión: un juego 2D de mascota no los necesita y pueden degradarlo por error. |
| Detectar lápiz y 90 Hz para cambiar de modo | Rechazada tras la revisión: crea código que solo corre en la tablet. |
| Dos contadores de Notas, con gasto al pedir deseos | Rechazada tras la revisión: confunde y puede alejar la sorpresa final. |
| Empezar por el núcleo sin arte | Reemplazada tras la revisión por una fase 0 que prueba primero el arte, el movimiento y el sonido. |

## Decisiones clave y preparación del siguiente paso

### Arranque y menús

- **Secuencia.** Tarjeta de dedicatoria (solo la primera vez, en lugar del aviso de salud de las consolas), logotipo con una melodía corta y pantalla de título. Cada pantalla se salta con un toque.
- **Título y perfil en una sola pantalla.** My Melody animada, el logotipo y la tarjeta de perfil con el nombre de ella, los días juntas y las Notas Rosas. Se entra tocando la tarjeta. En el uso diario son dos toques hasta la casa.
- **Sin configuración inicial.** El juego ya sabe su nombre y su cumpleaños. La hora es la del sistema.
- **Opciones.** Volumen de música, de efectos y de voces, cada uno con un sonido de prueba al moverlo. Créditos. Acceso al diagnóstico.
- **Kit de interfaz.** Cada control tiene animación al presionar y tres sonidos distintos: mover, confirmar y cancelar. Ninguna pantalla cambia de golpe.
- **Recordatorio de descanso** tras una sesión larga, dicho por My Melody.

### Animación

- Por código: una biblioteca de poses, transiciones entre poses y resortes para las orejas. Respiración, parpadeo y mirada hacia el dedo o el lápiz. Estirar y aplastar al tocar.
- Todo el movimiento se calcula por tiempo transcurrido, con un tope por cuadro. Se prueba a 30, 60, 90 y 120 cuadros por segundo y con pausas de 250 ms y 2 s.
- Cada personaje tiene una ficha de piezas: nombres, puntos de giro, capas y expresiones. El código usa esos nombres, nunca coordenadas.
- Antes de producir en serie se aprueba una "hoja de movimiento" con unas diez piezas base: duraciones, curvas y fuerza de los resortes.
- El asistente revisa tiras de cuadros generadas por el propio motor. El autor revisa el movimiento en una escena visor.

### Fidelidad a la serie

- **Estructura.** 100 Notas Rosas como meta, como en la temporada 1, y un deseo cada ocho notas, por la escala de la temporada 2.
- **Humor.** My Melody dulce y despistada, que hiere sin querer. Kuromi gruñona y querible, con su Kuromi Note. Baku con su "-zona". Los consejos de la mamá de My Melody como frase del día.
- **Final.** Al llegar a 100, My Melody le pide ayuda a quien juega, como en los finales de temporada. Después brotan las aguas termales y se abre la sorpresa escrita por el autor.
- **Nombres.** Se conservan los originales (Melody Takt, Kuromi Note, Mari Land, "onegai", "-zona"), porque no se pudo verificar cómo se tradujeron. Queda un glosario fijo antes de escribir textos.
- **Encargos del día** titulados con la fórmula de deseo de los episodios ("Ojalá...").
- Todos los textos son originales.

### Sonido

- **Efectos de interfaz:** de bibliotecas libres de derechos (licencia CC0), ya afinados por alguien que oye.
- **Música:** melodías de dominio público tocadas con timbre de cajita musical. El asistente transcribe las notas y genera el archivo en la laptop. Cualquier persona puede oír si una melodía conocida está mal tocada, cosa que no pasa con una composición nueva.
- **Voces de balbuceo:** se prueban primero solo con My Melody. Si cansan, se quitan. Tienen volumen propio.
- El juego solo reproduce archivos. No genera sonido mientras corre.
- Cada archivo pasa controles automáticos: volumen máximo, saturación, duración y unión del bucle.
- Propuesta de tope para la v1.0: cinco piezas de música (título, día, noche, tortas, Kuromi).

### Bucle y progresión

- **Encargos del día** dan Notas Rosas. El contador solo sube.
- Cada ocho Notas hay un **deseo**: una carta o recuerdo del autor, una página de la Kuromi Note, o un color o adorno nuevo para el glaseado.
- Después de 100 el juego sigue.
- Kuromi y Baku solo aparecen entre actividades, nunca en medio de una torta. No bloquean nada.
- Un solo director ordena lo que pasa al abrir. Cada recompensa es un único cambio de estado con un único guardado.
- Prueba automática: una partida completa de 0 a 100 con reloj falso, para comprobar que la sorpresa final siempre se alcanza. El autor tiene un desbloqueo alterno desde el diagnóstico.

### Guardado y tiempo

- El estado son marcas de tiempo y contadores. Lo demás se calcula al abrir.
- Escritura en un archivo temporal que luego reemplaza al principal, una copia de respaldo y un número de versión del formato. La primera conversión de formato se escribe cuando exista un segundo formato.
- Prueba obligatoria: guardar, cargar y comparar que el estado es idéntico.
- Un archivo ilegible se aparta, nunca se sobrescribe.
- Una copia diaria durante siete días.
- Exportar e importar la partida, con el álbum, a un archivo que ella puede ver. Es la única defensa contra una desinstalación.
- El álbum son imágenes de tamaño fijo en una carpeta, con tope. El juego lista la carpeta; el guardado no las referencia.
- Un solo servicio de tiempo. Guarda instantes en hora universal. Un intervalo negativo vale cero y uno enorme se recorta. Se calcula igual al abrir que al volver de segundo plano. Se prueba con reloj hacia atrás, salto de diez años y 29 de febrero.

### Diagnóstico

- El juego anota la última etapa de arranque alcanzada, en un archivo aparte del guardado.
- Pantalla de diagnóstico: versión, modelo, velocidad real de pantalla, tipos de puntero vistos, estado del último guardado y errores recientes. Botón "Copiar diagnóstico". Propuesta de acceso: mantener presionado el número de versión en opciones.
- Ningún dato sale de la tablet sin una acción de ella.
- Criterio de entrega: cero errores registrados en una sesión completa de prueba.

### Entrega

- **Propuesta principal: el autor instala en persona el día de la entrega.** Así la primera ejecución es acompañada y, desde ese momento, la tablet deja de ser inaccesible: todo lo demás se puede corregir.
- Si se mantiene Godot: identificador de la app congelado antes del primer APK, número de versión que sube en cada entrega, clave de firma guardada en dos lugares fuera de la laptop y versión exacta del motor anotada en el proyecto.
- Si se mantiene Godot, al cierre de cada fase: APK firmado con la clave definitiva, instalado en el celular y actualizado encima de la versión anterior con la partida intacta.
- Bloqueo de instalación de Samsung (verificado el 2026-11-14): viene activado de fábrica solo en equipos que salieron a la venta con One UI 6.1.1 o posterior. Los equipos actualizados conservan el ajuste que tenían. La Tab S9 FE+ es anterior, así que probablemente está desactivado, pero hay que revisarlo al instalar. Se desactiva en Ajustes, Seguridad y privacidad.

### Pruebas sin la tablet

| Riesgo | Sustituto |
| --- | --- |
| Procesador gráfico y capa de Samsung | Un teléfono con el mismo chip. Los revisores citan el Galaxy A54 5G y el A35 5G; confirmar el modelo antes de conseguirlo. |
| Instalación y bloqueos | Cualquier Samsung reciente. |
| S Pen como puntero | Cualquier Samsung con lápiz. |
| Encuadre 2560x1600 | Capturas automáticas a ese tamaño exacto en la laptop. |
| Tamaño de los botones | Impresión en papel a escala real (26,7 x 16,7 cm). |
| Equipo Samsung real a distancia | Samsung Remote Test Lab. Existe y acepta instalar un APK desde el navegador. No se pudo confirmar que ofrezca la Tab S9 FE+. Pide una cuenta de Samsung. El archivo que se suba no debe llevar las cartas personales. |

### Fases

0. **Corte vertical.** Hoja de modelo de My Melody en SVG. My Melody respirando, parpadeando y reaccionando al toque con un sonido, primero en el navegador y abierta en el celular. Con ese resultado se decide el motor. Tiene un límite de intentos y un plan B de estilo.
1. **Núcleo.** Servicio de tiempo, guardado, pruebas y diagnóstico.
2. **Cascarón.** Arranque, título con tarjeta de perfil, opciones y kit de interfaz.
3. **Casa y cuidado.**
4. **Tortas y álbum.**
5. **Notas, deseos, jardín con visitantes y cartas.**
6. **Pulido, ensayo de entrega y v1.0.**

### Decisiones pendientes del autor

Las cuatro primeras revierten o cambian algo que el autor ya había aceptado.

1. **Motor.** Resuelta el 2026-11-14: el autor pidió hacer la prueba web de la fase 0 antes de fijar Godot. La prueba está en `prototipo-web/`. Falta su veredicto después de verla en el celular.
2. **Presión del S Pen.** Aceptar que llegue en la primera actualización y no en la v1.0.
3. **Cartas remotas.** Aceptar que la v1.0 lleve solo cartas incluidas.
4. **Recorte de la v1.0.** Aceptar que el minijuego de la Melody Takt, los muebles y las recetas pasen a actualizaciones, y que no haya configuración inicial ni borrado de datos.
5. **Quién instala.** El autor en persona, o ella sola con una guía.
6. **Dispositivos sustitutos.** Si puede conseguir prestado un Samsung, y cuál.
7. **Ritmo.** Cuántos días deberían pasar hasta la Nota 100. Propuesta inicial: dos o tres Notas por día, entre cinco y siete semanas.
8. **Límite de la fase 0.** Cuántos intentos u horas antes de pasar al plan B de estilo, y cuál es ese plan B.
9. **Datos que faltan.** Horas semanales disponibles, modelo del celular de prueba, nombre de autor, cómo debe llamar My Melody a la destinataria y con qué mano dibuja ella.

### Sin verificar

- Cómo entrega Godot los eventos del S Pen en Android.
- Cómo rinde un SVG animado a 2560x1600 en el navegador de la tablet.
- Que Google exigirá verificar al desarrollador de las apps instaladas fuera de la tienda, y desde cuándo en el país del autor. Un revisor lo menciona; no se comprobó.
- Cuánto disco ocupan las herramientas de Android. Un revisor estima entre 10 y 15 GB.
- Qué versión de la serie vio la destinataria y en qué idioma.
- Que guardar un archivo en una carpeta visible para ella no pida permisos en su versión de Android.

### Siguiente paso

Cuando el autor resuelva las decisiones pendientes y esté de acuerdo con este documento, se pasa al diseño detallado con la skill `egm-draft`, que toma este archivo como entrada.
