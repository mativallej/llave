import { describe, expect, it, vi } from "vitest"

const { perfil } = vi.hoisted(() => ({ perfil: { valor: null as object | null } }))
vi.mock("./supabase", () => ({
  clienteAuth: async () => ({ auth: { getUser: async () => ({ data: { user: { id: "u1" } } }) } }),
}))
vi.mock("@/lib/db/server", () => ({
  db: () => ({ from: () => ({ select: () => ({ eq: () => ({ maybeSingle: async () => ({ data: perfil.valor }) }) }) }) }),
}))

describe("rolActual", () => {
  it("una sesión con un perfil suspendido no tiene acceso; la misma sin suspender, sí", async () => {
    perfil.valor = { id: "u1", nombre: "Abelardo", rol: "vendedor", suspendido_en: "2026-10-23T20:00:00Z" }
    const { rolActual } = await import("./rol")
    expect(await rolActual()).toBeNull()

    vi.resetModules()
    perfil.valor = { id: "u1", nombre: "Abelardo", rol: "vendedor", suspendido_en: null }
    const { rolActual: otraVez } = await import("./rol")
    expect(await otraVez()).toEqual({ id: "u1", nombre: "Abelardo", rol: "vendedor" })
  })
})
