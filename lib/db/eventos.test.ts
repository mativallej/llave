import { describe, expect, it } from "vitest"
import { registrar, TIPOS_EVENTO } from "./eventos"

describe("eventos", () => {
  it("son los nueve tipos del embudo", () => {
    expect(TIPOS_EVENTO).toHaveLength(9)
  })

  it("un tipo inválido no compila", () => {
    // Never called: tsc is what checks these lines. An unused @ts-expect-error fails the typecheck.
    const noCompila = () => {
      // @ts-expect-error: not an event type
      void registrar("tipo_inventado", "caso")
      // @ts-expect-error: caso_perdido must say whether it was our silence
      void registrar("caso_perdido", "caso")
      // @ts-expect-error: only chat_iniciado happens before there is a case
      void registrar("pedido_enviado", null)
    }
    expect(noCompila).toBeTypeOf("function")
  })
})
