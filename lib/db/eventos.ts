import "server-only"
import { db } from "./server"
import type { Json } from "./types"

// The nine funnel steps. A contract: the metrics read these names, so they don't change without migrating data.
export const TIPOS_EVENTO = [
  "chat_iniciado",
  "pedido_enviado",
  "caso_abierto_operador",
  "cita_agendada",
  "cita_cumplida",
  "propuesta_publicada",
  "venta_cerrada",
  "caso_perdido",
  "renegociacion",
] as const

export type TipoEvento = (typeof TIPOS_EVENTO)[number]

// Events whose meta is not optional. caso_perdido must say whose silence lost it:
// ours is a different metric from the client's.
type MetaObligatoria = {
  caso_perdido: { por_silencio: boolean; motivo?: string }
}

type Meta<T extends TipoEvento> = T extends keyof MetaObligatoria
  ? [meta: MetaObligatoria[T]]
  : [meta?: { [clave: string]: Json }]

// Only the chat starts before there is a case.
type CasoId<T extends TipoEvento> = T extends "chat_iniciado" ? string | null : string

// One line per funnel step. The database trigger moves caso.ultimo_evento in the same transaction.
export async function registrar<T extends TipoEvento>(
  tipo: T,
  casoId: CasoId<T>,
  ...[meta]: Meta<T>
): Promise<void> {
  const { error } = await db()
    .from("evento")
    .insert({ tipo, caso_id: casoId, meta: (meta ?? {}) as Json })
  if (error) throw new Error(`registrar(${tipo}): ${error.message}`)
}
