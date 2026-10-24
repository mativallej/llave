import "server-only"
import { z } from "zod"
import { leerTablero } from "@/lib/metricas/tablero"
import { definir } from "../herramienta"

// The dashboard, by Claude. Same reading as the screen, so both say the same numbers. Every conversion
// comes with its two counts: never a bare percentage. With nothing to divide by, the value is null.

export const herramientasMetricas = [
  definir({
    nombre: "metricas",
    descripcion:
      "Las ocho métricas del tablero para el período, con numerador y denominador en cada una, y el embudo. Un valor null es 'sin datos', no cero. Las fracciones van de 0 a 1. No hay umbrales: los números no dicen si está bien o mal.",
    lectura: true,
    entrada: {
      periodo: z.enum(["mes", "3meses"]).describe("mes: el mes en curso. 3meses: el mes en curso y los dos anteriores."),
    },
    ejecutar: async ({ periodo }) => {
      const { periodo: p, metricas, embudo } = await leerTablero(periodo)
      return { periodo: { desde: p.desde, hasta: p.hasta, meses: p.meses }, metricas, embudo }
    },
  }),

  definir({
    nombre: "avisos",
    descripcion:
      "Los tres avisos del tablero: renegociaciones en una entrega (cualquiera mayor a cero es grave), ventas cerradas a las que les falta la pregunta post-venta, y si la semana llegó a 15 citas cumplidas.",
    lectura: true,
    entrada: {},
    ejecutar: async () => (await leerTablero("mes")).avisos,
  }),
]
