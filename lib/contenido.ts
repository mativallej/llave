// Every sentence the public page says, in one place. The copy rules live in AGENTS.md and apply here:
// no network and no other agencies; Falkenberg's five guarantees only behind their flag; no home delivery,
// no end-to-end deadline, and only one of the two numbers is verifiable.

export const CONTENIDO = {
  marca: "Falkenberg Meyer Automotores",
  lugar: "Rafaela, Santa Fe",

  titular: "Contanos qué auto tenés y cuál querés.",
  bajada:
    "Si el que querés está acá, ves el precio en el momento. Si no, Falkenberg sale a buscarlo. El tuyo lo tasa alguien que lo ve.",
  placeholder: "Por ejemplo: tengo un Gol 2015 y quiero algo más grande",
  enviar: "Enviar",
  sacarFoto: "Sacar o elegir fotos",
  chips: ["Quiero cambiar mi auto", "Busco un usado", "Busco un 0km"],

  asistente: {
    nombre: "Tuerca",
    aclaracion: "Tuerca es el asistente de Falkenberg. Cuando el pedido está, sigue un vendedor.",
    escribiendo: "Tuerca está escribiendo…",
    error: "Se cortó la conexión. Probá mandarlo de nuevo.",
  },

  panel: {
    titulo: "Tu pedido",
    entrega: "Entregás",
    noEntrega: "No entregás auto",
    seLleva: "Te llevás",
    busca: "Buscás",
    zona: "Zona",
    fotos: "Fotos",
    pendiente: "Todavía no",
  },

  fila: {
    agregarFotos: "Agregar fotos",
    fotos: (n: number) => (n === 1 ? "1 foto" : `${n} fotos`),
    elegirZona: "Elegir zona",
  },

  fotos: {
    titulo: "Las cinco fotos del auto que entregás",
    texto: "Con estas fotos se prepara la visita. No hace falta que estén perfectas.",
    vistas: ["Frente, tres cuartos", "Lateral", "Atrás, tres cuartos", "Interior delantero", "Tablero con el kilometraje"],
    sacar: "Sacar foto",
    elegir: "Elegir de la galería",
    noLasTengo: "No las tengo ahora",
    mensajeNoLasTengo: "No las tengo ahora.",
    mensajeEnvio: (n: number) => (n === 1 ? "Te mando una foto." : `Te mando ${n} fotos.`),
    subiendo: (n: number, total: number) => `Subiendo ${n} de ${total}…`,
  },

  zona: {
    titulo: "¿De dónde sos?",
    texto: "Tocá tu pueblo o ciudad. Los anillos marcan 50 y 100 km desde Rafaela.",
    otra: "Otra zona",
    otraPlaceholder: "Escribí tu pueblo o ciudad",
    elegir: "Elegir",
    mensaje: (zona: string) => `Soy de ${zona}.`,
  },

  tarjeta: {
    loQuiero: "Lo quiero",
    parecido: "Algo parecido",
    mensajeLoQuiero: (nombre: string) => `Quiero el ${nombre}.`,
    mensajeParecido: (nombre: string) => `Busco algo parecido al ${nombre}.`,
    precioAclaracion: "Precio público, el mismo para todos.",
  },

  grilla: {
    titulo: "Autos de esta semana",
    texto: "El precio es el mismo para todos y lo ves antes de sentarte.",
    vacia: "Estamos cargando el stock de esta semana.",
  },

  cierre: {
    titulo: "Revisá tu pedido",
    texto: "Para mandárselo a Falkenberg, dejá tu nombre y tu WhatsApp. Nadie te va a llamar a los dos minutos.",
    nombre: "Tu nombre",
    telefono: "Tu WhatsApp",
    telefonoAyuda: "Con la característica, por ejemplo 3492 15 123456.",
    enviar: "Mandar el pedido",
    enviando: "Mandando…",
  },

  enviado: {
    titulo: (ref: string) => `Listo. Tu pedido es ${ref}.`,
    whatsapp: "Mandáselo a Falkenberg por WhatsApp",
    whatsappTexto: "Se abre WhatsApp con el pedido ya escrito. Lo mandás vos.",
    sigue: "Falkenberg lo revisa y te escribe por WhatsApp.",
    link: "En este link ves en qué está tu pedido, cuando quieras:",
    otro: "Hacer otro pedido",
  },

  recibo: {
    titulo: (ref: string) => `Tu pedido ${ref}`,
    ver: "Ver en qué está",
    borrar: "Borrar",
  },

  comoFunciona: {
    titulo: "Cómo funciona",
    pasos: [
      {
        titulo: "Contás qué tenés y qué buscás",
        texto: "Si el auto que querés está en el stock, el precio lo ves acá. Si no está, Falkenberg sale a buscarlo.",
      },
      {
        titulo: "Falkenberg mira el tuyo",
        texto: "Con las fotos se prepara la visita. El valor del tuyo lo pone alguien que lo ve en persona.",
      },
      {
        titulo: "Una visita, con turno",
        texto: "Ves los dos números y la diferencia. En tu link seguís qué pasó, qué falta y qué sigue.",
      },
    ],
  },

  garantias: {
    titulo: "Cómo trabajamos",
    // Product decisions: always visible.
    producto: [
      "El precio del auto que te llevás lo sabés antes de sentarte",
      "No te tiramos un precio por WhatsApp para engancharte",
      "Nadie te va a llamar a los dos minutos",
      "Te decimos qué falta para darte el número",
      "Una sola visita, con turno",
    ],
    // Falkenberg pays for these. Only rendered while config.garantias_falkenberg is true.
    falkenberg: [
      "No renegociamos por lo que ya estaba informado",
      "El auto que te llevás pasa por el taller y queda cubierto",
      "La propuesta vale 7 días",
      "Te citamos en 48 horas hábiles",
      "Los trámites los hacemos nosotros",
    ],
  },
} as const
