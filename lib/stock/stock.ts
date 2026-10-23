import "server-only"
import { randomUUID } from "node:crypto"
import { extraerFicha } from "@/lib/agente/ficha"
import { db } from "@/lib/db/server"
import type { Tables } from "@/lib/db/types"
import { ErrorDeRegla } from "@/lib/errores"
import { CAMPOS_FICHA, type CampoFicha, type TipoFoto } from "./campos"

// The stock's domain operations. The admin's server actions and the MCP tools both call these:
// one place for the rules, two surfaces.

export type Auto = Tables<"auto">

export const DIAS_DESACTUALIZADO = 14
export const DESTACADOS = 6
const BUCKET = "fotos"
const MAX_FOTOS_POR_CARGA = 12
const RUTA_FOTO_STOCK = /^stock\/[0-9a-f-]{36}\.(jpg|png|webp)$/

// A stock rule broken by the operator. The message is shown as is, in the admin and through the MCP.
export class ErrorStock extends ErrorDeRegla {}

// What the client sees on the card. The version may stay empty; the price is checked on its own.
const OBLIGATORIOS_PARA_PUBLICAR = ["marca", "modelo", "anio", "km"] as const

const NOMBRE_CAMPO: Record<CampoFicha, string> = {
  marca: "la marca",
  modelo: "el modelo",
  version: "la versión",
  anio: "el año",
  km: "los kilómetros",
}

export function faltantesDe(auto: Pick<Auto, CampoFicha>): CampoFicha[] {
  return CAMPOS_FICHA.filter((campo) => auto[campo] === null)
}

export function nombreCampo(campo: CampoFicha): string {
  return NOMBRE_CAMPO[campo]
}

export function diasDesde(fecha: string, ahora = new Date()): number {
  return Math.floor((ahora.getTime() - new Date(fecha).getTime()) / 86_400_000)
}

export function nombreAuto(auto: Pick<Auto, "marca" | "modelo" | "version" | "anio">): string {
  const nombre = [auto.marca, auto.modelo, auto.version, auto.anio].filter(Boolean).join(" ")
  return nombre || "Auto sin datos todavía"
}

// ─── Alta ────────────────────────────────────────────────────────────────────

// A photo and a line: the agent deduces what is in the evidence and the rest stays marked as missing.
// The car is created unpublished and without a price.
export async function crearAutoDesdeLinea(
  linea: string,
  rutasFotos: string[],
): Promise<{ auto: Auto; faltantes: CampoFicha[] }> {
  const texto = linea.trim()
  if (!texto) throw new ErrorStock("Escribí una línea con lo que entró, por ejemplo: Corolla XEI 2019 con 78 mil.")
  validarRutas(rutasFotos)

  const urls = await urlsFirmadas(rutasFotos, 600)
  const ficha = await extraerFicha(
    texto,
    rutasFotos.map((ruta) => urls[ruta]),
  )

  const slug = await slugLibre([ficha.marca, ficha.modelo, ficha.version, ficha.anio])
  const { data, error } = await db()
    .from("auto")
    .insert({
      slug,
      marca: ficha.marca,
      modelo: ficha.modelo,
      version: ficha.version,
      anio: ficha.anio,
      km: ficha.km,
      segmento: ficha.segmento,
      fotos: ordenarFotos(rutasFotos, ficha.tipos),
      publicado: false,
    })
    .select()
    .single()
  if (error) throw new Error(`crearAutoDesdeLinea: ${error.message}`)
  return { auto: data, faltantes: ficha.faltantes }
}

// The front photo first: it is the card's cover.
const ORDEN_TIPO: TipoFoto[] = ["frente", "lateral", "atras", "interior", "tablero", "otra"]

function ordenarFotos(rutas: string[], tipos: TipoFoto[]): string[] {
  return rutas
    .map((ruta, i) => ({ ruta, peso: ORDEN_TIPO.indexOf(tipos[i] ?? "otra"), i }))
    .sort((a, b) => a.peso - b.peso || a.i - b.i)
    .map(({ ruta }) => ruta)
}

// ─── Lectura ─────────────────────────────────────────────────────────────────

export async function verAuto(slug: string): Promise<Auto> {
  const { data, error } = await db().from("auto").select().eq("slug", slug).maybeSingle()
  if (error) throw new Error(`verAuto: ${error.message}`)
  if (!data) throw new ErrorStock(`No hay ningún auto con el slug "${slug}".`)
  return data
}

// The stock that isn't sold: published first in their order, then the drafts, newest first.
export async function listarStock(): Promise<Auto[]> {
  const { data, error } = await db()
    .from("auto")
    .select()
    .is("vendido_en", null)
    .order("publicado", { ascending: false })
    .order("orden", { ascending: true, nullsFirst: false })
    .order("actualizado_en", { ascending: false })
  if (error) throw new Error(`listarStock: ${error.message}`)
  return data
}

// Published cars nobody touched in two weeks: the ones most likely to be sold and still on the page.
export async function stockDesactualizado(ahora = new Date()): Promise<Auto[]> {
  const limite = new Date(ahora.getTime() - DIAS_DESACTUALIZADO * 86_400_000).toISOString()
  const { data, error } = await db()
    .from("auto")
    .select()
    .eq("publicado", true)
    .lt("actualizado_en", limite)
    .order("actualizado_en", { ascending: true })
  if (error) throw new Error(`stockDesactualizado: ${error.message}`)
  return data
}

// ─── Escritura: cada una hace una cosa ───────────────────────────────────────

export type CamposFicha = Partial<{
  marca: string | null
  modelo: string | null
  version: string | null
  anio: number | null
  km: number | null
  segmento: string | null
}>

export async function completarAuto(slug: string, campos: CamposFicha): Promise<Auto> {
  const cambios: CamposFicha = {}
  for (const [campo, valor] of Object.entries(campos) as [keyof CamposFicha, unknown][]) {
    if (valor === undefined) continue
    if (campo === "anio" || campo === "km") {
      cambios[campo] = validarEntero(campo, valor)
    } else {
      const texto = typeof valor === "string" ? valor.trim() : null
      // An empty version means "it has none"; any other empty field means "I don't know it yet".
      cambios[campo] = campo === "version" ? (texto ?? null) : texto || null
    }
  }
  if (Object.keys(cambios).length === 0) throw new ErrorStock("No hay ningún dato para guardar.")
  return actualizar(slug, cambios)
}

// On its own on purpose: the price is public and a guarantee. It is never set in passing.
export async function ponerPrecio(slug: string, precio: number): Promise<Auto> {
  if (!Number.isFinite(precio) || precio <= 0) throw new ErrorStock("El precio tiene que ser un número mayor a cero.")
  return actualizar(slug, { precio: Math.round(precio) })
}

export async function publicarAuto(slug: string): Promise<Auto> {
  const auto = await verAuto(slug)
  if (auto.vendido_en) throw new ErrorStock("Este auto está marcado como vendido: no se puede publicar.")
  if (auto.precio === null) {
    throw new ErrorStock("Falta el precio. Se escribe a mano antes de publicar, porque es público y es una garantía.")
  }
  const faltan = OBLIGATORIOS_PARA_PUBLICAR.filter((campo) => auto[campo] === null)
  if (faltan.length > 0) {
    throw new ErrorStock(`Antes de publicar falta confirmar ${faltan.map((c) => NOMBRE_CAMPO[c]).join(", ")}.`)
  }
  return actualizar(slug, { publicado: true })
}

export async function despublicarAuto(slug: string): Promise<Auto> {
  return actualizar(slug, { publicado: false })
}

// Sold and unpublished in the same write: a sold car still on the page is the agent lying.
export async function marcarVendido(slug: string): Promise<Auto> {
  return actualizar(slug, { vendido_en: new Date().toISOString(), publicado: false })
}

// Moves a published car one place up or down. The first six are "Autos de esta semana".
export async function moverAuto(slug: string, direccion: "subir" | "bajar"): Promise<void> {
  const publicados = (await listarStock()).filter((auto) => auto.publicado)
  const i = publicados.findIndex((auto) => auto.slug === slug)
  if (i === -1) throw new ErrorStock("Solo se ordenan los autos publicados.")
  const j = direccion === "subir" ? i - 1 : i + 1
  if (j < 0 || j >= publicados.length) return
  ;[publicados[i], publicados[j]] = [publicados[j], publicados[i]]

  // Renumbering the whole published list keeps the order explicit, with no ties and no holes.
  for (const [posicion, auto] of publicados.entries()) {
    if (auto.orden === posicion + 1) continue
    const { error } = await db().from("auto").update({ orden: posicion + 1 }).eq("id", auto.id)
    if (error) throw new Error(`moverAuto: ${error.message}`)
  }
}

export async function agregarFotos(slug: string, rutas: string[]): Promise<Auto> {
  validarRutas(rutas)
  const auto = await verAuto(slug)
  return actualizar(slug, { fotos: [...auto.fotos, ...rutas.filter((ruta) => !auto.fotos.includes(ruta))] })
}

// Takes the photo off the car. The file stays in Storage.
export async function quitarFoto(slug: string, ruta: string): Promise<Auto> {
  const auto = await verAuto(slug)
  return actualizar(slug, { fotos: auto.fotos.filter((foto) => foto !== ruta) })
}

// ─── Fotos ───────────────────────────────────────────────────────────────────

// Signed upload URLs: the photo goes from the phone straight to the private bucket, without going through
// a server action (whose body has a size limit) and without opening any Storage policy.
export async function subidasFirmadas(cantidad: number): Promise<{ ruta: string; token: string }[]> {
  if (!Number.isInteger(cantidad) || cantidad < 1 || cantidad > MAX_FOTOS_POR_CARGA) {
    throw new ErrorStock(`Se pueden subir de 1 a ${MAX_FOTOS_POR_CARGA} fotos por vez.`)
  }
  return Promise.all(
    Array.from({ length: cantidad }, async () => {
      const ruta = `stock/${randomUUID()}.jpg`
      const { data, error } = await db().storage.from(BUCKET).createSignedUploadUrl(ruta)
      if (error) throw new Error(`subidasFirmadas: ${error.message}`)
      return { ruta, token: data.token }
    }),
  )
}

export async function urlsFirmadas(rutas: string[], segundos = 3600): Promise<Record<string, string>> {
  if (rutas.length === 0) return {}
  const { data, error } = await db().storage.from(BUCKET).createSignedUrls(rutas, segundos)
  if (error) throw new Error(`urlsFirmadas: ${error.message}`)
  const urls: Record<string, string> = {}
  for (const firmada of data) {
    if (firmada.path && firmada.signedUrl) urls[firmada.path] = firmada.signedUrl
  }
  return urls
}

// ─── Internas ────────────────────────────────────────────────────────────────

async function actualizar(slug: string, cambios: Partial<Auto>): Promise<Auto> {
  const { data, error } = await db().from("auto").update(cambios).eq("slug", slug).select().maybeSingle()
  if (error) throw new Error(`actualizar(${slug}): ${error.message}`)
  if (!data) throw new ErrorStock(`No hay ningún auto con el slug "${slug}".`)
  return data
}

function validarRutas(rutas: string[]) {
  if (rutas.length > MAX_FOTOS_POR_CARGA) throw new ErrorStock(`Como mucho ${MAX_FOTOS_POR_CARGA} fotos por vez.`)
  for (const ruta of rutas) {
    if (!RUTA_FOTO_STOCK.test(ruta)) throw new ErrorStock("Una de las fotos no es del stock.")
  }
}

function validarEntero(campo: "anio" | "km", valor: unknown): number | null {
  if (valor === null || valor === "") return null
  const numero = typeof valor === "number" ? valor : Number(String(valor).replace(/\D/g, ""))
  if (!Number.isInteger(numero)) throw new ErrorStock(`${NOMBRE_CAMPO[campo]} tiene que ser un número.`)
  if (campo === "anio" && (numero < 1950 || numero > new Date().getFullYear() + 1)) {
    throw new ErrorStock("El año no parece correcto.")
  }
  if (campo === "km" && numero < 0) throw new ErrorStock("Los kilómetros no pueden ser negativos.")
  return numero
}

export function slugBase(partes: (string | number | null)[]): string {
  const base = partes
    .filter((parte) => parte !== null && parte !== "")
    .join(" ")
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
  return base || "auto"
}

// The slug is generated on its own and is unique: the base, then base-2, base-3…
export async function slugLibre(partes: (string | number | null)[]): Promise<string> {
  const base = slugBase(partes)
  const { data, error } = await db().from("auto").select("slug").like("slug", `${base}%`)
  if (error) throw new Error(`slugLibre: ${error.message}`)
  const usados = new Set(data.map((fila) => fila.slug))
  if (!usados.has(base)) return base
  let n = 2
  while (usados.has(`${base}-${n}`)) n++
  return `${base}-${n}`
}
