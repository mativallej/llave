import { beforeEach, describe, expect, it, vi } from "vitest"
import { POST } from "./route"

const { db } = vi.hoisted(() => ({
  db: vi.fn(() => {
    throw new Error("tocó la base")
  }),
}))
vi.mock("@/lib/db/server", () => ({ db }))

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
  })

  it("sin token devuelve error y no toca la base", async () => {
    const respuesta = await POST(pedido())
    expect(respuesta.status).toBe(401)
    expect((await respuesta.json()).error.message).toMatch(/token de operador/)
    expect(db).not.toHaveBeenCalled()
  })

  it("con un token mal formado tampoco llega a la base", async () => {
    const respuesta = await POST(pedido({ authorization: "Bearer corto" }))
    expect(respuesta.status).toBe(401)
    expect(db).not.toHaveBeenCalled()
  })
})
