import { z } from "zod"
import { RUTA_FOTO_PEDIDO } from "./tipos"

// What the browser may send. Everything that comes from the client is checked here before it reaches the
// agent or the database.

const Foto = z.string().regex(RUTA_FOTO_PEDIDO)

export const PedidoEsquema = z.object({
  entrega: z.boolean().nullable(),
  auto_entrega: z
    .object({
      marca: z.string().max(60).nullable(),
      modelo: z.string().max(80).nullable(),
      version: z.string().max(60).nullable(),
      anio: z.number().int().nullable(),
      km: z.number().int().nullable(),
    })
    .nullable(),
  salida: z.enum(["usado", "0km"]).nullable(),
  busca: z.string().max(500).nullable(),
  autos_elegidos: z.array(z.string().max(120)).max(6),
  zona: z.string().max(80).nullable(),
  fotos: z.array(Foto).max(10),
})

export const MensajeEsquema = z.object({
  rol: z.enum(["cliente", "tuerca"]),
  texto: z.string().max(2000),
  fotos: z.array(Foto).max(10).optional(),
})

export const TurnoEsquema = z.object({
  chat: z.string().uuid(),
  historial: z.array(MensajeEsquema).max(60),
  mensaje: MensajeEsquema.extend({ rol: z.literal("cliente") }),
  pedido: PedidoEsquema,
})
