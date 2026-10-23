import { beforeEach, describe, expect, it, vi } from "vitest"
import { POST } from "./route"

const { db } = vi.hoisted(() => ({
  db: vi.fn(() => {
    throw new Error("tocó la base")
  }),
}))
vi.mock("@/lib/db/server", () => ({ db }))

const { dentroDelLimite } = vi.hoisted(() => ({ dentroDelLimite: vi.fn(async () => true) }))
vi.mock("@/lib/limites", async (original) => ({ ...(await original<typeof import("@/lib/limites")>()), dentroDelLimite }))

function pedido(encabezados: Record<string, string> = {}) {
  return new Request("http://localhost/api/mcp", {
    method: "POST",
    headers: { "content-type": "application/json", accept: "application/json, text/event-stream", ...encabezados },
    body: JSON.stringify({ jsonrpc: "2.0", id: 1, method: "tools/list" }),
  })
}

describe("/api/mcp sin token válido", () => {
  beforeEach(() => {
    db.mockClear()
    dentroDelLimite.mockClear()
  })

  it("sin token devuelve error y no toca la base", async () => {
    const respuesta = await POST(pedido())
    expect(respuesta.status).toBe(401)
    expect((await respuesta.json()).error.message).toMatch(/token de operador/)
    expect(db).not.toHaveBeenCalled()
  })

  it("con un token mal formado tampoco llega a la base, ni cuenta para el límite", async () => {
    const respuesta = await POST(pedido({ authorization: "Bearer corto" }))
    expect(respuesta.status).toBe(401)
    expect(db).not.toHaveBeenCalled()
    expect(dentroDelLimite).not.toHaveBeenCalled()
  })

  it("un token bien formado que no es de nadie cuenta, y pasado el límite recibe 429", async () => {
    const ningunOperador = { from: () => ({ select: () => ({ eq: () => ({ maybeSingle: async () => ({ data: null, error: null }) }) }) }) }
    db.mockImplementation(() => ningunOperador as never)
    const token = { authorization: `Bearer ${"x".repeat(43)}`, "x-forwarded-for": "181.1.2.3" }

    expect((await POST(pedido(token))).status).toBe(401)
    dentroDelLimite.mockResolvedValueOnce(false)
    const respuesta = await POST(pedido(token))
    expect(respuesta.status).toBe(429)
    expect((await respuesta.json()).error.message).toMatch(/Demasiados intentos/)
    expect(dentroDelLimite).toHaveBeenCalledWith("mcpSinToken", "181.1.2.3")
  })
})
