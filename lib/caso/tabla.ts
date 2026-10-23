import "server-only"
import { db } from "@/lib/db/server"
import { resumir } from "@/lib/pedido/lectura"
import { listarCasos } from "./caso"
import { ESTADOS_ABIERTOS, type Estado, esEstado, NOMBRE_ESTADO, QUIEN_TIENE } from "./estados"

// The cases table in the admin: it reads, and every row links to the case, which is where things are done.

const DIA_MS = 86_400_000

export type FiltroTabla = { estado: Estado | "abiertos"; antiguedad: number | null }

export async function casosParaTabla(filtro: FiltroTabla, ahora = new Date()) {
  const casos = await listarCasos({
    estados: filtro.estado === "abiertos" ? ESTADOS_ABIERTOS : [filtro.estado],
    sinMovimientoDias: filtro.antiguedad ?? undefined,
  })
  if (casos.length === 0) return []
  const [resumenes, { data: accesos, error }] = await Promise.all([
    resumir(casos),
    db().from("acceso").select("caso_id, token").eq("rol", "operador").in("caso_id", casos.map((c) => c.id)),
  ])
  if (error) throw new Error(`casosParaTabla: ${error.message}`)
  return casos.map((caso, i) => {
    const estado: Estado = esEstado(caso.estado) ? caso.estado : "cerrado"
    const ultimo = caso.ultimo_evento ?? caso.creado_en
    const token = accesos?.find((a) => a.caso_id === caso.id)?.token
    return {
      ref: caso.ref,
      nombre: caso.nombre,
      telefono: caso.telefono,
      entrega: resumenes[i].entrega,
      busca: resumenes[i].se_lleva,
      zona: caso.zona,
      estado: estado === "cerrado" ? (caso.cerro ? "Venta cerrada" : "Perdido") : NOMBRE_ESTADO[estado],
      diasSinMovimiento: Math.max(0, Math.floor((ahora.getTime() - Date.parse(ultimo)) / DIA_MS)),
      quien: QUIEN_TIENE[estado],
      link: token ? `/c/${token}` : null,
    }
  })
}
