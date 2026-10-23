import { afterAll, describe, expect, it } from "vitest"
import { db } from "@/lib/db/server"
import {
  ErrorStock,
  marcarVendido,
  moverAuto,
  ponerPrecio,
  publicarAuto,
  slugLibre,
  verAuto,
} from "./stock"

const conBase = Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY)
const PREFIJO = `prueba-${Date.now()}`

describe.skipIf(!conBase)("stock contra la base", () => {
  afterAll(async () => {
    await db().from("auto").delete().like("slug", `${PREFIJO}%`)
  })

  async function autoDePrueba(sufijo: string, campos: Record<string, unknown> = {}) {
    const slug = `${PREFIJO}-${sufijo}`
    const { error } = await db()
      .from("auto")
      .insert({ slug, marca: "Toyota", modelo: "Corolla (prueba)", anio: 2019, km: 78000, ...campos })
    if (error) throw error
    return slug
  }

  it("publicar sin precio devuelve un error de validación y el auto queda sin publicar", async () => {
    const slug = await autoDePrueba("sin-precio")
    await expect(publicarAuto(slug)).rejects.toThrow(ErrorStock)
    await expect(publicarAuto(slug)).rejects.toThrow(/Falta el precio/)
    expect((await verAuto(slug)).publicado).toBe(false)
  })

  it("con precio y los datos confirmados, publica", async () => {
    const slug = await autoDePrueba("con-precio")
    await ponerPrecio(slug, 24_500_000)
    expect((await publicarAuto(slug)).publicado).toBe(true)
  })

  it("no publica si falta confirmar un dato que ve el cliente", async () => {
    const slug = await autoDePrueba("sin-anio", { anio: null, precio: 1000 })
    await expect(publicarAuto(slug)).rejects.toThrow(/el año/)
  })

  it("marcar como vendido deja vendido_en y publicado = false en la misma operación", async () => {
    const slug = await autoDePrueba("vendido", { precio: 1000, publicado: true })
    const auto = await marcarVendido(slug)
    expect(auto.vendido_en).not.toBeNull()
    expect(auto.publicado).toBe(false)
  })

  it("el slug se genera único", async () => {
    await autoDePrueba("unico")
    expect(await slugLibre([`${PREFIJO}-unico`])).toBe(`${PREFIJO}-unico-2`)
    expect(await slugLibre([`${PREFIJO}-libre`])).toBe(`${PREFIJO}-libre`)
  })

  it("reordenar no cuenta como actualizar: no reinicia los días sin tocar", async () => {
    // Straight on the row: moverAuto would renumber every published car, the real ones included.
    const slug = await autoDePrueba("orden", { precio: 1000 })
    const antes = (await verAuto(slug)).actualizado_en

    await db().from("auto").update({ orden: 99 }).eq("slug", slug)
    expect((await verAuto(slug)).actualizado_en).toBe(antes)

    await ponerPrecio(slug, 2000)
    expect((await verAuto(slug)).actualizado_en).not.toBe(antes)
  })

  it("solo se ordenan los publicados", async () => {
    const slug = await autoDePrueba("borrador")
    await expect(moverAuto(slug, "subir")).rejects.toThrow(/publicados/)
  })
})
