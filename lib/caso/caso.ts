import "server-only"
import { db } from "@/lib/db/server"
import type { Tables } from "@/lib/db/types"
import type { TipoEvento } from "@/lib/db/eventos"
import { ErrorDeRegla } from "@/lib/errores"
import { nombreAuto, urlsFirmadas } from "@/lib/stock/stock"
import {
  type Accion,
  DIAS_VIGENCIA_PROPUESTA,
  type Estado,
  type EstadoAbierto,
  ESTADOS_ABIERTOS,
  ESTADOS_EDITABLES,
  estadosDonde,
} from "./estados"

// The case's operations. The case link's actions and the MCP tools both call these: same rules, same events.

export class ErrorCaso extends ErrorDeRegla {}

export type Caso = Tables<"caso">
export type Rol = "cliente" | "operador"

const FORMATO_TOKEN = /^[A-Za-z0-9_-]{22}$/
// Link previews open links before any person does. They must not count as the operator's first open.
const VISTA_PREVIA = /whatsapp|facebookexternalhit|facebot|twitterbot|telegrambot|slackbot|discordbot|linkedinbot|skypeuripreview|embedly|bot\b|crawler|spider/i

export function esVistaPrevia(agente: string | null): boolean {
  return Boolean(agente && VISTA_PREVIA.test(agente))
}

// The token is the authentication. The first real open is recorded, and for the operator it's a funnel event.
export async function resolverAcceso(
  token: string,
  { registrarApertura }: { registrarApertura: boolean },
): Promise<{ rol: Rol; casoId: string } | null> {
  if (!FORMATO_TOKEN.test(token)) return null
  if (!registrarApertura) {
    const { data } = await db().from("acceso").select("rol, caso_id").eq("token", token).maybeSingle()
    return data ? { rol: data.rol as Rol, casoId: data.caso_id } : null
  }
  const { data, error } = await db().rpc("abrir_acceso", { p_token: token })
  if (error) throw new Error(`resolverAcceso: ${error.message}`)
  const fila = data?.[0]
  return fila ? { rol: fila.acceso_rol as Rol, casoId: fila.acceso_caso } : null
}

// ─── Reading ─────────────────────────────────────────────────────────────────

export async function casoPorId(id: string): Promise<Caso> {
  const { data, error } = await db().from("caso").select().eq("id", id).maybeSingle()
  if (error) throw new Error(`casoPorId: ${error.message}`)
  if (!data) throw new ErrorCaso("No existe ese caso.")
  return data
}

export async function casoPorRef(ref: string): Promise<Caso> {
  const { data, error } = await db().from("caso").select().eq("ref", ref.trim().toUpperCase()).maybeSingle()
  if (error) throw new Error(`casoPorRef: ${error.message}`)
  if (!data) throw new ErrorCaso(`No hay ningún caso ${ref}.`)
  return data
}

export type AutoDelCaso = { id: string; nombre: string; precio: number | null }

export async function autosDelCaso(caso: Pick<Caso, "auto_ids">): Promise<AutoDelCaso[]> {
  if (caso.auto_ids.length === 0) return []
  const { data } = await db().from("auto").select("id, marca, modelo, version, anio, precio").in("id", caso.auto_ids)
  return (data ?? []).map((auto) => ({ id: auto.id, nombre: nombreAuto(auto), precio: auto.precio }))
}

export async function eventosDelCaso(casoId: string): Promise<{ tipo: string; en: string; meta: unknown }[]> {
  const { data } = await db().from("evento").select("tipo, en, meta").eq("caso_id", casoId).order("en")
  return data ?? []
}

export async function notasDelCaso(casoId: string) {
  const { data } = await db().from("nota").select("texto, autor, creada_en").eq("caso_id", casoId).order("creada_en")
  return data ?? []
}

export async function fotosDelCaso(casoId: string): Promise<string[]> {
  const { data } = await db().storage.from("fotos").list(`casos/${casoId}`)
  const rutas = (data ?? []).map((archivo) => `casos/${casoId}/${archivo.name}`)
  const urls = await urlsFirmadas(rutas)
  return rutas.map((ruta) => urls[ruta]).filter(Boolean)
}

export async function linkDelOperador(casoId: string, origen: string): Promise<string | null> {
  const { data } = await db().from("acceso").select("token").eq("caso_id", casoId).eq("rol", "operador").maybeSingle()
  return data ? `${origen}/c/${data.token}` : null
}

// Every case of a phone: the only id shared by the web, WhatsApp and a call.
export async function historialTelefono(telefono: string, salvo?: string) {
  let consulta = db().from("caso").select("id, ref, estado, cerro, creado_en").eq("telefono", telefono)
  if (salvo) consulta = consulta.neq("id", salvo)
  const { data, error } = await consulta.order("creado_en", { ascending: false })
  if (error) throw new Error(`historialTelefono: ${error.message}`)
  return (data ?? []).map(({ ref, estado, cerro, creado_en }) => ({ ref, estado, cerro, creado_en }))
}

export async function listarCasos(filtro: { estado?: Estado; sinMovimientoDias?: number } = {}) {
  let consulta = db().from("caso").select().order("creado_en", { ascending: false })
  if (filtro.estado) consulta = consulta.eq("estado", filtro.estado)
  if (filtro.sinMovimientoDias !== undefined) {
    const limite = new Date(Date.now() - filtro.sinMovimientoDias * 86_400_000).toISOString()
    consulta = consulta.lt("ultimo_evento", limite)
  }
  const { data, error } = await consulta
  if (error) throw new Error(`listarCasos: ${error.message}`)
  return data
}

// ─── Moving: one transaction per transition, with its event ─────────────────

async function mover(
  casoId: string,
  accion: Accion | null,
  desde: readonly EstadoAbierto[] | readonly Estado[],
  hacia: Estado | null,
  cambios: Record<string, unknown>,
  evento: TipoEvento | null,
  meta: Record<string, unknown> = {},
): Promise<Caso> {
  const { data, error } = await db().rpc("mover_caso", {
    p_caso: casoId,
    p_desde: [...desde],
    p_hacia: hacia,
    p_cambios: cambios,
    p_evento: evento,
    p_meta: meta,
  } as never)
  if (error) {
    if (error.code === "P0001") throw new ErrorCaso(error.message)
    throw new Error(`mover_caso${accion ? `(${accion})` : ""}: ${error.message}`)
  }
  return data as unknown as Caso
}

const ahora = () => new Date().toISOString()

function fecha(valor: string | Date, que: string): string {
  const leida = new Date(valor)
  if (Number.isNaN(leida.getTime())) throw new ErrorCaso(`${que} no es una fecha válida.`)
  return leida.toISOString()
}

export async function llegaronFotos(casoId: string) {
  return mover(casoId, "llegaron_fotos", estadosDonde("llegaron_fotos"), "pendiente_cita", { fotos_en: ahora() }, null)
}

export async function agendarCita(casoId: string, cuando: string | Date) {
  const cita = fecha(cuando, "La cita")
  return mover(casoId, "agendar_cita", estadosDonde("agendar_cita"), "pendiente_inspeccion", { cita_en: cita }, "cita_agendada", {
    cita_en: cita,
  })
}

// After the visit: to the appraisal if a car comes in; otherwise to the proposal, or to the search when
// what they want isn't in stock.
export async function marcarInspeccionado(casoId: string) {
  const caso = await casoPorId(casoId)
  const siguiente: Estado = caso.auto_entrega
    ? "pendiente_tasacion"
    : caso.auto_ids.length > 0 || caso.precio_salida !== null
      ? "pendiente_propuesta"
      : "pendiente_conseguir"
  return mover(casoId, "marcar_inspeccionado", estadosDonde("marcar_inspeccionado"), siguiente, {}, "cita_cumplida")
}

export async function noVino(casoId: string) {
  return mover(casoId, "no_vino", estadosDonde("no_vino"), "pendiente_cita", { cita_en: null }, null)
}

// Andrés writing his own judgement, after seeing the car. Nothing estimates it.
export async function cargarTasacion(casoId: string, valorToma: number) {
  if (!Number.isFinite(valorToma) || valorToma <= 0) throw new ErrorCaso("La tasación tiene que ser un número mayor a cero.")
  const caso = await casoPorId(casoId)
  const siguiente: Estado =
    caso.auto_ids.length > 0 || caso.precio_salida !== null ? "pendiente_propuesta" : "pendiente_conseguir"
  return mover(casoId, "cargar_tasacion", estadosDonde("cargar_tasacion"), siguiente, { valor_toma: Math.round(valorToma) }, null)
}

export async function conseguido(casoId: string, { descripcion, precio }: { descripcion: string; precio: number }) {
  if (!descripcion.trim()) throw new ErrorCaso("Decí qué auto se consiguió.")
  if (!Number.isFinite(precio) || precio <= 0) throw new ErrorCaso("El precio tiene que ser un número mayor a cero.")
  return mover(
    casoId,
    "conseguido",
    estadosDonde("conseguido"),
    "pendiente_propuesta",
    { auto_busca: descripcion.trim(), precio_salida: Math.round(precio) },
    null,
  )
}

export async function fijarProximoAviso(casoId: string, cuando: string | Date) {
  const dia = fecha(cuando, "El próximo aviso").slice(0, 10)
  return mover(casoId, "proximo_aviso", estadosDonde("proximo_aviso"), null, { proximo_aviso: dia }, null)
}

// Publishing sets the 7 days and freezes the case: from here on, what was informed doesn't change.
export async function publicarPropuesta(casoId: string) {
  const caso = await casoPorId(casoId)
  if (caso.precio_salida === null) throw new ErrorCaso("Falta el precio del auto que se lleva.")
  if (caso.auto_entrega && caso.valor_toma === null) throw new ErrorCaso("Falta la tasación del auto que entrega.")
  const vence = new Date(Date.now() + DIAS_VIGENCIA_PROPUESTA * 86_400_000).toISOString()
  return mover(
    casoId,
    "publicar_propuesta",
    estadosDonde("publicar_propuesta"),
    "propuesta_publicada",
    { vence_prop: vence },
    "propuesta_publicada",
    { vence_prop: vence },
  )
}

export async function aceptoPropuesta(casoId: string) {
  return mover(casoId, "acepto_propuesta", estadosDonde("acepto_propuesta"), "pendiente_entrega", {}, null)
}

// The sale. The database marks the stock car it took as sold and unpublished in the same transaction.
export async function cerrarVenta(casoId: string) {
  return mover(casoId, "cerrar_venta", estadosDonde("cerrar_venta"), "cerrado", { cerro: true }, "venta_cerrada")
}

// Lost: always with the reason, and saying whether it was our own silence. That one is measured apart.
export async function perderCaso(casoId: string, { motivo, porSilencio }: { motivo: string; porSilencio: boolean }) {
  if (!motivo.trim()) throw new ErrorCaso("Contá por qué se cayó.")
  return mover(
    casoId,
    "perder",
    ESTADOS_ABIERTOS,
    "cerrado",
    { cerro: false, motivo_perdida: motivo.trim() },
    "caso_perdido",
    { por_silencio: porSilencio, motivo: motivo.trim() },
  )
}

export type Correccion = Partial<{
  nombre: string
  auto_entrega: { marca: string | null; modelo: string | null; version: string | null; anio: number | null; km: number | null } | null
  salida: "usado" | "0km" | null
  auto_busca: string | null
  zona: string | null
}>

// Correcting data works only until the proposal is published. The database blocks it after, too.
export async function corregirCaso(casoId: string, campos: Correccion) {
  if (Object.keys(campos).length === 0) throw new ErrorCaso("No hay nada para corregir.")
  return mover(casoId, null, ESTADOS_EDITABLES, null, campos, null)
}

// ─── The two marks that are metrics ──────────────────────────────────────────

// The Stage 1 binary gate: a single one breaks the product's strongest guarantee.
export async function marcarRenegocio(casoId: string) {
  const caso = await casoPorId(casoId)
  if (caso.renegocio) throw new ErrorCaso("Ya está marcado que se renegoció.")
  if (!(caso.estado === "pendiente_entrega" || (caso.estado === "cerrado" && caso.cerro))) {
    throw new ErrorCaso("Se marca en la entrega o después de la venta.")
  }
  return mover(casoId, null, ["pendiente_entrega", "cerrado"], null, { renegocio: true }, "renegociacion")
}

export type RespuestaVentaNueva = "si" | "no" | "no_preguntado"

// "¿Hubiera venido a Falkenberg sin esto?" Sí = true = a new sale. Not asked = null, never false.
export async function marcarVentaNueva(casoId: string, respuesta: RespuestaVentaNueva) {
  const caso = await casoPorId(casoId)
  if (!(caso.estado === "cerrado" && caso.cerro)) throw new ErrorCaso("Se pregunta después de una venta cerrada.")
  const valor = respuesta === "si" ? true : respuesta === "no" ? false : null
  return mover(casoId, null, ["cerrado"], null, { venta_nueva: valor }, null)
}

// ─── Notes and asking the client ─────────────────────────────────────────────

export async function agregarNota(casoId: string, texto: string, autor: string) {
  const limpio = texto.trim()
  if (!limpio) throw new ErrorCaso("La nota está vacía.")
  if (limpio.length > 2000) throw new ErrorCaso("La nota es demasiado larga.")
  const { error } = await db().from("nota").insert({ caso_id: casoId, texto: limpio, autor })
  if (error) throw new Error(`agregarNota: ${error.message}`)
}

export const PEDIDOS_AL_CLIENTE = {
  fotos: "las fotos del auto que entregás",
  horario: "qué día y horario te queda bien para venir",
  documentacion: "la documentación del auto que entregás",
} as const

export type PedidoAlCliente = keyof typeof PEDIDOS_AL_CLIENTE

// One tap: the WhatsApp to the client already written, and a note saying it was asked.
export async function pedirAlCliente(casoId: string, que: PedidoAlCliente, autor: string): Promise<string> {
  const caso = await casoPorId(casoId)
  const pedido = PEDIDOS_AL_CLIENTE[que]
  const saludo = caso.nombre ? `Hola ${caso.nombre}` : "Hola"
  const texto = `${saludo}, te escribo de Falkenberg por tu pedido ${caso.ref}. ¿Me mandás ${pedido}?`
  await agregarNota(casoId, `Se le pidió ${pedido}.`, autor)
  return `https://wa.me/${caso.telefono.replace(/\D/g, "")}?text=${encodeURIComponent(texto)}`
}
