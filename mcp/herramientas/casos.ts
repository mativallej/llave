import "server-only"
import { z } from "zod"
import {
  aceptoPropuesta,
  type Caso,
  agendarCita,
  agregarNota,
  cargarTasacion,
  casoPorRef,
  cerrarVenta,
  conseguido,
  ErrorCaso,
  eventosDelCaso,
  historialTelefono,
  listarCasos,
  llegaronFotos,
  marcarInspeccionado,
  marcarVentaNueva,
  notasDelCaso,
  perderCaso,
  publicarPropuesta,
} from "@/lib/caso/caso"
import { ESTADOS_ABIERTOS, type Estado, esEstado, NOMBRE_ESTADO } from "@/lib/caso/estados"
import { verPedido } from "@/lib/pedido/lectura"
import { AYUDA_TELEFONO, normalizarTelefono } from "@/lib/pedido/telefono"
import { definir } from "../herramienta"

// The case's state machine, by Claude. Each writing tool is one transition and calls the same operation as
// the case link, so both leave the same event. Nothing here returns the value of the car the client hands
// in: cargar_tasacion takes it, from Andrés, and that's the only place it goes through.

const REF = z.string().regex(/^LL-\d{4}$/).describe("La referencia del caso, por ejemplo LL-4821")
const ESTADOS = ["cerrado", ...ESTADOS_ABIERTOS] as [Estado, ...Estado[]]

function estadoLegible(caso: Pick<Caso, "estado" | "cerro">): string {
  if (caso.estado === "cerrado") return caso.cerro ? "Venta cerrada" : "Perdido"
  return esEstado(caso.estado) ? NOMBRE_ESTADO[caso.estado] : caso.estado
}

// What a tool says back after moving a case: where it is now. Never the appraisal.
const despues = (caso: Caso) => ({ ref: caso.ref, estado: caso.estado, estado_legible: estadoLegible(caso) })

export const herramientasCasos = [
  definir({
    nombre: "listar_casos",
    descripcion:
      "Los casos, del más nuevo al más viejo. Sin estado, solo los abiertos. Con antiguedad, solo los que no tienen movimiento hace al menos esos días.",
    lectura: true,
    entrada: {
      estado: z.enum(ESTADOS).optional().describe("Un estado puntual. Sin estado, todos los abiertos."),
      antiguedad: z.number().int().min(0).max(365).optional().describe("Días mínimos sin movimiento"),
    },
    ejecutar: async ({ estado, antiguedad }) => {
      const casos = await listarCasos({ estados: estado ? [estado] : ESTADOS_ABIERTOS, sinMovimientoDias: antiguedad })
      return casos.map((caso) => ({
        ...despues(caso),
        nombre: caso.nombre,
        telefono: caso.telefono,
        creado_en: caso.creado_en,
        ultimo_movimiento: caso.ultimo_evento,
        cita: caso.cita_en,
        proximo_aviso: caso.proximo_aviso,
        propuesta_vence: caso.vence_prop,
      }))
    },
  }),

  definir({
    nombre: "ver_caso",
    descripcion:
      "Un caso entero: el pedido, el estado, la cita, la propuesta, las marcas, lo que pasó con fecha, las notas y el link del caso. Lo que no tiene herramienta (no vino, el próximo aviso de una búsqueda, corregir un dato, la renegociación, pedirle algo al cliente) se hace desde ese link.",
    lectura: true,
    entrada: { ref: REF },
    ejecutar: async ({ ref }, { origen }) => {
      const caso = await casoPorRef(ref)
      const [pedido, eventos, notas, otros] = await Promise.all([
        verPedido(caso.ref, origen),
        eventosDelCaso(caso.id),
        notasDelCaso(caso.id),
        historialTelefono(caso.telefono, caso.id),
      ])
      return {
        ...pedido,
        ...despues(caso),
        cita: caso.cita_en,
        proximo_aviso: caso.proximo_aviso,
        propuesta_vence: caso.vence_prop,
        motivo_perdida: caso.motivo_perdida,
        se_renegocio: caso.renegocio,
        venta_nueva: caso.venta_nueva,
        // Only the type and the date: an event's meta isn't for reading out.
        lo_que_paso: eventos.map(({ tipo, en }) => ({ tipo, en })),
        notas: notas.map(({ texto, autor, creada_en }) => ({ texto, autor, en: creada_en })),
        otros_pedidos_del_telefono: otros.length,
      }
    },
  }),

  definir({
    nombre: "historial_telefono",
    descripcion: "Todos los casos de un teléfono, con su estado y su fecha. El teléfono se puede escribir de cualquier forma.",
    lectura: true,
    entrada: { telefono: z.string().max(40).describe("El teléfono, con la característica") },
    ejecutar: async ({ telefono }) => {
      const normalizado = normalizarTelefono(telefono)
      if (!normalizado) throw new ErrorCaso(`No entiendo ese teléfono. ${AYUDA_TELEFONO}`)
      const casos = await historialTelefono(normalizado)
      return { telefono: normalizado, casos: casos.map((c) => ({ ...c, estado_legible: estadoLegible(c) })) }
    },
  }),

  definir({
    nombre: "llegaron_fotos",
    descripcion:
      "El cliente mandó las fotos del auto que entrega (por WhatsApp o en persona), y el caso pasa a esperar la cita. Las fotos en sí no pasan por acá: esto marca el paso.",
    lectura: false,
    entrada: { ref: REF },
    ejecutar: async ({ ref }) => despues(await llegaronFotos((await casoPorRef(ref)).id)),
  }),

  definir({
    nombre: "agendar_cita",
    descripcion: "Agenda la cita de un caso que la espera. Pasa a 'Cita agendada'.",
    lectura: false,
    entrada: {
      ref: REF,
      fecha: z
        .string()
        .datetime({ offset: true })
        .describe("Día y hora, con el huso de Argentina. Por ejemplo 2026-10-29T10:00:00-03:00"),
    },
    ejecutar: async ({ ref, fecha }) => despues(await agendarCita((await casoPorRef(ref)).id, fecha)),
  }),

  definir({
    nombre: "marcar_inspeccionado",
    descripcion:
      "El cliente vino a la cita. Si entrega un auto pasa a esperar la tasación; si no, a la propuesta, o a la búsqueda si lo que quiere no está en stock.",
    lectura: false,
    entrada: { ref: REF },
    ejecutar: async ({ ref }) => despues(await marcarInspeccionado((await casoPorRef(ref)).id)),
  }),

  definir({
    nombre: "cargar_tasacion",
    descripcion:
      "Solo Andrés. Carga el valor del auto que entrega el cliente, el número que puso él después de verlo en persona. Nunca un número que propongas vos ni uno que salga de otra herramienta.",
    lectura: false,
    roles: ["falkenberg"],
    entrada: {
      ref: REF,
      valor_toma: z.number().int().positive().describe("En pesos, el número que dijo Andrés"),
    },
    ejecutar: async ({ ref, valor_toma }) => despues(await cargarTasacion((await casoPorRef(ref)).id, valor_toma)),
  }),

  definir({
    nombre: "marcar_conseguido",
    descripcion:
      "Falkenberg consiguió el auto que el cliente buscaba: el caso pasa a la propuesta con ese auto y su precio. El precio es el del auto que se lleva el cliente, público; lo dice quien opera, nunca lo propongas vos.",
    lectura: false,
    entrada: {
      ref: REF,
      auto: z.string().min(1).max(120).describe("Qué auto se consiguió, por ejemplo 'Volkswagen Gol Trend 2016, 90.000 km'"),
      precio: z.number().int().positive().describe("En pesos, el precio del auto conseguido que dijo quien opera"),
    },
    ejecutar: async ({ ref, auto, precio }) => {
      const caso = await conseguido((await casoPorRef(ref)).id, { descripcion: auto, precio })
      return { ...despues(caso), se_lleva: caso.auto_busca, precio_del_que_se_lleva: caso.precio_salida }
    },
  }),

  definir({
    nombre: "publicar_propuesta",
    descripcion:
      "Publica la propuesta en el link del cliente: vale 7 días y desde ahí los datos del caso quedan fijos. Pide el precio del auto que se lleva y, si entrega uno, la tasación.",
    lectura: false,
    destructiva: true,
    entrada: { ref: REF },
    ejecutar: async ({ ref }) => {
      const caso = await publicarPropuesta((await casoPorRef(ref)).id)
      return { ...despues(caso), propuesta_vence: caso.vence_prop }
    },
  }),

  definir({
    nombre: "acepto_propuesta",
    descripcion: "El cliente aceptó la propuesta publicada: el caso pasa a esperar la entrega, donde cerrar_caso cierra la venta.",
    lectura: false,
    entrada: { ref: REF },
    ejecutar: async ({ ref }) => despues(await aceptoPropuesta((await casoPorRef(ref)).id)),
  }),

  definir({
    nombre: "cerrar_caso",
    descripcion:
      "Cierra un caso. Con cerro true es la venta: el caso tiene que estar esperando la entrega (después de acepto_propuesta), y el auto del stock queda vendido. Con cerro false es un caso perdido: hacen falta el motivo y si se cayó porque no le contestamos a tiempo. Preguntalo, no lo supongas.",
    lectura: false,
    destructiva: true,
    entrada: {
      ref: REF,
      cerro: z.boolean().describe("true si se vendió, false si se perdió"),
      motivo: z.string().max(500).optional().describe("Por qué se cayó. Solo si cerro es false"),
      por_silencio: z.boolean().optional().describe("Solo si cerro es false: true si se cayó porque no le contestamos a tiempo"),
    },
    ejecutar: async ({ ref, cerro, motivo, por_silencio }) => {
      const { id } = await casoPorRef(ref)
      if (cerro) return despues(await cerrarVenta(id))
      if (!motivo?.trim()) throw new ErrorCaso("Para cerrar un caso perdido hace falta el motivo.")
      if (por_silencio === undefined) {
        throw new ErrorCaso("Falta decir si se cayó porque no le contestamos a tiempo (por_silencio). Se mide aparte.")
      }
      return despues(await perderCaso(id, { motivo, porSilencio: por_silencio }))
    },
  }),

  definir({
    nombre: "agregar_nota",
    descripcion: "Agrega una nota libre al caso, firmada por quien opera.",
    lectura: false,
    entrada: { ref: REF, texto: z.string().min(1).max(2000).describe("La nota") },
    ejecutar: async ({ ref, texto }, { operador }) => {
      const caso = await casoPorRef(ref)
      await agregarNota(caso.id, texto, operador.nombre)
      return { ref: caso.ref, nota: "agregada" }
    },
  }),

  definir({
    nombre: "marcar_venta_nueva",
    descripcion:
      "La respuesta a '¿Hubiera venido a Falkenberg sin esto?', después de una venta cerrada. si quiere decir que no hubiera venido: es una venta nueva. no_preguntado cuando no se le preguntó; nunca lo cambies por no.",
    lectura: false,
    entrada: {
      ref: REF,
      respuesta: z.enum(["si", "no", "no_preguntado"]).describe("si: no hubiera venido. no: igual venía."),
    },
    ejecutar: async ({ ref, respuesta }) => {
      const caso = await marcarVentaNueva((await casoPorRef(ref)).id, respuesta)
      return { ...despues(caso), venta_nueva: caso.venta_nueva }
    },
  }),
]
