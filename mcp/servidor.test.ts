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
function propiedades(schema: unknown): { nombre: string; tipo: unknown; opciones?: unknown }[] {
  if (!schema || typeof schema !== "object") return []
  const nodo = schema as { properties?: Record<string, { type?: unknown; enum?: unknown }>; items?: unknown }
  const propias = Object.entries(nodo.properties ?? {}).map(([nombre, valor]) => ({ nombre, tipo: valor.type, opciones: valor.enum }))
  return [
    ...propias,
    ...Object.values(nodo.properties ?? {}).flatMap(propiedades),
    ...propiedades(nodo.items),
  ]
}

describe("el catálogo del MCP", () => {
  it("expone las tools de stock, las de lectura del canal y las del caso", async () => {
    const { tools } = await (await conectar(crearServidor({ operador: vendedor, archivosLocales: false }))).listTools()
    expect(tools.map((t) => t.name).sort()).toEqual(
      [
        "agendar_cita",
        "agregar_nota",
        "buscar_stock",
        "cargar_auto",
        "cargar_tasacion",
        "cerrar_caso",
        "completar_auto",
        "despublicar_auto",
        "historial_telefono",
        "listar_casos",
        "listar_pedidos_del_dia",
        "marcar_inspeccionado",
        "marcar_vendido",
        "marcar_venta_nueva",
        "poner_precio",
        "publicar_auto",
        "publicar_propuesta",
        "stock_desactualizado",
        "ver_auto",
        "ver_caso",
        "ver_pedido",
      ].sort(),
    )
  })

  it("ninguna tool pide ni devuelve un valor de toma, una estimación ni el margen, salvo cargar_tasacion", async () => {
    const { tools } = await (await conectar(crearServidor({ operador: vendedor, archivosLocales: false }))).listTools()
    const prohibido = /valor|toma|tasac|estim|margen|ganancia|comisi/i
    // The one exception: Andrés writing his own judgement. It takes the number and says nothing else back.
    const excepcion = new Set(["cargar_tasacion", "cargar_tasacion.valor_toma"])
    for (const tool of tools) {
      if (!excepcion.has(tool.name)) expect(tool.name).not.toMatch(prohibido)
      for (const { nombre } of [...propiedades(tool.inputSchema), ...propiedades(tool.outputSchema)]) {
        const campo = `${tool.name}.${nombre}`
        if (!excepcion.has(campo)) expect(campo.replace(/^cargar_tasacion\./, "")).not.toMatch(prohibido)
      }
    }
  })

  it("cargar_tasacion es solo de falkenberg: un vendedor no la puede correr", async () => {
    const cliente = await conectar(crearServidor({ operador: vendedor, archivosLocales: false }))
    const resultado = await cliente.callTool({ name: "cargar_tasacion", arguments: { ref: "LL-0001", valor_toma: 1 } })
    expect(resultado.isError).toBe(true)
    expect(JSON.stringify(resultado.content)).toMatch(/solo para falkenberg/)
  })

  it("ningún inputSchema tiene un campo que sea una instrucción para interpretar", async () => {
    const { tools } = await (await conectar(crearServidor({ operador: vendedor, archivosLocales: false }))).listTools()
    // The only free strings allowed are data: the car's line, a search filter, an id, the ficha fields, a
    // phone, a date, a note and the reason a case was lost. A new free-text field has to be added here on
    // purpose. A closed list of options isn't free text.
    const textosPermitidos = new Set([
      "slug",
      "ref",
      "linea",
      "buscar",
      "marca",
      "modelo",
      "version",
      "segmento",
      "telefono",
      "fecha",
      "texto",
      "motivo",
    ])
    for (const tool of tools) {
      for (const { nombre, tipo, opciones } of propiedades(tool.inputSchema)) {
        expect(nombre).not.toMatch(/instruc|comando|prompt|accion|hacer|orden|pedido|mensaje/i)
        if (tipo === "string" && !opciones) expect(textosPermitidos, `${tool.name}.${nombre}`).toContain(nombre)
      }
    }
  })

  it("las tools de lectura se declaran de solo lectura, y lo que no se deshace como destructivo", async () => {
    const { tools } = await (await conectar(crearServidor({ operador: vendedor, archivosLocales: false }))).listTools()
    const hint = (nombre: string) => tools.find((t) => t.name === nombre)!.annotations
    const lecturas = ["buscar_stock", "ver_auto", "stock_desactualizado", "ver_pedido", "listar_pedidos_del_dia"]
    for (const lectura of [...lecturas, "listar_casos", "ver_caso", "historial_telefono"]) {
      expect(hint(lectura)?.readOnlyHint).toBe(true)
    }
    expect(hint("cargar_auto")?.readOnlyHint).toBe(false)
    expect(hint("agendar_cita")?.readOnlyHint).toBe(false)
    for (const destructiva of ["marcar_vendido", "publicar_propuesta", "cerrar_caso"]) {
      expect(hint(destructiva)?.destructiveHint).toBe(true)
    }
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
