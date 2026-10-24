import { describe, expect, it, vi } from "vitest"
import { entrar } from "./acciones"

const { dentroDelLimite, clienteAuth } = vi.hoisted(() => ({
  dentroDelLimite: vi.fn(async () => false),
  clienteAuth: vi.fn(),
}))
vi.mock("next/headers", () => ({ headers: async () => new Headers({ "x-forwarded-for": "181.1.2.3" }) }))
vi.mock("next/navigation", () => ({ redirect: vi.fn() }))
vi.mock("@/lib/limites", async (original) => ({ ...(await original<typeof import("@/lib/limites")>()), dentroDelLimite }))
vi.mock("@/lib/auth/supabase", () => ({ clienteAuth }))

describe("el login, pasado el límite", () => {
  it("no le pregunta a Supabase y dice cuándo probar de nuevo", async () => {
    const datos = new FormData()
    datos.set("email", "alguien@llave.test")
    datos.set("password", "cualquiera")
    expect(await entrar(null, datos)).toEqual({ error: "Demasiados intentos desde esta conexión. Probá de nuevo dentro de 15 minutos." })
    expect(clienteAuth).not.toHaveBeenCalled()
    expect(dentroDelLimite).toHaveBeenCalledWith("login", "181.1.2.3")
  })
})
