"use server"

import { headers } from "next/headers"
import { CONTENIDO } from "@/lib/contenido"
import { ErrorDeRegla } from "@/lib/errores"
import { dentroDelLimite, ErrorLimite, ipDe } from "@/lib/limites"
import { enviarPedido, type PedidoEnviado, subidasDeCliente } from "@/lib/pedido/canal"
import { PedidoEsquema } from "@/lib/pedido/esquema"

// The public page's two server actions. No session: the client never logs in.

type Resultado<T> = ({ ok: true } & T) | { ok: false; error: string }

async function intentar<T extends object>(fn: () => Promise<T>): Promise<Resultado<T>> {
  try {
    return { ok: true, ...(await fn()) }
  } catch (e) {
    if (e instanceof ErrorDeRegla) return { ok: false, error: e.message }
    console.error(e)
    return { ok: false, error: "No se pudo mandar. Probá de nuevo en un momento." }
  }
}

export async function pedirSubidasCliente(cantidad: number) {
  return intentar(async () => {
    if (!(await dentroDelLimite("subidas", ipDe(await headers())))) throw new ErrorLimite(CONTENIDO.limites.subidas)
    return { subidas: await subidasDeCliente(cantidad) }
  })
}

export async function mandarPedido(datos: {
  pedido: unknown
  nombre: string
  telefono: string
  chat: string
}): Promise<Resultado<{ enviado: PedidoEnviado }>> {
  return intentar(async () => {
    const encabezados = await headers()
    if (!(await dentroDelLimite("pedido", ipDe(encabezados)))) throw new ErrorLimite(CONTENIDO.limites.pedido)
    const pedido = PedidoEsquema.parse(datos.pedido)
    const host = encabezados.get("x-forwarded-host") ?? encabezados.get("host") ?? "localhost:3000"
    const protocolo = encabezados.get("x-forwarded-proto") ?? (host.startsWith("localhost") ? "http" : "https")
    const enviado = await enviarPedido({
      pedido,
      nombre: String(datos.nombre ?? ""),
      telefono: String(datos.telefono ?? ""),
      origen: `${protocolo}://${host}`,
      chat: typeof datos.chat === "string" ? datos.chat.slice(0, 40) : undefined,
    })
    return { enviado }
  })
}
