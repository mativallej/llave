import "server-only"
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import type { CallToolResult } from "@modelcontextprotocol/sdk/types.js"
import { ErrorDeRegla } from "@/lib/errores"
import { registrarUso } from "@/lib/operador"
import type { Contexto, Herramienta } from "./herramienta"
import { herramientasCasos } from "./herramientas/casos"
import { herramientasMetricas } from "./herramientas/metricas"
import { herramientasPedidos } from "./herramientas/pedidos"
import { herramientasStock } from "./herramientas/stock"

// Autonomy to read, determinism to act. Reading tools are free; every writing tool does exactly one thing
// with typed arguments. No tool takes a free-text instruction, and none estimates the value of the car
// a client hands in or exposes the margin.

export const INSTRUCCIONES_MCP = `Operás el canal de Falkenberg Meyer Automotores, una multimarca de usados de Rafaela.

Leer es libre: buscar en el stock, ver un auto, ver qué está desactualizado. Cada herramienta que escribe hace una sola cosa.

No estimás nunca el valor del auto que entrega un cliente, ni un rango, ni "aproximadamente". Ese número lo pone Andrés después de ver el auto en persona, y ninguna herramienta lo calcula. Si te lo piden, decí eso. Tampoco hay herramientas de margen: cuánto gana Falkenberg no se muestra.

El precio de un auto del stock es público y lo dicta una persona: se pone con poner_precio, en una llamada propia, y no lo propongas vos.

Para cargar un auto: cargar_auto con la línea que mandaron, después completar_auto con lo que haya quedado sin deducir, poner_precio y publicar_auto. Por acá no se cargan fotos: ninguna herramienta las recibe, ni pegadas ni por link. Se suben desde /admin/stock, con "Sacar foto". Si te mandan una foto, decí eso.

Un caso se mueve de a un paso, con la herramienta de ese paso, desde que llegan las fotos hasta que se cierra la venta. cargar_tasacion es solo de Andrés y lleva el número que dijo él: si no te lo dictó, no la llames. En marcar_conseguido el precio es el del auto que se consiguió y lo dice quien opera: no lo propongas vos. Para cerrar un caso perdido preguntá el motivo y si se cayó porque no le contestamos a tiempo; no lo supongas. Lo que no tiene herramienta se hace desde el link del caso, que devuelve ver_caso.

Las métricas se dicen siempre con su numerador y su denominador, nunca un porcentaje solo: un 80% de 5 respuestas no es un 80%. Un null es "sin datos", no cero. Los números no traen umbral: no digas si una métrica está bien o mal.`

// Each change that builds something registers its own tools here: the MCP grows with the product.
const HERRAMIENTAS: Herramienta[] = [
  ...herramientasStock,
  ...herramientasPedidos,
  ...herramientasCasos,
  ...herramientasMetricas,
] as Herramienta[]

export function crearServidor(contexto: Contexto): McpServer {
  const servidor = new McpServer({ name: "llave", version: "1.0.0" }, { instructions: INSTRUCCIONES_MCP })
  registrar(servidor, HERRAMIENTAS, contexto)
  return servidor
}

export function registrar(servidor: McpServer, herramientas: Herramienta[], contexto: Contexto): void {
  for (const herramienta of herramientas) {
    servidor.registerTool(
      herramienta.nombre,
      {
        description: herramienta.descripcion,
        inputSchema: herramienta.entrada,
        annotations: {
          readOnlyHint: herramienta.lectura,
          destructiveHint: herramienta.destructiva ?? false,
          openWorldHint: false,
        },
      },
      async (args: unknown): Promise<CallToolResult> => {
        const { operador } = contexto
        // The role is resolved before anything runs.
        if (herramienta.roles && !herramienta.roles.includes(operador.rol)) {
          return fallo(`${herramienta.nombre} es solo para ${herramienta.roles.join(" o ")}. Tu rol es ${operador.rol}.`)
        }
        try {
          await registrarUso(operador.token)
          const resultado = await herramienta.ejecutar(args as never, contexto)
          return { content: [{ type: "text", text: JSON.stringify(resultado, null, 2) }] }
        } catch (e) {
          if (e instanceof ErrorDeRegla) return fallo(e.message)
          console.error(e)
          return fallo("Algo falló del lado del servidor. Probá de nuevo en un momento.")
        }
      },
    )
  }
}

function fallo(mensaje: string): CallToolResult {
  return { isError: true, content: [{ type: "text", text: mensaje }] }
}
