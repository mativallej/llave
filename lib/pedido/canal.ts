import "server-only"
import { randomBytes, randomUUID } from "node:crypto"
import { leerConfig } from "@/lib/config"
import { db } from "@/lib/db/server"
import type { Json } from "@/lib/db/types"
import { ErrorDeRegla } from "@/lib/errores"
import { kilometros, pesos } from "@/lib/formato"
import { listarStock, nombreAuto, urlsFirmadas } from "@/lib/stock/stock"
import { AYUDA_TELEFONO, normalizarTelefono } from "./telefono"
import { type AutoCanal, type AutoEntrega, faltaParaResumen, type Pedido, RUTA_FOTO_PEDIDO } from "./tipos"

// The public channel's server side: the stock the client sees, the client's photo uploads, and the closing
// step that turns a conversation into a case.

export class ErrorPedido extends ErrorDeRegla {}

const BUCKET = "fotos"
const MAX_FOTOS_PEDIDO = 10
const MINUTOS_DUPLICADO = 10

// The published stock, in the admin's order, with public data only and a signed cover photo.
export async function stockCanal(): Promise<AutoCanal[]> {
  const autos = (await listarStock()).filter((auto) => auto.publicado && auto.precio !== null)
  const portadas = await urlsFirmadas(autos.flatMap((auto) => auto.fotos.slice(0, 1)))
  return autos.map((auto) => ({
    slug: auto.slug,
    nombre: nombreAuto(auto),
    anio: auto.anio,
    km: auto.km,
    precio: auto.precio!,
    foto: auto.fotos[0] ? (portadas[auto.fotos[0]] ?? null) : null,
  }))
}

// Signed upload tokens for the client's photos, into a temporary folder. On confirm they move to the case.
export async function subidasDeCliente(cantidad: number): Promise<{ ruta: string; token: string }[]> {
  if (!Number.isInteger(cantidad) || cantidad < 1 || cantidad > 5) {
    throw new ErrorPedido("Se pueden subir de 1 a 5 fotos por vez.")
  }
  return Promise.all(
    Array.from({ length: cantidad }, async () => {
      const ruta = `pedidos/tmp/${randomUUID()}.jpg`
      const { data, error } = await db().storage.from(BUCKET).createSignedUploadUrl(ruta)
      if (error) throw new Error(`subidasDeCliente: ${error.message}`)
      return { ruta, token: data.token }
    }),
  )
}

// Without photos the appraisal can't start; without a stock car, Falkenberg goes out to find it.
export function estadoInicial(pedido: Pedido): string {
  if (pedido.entrega) return pedido.fotos.length > 0 ? "pendiente_cita" : "pendiente_fotos"
  return pedido.autos_elegidos.length > 0 ? "pendiente_cita" : "pendiente_conseguir"
}

export function describirAutoEntrega(auto: AutoEntrega | null): string {
  if (!auto) return "un auto"
  const nombre = [auto.marca, auto.modelo, auto.version, auto.anio].filter(Boolean).join(" ") || "un auto"
  return auto.km !== null ? `${nombre}, ${kilometros(auto.km)}` : nombre
}

export function describirSalida(pedido: Pedido, elegidos: AutoCanal[]): string {
  if (elegidos.length > 0) return elegidos.map((auto) => `${auto.nombre}, ${pesos(auto.precio)}`).join("; ")
  if (pedido.busca) return pedido.busca
  return pedido.salida === "0km" ? "un 0km" : "un usado"
}

export function mensajeWhatsApp(datos: {
  nombre: string
  ref: string
  pedido: Pedido
  elegidos: AutoCanal[]
  linkOperador: string
}): string {
  const { nombre, ref, pedido, elegidos, linkOperador } = datos
  return [
    `Hola, soy ${nombre}. Te mando mi pedido ${ref}.`,
    pedido.entrega ? `Entrego: ${describirAutoEntrega(pedido.auto_entrega)}.` : "No entrego auto.",
    `${elegidos.length > 0 ? "Me llevo" : "Busco"}: ${describirSalida(pedido, elegidos)}.`,
    `Zona: ${pedido.zona ?? "sin decir"}.`,
    pedido.fotos.length > 0 ? `Fotos: ${pedido.fotos.length}.` : "Fotos: todavía no.",
    `Caso: ${linkOperador}`,
  ].join("\n")
}

export type PedidoEnviado = {
  ref: string
  linkCliente: string
  whatsapp: string | null
  creadoEn: string
  duplicado: boolean
}

export async function enviarPedido(datos: {
  pedido: Pedido
  nombre: string
  telefono: string
  origen: string
  chat?: string
}): Promise<PedidoEnviado> {
  const { pedido, origen } = datos
  const nombre = datos.nombre.trim()
  if (nombre.length < 2 || nombre.length > 60) throw new ErrorPedido("Escribí tu nombre.")
  const telefono = normalizarTelefono(datos.telefono)
  if (!telefono) throw new ErrorPedido(`Ese WhatsApp no parece completo. ${AYUDA_TELEFONO}`)
  const falta = faltaParaResumen(pedido)
  if (falta.length > 0) throw new ErrorPedido(`Antes de mandarlo falta ${falta.join(" y ")}.`)
  if (pedido.fotos.length > MAX_FOTOS_PEDIDO || pedido.fotos.some((ruta) => !RUTA_FOTO_PEDIDO.test(ruta))) {
    throw new ErrorPedido("Una de las fotos no es válida.")
  }

  const elegidos = (await stockCanal()).filter((auto) => pedido.autos_elegidos.includes(auto.slug))
  const { data: filas, error: errorAutos } = await db()
    .from("auto")
    .select("id, slug")
    .in("slug", elegidos.map((auto) => auto.slug))
  if (errorAutos) throw new Error(`enviarPedido: ${errorAutos.message}`)
  const autoIds = (filas ?? []).map((fila) => fila.id).sort()

  const caso = {
    auto_entrega: pedido.entrega ? (pedido.auto_entrega as Json) : null,
    salida: pedido.salida,
    auto_busca: pedido.busca,
    auto_ids: autoIds,
    zona: pedido.zona,
  }

  // An exact duplicate in the last minutes gets back the request it already sent, not a second case.
  const existente = await duplicado(telefono, caso)
  if (existente) return armar(existente.ref, existente.creadoEn, existente.tokenCliente, existente.tokenOperador, true)

  const tokenCliente = randomBytes(16).toString("base64url")
  const tokenOperador = randomBytes(16).toString("base64url")
  const { data, error } = await db().rpc("crear_pedido", {
    p_telefono: telefono,
    p_nombre: nombre,
    p_estado: estadoInicial(pedido),
    p_auto_entrega: caso.auto_entrega,
    p_salida: caso.salida,
    p_auto_busca: caso.auto_busca,
    p_auto_ids: autoIds,
    p_zona: caso.zona,
    p_precio_salida: elegidos.length === 1 ? elegidos[0].precio : null,
    p_token_cliente: tokenCliente,
    p_token_operador: tokenOperador,
    p_meta: { fotos: pedido.fotos.length, ...(datos.chat ? { chat: datos.chat } : {}) },
  } as never)
  if (error) throw new Error(`enviarPedido: ${error.message}`)
  const creado = (data as { caso_id: string; caso_ref: string; caso_creado_en: string }[])[0]

  // The photos move to the case's folder. They never block the request: one that didn't arrive is logged.
  for (const [i, ruta] of pedido.fotos.entries()) {
    const { error: errorFoto } = await db().storage.from(BUCKET).move(ruta, `casos/${creado.caso_id}/${i + 1}.jpg`)
    if (errorFoto) console.error(`enviarPedido: no se movió la foto ${ruta}: ${errorFoto.message}`)
  }

  return armar(creado.caso_ref, creado.caso_creado_en, tokenCliente, tokenOperador, false)

  async function armar(ref: string, creadoEn: string, cliente: string, operador: string, repetido: boolean) {
    const texto = mensajeWhatsApp({ nombre, ref, pedido, elegidos, linkOperador: `${origen}/c/${operador}` })
    return {
      ref,
      linkCliente: `${origen}/c/${cliente}`,
      whatsapp: await linkWhatsApp(ref, texto),
      creadoEn,
      duplicado: repetido,
    } satisfies PedidoEnviado
  }

  async function duplicado(tel: string, nuevo: typeof caso) {
    const desde = new Date(Date.now() - MINUTOS_DUPLICADO * 60_000).toISOString()
    const { data: recientes } = await db()
      .from("caso")
      .select("id, ref, creado_en, auto_entrega, salida, auto_busca, auto_ids, zona")
      .eq("telefono", tel)
      .gte("creado_en", desde)
    const firma = (c: typeof nuevo) =>
      JSON.stringify([c.auto_entrega, c.salida, c.auto_busca, [...c.auto_ids].sort(), c.zona])
    const igual = (recientes ?? []).find((c) => firma(c as typeof nuevo) === firma(nuevo))
    if (!igual) return null
    const { data: accesos } = await db().from("acceso").select("token, rol").eq("caso_id", igual.id)
    const token = (rol: string) => accesos?.find((a) => a.rol === rol)?.token ?? ""
    return { ref: igual.ref, creadoEn: igual.creado_en, tokenCliente: token("cliente"), tokenOperador: token("operador") }
  }
}

// The number comes from config, on the server; it never reaches the browser as a variable.
// While it's empty there is no handoff link, and nobody makes one up.
async function linkWhatsApp(ref: string, texto: string): Promise<string | null> {
  const numero = await leerConfig("whatsapp_abelardo")
  if (!numero) {
    console.warn(`enviarPedido: whatsapp_abelardo está vacío; el pedido ${ref} quedó sin handoff`)
    return null
  }
  return `https://wa.me/${numero}?text=${encodeURIComponent(texto)}`
}
