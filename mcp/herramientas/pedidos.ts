import "server-only"
import { z } from "zod"
import { pedidosDelDia, verPedido } from "@/lib/pedido/lectura"
import { definir } from "../herramienta"

// The channel's reading tools: what came in through the web. They never return the value of the car the
// client hands in nor the margin.

export const herramientasPedidos = [
  definir({
    nombre: "ver_pedido",
    descripcion:
      "Un pedido por su referencia: quién es, qué entrega, qué se lleva, la zona, el estado, las fotos (links que valen una hora) y el link del caso para operarlo.",
    lectura: true,
    entrada: { ref: z.string().regex(/^LL-\d{4}$/).describe("La referencia del pedido, por ejemplo LL-4821") },
    ejecutar: async ({ ref }, { origen }) => verPedido(ref, origen),
  }),

  definir({
    nombre: "listar_pedidos_del_dia",
    descripcion: "Los pedidos que entraron hoy por la web, en hora de Argentina, del más viejo al más nuevo.",
    lectura: true,
    entrada: {},
    ejecutar: async () => pedidosDelDia(),
  }),
]
