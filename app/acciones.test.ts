import { beforeEach, describe, expect, it, vi } from "vitest"
import { CONTENIDO } from "@/lib/contenido"
import { mandarPedido, pedirSubidasCliente } from "./acciones"

const { dentroDelLimite, enviarPedido, subidasDeCliente } = vi.hoisted(() => ({
  dentroDelLimite: vi.fn(async () => false),
  enviarPedido: vi.fn(),
  subidasDeCliente: vi.fn(),
}))
vi.mock("next/headers", () => ({ headers: async () => new Headers({ "x-forwarded-for": "181.1.2.3" }) }))
vi.mock("@/lib/limites", async (original) => ({ ...(await original<typeof import("@/lib/limites")>()), dentroDelLimite }))
vi.mock("@/lib/pedido/canal", () => ({ enviarPedido, subidasDeCliente }))

describe("las acciones de la home, pasado el límite", () => {
  beforeEach(() => {
    enviarPedido.mockClear()
    subidasDeCliente.mockClear()
  })

  it("el pedido no se crea y el error dice cuándo probar de nuevo", async () => {
    const resultado = await mandarPedido({ pedido: {}, nombre: "Juan", telefono: "3492 15 123456", chat: "x" })
    expect(resultado).toEqual({ ok: false, error: CONTENIDO.limites.pedido })
    expect(enviarPedido).not.toHaveBeenCalled()
    expect(dentroDelLimite).toHaveBeenCalledWith("pedido", "181.1.2.3")
  })

  it("no se dan links de subida, y el error dice que el pedido sale igual sin fotos", async () => {
    const resultado = await pedirSubidasCliente(2)
    expect(resultado).toEqual({ ok: false, error: CONTENIDO.limites.subidas })
    expect(CONTENIDO.limites.subidas).toMatch(/sin fotos/)
    expect(subidasDeCliente).not.toHaveBeenCalled()
  })
})
