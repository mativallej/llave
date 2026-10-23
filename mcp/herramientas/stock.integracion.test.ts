import { randomBytes, randomUUID } from "node:crypto"
import { crc32, deflateSync } from "node:zlib"
import { Client } from "@modelcontextprotocol/sdk/client/index.js"
import { InMemoryTransport } from "@modelcontextprotocol/sdk/inMemory.js"
import { afterAll, beforeAll, describe, expect, it } from "vitest"
import { db } from "@/lib/db/server"
import type { OperadorMcp } from "@/lib/operador"
import { crearServidor } from "../servidor"

const conTodo = Boolean(
  process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY && process.env.OPENAI_API_KEY,
)

// A small PNG made here: two photos for cargar_auto without depending on anything outside.
function png(ancho: number, alto: number, color: [number, number, number]): Buffer {
  const fila = Buffer.concat([Buffer.from([0]), Buffer.alloc(ancho * 3, Buffer.from(color))])
  const datos = Buffer.concat(Array.from({ length: alto }, () => fila))
  const bloque = (tipo: string, contenido: Buffer) => {
    const largo = Buffer.alloc(4)
    largo.writeUInt32BE(contenido.length)
    const cuerpo = Buffer.concat([Buffer.from(tipo), contenido])
    const crc = Buffer.alloc(4)
    crc.writeUInt32BE(crc32(cuerpo))
    return Buffer.concat([largo, cuerpo, crc])
  }
  const cabecera = Buffer.alloc(13)
  cabecera.writeUInt32BE(ancho, 0)
  cabecera.writeUInt32BE(alto, 4)
  cabecera.set([8, 2, 0, 0, 0], 8)
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    bloque("IHDR", cabecera),
    bloque("IDAT", deflateSync(datos)),
    bloque("IEND", Buffer.alloc(0)),
  ])
}

describe.skipIf(!conTodo)("las tools de stock contra la base y el modelo", () => {
  const operador: OperadorMcp = { token: randomBytes(32).toString("base64url"), nombre: "Prueba MCP", rol: "vendedor" }
  const subidas: string[] = []
  const urls: string[] = []
  const slugs: string[] = []
  let cliente: Client

  beforeAll(async () => {
    await db().from("operador").insert({ token: operador.token, nombre: operador.nombre, rol: operador.rol })
    for (const color of [[200, 30, 30], [30, 30, 200]] as [number, number, number][]) {
      const ruta = `pruebas-mcp/${randomUUID()}.png`
      await db().storage.from("fotos").upload(ruta, png(64, 48, color), { contentType: "image/png" })
      subidas.push(ruta)
      const { data } = await db().storage.from("fotos").createSignedUrl(ruta, 600)
      urls.push(data!.signedUrl)
    }
    const [lado, otroLado] = InMemoryTransport.createLinkedPair()
    cliente = new Client({ name: "prueba", version: "1.0.0" })
    await Promise.all([crearServidor({ operador, archivosLocales: false }).connect(lado), cliente.connect(otroLado)])
  }, 30_000)

  afterAll(async () => {
    const { data: autos } = await db().from("auto").select("fotos").in("slug", slugs)
    await db().from("auto").delete().in("slug", slugs)
    const fotos = [...subidas, ...(autos ?? []).flatMap((auto) => auto.fotos)]
    if (fotos.length > 0) await db().storage.from("fotos").remove(fotos)
    await db().from("operador").delete().eq("token", operador.token)
  })

  async function llamar(name: string, args: Record<string, unknown>) {
    const resultado = await cliente.callTool({ name, arguments: args })
    const texto = (resultado.content as { text: string }[])[0].text
    return { error: resultado.isError === true, texto, datos: resultado.isError ? null : JSON.parse(texto) }
  }

  it("cargar_auto con la línea y dos fotos: deduce, no inventa, y queda sin publicar ni precio", async () => {
    const { error, datos } = await llamar("cargar_auto", {
      linea: "entró un Corolla XEI 2019 con 78 mil",
      fotos: urls,
    })
    expect(error).toBe(false)
    slugs.push(datos.slug)
    expect(datos.marca).toMatch(/toyota/i)
    expect(datos.modelo).toMatch(/corolla/i)
    expect(datos.version).toMatch(/xei/i)
    expect(datos.anio).toBe(2019)
    expect(datos.km).toBe(78000)
    expect(datos.precio).toBeNull()
    expect(datos.publicado).toBe(false)
    expect(datos.fotos).toBe(2)
    expect(datos.falta[0]).toBe("precio")
  }, 90_000)

  it("publicar sin precio falla con un mensaje que lo explica y el auto queda sin publicar", async () => {
    const { error, texto } = await llamar("publicar_auto", { slug: slugs[0] })
    expect(error).toBe(true)
    expect(texto).toMatch(/Falta el precio/)
    expect((await llamar("ver_auto", { slug: slugs[0] })).datos.publicado).toBe(false)
  })

  it("un link que no es una foto se rechaza con un mensaje claro", async () => {
    const { error, texto } = await llamar("cargar_auto", { linea: "entró algo", fotos: ["https://example.com/"] })
    expect(error).toBe(true)
    expect(texto).toMatch(/no es una foto|respondió/)
  }, 30_000)

  it("cada llamada actualiza ultimo_uso", async () => {
    const { data } = await db().from("operador").select("ultimo_uso").eq("token", operador.token).single()
    expect(data?.ultimo_uso).not.toBeNull()
  })
})
