"use server"

import { revalidatePath } from "next/cache"
import { requerirRol } from "@/lib/auth/rol"
import type { CampoFicha } from "@/lib/stock/campos"
import {
  agregarFotos,
  type CamposFicha,
  completarAuto,
  crearAutoDesdeLinea,
  despublicarAuto,
  ErrorStock,
  marcarVendido,
  moverAuto,
  ponerPrecio,
  publicarAuto,
  quitarFoto,
  subidasFirmadas,
} from "@/lib/stock/stock"

// Thin on purpose: check the session and the role, call the domain operation, translate its error.
// The rules live in lib/stock, which the MCP calls too.

export type Resultado<T = object> = ({ ok: true } & T) | { ok: false; error: string }

async function intentar<T extends object>(fn: () => Promise<T>, slug?: string): Promise<Resultado<T>> {
  await requerirRol()
  try {
    const valor = await fn()
    revalidatePath("/admin/stock")
    if (slug) revalidatePath(`/admin/stock/${slug}`)
    return { ok: true, ...valor }
  } catch (e) {
    if (e instanceof ErrorStock) return { ok: false, error: e.message }
    console.error(e)
    return { ok: false, error: "No se pudo guardar. Probá de nuevo en un momento." }
  }
}

export async function pedirSubidas(cantidad: number) {
  return intentar(async () => ({ subidas: await subidasFirmadas(cantidad) }))
}

export async function cargarAuto(linea: string, rutas: string[]) {
  return intentar(async () => {
    const { auto } = await crearAutoDesdeLinea(linea, rutas)
    return { slug: auto.slug }
  })
}

export async function confirmarCampo(slug: string, campo: CampoFicha, valor: string) {
  return intentar(async () => {
    await completarAuto(slug, { [campo]: valor } as CamposFicha)
    return {}
  }, slug)
}

export async function guardarFicha(slug: string, campos: CamposFicha) {
  return intentar(async () => {
    await completarAuto(slug, campos)
    return {}
  }, slug)
}

export async function guardarPrecio(slug: string, precio: string) {
  return intentar(async () => {
    await ponerPrecio(slug, Number(precio.replace(/\D/g, "")))
    return {}
  }, slug)
}

export async function cambiarPublicado(slug: string, publicar: boolean) {
  return intentar(async () => {
    await (publicar ? publicarAuto(slug) : despublicarAuto(slug))
    return {}
  }, slug)
}

export async function venderAuto(slug: string) {
  return intentar(async () => {
    await marcarVendido(slug)
    return {}
  }, slug)
}

export async function moverEnLista(slug: string, direccion: "subir" | "bajar") {
  return intentar(async () => {
    await moverAuto(slug, direccion)
    return {}
  }, slug)
}

export async function sumarFotos(slug: string, rutas: string[]) {
  return intentar(async () => {
    await agregarFotos(slug, rutas)
    return {}
  }, slug)
}

export async function sacarFoto(slug: string, ruta: string) {
  return intentar(async () => {
    await quitarFoto(slug, ruta)
    return {}
  }, slug)
}
