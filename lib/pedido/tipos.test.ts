import { describe, expect, it } from "vitest"
import { faltaParaResumen, PEDIDO_VACIO } from "./tipos"

describe("faltaParaResumen, lo que mostrar_resumen exige", () => {
  it("sin saber si entrega un auto ni qué se lleva, falta todo", () => {
    expect(faltaParaResumen(PEDIDO_VACIO)).toEqual(["saber si entrega un auto", "saber qué se lleva"])
  })

  it("sabiendo que entrega pero no qué se lleva, falta eso", () => {
    expect(faltaParaResumen({ ...PEDIDO_VACIO, entrega: true })).toEqual(["saber qué se lleva"])
  })

  it("con lo que se lleva por cualquiera de los tres caminos, está listo", () => {
    for (const pedido of [
      { ...PEDIDO_VACIO, entrega: false, salida: "0km" as const },
      { ...PEDIDO_VACIO, entrega: true, busca: "una pickup" },
      { ...PEDIDO_VACIO, entrega: true, autos_elegidos: ["toyota-corolla-xei-2019-ejemplo"] },
    ]) {
      expect(faltaParaResumen(pedido)).toEqual([])
    }
  })
})
