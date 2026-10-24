import { turno } from "@/lib/agente/tuerca"
import { CONTENIDO } from "@/lib/contenido"
import { registrar } from "@/lib/db/eventos"
import { dentroDelLimite, ipDe } from "@/lib/limites"
import { stockCanal } from "@/lib/pedido/canal"
import { TurnoEsquema } from "@/lib/pedido/esquema"
import { urlsFirmadas } from "@/lib/stock/stock"

// Tuerca's turn: the whole conversation comes in (store: false, nothing is kept on OpenAI's side) and the
// turn goes out as newline-delimited JSON events, text as it's written and what each tool did.

export const dynamic = "force-dynamic"
export const maxDuration = 60

export async function POST(pedido: Request): Promise<Response> {
  // Before anything else, malformed requests included: each turn is a paid call to the model.
  const ip = ipDe(pedido.headers)
  const [porIp, porDia, total] = await Promise.all([
    dentroDelLimite("chat", ip),
    dentroDelLimite("chatDia", ip),
    dentroDelLimite("chatTotal", ip),
  ])
  if (!total) return Response.json({ error: CONTENIDO.limites.chatTotal }, { status: 429 })
  if (!porDia) return Response.json({ error: CONTENIDO.limites.chatDia }, { status: 429 })
  if (!porIp) return Response.json({ error: CONTENIDO.limites.chat }, { status: 429 })

  const cuerpo = TurnoEsquema.safeParse(await pedido.json().catch(() => null))
  if (!cuerpo.success) return Response.json({ error: "Pedido inválido." }, { status: 400 })
  const { chat, historial, mensaje, pedido: estado } = cuerpo.data

  // The funnel's first step: the client's first message.
  if (!historial.some((m) => m.rol === "cliente")) {
    await registrar("chat_iniciado", null, { chat }).catch((e) => console.error("chat_iniciado:", e))
  }

  const [stock, urls] = await Promise.all([
    stockCanal(),
    urlsFirmadas([...historial.flatMap((m) => m.fotos ?? []), ...(mensaje.fotos ?? [])], 900),
  ])

  const codificador = new TextEncoder()
  const flujo = new ReadableStream<Uint8Array>({
    async start(controlador) {
      const enviar = (evento: unknown) => controlador.enqueue(codificador.encode(`${JSON.stringify(evento)}\n`))
      try {
        for await (const evento of turno({ historial, mensaje, pedido: estado, stock, urlDeFoto: (r) => urls[r] })) {
          enviar(evento)
        }
      } catch (e) {
        console.error("chat:", e)
        const texto = "Se me cortó la conexión. ¿Me repetís lo último?"
        enviar({ tipo: "texto", delta: texto })
        enviar({ tipo: "fin", texto, pedido: estado })
      }
      controlador.close()
    },
  })

  return new Response(flujo, {
    headers: { "content-type": "application/x-ndjson; charset=utf-8", "cache-control": "no-store" },
  })
}
