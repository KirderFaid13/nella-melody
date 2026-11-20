/* Nella Melody · los textos de los deseos y la sorpresa final.
   Cada ocho Notas Rosas se cumple un deseo: se turnan una carta de Nico y una página de la
   Kuromi Note. Si una carta está vacía, en su lugar sale la siguiente página de Kuromi:
   así nunca aparece un texto a medio escribir.

   ✎ PARA NICO: estas cartas son un borrador escrito con tu voz. Léelas y cámbialas
   con tus palabras, tus apodos y sus recuerdos juntos: van a valer mucho más.
   La primera llega con la Nota 8, la segunda con la 24, la tercera con la 40, y así cada
   16 Notas (unos cinco o seis días de juego entre una y otra). Seis cartas cubren las 100.
   Formato: { titulo: '...', texto: '...' }. Usa \n\n para separar párrafos. */
export const CARTAS = [
  {
    titulo: 'Una carta para ti',
    texto: 'Hola, mi princesa:\n\n' +
      'Si estás leyendo esto, ya juntaste tus primeras ocho Notas Rosas. ¡Qué rápido!\n\n' +
      'Hice este pequeño mundo pensando en ti, pieza por pieza: la cocina, el baño, las flores y hasta el columpio. ' +
      'Cada vez que cuidas a My Melody, me gusta imaginar que también te estoy cuidando un poquito a ti.\n\n' +
      'Gracias por jugar. Cada nota que juntas es un "te quiero" escondido.\n\n' +
      'Tu Nico'
  },
  {
    titulo: 'Para mi amorcito',
    texto: 'Amorcito:\n\n' +
      'Me encanta pensar que ahora mismo estás con la tablet, dándole de comer a My Melody o empujándola en el columpio.\n\n' +
      'Ella está feliz porque la cuidas con paciencia y con cariño, igual que haces con las personas que quieres. ' +
      'Eso es algo que admiro mucho de ti.\n\n' +
      'No te olvides de cuidarte tú también: come rico, descansa y sonríe, que tu sonrisa es mi parte favorita del día.\n\n' +
      'Te quiero mucho,\nNico'
  },
  {
    titulo: 'Un secreto',
    texto: 'Princesa:\n\n' +
      'Te cuento un secreto: mientras armaba este juego, cada vez que algo me salía bien pensaba "a ella le va a gustar". ' +
      'Y cada vez que algo me salía mal, lo arreglaba pensando lo mismo.\n\n' +
      'Así que este juego, en el fondo, está hecho de muchas ganas de verte feliz.\n\n' +
      'Si algún día te aburres de regar flores, ven a buscarme, que yo nunca me aburro de ti.\n\n' +
      'Tu Nico'
  },
  {
    titulo: 'Para los días difíciles',
    texto: 'Mi amor:\n\n' +
      'Hay días que pesan más que otros. Si hoy es uno de esos, quiero que sepas que no estás sola: estoy contigo, ' +
      'aunque sea a través de esta conejita rosada.\n\n' +
      'Respira, date un mimo y recuerda todo lo que ya lograste. Eres más fuerte de lo que crees y más linda de lo que te imaginas.\n\n' +
      'Y si necesitas un abrazo de verdad, ya sabes a quién pedírselo.\n\n' +
      'Siempre tuyo,\nNico'
  },
  {
    titulo: 'Lo que me gusta de ti',
    texto: 'Princesa:\n\n' +
      'Me gusta cómo te ríes, cómo me miras cuando algo te da curiosidad y cómo haces que los días normales se sientan especiales.\n\n' +
      'Me gusta que seas tú, así, tal cual eres.\n\n' +
      'Ya llevas muchas Notas Rosas y muchos días cuidando a My Melody. Gracias por volver una y otra vez: ' +
      'cada vez que entras, este mundito se ilumina, igual que el mío cuando estás cerca.\n\n' +
      'Te amo,\nNico'
  },
  {
    titulo: 'Ya casi',
    texto: 'Amorcito de mi vida:\n\n' +
      '¡Ya casi llegas a las 100 Notas Rosas! Eso quiere decir que estuviste aquí muchos días, cuidando, regando, bañando y columpiando.\n\n' +
      'Quiero que sepas que me hace muy feliz que este regalito te haya acompañado tanto tiempo.\n\n' +
      'Cuando llegues a la Nota 100 te espera una sorpresa. No te adelanto nada… solo que My Melody va a necesitar tu ayuda.\n\n' +
      'Tu Nico, que te quiere muchísimo'
  }
];

/* La sorpresa de la Nota 100. ✎ Nico: este es el momento más especial del juego. */
export const SORPRESA_FINAL = {
  titulo: 'Para la dueña de las 100 Notas Rosas',
  texto: 'Mi querida princesa:\n\n' +
    'Lo lograste. Cien Notas Rosas, una por una, día tras día. My Melody cumplió su gran deseo gracias a ti, ' +
    'y ahora en el patio hay aguas termales calientitas para que descansen juntas.\n\n' +
    'Cuando empecé a hacer este juego quería regalarte algo que no se acabara en un día, algo que te acompañara un tiempo ' +
    'y te recordara, cada vez que lo abrieras, lo mucho que te quiero.\n\n' +
    'Gracias por cuidar a My Melody, por volver cada día y por dejarme ser parte de tu vida. ' +
    'Eres mi persona favorita en el mundo.\n\n' +
    'El juego no termina aquí: My Melody te va a seguir esperando con hambre, con ganas de bañarse y de columpiarse. ' +
    'Y yo también te voy a seguir esperando, siempre.\n\n' +
    'Te amo, mi amorcito.\n\n' +
    'Tu Nico'
};

/* Páginas del diario de Kuromi. Textos originales, con su humor gruñón. */
export const PAGINAS_KUROMI = [
  'Hoy My Melody me saludó por encima de la cerca. ¡Se suponía que YO la estaba espiando a ELLA!\n\nAnotado: sonrisa sospechosa.',
  'My Melody probó mi rakkyo y puso cara de limón.\n\n¡Qué desperdicio de rakkyo! Venganza número 58.',
  'La vi dar una vuelta entera en el columpio. Lo admito: fue un poquito genial.\n\nEsto NO cuenta como cumplido.',
  'Me dijo "Mi mamá dice que hay que compartir" y me dio media galleta.\n\n¡La media más chiquita! Anotado.',
  'Alguien riega sus flores todos los días. Yo también tengo plantas. Son de rakkyo.\n\nNo se las voy a mostrar a nadie.',
  'Me escondí detrás de la cerca y me encontró en dos segundos.\n\nMañana me escondo mejor. Plan secreto número 12.',
  'Hoy la bañaron y salió cantando "¡Quedé limpiecita!".\n\nYo me baño sola y nadie me aplaude. Anotado.',
  'Alguien la cuida todos los días y ella está feliz.\n\n… No me importa. Lo anoto igual, por si acaso.',
  'Intenté asustarla y me ofreció un pedazo de pastel de almendras.\n\nNo me lo comí por orgullo. Bueno, solo un poquito.',
  'Le pregunté qué deseo había pedido. Me dijo que era un secreto.\n\n¡Yo soy la de los secretos! Venganza número 59.',
  'Hoy no hice ninguna travesura. Estaba cansada.\n\nQue nadie lo sepa.',
  'Página para cuando llegue a 100 Notas Rosas: la dejo en blanco.\n\nNo porque me dé curiosidad. Para nada.'
];
