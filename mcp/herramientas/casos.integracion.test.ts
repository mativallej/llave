import { Client } from "@modelcontextprotocol/sdk/client/index.js"
import { InMemoryTransport } from "@modelcontextprotocol/sdk/inMemory.js"
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest"
import {
  accionAcepto,
  accionAgendarCita,
  accionCerrarVenta,
  accionInspeccionado,
  accionNota,
  accionPerder,
  accionPublicar,
  accionTasacion,
  accionVentaNueva,
} from "@/app/c/[token]/acciones"
import { casoPorRef, eventosDelCaso, llegaronFotos, notasDelCaso } from "@/lib/caso/caso"
import { db } from "@/lib/db/server"
import { enviarPedido } from "@/lib/pedido/canal"
import { PEDIDO_VACIO } from "@/lib/pedido/tipos"
import { crearServidor } from "../servidor"

// The link's actions revalidate the page; outside Next there's no page to revalidate.
vi.mock("next/cache", () => ({ revalidatePath: () => {} }))

const conBase = Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY)
const TELEFONO = "3492 15 000005"
const TELEFONO_NORMALIZADO = "+5493492000005"
const MARCA = Date.now()
const SLUGS = { link: `prueba-mcp-caso-link-${MARCA}`, mcp: `prueba-mcp-caso-mcp-${MARCA}` }
const ANDRES = { token: `prueba-mcp-caso-${MARCA}`.padEnd(43, "x"), nombre: "Prueba MCP caso", rol: "falkenberg" as const }

type Herramienta = { name: string; arguments: Record<string, unknown> }

describe.skipIf(!conBase)("mover un caso por el MCP y por el link deja lo mismo", () => {
  let cliente: Client
  const refs: Record<"link" | "mcp" | "perdidoLink" | "perdidoMcp", string> = {} as never
  const tokens: Record<string, string> = {}

  async function nuevoCaso(slug: string | null): Promise<string> {
    const enviado = await enviarPedido({
      pedido: {
        ...PEDIDO_VACIO,
        entrega: true,
        auto_entrega: { marca: "Fiat", modelo: "Palio (prueba)", version: null, anio: 2012, km: 150000 },
        autos_elegidos: slug ? [slug] : [],
        salida: slug ? null : "usado",
        busca: slug ? null : "Un Gol (prueba)",
        zona: "Rafaela",
      },
      nombre: "Prueba MCP caso",
      telefono: TELEFONO,
      origen: "https://llave.test",
    })
    const caso = await casoPorRef(enviado.ref)
    const { data } = await db().from("acceso").select("token").eq("caso_id", caso.id).eq("rol", "operador").single()
    tokens[enviado.ref] = data!.token
    await llegaronFotos(caso.id)
    return enviado.ref
  }

  async function mcp({ name, arguments: args }: Herramienta) {
    const resultado = await cliente.callTool({ name, arguments: args })
    const texto = (resultado.content as { text: string }[])[0].text
    return { error: resultado.isError === true, texto }
  }

  // What each event says, without the dates that depend on the second it ran.
  async function eventos(ref: string) {
    const caso = await casoPorRef(ref)
    return (await eventosDelCaso(caso.id))
      .filter((e) => e.tipo !== "pedido_enviado")
      .map((e) => ({ tipo: e.tipo, meta: { ...(e.meta as object), ...("vence_prop" in (e.meta as object) ? { vence_prop: "fecha" } : {}) } }))
  }

  beforeAll(async () => {
    await db()
      .from("auto")
      .insert(
        Object.values(SLUGS).map((slug) => ({
          slug,
          marca: "Toyota",
          modelo: "Etios (prueba)",
          anio: 2020,
          km: 50000,
          precio: 15000000,
          publicado: true,
        })),
      )
    await db().from("operador").insert(ANDRES)
    refs.link = await nuevoCaso(SLUGS.link)
    refs.mcp = await nuevoCaso(SLUGS.mcp)
    refs.perdidoLink = await nuevoCaso(null)
    refs.perdidoMcp = await nuevoCaso(null)

    const [lado, otroLado] = InMemoryTransport.createLinkedPair()
    cliente = new Client({ name: "prueba", version: "1.0.0" })
    await Promise.all([
      crearServidor({ operador: ANDRES, origen: "https://llave.test" }).connect(lado),
      cliente.connect(otroLado),
    ])
  }, 60_000)

  afterAll(async () => {
    const { data } = await db().from("caso").select("id").eq("telefono", TELEFONO_NORMALIZADO)
    const ids = (data ?? []).map((c) => c.id)
    if (ids.length > 0) {
      await db().from("evento").delete().in("caso_id", ids)
      await db().from("nota").delete().in("caso_id", ids)
      await db().from("caso").delete().in("id", ids)
    }
    await db().from("auto").delete().in("slug", Object.values(SLUGS))
    await db().from("operador").delete().eq("token", ANDRES.token)
  })

  it("de la cita a la venta, cada paso deja el mismo evento y los mismos datos", async () => {
    const link = tokens[refs.link]
    const pasos: [() => Promise<{ ok: boolean }>, Herramienta][] = [
      [() => accionAgendarCita(link, "2026-10-29T10:00"), { name: "agendar_cita", arguments: { ref: refs.mcp, fecha: "2026-10-29T10:00:00-03:00" } }],
      [() => accionInspeccionado(link), { name: "marcar_inspeccionado", arguments: { ref: refs.mcp } }],
      [() => accionTasacion(link, "9.000.000"), { name: "cargar_tasacion", arguments: { ref: refs.mcp, valor_toma: 9000000 } }],
      [() => accionPublicar(link), { name: "publicar_propuesta", arguments: { ref: refs.mcp } }],
      [() => accionAcepto(link), { name: "acepto_propuesta", arguments: { ref: refs.mcp } }],
      [() => accionCerrarVenta(link), { name: "cerrar_caso", arguments: { ref: refs.mcp, cerro: true } }],
      [() => accionVentaNueva(link, "si"), { name: "marcar_venta_nueva", arguments: { ref: refs.mcp, respuesta: "si" } }],
      [() => accionNota(link, "Retira el sábado."), { name: "agregar_nota", arguments: { ref: refs.mcp, texto: "Retira el sábado." } }],
    ]
    for (const [porLink, porMcp] of pasos) {
      expect(await porLink()).toMatchObject({ ok: true })
      expect(await mcp(porMcp), porMcp.name).toMatchObject({ error: false })
      expect((await casoPorRef(refs.mcp)).estado).toBe((await casoPorRef(refs.link)).estado)
    }

    expect(await eventos(refs.mcp)).toEqual(await eventos(refs.link))
    expect((await eventos(refs.mcp)).map((e) => e.tipo)).toEqual([
      "cita_agendada",
      "cita_cumplida",
      "propuesta_publicada",
      "venta_cerrada",
    ])

    const [porLink, porMcp] = await Promise.all([casoPorRef(refs.link), casoPorRef(refs.mcp)])
    for (const campo of ["estado", "cerro", "valor_toma", "precio_salida", "cita_en", "venta_nueva"] as const) {
      expect(porMcp[campo], campo).toEqual(porLink[campo])
    }
    expect(porMcp.venta_nueva).toBe(true)
    const { data: auto } = await db().from("auto").select("vendido_en, publicado").eq("slug", SLUGS.mcp).single()
    expect(auto).toMatchObject({ publicado: false })
    expect(auto!.vendido_en).not.toBeNull()
    expect((await notasDelCaso(porMcp.id)).map((n) => [n.texto, n.autor])).toEqual([["Retira el sábado.", ANDRES.nombre]])
  }, 60_000)

  it("ver_caso y listar_casos nunca devuelven la tasación, aunque esté cargada", async () => {
    const caso = await mcp({ name: "ver_caso", arguments: { ref: refs.mcp } })
    expect(caso.error).toBe(false)
    expect(JSON.parse(caso.texto)).toMatchObject({ ref: refs.mcp, estado: "cerrado", estado_legible: "Venta cerrada" })
    const lista = await mcp({ name: "listar_casos", arguments: { estado: "cerrado" } })
    for (const { texto } of [caso, lista]) {
      expect(texto).not.toMatch(/valor_toma|tasaci|9000000|9\.000\.000/)
    }
  })

  it("un caso perdido por el MCP deja el mismo evento que por el link, y sin decir si fue silencio no se cierra", async () => {
    const sinSilencio = await mcp({ name: "cerrar_caso", arguments: { ref: refs.perdidoMcp, cerro: false, motivo: "Se compró otro" } })
    expect(sinSilencio).toMatchObject({ error: true })
    expect(sinSilencio.texto).toMatch(/no le contestamos a tiempo/)
    expect((await casoPorRef(refs.perdidoMcp)).estado).toBe("pendiente_cita")

    expect(await accionPerder(tokens[refs.perdidoLink], "Se compró otro", true)).toMatchObject({ ok: true })
    expect(
      await mcp({ name: "cerrar_caso", arguments: { ref: refs.perdidoMcp, cerro: false, motivo: "Se compró otro", por_silencio: true } }),
    ).toMatchObject({ error: false })
    expect(await eventos(refs.perdidoMcp)).toEqual(await eventos(refs.perdidoLink))
    expect(await eventos(refs.perdidoMcp)).toEqual([{ tipo: "caso_perdido", meta: { por_silencio: true, motivo: "Se compró otro" } }])
  }, 30_000)

  it("historial_telefono encuentra los casos aunque el teléfono venga escrito de otra forma", async () => {
    const { error, texto } = await mcp({ name: "historial_telefono", arguments: { telefono: "+54 9 3492 000005" } })
    expect(error).toBe(false)
    const { telefono, casos } = JSON.parse(texto)
    expect(telefono).toBe(TELEFONO_NORMALIZADO)
    expect(casos.map((c: { ref: string }) => c.ref).sort()).toEqual(Object.values(refs).sort())
  })
})
