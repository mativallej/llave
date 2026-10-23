// The request the client builds while talking. Shared by the browser, the agent and the closing step.
// What the client hands in carries what they said about it, never a value.

export type AutoEntrega = {
  marca: string | null
  modelo: string | null
  version: string | null
  anio: number | null
  km: number | null
}

export type Pedido = {
  entrega: boolean | null
  auto_entrega: AutoEntrega | null
  salida: "usado" | "0km" | null
  busca: string | null
  autos_elegidos: string[]
  zona: string | null
  fotos: string[]
}

export const PEDIDO_VACIO: Pedido = {
  entrega: null,
  auto_entrega: null,
  salida: null,
  busca: null,
  autos_elegidos: [],
  zona: null,
  fotos: [],
}

// A stock car as the public channel sees it: public data only.
export type AutoCanal = {
  slug: string
  nombre: string
  anio: number | null
  km: number | null
  precio: number
  foto: string | null
}

// What's missing before the request can be summarised and sent. Empty means it's ready.
export function faltaParaResumen(pedido: Pedido): string[] {
  const falta: string[] = []
  if (pedido.entrega === null) falta.push("saber si entrega un auto")
  if (pedido.salida === null && pedido.autos_elegidos.length === 0 && !pedido.busca) falta.push("saber qué se lleva")
  return falta
}

export const RUTA_FOTO_PEDIDO = /^pedidos\/tmp\/[0-9a-f-]{36}\.jpg$/
