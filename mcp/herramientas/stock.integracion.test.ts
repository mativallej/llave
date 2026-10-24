import { randomBytes } from "node:crypto"
import { Client } from "@modelcontextprotocol/sdk/client/index.js"
import { InMemoryTransport } from "@modelcontextprotocol/sdk/inMemory.js"
import { afterAll, beforeAll, describe, expect, it } from "vitest"
import { db } from "@/lib/db/server"
import type { OperadorMcp } from "@/lib/operador"
import { crearServidor } from "../servidor"

const conTodo = Boolean(
  process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY && process.env.OPENAI_API_KEY,
)

describe.skipIf(!conTodo)("las tools de stock contra la base y el modelo", () => {
  const operador: OperadorMcp = { token: randomBytes(32).toString("base64url"), nombre: "Prueba MCP", rol: "vendedor" }
  const slugs: string[] = []
  let cliente: Client

  beforeAll(async () => {
    await db().from("operador").insert({ token: operador.token, nombre: operador.nombre, rol: operador.rol })
    const [lado, otroLado] = InMemoryTransport.createLinkedPair()
    cliente = new Client({ name: "prueba", version: "1.0.0" })
    await Promise.all([crearServidor({ operador }).connect(lado), cliente.connect(otroLado)])
  }, 30_000)

  afterAll(async () => {
    await db().from("auto").delete().in("slug", slugs)
    await db().from("operador").delete().eq("token", operador.token)
  })

  async function llamar(name: string, args: Record<string, unknown>) {
    const resultado = await cliente.callTool({ name, arguments: args })
    const texto = (resultado.content as { text: string }[])[0].text
    return { error: resultado.isError === true, texto, datos: resultado.isError ? null : JSON.parse(texto) }
  }

  it("cargar_auto con la línea sola: deduce, no inventa, y queda sin publicar, sin precio y sin fotos", async () => {
    const { error, datos } = await llamar("cargar_auto", { linea: "entró un Corolla XEI 2019 con 78 mil" })
    expect(error).toBe(false)
    slugs.push(datos.slug)
    expect(datos.marca).toMatch(/toyota/i)
    expect(datos.modelo).toMatch(/corolla/i)
    expect(datos.version).toMatch(/xei/i)
    expect(datos.anio).toBe(2019)
    expect(datos.km).toBe(78000)
    expect(datos.precio).toBeNull()
    expect(datos.publicado).toBe(false)
    expect(datos.fotos).toMatch(/\/admin\/stock/)
    expect(datos.falta[0]).toBe("precio")
    const { data: auto } = await db().from("auto").select("fotos").eq("slug", datos.slug).single()
    expect(auto!.fotos).toEqual([])
  }, 90_000)

  it("publicar sin precio falla con un mensaje que lo explica y el auto queda sin publicar", async () => {
    const { error, texto } = await llamar("publicar_auto", { slug: slugs[0] })
    expect(error).toBe(true)
    expect(texto).toMatch(/Falta el precio/)
    expect((await llamar("ver_auto", { slug: slugs[0] })).datos.publicado).toBe(false)
  })

  it("una línea sin año no inventa el año", async () => {
    const { error, datos } = await llamar("cargar_auto", { linea: "entró un Gol Trend con 120 mil" })
    expect(error).toBe(false)
    slugs.push(datos.slug)
    expect(datos.anio).toBeNull()
    expect(datos.falta).toContain("anio")
  }, 90_000)

  it("cada llamada actualiza ultimo_uso", async () => {
    const { data } = await db().from("operador").select("ultimo_uso").eq("token", operador.token).single()
    expect(data?.ultimo_uso).not.toBeNull()
  })
})
