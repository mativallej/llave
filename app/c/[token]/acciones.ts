"use server"

import { revalidatePath } from "next/cache"
import {
  aceptoPropuesta,
  agendarCita,
  agregarNota,
  cargarTasacion,
  cerrarVenta,
  conseguido,
  type Correccion,
  corregirCaso,
  fijarProximoAviso,
  llegaronFotos,
  marcarInspeccionado,
  marcarRenegocio,
  marcarVentaNueva,
  noVino,
  type PedidoAlCliente,
  pedirAlCliente,
  perderCaso,
  publicarPropuesta,
  resolverAcceso,
  type RespuestaVentaNueva,
} from "@/lib/caso/caso"
import { ErrorDeRegla } from "@/lib/errores"

// The operator's actions on the case link. The token is the authentication: only an operator token acts.
// Each one calls the same operation the MCP calls, so moving a case by link or by Claude leaves the same event.

type Resultado<T = object> = ({ ok: true } & T) | { ok: false; error: string }

const AUTOR = "Operador (link)"

async function operar<T extends object>(token: string, fn: (casoId: string) => Promise<T>): Promise<Resultado<T>> {
  const acceso = await resolverAcceso(token, { registrarApertura: false })
  if (!acceso || acceso.rol !== "operador") return { ok: false, error: "Este link no puede operar el caso." }
  try {
    const valor = await fn(acceso.casoId)
    revalidatePath(`/c/${token}`)
    return { ok: true, ...valor }
  } catch (e) {
    if (e instanceof ErrorDeRegla) return { ok: false, error: e.message }
    console.error(e)
    return { ok: false, error: "No se pudo guardar. Probá de nuevo en un momento." }
  }
}

// A datetime-local input carries no time zone: it's Argentina's time.
const enArgentina = (local: string) => (/[zZ]|[+-]\d\d:\d\d$/.test(local) ? local : `${local}:00-03:00`)
const numero = (texto: string) => Number(String(texto).replace(/\D/g, ""))
const nada = async () => ({})

export async function accionLlegaronFotos(token: string) {
  return operar(token, (id) => llegaronFotos(id).then(nada))
}
export async function accionAgendarCita(token: string, cuando: string) {
  return operar(token, (id) => agendarCita(id, enArgentina(cuando)).then(nada))
}
export async function accionInspeccionado(token: string) {
  return operar(token, (id) => marcarInspeccionado(id).then(nada))
}
export async function accionNoVino(token: string) {
  return operar(token, (id) => noVino(id).then(nada))
}
export async function accionTasacion(token: string, valor: string) {
  return operar(token, (id) => cargarTasacion(id, numero(valor)).then(nada))
}
export async function accionConseguido(token: string, descripcion: string, precio: string) {
  return operar(token, (id) => conseguido(id, { descripcion, precio: numero(precio) }).then(nada))
}
export async function accionProximoAviso(token: string, dia: string) {
  return operar(token, (id) => fijarProximoAviso(id, `${dia}T12:00:00-03:00`).then(nada))
}
export async function accionPublicar(token: string) {
  return operar(token, (id) => publicarPropuesta(id).then(nada))
}
export async function accionAcepto(token: string) {
  return operar(token, (id) => aceptoPropuesta(id).then(nada))
}
export async function accionCerrarVenta(token: string) {
  return operar(token, (id) => cerrarVenta(id).then(nada))
}
export async function accionPerder(token: string, motivo: string, porSilencio: boolean) {
  return operar(token, (id) => perderCaso(id, { motivo, porSilencio: porSilencio === true }).then(nada))
}
export async function accionCorregir(token: string, campos: Correccion) {
  return operar(token, (id) => corregirCaso(id, campos).then(nada))
}
export async function accionNota(token: string, texto: string) {
  return operar(token, (id) => agregarNota(id, texto, AUTOR).then(nada))
}
export async function accionPedir(token: string, que: PedidoAlCliente) {
  return operar(token, async (id) => ({ link: await pedirAlCliente(id, que, AUTOR) }))
}
export async function accionRenegocio(token: string) {
  return operar(token, (id) => marcarRenegocio(id).then(nada))
}
export async function accionVentaNueva(token: string, respuesta: RespuestaVentaNueva) {
  return operar(token, (id) => marcarVentaNueva(id, respuesta).then(nada))
}
