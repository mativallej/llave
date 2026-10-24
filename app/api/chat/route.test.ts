import { beforeEach, describe, expect, it, vi } from "vitest"
import { CONTENIDO } from "@/lib/contenido"
import type { Limite } from "@/lib/limites"
import { POST } from "./route"

const { pasados, turno, dentroDelLimite } = vi.hoisted(() => {
  const pasados = new Set<string>()
  return {
    pasados,
    turno: vi.fn(),
    dentroDelLimite: vi.fn(async (limite: string) => !pasados.has(limite)),
  }
})
vi.mock("@/lib/limites", async (original) => ({ ...(await original<typeof import("@/lib/limites")>()), dentroDelLimite }))
vi.mock("@/lib/agente/tuerca", () => ({ turno }))
vi.mock("@/lib/db/eventos", () => ({ registrar: vi.fn(async () => {}) }))
vi.mock("@/lib/pedido/canal", () => ({ stockCanal: vi.fn(async () => []) }))
vi.mock("@/lib/stock/stock", () => ({ urlsFirmadas: vi.fn(async () => ({})) }))

const pedido = () =>
  new Request("http://localhost/api/chat", {
    method: "POST",
    headers: { "content-type": "application/json", "x-forwarded-for": "181.1.2.3" },
    body: JSON.stringify({ basura: true }),
  })

describe("/api/chat con límites", () => {
  beforeEach(() => {
    pasados.clear()
    turno.mockClear()
    dentroDelLimite.mockClear()
  })

  it("pasado el límite por conexión: 429 con el mensaje de Tuerca, sin llamar al modelo", async () => {
    pasados.add("chat" satisfies Limite)
    const respuesta = await POST(pedido())
    expect(respuesta.status).toBe(429)
    expect(await respuesta.json()).toEqual({ error: CONTENIDO.limites.chat })
    expect(turno).not.toHaveBeenCalled()
    expect(dentroDelLimite).toHaveBeenCalledWith("chat", "181.1.2.3")
  })

  it("pasado el techo total, el mensaje lo dice", async () => {
    pasados.add("chatTotal" satisfies Limite)
    const respuesta = await POST(pedido())
    expect(respuesta.status).toBe(429)
    expect(await respuesta.json()).toEqual({ error: CONTENIDO.limites.chatTotal })
  })

  it("pasado el máximo del día, dice que mañana", async () => {
    pasados.add("chatDia" satisfies Limite)
    expect(await (await POST(pedido())).json()).toEqual({ error: CONTENIDO.limites.chatDia })
  })

  it("dentro del límite, un pedido mal formado cuenta igual y sigue siendo 400", async () => {
    const respuesta = await POST(pedido())
    expect(respuesta.status).toBe(400)
    expect(dentroDelLimite).toHaveBeenCalledTimes(3)
    expect(turno).not.toHaveBeenCalled()
  })
})
