import { Client } from "@modelcontextprotocol/sdk/client/index.js"
import { InMemoryTransport } from "@modelcontextprotocol/sdk/inMemory.js"
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { describe, expect, it } from "vitest"
import type { OperadorMcp } from "@/lib/operador"
import { definir } from "./herramienta"
import { crearServidor, registrar } from "./servidor"

const vendedor: OperadorMcp = { token: "t".repeat(43), nombre: "Prueba", rol: "vendedor" }

async function conectar(servidor: McpServer): Promise<Client> {
  const [lado, otroLado] = InMemoryTransport.createLinkedPair()
  const cliente = new Client({ name: "prueba", version: "1.0.0" })
  await Promise.all([servidor.connect(lado), cliente.connect(otroLado)])
  return cliente
}

// Every property name in a JSON schema, at any depth.
function propiedades(schema: unknown): { nombre: string; tipo: unknown }[] {
  if (!schema || typeof schema !== "object") return []
  const nodo = schema as { properties?: Record<string, { type?: unknown }>; items?: unknown }
  const propias = Object.entries(nodo.properties ?? {}).map(([nombre, valor]) => ({ nombre, tipo: valor.type }))
  return [
    ...propias,
    ...Object.values(nodo.properties ?? {}).flatMap(propiedades),
    ...propiedades(nodo.items),
  ]
}

describe("el catálogo del MCP", () => {
  it("expone las tools de stock de esta tanda", async () => {
    const { tools } = await (await conectar(crearServidor({ operador: vendedor, archivosLocales: false }))).listTools()
    expect(tools.map((t) => t.name).sort()).toEqual(
      [
        "buscar_stock",
        "cargar_auto",
        "completar_auto",
        "despublicar_auto",
        "marcar_vendido",
        "poner_precio",
        "publicar_auto",
        "stock_desactualizado",
        "ver_auto",
      ].sort(),
    )
  })

  it("ninguna tool pide ni devuelve un valor de toma, una estimación ni el margen", async () => {
    const { tools } = await (await conectar(crearServidor({ operador: vendedor, archivosLocales: false }))).listTools()
    const prohibido = /valor|toma|tasac|estim|margen|ganancia|comisi/i
    for (const tool of tools) {
      expect(tool.name).not.toMatch(prohibido)
      for (const { nombre } of [...propiedades(tool.inputSchema), ...propiedades(tool.outputSchema)]) {
        expect(`${tool.name}.${nombre}`).not.toMatch(prohibido)
      }
    }
  })

  it("ningún inputSchema tiene un campo que sea una instrucción para interpretar", async () => {
    const { tools } = await (await conectar(crearServidor({ operador: vendedor, archivosLocales: false }))).listTools()
    // The only free strings allowed are data: the car's line, a search filter, an id and the ficha fields.
    // A new free-text field has to be added here on purpose.
    const textosPermitidos = new Set(["slug", "linea", "buscar", "marca", "modelo", "version", "segmento"])
    for (const tool of tools) {
      for (const { nombre, tipo } of propiedades(tool.inputSchema)) {
        expect(nombre).not.toMatch(/instruc|comando|prompt|accion|hacer|orden|pedido|mensaje/i)
        if (tipo === "string") expect(textosPermitidos, `${tool.name}.${nombre}`).toContain(nombre)
      }
    }
  })

  it("las tools de lectura se declaran de solo lectura y marcar_vendido como destructiva", async () => {
    const { tools } = await (await conectar(crearServidor({ operador: vendedor, archivosLocales: false }))).listTools()
    const hint = (nombre: string) => tools.find((t) => t.name === nombre)!.annotations
    for (const lectura of ["buscar_stock", "ver_auto", "stock_desactualizado"]) {
      expect(hint(lectura)?.readOnlyHint).toBe(true)
    }
    expect(hint("cargar_auto")?.readOnlyHint).toBe(false)
    expect(hint("marcar_vendido")?.destructiveHint).toBe(true)
  })

  it("las instrucciones del servidor dicen que no estima y que el valor de toma lo pone Andrés", async () => {
    const cliente = await conectar(crearServidor({ operador: vendedor, archivosLocales: false }))
    const instrucciones = cliente.getInstructions() ?? ""
    expect(instrucciones).toMatch(/No estimás nunca el valor del auto que entrega un cliente/)
    expect(instrucciones).toMatch(/lo pone Andrés después de ver el auto en persona/)
  })

  it("un token de vendedor no puede usar una tool reservada a falkenberg", async () => {
    const servidor = new McpServer({ name: "prueba", version: "1.0.0" })
    let corrio = false
    registrar(
      servidor,
      [
        definir({
          nombre: "solo_falkenberg",
          descripcion: "prueba",
          lectura: true,
          roles: ["falkenberg"],
          entrada: {},
          ejecutar: async () => {
            corrio = true
            return "no debería correr"
          },
        }),
      ],
      { operador: vendedor, archivosLocales: false },
    )
    const resultado = await (await conectar(servidor)).callTool({ name: "solo_falkenberg", arguments: {} })
    expect(resultado.isError).toBe(true)
    expect(JSON.stringify(resultado.content)).toMatch(/solo para falkenberg/)
    expect(corrio).toBe(false)
  })
})
