import { afterAll, describe, expect, it } from "vitest"
import { registrar } from "./eventos"
import { db } from "./server"

const conBase = Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY)
const TELEFONO_DE_PRUEBA = "+5400000000001"

describe.skipIf(!conBase)("registrar() contra la base", () => {
  const casos: string[] = []

  afterAll(async () => {
    if (casos.length === 0) return
    await db().from("evento").delete().in("caso_id", casos)
    await db().from("caso").delete().in("id", casos)
  })

  async function nuevoCaso(): Promise<string> {
    const { data, error } = await db()
      .from("caso")
      .insert({ telefono: TELEFONO_DE_PRUEBA, estado: "pendiente_fotos" })
      .select("id, ref")
      .single()
    if (error) throw error
    expect(data.ref).toMatch(/^LL-\d{4}$/)
    casos.push(data.id)
    return data.id
  }

  it("escribe el evento y mueve caso.ultimo_evento en la misma operación", async () => {
    const casoId = await nuevoCaso()
    await registrar("pedido_enviado", casoId)

    const { data: evento } = await db()
      .from("evento")
      .select("en")
      .eq("caso_id", casoId)
      .eq("tipo", "pedido_enviado")
      .single()
    const { data: caso } = await db().from("caso").select("ultimo_evento").eq("id", casoId).single()

    expect(evento?.en).toBeTruthy()
    expect(new Date(caso!.ultimo_evento!).getTime()).toBe(new Date(evento!.en).getTime())
  })

  it("caso_perdido guarda si fue silencio propio", async () => {
    const casoId = await nuevoCaso()
    await registrar("caso_perdido", casoId, { por_silencio: true })

    const { data } = await db()
      .from("evento")
      .select("meta")
      .eq("caso_id", casoId)
      .eq("tipo", "caso_perdido")
      .single()
    expect(data?.meta).toEqual({ por_silencio: true })
  })

  it("la base rechaza un caso_perdido que no dice de quién fue el silencio", async () => {
    const casoId = await nuevoCaso()
    const { error } = await db().from("evento").insert({ tipo: "caso_perdido", caso_id: casoId, meta: {} })
    expect(error?.message).toMatch(/evento_perdido_distingue_silencio/)
  })
})
