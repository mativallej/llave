import { describe, expect, it } from "vitest"
import { leerConfig } from "./config"

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
