import { afterAll, describe, expect, it } from "vitest"
import { db } from "@/lib/db/server"

const conBase = Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY)
const PREFIJO = `prueba-limite-${Date.now()}`

describe.skipIf(!conBase)("contar_uso contra la base", () => {
  afterAll(async () => {
    await db().from("limite").delete().like("clave", `${PREFIJO}%`)
  })

  const contar = async (clave: string) =>
    (await db().rpc("contar_uso", { p_clave: clave, p_segundos: 600, p_maximo: 3 })).data

  it("con máximo 3, las tres primeras pasan y la cuarta no; otra clave cuenta aparte", async () => {
    const a = `${PREFIJO}:a`
    expect([await contar(a), await contar(a), await contar(a), await contar(a)]).toEqual([true, true, true, false])
    expect(await contar(`${PREFIJO}:b`)).toBe(true)
  })

  it("veinte pedidos al mismo tiempo cuentan veinte: ninguno pisa a otro", async () => {
    const c = `${PREFIJO}:c`
    const resultados = await Promise.all(Array.from({ length: 20 }, () => contar(c)))
    expect(resultados.filter(Boolean)).toHaveLength(3)
    const { data } = await db().from("limite").select("cuenta").eq("clave", c).single()
    expect(data!.cuenta).toBe(20)
  })

  it("anon no la puede ejecutar", async () => {
    const { createClient } = await import("@supabase/supabase-js")
    const anon = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
      auth: { persistSession: false },
    })
    const { error } = await anon.rpc("contar_uso", { p_clave: `${PREFIJO}:anon`, p_segundos: 600, p_maximo: 3 })
    expect(error).not.toBeNull()
  })
})
