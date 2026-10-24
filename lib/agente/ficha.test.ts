import { describe, expect, it } from "vitest"
import { extraerFicha } from "./ficha"

const conOpenAI = Boolean(process.env.OPENAI_API_KEY)

describe.skipIf(!conOpenAI)("extraerFicha contra el modelo", () => {
  it("con una línea completa puebla marca, modelo, versión, año y km, y nunca el precio", async () => {
    const ficha = await extraerFicha("Entró un Corolla XEI 2019 con 78 mil", [])

    expect(ficha.marca).toMatch(/toyota/i)
    expect(ficha.modelo).toMatch(/corolla/i)
    expect(ficha.version).toMatch(/xei/i)
    expect(ficha.anio).toBe(2019)
    expect(ficha.km).toBe(78000)
    expect(ficha.faltantes).toEqual([])
    expect(ficha).not.toHaveProperty("precio")
  }, 60_000)

  it("si la línea no dice el año, no lo inventa: queda en faltantes", async () => {
    const ficha = await extraerFicha("Entró un Corolla XEI con 78 mil", [])

    expect(ficha.anio).toBeNull()
    expect(ficha.faltantes).toContain("anio")
    expect(ficha.km).toBe(78000)
  }, 60_000)
})
