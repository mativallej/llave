import { describe, expect, it } from "vitest"
import { normalizarTelefono } from "./telefono"

describe("normalizarTelefono", () => {
  it("lleva cualquier forma de escribir un celular argentino al mismo número", () => {
    const rafaela = "+5493492123456"
    for (const forma of [
      "3492 15 123456",
      "3492-15-123456",
      "(03492) 15-123456",
      "3492123456",
      "+54 9 3492 123456",
      "+54 3492 15 123456",
      "549 3492 123456",
      "0054 9 3492 123456",
    ]) {
      expect(normalizarTelefono(forma), forma).toBe(rafaela)
    }
  })

  it("respeta características de 2 y 3 cifras", () => {
    expect(normalizarTelefono("11 15 2345 6789")).toBe("+5491123456789")
    expect(normalizarTelefono("0341 15 555 1234")).toBe("+5493415551234")
  })

  it("sin característica no adivina: devuelve null", () => {
    expect(normalizarTelefono("15 123456")).toBeNull()
    expect(normalizarTelefono("123456")).toBeNull()
    expect(normalizarTelefono("")).toBeNull()
  })
})
