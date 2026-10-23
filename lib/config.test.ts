import { describe, expect, it } from "vitest"
import { leerConfig, plazoParaMostrar } from "./config"

const conBase = Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY)

describe("leerConfig", () => {
  it("una clave que no existe no compila", () => {
    // Never called: tsc is what checks this line. An unused @ts-expect-error fails the typecheck.
    const noCompila = () => {
      // @ts-expect-error: not a config key
      void leerConfig("clave_inventada")
    }
    expect(noCompila).toBeTypeOf("function")
  })

  it.skipIf(!conBase)("las garantías de Falkenberg arrancan apagadas", async () => {
    await expect(leerConfig("garantias_falkenberg")).resolves.toBe(false)
  })
})

describe("el plazo de contacto", () => {
  const PLAZO = "Lo hace dentro de las 48 horas hábiles."

  it("con las garantías de Falkenberg apagadas no sale: las 48 horas son una de las cinco", () => {
    expect(plazoParaMostrar(false, PLAZO)).toBe("")
  })

  it("con las garantías prendidas sale tal como está en config", () => {
    expect(plazoParaMostrar(true, PLAZO)).toBe(PLAZO)
  })
})

describe.skipIf(!conBase)("las citas por semana", () => {
  it("salen de config como número: 15 de inicio", async () => {
    await expect(leerConfig("citas_por_semana")).resolves.toBe(15)
  })
})
