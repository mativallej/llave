import { randomUUID } from "node:crypto"
import { afterAll, describe, expect, it } from "vitest"
import { leerConfig } from "@/lib/config"
import { db } from "@/lib/db/server"
import { enviarPedido, mensajeWhatsApp } from "./canal"
import { PEDIDO_VACIO, type Pedido } from "./tipos"

const conBase = Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY)
const TELEFONO_DE_PRUEBA = "3492 15 000001"

describe.skipIf(!conBase)("enviarPedido contra la base", () => {
  const casos: string[] = []

  afterAll(async () => {
    for (const id of casos) {
      const { data } = await db().storage.from("fotos").list(`casos/${id}`)
      if (data?.length) await db().storage.from("fotos").remove(data.map((f) => `casos/${id}/${f.name}`))
    }
    if (casos.length > 0) {
      await db().from("evento").delete().in("caso_id", casos)
      await db().from("caso").delete().in("id", casos)
    }
  })

  it("un pedido deja una fila en caso, dos en acceso y un evento, y mueve las fotos al caso", async () => {
    const ruta = `pedidos/tmp/${randomUUID()}.jpg`
    await db().storage.from("fotos").upload(ruta, new Uint8Array([0xff, 0xd8, 0xff, 0xe0]), { contentType: "image/jpeg" })
    const pedido: Pedido = {
      ...PEDIDO_VACIO,
      entrega: true,
      auto_entrega: { marca: "Toyota", modelo: "Corolla (prueba)", version: null, anio: 2017, km: 120000 },
      salida: "usado",
      busca: "una pickup",
      zona: "Esperanza",
      fotos: [ruta],
    }

    const enviado = await enviarPedido({ pedido, nombre: "Prueba", telefono: TELEFONO_DE_PRUEBA, origen: "https://llave.test" })
    expect(enviado.ref).toMatch(/^LL-\d{4}$/)
    expect(enviado.linkCliente).toMatch(/^https:\/\/llave\.test\/c\/[A-Za-z0-9_-]{22}$/)
    expect(enviado.duplicado).toBe(false)

    const { data: caso } = await db().from("caso").select("id, telefono, estado").eq("ref", enviado.ref).single()
    casos.push(caso!.id)
    expect(caso!.telefono).toBe("+5493492000001")
    expect(caso!.estado).toBe("pendiente_cita")

    const { data: accesos } = await db().from("acceso").select("rol").eq("caso_id", caso!.id)
    expect(accesos!.map((a) => a.rol).sort()).toEqual(["cliente", "operador"])
    const { data: eventos } = await db().from("evento").select("tipo, meta").eq("caso_id", caso!.id)
    expect(eventos).toEqual([{ tipo: "pedido_enviado", meta: { fotos: 1 } }])

    const { data: fotos } = await db().storage.from("fotos").list(`casos/${caso!.id}`)
    expect(fotos!.map((f) => f.name)).toEqual(["1.jpg"])
  })

  it("un duplicado exacto en los últimos minutos devuelve el mismo pedido, sin crear otro caso", async () => {
    const pedido: Pedido = { ...PEDIDO_VACIO, entrega: false, salida: "0km", busca: "un 0km chico (prueba)" }
    const primero = await enviarPedido({ pedido, nombre: "Prueba", telefono: TELEFONO_DE_PRUEBA, origen: "https://llave.test" })
    const { data: caso } = await db().from("caso").select("id, estado").eq("ref", primero.ref).single()
    casos.push(caso!.id)
    expect(caso!.estado).toBe("pendiente_conseguir")

    const segundo = await enviarPedido({ pedido, nombre: "Prueba", telefono: "+54 9 3492 000001", origen: "https://llave.test" })
    expect(segundo.duplicado).toBe(true)
    expect(segundo.ref).toBe(primero.ref)
    expect(segundo.linkCliente).toBe(primero.linkCliente)
  })

  it("mientras whatsapp_abelardo esté vacío no hay link de handoff: no se inventa un número", async () => {
    if ((await leerConfig("whatsapp_abelardo")) !== "") return
    const pedido: Pedido = { ...PEDIDO_VACIO, entrega: false, salida: "usado", busca: "algo (prueba sin handoff)" }
    const enviado = await enviarPedido({ pedido, nombre: "Prueba", telefono: TELEFONO_DE_PRUEBA, origen: "https://llave.test" })
    const { data: caso } = await db().from("caso").select("id").eq("ref", enviado.ref).single()
    casos.push(caso!.id)
    expect(enviado.whatsapp).toBeNull()
  })

  it("rechaza un teléfono sin característica, sin crear nada", async () => {
    const pedido: Pedido = { ...PEDIDO_VACIO, entrega: false, salida: "usado" }
    await expect(
      enviarPedido({ pedido, nombre: "Prueba", telefono: "15 123456", origen: "https://llave.test" }),
    ).rejects.toThrow(/característica/)
  })
})

describe("el mensaje de WhatsApp", () => {
  it("lleva la ref, lo que entrega, lo que se lleva con su precio y el link del operador", () => {
    const texto = mensajeWhatsApp({
      nombre: "Juan",
      ref: "LL-4821",
      pedido: {
        ...PEDIDO_VACIO,
        entrega: true,
        auto_entrega: { marca: "Toyota", modelo: "Corolla", version: null, anio: 2017, km: 120000 },
        zona: "Esperanza",
        fotos: ["a", "b", "c"],
      },
      elegidos: [{ slug: "x", nombre: "Volkswagen Amarok Highline 2020", anio: 2020, km: 82000, precio: 41000000, foto: null }],
      linkOperador: "https://llave.test/c/operador",
    })
    expect(texto).toContain("LL-4821")
    expect(texto).toContain("Entrego: Toyota Corolla 2017, 120.000 km.")
    expect(texto).toMatch(/Me llevo: Volkswagen Amarok Highline 2020, \$\s?41\.000\.000/)
    expect(texto).toContain("Zona: Esperanza.")
    expect(texto).toContain("Fotos: 3.")
    expect(texto).toContain("Caso: https://llave.test/c/operador")
  })
})
