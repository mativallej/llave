import { APIConnectionTimeoutError } from "openai"
import { describe, expect, it, vi } from "vitest"
import { ErrorFicha, extraerFicha, SE_DEMORO } from "./ficha"

const { parse } = vi.hoisted(() => ({ parse: vi.fn() }))
vi.mock("./cliente", () => ({ CONFIG_BASE: {}, openai: () => ({ responses: { parse } }) }))

describe("la ficha cuando el modelo tarda", () => {
  it("se corta antes de los 60 segundos del cliente del MCP y dice que el auto no se cargó", async () => {
    parse.mockRejectedValueOnce(new APIConnectionTimeoutError())
    const intento = extraerFicha("Entró un Corolla XEI 2019 con 78 mil", [])
    await expect(intento).rejects.toBeInstanceOf(ErrorFicha)
    await expect(intento).rejects.toThrow(SE_DEMORO)
    // Two tries of 20 seconds: 40 plus the wait between them, under 60.
    expect(parse).toHaveBeenCalledWith(expect.anything(), { timeout: 20_000, maxRetries: 1 })
  })

  it("cualquier otro error sigue siendo un error del servidor", async () => {
    parse.mockRejectedValueOnce(new Error("otra cosa"))
    const intento = extraerFicha("Entró un Corolla", [])
    await expect(intento).rejects.not.toBeInstanceOf(ErrorFicha)
  })
})
