import "server-only"
import { db } from "@/lib/db/server"
import { ErrorDeRegla } from "@/lib/errores"
import { pesos } from "@/lib/formato"
import { nombreAuto, urlsFirmadas } from "@/lib/stock/stock"
import { describirAutoEntrega } from "./canal"
import type { AutoEntrega } from "./tipos"

// Reading a request, for the operator. Never the value of the car the client hands in, never the margin:
// those don't leave through here, even if they exist.

export class ErrorLectura extends ErrorDeRegla {}

const ZONA_HORARIA = "America/Argentina/Buenos_Aires"

export type FilaCaso = {
  id: string
  ref: string
  estado: string
  creado_en: string
  nombre: string | null
  telefono: string
  auto_entrega: unknown
  salida: string | null
  auto_busca: string | null
  auto_ids: string[]
  zona: string | null
  precio_salida: number | null
}

const COLUMNAS = "id, ref, estado, creado_en, nombre, telefono, auto_entrega, salida, auto_busca, auto_ids, zona, precio_salida"

export async function resumir(casos: FilaCaso[]) {
  const ids = [...new Set(casos.flatMap((c) => c.auto_ids))]
  const { data: autos } = ids.length
    ? await db().from("auto").select("id, marca, modelo, version, anio, precio").in("id", ids)
    : { data: [] }
  return casos.map((c) => {
    const elegidos = (autos ?? []).filter((a) => c.auto_ids.includes(a.id))
    return {
      ref: c.ref,
      estado: c.estado,
      creado_en: c.creado_en,
      nombre: c.nombre,
      telefono: c.telefono,
      entrega: c.auto_entrega ? describirAutoEntrega(c.auto_entrega as AutoEntrega) : null,
      se_lleva:
        elegidos.length > 0
          ? elegidos.map((a) => `${nombreAuto(a)}${a.precio !== null ? `, ${pesos(a.precio)}` : ""}`).join("; ")
          : (c.auto_busca ?? (c.salida === "0km" ? "un 0km" : c.salida === "usado" ? "un usado" : null)),
      precio_del_que_se_lleva: c.precio_salida,
      zona: c.zona,
    }
  })
}

export async function verPedido(ref: string, origen?: string) {
  const { data: caso, error } = await db().from("caso").select(COLUMNAS).eq("ref", ref).maybeSingle()
  if (error) throw new Error(`verPedido: ${error.message}`)
  if (!caso) throw new ErrorLectura(`No hay ningún pedido ${ref}.`)

  const [[resumen], { data: archivos }, { data: acceso }] = await Promise.all([
    resumir([caso as FilaCaso]),
    db().storage.from("fotos").list(`casos/${caso.id}`),
    db().from("acceso").select("token").eq("caso_id", caso.id).eq("rol", "operador").maybeSingle(),
  ])
  const rutas = (archivos ?? []).map((f) => `casos/${caso.id}/${f.name}`)
  const urls = await urlsFirmadas(rutas)
  return {
    ...resumen,
    fotos: rutas.map((ruta) => urls[ruta]).filter(Boolean),
    ...(origen && acceso ? { link_operador: `${origen}/c/${acceso.token}` } : {}),
  }
}

// "Today" is today in Argentina, not in UTC.
export function inicioDelDia(ahora = new Date()): string {
  const dia = new Intl.DateTimeFormat("en-CA", { timeZone: ZONA_HORARIA }).format(ahora)
  return new Date(`${dia}T00:00:00-03:00`).toISOString()
}

export async function pedidosDelDia(ahora = new Date()) {
  const { data, error } = await db()
    .from("caso")
    .select(COLUMNAS)
    .gte("creado_en", inicioDelDia(ahora))
    .order("creado_en", { ascending: true })
  if (error) throw new Error(`pedidosDelDia: ${error.message}`)
  return resumir(data as FilaCaso[])
}
