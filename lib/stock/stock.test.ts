import { describe, expect, it } from "vitest"
import { diasDesde, faltantesDe, nombreAuto, slugBase } from "./stock"

describe("stock, lógica pura", () => {
  it("el slug sale de marca, modelo, versión y año, sin acentos ni símbolos", () => {
    expect(slugBase(["Citroën", "C4 Cactus", "Feel Pack", 2021])).toBe("citroen-c4-cactus-feel-pack-2021")
    expect(slugBase([null, null, null, null])).toBe("auto")
  })

  it("faltan los campos de la ficha que están en null; una versión vacía no falta", () => {
    expect(faltantesDe({ marca: "Toyota", modelo: "Corolla", version: null, anio: null, km: 78000 })).toEqual([
      "version",
      "anio",
    ])
    expect(faltantesDe({ marca: "Fiat", modelo: "Cronos", version: "", anio: 2021, km: 1 })).toEqual([])
  })

  it("cuenta días enteros desde la última actualización", () => {
    const ahora = new Date("2026-10-23T12:00:00Z")
    expect(diasDesde("2026-10-08T12:00:00Z", ahora)).toBe(15)
    expect(diasDesde("2026-10-23T08:00:00Z", ahora)).toBe(0)
  })

  it("nombra el auto con lo que se sabe", () => {
    expect(nombreAuto({ marca: "Toyota", modelo: "Corolla", version: "XEI", anio: 2019 })).toBe("Toyota Corolla XEI 2019")
    expect(nombreAuto({ marca: null, modelo: null, version: null, anio: null })).toBe("Auto sin datos todavía")
  })
})
