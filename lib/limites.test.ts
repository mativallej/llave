import { beforeEach, describe, expect, it, vi } from "vitest"
import { claveDe, dentroDelLimite, ipDe } from "./limites"

const { rpc } = vi.hoisted(() => ({ rpc: vi.fn() }))
vi.mock("@/lib/db/server", () => ({ db: () => ({ rpc }) }))

describe("la conexión", () => {
  it("la IP es la primera de x-forwarded-for, o x-real-ip, o ninguna", () => {
    expect(ipDe(new Headers({ "x-forwarded-for": "181.1.2.3, 10.0.0.1" }))).toBe("181.1.2.3")
    expect(ipDe(new Headers({ "x-real-ip": "181.1.2.4" }))).toBe("181.1.2.4")
    expect(ipDe(new Headers())).toBeNull()
  })

  it("la clave no contiene la IP: es un hash, igual para la misma IP y distinto por límite", () => {
    const clave = claveDe("chat", "181.1.2.3")
    expect(clave).not.toContain("181.1.2.3")
    expect(clave).toMatch(/^chat:[0-9a-f]{32}$/)
    expect(claveDe("chat", "181.1.2.3")).toBe(clave)
    expect(claveDe("pedido", "181.1.2.3")).not.toBe(clave)
    expect(claveDe("pedido", "181.1.2.3").split(":")[1]).toBe(clave.split(":")[1])
    expect(claveDe("chatTotal", "181.1.2.3")).toBe("chatTotal")
  })
})

describe("el chequeo", () => {
  beforeEach(() => {
    rpc.mockReset()
    vi.spyOn(console, "error").mockImplementation(() => {})
  })

  it("dice lo que dice la base", async () => {
    rpc.mockResolvedValueOnce({ data: true, error: null })
    expect(await dentroDelLimite("pedido", "181.1.2.3")).toBe(true)
    rpc.mockResolvedValueOnce({ data: false, error: null })
    expect(await dentroDelLimite("pedido", "181.1.2.3")).toBe(false)
    expect(rpc).toHaveBeenCalledWith("contar_uso", { p_clave: claveDe("pedido", "181.1.2.3"), p_segundos: 3600, p_maximo: 10 })
  })

  it("si la base devuelve un error o no responde, el pedido pasa y queda en el log", async () => {
    rpc.mockResolvedValueOnce({ data: null, error: { message: "se cayó" } })
    expect(await dentroDelLimite("chat", "181.1.2.3")).toBe(true)
    rpc.mockRejectedValueOnce(new Error("sin red"))
    expect(await dentroDelLimite("chat", "181.1.2.3")).toBe(true)
    expect(console.error).toHaveBeenCalledTimes(2)
  })
})
