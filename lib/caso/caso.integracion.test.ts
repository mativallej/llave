import { afterAll, beforeAll, describe, expect, it } from "vitest"
import { db } from "@/lib/db/server"
import { enviarPedido } from "@/lib/pedido/canal"
import { PEDIDO_VACIO } from "@/lib/pedido/tipos"
import {
  aceptoPropuesta,
  agendarCita,
  cargarTasacion,
  casoPorRef,
  cerrarVenta,
  corregirCaso,
  ErrorCaso,
  eventosDelCaso,
  llegaronFotos,
  marcarInspeccionado,
  marcarRenegocio,
  marcarVentaNueva,
  perderCaso,
  publicarPropuesta,
  resolverAcceso,
} from "./caso"

const conBase = Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY)
const TELEFONO = "3492 15 000004"
const TELEFONO_NORMALIZADO = "+5493492000004"
const SLUG = `prueba-caso-${Date.now()}`

describe.skipIf(!conBase)("el caso, de punta a punta contra la base", () => {
  let casoId: string
  let tokens: { cliente: string; operador: string }

  beforeAll(async () => {
    await db()
      .from("auto")
      .insert({ slug: SLUG, marca: "Toyota", modelo: "Etios (prueba)", anio: 2020, km: 50000, precio: 15000000, publicado: true })
    const enviado = await enviarPedido({
      pedido: {
        ...PEDIDO_VACIO,
        entrega: true,
        auto_entrega: { marca: "Fiat", modelo: "Palio (prueba)", version: null, anio: 2012, km: 150000 },
        autos_elegidos: [SLUG],
        zona: "Rafaela",
      },
      nombre: "Prueba caso",
      telefono: TELEFONO,
      origen: "https://llave.test",
    })
    casoId = (await casoPorRef(enviado.ref)).id
    const { data } = await db().from("acceso").select("token, rol").eq("caso_id", casoId)
    tokens = {
      cliente: data!.find((a) => a.rol === "cliente")!.token,
      operador: data!.find((a) => a.rol === "operador")!.token,
    }
  }, 30_000)

  afterAll(async () => {
    const { data } = await db().from("caso").select("id").eq("telefono", TELEFONO_NORMALIZADO)
    const ids = (data ?? []).map((c) => c.id)
    if (ids.length > 0) {
      await db().from("evento").delete().in("caso_id", ids)
      await db().from("nota").delete().in("caso_id", ids)
      await db().from("caso").delete().in("id", ids)
    }
    await db().from("auto").delete().eq("slug", SLUG)
  })

  const tipos = async () => (await eventosDelCaso(casoId)).map((e) => e.tipo)

  it("el link resuelve el rol; la primera apertura del operador es un evento, y una vista previa no cuenta", async () => {
    expect(await resolverAcceso("inventado-inventado-xx", { registrarApertura: true })).toBeNull()
    expect(await resolverAcceso(tokens.operador, { registrarApertura: false })).toEqual({ rol: "operador", casoId })
    expect(await tipos()).not.toContain("caso_abierto_operador")

    expect(await resolverAcceso(tokens.cliente, { registrarApertura: true })).toEqual({ rol: "cliente", casoId })
    expect(await resolverAcceso(tokens.operador, { registrarApertura: true })).toEqual({ rol: "operador", casoId })
    await resolverAcceso(tokens.operador, { registrarApertura: true })
    expect((await tipos()).filter((t) => t === "caso_abierto_operador")).toHaveLength(1)

    const { data } = await db().from("acceso").select("rol, abierto_en").eq("caso_id", casoId)
    expect(data!.every((a) => a.abierto_en !== null)).toBe(true)
  })

  it("cada transición escribe su evento, y el precio del auto que se lleva tiene fecha desde el primer minuto", async () => {
    const inicial = await casoPorRef((await db().from("caso").select("ref").eq("id", casoId).single()).data!.ref)
    expect(inicial.estado).toBe("pendiente_fotos")
    expect(inicial.precio_salida).toBe(15000000)
    expect(inicial.precio_salida_en).not.toBeNull()

    expect((await llegaronFotos(casoId)).estado).toBe("pendiente_cita")
    const cita = await agendarCita(casoId, "2026-11-02T10:00:00-03:00")
    expect(cita.estado).toBe("pendiente_inspeccion")
    expect(new Date(cita.cita_en!).toISOString()).toBe("2026-11-02T13:00:00.000Z")
    expect((await marcarInspeccionado(casoId)).estado).toBe("pendiente_tasacion")

    const tasado = await cargarTasacion(casoId, 9000000)
    expect(tasado.estado).toBe("pendiente_propuesta")
    expect(tasado.valor_toma_en).not.toBeNull()
    expect(await tipos()).toEqual(expect.arrayContaining(["pedido_enviado", "cita_agendada", "cita_cumplida"]))
  })

  it("una acción de otro estado no se puede hacer", async () => {
    await expect(agendarCita(casoId, "2026-11-03T10:00:00-03:00")).rejects.toThrow(ErrorCaso)
  })

  it("publicar la propuesta la deja a siete días, escribe su evento y congela el caso", async () => {
    const antes = Date.now()
    const publicada = await publicarPropuesta(casoId)
    expect(publicada.estado).toBe("propuesta_publicada")
    const dias = (new Date(publicada.vence_prop!).getTime() - antes) / 86_400_000
    expect(dias).toBeGreaterThan(6.99)
    expect(dias).toBeLessThan(7.01)
    expect(await tipos()).toContain("propuesta_publicada")

    // Through the operation and straight on the row: both refuse, and the case stays the same.
    await expect(corregirCaso(casoId, { auto_entrega: null })).rejects.toThrow(ErrorCaso)
    const { error } = await db().from("caso").update({ auto_entrega: null }).eq("id", casoId)
    expect(error?.message).toMatch(/La propuesta ya está publicada/)
    const { data } = await db().from("caso").select("auto_entrega").eq("id", casoId).single()
    expect(data!.auto_entrega).toMatchObject({ marca: "Fiat" })
  })

  it("la renegociación en la entrega es una marca con su evento", async () => {
    expect((await aceptoPropuesta(casoId)).estado).toBe("pendiente_entrega")
    expect((await marcarRenegocio(casoId)).renegocio).toBe(true)
    expect(await tipos()).toContain("renegociacion")
  })

  it("cerrar la venta consume el auto del stock: vendido y despublicado, sin ningún paso manual", async () => {
    const cerrado = await cerrarVenta(casoId)
    expect(cerrado.estado).toBe("cerrado")
    expect(cerrado.cerro).toBe(true)
    expect(await tipos()).toContain("venta_cerrada")
    const { data: auto } = await db().from("auto").select("vendido_en, publicado").eq("slug", SLUG).single()
    expect(auto!.vendido_en).not.toBeNull()
    expect(auto!.publicado).toBe(false)
  })

  it("marcar 'Sí' en la pregunta post-venta deja venta_nueva = true", async () => {
    expect((await marcarVentaNueva(casoId, "si")).venta_nueva).toBe(true)
    expect((await marcarVentaNueva(casoId, "no_preguntado")).venta_nueva).toBeNull()
    expect((await marcarVentaNueva(casoId, "si")).venta_nueva).toBe(true)
  })

  it("un caso perdido por silencio propio lo dice en el evento", async () => {
    const otro = await enviarPedido({
      pedido: { ...PEDIDO_VACIO, entrega: false, salida: "0km", busca: "un 0km (prueba silencio)" },
      nombre: "Prueba caso",
      telefono: TELEFONO,
      origen: "https://llave.test",
    })
    const caso = await casoPorRef(otro.ref)
    const perdido = await perderCaso(caso.id, { motivo: "No le contestamos a tiempo", porSilencio: true })
    expect(perdido.estado).toBe("cerrado")
    expect(perdido.cerro).toBe(false)
    const eventos = await eventosDelCaso(caso.id)
    expect(eventos.find((e) => e.tipo === "caso_perdido")?.meta).toEqual({
      por_silencio: true,
      motivo: "No le contestamos a tiempo",
    })
  })
})
