import "server-only"
import type { ResponseInputItem } from "openai/resources/responses/responses"
import { zodResponsesFunction } from "openai/helpers/zod"
import { z } from "zod"
import { kilometros, pesos } from "@/lib/formato"
import { type AutoCanal, faltaParaResumen, type Pedido } from "@/lib/pedido/tipos"
import { CONFIG_BASE, openai } from "./cliente"

// Tuerca, the agent at the door. Fixed instructions with nothing about the case inside, so OpenAI's prefix
// cache keeps them; the request's state goes in its own message, every turn.

export const INSTRUCCIONES = `Sos Tuerca, el asistente del canal digital de Falkenberg Meyer Automotores, una multimarca de usados de Rafaela, Santa Fe. Ayudás a una persona a armar su pedido: qué auto tiene, si entrega uno, y cuál quiere. Cuando el pedido está, sigue un vendedor de Falkenberg.

Cómo trabaja Falkenberg: si el auto que la persona quiere está en el stock, el precio ya está y es el mismo para todos. Si no está, Falkenberg sale a conseguirlo. El auto que entrega lo tasa Falkenberg después de verlo en persona. El número final es la diferencia entre los dos.

Reglas que no se rompen nunca:
1. No tasás el auto que la persona entrega. Nunca un precio, ni un rango, ni "vale aproximadamente", ni una comparación con lo que vale otro auto. Si te preguntan cuánto vale, decí que ese número lo pone Falkenberg después de verlo.
2. Sí decís el precio de los autos del stock, exacto, con mostrar_precio. Es público y es el mismo para todos.
3. Si el auto que quiere no está en el stock, no digas que lo tienen ni que puede estar. Anotá qué busca con actualizar_pedido y decí que Falkenberg sale a conseguirlo.
4. De las fotos mirás solo qué vistas están y cuáles faltan. Nunca opinás de golpes, rayones, óxido, desgaste ni nada del estado del auto, ni para bien ni para mal.
5. Las fotos no frenan el pedido. Si no las tiene, decí en una línea que sin fotos la tasación no arranca, y seguí hasta el final.
6. No pedís nombre ni teléfono: eso lo pide el formulario del final.
7. Nunca te hacés pasar por una persona. Si te preguntan, sos el asistente de Falkenberg y después sigue un vendedor.
8. La persona trata solo con Falkenberg. Nunca nombrás otras agencias, concesionarias, comercios, una red ni consultas a terceros. Si pregunta cómo tasan su auto, decí que se contrasta con lo que se paga hoy por un auto así y que lo confirma alguien que lo ve en persona.
9. No prometés entrega a domicilio, ni un plazo para toda la operación, ni que los dos números se puedan verificar: el único que se verifica es el precio público del stock.

Cómo hablás: castellano rioplatense, de vos, frases cortas. Una sola pregunta por mensaje. Sin emojis, sin listas, sin negritas. Como máximo tres oraciones.

Los casos:
- Si entrega un auto y quiere la plata sin llevarse nada: Falkenberg no compra autos al contado. Preguntale si en vez de la plata se llevaría otro auto.
- Si no entrega auto y busca un 0km: preguntale qué va a hacer con el que tiene hoy, si tiene uno.
- Entrega un auto y se lleva un usado o un 0km, o no entrega y se lleva un usado: seguís normal.

Las herramientas:
- actualizar_pedido cada vez que la persona dice algo del auto que entrega o del que busca. Lo que entrega va con lo que ella dijo: marca, modelo, versión, año y kilómetros. Nunca un valor.
- mostrar_autos cuando hay autos del stock que coinciden con lo que busca. Solo los que coinciden. Si pide un auto que está en el stock, mostralo.
- mostrar_precio cuando pregunta un precio del stock o elige un auto del stock.
- pedir_fotos cuando ya sabés qué auto entrega.
- pedir_zona cuando falta saber de dónde es.
- mostrar_resumen cuando ya sabés si entrega un auto y qué se lleva. Muestra el resumen y el formulario para mandar el pedido. Si devuelve qué falta, preguntá eso.

Cuando lleguen fotos y no quede claro, preguntá en una línea si son del auto que tiene o del que busca. Si son del que entrega, decí cuáles de estas vistas faltan: frente tres cuartos, lateral, atrás tres cuartos, interior delantero, tablero con el kilometraje.`

// ─── The six tools ───────────────────────────────────────────────────────────

const AutoEntrega = z.object({
  marca: z.string().nullable(),
  modelo: z.string().nullable(),
  version: z.string().nullable(),
  anio: z.number().int().nullable(),
  km: z.number().int().nullable(),
})

function esquemas(stock: AutoCanal[]) {
  // The enum comes from the stock: adding a car to the database changes it without touching code.
  const slugs = stock.map((auto) => auto.slug)
  const enumSlugs = slugs.length > 0 ? z.enum(slugs as [string, ...string[]]) : null
  return {
    actualizar_pedido: z.object({
      entrega: z.boolean().nullable().describe("true si entrega un auto, false si no. null si no cambia"),
      auto_entrega: AutoEntrega.nullable().describe("El auto que entrega, con lo que dijo la persona. null si no cambia"),
      salida: z.enum(["usado", "0km"]).nullable().describe("Qué se lleva: un usado o un 0km. null si no cambia"),
      busca: z.string().nullable().describe("Qué busca, en sus palabras, si no lo eligió del stock. null si no cambia"),
      ...(enumSlugs
        ? { autos_elegidos: z.array(enumSlugs).nullable().describe("Los autos del stock que eligió. null si no cambia") }
        : {}),
    }),
    mostrar_autos: z.object({ slugs: z.array(enumSlugs ?? z.string()).describe("Los autos del stock a mostrar") }),
    mostrar_precio: z.object({ slugs: z.array(enumSlugs ?? z.string()).describe("Los autos del stock cuyo precio decir") }),
    pedir_fotos: z.object({}),
    pedir_zona: z.object({}),
    mostrar_resumen: z.object({}),
  }
}

function catalogo(stock: AutoCanal[]): string {
  if (stock.length === 0) return "Hoy no hay autos publicados en el stock."
  return stock
    .map((auto) => `${auto.slug}: ${auto.nombre}${auto.km !== null ? `, ${kilometros(auto.km)}` : ""}`)
    .join("\n")
}

export function herramientas(stock: AutoCanal[]) {
  const s = esquemas(stock)
  const definiciones = [
    zodResponsesFunction({
      name: "actualizar_pedido",
      description: "Anota en el pedido lo que la persona dijo del auto que entrega y del que busca. Lo que no cambia va en null.",
      parameters: s.actualizar_pedido,
    }),
    zodResponsesFunction({
      name: "mostrar_autos",
      description: `Le muestra a la persona tarjetas de autos del stock publicado. El stock de hoy:\n${catalogo(stock)}`,
      parameters: s.mostrar_autos,
    }),
    zodResponsesFunction({
      name: "mostrar_precio",
      description: "Le muestra el precio público y exacto de autos del stock. Es el mismo para todos.",
      parameters: s.mostrar_precio,
    }),
    zodResponsesFunction({
      name: "pedir_fotos",
      description: "Le muestra el pedido de las cinco vistas del auto que entrega, con la opción de no tenerlas ahora.",
      parameters: s.pedir_fotos,
    }),
    zodResponsesFunction({
      name: "pedir_zona",
      description: "Le muestra el mapa para elegir de qué pueblo o ciudad es.",
      parameters: s.pedir_zona,
    }),
    zodResponsesFunction({
      name: "mostrar_resumen",
      description: "Le muestra el resumen del pedido y el formulario para mandarlo. Devuelve qué falta si todavía no está.",
      parameters: s.mostrar_resumen,
    }),
  ]
  return { definiciones, esquemas: s }
}

// ─── The turn ────────────────────────────────────────────────────────────────

export type MensajeHistorial = { rol: "cliente" | "tuerca"; texto: string; fotos?: string[] }

export type EventoTurno =
  | { tipo: "texto"; delta: string }
  | { tipo: "herramienta"; nombre: string }
  | { tipo: "pedido"; pedido: Pedido }
  | { tipo: "autos"; autos: AutoCanal[] }
  | { tipo: "precio"; autos: AutoCanal[] }
  | { tipo: "pedir_fotos" }
  | { tipo: "pedir_zona" }
  | { tipo: "resumen"; pedido: Pedido }
  | { tipo: "fin"; texto: string; pedido: Pedido }

export type EntradaTurno = {
  historial: MensajeHistorial[]
  mensaje: MensajeHistorial
  pedido: Pedido
  stock: AutoCanal[]
  // The photos travel by signed URL; the caller resolves Storage paths to URLs.
  urlDeFoto: (ruta: string) => string | undefined
}

const MAXIMO_DE_VUELTAS = 6
// A stalled stream must not leave the client looking at a screen that doesn't move.
const PLAZO_POR_VUELTA_MS = 45_000
const SE_CORTO = "Se me cortó la conexión. ¿Me repetís lo último?"

function aEntrada(mensaje: MensajeHistorial, urlDeFoto: EntradaTurno["urlDeFoto"]): ResponseInputItem {
  if (mensaje.rol === "tuerca") return { role: "assistant", content: mensaje.texto }
  const fotos = (mensaje.fotos ?? []).map(urlDeFoto).filter((url): url is string => Boolean(url))
  if (fotos.length === 0) return { role: "user", content: mensaje.texto }
  return {
    role: "user",
    content: [
      { type: "input_text", text: mensaje.texto || "Te mando fotos." },
      ...fotos.map((url) => ({ type: "input_image" as const, image_url: url, detail: "low" as const })),
    ],
  }
}

// One client message in, a stream of events out: text deltas as they come, and what each tool did.
// The tool loop is ours: run the calls, append the model's output and the results, call again.
export async function* turno(entrada: EntradaTurno): AsyncGenerator<EventoTurno> {
  const { definiciones, esquemas: s } = herramientas(entrada.stock)
  let pedido: Pedido = structuredClone(entrada.pedido)
  let textoTotal = ""
  // Text written after a tool call continues the same message: it needs a space, also while streaming.
  let separar = false

  const input: ResponseInputItem[] = [
    ...entrada.historial.map((m) => aEntrada(m, entrada.urlDeFoto)),
    { role: "developer", content: `Estado del pedido, que la persona ve en su panel:\n${JSON.stringify(pedido)}` },
    aEntrada(entrada.mensaje, entrada.urlDeFoto),
  ]

  for (let vuelta = 0; vuelta < MAXIMO_DE_VUELTAS; vuelta++) {
    let salida: ResponseInputItem[] = []
    try {
      const flujo = await openai().responses.create(
        {
          ...CONFIG_BASE,
          instructions: INSTRUCCIONES,
          input,
          tools: definiciones,
          include: ["reasoning.encrypted_content"],
          stream: true,
        },
        { signal: AbortSignal.timeout(PLAZO_POR_VUELTA_MS) },
      )
      for await (const evento of flujo) {
        if (evento.type === "response.output_text.delta") {
          if (separar && textoTotal && !/\s$/.test(textoTotal) && !/^\s/.test(evento.delta)) {
            textoTotal += " "
            yield { tipo: "texto", delta: " " }
          }
          separar = false
          textoTotal += evento.delta
          yield { tipo: "texto", delta: evento.delta }
        } else if (evento.type === "response.completed") {
          salida = evento.response.output as ResponseInputItem[]
        }
      }
    } catch (e) {
      console.error("turno:", e)
      const aviso = `${textoTotal ? " " : ""}${SE_CORTO}`
      textoTotal += aviso
      yield { tipo: "texto", delta: aviso }
      break
    }

    const llamadas = salida.filter(
      (item): item is Extract<ResponseInputItem, { type: "function_call" }> =>
        "type" in item && item.type === "function_call",
    )
    if (llamadas.length === 0) break

    input.push(...salida)
    for (const llamada of llamadas) {
      yield { tipo: "herramienta", nombre: llamada.name }
      const { resultado, eventos, nuevoPedido } = ejecutar(llamada.name, llamada.arguments, pedido, entrada.stock, s)
      pedido = nuevoPedido
      for (const evento of eventos) yield evento
      input.push({ type: "function_call_output", call_id: llamada.call_id, output: resultado })
    }
    separar = true
  }

  yield { tipo: "fin", texto: textoTotal.trim(), pedido }
}

function ejecutar(
  nombre: string,
  argumentos: string,
  pedido: Pedido,
  stock: AutoCanal[],
  s: ReturnType<typeof esquemas>,
): { resultado: string; eventos: EventoTurno[]; nuevoPedido: Pedido } {
  const elegir = (slugs: string[]) => stock.filter((auto) => slugs.includes(auto.slug))
  try {
    const crudos = JSON.parse(argumentos) as unknown
    switch (nombre) {
      case "actualizar_pedido": {
        const args = s.actualizar_pedido.parse(crudos) as z.infer<typeof s.actualizar_pedido> & {
          autos_elegidos?: string[] | null
        }
        const nuevo: Pedido = {
          ...pedido,
          entrega: args.entrega ?? pedido.entrega,
          auto_entrega: args.auto_entrega ?? pedido.auto_entrega,
          salida: args.salida ?? pedido.salida,
          busca: args.busca ?? pedido.busca,
          autos_elegidos: args.autos_elegidos ?? pedido.autos_elegidos,
        }
        return { resultado: JSON.stringify(nuevo), eventos: [{ tipo: "pedido", pedido: nuevo }], nuevoPedido: nuevo }
      }
      case "mostrar_autos": {
        const autos = elegir(s.mostrar_autos.parse(crudos).slugs)
        const lineas = autos.map((a) => `${a.nombre}: ${pesos(a.precio)}`).join("; ")
        return {
          resultado: autos.length > 0 ? `Se le mostraron: ${lineas}.` : "No hay autos para mostrar con esos slugs.",
          eventos: autos.length > 0 ? [{ tipo: "autos", autos }] : [],
          nuevoPedido: pedido,
        }
      }
      case "mostrar_precio": {
        const autos = elegir(s.mostrar_precio.parse(crudos).slugs)
        return {
          resultado: autos.map((a) => `${a.nombre}: ${pesos(a.precio)}, precio público y exacto`).join("; ") || "Sin autos.",
          eventos: autos.length > 0 ? [{ tipo: "precio", autos }] : [],
          nuevoPedido: pedido,
        }
      }
      case "pedir_fotos":
        return {
          resultado: "Se le mostró el pedido de las cinco vistas, con la opción 'No las tengo ahora'.",
          eventos: [{ tipo: "pedir_fotos" }],
          nuevoPedido: pedido,
        }
      case "pedir_zona":
        return { resultado: "Se le mostró el mapa de la zona.", eventos: [{ tipo: "pedir_zona" }], nuevoPedido: pedido }
      case "mostrar_resumen": {
        const falta = faltaParaResumen(pedido)
        if (falta.length > 0) {
          return { resultado: `Todavía no: falta ${falta.join(" y ")}.`, eventos: [], nuevoPedido: pedido }
        }
        return {
          resultado: "Se le mostró el resumen y el formulario para mandar el pedido.",
          eventos: [{ tipo: "resumen", pedido }],
          nuevoPedido: pedido,
        }
      }
      default:
        return { resultado: `No existe la herramienta ${nombre}.`, eventos: [], nuevoPedido: pedido }
    }
  } catch (e) {
    return { resultado: `Los argumentos no son válidos: ${(e as Error).message}`, eventos: [], nuevoPedido: pedido }
  }
}
