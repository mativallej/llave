import { Client } from "@modelcontextprotocol/sdk/client/index.js"
import { InMemoryTransport } from "@modelcontextprotocol/sdk/inMemory.js"
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest"
import {
  accionAcepto,
  accionAgendarCita,
  accionCerrarVenta,
  accionConseguido,
  accionInspeccionado,
  accionLlegaronFotos,
  accionPublicar,
  accionTasacion,
} from "@/app/c/[token]/acciones"
import { casoPorRef, eventosDelCaso } from "@/lib/caso/caso"
import { db } from "@/lib/db/server"
import { enviarPedido } from "@/lib/pedido/canal"
import { type Pedido, PEDIDO_VACIO } from "@/lib/pedido/tipos"
import { crearServidor } from "../servidor"

// The steps that used to live only in the case link, now by Claude: a case taken all the way to the sale with
// nothing but MCP tools, next to a twin case taken by the link, step by step.

vi.mock("next/cache", () => ({ revalidatePath: () => {} }))

const conBase = Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY)
const TELEFONO = "3492 15 000008"
const TELEFONO_NORMALIZADO = "+5493492000008"
const MARCA = Date.now()
const SLUGS = { link: `prueba-pasos-link-${MARCA}`, mcp: `prueba-pasos-mcp-${MARCA}` }
const ANDRES = { token: `prueba-pasos-${MARCA}`.padEnd(43, "x"), nombre: "Prueba pasos", rol: "falkenberg" as const }
const ENTREGA = { marca: "Fiat", modelo: "Palio (prueba)", version: null, anio: 2012, km: 150000 }

type Paso = [() => Promise<{ ok: boolean }>, { name: string; arguments: Record<string, unknown> }]

describe.skipIf(!conBase)("los pasos que faltaban, por el MCP", () => {
  let cliente: Client
  const tokens: Record<string, string> = {}

  async function nuevoCaso(pedido: Pedido): Promise<string> {
    const enviado = await enviarPedido({ pedido, nombre: "Prueba pasos", telefono: TELEFONO, origen: "https://llave.test" })
    const { id } = await casoPorRef(enviado.ref)
    const { data } = await db().from("acceso").select("token").eq("caso_id", id).eq("rol", "operador").single()
    tokens[enviado.ref] = data!.token
    return enviado.ref
  }

  async function mcp(name: string, args: Record<string, unknown>) {
    const resultado = await cliente.callTool({ name, arguments: args })
    const texto = (resultado.content as { text: string }[])[0].text
    return { error: resultado.isError === true, texto }
  }

  // What each event says, without the dates that depend on the second it ran.
  async function eventos(ref: string) {
    return (await eventosDelCaso((await casoPorRef(ref)).id))
      .filter((e) => e.tipo !== "pedido_enviado")
      .map((e) => ({ tipo: e.tipo, meta: { ...(e.meta as object), ...("vence_prop" in (e.meta as object) ? { vence_prop: "fecha" } : {}) } }))
  }

  async function lado_a_lado(link: string, porMcp: string, pasos: Paso[]) {
    for (const [porLink, [nombre, args]] of pasos.map(([l, m]) => [l, [m.name, m.arguments]] as const)) {
      expect(await porLink(), `link antes de ${nombre}`).toMatchObject({ ok: true })
      expect(await mcp(nombre, args), nombre).toMatchObject({ error: false })
      expect((await casoPorRef(porMcp)).estado, nombre).toBe((await casoPorRef(link)).estado)
    }
    expect(await eventos(porMcp)).toEqual(await eventos(link))
  }

  beforeAll(async () => {
    await db()
      .from("auto")
      .insert(
        Object.values(SLUGS).map((slug) => ({ slug, marca: "Toyota", modelo: "Etios (prueba)", anio: 2020, km: 50000, precio: 15000000, publicado: true })),
      )
    await db().from("operador").insert(ANDRES)
    const [lado, otroLado] = InMemoryTransport.createLinkedPair()
    cliente = new Client({ name: "prueba", version: "1.0.0" })
    await Promise.all([crearServidor({ operador: ANDRES, origen: "https://llave.test" }).connect(lado), cliente.connect(otroLado)])
  }, 30_000)

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

  it("de 'faltan las fotos' a la venta, todo por el MCP, deja lo mismo que por el link", async () => {
    const conAuto = (slug: string): Pedido => ({ ...PEDIDO_VACIO, entrega: true, auto_entrega: ENTREGA, autos_elegidos: [slug], zona: "Rafaela" })
    const link = await nuevoCaso(conAuto(SLUGS.link))
    const porMcp = await nuevoCaso(conAuto(SLUGS.mcp))
    expect(porMcp).not.toBe(link)
    expect((await casoPorRef(porMcp)).estado).toBe("pendiente_fotos")
    const t = tokens[link]

    await lado_a_lado(link, porMcp, [
      [() => accionLlegaronFotos(t), { name: "llegaron_fotos", arguments: { ref: porMcp } }],
      [() => accionAgendarCita(t, "2026-10-29T10:00"), { name: "agendar_cita", arguments: { ref: porMcp, fecha: "2026-10-29T10:00:00-03:00" } }],
      [() => accionInspeccionado(t), { name: "marcar_inspeccionado", arguments: { ref: porMcp } }],
      [() => accionTasacion(t, "9.000.000"), { name: "cargar_tasacion", arguments: { ref: porMcp, valor_toma: 9000000 } }],
      [() => accionPublicar(t), { name: "publicar_propuesta", arguments: { ref: porMcp } }],
      [() => accionAcepto(t), { name: "acepto_propuesta", arguments: { ref: porMcp } }],
      [() => accionCerrarVenta(t), { name: "cerrar_caso", arguments: { ref: porMcp, cerro: true } }],
    ])

    const [a, b] = await Promise.all([casoPorRef(link), casoPorRef(porMcp)])
    expect(b).toMatchObject({ estado: "cerrado", cerro: true, valor_toma: a.valor_toma, precio_salida: a.precio_salida })
    expect(a.fotos_en).not.toBeNull()
    expect(b.fotos_en).not.toBeNull()
    expect((await eventos(porMcp)).map((e) => e.tipo)).toEqual(["cita_agendada", "cita_cumplida", "propuesta_publicada", "venta_cerrada"])
  }, 90_000)

  it("de la búsqueda a la venta: marcar_conseguido deja el auto y su precio como lo que se lleva", async () => {
    // Two requests that differ in the zone: an identical one minutes later is the same request, not a new case.
    const busca = (zona: string): Pedido => ({ ...PEDIDO_VACIO, entrega: false, salida: "usado", busca: "Un Gol Trend 2016 (prueba)", zona })
    const link = await nuevoCaso(busca("Sunchales"))
    const porMcp = await nuevoCaso(busca("Esperanza"))
    expect(porMcp).not.toBe(link)
    expect((await casoPorRef(porMcp)).estado).toBe("pendiente_conseguir")
    const t = tokens[link]
    const auto = "Volkswagen Gol Trend 2016, 90.000 km (prueba)"

    const conseguido = await mcp("marcar_conseguido", { ref: porMcp, auto, precio: 12000000 })
    expect(conseguido.error).toBe(false)
    expect(JSON.parse(conseguido.texto)).toMatchObject({ estado: "pendiente_propuesta", se_lleva: auto, precio_del_que_se_lleva: 12000000 })
    expect(await accionConseguido(t, auto, "12.000.000")).toMatchObject({ ok: true })

    await lado_a_lado(link, porMcp, [
      [() => accionPublicar(t), { name: "publicar_propuesta", arguments: { ref: porMcp } }],
      [() => accionAcepto(t), { name: "acepto_propuesta", arguments: { ref: porMcp } }],
      [() => accionCerrarVenta(t), { name: "cerrar_caso", arguments: { ref: porMcp, cerro: true } }],
    ])
    const [a, b] = await Promise.all([casoPorRef(link), casoPorRef(porMcp)])
    expect(b).toMatchObject({ estado: "cerrado", cerro: true, auto_busca: a.auto_busca, precio_salida: 12000000 })
  }, 90_000)

  it("fuera de su estado, cada una falla diciendo en qué estado está, y el caso no se mueve", async () => {
    const ref = await nuevoCaso({ ...PEDIDO_VACIO, entrega: true, auto_entrega: ENTREGA, autos_elegidos: [], salida: "usado", busca: "algo (prueba)" })
    expect((await casoPorRef(ref)).estado).toBe("pendiente_fotos")
    for (const [nombre, args] of [
      ["acepto_propuesta", { ref }],
      ["marcar_conseguido", { ref, auto: "Algo", precio: 1000000 }],
    ] as const) {
      const { error, texto } = await mcp(nombre, args)
      expect(error, nombre).toBe(true)
      expect(texto, nombre).toMatch(/está en pendiente_fotos/)
    }
    expect((await mcp("llegaron_fotos", { ref })).error).toBe(false)
    const otraVez = await mcp("llegaron_fotos", { ref })
    expect(otraVez.error).toBe(true)
    expect(otraVez.texto).toMatch(/está en pendiente_cita/)
    expect((await casoPorRef(ref)).estado).toBe("pendiente_cita")
  }, 30_000)
})
