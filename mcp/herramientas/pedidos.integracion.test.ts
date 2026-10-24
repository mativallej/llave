import { randomBytes } from "node:crypto"
import { Client } from "@modelcontextprotocol/sdk/client/index.js"
import { InMemoryTransport } from "@modelcontextprotocol/sdk/inMemory.js"
import { afterAll, beforeAll, describe, expect, it } from "vitest"
import { db } from "@/lib/db/server"
import type { OperadorMcp } from "@/lib/operador"
import { enviarPedido } from "@/lib/pedido/canal"
import { PEDIDO_VACIO } from "@/lib/pedido/tipos"
import { crearServidor } from "../servidor"

const conBase = Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY)
const TELEFONO_DE_PRUEBA = "3492 15 000002"

describe.skipIf(!conBase)("las tools de lectura del canal contra la base", () => {
  const operador: OperadorMcp = { token: randomBytes(32).toString("base64url"), nombre: "Prueba pedidos", rol: "vendedor" }
  let cliente: Client
  let ref: string

  beforeAll(async () => {
    await db().from("operador").insert({ token: operador.token, nombre: operador.nombre, rol: operador.rol })
    const enviado = await enviarPedido({
      pedido: {
        ...PEDIDO_VACIO,
        entrega: true,
        auto_entrega: { marca: "Peugeot", modelo: "208 (prueba)", version: null, anio: 2018, km: 90000 },
        salida: "usado",
        busca: "una SUV (prueba)",
        zona: "Sunchales",
      },
      nombre: "Prueba MCP",
      telefono: TELEFONO_DE_PRUEBA,
      origen: "https://llave.test",
    })
    ref = enviado.ref
    const [lado, otroLado] = InMemoryTransport.createLinkedPair()
    cliente = new Client({ name: "prueba", version: "1.0.0" })
    await Promise.all([
      crearServidor({ operador, origen: "https://llave.test" }).connect(lado),
      cliente.connect(otroLado),
    ])
  }, 30_000)

  // By the test phone, not by casoId: if beforeAll times out after creating the case, the id never arrives.
  afterAll(async () => {
    const { data } = await db().from("caso").select("id").eq("telefono", "+5493492000002")
    const ids = (data ?? []).map((c) => c.id)
    if (ids.length > 0) {
      await db().from("evento").delete().in("caso_id", ids)
      await db().from("caso").delete().in("id", ids)
    }
    await db().from("operador").delete().eq("token", operador.token)
  })

  async function llamar(name: string, args: Record<string, unknown>) {
    const resultado = await cliente.callTool({ name, arguments: args })
    const texto = (resultado.content as { text: string }[])[0].text
    expect(resultado.isError, texto).toBeFalsy()
    return { texto, datos: JSON.parse(texto) }
  }

  it("ver_pedido devuelve el pedido real, con el link del caso y sin ningún valor de toma", async () => {
    const { texto, datos } = await llamar("ver_pedido", { ref })
    expect(datos.ref).toBe(ref)
    expect(datos.estado).toBe("pendiente_fotos")
    expect(datos.entrega).toBe("Peugeot 208 (prueba) 2018, 90.000 km")
    expect(datos.se_lleva).toBe("una SUV (prueba)")
    expect(datos.zona).toBe("Sunchales")
    expect(datos.link_operador).toMatch(/^https:\/\/llave\.test\/c\/[A-Za-z0-9_-]{22}$/)
    expect(texto).not.toMatch(/valor_toma|toma|margen/i)
  })

  it("listar_pedidos_del_dia incluye el pedido de hoy", async () => {
    const { datos } = await llamar("listar_pedidos_del_dia", {})
    expect(datos.map((p: { ref: string }) => p.ref)).toContain(ref)
  })
})
